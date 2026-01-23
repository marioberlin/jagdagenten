import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, RefreshCcw } from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassButton, GlassInput, GlassCard } from '@/components';

export type OrderSide = 'buy' | 'sell';
export type OrderType = 'market' | 'limit' | 'stop';

export interface Order {
    symbol: string;
    side: OrderSide;
    type: OrderType;
    price?: number;
    amount: number;
}

export interface GlassOrderEntryProps {
    /** Trading pair symbol */
    symbol: string;
    /** Current market price */
    currentPrice?: number;
    /** Order submit handler */
    onOrder: (order: Order) => void;
    /** Custom className */
    className?: string;
}

/**
 * GlassOrderEntry - Order entry form for trading dashboard
 */
export const GlassOrderEntry: React.FC<GlassOrderEntryProps> = ({
    symbol,
    currentPrice = 96234.50,
    onOrder,
    className,
}) => {
    const [side, setSide] = useState<OrderSide>('buy');
    const [orderType, setOrderType] = useState<OrderType>('market');
    const [price, setPrice] = useState(currentPrice.toString());
    const [amount, setAmount] = useState('');

    const handleSubmit = () => {
        const order: Order = {
            symbol,
            side,
            type: orderType,
            price: orderType !== 'market' ? parseFloat(price) : undefined,
            amount: parseFloat(amount) || 0,
        };
        onOrder(order);
    };

    const estimatedTotal = parseFloat(amount) * (parseFloat(price) || currentPrice);

    return (
        <GlassCard className={cn('h-full', className)}>
            <div className="px-4 py-3 border-b border-[var(--glass-border)]">
                <div className="flex items-center justify-between">
                    <span className="font-semibold">{symbol}/USD</span>
                    <span className="font-mono text-lg">${currentPrice.toLocaleString()}</span>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* Buy/Sell Toggle */}
                <div className="flex gap-2">
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSide('buy')}
                        className={cn(
                            'flex-1 py-3 rounded-lg font-semibold transition-all',
                            side === 'buy'
                                ? 'bg-[var(--glass-success)] text-white'
                                : 'bg-[var(--glass-surface-hover)] text-[var(--text-secondary)]'
                        )}
                    >
                        <ArrowUp className="w-4 h-4 inline mr-1" />
                        Buy
                    </motion.button>
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSide('sell')}
                        className={cn(
                            'flex-1 py-3 rounded-lg font-semibold transition-all',
                            side === 'sell'
                                ? 'bg-[var(--glass-destructive)] text-white'
                                : 'bg-[var(--glass-surface-hover)] text-[var(--text-secondary)]'
                        )}
                    >
                        <ArrowDown className="w-4 h-4 inline mr-1" />
                        Sell
                    </motion.button>
                </div>

                {/* Order Type */}
                <div className="flex gap-2">
                    {(['market', 'limit', 'stop'] as OrderType[]).map((type) => (
                        <button
                            key={type}
                            onClick={() => setOrderType(type)}
                            className={cn(
                                'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
                                orderType === type
                                    ? 'bg-[var(--glass-primary)] text-[var(--text-primary)]'
                                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                            )}
                        >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Price Input */}
                {orderType !== 'market' && (
                    <div>
                        <label className="block text-sm text-[var(--text-muted)] mb-1">
                            {orderType === 'stop' ? 'Stop Price' : 'Limit Price'}
                        </label>
                        <GlassInput
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder={`Enter ${orderType} price`}
                            endContent={
                                <button
                                    onClick={() => setPrice(currentPrice.toString())}
                                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                >
                                    <RefreshCcw className="w-4 h-4" />
                                </button>
                            }
                        />
                    </div>
                )}

                {/* Amount Input */}
                <div>
                    <label className="block text-sm text-[var(--text-muted)] mb-1">
                        Amount ({symbol})
                    </label>
                    <GlassInput
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                    />
                    {/* Quick amount buttons */}
                    <div className="flex gap-2 mt-2">
                        {['25%', '50%', '75%', '100%'].map((pct) => (
                            <button
                                key={pct}
                                onClick={() => setAmount((parseFloat(pct) / 100).toString())}
                                className={cn(
                                    'flex-1 py-1 rounded text-xs',
                                    'bg-[var(--glass-surface-hover)]',
                                    'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                                    'transition-colors'
                                )}
                            >
                                {pct}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Order Summary */}
                <div className="p-3 rounded-lg bg-[var(--glass-surface-hover)] space-y-1">
                    <div className="flex justify-between text-sm">
                        <span className="text-[var(--text-muted)]">Total</span>
                        <span className="font-mono">
                            ${estimatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-[var(--text-muted)]">Fee (0.1%)</span>
                        <span className="font-mono text-[var(--text-secondary)]">
                            ${(estimatedTotal * 0.001).toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* Submit Button */}
                <GlassButton
                    variant={side === 'buy' ? 'primary' : 'destructive'}
                    size="lg"
                    className="w-full"
                    onClick={handleSubmit}
                    disabled={!amount || parseFloat(amount) <= 0}
                >
                    {side === 'buy' ? 'Buy' : 'Sell'} {symbol}
                </GlassButton>
            </div>
        </GlassCard>
    );
};

export default GlassOrderEntry;
