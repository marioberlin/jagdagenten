// Strategy Analysis Script using fetch
// EXPERIMENT: Risky vs ULTRA Risky Spacing

// Configuration
const COINS = ['SOL', 'PEPE', 'ADA', 'DOGE', 'XRP', 'AVAX', 'WIF', 'BONK'];

// Previous "Risky"
const RISKY_STEPS = [0.05, 0.10, 0.15, 0.20, 0.25];

// "Ultra Risky" (User request: up to -50% implied)
// [5%, 10%, 15%, 20%, 30%] relative steps
// Cumulative approx: Ref * 0.95 * 0.90 * 0.85 * 0.80 * 0.70 = ~0.40 (60% drop coverage)
const ULTRA_RISKY_STEPS = [0.05, 0.10, 0.15, 0.20, 0.30];

const TIMEFRAME = '1h';
const DAYS_LOOKBACK = 90;
const INVESTMENT_PER_LEVEL = 50;
const MAX_LEVELS = 5;
const PROFIT_TARGET = 0.01;

import { promises as fsPromises } from 'fs';

async function fetchKlines(symbol) {
    const url = "https://api.binance.com/api/v3/klines";
    const startTime = Date.now() - (DAYS_LOOKBACK * 24 * 60 * 60 * 1000);

    let allKlines = [];
    let currentStartTime = startTime;

    while (true) {
        try {
            const params = new URLSearchParams({
                symbol: `${symbol}USDT`,
                interval: TIMEFRAME,
                startTime: currentStartTime.toString(),
                limit: '1000'
            });

            const response = await fetch(`${url}?${params}`);
            if (!response.ok) break;

            const data = await response.json();
            if (!data || data.length === 0) break;

            allKlines = allKlines.concat(data);

            const lastCloseTime = data[data.length - 1][6];
            currentStartTime = lastCloseTime + 1;

            if (data.length < 1000) break;
            await new Promise(resolve => setTimeout(resolve, 50));

        } catch (e) {
            console.error(`Error fetching ${symbol}:`, e.message);
            break;
        }
    }

    return allKlines.map(k => ({
        price: parseFloat(k[4]),
        date: new Date(k[6])
    }));
}

function simulate(data, steps) {
    if (!data || data.length === 0) return null;

    let positions = [];
    let referencePrice = data[0].price;

    let nTrades = 0;
    let totalProfit = 0;
    let maxCapitalEmployed = 0;
    let capitalEmployed = 0;
    let maxDrawdownPct = 0;
    let stuckTimeStart = null;
    let longestStuckDurationMs = 0;

    for (const row of data) {
        const currentPrice = row.price;
        const currentDate = row.date;

        // Sells
        let soldIndices = [];
        for (let i = 0; i < positions.length; i++) {
            if (currentPrice >= positions[i].price * (1 + PROFIT_TARGET)) {
                totalProfit += INVESTMENT_PER_LEVEL * PROFIT_TARGET;
                nTrades++;
                capitalEmployed -= INVESTMENT_PER_LEVEL;
                referencePrice = currentPrice;
                soldIndices.push(i);
            }
        }
        for (let i = soldIndices.length - 1; i >= 0; i--) positions.splice(soldIndices[i], 1);

        // Buys
        if (positions.length < MAX_LEVELS) {
            const stepPct = steps[positions.length];
            const basePrice = (positions.length === 0) ? referencePrice : positions[positions.length - 1].price;
            const triggerPrice = basePrice * (1 - stepPct);

            if (currentPrice <= triggerPrice) {
                positions.push({ price: currentPrice, buyDate: currentDate });
                capitalEmployed += INVESTMENT_PER_LEVEL;
                maxCapitalEmployed = Math.max(maxCapitalEmployed, capitalEmployed);
            }
        }

        // Stats
        const costBasis = positions.length * INVESTMENT_PER_LEVEL;
        if (costBasis > 0) {
            const currentVal = positions.reduce((acc, p) => acc + (currentPrice / p.price * INVESTMENT_PER_LEVEL), 0);
            const unrealizedPnlPct = (currentVal - costBasis) / costBasis;
            maxDrawdownPct = Math.min(maxDrawdownPct, unrealizedPnlPct);

            if (stuckTimeStart === null) stuckTimeStart = currentDate.getTime();
            longestStuckDurationMs = Math.max(longestStuckDurationMs, currentDate.getTime() - stuckTimeStart);
        } else {
            stuckTimeStart = null;
        }
    }

    return {
        profit: totalProfit,
        drawdown: maxDrawdownPct * 100,
        trades: nTrades,
        stuck: longestStuckDurationMs / (86400000),
        endPos: positions.length
    };
}

async function main() {
    console.log(`Running Experiment: Risky vs Ultra Risky Spacing`);
    console.log(`Risky:       [5%, 10%, 15%, 20%, 25%]`);
    console.log(`Ultra Risky: [5%, 10%, 15%, 20%, 30%] (Deep coverage)`);
    console.log("-".repeat(120));
    console.log(`| COIN | RISK PROFIT | RISK DD% | STUCK | vs | ULTRA PROFIT | ULTRA DD% | STUCK | WINNER |`);
    console.log("-".repeat(120));

    for (const coin of COINS) {
        const data = await fetchKlines(coin);
        const risk = simulate(data, RISKY_STEPS);
        const ultra = simulate(data, ULTRA_RISKY_STEPS);

        if (risk && ultra) {
            let winner = "TIE";
            if (ultra.drawdown > risk.drawdown + 5) winner = "ULTRA (Safety)";
            else if (ultra.profit > risk.profit * 1.2) winner = "ULTRA (Profit)";
            else if (risk.profit > ultra.profit * 1.2) winner = "RISK (Profit)";
            else if (risk.drawdown > ultra.drawdown + 5) winner = "RISK (Safety)";
            else if (risk.drawdown > -35 && ultra.drawdown < -40) winner = "RISK (Safety)";

            console.log(
                `| ${coin.padEnd(4)} | ` +
                `$${risk.profit.toFixed(0).padEnd(10)} | ` +
                `${risk.drawdown.toFixed(0).padEnd(7)}% | ` +
                `${risk.stuck.toFixed(0).padEnd(5)} | vs | ` +
                `$${ultra.profit.toFixed(0).padEnd(11)} | ` +
                `${ultra.drawdown.toFixed(0).padEnd(8)}% | ` +
                `${ultra.stuck.toFixed(0).padEnd(5)} | ` +
                `${winner}`
            );
        }
    }
}

main();
