/**
 * Persisted Cart Hook
 *
 * Manages cart state persistence using localStorage.
 * Automatically saves and restores cart data across sessions.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import type { Checkout } from '@/services/a2a/CommerceService';

// ============================================================================
// Types
// ============================================================================

interface PersistedCartData {
  contextId: string;
  checkout: Checkout | null;
  lastUpdated: string;
}

interface UsePersistedCartOptions {
  storageKey?: string;
  expirationHours?: number;
}

interface UsePersistedCartReturn {
  contextId: string;
  checkout: Checkout | null;
  setCheckout: (checkout: Checkout | null) => void;
  clearCart: () => void;
  isRestored: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_STORAGE_KEY = 'ucp-cart';
const DEFAULT_EXPIRATION_HOURS = 24;

// ============================================================================
// Helper Functions
// ============================================================================

function generateContextId(): string {
  return `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function isExpired(lastUpdated: string, expirationHours: number): boolean {
  const lastUpdate = new Date(lastUpdated);
  const now = new Date();
  const hoursDiff = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
  return hoursDiff > expirationHours;
}

function loadFromStorage(
  key: string,
  expirationHours: number
): PersistedCartData | null {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const data: PersistedCartData = JSON.parse(stored);

    // Check if expired
    if (isExpired(data.lastUpdated, expirationHours)) {
      localStorage.removeItem(key);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error loading cart from storage:', error);
    return null;
  }
}

function saveToStorage(key: string, data: PersistedCartData): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving cart to storage:', error);
  }
}

// ============================================================================
// Hook
// ============================================================================

export function usePersistedCart(
  options: UsePersistedCartOptions = {}
): UsePersistedCartReturn {
  const {
    storageKey = DEFAULT_STORAGE_KEY,
    expirationHours = DEFAULT_EXPIRATION_HOURS,
  } = options;

  const [isRestored, setIsRestored] = useState(false);
  const [contextId, setContextId] = useState<string>('');
  const [checkout, setCheckoutState] = useState<Checkout | null>(null);

  // Track if we've initialized
  const initializedRef = useRef(false);

  // Initialize from storage on mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const stored = loadFromStorage(storageKey, expirationHours);

    if (stored) {
      setContextId(stored.contextId);
      setCheckoutState(stored.checkout);
    } else {
      setContextId(generateContextId());
    }

    setIsRestored(true);
  }, [storageKey, expirationHours]);

  // Save to storage whenever checkout changes
  const setCheckout = useCallback(
    (newCheckout: Checkout | null) => {
      setCheckoutState(newCheckout);

      // Only save if we have a contextId
      if (contextId) {
        const data: PersistedCartData = {
          contextId,
          checkout: newCheckout,
          lastUpdated: new Date().toISOString(),
        };
        saveToStorage(storageKey, data);
      }
    },
    [contextId, storageKey]
  );

  // Clear cart and generate new context
  const clearCart = useCallback(() => {
    localStorage.removeItem(storageKey);
    setContextId(generateContextId());
    setCheckoutState(null);
  }, [storageKey]);

  return {
    contextId,
    checkout,
    setCheckout,
    clearCart,
    isRestored,
  };
}

// ============================================================================
// Additional Utilities
// ============================================================================

/**
 * Get cart item count from localStorage without the full hook
 * Useful for showing cart badge in header before full app loads
 */
export function getStoredCartItemCount(
  storageKey: string = DEFAULT_STORAGE_KEY
): number {
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return 0;

    const data: PersistedCartData = JSON.parse(stored);
    return data.checkout?.item_count || 0;
  } catch {
    return 0;
  }
}

/**
 * Check if there's a stored cart
 */
export function hasStoredCart(
  storageKey: string = DEFAULT_STORAGE_KEY
): boolean {
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return false;

    const data: PersistedCartData = JSON.parse(stored);
    return !isExpired(data.lastUpdated, DEFAULT_EXPIRATION_HOURS);
  } catch {
    return false;
  }
}

export default usePersistedCart;
