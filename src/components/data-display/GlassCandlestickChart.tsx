import { motion } from 'framer-motion';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';

interface CandlestickData {
    timestamp: string;
    open: number;
    close: number;
    high: number;
    low: number;
}

interface GlassCandlestickChartProps {
    data: CandlestickData[];
    width?: number;
    height?: number;
    upColor?: string;
    downColor?: string;
    className?: string;
}

export const GlassCandlestickChart = ({
    data,
    width = 500,
    height = 300,
    upColor = '#4ade80', // green-400
    downColor = '#f87171', // red-400
    className
}: GlassCandlestickChartProps) => {

    // Calculate ranges
    const allValues = data.flatMap(d => [d.low, d.high]);
    const minVal = Math.min(...allValues);
    const maxVal = Math.max(...allValues);
    const valueRange = maxVal - minVal;

    // Safety check just in case range is 0
    const finalRange = valueRange === 0 ? 1 : valueRange * 1.1; // Add 10% buffering
    const baseVal = minVal - (valueRange * 0.05);

    const candleWidth = (width / data.length) * 0.6;
    const spacing = (width / data.length);

    // Helpers
    const getY = (val: number) => height - ((val - baseVal) / finalRange) * height;

    return (
        <GlassContainer className={cn("p-4", className)} style={{ width, height }}>
            <svg width="100%" height="100%" className="overflow-visible">
                {/* ... (grid lines code remains same) */}
                {[0.25, 0.5, 0.75].map((tick, i) => {
                    const y = height * tick;
                    const val = maxVal - ((maxVal - minVal) * tick);
                    return (
                        <g key={i}>
                            <line
                                x1="0"
                                y1={y}
                                x2="100%"
                                y2={y}
                                stroke="var(--glass-border)"
                                strokeWidth="1"
                                strokeDasharray="4 4"
                                className="opacity-20"
                            />
                            <text x="-5" y={y} dominantBaseline="middle" textAnchor="end" className="fill-secondary text-[10px]">{Math.round(val)}</text>
                        </g>
                    )
                })}

                {data.map((d, i) => {
                    const isUp = d.close >= d.open;
                    const color = isUp ? upColor : downColor;

                    const x = i * spacing + (spacing - candleWidth) / 2;
                    const yHigh = getY(d.high);
                    const yLow = getY(d.low);
                    const yOpen = getY(d.open);
                    const yClose = getY(d.close);

                    const boxTop = Math.min(yOpen, yClose);
                    const boxHeight = Math.abs(yOpen - yClose) || 1; // Show at least 1px

                    return (
                        <g key={i} className="group cursor-pointer">
                            {/* Wick */}
                            <motion.line
                                x1={x + candleWidth / 2}
                                y1={yHigh}
                                x2={x + candleWidth / 2}
                                y2={yLow}
                                stroke={color}
                                strokeWidth="1"
                                className="opacity-60 group-hover:opacity-100 transition-opacity"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 0.6 }}
                                transition={{ duration: 0.5, delay: i * 0.05 }}
                            />
                            {/* Candle Body */}
                            <motion.rect
                                x={x}
                                y={boxTop}
                                width={candleWidth}
                                height={boxHeight}
                                fill={color}
                                fillOpacity={isUp ? 0.3 : 0.8}
                                stroke={color}
                                strokeWidth="1"
                                className="transition-colors duration-300 group-hover:brightness-110"
                                initial={{ scaleY: 0, opacity: 0 }}
                                animate={{ scaleY: 1, opacity: 1 }}
                                transition={{ duration: 0.5, delay: i * 0.05 }}
                                style={{ transformOrigin: 'center' }}
                            >
                                <title>{`O:${d.open} C:${d.close} H:${d.high} L:${d.low}`}</title>
                            </motion.rect>
                        </g>
                    );
                })}
            </svg>
        </GlassContainer>
    );
};
