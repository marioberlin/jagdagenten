// React is auto-imported in JSX runtime;
import { Zap } from 'lucide-react';
import { GlassContainer } from '@/components';
import { CurrentWeather, HourlyForecast } from '@/services/a2a/AuroraWeatherService';

export function QuickGlanceSummary({
    weather,
    hourly,
}: {
    weather: CurrentWeather;
    hourly: HourlyForecast[];
    location: string;
}) {
    // Find next rain hour (if any)
    const nextRain = hourly.slice(0, 12).find(h => h.precipitationProbability >= 40);
    const nextRainHour = nextRain ? new Date(nextRain.time).getHours() : null;

    // Get high/low for rest of day
    const todayHigh = Math.max(...hourly.slice(0, 12).map(h => h.temperature));
    const todayLow = Math.min(...hourly.slice(0, 12).map(h => h.temperature));

    return (
        <GlassContainer className="p-4 rounded-xl bg-gradient-to-r from-accent-primary/10 to-transparent" border>
            <div className="flex items-center gap-2 mb-2">
                <Zap size={16} className="text-accent-primary" />
                <h3 className="text-sm font-semibold text-primary">Quick Glance</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                    <p className="text-[10px] text-secondary uppercase tracking-wide">Now</p>
                    <p className="text-lg font-bold text-primary">{weather.temperature}°</p>
                    <p className="text-xs text-secondary">{weather.conditionText}</p>
                </div>
                <div>
                    <p className="text-[10px] text-secondary uppercase tracking-wide">Next</p>
                    {nextRainHour !== null ? (
                        <>
                            <p className="text-lg font-bold text-blue-400">🌧️ {nextRainHour}:00</p>
                            <p className="text-xs text-secondary">Rain likely</p>
                        </>
                    ) : (
                        <>
                            <p className="text-lg font-bold text-green-400">☀️ Clear</p>
                            <p className="text-xs text-secondary">No rain 12h</p>
                        </>
                    )}
                </div>
                <div>
                    <p className="text-[10px] text-secondary uppercase tracking-wide">Today</p>
                    <p className="text-lg font-bold text-primary">{todayHigh}°/{todayLow}°</p>
                    <p className="text-xs text-secondary">High/Low</p>
                </div>
            </div>
        </GlassContainer>
    );
}
