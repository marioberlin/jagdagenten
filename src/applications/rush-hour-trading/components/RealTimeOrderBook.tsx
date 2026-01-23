import React, { useMemo } from 'react';
import { BinanceDepth } from '@/hooks/useBinanceStream';
import { cn } from '@/utils/cn';

interface RealTimeOrderBookProps {
    depth: BinanceDepth | null;
    symbol: string;
    /** Number of levels to show on each side */
    levels?: number;
}

interface OrderLevel {
    price: number;
    amount: number;
    total: number;
    cumulative: number;
    percent: number;
    type: 'bid' | 'ask';
}

export const RealTimeOrderBook: React.FC<RealTimeOrderBookProps> = ({
    depth,
    symbol,
    levels = 12
}) => {
    const { bids, asks, spread, spreadPercent } = useMemo(() => {
        if (!depth) return { bids: [], asks: [], spread: 0, spreadPercent: 0 };

        // Safely get arrays (handle both Binance formats)
        const rawBids = (depth.bids || (depth as any).b || []).slice(0, levels);
        const rawAsks = (depth.asks || (depth as any).a || []).slice(0, levels);

        if (rawBids.length === 0 || rawAsks.length === 0) {
            return { bids: [], asks: [], spread: 0, spreadPercent: 0 };
        }

        // Process bids (buy orders) - highest first
        let bidCumulative = 0;
        const processedBids: OrderLevel[] = rawBids.map((row: [string, string]) => {
            const price = parseFloat(row[0]);
            const amount = parseFloat(row[1]);
            const total = price * amount;
            bidCumulative += amount;
            return { price, amount, total, cumulative: bidCumulative, percent: 0, type: 'bid' as const };
        });

        // Process asks (sell orders) - lowest first, then reversed for display
        let askCumulative = 0;
        const processedAsks: OrderLevel[] = rawAsks.map((row: [string, string]) => {
            const price = parseFloat(row[0]);
            const amount = parseFloat(row[1]);
            const total = price * amount;
            askCumulative += amount;
            return { price, amount, total, cumulative: askCumulative, percent: 0, type: 'ask' as const };
        }).reverse(); // Reverse so highest ask is at top

        // Calculate depth bar percentages based on cumulative volume
        const maxCumulative = Math.max(
            processedBids[processedBids.length - 1]?.cumulative || 0,
            processedAsks[0]?.cumulative || 0
        );

        processedBids.forEach(b => b.percent = (b.cumulative / maxCumulative) * 100);
        processedAsks.forEach(a => a.percent = (a.cumulative / maxCumulative) * 100);

        // Calculate spread
        const bestAsk = rawAsks[0] ? parseFloat(rawAsks[0][0]) : 0;
        const bestBid = rawBids[0] ? parseFloat(rawBids[0][0]) : 0;
        const spreadValue = bestAsk - bestBid;
        const spreadPct = bestBid > 0 ? (spreadValue / bestBid) * 100 : 0;

        return {
            bids: processedBids,
            asks: processedAsks,
            spread: spreadValue,
            spreadPercent: spreadPct
        };
    }, [depth, levels]);

    // Format price based on magnitude
    const formatPrice = (price: number) => {
        if (price >= 1000) return price.toFixed(2);
        if (price >= 1) return price.toFixed(4);
        return price.toFixed(6);
    };

    // Format amount
    const formatAmount = (amount: number) => {
        if (amount >= 1000) return amount.toFixed(2);
        if (amount >= 1) return amount.toFixed(4);
        return amount.toFixed(6);
    };

    if (!depth) {
        return (
            <div className="flex flex-col h-full bg-glass-panel/30 rounded-xl p-4">
                <h3 className="text-secondary font-medium text-sm mb-2">Order Book</h3>
                <div className="flex-1 flex items-center justify-center text-secondary text-sm">
                    Connecting...
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-glass-panel/30 rounded-xl p-4 gap-1">
            {/* Header */}
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-secondary font-medium text-sm">Order Book</h3>
                <span className="text-xs text-white/40 font-mono">{symbol}</span>
            </div>

            {/* Column Headers */}
            <div className="grid grid-cols-3 text-[10px] text-white/40 font-medium uppercase tracking-wider px-2 pb-1 border-b border-glass-border/50">
                <span>Price</span>
                <span className="text-right">Amount</span>
                <span className="text-right">Total</span>
            </div>

            {/* Asks (Sell Orders) - Red, reversed so lowest ask closest to spread */}
            <div className="flex-1 overflow-hidden flex flex-col justify-end">
                {asks.map((row, i) => (
                    <DepthRow key={`ask-${i}`} row={row} formatPrice={formatPrice} formatAmount={formatAmount} />
                ))}
            </div>

            {/* Spread Indicator */}
            <div className="py-2 px-2 flex justify-between items-center border-y border-glass-border/50 bg-black/20">
                <span className="text-xs text-secondary font-mono">Spread</span>
                <div className="flex gap-2 items-center">
                    <span className="text-xs font-mono text-white">${formatPrice(spread)}</span>
                    <span className="text-[10px] text-white/40">({spreadPercent.toFixed(3)}%)</span>
                </div>
            </div>

            {/* Bids (Buy Orders) - Green */}
            <div className="flex-1 overflow-hidden">
                {bids.map((row, i) => (
                    <DepthRow key={`bid-${i}`} row={row} formatPrice={formatPrice} formatAmount={formatAmount} />
                ))}
            </div>
        </div>
    );
};

const DepthRow = ({
    row,
    formatPrice,
    formatAmount
}: {
    row: OrderLevel;
    formatPrice: (n: number) => string;
    formatAmount: (n: number) => string;
}) => {
    const isBid = row.type === 'bid';
    const baseColor = isBid ? 'bg-green-500' : 'bg-red-500';
    const textColor = isBid ? 'text-green-400' : 'text-red-400';

    return (
        <div className="relative grid grid-cols-3 text-xs py-0.5 px-2 font-mono group hover:bg-white/5">
            {/* Depth Bar Background */}
            <div
                className={cn("absolute top-0 bottom-0 opacity-10", baseColor, isBid ? 'left-0' : 'right-0')}
                style={{ width: `${Math.min(row.percent, 100)}%` }}
            />

            {/* Price */}
            <span className={cn("relative z-10", textColor)}>{formatPrice(row.price)}</span>

            {/* Amount */}
            <span className="text-right text-white/70 relative z-10">{formatAmount(row.amount)}</span>

            {/* Total (USD value) */}
            <span className="text-right text-white/50 relative z-10">${row.total.toFixed(2)}</span>
        </div>
    );
};

RealTimeOrderBook.displayName = 'RealTimeOrderBook';
