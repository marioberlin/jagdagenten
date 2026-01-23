import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassContainer } from '@/components';
import type { ChartDataPoint, TimeRange } from '@/hooks/trading/useDashboardData';

interface PortfolioChartProps {
    data: ChartDataPoint[];
    timeRange: TimeRange;
    onTimeRangeChange: (range: TimeRange) => void;
    isLoading?: boolean;
}

const TIME_RANGES: TimeRange[] = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

/**
 * TimeRangeSelector - Pill-style time range buttons
 */
const TimeRangeSelector: React.FC<{
    selected: TimeRange;
    onChange: (range: TimeRange) => void;
}> = ({ selected, onChange }) => (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5">
        {TIME_RANGES.map((range) => (
            <button
                key={range}
                onClick={() => onChange(range)}
                className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    selected === range
                        ? 'bg-white/15 text-white shadow-sm'
                        : 'text-secondary hover:text-primary hover:bg-white/5'
                )}
            >
                {range}
            </button>
        ))}
    </div>
);

/**
 * SVG Chart with crosshair tooltip
 */
const Chart: React.FC<{
    data: ChartDataPoint[];
    color: string;
    height: number;
}> = ({ data, color, height }) => {
    const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
    const [mousePos, setMousePos] = React.useState<{ x: number; y: number } | null>(null);

    const { points, pathData, areaPathData, minValue, maxValue } = useMemo(() => {
        if (data.length === 0) {
            return {
                points: [],
                pathData: '',
                areaPathData: '',
                minValue: 0,
                maxValue: 0,
            };
        }

        const values = data.map((d) => d.value);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min || 1;
        const padding = range * 0.1;

        const pts = data.map((d, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 100 - (((d.value - min + padding) / (range + padding * 2)) * 100);
            return { x, y, ...d };
        });

        const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        const areaPath = `${path} L 100 100 L 0 100 Z`;

        return {
            points: pts,
            pathData: path,
            areaPathData: areaPath,
            minValue: min,
            maxValue: max,
            valueRange: range,
        };
    }, [data]);

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const closestIndex = Math.round((x / 100) * (data.length - 1));
        const clampedIndex = Math.max(0, Math.min(data.length - 1, closestIndex));
        setHoveredIndex(clampedIndex);
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const hoveredPoint = hoveredIndex !== null ? points[hoveredIndex] : null;

    const formatValue = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const formatDate = (ts: number) => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    return (
        <div className="relative" style={{ height }}>
            <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="w-full h-full overflow-visible"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => {
                    setHoveredIndex(null);
                    setMousePos(null);
                }}
            >
                <defs>
                    <linearGradient id="portfolioChartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Grid lines */}
                {[25, 50, 75].map((y) => (
                    <line
                        key={y}
                        x1="0"
                        y1={y}
                        x2="100"
                        y2={y}
                        stroke="currentColor"
                        strokeOpacity="0.1"
                        strokeWidth="0.5"
                        vectorEffect="non-scaling-stroke"
                    />
                ))}

                {/* Area fill */}
                <motion.path
                    d={areaPathData}
                    fill="url(#portfolioChartGradient)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                />

                {/* Line */}
                <motion.path
                    d={pathData}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                />

                {/* Crosshair */}
                {hoveredPoint && (
                    <>
                        {/* Vertical line */}
                        <line
                            x1={hoveredPoint.x}
                            y1="0"
                            x2={hoveredPoint.x}
                            y2="100"
                            stroke="white"
                            strokeOpacity="0.3"
                            strokeWidth="1"
                            strokeDasharray="2,2"
                            vectorEffect="non-scaling-stroke"
                        />
                        {/* Horizontal line */}
                        <line
                            x1="0"
                            y1={hoveredPoint.y}
                            x2="100"
                            y2={hoveredPoint.y}
                            stroke="white"
                            strokeOpacity="0.3"
                            strokeWidth="1"
                            strokeDasharray="2,2"
                            vectorEffect="non-scaling-stroke"
                        />
                        {/* Point */}
                        <circle
                            cx={hoveredPoint.x}
                            cy={hoveredPoint.y}
                            r="4"
                            fill={color}
                            stroke="white"
                            strokeWidth="2"
                            vectorEffect="non-scaling-stroke"
                        />
                    </>
                )}
            </svg>

            {/* Y-axis labels */}
            <div className="absolute top-0 bottom-0 left-0 flex flex-col justify-between text-[10px] text-secondary font-mono -ml-2 translate-x-[-100%] pointer-events-none">
                <span>{formatValue(maxValue)}</span>
                <span>{formatValue((maxValue + minValue) / 2)}</span>
                <span>{formatValue(minValue)}</span>
            </div>

            {/* Tooltip */}
            {hoveredPoint && mousePos && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute pointer-events-none z-10"
                    style={{
                        left: Math.min(mousePos.x + 10, 300),
                        top: mousePos.y - 60,
                    }}
                >
                    <div className="px-3 py-2 rounded-lg bg-gray-900/95 border border-white/10 backdrop-blur-sm shadow-xl">
                        <p className="text-xs text-secondary mb-1">
                            {formatDate(hoveredPoint.timestamp)}
                        </p>
                        <p className="text-sm font-semibold text-white">
                            {formatValue(hoveredPoint.value)}
                        </p>
                        {hoveredPoint.pnl !== undefined && (
                            <p className={cn(
                                'text-xs font-medium',
                                hoveredPoint.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                            )}>
                                {hoveredPoint.pnl >= 0 ? '+' : ''}{formatValue(hoveredPoint.pnl)} P&L
                            </p>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    );
};

/**
 * PortfolioChart - Main chart component with time range selector
 */
export const PortfolioChart: React.FC<PortfolioChartProps> = ({
    data,
    timeRange,
    onTimeRangeChange,
    isLoading = false,
}) => {
    // Calculate chart metrics
    const { change, changePercent, trend } = useMemo(() => {
        if (data.length < 2) {
            return { change: 0, changePercent: 0, trend: 'neutral' as const };
        }
        const start = data[0].value;
        const end = data[data.length - 1].value;
        const diff = end - start;
        const pct = (diff / start) * 100;
        return {
            change: diff,
            changePercent: pct,
            trend: diff > 0 ? 'up' as const : diff < 0 ? 'down' as const : 'neutral' as const,
        };
    }, [data]);

    const chartColor = trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#6B7280';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
        >
            <GlassContainer className="p-6" border>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            'p-2 rounded-xl',
                            trend === 'up' && 'bg-emerald-500/20',
                            trend === 'down' && 'bg-red-500/20',
                            trend === 'neutral' && 'bg-gray-500/20'
                        )}>
                            <LineChart className={cn(
                                'w-5 h-5',
                                trend === 'up' && 'text-emerald-400',
                                trend === 'down' && 'text-red-400',
                                trend === 'neutral' && 'text-gray-400'
                            )} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-primary">Portfolio Performance</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={cn(
                                    'flex items-center gap-1 text-sm font-medium',
                                    trend === 'up' && 'text-emerald-400',
                                    trend === 'down' && 'text-red-400',
                                    trend === 'neutral' && 'text-gray-400'
                                )}>
                                    {trend === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
                                    {trend === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
                                    {trend === 'neutral' && <Minus className="w-3.5 h-3.5" />}
                                    {change >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
                                </span>
                                <span className="text-xs text-secondary">
                                    ({change >= 0 ? '+' : ''}${Math.abs(change).toLocaleString(undefined, { maximumFractionDigits: 2 })})
                                </span>
                            </div>
                        </div>
                    </div>

                    <TimeRangeSelector
                        selected={timeRange}
                        onChange={onTimeRangeChange}
                    />
                </div>

                {/* Chart */}
                {isLoading ? (
                    <div className="h-64 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                    </div>
                ) : data.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-secondary">
                        <div className="text-center">
                            <LineChart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No data available for this time range</p>
                        </div>
                    </div>
                ) : (
                    <div className="pl-16">
                        <Chart data={data} color={chartColor} height={256} />
                    </div>
                )}

                {/* X-axis time labels */}
                {data.length > 0 && !isLoading && (
                    <div className="flex justify-between mt-2 pl-16 text-[10px] text-secondary font-mono">
                        <span>{new Date(data[0].timestamp).toLocaleDateString()}</span>
                        <span>{new Date(data[Math.floor(data.length / 2)].timestamp).toLocaleDateString()}</span>
                        <span>{new Date(data[data.length - 1].timestamp).toLocaleDateString()}</span>
                    </div>
                )}
            </GlassContainer>
        </motion.div>
    );
};

export default PortfolioChart;
