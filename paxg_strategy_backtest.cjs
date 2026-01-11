#!/usr/bin/env node
/**
 * =============================================================================
 * PAXG/USDT Buy-the-Dip Strategy Backtest with Live Binance Data
 * =============================================================================
 * 
 * Optimized parameters for Pax Gold (PAXG/USDT) trading pair.
 * PAXG tracks physical gold price with lower volatility than BTC.
 * 
 * USAGE:
 *     node paxg_strategy_backtest.cjs
 *     node paxg_strategy_backtest.cjs --start 2024-01-01 --end 2026-01-05
 *     node paxg_strategy_backtest.cjs --verbose
 * 
 * OPTIMIZED PARAMETERS (vs BTC):
 *     - Drop Trigger: $50 (vs $3,000 for BTC) - PAXG moves ~$45/day avg
 *     - Profit Target: $100 (vs $1,500 for BTC) - 2:1 reward ratio
 *     - Stop Loss: 3% fixed (vs ATR for BTC) - stable volatility
 *     - No ROC filter needed - PAXG rarely crashes
 * 
 * Version: 1.0 (PAXG Optimized)
 * Date: January 6, 2026
 * =============================================================================
 */

const https = require('https');
const fs = require('fs');

const Config = {
    CAPITAL: 100_000,
    POSITION_SIZE: 20_000,
    MAX_POSITIONS: 5,
    
    // PAXG-Optimized Entry/Exit
    DROP_TRIGGER: 50,          // Buy when price drops $50 from reference high
    PROFIT_TARGET: 100,        // Exit when price RISES $100 above entry
    STOP_LOSS_PCT: 3.0,        // OPTIMIZED: 3% fixed SL (ATR not needed for PAXG)
    
    SYMBOL: 'PAXGUSDT',
    INTERVAL: '1d',
    DEFAULT_START: '2024-01-01',
    DEFAULT_END: '2026-01-05',
};

// =============================================================================
// UTILITIES
// =============================================================================

function parseArgs() {
    const args = process.argv.slice(2);
    const options = { start: Config.DEFAULT_START, end: Config.DEFAULT_END, verbose: false, export: null, help: false };
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--start') options.start = args[++i];
        else if (args[i] === '--end') options.end = args[++i];
        else if (args[i] === '--verbose' || args[i] === '-v') options.verbose = true;
        else if (args[i] === '--export') options.export = args[++i];
        else if (args[i] === '--help' || args[i] === '-h') options.help = true;
    }
    return options;
}

function formatNumber(num, decimals = 0) {
    return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function formatCurrency(num, decimals = 0) {
    return `${num >= 0 ? '+' : ''}$${formatNumber(Math.abs(num), decimals)}`;
}

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
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const rawData = JSON.parse(data);
                    if (rawData.code) { reject(new Error(`Binance API: ${rawData.msg}`)); return; }
                    resolve(rawData.map(k => ({
                        date: new Date(k[0]).toISOString().split('T')[0],
                        open: parseFloat(k[1]), high: parseFloat(k[2]),
                        low: parseFloat(k[3]), close: parseFloat(k[4]),
                        volume: parseFloat(k[5]),
                    })));
                } catch (e) { reject(e); }
            });
        }).on('error', reject);
    });
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
    getTpPrice() { return this.entryPrice + Config.PROFIT_TARGET; }
    getSlPrice() { return this.entryPrice * (1 - Config.STOP_LOSS_PCT / 100); }
}

function runBacktest(data, verbose = false) {
    const result = {
        trades: [], wins: 0, losses: 0, filtered: 0, ambiguous: 0,
        grossProfit: 0, grossLoss: 0, finalCash: 0,
        startPrice: data[0].close, endPrice: data[data.length - 1].close,
        startDate: data[0].date, endDate: data[data.length - 1].date,
    };
    
    let cash = Config.CAPITAL;
    const openPositions = [];
    let referenceHigh = data[0].high;
    
    if (verbose) console.log('\n' + '='.repeat(80) + '\nTRADE LOG\n' + '='.repeat(80));
    
    for (let i = 0; i < data.length; i++) {
        const candle = data[i];
        if (candle.high > referenceHigh) referenceHigh = candle.high;
        
        // Check exits
        for (let j = openPositions.length - 1; j >= 0; j--) {
            const pos = openPositions[j];
            const tpPrice = pos.getTpPrice();
            const slPrice = pos.getSlPrice();
            
            const tpHit = candle.high >= tpPrice;
            const slHit = candle.low <= slPrice;
            
            if (tpHit && slHit) {
                result.ambiguous++;
                const exitPrice = slPrice; // Conservative
                const loss = pos.investment - pos.quantity * exitPrice;
                cash += pos.quantity * exitPrice;
                result.losses++; result.grossLoss += loss;
                result.trades.push({ type: 'LOSS (amb)', entry: pos.entryPrice, exit: exitPrice, pnl: -loss, entryDate: pos.entryDate, exitDate: candle.date });
                openPositions.splice(j, 1);
                if (verbose) console.log(`${candle.date}: LOSS (amb) Entry=$${pos.entryPrice.toFixed(2)} Exit=$${exitPrice.toFixed(2)} P&L=${formatCurrency(-loss)}`);
            } else if (slHit) {
                const loss = pos.investment - pos.quantity * slPrice;
                cash += pos.quantity * slPrice;
                result.losses++; result.grossLoss += loss;
                result.trades.push({ type: 'LOSS', entry: pos.entryPrice, exit: slPrice, pnl: -loss, entryDate: pos.entryDate, exitDate: candle.date });
                openPositions.splice(j, 1);
                if (verbose) console.log(`${candle.date}: LOSS Entry=$${pos.entryPrice.toFixed(2)} Exit=$${slPrice.toFixed(2)} P&L=${formatCurrency(-loss)}`);
            } else if (tpHit) {
                const profit = pos.quantity * tpPrice - pos.investment;
                cash += pos.quantity * tpPrice;
                result.wins++; result.grossProfit += profit;
                result.trades.push({ type: 'WIN', entry: pos.entryPrice, exit: tpPrice, pnl: profit, entryDate: pos.entryDate, exitDate: candle.date });
                openPositions.splice(j, 1);
                if (verbose) console.log(`${candle.date}: WIN Entry=$${pos.entryPrice.toFixed(2)} Exit=$${tpPrice.toFixed(2)} P&L=${formatCurrency(profit)}`);
            }
        }
        
        // Check entries
        if (openPositions.length < Config.MAX_POSITIONS && cash >= Config.POSITION_SIZE) {
            const buyTrigger = referenceHigh - Config.DROP_TRIGGER;
            if (candle.low <= buyTrigger && buyTrigger > 0) {
                const entryPrice = buyTrigger;
                const quantity = Config.POSITION_SIZE / entryPrice;
                openPositions.push(new Position(entryPrice, quantity, Config.POSITION_SIZE, candle.date));
                cash -= Config.POSITION_SIZE;
                referenceHigh = entryPrice;
                if (verbose) console.log(`${candle.date}: BUY @ $${entryPrice.toFixed(2)} (SL=$${(entryPrice * (1 - Config.STOP_LOSS_PCT / 100)).toFixed(2)}, TP=$${(entryPrice + Config.PROFIT_TARGET).toFixed(2)})`);
            }
        }
    }
    
    // Close remaining
    const finalPrice = data[data.length - 1].close;
    for (const pos of openPositions) {
        const pnl = pos.quantity * finalPrice - pos.investment;
        cash += pos.quantity * finalPrice;
        if (pnl > 0) { result.wins++; result.grossProfit += pnl; }
        else { result.losses++; result.grossLoss += Math.abs(pnl); }
        result.trades.push({ type: 'CLOSE', entry: pos.entryPrice, exit: finalPrice, pnl, entryDate: pos.entryDate, exitDate: data[data.length - 1].date });
        if (verbose) console.log(`${data[data.length - 1].date}: CLOSE Entry=$${pos.entryPrice.toFixed(2)} Exit=$${finalPrice.toFixed(2)} P&L=${formatCurrency(pnl)}`);
    }
    
    result.finalCash = cash;
    return result;
}

// =============================================================================
// REPORTING
// =============================================================================

function printResults(result) {
    const totalTrades = result.wins + result.losses;
    const winRate = totalTrades > 0 ? (result.wins / totalTrades) * 100 : 0;
    const netPnl = result.finalCash - Config.CAPITAL;
    const roi = (netPnl / Config.CAPITAL) * 100;
    const buyHoldQty = Config.CAPITAL / result.startPrice;
    const buyHoldPnl = (result.endPrice - result.startPrice) * buyHoldQty;
    const avgWin = result.wins > 0 ? result.grossProfit / result.wins : 0;
    const avgLoss = result.losses > 0 ? result.grossLoss / result.losses : 0;
    
    // Max drawdown
    let equity = Config.CAPITAL, peak = Config.CAPITAL, maxDd = 0;
    for (const t of result.trades) {
        equity += t.pnl;
        if (equity > peak) peak = equity;
        const dd = ((peak - equity) / peak) * 100;
        if (dd > maxDd) maxDd = dd;
    }
    
    console.log(`
${'='.repeat(80)}
PAXG/USDT BACKTEST RESULTS
${'='.repeat(80)}

STRATEGY PARAMETERS:
  Capital:          $${formatNumber(Config.CAPITAL)}
  Position Size:    $${formatNumber(Config.POSITION_SIZE)}
  Max Positions:    ${Config.MAX_POSITIONS}
  Drop Trigger:     $${Config.DROP_TRIGGER} (PAXG-optimized)
  Profit Target:    $${Config.PROFIT_TARGET} price rise
  Stop Loss:        ${Config.STOP_LOSS_PCT}%

DATA PERIOD:
  Start:    ${result.startDate} @ $${formatNumber(result.startPrice, 2)}
  End:      ${result.endDate} @ $${formatNumber(result.endPrice, 2)}
  Days:     ${result.trades.length > 0 ? Math.round((new Date(result.endDate) - new Date(result.startDate)) / 86400000) : 0}

${'='.repeat(80)}
PERFORMANCE METRICS
${'='.repeat(80)}

TRADES:
  Total:     ${totalTrades}
  Wins:      ${result.wins}
  Losses:    ${result.losses}
  Win Rate:  ${winRate.toFixed(1)}%
  Ambiguous: ${result.ambiguous}

PROFIT/LOSS:
  Gross Profit:  ${formatCurrency(result.grossProfit, 2)}
  Gross Loss:    $${formatNumber(result.grossLoss, 2)}
  Net P&L:       ${formatCurrency(netPnl, 2)}
  ROI:           ${roi >= 0 ? '+' : ''}${roi.toFixed(2)}%
  Max Drawdown:  ${maxDd.toFixed(2)}%

PER-TRADE ANALYSIS:
  Avg Win:       $${formatNumber(avgWin, 2)}
  Avg Loss:      $${formatNumber(avgLoss, 2)}
  Risk/Reward:   ${avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : 'N/A'}:1

vs BUY & HOLD:
  Strategy:      ${formatCurrency(netPnl, 2)}
  Buy & Hold:    ${formatCurrency(buyHoldPnl, 2)}
  ${netPnl > buyHoldPnl ? '✅ STRATEGY OUTPERFORMS' : '❌ BUY & HOLD OUTPERFORMS'}
`);
}

function printTradeLog(result, lastN = 15) {
    console.log(`\n${'='.repeat(80)}\nTRADE LOG (Last ${Math.min(lastN, result.trades.length)} trades)\n${'='.repeat(80)}\n`);
    const trades = result.trades.slice(-lastN);
    console.log('Date       | Type     | Entry    | Exit     | P&L');
    console.log('-'.repeat(60));
    for (const t of trades) {
        console.log(`${t.exitDate} | ${t.type.padEnd(8)} | $${t.entry.toFixed(2).padStart(7)} | $${t.exit.toFixed(2).padStart(7)} | ${formatCurrency(t.pnl)}`);
    }
}

function printHelp() {
    console.log(`
PAXG/USDT Buy-the-Dip Strategy Backtest

USAGE:
    node paxg_strategy_backtest.cjs [options]

OPTIONS:
    --start DATE     Start date YYYY-MM-DD (default: ${Config.DEFAULT_START})
    --end DATE       End date YYYY-MM-DD (default: ${Config.DEFAULT_END})
    --verbose, -v    Print detailed trade log
    --export FILE    Export trades to CSV
    --help, -h       Show this help

EXAMPLES:
    node paxg_strategy_backtest.cjs
    node paxg_strategy_backtest.cjs --start 2024-06-01 --end 2025-12-31
    node paxg_strategy_backtest.cjs --verbose
`);
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
    const options = parseArgs();
    if (options.help) { printHelp(); return; }
    
    console.log('='.repeat(80));
    console.log('PAXG/USDT BUY-THE-DIP STRATEGY BACKTEST');
    console.log('Version 1.0 - Optimized for Pax Gold');
    console.log('='.repeat(80));
    
    console.log(`\nFetching ${Config.SYMBOL} daily data from Binance...`);
    console.log(`Date range: ${options.start} to ${options.end}`);
    
    let data;
    try {
        data = await fetchBinanceKlines(Config.SYMBOL, Config.INTERVAL, options.start, options.end);
    } catch (error) {
        console.log(`\n❌ Failed to fetch data: ${error.message}`);
        process.exit(1);
    }
    
    console.log(`✅ Fetched ${data.length} days of data`);
    console.log(`   First: ${data[0].date} @ $${data[0].close.toFixed(2)}`);
    console.log(`   Last:  ${data[data.length - 1].date} @ $${data[data.length - 1].close.toFixed(2)}`);
    
    const result = runBacktest(data, options.verbose);
    printResults(result);
    
    if (!options.verbose) printTradeLog(result, 15);
    
    if (options.export) {
        const csv = 'entry_date,exit_date,type,entry,exit,pnl\n' + 
            result.trades.map(t => `${t.entryDate},${t.exitDate},${t.type},${t.entry.toFixed(2)},${t.exit.toFixed(2)},${t.pnl.toFixed(2)}`).join('\n');
        fs.writeFileSync(options.export, csv);
        console.log(`\nTrades exported to: ${options.export}`);
    }
}

main().catch(console.error);
