import { useEffect, useState } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface GlassMetricProps {
    /** Title/label for the metric */
    title?: string;
    label?: string; // Alias for title
    /** Value - can be number or pre-formatted string */
    value: number | string;
    prefix?: string;
    suffix?: string;
    /** Trend indicator */
    trend?: 'up' | 'down' | {
        value: number;
        label?: string;
        isPositive?: boolean;
    };
    trendValue?: string; // Simplified trend value like "+5.2%"
    icon?: React.ReactNode;
    data?: number[]; // For sparkline
    className?: string;
}

export const GlassMetric = ({
    title,
    label,
    value,
    prefix = '',
    suffix = '',
    trend,
    trendValue,
    icon,
    data = [40, 30, 45, 50, 49, 60, 70, 91],
    className
}: GlassMetricProps) => {
    // Normalize title (allow `label` alias)
    const displayTitle = title || label || '';

    // Normalize value - handle both strings and numbers
    const numericValue = typeof value === 'string'
        ? parseFloat(value.replace(/[^0-9.-]/g, '')) || 0
        : value;


    // Normalize trend
    const isPositiveTrend = trend === 'up' || (typeof trend === 'object' && trend?.isPositive !== false);
    const trendPercent = trendValue || (typeof trend === 'object' ? `${trend.value}%` : null);
    // Animated Value - only animate if numeric and reasonable
    const [displayValue, setDisplayValue] = useState(numericValue);
    const shouldAnimate = typeof value === 'number' && value < 1000000;

    useEffect(() => {
        if (!shouldAnimate) {
            setDisplayValue(numericValue);
            return;
        }

        let start = 0;
        const end = numericValue;
        const duration = 1000;
        const increment = end / (duration / 16);

        const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
                setDisplayValue(end);
                clearInterval(timer);
            } else {
                setDisplayValue(Math.floor(start));
            }
        }, 16);

        return () => clearInterval(timer);
    }, [numericValue, shouldAnimate]);

    // Sparkline Path Generator
    const generateSparkline = (points: number[]) => {
        if (points.length < 2) return '';
        const max = Math.max(...points);
        const min = Math.min(...points);
        const range = max - min || 1;
        const height = 40;
        const width = 120;
        const step = width / (points.length - 1);

        const path = points.map((p, i) => {
            const x = i * step;
            const y = height - ((p - min) / range) * height;
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');

        return path;
    };

    return (
        <GlassContainer material="surface" className={cn("p-6 flex flex-col justify-between relative overflow-hidden group", className)}>

            {/* Background Sparkline (Decorative) */}
            <div className="absolute right-0 bottom-0 opacity-20 group-hover:opacity-40 transition-opacity translate-y-2 translate-x-2">
                <svg width="120" height="40" className="overflow-visible">
                    <path
                        d={generateSparkline(data)}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        className={!isPositiveTrend ? "text-red-400" : "text-emerald-400"}
                    />
                </svg>
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-2">
                    {icon && <span className="text-secondary">{icon}</span>}
                    <span className="text-label-glass-secondary text-sm font-medium uppercase tracking-wider">{displayTitle}</span>
                </div>
                <div className="flex items-center gap-3 mt-2">
                    <span className="text-3xl font-bold tracking-tight text-label-glass-primary">
                        {typeof value === 'string' ? value : `${prefix}${displayValue.toLocaleString()}${suffix}`}
                    </span>
                    {(trend || trendPercent) && (
                        <div className={cn(
                            "flex items-center px-2 py-0.5 rounded-full text-xs font-bold",
                            !isPositiveTrend
                                ? "bg-red-500/20 text-red-300"
                                : "bg-emerald-500/20 text-emerald-300"
                        )}>
                            {!isPositiveTrend ? <ArrowDownRight size={12} className="mr-1" /> : <ArrowUpRight size={12} className="mr-1" />}
                            {trendPercent}
                        </div>
                    )}
                </div>
            </div>

            {typeof trend === 'object' && trend?.label && (
                <span className="text-xs text-label-glass-tertiary mt-2 relative z-10">{trend.label}</span>
            )}
        </GlassContainer>
    );
};

GlassMetric.displayName = 'GlassMetric';
