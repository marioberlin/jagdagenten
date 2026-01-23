/**
 * Trip Detail Sheet
 * 
 * Full-screen modal showing complete trip details with weather per destination.
 * Supports viewing, editing, and deleting trips.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Calendar,
    MapPin,
    Sun,
    Cloud,
    CloudRain,
    CloudSnow,
    Pencil,
    Trash2,
    ChevronDown,
    ChevronUp,
    Navigation,
    Clock,
    AlertTriangle,
    Package,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassContainer, GlassButton } from '@/components';
import { useAuroraTravelStore, type Trip, type TripDestination, type WeatherCondition } from '@/stores/auroraTravelStore';
import { DestinationCard } from './DestinationCard';

// ============================================================================
// Types
// ============================================================================

export interface TripDetailSheetProps {
    trip: Trip;
    onClose: () => void;
    onEdit: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

const formatDate = (dateStr?: string): string => {
    if (!dateStr) return 'Flexible';
    return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });
};

const getWeatherScore = (trip: Trip): { score: number; label: string; color: string } => {
    // Calculate based on trip weather data (mock for now)
    const score = trip.weatherScore ?? 75;
    if (score >= 80) return { score, label: 'Excellent', color: 'text-green-400' };
    if (score >= 60) return { score, label: 'Good', color: 'text-yellow-400' };
    if (score >= 40) return { score, label: 'Fair', color: 'text-orange-400' };
    return { score, label: 'Poor', color: 'text-red-400' };
};

const getTripDuration = (trip: Trip): string => {
    if (!trip.departureDate || !trip.returnDate) return 'Open dates';
    const start = new Date(trip.departureDate);
    const end = new Date(trip.returnDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return `${days} day${days !== 1 ? 's' : ''}`;
};

// Mock conditions
const MOCK_CONDITIONS: WeatherCondition[] = ['clear', 'partly_cloudy', 'cloudy'];

// ============================================================================
// Header Section
// ============================================================================

interface TripHeaderProps {
    trip: Trip;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

const TripHeader: React.FC<TripHeaderProps> = ({ trip, onClose, onEdit, onDelete }) => {
    const weather = getWeatherScore(trip);

    return (
        <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
                <h2 className="text-xl font-semibold text-primary mb-1">{trip.name}</h2>
                <div className="flex items-center gap-4 text-sm text-secondary">
                    <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(trip.departureDate)} - {formatDate(trip.returnDate)}
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {getTripDuration(trip)}
                    </span>
                </div>
                {trip.description && (
                    <p className="text-sm text-tertiary mt-2">{trip.description}</p>
                )}
            </div>

            {/* Weather Score Badge */}
            <div className="flex items-center gap-3">
                <div className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg',
                    'bg-[var(--glass-bg-subtle)] border border-[var(--glass-border)]'
                )}>
                    <Sun size={20} className={weather.color} />
                    <div className="text-right">
                        <div className={cn('text-lg font-bold', weather.color)}>{weather.score}</div>
                        <div className="text-xs text-tertiary">{weather.label}</div>
                    </div>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-white/10 text-tertiary hover:text-primary transition-colors"
                >
                    <X size={24} />
                </button>
            </div>
        </div>
    );
};

// ============================================================================
// Itinerary Section
// ============================================================================

interface ItinerarySectionProps {
    destinations: TripDestination[];
}

const ItinerarySection: React.FC<ItinerarySectionProps> = ({ destinations }) => (
    <div className="space-y-3">
        <h3 className="text-sm font-semibold text-secondary flex items-center gap-2">
            <Navigation size={14} />
            Itinerary ({destinations.length} stops)
        </h3>

        <div className="space-y-2">
            {destinations.map((dest, index) => (
                <DestinationCard
                    key={dest.id}
                    destination={dest}
                    position={dest.position}
                    totalDestinations={destinations.length}
                    // Mock weather data - in production would come from store
                    weather={{
                        temperature: 20 + Math.floor(Math.random() * 8),
                        condition: MOCK_CONDITIONS[index % 3],
                        precipProbability: Math.floor(Math.random() * 30),
                        summary: MOCK_CONDITIONS[index % 3] === 'clear' ? 'Sunny' : MOCK_CONDITIONS[index % 3] === 'partly_cloudy' ? 'Partly cloudy' : 'Cloudy',
                    }}
                />
            ))}
        </div>
    </div>
);

// ============================================================================
// Weather Alerts Section
// ============================================================================

interface WeatherAlertsProps {
    alerts: Array<{ type: string; message: string }>;
}

const WeatherAlertsSection: React.FC<WeatherAlertsProps> = ({ alerts }) => {
    if (alerts.length === 0) return null;

    return (
        <GlassContainer className="p-4" border>
            <h3 className="text-sm font-semibold text-secondary flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-amber-400" />
                Weather Alerts
            </h3>
            <div className="space-y-2">
                {alerts.map((alert, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-amber-400">•</span>
                        <span className="text-secondary">{alert.message}</span>
                    </div>
                ))}
            </div>
        </GlassContainer>
    );
};

// ============================================================================
// Quick Actions
// ============================================================================

interface QuickActionsProps {
    onEdit: () => void;
    onDelete: () => void;
    onPackingList: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onEdit, onDelete, onPackingList }) => (
    <div className="flex items-center gap-2 pt-4 border-t border-[var(--glass-border)]">
        <GlassButton variant="primary" onClick={onPackingList}>
            <Package size={16} className="mr-1" />
            Packing List
        </GlassButton>
        <GlassButton variant="ghost" onClick={onEdit}>
            <Pencil size={16} className="mr-1" />
            Edit Trip
        </GlassButton>
        <GlassButton variant="ghost" onClick={onDelete} className="text-red-400 hover:text-red-300">
            <Trash2 size={16} className="mr-1" />
            Delete
        </GlassButton>
    </div>
);

// ============================================================================
// Main Component
// ============================================================================

export const TripDetailSheet: React.FC<TripDetailSheetProps> = ({
    trip,
    onClose,
    onEdit,
}) => {
    const deleteTrip = useAuroraTravelStore(state => state.deleteTrip);
    const [showPackingList, setShowPackingList] = useState(false);

    const handleDelete = () => {
        if (confirm(`Delete "${trip.name}"? This cannot be undone.`)) {
            deleteTrip(trip.id);
            onClose();
        }
    };

    // Mock alerts
    const alerts = trip.destinations.length > 2 ? [
        { type: 'info', message: `Rain expected in ${trip.destinations[1]?.place.name || 'destination 2'} on departure day` },
    ] : [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Sheet */}
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto"
            >
                <GlassContainer className="p-6" border>
                    {/* Header */}
                    <TripHeader
                        trip={trip}
                        onClose={onClose}
                        onEdit={onEdit}
                        onDelete={handleDelete}
                    />

                    {/* Content */}
                    <div className="space-y-6">
                        {/* Itinerary */}
                        <ItinerarySection destinations={trip.destinations} />

                        {/* Weather Alerts */}
                        <WeatherAlertsSection alerts={alerts} />

                        {/* Trip Stats */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 rounded-lg bg-[var(--glass-bg-subtle)] text-center">
                                <div className="text-lg font-bold text-primary">{trip.destinations.length}</div>
                                <div className="text-xs text-tertiary">Stops</div>
                            </div>
                            <div className="p-3 rounded-lg bg-[var(--glass-bg-subtle)] text-center">
                                <div className="text-lg font-bold text-primary">{getTripDuration(trip)}</div>
                                <div className="text-xs text-tertiary">Duration</div>
                            </div>
                            <div className="p-3 rounded-lg bg-[var(--glass-bg-subtle)] text-center">
                                <div className={cn('text-lg font-bold', getWeatherScore(trip).color)}>
                                    {getWeatherScore(trip).label}
                                </div>
                                <div className="text-xs text-tertiary">Weather</div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <QuickActions
                            onEdit={onEdit}
                            onDelete={handleDelete}
                            onPackingList={() => setShowPackingList(true)}
                        />
                    </div>
                </GlassContainer>
            </motion.div>
        </div>
    );
};

export default TripDetailSheet;
