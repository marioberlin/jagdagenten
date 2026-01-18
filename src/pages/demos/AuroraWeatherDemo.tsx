import { useNavigate } from 'react-router-dom';
import { useState, useMemo, useEffect, useRef } from 'react';
import { GlassContainer, GlassButton } from '@/components';
import { AgSidebar } from '../../components/generative/AgSidebar';
import { LiquidClient } from '../../liquid-engine/client';
import { LiquidProvider } from '../../liquid-engine/react';
import {
    Cloud, Sun, CloudRain, CloudSnow, Wind, Droplets,
    Thermometer, Eye, Gauge, UmbrellaOff, MapPin, Plus,
    Sunrise, Sunset, Book, RefreshCw, AlertTriangle, Bell,
    Search, X, Clock, Activity, ChevronRight, ChevronLeft,
    Bike, Mountain, UtensilsCrossed, Coffee, Star, Navigation,
    Database, Zap, Shield
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassBreadcrumb } from '../../components/layout/GlassBreadcrumb';
import {
    AuroraWeatherService,
    WeatherUpdate,
    WeatherCondition,
    MaterialMood,
    CurrentWeather,
    HourlyForecast as HourlyForecastType,
    DailyForecast as DailyForecastType,
    WeatherAlert,
    ActivityRecommendation,
    AirQuality
} from '../../services/a2a/AuroraWeatherService';
import { v4 as uuidv4 } from 'uuid';

// Initialize the engine client
const liquidClient = new LiquidClient();

// Weather icon mapping
const getWeatherIcon = (condition: WeatherCondition, size: number = 24) => {
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
const getMoodStyles = (mood: MaterialMood): string => {
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

// Skeleton Loading Components
function SkeletonPulse({ className }: { className?: string }) {
    return (
        <div className={cn("animate-pulse bg-white/10 rounded", className)} />
    );
}

function WeatherHeroSkeleton() {
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

function WeatherDetailsSkeleton() {
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

function HourlyForecastSkeleton() {
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

function DailyForecastSkeleton() {
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

// Quick Glance Summary Card
function QuickGlanceSummary({
    weather,
    hourly,
}: {
    weather: CurrentWeather;
    hourly: HourlyForecastType[];
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

// Air Quality Card Component
function AirQualityCard({ airQuality }: { airQuality: AirQuality }) {
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

// Data Source Attribution Component
function DataSourceAttribution({ dataSource, lastFetched }: { dataSource: string; lastFetched: string }) {
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
function ConfidenceIndicator({ confidence }: { confidence: number }) {
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

// Geolocation Button Component
function GeolocationButton({
    onLocationFound,
    isLoading
}: {
    onLocationFound: (lat: number, lng: number) => void;
    isLoading: boolean;
}) {
    const [geoLoading, setGeoLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const requestLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation not supported');
            return;
        }

        setGeoLoading(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setGeoLoading(false);
                onLocationFound(position.coords.latitude, position.coords.longitude);
            },
            (err) => {
                setGeoLoading(false);
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        setError('Location permission denied');
                        break;
                    case err.POSITION_UNAVAILABLE:
                        setError('Location unavailable');
                        break;
                    default:
                        setError('Could not get location');
                }
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    return (
        <div className="relative">
            <button
                onClick={requestLocation}
                disabled={isLoading || geoLoading}
                className={cn(
                    "p-1.5 rounded-full bg-white/5 text-secondary hover:bg-white/10 transition-colors",
                    (geoLoading) && "animate-pulse"
                )}
                title="Use my location"
            >
                <Navigation size={16} className={geoLoading ? "animate-spin" : ""} />
            </button>
            {error && (
                <div className="absolute top-full right-0 mt-1 px-2 py-1 bg-red-500/20 text-red-400 text-[10px] rounded whitespace-nowrap">
                    {error}
                </div>
            )}
        </div>
    );
}

// Weather Hero Component
function WeatherHero({ weather, location }: { weather: CurrentWeather; location: string }) {
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

// Weather Details Grid
function WeatherDetailsGrid({ weather }: { weather: CurrentWeather }) {
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


// Daily Forecast Component
function DailyForecast({ daily }: { daily: DailyForecastType[] }) {
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

// Sun Times Component
function SunTimes({ sunrise, sunset }: { sunrise: string; sunset: string }) {
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

// Weather Alerts Component
function WeatherAlerts({ alerts }: { alerts: WeatherAlert[] }) {
    const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

    if (alerts.length === 0) return null;

    const getAlertStyles = (type: WeatherAlert['type']) => {
        switch (type) {
            case 'extreme':
                return {
                    bg: 'bg-red-500/20',
                    border: 'border-red-500/50',
                    icon: 'text-red-400',
                    badge: 'bg-red-500 text-white'
                };
            case 'severe':
                return {
                    bg: 'bg-orange-500/20',
                    border: 'border-orange-500/50',
                    icon: 'text-orange-400',
                    badge: 'bg-orange-500 text-white'
                };
            case 'warning':
                return {
                    bg: 'bg-yellow-500/20',
                    border: 'border-yellow-500/50',
                    icon: 'text-yellow-400',
                    badge: 'bg-yellow-500 text-black'
                };
            case 'watch':
            case 'advisory':
                return {
                    bg: 'bg-blue-500/15',
                    border: 'border-blue-500/40',
                    icon: 'text-blue-400',
                    badge: 'bg-blue-500 text-white'
                };
            default:
                return {
                    bg: 'bg-white/10',
                    border: 'border-white/20',
                    icon: 'text-gray-400',
                    badge: 'bg-gray-500 text-white'
                };
        }
    };

    const formatExpiry = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffHours = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60));

        if (diffHours < 1) return 'Expires soon';
        if (diffHours < 24) return `Expires in ${diffHours}h`;
        return `Expires ${date.toLocaleDateString()}`;
    };

    return (
        <GlassContainer className="p-4 rounded-xl" border material="thin">
            <div className="flex items-center gap-2 mb-3">
                <Bell size={18} className="text-yellow-400" />
                <h3 className="text-sm font-semibold text-primary">Weather Alerts</h3>
                <span className="ml-auto px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">
                    {alerts.length} active
                </span>
            </div>
            <div className="space-y-2">
                {alerts.map((alert) => {
                    const styles = getAlertStyles(alert.type);
                    const isExpanded = expandedAlert === alert.id;

                    return (
                        <div
                            key={alert.id}
                            className={cn(
                                "rounded-lg border transition-all cursor-pointer",
                                styles.bg,
                                styles.border
                            )}
                            onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                        >
                            <div className="p-3">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle size={18} className={cn("flex-shrink-0 mt-0.5", styles.icon)} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold uppercase", styles.badge)}>
                                                {alert.type}
                                            </span>
                                            <span className="text-xs text-secondary">{formatExpiry(alert.expires)}</span>
                                        </div>
                                        <h4 className="text-sm font-medium text-primary truncate">
                                            {alert.event}
                                        </h4>
                                        <p className={cn(
                                            "text-xs text-secondary mt-1",
                                            !isExpanded && "line-clamp-2"
                                        )}>
                                            {alert.headline}
                                        </p>

                                        {isExpanded && (
                                            <div className="mt-3 pt-3 border-t border-white/10">
                                                {alert.description && (
                                                    <p className="text-xs text-secondary mb-2">
                                                        {alert.description}
                                                    </p>
                                                )}
                                                {alert.instruction && (
                                                    <div className="p-2 rounded bg-white/5">
                                                        <p className="text-xs text-primary font-medium mb-1">What to do:</p>
                                                        <p className="text-xs text-secondary">{alert.instruction}</p>
                                                    </div>
                                                )}
                                                <p className="text-[10px] text-tertiary mt-2">
                                                    Source: {alert.sender}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <ChevronRight
                                        size={16}
                                        className={cn(
                                            "flex-shrink-0 text-secondary transition-transform",
                                            isExpanded && "rotate-90"
                                        )}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </GlassContainer>
    );
}

// Enhanced Hourly Timeline with Interactive Scrubbing
function EnhancedHourlyTimeline({ hourly }: { hourly: HourlyForecastType[] }) {
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

// Activity Recommendations Component
function ActivityRecommendations({ recommendations }: { recommendations: ActivityRecommendation[] }) {
    if (!recommendations || recommendations.length === 0) return null;

    const getCategoryIcon = (category: ActivityRecommendation['category']) => {
        switch (category) {
            case 'outdoor': return Mountain;
            case 'exercise': return Bike;
            case 'social': return UtensilsCrossed;
            case 'indoor': return Coffee;
            case 'relaxation': return Star;
            default: return Activity;
        }
    };

    const getSuitabilityColor = (suitability: ActivityRecommendation['suitability']) => {
        switch (suitability) {
            case 'perfect': return 'text-green-400 bg-green-500/20';
            case 'good': return 'text-blue-400 bg-blue-500/20';
            case 'okay': return 'text-yellow-400 bg-yellow-500/20';
            case 'poor': return 'text-red-400 bg-red-500/20';
        }
    };

    return (
        <GlassContainer className="p-4 rounded-xl" border material="thin">
            <div className="flex items-center gap-2 mb-3">
                <Activity size={18} className="text-green-400" />
                <h3 className="text-sm font-semibold text-primary">Activity Suggestions</h3>
            </div>
            <div className="space-y-2">
                {recommendations.slice(0, 4).map((rec) => {
                    const Icon = getCategoryIcon(rec.category);
                    return (
                        <div
                            key={rec.id}
                            className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-white/10">
                                    <Icon size={16} className="text-secondary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="text-sm font-medium text-primary">{rec.activity}</h4>
                                        <span className={cn(
                                            "px-1.5 py-0.5 rounded text-[10px] font-medium capitalize",
                                            getSuitabilityColor(rec.suitability)
                                        )}>
                                            {rec.suitability}
                                        </span>
                                    </div>
                                    <p className="text-xs text-secondary">{rec.reason}</p>
                                    {rec.timeWindow && (
                                        <p className="text-[10px] text-accent-primary mt-1">{rec.timeWindow}</p>
                                    )}
                                    {rec.tips && rec.tips.length > 0 && (
                                        <p className="text-[10px] text-tertiary mt-1">
                                            Tip: {rec.tips[0]}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </GlassContainer>
    );
}

// Location Search Component
function LocationSearch({
    onSearch,
    isLoading
}: {
    onSearch: (query: string) => void;
    isLoading: boolean;
}) {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query.trim());
            setQuery('');
            setIsOpen(false);
        }
    };

    const popularCities = ['New York', 'Tokyo', 'Paris', 'Sydney', 'Dubai'];

    return (
        <div className="relative">
            {!isOpen ? (
                <button
                    onClick={() => {
                        setIsOpen(true);
                        setTimeout(() => inputRef.current?.focus(), 100);
                    }}
                    className="p-1.5 rounded-full bg-white/5 text-secondary hover:bg-white/10 transition-colors"
                >
                    <Search size={16} />
                </button>
            ) : (
                <div className="absolute right-0 top-0 z-20">
                    <GlassContainer className="p-3 rounded-xl min-w-[280px]" border>
                        <form onSubmit={handleSubmit}>
                            <div className="flex items-center gap-2 mb-3">
                                <Search size={16} className="text-secondary" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search city..."
                                    className="flex-1 bg-transparent text-sm text-primary placeholder-secondary outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 rounded hover:bg-white/10"
                                >
                                    <X size={14} className="text-secondary" />
                                </button>
                            </div>
                        </form>
                        <div className="border-t border-white/10 pt-2">
                            <p className="text-[10px] text-tertiary mb-2">Popular cities</p>
                            <div className="flex flex-wrap gap-1">
                                {popularCities.map(city => (
                                    <button
                                        key={city}
                                        onClick={() => {
                                            onSearch(city);
                                            setIsOpen(false);
                                        }}
                                        disabled={isLoading}
                                        className="px-2 py-1 rounded-full bg-white/5 text-xs text-secondary hover:bg-white/10 transition-colors"
                                    >
                                        {city}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </GlassContainer>
                </div>
            )}
        </div>
    );
}

// Location Chip Component
function LocationChip({
    name,
    isSelected,
    onClick,
}: {
    name: string;
    isSelected: boolean;
    onClick: () => void;
    onRemove?: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                isSelected
                    ? "bg-accent-primary/20 text-accent-primary border border-accent-primary/30"
                    : "bg-white/5 text-secondary hover:bg-white/10 border border-transparent"
            )}
        >
            <MapPin size={14} />
            {name}
        </button>
    );
}

// Inner component with hooks
function WeatherContent() {
    const [weatherData, setWeatherData] = useState<WeatherUpdate | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId] = useState(() => uuidv4());

    // Use ref to ensure callback stability across React Strict Mode double-renders
    const setWeatherDataRef = useRef(setWeatherData);
    setWeatherDataRef.current = setWeatherData;

    // Create A2A service with stable callback via ref
    const agentService = useMemo(
        () => new AuroraWeatherService(sessionId, (data: WeatherUpdate) => {
            setWeatherDataRef.current(data);
        }),
        [sessionId]
    );

    // Initial load - fetch weather for default location (London)
    useEffect(() => {
        const initWeather = async () => {
            setIsLoading(true);
            try {
                await agentService.sendMessage('Weather in London');
            } finally {
                setIsLoading(false);
            }
        };
        initWeather();
    }, [agentService]);

    const handleRefresh = async () => {
        setIsLoading(true);
        try {
            await agentService.sendMessage('Refresh the weather data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectLocation = async (locationId: string) => {
        const location = weatherData?.locations.find(l => l.id === locationId);
        if (location) {
            setIsLoading(true);
            try {
                await agentService.sendMessage(`Show weather for ${location.name}`);
            } finally {
                setIsLoading(false);
            }
        }
    };

    // Get current weather data
    const currentLocationId = weatherData?.selectedLocationId;
    const currentWeatherData = currentLocationId
        ? weatherData?.weatherData[currentLocationId]
        : null;

    // Handler for location search
    const handleAddLocation = async (cityName: string) => {
        setIsLoading(true);
        try {
            await agentService.sendMessage(`Add ${cityName}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Handler for geolocation
    const handleGeolocation = async (lat: number, lng: number) => {
        setIsLoading(true);
        try {
            // Use reverse geocoding query
            await agentService.sendMessage(`Weather at coordinates ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Handler to fetch activity recommendations
    const handleGetActivities = async () => {
        setIsLoading(true);
        try {
            await agentService.sendMessage('What activities are good for today?');
        } finally {
            setIsLoading(false);
        }
    };

    // Skeleton Loading State
    if (!weatherData || !currentWeatherData) {
        return (
            <div className="h-full flex flex-col">
                {/* Location Pills Skeleton */}
                <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
                    <SkeletonPulse className="w-24 h-8 rounded-full" />
                    <SkeletonPulse className="w-20 h-8 rounded-full" />
                    <SkeletonPulse className="w-8 h-8 rounded-full ml-auto" />
                </div>

                {/* Main Content Grid Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-auto">
                    {/* Left Column */}
                    <div className="space-y-4">
                        <WeatherHeroSkeleton />
                        <WeatherDetailsSkeleton />
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                        <HourlyForecastSkeleton />
                        <DailyForecastSkeleton />
                    </div>
                </div>
            </div>
        );
    }

    const { current, hourly, daily, location, alerts } = currentWeatherData;
    const activityRecommendations = weatherData.activityRecommendations;

    return (
        <div className="h-full flex flex-col">
            {/* Location Pills */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
                {weatherData.locations.map((loc) => (
                    <LocationChip
                        key={loc.id}
                        name={loc.name}
                        isSelected={loc.id === currentLocationId}
                        onClick={() => handleSelectLocation(loc.id)}
                    />
                ))}
                <button
                    className="p-1.5 rounded-full bg-white/5 text-secondary hover:bg-white/10 transition-colors"
                    onClick={() => agentService.sendMessage('Add a location')}
                >
                    <Plus size={16} />
                </button>
                <LocationSearch onSearch={handleAddLocation} isLoading={isLoading} />
                <GeolocationButton onLocationFound={handleGeolocation} isLoading={isLoading} />
                <button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className={cn(
                        "p-1.5 rounded-full bg-white/5 text-secondary hover:bg-white/10 transition-colors ml-auto",
                        isLoading && "animate-spin"
                    )}
                >
                    <RefreshCw size={16} />
                </button>
            </div>

            {/* Weather Alerts Banner (if any severe/extreme) */}
            {alerts && alerts.some(a => a.type === 'severe' || a.type === 'extreme') && (
                <div className="mb-4">
                    <WeatherAlerts alerts={alerts.filter(a => a.type === 'severe' || a.type === 'extreme')} />
                </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-auto">
                {/* Left Column */}
                <div className="space-y-4">
                    {/* Quick Glance Summary - answers "What's happening? What's next? What should I do?" */}
                    <QuickGlanceSummary weather={current} hourly={hourly} location={location.name} />

                    <WeatherHero weather={current} location={location.name} />
                    <WeatherDetailsGrid weather={current} />

                    {/* Air Quality Card (if available) */}
                    {current.airQuality && (
                        <AirQualityCard airQuality={current.airQuality} />
                    )}

                    {daily.length > 0 && (
                        <SunTimes sunrise={daily[0].sunrise} sunset={daily[0].sunset} />
                    )}
                    {/* Activity Suggestions or button to get them */}
                    {activityRecommendations && activityRecommendations.length > 0 ? (
                        <ActivityRecommendations recommendations={activityRecommendations} />
                    ) : (
                        <GlassContainer className="p-4 rounded-xl" border material="thin">
                            <button
                                onClick={handleGetActivities}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm text-secondary"
                            >
                                <Activity size={16} />
                                Get Activity Suggestions
                            </button>
                        </GlassContainer>
                    )}
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                    {/* Enhanced Hourly Timeline (Phase 2) */}
                    <EnhancedHourlyTimeline hourly={hourly} />
                    <DailyForecast daily={daily} />
                    {/* All Weather Alerts (including minor ones) */}
                    {alerts && alerts.length > 0 && (
                        <WeatherAlerts alerts={alerts} />
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AuroraWeatherDemo() {
    const navigate = useNavigate();

    return (
        <LiquidProvider client={liquidClient}>
            <div className="h-screen bg-glass-base flex overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden relative">
                    {/* Background decoration - sky gradient */}
                    <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-sky-500/5 via-blue-500/3 to-transparent pointer-events-none" />

                    {/* Header */}
                    <header className="p-6 pb-4 z-10">
                        <GlassBreadcrumb
                            className="mb-4"
                            items={[
                                { label: 'Home', href: '/' },
                                { label: 'AG-UI Demos', href: '/showcase#agui' },
                                { label: 'Aurora Weather', isActive: true }
                            ]}
                        />
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                                <Cloud size={24} />
                            </div>
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-white">
                                    AURORA Weather
                                </h1>
                                <p className="text-sm text-white/50">
                                    Liquid Glass weather experience with material reactivity
                                </p>
                            </div>
                            <GlassButton
                                size="sm"
                                variant="secondary"
                                onClick={() => navigate('/docs/aurora-weather')}
                            >
                                <Book size={16} className="mr-2" />
                                Documentation
                            </GlassButton>
                        </div>
                    </header>

                    {/* Weather Dashboard */}
                    <main className="flex-1 p-6 pt-0 overflow-hidden">
                        <WeatherContent />
                    </main>
                </div>

                {/* Sidebar */}
                <AgSidebar />
            </div>
        </LiquidProvider>
    );
}
