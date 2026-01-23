/**
 * Destination Card
 * 
 * Individual destination item within a trip showing location, weather, and timing.
 */
import React from 'react';
import {
    Calendar,
    Clock,
    Car,
    Sun,
    Cloud,
    CloudRain,
    CloudSnow,
    GripVertical,
    MoreVertical,
    Trash2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { GlassContainer } from '@/components';
import type { TripDestination, WeatherCondition } from '@/stores/auroraTravelStore';

// ============================================================================
// Weather Icon Mapper
// ============================================================================

const getWeatherIcon = (condition?: WeatherCondition): React.ElementType => {
    if (!condition) return Cloud;

    switch (condition) {
        case 'clear':
        case 'partly_cloudy':
            return Sun;
        case 'cloudy':
        case 'fog':
            return Cloud;
        case 'rain':
        case 'heavy_rain':
        case 'drizzle':
        case 'freezing_rain':
            return CloudRain;
        case 'snow':
        case 'heavy_snow':
            return CloudSnow;
        case 'thunderstorm':
            return CloudRain;
        default:
            return Cloud;
    }
};

// ============================================================================
// Types
// ============================================================================

export interface DestinationWeather {
    condition: WeatherCondition;
    temperature: number;
    summary: string;
    precipProbability?: number;
}

export interface DestinationCardProps {
    destination: TripDestination;
    weather?: DestinationWeather;
    isFirst?: boolean;
    isLast?: boolean;
    showDragHandle?: boolean;
    onRemove?: () => void;
    onEdit?: () => void;
    onClick?: () => void;
}

// ============================================================================
// Drive Time Connector
// ============================================================================

interface DriveTimeConnectorProps {
    driveTime?: number;
    distance?: number;
}

const DriveTimeConnector: React.FC<DriveTimeConnectorProps> = ({ driveTime, distance }) => {
    if (!driveTime && !distance) return null;

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours === 0) return `${mins}m`;
        return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
    };

    return (
        <div className="flex items-center gap-2 py-2 pl-6">
            <div className="w-0.5 h-8 bg-[var(--glass-border)]" />
            <div className="flex items-center gap-1 text-xs text-tertiary">
                <Car size={12} />
                {driveTime && <span>{formatDuration(driveTime)}</span>}
                {driveTime && distance && <span>·</span>}
                {distance && <span>{distance} km</span>}
            </div>
        </div>
    );
};

// ============================================================================
// Component
// ============================================================================

export const DestinationCard: React.FC<DestinationCardProps> = ({
    destination,
    weather,
    isFirst = false,
    isLast: _isLast = false,
    showDragHandle = false,
    onRemove,
    onEdit,
    onClick: _onClick,
}) => {
    const WeatherIcon = weather ? getWeatherIcon(weather.condition) : Cloud;

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="group">
            {/* Drive Time Connector (not for first destination) */}
            {!isFirst && (
                <DriveTimeConnector
                    driveTime={destination.driveTimeFromPrevious}
                    distance={destination.distanceFromPrevious}
                />
            )}

            <motion.div
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.15 }}
            >
                <GlassContainer className="p-4" border>
                    <div className="flex items-start gap-3">
                        {/* Position / Drag Handle */}
                        <div className="flex flex-col items-center gap-1 pt-1">
                            {showDragHandle ? (
                                <button className="cursor-grab active:cursor-grabbing text-tertiary hover:text-secondary">
                                    <GripVertical size={16} />
                                </button>
                            ) : (
                                <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-xs font-semibold">
                                    {destination.position}
                                </div>
                            )}
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                            {/* Location Header */}
                            <div className="flex items-start justify-between">
                                <div>
                                    <h4 className="text-sm font-semibold text-primary">
                                        {destination.place.name}
                                    </h4>
                                    {(destination.place.addressRegion || destination.place.addressCountry) && (
                                        <p className="text-xs text-tertiary">
                                            {[destination.place.addressRegion, destination.place.addressCountry]
                                                .filter(Boolean)
                                                .join(', ')}
                                        </p>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {onRemove && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRemove();
                                            }}
                                            className="p-1 rounded-md hover:bg-red-500/20 text-tertiary hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit?.();
                                        }}
                                        className="p-1 rounded-md hover:bg-white/10 text-tertiary hover:text-secondary transition-colors"
                                    >
                                        <MoreVertical size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Dates */}
                            {(destination.arrivalDate || destination.stayDuration) && (
                                <div className="flex items-center gap-3 mt-2 text-xs text-secondary">
                                    {destination.arrivalDate && (
                                        <div className="flex items-center gap-1">
                                            <Calendar size={12} className="text-tertiary" />
                                            <span>
                                                {formatDate(destination.arrivalDate)}
                                                {destination.departureDate && ` - ${formatDate(destination.departureDate)}`}
                                            </span>
                                        </div>
                                    )}
                                    {destination.stayDuration && (
                                        <div className="flex items-center gap-1">
                                            <Clock size={12} className="text-tertiary" />
                                            <span>{destination.stayDuration}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Weather Summary */}
                            {weather && (
                                <div className="mt-3 p-2 rounded-lg bg-[var(--glass-bg-subtle)]">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-sky-500/10">
                                            <WeatherIcon size={20} className="text-sky-400" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg font-semibold text-primary">
                                                    {weather.temperature}°
                                                </span>
                                                <span className="text-sm text-secondary">
                                                    {weather.summary}
                                                </span>
                                            </div>
                                            {weather.precipProbability !== undefined && weather.precipProbability > 0 && (
                                                <div className="text-xs text-tertiary">
                                                    {weather.precipProbability}% chance of rain
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </GlassContainer>
            </motion.div>
        </div>
    );
};

export default DestinationCard;
