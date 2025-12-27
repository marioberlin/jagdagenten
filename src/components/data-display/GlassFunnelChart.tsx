import { motion } from 'framer-motion';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';

interface GlassFunnelChartProps {
    data: { label: string; value: number }[];
    colors?: string[];
    width?: number;
    height?: number;
    className?: string;
}

export const GlassFunnelChart = ({
    data,
    colors = ['#60a5fa', '#34d399', '#f472b6', '#a78bfa', '#fbbf24'],
    height = 300,
    className
}: GlassFunnelChartProps) => {

    const maxValue = Math.max(...data.map(d => d.value));
    const nextValues = [...data.map(d => d.value), 0].slice(1); // Shifted

    return (
        <GlassContainer className={cn("p-6 flex flex-col items-center", className)} style={{ height }}>
            <div className="flex flex-col w-full max-w-[300px] gap-1 h-full justify-center">
                {data.map((item, i) => {
                    const widthPercent = (item.value / maxValue) * 100;
                    // ... (clipPath logic remains same, just copy essential parts to keep context clear)
                    const nextWidthPercent = (nextValues[i] / maxValue) * 100 || (widthPercent * 0.8);

                    const leftInset = (100 - widthPercent) / 2;
                    const rightInset = 100 - leftInset;
                    const nextLeftInset = (100 - nextWidthPercent) / 2;
                    const nextRightInset = 100 - nextLeftInset;

                    const clipPath = `polygon(
                        ${leftInset}% 0%, 
                        ${rightInset}% 0%, 
                        ${nextRightInset}% 100%, 
                        ${nextLeftInset}% 100%
                    )`;

                    return (
                        <div key={i} className="flex-1 min-h-[40px] relative group">
                            {/* Shape */}
                            <motion.div
                                className="absolute inset-0 transition-all duration-300 group-hover:brightness-110 cursor-pointer"
                                style={{
                                    clipPath,
                                    backgroundColor: colors[i % colors.length],
                                    opacity: 0.6
                                }}
                                initial={{ opacity: 0, scaleY: 0 }}
                                animate={{ opacity: 0.6, scaleY: 1 }}
                                transition={{
                                    duration: 0.5,
                                    delay: i * 0.15,
                                    ease: "easeOut"
                                }}
                            ></motion.div>

                            {/* Values overlay */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <motion.span
                                    className="text-xs font-bold text-white drop-shadow-md"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: (i * 0.15) + 0.3 }}
                                >
                                    {item.label}: {item.value}
                                </motion.span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </GlassContainer>
    );
};
