import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, ChevronDown, Star, TrendingUp } from 'lucide-react';
import { cn } from '@/utils/cn';

interface SymbolInfo {
    symbol: string;
    baseAsset: string;
    quoteAsset: string;
}

interface SymbolSelectorProps {
    value: string;
    onChange: (symbol: string) => void;
    className?: string;
}

// Top coins by market cap (hardcoded for reliability)
const TOP_COINS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'SHIB', 'LINK'];

export const SymbolSelector: React.FC<SymbolSelectorProps> = ({
    value,
    onChange,
    className
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [symbols, setSymbols] = useState<SymbolInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Fetch available USDT trading pairs
    useEffect(() => {
        const fetchSymbols = async () => {
            try {
                const response = await fetch('https://api.binance.com/api/v3/exchangeInfo');
                const data = await response.json();

                const usdtPairs: SymbolInfo[] = data.symbols
                    .filter((s: any) =>
                        s.quoteAsset === 'USDT' &&
                        s.status === 'TRADING' &&
                        s.isSpotTradingAllowed
                    )
                    .map((s: any) => ({
                        symbol: s.symbol,
                        baseAsset: s.baseAsset,
                        quoteAsset: s.quoteAsset
                    }));

                setSymbols(usdtPairs);
            } catch (error) {
                console.error('Failed to fetch symbols:', error);
                // Fallback to common pairs
                setSymbols(TOP_COINS.map(coin => ({
                    symbol: `${coin}USDT`,
                    baseAsset: coin,
                    quoteAsset: 'USDT'
                })));
            } finally {
                setLoading(false);
            }
        };

        fetchSymbols();
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search input when opening
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Filter and sort symbols
    const { topSymbols, otherSymbols } = useMemo(() => {
        const searchLower = search.toLowerCase();

        const filtered = symbols.filter(s =>
            s.baseAsset.toLowerCase().includes(searchLower) ||
            s.symbol.toLowerCase().includes(searchLower)
        );

        const top = filtered.filter(s => TOP_COINS.includes(s.baseAsset));
        const others = filtered
            .filter(s => !TOP_COINS.includes(s.baseAsset))
            .sort((a, b) => a.baseAsset.localeCompare(b.baseAsset));

        return { topSymbols: top, otherSymbols: others };
    }, [symbols, search]);

    const currentSymbol = symbols.find(s => s.symbol === value);
    const displayText = currentSymbol?.baseAsset || value.replace('USDT', '');

    const handleSelect = (symbol: string) => {
        onChange(symbol);
        setIsOpen(false);
        setSearch('');
    };

    return (
        <div ref={containerRef} className={cn("relative", className)}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl",
                    "bg-glass-surface border border-glass-border",
                    "hover:bg-white/10 transition-colors",
                    "text-white font-medium",
                    isOpen && "ring-2 ring-primary/50"
                )}
            >
                <span className="text-lg">{displayText}</span>
                <span className="text-xs text-secondary">/USDT</span>
                <ChevronDown className={cn(
                    "w-4 h-4 text-secondary transition-transform",
                    isOpen && "rotate-180"
                )} />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-glass-panel/95 backdrop-blur-xl rounded-xl border border-glass-border shadow-2xl z-50 overflow-hidden">
                    {/* Search Input */}
                    <div className="p-3 border-b border-glass-border/50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search coins..."
                                className="w-full pl-10 pr-4 py-2 bg-black/30 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-primary/50"
                            />
                        </div>
                    </div>

                    {/* Symbol Lists */}
                    <div className="max-h-80 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-secondary text-sm">
                                Loading pairs...
                            </div>
                        ) : (
                            <>
                                {/* Top 10 Section */}
                                {topSymbols.length > 0 && (
                                    <div>
                                        <div className="px-3 py-2 text-[10px] text-white/40 uppercase tracking-wider font-medium flex items-center gap-1.5 bg-black/20">
                                            <TrendingUp className="w-3 h-3" />
                                            Top Coins
                                        </div>
                                        {topSymbols.map((s) => (
                                            <SymbolRow
                                                key={s.symbol}
                                                symbol={s}
                                                isSelected={s.symbol === value}
                                                isTop={true}
                                                onClick={() => handleSelect(s.symbol)}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Other Coins Section */}
                                {otherSymbols.length > 0 && (
                                    <div>
                                        <div className="px-3 py-2 text-[10px] text-white/40 uppercase tracking-wider font-medium bg-black/20">
                                            All Coins (A-Z)
                                        </div>
                                        {otherSymbols.map((s) => (
                                            <SymbolRow
                                                key={s.symbol}
                                                symbol={s}
                                                isSelected={s.symbol === value}
                                                isTop={false}
                                                onClick={() => handleSelect(s.symbol)}
                                            />
                                        ))}
                                    </div>
                                )}

                                {topSymbols.length === 0 && otherSymbols.length === 0 && (
                                    <div className="p-4 text-center text-secondary text-sm">
                                        No matches found
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const SymbolRow: React.FC<{
    symbol: SymbolInfo;
    isSelected: boolean;
    isTop: boolean;
    onClick: () => void;
}> = ({ symbol, isSelected, isTop, onClick }) => (
    <button
        onClick={onClick}
        className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 text-left",
            "hover:bg-white/5 transition-colors",
            isSelected && "bg-primary/10"
        )}
    >
        {isTop && <Star className="w-3 h-3 text-yellow-400/60" />}
        <div className="flex-1">
            <span className={cn(
                "font-medium",
                isSelected ? "text-primary" : "text-white"
            )}>
                {symbol.baseAsset}
            </span>
            <span className="text-secondary text-sm ml-1">/{symbol.quoteAsset}</span>
        </div>
        {isSelected && (
            <div className="w-2 h-2 rounded-full bg-primary" />
        )}
    </button>
);

SymbolSelector.displayName = 'SymbolSelector';
