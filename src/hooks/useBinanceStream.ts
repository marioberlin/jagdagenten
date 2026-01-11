import { useState, useEffect, useRef } from 'react';

export interface BinanceTicker {
    s: string; // Symbol
    c: string; // Last price
    p: string; // 24h Price change
    P: string; // 24h Price change percent
    h: string; // 24h High price
    l: string; // 24h Low price
    v: string; // 24h Volume
    q: string; // 24h Quote volume
}

export interface BinanceTrade {
    e: string; // Event type
    p: string; // Price
    q: string; // Quantity
    t: number; // Trade time
    m: boolean; // Is buyer the market maker?
}

export interface BinanceDepth {
    lastUpdateId: number;
    bids: [string, string][];
    asks: [string, string][];
}

export interface BinanceKline {
    t: number; // Kline start time
    T: number; // Kline close time
    s: string; // Symbol
    i: string; // Interval
    o: string; // Open price
    c: string; // Close price
    h: string; // High price
    l: string; // Low price
    v: string; // Base asset volume
    q: string; // Quote asset volume
    x: boolean; // Is this kline closed?
}

export interface CandlestickData {
    timestamp: string;
    open: number;
    close: number;
    high: number;
    low: number;
}

export interface MarketDataState {
    ticker: BinanceTicker | null;
    trades: BinanceTrade[];
    depth: BinanceDepth | null;
    klines: CandlestickData[];
    connected: boolean;
}

const WS_BASE_URL = 'wss://stream.binance.com:9443/ws';
const REST_BASE_URL = 'https://api.binance.com/api/v3';

// Format timestamp based on interval - use CET timezone
function formatTimestamp(ms: number, interval: string): string {
    const date = new Date(ms);
    const options: Intl.DateTimeFormatOptions = { timeZone: 'Europe/Berlin' };

    // Long-term intervals: show date
    if (interval === '1d' || interval === '3d') {
        return date.toLocaleDateString('en-GB', { ...options, day: '2-digit', month: 'short' }); // "03 Jan"
    }
    if (interval === '1w') {
        return date.toLocaleDateString('en-GB', { ...options, day: '2-digit', month: 'short' }); // "03 Jan"
    }
    if (interval === '1M') {
        return date.toLocaleDateString('en-GB', { ...options, month: 'short', year: '2-digit' }); // "Jan 26"
    }

    // Medium-term: show date + time
    if (interval === '4h' || interval === '6h' || interval === '8h' || interval === '12h') {
        return date.toLocaleDateString('en-GB', { ...options, day: '2-digit', month: 'short' }) +
            ' ' + date.toLocaleTimeString('en-GB', { ...options, hour: '2-digit', minute: '2-digit' });
    }

    // Short-term: show time only
    return date.toLocaleTimeString('en-GB', { ...options, hour: '2-digit', minute: '2-digit' }); // "18:30"
}

export function useBinanceStream(symbol: string, interval: string = '1h') {
    const [data, setData] = useState<MarketDataState>({
        ticker: null,
        trades: [],
        depth: null,
        klines: [],
        connected: false
    });

    const wsRef = useRef<WebSocket | null>(null);

    // 1. Fetch Historical Klines via REST on symbol/interval change
    useEffect(() => {
        if (!symbol) return;

        const fetchHistory = async () => {
            try {
                const response = await fetch(`${REST_BASE_URL}/klines?symbol=${symbol}&interval=${interval}&limit=100`);
                const klines = await response.json();

                // Format for Chart
                const formattedKlines: CandlestickData[] = klines.map((k: any[]) => ({
                    timestamp: formatTimestamp(k[0], interval),
                    open: parseFloat(k[1]),
                    high: parseFloat(k[2]),
                    low: parseFloat(k[3]),
                    close: parseFloat(k[4])
                }));

                setData(prev => ({ ...prev, klines: formattedKlines }));
            } catch (err) {
                console.error("Failed to fetch klines history", err);
            }
        };

        fetchHistory();
    }, [symbol, interval]);

    // 2. WebSocket Subscription
    useEffect(() => {
        if (!symbol) return;

        const lowerSymbol = symbol.toLowerCase();
        // Streams: ticker, aggTrade, depth, and kline_<interval>
        const streams = [
            `${lowerSymbol}@ticker`,
            `${lowerSymbol}@aggTrade`,
            `${lowerSymbol}@depth20@100ms`,
            `${lowerSymbol}@kline_${interval}`
        ].join('/');

        const url = `${WS_BASE_URL}/${streams}`;
        // console.log(`Subscribing to ${url}`);

        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
            // console.log('WS Monitor Connected');
            setData(prev => ({ ...prev, connected: true }));
        };

        ws.onclose = () => {
            // console.log('WS Monitor Disconnected');
            setData(prev => ({ ...prev, connected: false }));
        };

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            const eventType = msg.e;

            if (eventType === '24hrTicker') {
                setData(prev => ({ ...prev, ticker: msg }));
            }
            else if (eventType === 'aggTrade') {
                setData(prev => {
                    const newTrades = [msg, ...prev.trades].slice(0, 50);
                    return { ...prev, trades: newTrades };
                });
            }
            else if (eventType === 'depthUpdate' || msg.lastUpdateId) {
                setData(prev => ({ ...prev, depth: msg }));
            }
            else if (eventType === 'kline') {
                const k = msg.k;
                // Update specific candle in array or add new one
                setData(prev => {
                    const newCandle: CandlestickData = {
                        timestamp: formatTimestamp(k.t, interval),
                        open: parseFloat(k.o),
                        high: parseFloat(k.h),
                        low: parseFloat(k.l),
                        close: parseFloat(k.c)
                    };

                    const lastParams = prev.klines[prev.klines.length - 1];
                    // If same timestamp, update. Else push.
                    // Note: k.t is start time. 
                    if (lastParams && lastParams.timestamp === newCandle.timestamp) {
                        const updated = [...prev.klines];
                        updated[updated.length - 1] = newCandle;
                        return { ...prev, klines: updated };
                    } else {
                        const updated = [...prev.klines, newCandle].slice(-100); // Keep last 100
                        return { ...prev, klines: updated };
                    }
                });
            }
        };

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [symbol, interval]);

    return data;
}
