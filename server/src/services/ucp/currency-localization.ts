/**
 * Currency Localization Service
 *
 * Detects user's location from IP address and returns appropriate currency.
 * Uses a free IP geolocation API with fallback to USD.
 */

// Country to currency mapping (ISO 3166-1 alpha-2 to ISO 4217)
const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  // Eurozone countries
  AT: 'EUR', BE: 'EUR', CY: 'EUR', EE: 'EUR', FI: 'EUR', FR: 'EUR',
  DE: 'EUR', GR: 'EUR', IE: 'EUR', IT: 'EUR', LV: 'EUR', LT: 'EUR',
  LU: 'EUR', MT: 'EUR', NL: 'EUR', PT: 'EUR', SK: 'EUR', SI: 'EUR',
  ES: 'EUR', HR: 'EUR',

  // Other European
  GB: 'GBP', CH: 'CHF', NO: 'NOK', SE: 'SEK', DK: 'DKK', PL: 'PLN',
  CZ: 'CZK', HU: 'HUF', RO: 'RON', BG: 'BGN',

  // Americas
  US: 'USD', CA: 'CAD', MX: 'MXN', BR: 'BRL', AR: 'ARS',

  // Asia Pacific
  JP: 'JPY', CN: 'CNY', KR: 'KRW', IN: 'INR', AU: 'AUD', NZ: 'NZD',
  SG: 'SGD', HK: 'HKD', TW: 'TWD', TH: 'THB', MY: 'MYR', ID: 'IDR',
  PH: 'PHP', VN: 'VND',

  // Middle East & Africa
  AE: 'AED', SA: 'SAR', IL: 'ILS', ZA: 'ZAR', NG: 'NGN', EG: 'EGP',

  // Default
  XX: 'USD',
};

// Currency symbols and formatting
export const CURRENCY_CONFIG: Record<string, { symbol: string; position: 'before' | 'after'; decimals: number }> = {
  USD: { symbol: '$', position: 'before', decimals: 2 },
  EUR: { symbol: '€', position: 'after', decimals: 2 },
  GBP: { symbol: '£', position: 'before', decimals: 2 },
  JPY: { symbol: '¥', position: 'before', decimals: 0 },
  CNY: { symbol: '¥', position: 'before', decimals: 2 },
  CAD: { symbol: 'CA$', position: 'before', decimals: 2 },
  AUD: { symbol: 'A$', position: 'before', decimals: 2 },
  CHF: { symbol: 'CHF', position: 'before', decimals: 2 },
  INR: { symbol: '₹', position: 'before', decimals: 2 },
  KRW: { symbol: '₩', position: 'before', decimals: 0 },
  BRL: { symbol: 'R$', position: 'before', decimals: 2 },
  MXN: { symbol: 'MX$', position: 'before', decimals: 2 },
  SGD: { symbol: 'S$', position: 'before', decimals: 2 },
  HKD: { symbol: 'HK$', position: 'before', decimals: 2 },
  SEK: { symbol: 'kr', position: 'after', decimals: 2 },
  NOK: { symbol: 'kr', position: 'after', decimals: 2 },
  DKK: { symbol: 'kr', position: 'after', decimals: 2 },
  PLN: { symbol: 'zł', position: 'after', decimals: 2 },
  CZK: { symbol: 'Kč', position: 'after', decimals: 2 },
  // Add more as needed
};

// Exchange rates (approximate, for demo purposes - use a real API in production)
const EXCHANGE_RATES_FROM_USD: Record<string, number> = {
  USD: 1.00,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.50,
  CNY: 7.24,
  CAD: 1.36,
  AUD: 1.53,
  CHF: 0.88,
  INR: 83.12,
  KRW: 1320.00,
  BRL: 4.97,
  MXN: 17.15,
  SGD: 1.34,
  HKD: 7.82,
  SEK: 10.42,
  NOK: 10.58,
  DKK: 6.87,
  PLN: 3.98,
  CZK: 22.85,
};

interface GeoIPResponse {
  country_code?: string;
  country?: string;
  error?: boolean;
}

// Cache for IP lookups (5 minute TTL)
const geoCache = new Map<string, { country: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get country code from IP address using free geo-IP service
 */
export async function getCountryFromIP(ip: string): Promise<string> {
  // Check cache first
  const cached = geoCache.get(ip);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.country;
  }

  // Handle localhost/private IPs - default to US
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    return 'US';
  }

  try {
    // Use ip-api.com (free, no API key required, 45 requests/minute limit)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`, {
      signal: AbortSignal.timeout(2000), // 2 second timeout
    });

    if (!response.ok) {
      console.warn(`[Currency] GeoIP lookup failed: ${response.status}`);
      return 'US';
    }

    const data = await response.json() as { countryCode?: string };
    const country = data.countryCode || 'US';

    // Cache the result
    geoCache.set(ip, { country, timestamp: Date.now() });

    return country;
  } catch (error) {
    console.warn('[Currency] GeoIP lookup error:', error);
    return 'US'; // Default to USD
  }
}

/**
 * Get currency code for a country
 */
export function getCurrencyForCountry(countryCode: string): string {
  return COUNTRY_CURRENCY_MAP[countryCode] || 'USD';
}

/**
 * Get currency from IP address
 */
export async function getCurrencyFromIP(ip: string): Promise<string> {
  const country = await getCountryFromIP(ip);
  return getCurrencyForCountry(country);
}

/**
 * Convert amount from USD to target currency
 */
export function convertCurrency(amountUSD: number, targetCurrency: string): number {
  const rate = EXCHANGE_RATES_FROM_USD[targetCurrency] || 1;
  return amountUSD * rate;
}

/**
 * Format money with proper currency symbol and locale
 */
export function formatMoney(amount: number, currency: string): string {
  const config = CURRENCY_CONFIG[currency] || { symbol: currency, position: 'before', decimals: 2 };

  const formattedAmount = amount.toFixed(config.decimals);

  if (config.position === 'before') {
    return `${config.symbol}${formattedAmount}`;
  } else {
    return `${formattedAmount} ${config.symbol}`;
  }
}

/**
 * Get currency info for a session
 */
export interface CurrencyInfo {
  currency: string;
  symbol: string;
  exchangeRate: number;
  country: string;
}

export async function getCurrencyInfo(ip: string): Promise<CurrencyInfo> {
  const country = await getCountryFromIP(ip);
  const currency = getCurrencyForCountry(country);
  const config = CURRENCY_CONFIG[currency] || { symbol: currency, position: 'before', decimals: 2 };
  const exchangeRate = EXCHANGE_RATES_FROM_USD[currency] || 1;

  return {
    currency,
    symbol: config.symbol,
    exchangeRate,
    country,
  };
}

/**
 * Convert all money fields in a checkout/product to target currency
 */
export function convertPriceToLocalCurrency(
  priceUSD: { amount: string; currency: string },
  targetCurrency: string
): { amount: string; currency: string } {
  if (priceUSD.currency === targetCurrency) {
    return priceUSD;
  }

  const amountNum = parseFloat(priceUSD.amount);
  const convertedAmount = convertCurrency(amountNum, targetCurrency);
  const config = CURRENCY_CONFIG[targetCurrency] || { decimals: 2 };

  return {
    amount: convertedAmount.toFixed(config.decimals),
    currency: targetCurrency,
  };
}
