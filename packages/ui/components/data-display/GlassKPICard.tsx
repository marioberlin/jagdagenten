import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface GlassKPICardProps {
    /** Label describing the metric */
    label: string;
    /** Value to display */
    value: string | number;
    /** Optional change indicator */
    change?: string;
    /** Trend direction */
    trend?: 'up' | 'down' | 'stable';
    /** Optional sparkline data */
    sparkline?: number[];
    /** Optional icon */
    icon?: LucideIcon;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Loading state */
    loading?: boolean;
    /** Custom className */
    className?: string;
}

/**
 * GlassKPICard - Metric display card with optional sparkline and trend
 */
export const GlassKPICard: React.FC<GlassKPICardProps> = ({
    label,
    value,
    change,
    trend,
    sparkline,
    icon: Icon,
    size = 'md',
    loading = false,
    className,
}) => {
    const sizeStyles = {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };

    const valueSizes = {
        sm: 'text-2xl',
        md: 'text-3xl',
        lg: 'text-4xl',
    };

    const labelSizes = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
    };

    const getTrendColor = () => {
        switch (trend) {
            case 'up':
                return 'text-[var(--glass-success)]';
            case 'down':
                return 'text-[var(--glass-destructive)]';
            default:
                return 'text-[var(--text-muted)]';
        }
    };

    const getTrendIcon = () => {
        switch (trend) {
            case 'up':
                return TrendingUp;
            case 'down':
                return TrendingDown;
            default:
                return Minus;
        }
    };

    // Simple SVG sparkline
    const renderSparkline = () => {
        if (!sparkline || sparkline.length < 2) return null;

        const width = 100;
        const height = 40;
        const min = Math.min(...sparkline);
        const max = Math.max(...sparkline);
        const range = max - min || 1;
        const step = width / (sparkline.length - 1);

        const points = sparkline.map((v, i) => {
            const x = i * step;
            const y = height - ((v - min) / range) * height;
            return `${x},${y}`;
        }).join(' ');

        const isPositive = sparkline[sparkline.length - 1] >= sparkline[0];

        return (
            <svg
                className={cn(
                    'w-full h-10',
                    isPositive ? 'text-[var(--glass-success)]' : 'text-[var(--glass-destructive)]'
                )}
                viewBox={`0 0 ${width} ${height}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <polyline points={points} />
            </svg>
        );
    };

    if (loading) {
        return (
            <div className={cn('rounded-xl bg-[var(--glass-surface)]', sizeStyles[size], className)}>
                <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-[var(--glass-border)] rounded w-1/3" />
                    <div className="h-8 bg-[var(--glass-border)] rounded w-2/3" />
                    <div className="h-4 bg-[var(--glass-border)] rounded w-1/4" />
                </div>
            </div>
        );
    }

    const TrendIcon = getTrendIcon();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
            className={cn(
                'rounded-xl',
                'bg-[var(--glass-surface)]',
                'border border-[var(--glass-border)]',
                'backdrop-blur-lg',
                'transition-all duration-300',
                'hover:border-[var(--glass-accent)]/50',
                'hover:shadow-lg hover:shadow-[var(--glass-accent)]/10',
                sizeStyles[size],
                className
            )}
        >
            <div className="flex items-start justify-between">
                {/* Icon */}
                {Icon && (
                    <div
                        className={cn(
                            'rounded-lg p-2',
                            'bg-[var(--glass-primary)]/10',
                            'text-[var(--glass-accent)]'
                        )}
                    >
                        <Icon className={cn(
                            size === 'sm' && 'w-4 h-4',
                            size === 'md' && 'w-5 h-5',
                            size === 'lg' && 'w-6 h-6'
                        )} />
                    </div>
                )}

                {/* Trend indicator */}
                {trend && (
                    <div
                        className={cn(
                            'flex items-center gap-1 px-2 py-1 rounded-full',
                            'bg-[var(--glass-border)]/50',
                            getTrendColor()
                        )}
                    >
                        <TrendIcon className="w-3 h-3" />
                        {change && <span className="text-xs font-medium">{change}</span>}
                    </div>
                )}
            </div>

            {/* Value */}
            <div className="mt-4">
                <p className={cn(
                    'font-bold text-[var(--text-primary)]',
                    valueSizes[size]
                )}>
                    {value}
                </p>
                <p className={cn(
                    'text-[var(--text-secondary)]',
                    labelSizes[size]
                )}>
                    {label}
                </p>
            </div>

            {/* Sparkline */}
            {sparkline && sparkline.length > 0 && (
                <div className="mt-4">
                    {renderSparkline()}
                </div>
            )}
        </motion.div>
    );
};

export default GlassKPICard;
