#!/usr/bin/env bun
/**
 * Trading Strategy Runner
 * 
 * Unified CLI for running backtests and optimizations using the new
 * server/src/trading architecture.
 * 
 * Usage:
 *   bun run scripts/run_strategy.ts btc --start 2024-01-01
 *   bun run scripts/run_strategy.ts paxg --verbose
 *   bun run scripts/run_strategy.ts optimize --symbol BTCUSDT
 */

import { parseArgs } from 'util';
import {
    runBacktest as runBtcBacktest,
    getStats as getBtcStats,
    DEFAULT_BTC_CONFIG
} from '../server/src/trading/strategies/btc-dip.js';
import {
    runPAXGBacktest,
    getPAXGStats,
    DEFAULT_PAXG_CONFIG
} from '../server/src/trading/strategies/paxg-dip.js';
import {
    runOptimization,
    getTopResults,
    DEFAULT_OPTIMIZER_CONFIG
} from '../server/src/trading/strategies/optimizer.js';
import {
    fetchBinanceKlines,
    fetchExtendedKlines
} from '../server/src/trading/backtest/binance.js';

type Command = 'btc' | 'paxg' | 'optimize';

function formatCurrency(num: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
}

function formatPercent(num: number) {
    return new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2 }).format(num / 100);
}

async function main() {
    const args = process.argv.slice(2);
    const command = args[0] as Command;

    // Parse flags manually since util.parseArgs is limited in Bun currently
    const startIdx = args.indexOf('--start');
    const startDate = startIdx > -1 ? args[startIdx + 1] : '2024-01-01';

    const endIdx = args.indexOf('--end');
    const endDate = endIdx > -1 ? args[endIdx + 1] : new Date().toISOString().split('T')[0];

    const verbose = args.includes('--verbose') || args.includes('-v');

    if (!['btc', 'paxg', 'optimize'].includes(command)) {
        console.log(`
Usage:
  bun run scripts/run_strategy.ts <command> [options]

Commands:
  btc       Run BTC Buy-the-Dip v4.0 backtest
  paxg      Run PAXG Gold v1.0 backtest
  optimize  Run parameter optimization

Options:
  --start   Start date (YYYY-MM-DD)
  --end     End date (YYYY-MM-DD)
  --verbose Show detailed trade logs
`);
        process.exit(1);
    }

    console.log(`\n🚀 Running ${command.toUpperCase()} Strategy`);
    console.log(`📅 Period: ${startDate} to ${endDate}\n`);

    try {
        if (command === 'btc') {
            console.log('Fetching BTCUSDT data...');
            const data = await fetchExtendedKlines({
                symbol: 'BTCUSDT',
                interval: '1d',
                startDate,
                endDate
            });
            console.log(`Loaded ${data.length} candles.`);

            const result = runBtcBacktest(data, DEFAULT_BTC_CONFIG);
            const stats = getBtcStats(result, DEFAULT_BTC_CONFIG);

            console.log('\n📊 Results:');
            console.log(`  Initial Capital:    ${formatCurrency(DEFAULT_BTC_CONFIG.capital)}`);
            console.log(`  Final Capital:      ${formatCurrency(result.finalCash)}`);
            console.log(`  Net P&L:            ${formatCurrency(stats.netPnl)} (${formatPercent(stats.roi)})`);
            console.log(`  Win Rate:           ${stats.winRate.toFixed(1)}% (${result.wins}/${stats.totalTrades})`);
            console.log(`  Max Drawdown:       ${result.maxDrawdown.toFixed(2)}%`);
            console.log(`  Vs Buy & Hold:      ${stats.outperformsBuyHold ? '✅ Outperformed' : '❌ Underperformed'} (${formatCurrency(stats.netPnl - stats.buyHoldPnl)})`);

            if (verbose) {
                console.log('\n📝 Trade Log:');
                result.trades.forEach(t => {
                    console.log(`  ${t.exitDate} ${t.type.padEnd(16)} P&L: ${formatCurrency(t.pnl).padStart(12)}`);
                });
            }

        } else if (command === 'paxg') {
            console.log('Fetching PAXGUSDT data...');
            const data = await fetchExtendedKlines({
                symbol: 'PAXGUSDT',
                interval: '1d',
                startDate,
                endDate
            });
            console.log(`Loaded ${data.length} candles.`);

            const result = runPAXGBacktest(data, DEFAULT_PAXG_CONFIG);
            const stats = getPAXGStats(result, DEFAULT_PAXG_CONFIG);

            console.log('\n📊 Results:');
            console.log(`  Initial Capital:    ${formatCurrency(DEFAULT_PAXG_CONFIG.capital)}`);
            console.log(`  Final Capital:      ${formatCurrency(result.finalCash)}`);
            console.log(`  Net P&L:            ${formatCurrency(stats.netPnl)} (${formatPercent(stats.roi)})`);
            console.log(`  Win Rate:           ${stats.winRate.toFixed(1)}% (${result.wins}/${stats.totalTrades})`);
            console.log(`  Vs Buy & Hold:      ${stats.outperformsBuyHold ? '✅ Outperformed' : '❌ Underperformed'} (${formatCurrency(stats.netPnl - stats.buyHoldPnl)})`);

        } else if (command === 'optimize') {
            console.log('Fetching BTCUSDT data for optimization...');
            const data = await fetchExtendedKlines({
                symbol: 'BTCUSDT',
                interval: '1d',
                startDate,
                endDate
            });
            console.log(`Loaded ${data.length} candles.`);
            console.log('Testing parameter combinations...');

            const results = runOptimization(data, DEFAULT_OPTIMIZER_CONFIG);
            const top = getTopResults(results, 5);

            console.log('\n🏆 Top 5 Configurations:');
            console.log('  Rank | Net P&L      | Win Rate | Max DD  | Params (ATR/ROC/Vol)');
            console.log('  -----|--------------|----------|---------|---------------------');

            top.forEach((r, i) => {
                const params = `${r.atrMultiplier}x / ${r.rocThreshold}% / ${r.volumeMultiplier}x`;
                console.log(`  #${i + 1}   | ${formatCurrency(r.netPnl).padEnd(12)} | ${r.winRate.toFixed(1).padStart(5)}%   | ${r.maxDrawdown.toFixed(1).padStart(5)}%  | ${params}`);
            });
        }

    } catch (e) {
        console.error('Error:', e instanceof Error ? e.message : String(e));
        process.exit(1);
    }
}

main();
