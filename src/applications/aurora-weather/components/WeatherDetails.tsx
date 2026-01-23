// React is auto-imported in JSX runtime;
import { Droplets, Wind, Gauge, Eye, Thermometer, UmbrellaOff } from 'lucide-react';
import { GlassContainer } from '@/components';
import { CurrentWeather } from '@/services/a2a/AuroraWeatherService';
import { SkeletonPulse } from './WeatherUtils';

export function WeatherDetailsGrid({ weather }: { weather: CurrentWeather }) {
    const details = [
        { icon: Droplets, label: 'Humidity', value: `${weather.humidity}%`, color: 'text-blue-400' },
        { icon: Wind, label: 'Wind', value: `${weather.windSpeed} km/h`, color: 'text-cyan-400' },
        { icon: Gauge, label: 'Pressure', value: `${weather.pressure} hPa`, color: 'text-purple-400' },
        { icon: Eye, label: 'Visibility', value: `${weather.visibility} km`, color: 'text-gray-400' },
        { icon: Thermometer, label: 'Dewpoint', value: `${weather.dewpoint}°`, color: 'text-teal-400' },
        { icon: UmbrellaOff, label: 'UV Index', value: weather.uvIndex.toString(), color: weather.uvIndex >= 6 ? 'text-red-400' : 'text-yellow-400' },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {details.map((detail) => (
                <GlassContainer
                    key={detail.label}
                    className="p-3 rounded-xl"
                    border
                    material="thin"
                >
                    <div className="flex items-center gap-2">
                        <detail.icon size={18} className={detail.color} />
                        <span className="text-xs text-secondary">{detail.label}</span>
                    </div>
                    <div className="text-lg font-semibold text-primary mt-1">
                        {detail.value}
                    </div>
                </GlassContainer>
            ))}
        </div>
    );
}

export function WeatherDetailsSkeleton() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
                <GlassContainer key={i} className="p-3 rounded-xl" border material="thin">
                    <div className="flex items-center gap-2 mb-2">
                        <SkeletonPulse className="w-5 h-5 rounded-full" />
                        <SkeletonPulse className="w-16 h-3" />
                    </div>
                    <SkeletonPulse className="w-12 h-6" />
                </GlassContainer>
            ))}
        </div>
    );
}
