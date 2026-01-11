import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

export interface MarketTickerItem {
    /** Trading pair symbol */
    symbol: string;
    /** Current price */
    price: number;
    /** Price change percentage */
    change: number;
}

export interface GlassMarketTickerProps {
    /** Ticker items to display */
    items?: MarketTickerItem[];
    /** Auto-scroll animation */
    autoScroll?: boolean;
    /** Custom className */
    className?: string;
}

/**
 * GlassMarketTicker - Horizontal scrolling market data ticker for trading dashboard
 */
export const GlassMarketTicker: React.FC<GlassMarketTickerProps> = ({
    items = [
        { symbol: 'BTC', price: 96234.50, change: 2.45 },
        { symbol: 'ETH', price: 3456.78, change: 1.23 },
        { symbol: 'SOL', price: 234.56, change: -0.87 },
        { symbol: 'BNB', price: 654.32, change: 0.45 },
        { symbol: 'ADA', price: 0.89, change: -1.23 },
        { symbol: 'XRP', price: 2.34, change: 3.45 },
        { symbol: 'DOT', price: 9.87, change: 0.12 },
        { symbol: 'LINK', price: 24.68, change: 1.56 },
    ],
    autoScroll = true,
    className,
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState<'left' | 'right'>('right');

    // Auto-cycle through items
    useEffect(() => {
        if (!autoScroll) return;

        const interval = setInterval(() => {
            setDirection('right');
            setCurrentIndex((prev) => (prev + 1) % items.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [autoScroll, items.length]);

    const formatPrice = (price: number) => {
        if (price >= 1000) {
            return `$${(price / 1000).toFixed(2)}K`;
        }
        return `$${price.toFixed(2)}`;
    };

    const goNext = () => {
        setDirection('right');
        setCurrentIndex((prev) => (prev + 1) % items.length);
    };

    const goPrev = () => {
        setDirection('left');
        setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    };

    return (
        <div
            className={cn(
                'w-full',
                'bg-[var(--glass-surface)]/90 backdrop-blur-lg',
                'border-b border-[var(--glass-border)]',
                className
            )}
        >
            <div className="flex items-center justify-between px-4 py-2">
                {/* Brand indicator */}
                <div className="flex items-center gap-2">
                    <div
                        className={cn(
                            'w-2 h-2 rounded-full',
                            'bg-[var(--glass-success)] animate-pulse'
                        )}
                    />
                    <span className="text-xs font-medium text-[var(--text-muted)]">
                        MARKET
                    </span>
                </div>

                {/* Ticker display */}
                <div className="flex-1 flex justify-center">
                    <div className="relative overflow-hidden w-full max-w-lg">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, x: direction === 'right' ? 20 : -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: direction === 'right' ? -20 : 20 }}
                            transition={{ duration: 0.3 }}
                            className="flex items-center justify-center gap-6"
                        >
                            <span className="font-bold text-[var(--text-primary)]">
                                {items[currentIndex].symbol}
                            </span>
                            <span className="font-mono text-[var(--text-primary)]">
                                {formatPrice(items[currentIndex].price)}
                            </span>
                            <span
                                className={cn(
                                    'text-sm font-medium',
                                    items[currentIndex].change >= 0
                                        ? 'text-[var(--glass-success)]'
                                        : 'text-[var(--glass-destructive)]'
                                )}
                            >
                                {items[currentIndex].change >= 0 ? '+' : ''}
                                {items[currentIndex].change.toFixed(2)}%
                            </span>
                        </motion.div>
                    </div>
                </div>

                {/* Navigation controls */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={goPrev}
                        className={cn(
                            'p-1.5 rounded',
                            'hover:bg-[var(--glass-surface-hover)]',
                            'transition-colors',
                            'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                        )}
                        aria-label="Previous"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={goNext}
                        className={cn(
                            'p-1.5 rounded',
                            'hover:bg-[var(--glass-surface-hover)]',
                            'transition-colors',
                            'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                        )}
                        aria-label="Next"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Progress indicator */}
            <div className="flex justify-center gap-1 pb-2">
                {items.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            setDirection(index > currentIndex ? 'right' : 'left');
                            setCurrentIndex(index);
                        }}
                        className={cn(
                            'h-1 rounded-full transition-all duration-300',
                            index === currentIndex
                                ? 'bg-[var(--glass-accent)] w-6'
                                : 'bg-[var(--glass-border)] w-1 hover:bg-[var(--glass-surface-hover)]'
                        )}
                        aria-label={`Go to ${items[index].symbol}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default GlassMarketTicker;
