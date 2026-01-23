import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    ChevronDown,
    ChevronUp,
    X,
    Shield,
    Target,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassContainer, GlassButton } from '@/components';
import type { Position } from '@/hooks/trading/useDashboardData';

interface PositionsTableProps {
    positions: Position[];
    isLoading?: boolean;
    onClosePosition?: (positionId: string) => void;
}

type SortKey = 'symbol' | 'pnl' | 'pnlPercent' | 'size' | 'duration';
type SortDirection = 'asc' | 'desc';

/**
 * PositionsTable - Data table for open positions
 */
export const PositionsTable: React.FC<PositionsTableProps> = ({
    positions,
    isLoading = false,
    onClosePosition,
}) => {
    const [sortKey, setSortKey] = useState<SortKey>('pnl');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('desc');
        }
    };

    const sortedPositions = useMemo(() => {
        return [...positions].sort((a, b) => {
            let comparison = 0;
            switch (sortKey) {
                case 'symbol':
                    comparison = a.symbol.localeCompare(b.symbol);
                    break;
                case 'pnl':
                    comparison = a.pnl - b.pnl;
                    break;
                case 'pnlPercent':
                    comparison = a.pnlPercent - b.pnlPercent;
                    break;
                case 'size':
                    comparison = a.size - b.size;
                    break;
                case 'duration':
                    comparison = a.openedAt.getTime() - b.openedAt.getTime();
                    break;
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [positions, sortKey, sortDirection]);

    const totalPnL = positions.reduce((sum, p) => sum + p.pnl, 0);
    const totalPnLPercent = positions.length > 0
        ? (positions.reduce((sum, p) => sum + p.pnlPercent, 0) / positions.length)
        : 0;

    const formatCurrency = (n: number) => {
        return `$${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const SortHeader: React.FC<{
        label: string;
        sortKeyName: SortKey;
        className?: string;
    }> = ({ label, sortKeyName, className }) => (
        <button
            onClick={() => handleSort(sortKeyName)}
            className={cn(
                'flex items-center gap-1 text-xs font-semibold text-secondary uppercase tracking-wider hover:text-primary transition-colors',
                className
            )}
        >
            {label}
            {sortKey === sortKeyName && (
                sortDirection === 'asc' ? (
                    <ChevronUp className="w-3 h-3" />
                ) : (
                    <ChevronDown className="w-3 h-3" />
                )
            )}
        </button>
    );

    if (isLoading) {
        return (
            <GlassContainer className="p-6" border>
                <div className="h-48 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                </div>
            </GlassContainer>
        );
    }

    return (
        <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="px-6"
        >
            <div className="max-w-7xl mx-auto">
                <GlassContainer className="p-6" border>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-indigo-500/20">
                                <TrendingUp className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-primary">Open Positions</h3>
                                <div className="flex items-center gap-3 text-xs">
                                    <span className="text-secondary">{positions.length} positions</span>
                                    <span className={cn(
                                        'font-medium',
                                        totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'
                                    )}>
                                        {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)} ({totalPnLPercent >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%)
                                    </span>
                                </div>
                            </div>
                        </div>

                        {positions.length > 0 && (
                            <GlassButton
                                variant="ghost"
                                size="sm"
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                                <X className="w-4 h-4 mr-2" />
                                Close All
                            </GlassButton>
                        )}
                    </div>

                    {/* Table */}
                    {positions.length === 0 ? (
                        <div className="text-center py-12">
                            <TrendingUp className="w-12 h-12 mx-auto mb-3 text-secondary opacity-30" />
                            <p className="text-secondary mb-1">No open positions</p>
                            <p className="text-xs text-tertiary">Your active trades will appear here</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left py-3 px-4">
                                            <SortHeader label="Symbol" sortKeyName="symbol" />
                                        </th>
                                        <th className="text-right py-3 px-4">
                                            <SortHeader label="Size" sortKeyName="size" className="justify-end" />
                                        </th>
                                        <th className="text-right py-3 px-4 hidden md:table-cell">
                                            <span className="text-xs font-semibold text-secondary uppercase tracking-wider">Entry</span>
                                        </th>
                                        <th className="text-right py-3 px-4 hidden md:table-cell">
                                            <span className="text-xs font-semibold text-secondary uppercase tracking-wider">Current</span>
                                        </th>
                                        <th className="text-right py-3 px-4">
                                            <SortHeader label="P&L" sortKeyName="pnl" className="justify-end" />
                                        </th>
                                        <th className="text-right py-3 px-4 hidden lg:table-cell">
                                            <SortHeader label="Duration" sortKeyName="duration" className="justify-end" />
                                        </th>
                                        <th className="text-right py-3 px-4 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedPositions.map((position, index) => (
                                        <React.Fragment key={position.id}>
                                            <motion.tr
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.03 }}
                                                className={cn(
                                                    'border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer',
                                                    expandedRow === position.id && 'bg-white/5'
                                                )}
                                                onClick={() => setExpandedRow(expandedRow === position.id ? null : position.id)}
                                            >
                                                {/* Symbol */}
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold',
                                                            position.side === 'long' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                                        )}>
                                                            {position.side === 'long' ? (
                                                                <ArrowUpRight className="w-4 h-4" />
                                                            ) : (
                                                                <ArrowDownRight className="w-4 h-4" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-primary">{position.symbol}</div>
                                                            <div className="text-xs text-secondary capitalize">{position.side} · {position.leverage}x</div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Size */}
                                                <td className="py-4 px-4 text-right">
                                                    <div className="font-medium text-primary tabular-nums">{position.size.toLocaleString()}</div>
                                                    <div className="text-xs text-secondary">{formatCurrency(position.margin)} margin</div>
                                                </td>

                                                {/* Entry Price */}
                                                <td className="py-4 px-4 text-right hidden md:table-cell">
                                                    <div className="font-medium text-primary tabular-nums">{formatCurrency(position.entryPrice)}</div>
                                                </td>

                                                {/* Current Price */}
                                                <td className="py-4 px-4 text-right hidden md:table-cell">
                                                    <div className="font-medium text-primary tabular-nums">{formatCurrency(position.currentPrice)}</div>
                                                </td>

                                                {/* P&L */}
                                                <td className="py-4 px-4 text-right">
                                                    <div className={cn(
                                                        'font-semibold tabular-nums',
                                                        position.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                                                    )}>
                                                        {position.pnl >= 0 ? '+' : ''}{formatCurrency(position.pnl)}
                                                    </div>
                                                    <div className={cn(
                                                        'text-xs tabular-nums',
                                                        position.pnlPercent >= 0 ? 'text-emerald-400/70' : 'text-red-400/70'
                                                    )}>
                                                        {position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%
                                                    </div>
                                                </td>

                                                {/* Duration */}
                                                <td className="py-4 px-4 text-right hidden lg:table-cell">
                                                    <div className="flex items-center justify-end gap-1 text-secondary">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        <span className="text-sm">{position.duration}</span>
                                                    </div>
                                                </td>

                                                {/* Actions */}
                                                <td className="py-4 px-4 text-right">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onClosePosition?.(position.id);
                                                        }}
                                                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-secondary hover:text-red-400 transition-colors"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </motion.tr>

                                            {/* Expanded Details */}
                                            <AnimatePresence>
                                                {expandedRow === position.id && (
                                                    <motion.tr
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                    >
                                                        <td colSpan={7} className="bg-white/5 border-b border-white/5">
                                                            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                                                {/* Stop Loss */}
                                                                <div className="flex items-center gap-2">
                                                                    <Shield className="w-4 h-4 text-red-400" />
                                                                    <div>
                                                                        <div className="text-xs text-secondary">Stop Loss</div>
                                                                        <div className="text-sm font-medium text-primary">
                                                                            {position.stopLoss ? formatCurrency(position.stopLoss) : 'Not set'}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Take Profit */}
                                                                <div className="flex items-center gap-2">
                                                                    <Target className="w-4 h-4 text-emerald-400" />
                                                                    <div>
                                                                        <div className="text-xs text-secondary">Take Profit</div>
                                                                        <div className="text-sm font-medium text-primary">
                                                                            {position.takeProfit ? formatCurrency(position.takeProfit) : 'Not set'}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Liquidation */}
                                                                {position.liquidationPrice && (
                                                                    <div className="flex items-center gap-2">
                                                                        <TrendingDown className="w-4 h-4 text-amber-400" />
                                                                        <div>
                                                                            <div className="text-xs text-secondary">Liquidation</div>
                                                                            <div className="text-sm font-medium text-amber-400">
                                                                                {formatCurrency(position.liquidationPrice)}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Opened At */}
                                                                <div className="flex items-center gap-2">
                                                                    <Clock className="w-4 h-4 text-blue-400" />
                                                                    <div>
                                                                        <div className="text-xs text-secondary">Opened</div>
                                                                        <div className="text-sm font-medium text-primary">
                                                                            {position.openedAt.toLocaleDateString()} {position.openedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                )}
                                            </AnimatePresence>
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </GlassContainer>
            </div>
        </motion.section>
    );
};

export default PositionsTable;
