
import { SurfaceContainer } from '../primitives/SurfaceContainer';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';
import { useChartColors, TYPOGRAPHY } from '@/styles/design-tokens';

interface GlassChartProps {
    data: number[];
    labels?: string[];
    type?: 'line' | 'bar';
    height?: number;
    /** Hex color for the chart line/bars. Defaults to Apple System Blue. */
    color?: string;
    className?: string;
    /** Accessible label for screen readers */
    ariaLabel?: string;
    /** Detailed description for screen readers */
    ariaDescription?: string;
}

export const GlassChart = ({
    data,
    labels,
    type = 'line',
    height = 200,
    color,
    className,
    ariaLabel,
    ariaDescription
}: GlassChartProps) => {
    const { primary } = useChartColors();
    const chartColor = color ?? primary;
    const max = Math.max(...data);


    // Normalize data to 0-100 range for SVG
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((val / (max * 1.2)) * 100); // 20% headroom
        return { x, y, val };
    });

    const renderLine = () => {
        const pathData = points.map((p, i) =>
            `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
        ).join(' ');

        // Area path (closed at bottom)
        const areaPathData = `${pathData} L 100 100 L 0 100 Z`;

        return (
            <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="w-full h-full overflow-visible"
                role="img"
                aria-label={ariaLabel}
                aria-describedby={ariaDescription ? 'chart-desc' : undefined}
            >
                {ariaDescription && <desc id="chart-desc">{ariaDescription}</desc>}
                <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={chartColor} stopOpacity="0.5" />
                        <stop offset="100%" stopColor={chartColor} stopOpacity="0.0" />
                    </linearGradient>
                </defs>
                {/* Area Fill */}
                <path d={areaPathData} fill="url(#chartGradient)" />
                {/* Line Stroke */}
                <path
                    d={pathData}
                    fill="none"
                    stroke={chartColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                />
                {/* Dots */}
                {points.map((p, i) => (
                    <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r="1.5"
                        fill="#fff"
                        stroke={chartColor}
                        strokeWidth="0.5"
                        vectorEffect="non-scaling-stroke"
                        className="opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                    >
                        <title>{labels ? `${labels[i]}: ${p.val}` : p.val}</title>
                    </circle>
                ))}
            </svg>
        );
    };

    const renderBar = () => {
        return (
            <div className="w-full h-full flex items-end justify-between gap-2 px-2">
                {data.map((val, i) => {
                    const heightPercent = (val / max) * 100;
                    return (
                        <div key={i} className="relative flex-1 group h-full flex items-end">
                            <div
                                style={{ height: `${heightPercent}%`, backgroundColor: chartColor }}
                                className="w-full rounded-t-sm opacity-50 group-hover:opacity-80 transition-all duration-300"
                            >
                                <GlassContainer
                                    material="thick"
                                    className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg whitespace-nowrap"
                                    style={{ fontSize: TYPOGRAPHY.chart.label }}
                                >
                                    <span className="text-primary font-mono">
                                        {labels ? `${labels[i]}: ${val}` : val}
                                    </span>
                                </GlassContainer>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const labelHeight = labels ? 28 : 0;

    return (
        <SurfaceContainer material="flat" className={cn("p-4 flex flex-col", className)} style={{ height: height + labelHeight }}>
            <div style={{ height: height - 32 }} className="relative">
                {type === 'line' ? renderLine() : renderBar()}
            </div>

            {labels && (
                <div className="flex justify-between mt-auto pt-2 px-1">
                    {labels.map((label, i) => (
                        <span
                            key={i}
                            className="text-secondary text-center flex-1"
                            style={{
                                fontSize: TYPOGRAPHY.chart.label,
                                fontFamily: TYPOGRAPHY.fontFamily.mono,
                            }}
                        >
                            {label}
                        </span>
                    ))}
                </div>
            )}
        </SurfaceContainer>
    );
};

GlassChart.displayName = 'GlassChart';
