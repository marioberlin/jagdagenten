
export interface Kline {
    openTime: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    closeTime: number;
    quoteVolume: number;
    trades: number;
    takerBuyBase: number;
    takerBuyQuote: number;
}

export interface MarketRegime {
    type: 'Trending' | 'Ranging' | 'Explosive' | 'Quiet';
    volatility: number; // Normalized ATR
    trendStrength: number; // ADX-like or simple SMA diff
}

export interface AnalysisResult {
    fallingKnife: boolean;
    bullRun: boolean;
    roc: number;
    rsi: number;
    volumeSpike: number; // Multiplier of average
}

export const analyticsService = {
    async loadKlines(url: string = '/data/BTCUSDT_1m_2025.ndjson'): Promise<Kline[]> {
        const response = await fetch(url);
        if (!response.body) throw new Error('No body in response');

        const text = await response.text();
        const lines = text.trim().split('\n');

        return lines.map(line => {
            try {
                const data = JSON.parse(line);
                // Schema: [Opentime, Open, High, Low, Close, Vol, Closetime, QuoteVol, Trades, TakerBase, TakerQuote, Ignore]
                return {
                    openTime: data[0],
                    open: parseFloat(data[1]),
                    high: parseFloat(data[2]),
                    low: parseFloat(data[3]),
                    close: parseFloat(data[4]),
                    volume: parseFloat(data[5]),
                    closeTime: data[6],
                    quoteVolume: parseFloat(data[7]),
                    trades: data[8],
                    takerBuyBase: parseFloat(data[9]),
                    takerBuyQuote: parseFloat(data[10])
                };
            } catch (e) {
                console.warn('Failed to parse line', line);
                return null;
            }
        }).filter(Boolean) as Kline[];
    },

    calculateATR(klines: Kline[], period: number = 14): number[] {
        const trs = klines.map((k, i) => {
            if (i === 0) return k.high - k.low;
            const prevClose = klines[i - 1].close;
            return Math.max(
                k.high - k.low,
                Math.abs(k.high - prevClose),
                Math.abs(k.low - prevClose)
            );
        });

        const atrs: number[] = [];
        let sum = 0;
        // Simple SMA for first ATR
        for (let i = 0; i < period; i++) sum += trs[i];
        atrs[period - 1] = sum / period;

        // RMA (Wilder's Smoothing) for rest
        for (let i = period; i < klines.length; i++) {
            atrs[i] = ((atrs[i - 1] * (period - 1)) + trs[i]) / period;
        }

        // Fill initial gaps
        for (let i = 0; i < period - 1; i++) atrs[i] = 0;

        return atrs;
    },

    calculateRSI(klines: Kline[], period: number = 14): number[] {
        const rsis: number[] = [];
        const gains: number[] = [];
        const losses: number[] = [];

        // Calculate changes
        for (let i = 1; i < klines.length; i++) {
            const change = klines[i].close - klines[i - 1].close;
            gains.push(change > 0 ? change : 0);
            losses.push(change < 0 ? Math.abs(change) : 0);
        }

        // Initial Avg
        let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
        let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

        // First RSI
        rsis[period] = 100 - (100 / (1 + (avgGain / (avgLoss || 1))));

        // Smoothed
        for (let i = period + 1; i < klines.length; i++) {
            const gain = klines[i - 1].close > klines[i - 2].close ? klines[i - 1].close - klines[i - 2].close : 0;
            const loss = klines[i - 1].close < klines[i - 2].close ? Math.abs(klines[i - 1].close - klines[i - 2].close) : 0;

            avgGain = ((avgGain * (period - 1)) + gain) / period;
            avgLoss = ((avgLoss * (period - 1)) + loss) / period;

            rsis[i] = 100 - (100 / (1 + (avgGain / (avgLoss || 0.0001))));
        }
        return rsis;
    },

    analyzeMarketCondition(klines: Kline[], idx: number): AnalysisResult {
        if (idx < 50) return { fallingKnife: false, bullRun: false, roc: 0, rsi: 50, volumeSpike: 1 };

        const current = klines[idx];
        const lookback = 20;


        // 1. Calculate ROC (Rate of Change) over 5 mins
        const price5mAgo = klines[idx - 5].close;
        const roc = ((current.close - price5mAgo) / price5mAgo) * 100;

        // 2. Volume Spike
        const avgVol = klines.slice(idx - lookback, idx).reduce((sum, k) => sum + k.volume, 0) / lookback;
        const volumeSpike = current.volume / (avgVol || 1);

        // 3. Falling Knife Logic
        // Drop > 1% in 5m AND Volume > 3x average
        const fallingKnife = roc < -1.0 && volumeSpike > 3.0;

        // 4. Bull Run Logic (Simplified)
        // Calculating RSI on the fly for just this window is inefficient, ideally we pass pre-calculated RSI.
        // For now, we'll use a simple trend check: price > MA20 AND MA20 > MA50
        const closes = klines.slice(idx - 50, idx + 1).map(k => k.close);
        const ma20 = closes.slice(-20).reduce((a, b) => a + b, 0) / 20;
        const ma50 = closes.reduce((a, b) => a + b, 0) / 50;

        // We'll approximate RSI-like behavior with streak
        const bullRun = current.close > ma20 && ma20 > ma50 && roc > 0.5 && volumeSpike > 1.5;

        return {
            fallingKnife,
            bullRun,
            roc,
            rsi: 50, // Placeholder, requires full series
            volumeSpike
        };
    },

    // New: Helper to process entire dataset
    processFullAnalysis(klines: Kline[]) {
        const atrs = this.calculateATR(klines);
        const rsis = this.calculateRSI(klines);

        return klines.map((k, i) => {
            const condition = this.analyzeMarketCondition(klines, i);
            return {
                ...condition,
                atr: atrs[i],
                rsi: rsis[i] || 50,
                // Override the simple bull logic with RSI check
                bullRun: (rsis[i] > 70) && (condition.volumeSpike > 1.2) && (k.close > klines[i - 1].close)
            };
        });
    }
};
