/**
 * Currency Localization Hook
 *
 * Fetches and provides currency info based on user's IP location.
 * Includes formatting utilities for displaying prices.
 */

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';

export interface CurrencyConfig {
  symbol: string;
  position: 'before' | 'after';
  decimals: number;
}

export interface CurrencyInfo {
  currency: string;
  symbol: string;
  exchangeRate: number;
  country: string;
  config: CurrencyConfig;
}

interface CurrencyContextValue {
  currencyInfo: CurrencyInfo | null;
  isLoading: boolean;
  error: string | null;
  formatPrice: (amountUSD: number | string) => string;
  formatMoney: (amount: number | string, currency?: string) => string;
  convertFromUSD: (amountUSD: number) => number;
}

const DEFAULT_CURRENCY: CurrencyInfo = {
  currency: 'USD',
  symbol: '$',
  exchangeRate: 1,
  country: 'US',
  config: { symbol: '$', position: 'before', decimals: 2 },
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const getBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || '';
};

/**
 * Currency Provider Component
 */
export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currencyInfo, setCurrencyInfo] = useState<CurrencyInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrency = async () => {
      try {
        const response = await fetch(`${getBaseUrl()}/api/ucp/currency`);
        if (!response.ok) {
          throw new Error('Failed to fetch currency info');
        }
        const data = await response.json();
        if (data.success) {
          setCurrencyInfo({
            currency: data.currency,
            symbol: data.symbol,
            exchangeRate: data.exchangeRate,
            country: data.country,
            config: data.config,
          });
        } else {
          setCurrencyInfo(DEFAULT_CURRENCY);
        }
      } catch (err) {
        console.warn('[Currency] Failed to fetch, using USD:', err);
        setCurrencyInfo(DEFAULT_CURRENCY);
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrency();
  }, []);

  const convertFromUSD = useCallback((amountUSD: number): number => {
    if (!currencyInfo) return amountUSD;
    return amountUSD * currencyInfo.exchangeRate;
  }, [currencyInfo]);

  const formatMoney = useCallback((amount: number | string, currency?: string): string => {
    const info = currencyInfo || DEFAULT_CURRENCY;
    const targetCurrency = currency || info.currency;
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    // If already in target currency, just format
    // If in USD and target is different, convert
    const finalAmount = (currency === 'USD' && targetCurrency !== 'USD')
      ? numAmount * info.exchangeRate
      : numAmount;

    const config = info.config;
    const formatted = finalAmount.toFixed(config.decimals);

    if (config.position === 'before') {
      return `${config.symbol}${formatted}`;
    } else {
      return `${formatted} ${config.symbol}`;
    }
  }, [currencyInfo]);

  const formatPrice = useCallback((amountUSD: number | string): string => {
    const numAmount = typeof amountUSD === 'string' ? parseFloat(amountUSD) : amountUSD;
    const info = currencyInfo || DEFAULT_CURRENCY;

    // Convert from USD to local currency
    const localAmount = numAmount * info.exchangeRate;
    const config = info.config;
    const formatted = localAmount.toFixed(config.decimals);

    if (config.position === 'before') {
      return `${config.symbol}${formatted}`;
    } else {
      return `${formatted} ${config.symbol}`;
    }
  }, [currencyInfo]);

  const value: CurrencyContextValue = {
    currencyInfo,
    isLoading,
    error,
    formatPrice,
    formatMoney,
    convertFromUSD,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

/**
 * Hook to access currency context
 */
export function useCurrency(): CurrencyContextValue {
  const context = useContext(CurrencyContext);
  if (!context) {
    // Return a fallback if used outside provider (shouldn't happen, but safe default)
    return {
      currencyInfo: DEFAULT_CURRENCY,
      isLoading: false,
      error: null,
      formatPrice: (amount) => `$${typeof amount === 'string' ? amount : amount.toFixed(2)}`,
      formatMoney: (amount) => `$${typeof amount === 'string' ? amount : amount.toFixed(2)}`,
      convertFromUSD: (amount) => amount,
    };
  }
  return context;
}

export default useCurrency;
