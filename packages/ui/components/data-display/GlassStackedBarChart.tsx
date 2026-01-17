import { motion } from 'framer-motion';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';

interface GlassStackedBarChartProps {
    data: Record<string, any>[];
    keys: string[];
    indexBy: string;
    colors?: string[];
    width?: number;
    height?: number;
    maxValue?: number;
    className?: string;
    vertical?: boolean;
}

export const GlassStackedBarChart = ({
    data,
    keys,
    indexBy,
    colors = ['#60a5fa', '#34d399', '#f472b6', '#fbbf24'],
    height = 300,
    maxValue,
    className
}: GlassStackedBarChartProps) => {
    // Calculate max value if not provided
    const calculatedMax = maxValue || Math.max(...data.map(d => {
        return keys.reduce((acc, key) => acc + (d[key] || 0), 0);
    })) * 1.1;

    return (
        <GlassContainer className={cn("p-4 flex flex-col", className)} style={{ height }}>
            <div className="flex-1 relative w-full h-full flex items-end gap-2">
                {/* ... (grid lines code remains same) */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    {[0.25, 0.5, 0.75, 1].map((tick, i) => (
                        <div key={i} className="w-full border-t border-[var(--glass-border)] opacity-20 relative h-0">
                            <span className="absolute -top-3 -left-8 text-[10px] text-secondary w-6 text-right">
                                {Math.round(calculatedMax * (1 - tick))}
                            </span>
                        </div>
                    ))}
                    <div className="w-full border-t border-[var(--glass-border)] opacity-20 relative h-0">
                        <span className="absolute -top-3 -left-8 text-[10px] text-secondary w-6 text-right">0</span>
                    </div>
                </div>

                {/* Bars */}
                {data.map((d, i) => {
                    let accumulatedHeight = 0;
                    return (
                        <div key={i} className="relative flex-1 h-full flex flex-col justify-end group">
                            <div className="w-full relative transition-all duration-300 hover:scale-x-105" style={{ height: '100%' }}>
                                {keys.map((key, kIndex) => {
                                    const value = d[key] as number;
                                    const barHeight = (value / calculatedMax) * 100;
                                    const element = (
                                        <motion.div
                                            key={key}
                                            className="w-full absolute bottom-0 left-0 transition-opacity duration-300 opacity-70 hover:opacity-100 cursor-pointer"
                                            style={{
                                                height: `${barHeight}%`,
                                                bottom: `${(accumulatedHeight / calculatedMax) * 100}%`,
                                                backgroundColor: colors[kIndex % colors.length],
                                                borderRadius: kIndex === keys.length - 1 ? '4px 4px 0 0' : '0'
                                            }}
                                            initial={{ height: 0 }}
                                            animate={{ height: `${barHeight}%` }}
                                            transition={{
                                                duration: 0.8,
                                                delay: i * 0.1,
                                                ease: [0.16, 1, 0.3, 1] // Apple-style ease
                                            }}
                                        >
                                            <title>{`${d[indexBy]} - ${key}: ${value}`}</title>
                                        </motion.div>
                                    );
                                    accumulatedHeight += value;
                                    return element;
                                })}
                            </div>

                            {/* X-Axis Label */}
                            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-secondary truncate max-w-full text-center">
                                {d[indexBy]}
                            </div>
                        </div>
                    );
                })}
            </div>
            {/* ... (legend code remains same) */}
        </GlassContainer>
    );
};
