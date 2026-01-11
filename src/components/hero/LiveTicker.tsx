import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

export interface HeroTickerItem {
    /** Trading pair symbol */
    symbol: string;
    /** Current price */
    price: number;
    /** Price change percentage */
    change: number;
}

export interface LiveTickerProps {
    /** Ticker items to display */
    items?: HeroTickerItem[];
    /** Auto-scroll animation speed */
    scrollSpeed?: number;
    /** Custom className */
    className?: string;
}

/**
 * LiveTicker - Animated scrolling market data ticker
 */
export const LiveTicker: React.FC<LiveTickerProps> = ({
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
    // scrollSpeed = 50,
    className,
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Auto-cycle through items
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % items.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [items.length]);

    const formatPrice = (price: number) => {
        if (price >= 1000) {
            return `$${(price / 1000).toFixed(2)}K`;
        }
        return `$${price.toFixed(2)}`;
    };

    return (
        <div
            className={cn(
                'w-full',
                'bg-[var(--glass-surface)]/80 backdrop-blur-lg',
                'border-b border-[var(--glass-border)]',
                className
            )}
        >
            <div className="flex items-center justify-between px-4 py-2">
                {/* Left: Brand indicator */}
                <div className="flex items-center gap-2">
                    <div
                        className={cn(
                            'w-2 h-2 rounded-full',
                            'bg-[var(--glass-success)] animate-pulse'
                        )}
                    />
                    <span className="text-xs font-medium text-[var(--text-muted)]">
                        LIVE
                    </span>
                </div>

                {/* Center: Scrolling ticker */}
                <div className="flex-1 flex justify-center">
                    <div className="relative overflow-hidden w-full max-w-md">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
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

                {/* Right: Mini controls */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)}
                        className="p-1 rounded hover:bg-[var(--glass-surface-hover)] transition-colors"
                        aria-label="Previous item"
                    >
                        <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setCurrentIndex((prev) => (prev + 1) % items.length)}
                        className="p-1 rounded hover:bg-[var(--glass-surface-hover)] transition-colors"
                        aria-label="Next item"
                    >
                        <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Progress indicator dots */}
            <div className="flex justify-center gap-1 pb-2">
                {items.map((_, index) => (
                    <div
                        key={index}
                        className={cn(
                            'w-1.5 h-1.5 rounded-full transition-all duration-300',
                            index === currentIndex
                                ? 'bg-[var(--glass-accent)] w-4'
                                : 'bg-[var(--glass-border)]'
                        )}
                    />
                ))}
            </div>
        </div>
    );
};

export default LiveTicker;
