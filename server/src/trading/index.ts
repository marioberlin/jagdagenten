/**
 * LiquidCrypto Trading Module
 * 
 * Main entry point for the trading system.
 * Exports all strategies, indicators, and utilities.
 */

// Indicators (exports Candle type)
export * from './indicators/index.js';

// Strategies
export * from './strategies/btc-dip.js';
export * from './strategies/paxg-dip.js';
export * from './strategies/optimizer.js';

// Backtest utilities (exclude Candle to avoid conflict)
export {
    fetchBinanceKlines,
    fetchExtendedKlines,
    getCurrentPrice,
    get24hStats,
    COMMON_PAIRS,
    type CommonPair,
    type FetchOptions,
    type Interval,
} from './backtest/binance.js';
