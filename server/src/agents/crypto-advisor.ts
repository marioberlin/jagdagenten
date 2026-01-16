import type { AgentCard, A2UIMessage, SendMessageParams } from '../a2a/types.js';
import { randomUUID } from 'crypto';

// ============================================================================
// Crypto Data Types
// ============================================================================

interface CryptoAsset {
    symbol: string;
    name: string;
    price: number;
    priceChange: number;
    priceChangePercent: number;
    high24h: number;
    low24h: number;
    volume24h: number;
    quoteVolume24h: number;
    lastUpdated: string;
}

interface KlineData {
    openTime: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    closeTime: number;
}

interface TradingSignal {
    id: string;
    symbol: string;
    type: 'buy' | 'sell' | 'hold';
    confidence: number;
    entryPrice: number;
    targetPrice?: number;
    stopLoss?: number;
    reasoning: string;
    timestamp: string;
}

interface MarketAnalysis {
    sentiment: 'bullish' | 'bearish' | 'neutral';
    topGainers: CryptoAsset[];
    topLosers: CryptoAsset[];
    summary: string;
}

// Symbol to name mapping for common coins
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

// ============================================================================
// Binance API Integration (Public - No Auth Required)
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

interface BinanceKline {
    0: number;  // Open time
    1: string;  // Open
    2: string;  // High
    3: string;  // Low
    4: string;  // Close
    5: string;  // Volume
    6: number;  // Close time
    7: string;  // Quote asset volume
    8: number;  // Number of trades
    9: string;  // Taker buy base asset volume
    10: string; // Taker buy quote asset volume
    11: string; // Ignore
}

// Cache for market data
let marketCache: { data: CryptoAsset[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 30 * 1000; // 30 seconds

// Primary symbols to track
const PRIMARY_SYMBOLS = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
    'ADAUSDT', 'DOGEUSDT', 'DOTUSDT', 'MATICUSDT', 'AVAXUSDT',
    'LINKUSDT', 'LTCUSDT', 'UNIUSDT', 'ATOMUSDT', 'NEARUSDT',
    'APTUSDT', 'ARBUSDT', 'OPUSDT', 'PEPEUSDT', 'SHIBUSDT'
];

async function fetchBinance24hrTickers(): Promise<CryptoAsset[]> {
    try {
        // Fetch 24hr ticker data for all symbols
        const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');

        if (!response.ok) {
            throw new Error(`Binance API error: ${response.status}`);
        }

        const data = await response.json() as BinanceTicker24hr[];

        // Filter to USDT pairs and map to our format
        const usdtPairs = data.filter(t =>
            t.symbol.endsWith('USDT') &&
            PRIMARY_SYMBOLS.includes(t.symbol)
        );

        return usdtPairs.map(t => ({
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
    } catch (error) {
        console.error('[Crypto Advisor] Binance API error:', error);
        throw error;
    }
}

async function fetchKlines(symbol: string, interval: string = '1h', limit: number = 24): Promise<KlineData[]> {
    try {
        const response = await fetch(
            `https://api.binance.com/api/v3/klines?symbol=${symbol}USDT&interval=${interval}&limit=${limit}`
        );

        if (!response.ok) {
            throw new Error(`Binance Klines API error: ${response.status}`);
        }

        const data = await response.json() as BinanceKline[];

        return data.map(k => ({
            openTime: k[0],
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5]),
            closeTime: k[6],
        }));
    } catch (error) {
        console.error('[Crypto Advisor] Klines API error:', error);
        throw error;
    }
}

async function getMarketData(): Promise<CryptoAsset[]> {
    const now = Date.now();

    if (marketCache && now - marketCache.timestamp < CACHE_TTL_MS) {
        return marketCache.data;
    }

    const data = await fetchBinance24hrTickers();
    marketCache = { data, timestamp: now };
    return data;
}

// ============================================================================
// Gemini AI Integration
// ============================================================================

async function generateAIAnalysis(assets: CryptoAsset[], klines?: KlineData[]): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        // Return a basic analysis without AI
        const btc = assets.find(a => a.symbol === 'BTC');
        const sentiment = btc && btc.priceChangePercent > 0 ? 'bullish' : 'bearish';
        return `Market is showing ${sentiment} momentum. BTC ${btc ? (btc.priceChangePercent > 0 ? '+' : '') + btc.priceChangePercent.toFixed(2) + '%' : 'data unavailable'}. Monitor key support and resistance levels.`;
    }

    try {
        const topAssets = assets.slice(0, 5);
        const prompt = `You are a crypto market analyst. Analyze this market data and provide a brief 2-3 sentence summary:

Top Assets:
${topAssets.map(a => `${a.symbol}: $${a.price.toLocaleString()} (${a.priceChangePercent > 0 ? '+' : ''}${a.priceChangePercent.toFixed(2)}%)`).join('\n')}

${klines ? `Recent BTC price action (last 24h): High $${Math.max(...klines.map(k => k.high)).toLocaleString()}, Low $${Math.min(...klines.map(k => k.low)).toLocaleString()}` : ''}

Provide actionable insights in 2-3 sentences. Be concise and specific.`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { maxOutputTokens: 150, temperature: 0.7 }
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const result = await response.json();
        return result.candidates?.[0]?.content?.parts?.[0]?.text ||
            'Market analysis unavailable. Please try again later.';
    } catch (error) {
        console.error('[Crypto Advisor] Gemini API error:', error);
        return 'AI analysis temporarily unavailable. Check market data for insights.';
    }
}

async function generateTradingSignal(asset: CryptoAsset, klines: KlineData[]): Promise<TradingSignal> {
    const apiKey = process.env.GEMINI_API_KEY;

    // Calculate basic technical indicators
    const closes = klines.map(k => k.close);
    const recentHigh = Math.max(...closes.slice(-12));
    const recentLow = Math.min(...closes.slice(-12));
    const avgVolume = klines.reduce((sum, k) => sum + k.volume, 0) / klines.length;
    const currentVolume = klines[klines.length - 1]?.volume || avgVolume;
    const volumeRatio = currentVolume / avgVolume;

    // Simple RSI calculation (14-period approximation)
    let gains = 0, losses = 0;
    for (let i = 1; i < Math.min(15, closes.length); i++) {
        const change = closes[i] - closes[i - 1];
        if (change > 0) gains += change;
        else losses -= change;
    }
    const avgGain = gains / 14;
    const avgLoss = losses / 14;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    // Determine signal based on technicals
    let signalType: 'buy' | 'sell' | 'hold' = 'hold';
    let confidence = 50;
    let reasoning = '';

    if (rsi < 30 && asset.priceChangePercent < -5) {
        signalType = 'buy';
        confidence = 65 + Math.min(20, Math.abs(asset.priceChangePercent));
        reasoning = `Oversold conditions (RSI: ${rsi.toFixed(0)}). Price dropped ${Math.abs(asset.priceChangePercent).toFixed(1)}% - potential bounce opportunity.`;
    } else if (rsi > 70 && asset.priceChangePercent > 5) {
        signalType = 'sell';
        confidence = 60 + Math.min(20, asset.priceChangePercent);
        reasoning = `Overbought conditions (RSI: ${rsi.toFixed(0)}). Consider taking profits after ${asset.priceChangePercent.toFixed(1)}% gain.`;
    } else if (asset.price > recentHigh * 0.98 && volumeRatio > 1.5) {
        signalType = 'buy';
        confidence = 70;
        reasoning = `Breaking resistance with ${(volumeRatio * 100 - 100).toFixed(0)}% above average volume. Momentum building.`;
    } else if (asset.price < recentLow * 1.02 && volumeRatio > 1.5) {
        signalType = 'sell';
        confidence = 65;
        reasoning = `Breaking support with high volume. Consider stop-loss or exit positions.`;
    } else {
        reasoning = `Consolidating between $${recentLow.toLocaleString()} - $${recentHigh.toLocaleString()}. Wait for breakout confirmation.`;
    }

    // If Gemini is available, enhance the reasoning
    if (apiKey) {
        try {
            const prompt = `You are a crypto trading analyst. Given this data for ${asset.name} (${asset.symbol}):
- Price: $${asset.price.toLocaleString()}
- 24h Change: ${asset.priceChangePercent > 0 ? '+' : ''}${asset.priceChangePercent.toFixed(2)}%
- RSI (approx): ${rsi.toFixed(0)}
- Volume ratio: ${volumeRatio.toFixed(2)}x average
- Signal: ${signalType.toUpperCase()} (${confidence}% confidence)

Provide a brief 1-2 sentence enhanced analysis. Be specific about price levels.`;

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { maxOutputTokens: 100, temperature: 0.7 }
                    })
                }
            );

            if (response.ok) {
                const result = await response.json();
                const aiReasoning = result.candidates?.[0]?.content?.parts?.[0]?.text;
                if (aiReasoning) {
                    reasoning = aiReasoning;
                }
            }
        } catch {
            // Keep the basic reasoning
        }
    }

    // Calculate target and stop loss
    const targetMultiplier = signalType === 'buy' ? 1.08 : 0.92;
    const stopMultiplier = signalType === 'buy' ? 0.95 : 1.05;

    return {
        id: randomUUID(),
        symbol: asset.symbol,
        type: signalType,
        confidence: Math.round(confidence),
        entryPrice: asset.price,
        targetPrice: signalType !== 'hold' ? asset.price * targetMultiplier : undefined,
        stopLoss: signalType !== 'hold' ? asset.price * stopMultiplier : undefined,
        reasoning,
        timestamp: new Date().toISOString(),
    };
}

// ============================================================================
// A2UI Generation
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

function generateMarketDashboard(assets: CryptoAsset[], analysis: string): A2UIMessage[] {
    const topAssets = assets
        .sort((a, b) => b.quoteVolume24h - a.quoteVolume24h)
        .slice(0, 4);

    const topGainers = [...assets]
        .sort((a, b) => b.priceChangePercent - a.priceChangePercent)
        .slice(0, 3);

    const topLosers = [...assets]
        .sort((a, b) => a.priceChangePercent - b.priceChangePercent)
        .slice(0, 3);

    const totalVolume = assets.reduce((sum, a) => sum + a.quoteVolume24h, 0);
    const btc = assets.find(a => a.symbol === 'BTC');
    const btcDominance = btc ? ((btc.quoteVolume24h / totalVolume) * 100).toFixed(1) : '50';

    // Build asset cards dynamically
    const assetCardIds: string[] = [];
    const assetComponents: Array<{ id: string; component: object }> = [];

    topAssets.forEach((asset, idx) => {
        const cardId = `asset-${idx}`;
        assetCardIds.push(cardId);

        assetComponents.push(
            {
                id: cardId,
                component: {
                    Card: {
                        children: [`asset-${idx}-symbol`, `asset-${idx}-price`, `asset-${idx}-change`],
                    },
                },
            },
            {
                id: `asset-${idx}-symbol`,
                component: {
                    Text: {
                        text: { literalString: asset.symbol },
                        semantic: 'h4',
                    },
                },
            },
            {
                id: `asset-${idx}-price`,
                component: {
                    Text: {
                        text: { literalString: formatPrice(asset.price) },
                        semantic: 'h3',
                    },
                },
            },
            {
                id: `asset-${idx}-change`,
                component: {
                    Text: {
                        text: { literalString: formatChange(asset.priceChangePercent) },
                        variant: asset.priceChangePercent >= 0 ? 'default' : 'secondary',
                    },
                },
            }
        );
    });

    return [
        {
            type: 'beginRendering',
            surfaceId: 'market-dashboard',
            rootComponentId: 'root',
            styling: { primaryColor: '#F7931A', fontFamily: 'Inter, system-ui, sans-serif' },
        },
        {
            type: 'surfaceUpdate',
            surfaceId: 'market-dashboard',
            components: [
                {
                    id: 'root',
                    component: {
                        Column: {
                            children: ['header', 'live-indicator', 'assets-row', 'stats-row', 'movers-row', 'analysis-section', 'actions'],
                        },
                    },
                },
                {
                    id: 'header',
                    component: {
                        Text: {
                            text: { literalString: 'Crypto Market Overview' },
                            semantic: 'h2',
                        },
                    },
                },
                {
                    id: 'live-indicator',
                    component: {
                        Text: {
                            text: { literalString: '🔴 Live • Binance Data' },
                            variant: 'secondary',
                        },
                    },
                },
                {
                    id: 'assets-row',
                    component: {
                        Row: {
                            children: assetCardIds,
                        },
                    },
                },
                ...assetComponents,
                {
                    id: 'stats-row',
                    component: {
                        Row: {
                            children: ['vol-col', 'dom-col'],
                        },
                    },
                },
                {
                    id: 'vol-col',
                    component: {
                        Column: {
                            children: ['vol-label', 'vol-value'],
                        },
                    },
                },
                {
                    id: 'vol-label',
                    component: { Text: { text: { literalString: '24h Volume' }, variant: 'secondary' } },
                },
                {
                    id: 'vol-value',
                    component: { Text: { text: { literalString: formatVolume(totalVolume) }, semantic: 'h4' } },
                },
                {
                    id: 'dom-col',
                    component: {
                        Column: {
                            children: ['dom-label', 'dom-value'],
                        },
                    },
                },
                {
                    id: 'dom-label',
                    component: { Text: { text: { literalString: 'BTC Volume Share' }, variant: 'secondary' } },
                },
                {
                    id: 'dom-value',
                    component: { Text: { text: { literalString: `${btcDominance}%` }, semantic: 'h4' } },
                },
                {
                    id: 'movers-row',
                    component: {
                        Row: {
                            children: ['gainers-col', 'losers-col'],
                        },
                    },
                },
                {
                    id: 'gainers-col',
                    component: {
                        Column: {
                            children: ['gainers-title', 'gainer-1', 'gainer-2', 'gainer-3'],
                        },
                    },
                },
                {
                    id: 'gainers-title',
                    component: { Text: { text: { literalString: '🚀 Top Gainers' }, semantic: 'h4' } },
                },
                {
                    id: 'gainer-1',
                    component: { Text: { text: { literalString: `${topGainers[0]?.symbol} ${formatChange(topGainers[0]?.priceChangePercent || 0)}` } } },
                },
                {
                    id: 'gainer-2',
                    component: { Text: { text: { literalString: `${topGainers[1]?.symbol} ${formatChange(topGainers[1]?.priceChangePercent || 0)}` } } },
                },
                {
                    id: 'gainer-3',
                    component: { Text: { text: { literalString: `${topGainers[2]?.symbol} ${formatChange(topGainers[2]?.priceChangePercent || 0)}` } } },
                },
                {
                    id: 'losers-col',
                    component: {
                        Column: {
                            children: ['losers-title', 'loser-1', 'loser-2', 'loser-3'],
                        },
                    },
                },
                {
                    id: 'losers-title',
                    component: { Text: { text: { literalString: '📉 Top Losers' }, semantic: 'h4' } },
                },
                {
                    id: 'loser-1',
                    component: { Text: { text: { literalString: `${topLosers[0]?.symbol} ${formatChange(topLosers[0]?.priceChangePercent || 0)}` } } },
                },
                {
                    id: 'loser-2',
                    component: { Text: { text: { literalString: `${topLosers[1]?.symbol} ${formatChange(topLosers[1]?.priceChangePercent || 0)}` } } },
                },
                {
                    id: 'loser-3',
                    component: { Text: { text: { literalString: `${topLosers[2]?.symbol} ${formatChange(topLosers[2]?.priceChangePercent || 0)}` } } },
                },
                {
                    id: 'analysis-section',
                    component: {
                        Card: {
                            children: ['analysis-title', 'analysis-text'],
                        },
                    },
                },
                {
                    id: 'analysis-title',
                    component: { Text: { text: { literalString: '🤖 AI Analysis' }, semantic: 'h4' } },
                },
                {
                    id: 'analysis-text',
                    component: { Text: { text: { literalString: analysis } } },
                },
                {
                    id: 'actions',
                    component: {
                        Row: {
                            children: ['signals-btn', 'analyze-btn', 'refresh-btn'],
                            alignment: 'center',
                        },
                    },
                },
                {
                    id: 'signals-btn',
                    component: {
                        Button: {
                            label: { literalString: 'View Signals' },
                            action: { input: { text: 'show trading signals' } },
                        },
                    },
                },
                {
                    id: 'analyze-btn',
                    component: {
                        Button: {
                            label: { literalString: 'Analyze Asset' },
                            action: { input: { text: 'analyze BTC' } },
                        },
                    },
                },
                {
                    id: 'refresh-btn',
                    component: {
                        Button: {
                            label: { literalString: 'Refresh' },
                            action: { input: { text: 'show market' } },
                        },
                    },
                },
            ],
        },
    ];
}

function generateSignalsList(signals: TradingSignal[]): A2UIMessage[] {
    const signalComponents: Array<{ id: string; component: object }> = [];
    const signalCardIds: string[] = [];

    signals.forEach((signal, idx) => {
        const cardId = `signal-${idx}`;
        signalCardIds.push(cardId);

        const emoji = signal.type === 'buy' ? '🟢' : signal.type === 'sell' ? '🔴' : '🟡';
        const typeLabel = signal.type.toUpperCase();

        signalComponents.push(
            {
                id: cardId,
                component: {
                    Card: {
                        children: [`sig-${idx}-header`, `sig-${idx}-prices`, `sig-${idx}-reasoning`, `sig-${idx}-action`],
                    },
                },
            },
            {
                id: `sig-${idx}-header`,
                component: {
                    Row: {
                        children: [`sig-${idx}-type`, `sig-${idx}-confidence`],
                    },
                },
            },
            {
                id: `sig-${idx}-type`,
                component: {
                    Text: {
                        text: { literalString: `${emoji} ${typeLabel} ${signal.symbol}/USDT` },
                        semantic: 'h3',
                    },
                },
            },
            {
                id: `sig-${idx}-confidence`,
                component: {
                    Text: {
                        text: { literalString: `Confidence: ${signal.confidence}%` },
                        variant: 'secondary',
                    },
                },
            },
            {
                id: `sig-${idx}-prices`,
                component: {
                    Row: {
                        children: [`sig-${idx}-entry`, `sig-${idx}-target`, `sig-${idx}-stop`],
                    },
                },
            },
            {
                id: `sig-${idx}-entry`,
                component: {
                    Text: {
                        text: { literalString: `Entry: ${formatPrice(signal.entryPrice)}` },
                        variant: 'secondary',
                    },
                },
            },
            {
                id: `sig-${idx}-target`,
                component: {
                    Text: {
                        text: { literalString: signal.targetPrice ? `Target: ${formatPrice(signal.targetPrice)}` : '' },
                        variant: 'secondary',
                    },
                },
            },
            {
                id: `sig-${idx}-stop`,
                component: {
                    Text: {
                        text: { literalString: signal.stopLoss ? `Stop: ${formatPrice(signal.stopLoss)}` : '' },
                        variant: 'secondary',
                    },
                },
            },
            {
                id: `sig-${idx}-reasoning`,
                component: {
                    Text: {
                        text: { literalString: signal.reasoning },
                    },
                },
            },
            {
                id: `sig-${idx}-action`,
                component: {
                    Button: {
                        label: { literalString: 'View Chart' },
                        action: { input: { text: `analyze ${signal.symbol}` } },
                    },
                },
            }
        );
    });

    return [
        {
            type: 'beginRendering',
            surfaceId: 'signals-list',
            rootComponentId: 'root',
            styling: { primaryColor: '#10B981', fontFamily: 'Inter, system-ui, sans-serif' },
        },
        {
            type: 'surfaceUpdate',
            surfaceId: 'signals-list',
            components: [
                {
                    id: 'root',
                    component: {
                        Column: {
                            children: ['header', 'subtitle', ...signalCardIds, 'disclaimer', 'actions'],
                        },
                    },
                },
                {
                    id: 'header',
                    component: {
                        Text: {
                            text: { literalString: 'AI Trading Signals' },
                            semantic: 'h2',
                        },
                    },
                },
                {
                    id: 'subtitle',
                    component: {
                        Text: {
                            text: { literalString: 'Powered by Binance data + Gemini AI' },
                            variant: 'secondary',
                        },
                    },
                },
                ...signalComponents,
                {
                    id: 'disclaimer',
                    component: {
                        Text: {
                            text: { literalString: '⚠️ Disclaimer: AI analysis is not financial advice. Always do your own research.' },
                            variant: 'secondary',
                        },
                    },
                },
                {
                    id: 'actions',
                    component: {
                        Row: {
                            children: ['market-btn', 'refresh-btn'],
                            alignment: 'center',
                        },
                    },
                },
                {
                    id: 'market-btn',
                    component: {
                        Button: {
                            label: { literalString: 'Market Overview' },
                            action: { input: { text: 'show market' } },
                        },
                    },
                },
                {
                    id: 'refresh-btn',
                    component: {
                        Button: {
                            label: { literalString: 'Refresh Signals' },
                            action: { input: { text: 'show signals' } },
                        },
                    },
                },
            ],
        },
    ];
}

function generateAssetAnalysis(asset: CryptoAsset, klines: KlineData[], signal: TradingSignal): A2UIMessage[] {
    const high24h = Math.max(...klines.map(k => k.high));
    const low24h = Math.min(...klines.map(k => k.low));

    // Generate simple ASCII chart representation
    const chartPoints = klines.slice(-12).map(k => k.close);
    const chartMin = Math.min(...chartPoints);
    const chartMax = Math.max(...chartPoints);

    return [
        {
            type: 'beginRendering',
            surfaceId: 'asset-analysis',
            rootComponentId: 'root',
            styling: { primaryColor: '#6366F1', fontFamily: 'Inter, system-ui, sans-serif' },
        },
        {
            type: 'surfaceUpdate',
            surfaceId: 'asset-analysis',
            components: [
                {
                    id: 'root',
                    component: {
                        Column: {
                            children: ['header', 'price-section', 'stats-section', 'signal-card', 'actions'],
                        },
                    },
                },
                {
                    id: 'header',
                    component: {
                        Row: {
                            children: ['asset-name', 'asset-symbol'],
                        },
                    },
                },
                {
                    id: 'asset-name',
                    component: {
                        Text: {
                            text: { literalString: asset.name },
                            semantic: 'h2',
                        },
                    },
                },
                {
                    id: 'asset-symbol',
                    component: {
                        Text: {
                            text: { literalString: ` (${asset.symbol}/USDT)` },
                            variant: 'secondary',
                        },
                    },
                },
                {
                    id: 'price-section',
                    component: {
                        Card: {
                            children: ['current-price', 'price-change', 'high-low'],
                        },
                    },
                },
                {
                    id: 'current-price',
                    component: {
                        Text: {
                            text: { literalString: formatPrice(asset.price) },
                            semantic: 'h1',
                        },
                    },
                },
                {
                    id: 'price-change',
                    component: {
                        Text: {
                            text: { literalString: `${formatChange(asset.priceChangePercent)} (24h)` },
                        },
                    },
                },
                {
                    id: 'high-low',
                    component: {
                        Row: {
                            children: ['high-label', 'low-label'],
                        },
                    },
                },
                {
                    id: 'high-label',
                    component: {
                        Text: {
                            text: { literalString: `24h High: ${formatPrice(high24h)}` },
                            variant: 'secondary',
                        },
                    },
                },
                {
                    id: 'low-label',
                    component: {
                        Text: {
                            text: { literalString: `24h Low: ${formatPrice(low24h)}` },
                            variant: 'secondary',
                        },
                    },
                },
                {
                    id: 'stats-section',
                    component: {
                        Row: {
                            children: ['volume-col', 'range-col'],
                        },
                    },
                },
                {
                    id: 'volume-col',
                    component: {
                        Column: {
                            children: ['vol-label', 'vol-value'],
                        },
                    },
                },
                {
                    id: 'vol-label',
                    component: { Text: { text: { literalString: '24h Volume' }, variant: 'secondary' } },
                },
                {
                    id: 'vol-value',
                    component: { Text: { text: { literalString: formatVolume(asset.quoteVolume24h) }, semantic: 'h4' } },
                },
                {
                    id: 'range-col',
                    component: {
                        Column: {
                            children: ['range-label', 'range-value'],
                        },
                    },
                },
                {
                    id: 'range-label',
                    component: { Text: { text: { literalString: '24h Range' }, variant: 'secondary' } },
                },
                {
                    id: 'range-value',
                    component: { Text: { text: { literalString: `${(((chartMax - chartMin) / chartMin) * 100).toFixed(1)}%` }, semantic: 'h4' } },
                },
                {
                    id: 'signal-card',
                    component: {
                        Card: {
                            children: ['signal-header', 'signal-details', 'signal-reasoning'],
                        },
                    },
                },
                {
                    id: 'signal-header',
                    component: {
                        Text: {
                            text: { literalString: `🤖 AI Signal: ${signal.type.toUpperCase()} (${signal.confidence}% confidence)` },
                            semantic: 'h3',
                        },
                    },
                },
                {
                    id: 'signal-details',
                    component: {
                        Row: {
                            children: ['entry-text', 'target-text', 'stop-text'],
                        },
                    },
                },
                {
                    id: 'entry-text',
                    component: {
                        Text: {
                            text: { literalString: `Entry: ${formatPrice(signal.entryPrice)}` },
                            variant: 'secondary',
                        },
                    },
                },
                {
                    id: 'target-text',
                    component: {
                        Text: {
                            text: { literalString: signal.targetPrice ? `Target: ${formatPrice(signal.targetPrice)}` : '' },
                            variant: 'secondary',
                        },
                    },
                },
                {
                    id: 'stop-text',
                    component: {
                        Text: {
                            text: { literalString: signal.stopLoss ? `Stop: ${formatPrice(signal.stopLoss)}` : '' },
                            variant: 'secondary',
                        },
                    },
                },
                {
                    id: 'signal-reasoning',
                    component: {
                        Text: {
                            text: { literalString: signal.reasoning },
                        },
                    },
                },
                {
                    id: 'actions',
                    component: {
                        Row: {
                            children: ['signals-btn', 'market-btn', 'back-btn'],
                            alignment: 'center',
                        },
                    },
                },
                {
                    id: 'signals-btn',
                    component: {
                        Button: {
                            label: { literalString: 'All Signals' },
                            action: { input: { text: 'show signals' } },
                        },
                    },
                },
                {
                    id: 'market-btn',
                    component: {
                        Button: {
                            label: { literalString: 'Market Overview' },
                            action: { input: { text: 'show market' } },
                        },
                    },
                },
                {
                    id: 'back-btn',
                    component: {
                        Button: {
                            label: { literalString: 'Refresh' },
                            action: { input: { text: `analyze ${asset.symbol}` } },
                        },
                    },
                },
            ],
        },
    ];
}

function generatePriceView(asset: CryptoAsset): A2UIMessage[] {
    return [
        {
            type: 'beginRendering',
            surfaceId: 'price-view',
            rootComponentId: 'root',
            styling: { primaryColor: '#F7931A' },
        },
        {
            type: 'surfaceUpdate',
            surfaceId: 'price-view',
            components: [
                {
                    id: 'root',
                    component: {
                        Card: {
                            children: ['name', 'price', 'change', 'actions'],
                        },
                    },
                },
                {
                    id: 'name',
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
                            semantic: 'h1',
                        },
                    },
                },
                {
                    id: 'change',
                    component: {
                        Text: {
                            text: { literalString: `${formatChange(asset.priceChangePercent)} (24h)` },
                        },
                    },
                },
                {
                    id: 'actions',
                    component: {
                        Row: {
                            children: ['analyze-btn', 'market-btn'],
                        },
                    },
                },
                {
                    id: 'analyze-btn',
                    component: {
                        Button: {
                            label: { literalString: 'Full Analysis' },
                            action: { input: { text: `analyze ${asset.symbol}` } },
                        },
                    },
                },
                {
                    id: 'market-btn',
                    component: {
                        Button: {
                            label: { literalString: 'Market Overview' },
                            action: { input: { text: 'show market' } },
                        },
                    },
                },
            ],
        },
    ];
}

// ============================================================================
// Agent Card & Handler
// ============================================================================

export const getCryptoAdvisorAgentCard = (baseUrl: string): AgentCard => ({
    protocolVersions: ['1.0'],
    name: 'Crypto Advisor',
    description: 'Real-time cryptocurrency market analysis, portfolio tracking, and AI-powered trading signals using Binance data and Gemini AI.',
    version: '1.0.0',
    supportedInterfaces: [
        { url: `${baseUrl}/agents/crypto-advisor`, protocolBinding: 'JSONRPC' },
    ],
    capabilities: { streaming: true, pushNotifications: true },
    defaultInputModes: ['text/plain'],
    defaultOutputModes: ['text/plain', 'application/json'],
    skills: [
        {
            id: 'market-analysis',
            name: 'Market Analysis',
            description: 'Analyze cryptocurrency market trends and provide insights',
            tags: ['crypto', 'market', 'analysis', 'trading'],
            examples: ['Analyze BTC market', 'What is the ETH trend?'],
        },
        {
            id: 'portfolio-tracking',
            name: 'Portfolio Tracking',
            description: 'Track and manage cryptocurrency portfolios',
            tags: ['portfolio', 'tracking', 'holdings'],
            examples: ['Show my portfolio', 'Track my holdings'],
        },
        {
            id: 'trading-signals',
            name: 'Trading Signals',
            description: 'AI-powered trading signals and recommendations',
            tags: ['trading', 'signals', 'AI', 'recommendations'],
            examples: ['Get trading signals', 'Should I buy or sell?'],
        },
    ],
    provider: { organization: 'LiquidCrypto Labs' },
    extensions: {
        a2ui: { version: '0.8', supportedComponents: ['Card', 'List', 'Button', 'Text', 'Row', 'Column', 'Divider'] },
    },
});

export async function handleCryptoAdvisorRequest(params: SendMessageParams): Promise<any> {
    const taskId = randomUUID();

    try {
        // Extract prompt from message
        const prompt = params?.message?.parts
            // @ts-ignore
            ?.filter(p => p.type === 'text')
            .map((p: any) => p.text)
            .join(' ')
            .toLowerCase() || '';

        let a2uiMessages: A2UIMessage[];
        let textResponse: string;

        // Get market data
        const assets = await getMarketData();

        // Intent matching
        if (prompt.includes('signal') || prompt.includes('signals')) {
            // Generate signals for top assets
            const signalAssets = assets.slice(0, 5);
            const signals: TradingSignal[] = [];

            for (const asset of signalAssets) {
                try {
                    const klines = await fetchKlines(asset.symbol);
                    const signal = await generateTradingSignal(asset, klines);
                    signals.push(signal);
                } catch {
                    // Skip failed assets
                }
            }

            a2uiMessages = generateSignalsList(signals);
            textResponse = `Generated ${signals.length} AI trading signals based on current market conditions.`;

        } else if (prompt.includes('analyze') || prompt.includes('analysis')) {
            // Extract symbol from prompt
            const symbolMatch = prompt.match(/analyze\s+(\w+)/i) || prompt.match(/(\w{3,5})/);
            const symbol = symbolMatch?.[1]?.toUpperCase() || 'BTC';

            const asset = assets.find(a => a.symbol === symbol) || assets[0];
            const klines = await fetchKlines(asset.symbol);
            const signal = await generateTradingSignal(asset, klines);

            a2uiMessages = generateAssetAnalysis(asset, klines, signal);
            textResponse = `Analysis for ${asset.name}: Currently at ${formatPrice(asset.price)} (${formatChange(asset.priceChangePercent)} 24h).`;

        } else if (prompt.includes('price')) {
            // Extract symbol
            const symbolMatch = prompt.match(/price\s+(?:of\s+)?(\w+)/i) || prompt.match(/(\w{3,5})\s+price/i);
            const symbol = symbolMatch?.[1]?.toUpperCase() || 'BTC';

            const asset = assets.find(a => a.symbol === symbol) || assets[0];
            a2uiMessages = generatePriceView(asset);
            textResponse = `${asset.name} is currently at ${formatPrice(asset.price)} (${formatChange(asset.priceChangePercent)} 24h).`;

        } else if (prompt.includes('gainer') || prompt.includes('top')) {
            const topGainers = [...assets].sort((a, b) => b.priceChangePercent - a.priceChangePercent).slice(0, 5);
            const analysis = await generateAIAnalysis(topGainers);
            a2uiMessages = generateMarketDashboard(assets, analysis);
            textResponse = `Top gainers: ${topGainers.map(a => `${a.symbol} ${formatChange(a.priceChangePercent)}`).join(', ')}`;

        } else if (prompt.includes('loser') || prompt.includes('worst')) {
            const topLosers = [...assets].sort((a, b) => a.priceChangePercent - b.priceChangePercent).slice(0, 5);
            const analysis = await generateAIAnalysis(topLosers);
            a2uiMessages = generateMarketDashboard(assets, analysis);
            textResponse = `Top losers: ${topLosers.map(a => `${a.symbol} ${formatChange(a.priceChangePercent)}`).join(', ')}`;

        } else {
            // Default: Market overview
            const analysis = await generateAIAnalysis(assets);
            a2uiMessages = generateMarketDashboard(assets, analysis);
            const btc = assets.find(a => a.symbol === 'BTC');
            textResponse = `Market overview: BTC at ${formatPrice(btc?.price || 0)} (${formatChange(btc?.priceChangePercent || 0)}). ${assets.filter(a => a.priceChangePercent > 0).length}/${assets.length} assets in green.`;
        }

        return {
            id: taskId,
            contextId: 'crypto-advisor-context',
            status: { state: 'completed', timestamp: new Date().toISOString() },
            artifacts: [
                {
                    name: 'response',
                    parts: [
                        { type: 'text', text: textResponse },
                        { type: 'a2ui' as const, a2ui: a2uiMessages }
                    ]
                }
            ],
            history: []
        };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        console.error('[Crypto Advisor] Error:', errorMessage);

        return {
            id: taskId,
            contextId: 'crypto-advisor-context',
            status: { state: 'failed', timestamp: new Date().toISOString() },
            artifacts: [
                {
                    name: 'error',
                    parts: [
                        { type: 'text', text: `Error: ${errorMessage}. Please try again.` }
                    ]
                }
            ],
            history: []
        };
    }
}
