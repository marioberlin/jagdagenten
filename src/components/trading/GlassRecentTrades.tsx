import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowDown, Clock } from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassCard, GlassButton, GlassBadge } from '@/components';

export interface Trade {
    id: string;
    timestamp: Date;
    symbol: string;
    side: 'buy' | 'sell';
    price: number;
    amount: number;
    total: number;
    fee: number;
    status: 'filled' | 'partial' | 'cancelled';
}

export interface GlassRecentTradesProps {
    /** Trades to display */
    trades?: Trade[];
    /** Trade filter */
    filter?: 'all' | 'buy' | 'sell';
    /** Custom className */
    className?: string;
}

/**
 * GlassRecentTrades - Recent trade history for trading dashboard
 */
export const GlassRecentTrades: React.FC<GlassRecentTradesProps> = ({
    trades = [
        {
            id: '1',
            timestamp: new Date(),
            symbol: 'BTC',
            side: 'buy',
            price: 96234.50,
            amount: 0.5,
            total: 48117.25,
            fee: 48.12,
            status: 'filled',
        },
        {
            id: '2',
            timestamp: new Date(Date.now() - 60000),
            symbol: 'ETH',
            side: 'sell',
            price: 3456.78,
            amount: 10,
            total: 34567.80,
            fee: 34.57,
            status: 'filled',
        },
        {
            id: '3',
            timestamp: new Date(Date.now() - 120000),
            symbol: 'SOL',
            side: 'buy',
            price: 234.56,
            amount: 25,
            total: 5864.00,
            fee: 5.86,
            status: 'filled',
        },
        {
            id: '4',
            timestamp: new Date(Date.now() - 180000),
            symbol: 'BTC',
            side: 'sell',
            price: 95800.00,
            amount: 0.25,
            total: 23950.00,
            fee: 23.95,
            status: 'filled',
        },
        {
            id: '5',
            timestamp: new Date(Date.now() - 300000),
            symbol: 'ETH',
            side: 'buy',
            price: 3420.00,
            amount: 5,
            total: 17100.00,
            fee: 17.10,
            status: 'partial',
        },
    ],
    filter = 'all',
    className,
}) => {
    const [activeFilter, setActiveFilter] = useState(filter);
    const [isExpanded, setIsExpanded] = useState(false);

    const filteredTrades = activeFilter === 'all'
        ? trades
        : trades.filter((t) => t.side === activeFilter);

    const displayedTrades = isExpanded ? filteredTrades : filteredTrades.slice(0, 5);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const formatDate = (date: Date) => {
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();

        if (isToday) {
            return formatTime(date);
        }

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <GlassCard className={cn('h-full flex flex-col', className)}>
            <div className="px-4 py-3 border-b border-[var(--glass-border)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[var(--text-muted)]" />
                    <span className="font-semibold">Recent Trades</span>
                    <GlassBadge variant="glass">{filteredTrades.length}</GlassBadge>
                </div>

                {/* Filter buttons */}
                <div className="flex gap-1">
                    {(['all', 'buy', 'sell'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={cn(
                                'px-2 py-1 rounded text-xs font-medium transition-colors',
                                activeFilter === f
                                    ? 'bg-[var(--glass-primary)] text-[var(--text-primary)]'
                                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                            )}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Header row */}
            <div className="grid grid-cols-5 gap-2 px-4 py-2 text-xs text-[var(--text-muted)] border-b border-[var(--glass-border)]">
                <span>Time</span>
                <span>Symbol</span>
                <span className="text-right">Price</span>
                <span className="text-right">Amount</span>
                <span className="text-right">Total</span>
            </div>

            {/* Trade list */}
            <div className="flex-1 overflow-auto">
                <AnimatePresence mode="popLayout">
                    {displayedTrades.map((trade, index) => (
                        <motion.div
                            key={trade.id}
                            layout
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.2, delay: index * 0.03 }}
                            className="grid grid-cols-5 gap-2 px-4 py-2 items-center hover:bg-[var(--glass-surface-hover)] transition-colors"
                        >
                            <span className="text-xs text-[var(--text-muted)]">
                                {formatDate(trade.timestamp)}
                            </span>

                            <div className="flex items-center gap-1">
                                {trade.side === 'buy' ? (
                                    <ArrowUp className="w-3 h-3 text-[var(--glass-success)]" />
                                ) : (
                                    <ArrowDown className="w-3 h-3 text-[var(--glass-destructive)]" />
                                )}
                                <span className="font-medium">{trade.symbol}</span>
                            </div>

                            <span className="text-right font-mono text-sm">
                                {formatCurrency(trade.price)}
                            </span>

                            <span className="text-right font-mono text-sm">
                                {trade.amount.toFixed(4)}
                            </span>

                            <span className="text-right font-mono text-sm">
                                {formatCurrency(trade.total)}
                            </span>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filteredTrades.length === 0 && (
                    <div className="p-8 text-center text-[var(--text-muted)]">
                        No trades found
                    </div>
                )}
            </div>

            {/* Show more button */}
            {filteredTrades.length > 5 && (
                <div className="px-4 py-2 border-t border-[var(--glass-border)]">
                    <GlassButton
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? 'Show Less' : `Show ${filteredTrades.length - 5} More`}
                    </GlassButton>
                </div>
            )}
        </GlassCard>
    );
};

export default GlassRecentTrades;
