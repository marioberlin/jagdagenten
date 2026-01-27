/**
 * useInventoryWebSocket Hook
 *
 * Real-time inventory updates for the shopping assistant.
 * Receives stock level changes, price updates, and product availability.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { Product } from '@/services/a2a/CommerceService';

// ============================================================================
// Types
// ============================================================================

export interface InventoryUpdate {
  type: 'stock_update' | 'price_update' | 'product_available' | 'product_unavailable';
  productId: string;
  data: {
    quantity?: number;
    in_stock?: boolean;
    price?: { amount: string; currency: string };
    compare_at_price?: { amount: string; currency: string } | null;
    timestamp: string;
  };
}

export interface InventoryState {
  isConnected: boolean;
  lastUpdate: Date | null;
  updates: Map<string, InventoryUpdate>;
}

interface UseInventoryWebSocketOptions {
  /** Auto-reconnect on disconnect */
  autoReconnect?: boolean;
  /** Reconnect interval in ms */
  reconnectInterval?: number;
  /** Max reconnection attempts */
  maxReconnectAttempts?: number;
  /** Callback when inventory update received */
  onUpdate?: (update: InventoryUpdate) => void;
}

// ============================================================================
// Hook
// ============================================================================

export function useInventoryWebSocket(
  sessionId: string | null,
  options: UseInventoryWebSocketOptions = {}
) {
  const {
    autoReconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    onUpdate,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const [state, setState] = useState<InventoryState>({
    isConnected: false,
    lastUpdate: null,
    updates: new Map(),
  });

  const connect = useCallback(() => {
    if (!sessionId) return;

    // Don't reconnect if we've hit the limit
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.warn('[Inventory WS] Max reconnection attempts reached');
      return;
    }

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    // Determine WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/inventory`;

    console.log('[Inventory WS] Connecting to', wsUrl);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[Inventory WS] Connected');
      setState(prev => ({ ...prev, isConnected: true }));
      reconnectAttemptsRef.current = 0;

      // Subscribe to inventory updates
      ws.send(JSON.stringify({
        type: 'subscribe',
        channel: 'inventory',
        sessionId,
      }));
    };

    ws.onmessage = (event) => {
      try {
        const update = JSON.parse(event.data) as InventoryUpdate;

        setState(prev => {
          const newUpdates = new Map(prev.updates);
          newUpdates.set(update.productId, update);
          return {
            ...prev,
            lastUpdate: new Date(),
            updates: newUpdates,
          };
        });

        // Call the update callback
        onUpdateRef.current?.(update);
      } catch (e) {
        console.error('[Inventory WS] Failed to parse message:', e);
      }
    };

    ws.onerror = (error) => {
      console.error('[Inventory WS] WebSocket error:', error);
    };

    ws.onclose = (event) => {
      console.log('[Inventory WS] Disconnected:', event.code, event.reason);
      setState(prev => ({ ...prev, isConnected: false }));

      // Auto-reconnect if enabled
      if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current++;
        console.log(`[Inventory WS] Reconnecting in ${reconnectInterval}ms (attempt ${reconnectAttemptsRef.current})`);

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, reconnectInterval);
      }
    };
  }, [sessionId, autoReconnect, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setState(prev => ({ ...prev, isConnected: false }));
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    if (sessionId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [sessionId, connect, disconnect]);

  // Helper to get latest inventory for a product
  const getProductInventory = useCallback((productId: string) => {
    return state.updates.get(productId);
  }, [state.updates]);

  // Helper to apply updates to a product
  const applyUpdates = useCallback((product: Product): Product => {
    const update = state.updates.get(product.id);
    if (!update) return product;

    const updated = { ...product };

    if (update.data.quantity !== undefined) {
      updated.inventory = {
        ...updated.inventory,
        quantity: update.data.quantity,
        in_stock: update.data.quantity > 0,
      };
    }

    if (update.data.in_stock !== undefined) {
      updated.inventory = {
        ...updated.inventory,
        in_stock: update.data.in_stock,
      };
    }

    if (update.data.price) {
      updated.price = update.data.price;
    }

    if (update.data.compare_at_price !== undefined) {
      updated.compare_at_price = update.data.compare_at_price ?? undefined;
    }

    return updated;
  }, [state.updates]);

  // Helper to apply updates to multiple products
  const applyUpdatesToProducts = useCallback((products: Product[]): Product[] => {
    return products.map(applyUpdates);
  }, [applyUpdates]);

  return {
    ...state,
    connect,
    disconnect,
    getProductInventory,
    applyUpdates,
    applyUpdatesToProducts,
  };
}

// ============================================================================
// Simulated Updates (for demo purposes)
// ============================================================================

/**
 * Simulates inventory updates for demo purposes.
 * Call this to generate fake WebSocket-style updates.
 */
export function useSimulatedInventoryUpdates(
  products: Product[],
  onUpdate: (updates: Map<string, InventoryUpdate>) => void,
  interval = 5000
) {
  const updatesRef = useRef<Map<string, InventoryUpdate>>(new Map());

  useEffect(() => {
    if (products.length === 0) return;

    const timer = setInterval(() => {
      // Randomly pick 1-3 products to update
      const numUpdates = Math.floor(Math.random() * 3) + 1;
      const shuffled = [...products].sort(() => Math.random() - 0.5);
      const toUpdate = shuffled.slice(0, numUpdates);

      toUpdate.forEach(product => {
        const updateType = Math.random();
        let update: InventoryUpdate;

        if (updateType < 0.6) {
          // Stock update (60% chance)
          const currentStock = product.inventory.quantity;
          const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
          const newStock = Math.max(0, currentStock + change);

          update = {
            type: newStock === 0 ? 'product_unavailable' : 'stock_update',
            productId: product.id,
            data: {
              quantity: newStock,
              in_stock: newStock > 0,
              timestamp: new Date().toISOString(),
            },
          };
        } else if (updateType < 0.9) {
          // Price update (30% chance)
          const currentPrice = parseFloat(product.price.amount);
          const changePercent = (Math.random() * 0.1 - 0.05); // -5% to +5%
          const newPrice = (currentPrice * (1 + changePercent)).toFixed(2);

          update = {
            type: 'price_update',
            productId: product.id,
            data: {
              price: { amount: newPrice, currency: product.price.currency },
              timestamp: new Date().toISOString(),
            },
          };
        } else {
          // Product back in stock (10% chance)
          if (!product.inventory.in_stock) {
            update = {
              type: 'product_available',
              productId: product.id,
              data: {
                quantity: Math.floor(Math.random() * 10) + 5,
                in_stock: true,
                timestamp: new Date().toISOString(),
              },
            };
          } else {
            // Skip if product is already in stock
            return;
          }
        }

        updatesRef.current.set(product.id, update);
      });

      onUpdate(new Map(updatesRef.current));
    }, interval);

    return () => clearInterval(timer);
  }, [products, onUpdate, interval]);

  return updatesRef.current;
}

export default useInventoryWebSocket;
