#!/usr/bin/env node
/**
 * Advanced Indicator Optimizer for BTC Buy-the-Dip Strategy
 * 
 * Tests: ATR-based dynamic SL, ROC filter, Volume filter
 * Plus all combinations to find optimal configuration
 */

const https = require('https');

const Config = {
    CAPITAL: 100_000,
    POSITION_SIZE: 20_000,
    MAX_POSITIONS: 5,
    DROP_TRIGGER: 3_000,
    PROFIT_TARGET: 1_500,
    SYMBOL: 'BTCUSDT',
    INTERVAL: '1d',
};

// Test parameters
const ATR_MULTIPLIERS = [0, 1.5, 2, 2.5, 3]; // 0 = use fixed SL
const FIXED_SL_PCT = [5, 8, 12]; // Used when ATR = 0
const ROC_THRESHOLDS = [0, -5, -10, -15]; // 0 = disabled
const ROC_PERIOD = 3;
const VOLUME_MULTIPLIERS = [0, 1.5, 2, 3]; // 0 = disabled
const ATR_PERIOD = 14;

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
                    if (rawData.code) { reject(new Error(rawData.msg)); return; }
                    resolve(rawData.map(k => ({
                        date: new Date(k[0]).toISOString().split('T')[0],
                        open: parseFloat(k[1]),
                        high: parseFloat(k[2]),
                        low: parseFloat(k[3]),
                        close: parseFloat(k[4]),
                        volume: parseFloat(k[5]),
                    })));
                } catch (e) { reject(e); }
            });
        }).on('error', reject);
    });
}

// =============================================================================
// INDICATORS
// =============================================================================

function calculateATR(data, period, endIndex) {
    if (endIndex < period) return null;

    let sum = 0;
    for (let i = endIndex - period + 1; i <= endIndex; i++) {
        const high = data[i].high;
        const low = data[i].low;
        const prevClose = i > 0 ? data[i - 1].close : data[i].open;

        const tr = Math.max(
            high - low,
            Math.abs(high - prevClose),
            Math.abs(low - prevClose)
        );
        sum += tr;
    }

    return sum / period;
}

function calculateROC(data, period, endIndex) {
    if (endIndex < period) return 0;
    const currentPrice = data[endIndex].close;
    const pastPrice = data[endIndex - period].close;
    return ((currentPrice - pastPrice) / pastPrice) * 100;
}

function calculateAvgVolume(data, period, endIndex) {
    if (endIndex < period) return data[endIndex].volume;

    let sum = 0;
    for (let i = endIndex - period; i < endIndex; i++) {
        sum += data[i].volume;
    }
    return sum / period;
}

// =============================================================================
// BACKTEST ENGINE
// =============================================================================

function runBacktest(data, params) {
    const { atrMultiplier, fixedSlPct, rocThreshold, volumeMultiplier } = params;

    let cash = Config.CAPITAL;
    let referenceHigh = data[0].high;
    const positions = [];
    let wins = 0, losses = 0, filtered = 0;
    let grossProfit = 0, grossLoss = 0;
    let equity = Config.CAPITAL, peak = Config.CAPITAL, maxDd = 0;

    for (let i = 0; i < data.length; i++) {
        const candle = data[i];
        if (candle.high > referenceHigh) referenceHigh = candle.high;

        // Calculate indicators
        const atr = calculateATR(data, ATR_PERIOD, i);
        const roc = calculateROC(data, ROC_PERIOD, i);
        const avgVolume = calculateAvgVolume(data, 20, i);
        const volumeRatio = candle.volume / avgVolume;

        // Process exits
        for (let j = positions.length - 1; j >= 0; j--) {
            const pos = positions[j];
            const tpPrice = pos.entry + Config.PROFIT_TARGET;

            // Dynamic or fixed SL
            let slPrice;
            if (atrMultiplier > 0 && pos.atr) {
                slPrice = pos.entry - (atrMultiplier * pos.atr);
            } else {
                slPrice = pos.entry * (1 - fixedSlPct / 100);
            }

            if (candle.low <= slPrice) {
                const exitValue = pos.qty * slPrice;
                cash += exitValue;
                losses++;
                grossLoss += pos.inv - exitValue;
                positions.splice(j, 1);
            } else if (candle.high >= tpPrice) {
                const exitValue = pos.qty * tpPrice;
                cash += exitValue;
                wins++;
                grossProfit += exitValue - pos.inv;
                positions.splice(j, 1);
            }
        }

        // Check entry conditions
        if (positions.length < Config.MAX_POSITIONS && cash >= Config.POSITION_SIZE) {
            const buyTrigger = referenceHigh - Config.DROP_TRIGGER;

            if (candle.low <= buyTrigger) {
                // Apply filters
                let skipTrade = false;
                let filterReason = '';

                // ROC filter - skip if price falling too fast
                if (rocThreshold < 0 && roc < rocThreshold) {
                    skipTrade = true;
                    filterReason = 'ROC';
                }

                // Volume filter - require above-average volume (capitulation)
                if (volumeMultiplier > 0 && volumeRatio < volumeMultiplier) {
                    skipTrade = true;
                    filterReason = 'VOL';
                }

                if (skipTrade) {
                    filtered++;
                } else {
                    const entryPrice = buyTrigger;
                    const qty = Config.POSITION_SIZE / entryPrice;
                    positions.push({
                        entry: entryPrice,
                        qty,
                        inv: Config.POSITION_SIZE,
                        atr: atr // Store ATR at entry for dynamic SL
                    });
                    cash -= Config.POSITION_SIZE;
                    referenceHigh = entryPrice;
                }
            }
        }

        // Track drawdown
        equity = cash + positions.reduce((sum, p) => sum + p.qty * candle.close, 0);
        if (equity > peak) peak = equity;
        const dd = ((peak - equity) / peak) * 100;
        if (dd > maxDd) maxDd = dd;
    }

    // Close remaining positions
    const finalPrice = data[data.length - 1].close;
    for (const pos of positions) {
        const exitValue = pos.qty * finalPrice;
        cash += exitValue;
        if (exitValue > pos.inv) {
            wins++;
            grossProfit += exitValue - pos.inv;
        } else {
            losses++;
            grossLoss += pos.inv - exitValue;
        }
    }

    const trades = wins + losses;
    return {
        ...params,
        trades,
        wins,
        losses,
        filtered,
        netPnl: cash - Config.CAPITAL,
        winRate: trades > 0 ? (wins / trades * 100) : 0,
        maxDrawdown: maxDd,
        avgWin: wins > 0 ? grossProfit / wins : 0,
        avgLoss: losses > 0 ? grossLoss / losses : 0,
    };
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
    console.log('='.repeat(100));
    console.log('ADVANCED INDICATOR OPTIMIZER');
    console.log('Testing: ATR Dynamic SL, ROC Filter, Volume Filter + Combinations');
    console.log('='.repeat(100));

    let data;
    try {
        data = await fetchBinanceKlines(Config.SYMBOL, Config.INTERVAL, '2024-01-01', '2026-01-05');
    } catch (e) {
        console.log('Failed to fetch data:', e.message);
        process.exit(1);
    }

    console.log(`\n✅ Fetched ${data.length} days of data\n`);

    // Generate all parameter combinations
    const combinations = [];

    for (const atr of ATR_MULTIPLIERS) {
        const slValues = atr === 0 ? FIXED_SL_PCT : [0]; // Use fixed SL only when ATR disabled
        for (const sl of slValues) {
            for (const roc of ROC_THRESHOLDS) {
                for (const vol of VOLUME_MULTIPLIERS) {
                    combinations.push({
                        atrMultiplier: atr,
                        fixedSlPct: atr === 0 ? sl : 0,
                        rocThreshold: roc,
                        volumeMultiplier: vol,
                    });
                }
            }
        }
    }

    console.log(`Testing ${combinations.length} parameter combinations...\n`);

    // Run all backtests
    const results = combinations.map(params => runBacktest(data, params));

    // Sort by net P&L
    results.sort((a, b) => b.netPnl - a.netPnl);

    // Print top results
    console.log('='.repeat(100));
    console.log('TOP 20 CONFIGURATIONS (sorted by Net P&L)');
    console.log('='.repeat(100));

    console.log('\nATR   | FixSL | ROC   | Vol  | Trades | Wins | Loss | Filt | WinRate | MaxDD  |      Net P&L');
    console.log('-'.repeat(100));

    for (const r of results.slice(0, 20)) {
        const atrStr = r.atrMultiplier > 0 ? `${r.atrMultiplier}x` : 'OFF';
        const slStr = r.atrMultiplier === 0 ? `${r.fixedSlPct}%` : '-';
        const rocStr = r.rocThreshold < 0 ? `${r.rocThreshold}%` : 'OFF';
        const volStr = r.volumeMultiplier > 0 ? `${r.volumeMultiplier}x` : 'OFF';
        const pnlStr = (r.netPnl >= 0 ? '+$' : '-$') + Math.abs(r.netPnl).toFixed(0).padStart(8);

        console.log(
            `${atrStr.padStart(5)} | ` +
            `${slStr.padStart(5)} | ` +
            `${rocStr.padStart(5)} | ` +
            `${volStr.padStart(4)} | ` +
            `${String(r.trades).padStart(6)} | ` +
            `${String(r.wins).padStart(4)} | ` +
            `${String(r.losses).padStart(4)} | ` +
            `${String(r.filtered).padStart(4)} | ` +
            `${r.winRate.toFixed(1).padStart(6)}% | ` +
            `${r.maxDrawdown.toFixed(1).padStart(5)}% | ` +
            pnlStr
        );
    }

    // Analyze individual indicator impact
    console.log('\n' + '='.repeat(100));
    console.log('INDIVIDUAL INDICATOR ANALYSIS');
    console.log('='.repeat(100));

    // Best ATR-only
    const bestAtr = results.filter(r => r.atrMultiplier > 0 && r.rocThreshold === 0 && r.volumeMultiplier === 0)
        .sort((a, b) => b.netPnl - a.netPnl)[0];

    // Best ROC-only
    const bestRoc = results.filter(r => r.atrMultiplier === 0 && r.rocThreshold < 0 && r.volumeMultiplier === 0)
        .sort((a, b) => b.netPnl - a.netPnl)[0];

    // Best Volume-only
    const bestVol = results.filter(r => r.atrMultiplier === 0 && r.rocThreshold === 0 && r.volumeMultiplier > 0)
        .sort((a, b) => b.netPnl - a.netPnl)[0];

    // Baseline (no filters)
    const baseline = results.find(r => r.atrMultiplier === 0 && r.fixedSlPct === 12 && r.rocThreshold === 0 && r.volumeMultiplier === 0);

    console.log(`
BASELINE (12% Fixed SL, no filters):
  Net P&L: ${baseline ? `$${baseline.netPnl.toFixed(0)}` : 'N/A'}

BEST ATR DYNAMIC SL (${bestAtr ? bestAtr.atrMultiplier + 'x' : 'N/A'} ATR):
  Net P&L: ${bestAtr ? `$${bestAtr.netPnl.toFixed(0)}` : 'N/A'}
  Improvement: ${bestAtr && baseline ? `$${(bestAtr.netPnl - baseline.netPnl).toFixed(0)}` : 'N/A'}

BEST ROC FILTER (${bestRoc ? bestRoc.rocThreshold + '% / ' + bestRoc.fixedSlPct + '% SL' : 'N/A'}):
  Net P&L: ${bestRoc ? `$${bestRoc.netPnl.toFixed(0)}` : 'N/A'}
  Filtered: ${bestRoc ? bestRoc.filtered : 'N/A'} trades

BEST VOLUME FILTER (${bestVol ? bestVol.volumeMultiplier + 'x / ' + bestVol.fixedSlPct + '% SL' : 'N/A'}):
  Net P&L: ${bestVol ? `$${bestVol.netPnl.toFixed(0)}` : 'N/A'}
  Filtered: ${bestVol ? bestVol.filtered : 'N/A'} trades
`);

    // Best overall
    const best = results[0];
    console.log('='.repeat(100));
    console.log('✅ OPTIMAL CONFIGURATION');
    console.log('='.repeat(100));

    console.log(`
  ATR Dynamic SL:  ${best.atrMultiplier > 0 ? best.atrMultiplier + 'x ATR' : 'OFF (using ' + best.fixedSlPct + '% fixed)'}
  ROC Filter:      ${best.rocThreshold < 0 ? 'Skip when ROC < ' + best.rocThreshold + '%' : 'OFF'}
  Volume Filter:   ${best.volumeMultiplier > 0 ? 'Require ' + best.volumeMultiplier + 'x avg volume' : 'OFF'}
  
  Performance:
    Trades:       ${best.trades} (${best.filtered} filtered)
    Win Rate:     ${best.winRate.toFixed(1)}%
    Net P&L:      ${best.netPnl >= 0 ? '+' : ''}$${best.netPnl.toFixed(2)}
    Max Drawdown: ${best.maxDrawdown.toFixed(2)}%
    Avg Win:      $${best.avgWin.toFixed(2)}
    Avg Loss:     $${best.avgLoss.toFixed(2)}
`);
}

main().catch(console.error);
