/**
 * PAXG Gold Buy-the-Dip Strategy v1.0
 * 
 * Converted from paxg_strategy_backtest.cjs
 * 
 * STRATEGY:
 * - Optimized for Pax Gold (PAXG/USDT) - lower volatility than BTC
 * - Buy when price drops $50 from reference high
 * - Take profit when price rises $100 above entry
 * - Fixed 3% stop-loss (ATR not needed for stable gold)
 * 
 * PARAMETERS:
 * - Drop Trigger: $50 (vs $3,000 for BTC) - PAXG moves ~$45/day avg
 * - Profit Target: $100 (vs $1,500 for BTC) - 2:1 reward ratio
 * - Stop Loss: 3% fixed (stable volatility)
 */

import type { Candle } from '../indicators/index.js';

export interface PAXGStrategyConfig {
    capital: number;
    positionSize: number;
    maxPositions: number;
    dropTrigger: number;      // Price drop to trigger buy ($50)
    profitTarget: number;     // Price rise for take-profit ($100)
    stopLossPct: number;      // Fixed stop-loss percentage (3%)
}

export const DEFAULT_PAXG_CONFIG: PAXGStrategyConfig = {
    capital: 100_000,
    positionSize: 20_000,
    maxPositions: 5,
    dropTrigger: 50,
    profitTarget: 100,
    stopLossPct: 3.0,
};

export interface PAXGPosition {
    entryPrice: number;
    quantity: number;
    investment: number;
    entryDate: string;
}

export interface PAXGTrade {
    type: 'WIN' | 'LOSS' | 'CLOSE' | 'LOSS (amb)';
    entryPrice: number;
    exitPrice: number;
    pnl: number;
    entryDate: string;
    exitDate: string;
}

export interface PAXGBacktestResult {
    trades: PAXGTrade[];
    wins: number;
    losses: number;
    ambiguous: number;
    grossProfit: number;
    grossLoss: number;
    finalCash: number;
    startPrice: number;
    endPrice: number;
    startDate: string;
    endDate: string;
}

/**
 * Run PAXG backtest on historical data
 */
export function runPAXGBacktest(
    data: Candle[],
    config: PAXGStrategyConfig = DEFAULT_PAXG_CONFIG
): PAXGBacktestResult {
    const result: PAXGBacktestResult = {
        trades: [],
        wins: 0,
        losses: 0,
        ambiguous: 0,
        grossProfit: 0,
        grossLoss: 0,
        finalCash: 0,
        startPrice: data[0]?.close || 0,
        endPrice: data[data.length - 1]?.close || 0,
        startDate: data[0]?.date || '',
        endDate: data[data.length - 1]?.date || '',
    };

    if (!data || data.length === 0) {
        return result;
    }

    let cash = config.capital;
    const openPositions: PAXGPosition[] = [];
    let referenceHigh = data[0].high;

    for (let i = 0; i < data.length; i++) {
        const candle = data[i];

        if (candle.high > referenceHigh) {
            referenceHigh = candle.high;
        }

        // Check exits
        for (let j = openPositions.length - 1; j >= 0; j--) {
            const pos = openPositions[j];
            const tpPrice = pos.entryPrice + config.profitTarget;
            const slPrice = pos.entryPrice * (1 - config.stopLossPct / 100);

            const tpHit = candle.high >= tpPrice;
            const slHit = candle.low <= slPrice;

            if (tpHit && slHit) {
                result.ambiguous++;
                const exitPrice = slPrice; // Conservative
                const loss = pos.investment - pos.quantity * exitPrice;
                cash += pos.quantity * exitPrice;
                result.losses++;
                result.grossLoss += loss;
                result.trades.push({
                    type: 'LOSS (amb)',
                    entryPrice: pos.entryPrice,
                    exitPrice,
                    pnl: -loss,
                    entryDate: pos.entryDate,
                    exitDate: candle.date,
                });
                openPositions.splice(j, 1);

            } else if (slHit) {
                const loss = pos.investment - pos.quantity * slPrice;
                cash += pos.quantity * slPrice;
                result.losses++;
                result.grossLoss += loss;
                result.trades.push({
                    type: 'LOSS',
                    entryPrice: pos.entryPrice,
                    exitPrice: slPrice,
                    pnl: -loss,
                    entryDate: pos.entryDate,
                    exitDate: candle.date,
                });
                openPositions.splice(j, 1);

            } else if (tpHit) {
                const profit = pos.quantity * tpPrice - pos.investment;
                cash += pos.quantity * tpPrice;
                result.wins++;
                result.grossProfit += profit;
                result.trades.push({
                    type: 'WIN',
                    entryPrice: pos.entryPrice,
                    exitPrice: tpPrice,
                    pnl: profit,
                    entryDate: pos.entryDate,
                    exitDate: candle.date,
                });
                openPositions.splice(j, 1);
            }
        }

        // Check entries
        if (openPositions.length < config.maxPositions && cash >= config.positionSize) {
            const buyTrigger = referenceHigh - config.dropTrigger;

            if (candle.low <= buyTrigger && buyTrigger > 0) {
                const entryPrice = buyTrigger;
                const quantity = config.positionSize / entryPrice;

                openPositions.push({
                    entryPrice,
                    quantity,
                    investment: config.positionSize,
                    entryDate: candle.date,
                });
                cash -= config.positionSize;
                referenceHigh = entryPrice;
            }
        }
    }

    // Close remaining positions
    const finalPrice = data[data.length - 1].close;
    for (const pos of openPositions) {
        const pnl = pos.quantity * finalPrice - pos.investment;
        cash += pos.quantity * finalPrice;

        if (pnl > 0) {
            result.wins++;
            result.grossProfit += pnl;
        } else {
            result.losses++;
            result.grossLoss += Math.abs(pnl);
        }

        result.trades.push({
            type: 'CLOSE',
            entryPrice: pos.entryPrice,
            exitPrice: finalPrice,
            pnl,
            entryDate: pos.entryDate,
            exitDate: data[data.length - 1].date,
        });
    }

    result.finalCash = cash;
    return result;
}

/**
 * Get stats for PAXG backtest
 */
export function getPAXGStats(result: PAXGBacktestResult, config: PAXGStrategyConfig = DEFAULT_PAXG_CONFIG) {
    const totalTrades = result.wins + result.losses;
    const netPnl = result.finalCash - config.capital;
    const roi = (netPnl / config.capital) * 100;
    const buyHoldQty = config.capital / result.startPrice;
    const buyHoldPnl = (result.endPrice - result.startPrice) * buyHoldQty;

    return {
        totalTrades,
        winRate: totalTrades > 0 ? (result.wins / totalTrades) * 100 : 0,
        netPnl,
        roi,
        avgWin: result.wins > 0 ? result.grossProfit / result.wins : 0,
        avgLoss: result.losses > 0 ? result.grossLoss / result.losses : 0,
        buyHoldPnl,
        outperformsBuyHold: netPnl > buyHoldPnl,
    };
}
