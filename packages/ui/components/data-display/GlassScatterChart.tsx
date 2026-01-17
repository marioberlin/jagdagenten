import { motion } from 'framer-motion';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';

interface ScatterPoint {
    x: number;
    y: number;
    z?: number; // Size/intensity
    label?: string;
}

interface GlassScatterChartProps {
    data: ScatterPoint[];
    width?: number;
    height?: number;
    color?: string;
    className?: string;
}

export const GlassScatterChart = ({
    data,
    width = 500,
    height = 300,
    color = '#60a5fa',
    className
}: GlassScatterChartProps) => {

    const minX = Math.min(...data.map(d => d.x));
    const maxX = Math.max(...data.map(d => d.x));
    const minY = Math.min(...data.map(d => d.y));
    const maxY = Math.max(...data.map(d => d.y));
    const maxZ = Math.max(...data.map(d => d.z || 1));

    const xRange = maxX - minX || 1;
    const yRange = maxY - minY || 1;

    // Padding
    const p = 20;
    const w = width - p * 2;
    const h = height - p * 2;

    const getX = (val: number) => ((val - minX) / xRange) * w + p;
    const getY = (val: number) => h - ((val - minY) / yRange) * h + p;

    return (
        <GlassContainer className={cn("p-4", className)} style={{ width, height }}>
            <svg width="100%" height="100%" className="overflow-visible">
                {/* ... (defs and axes code remains same) */}
                <defs>
                    <radialGradient id="bubbleGradient" cx="30%" cy="30%" r="70%">
                        <stop offset="0%" stopColor="white" stopOpacity="0.8" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.4" />
                    </radialGradient>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Axes */}
                <line x1={p} y1={h + p} x2={w + p} y2={h + p} stroke="var(--glass-border)" strokeWidth="1" />
                <line x1={p} y1={p} x2={p} y2={h + p} stroke="var(--glass-border)" strokeWidth="1" />

                {data.map((d, i) => {
                    const cx = getX(d.x);
                    const cy = getY(d.y);
                    const r = d.z ? (d.z / maxZ) * 20 + 5 : 6;

                    return (
                        <g key={i} className="group">
                            <motion.circle
                                cx={cx}
                                cy={cy}
                                r={r}
                                fill="url(#bubbleGradient)"
                                stroke={color}
                                strokeWidth="1"
                                className="transition-colors duration-300 hover:scale-125 cursor-pointer opacity-70 group-hover:opacity-100"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 0.7 }}
                                whileHover={{ scale: 1.2, opacity: 1 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 260,
                                    damping: 20,
                                    delay: i * 0.05
                                }}
                            >
                                <title>{`${d.label || ''}: (${d.x}, ${d.y})`}</title>
                            </motion.circle>
                            {/* Label on hover */}
                            <text
                                x={cx}
                                y={cy - r - 5}
                                textAnchor="middle"
                                className="fill-primary text-[10px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                            >
                                {d.label || `(${d.x},${d.y})`}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </GlassContainer>
    );
};
