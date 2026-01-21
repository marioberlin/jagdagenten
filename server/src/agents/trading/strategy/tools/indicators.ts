/**
 * Technical Indicator Tools
 * 
 * Reusable technical analysis functions that can be used by StrategyAgent
 * and other agents. These implement the logic layers from TraderOld.
 */

import type { KlineData, TradingSignal, IndicatorResult, SignalDirection } from '../shared/types.js';

// ============================================================================
// RSI (Relative Strength Index)
// ============================================================================

export function calculateRSI(closes: number[], period: number = 14): number {
    if (closes.length < period + 1) return 50; // Neutral if not enough data

    let gains = 0;
    let losses = 0;

    // Calculate initial average gain/loss
    for (let i = 1; i <= period; i++) {
        const change = closes[i] - closes[i - 1];
        if (change > 0) gains += change;
        else losses -= change;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Use smoothed averages for remaining periods
    for (let i = period + 1; i < closes.length; i++) {
        const change = closes[i] - closes[i - 1];
        if (change > 0) {
            avgGain = (avgGain * (period - 1) + change) / period;
            avgLoss = (avgLoss * (period - 1)) / period;
        } else {
            avgGain = (avgGain * (period - 1)) / period;
            avgLoss = (avgLoss * (period - 1) - change) / period;
        }
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

export function rsiSignal(klines: KlineData[], oversoldThreshold: number = 30, overboughtThreshold: number = 70): IndicatorResult {
    const closes = klines.map(k => k.close);
    const rsi = calculateRSI(closes);

    let signal: SignalDirection = 'hold';
    let confidence = 50;

    if (rsi < oversoldThreshold) {
        signal = 'buy';
        confidence = 60 + Math.min(30, (oversoldThreshold - rsi) * 2);
    } else if (rsi > overboughtThreshold) {
        signal = 'sell';
        confidence = 60 + Math.min(30, (rsi - overboughtThreshold) * 2);
    }

    return {
        name: 'RSI',
        value: rsi,
        signal,
        confidence,
        metadata: { period: 14, oversoldThreshold, overboughtThreshold },
    };
}

// ============================================================================
// MACD (Moving Average Convergence Divergence)
// ============================================================================

export function calculateEMA(data: number[], period: number): number[] {
    if (data.length < period) return [];

    const multiplier = 2 / (period + 1);
    const ema: number[] = [];

    // Start with SMA
    let sum = 0;
    for (let i = 0; i < period; i++) {
        sum += data[i];
    }
    ema.push(sum / period);

    // Calculate EMA
    for (let i = period; i < data.length; i++) {
        ema.push((data[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1]);
    }

    return ema;
}

export function calculateMACD(closes: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): {
    macd: number[];
    signal: number[];
    histogram: number[];
} {
    const emaFast = calculateEMA(closes, fastPeriod);
    const emaSlow = calculateEMA(closes, slowPeriod);

    // Align arrays
    const offset = slowPeriod - fastPeriod;
    const macdLine: number[] = [];

    for (let i = 0; i < emaSlow.length; i++) {
        macdLine.push(emaFast[i + offset] - emaSlow[i]);
    }

    const signalLine = calculateEMA(macdLine, signalPeriod);
    const histogram: number[] = [];

    const signalOffset = signalPeriod - 1;
    for (let i = signalOffset; i < macdLine.length; i++) {
        histogram.push(macdLine[i] - signalLine[i - signalOffset]);
    }

    return { macd: macdLine, signal: signalLine, histogram };
}

export function macdSignal(klines: KlineData[]): IndicatorResult {
    const closes = klines.map(k => k.close);
    const { macd, signal: signalLine, histogram } = calculateMACD(closes);

    if (histogram.length < 2) {
        return { name: 'MACD', value: 0, signal: 'hold', confidence: 50 };
    }

    const currentHist = histogram[histogram.length - 1];
    const prevHist = histogram[histogram.length - 2];

    let signalDir: SignalDirection = 'hold';
    let confidence = 50;

    // Bullish crossover (histogram crosses above zero)
    if (prevHist < 0 && currentHist > 0) {
        signalDir = 'buy';
        confidence = 70;
    }
    // Bearish crossover (histogram crosses below zero)
    else if (prevHist > 0 && currentHist < 0) {
        signalDir = 'sell';
        confidence = 70;
    }
    // Strong momentum
    else if (currentHist > 0 && currentHist > prevHist) {
        signalDir = 'buy';
        confidence = 55;
    } else if (currentHist < 0 && currentHist < prevHist) {
        signalDir = 'sell';
        confidence = 55;
    }

    return {
        name: 'MACD',
        value: macd[macd.length - 1] || 0,
        signal: signalDir,
        confidence,
        metadata: { histogram: currentHist, signalLine: signalLine[signalLine.length - 1] },
    };
}

// ============================================================================
// Moving Average Crossover
// ============================================================================

export function calculateSMA(data: number[], period: number): number[] {
    if (data.length < period) return [];

    const sma: number[] = [];
    let sum = 0;

    for (let i = 0; i < period; i++) {
        sum += data[i];
    }
    sma.push(sum / period);

    for (let i = period; i < data.length; i++) {
        sum = sum - data[i - period] + data[i];
        sma.push(sum / period);
    }

    return sma;
}

export function maCrossoverSignal(klines: KlineData[], fastPeriod: number = 9, slowPeriod: number = 21): IndicatorResult {
    const closes = klines.map(k => k.close);
    const fastMA = calculateSMA(closes, fastPeriod);
    const slowMA = calculateSMA(closes, slowPeriod);

    if (fastMA.length < 2 || slowMA.length < 2) {
        return { name: 'MA Crossover', value: 0, signal: 'hold', confidence: 50 };
    }

    const offset = slowPeriod - fastPeriod;
    const currentFast = fastMA[fastMA.length - 1];
    const prevFast = fastMA[fastMA.length - 2];
    const currentSlow = slowMA[slowMA.length - 1];
    const prevSlow = slowMA[slowMA.length - 2];

    let signalDir: SignalDirection = 'hold';
    let confidence = 50;

    // Golden cross (fast crosses above slow)
    if (prevFast <= prevSlow && currentFast > currentSlow) {
        signalDir = 'buy';
        confidence = 75;
    }
    // Death cross (fast crosses below slow)
    else if (prevFast >= prevSlow && currentFast < currentSlow) {
        signalDir = 'sell';
        confidence = 75;
    }
    // Fast above slow (bullish trend)
    else if (currentFast > currentSlow) {
        signalDir = 'buy';
        confidence = 55;
    }
    // Fast below slow (bearish trend)
    else if (currentFast < currentSlow) {
        signalDir = 'sell';
        confidence = 55;
    }

    return {
        name: 'MA Crossover',
        value: currentFast - currentSlow,
        signal: signalDir,
        confidence,
        metadata: { fastMA: currentFast, slowMA: currentSlow, fastPeriod, slowPeriod },
    };
}

// ============================================================================
// Bollinger Bands
// ============================================================================

export function calculateBollingerBands(closes: number[], period: number = 20, stdDevMultiplier: number = 2): {
    upper: number;
    middle: number;
    lower: number;
    bandwidth: number;
} {
    if (closes.length < period) {
        return { upper: 0, middle: 0, lower: 0, bandwidth: 0 };
    }

    const slice = closes.slice(-period);
    const middle = slice.reduce((sum, v) => sum + v, 0) / period;

    const variance = slice.reduce((sum, v) => sum + Math.pow(v - middle, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    const upper = middle + stdDevMultiplier * stdDev;
    const lower = middle - stdDevMultiplier * stdDev;
    const bandwidth = (upper - lower) / middle;

    return { upper, middle, lower, bandwidth };
}

export function bollingerSignal(klines: KlineData[]): IndicatorResult {
    const closes = klines.map(k => k.close);
    const { upper, middle, lower, bandwidth } = calculateBollingerBands(closes);
    const currentPrice = closes[closes.length - 1];

    let signalDir: SignalDirection = 'hold';
    let confidence = 50;

    // Price below lower band (oversold)
    if (currentPrice < lower) {
        signalDir = 'buy';
        confidence = 65 + Math.min(20, ((lower - currentPrice) / lower) * 100);
    }
    // Price above upper band (overbought)
    else if (currentPrice > upper) {
        signalDir = 'sell';
        confidence = 65 + Math.min(20, ((currentPrice - upper) / upper) * 100);
    }
    // Price near middle (neutral)
    else {
        const position = (currentPrice - lower) / (upper - lower);
        if (position < 0.3) {
            signalDir = 'buy';
            confidence = 55;
        } else if (position > 0.7) {
            signalDir = 'sell';
            confidence = 55;
        }
    }

    return {
        name: 'Bollinger Bands',
        value: bandwidth,
        signal: signalDir,
        confidence,
        metadata: { upper, middle, lower, currentPrice },
    };
}

// ============================================================================
// Volume Spike
// ============================================================================

export function volumeSpikeSignal(klines: KlineData[], threshold: number = 2.0): IndicatorResult {
    if (klines.length < 20) {
        return { name: 'Volume Spike', value: 1, signal: 'hold', confidence: 50 };
    }

    const volumes = klines.map(k => k.volume);
    const currentVolume = volumes[volumes.length - 1];
    const avgVolume = volumes.slice(-20, -1).reduce((sum, v) => sum + v, 0) / 19;
    const volumeRatio = currentVolume / avgVolume;

    const priceChange = (klines[klines.length - 1].close - klines[klines.length - 2].close) / klines[klines.length - 2].close;

    let signalDir: SignalDirection = 'hold';
    let confidence = 50;

    if (volumeRatio > threshold) {
        if (priceChange > 0) {
            signalDir = 'buy';
            confidence = 60 + Math.min(25, (volumeRatio - threshold) * 10);
        } else {
            signalDir = 'sell';
            confidence = 60 + Math.min(25, (volumeRatio - threshold) * 10);
        }
    }

    return {
        name: 'Volume Spike',
        value: volumeRatio,
        signal: signalDir,
        confidence,
        metadata: { currentVolume, avgVolume, threshold, priceChange },
    };
}

// ============================================================================
// ADX (Average Directional Index)
// ============================================================================

export function calculateADX(klines: KlineData[], period: number = 14): number {
    if (klines.length < period * 2) return 0;

    const trueRanges: number[] = [];
    const plusDM: number[] = [];
    const minusDM: number[] = [];

    for (let i = 1; i < klines.length; i++) {
        const high = klines[i].high;
        const low = klines[i].low;
        const prevClose = klines[i - 1].close;
        const prevHigh = klines[i - 1].high;
        const prevLow = klines[i - 1].low;

        // True Range
        trueRanges.push(Math.max(
            high - low,
            Math.abs(high - prevClose),
            Math.abs(low - prevClose)
        ));

        // Directional Movement
        const upMove = high - prevHigh;
        const downMove = prevLow - low;

        if (upMove > downMove && upMove > 0) {
            plusDM.push(upMove);
        } else {
            plusDM.push(0);
        }

        if (downMove > upMove && downMove > 0) {
            minusDM.push(downMove);
        } else {
            minusDM.push(0);
        }
    }

    // Smoothed averages
    let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0);
    let plusDI = plusDM.slice(0, period).reduce((a, b) => a + b, 0);
    let minusDI = minusDM.slice(0, period).reduce((a, b) => a + b, 0);

    const dx: number[] = [];

    for (let i = period; i < trueRanges.length; i++) {
        atr = atr - (atr / period) + trueRanges[i];
        plusDI = plusDI - (plusDI / period) + plusDM[i];
        minusDI = minusDI - (minusDI / period) + minusDM[i];

        const plusDIValue = (plusDI / atr) * 100;
        const minusDIValue = (minusDI / atr) * 100;

        const diDiff = Math.abs(plusDIValue - minusDIValue);
        const diSum = plusDIValue + minusDIValue;

        if (diSum > 0) {
            dx.push((diDiff / diSum) * 100);
        }
    }

    if (dx.length < period) return 0;

    // ADX is smoothed DX
    let adx = dx.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < dx.length; i++) {
        adx = ((adx * (period - 1)) + dx[i]) / period;
    }

    return adx;
}

export function adxSignal(klines: KlineData[]): IndicatorResult {
    const adx = calculateADX(klines);

    let signal: SignalDirection = 'hold';
    let confidence = 50;

    // ADX > 25 indicates strong trend
    if (adx > 25) {
        // Use price direction to determine trend
        const priceChange = (klines[klines.length - 1].close - klines[klines.length - 5].close) / klines[klines.length - 5].close;
        if (priceChange > 0) {
            signal = 'buy';
            confidence = 55 + Math.min(30, (adx - 25) * 1.5);
        } else {
            signal = 'sell';
            confidence = 55 + Math.min(30, (adx - 25) * 1.5);
        }
    }

    return {
        name: 'ADX',
        value: adx,
        signal,
        confidence,
        metadata: { trendStrength: adx > 25 ? 'strong' : adx > 20 ? 'moderate' : 'weak' },
    };
}

// ============================================================================
// Stochastic Oscillator
// ============================================================================

export function calculateStochastic(klines: KlineData[], period: number = 14): { k: number; d: number } {
    if (klines.length < period) return { k: 50, d: 50 };

    const slice = klines.slice(-period);
    const currentClose = klines[klines.length - 1].close;
    const lowestLow = Math.min(...slice.map(k => k.low));
    const highestHigh = Math.max(...slice.map(k => k.high));

    const k = highestHigh === lowestLow ? 50 : ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;

    // Calculate %D (3-period SMA of %K)
    const kValues: number[] = [];
    for (let i = klines.length - 3; i < klines.length; i++) {
        if (i < period) continue;
        const s = klines.slice(i - period + 1, i + 1);
        const c = klines[i].close;
        const ll = Math.min(...s.map(k => k.low));
        const hh = Math.max(...s.map(k => k.high));
        kValues.push(hh === ll ? 50 : ((c - ll) / (hh - ll)) * 100);
    }

    const d = kValues.length > 0 ? kValues.reduce((a, b) => a + b, 0) / kValues.length : k;

    return { k, d };
}

export function stochasticSignal(klines: KlineData[]): IndicatorResult {
    const { k, d } = calculateStochastic(klines);

    let signal: SignalDirection = 'hold';
    let confidence = 50;

    // Oversold
    if (k < 20 && d < 20) {
        signal = 'buy';
        confidence = 65 + Math.min(20, (20 - k));
    }
    // Overbought
    else if (k > 80 && d > 80) {
        signal = 'sell';
        confidence = 65 + Math.min(20, (k - 80));
    }
    // Bullish crossover
    else if (k > d && k < 50) {
        signal = 'buy';
        confidence = 55;
    }
    // Bearish crossover
    else if (k < d && k > 50) {
        signal = 'sell';
        confidence = 55;
    }

    return {
        name: 'Stochastic',
        value: k,
        signal,
        confidence,
        metadata: { k, d },
    };
}

// ============================================================================
// ATR (Average True Range)
// ============================================================================

export function calculateATR(klines: KlineData[], period: number = 14): number {
    if (klines.length < period + 1) return 0;

    const trueRanges: number[] = [];

    for (let i = 1; i < klines.length; i++) {
        const high = klines[i].high;
        const low = klines[i].low;
        const prevClose = klines[i - 1].close;

        trueRanges.push(Math.max(
            high - low,
            Math.abs(high - prevClose),
            Math.abs(low - prevClose)
        ));
    }

    // Initial ATR = SMA of first period true ranges
    let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;

    // Smooth ATR
    for (let i = period; i < trueRanges.length; i++) {
        atr = ((atr * (period - 1)) + trueRanges[i]) / period;
    }

    return atr;
}

export function atrVolatilitySignal(klines: KlineData[]): IndicatorResult {
    const atr = calculateATR(klines);
    const currentPrice = klines[klines.length - 1].close;
    const atrPercent = (atr / currentPrice) * 100;

    // ATR as percentage of price indicates volatility
    let volatilityLevel = 'normal';
    if (atrPercent > 5) volatilityLevel = 'high';
    else if (atrPercent < 1) volatilityLevel = 'low';

    return {
        name: 'ATR',
        value: atr,
        signal: 'hold', // ATR doesn't give directional signals
        confidence: 50,
        metadata: {
            atrPercent,
            volatilityLevel,
            suggestedStopLoss: currentPrice - (atr * 2),
            suggestedTakeProfit: currentPrice + (atr * 3),
        },
    };
}

// ============================================================================
// Aggregate Signals
// ============================================================================

export function aggregateSignals(signals: IndicatorResult[]): {
    direction: SignalDirection;
    confidence: number;
    summary: string;
} {
    let buyScore = 0;
    let sellScore = 0;
    let totalWeight = 0;

    signals.forEach(s => {
        const weight = s.confidence / 100;
        totalWeight += weight;

        if (s.signal === 'buy') {
            buyScore += weight;
        } else if (s.signal === 'sell') {
            sellScore += weight;
        }
    });

    const direction: SignalDirection = buyScore > sellScore + 0.2 ? 'buy'
        : sellScore > buyScore + 0.2 ? 'sell'
            : 'hold';

    const confidence = Math.round(
        (Math.max(buyScore, sellScore) / totalWeight) * 100
    );

    const buyCount = signals.filter(s => s.signal === 'buy').length;
    const sellCount = signals.filter(s => s.signal === 'sell').length;

    const summary = `${buyCount} buy / ${sellCount} sell / ${signals.length - buyCount - sellCount} hold signals`;

    return { direction, confidence, summary };
}

// ============================================================================
// OBV (On-Balance Volume)
// ============================================================================

export function calculateOBV(klines: KlineData[]): number[] {
    if (klines.length < 2) return [];

    const obv: number[] = [0];

    for (let i = 1; i < klines.length; i++) {
        const currentClose = klines[i].close;
        const prevClose = klines[i - 1].close;
        const volume = klines[i].volume;

        if (currentClose > prevClose) {
            obv.push(obv[obv.length - 1] + volume);
        } else if (currentClose < prevClose) {
            obv.push(obv[obv.length - 1] - volume);
        } else {
            obv.push(obv[obv.length - 1]);
        }
    }

    return obv;
}

export function obvSignal(klines: KlineData[]): IndicatorResult {
    const obv = calculateOBV(klines);
    if (obv.length < 20) {
        return { name: 'OBV', value: 0, signal: 'hold', confidence: 50 };
    }

    const currentOBV = obv[obv.length - 1];
    const prevOBV = obv[obv.length - 10]; // Compare to 10 periods ago
    const obvChange = currentOBV - prevOBV;

    // Price change for divergence detection
    const currentPrice = klines[klines.length - 1].close;
    const prevPrice = klines[klines.length - 10].close;
    const priceChange = currentPrice - prevPrice;

    let signal: SignalDirection = 'hold';
    let confidence = 50;

    // Bullish divergence: price down, OBV up
    if (priceChange < 0 && obvChange > 0) {
        signal = 'buy';
        confidence = 70;
    }
    // Bearish divergence: price up, OBV down
    else if (priceChange > 0 && obvChange < 0) {
        signal = 'sell';
        confidence = 70;
    }
    // Confirmation: both moving same direction
    else if (priceChange > 0 && obvChange > 0) {
        signal = 'buy';
        confidence = 55;
    } else if (priceChange < 0 && obvChange < 0) {
        signal = 'sell';
        confidence = 55;
    }

    return {
        name: 'OBV',
        value: currentOBV,
        signal,
        confidence,
        metadata: { obvChange, priceChange, divergence: (priceChange > 0) !== (obvChange > 0) },
    };
}

// ============================================================================
// Ichimoku Cloud
// ============================================================================

export function calculateIchimoku(klines: KlineData[]): {
    tenkanSen: number;    // Conversion Line (9-period)
    kijunSen: number;     // Base Line (26-period)
    senkouSpanA: number;  // Leading Span A
    senkouSpanB: number;  // Leading Span B (52-period)
    chikouSpan: number;   // Lagging Span
} {
    const defaultResult = { tenkanSen: 0, kijunSen: 0, senkouSpanA: 0, senkouSpanB: 0, chikouSpan: 0 };
    if (klines.length < 52) return defaultResult;

    const calculateMidpoint = (period: number, offset: number = 0): number => {
        const slice = klines.slice(klines.length - period - offset, klines.length - offset);
        const high = Math.max(...slice.map(k => k.high));
        const low = Math.min(...slice.map(k => k.low));
        return (high + low) / 2;
    };

    const tenkanSen = calculateMidpoint(9);
    const kijunSen = calculateMidpoint(26);
    const senkouSpanA = (tenkanSen + kijunSen) / 2;
    const senkouSpanB = calculateMidpoint(52);
    const chikouSpan = klines[klines.length - 1].close;

    return { tenkanSen, kijunSen, senkouSpanA, senkouSpanB, chikouSpan };
}

export function ichimokuSignal(klines: KlineData[]): IndicatorResult {
    const ichimoku = calculateIchimoku(klines);
    if (ichimoku.tenkanSen === 0) {
        return { name: 'Ichimoku Cloud', value: 0, signal: 'hold', confidence: 50 };
    }

    const currentPrice = klines[klines.length - 1].close;
    const { tenkanSen, kijunSen, senkouSpanA, senkouSpanB } = ichimoku;

    // Cloud (Kumo) boundaries
    const cloudTop = Math.max(senkouSpanA, senkouSpanB);
    const cloudBottom = Math.min(senkouSpanA, senkouSpanB);

    let signal: SignalDirection = 'hold';
    let confidence = 50;

    // Price above cloud = bullish
    if (currentPrice > cloudTop) {
        signal = 'buy';
        confidence = 55;

        // TK cross above cloud = strong bullish
        if (tenkanSen > kijunSen) {
            confidence = 70;
        }
    }
    // Price below cloud = bearish
    else if (currentPrice < cloudBottom) {
        signal = 'sell';
        confidence = 55;

        // TK cross below cloud = strong bearish
        if (tenkanSen < kijunSen) {
            confidence = 70;
        }
    }
    // Price in cloud = neutral/consolidation
    else {
        signal = 'hold';
        confidence = 45;
    }

    return {
        name: 'Ichimoku Cloud',
        value: currentPrice > cloudTop ? 1 : currentPrice < cloudBottom ? -1 : 0,
        signal,
        confidence,
        metadata: { tenkanSen, kijunSen, cloudTop, cloudBottom, currentPrice },
    };
}

// ============================================================================
// HMA (Hull Moving Average)
// ============================================================================

function calculateWMA(data: number[], period: number): number[] {
    if (data.length < period) return [];

    const wma: number[] = [];
    const denominator = (period * (period + 1)) / 2;

    for (let i = period - 1; i < data.length; i++) {
        let sum = 0;
        for (let j = 0; j < period; j++) {
            sum += data[i - period + 1 + j] * (j + 1);
        }
        wma.push(sum / denominator);
    }

    return wma;
}

export function calculateHMA(data: number[], period: number = 9): number[] {
    if (data.length < period) return [];

    // WMA with period n/2
    const halfPeriod = Math.floor(period / 2);
    const sqrtPeriod = Math.floor(Math.sqrt(period));

    const wmaHalf = calculateWMA(data, halfPeriod);
    const wmaFull = calculateWMA(data, period);

    // Align arrays
    const offset = period - halfPeriod;
    const rawHMA: number[] = [];

    for (let i = 0; i < wmaFull.length; i++) {
        rawHMA.push(2 * wmaHalf[i + offset] - wmaFull[i]);
    }

    // Final WMA with sqrt(period)
    return calculateWMA(rawHMA, sqrtPeriod);
}

export function hmaSignal(klines: KlineData[]): IndicatorResult {
    const closes = klines.map(k => k.close);
    const hma = calculateHMA(closes, 9);

    if (hma.length < 3) {
        return { name: 'HMA', value: 0, signal: 'hold', confidence: 50 };
    }

    const currentHMA = hma[hma.length - 1];
    const prevHMA = hma[hma.length - 2];
    const prevPrevHMA = hma[hma.length - 3];
    const currentPrice = closes[closes.length - 1];

    let signal: SignalDirection = 'hold';
    let confidence = 50;

    // HMA turning up
    if (currentHMA > prevHMA && prevHMA <= prevPrevHMA) {
        signal = 'buy';
        confidence = 70;
    }
    // HMA turning down
    else if (currentHMA < prevHMA && prevHMA >= prevPrevHMA) {
        signal = 'sell';
        confidence = 70;
    }
    // Trending up
    else if (currentHMA > prevHMA) {
        signal = 'buy';
        confidence = 55;
    }
    // Trending down
    else if (currentHMA < prevHMA) {
        signal = 'sell';
        confidence = 55;
    }

    return {
        name: 'HMA',
        value: currentHMA,
        signal,
        confidence,
        metadata: { currentHMA, prevHMA, slope: currentHMA - prevHMA },
    };
}

// ============================================================================
// Fibonacci Retracement
// ============================================================================

export function calculateFibonacciLevels(high: number, low: number): {
    level0: number;    // 0% (high)
    level236: number;  // 23.6%
    level382: number;  // 38.2%
    level50: number;   // 50%
    level618: number;  // 61.8% (golden ratio)
    level786: number;  // 78.6%
    level100: number;  // 100% (low)
} {
    const range = high - low;
    return {
        level0: high,
        level236: high - range * 0.236,
        level382: high - range * 0.382,
        level50: high - range * 0.5,
        level618: high - range * 0.618,
        level786: high - range * 0.786,
        level100: low,
    };
}

export function fibonacciSignal(klines: KlineData[], lookback: number = 50): IndicatorResult {
    if (klines.length < lookback) {
        return { name: 'Fibonacci', value: 0, signal: 'hold', confidence: 50 };
    }

    const slice = klines.slice(-lookback);
    const high = Math.max(...slice.map(k => k.high));
    const low = Math.min(...slice.map(k => k.low));
    const currentPrice = klines[klines.length - 1].close;

    const levels = calculateFibonacciLevels(high, low);

    // Determine which level we're near
    const tolerance = (high - low) * 0.02; // 2% tolerance

    let nearLevel = '';
    let signal: SignalDirection = 'hold';
    let confidence = 50;

    // Check proximity to each level
    const levelChecks = [
        { name: '23.6%', value: levels.level236, type: 'resistance' },
        { name: '38.2%', value: levels.level382, type: 'support' },
        { name: '50%', value: levels.level50, type: 'neutral' },
        { name: '61.8%', value: levels.level618, type: 'support' },
        { name: '78.6%', value: levels.level786, type: 'support' },
    ];

    for (const level of levelChecks) {
        if (Math.abs(currentPrice - level.value) < tolerance) {
            nearLevel = level.name;

            // Near support = potential bounce (buy)
            if (level.type === 'support') {
                signal = 'buy';
                confidence = level.name === '61.8%' ? 70 : 60; // Golden ratio stronger
            }
            // Near resistance = potential rejection (sell)
            else if (level.type === 'resistance') {
                signal = 'sell';
                confidence = 60;
            }
            break;
        }
    }

    // Position relative to 50%
    const position = (currentPrice - low) / (high - low);

    return {
        name: 'Fibonacci',
        value: position * 100,
        signal,
        confidence,
        metadata: { ...levels, currentPrice, nearLevel, position },
    };
}

// ============================================================================
// Fear & Greed Index (Simulated from volatility + momentum)
// ============================================================================

export function fearGreedSignal(klines: KlineData[]): IndicatorResult {
    if (klines.length < 30) {
        return { name: 'Fear & Greed', value: 50, signal: 'hold', confidence: 50 };
    }

    // Components:
    // 1. Volatility (ATR-based)
    const atr = calculateATR(klines);
    const currentPrice = klines[klines.length - 1].close;
    const atrPercent = (atr / currentPrice) * 100;

    // 2. Momentum (RSI)
    const closes = klines.map(k => k.close);
    const rsi = calculateRSI(closes);

    // 3. Price momentum (recent returns)
    const returns7d = ((klines[klines.length - 1].close - klines[klines.length - 8].close) / klines[klines.length - 8].close) * 100;

    // 4. Volume trend
    const avgVol = klines.slice(-20).reduce((sum, k) => sum + k.volume, 0) / 20;
    const currentVol = klines[klines.length - 1].volume;
    const volRatio = currentVol / avgVol;

    // Calculate composite index (0-100)
    // Lower volatility = more greed
    const volatilityScore = Math.max(0, Math.min(100, 50 - atrPercent * 10));

    // High RSI = greed, Low RSI = fear
    const rsiScore = rsi;

    // Positive returns = greed
    const momentumScore = Math.max(0, Math.min(100, 50 + returns7d * 5));

    // High volume on up days = greed
    const volumeScore = volRatio > 1 && returns7d > 0 ? 70 : volRatio > 1 && returns7d < 0 ? 30 : 50;

    // Weighted average
    const fearGreedIndex = Math.round(
        volatilityScore * 0.25 +
        rsiScore * 0.35 +
        momentumScore * 0.25 +
        volumeScore * 0.15
    );

    let marketSentiment = '';
    let signal: SignalDirection = 'hold';
    let confidence = 50;

    if (fearGreedIndex >= 75) {
        marketSentiment = 'Extreme Greed';
        signal = 'sell'; // Contrarian
        confidence = 65;
    } else if (fearGreedIndex >= 55) {
        marketSentiment = 'Greed';
        signal = 'hold';
        confidence = 50;
    } else if (fearGreedIndex >= 45) {
        marketSentiment = 'Neutral';
        signal = 'hold';
        confidence = 50;
    } else if (fearGreedIndex >= 25) {
        marketSentiment = 'Fear';
        signal = 'hold';
        confidence = 50;
    } else {
        marketSentiment = 'Extreme Fear';
        signal = 'buy'; // Contrarian
        confidence = 65;
    }

    return {
        name: 'Fear & Greed',
        value: fearGreedIndex,
        signal,
        confidence,
        metadata: {
            sentiment: marketSentiment,
            components: { volatilityScore, rsiScore, momentumScore, volumeScore },
        },
    };
}

// ============================================================================
// BTC Correlation
// ============================================================================

/**
 * Calculate Pearson correlation coefficient between two price series
 */
export function calculateCorrelation(seriesA: number[], seriesB: number[]): number {
    if (seriesA.length !== seriesB.length || seriesA.length < 2) return 0;

    const n = seriesA.length;

    const meanA = seriesA.reduce((sum, v) => sum + v, 0) / n;
    const meanB = seriesB.reduce((sum, v) => sum + v, 0) / n;

    let covariance = 0;
    let varA = 0;
    let varB = 0;

    for (let i = 0; i < n; i++) {
        const diffA = seriesA[i] - meanA;
        const diffB = seriesB[i] - meanB;
        covariance += diffA * diffB;
        varA += diffA * diffA;
        varB += diffB * diffB;
    }

    const stdA = Math.sqrt(varA);
    const stdB = Math.sqrt(varB);

    if (stdA === 0 || stdB === 0) return 0;
    return covariance / (stdA * stdB);
}

/**
 * Calculate percentage returns from price series
 */
export function calculateReturns(prices: number[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
        returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    return returns;
}

/**
 * BTC Correlation Signal - Analyzes how an asset moves relative to BTC
 */
export function btcCorrelationSignal(
    assetKlines: KlineData[],
    btcKlines: KlineData[],
    lookback: number = 30
): IndicatorResult {
    if (assetKlines.length < lookback || btcKlines.length < lookback) {
        return { name: 'BTC Correlation', value: 0, signal: 'hold', confidence: 50 };
    }

    const assetCloses = assetKlines.slice(-lookback).map(k => k.close);
    const btcCloses = btcKlines.slice(-lookback).map(k => k.close);

    const assetReturns = calculateReturns(assetCloses);
    const btcReturns = calculateReturns(btcCloses);
    const correlation = calculateCorrelation(assetReturns, btcReturns);

    const assetReturn = (assetCloses[assetCloses.length - 1] - assetCloses[0]) / assetCloses[0];
    const btcReturn = (btcCloses[btcCloses.length - 1] - btcCloses[0]) / btcCloses[0];
    const relativePerformance = assetReturn - btcReturn;

    let signal: SignalDirection = 'hold';
    let confidence = 50;
    let interpretation = '';

    if (Math.abs(correlation) < 0.3) {
        interpretation = 'Decoupled from BTC';
        if (relativePerformance > 0.05) {
            signal = 'buy';
            confidence = 65;
        } else if (relativePerformance < -0.05) {
            signal = 'sell';
            confidence = 60;
        }
    } else if (correlation > 0.7) {
        interpretation = 'Strongly correlated with BTC';
        if (relativePerformance > 0.03) {
            signal = 'buy';
            confidence = 55;
        } else if (relativePerformance < -0.03) {
            signal = 'sell';
            confidence = 55;
        }
    } else {
        interpretation = 'Moderate BTC correlation';
    }

    return {
        name: 'BTC Correlation',
        value: correlation,
        signal,
        confidence,
        metadata: {
            correlation: Math.round(correlation * 100) / 100,
            strength: Math.abs(correlation) > 0.7 ? 'strong' : Math.abs(correlation) > 0.4 ? 'moderate' : 'weak',
            assetReturn: Math.round(assetReturn * 10000) / 100,
            btcReturn: Math.round(btcReturn * 10000) / 100,
            outperformance: Math.round(relativePerformance * 10000) / 100,
            interpretation,
        },
    };
}

