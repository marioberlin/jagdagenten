import { motion } from 'framer-motion';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';

interface GlassPolarAreaChartProps {
    data: number[];
    labels: string[];
    colors?: string[];
    width?: number;
    height?: number;
    className?: string;
}

export const GlassPolarAreaChart = ({
    data,
    labels,
    colors = ['#60a5fa', '#34d399', '#f472b6', '#a78bfa', '#fbbf24'],
    width = 300,
    height = 300,
    className
}: GlassPolarAreaChartProps) => {

    const maxVal = Math.max(...data);
    const radius = Math.min(width, height) / 2 - 20;
    const centerX = width / 2;
    const centerY = height / 2;
    const anglePerSlice = (2 * Math.PI) / data.length;

    // Helper to calculate path
    const getSectorPath = (index: number, value: number) => {
        const startAngle = index * anglePerSlice - Math.PI / 2;
        const endAngle = startAngle + anglePerSlice;

        // Scale radius by value
        const r = (value / maxVal) * radius;

        const x1 = centerX + r * Math.cos(startAngle);
        const y1 = centerY + r * Math.sin(startAngle);
        const x2 = centerX + r * Math.cos(endAngle);
        const y2 = centerY + r * Math.sin(endAngle);

        return `M ${centerX} ${centerY} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
    };

    return (
        <GlassContainer className={cn("flex flex-col items-center justify-center p-4", className)}>
            <svg width={width} height={height} className="overflow-visible">
                {/* ... (background circles code remains same) */}

                {data.map((value, i) => (
                    <g key={i} className="group">
                        <motion.path
                            d={getSectorPath(i, value)}
                            fill={colors[i % colors.length]}
                            fillOpacity="0.4"
                            stroke={colors[i % colors.length]}
                            strokeWidth="1"
                            className="transition-colors duration-300 hover:fill-opacity-80 cursor-pointer origin-center"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            whileHover={{ scale: 1.05 }}
                            transition={{
                                duration: 0.5,
                                delay: i * 0.1,
                                type: "spring",
                                stiffness: 200,
                                damping: 15
                            }}
                            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                        >
                            <title>{`${labels[i]}: ${value}`}</title>
                        </motion.path>
                    </g>
                ))}
            </svg>

            {/* ... (legend code remains same) */}
        </GlassContainer>
    );
};
