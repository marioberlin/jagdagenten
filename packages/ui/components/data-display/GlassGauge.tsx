import { motion } from 'framer-motion';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';

interface GlassGaugeProps {
    value: number;
    min?: number;
    max?: number;
    minLabel?: string;
    maxLabel?: string;
    units?: string;
    colors?: { stop: number, color: string }[];
    size?: number;
    className?: string;
}

export const GlassGauge = ({
    value,
    min = 0,
    max = 100,
    minLabel,
    maxLabel,
    units = '',
    colors = [
        { stop: 0, color: '#4ade80' },   // Green
        { stop: 60, color: '#facc15' },  // Yellow
        { stop: 85, color: '#f87171' }   // Red
    ],
    size = 200,
    className
}: GlassGaugeProps) => {

    const range = max - min;
    const percentage = Math.min(Math.max((value - min) / range, 0), 1);

    // Config
    const strokeWidth = 15;
    const radius = 80;
    const center = 100;
    const startAngle = -130;
    const endAngle = 130;
    const angleRange = endAngle - startAngle;

    // Needle angle
    const needleAngle = startAngle + (percentage * angleRange);

    // Helpers for arc
    const degToRad = (deg: number) => (deg * Math.PI) / 180;

    const polarToCartesian = (angleInDegrees: number) => {
        const angleInRadians = degToRad(angleInDegrees);
        return {
            x: center + radius * Math.cos(angleInRadians),
            y: center + radius * Math.sin(angleInRadians)
        };
    }

    const createArc = (start: number, end: number) => {
        const startPos = polarToCartesian(end);
        const endPos = polarToCartesian(start);
        const largeArcFlag = end - start <= 180 ? 0 : 1;

        return [
            "M", startPos.x, startPos.y,
            "A", radius, radius, 0, largeArcFlag, 0, endPos.x, endPos.y
        ].join(" ");
    };

    // Sort colors by stop value
    const sortedColors = [...colors].sort((a, b) => a.stop - b.stop);

    return (
        <GlassContainer className={cn("flex flex-col items-center justify-center p-4", className)} style={{ width: size, height: size * 0.9 }}>
            <svg viewBox="0 0 200 160" className="w-full h-full overflow-visible">
                {/* Background Arc Track */}
                <path
                    d={createArc(startAngle, endAngle)}
                    fill="none"
                    stroke="var(--glass-border)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    className="opacity-20"
                />

                {/* Colored Segments */}
                <defs>
                    <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        {sortedColors.map((c, i) => (
                            <stop key={i} offset={`${c.stop}%`} stopColor={c.color} />
                        ))}
                    </linearGradient>
                </defs>
                <motion.path
                    d={createArc(startAngle, endAngle)}
                    fill="none"
                    stroke="url(#gaugeGradient)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeOpacity="0.8"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.8 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                />

                {/* Ticks */}
                {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
                    const angle = startAngle + (t * angleRange);
                    const pos1 = polarToCartesian(angle);
                    // Move slightly outward for tick start
                    const r2 = radius + 15;
                    const pos2 = {
                        x: center + r2 * Math.cos(degToRad(angle)),
                        y: center + r2 * Math.sin(degToRad(angle))
                    };
                    return (
                        <line
                            key={i}
                            x1={pos1.x}
                            y1={pos1.y}
                            x2={pos2.x}
                            y2={pos2.y}
                            stroke="var(--glass-border)"
                            strokeWidth="2"
                        />
                    );
                })}

                {/* Needle */}
                <motion.g
                    style={{ transformOrigin: '100px 100px' }}
                    initial={{ rotate: startAngle + 90, scale: 0 }}
                    animate={{ rotate: needleAngle + 90, scale: 1 }}
                    transition={{
                        type: "spring",
                        stiffness: 50,
                        damping: 15,
                        delay: 0.3
                    }}
                >
                    {/* Pivot */}
                    <circle cx="100" cy="100" r="6" fill="#fff" className="drop-shadow-lg" />
                    {/* Pointer (triangle) - pointing UP initially (0deg is right, so -90 is up) */}
                    <path d="M 100 80 L 96 100 L 104 100 Z" fill="#fff" transform="rotate(-90 100 100) translate(-50 0) scale(1.6)" />
                </motion.g>

                {/* Value Text */}
                <text x="100" y="140" textAnchor="middle" className="text-3xl font-bold fill-primary font-mono">{Math.round(value)}</text>
                <text x="100" y="155" textAnchor="middle" className="text-[10px] fill-secondary">{units}</text>

                {/* Labels */}
                <text x="25" y="140" textAnchor="start" className="text-[10px] fill-secondary">{minLabel || min}</text>
                <text x="175" y="140" textAnchor="end" className="text-[10px] fill-secondary">{maxLabel || max}</text>

            </svg>
        </GlassContainer>
    );
};
