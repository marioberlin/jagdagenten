import React, { useState, useRef } from 'react';
import { Clock, ChevronLeft, ChevronRight, Droplets, Sunrise, Sunset } from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassContainer } from '@/components';
import { HourlyForecast, DailyForecast as DailyForecastType } from '@/services/a2a/AuroraWeatherService';
import { getWeatherIcon, ConfidenceIndicator, SkeletonPulse } from './WeatherUtils';

// Enhanced Hourly Timeline with Interactive Scrubbing
export function EnhancedHourlyTimeline({ hourly }: { hourly: HourlyForecast[] }) {
    const [selectedHour, setSelectedHour] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Show next 24 hours
    const nextHours = hourly.slice(0, 24);

    const scrollTo = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 200;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    // Find precipitation periods
    const precipPeriods = nextHours.reduce((acc, h, i) => {
        if (h.precipitationProbability >= 30) {
            if (acc.length === 0 || acc[acc.length - 1].end !== i - 1) {
                acc.push({ start: i, end: i, maxProb: h.precipitationProbability });
            } else {
                acc[acc.length - 1].end = i;
                acc[acc.length - 1].maxProb = Math.max(acc[acc.length - 1].maxProb, h.precipitationProbability);
            }
        }
        return acc;
    }, [] as { start: number; end: number; maxProb: number }[]);

    const selectedData = nextHours[selectedHour];

    return (
        <GlassContainer className="p-4 rounded-xl" border material="thin">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Clock size={18} className="text-accent-primary" />
                    <h3 className="text-sm font-semibold text-primary">24-Hour Forecast</h3>
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={() => scrollTo('left')}
                        className="p-1 rounded hover:bg-white/10 transition-colors"
                    >
                        <ChevronLeft size={16} className="text-secondary" />
                    </button>
                    <button
                        onClick={() => scrollTo('right')}
                        className="p-1 rounded hover:bg-white/10 transition-colors"
                    >
                        <ChevronRight size={16} className="text-secondary" />
                    </button>
                </div>
            </div>

            {/* Precipitation overlay indicator */}
            {precipPeriods.length > 0 && (
                <div className="mb-2 flex items-center gap-2 text-xs text-blue-400">
                    <Droplets size={12} />
                    <span>
                        Rain expected: {precipPeriods.map(p => {
                            const startTime = new Date(nextHours[p.start].time).getHours();
                            const endTime = new Date(nextHours[p.end].time).getHours();
                            return `${startTime}:00-${endTime + 1}:00`;
                        }).join(', ')}
                    </span>
                </div>
            )}

            {/* Timeline */}
            <div
                ref={scrollRef}
                className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {nextHours.map((hour, idx) => {
                    const time = new Date(hour.time);
                    const hourLabel = idx === 0 ? 'Now' : time.toLocaleTimeString('en-US', { hour: 'numeric' });
                    const isSelected = idx === selectedHour;
                    const hasPrecip = hour.precipitationProbability >= 30;

                    return (
                        <button
                            key={hour.time}
                            onClick={() => setSelectedHour(idx)}
                            className={cn(
                                "flex flex-col items-center min-w-[52px] p-2 rounded-lg transition-all",
                                isSelected
                                    ? "bg-accent-primary/20 border border-accent-primary/40"
                                    : "bg-white/5 hover:bg-white/10 border border-transparent",
                                hasPrecip && !isSelected && "bg-blue-500/10"
                            )}
                        >
                            <span className={cn(
                                "text-[10px]",
                                isSelected ? "text-accent-primary" : "text-secondary"
                            )}>
                                {hourLabel}
                            </span>
                            <div className="my-1">
                                {getWeatherIcon(hour.condition, 18)}
                            </div>
                            <span className={cn(
                                "text-sm font-medium",
                                isSelected ? "text-primary" : "text-secondary"
                            )}>
                                {hour.temperature}°
                            </span>
                            {hasPrecip && (
                                <div className="flex items-center gap-0.5 mt-1">
                                    <Droplets size={8} className="text-blue-400" />
                                    <span className="text-[10px] text-blue-400">
                                        {hour.precipitationProbability}%
                                    </span>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Selected hour details */}
            {selectedData && (
                <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="grid grid-cols-4 gap-2 text-center">
                        <div>
                            <p className="text-[10px] text-secondary">Feels Like</p>
                            <p className="text-sm font-medium text-primary">{selectedData.feelsLike}°</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-secondary">Wind</p>
                            <p className="text-sm font-medium text-primary">{selectedData.windSpeed} km/h</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-secondary">Humidity</p>
                            <p className="text-sm font-medium text-primary">{selectedData.humidity}%</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-secondary">UV</p>
                            <p className={cn(
                                "text-sm font-medium",
                                selectedData.uvIndex >= 6 ? "text-orange-400" : "text-primary"
                            )}>
                                {selectedData.uvIndex}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </GlassContainer>
    );
}

export function HourlyForecastSkeleton() {
    return (
        <GlassContainer className="p-4 rounded-xl" border material="thin">
            <div className="flex items-center gap-2 mb-3">
                <SkeletonPulse className="w-5 h-5 rounded-full" />
                <SkeletonPulse className="w-32 h-4" />
            </div>
            <div className="flex gap-2 overflow-hidden">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center min-w-[52px] p-2">
                        <SkeletonPulse className="w-8 h-3 mb-2" />
                        <SkeletonPulse className="w-6 h-6 rounded-full mb-2" />
                        <SkeletonPulse className="w-6 h-4" />
                    </div>
                ))}
            </div>
        </GlassContainer>
    );
}

// Daily Forecast Component
export function DailyForecast({ daily }: { daily: DailyForecastType[] }) {
    return (
        <GlassContainer className="p-4 rounded-xl" border material="thin">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-primary">7-Day Forecast</h3>
                <span className="text-[10px] text-tertiary">with confidence</span>
            </div>
            <div className="space-y-2">
                {daily.map((day, idx) => {
                    const date = new Date(day.date);
                    const dayName = idx === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });

                    return (
                        <div
                            key={day.date}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                            <span className="w-12 text-sm text-secondary">{dayName}</span>
                            <div className="w-8">
                                {getWeatherIcon(day.condition, 20)}
                            </div>
                            <div className="flex-1 flex items-center gap-2">
                                <span className="text-sm font-medium text-primary">{day.tempHigh}°</span>
                                <div className="flex-1 h-1 bg-white/10 rounded-full relative">
                                    <div
                                        className="absolute h-full bg-gradient-to-r from-blue-400 to-orange-400 rounded-full"
                                        style={{
                                            left: `${Math.max(0, (day.tempLow + 10) / 50 * 100)}%`,
                                            right: `${Math.max(0, 100 - (day.tempHigh + 10) / 50 * 100)}%`
                                        }}
                                    />
                                </div>
                                <span className="text-sm text-secondary">{day.tempLow}°</span>
                            </div>
                            {day.precipitationProbability > 30 && (
                                <span className="text-xs text-blue-400 flex items-center gap-1">
                                    <Droplets size={12} />
                                    {day.precipitationProbability}%
                                </span>
                            )}
                            {day.confidence && (
                                <ConfidenceIndicator confidence={day.confidence} />
                            )}
                        </div>
                    );
                })}
            </div>
        </GlassContainer>
    );
}

export function DailyForecastSkeleton() {
    return (
        <GlassContainer className="p-4 rounded-xl" border material="thin">
            <SkeletonPulse className="w-24 h-4 mb-3" />
            <div className="space-y-3">
                {[...Array(7)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <SkeletonPulse className="w-12 h-4" />
                        <SkeletonPulse className="w-6 h-6 rounded-full" />
                        <div className="flex-1 flex items-center gap-2">
                            <SkeletonPulse className="w-8 h-4" />
                            <SkeletonPulse className="flex-1 h-1" />
                            <SkeletonPulse className="w-8 h-4" />
                        </div>
                    </div>
                ))}
            </div>
        </GlassContainer>
    );
}

// Sun Times Component
export function SunTimes({ sunrise, sunset }: { sunrise: string; sunset: string }) {
    const formatTime = (timeStr: string) => {
        const date = new Date(timeStr);
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    return (
        <GlassContainer className="p-4 rounded-xl" border material="thin">
            <div className="flex justify-around">
                <div className="flex flex-col items-center">
                    <Sunrise size={24} className="text-orange-400 mb-2" />
                    <span className="text-xs text-secondary">Sunrise</span>
                    <span className="text-sm font-medium text-primary">{formatTime(sunrise)}</span>
                </div>
                <div className="w-px bg-white/10" />
                <div className="flex flex-col items-center">
                    <Sunset size={24} className="text-purple-400 mb-2" />
                    <span className="text-xs text-secondary">Sunset</span>
                    <span className="text-sm font-medium text-primary">{formatTime(sunset)}</span>
                </div>
            </div>
        </GlassContainer>
    );
}
