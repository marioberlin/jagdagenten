/**
 * Trading Technical Indicators
 * 
 * Pure functions for calculating technical indicators.
 * All functions are stateless and work with candle arrays.
 */

export interface Candle {
    timestamp?: number;
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

/**
 * Calculate Relative Strength Index (RSI)
 * Measures momentum on a scale of 0-100
 */
export function calculateRSI(data: Candle[], period: number, endIndex: number): number {
    if (endIndex < period) return 50.0;

    const gains: number[] = [];
    const losses: number[] = [];

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

/**
 * Calculate Average True Range (ATR)
 * Measures volatility using the greatest of:
 * - Current High - Current Low
 * - |Current High - Previous Close|
 * - |Current Low - Previous Close|
 */
export function calculateATR(data: Candle[], period: number, endIndex: number): number | null {
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

/**
 * Calculate Rate of Change (ROC)
 * Measures the percentage change over the period
 * Negative values indicate falling prices
 */
export function calculateROC(data: Candle[], period: number, endIndex: number): number {
    if (endIndex < period) return 0;

    const currentPrice = data[endIndex].close;
    const pastPrice = data[endIndex - period].close;
    return ((currentPrice - pastPrice) / pastPrice) * 100;
}

/**
 * Calculate Average Volume
 */
export function calculateAvgVolume(data: Candle[], period: number, endIndex: number): number {
    if (endIndex < period) return data[endIndex].volume;

    let sum = 0;
    for (let i = endIndex - period; i < endIndex; i++) {
        sum += data[i].volume;
    }
    return sum / period;
}

/**
 * Calculate Simple Moving Average (SMA)
 */
export function calculateSMA(data: Candle[], period: number, endIndex: number): number | null {
    if (endIndex < period - 1) return null;

    let sum = 0;
    for (let i = endIndex - period + 1; i <= endIndex; i++) {
        sum += data[i].close;
    }
    return sum / period;
}

/**
 * Calculate Exponential Moving Average (EMA)
 */
export function calculateEMA(data: Candle[], period: number, endIndex: number): number | null {
    if (endIndex < period - 1) return null;

    const multiplier = 2 / (period + 1);
    let ema = calculateSMA(data, period, period - 1);

    if (ema === null) return null;

    for (let i = period; i <= endIndex; i++) {
        ema = (data[i].close - ema) * multiplier + ema;
    }

    return ema;
}

/**
 * Calculate Bollinger Bands
 */
export function calculateBollingerBands(
    data: Candle[],
    period: number,
    stdDevMultiplier: number,
    endIndex: number
): { upper: number; middle: number; lower: number } | null {
    const sma = calculateSMA(data, period, endIndex);
    if (sma === null) return null;

    let sumSquares = 0;
    for (let i = endIndex - period + 1; i <= endIndex; i++) {
        sumSquares += Math.pow(data[i].close - sma, 2);
    }
    const stdDev = Math.sqrt(sumSquares / period);

    return {
        upper: sma + (stdDev * stdDevMultiplier),
        middle: sma,
        lower: sma - (stdDev * stdDevMultiplier),
    };
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
export function calculateMACD(
    data: Candle[],
    fastPeriod: number,
    slowPeriod: number,
    signalPeriod: number,
    endIndex: number
): { macd: number; signal: number; histogram: number } | null {
    const fastEMA = calculateEMA(data, fastPeriod, endIndex);
    const slowEMA = calculateEMA(data, slowPeriod, endIndex);

    if (fastEMA === null || slowEMA === null) return null;

    const macd = fastEMA - slowEMA;

    // For signal line, we'd need historical MACD values
    // Simplified: return just the MACD for now
    return {
        macd,
        signal: macd * 0.9, // Placeholder
        histogram: macd * 0.1,
    };
}
