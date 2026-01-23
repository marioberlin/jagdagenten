/**
 * Hourly Weather Timeline
 * 
 * Horizontal scrolling timeline showing hourly weather forecast.
 * Features temperature curve, precipitation bars, and condition icons.
 */
import React, { useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    Sun,
    Cloud,
    CloudRain,
    CloudSnow,
    CloudLightning,
    CloudFog,
    Droplets,
    Sunrise,
    Sunset,
} from 'lucide-react';
import { cn } from '@/utils/cn';

// ============================================================================
// Types
// ============================================================================

export interface HourlyForecast {
    time: string;
    temperature: number;
    feelsLike?: number;
    condition: string;
    precipitation: number;
    precipitationProbability: number;
    humidity?: number;
    windSpeed?: number;
    uvIndex?: number;
}

export interface HourlyTimelineProps {
    hourlyData: HourlyForecast[];
    sunrise?: string;
    sunset?: string;
    className?: string;
}

// ============================================================================
// Helpers
// ============================================================================

const getConditionIcon = (condition: string): React.ElementType => {
    const c = condition.toLowerCase();
    if (c.includes('thunder')) return CloudLightning;
    if (c.includes('snow')) return CloudSnow;
    if (c.includes('rain') || c.includes('drizzle')) return CloudRain;
    if (c.includes('fog') || c.includes('mist')) return CloudFog;
    if (c.includes('cloud') || c.includes('overcast')) return Cloud;
    return Sun;
};

const getConditionColor = (condition: string): string => {
    const c = condition.toLowerCase();
    if (c.includes('thunder')) return 'text-purple-400';
    if (c.includes('snow')) return 'text-slate-200';
    if (c.includes('rain') || c.includes('drizzle')) return 'text-blue-400';
    if (c.includes('fog')) return 'text-slate-400';
    if (c.includes('cloud')) return 'text-slate-300';
    return 'text-yellow-400';
};

const formatHour = (isoTime: string): string => {
    const date = new Date(isoTime);
    const hour = date.getHours();
    if (hour === 0) return '12am';
    if (hour === 12) return '12pm';
    return hour > 12 ? `${hour - 12}pm` : `${hour}am`;
};

const isCurrentHour = (isoTime: string): boolean => {
    const hour = new Date(isoTime).getHours();
    const now = new Date().getHours();
    return hour === now;
};

// ============================================================================
// Hour Card
// ============================================================================

interface HourCardProps {
    forecast: HourlyForecast;
    isNow: boolean;
    isSunrise: boolean;
    isSunset: boolean;
    tempRange: { min: number; max: number };
}

const HourCard: React.FC<HourCardProps> = ({ forecast, isNow, isSunrise, isSunset, tempRange: _tempRange }) => {
    const Icon = getConditionIcon(forecast.condition);
    const iconColor = getConditionColor(forecast.condition);

    // Precipitation bar height
    const precipHeight = Math.min(forecast.precipitationProbability, 100);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-lg min-w-14 transition-all',
                isNow && 'bg-[var(--glass-accent)]/20 ring-1 ring-[var(--glass-accent)]/50',
                !isNow && 'hover:bg-white/5'
            )}
        >
            {/* Time */}
            <span className={cn(
                'text-xs font-medium',
                isNow ? 'text-[var(--glass-accent)]' : 'text-tertiary'
            )}>
                {isNow ? 'Now' : formatHour(forecast.time)}
            </span>

            {/* Sunrise/Sunset indicator */}
            {(isSunrise || isSunset) && (
                <div className="flex items-center gap-0.5 text-amber-400">
                    {isSunrise ? <Sunrise size={10} /> : <Sunset size={10} />}
                </div>
            )}

            {/* Weather Icon */}
            <Icon size={20} className={iconColor} />

            {/* Temperature */}
            <span className={cn(
                'text-sm font-semibold',
                isNow ? 'text-primary' : 'text-secondary'
            )}>
                {forecast.temperature}°
            </span>

            {/* Precipitation probability bar */}
            <div className="w-full h-8 flex flex-col justify-end relative">
                {precipHeight > 0 && (
                    <>
                        <div
                            className="w-full rounded-t bg-blue-500/30"
                            style={{ height: `${precipHeight * 0.8}%` }}
                        />
                        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center">
                            <span className="text-[10px] text-blue-400 flex items-center gap-0.5">
                                <Droplets size={8} />
                                {forecast.precipitationProbability}%
                            </span>
                        </div>
                    </>
                )}
            </div>
        </motion.div>
    );
};

// ============================================================================
// Best Hours Indicator
// ============================================================================

interface BestHoursBadgeProps {
    hours: number[];
}

const BestHoursBadge: React.FC<BestHoursBadgeProps> = ({ hours }) => {
    if (hours.length === 0) return null;

    const start = Math.min(...hours);
    const end = Math.max(...hours) + 1;

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/30">
            <Sun size={14} className="text-green-400" />
            <span className="text-xs text-green-400 font-medium">
                Best outdoor hours: {start > 12 ? start - 12 : start}{start >= 12 ? 'pm' : 'am'} - {end > 12 ? end - 12 : end}{end >= 12 ? 'pm' : 'am'}
            </span>
        </div>
    );
};

// ============================================================================
// Main Component
// ============================================================================

export const HourlyTimeline: React.FC<HourlyTimelineProps> = ({
    hourlyData,
    sunrise,
    sunset,
    className,
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Calculate temperature range for visual scaling
    const tempRange = useMemo(() => {
        const temps = hourlyData.map(h => h.temperature);
        return {
            min: Math.min(...temps),
            max: Math.max(...temps),
        };
    }, [hourlyData]);

    // Find best hours (low precip, good temp)
    const bestHours = useMemo(() => {
        return hourlyData
            .slice(0, 12)
            .filter(h =>
                h.precipitationProbability < 30 &&
                h.temperature > 15 &&
                h.temperature < 28
            )
            .map(h => new Date(h.time).getHours());
    }, [hourlyData]);

    // Parse sunrise/sunset hours
    const sunriseHour = sunrise ? new Date(sunrise).getHours() : null;
    const sunsetHour = sunset ? new Date(sunset).getHours() : null;

    if (hourlyData.length === 0) {
        return (
            <div className={cn('p-4 text-center text-tertiary text-sm', className)}>
                No hourly forecast available
            </div>
        );
    }

    return (
        <div className={cn('space-y-3', className)}>
            {/* Best Hours Badge */}
            {bestHours.length >= 3 && <BestHoursBadge hours={bestHours} />}

            {/* Timeline */}
            <div
                ref={scrollRef}
                className="flex gap-1 overflow-x-auto pb-2 custom-scrollbar"
                style={{ scrollbarWidth: 'thin' }}
            >
                {hourlyData.slice(0, 24).map((forecast, _index) => {
                    const hour = new Date(forecast.time).getHours();
                    return (
                        <HourCard
                            key={forecast.time}
                            forecast={forecast}
                            isNow={isCurrentHour(forecast.time)}
                            isSunrise={hour === sunriseHour}
                            isSunset={hour === sunsetHour}
                            tempRange={tempRange}
                        />
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between text-xs text-tertiary px-2">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                        <Droplets size={10} className="text-blue-400" />
                        Rain %
                    </span>
                    <span className="flex items-center gap-1">
                        <Sunrise size={10} className="text-amber-400" />
                        {sunrise ? formatHour(sunrise) : '--'}
                    </span>
                    <span className="flex items-center gap-1">
                        <Sunset size={10} className="text-orange-400" />
                        {sunset ? formatHour(sunset) : '--'}
                    </span>
                </div>
                <span>Scroll for more →</span>
            </div>
        </div>
    );
};

export default HourlyTimeline;
