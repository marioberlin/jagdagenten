import React, { useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    BarChart3,
    Target,
    Bot,
    Shield,
    Flame,
    AlertTriangle,
    CheckCircle,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { PortfolioMetrics as PortfolioMetricsType } from '@/hooks/trading/useDashboardData';

interface MetricCardProps {
    icon: React.ReactNode;
    iconBgColor: string;
    iconColor: string;
    label: string;
    value: string | number;
    subValue?: string;
    subValueColor?: string;
    trend?: 'up' | 'down' | 'neutral';
    badge?: React.ReactNode;
    delay?: number;
}

/**
 * MetricCard - 3D hover effect card inspired by AgentCard
 */
const MetricCard: React.FC<MetricCardProps> = ({
    icon,
    iconBgColor,
    iconColor,
    label,
    value,
    subValue,
    subValueColor = 'text-secondary',
    trend,
    badge,
    delay = 0,
}) => {
    const [isHovered, setIsHovered] = useState(false);

    // 3D perspective motion
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const rotateX = useSpring(useTransform(y, [-100, 100], [10, -10]), {
        stiffness: 150,
        damping: 15,
        mass: 0.1,
    });
    const rotateY = useSpring(useTransform(x, [-100, 100], [-10, 10]), {
        stiffness: 150,
        damping: 15,
        mass: 0.1,
    });

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        x.set(event.clientX - centerX);
        y.set(event.clientY - centerY);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
        setIsHovered(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5, type: 'spring', stiffness: 100 }}
            style={{
                perspective: 1000,
            }}
        >
            <motion.div
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={handleMouseLeave}
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: 'preserve-3d',
                }}
                className={cn(
                    'relative p-5 rounded-2xl',
                    'bg-gradient-to-br from-white/10 to-white/5',
                    'border border-white/10',
                    'backdrop-blur-xl',
                    'transition-all duration-300',
                    isHovered && 'border-white/20 shadow-xl shadow-black/20'
                )}
            >
                {/* Shine effect on hover */}
                <motion.div
                    className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden"
                    style={{
                        background: isHovered
                            ? 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)'
                            : 'transparent',
                    }}
                />

                {/* Glow effect */}
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={cn(
                            'absolute -inset-1 rounded-3xl blur-xl opacity-30 pointer-events-none',
                            iconBgColor.replace('/20', '/40')
                        )}
                    />
                )}

                <div className="relative z-10 flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-secondary uppercase tracking-wider mb-2">
                            {label}
                        </p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-primary tabular-nums">
                                {value}
                            </span>
                            {trend && (
                                <span
                                    className={cn(
                                        'flex items-center text-xs font-medium',
                                        trend === 'up' && 'text-emerald-400',
                                        trend === 'down' && 'text-red-400',
                                        trend === 'neutral' && 'text-secondary'
                                    )}
                                >
                                    {trend === 'up' && <TrendingUp className="w-3 h-3 mr-0.5" />}
                                    {trend === 'down' && <TrendingDown className="w-3 h-3 mr-0.5" />}
                                </span>
                            )}
                        </div>
                        {subValue && (
                            <p className={cn('text-sm mt-1', subValueColor)}>
                                {subValue}
                            </p>
                        )}
                        {badge && <div className="mt-2">{badge}</div>}
                    </div>

                    <div
                        className={cn(
                            'flex-shrink-0 p-3 rounded-xl',
                            iconBgColor
                        )}
                        style={{
                            transform: isHovered ? 'translateZ(20px)' : 'translateZ(0px)',
                            transition: 'transform 0.3s ease-out',
                        }}
                    >
                        <div className={iconColor}>
                            {icon}
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

/**
 * PortfolioMetrics - Grid of 6 key metrics with 3D hover
 */
interface PortfolioMetricsProps {
    metrics: PortfolioMetricsType | null;
    isLoading?: boolean;
}

export const PortfolioMetrics: React.FC<PortfolioMetricsProps> = ({
    metrics,
    isLoading: _isLoading = false,
}) => {
    if (!metrics) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-32 rounded-2xl bg-white/5 animate-pulse"
                    />
                ))}
            </div>
        );
    }

    const formatCurrency = (n: number) => {
        const absValue = Math.abs(n);
        if (absValue >= 1_000_000) {
            return `$${(n / 1_000_000).toFixed(2)}M`;
        }
        if (absValue >= 1000) {
            return `$${(n / 1000).toFixed(1)}K`;
        }
        return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const isPnLPositive = metrics.totalPnL >= 0;
    const isExposureHigh = metrics.riskExposure > 60;

    return (
        <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="px-6"
        >
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {/* 1. Portfolio Value */}
                    <MetricCard
                        icon={<DollarSign className="w-6 h-6" />}
                        iconBgColor="bg-blue-500/20"
                        iconColor="text-blue-400"
                        label="Portfolio Value"
                        value={formatCurrency(metrics.totalValue)}
                        subValue={`${metrics.totalValueChangePercent24h >= 0 ? '+' : ''}${metrics.totalValueChangePercent24h.toFixed(2)}% today`}
                        subValueColor={metrics.totalValueChangePercent24h >= 0 ? 'text-emerald-400' : 'text-red-400'}
                        trend={metrics.totalValueChangePercent24h >= 0 ? 'up' : 'down'}
                        delay={0.1}
                    />

                    {/* 2. Total P&L */}
                    <MetricCard
                        icon={isPnLPositive ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                        iconBgColor={isPnLPositive ? 'bg-emerald-500/20' : 'bg-red-500/20'}
                        iconColor={isPnLPositive ? 'text-emerald-400' : 'text-red-400'}
                        label="Total P&L"
                        value={`${isPnLPositive ? '+' : ''}${formatCurrency(metrics.totalPnL)}`}
                        subValue={`${isPnLPositive ? '+' : ''}${metrics.totalPnLPercent.toFixed(2)}%`}
                        subValueColor={isPnLPositive ? 'text-emerald-400' : 'text-red-400'}
                        trend={isPnLPositive ? 'up' : 'down'}
                        delay={0.15}
                    />

                    {/* 3. Open Positions */}
                    <MetricCard
                        icon={<BarChart3 className="w-6 h-6" />}
                        iconBgColor="bg-purple-500/20"
                        iconColor="text-purple-400"
                        label="Open Positions"
                        value={metrics.openPositions}
                        subValue={`Avg hold: ${metrics.avgHoldTime}`}
                        delay={0.2}
                    />

                    {/* 4. Win Rate */}
                    <MetricCard
                        icon={<Target className="w-6 h-6" />}
                        iconBgColor="bg-amber-500/20"
                        iconColor="text-amber-400"
                        label="Win Rate"
                        value={`${metrics.winRate.toFixed(1)}%`}
                        subValue={metrics.winStreak > 0 ? `${metrics.winStreak} win streak` : undefined}
                        subValueColor="text-emerald-400"
                        badge={
                            metrics.winStreak >= 3 && (
                                <div className="flex items-center gap-1 text-xs text-amber-400">
                                    <Flame className="w-3 h-3" />
                                    <span>On fire!</span>
                                </div>
                            )
                        }
                        delay={0.25}
                    />

                    {/* 5. Active Bots */}
                    <MetricCard
                        icon={<Bot className="w-6 h-6" />}
                        iconBgColor="bg-cyan-500/20"
                        iconColor="text-cyan-400"
                        label="Active Bots"
                        value={`${metrics.activeBots}/${metrics.totalBots}`}
                        subValue={
                            metrics.botHealth === 'healthy'
                                ? 'All healthy'
                                : metrics.botHealth === 'warning'
                                    ? 'Needs attention'
                                    : 'Has errors'
                        }
                        subValueColor={
                            metrics.botHealth === 'healthy'
                                ? 'text-emerald-400'
                                : metrics.botHealth === 'warning'
                                    ? 'text-amber-400'
                                    : 'text-red-400'
                        }
                        badge={
                            <div className="flex items-center gap-1.5">
                                {metrics.botHealth === 'healthy' && (
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                )}
                                {metrics.botHealth === 'warning' && (
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                                )}
                                {metrics.botHealth === 'error' && (
                                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                                )}
                            </div>
                        }
                        delay={0.3}
                    />

                    {/* 6. Risk Exposure */}
                    <MetricCard
                        icon={<Shield className="w-6 h-6" />}
                        iconBgColor={isExposureHigh ? 'bg-red-500/20' : 'bg-teal-500/20'}
                        iconColor={isExposureHigh ? 'text-red-400' : 'text-teal-400'}
                        label="Risk Exposure"
                        value={`${metrics.riskExposure.toFixed(1)}%`}
                        subValue={`${metrics.leverage}x leverage`}
                        subValueColor={isExposureHigh ? 'text-amber-400' : 'text-secondary'}
                        badge={
                            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                                <div
                                    className={cn(
                                        'h-full rounded-full transition-all duration-500',
                                        metrics.riskExposure < 40 && 'bg-emerald-500',
                                        metrics.riskExposure >= 40 && metrics.riskExposure < 70 && 'bg-amber-500',
                                        metrics.riskExposure >= 70 && 'bg-red-500'
                                    )}
                                    style={{ width: `${metrics.riskExposure}%` }}
                                />
                            </div>
                        }
                        delay={0.35}
                    />
                </div>
            </div>
        </motion.section>
    );
};

export default PortfolioMetrics;
