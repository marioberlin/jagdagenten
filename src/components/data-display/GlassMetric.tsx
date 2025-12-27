import { useEffect, useState } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface GlassMetricProps {
    title: string;
    value: number;
    prefix?: string;
    suffix?: string;
    trend?: {
        value: number;
        label?: string;
        isPositive?: boolean;
    };
    data?: number[]; // For sparkline
    className?: string;
}

export const GlassMetric = ({
    title,
    value,
    prefix = '',
    suffix = '',
    trend,
    data = [40, 30, 45, 50, 49, 60, 70, 91],
    className
}: GlassMetricProps) => {
    // Animated Value
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let start = 0;
        const end = value;
        const duration = 1500;
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
    }, [value]);

    // Sparkline Path Generator
    const generateSparkline = (points: number[]) => {
        if (points.length < 2) return '';
        const max = Math.max(...points);
        const min = Math.min(...points);
        const height = 40;
        const width = 120;
        const step = width / (points.length - 1);

        const path = points.map((p, i) => {
            const x = i * step;
            // Normalize y
            const y = height - ((p - min) / (max - min)) * height;
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
                        className={trend?.isPositive === false ? "text-red-400" : "text-emerald-400"}
                    />
                </svg>
            </div>

            <div className="relative z-10">
                <span className="text-label-glass-secondary text-sm font-medium uppercase tracking-wider">{title}</span>
                <div className="flex items-center gap-3 mt-2">
                    <span className="text-3xl font-bold tracking-tight text-label-glass-primary">
                        {prefix}{displayValue.toLocaleString()}{suffix}
                    </span>
                    {trend && (
                        <div className={cn(
                            "flex items-center px-2 py-0.5 rounded-full text-xs font-bold",
                            trend.isPositive === false
                                ? "bg-red-500/20 text-red-300"
                                : "bg-emerald-500/20 text-emerald-300"
                        )}>
                            {trend.isPositive === false ? <ArrowDownRight size={12} className="mr-1" /> : <ArrowUpRight size={12} className="mr-1" />}
                            {trend.value}%
                        </div>
                    )}
                </div>
            </div>

            {trend?.label && (
                <span className="text-xs text-label-glass-tertiary mt-2 relative z-10">{trend.label}</span>
            )}
        </GlassContainer>
    );
};

GlassMetric.displayName = 'GlassMetric';
