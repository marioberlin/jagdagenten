
import { SurfaceContainer } from '../primitives/SurfaceContainer';
import { cn } from '@/utils/cn';

interface GlassChartProps {
    data: number[];
    labels?: string[];
    type?: 'line' | 'bar';
    height?: number;
    color?: string; // hex or tailwind class specific logic
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
    color = '#60a5fa', // blue-400
    className,
    ariaLabel,
    ariaDescription
}: GlassChartProps) => {
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
                        <stop offset="0%" stopColor={color} stopOpacity="0.5" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.0" />
                    </linearGradient>
                </defs>
                {/* Area Fill */}
                <path d={areaPathData} fill="url(#chartGradient)" />
                {/* Line Stroke */}
                <path
                    d={pathData}
                    fill="none"
                    stroke={color}
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
                        stroke={color}
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
                                style={{ height: `${heightPercent}%`, backgroundColor: color }}
                                className="w-full rounded-t-sm opacity-50 group-hover:opacity-80 transition-all duration-300"
                            >
                                <div className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-primary text-[10px] px-2 py-1 rounded whitespace-nowrap">
                                    {labels ? `${labels[i]}: ${val}` : val}
                                </div>
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
                        <span key={i} className="text-[11px] text-secondary font-mono text-center flex-1">
                            {label}
                        </span>
                    ))}
                </div>
            )}
        </SurfaceContainer>
    );
};

GlassChart.displayName = 'GlassChart';
