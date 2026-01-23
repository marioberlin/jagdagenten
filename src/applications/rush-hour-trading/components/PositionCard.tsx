import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, X, Target, Shield } from 'lucide-react';
import { GlassContainer, GlassButton } from '@/components';
import type { Position } from '@/types/trading';

interface PositionCardProps {
    position: Position;
    onClose?: (positionId: number) => void;
}

export function PositionCard({ position, onClose }: PositionCardProps) {
    const {
        position_id,
        symbol,
        quantity,
        entry_price,
        current_price = entry_price,
        unrealized_pnl = 0,
        unrealized_pnl_percent = 0,
        targets_hit = [],
        opened_at,
    } = position;

    const isProfit = unrealized_pnl >= 0;
    const baseAsset = symbol.replace(/USDT|BUSD|USD$/i, '');

    // Format time since open
    const openTime = new Date(opened_at);
    const now = new Date();
    const hoursOpen = Math.floor((now.getTime() - openTime.getTime()) / (1000 * 60 * 60));
    const timeText = hoursOpen < 1
        ? 'Just opened'
        : hoursOpen < 24
            ? `${hoursOpen}h ago`
            : `${Math.floor(hoursOpen / 24)}d ago`;

    // Position value
    const positionValue = quantity * current_price;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
            <GlassContainer className="p-4 relative overflow-hidden">
                {/* Background gradient based on P&L */}
                <div
                    className={`absolute inset-0 opacity-10 ${isProfit
                            ? 'bg-gradient-to-br from-green-500/20 to-transparent'
                            : 'bg-gradient-to-br from-red-500/20 to-transparent'
                        }`}
                />

                <div className="relative">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-primary">{baseAsset}</span>
                            <span className="text-sm text-secondary">/USDT</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {targets_hit.length > 0 && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 flex items-center gap-1">
                                    <Target className="w-3 h-3" />
                                    TP {targets_hit.length}
                                </span>
                            )}
                            <span className="text-xs text-tertiary">{timeText}</span>
                        </div>
                    </div>

                    {/* P&L Display */}
                    <div className={`flex items-center gap-2 mb-4 ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                        {isProfit ? (
                            <TrendingUp className="w-5 h-5" />
                        ) : (
                            <TrendingDown className="w-5 h-5" />
                        )}
                        <span className="text-xl font-bold">
                            {isProfit ? '+' : ''}{unrealized_pnl_percent.toFixed(2)}%
                        </span>
                        <span className="text-sm opacity-75">
                            ({isProfit ? '+' : ''}${unrealized_pnl.toFixed(2)})
                        </span>
                    </div>

                    {/* Position Details */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p className="text-tertiary">Entry Price</p>
                            <p className="text-primary font-medium">${entry_price.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-tertiary">Current Price</p>
                            <p className="text-primary font-medium">${current_price.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-tertiary">Quantity</p>
                            <p className="text-primary font-medium">{quantity} {baseAsset}</p>
                        </div>
                        <div>
                            <p className="text-tertiary">Value</p>
                            <p className="text-primary font-medium">${positionValue.toFixed(2)}</p>
                        </div>
                    </div>

                    {/* Stop Loss / Take Profit Indicators */}
                    <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/10">
                        <div className="flex items-center gap-1 text-xs text-secondary">
                            <Shield className="w-3 h-3 text-red-400" />
                            <span>SL: ${(entry_price * 0.95).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-secondary">
                            <Target className="w-3 h-3 text-green-400" />
                            <span>TP: ${(entry_price * 1.05).toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Close Button */}
                    {onClose && (
                        <div className="mt-4">
                            <GlassButton
                                variant="destructive"
                                className="w-full"
                                onClick={() => onClose(position_id)}
                            >
                                <X className="w-4 h-4 mr-2" />
                                Close Position
                            </GlassButton>
                        </div>
                    )}
                </div>
            </GlassContainer>
        </motion.div>
    );
}

export default PositionCard;
