/**
 * Binance Client - Testnet & Live Market Data
 * 
 * Supports both public endpoints and authenticated trading on Binance Testnet.
 * Use BINANCE_TESTNET=true in .env to enable testnet mode.
 */

import type { CryptoAsset, KlineData, OrderBook, OrderBookLevel } from './types.js';
import { createHmac } from 'crypto';

// ============================================================================
// Configuration
// ============================================================================

const isTestnet = process.env.BINANCE_TESTNET === 'true';

// Testnet uses different base URLs
const BINANCE_BASE_URL = isTestnet
    ? 'https://testnet.binance.vision/api/v3'
    : 'https://api.binance.com/api/v3';

const API_KEY = process.env.BINANCE_API_KEY || '';
const SECRET_KEY = process.env.BINANCE_SECRET_KEY || '';

const CACHE_TTL_MS = 30 * 1000; // 30 seconds

console.log(`[BinanceClient] Mode: ${isTestnet ? 'TESTNET' : 'PRODUCTION'}`);
console.log(`[BinanceClient] Base URL: ${BINANCE_BASE_URL}`);
console.log(`[BinanceClient] API Key: ${API_KEY ? '***' + API_KEY.slice(-4) : 'NOT SET'}`);

// Symbol to name mapping
const SYMBOL_NAMES: Record<string, string> = {
    'BTCUSDT': 'Bitcoin',
    'ETHUSDT': 'Ethereum',
    'BNBUSDT': 'BNB',
    'SOLUSDT': 'Solana',
    'XRPUSDT': 'XRP',
    'ADAUSDT': 'Cardano',
    'DOGEUSDT': 'Dogecoin',
    'DOTUSDT': 'Polkadot',
    'MATICUSDT': 'Polygon',
    'SHIBUSDT': 'Shiba Inu',
    'AVAXUSDT': 'Avalanche',
    'LINKUSDT': 'Chainlink',
    'LTCUSDT': 'Litecoin',
    'UNIUSDT': 'Uniswap',
    'ATOMUSDT': 'Cosmos',
    'ETCUSDT': 'Ethereum Classic',
    'XLMUSDT': 'Stellar',
    'NEARUSDT': 'NEAR Protocol',
    'APTUSDT': 'Aptos',
    'ARBUSDT': 'Arbitrum',
    'OPUSDT': 'Optimism',
    'PEPEUSDT': 'Pepe',
};

// Primary symbols to track
export const PRIMARY_SYMBOLS = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
    'ADAUSDT', 'DOGEUSDT', 'DOTUSDT', 'MATICUSDT', 'AVAXUSDT',
    'LINKUSDT', 'LTCUSDT', 'UNIUSDT', 'ATOMUSDT', 'NEARUSDT',
    'APTUSDT', 'ARBUSDT', 'OPUSDT', 'PEPEUSDT', 'SHIBUSDT'
];

// ============================================================================
// Signature & Authentication
// ============================================================================

function createSignature(queryString: string): string {
    return createHmac('sha256', SECRET_KEY)
        .update(queryString)
        .digest('hex');
}

function getSignedHeaders(): HeadersInit {
    return {
        'X-MBX-APIKEY': API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
    };
}

function buildSignedQuery(params: Record<string, string | number>): string {
    const timestamp = Date.now();
    const queryParams = new URLSearchParams({
        ...Object.fromEntries(
            Object.entries(params).map(([k, v]) => [k, String(v)])
        ),
        timestamp: String(timestamp),
        recvWindow: '5000',
    });

    const queryString = queryParams.toString();
    const signature = createSignature(queryString);

    return `${queryString}&signature=${signature}`;
}

// ============================================================================
// Binance API Types
// ============================================================================

interface BinanceTicker24hr {
    symbol: string;
    priceChange: string;
    priceChangePercent: string;
    weightedAvgPrice: string;
    lastPrice: string;
    highPrice: string;
    lowPrice: string;
    volume: string;
    quoteVolume: string;
    openTime: number;
    closeTime: number;
}

type BinanceKline = [
    number,  // 0: Open time
    string,  // 1: Open
    string,  // 2: High
    string,  // 3: Low
    string,  // 4: Close
    string,  // 5: Volume
    number,  // 6: Close time
    string,  // 7: Quote asset volume
    number,  // 8: Number of trades
    string,  // 9: Taker buy base asset volume
    string,  // 10: Taker buy quote asset volume
    string,  // 11: Ignore
];

interface BinanceOrderBook {
    lastUpdateId: number;
    bids: [string, string][];
    asks: [string, string][];
}

interface BinanceAccountInfo {
    makerCommission: number;
    takerCommission: number;
    buyerCommission: number;
    sellerCommission: number;
    canTrade: boolean;
    canWithdraw: boolean;
    canDeposit: boolean;
    updateTime: number;
    balances: Array<{
        asset: string;
        free: string;
        locked: string;
    }>;
}

interface BinanceOrderResponse {
    symbol: string;
    orderId: number;
    orderListId: number;
    clientOrderId: string;
    transactTime: number;
    price: string;
    origQty: string;
    executedQty: string;
    cummulativeQuoteQty: string;
    status: string;
    timeInForce: string;
    type: string;
    side: string;
    fills?: Array<{
        price: string;
        qty: string;
        commission: string;
        commissionAsset: string;
    }>;
}

// ============================================================================
// Cache
// ============================================================================

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const cache: {
    tickers: CacheEntry<CryptoAsset[]> | null;
    klines: Map<string, CacheEntry<KlineData[]>>;
    orderBook: Map<string, CacheEntry<OrderBook>>;
} = {
    tickers: null,
    klines: new Map(),
    orderBook: new Map(),
};

function isCacheValid<T>(entry: CacheEntry<T> | null | undefined, ttl: number = CACHE_TTL_MS): boolean {
    if (!entry) return false;
    return Date.now() - entry.timestamp < ttl;
}

// ============================================================================
// Public API Functions
// ============================================================================

/**
 * Fetch 24hr ticker data for all USDT pairs
 */
export async function fetchTickers(symbols?: string[]): Promise<CryptoAsset[]> {
    // Check cache
    if (isCacheValid(cache.tickers)) {
        const data = cache.tickers!.data;
        if (symbols) {
            return data.filter(a => symbols.includes(`${a.symbol}USDT`) || symbols.includes(a.symbol));
        }
        return data;
    }

    try {
        const response = await fetch(`${BINANCE_BASE_URL}/ticker/24hr`);

        if (!response.ok) {
            throw new Error(`Binance API error: ${response.status}`);
        }

        const data = await response.json() as BinanceTicker24hr[];

        // Filter to USDT pairs in our primary list
        const usdtPairs = data.filter(t =>
            t.symbol.endsWith('USDT') &&
            PRIMARY_SYMBOLS.includes(t.symbol)
        );

        const assets: CryptoAsset[] = usdtPairs.map(t => ({
            symbol: t.symbol.replace('USDT', ''),
            name: SYMBOL_NAMES[t.symbol] || t.symbol.replace('USDT', ''),
            price: parseFloat(t.lastPrice),
            priceChange: parseFloat(t.priceChange),
            priceChangePercent: parseFloat(t.priceChangePercent),
            high24h: parseFloat(t.highPrice),
            low24h: parseFloat(t.lowPrice),
            volume24h: parseFloat(t.volume),
            quoteVolume24h: parseFloat(t.quoteVolume),
            lastUpdated: new Date().toISOString(),
        }));

        // Update cache
        cache.tickers = { data: assets, timestamp: Date.now() };

        if (symbols) {
            return assets.filter(a => symbols.includes(`${a.symbol}USDT`) || symbols.includes(a.symbol));
        }
        return assets;
    } catch (error) {
        console.error('[BinanceClient] Ticker fetch error:', error);
        throw error;
    }
}

/**
 * Fetch price for a single symbol
 */
export async function fetchPrice(symbol: string): Promise<CryptoAsset | null> {
    const assets = await fetchTickers([symbol]);
    return assets.find(a =>
        a.symbol === symbol ||
        a.symbol === symbol.replace('USDT', '')
    ) || null;
}

/**
 * Fetch OHLCV kline/candlestick data
 */
export async function fetchKlines(
    symbol: string,
    interval: string = '1h',
    limit: number = 24
): Promise<KlineData[]> {
    const cacheKey = `${symbol}-${interval}-${limit}`;

    // Check cache
    const cached = cache.klines.get(cacheKey);
    if (isCacheValid(cached)) {
        return cached!.data;
    }

    try {
        const fullSymbol = symbol.endsWith('USDT') ? symbol : `${symbol}USDT`;
        const response = await fetch(
            `${BINANCE_BASE_URL}/klines?symbol=${fullSymbol}&interval=${interval}&limit=${limit}`
        );

        if (!response.ok) {
            throw new Error(`Binance Klines API error: ${response.status}`);
        }

        const data = await response.json() as BinanceKline[];

        const klines: KlineData[] = data.map(k => ({
            openTime: k[0],
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5]),
            closeTime: k[6],
        }));

        // Update cache
        cache.klines.set(cacheKey, { data: klines, timestamp: Date.now() });

        return klines;
    } catch (error) {
        console.error('[BinanceClient] Klines fetch error:', error);
        throw error;
    }
}

/**
 * Fetch order book depth
 */
export async function fetchOrderBook(symbol: string, limit: number = 20): Promise<OrderBook> {
    const cacheKey = `${symbol}-${limit}`;

    // Check cache (shorter TTL for order book - 5 seconds)
    const cached = cache.orderBook.get(cacheKey);
    if (isCacheValid(cached, 5000)) {
        return cached!.data;
    }

    try {
        const fullSymbol = symbol.endsWith('USDT') ? symbol : `${symbol}USDT`;
        const response = await fetch(
            `${BINANCE_BASE_URL}/depth?symbol=${fullSymbol}&limit=${limit}`
        );

        if (!response.ok) {
            throw new Error(`Binance OrderBook API error: ${response.status}`);
        }

        const data = await response.json() as BinanceOrderBook;

        const orderBook: OrderBook = {
            symbol,
            bids: data.bids.map(([price, qty]): OrderBookLevel => ({
                price: parseFloat(price),
                quantity: parseFloat(qty),
            })),
            asks: data.asks.map(([price, qty]): OrderBookLevel => ({
                price: parseFloat(price),
                quantity: parseFloat(qty),
            })),
            lastUpdateId: data.lastUpdateId,
        };

        // Update cache
        cache.orderBook.set(cacheKey, { data: orderBook, timestamp: Date.now() });

        return orderBook;
    } catch (error) {
        console.error('[BinanceClient] OrderBook fetch error:', error);
        throw error;
    }
}

// ============================================================================
// Authenticated API Functions (Testnet)
// ============================================================================

/**
 * Get account information (requires authentication)
 */
export async function getAccountInfo(): Promise<BinanceAccountInfo> {
    if (!API_KEY || !SECRET_KEY) {
        throw new Error('Binance API credentials not configured');
    }

    const queryString = buildSignedQuery({});

    const response = await fetch(`${BINANCE_BASE_URL}/account?${queryString}`, {
        method: 'GET',
        headers: getSignedHeaders(),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Binance Account API error: ${response.status} - ${error}`);
    }

    return response.json() as Promise<BinanceAccountInfo>;
}

/**
 * Get account balances (filtered for non-zero)
 */
export async function getBalances(): Promise<Array<{ asset: string; free: number; locked: number }>> {
    const account = await getAccountInfo();

    return account.balances
        .filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
        .map(b => ({
            asset: b.asset,
            free: parseFloat(b.free),
            locked: parseFloat(b.locked),
        }));
}

/**
 * Place a market order (testnet only recommended for testing)
 */
export async function placeMarketOrder(
    symbol: string,
    side: 'BUY' | 'SELL',
    quantity: number
): Promise<BinanceOrderResponse> {
    if (!API_KEY || !SECRET_KEY) {
        throw new Error('Binance API credentials not configured');
    }

    const fullSymbol = symbol.endsWith('USDT') ? symbol : `${symbol}USDT`;

    const queryString = buildSignedQuery({
        symbol: fullSymbol,
        side,
        type: 'MARKET',
        quantity: quantity.toString(),
    });

    console.log(`[BinanceClient] Placing ${side} order: ${quantity} ${fullSymbol}`);

    const response = await fetch(`${BINANCE_BASE_URL}/order?${queryString}`, {
        method: 'POST',
        headers: getSignedHeaders(),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('[BinanceClient] Order error:', error);
        throw new Error(`Binance Order API error: ${response.status} - ${error}`);
    }

    const order = await response.json() as BinanceOrderResponse;
    console.log(`[BinanceClient] Order placed: ${order.orderId} - ${order.status}`);

    return order;
}

/**
 * Place a limit order
 */
export async function placeLimitOrder(
    symbol: string,
    side: 'BUY' | 'SELL',
    quantity: number,
    price: number
): Promise<BinanceOrderResponse> {
    if (!API_KEY || !SECRET_KEY) {
        throw new Error('Binance API credentials not configured');
    }

    const fullSymbol = symbol.endsWith('USDT') ? symbol : `${symbol}USDT`;

    const queryString = buildSignedQuery({
        symbol: fullSymbol,
        side,
        type: 'LIMIT',
        timeInForce: 'GTC',
        quantity: quantity.toString(),
        price: price.toString(),
    });

    console.log(`[BinanceClient] Placing LIMIT ${side} order: ${quantity} ${fullSymbol} @ ${price}`);

    const response = await fetch(`${BINANCE_BASE_URL}/order?${queryString}`, {
        method: 'POST',
        headers: getSignedHeaders(),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('[BinanceClient] Order error:', error);
        throw new Error(`Binance Order API error: ${response.status} - ${error}`);
    }

    const order = await response.json() as BinanceOrderResponse;
    console.log(`[BinanceClient] Order placed: ${order.orderId} - ${order.status}`);

    return order;
}

/**
 * Cancel an open order
 */
export async function cancelOrder(symbol: string, orderId: number): Promise<any> {
    if (!API_KEY || !SECRET_KEY) {
        throw new Error('Binance API credentials not configured');
    }

    const fullSymbol = symbol.endsWith('USDT') ? symbol : `${symbol}USDT`;

    const queryString = buildSignedQuery({
        symbol: fullSymbol,
        orderId: orderId.toString(),
    });

    const response = await fetch(`${BINANCE_BASE_URL}/order?${queryString}`, {
        method: 'DELETE',
        headers: getSignedHeaders(),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Binance Cancel API error: ${response.status} - ${error}`);
    }

    return response.json();
}

/**
 * Get open orders
 */
export async function getOpenOrders(symbol?: string): Promise<any[]> {
    if (!API_KEY || !SECRET_KEY) {
        throw new Error('Binance API credentials not configured');
    }

    const params: Record<string, string | number> = {};
    if (symbol) {
        params.symbol = symbol.endsWith('USDT') ? symbol : `${symbol}USDT`;
    }

    const queryString = buildSignedQuery(params);

    const response = await fetch(`${BINANCE_BASE_URL}/openOrders?${queryString}`, {
        method: 'GET',
        headers: getSignedHeaders(),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Binance OpenOrders API error: ${response.status} - ${error}`);
    }

    return response.json();
}

/**
 * Get order history for a symbol
 */
export async function getOrderHistory(
    symbol: string,
    limit: number = 50
): Promise<BinanceOrderResponse[]> {
    if (!API_KEY || !SECRET_KEY) {
        throw new Error('Binance API credentials not configured');
    }

    const fullSymbol = symbol.endsWith('USDT') ? symbol : `${symbol}USDT`;

    const queryString = buildSignedQuery({
        symbol: fullSymbol,
        limit: limit.toString(),
    });

    const response = await fetch(`${BINANCE_BASE_URL}/allOrders?${queryString}`, {
        method: 'GET',
        headers: getSignedHeaders(),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Binance AllOrders API error: ${response.status} - ${error}`);
    }

    return response.json() as Promise<BinanceOrderResponse[]>;
}

/**
 * Get trade history for a symbol
 */
export async function getTradeHistory(
    symbol: string,
    limit: number = 50
): Promise<Array<{
    symbol: string;
    id: number;
    orderId: number;
    price: number;
    qty: number;
    quoteQty: number;
    commission: number;
    commissionAsset: string;
    time: number;
    isBuyer: boolean;
    isMaker: boolean;
}>> {
    if (!API_KEY || !SECRET_KEY) {
        throw new Error('Binance API credentials not configured');
    }

    const fullSymbol = symbol.endsWith('USDT') ? symbol : `${symbol}USDT`;

    const queryString = buildSignedQuery({
        symbol: fullSymbol,
        limit: limit.toString(),
    });

    const response = await fetch(`${BINANCE_BASE_URL}/myTrades?${queryString}`, {
        method: 'GET',
        headers: getSignedHeaders(),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Binance MyTrades API error: ${response.status} - ${error}`);
    }

    const trades = await response.json() as Array<{
        symbol: string;
        id: number;
        orderId: number;
        price: string;
        qty: string;
        quoteQty: string;
        commission: string;
        commissionAsset: string;
        time: number;
        isBuyer: boolean;
        isMaker: boolean;
    }>;

    return trades.map(t => ({
        symbol: t.symbol,
        id: t.id,
        orderId: t.orderId,
        price: parseFloat(t.price),
        qty: parseFloat(t.qty),
        quoteQty: parseFloat(t.quoteQty),
        commission: parseFloat(t.commission),
        commissionAsset: t.commissionAsset,
        time: t.time,
        isBuyer: t.isBuyer,
        isMaker: t.isMaker,
    }));
}

/**
 * Test connectivity to Binance API
 */
export async function testConnectivity(): Promise<{ success: boolean; serverTime?: number; error?: string }> {
    try {
        const response = await fetch(`${BINANCE_BASE_URL}/time`);

        if (!response.ok) {
            return { success: false, error: `HTTP ${response.status}` };
        }

        const data = await response.json() as { serverTime: number };
        return { success: true, serverTime: data.serverTime };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get symbol name from symbol code
 */
export function getSymbolName(symbol: string): string {
    const fullSymbol = symbol.endsWith('USDT') ? symbol : `${symbol}USDT`;
    return SYMBOL_NAMES[fullSymbol] || symbol.replace('USDT', '');
}

/**
 * Clear all caches (useful for testing or forced refresh)
 */
export function clearCache(): void {
    cache.tickers = null;
    cache.klines.clear();
    cache.orderBook.clear();
}

/**
 * Check if testnet mode is enabled
 */
export function isTestnetMode(): boolean {
    return isTestnet;
}

/**
 * Check if API credentials are configured
 */
export function hasApiCredentials(): boolean {
    return Boolean(API_KEY && SECRET_KEY);
}
