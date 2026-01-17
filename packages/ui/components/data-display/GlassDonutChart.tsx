
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';
import { useChartColors, TYPOGRAPHY } from '@/styles/design-tokens';

interface GlassDonutChartProps {
    data: number[];
    labels?: string[];
    /** Custom color palette. Defaults to Apple System Colors (Blue -> Green -> Orange -> Pink -> ...). */
    colors?: string[];
    height?: number;
    className?: string;
}

export const GlassDonutChart = ({
    data,
    labels,
    colors,
    height = 200,
    className
}: GlassDonutChartProps) => {
    const { palette } = useChartColors();
    const chartColors = colors ?? [...palette];
    const total = data.reduce((acc, curr) => acc + curr, 0);

    // Calculate segments
    let accumulatedAngle = 0;
    const segments = data.map((value, i) => {
        const angle = (value / total) * 360;
        const startAngle = accumulatedAngle;
        accumulatedAngle += angle;

        // Convert polar to cartesian
        const radius = 40; // svg viewBox 100x100, radius 40 leaves padding
        const center = 50;

        const x1 = center + radius * Math.cos(Math.PI * startAngle / 180);
        const y1 = center + radius * Math.sin(Math.PI * startAngle / 180);
        const x2 = center + radius * Math.cos(Math.PI * (startAngle + angle) / 180);
        const y2 = center + radius * Math.sin(Math.PI * (startAngle + angle) / 180);

        // Large arc flag
        const largeArc = angle > 180 ? 1 : 0;

        // Path command
        const d = [
            `M ${center} ${center}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
            'Z'
        ].join(' ');

        return { d, color: chartColors[i % chartColors.length], value, label: labels?.[i] };
    });

    return (
        <GlassContainer material="thick" enableLiquid={false} className={cn("p-4 flex flex-col items-center justify-center", className)} style={{ height }}>
            <div className="relative w-full h-full max-w-[200px] max-h-[200px] mx-auto aspect-square">
                <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible -rotate-90">
                    {segments.map((segment, i) => (
                        <path
                            key={i}
                            d={segment.d}
                            fill={segment.color}
                            className="opacity-80 hover:opacity-100 transition-opacity cursor-pointer stroke-[2px] stroke-black/10"
                            strokeLinejoin="round"
                        >
                            <title>{segment.label ? `${segment.label}: ${segment.value}` : segment.value}</title>
                        </path>
                    ))}
                    {/* Inner circle to make it a donut */}
                    {/* Inner circle with glass effect */}
                    <circle cx="50" cy="50" r="25" fill="url(#innerGradient)" />
                    <defs>
                        <radialGradient id="innerGradient" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="var(--glass-surface)" />
                            <stop offset="100%" stopColor="var(--glass-bg-regular)" />
                        </radialGradient>
                    </defs>
                </svg>
            </div>

            {labels && (
                <div className="flex flex-wrap justify-center gap-3 mt-4 w-full">
                    {labels.map((label, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: chartColors[i % chartColors.length] }} />
                            <span
                                className="text-secondary font-medium tracking-wide"
                                style={{ fontSize: TYPOGRAPHY.chart.label }}
                            >
                                {label}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </GlassContainer>
    );
};

GlassDonutChart.displayName = 'GlassDonutChart';
