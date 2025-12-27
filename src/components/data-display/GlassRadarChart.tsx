import { motion } from 'framer-motion';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';

interface GlassRadarChartProps {
    data: Record<string, any>[];
    keys: string[];
    indexBy: string;
    colors?: string[];
    width?: number;
    height?: number;
    className?: string;
}

export const GlassRadarChart = ({
    data,
    keys,
    indexBy,
    colors = ['#60a5fa', '#34d399', '#f472b6', '#fbbf24', '#a78bfa'],
    width = 300,
    height = 300,
    className
}: GlassRadarChartProps) => {

    const radius = Math.min(width, height) / 2 - 40;
    const centerX = width / 2;
    const centerY = height / 2;
    const angleSlice = (Math.PI * 2) / keys.length;

    // Helper to calculate coordinates
    const getCoordinates = (index: number, value: number, maxVal: number) => {
        const angle = index * angleSlice - Math.PI / 2; // Start from top
        const r = (value / maxVal) * radius;
        return {
            x: centerX + r * Math.cos(angle),
            y: centerY + r * Math.sin(angle)
        };
    };

    // Calculate max value for scaling
    // Simplify: just find max of all values across all data points
    const maxValue = Math.max(...data.map(d => Math.max(...keys.map(k => d[k] as number))));

    // Prepare polygon points for each data item
    const dataPolygons = data.map((d, i) => {
        const points = keys.map((key, kIndex) => {
            const val = d[key] as number;
            const { x, y } = getCoordinates(kIndex, val, maxValue);
            return `${x},${y}`;
        }).join(' ');

        return {
            points,
            color: colors[i % colors.length],
            key: d[indexBy] as string || String(i),
            data: d
        };
    });

    return (
        <GlassContainer className={cn("flex flex-col items-center justify-center p-4", className)}>
            <svg width={width} height={height} className="overflow-visible">
                {/* Grid Levels */}
                {[0.25, 0.5, 0.75, 1].map((tick, i) => (
                    <g key={i}>
                        <circle
                            cx={centerX}
                            cy={centerY}
                            r={radius * tick}
                            fill="none"
                            stroke="var(--glass-border)"
                            strokeWidth="1"
                            className="opacity-20"
                        />
                        <text
                            x={centerX}
                            y={centerY - (radius * tick) - 5}
                            textAnchor="middle"
                            className="fill-secondary text-[10px]"
                        >
                            {Math.round(maxValue * tick)}
                        </text>
                    </g>
                ))}

                {/* Axes */}
                {keys.map((key, i) => {
                    const angle = i * angleSlice - Math.PI / 2;
                    const x = centerX + radius * Math.cos(angle);
                    const y = centerY + radius * Math.sin(angle);
                    return (
                        <g key={key}>
                            <line
                                x1={centerX}
                                y1={centerY}
                                x2={x}
                                y2={y}
                                stroke="var(--glass-border)"
                                strokeWidth="1"
                                className="opacity-20"
                            />
                            {/* Axis Label */}
                            <text
                                x={x + (Math.cos(angle) * 20)}
                                y={y + (Math.sin(angle) * 20)}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="fill-secondary text-xs capitalize"
                            >
                                {key}
                            </text>
                        </g>
                    );
                })}

                {/* Data Shapes */}
                {dataPolygons.map((poly, i) => (
                    <g key={poly.key} className="group">
                        <defs>
                            <radialGradient id={`grad-${poly.key}-${i}`} cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor={poly.color} stopOpacity="0.4" />
                                <stop offset="100%" stopColor={poly.color} stopOpacity="0.1" />
                            </radialGradient>
                        </defs>
                        <motion.polygon
                            points={poly.points}
                            fill={`url(#grad-${poly.key}-${i})`}
                            stroke={poly.color}
                            strokeWidth="2"
                            className="transition-colors duration-300 opacity-60 group-hover:opacity-100 cursor-pointer"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 0.6 }}
                            whileHover={{ scale: 1.02, opacity: 1 }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            style={{ transformOrigin: 'center' }}
                        />
                        {/* Data Points */}
                        {keys.map((key, j) => {
                            const value = poly.data[key] as number;
                            const { x, y } = getCoordinates(j, value, maxValue);
                            return (
                                <motion.circle
                                    key={`point-${i}-${j}`}
                                    cx={x}
                                    cy={y}
                                    r="3"
                                    fill={poly.color}
                                    className="opacity-0 group-hover:opacity-100"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.3, delay: (i * 0.1) + (j * 0.05) }}
                                >
                                    <title>{`${poly.key} - ${key}: ${value}`}</title>
                                </motion.circle>
                            );
                        })}
                    </g>
                ))}
            </svg>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-4 mt-6">
                {dataPolygons.map((poly, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div
                            className="w-3 h-3 rounded-full shadow-sm"
                            style={{ backgroundColor: poly.color }}
                        />
                        <span className="text-xs text-secondary">{poly.key}</span>
                    </div>
                ))}
            </div>
        </GlassContainer>
    );
};
