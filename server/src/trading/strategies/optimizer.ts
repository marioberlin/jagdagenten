/**
 * Strategy Optimizer
 * 
 * Converted from advanced_optimizer.cjs and rsi_optimizer.cjs
 * 
 * Tests different parameter combinations to find optimal strategy configuration:
 * - ATR-based dynamic stop-loss (various multipliers)
 * - ROC filter (various thresholds)
 * - Volume filter (various multipliers)
 * - RSI filter (various thresholds)
 */

import type { Candle } from '../indicators/index.js';
import { calculateATR, calculateROC, calculateRSI, calculateAvgVolume } from '../indicators/index.js';

export interface OptimizerParams {
    atrMultiplier: number;    // 0 = use fixed SL
    fixedSlPct: number;       // Used when ATR disabled
    rocThreshold: number;     // 0 = disabled
    volumeMultiplier: number; // 0 = disabled
    rsiThreshold: number;     // 0 = disabled
}

export interface OptimizationResult extends OptimizerParams {
    trades: number;
    wins: number;
    losses: number;
    filtered: number;
    netPnl: number;
    winRate: number;
    maxDrawdown: number;
    avgWin: number;
    avgLoss: number;
}

export interface OptimizerConfig {
    capital: number;
    positionSize: number;
    maxPositions: number;
    dropTrigger: number;
    profitTarget: number;
    atrPeriod: number;
    rocPeriod: number;
    rsiPeriod: number;
    volumePeriod: number;
}

export const DEFAULT_OPTIMIZER_CONFIG: OptimizerConfig = {
    capital: 100_000,
    positionSize: 20_000,
    maxPositions: 5,
    dropTrigger: 3_000,
    profitTarget: 1_500,
    atrPeriod: 14,
    rocPeriod: 3,
    rsiPeriod: 14,
    volumePeriod: 20,
};

// Parameter ranges to test
export const ATR_MULTIPLIERS = [0, 1.5, 2, 2.5, 3];
export const FIXED_SL_PCT = [5, 8, 12];
export const ROC_THRESHOLDS = [0, -5, -10, -15];
export const VOLUME_MULTIPLIERS = [0, 1.5, 2, 3];
export const RSI_THRESHOLDS = [0, 15, 25, 35, 45];

/**
 * Run single backtest with specific parameters
 */
function runBacktestWithParams(
    data: Candle[],
    params: OptimizerParams,
    config: OptimizerConfig
): OptimizationResult {
    let cash = config.capital;
    let referenceHigh = data[0].high;
    const positions: { entry: number; qty: number; inv: number; atr: number | null }[] = [];
    let wins = 0, losses = 0, filtered = 0;
    let grossProfit = 0, grossLoss = 0;
    let equity = config.capital, peak = config.capital, maxDd = 0;

    for (let i = 0; i < data.length; i++) {
        const candle = data[i];
        if (candle.high > referenceHigh) referenceHigh = candle.high;

        const atr = calculateATR(data, config.atrPeriod, i);
        const roc = calculateROC(data, config.rocPeriod, i);
        const rsi = calculateRSI(data, config.rsiPeriod, i);
        const avgVolume = calculateAvgVolume(data, config.volumePeriod, i);
        const volumeRatio = candle.volume / avgVolume;

        // Process exits
        for (let j = positions.length - 1; j >= 0; j--) {
            const pos = positions[j];
            const tpPrice = pos.entry + config.profitTarget;

            let slPrice: number;
            if (params.atrMultiplier > 0 && pos.atr) {
                slPrice = pos.entry - (params.atrMultiplier * pos.atr);
            } else {
                slPrice = pos.entry * (1 - params.fixedSlPct / 100);
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

        // Check entries
        if (positions.length < config.maxPositions && cash >= config.positionSize) {
            const buyTrigger = referenceHigh - config.dropTrigger;

            if (candle.low <= buyTrigger) {
                let skipTrade = false;

                // ROC filter
                if (params.rocThreshold < 0 && roc < params.rocThreshold) {
                    skipTrade = true;
                }

                // Volume filter
                if (params.volumeMultiplier > 0 && volumeRatio < params.volumeMultiplier) {
                    skipTrade = true;
                }

                // RSI filter
                if (params.rsiThreshold > 0 && rsi < params.rsiThreshold) {
                    skipTrade = true;
                }

                if (skipTrade) {
                    filtered++;
                } else {
                    const entryPrice = buyTrigger;
                    const qty = config.positionSize / entryPrice;
                    positions.push({ entry: entryPrice, qty, inv: config.positionSize, atr });
                    cash -= config.positionSize;
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

    // Close remaining
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
        netPnl: cash - config.capital,
        winRate: trades > 0 ? (wins / trades * 100) : 0,
        maxDrawdown: maxDd,
        avgWin: wins > 0 ? grossProfit / wins : 0,
        avgLoss: losses > 0 ? grossLoss / losses : 0,
    };
}

/**
 * Generate all parameter combinations
 */
export function generateParameterCombinations(): OptimizerParams[] {
    const combinations: OptimizerParams[] = [];

    for (const atr of ATR_MULTIPLIERS) {
        const slValues = atr === 0 ? FIXED_SL_PCT : [0];
        for (const sl of slValues) {
            for (const roc of ROC_THRESHOLDS) {
                for (const vol of VOLUME_MULTIPLIERS) {
                    for (const rsi of RSI_THRESHOLDS) {
                        combinations.push({
                            atrMultiplier: atr,
                            fixedSlPct: atr === 0 ? sl : 0,
                            rocThreshold: roc,
                            volumeMultiplier: vol,
                            rsiThreshold: rsi,
                        });
                    }
                }
            }
        }
    }

    return combinations;
}

/**
 * Run optimization across all parameter combinations
 */
export function runOptimization(
    data: Candle[],
    config: OptimizerConfig = DEFAULT_OPTIMIZER_CONFIG
): OptimizationResult[] {
    const combinations = generateParameterCombinations();
    const results = combinations.map(params => runBacktestWithParams(data, params, config));

    // Sort by net P&L
    results.sort((a, b) => b.netPnl - a.netPnl);

    return results;
}

/**
 * Run RSI-only optimization
 */
export function runRSIOptimization(
    data: Candle[],
    rsiValues: number[] = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50],
    config: OptimizerConfig = DEFAULT_OPTIMIZER_CONFIG
): OptimizationResult[] {
    const results = rsiValues.map(rsi =>
        runBacktestWithParams(data, {
            atrMultiplier: 0,
            fixedSlPct: 5,
            rocThreshold: 0,
            volumeMultiplier: 0,
            rsiThreshold: rsi,
        }, config)
    );

    results.sort((a, b) => b.netPnl - a.netPnl);
    return results;
}

/**
 * Get top N results
 */
export function getTopResults(results: OptimizationResult[], n: number = 10): OptimizationResult[] {
    return results.slice(0, n);
}

/**
 * Get best configuration
 */
export function getBestConfig(results: OptimizationResult[]): OptimizationResult | null {
    return results[0] || null;
}
