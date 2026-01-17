import { useEffect, useCallback, useRef, useState } from 'react';

export type AdminEventType =
    | 'task:created'
    | 'task:updated'
    | 'task:completed'
    | 'task:failed'
    | 'task:retried'
    | 'task:canceled'
    | 'context:created'
    | 'context:updated'
    | 'context:deleted';

export interface AdminEvent {
    type: AdminEventType;
    payload: Record<string, unknown>;
    timestamp: string;
}

interface UseAdminWebSocketOptions {
    /** Auto-reconnect on disconnect */
    autoReconnect?: boolean;
    /** Reconnect interval in ms */
    reconnectInterval?: number;
    /** WebSocket URL (default: ws://localhost:3001) */
    url?: string;
}

interface UseAdminWebSocketResult {
    /** Connection status */
    isConnected: boolean;
    /** Last received event */
    lastEvent: AdminEvent | null;
    /** Subscribe to specific event types */
    subscribe: (eventTypes: AdminEventType[], callback: (event: AdminEvent) => void) => () => void;
    /** Manual reconnect */
    reconnect: () => void;
}

/**
 * useAdminWebSocket
 * 
 * Hook for subscribing to admin console real-time updates via WebSocket.
 * Provides connection management, auto-reconnect, and event subscription.
 */
export function useAdminWebSocket(options: UseAdminWebSocketOptions = {}): UseAdminWebSocketResult {
    const {
        autoReconnect = true,
        reconnectInterval = 5000,
        url = 'ws://localhost:3001',
    } = options;

    const wsRef = useRef<WebSocket | null>(null);
    const subscriptionsRef = useRef<Map<string, Set<(event: AdminEvent) => void>>>(new Map());
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [isConnected, setIsConnected] = useState(false);
    const [lastEvent, setLastEvent] = useState<AdminEvent | null>(null);

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        try {
            const ws = new WebSocket(url);

            ws.onopen = () => {
                console.log('[Admin WS] Connected');
                setIsConnected(true);

                // Subscribe to admin channel
                ws.send(JSON.stringify({
                    type: 'subscribe',
                    channel: 'admin',
                }));
            };

            ws.onclose = () => {
                console.log('[Admin WS] Disconnected');
                setIsConnected(false);

                // Auto-reconnect
                if (autoReconnect) {
                    reconnectTimeoutRef.current = setTimeout(() => {
                        console.log('[Admin WS] Attempting reconnect...');
                        connect();
                    }, reconnectInterval);
                }
            };

            ws.onerror = (error) => {
                console.error('[Admin WS] Error:', error);
            };

            ws.onmessage = (message) => {
                try {
                    const data = JSON.parse(message.data);

                    // Check if it's an admin channel event
                    if (data.channel === 'admin' && data.data) {
                        const event = data.data as AdminEvent;
                        setLastEvent(event);

                        // Notify subscribers
                        const subscribers = subscriptionsRef.current.get(event.type);
                        if (subscribers) {
                            subscribers.forEach(callback => callback(event));
                        }

                        // Also notify wildcard subscribers
                        const wildcardSubscribers = subscriptionsRef.current.get('*');
                        if (wildcardSubscribers) {
                            wildcardSubscribers.forEach(callback => callback(event));
                        }
                    }
                } catch (err) {
                    console.error('[Admin WS] Parse error:', err);
                }
            };

            wsRef.current = ws;
        } catch (err) {
            console.error('[Admin WS] Connection error:', err);
        }
    }, [url, autoReconnect, reconnectInterval]);

    const reconnect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        connect();
    }, [connect]);

    const subscribe = useCallback((
        eventTypes: AdminEventType[],
        callback: (event: AdminEvent) => void
    ) => {
        // Add subscriptions
        eventTypes.forEach(eventType => {
            if (!subscriptionsRef.current.has(eventType)) {
                subscriptionsRef.current.set(eventType, new Set());
            }
            subscriptionsRef.current.get(eventType)!.add(callback);
        });

        // Return unsubscribe function
        return () => {
            eventTypes.forEach(eventType => {
                subscriptionsRef.current.get(eventType)?.delete(callback);
            });
        };
    }, []);

    // Connect on mount
    useEffect(() => {
        connect();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [connect]);

    return {
        isConnected,
        lastEvent,
        subscribe,
        reconnect,
    };
}

export default useAdminWebSocket;
