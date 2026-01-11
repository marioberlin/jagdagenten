import React, { useState } from 'react';
import { useBinanceStream } from '../hooks/useBinanceStream';
import { RealTimeOrderBook } from '../components/trading/RealTimeOrderBook';
import { SymbolSelector } from '../components/trading/SymbolSelector';
import { IntervalSelector } from '../components/trading/IntervalSelector';
import { GlassMetric } from '../components/data-display/GlassMetric';
import { GlassCard } from '../components/data-display/GlassCard';
import { GlassCandlestickChart } from '../components/data-display/GlassCandlestickChart';
import { ArrowDownRight, Activity, DollarSign, TrendingUp, BarChart3 } from 'lucide-react';

export const MarketOverview: React.FC = () => {
    const [symbol, setSymbol] = useState('BTCUSDT');
    const [interval, setInterval] = useState('1d'); // Default to 1 Day
    const { ticker, depth, trades, klines, connected } = useBinanceStream(symbol, interval);

    const currentPrice = parseFloat(ticker?.c || '0');
    const priceChange = parseFloat(ticker?.p || '0');
    const priceChangePercent = parseFloat(ticker?.P || '0');
    const high24h = parseFloat(ticker?.h || '0');
    const low24h = parseFloat(ticker?.l || '0');
    const volume24h = parseFloat(ticker?.v || '0');
    const isPositive = priceChange >= 0;

    // Format large numbers
    const formatVolume = (vol: number) => {
        if (vol >= 1e9) return `${(vol / 1e9).toFixed(2)}B`;
        if (vol >= 1e6) return `${(vol / 1e6).toFixed(2)}M`;
        if (vol >= 1e3) return `${(vol / 1e3).toFixed(2)}K`;
        return vol.toFixed(2);
    };

    // Format price based on magnitude
    const formatPrice = (price: number) => {
        if (price === 0) return '—';
        if (price >= 1000) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
        if (price >= 1) return `$${price.toFixed(4)}`;
        return `$${price.toFixed(6)}`;
    };

    return (
        <div className="p-6 space-y-4 h-screen overflow-hidden flex flex-col bg-glass-background">
            {/* Header with Connection Status */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Market Overview</h1>
                <div className="flex items-center gap-2 text-xs">
                    {connected ? (
                        <span className="flex items-center gap-1.5 text-green-400">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            Live
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5 text-red-400">
                            <span className="w-2 h-2 rounded-full bg-red-400" />
                            Disconnected
                        </span>
                    )}
                </div>
            </div>

            {/* Top Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <GlassMetric
                    label="Current Price"
                    value={formatPrice(currentPrice)}
                    trend={isPositive ? 'up' : 'down'}
                    trendValue={`${isPositive ? '+' : ''}${priceChangePercent.toFixed(2)}%`}
                    icon={<DollarSign className="w-4 h-4" />}
                />
                <GlassMetric
                    label="24h High"
                    value={formatPrice(high24h)}
                    icon={<TrendingUp className="w-4 h-4 text-green-400" />}
                />
                <GlassMetric
                    label="24h Low"
                    value={formatPrice(low24h)}
                    icon={<ArrowDownRight className="w-4 h-4 text-red-400" />}
                />
                <GlassMetric
                    label="24h Volume"
                    value={`${formatVolume(volume24h)} ${symbol.replace('USDT', '')}`}
                    icon={<BarChart3 className="w-4 h-4 text-blue-400" />}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
                {/* Chart Area */}
                <div className="col-span-12 lg:col-span-8 flex flex-col gap-3">
                    {/* Controls Bar */}
                    <div className="flex justify-between items-center bg-glass-panel/30 rounded-xl px-4 py-2">
                        {/* Symbol Selector */}
                        <SymbolSelector
                            value={symbol}
                            onChange={setSymbol}
                        />

                        {/* Interval Selector */}
                        <IntervalSelector
                            value={interval}
                            onChange={setInterval}
                        />
                    </div>

                    {/* Chart */}
                    <GlassCard className="flex-1 p-4 min-h-[400px]">
                        <GlassCandlestickChart
                            data={klines}
                            title={`${symbol.replace('USDT', '')} / USDT`}
                            upColor="#22c55e"
                            downColor="#ef4444"
                            className="w-full h-full"
                            ariaLabel={`Candlestick chart for ${symbol}`}
                        />
                    </GlassCard>
                </div>

                {/* Right Panel: Order Book & Trades */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 min-h-0">
                    {/* Order Book */}
                    <div className="flex-1 min-h-0">
                        <RealTimeOrderBook depth={depth} symbol={symbol} levels={10} />
                    </div>

                    {/* Recent Trades */}
                    <div className="h-1/3 min-h-[180px] bg-glass-panel/30 rounded-xl p-4 overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-secondary font-medium text-sm">Recent Trades</h3>
                            <Activity className="w-4 h-4 text-secondary" />
                        </div>

                        {/* Column Headers */}
                        <div className="grid grid-cols-3 text-[10px] text-white/40 font-medium uppercase tracking-wider px-1 pb-1 border-b border-glass-border/50">
                            <span>Price</span>
                            <span className="text-right">Qty</span>
                            <span className="text-right">Time</span>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar mt-1">
                            {trades.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-secondary text-xs">
                                    Waiting for trades...
                                </div>
                            ) : (
                                <div className="space-y-0.5">
                                    {trades.slice(0, 15).map((t, i) => (
                                        <div key={i} className="grid grid-cols-3 text-xs font-mono py-0.5 px-1 hover:bg-white/5 rounded">
                                            <span className={t.m ? 'text-red-400' : 'text-green-400'}>
                                                {parseFloat(t.p) >= 1000
                                                    ? parseFloat(t.p).toFixed(2)
                                                    : parseFloat(t.p).toFixed(4)}
                                            </span>
                                            <span className="text-right text-white/70">
                                                {parseFloat(t.q).toFixed(4)}
                                            </span>
                                            <span className="text-right text-white/40">
                                                {new Date(t.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

MarketOverview.displayName = 'MarketOverview';
