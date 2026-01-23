/**
 * Aurora Weather App
 * 
 * The standalone Glass App for Aurora Weather.
 * Features a windowed 2-column layout with integrated chat.
 */
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AuroraWeatherService, WeatherUpdate } from '@/services/a2a/AuroraWeatherService';
import { Cloud } from 'lucide-react';
import { AuroraWeatherChatInput } from './AuroraWeatherChatInput';

// Imported Feature Components
import { WeatherHero, WeatherHeroSkeleton } from './components/WeatherHero';
import { WeatherDetailsGrid, WeatherDetailsSkeleton } from './components/WeatherDetails';
import { EnhancedHourlyTimeline, HourlyForecastSkeleton, DailyForecast, DailyForecastSkeleton, SunTimes } from './components/Forecasts';
import { WeatherAlerts } from './components/WeatherAlerts';
import { AirQualityCard } from './components/AirQuality';
import { ActivityRecommendations } from './components/ActivityRecommendations';
import { QuickGlanceSummary } from './components/QuickGlance';
import { LocationSearch, LocationChip, GeolocationButton } from './components/LocationControls';
import { SkeletonPulse } from './components/WeatherUtils';

export const AuroraWeatherApp: React.FC = () => {
    const [weatherData, setWeatherData] = useState<WeatherUpdate | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId] = useState(() => uuidv4());

    // Use ref to ensure callback stability
    const setWeatherDataRef = useRef(setWeatherData);
    setWeatherDataRef.current = setWeatherData;

    // Create A2A service
    const agentService = useMemo(
        () => new AuroraWeatherService(sessionId, (data: WeatherUpdate) => {
            setWeatherDataRef.current(data);
        }),
        [sessionId]
    );

    // Initial load
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

    // Handlers
    const handleChat = async (message: string) => {
        setIsLoading(true);
        try {
            await agentService.sendMessage(message);
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

    const handleAddLocation = async (cityName: string) => {
        setIsLoading(true);
        try {
            await agentService.sendMessage(`Add ${cityName}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGeolocation = async (lat: number, lng: number) => {
        setIsLoading(true);
        try {
            await agentService.sendMessage(`Weather at coordinates ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Derived State
    const currentLocationId = weatherData?.selectedLocationId;
    const currentWeatherData = currentLocationId
        ? weatherData?.weatherData[currentLocationId]
        : null;

    // Loading State
    if (!weatherData || !currentWeatherData) {
        return (
            <div className="flex flex-col h-full bg-glass-base rounded-b-xl overflow-hidden relative">
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-sky-900/20 via-blue-900/10 to-transparent pointer-events-none" />

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <SkeletonPulse className="w-24 h-8 rounded-full" />
                        <SkeletonPulse className="w-20 h-8 rounded-full" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <WeatherHeroSkeleton />
                            <WeatherDetailsSkeleton />
                        </div>
                        <div className="space-y-4">
                            <HourlyForecastSkeleton />
                            <DailyForecastSkeleton />
                        </div>
                    </div>
                </div>

                {/* Fixed Chat Input */}
                <div className="z-20">
                    <AuroraWeatherChatInput onSend={handleChat} isLoading={true} />
                </div>
            </div>
        );
    }

    const { current, hourly, daily, location, alerts } = currentWeatherData;
    const activityRecommendations = weatherData.activityRecommendations;

    return (
        <div className="flex flex-col h-full bg-glass-base rounded-b-xl overflow-hidden relative">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-sky-900/20 via-blue-900/10 to-transparent pointer-events-none" />

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">

                {/* Header Controls (Location) */}
                <div className="flex items-center gap-2 mb-6 flex-wrap">
                    <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 mr-2">
                        <Cloud size={20} />
                    </div>

                    {weatherData.locations.map((loc) => (
                        <LocationChip
                            key={loc.id}
                            name={loc.name}
                            isSelected={loc.id === currentLocationId}
                            onClick={() => handleSelectLocation(loc.id)}
                        />
                    ))}
                    <LocationSearch onSearch={handleAddLocation} isLoading={isLoading} />
                    <GeolocationButton onLocationFound={handleGeolocation} isLoading={isLoading} />
                </div>

                {/* Alerts Banner */}
                {alerts && alerts.some(a => a.type === 'severe' || a.type === 'extreme') && (
                    <div className="mb-4">
                        <WeatherAlerts alerts={alerts.filter(a => a.type === 'severe' || a.type === 'extreme')} />
                    </div>
                )}

                {/* Main Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {/* Left Column */}
                    <div className="space-y-4">
                        {/* Quick Glance */}
                        <QuickGlanceSummary weather={current} hourly={hourly} location={location.name} />

                        <WeatherHero weather={current} location={location.name} />
                        <WeatherDetailsGrid weather={current} />

                        {current.airQuality && (
                            <AirQualityCard airQuality={current.airQuality} />
                        )}

                        {daily.length > 0 && (
                            <SunTimes sunrise={daily[0].sunrise} sunset={daily[0].sunset} />
                        )}
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                        <EnhancedHourlyTimeline hourly={hourly} />

                        {activityRecommendations && activityRecommendations.length > 0 && (
                            <ActivityRecommendations recommendations={activityRecommendations} />
                        )}

                        <DailyForecast daily={daily} />

                        {alerts && alerts.length > 0 && (
                            <WeatherAlerts alerts={alerts} />
                        )}
                    </div>
                </div>
            </div>

            {/* Fixed Chat Input */}
            <div className="z-20">
                <AuroraWeatherChatInput onSend={handleChat} isLoading={isLoading} />
            </div>
        </div>
    );
};
