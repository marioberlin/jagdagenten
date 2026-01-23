/**
 * MarketsView - Full Markets Tab Component
 * 
 * Displays a grid of all cryptocurrency prices with 24h stats,
 * fetched from the trading REST API.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    RefreshCw,
    Search,
    ArrowUpDown,
    BarChart3,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassContainer, GlassButton, GlassInput } from '@/components';

// Types
interface MarketAsset {
    symbol: string;
    name: string;
    price: number;
    change24h: number;
    volume: number;
}

interface MarketsViewProps {
    onSelectSymbol?: (symbol: string) => void;
    className?: string;
}

type SortField = 'symbol' | 'price' | 'change24h' | 'volume';
type SortDirection = 'asc' | 'desc';

/**
 * MarketsView - Complete markets overview for the Markets tab
 */
export const MarketsView: React.FC<MarketsViewProps> = ({
    onSelectSymbol,
    className,
}) => {
    const [assets, setAssets] = useState<MarketAsset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState<SortField>('volume');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    // Fetch market data from REST API
    const fetchMarkets = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/trading/prices');
            const result = await response.json();

            if (result.success) {
                setAssets(result.data);
                setLastUpdated(new Date());
            } else {
                setError(result.error || 'Failed to fetch market data');
            }
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial fetch and auto-refresh every 30 seconds
    useEffect(() => {
        fetchMarkets();

        const interval = setInterval(fetchMarkets, 30000);
        return () => clearInterval(interval);
    }, [fetchMarkets]);

    // Sort and filter assets
    const sortedAssets = React.useMemo(() => {
        let filtered = assets;

        // Filter by search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = assets.filter(
                a => a.symbol.toLowerCase().includes(query) ||
                    a.name.toLowerCase().includes(query)
            );
        }

        // Sort
        return [...filtered].sort((a, b) => {
            const aVal = a[sortField];
            const bVal = b[sortField];

            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return sortDirection === 'asc'
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
            }

            return sortDirection === 'asc'
                ? (aVal as number) - (bVal as number)
                : (bVal as number) - (aVal as number);
        });
    }, [assets, searchQuery, sortField, sortDirection]);

    // Toggle sort
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    // Format price based on magnitude
    const formatPrice = (price: number) => {
        if (price >= 10000) return `$${(price / 1000).toFixed(1)}K`;
        if (price >= 1) return `$${price.toFixed(2)}`;
        if (price >= 0.01) return `$${price.toFixed(4)}`;
        return `$${price.toFixed(8)}`;
    };

    // Format volume
    const formatVolume = (volume: number) => {
        if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
        if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
        if (volume >= 1e3) return `$${(volume / 1e3).toFixed(2)}K`;
        return `$${volume.toFixed(2)}`;
    };

    // Sort header component
    const SortHeader: React.FC<{ field: SortField; label: string; align?: 'left' | 'right' }> = ({
        field,
        label,
        align = 'left',
    }) => (
        <button
            onClick={() => handleSort(field)}
            className={cn(
                'flex items-center gap-1 text-xs font-medium text-tertiary',
                'hover:text-primary transition-colors',
                align === 'right' && 'justify-end'
            )}
        >
            {label}
            {sortField === field && (
                <ArrowUpDown className={cn(
                    'w-3 h-3',
                    sortDirection === 'asc' && 'rotate-180'
                )} />
            )}
        </button>
    );

    return (
        <div className={cn('space-y-4', className)}>
            {/* Header with search and refresh */}
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
                    <input
                        type="text"
                        placeholder="Search markets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={cn(
                            'w-full pl-9 pr-4 py-2 rounded-lg',
                            'bg-[var(--glass-surface)]/50 border border-[var(--glass-border)]',
                            'text-primary placeholder:text-tertiary',
                            'focus:outline-none focus:ring-1 focus:ring-[var(--glass-accent)]',
                            'text-sm'
                        )}
                    />
                </div>

                <div className="flex items-center gap-2">
                    {lastUpdated && (
                        <span className="text-xs text-tertiary">
                            Updated {lastUpdated.toLocaleTimeString()}
                        </span>
                    )}
                    <GlassButton
                        variant="ghost"
                        size="sm"
                        onClick={fetchMarkets}
                        disabled={isLoading}
                    >
                        <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
                    </GlassButton>
                </div>
            </div>

            {/* Error state */}
            {error && (
                <GlassContainer className="p-4 border-l-4 border-red-500" border>
                    <p className="text-red-400 text-sm">{error}</p>
                </GlassContainer>
            )}

            {/* Markets grid */}
            <GlassContainer className="overflow-hidden" border>
                {/* Table header */}
                <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-[var(--glass-border)] bg-black/10">
                    <div className="col-span-4">
                        <SortHeader field="symbol" label="Asset" />
                    </div>
                    <div className="col-span-3 text-right">
                        <SortHeader field="price" label="Price" align="right" />
                    </div>
                    <div className="col-span-2 text-right">
                        <SortHeader field="change24h" label="24h %" align="right" />
                    </div>
                    <div className="col-span-3 text-right">
                        <SortHeader field="volume" label="Volume" align="right" />
                    </div>
                </div>

                {/* Loading state */}
                {isLoading && assets.length === 0 && (
                    <div className="flex items-center justify-center py-12">
                        <RefreshCw className="w-6 h-6 animate-spin text-tertiary" />
                    </div>
                )}

                {/* Asset rows */}
                <div className="divide-y divide-[var(--glass-border)]">
                    <AnimatePresence mode="popLayout">
                        {sortedAssets.map((asset) => (
                            <motion.button
                                key={asset.symbol}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                onClick={() => onSelectSymbol?.(asset.symbol)}
                                className={cn(
                                    'w-full grid grid-cols-12 gap-4 px-4 py-3',
                                    'hover:bg-[var(--glass-surface-hover)] transition-colors',
                                    'text-left'
                                )}
                            >
                                {/* Asset info */}
                                <div className="col-span-4 flex items-center gap-3">
                                    <div className={cn(
                                        'w-8 h-8 rounded-full flex items-center justify-center',
                                        'bg-gradient-to-br from-[var(--glass-accent)]/20 to-[var(--glass-accent)]/5'
                                    )}>
                                        <span className="text-xs font-bold text-[var(--glass-accent)]">
                                            {asset.symbol.slice(0, 2)}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-medium text-primary">{asset.symbol}</p>
                                        <p className="text-xs text-tertiary">{asset.name}</p>
                                    </div>
                                </div>

                                {/* Price */}
                                <div className="col-span-3 flex items-center justify-end">
                                    <span className="font-mono text-primary">
                                        {formatPrice(asset.price)}
                                    </span>
                                </div>

                                {/* 24h change */}
                                <div className="col-span-2 flex items-center justify-end gap-1">
                                    {asset.change24h >= 0 ? (
                                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                        <TrendingDown className="w-3 h-3 text-red-400" />
                                    )}
                                    <span className={cn(
                                        'font-medium text-sm',
                                        asset.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                                    )}>
                                        {asset.change24h >= 0 ? '+' : ''}
                                        {asset.change24h.toFixed(2)}%
                                    </span>
                                </div>

                                {/* Volume */}
                                <div className="col-span-3 flex items-center justify-end">
                                    <span className="text-sm text-secondary">
                                        {formatVolume(asset.volume)}
                                    </span>
                                </div>
                            </motion.button>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Empty state */}
                {!isLoading && sortedAssets.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-tertiary">
                        <BarChart3 className="w-12 h-12 mb-4 opacity-50" />
                        <p>No markets found</p>
                        {searchQuery && (
                            <p className="text-xs mt-1">Try a different search term</p>
                        )}
                    </div>
                )}
            </GlassContainer>

            {/* Stats footer */}
            {assets.length > 0 && (
                <div className="flex items-center justify-between text-xs text-tertiary">
                    <span>Showing {sortedAssets.length} of {assets.length} markets</span>
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Live data from Binance
                    </span>
                </div>
            )}
        </div>
    );
};

export default MarketsView;
