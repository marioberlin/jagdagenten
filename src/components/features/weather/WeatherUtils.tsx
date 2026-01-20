import React from 'react';
import {
    Sun, Cloud, CloudRain, CloudSnow, Wind, Database, Clock
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { WeatherCondition, MaterialMood } from '@/services/a2a/AuroraWeatherService';

// Weather icon mapping
export const getWeatherIcon = (condition: WeatherCondition, size: number = 24) => {
    switch (condition) {
        case 'clear':
        case 'partly_cloudy':
            return <Sun size={size} className="text-yellow-400" />;
        case 'cloudy':
        case 'overcast':
        case 'fog':
            return <Cloud size={size} className="text-gray-400" />;
        case 'drizzle':
        case 'rain':
        case 'heavy_rain':
            return <CloudRain size={size} className="text-blue-400" />;
        case 'thunderstorm':
            return <CloudRain size={size} className="text-purple-400" />;
        case 'snow':
        case 'heavy_snow':
        case 'sleet':
        case 'hail':
            return <CloudSnow size={size} className="text-cyan-300" />;
        case 'wind':
            return <Wind size={size} className="text-cyan-400" />;
        default:
            return <Sun size={size} className="text-yellow-400" />;
    }
};

// Material mood to glass styling
export const getMoodStyles = (mood: MaterialMood): string => {
    switch (mood) {
        case 'calm':
            return 'backdrop-blur-xl bg-glass-surface';
        case 'active':
            return 'backdrop-blur-2xl bg-glass-surface-elevated';
        case 'intense':
            return 'backdrop-blur-3xl bg-white/15';
        case 'severe':
            return 'backdrop-blur-3xl bg-red-500/10 border-red-500/30';
        default:
            return 'backdrop-blur-xl bg-glass-surface';
    }
};

// Skeleton Loading Component
export function SkeletonPulse({ className }: { className?: string }) {
    return (
        <div className={cn("animate-pulse bg-white/10 rounded", className)} />
    );
}

// Data Source Attribution Component
export function DataSourceAttribution({ dataSource, lastFetched }: { dataSource: string; lastFetched: string }) {
    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    return (
        <div className="flex items-center justify-between text-[10px] text-tertiary mt-2 pt-2 border-t border-white/5">
            <div className="flex items-center gap-1">
                <Database size={10} />
                <span>{dataSource}</span>
            </div>
            <div className="flex items-center gap-1">
                <Clock size={10} />
                <span>Updated {formatTime(lastFetched)}</span>
            </div>
        </div>
    );
}

// Confidence Indicator Component
export function ConfidenceIndicator({ confidence }: { confidence: number }) {
    const getColor = () => {
        if (confidence >= 85) return 'text-green-400';
        if (confidence >= 70) return 'text-yellow-400';
        return 'text-orange-400';
    };

    return (
        <span className={cn("text-[10px]", getColor())}>
            {confidence}% conf.
        </span>
    );
}
