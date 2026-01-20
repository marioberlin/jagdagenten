import { useNavigate } from 'react-router-dom';
import { useState, useMemo, useEffect, useRef } from 'react';
import { GlassContainer, GlassButton } from '@/components';
import { AgSidebar } from '../../components/generative/AgSidebar';
import { LiquidClient } from '../../liquid-engine/client';
import { LiquidProvider } from '../../liquid-engine/react';
import { Cloud, Book, Plus, RefreshCw, Activity } from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassBreadcrumb } from '../../components/layout/GlassBreadcrumb';
import { AuroraWeatherService, WeatherUpdate } from '../../services/a2a/AuroraWeatherService';
import { v4 as uuidv4 } from 'uuid';

// Imported Extracted Components
import { WeatherHero, WeatherHeroSkeleton } from '@/components/features/weather/WeatherHero';
import { WeatherDetailsGrid, WeatherDetailsSkeleton } from '@/components/features/weather/WeatherDetails';
import { EnhancedHourlyTimeline, HourlyForecastSkeleton, DailyForecast, DailyForecastSkeleton, SunTimes } from '@/components/features/weather/Forecasts';
import { WeatherAlerts } from '@/components/features/weather/WeatherAlerts';
import { AirQualityCard } from '@/components/features/weather/AirQuality';
import { ActivityRecommendations } from '@/components/features/weather/ActivityRecommendations';
import { QuickGlanceSummary } from '@/components/features/weather/QuickGlance';
import { LocationSearch, LocationChip, GeolocationButton } from '@/components/features/weather/LocationControls';
import { SkeletonPulse } from '@/components/features/weather/WeatherUtils';

// Initialize the engine client
const liquidClient = new LiquidClient();

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
                    {/* Quick Glance Summary */}
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
                    {/* Enhanced Hourly Timeline */}
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
