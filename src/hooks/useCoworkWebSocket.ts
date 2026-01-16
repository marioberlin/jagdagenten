/**
 * useCoworkWebSocket Hook
 *
 * Manages WebSocket connection for real-time Cowork session updates.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useCoworkStore } from '@/stores/coworkStore';
import type { CoworkEvent } from '@/types/cowork';

interface UseCoworkWebSocketOptions {
    /** Auto-reconnect on disconnect */
    autoReconnect?: boolean;
    /** Reconnect interval in ms */
    reconnectInterval?: number;
    /** Max reconnection attempts */
    maxReconnectAttempts?: number;
}

export function useCoworkWebSocket(
    sessionId: string | null,
    options: UseCoworkWebSocketOptions = {}
) {
    const {
        autoReconnect = true,
        reconnectInterval = 3000,
        maxReconnectAttempts = 5
    } = options;

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const { handleEvent, setWsConnected } = useCoworkStore();

    const connect = useCallback(() => {
        if (!sessionId) return;

        // Don't reconnect if we've hit the limit
        if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
            console.warn('[Cowork WS] Max reconnection attempts reached');
            return;
        }

        // Close existing connection
        if (wsRef.current) {
            wsRef.current.close();
        }

        // Determine WebSocket URL
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const wsUrl = `${protocol}//${host}/ws`;

        console.log('[Cowork WS] Connecting to', wsUrl);

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('[Cowork WS] Connected');
            setWsConnected(true);
            reconnectAttemptsRef.current = 0;

            // Subscribe to session updates
            ws.send(JSON.stringify({
                type: 'subscribe',
                channel: 'cowork',
                sessionId
            }));
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data) as CoworkEvent;
                handleEvent(data);
            } catch (e) {
                console.error('[Cowork WS] Failed to parse message:', e);
            }
        };

        ws.onerror = (error) => {
            console.error('[Cowork WS] WebSocket error:', error);
        };

        ws.onclose = (event) => {
            console.log('[Cowork WS] Disconnected:', event.code, event.reason);
            setWsConnected(false);

            // Auto-reconnect if enabled
            if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
                reconnectAttemptsRef.current++;
                console.log(`[Cowork WS] Reconnecting in ${reconnectInterval}ms (attempt ${reconnectAttemptsRef.current})`);

                reconnectTimeoutRef.current = setTimeout(() => {
                    connect();
                }, reconnectInterval);
            }
        };
    }, [sessionId, autoReconnect, reconnectInterval, maxReconnectAttempts, handleEvent, setWsConnected]);

    const disconnect = useCallback(() => {
        // Clear reconnect timeout
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        // Close WebSocket
        if (wsRef.current) {
            const ws = wsRef.current;

            // Unsubscribe before closing
            if (ws.readyState === WebSocket.OPEN && sessionId) {
                ws.send(JSON.stringify({
                    type: 'unsubscribe',
                    channel: 'cowork',
                    sessionId
                }));
            }

            ws.close();
            wsRef.current = null;
        }

        setWsConnected(false);
    }, [sessionId, setWsConnected]);

    // Connect when sessionId changes
    useEffect(() => {
        if (sessionId) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [sessionId, connect, disconnect]);

    // Method to manually send messages
    const send = useCallback((message: object) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        } else {
            console.warn('[Cowork WS] Cannot send, WebSocket not open');
        }
    }, []);

    return {
        ws: wsRef.current,
        connect,
        disconnect,
        send
    };
}

export default useCoworkWebSocket;
