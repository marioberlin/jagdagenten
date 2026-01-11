
import { promises as fs } from 'fs';

async function main() {
    try {
        const content = await fs.readFile('analysis_results_all.csv', 'utf-8');
        const lines = content.trim().split('\n');
        const headers = lines[0].split(',');

        const data = lines.slice(1).map(line => {
            const cols = line.split(',');
            return {
                coin: cols[0],
                trades: parseInt(cols[1]),
                profit: parseFloat(cols[2]),
                maxInv: parseFloat(cols[3]),
                drawdown: parseFloat(cols[4]),
                stuckDays: parseFloat(cols[5]),
                endPos: parseInt(cols[6])
            };
        });

        console.log(`Analyzed ${data.length} coins.`);

        // metrics
        const profitable = data.filter(d => d.profit > 0);
        const survivors = data.filter(d => d.drawdown > -30); // "Survived" with < 30% drawdown
        const cleanExit = data.filter(d => d.endPos === 0);

        console.log(`Profitable: ${profitable.length} (${(profitable.length / data.length * 100).toFixed(1)}%)`);
        console.log(`Survivors (DD > -30%): ${survivors.length} (${(survivors.length / data.length * 100).toFixed(1)}%)`);
        console.log(`Clean Exit (0 Bags): ${cleanExit.length} (${(cleanExit.length / data.length * 100).toFixed(1)}%)`);

        console.log("\n--- TOP 10 PROFIT ---");
        data.sort((a, b) => b.profit - a.profit);
        data.slice(0, 10).forEach(d => console.log(`${d.coin.padEnd(8)} $${d.profit.toFixed(2)} (DD: ${d.drawdown}%)`));

        console.log("\n--- LOWEST DRAWDOWN (Top 10, > 10 Trades) ---");
        const active = data.filter(d => d.trades > 10);
        active.sort((a, b) => b.drawdown - a.drawdown); // higher is better (closer to 0)
        active.slice(0, 10).forEach(d => console.log(`${d.coin.padEnd(8)} ${d.drawdown}% (Profit: $${d.profit})`));

        console.log("\n--- WORST DRAWDOWN (Bottom 10) ---");
        data.sort((a, b) => a.drawdown - b.drawdown);
        data.slice(0, 10).forEach(d => console.log(`${d.coin.padEnd(8)} ${d.drawdown}% (Stuck: ${d.stuckDays} days)`));

        console.log("\n--- GLOBAL PORTFOLIO STATS (No Whitelist) ---");
        const totalProfit = data.reduce((acc, d) => acc + d.profit, 0);
        const totalMaxInvested = data.reduce((acc, d) => acc + d.maxInv, 0);
        const totalLockedBags = data.reduce((acc, d) => acc + d.endPos, 0);
        const currentLockedCapital = totalLockedBags * 50;

        console.log(`Total Realized Profit: $${totalProfit.toLocaleString('en-US', { maximumFractionDigits: 2 })}`);
        console.log(`Total Capital Available/Required (Sum of Max Invested): $${totalMaxInvested.toLocaleString('en-US', { maximumFractionDigits: 2 })}`);
        console.log(`Current Capital Stuck (Locked Bags): $${currentLockedCapital.toLocaleString('en-US', { maximumFractionDigits: 2 })}`);
        console.log(`Net "Cash" Result: $${(totalProfit - currentLockedCapital).toLocaleString('en-US', { maximumFractionDigits: 2 })} (Profit - Stuck Capital)`);
        console.log(`*Note: This assumes infinite capital to maximize all 436 coins.*`);

    } catch (e) {
        console.error("Error reading CSV:", e.message);
    }
}

main();
