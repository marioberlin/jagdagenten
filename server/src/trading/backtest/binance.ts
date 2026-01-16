/**
 * Binance Data Fetcher
 * 
 * Fetches historical candle data from Binance API.
 * No API key required for historical data.
 */

export interface Candle {
    timestamp: number;
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    trades?: number;
}

export type Interval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w' | '1M';

export interface FetchOptions {
    symbol: string;
    interval: Interval;
    startDate: string;
    endDate: string;
    limit?: number;
}

/**
 * Fetch klines (candles) from Binance API
 */
export async function fetchBinanceKlines(options: FetchOptions): Promise<Candle[]> {
    const { symbol, interval, startDate, endDate, limit = 1000 } = options;

    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime() + 86400000; // Add 1 day

    const url = new URL('https://api.binance.com/api/v3/klines');
    url.searchParams.set('symbol', symbol);
    url.searchParams.set('interval', interval);
    url.searchParams.set('startTime', startMs.toString());
    url.searchParams.set('endTime', endMs.toString());
    url.searchParams.set('limit', limit.toString());

    const response = await fetch(url.toString());

    if (!response.ok) {
        throw new Error(`Binance API error: ${response.status} ${response.statusText}`);
    }

    const rawData = await response.json();

    if (rawData.code) {
        throw new Error(`Binance API error: ${rawData.msg}`);
    }

    return rawData.map((k: (string | number)[]) => ({
        timestamp: k[0] as number,
        date: new Date(k[0] as number).toISOString().split('T')[0],
        open: parseFloat(k[1] as string),
        high: parseFloat(k[2] as string),
        low: parseFloat(k[3] as string),
        close: parseFloat(k[4] as string),
        volume: parseFloat(k[5] as string),
        trades: parseInt(k[8] as string),
    }));
}

/**
 * Fetch multiple pages of klines for extended date ranges
 */
export async function fetchExtendedKlines(options: FetchOptions): Promise<Candle[]> {
    const allCandles: Candle[] = [];
    let currentStartMs = new Date(options.startDate).getTime();
    const endMs = new Date(options.endDate).getTime();

    while (currentStartMs < endMs) {
        const batch = await fetchBinanceKlines({
            ...options,
            startDate: new Date(currentStartMs).toISOString().split('T')[0],
        });

        if (batch.length === 0) break;

        allCandles.push(...batch);

        // Move to next batch
        const lastTimestamp = batch[batch.length - 1].timestamp;
        currentStartMs = lastTimestamp + 1;

        // Rate limit protection
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Remove duplicates and filter by date range
    const seen = new Set<number>();
    return allCandles.filter(c => {
        if (seen.has(c.timestamp)) return false;
        seen.add(c.timestamp);
        return c.timestamp <= endMs;
    });
}

/**
 * Get current price for a symbol
 */
export async function getCurrentPrice(symbol: string): Promise<number> {
    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
    const data = await response.json();
    return parseFloat(data.price);
}

/**
 * Get 24-hour ticker stats
 */
export async function get24hStats(symbol: string): Promise<{
    priceChange: number;
    priceChangePercent: number;
    high: number;
    low: number;
    volume: number;
    lastPrice: number;
}> {
    const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
    const data = await response.json();

    return {
        priceChange: parseFloat(data.priceChange),
        priceChangePercent: parseFloat(data.priceChangePercent),
        high: parseFloat(data.highPrice),
        low: parseFloat(data.lowPrice),
        volume: parseFloat(data.volume),
        lastPrice: parseFloat(data.lastPrice),
    };
}

/**
 * Common trading pairs
 */
export const COMMON_PAIRS = [
    'BTCUSDT',
    'ETHUSDT',
    'BNBUSDT',
    'SOLUSDT',
    'XRPUSDT',
    'ADAUSDT',
    'DOGEUSDT',
    'PAXGUSDT',
    'LINKUSDT',
    'MATICUSDT',
] as const;

export type CommonPair = typeof COMMON_PAIRS[number];
