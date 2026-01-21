/**
 * Trip Card
 * 
 * Summary card for a planned trip with weather overview.
 */
import React from 'react';
import {
    Calendar,
    MapPin,
    Cloud,
    Sun,
    CloudRain,
    ThermometerSun,
    Clock,
    ChevronRight,
    MoreVertical,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { GlassContainer } from '@/components';
import type { Trip } from '@/stores/auroraTravelStore';

// ============================================================================
// Weather Score Badge
// ============================================================================

interface WeatherScoreBadgeProps {
    score: number;
}

const WeatherScoreBadge: React.FC<WeatherScoreBadgeProps> = ({ score }) => {
    const getScoreColor = () => {
        if (score >= 80) return 'text-green-400 bg-green-500/20';
        if (score >= 60) return 'text-yellow-400 bg-yellow-500/20';
        if (score >= 40) return 'text-orange-400 bg-orange-500/20';
        return 'text-red-400 bg-red-500/20';
    };

    const getScoreIcon = () => {
        if (score >= 80) return Sun;
        if (score >= 60) return Cloud;
        return CloudRain;
    };

    const Icon = getScoreIcon();

    return (
        <div className={cn('flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', getScoreColor())}>
            <Icon size={12} />
            <span>{score}%</span>
        </div>
    );
};

// ============================================================================
// Types
// ============================================================================

export interface TripCardProps {
    trip: Trip;
    onClick?: () => void;
    onMenuClick?: (e: React.MouseEvent) => void;
    compact?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export const TripCard: React.FC<TripCardProps> = ({
    trip,
    onClick,
    onMenuClick,
    compact = false,
}) => {
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const formatDuration = (minutes?: number) => {
        if (!minutes) return '';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const formatDistance = (km?: number) => {
        if (!km) return '';
        return `${km.toFixed(0)} km`;
    };

    const destinationCount = trip.destinations.length;
    const firstDestination = trip.destinations[0]?.place.name;
    const lastDestination = trip.destinations[destinationCount - 1]?.place.name;

    if (compact) {
        return (
            <motion.button
                onClick={onClick}
                className="w-full text-left"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
            >
                <GlassContainer className="p-3" border>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-sky-500/10">
                                <MapPin size={16} className="text-sky-400" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-primary">{trip.name}</div>
                                <div className="text-xs text-tertiary">
                                    {formatDate(trip.departureDate)} · {destinationCount} stop{destinationCount !== 1 ? 's' : ''}
                                </div>
                            </div>
                        </div>
                        {trip.weatherScore !== undefined && (
                            <WeatherScoreBadge score={trip.weatherScore} />
                        )}
                    </div>
                </GlassContainer>
            </motion.button>
        );
    }

    return (
        <motion.div
            className="group"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
        >
            <GlassContainer className="p-4" border>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                        <h3 className="text-base font-semibold text-primary">{trip.name}</h3>
                        {trip.description && (
                            <p className="text-sm text-secondary mt-0.5 line-clamp-1">{trip.description}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {trip.weatherScore !== undefined && (
                            <WeatherScoreBadge score={trip.weatherScore} />
                        )}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onMenuClick?.(e);
                            }}
                            className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
                        >
                            <MoreVertical size={16} className="text-tertiary" />
                        </button>
                    </div>
                </div>

                {/* Route Preview */}
                <div className="flex items-center gap-2 text-sm text-secondary mb-3">
                    <MapPin size={14} className="text-tertiary" />
                    <span>{firstDestination}</span>
                    {destinationCount > 1 && (
                        <>
                            <span className="text-tertiary">→</span>
                            {destinationCount > 2 && (
                                <span className="text-tertiary">
                                    +{destinationCount - 2} stop{destinationCount > 3 ? 's' : ''}
                                </span>
                            )}
                            {destinationCount > 2 && <span className="text-tertiary">→</span>}
                            <span>{lastDestination}</span>
                        </>
                    )}
                </div>

                {/* Meta Info */}
                <div className="flex items-center gap-4 text-xs text-tertiary">
                    {trip.departureDate && (
                        <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            <span>
                                {formatDate(trip.departureDate)}
                                {trip.returnDate && ` - ${formatDate(trip.returnDate)}`}
                            </span>
                        </div>
                    )}
                    {trip.totalDriveTime && (
                        <div className="flex items-center gap-1">
                            <Clock size={12} />
                            <span>{formatDuration(trip.totalDriveTime)}</span>
                        </div>
                    )}
                    {trip.totalDistance && (
                        <div className="flex items-center gap-1">
                            <ThermometerSun size={12} />
                            <span>{formatDistance(trip.totalDistance)}</span>
                        </div>
                    )}
                </div>

                {/* Action Button */}
                <button
                    onClick={onClick}
                    className="w-full mt-3 flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-secondary hover:text-primary transition-colors"
                >
                    View Trip
                    <ChevronRight size={14} />
                </button>
            </GlassContainer>
        </motion.div>
    );
};

export default TripCard;
