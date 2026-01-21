/**
 * Binance WebSocket Service
 * 
 * Provides real-time market data and user data streams from Binance.
 * Supports both testnet and production environments.
 */

import { EventEmitter } from 'events';

// Environment configuration
const isTestnet = process.env.BINANCE_TESTNET === 'true';

const WS_BASE_URL = isTestnet
    ? 'wss://stream.testnet.binance.vision/ws'
    : 'wss://stream.binance.com:9443/ws';

const STREAM_BASE_URL = isTestnet
    ? 'wss://stream.testnet.binance.vision/stream'
    : 'wss://stream.binance.com:9443/stream';

console.log(`[BinanceWebSocket] Mode: ${isTestnet ? 'TESTNET' : 'PRODUCTION'}`);
console.log(`[BinanceWebSocket] WS URL: ${WS_BASE_URL}`);

// Types
export interface TickerData {
    symbol: string;
    price: number;
    priceChange: number;
    priceChangePercent: number;
    high24h: number;
    low24h: number;
    volume24h: number;
    quoteVolume24h: number;
    lastUpdated: number;
}

export interface KlineData {
    symbol: string;
    interval: string;
    openTime: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    closeTime: number;
    isClosed: boolean;
}

export interface DepthData {
    symbol: string;
    bids: [number, number][]; // [price, quantity][]
    asks: [number, number][];
    lastUpdateId: number;
}

export interface OrderUpdate {
    symbol: string;
    orderId: number;
    clientOrderId: string;
    side: 'BUY' | 'SELL';
    type: string;
    status: string;
    price: number;
    quantity: number;
    filledQuantity: number;
    timestamp: number;
}

export interface AccountUpdate {
    eventTime: number;
    balances: { asset: string; free: number; locked: number }[];
}

type SubscriptionType = 'ticker' | 'kline' | 'depth' | 'trade';

interface Subscription {
    id: string;
    type: SubscriptionType;
    symbol: string;
    interval?: string;
    callback: (data: unknown) => void;
}

/**
 * WebSocket connection manager for Binance streams
 */
class BinanceWebSocketService extends EventEmitter {
    private connections: Map<string, WebSocket> = new Map();
    private subscriptions: Map<string, Subscription> = new Map();
    private reconnectAttempts: Map<string, number> = new Map();
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private pingIntervals: Map<string, NodeJS.Timeout> = new Map();

    constructor() {
        super();
    }

    /**
     * Subscribe to real-time ticker updates for multiple symbols
     */
    subscribeTicker(
        symbols: string[],
        callback: (data: TickerData) => void
    ): string {
        const streamName = symbols.length === 1
            ? `${symbols[0].toLowerCase()}@ticker`
            : '!ticker@arr';

        const subscriptionId = `ticker_${Date.now()}`;

        this.createConnection(streamName, (rawData) => {
            const tickers = Array.isArray(rawData) ? rawData : [rawData];

            for (const t of tickers) {
                if (symbols.length > 1 && !symbols.includes(t.s)) continue;

                const ticker: TickerData = {
                    symbol: t.s,
                    price: parseFloat(t.c),
                    priceChange: parseFloat(t.p),
                    priceChangePercent: parseFloat(t.P),
                    high24h: parseFloat(t.h),
                    low24h: parseFloat(t.l),
                    volume24h: parseFloat(t.v),
                    quoteVolume24h: parseFloat(t.q),
                    lastUpdated: t.E,
                };
                callback(ticker);
            }
        });

        this.subscriptions.set(subscriptionId, {
            id: subscriptionId,
            type: 'ticker',
            symbol: symbols.join(','),
            callback,
        });

        return subscriptionId;
    }

    /**
     * Subscribe to kline (candlestick) updates
     */
    subscribeKline(
        symbol: string,
        interval: string,
        callback: (data: KlineData) => void
    ): string {
        const streamName = `${symbol.toLowerCase()}@kline_${interval}`;
        const subscriptionId = `kline_${symbol}_${interval}_${Date.now()}`;

        this.createConnection(streamName, (rawData: unknown) => {
            const data = rawData as { s: string; k: Record<string, unknown> };
            const k = data.k;

            const kline: KlineData = {
                symbol: data.s,
                interval: k.i as string,
                openTime: k.t as number,
                open: parseFloat(k.o as string),
                high: parseFloat(k.h as string),
                low: parseFloat(k.l as string),
                close: parseFloat(k.c as string),
                volume: parseFloat(k.v as string),
                closeTime: k.T as number,
                isClosed: k.x as boolean,
            };
            callback(kline);
        });

        this.subscriptions.set(subscriptionId, {
            id: subscriptionId,
            type: 'kline',
            symbol,
            interval,
            callback,
        });

        return subscriptionId;
    }

    /**
     * Subscribe to order book depth updates
     */
    subscribeDepth(
        symbol: string,
        callback: (data: DepthData) => void,
        levels: 5 | 10 | 20 = 10
    ): string {
        const streamName = `${symbol.toLowerCase()}@depth${levels}@100ms`;
        const subscriptionId = `depth_${symbol}_${Date.now()}`;

        this.createConnection(streamName, (rawData: unknown) => {
            const data = rawData as { bids: string[][]; asks: string[][]; lastUpdateId: number };

            const depth: DepthData = {
                symbol,
                bids: data.bids.map((b) => [parseFloat(b[0]), parseFloat(b[1])]),
                asks: data.asks.map((a) => [parseFloat(a[0]), parseFloat(a[1])]),
                lastUpdateId: data.lastUpdateId,
            };
            callback(depth);
        });

        this.subscriptions.set(subscriptionId, {
            id: subscriptionId,
            type: 'depth',
            symbol,
            callback,
        });

        return subscriptionId;
    }

    /**
     * Subscribe to mini ticker for all symbols (lightweight)
     */
    subscribeAllMiniTickers(callback: (data: TickerData[]) => void): string {
        const streamName = '!miniTicker@arr';
        const subscriptionId = `miniTicker_all_${Date.now()}`;

        this.createConnection(streamName, (rawData: unknown) => {
            const data = rawData as Array<Record<string, string>>;
            const tickers: TickerData[] = data.map((t) => ({
                symbol: t.s,
                price: parseFloat(t.c),
                priceChange: 0,
                priceChangePercent: 0,
                high24h: parseFloat(t.h),
                low24h: parseFloat(t.l),
                volume24h: parseFloat(t.v),
                quoteVolume24h: parseFloat(t.q),
                lastUpdated: parseInt(t.E),
            }));
            callback(tickers);
        });

        this.subscriptions.set(subscriptionId, {
            id: subscriptionId,
            type: 'ticker',
            symbol: 'ALL',
            callback,
        });

        return subscriptionId;
    }

    /**
     * Unsubscribe from a stream
     */
    unsubscribe(subscriptionId: string): void {
        const subscription = this.subscriptions.get(subscriptionId);
        if (!subscription) return;

        this.subscriptions.delete(subscriptionId);

        // Find and close the related connection if no other subscriptions use it
        // For simplicity, we keep connections open for reuse
        console.log(`[BinanceWebSocket] Unsubscribed: ${subscriptionId}`);
    }

    /**
     * Close all connections
     */
    closeAll(): void {
        for (const [streamName, ws] of this.connections) {
            ws.close();
            console.log(`[BinanceWebSocket] Closed: ${streamName}`);
        }
        this.connections.clear();
        this.subscriptions.clear();

        for (const interval of this.pingIntervals.values()) {
            clearInterval(interval);
        }
        this.pingIntervals.clear();
    }

    /**
     * Get connection status
     */
    getStatus(): { connected: number; subscriptions: number } {
        return {
            connected: this.connections.size,
            subscriptions: this.subscriptions.size,
        };
    }

    /**
     * Create a WebSocket connection to a stream
     */
    private createConnection(
        streamName: string,
        onMessage: (data: unknown) => void
    ): void {
        if (this.connections.has(streamName)) {
            // Already connected to this stream
            return;
        }

        const url = `${WS_BASE_URL}/${streamName}`;
        console.log(`[BinanceWebSocket] Connecting to: ${url}`);

        try {
            const ws = new WebSocket(url);

            ws.onopen = () => {
                console.log(`[BinanceWebSocket] Connected: ${streamName}`);
                this.reconnectAttempts.set(streamName, 0);
                this.emit('connected', streamName);

                // Setup ping interval to keep connection alive
                const pingInterval = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.ping?.();
                    }
                }, 30000);
                this.pingIntervals.set(streamName, pingInterval);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data.toString());
                    onMessage(data);
                } catch (err) {
                    console.error(`[BinanceWebSocket] Parse error:`, err);
                }
            };

            ws.onerror = (error) => {
                console.error(`[BinanceWebSocket] Error on ${streamName}:`, error);
                this.emit('error', { stream: streamName, error });
            };

            ws.onclose = () => {
                console.log(`[BinanceWebSocket] Disconnected: ${streamName}`);
                this.connections.delete(streamName);
                this.emit('disconnected', streamName);

                const interval = this.pingIntervals.get(streamName);
                if (interval) {
                    clearInterval(interval);
                    this.pingIntervals.delete(streamName);
                }

                // Attempt reconnection
                this.attemptReconnect(streamName, onMessage);
            };

            this.connections.set(streamName, ws);
        } catch (error) {
            console.error(`[BinanceWebSocket] Failed to connect:`, error);
            this.attemptReconnect(streamName, onMessage);
        }
    }

    /**
     * Attempt to reconnect to a stream
     */
    private attemptReconnect(
        streamName: string,
        onMessage: (data: unknown) => void
    ): void {
        const attempts = this.reconnectAttempts.get(streamName) || 0;

        if (attempts >= this.maxReconnectAttempts) {
            console.error(`[BinanceWebSocket] Max reconnect attempts reached for ${streamName}`);
            this.emit('maxReconnectAttempts', streamName);
            return;
        }

        const delay = this.reconnectDelay * Math.pow(2, attempts);
        console.log(`[BinanceWebSocket] Reconnecting ${streamName} in ${delay}ms (attempt ${attempts + 1})`);

        setTimeout(() => {
            this.reconnectAttempts.set(streamName, attempts + 1);
            this.createConnection(streamName, onMessage);
        }, delay);
    }
}

// Singleton instance
let wsService: BinanceWebSocketService | null = null;

/**
 * Get the WebSocket service singleton
 */
export function getBinanceWebSocket(): BinanceWebSocketService {
    if (!wsService) {
        wsService = new BinanceWebSocketService();
    }
    return wsService;
}

/**
 * Create a new WebSocket service instance (for testing)
 */
export function createBinanceWebSocket(): BinanceWebSocketService {
    return new BinanceWebSocketService();
}

export { BinanceWebSocketService };
