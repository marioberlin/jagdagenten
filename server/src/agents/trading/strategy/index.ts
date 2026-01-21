/**
 * StrategyAgent
 * 
 * A2A Agent for generating trading signals using technical indicators.
 * Implements 13 indicator tools: RSI, MACD, MA Crossover, Bollinger Bands,
 * Volume Spike, ADX, Stochastic, ATR, OBV, Ichimoku, HMA, Fibonacci, Fear&Greed.
 * 
 * Endpoints:
 * - A2A: POST /agents/strategy/a2a
 */

import type { AgentCard, A2UIMessage, SendMessageParams } from '../../../a2a/types.js';
import { randomUUID } from 'crypto';
import { fetchKlines, fetchPrice, getSymbolName } from '../shared/index.js';
import { resilientCall } from '../shared/resilience.js';
import type { TradingSignal, IndicatorResult, SignalDirection } from '../shared/types.js';
import {
    rsiSignal,
    macdSignal,
    maCrossoverSignal,
    bollingerSignal,
    volumeSpikeSignal,
    adxSignal,
    stochasticSignal,
    atrVolatilitySignal,
    obvSignal,
    ichimokuSignal,
    hmaSignal,
    fibonacciSignal,
    fearGreedSignal,
    aggregateSignals,
} from './tools/indicators.js';

// ============================================================================
// Agent Card
// ============================================================================

export const getStrategyAgentCard = (baseUrl: string): AgentCard => ({
    protocolVersions: ['1.0'],
    name: 'Strategy Agent',
    description: 'Generate AI-powered trading signals using technical analysis. Combines 13 indicators: RSI, MACD, MA Crossover, Bollinger Bands, Volume, ADX, Stochastic, ATR, OBV, Ichimoku, HMA, Fibonacci, and Fear & Greed for comprehensive market analysis.',
    version: '1.0.0',
    supportedInterfaces: [
        { url: `${baseUrl}/agents/strategy`, protocolBinding: 'JSONRPC' },
    ],
    capabilities: { streaming: false, pushNotifications: true },
    defaultInputModes: ['text/plain'],
    defaultOutputModes: ['text/plain', 'application/json'],
    skills: [
        {
            id: 'analyze',
            name: 'Full Analysis',
            description: 'Run all indicators on a symbol',
            tags: ['analyze', 'signals', 'indicators', 'technical'],
            examples: ['analyze BTC', 'full analysis ETH', 'signals for SOL'],
        },
        {
            id: 'rsi',
            name: 'RSI Signal',
            description: 'Check RSI overbought/oversold levels',
            tags: ['rsi', 'momentum', 'oversold', 'overbought'],
            examples: ['RSI for BTC', 'is ETH oversold?'],
        },
        {
            id: 'macd',
            name: 'MACD Signal',
            description: 'Check MACD crossovers and momentum',
            tags: ['macd', 'momentum', 'crossover'],
            examples: ['MACD signal BTC', 'check MACD ETH'],
        },
        {
            id: 'trend',
            name: 'Trend Analysis',
            description: 'Moving average crossover and ADX trend strength',
            tags: ['trend', 'ma', 'adx', 'direction'],
            examples: ['BTC trend', 'is ETH trending?'],
        },
        {
            id: 'volatility',
            name: 'Volatility Check',
            description: 'ATR and Bollinger Band volatility analysis',
            tags: ['volatility', 'atr', 'bollinger'],
            examples: ['BTC volatility', 'how volatile is SOL?'],
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

interface StrategyIntent {
    action: 'analyze' | 'rsi' | 'macd' | 'trend' | 'volatility' | 'help';
    symbol: string;
    interval: string;
}

function parseStrategyIntent(text: string): StrategyIntent {
    const lower = text.toLowerCase().trim();

    // Extract symbol
    const symbolMatch = lower.match(/\b(btc|eth|bnb|sol|xrp|ada|doge|dot|matic|shib|avax|link|ltc|uni|atom|near|apt|arb|op|pepe)\b/i);
    const symbol = symbolMatch ? symbolMatch[1].toUpperCase() : 'BTC';

    // Extract interval
    const intervalMatch = lower.match(/\b(1h|4h|1d|daily|hourly)\b/i);
    let interval = intervalMatch ? intervalMatch[1].toLowerCase() : '1h';
    if (interval === 'daily') interval = '1d';
    if (interval === 'hourly') interval = '1h';

    // Determine action
    if (lower.includes('rsi')) {
        return { action: 'rsi', symbol, interval };
    }
    if (lower.includes('macd')) {
        return { action: 'macd', symbol, interval };
    }
    if (lower.includes('trend') || lower.includes('direction') || lower.includes('trending')) {
        return { action: 'trend', symbol, interval };
    }
    if (lower.includes('volatil') || lower.includes('atr') || lower.includes('bollinger')) {
        return { action: 'volatility', symbol, interval };
    }
    if (lower.includes('analyze') || lower.includes('signal') || lower.includes('full') || symbolMatch) {
        return { action: 'analyze', symbol, interval };
    }

    return { action: 'help', symbol: 'BTC', interval: '1h' };
}

// ============================================================================
// Formatting Helpers
// ============================================================================

function formatPrice(price: number): string {
    if (price >= 1000) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(6)}`;
}

function signalEmoji(direction: SignalDirection): string {
    switch (direction) {
        case 'buy': return '🟢';
        case 'sell': return '🔴';
        default: return '🟡';
    }
}

function confidenceBar(confidence: number): string {
    const filled = Math.round(confidence / 10);
    return '█'.repeat(filled) + '░'.repeat(10 - filled);
}

// ============================================================================
// A2UI Generation
// ============================================================================

function generateAnalysisCard(
    symbol: string,
    price: number,
    signals: IndicatorResult[],
    aggregate: { direction: SignalDirection; confidence: number; summary: string }
): A2UIMessage[] {
    const signalComponents: Array<{ id: string; component: object }> = [];
    const signalIds: string[] = [];

    signals.forEach((sig, idx) => {
        const id = `sig-${idx}`;
        signalIds.push(id);

        signalComponents.push({
            id,
            component: { Row: { children: [`${id}-name`, `${id}-value`, `${id}-signal`] } },
        });
        signalComponents.push({
            id: `${id}-name`,
            component: { Text: { text: { literalString: sig.name }, variant: 'secondary' } },
        });
        signalComponents.push({
            id: `${id}-value`,
            component: { Text: { text: { literalString: typeof sig.value === 'number' ? sig.value.toFixed(2) : String(sig.value) } } },
        });
        signalComponents.push({
            id: `${id}-signal`,
            component: {
                Text: {
                    text: { literalString: `${signalEmoji(sig.signal)} ${sig.signal.toUpperCase()} (${sig.confidence}%)` },
                }
            },
        });
    });

    return [
        {
            type: 'beginRendering',
            surfaceId: `analysis-${symbol}`,
            rootComponentId: 'root',
            styling: { primaryColor: aggregate.direction === 'buy' ? '#10B981' : aggregate.direction === 'sell' ? '#EF4444' : '#F59E0B' },
        },
        {
            type: 'surfaceUpdate',
            surfaceId: `analysis-${symbol}`,
            components: [
                {
                    id: 'root',
                    component: { Column: { children: ['header', 'price', 'divider1', 'aggregate', 'confidence-bar', 'divider2', 'indicators-header', ...signalIds, 'actions'] } },
                },
                {
                    id: 'header',
                    component: { Text: { text: { literalString: `${getSymbolName(symbol)} (${symbol}) Analysis` }, semantic: 'h2' } },
                },
                {
                    id: 'price',
                    component: { Text: { text: { literalString: `Current Price: ${formatPrice(price)}` }, variant: 'secondary' } },
                },
                {
                    id: 'divider1',
                    component: { Divider: {} },
                },
                {
                    id: 'aggregate',
                    component: {
                        Text: {
                            text: { literalString: `${signalEmoji(aggregate.direction)} Overall Signal: ${aggregate.direction.toUpperCase()}` },
                            semantic: 'h3',
                        }
                    },
                },
                {
                    id: 'confidence-bar',
                    component: {
                        Text: {
                            text: { literalString: `Confidence: ${confidenceBar(aggregate.confidence)} ${aggregate.confidence}%` },
                            variant: 'secondary',
                        }
                    },
                },
                {
                    id: 'divider2',
                    component: { Divider: {} },
                },
                {
                    id: 'indicators-header',
                    component: { Text: { text: { literalString: 'Technical Indicators' }, semantic: 'h4' } },
                },
                ...signalComponents,
                {
                    id: 'actions',
                    component: {
                        Row: {
                            children: ['refresh-btn', 'trade-btn'],
                            alignment: 'center',
                        },
                    },
                },
                {
                    id: 'refresh-btn',
                    component: {
                        Button: {
                            label: { literalString: 'Refresh Analysis' },
                            action: { input: { text: `analyze ${symbol}` } },
                        },
                    },
                },
                {
                    id: 'trade-btn',
                    component: {
                        Button: {
                            label: { literalString: aggregate.direction === 'buy' ? `Buy ${symbol}` : aggregate.direction === 'sell' ? `Sell ${symbol}` : 'No Action' },
                            action: { input: { text: aggregate.direction !== 'hold' ? `${aggregate.direction} 0.1 ${symbol}` : `show positions` } },
                        },
                    },
                },
            ],
        },
    ];
}

// ============================================================================
// Request Handler
// ============================================================================

export async function handleStrategyRequest(params: SendMessageParams): Promise<any> {
    const taskId = randomUUID();
    const contextId = params.message.contextId || randomUUID();

    const textPart = params.message.parts.find((p: any) => 'text' in p || p.kind === 'text');
    const userText = textPart?.text || '';

    console.log(`[StrategyAgent] Processing: "${userText}"`);

    const intent = parseStrategyIntent(userText);
    console.log(`[StrategyAgent] Intent:`, intent);

    try {
        // Fetch market data
        const klines = await resilientCall(
            () => fetchKlines(intent.symbol, intent.interval, 100),
            { circuitBreaker: { key: 'binance-klines' } }
        );

        const asset = await resilientCall(
            () => fetchPrice(intent.symbol),
            { circuitBreaker: { key: 'binance-ticker' } }
        );

        const currentPrice = asset?.price || klines[klines.length - 1]?.close || 0;

        let signals: IndicatorResult[] = [];
        let responseText = '';
        let a2uiMessages: A2UIMessage[] = [];

        switch (intent.action) {
            case 'rsi': {
                const rsi = rsiSignal(klines);
                signals = [rsi];
                responseText = `${intent.symbol} RSI: ${rsi.value.toFixed(2)} → ${signalEmoji(rsi.signal)} ${rsi.signal.toUpperCase()} (${rsi.confidence}% confidence)`;
                break;
            }

            case 'macd': {
                const macd = macdSignal(klines);
                signals = [macd];
                const hist = (macd.metadata as any)?.histogram || 0;
                responseText = `${intent.symbol} MACD: ${macd.value.toFixed(4)} (Histogram: ${hist.toFixed(4)}) → ${signalEmoji(macd.signal)} ${macd.signal.toUpperCase()}`;
                break;
            }

            case 'trend': {
                const ma = maCrossoverSignal(klines);
                const adx = adxSignal(klines);
                signals = [ma, adx];
                const trendStrength = (adx.metadata as any)?.trendStrength || 'unknown';
                responseText = `${intent.symbol} Trend: ${ma.signal.toUpperCase()} (MA) with ${trendStrength} strength (ADX: ${adx.value.toFixed(2)})`;
                break;
            }

            case 'volatility': {
                const atr = atrVolatilitySignal(klines);
                const bb = bollingerSignal(klines);
                signals = [atr, bb];
                const volatilityLevel = (atr.metadata as any)?.volatilityLevel || 'normal';
                responseText = `${intent.symbol} Volatility: ${volatilityLevel.toUpperCase()} (ATR: ${formatPrice(atr.value)}, BB Width: ${(bb.value * 100).toFixed(2)}%)`;
                break;
            }

            case 'analyze':
            default: {
                // Run all 13 indicators
                signals = [
                    rsiSignal(klines),
                    macdSignal(klines),
                    maCrossoverSignal(klines),
                    bollingerSignal(klines),
                    volumeSpikeSignal(klines),
                    adxSignal(klines),
                    stochasticSignal(klines),
                    atrVolatilitySignal(klines),
                    obvSignal(klines),
                    ichimokuSignal(klines),
                    hmaSignal(klines),
                    fibonacciSignal(klines),
                    fearGreedSignal(klines),
                ];

                const aggregate = aggregateSignals(signals);

                responseText = `${getSymbolName(intent.symbol)} (${intent.symbol}) Analysis:\n` +
                    `${signalEmoji(aggregate.direction)} Overall: ${aggregate.direction.toUpperCase()} (${aggregate.confidence}% confidence)\n` +
                    `${aggregate.summary}`;

                a2uiMessages = generateAnalysisCard(intent.symbol, currentPrice, signals, aggregate);
                break;
            }

            case 'help':
                responseText = `🤖 Strategy Agent\n\nCommands:\n• "analyze BTC" - Full technical analysis\n• "RSI ETH" - Check RSI levels\n• "MACD SOL" - MACD crossover signals\n• "BTC trend" - Trend direction\n• "ETH volatility" - Volatility analysis`;
        }

        return {
            id: taskId,
            contextId,
            status: { state: 'completed' },
            artifacts: a2uiMessages.length > 0 ? [{
                artifactId: randomUUID(),
                name: 'strategy-analysis',
                parts: a2uiMessages.map(msg => ({ type: 'a2ui', ...msg })),
            }] : undefined,
            history: [
                params.message,
                { role: 'agent', parts: [{ text: responseText }] },
            ],
        };
    } catch (error) {
        console.error('[StrategyAgent] Error:', error);
        return {
            id: taskId,
            contextId,
            status: { state: 'failed' },
            history: [
                params.message,
                { role: 'agent', parts: [{ text: `Error analyzing ${intent.symbol}: ${(error as Error).message}` }] },
            ],
        };
    }
}
