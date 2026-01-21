/**
 * MarketDataAgent
 * 
 * A2A Agent for real-time cryptocurrency market data.
 * Fetches live data from Binance public API.
 * 
 * Endpoints:
 * - A2A: POST /agents/market-data/a2a
 * - REST: GET /api/trading/prices (optional)
 */

import type { AgentCard, A2UIMessage, SendMessageParams } from '../../../a2a/types.js';
import { randomUUID } from 'crypto';
import {
    fetchTickers,
    fetchPrice,
    fetchKlines,
    fetchOrderBook,
    getSymbolName,
    PRIMARY_SYMBOLS,
    type CryptoAsset,
    type KlineData,
} from '../shared/index.js';
import { resilientCall } from '../shared/resilience.js';

// ============================================================================
// Agent Card
// ============================================================================

export const getMarketDataAgentCard = (baseUrl: string): AgentCard => ({
    protocolVersions: ['1.0'],
    name: 'Market Data Agent',
    description: 'Real-time cryptocurrency market data from Binance. Get prices, charts, order books, and market statistics. Supports both AI agent queries and direct REST API access.',
    version: '1.0.0',
    supportedInterfaces: [
        { url: `${baseUrl}/agents/market-data`, protocolBinding: 'JSONRPC' },
    ],
    capabilities: { streaming: true, pushNotifications: false },
    defaultInputModes: ['text/plain'],
    defaultOutputModes: ['text/plain', 'application/json'],
    skills: [
        {
            id: 'get-price',
            name: 'Get Price',
            description: 'Fetch current price for a cryptocurrency',
            tags: ['price', 'ticker', 'quote'],
            examples: ['price BTC', 'ETH price', 'what is SOL trading at?'],
        },
        {
            id: 'get-prices',
            name: 'Get All Prices',
            description: 'Fetch prices for all tracked cryptocurrencies',
            tags: ['prices', 'market', 'overview'],
            examples: ['show prices', 'all prices', 'market data'],
        },
        {
            id: 'get-klines',
            name: 'Get Klines/Candles',
            description: 'Fetch OHLCV candlestick data for charting',
            tags: ['klines', 'candles', 'chart', 'ohlcv'],
            examples: ['BTC 1h candles', 'ETH daily chart', 'show klines for SOL'],
        },
        {
            id: 'get-orderbook',
            name: 'Get Order Book',
            description: 'Fetch current order book depth',
            tags: ['orderbook', 'depth', 'bids', 'asks'],
            examples: ['BTC orderbook', 'ETH depth', 'show order book for SOL'],
        },
        {
            id: 'top-movers',
            name: 'Top Movers',
            description: 'Find top gainers and losers',
            tags: ['gainers', 'losers', 'movers', 'trending'],
            examples: ['top gainers', 'biggest losers', 'trending coins'],
        },
    ],
    provider: { organization: 'LiquidCrypto Labs' },
    extensions: {
        a2ui: {
            version: '0.8',
            supportedComponents: ['Card', 'List', 'Button', 'Text', 'Row', 'Column', 'Divider']
        },
    },
});

// ============================================================================
// Intent Detection
// ============================================================================

interface DetectedIntent {
    skill: string;
    symbol?: string;
    interval?: string;
    limit?: number;
}

function detectIntent(text: string): DetectedIntent {
    const lower = text.toLowerCase().trim();

    // Extract symbol if present
    const symbolMatch = lower.match(/\b(btc|eth|bnb|sol|xrp|ada|doge|dot|matic|shib|avax|link|ltc|uni|atom|near|apt|arb|op|pepe)\b/i);
    const symbol = symbolMatch ? symbolMatch[1].toUpperCase() : undefined;

    // Detect interval
    const intervalMatch = lower.match(/\b(1m|5m|15m|30m|1h|4h|1d|1w|daily|hourly|weekly)\b/i);
    let interval = intervalMatch ? intervalMatch[1].toLowerCase() : '1h';
    if (interval === 'daily') interval = '1d';
    if (interval === 'hourly') interval = '1h';
    if (interval === 'weekly') interval = '1w';

    // Detect limit
    const limitMatch = lower.match(/\b(\d+)\s*(candles?|bars?|periods?)\b/i);
    const limit = limitMatch ? parseInt(limitMatch[1], 10) : 24;

    // Detect skill
    if (lower.includes('orderbook') || lower.includes('order book') || lower.includes('depth')) {
        return { skill: 'get-orderbook', symbol };
    }

    if (lower.includes('kline') || lower.includes('candle') || lower.includes('chart') || lower.includes('ohlcv')) {
        return { skill: 'get-klines', symbol, interval, limit };
    }

    if (lower.includes('gainer') || lower.includes('top') || lower.includes('best')) {
        return { skill: 'top-movers' };
    }

    if (lower.includes('loser') || lower.includes('worst') || lower.includes('bottom')) {
        return { skill: 'top-movers' };
    }

    if (lower.includes('all') || lower.includes('prices') || lower.includes('market') || lower.includes('overview')) {
        return { skill: 'get-prices' };
    }

    if (lower.includes('price') || symbol) {
        return { skill: 'get-price', symbol: symbol || 'BTC' };
    }

    // Default to all prices
    return { skill: 'get-prices' };
}

// ============================================================================
// Formatting Helpers
// ============================================================================

function formatPrice(price: number): string {
    if (price >= 1000) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    if (price >= 0.0001) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(8)}`;
}

function formatChange(change: number): string {
    const prefix = change > 0 ? '+' : '';
    return `${prefix}${change.toFixed(2)}%`;
}

function formatVolume(volume: number): string {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(1)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(1)}M`;
    return `$${volume.toLocaleString()}`;
}

// ============================================================================
// A2UI Generation
// ============================================================================

function generatePriceCard(asset: CryptoAsset): A2UIMessage[] {
    return [
        {
            type: 'beginRendering',
            surfaceId: `price-${asset.symbol}`,
            rootComponentId: 'root',
            styling: { primaryColor: asset.priceChangePercent >= 0 ? '#10B981' : '#EF4444' },
        },
        {
            type: 'surfaceUpdate',
            surfaceId: `price-${asset.symbol}`,
            components: [
                {
                    id: 'root',
                    component: {
                        Card: {
                            children: ['symbol', 'price', 'change', 'stats', 'actions'],
                        },
                    },
                },
                {
                    id: 'symbol',
                    component: {
                        Text: {
                            text: { literalString: `${asset.name} (${asset.symbol})` },
                            semantic: 'h3',
                        },
                    },
                },
                {
                    id: 'price',
                    component: {
                        Text: {
                            text: { literalString: formatPrice(asset.price) },
                            semantic: 'h2',
                        },
                    },
                },
                {
                    id: 'change',
                    component: {
                        Text: {
                            text: { literalString: `${formatChange(asset.priceChangePercent)} (24h)` },
                            variant: asset.priceChangePercent >= 0 ? 'default' : 'secondary',
                        },
                    },
                },
                {
                    id: 'stats',
                    component: {
                        Row: {
                            children: ['high', 'low', 'volume'],
                        },
                    },
                },
                {
                    id: 'high',
                    component: {
                        Column: {
                            children: ['high-label', 'high-value'],
                        },
                    },
                },
                {
                    id: 'high-label',
                    component: { Text: { text: { literalString: '24h High' }, variant: 'secondary' } },
                },
                {
                    id: 'high-value',
                    component: { Text: { text: { literalString: formatPrice(asset.high24h) } } },
                },
                {
                    id: 'low',
                    component: {
                        Column: {
                            children: ['low-label', 'low-value'],
                        },
                    },
                },
                {
                    id: 'low-label',
                    component: { Text: { text: { literalString: '24h Low' }, variant: 'secondary' } },
                },
                {
                    id: 'low-value',
                    component: { Text: { text: { literalString: formatPrice(asset.low24h) } } },
                },
                {
                    id: 'volume',
                    component: {
                        Column: {
                            children: ['vol-label', 'vol-value'],
                        },
                    },
                },
                {
                    id: 'vol-label',
                    component: { Text: { text: { literalString: 'Volume' }, variant: 'secondary' } },
                },
                {
                    id: 'vol-value',
                    component: { Text: { text: { literalString: formatVolume(asset.quoteVolume24h) } } },
                },
                {
                    id: 'actions',
                    component: {
                        Row: {
                            children: ['chart-btn', 'orderbook-btn'],
                            alignment: 'center',
                        },
                    },
                },
                {
                    id: 'chart-btn',
                    component: {
                        Button: {
                            label: { literalString: 'View Chart' },
                            action: { input: { text: `${asset.symbol} chart` } },
                        },
                    },
                },
                {
                    id: 'orderbook-btn',
                    component: {
                        Button: {
                            label: { literalString: 'Order Book' },
                            action: { input: { text: `${asset.symbol} orderbook` } },
                        },
                    },
                },
            ],
        },
    ];
}

function generatePricesList(assets: CryptoAsset[]): A2UIMessage[] {
    const assetComponents: Array<{ id: string; component: object }> = [];
    const assetIds: string[] = [];

    assets.slice(0, 10).forEach((asset, idx) => {
        const id = `asset-${idx}`;
        assetIds.push(id);

        assetComponents.push({
            id,
            component: {
                Row: {
                    children: [`${id}-name`, `${id}-price`, `${id}-change`],
                },
            },
        });
        assetComponents.push({
            id: `${id}-name`,
            component: { Text: { text: { literalString: `${asset.symbol}` }, semantic: 'h4' } },
        });
        assetComponents.push({
            id: `${id}-price`,
            component: { Text: { text: { literalString: formatPrice(asset.price) } } },
        });
        assetComponents.push({
            id: `${id}-change`,
            component: {
                Text: {
                    text: { literalString: formatChange(asset.priceChangePercent) },
                    variant: asset.priceChangePercent >= 0 ? 'default' : 'secondary',
                }
            },
        });
    });

    return [
        {
            type: 'beginRendering',
            surfaceId: 'prices-list',
            rootComponentId: 'root',
            styling: { primaryColor: '#3B82F6' },
        },
        {
            type: 'surfaceUpdate',
            surfaceId: 'prices-list',
            components: [
                {
                    id: 'root',
                    component: {
                        Column: {
                            children: ['header', 'live', ...assetIds],
                        },
                    },
                },
                {
                    id: 'header',
                    component: { Text: { text: { literalString: 'Live Market Prices' }, semantic: 'h2' } },
                },
                {
                    id: 'live',
                    component: { Text: { text: { literalString: '🔴 Live • Binance' }, variant: 'secondary' } },
                },
                ...assetComponents,
            ],
        },
    ];
}

// ============================================================================
// Request Handler
// ============================================================================

export async function handleMarketDataRequest(params: SendMessageParams): Promise<any> {
    const taskId = randomUUID();
    const contextId = params.message.contextId || randomUUID();

    // Extract text from message
    const textPart = params.message.parts.find((p: any) => 'text' in p || p.kind === 'text');
    const userText = textPart?.text || '';

    console.log(`[MarketDataAgent] Processing: "${userText}"`);

    // Detect intent
    const intent = detectIntent(userText);
    console.log(`[MarketDataAgent] Detected intent:`, intent);

    try {
        let responseText = '';
        let a2uiMessages: A2UIMessage[] = [];

        switch (intent.skill) {
            case 'get-price': {
                const asset = await resilientCall(
                    () => fetchPrice(intent.symbol || 'BTC'),
                    { circuitBreaker: { key: 'binance-ticker' } }
                );

                if (asset) {
                    responseText = `${asset.name} (${asset.symbol}) is trading at ${formatPrice(asset.price)}, ${formatChange(asset.priceChangePercent)} in the last 24h.`;
                    a2uiMessages = generatePriceCard(asset);
                } else {
                    responseText = `Could not find price data for ${intent.symbol}.`;
                }
                break;
            }

            case 'get-prices': {
                const assets = await resilientCall(
                    () => fetchTickers(),
                    { circuitBreaker: { key: 'binance-ticker' } }
                );

                const sorted = [...assets].sort((a, b) => b.quoteVolume24h - a.quoteVolume24h);
                responseText = `Showing top ${Math.min(10, sorted.length)} cryptocurrencies by volume.`;
                a2uiMessages = generatePricesList(sorted);
                break;
            }

            case 'get-klines': {
                const symbol = intent.symbol || 'BTC';
                const klines = await resilientCall(
                    () => fetchKlines(symbol, intent.interval || '1h', intent.limit || 24),
                    { circuitBreaker: { key: 'binance-klines' } }
                );

                const latest = klines[klines.length - 1];
                responseText = `${symbol} ${intent.interval || '1h'} data: Open ${formatPrice(latest.open)}, High ${formatPrice(latest.high)}, Low ${formatPrice(latest.low)}, Close ${formatPrice(latest.close)}`;
                // Note: Full charting A2UI would be added in Phase 4
                break;
            }

            case 'get-orderbook': {
                const symbol = intent.symbol || 'BTC';
                const orderBook = await resilientCall(
                    () => fetchOrderBook(symbol),
                    { circuitBreaker: { key: 'binance-orderbook' } }
                );

                const bestBid = orderBook.bids[0];
                const bestAsk = orderBook.asks[0];
                const spread = bestAsk.price - bestBid.price;
                const spreadPercent = (spread / bestAsk.price) * 100;

                responseText = `${symbol} Order Book: Best Bid ${formatPrice(bestBid.price)}, Best Ask ${formatPrice(bestAsk.price)}, Spread ${spreadPercent.toFixed(3)}%`;
                break;
            }

            case 'top-movers': {
                const assets = await resilientCall(
                    () => fetchTickers(),
                    { circuitBreaker: { key: 'binance-ticker' } }
                );

                const gainers = [...assets].sort((a, b) => b.priceChangePercent - a.priceChangePercent).slice(0, 5);
                const losers = [...assets].sort((a, b) => a.priceChangePercent - b.priceChangePercent).slice(0, 5);

                responseText = `Top Gainers: ${gainers.map(a => `${a.symbol} ${formatChange(a.priceChangePercent)}`).join(', ')}. Top Losers: ${losers.map(a => `${a.symbol} ${formatChange(a.priceChangePercent)}`).join(', ')}.`;
                break;
            }

            default:
                responseText = 'I can help you with market data. Try "BTC price", "show all prices", "ETH chart", or "top gainers".';
        }

        // Build response
        return {
            id: taskId,
            contextId,
            status: { state: 'completed' },
            artifacts: a2uiMessages.length > 0 ? [{
                artifactId: randomUUID(),
                name: 'market-data',
                parts: a2uiMessages.map(msg => ({ type: 'a2ui', ...msg })),
            }] : undefined,
            history: [
                params.message,
                {
                    role: 'agent',
                    parts: [{ text: responseText }],
                },
            ],
        };
    } catch (error) {
        console.error('[MarketDataAgent] Error:', error);

        return {
            id: taskId,
            contextId,
            status: {
                state: 'failed',
                message: {
                    role: 'agent',
                    parts: [{ text: 'Failed to fetch market data. Please try again.' }],
                },
            },
        };
    }
}
