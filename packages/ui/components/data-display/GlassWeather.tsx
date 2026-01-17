import React from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { Sun, CloudRain, Cloud, Wind } from 'lucide-react';

export interface ForecastDay {
    day: string;
    temp: number;
    icon: 'sun' | 'cloud' | 'rain' | 'wind';
}

export interface GlassWeatherProps {
    temperature: number;
    humidity: number;
    date?: Date | string;
    location?: string;
    forecast?: ForecastDay[];
    className?: string;
}

const WeatherIcon: React.FC<{ icon: ForecastDay['icon']; className?: string }> = ({ icon, className = 'w-4 h-4' }) => {
    switch (icon) {
        case 'sun': return <Sun className={`${className} text-yellow-400`} />;
        case 'cloud': return <Cloud className={`${className} text-gray-400`} />;
        case 'rain': return <CloudRain className={`${className} text-blue-400`} />;
        case 'wind': return <Wind className={`${className} text-cyan-400`} />;
        default: return <Sun className={`${className} text-yellow-400`} />;
    }
};

export const GlassWeather = React.forwardRef<HTMLDivElement, GlassWeatherProps>(
    ({ temperature, humidity, date, location, forecast = [], className = '' }, ref) => {
        const formattedDate = date
            ? (typeof date === 'string' ? date : date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))
            : new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

        const [weekday, ...rest] = formattedDate.split(',');

        return (
            <GlassContainer
                ref={ref}
                className={`p-4 rounded-xl ${className}`}
                material="regular"
                border
            >
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <div className="text-3xl font-bold text-primary">{temperature}°C</div>
                        <div className="text-xs text-secondary">{humidity}% Humidity</div>
                        {location && <div className="text-xs text-tertiary mt-1">{location}</div>}
                    </div>
                    <div className="text-right">
                        <div className="text-sm font-medium text-primary">{weekday}</div>
                        <div className="text-xs text-secondary">{rest.join(',').trim()}</div>
                    </div>
                </div>

                {forecast.length > 0 && (
                    <div className="flex gap-2">
                        {forecast.map((day) => (
                            <div key={day.day} className="text-center flex-1">
                                <div className="text-xs text-secondary">{day.day}</div>
                                <WeatherIcon icon={day.icon} className="w-4 h-4 mx-auto my-1" />
                                <div className="text-xs text-primary">{day.temp}°</div>
                            </div>
                        ))}
                    </div>
                )}
            </GlassContainer>
        );
    }
);

GlassWeather.displayName = 'GlassWeather';
