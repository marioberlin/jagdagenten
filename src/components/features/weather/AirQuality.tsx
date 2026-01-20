import React from 'react';
import { Shield } from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassContainer } from '@/components';
import { AirQuality } from '@/services/a2a/AuroraWeatherService';

export function AirQualityCard({ airQuality }: { airQuality: AirQuality }) {
    const categoryInfo: Record<AirQuality['aqiCategory'], { label: string; color: string; bg: string }> = {
        good: { label: 'Good', color: 'text-green-400', bg: 'bg-green-500/20' },
        moderate: { label: 'Moderate', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
        unhealthy_sensitive: { label: 'Unhealthy (Sensitive)', color: 'text-orange-400', bg: 'bg-orange-500/20' },
        unhealthy: { label: 'Unhealthy', color: 'text-red-400', bg: 'bg-red-500/20' },
        very_unhealthy: { label: 'Very Unhealthy', color: 'text-purple-400', bg: 'bg-purple-500/20' },
        hazardous: { label: 'Hazardous', color: 'text-red-600', bg: 'bg-red-600/20' }
    };

    const info = categoryInfo[airQuality.aqiCategory];

    return (
        <GlassContainer className="p-4 rounded-xl" border material="thin">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Shield size={18} className={info.color} />
                    <h3 className="text-sm font-semibold text-primary">Air Quality</h3>
                </div>
                <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", info.bg, info.color)}>
                    {info.label}
                </span>
            </div>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-3xl font-bold text-primary">{airQuality.aqi}</p>
                    <p className="text-xs text-secondary">US AQI</p>
                </div>
                <div className="text-right text-xs text-secondary">
                    <p>PM2.5: {airQuality.pm2_5.toFixed(1)} µg/m³</p>
                    <p>PM10: {airQuality.pm10.toFixed(1)} µg/m³</p>
                </div>
            </div>
            {['unhealthy_sensitive', 'unhealthy', 'very_unhealthy', 'hazardous'].includes(airQuality.aqiCategory) && (
                <p className="mt-2 text-[10px] text-orange-400">
                    ⚠️ Sensitive groups should limit outdoor activity
                </p>
            )}
        </GlassContainer>
    );
}
