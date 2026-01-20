/**
 * WorldTimeClock
 * 
 * Analogue world time clock with ticking animation.
 * Displays destination timezone with neon-styled glass card.
 */
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';
import { Globe } from 'lucide-react';

interface WorldTimeClockProps {
    /** IANA timezone string (e.g., 'Asia/Tokyo') */
    timezone: string;
    /** Display name for the city */
    cityName: string;
    /** Accent color for glow effects */
    accentColor?: string;
    /** Additional className */
    className?: string;
}

/** Get timezone offset string (e.g., '+9' or '-5') */
function getTimezoneOffset(timezone: string): string {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'shortOffset'
    });
    const parts = formatter.formatToParts(now);
    const offsetPart = parts.find(p => p.type === 'timeZoneName');
    return offsetPart?.value?.replace('GMT', 'UTC') || '';
}

export function WorldTimeClock({
    timezone,
    cityName,
    accentColor = '#ec4899',
    className
}: WorldTimeClockProps) {
    const [time, setTime] = useState(new Date());
    const [isHovered, setIsHovered] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Update time every second
    useEffect(() => {
        const tick = () => setTime(new Date());
        intervalRef.current = setInterval(tick, 1000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    // Get time in target timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
    });
    const timeParts = formatter.formatToParts(time);
    const hours = parseInt(timeParts.find(p => p.type === 'hour')?.value || '0');
    const minutes = parseInt(timeParts.find(p => p.type === 'minute')?.value || '0');
    const seconds = parseInt(timeParts.find(p => p.type === 'second')?.value || '0');

    // Calculate hand rotations
    const secondDeg = seconds * 6; // 360 / 60
    const minuteDeg = minutes * 6 + seconds * 0.1;
    const hourDeg = (hours % 12) * 30 + minutes * 0.5; // 360 / 12

    const offsetLabel = getTimezoneOffset(timezone);
    const clockSize = 120;
    const center = clockSize / 2;
    const clockRadius = (clockSize - 16) / 2;

    return (
        <div
            className={cn(
                "relative p-4 rounded-xl h-full",
                "bg-gradient-to-br from-white/10 to-white/5",
                "border border-white/20",
                "backdrop-blur-md",
                "flex flex-col items-center justify-center",
                className
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                boxShadow: isHovered
                    ? `0 0 30px ${accentColor}40, 0 10px 40px rgba(0,0,0,0.3)`
                    : '0 4px 20px rgba(0,0,0,0.2)'
            }}
        >
            {/* Header */}
            <div className="flex items-center gap-1.5 mb-3">
                <Globe size={14} style={{ color: accentColor }} />
                <span className="text-xs text-white/50 uppercase tracking-wider">World Time</span>
            </div>

            {/* Clock Face */}
            <svg
                width={clockSize}
                height={clockSize}
                viewBox={`0 0 ${clockSize} ${clockSize}`}
                className="drop-shadow-lg"
            >
                {/* Clock background */}
                <circle
                    cx={center}
                    cy={center}
                    r={clockRadius}
                    fill="rgba(0,0,0,0.3)"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="1"
                />

                {/* Hour markers */}
                {Array.from({ length: 12 }).map((_, i) => {
                    const angle = (i * 30 - 90) * (Math.PI / 180);
                    const isQuarter = i % 3 === 0;
                    const outerR = clockRadius - 4;
                    const innerR = isQuarter ? clockRadius - 12 : clockRadius - 8;
                    return (
                        <line
                            key={i}
                            x1={center + Math.cos(angle) * innerR}
                            y1={center + Math.sin(angle) * innerR}
                            x2={center + Math.cos(angle) * outerR}
                            y2={center + Math.sin(angle) * outerR}
                            stroke={isQuarter ? accentColor : 'rgba(255,255,255,0.4)'}
                            strokeWidth={isQuarter ? 2 : 1}
                            strokeLinecap="round"
                        />
                    );
                })}

                {/* Hour hand */}
                <line
                    x1={center}
                    y1={center}
                    x2={center}
                    y2={center - clockRadius * 0.45}
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    transform={`rotate(${hourDeg} ${center} ${center})`}
                    style={{ filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.5))' }}
                />

                {/* Minute hand */}
                <line
                    x1={center}
                    y1={center}
                    x2={center}
                    y2={center - clockRadius * 0.65}
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    transform={`rotate(${minuteDeg} ${center} ${center})`}
                    style={{ filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.5))' }}
                />

                {/* Second hand */}
                <line
                    x1={center}
                    y1={center + 10}
                    x2={center}
                    y2={center - clockRadius * 0.7}
                    stroke={accentColor}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    transform={`rotate(${secondDeg} ${center} ${center})`}
                    className="transition-transform duration-200"
                    style={{ filter: `drop-shadow(0 0 4px ${accentColor})` }}
                />

                {/* Center dot */}
                <circle
                    cx={center}
                    cy={center}
                    r="4"
                    fill={accentColor}
                    style={{ filter: `drop-shadow(0 0 6px ${accentColor})` }}
                />
            </svg>

            {/* City label */}
            <div className="mt-3 text-center">
                <p className="text-sm font-semibold text-white">{cityName}</p>
                <p className="text-xs text-white/50">{offsetLabel}</p>
            </div>

            {/* Decorative glow */}
            <div
                className="absolute top-0 right-0 w-16 h-16 opacity-20 pointer-events-none"
                style={{
                    background: `radial-gradient(circle at top right, ${accentColor} 0%, transparent 70%)`
                }}
            />
        </div>
    );
}

export default WorldTimeClock;
