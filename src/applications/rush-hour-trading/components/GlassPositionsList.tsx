import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassCard, GlassButton, GlassBadge } from '@/components';

export interface Position {
    id: string;
    symbol: string;
    side: 'long' | 'short';
    size: number;
    entryPrice: number;
    markPrice: number;
    pnl: number;
    pnlPercent: number;
    leverage: number;
    liquidationPrice?: number;
    margin: number;
}

export interface GlassPositionsListProps {
    /** Positions to display */
    positions?: Position[];
    /** Position close handler */
    onClose?: (positionId: string) => void;
    /** Position edit handler */
    onEdit?: (positionId: string) => void;
    /** Custom className */
    className?: string;
}

/**
 * GlassPositionsList - Open positions display for trading dashboard
 */
export const GlassPositionsList: React.FC<GlassPositionsListProps> = ({
    positions = [
        {
            id: '1',
            symbol: 'BTC',
            side: 'long',
            size: 1.5,
            entryPrice: 92500.00,
            markPrice: 96234.50,
            pnl: 5601.75,
            pnlPercent: 4.03,
            leverage: 5,
            liquidationPrice: 78200.00,
            margin: 28870.35,
        },
        {
            id: '2',
            symbol: 'ETH',
            side: 'long',
            size: 15,
            entryPrice: 3200.00,
            markPrice: 3456.78,
            pnl: 3851.70,
            pnlPercent: 8.02,
            leverage: 3,
            liquidationPrice: 2450.00,
            margin: 17283.90,
        },
        {
            id: '3',
            symbol: 'SOL',
            side: 'short',
            size: 50,
            entryPrice: 245.00,
            markPrice: 234.56,
            pnl: -522.00,
            pnlPercent: -4.27,
            leverage: 2,
            liquidationPrice: 310.00,
            margin: 5864.00,
        },
    ],
    onClose,
    onEdit,
    className,
}) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [menuOpen, setMenuOpen] = useState<string | null>(null);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    };

    const formatPercent = (value: number) => {
        const sign = value >= 0 ? '+' : '';
        return `${sign}${value.toFixed(2)}%`;
    };

    return (
        <GlassCard className={cn('h-full overflow-hidden flex flex-col', className)}>
            <div className="px-4 py-3 border-b border-[var(--glass-border)] flex items-center justify-between">
                <span className="font-semibold">Open Positions</span>
                <GlassBadge variant="glass">{positions.length}</GlassBadge>
            </div>

            <div className="flex-1 overflow-auto p-0">
                <div className="divide-y divide-[var(--glass-border)]">
                    {positions.map((position) => (
                        <motion.div
                            key={position.id}
                            initial={false}
                            animate={{ backgroundColor: expandedId === position.id ? 'var(--glass-surface-hover)' : 'transparent' }}
                            className="relative"
                        >
                            {/* Main row */}
                            <div
                                className="flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--glass-surface-hover)] transition-colors"
                                onClick={() => setExpandedId(expandedId === position.id ? null : position.id)}
                            >
                                <div className="flex items-center gap-4">
                                    {/* Symbol & Side */}
                                    <div className="flex items-center gap-2">
                                        <div
                                            className={cn(
                                                'w-10 h-10 rounded-lg flex items-center justify-center',
                                                position.side === 'long'
                                                    ? 'bg-[var(--glass-success)]/20'
                                                    : 'bg-[var(--glass-destructive)]/20'
                                            )}
                                        >
                                            {position.side === 'long' ? (
                                                <TrendingUp className="w-5 h-5 text-[var(--glass-success)]" />
                                            ) : (
                                                <TrendingDown className="w-5 h-5 text-[var(--glass-destructive)]" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">{position.symbol}/USD</span>
                                                <GlassBadge
                                                    variant={position.side === 'long' ? 'default' : 'destructive'}
                                                    className="text-[10px] px-1.5 py-0"
                                                >
                                                    {position.side.toUpperCase()}
                                                </GlassBadge>
                                                <span className="text-xs text-[var(--text-muted)]">
                                                    {position.leverage}x
                                                </span>
                                            </div>
                                            <div className="text-xs text-[var(--text-muted)]">
                                                {position.size} {position.symbol} @ {formatCurrency(position.entryPrice)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* P&L */}
                                <div className="text-right">
                                    <div
                                        className={cn(
                                            'font-mono font-semibold',
                                            position.pnl >= 0
                                                ? 'text-[var(--glass-success)]'
                                                : 'text-[var(--glass-destructive)]'
                                        )}
                                    >
                                        {position.pnl >= 0 ? '+' : ''}{formatCurrency(position.pnl)}
                                    </div>
                                    <div
                                        className={cn(
                                            'text-xs font-mono',
                                            position.pnlPercent >= 0
                                                ? 'text-[var(--glass-success)]'
                                                : 'text-[var(--glass-destructive)]'
                                        )}
                                    >
                                        {formatPercent(position.pnlPercent)}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded details */}
                            {expandedId === position.id && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="px-4 pb-4"
                                >
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-[var(--glass-surface)]">
                                        <div>
                                            <div className="text-xs text-[var(--text-muted)] mb-1">Mark Price</div>
                                            <div className="font-mono">{formatCurrency(position.markPrice)}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-[var(--text-muted)] mb-1">Liquidation</div>
                                            <div className="font-mono text-[var(--glass-destructive)]">
                                                {position.liquidationPrice ? formatCurrency(position.liquidationPrice) : '-'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-[var(--text-muted)] mb-1">Margin</div>
                                            <div className="font-mono">{formatCurrency(position.margin)}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-[var(--text-muted)] mb-1">Notional</div>
                                            <div className="font-mono">{formatCurrency(position.size * position.markPrice)}</div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-4">
                                        <GlassButton
                                            variant="destructive"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onClose?.(position.id);
                                            }}
                                        >
                                            Close Position
                                        </GlassButton>
                                        <GlassButton
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit?.(position.id);
                                            }}
                                        >
                                            Modify
                                        </GlassButton>
                                    </div>
                                </motion.div>
                            )}

                            {/* Menu button */}
                            <div className="absolute top-4 right-4">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setMenuOpen(menuOpen === position.id ? null : position.id);
                                    }}
                                    className={cn(
                                        'p-1.5 rounded-lg transition-colors',
                                        menuOpen === position.id
                                            ? 'bg-[var(--glass-surface-hover)]'
                                            : 'hover:bg-[var(--glass-surface-hover)]'
                                    )}
                                >
                                    <MoreHorizontal className="w-4 h-4 text-[var(--text-muted)]" />
                                </button>

                                {menuOpen === position.id && (
                                    <div className="absolute right-0 top-8 w-36 bg-[var(--glass-surface)] border border-[var(--glass-border)] rounded-lg shadow-lg z-10 py-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit?.(position.id);
                                                setMenuOpen(null);
                                            }}
                                            className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-[var(--glass-surface-hover)]"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                            Modify
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onClose?.(position.id);
                                                setMenuOpen(null);
                                            }}
                                            className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 text-[var(--glass-destructive)] hover:bg-[var(--glass-surface-hover)]"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Close
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}

                    {positions.length === 0 && (
                        <div className="p-8 text-center text-[var(--text-muted)]">
                            No open positions
                        </div>
                    )}
                </div>
            </div>
        </GlassCard>
    );
};

export default GlassPositionsList;
