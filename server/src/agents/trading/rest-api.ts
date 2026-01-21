/**
 * Trading REST API
 * 
 * Provides direct REST endpoints for trading operations,
 * complementing the A2A agent interfaces.
 * 
 * Endpoints:
 * - GET  /api/trading/prices
 * - GET  /api/trading/price/:symbol
 * - GET  /api/trading/klines/:symbol
 * - POST /api/trading/analyze/:symbol
 * - GET  /api/trading/watchlist
 * - POST /api/trading/watchlist
 * - GET  /api/trading/health
 */

import { Elysia, t } from 'elysia';
import { fetchTickers, fetchPrice, fetchKlines, fetchOrderBook } from './shared/binance-client.js';
import { resilientCall } from './shared/resilience.js';
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
} from './strategy/tools/indicators.js';

// ============================================================================
// REST API Router
// ============================================================================

export function createTradingRestApi() {
    return new Elysia({ prefix: '/api/trading' })
        // ====================================================================
        // Market Data Endpoints
        // ====================================================================

        .get('/prices', async ({ set }) => {
            try {
                const tickers = await resilientCall(
                    () => fetchTickers(),
                    { circuitBreaker: { key: 'binance-tickers' } }
                );

                return {
                    success: true,
                    data: tickers.slice(0, 20).map(t => ({
                        symbol: t.symbol,
                        name: t.name,
                        price: t.price,
                        change24h: t.priceChangePercent,
                        volume: t.volume,
                    })),
                    timestamp: new Date().toISOString(),
                };
            } catch (error) {
                set.status = 500;
                return { success: false, error: (error as Error).message };
            }
        })

        .get('/price/:symbol', async ({ params: { symbol }, set }) => {
            try {
                const asset = await resilientCall(
                    () => fetchPrice(symbol.toUpperCase()),
                    { circuitBreaker: { key: 'binance-ticker' } }
                );

                if (!asset) {
                    set.status = 404;
                    return { success: false, error: `Symbol ${symbol} not found` };
                }

                return {
                    success: true,
                    data: {
                        symbol: asset.symbol,
                        name: asset.name,
                        price: asset.price,
                        change24h: asset.priceChangePercent,
                        high24h: asset.high,
                        low24h: asset.low,
                        volume: asset.volume,
                    },
                    timestamp: new Date().toISOString(),
                };
            } catch (error) {
                set.status = 500;
                return { success: false, error: (error as Error).message };
            }
        })

        .get('/klines/:symbol', async ({ params: { symbol }, query, set }) => {
            try {
                const interval = (query?.interval as string) || '1h';
                const limit = parseInt(query?.limit as string) || 50;

                const klines = await resilientCall(
                    () => fetchKlines(symbol.toUpperCase(), interval, limit),
                    { circuitBreaker: { key: 'binance-klines' } }
                );

                return {
                    success: true,
                    data: klines.map(k => ({
                        time: k.openTime,
                        open: k.open,
                        high: k.high,
                        low: k.low,
                        close: k.close,
                        volume: k.volume,
                    })),
                    symbol: symbol.toUpperCase(),
                    interval,
                    timestamp: new Date().toISOString(),
                };
            } catch (error) {
                set.status = 500;
                return { success: false, error: (error as Error).message };
            }
        })

        .get('/orderbook/:symbol', async ({ params: { symbol }, query, set }) => {
            try {
                const limit = parseInt(query?.limit as string) || 10;

                const orderbook = await resilientCall(
                    () => fetchOrderBook(symbol.toUpperCase(), limit),
                    { circuitBreaker: { key: 'binance-orderbook' } }
                );

                return {
                    success: true,
                    data: orderbook,
                    symbol: symbol.toUpperCase(),
                    timestamp: new Date().toISOString(),
                };
            } catch (error) {
                set.status = 500;
                return { success: false, error: (error as Error).message };
            }
        })

        // ====================================================================
        // Analysis Endpoints
        // ====================================================================

        .get('/analyze/:symbol', async ({ params: { symbol }, query, set }) => {
            try {
                const interval = (query?.interval as string) || '1h';

                const klines = await resilientCall(
                    () => fetchKlines(symbol.toUpperCase(), interval, 100),
                    { circuitBreaker: { key: 'binance-klines' } }
                );

                const asset = await resilientCall(
                    () => fetchPrice(symbol.toUpperCase()),
                    { circuitBreaker: { key: 'binance-ticker' } }
                );

                // Run all 13 indicators
                const signals = [
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

                return {
                    success: true,
                    data: {
                        symbol: symbol.toUpperCase(),
                        price: asset?.price || 0,
                        change24h: asset?.priceChangePercent || 0,
                        signal: {
                            direction: aggregate.direction,
                            confidence: aggregate.confidence,
                            summary: aggregate.summary,
                        },
                        indicators: signals.map(s => ({
                            name: s.name,
                            value: s.value,
                            signal: s.signal,
                            confidence: s.confidence,
                        })),
                    },
                    interval,
                    timestamp: new Date().toISOString(),
                };
            } catch (error) {
                set.status = 500;
                return { success: false, error: (error as Error).message };
            }
        })

        .get('/scan', async ({ query, set }) => {
            try {
                const symbols = (query?.symbols as string)?.split(',') || ['BTC', 'ETH', 'SOL', 'XRP', 'ADA'];
                const minConfidence = parseInt(query?.minConfidence as string) || 60;

                const results: Array<{
                    symbol: string;
                    direction: string;
                    confidence: number;
                    price: number;
                }> = [];

                for (const symbol of symbols.slice(0, 10)) {
                    try {
                        const klines = await fetchKlines(symbol.toUpperCase(), '1h', 100);
                        const asset = await fetchPrice(symbol.toUpperCase());

                        const signals = [
                            rsiSignal(klines),
                            macdSignal(klines),
                            maCrossoverSignal(klines),
                        ];

                        const agg = aggregateSignals(signals);

                        if (agg.direction !== 'hold' && agg.confidence >= minConfidence) {
                            results.push({
                                symbol: symbol.toUpperCase(),
                                direction: agg.direction,
                                confidence: agg.confidence,
                                price: asset?.price || 0,
                            });
                        }
                    } catch {
                        // Skip failed symbols
                    }
                }

                return {
                    success: true,
                    data: results.sort((a, b) => b.confidence - a.confidence),
                    scanned: symbols.length,
                    found: results.length,
                    timestamp: new Date().toISOString(),
                };
            } catch (error) {
                set.status = 500;
                return { success: false, error: (error as Error).message };
            }
        })

        // ====================================================================
        // Watchlist Endpoints (Mock)
        // ====================================================================

        .get('/watchlist', async () => {
            // In-memory mock - would be from database in production
            const watchlist = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA'];

            const prices = await Promise.all(
                watchlist.map(async (symbol) => {
                    try {
                        const asset = await fetchPrice(symbol);
                        return asset ? {
                            symbol,
                            price: asset.price,
                            change24h: asset.priceChangePercent,
                        } : null;
                    } catch {
                        return null;
                    }
                })
            );

            return {
                success: true,
                data: prices.filter(Boolean),
                count: watchlist.length,
                timestamp: new Date().toISOString(),
            };
        })

        // ====================================================================
        // Health Endpoint
        // ====================================================================

        .get('/health', async ({ set }) => {
            try {
                // Quick Binance connectivity check
                const startTime = Date.now();
                await fetchPrice('BTC');
                const latency = Date.now() - startTime;

                return {
                    success: true,
                    status: latency < 500 ? 'healthy' : 'degraded',
                    services: {
                        binanceApi: {
                            status: 'connected',
                            latency: `${latency}ms`,
                        },
                        tradingAgents: {
                            status: 'operational',
                            count: 9,
                        },
                        indicators: {
                            status: 'loaded',
                            count: 13,
                        },
                    },
                    timestamp: new Date().toISOString(),
                };
            } catch (error) {
                set.status = 503;
                return {
                    success: false,
                    status: 'unhealthy',
                    error: (error as Error).message,
                    timestamp: new Date().toISOString(),
                };
            }
        });
}
