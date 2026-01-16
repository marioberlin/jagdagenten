#!/usr/bin/env node
/**
 * RSI Filter Optimizer for BTC/USDT Buy-the-Dip Strategy
 * 
 * Tests different RSI thresholds to find the optimal filter value
 * that maximizes net P&L while maintaining a healthy win rate.
 */

const https = require('https');

// =============================================================================
// CONFIGURATION
// =============================================================================

const Config = {
    CAPITAL: 100_000,
    POSITION_SIZE: 20_000,
    MAX_POSITIONS: 5,
    DROP_TRIGGER: 3_000,
    PROFIT_TARGET: 1_500,
    STOP_LOSS_PCT: 5.0,
    RSI_PERIOD: 14,
    SYMBOL: 'BTCUSDT',
    INTERVAL: '1d',
    DEFAULT_START: '2025-09-01',
    DEFAULT_END: '2026-01-05',
};

// RSI values to test
const RSI_TEST_VALUES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

// =============================================================================
// DATA FETCHING
// =============================================================================

function fetchBinanceKlines(symbol, interval, startDate, endDate) {
    return new Promise((resolve, reject) => {
        const startMs = new Date(startDate).getTime();
        const endMs = new Date(endDate).getTime() + 86400000;

        const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&startTime=${startMs}&endTime=${endMs}&limit=1000`;

        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const rawData = JSON.parse(data);
                    if (rawData.code) {
                        reject(new Error(`Binance API Error: ${rawData.msg}`));
                        return;
                    }
                    const candles = rawData.map(k => ({
                        timestamp: k[0],
                        date: new Date(k[0]).toISOString().split('T')[0],
                        open: parseFloat(k[1]),
                        high: parseFloat(k[2]),
                        low: parseFloat(k[3]),
                        close: parseFloat(k[4]),
                        volume: parseFloat(k[5]),
                    }));
                    resolve(candles);
                } catch (e) {
                    reject(new Error(`Failed to parse response: ${e.message}`));
                }
            });
        }).on('error', (e) => {
            reject(new Error(`Request failed: ${e.message}`));
        });
    });
}

// =============================================================================
// TECHNICAL INDICATORS
// =============================================================================

function calculateRSI(data, period, endIndex) {
    if (endIndex < period) return 50.0;

    const gains = [];
    const losses = [];

    for (let i = endIndex - period + 1; i <= endIndex; i++) {
        if (i > 0) {
            const change = data[i].close - data[i - 1].close;
            gains.push(Math.max(0, change));
            losses.push(Math.max(0, -change));
        }
    }

    const avgGain = gains.reduce((a, b) => a + b, 0) / gains.length;
    const avgLoss = losses.reduce((a, b) => a + b, 0) / losses.length;

    if (avgLoss === 0) return 100.0;

    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

// =============================================================================
// STRATEGY ENGINE
// =============================================================================

class Position {
    constructor(entryPrice, quantity, investment, entryDate) {
        this.entryPrice = entryPrice;
        this.quantity = quantity;
        this.investment = investment;
        this.entryDate = entryDate;
    }

    getTpPrice(profitTarget) { return this.entryPrice + profitTarget; }
    getSlPrice(stopLossPct) { return this.entryPrice * (1 - stopLossPct / 100); }
}

function runBacktest(data, rsiThreshold) {
    const result = {
        rsiThreshold,
        trades: 0,
        wins: 0,
        losses: 0,
        filtered: 0,
        grossProfit: 0,
        grossLoss: 0,
        finalCash: 0,
        netPnl: 0,
        roi: 0,
        winRate: 0,
        maxDrawdown: 0,
    };

    if (!data || data.length < Config.RSI_PERIOD + 1) return result;

    let cash = Config.CAPITAL;
    const openPositions = [];
    let referenceHigh = data[0].high;

    const startPrice = data[0].close;
    const endPrice = data[data.length - 1].close;

    // Track equity for drawdown
    let equity = Config.CAPITAL;
    let peak = Config.CAPITAL;
    let maxDd = 0;

    for (let i = 0; i < data.length; i++) {
        const candle = data[i];
        const date = candle.date;

        if (candle.high > referenceHigh) referenceHigh = candle.high;

        const rsi = calculateRSI(data, Config.RSI_PERIOD, i);

        // Check exits
        const positionsToClose = [];

        for (let j = 0; j < openPositions.length; j++) {
            const pos = openPositions[j];
            const tpPrice = pos.getTpPrice(Config.PROFIT_TARGET);
            const slPrice = pos.getSlPrice(Config.STOP_LOSS_PCT);

            const tpHit = candle.high >= tpPrice;
            const slHit = candle.low <= slPrice;

            if (tpHit && slHit) {
                // Ambiguous - assume SL first (conservative)
                const exitPrice = slPrice;
                const exitValue = pos.quantity * exitPrice;
                const loss = pos.investment - exitValue;
                cash += exitValue;
                result.losses++;
                result.grossLoss += loss;
                positionsToClose.push(j);

                equity = cash + openPositions.reduce((sum, p, idx) => {
                    if (positionsToClose.includes(idx)) return sum;
                    return sum + p.quantity * candle.close;
                }, 0);
                if (equity > peak) peak = equity;
                const dd = ((peak - equity) / peak) * 100;
                if (dd > maxDd) maxDd = dd;

            } else if (slHit) {
                const exitPrice = slPrice;
                const exitValue = pos.quantity * exitPrice;
                const loss = pos.investment - exitValue;
                cash += exitValue;
                result.losses++;
                result.grossLoss += loss;
                positionsToClose.push(j);

            } else if (tpHit) {
                const exitPrice = tpPrice;
                const exitValue = pos.quantity * exitPrice;
                const profit = exitValue - pos.investment;
                cash += exitValue;
                result.wins++;
                result.grossProfit += profit;
                positionsToClose.push(j);
            }
        }

        for (let j = positionsToClose.length - 1; j >= 0; j--) {
            openPositions.splice(positionsToClose[j], 1);
        }

        // Check entries
        if (openPositions.length < Config.MAX_POSITIONS && cash >= Config.POSITION_SIZE) {
            const buyTrigger = referenceHigh - Config.DROP_TRIGGER;

            if (candle.low <= buyTrigger) {
                if (rsi < rsiThreshold) {
                    result.filtered++;
                } else {
                    const entryPrice = buyTrigger;
                    const quantity = Config.POSITION_SIZE / entryPrice;
                    openPositions.push(new Position(entryPrice, quantity, Config.POSITION_SIZE, date));
                    cash -= Config.POSITION_SIZE;
                    referenceHigh = entryPrice;
                }
            }
        }

        // Update equity for drawdown
        equity = cash + openPositions.reduce((sum, p) => sum + p.quantity * candle.close, 0);
        if (equity > peak) peak = equity;
        const dd = ((peak - equity) / peak) * 100;
        if (dd > maxDd) maxDd = dd;
    }

    // Close remaining positions
    const finalPrice = data[data.length - 1].close;
    for (const pos of openPositions) {
        const exitValue = pos.quantity * finalPrice;
        const pnl = exitValue - pos.investment;
        cash += exitValue;
        if (pnl > 0) {
            result.wins++;
            result.grossProfit += pnl;
        } else {
            result.losses++;
            result.grossLoss += Math.abs(pnl);
        }
    }

    result.finalCash = cash;
    result.trades = result.wins + result.losses;
    result.netPnl = cash - Config.CAPITAL;
    result.roi = (result.netPnl / Config.CAPITAL) * 100;
    result.winRate = result.trades > 0 ? (result.wins / result.trades) * 100 : 0;
    result.maxDrawdown = maxDd;

    // Buy & hold comparison
    result.buyHoldPnl = (endPrice - startPrice) * (Config.CAPITAL / startPrice);
    result.buyHoldRoi = ((endPrice / startPrice) - 1) * 100;

    return result;
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
    console.log('='.repeat(80));
    console.log('RSI FILTER OPTIMIZER');
    console.log('BTC/USDT Buy-the-Dip Strategy');
    console.log('='.repeat(80));

    console.log(`\nFetching ${Config.SYMBOL} data from Binance...`);

    let data;
    try {
        data = await fetchBinanceKlines(Config.SYMBOL, Config.INTERVAL, Config.DEFAULT_START, Config.DEFAULT_END);
    } catch (error) {
        console.log(`\n❌ Failed to fetch data: ${error.message}`);
        process.exit(1);
    }

    console.log(`✅ Fetched ${data.length} days of data\n`);

    // Run optimization
    const results = [];

    for (const rsiThreshold of RSI_TEST_VALUES) {
        const result = runBacktest(data, rsiThreshold);
        results.push(result);
    }

    // Sort by net P&L
    results.sort((a, b) => b.netPnl - a.netPnl);

    // Print results table
    console.log('='.repeat(90));
    console.log('OPTIMIZATION RESULTS (sorted by Net P&L)');
    console.log('='.repeat(90));

    console.log(`\n${'RSI'.padStart(5)} | ${'Trades'.padStart(6)} | ${'Wins'.padStart(4)} | ${'Losses'.padStart(6)} | ${'WinRate'.padStart(7)} | ${'Filtered'.padStart(8)} | ${'Net P&L'.padStart(12)} | ${'ROI'.padStart(8)} | ${'MaxDD'.padStart(7)}`);
    console.log('-'.repeat(90));

    for (const r of results) {
        const netPnlStr = r.netPnl >= 0 ? `+$${r.netPnl.toFixed(0)}` : `-$${Math.abs(r.netPnl).toFixed(0)}`;
        const roiStr = `${r.roi >= 0 ? '+' : ''}${r.roi.toFixed(2)}%`;

        console.log(
            `${String(r.rsiThreshold).padStart(5)} | ` +
            `${String(r.trades).padStart(6)} | ` +
            `${String(r.wins).padStart(4)} | ` +
            `${String(r.losses).padStart(6)} | ` +
            `${r.winRate.toFixed(1).padStart(6)}% | ` +
            `${String(r.filtered).padStart(8)} | ` +
            `${netPnlStr.padStart(12)} | ` +
            `${roiStr.padStart(8)} | ` +
            `${r.maxDrawdown.toFixed(2).padStart(6)}%`
        );
    }

    // Find best result
    const best = results[0];
    const buyHoldPnl = best.buyHoldPnl;

    console.log('\n' + '='.repeat(90));
    console.log('RECOMMENDATION');
    console.log('='.repeat(90));

    console.log(`
OPTIMAL RSI THRESHOLD: ${best.rsiThreshold}

Performance at RSI < ${best.rsiThreshold}:
  Trades:       ${best.trades}
  Win Rate:     ${best.winRate.toFixed(1)}%
  Net P&L:      ${best.netPnl >= 0 ? '+' : ''}$${best.netPnl.toFixed(2)}
  ROI:          ${best.roi >= 0 ? '+' : ''}${best.roi.toFixed(2)}%
  Max Drawdown: ${best.maxDrawdown.toFixed(2)}%
  Filtered:     ${best.filtered} trades

Comparison:
  Buy & Hold:   ${buyHoldPnl >= 0 ? '+' : ''}$${buyHoldPnl.toFixed(2)} (${best.buyHoldRoi >= 0 ? '+' : ''}${best.buyHoldRoi.toFixed(2)}%)
  ${best.netPnl > buyHoldPnl ? '✅ Strategy BEATS Buy & Hold' : '❌ Buy & Hold outperforms'}
`);

    // Show impact analysis
    console.log('='.repeat(90));
    console.log('FILTER IMPACT ANALYSIS');
    console.log('='.repeat(90));

    const noFilter = results.find(r => r.rsiThreshold === 0);
    const current = results.find(r => r.rsiThreshold === 15);

    if (noFilter && current) {
        const improvement = best.netPnl - noFilter.netPnl;
        console.log(`
No Filter (RSI=0):     Net P&L = ${noFilter.netPnl >= 0 ? '+' : ''}$${noFilter.netPnl.toFixed(2)}
Current (RSI<15):      Net P&L = ${current.netPnl >= 0 ? '+' : ''}$${current.netPnl.toFixed(2)}
Optimal (RSI<${best.rsiThreshold}):      Net P&L = ${best.netPnl >= 0 ? '+' : ''}$${best.netPnl.toFixed(2)}

Improvement vs No Filter: ${improvement >= 0 ? '+' : ''}$${improvement.toFixed(2)}
`);
    }
}

main().catch(console.error);
