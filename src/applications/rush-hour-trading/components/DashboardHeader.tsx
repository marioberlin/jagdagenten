import React, { useState, useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    RefreshCw,
    Command,
    Plus,
    ArrowUpRight,
    ArrowDownRight,
    Wallet,
    Send,
    Download,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassButton } from '@/components';

interface DashboardHeaderProps {
    totalValue: number;
    totalValueChange: number;
    totalValueChangePercent: number;
    totalPnL: number;
    totalPnLPercent: number;
    lastUpdated: Date | null;
    onRefresh: () => void;
    onCommandPalette: () => void;
    isLoading?: boolean;
}

/**
 * AnimatedNumber - Smoothly animates number changes
 */
const AnimatedNumber: React.FC<{
    value: number;
    format?: (n: number) => string;
    className?: string;
}> = ({ value, format = (n) => n.toLocaleString(), className }) => {
    const spring = useSpring(value, { stiffness: 100, damping: 30 });
    const display = useTransform(spring, (current) => format(current));
    const [displayValue, setDisplayValue] = useState(format(value));

    useEffect(() => {
        spring.set(value);
    }, [value, spring]);

    useEffect(() => {
        return display.on('change', (v) => setDisplayValue(v));
    }, [display]);

    return <span className={className}>{displayValue}</span>;
};

/**
 * SparklineChart - Mini trend visualization
 */
const SparklineChart: React.FC<{
    data: number[];
    isPositive: boolean;
    className?: string;
}> = ({ data, isPositive, className }) => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const height = 40;
    const width = 120;

    const points = data.map((value, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((value - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg
            width={width}
            height={height}
            className={cn('overflow-visible', className)}
            viewBox={`0 0 ${width} ${height}`}
        >
            {/* Gradient fill */}
            <defs>
                <linearGradient id={`sparkline-gradient-${isPositive ? 'up' : 'down'}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isPositive ? '#10B981' : '#EF4444'} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={isPositive ? '#10B981' : '#EF4444'} stopOpacity="0" />
                </linearGradient>
            </defs>

            {/* Area fill */}
            <polygon
                points={`0,${height} ${points} ${width},${height}`}
                fill={`url(#sparkline-gradient-${isPositive ? 'up' : 'down'})`}
            />

            {/* Line */}
            <polyline
                points={points}
                fill="none"
                stroke={isPositive ? '#10B981' : '#EF4444'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* End dot */}
            <circle
                cx={width}
                cy={height - ((data[data.length - 1] - min) / range) * height}
                r="3"
                fill={isPositive ? '#10B981' : '#EF4444'}
            />
        </svg>
    );
};

// Generate 7-day sparkline data
const generateSparklineData = (trend: number): number[] => {
    const data: number[] = [];
    let value = 100;
    for (let i = 0; i < 14; i++) {
        value += (Math.random() - 0.5 + trend * 0.1) * 5;
        data.push(value);
    }
    return data;
};

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    totalValue,
    totalValueChange,
    totalValueChangePercent,
    totalPnL,
    totalPnLPercent,
    lastUpdated,
    onRefresh,
    onCommandPalette,
    isLoading = false,
}) => {
    const isPositive = totalValueChange >= 0;
    const isPnLPositive = totalPnL >= 0;
    const sparklineData = React.useMemo(() => generateSparklineData(isPositive ? 1 : -1), [isPositive]);

    const formatCurrency = (n: number) => {
        const absValue = Math.abs(n);
        if (absValue >= 1_000_000) {
            return `$${(n / 1_000_000).toFixed(2)}M`;
        }
        return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative px-6 pt-8 pb-10"
        >
            {/* Gradient Orb Background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] pointer-events-none overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className={cn(
                        'absolute inset-0 blur-3xl',
                        isPositive
                            ? 'bg-gradient-to-b from-emerald-500/20 via-teal-500/10 to-transparent'
                            : 'bg-gradient-to-b from-red-500/20 via-orange-500/10 to-transparent'
                    )}
                />
            </div>

            <div className="relative max-w-7xl mx-auto">
                {/* Top Row - Title + Actions */}
                <div className="flex items-center justify-between mb-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                'p-2.5 rounded-xl border',
                                isPositive
                                    ? 'bg-emerald-500/20 border-emerald-500/30'
                                    : 'bg-red-500/20 border-red-500/30'
                            )}>
                                {isPositive ? (
                                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                                ) : (
                                    <TrendingDown className="w-6 h-6 text-red-400" />
                                )}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-primary tracking-tight">
                                    Trading Dashboard
                                </h1>
                                <p className="text-sm text-secondary">
                                    {lastUpdated ? (
                                        <>Last updated {lastUpdated.toLocaleTimeString()}</>
                                    ) : (
                                        'Syncing...'
                                    )}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-3"
                    >
                        <GlassButton
                            variant="ghost"
                            size="sm"
                            onClick={onCommandPalette}
                            className="hidden md:flex"
                        >
                            <Command className="w-4 h-4 mr-2" />
                            <span className="text-xs text-secondary">Cmd+K</span>
                        </GlassButton>

                        <GlassButton
                            variant="secondary"
                            size="sm"
                            onClick={onRefresh}
                            disabled={isLoading}
                        >
                            <RefreshCw className={cn('w-4 h-4 mr-2', isLoading && 'animate-spin')} />
                            Refresh
                        </GlassButton>

                        <GlassButton
                            variant="primary"
                            size="sm"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            New Trade
                        </GlassButton>
                    </motion.div>
                </div>

                {/* Main Value Display */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="text-center mb-8"
                >
                    <p className="text-sm font-medium text-secondary mb-2 uppercase tracking-wider">
                        Total Portfolio Value
                    </p>

                    <div className="flex items-center justify-center gap-6">
                        {/* Main Value */}
                        <div>
                            <AnimatedNumber
                                value={totalValue}
                                format={formatCurrency}
                                className="text-5xl md:text-6xl font-bold text-primary tracking-tight"
                            />
                        </div>

                        {/* Sparkline */}
                        <div className="hidden md:block">
                            <SparklineChart
                                data={sparklineData}
                                isPositive={isPositive}
                            />
                        </div>
                    </div>

                    {/* Change Badges */}
                    <div className="flex items-center justify-center gap-4 mt-4">
                        {/* 24h Change */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 }}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-full',
                                isPositive
                                    ? 'bg-emerald-500/15 text-emerald-400'
                                    : 'bg-red-500/15 text-red-400'
                            )}
                        >
                            {isPositive ? (
                                <ArrowUpRight className="w-4 h-4" />
                            ) : (
                                <ArrowDownRight className="w-4 h-4" />
                            )}
                            <span className="font-semibold text-sm">
                                {isPositive ? '+' : ''}{formatCurrency(totalValueChange)}
                            </span>
                            <span className="text-xs opacity-80">
                                ({isPositive ? '+' : ''}{totalValueChangePercent.toFixed(2)}%)
                            </span>
                            <span className="text-xs opacity-60 ml-1">24h</span>
                        </motion.div>

                        {/* Total P&L */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 }}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-full',
                                isPnLPositive
                                    ? 'bg-emerald-500/10 text-emerald-400/80'
                                    : 'bg-red-500/10 text-red-400/80'
                            )}
                        >
                            <span className="text-xs opacity-60">P&L</span>
                            <span className="font-medium text-sm">
                                {isPnLPositive ? '+' : ''}{formatCurrency(totalPnL)}
                            </span>
                            <span className="text-xs opacity-70">
                                ({isPnLPositive ? '+' : ''}{totalPnLPercent.toFixed(2)}%)
                            </span>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex items-center justify-center gap-4"
                >
                    <QuickActionButton
                        icon={<Wallet className="w-4 h-4" />}
                        label="Deposit"
                        color="emerald"
                    />
                    <QuickActionButton
                        icon={<Send className="w-4 h-4" />}
                        label="Withdraw"
                        color="orange"
                    />
                    <QuickActionButton
                        icon={<Download className="w-4 h-4" />}
                        label="Export"
                        color="blue"
                    />
                </motion.div>
            </div>
        </motion.header>
    );
};

/**
 * QuickActionButton - Subtle action button
 */
const QuickActionButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    color: 'emerald' | 'orange' | 'blue' | 'purple';
    onClick?: () => void;
}> = ({ icon, label, color, onClick }) => {
    const colorClasses = {
        emerald: 'hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/20',
        orange: 'hover:bg-orange-500/10 hover:text-orange-400 hover:border-orange-500/20',
        blue: 'hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/20',
        purple: 'hover:bg-purple-500/10 hover:text-purple-400 hover:border-purple-500/20',
    };

    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl',
                'bg-white/5 border border-white/10 text-secondary',
                'transition-all duration-200',
                colorClasses[color]
            )}
        >
            {icon}
            <span className="text-sm font-medium">{label}</span>
        </motion.button>
    );
};

export default DashboardHeader;
