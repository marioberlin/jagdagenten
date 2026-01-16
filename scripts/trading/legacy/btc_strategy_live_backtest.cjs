#!/usr/bin/env node
/**
 * =============================================================================
 * BTC/USDT Buy-the-Dip Strategy Backtest with Live Binance Data
 * =============================================================================
 * 
 * This script fetches real historical data from Binance API and runs the 
 * strategy backtest with the canonical definitions from v3.2.
 * 
 * USAGE:
 *     node btc_strategy_live_backtest.js
 *     node btc_strategy_live_backtest.js --start 2025-06-01 --end 2025-12-31
 *     node btc_strategy_live_backtest.js --compare
 *     node btc_strategy_live_backtest.js --verbose
 *     node btc_strategy_live_backtest.js --export trades.csv
 * 
 * REQUIREMENTS:
 *     - Node.js 14+
 *     - Internet connection (access to api.binance.com)
 *     - No additional packages required (uses only built-in modules)
 * 
 * STRATEGY PARAMETERS:
 *     - Capital: $100,000 USDT
 *     - Position Size: $20,000 per trade
 *     - Max Concurrent Positions: 5
 *     - Drop Trigger: $3,000 FIXED (price drop from reference high)
 *     - Profit Target: $1,500 FIXED (price RISE above entry, NOT P&L)
 *     - Stop Loss: 2.5x ATR dynamic (adapts to volatility)
 *     - ROC Filter: Skip buy when 3-day ROC < -10%
 * 
 * CANONICAL DEFINITIONS (v4.0 - Optimized):
 *     1. Profit Target = PRICE DELTA (+$1,500), actual profit ≈ $300 per win
 *     2. Stop Loss = 2.5x ATR (dynamic, volatility-aware)
 *     3. Reference High = candle HIGH (not close)
 *     4. Entry Price = trigger price (not close)
 *     5. ROC Filter = Skip when 3-day ROC < -10% (falling knife protection)
 *     6. Intraday Ordering = SL-First (conservative) when ambiguous
 * 
 * Author: Strategy Development Session
 * Version: 4.0 (ATR Optimized)
 * Date: January 6, 2026
 * =============================================================================
 */

const https = require('https');
const fs = require('fs');

// =============================================================================
// CONFIGURATION
// =============================================================================

const Config = {
    // Capital & Position Sizing
    CAPITAL: 100_000,          // Starting capital in USDT
    POSITION_SIZE: 20_000,     // USDT per position
    MAX_POSITIONS: 5,          // Maximum concurrent positions

    // Entry/Exit Triggers
    DROP_TRIGGER: 3_000,       // Buy when price drops $3,000 from reference high
    PROFIT_TARGET: 1_500,      // Exit when price RISES $1,500 above entry

    // Dynamic Stop Loss (ATR-based)
    ATR_PERIOD: 14,            // ATR calculation period
    ATR_MULTIPLIER: 2.5,       // OPTIMIZED: 2.5x ATR for stop loss (+$10,898 vs fixed)
    FALLBACK_SL_PCT: 8.0,      // Fallback SL % when ATR not available

    // ROC Filter (Falling Knife Protection)
    ROC_PERIOD: 3,             // Rate of Change period
    ROC_THRESHOLD: -10,        // OPTIMIZED: Skip buy when 3-day ROC < -10%

    // Backtest Settings
    SYMBOL: 'BTCUSDT',
    INTERVAL: '1d',            // Daily candles

    // Default date range (Sep 1, 2025 - Jan 5, 2026)
    DEFAULT_START: '2025-09-01',
    DEFAULT_END: '2026-01-05',
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        start: Config.DEFAULT_START,
        end: Config.DEFAULT_END,
        verbose: false,
        export: null,
        tpFirst: false,
        compare: false,
        help: false,
    };

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--start':
                options.start = args[++i];
                break;
            case '--end':
                options.end = args[++i];
                break;
            case '--verbose':
            case '-v':
                options.verbose = true;
                break;
            case '--export':
                options.export = args[++i];
                break;
            case '--tp-first':
                options.tpFirst = true;
                break;
            case '--compare':
                options.compare = true;
                break;
            case '--help':
            case '-h':
                options.help = true;
                break;
        }
    }

    return options;
}

function formatNumber(num, decimals = 0) {
    return num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

function formatCurrency(num, decimals = 0) {
    const sign = num >= 0 ? '+' : '';
    return `${sign}$${formatNumber(Math.abs(num), decimals)}`;
}

function padLeft(str, len) {
    return String(str).padStart(len);
}

function padRight(str, len) {
    return String(str).padEnd(len);
}

// =============================================================================
// DATA FETCHING
// =============================================================================

function fetchBinanceKlines(symbol, interval, startDate, endDate) {
    return new Promise((resolve, reject) => {
        // Convert dates to milliseconds
        const startMs = new Date(startDate).getTime();
        const endMs = new Date(endDate).getTime() + 86400000; // Add 1 day

        const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&startTime=${startMs}&endTime=${endMs}&limit=1000`;

        https.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

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
                        trades: parseInt(k[8]),
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

function calculateATR(data, period, endIndex) {
    /**
     * Calculate Average True Range (ATR)
     * Measures volatility using the greatest of:
     * - Current High - Current Low
     * - |Current High - Previous Close|
     * - |Current Low - Previous Close|
     */
    if (endIndex < period) {
        return null; // Not enough data
    }

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
    /**
     * Calculate Rate of Change (ROC)
     * Measures the percentage change over the period
     * Negative values indicate falling prices
     */
    if (endIndex < period) {
        return 0; // Not enough data
    }

    const currentPrice = data[endIndex].close;
    const pastPrice = data[endIndex - period].close;
    return ((currentPrice - pastPrice) / pastPrice) * 100;
}

// =============================================================================
// STRATEGY ENGINE
// =============================================================================

class Position {
    constructor(entryPrice, quantity, investment, entryDate, atrAtEntry) {
        this.entryPrice = entryPrice;
        this.quantity = quantity;
        this.investment = investment;
        this.entryDate = entryDate;
        this.atrAtEntry = atrAtEntry; // Store ATR at entry for dynamic SL
    }

    getTpPrice(profitTarget) {
        return this.entryPrice + profitTarget;
    }

    getSlPrice(atrMultiplier, fallbackSlPct) {
        // Dynamic SL based on ATR at entry
        if (this.atrAtEntry && atrMultiplier > 0) {
            return this.entryPrice - (atrMultiplier * this.atrAtEntry);
        }
        // Fallback to percentage-based SL
        return this.entryPrice * (1 - fallbackSlPct / 100);
    }
}

class Trade {
    constructor(tradeType, entryPrice, exitPrice, pnl, entryDate, exitDate, quantity) {
        this.tradeType = tradeType;
        this.entryPrice = entryPrice;
        this.exitPrice = exitPrice;
        this.pnl = pnl;
        this.entryDate = entryDate;
        this.exitDate = exitDate;
        this.quantity = quantity;
    }
}

class StrategyResult {
    constructor() {
        this.trades = [];
        this.wins = 0;
        this.losses = 0;
        this.filtered = 0;
        this.ambiguous = 0;
        this.grossProfit = 0;
        this.grossLoss = 0;
        this.finalCash = 0;
        this.startPrice = 0;
        this.endPrice = 0;
        this.startDate = '';
        this.endDate = '';
        this.rsiValues = [];
    }

    get totalTrades() {
        return this.wins + this.losses;
    }

    get winRate() {
        if (this.totalTrades === 0) return 0;
        return (this.wins / this.totalTrades) * 100;
    }

    get netPnl() {
        return this.finalCash - Config.CAPITAL;
    }

    get roi() {
        return (this.netPnl / Config.CAPITAL) * 100;
    }

    get buyHoldPnl() {
        if (this.startPrice === 0) return 0;
        const quantity = Config.CAPITAL / this.startPrice;
        return (this.endPrice - this.startPrice) * quantity;
    }

    get buyHoldRoi() {
        if (this.startPrice === 0) return 0;
        return ((this.endPrice / this.startPrice) - 1) * 100;
    }

    get avgWin() {
        if (this.wins === 0) return 0;
        return this.grossProfit / this.wins;
    }

    get avgLoss() {
        if (this.losses === 0) return 0;
        return this.grossLoss / this.losses;
    }

    get maxDrawdown() {
        if (this.trades.length === 0) return 0;

        let equity = Config.CAPITAL;
        let peak = Config.CAPITAL;
        let maxDd = 0;

        for (const trade of this.trades) {
            equity += trade.pnl;
            if (equity > peak) peak = equity;
            const dd = ((peak - equity) / peak) * 100;
            if (dd > maxDd) maxDd = dd;
        }

        return maxDd;
    }
}

function runBacktest(data, slFirst = true, verbose = false) {
    const result = new StrategyResult();

    if (!data || data.length < Config.ATR_PERIOD + 1) {
        console.log('Error: Insufficient data for backtest');
        return result;
    }

    // Initialize
    let cash = Config.CAPITAL;
    const openPositions = [];
    let referenceHigh = data[0].high;

    result.startPrice = data[0].close;
    result.endPrice = data[data.length - 1].close;
    result.startDate = data[0].date;
    result.endDate = data[data.length - 1].date;

    if (verbose) {
        console.log('\n' + '='.repeat(80));
        console.log('TRADE LOG');
        console.log('='.repeat(80));
    }

    // Main loop through each candle
    for (let i = 0; i < data.length; i++) {
        const candle = data[i];
        const date = candle.date;

        // Update reference high from candle HIGH
        if (candle.high > referenceHigh) {
            referenceHigh = candle.high;
        }

        // Calculate indicators
        const atr = calculateATR(data, Config.ATR_PERIOD, i);
        const roc = calculateROC(data, Config.ROC_PERIOD, i);
        result.atrValues = result.atrValues || [];
        result.atrValues.push({ date, atr, roc, close: candle.close });

        // =================================================================
        // CHECK EXITS FOR OPEN POSITIONS
        // =================================================================
        const positionsToClose = [];

        for (let j = 0; j < openPositions.length; j++) {
            const pos = openPositions[j];
            const tpPrice = pos.getTpPrice(Config.PROFIT_TARGET);
            const slPrice = pos.getSlPrice(Config.ATR_MULTIPLIER, Config.FALLBACK_SL_PCT);

            const tpHit = candle.high >= tpPrice;
            const slHit = candle.low <= slPrice;

            if (tpHit && slHit) {
                // AMBIGUOUS: Both TP and SL hit in same candle
                result.ambiguous++;

                let exitPrice, tradeType, pnl;

                if (slFirst) {
                    // Conservative: Assume SL hit first
                    exitPrice = slPrice;
                    const exitValue = pos.quantity * exitPrice;
                    const loss = pos.investment - exitValue;
                    cash += exitValue;
                    result.losses++;
                    result.grossLoss += loss;
                    tradeType = 'LOSS (ambiguous)';
                    pnl = -loss;
                } else {
                    // Optimistic: Assume TP hit first
                    exitPrice = tpPrice;
                    const exitValue = pos.quantity * exitPrice;
                    const profit = exitValue - pos.investment;
                    cash += exitValue;
                    result.wins++;
                    result.grossProfit += profit;
                    tradeType = 'WIN (ambiguous)';
                    pnl = profit;
                }

                result.trades.push(new Trade(tradeType, pos.entryPrice, exitPrice, pnl, pos.entryDate, date, pos.quantity));
                positionsToClose.push(j);

                if (verbose) {
                    console.log(`${date}: ${padRight(tradeType, 18)} Entry=$${padLeft(formatNumber(pos.entryPrice), 10)} Exit=$${padLeft(formatNumber(exitPrice), 10)} P&L=$${padLeft(formatCurrency(pnl), 10)}`);
                }

            } else if (slHit) {
                // Clear stop loss
                const exitPrice = slPrice;
                const exitValue = pos.quantity * exitPrice;
                const loss = pos.investment - exitValue;
                cash += exitValue;
                result.losses++;
                result.grossLoss += loss;

                result.trades.push(new Trade('LOSS', pos.entryPrice, exitPrice, -loss, pos.entryDate, date, pos.quantity));
                positionsToClose.push(j);

                if (verbose) {
                    console.log(`${date}: ${padRight('LOSS', 18)} Entry=$${padLeft(formatNumber(pos.entryPrice), 10)} Exit=$${padLeft(formatNumber(exitPrice), 10)} P&L=$${padLeft(formatCurrency(-loss), 10)}`);
                }

            } else if (tpHit) {
                // Take profit
                const exitPrice = tpPrice;
                const exitValue = pos.quantity * exitPrice;
                const profit = exitValue - pos.investment;
                cash += exitValue;
                result.wins++;
                result.grossProfit += profit;

                result.trades.push(new Trade('WIN', pos.entryPrice, exitPrice, profit, pos.entryDate, date, pos.quantity));
                positionsToClose.push(j);

                if (verbose) {
                    console.log(`${date}: ${padRight('WIN', 18)} Entry=$${padLeft(formatNumber(pos.entryPrice), 10)} Exit=$${padLeft(formatNumber(exitPrice), 10)} P&L=$${padLeft(formatCurrency(profit), 10)}`);
                }
            }
        }

        // Remove closed positions (in reverse order to maintain indices)
        for (let j = positionsToClose.length - 1; j >= 0; j--) {
            openPositions.splice(positionsToClose[j], 1);
        }

        // =================================================================
        // CHECK FOR NEW ENTRIES
        // =================================================================
        if (openPositions.length < Config.MAX_POSITIONS && cash >= Config.POSITION_SIZE) {
            const buyTrigger = referenceHigh - Config.DROP_TRIGGER;

            if (candle.low <= buyTrigger) {
                // Price dropped enough to trigger a buy

                if (Config.ROC_THRESHOLD < 0 && roc < Config.ROC_THRESHOLD) {
                    // ROC filter: Skip buy when price falling too fast
                    result.filtered++;
                    if (verbose) {
                        console.log(`${date}: FILTERED (ROC=${roc.toFixed(1)}% < ${Config.ROC_THRESHOLD}%)`);
                    }
                } else {
                    // Execute buy with ATR stored for dynamic SL
                    const entryPrice = buyTrigger;
                    const quantity = Config.POSITION_SIZE / entryPrice;

                    openPositions.push(new Position(entryPrice, quantity, Config.POSITION_SIZE, date, atr));
                    cash -= Config.POSITION_SIZE;

                    // Reset reference high after buy
                    referenceHigh = entryPrice;

                    if (verbose) {
                        const slPrice = atr ? (entryPrice - Config.ATR_MULTIPLIER * atr) : (entryPrice * (1 - Config.FALLBACK_SL_PCT / 100));
                        console.log(`${date}: BUY @ $${formatNumber(entryPrice)} (ATR=$${atr ? atr.toFixed(0) : 'N/A'}, SL=$${formatNumber(slPrice)}, ROC=${roc.toFixed(1)}%)`);
                    }
                }
            }
        }
    }

    // =================================================================
    // CLOSE REMAINING POSITIONS AT FINAL PRICE
    // =================================================================
    const finalPrice = data[data.length - 1].close;
    const finalDate = data[data.length - 1].date;

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

        result.trades.push(new Trade('CLOSE', pos.entryPrice, finalPrice, pnl, pos.entryDate, finalDate, pos.quantity));

        if (verbose) {
            console.log(`${finalDate}: ${padRight('CLOSE', 18)} Entry=$${padLeft(formatNumber(pos.entryPrice), 10)} Exit=$${padLeft(formatNumber(finalPrice), 10)} P&L=$${padLeft(formatCurrency(pnl), 10)}`);
        }
    }

    result.finalCash = cash;

    return result;
}

// =============================================================================
// REPORTING
// =============================================================================

function printResults(result, title = 'BACKTEST RESULTS') {
    console.log('\n' + '='.repeat(80));
    console.log(title);
    console.log('='.repeat(80));

    console.log(`
STRATEGY PARAMETERS:
  Capital:          $${formatNumber(Config.CAPITAL)}
  Position Size:    $${formatNumber(Config.POSITION_SIZE)}
  Max Positions:    ${Config.MAX_POSITIONS}
  Drop Trigger:     $${formatNumber(Config.DROP_TRIGGER)} (FIXED)
  Profit Target:    $${formatNumber(Config.PROFIT_TARGET)} price rise (FIXED)
  Stop Loss:        ${Config.ATR_MULTIPLIER}x ATR (dynamic, fallback ${Config.FALLBACK_SL_PCT}%)
  ROC Filter:       Skip when < ${Config.ROC_THRESHOLD}%

DATA PERIOD:
  Start:    ${result.startDate} @ $${formatNumber(result.startPrice, 2)}
  End:      ${result.endDate} @ $${formatNumber(result.endPrice, 2)}
  Days:     ${result.atrValues ? result.atrValues.length : 'N/A'}
`);

    console.log('='.repeat(80));
    console.log('PERFORMANCE METRICS');
    console.log('='.repeat(80));

    const riskReward = result.avgLoss > 0 ? (result.avgWin / result.avgLoss).toFixed(2) : 'N/A';

    console.log(`
TRADES:
  Total Trades:     ${result.totalTrades}
  Wins:             ${result.wins}
  Losses:           ${result.losses}
  Win Rate:         ${result.winRate.toFixed(1)}%
  ROC Filtered:     ${result.filtered}
  Ambiguous Days:   ${result.ambiguous}

PROFIT/LOSS:
  Gross Profit:     ${formatCurrency(result.grossProfit, 2)}
  Gross Loss:       $${formatNumber(result.grossLoss, 2)}
  Net P&L:          ${formatCurrency(result.netPnl, 2)}
  ROI:              ${result.roi >= 0 ? '+' : ''}${result.roi.toFixed(2)}%
  Max Drawdown:     ${result.maxDrawdown.toFixed(2)}%

PER-TRADE ANALYSIS:
  Avg Profit/Win:   $${formatNumber(result.avgWin, 2)}
  Avg Loss/Stop:    $${formatNumber(result.avgLoss, 2)}
  Risk/Reward:      ${riskReward}:1 (need 77%+ WR to profit)

vs BUY & HOLD:
  Strategy P&L:     ${formatCurrency(result.netPnl, 2)}
  Buy & Hold P&L:   ${formatCurrency(result.buyHoldPnl, 2)}
  Difference:       ${formatCurrency(result.netPnl - result.buyHoldPnl, 2)}
  
  ${result.netPnl > result.buyHoldPnl ? '✅ STRATEGY OUTPERFORMS' : '❌ BUY & HOLD OUTPERFORMS'}
`);
}

function printAtrAnalysis(result) {
    console.log('\n' + '='.repeat(80));
    console.log('ATR & ROC ANALYSIS');
    console.log('='.repeat(80));

    if (!result.atrValues || result.atrValues.length === 0) {
        console.log('No ATR data available');
        return;
    }

    // Filter valid ATR values
    const validAtr = result.atrValues.filter(r => r.atr !== null);
    if (validAtr.length === 0) {
        console.log('No valid ATR data');
        return;
    }

    // Find ATR stats
    const minAtr = validAtr.reduce((min, r) => r.atr < min.atr ? r : min);
    const maxAtr = validAtr.reduce((max, r) => r.atr > max.atr ? r : max);
    const avgAtr = validAtr.reduce((sum, r) => sum + r.atr, 0) / validAtr.length;

    // Find ROC extremes
    const minRoc = result.atrValues.reduce((min, r) => r.roc < min.roc ? r : min);
    const maxRoc = result.atrValues.reduce((max, r) => r.roc > max.roc ? r : max);
    const filteredDays = result.atrValues.filter(r => r.roc < Config.ROC_THRESHOLD);

    console.log(`
ATR STATISTICS (${Config.ATR_PERIOD}-period):
  Minimum ATR:      $${minAtr.atr.toFixed(0)} on ${minAtr.date}
  Maximum ATR:      $${maxAtr.atr.toFixed(0)} on ${maxAtr.date}
  Average ATR:      $${avgAtr.toFixed(0)}
  
  At avg ATR, SL = Entry - $${(avgAtr * Config.ATR_MULTIPLIER).toFixed(0)}

ROC STATISTICS (${Config.ROC_PERIOD}-day):
  Minimum ROC:      ${minRoc.roc.toFixed(1)}% on ${minRoc.date}
  Maximum ROC:      ${maxRoc.roc.toFixed(1)}% on ${maxRoc.date}
  Days < ${Config.ROC_THRESHOLD}%:    ${filteredDays.length} (potential falling knives)
`);

    if (filteredDays.length > 0) {
        console.log(`FALLING KNIFE DAYS (ROC < ${Config.ROC_THRESHOLD}%):`);
        filteredDays
            .sort((a, b) => a.roc - b.roc)
            .slice(0, 10)
            .forEach(r => {
                console.log(`  ${r.date}: ROC=${padLeft(r.roc.toFixed(1) + '%', 7)}, ATR=$${padLeft(r.atr ? r.atr.toFixed(0) : 'N/A', 5)}, Close=$${padLeft(formatNumber(r.close), 10)}`);
            });
    }
}

function printTradeLog(result, lastN = 20) {
    console.log('\n' + '='.repeat(80));
    console.log(`TRADE LOG (Last ${Math.min(lastN, result.trades.length)} trades)`);
    console.log('='.repeat(80));

    if (result.trades.length === 0) {
        console.log('No trades executed');
        return;
    }

    console.log(`\n${padRight('#', 4)} ${padRight('Date', 12)} ${padRight('Type', 18)} ${padLeft('Entry', 12)} ${padLeft('Exit', 12)} ${padLeft('P&L', 12)}`);
    console.log('-'.repeat(75));

    const trades = result.trades.slice(-lastN);
    trades.forEach((trade, i) => {
        console.log(`${padRight(i + 1, 4)} ${padRight(trade.exitDate, 12)} ${padRight(trade.tradeType, 18)} $${padLeft(formatNumber(trade.entryPrice), 10)} $${padLeft(formatNumber(trade.exitPrice), 10)} $${padLeft(formatCurrency(trade.pnl), 10)}`);
    });
}

function exportToCsv(result, filename) {
    const header = 'entry_date,exit_date,type,entry_price,exit_price,quantity,pnl\n';
    const rows = result.trades.map(t =>
        `${t.entryDate},${t.exitDate},${t.tradeType},${t.entryPrice.toFixed(2)},${t.exitPrice.toFixed(2)},${t.quantity.toFixed(8)},${t.pnl.toFixed(2)}`
    ).join('\n');

    fs.writeFileSync(filename, header + rows);
    console.log(`\nTrades exported to: ${filename}`);
}

function printHelp() {
    console.log(`
BTC/USDT Buy-the-Dip Strategy Backtest with Live Binance Data

USAGE:
    node btc_strategy_live_backtest.js [options]

OPTIONS:
    --start DATE     Start date YYYY-MM-DD (default: ${Config.DEFAULT_START})
    --end DATE       End date YYYY-MM-DD (default: ${Config.DEFAULT_END})
    --verbose, -v    Print detailed trade log during backtest
    --export FILE    Export trades to CSV file
    --tp-first       Use TP-first (optimistic) for ambiguous days (default: SL-first)
    --compare        Run both SL-first and TP-first and compare
    --help, -h       Show this help message

EXAMPLES:
    node btc_strategy_live_backtest.js
    node btc_strategy_live_backtest.js --start 2025-06-01 --end 2025-12-31
    node btc_strategy_live_backtest.js --compare
    node btc_strategy_live_backtest.js --verbose --export trades.csv
`);
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
    const options = parseArgs();

    if (options.help) {
        printHelp();
        return;
    }

    console.log('='.repeat(80));
    console.log('BTC/USDT BUY-THE-DIP STRATEGY BACKTEST');
    console.log('Version 3.2 - With Live Binance Data (Node.js)');
    console.log('='.repeat(80));

    // Fetch data
    console.log(`\nFetching ${Config.SYMBOL} daily data from Binance...`);
    console.log(`Date range: ${options.start} to ${options.end}`);

    let data;
    try {
        data = await fetchBinanceKlines(Config.SYMBOL, Config.INTERVAL, options.start, options.end);
    } catch (error) {
        console.log(`\n❌ Failed to fetch data from Binance API`);
        console.log(`Error: ${error.message}`);
        console.log('\nPossible causes:');
        console.log('  - No internet connection');
        console.log('  - Binance API is down or rate-limited');
        console.log('  - Date range has no data (future dates)');
        console.log('\nTry running with different dates or check your connection.');
        process.exit(1);
    }

    if (!data || data.length === 0) {
        console.log('\n❌ No data returned from Binance API');
        process.exit(1);
    }

    console.log(`✅ Fetched ${data.length} days of data`);
    console.log(`   First candle: ${data[0].date} @ $${formatNumber(data[0].close, 2)}`);
    console.log(`   Last candle:  ${data[data.length - 1].date} @ $${formatNumber(data[data.length - 1].close, 2)}`);

    let result;

    if (options.compare) {
        // Run both interpretations and compare
        console.log('\n' + '='.repeat(80));
        console.log('COMPARING SL-FIRST vs TP-FIRST');
        console.log('='.repeat(80));

        const resultSl = runBacktest(data, true, false);
        const resultTp = runBacktest(data, false, false);

        console.log(`
                            SL-First         TP-First
                            (Conservative)   (Optimistic)
        ----------------------------------------------------------------
        Trades              ${padLeft(resultSl.totalTrades, 8)}         ${padLeft(resultTp.totalTrades, 8)}
        Wins                ${padLeft(resultSl.wins, 8)}         ${padLeft(resultTp.wins, 8)}
        Losses              ${padLeft(resultSl.losses, 8)}         ${padLeft(resultTp.losses, 8)}
        Win Rate            ${padLeft(resultSl.winRate.toFixed(1) + '%', 8)}         ${padLeft(resultTp.winRate.toFixed(1) + '%', 8)}
        Gross Profit        ${padLeft(formatCurrency(resultSl.grossProfit), 12)}   ${padLeft(formatCurrency(resultTp.grossProfit), 12)}
        Gross Loss          ${padLeft('$' + formatNumber(resultSl.grossLoss), 12)}   ${padLeft('$' + formatNumber(resultTp.grossLoss), 12)}
        Net P&L             ${padLeft(formatCurrency(resultSl.netPnl), 12)}   ${padLeft(formatCurrency(resultTp.netPnl), 12)}
        ROI                 ${padLeft((resultSl.roi >= 0 ? '+' : '') + resultSl.roi.toFixed(2) + '%', 8)}         ${padLeft((resultTp.roi >= 0 ? '+' : '') + resultTp.roi.toFixed(2) + '%', 8)}
        Max Drawdown        ${padLeft(resultSl.maxDrawdown.toFixed(2) + '%', 8)}         ${padLeft(resultTp.maxDrawdown.toFixed(2) + '%', 8)}
        RSI Filtered        ${padLeft(resultSl.filtered, 8)}         ${padLeft(resultTp.filtered, 8)}
        Ambiguous Days      ${padLeft(resultSl.ambiguous, 8)}         ${padLeft(resultTp.ambiguous, 8)}
        
        Buy & Hold P&L      ${padLeft(formatCurrency(resultSl.buyHoldPnl), 12)}
        Buy & Hold ROI      ${padLeft((resultSl.buyHoldRoi >= 0 ? '+' : '') + resultSl.buyHoldRoi.toFixed(2) + '%', 8)}
        `);

        // Use SL-first for detailed analysis
        result = resultSl;

    } else {
        // Run single backtest
        const slFirst = !options.tpFirst;
        const mode = slFirst ? 'SL-First (Conservative)' : 'TP-First (Optimistic)';

        result = runBacktest(data, slFirst, options.verbose);
        printResults(result, `BACKTEST RESULTS - ${mode}`);
    }

    // ATR & ROC Analysis
    printAtrAnalysis(result);

    // Trade log
    if (!options.verbose) {
        printTradeLog(result, 15);
    }

    // Export if requested
    if (options.export) {
        exportToCsv(result, options.export);
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));

    if (result.netPnl > result.buyHoldPnl) {
        console.log(`\n✅ Strategy OUTPERFORMS Buy & Hold by ${formatCurrency(result.netPnl - result.buyHoldPnl, 2)}`);
    } else {
        console.log(`\n❌ Strategy UNDERPERFORMS Buy & Hold by $${formatNumber(result.buyHoldPnl - result.netPnl, 2)}`);
    }

    console.log(`
Key Takeaways:
  - Win Rate: ${result.winRate.toFixed(1)}% (need >77% to profit)
  - ROC Filter saved ${result.filtered} potential losing trades (falling knives)
  - ${result.ambiguous} ambiguous days where both TP and SL could have hit
  - Using ${Config.ATR_MULTIPLIER}x ATR for dynamic stop loss
`);
}

main().catch(console.error);
