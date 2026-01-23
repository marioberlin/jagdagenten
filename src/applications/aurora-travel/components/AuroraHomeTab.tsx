/**
 * Aurora Home Tab
 * 
 * Weather home screen for Aurora Travel Weather app.
 * Reuses existing weather components from the original AuroraWeatherApp.
 */
import React from 'react';
import { Cloud, RefreshCw } from 'lucide-react';
import type { WeatherUpdate } from '@/services/a2a/AuroraWeatherService';
import { GlassButton } from '@/components';

// Weather Components
import { WeatherHero, WeatherHeroSkeleton } from '@/applications/aurora-weather/components/WeatherHero';
import { WeatherDetailsGrid, WeatherDetailsSkeleton } from '@/applications/aurora-weather/components/WeatherDetails';
import {
    EnhancedHourlyTimeline,
    HourlyForecastSkeleton,
    DailyForecast,
    DailyForecastSkeleton,
    SunTimes
} from '@/applications/aurora-weather/components/Forecasts';
import { WeatherAlerts } from '@/applications/aurora-weather/components/WeatherAlerts';
import { AirQualityCard } from '@/applications/aurora-weather/components/AirQuality';
import { ActivityRecommendations } from '@/applications/aurora-weather/components/ActivityRecommendations';
import { QuickGlanceSummary } from '@/applications/aurora-weather/components/QuickGlance';
import { LocationSearch, LocationChip, GeolocationButton } from '@/applications/aurora-weather/components/LocationControls';
import { SkeletonPulse } from '@/applications/aurora-weather/components/WeatherUtils';

// ============================================================================
// Types
// ============================================================================

export interface AuroraHomeTabProps {
    weatherData: WeatherUpdate | null;
    isLoading: boolean;
    onSelectLocation: (locationId: string) => void;
    onAddLocation: (cityName: string) => void;
    onGeolocation: (lat: number, lng: number) => void;
    onRefresh: () => void;
}

// ============================================================================
// Loading Skeleton
// ============================================================================

export const AuroraHomeTabSkeleton: React.FC = () => (
    <div className="space-y-6">
        {/* Location Chips Skeleton */}
        <div className="flex items-center gap-2">
            <SkeletonPulse className="w-24 h-8 rounded-full" />
            <SkeletonPulse className="w-20 h-8 rounded-full" />
            <SkeletonPulse className="w-28 h-8 rounded-full" />
        </div>

        {/* Main Grid Skeleton */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
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
);

// ============================================================================
// Component
// ============================================================================

export const AuroraHomeTab: React.FC<AuroraHomeTabProps> = ({
    weatherData,
    isLoading,
    onSelectLocation,
    onAddLocation,
    onGeolocation,
    onRefresh,
}) => {
    // Loading state
    if (!weatherData) {
        return <AuroraHomeTabSkeleton />;
    }

    // Derived state
    const currentLocationId = weatherData.selectedLocationId;
    const currentWeatherData = currentLocationId
        ? weatherData.weatherData[currentLocationId]
        : null;

    if (!currentWeatherData) {
        return <AuroraHomeTabSkeleton />;
    }

    const { current, hourly, daily, location, alerts } = currentWeatherData;
    const activityRecommendations = weatherData.activityRecommendations;

    return (
        <div className="space-y-6">
            {/* Header Controls (Location) */}
            <div className="flex items-center gap-2 flex-wrap">
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 mr-2">
                    <Cloud size={20} />
                </div>

                {weatherData.locations.map((loc) => (
                    <LocationChip
                        key={loc.id}
                        name={loc.name}
                        isSelected={loc.id === currentLocationId}
                        onClick={() => onSelectLocation(loc.id)}
                    />
                ))}

                <LocationSearch onSearch={onAddLocation} isLoading={isLoading} />
                <GeolocationButton onLocationFound={onGeolocation} isLoading={isLoading} />

                <GlassButton
                    variant="ghost"
                    size="sm"
                    onClick={onRefresh}
                    disabled={isLoading}
                    className="ml-auto"
                >
                    <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                </GlassButton>
            </div>

            {/* Alerts Banner (Severe only) */}
            {alerts && alerts.some(a => a.type === 'severe' || a.type === 'extreme') && (
                <WeatherAlerts alerts={alerts.filter(a => a.type === 'severe' || a.type === 'extreme')} />
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
    );
};

export default AuroraHomeTab;
