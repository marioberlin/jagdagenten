import { motion } from 'framer-motion';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';

interface GlassHeatmapProps {
    data: { x: string; y: string; value: number }[];
    xLabels: string[];
    yLabels: string[];
    colorScale?: (value: number) => string; // Function to get color
    baseColor?: string; // Hex color to interpolate opacity
    className?: string;
}

export const GlassHeatmap = ({
    data,
    xLabels,
    yLabels,
    baseColor = '#60a5fa', // blue-400
    className
}: GlassHeatmapProps) => {

    const maxValue = Math.max(...data.map(d => d.value));

    const getValue = (x: string, y: string) => {
        return data.find(d => d.x === x && d.y === y)?.value || 0;
    };

    return (
        <GlassContainer className={cn("p-6 overflow-x-auto", className)}>
            <div className="min-w-[300px] flex flex-col">
                <div className="flex">
                    {/* ... (y-axis labels code remains same) */}
                    <div className="flex flex-col justify-end pr-2 gap-1 pb-6 w-20">
                        {yLabels.map(y => (
                            <div key={y} className="h-8 flex items-center justify-end text-[11px] text-secondary font-medium">
                                {y}
                            </div>
                        ))}
                    </div>

                    {/* Grid */}
                    <div className="flex-1 grid gap-1" style={{ gridTemplateColumns: `repeat(${xLabels.length}, 1fr)` }}>
                        {/* Rows */}
                        {yLabels.map((y, yIndex) => (
                            // Columns in each row
                            xLabels.map((x, xIndex) => {
                                const value = getValue(x, y);
                                const opacity = Math.max(0.1, value / maxValue);
                                const delay = (yIndex * xLabels.length + xIndex) * 0.02; // Reduced delay for smoother wave

                                return (
                                    <motion.div
                                        key={`${x}-${y}`}
                                        className="h-8 rounded-sm transition-colors duration-300 hover:brightness-110 cursor-pointer relative group"
                                        style={{ backgroundColor: baseColor }}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{
                                            duration: 0.3,
                                            delay: delay
                                        }}
                                        whileHover={{ scale: 1.05, zIndex: 10 }}
                                    >
                                        <div
                                            className="w-full h-full rounded-sm"
                                            style={{ backgroundColor: baseColor, opacity }}
                                        />
                                        <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-1/2 -translate-x-1/2 bg-black/80 px-2 py-1 rounded text-[10px] text-white pointer-events-none mb-1 whitespace-nowrap z-10">
                                            {x}, {y}: {value}
                                        </div>
                                    </motion.div>
                                );
                            })
                        ))}

                        {/* ... (x-axis labels code remains same) */}
                        {xLabels.map(x => (
                            <div key={x} className="flex justify-center pt-2">
                                <span className="text-[11px] text-secondary -rotate-45 origin-top-left translate-y-2 whitespace-nowrap">
                                    {x}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </GlassContainer>
    );
};
