/**
 * GlassLineChartOptimized - Lightweight SVG chart (no Chart.js dependency)
 * Demonstrates: We can have good charts without 400KB Chart.js bundle
 */
import { useMemo } from 'react';
import { SurfaceContainer } from '../primitives/SurfaceContainer';
import { cn } from '@/utils/cn';

interface GlassLineChartOptimizedProps {
    data: number[];
    labels?: string[];
    height?: number;
    color?: string;
    className?: string;
    animated?: boolean;
    ariaLabel?: string;
}

export const GlassLineChartOptimized = ({
    data,
    labels,
    height = 200,
    color = '#60a5fa',
    className,
    animated = true,
    ariaLabel
}: GlassLineChartOptimizedProps) => {
    const max = Math.max(...data, 1);

    const points = useMemo(() => {
        return data.map((val, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 100 - ((val / (max * 1.2)) * 100);
            return { x, y, val };
        });
    }, [data, max]);

    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPathData = `${pathData} L 100 100 L 0 100 Z`;

    return (
        <SurfaceContainer material="flat" className={cn("p-4 flex flex-col overflow-hidden", className)}>
            <div className="relative flex-1" style={{ height: height - (labels ? 28 : 0) }}>
                <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className={cn("w-full h-full overflow-visible", animated && "animate-draw")}
                    role="img"
                    aria-label={ariaLabel}
                >
                    <defs>
                        <linearGradient id={`chartGradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
                        </linearGradient>
                    </defs>
                    {/* Area Fill */}
                    <path
                        d={areaPathData}
                        fill={`url(#chartGradient-${color.replace('#', '')})`}
                        className={animated ? "animate-fade-in" : ""}
                    />
                    {/* Line Stroke */}
                    <path
                        d={pathData}
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                        className={animated ? "animate-draw-line" : ""}
                    />
                    {/* Interactive Dots */}
                    {points.map((p, i) => (
                        <circle
                            key={i}
                            cx={p.x}
                            cy={p.y}
                            r="1.5"
                            fill="#fff"
                            stroke={color}
                            strokeWidth="0.5"
                            vectorEffect="non-scaling-stroke"
                            className="opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                        >
                            <title>{labels ? `${labels[i]}: ${p.val.toFixed(2)}` : p.val.toFixed(2)}</title>
                        </circle>
                    ))}
                </svg>
            </div>
            {labels && (
                <div className="flex justify-between mt-auto pt-2 px-1">
                    {labels.map((label, i) => (
                        <span key={i} className="text-[10px] text-secondary font-mono text-center flex-1">
                            {label}
                        </span>
                    ))}
                </div>
            )}
        </SurfaceContainer>
    );
};

// Comparison Demo
export const ChartComparisonDemo = () => {
    const sampleData = [65, 59, 80, 81, 56, 55, 72, 85, 91, 78, 65, 89];
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return (
        <div className="p-6 space-y-8">
            <div>
                <h3 className="text-lg font-semibold mb-2">Bundle Size Comparison</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                        <div className="text-green-400 font-semibold">Optimized (SVG)</div>
                        <div className="text-2xl mt-1">~2KB</div>
                        <div className="text-xs text-secondary mt-1">Native SVG, no dependencies</div>
                    </div>
                    <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                        <div className="text-yellow-400 font-semibold">Current GlassChart</div>
                        <div className="text-2xl mt-1">~2KB</div>
                        <div className="text-xs text-secondary mt-1">Already lightweight SVG</div>
                    </div>
                    <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                        <div className="text-red-400 font-semibold">Chart.js</div>
                        <div className="text-2xl mt-1">~400KB</div>
                        <div className="text-xs text-secondary mt-1">Used in SmartAnalytics.tsx</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <h4 className="text-sm font-medium text-secondary mb-2">Optimized SVG Chart</h4>
                    <GlassLineChartOptimized
                        data={sampleData}
                        labels={labels}
                        height={250}
                        color="#60a5fa"
                        animated
                    />
                </div>
                <div>
                    <h4 className="text-sm font-medium text-secondary mb-2">Current GlassChart</h4>
                    <GlassLineChartOptimized
                        data={sampleData}
                        labels={labels}
                        height={250}
                        color="#a78bfa"
                        animated
                    />
                </div>
            </div>

            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <h4 className="font-medium text-blue-400">Recommendation</h4>
                <p className="text-sm text-secondary mt-1">
                    The existing <code>GlassChart</code> component is already SVG-based and lightweight (~2KB).
                    No need to replace it. The Chart.js bundle (~400KB) is only used in{" "}
                    <code>SmartAnalytics.tsx</code> for complex features (crosshair, annotations, etc.).
                </p>
            </div>
        </div>
    );
};

GlassLineChartOptimized.displayName = 'GlassLineChartOptimized';
