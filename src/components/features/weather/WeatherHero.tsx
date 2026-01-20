import React from 'react';
import { MapPin } from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassContainer } from '@/components';
import { CurrentWeather } from '@/services/a2a/AuroraWeatherService';
import { getMoodStyles, getWeatherIcon, DataSourceAttribution, SkeletonPulse } from './WeatherUtils';

export function WeatherHero({ weather, location }: { weather: CurrentWeather; location: string }) {
    const moodStyles = getMoodStyles(weather.materialMood);

    return (
        <GlassContainer
            className={cn("p-6 rounded-2xl relative overflow-hidden", moodStyles)}
            border
        >
            {/* Tint overlay based on temperature */}
            <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundColor: weather.tintColor }}
            />

            <div className="relative z-10">
                <div className="flex items-center gap-2 text-secondary mb-2">
                    <MapPin size={16} />
                    <span className="font-medium">{location}</span>
                </div>

                <div className="flex items-start justify-between">
                    <div>
                        <div className="text-6xl font-bold text-primary tracking-tight">
                            {weather.temperature}°
                        </div>
                        <div className="text-lg text-secondary mt-1">
                            Feels like {weather.feelsLike}°
                        </div>
                        <div className="text-sm text-tertiary mt-2">
                            {weather.conditionText}
                        </div>
                    </div>

                    <div className="flex flex-col items-center">
                        {getWeatherIcon(weather.condition, 64)}
                        <div className={cn(
                            "mt-2 px-2 py-1 rounded-full text-xs font-medium",
                            weather.materialMood === 'calm' && "bg-green-500/20 text-green-400",
                            weather.materialMood === 'active' && "bg-yellow-500/20 text-yellow-400",
                            weather.materialMood === 'intense' && "bg-orange-500/20 text-orange-400",
                            weather.materialMood === 'severe' && "bg-red-500/20 text-red-400"
                        )}>
                            {weather.materialMood}
                        </div>
                    </div>
                </div>

                {/* Data Source Attribution */}
                {weather.dataSource && weather.lastFetched && (
                    <DataSourceAttribution
                        dataSource={weather.dataSource}
                        lastFetched={weather.lastFetched}
                    />
                )}
            </div>
        </GlassContainer>
    );
}

export function WeatherHeroSkeleton() {
    return (
        <GlassContainer className="p-6 rounded-2xl" border>
            <div className="flex items-center gap-2 mb-4">
                <SkeletonPulse className="w-4 h-4 rounded-full" />
                <SkeletonPulse className="w-24 h-4" />
            </div>
            <div className="flex items-start justify-between">
                <div>
                    <SkeletonPulse className="w-32 h-16 mb-2" />
                    <SkeletonPulse className="w-24 h-5 mb-2" />
                    <SkeletonPulse className="w-20 h-4" />
                </div>
                <div className="flex flex-col items-center">
                    <SkeletonPulse className="w-16 h-16 rounded-full" />
                    <SkeletonPulse className="w-12 h-5 mt-2 rounded-full" />
                </div>
            </div>
        </GlassContainer>
    );
}
