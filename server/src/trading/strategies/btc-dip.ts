/**
 * BTC Buy-the-Dip Strategy v4.0
 * 
 * Converted from btc_strategy_live_backtest.cjs
 * 
 * STRATEGY:
 * - Buy when price drops $3,000 from reference high
 * - Take profit when price rises $1,500 above entry
 * - Dynamic stop-loss: 2.5x ATR (adapts to volatility)
 * - ROC filter: Skip buy when 3-day ROC < -10% (falling knife protection)
 * 
 * CANONICAL DEFINITIONS (v4.0):
 * 1. Profit Target = PRICE DELTA (+$1,500), actual profit ≈ $300 per win
 * 2. Stop Loss = 2.5x ATR (dynamic, volatility-aware)
 * 3. Reference High = candle HIGH (not close)
 * 4. Entry Price = trigger price (not close)
 * 5. ROC Filter = Skip when 3-day ROC < -10%
 * 6. Intraday Ordering = SL-First (conservative) when ambiguous
 */

import type { Candle } from '../indicators/index.js';
import { calculateATR, calculateROC } from '../indicators/index.js';

export interface BTCDipStrategyConfig {
    capital: number;
    positionSize: number;
    maxPositions: number;
    dropTrigger: number;      // Price drop to trigger buy
    profitTarget: number;     // Price rise for take-profit
    atrPeriod: number;
    atrMultiplier: number;    // ATR multiplier for stop-loss
    fallbackSlPct: number;    // Fallback SL % when ATR unavailable
    rocPeriod: number;
    rocThreshold: number;     // Skip buy when ROC below this
}

export const DEFAULT_BTC_CONFIG: BTCDipStrategyConfig = {
    capital: 100_000,
    positionSize: 20_000,
    maxPositions: 5,
    dropTrigger: 3_000,
    profitTarget: 1_500,
    atrPeriod: 14,
    atrMultiplier: 2.5,
    fallbackSlPct: 8.0,
    rocPeriod: 3,
    rocThreshold: -10,
};

export interface Position {
    entryPrice: number;
    quantity: number;
    investment: number;
    entryDate: string;
    atrAtEntry: number | null;
}

export interface Trade {
    type: 'WIN' | 'LOSS' | 'CLOSE' | 'WIN (ambiguous)' | 'LOSS (ambiguous)';
    entryPrice: number;
    exitPrice: number;
    pnl: number;
    entryDate: string;
    exitDate: string;
    quantity: number;
}

export interface BacktestResult {
    trades: Trade[];
    wins: number;
    losses: number;
    filtered: number;
    ambiguous: number;
    grossProfit: number;
    grossLoss: number;
    finalCash: number;
    startPrice: number;
    endPrice: number;
    startDate: string;
    endDate: string;
    maxDrawdown: number;
}

/**
 * Calculate take-profit price
 */
function getTpPrice(position: Position, config: BTCDipStrategyConfig): number {
    return position.entryPrice + config.profitTarget;
}

/**
 * Calculate stop-loss price (dynamic ATR-based or fallback)
 */
function getSlPrice(position: Position, config: BTCDipStrategyConfig): number {
    if (position.atrAtEntry !== null && config.atrMultiplier > 0) {
        return position.entryPrice - (config.atrMultiplier * position.atrAtEntry);
    }
    return position.entryPrice * (1 - config.fallbackSlPct / 100);
}

/**
 * Run backtest on historical data
 */
export function runBacktest(
    data: Candle[],
    config: BTCDipStrategyConfig = DEFAULT_BTC_CONFIG,
    slFirst: boolean = true
): BacktestResult {
    const result: BacktestResult = {
        trades: [],
        wins: 0,
        losses: 0,
        filtered: 0,
        ambiguous: 0,
        grossProfit: 0,
        grossLoss: 0,
        finalCash: 0,
        startPrice: data[0]?.close || 0,
        endPrice: data[data.length - 1]?.close || 0,
        startDate: data[0]?.date || '',
        endDate: data[data.length - 1]?.date || '',
        maxDrawdown: 0,
    };

    if (!data || data.length < config.atrPeriod + 1) {
        return result;
    }

    let cash = config.capital;
    const openPositions: Position[] = [];
    let referenceHigh = data[0].high;

    // Track drawdown
    let equity = config.capital;
    let peak = config.capital;

    for (let i = 0; i < data.length; i++) {
        const candle = data[i];

        // Update reference high from candle HIGH
        if (candle.high > referenceHigh) {
            referenceHigh = candle.high;
        }

        // Calculate indicators
        const atr = calculateATR(data, config.atrPeriod, i);
        const roc = calculateROC(data, config.rocPeriod, i);

        // Check exits for open positions
        const positionsToClose: number[] = [];

        for (let j = 0; j < openPositions.length; j++) {
            const pos = openPositions[j];
            const tpPrice = getTpPrice(pos, config);
            const slPrice = getSlPrice(pos, config);

            const tpHit = candle.high >= tpPrice;
            const slHit = candle.low <= slPrice;

            if (tpHit && slHit) {
                // Ambiguous: Both TP and SL hit in same candle
                result.ambiguous++;

                const exitPrice = slFirst ? slPrice : tpPrice;
                const exitValue = pos.quantity * exitPrice;

                if (slFirst) {
                    const loss = pos.investment - exitValue;
                    cash += exitValue;
                    result.losses++;
                    result.grossLoss += loss;
                    result.trades.push({
                        type: 'LOSS (ambiguous)',
                        entryPrice: pos.entryPrice,
                        exitPrice,
                        pnl: -loss,
                        entryDate: pos.entryDate,
                        exitDate: candle.date,
                        quantity: pos.quantity,
                    });
                } else {
                    const profit = exitValue - pos.investment;
                    cash += exitValue;
                    result.wins++;
                    result.grossProfit += profit;
                    result.trades.push({
                        type: 'WIN (ambiguous)',
                        entryPrice: pos.entryPrice,
                        exitPrice,
                        pnl: profit,
                        entryDate: pos.entryDate,
                        exitDate: candle.date,
                        quantity: pos.quantity,
                    });
                }
                positionsToClose.push(j);

            } else if (slHit) {
                const exitValue = pos.quantity * slPrice;
                const loss = pos.investment - exitValue;
                cash += exitValue;
                result.losses++;
                result.grossLoss += loss;
                result.trades.push({
                    type: 'LOSS',
                    entryPrice: pos.entryPrice,
                    exitPrice: slPrice,
                    pnl: -loss,
                    entryDate: pos.entryDate,
                    exitDate: candle.date,
                    quantity: pos.quantity,
                });
                positionsToClose.push(j);

            } else if (tpHit) {
                const exitValue = pos.quantity * tpPrice;
                const profit = exitValue - pos.investment;
                cash += exitValue;
                result.wins++;
                result.grossProfit += profit;
                result.trades.push({
                    type: 'WIN',
                    entryPrice: pos.entryPrice,
                    exitPrice: tpPrice,
                    pnl: profit,
                    entryDate: pos.entryDate,
                    exitDate: candle.date,
                    quantity: pos.quantity,
                });
                positionsToClose.push(j);
            }
        }

        // Remove closed positions (in reverse order)
        for (let j = positionsToClose.length - 1; j >= 0; j--) {
            openPositions.splice(positionsToClose[j], 1);
        }

        // Check for new entries
        if (openPositions.length < config.maxPositions && cash >= config.positionSize) {
            const buyTrigger = referenceHigh - config.dropTrigger;

            if (candle.low <= buyTrigger) {
                // ROC filter: Skip when price falling too fast
                if (config.rocThreshold < 0 && roc < config.rocThreshold) {
                    result.filtered++;
                } else {
                    // Execute buy
                    const entryPrice = buyTrigger;
                    const quantity = config.positionSize / entryPrice;

                    openPositions.push({
                        entryPrice,
                        quantity,
                        investment: config.positionSize,
                        entryDate: candle.date,
                        atrAtEntry: atr,
                    });
                    cash -= config.positionSize;

                    // Reset reference high after buy
                    referenceHigh = entryPrice;
                }
            }
        }

        // Update equity for drawdown tracking
        equity = cash + openPositions.reduce((sum, p) => sum + p.quantity * candle.close, 0);
        if (equity > peak) peak = equity;
        const dd = ((peak - equity) / peak) * 100;
        if (dd > result.maxDrawdown) result.maxDrawdown = dd;
    }

    // Close remaining positions at final price
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

        result.trades.push({
            type: 'CLOSE',
            entryPrice: pos.entryPrice,
            exitPrice: finalPrice,
            pnl,
            entryDate: pos.entryDate,
            exitDate: finalDate,
            quantity: pos.quantity,
        });
    }

    result.finalCash = cash;
    return result;
}

/**
 * Get result statistics
 */
export function getStats(result: BacktestResult, config: BTCDipStrategyConfig = DEFAULT_BTC_CONFIG) {
    const totalTrades = result.wins + result.losses;
    const netPnl = result.finalCash - config.capital;
    const roi = (netPnl / config.capital) * 100;
    const buyHoldQty = config.capital / result.startPrice;
    const buyHoldPnl = (result.endPrice - result.startPrice) * buyHoldQty;
    const buyHoldRoi = ((result.endPrice / result.startPrice) - 1) * 100;

    return {
        totalTrades,
        winRate: totalTrades > 0 ? (result.wins / totalTrades) * 100 : 0,
        netPnl,
        roi,
        avgWin: result.wins > 0 ? result.grossProfit / result.wins : 0,
        avgLoss: result.losses > 0 ? result.grossLoss / result.losses : 0,
        buyHoldPnl,
        buyHoldRoi,
        outperformsBuyHold: netPnl > buyHoldPnl,
    };
}
