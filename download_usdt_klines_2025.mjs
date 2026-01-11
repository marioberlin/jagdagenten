/**
 * download_usdt_klines_2025.mjs
 * Node 18+ required (global fetch). Run:
 *   node download_usdt_klines_2025.mjs
 *
 * Outputs NDJSON (1 kline per line) per symbol under ./data_klines_2025_1m/
 */

import fs from "node:fs";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const BASE_URL = process.env.BASE_URL ?? "https://data-api.binance.vision"; // market-data-only base  [oai_citation:2‡developers.binance.com](https://developers.binance.com/docs/binance-spot-api-docs/rest-api)
const OUT_DIR = process.env.OUT_DIR ?? "./data_klines_2025_1m";
const CONCURRENCY = Number(process.env.CONCURRENCY ?? "2"); // keep low to be polite
const LIMIT = 1000; // max for spot klines  [oai_citation:3‡developers.binance.com](https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints)

const START_MS = Date.parse(process.env.START ?? "2025-01-01T00:00:00Z");
const END_MS = Date.parse(process.env.END ?? "2026-01-01T00:00:00Z"); // exclusive end

const SYMBOLS_LIMIT = process.env.SYMBOLS_LIMIT ? Number(process.env.SYMBOLS_LIMIT) : null; // for testing
const REQUEST_DELAY_MS = Number(process.env.REQUEST_DELAY_MS ?? "150"); // small delay between requests

if (Number.isNaN(START_MS) || Number.isNaN(END_MS) || START_MS >= END_MS) {
    throw new Error("Invalid START/END. Example: START=2025-01-01T00:00:00Z END=2026-01-01T00:00:00Z");
}

fs.mkdirSync(OUT_DIR, { recursive: true });

async function fetchJson(url, { retries = 5 } = {}) {
    let lastErr;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const res = await fetch(url, { headers: { "Accept": "application/json" } });
            const text = await res.text();

            if (!res.ok) {
                // Binance errors often come back as JSON with msg/code
                let msg = text;
                try {
                    const j = JSON.parse(text);
                    msg = `${j.code ?? res.status}: ${j.msg ?? text}`;
                } catch { }
                throw new Error(`HTTP ${res.status} ${res.statusText} - ${msg}`);
            }
            return JSON.parse(text);
        } catch (e) {
            lastErr = e;
            // exponential backoff
            const backoff = Math.min(10_000, 400 * 2 ** attempt);
            await sleep(backoff);
        }
    }
    throw lastErr;
}

// 1) Get all Spot symbols and filter USDT quoted trading pairs
async function getUsdtSpotSymbols() {
    const url = `${BASE_URL}/api/v3/exchangeInfo`;
    const info = await fetchJson(url);

    const symbols = (info.symbols ?? [])
        .filter(s =>
            s.quoteAsset === "USDT" &&
            s.status === "TRADING" &&
            s.isSpotTradingAllowed === true
        )
        .map(s => s.symbol);

    return SYMBOLS_LIMIT ? symbols.slice(0, SYMBOLS_LIMIT) : symbols;
}

// 2) Download klines for one symbol into NDJSON
async function downloadSymbol(symbol) {
    const symDir = path.join(OUT_DIR, symbol);
    fs.mkdirSync(symDir, { recursive: true });

    const outFile = path.join(symDir, `${symbol}_1m_2025.ndjson`);

    if (fs.existsSync(outFile)) {
        // Check if it has data (optional, but good safety)
        const stats = fs.statSync(outFile);
        if (stats.size > 0) {
            return { symbol, total: 0, outFile, skipped: true };
        }
    }

    const stream = fs.createWriteStream(outFile, { flags: "w" });

    let start = START_MS;
    let total = 0;

    try {
        while (start < END_MS) {
            // /api/v3/klines supports symbol, interval, startTime, endTime, limit (max 1000).  [oai_citation:4‡developers.binance.com](https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints)
            const url =
                `${BASE_URL}/api/v3/klines` +
                `?symbol=${encodeURIComponent(symbol)}` +
                `&interval=1m` +
                `&startTime=${start}` +
                `&endTime=${END_MS}` +
                `&limit=${LIMIT}`;

            const klines = await fetchJson(url);

            if (!Array.isArray(klines) || klines.length === 0) break;

            for (const k of klines) {
                stream.write(JSON.stringify(k) + "\n");
            }

            total += klines.length;

            // Advance to 1 minute after last open time (kline[0] = open time)  [oai_citation:5‡developers.binance.com](https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints)
            const lastOpen = klines[klines.length - 1][0];
            start = Number(lastOpen) + 60_000;

            await sleep(REQUEST_DELAY_MS);
        }
    } finally {
        await new Promise(resolve => stream.end(resolve));
    }

    return { symbol, total, outFile };
}

// Simple concurrency runner
async function runPool(items, worker, concurrency) {
    const results = [];
    let idx = 0;

    async function runner() {
        while (true) {
            const i = idx++;
            if (i >= items.length) return;
            results[i] = await worker(items[i]);
        }
    }

    const workers = Array.from({ length: concurrency }, () => runner());
    await Promise.all(workers);
    return results;
}

async function main() {
    console.log(`BASE_URL: ${BASE_URL}`);
    console.log(`Range (UTC): ${new Date(START_MS).toISOString()} → ${new Date(END_MS).toISOString()}`);
    console.log(`OUT_DIR: ${OUT_DIR}`);
    console.log(`CONCURRENCY: ${CONCURRENCY}`);

    const symbols = await getUsdtSpotSymbols(); // exchangeInfo provides symbols + fields used for filtering  [oai_citation:6‡developers.binance.com](https://developers.binance.com/docs/binance-spot-api-docs/rest-api/general-endpoints)
    console.log(`USDT Spot symbols found: ${symbols.length}`);

    const results = await runPool(symbols, async (sym) => {
        console.log(`[${sym}] start`);
        const r = await downloadSymbol(sym);
        if (r.skipped) {
            console.log(`[${sym}] skipped (already exists)`);
        } else {
            console.log(`[${sym}] done: ${r.total} candles -> ${r.outFile}`);
        }
        return r;
    }, CONCURRENCY);

    const grandTotal = results.reduce((sum, r) => sum + (r?.total ?? 0), 0);
    console.log(`All done. Total candles written: ${grandTotal}`);
}

main().catch(err => {
    console.error(err);
    process.exitCode = 1;
});
