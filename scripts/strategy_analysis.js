// Strategy Analysis Script using fetch
// NOW RUNNING ON ALL USDT PAIRS

// Configuration
const TIMEFRAME = '1h';
const DAYS_LOOKBACK = 90;
const INVESTMENT_PER_LEVEL = 50;
const MAX_LEVELS = 5;
const PROFIT_TARGET = 0.01;
const DIP_STEPS = [0.03, 0.05, 0.08, 0.13, 0.21];

// const fs = require('fs'); // Removed to fix ESM error
import { promises as fsPromises } from 'fs';

async function getAllUSDTPairs() {
    console.log("Fetching all USDT pairs...");
    const response = await fetch("https://api.binance.com/api/v3/exchangeInfo");
    const data = await response.json();

    return data.symbols
        .filter(s => s.quoteAsset === 'USDT' && s.status === 'TRADING')
        .filter(s => !s.symbol.includes('UPUSDT') && !s.symbol.includes('DOWNUSDT')) // Exclude leveraged tokens if desired, user said "any currency" but leveraged tokens are derivatives. Let's exclude them for cleaner analysis.
        .map(s => s.symbol.replace('USDT', '')); // We need just the base for the script logic if we append USDT later? 
    // Logic below expects just the coin name? 
    // "symbol: `${symbol}USDT`"
    // Yes.
}

async function fetchKlines(symbol) {
    const url = "https://api.binance.com/api/v3/klines";
    const startTime = Date.now() - (DAYS_LOOKBACK * 24 * 60 * 60 * 1000);

    let allKlines = [];
    let currentStartTime = startTime;

    // Safety break
    let loops = 0;
    while (true) {
        loops++;
        if (loops > 10) break; // Should not need more than 3-4 requests for 90 days hourly (2160 hours / 1000 limit = ~3)

        try {
            const params = new URLSearchParams({
                symbol: `${symbol}USDT`,
                interval: TIMEFRAME,
                startTime: currentStartTime.toString(),
                limit: '1000'
            });

            const response = await fetch(`${url}?${params}`);
            if (!response.ok) {
                // console.error(`Error fetching ${symbol}: ${response.status}`);
                break;
            }

            const data = await response.json();

            if (!data || data.length === 0) break;

            allKlines = allKlines.concat(data);

            const lastCloseTime = data[data.length - 1][6];
            currentStartTime = lastCloseTime + 1;

            if (data.length < 1000) break;

            // Rate limit respect
            await new Promise(resolve => setTimeout(resolve, 50));

        } catch (e) {
            console.error(`Error fetching ${symbol}:`, e.message);
            break;
        }
    }

    return allKlines.map(k => ({
        openTime: k[0],
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        closeTime: k[6],
        date: new Date(k[6])
    }));
}

function simulateStrategy(validData) {
    if (!validData || validData.length === 0) return null;

    let positions = [];
    let referencePrice = validData[0].close;

    let nTrades = 0;
    let totalProfit = 0;
    let maxCapitalEmployed = 0;
    let capitalEmployed = 0;

    let maxDrawdownPct = 0;
    let stuckTimeStart = null;
    let longestStuckDurationMs = 0;

    for (const row of validData) {
        const currentPrice = row.close;
        const currentDate = row.date;

        // 1. Check Sells
        let soldIndices = [];
        for (let i = 0; i < positions.length; i++) {
            const pos = positions[i];
            const targetPrice = pos.price * (1 + PROFIT_TARGET);

            if (currentPrice >= targetPrice) {
                const profit = INVESTMENT_PER_LEVEL * PROFIT_TARGET;
                totalProfit += profit;
                nTrades++;
                capitalEmployed -= INVESTMENT_PER_LEVEL;

                referencePrice = currentPrice;
                soldIndices.push(i);
            }
        }

        for (let i = soldIndices.length - 1; i >= 0; i--) {
            positions.splice(soldIndices[i], 1);
        }

        // 2. Check Buys
        if (positions.length < MAX_LEVELS) {
            let triggerPrice;
            const nextDipPct = DIP_STEPS[positions.length];

            if (positions.length === 0) {
                triggerPrice = referencePrice * (1 - nextDipPct);
            } else {
                const lastBuyPrice = positions[positions.length - 1].price;
                triggerPrice = lastBuyPrice * (1 - nextDipPct);
            }

            if (currentPrice <= triggerPrice) {
                positions.push({ price: currentPrice, buyDate: currentDate });
                capitalEmployed += INVESTMENT_PER_LEVEL;
                maxCapitalEmployed = Math.max(maxCapitalEmployed, capitalEmployed);
            }
        }

        // 3. Stats
        const currentVal = positions.reduce((acc, p) => acc + (currentPrice / p.price * INVESTMENT_PER_LEVEL), 0);
        const costBasis = positions.length * INVESTMENT_PER_LEVEL;

        if (costBasis > 0) {
            const unrealizedPnlPct = (currentVal - costBasis) / costBasis;
            maxDrawdownPct = Math.min(maxDrawdownPct, unrealizedPnlPct);

            if (stuckTimeStart === null) {
                stuckTimeStart = currentDate.getTime();
            }
            const currentStuckDuration = currentDate.getTime() - stuckTimeStart;
            longestStuckDurationMs = Math.max(longestStuckDurationMs, currentStuckDuration);
        } else {
            stuckTimeStart = null;
        }
    }

    return {
        trades: nTrades,
        profitUsdt: totalProfit,
        maxInvested: maxCapitalEmployed,
        maxDrawdownPct: maxDrawdownPct * 100,
        longestStuckDays: longestStuckDurationMs / (1000 * 60 * 60 * 24),
        endingPositions: positions.length
    };
}

async function main() {
    const coins = await getAllUSDTPairs();
    console.log(`Found ${coins.length} USDT pairs. Starting massive simulation...`);
    console.log(`Details: 90 Days, 1h Candles, Profit 1%, Steps: ${DIP_STEPS.join(', ')}`);
    console.log("Writing results to 'analysis_results_all.csv'...");

    let csvContent = "COIN,TRADES,PROFIT_USDT,MAX_INVESTED,MAX_DRAWDOWN_PCT,STUCK_DAYS,END_POSITIONS\n";

    let completed = 0;
    const errors = [];

    // Process in chunks to avoid overwhelming memory or OS
    const CHUNK_SIZE = 10;
    for (let i = 0; i < coins.length; i += CHUNK_SIZE) {
        const chunk = coins.slice(i, i + CHUNK_SIZE);
        const promises = chunk.map(async (coin) => {
            try {
                const data = await fetchKlines(coin);
                const res = simulateStrategy(data);
                if (res) {
                    const line = `${coin},${res.trades},${res.profitUsdt.toFixed(2)},${res.maxInvested},${res.maxDrawdownPct.toFixed(2)},${res.longestStuckDays.toFixed(1)},${res.endingPositions}`;
                    return line;
                }
            } catch (e) {
                // errors.push(`${coin}: ${e.message}`);
                return null;
            }
            return null;
        });

        const results = await Promise.all(promises);
        results.forEach(r => {
            if (r) csvContent += r + "\n";
        });

        completed += chunk.length;
        process.stdout.write(`\rProgress: ${completed}/${coins.length}`);

        // Save intermediate results
        if (completed % 50 === 0) {
            await fsPromises.writeFile('analysis_results_all.csv', csvContent);
        }
    }

    await fsPromises.writeFile('analysis_results_all.csv', csvContent);
    console.log("\nDone! Results saved to analysis_results_all.csv");
}

main();
