/**
 * Routes to Watch
 * 
 * List of flexible routes awaiting optimal weather conditions.
 * Users define origin/destination with flexible dates, and the app
 * recommends when weather is best for the journey.
 */
import React, { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
    Route,
    Eye,
    Calendar,
    Thermometer,
    Cloud,
    Sun,
    CloudRain,
    Clock,
    MapPin,
    ArrowRight,
    Bell,
    Plus,
    ChevronRight,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { GlassContainer, GlassButton } from '@/components';
import {
    useAuroraTravelStore,
    type RouteToWatch,
    type WeatherWindow,
} from '@/stores/auroraTravelStore';

// ============================================================================
// Weather Window Card
// ============================================================================

interface WeatherWindowCardProps {
    window: WeatherWindow;
    onBook?: () => void;
}

const WeatherWindowCard: React.FC<WeatherWindowCardProps> = ({ window, onBook }) => {
    const formatTime = (isoStr: string) => {
        const date = new Date(isoStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
        });
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-400';
        if (score >= 60) return 'text-yellow-400';
        return 'text-orange-400';
    };

    const getScoreIcon = (score: number) => {
        if (score >= 80) return Sun;
        if (score >= 60) return Cloud;
        return CloudRain;
    };

    const ScoreIcon = getScoreIcon(window.weatherScore);

    return (
        <div className="p-3 rounded-lg bg-[var(--glass-bg-subtle)] border border-[var(--glass-border)]">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={cn('p-2 rounded-lg bg-white/5', getScoreColor(window.weatherScore))}>
                        <ScoreIcon size={18} />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-primary">
                            {formatTime(window.departureTime)}
                        </div>
                        <div className="text-xs text-tertiary">
                            {window.summary}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className={cn('text-lg font-bold', getScoreColor(window.weatherScore))}>
                        {window.weatherScore}%
                    </div>
                    {onBook && (
                        <GlassButton variant="primary" size="sm" onClick={onBook}>
                            Book
                        </GlassButton>
                    )}
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// Route Watch Card
// ============================================================================

interface RouteWatchCardProps {
    route: RouteToWatch;
    onViewDetails?: () => void;
    onBookWindow?: (windowIndex: number) => void;
}

const RouteWatchCard: React.FC<RouteWatchCardProps> = ({
    route,
    onViewDetails,
    onBookWindow,
}) => {
    const formatDateRange = (start: string, end: string) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const startStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `${startStr} - ${endStr}`;
    };

    const hasRecommendations = route.recommendedWindows && route.recommendedWindows.length > 0;
    const isRecommended = route.status === 'recommended';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group"
        >
            <GlassContainer className="p-4" border>
                {/* Status Badge */}
                {isRecommended && (
                    <div className="flex items-center gap-1 text-green-400 text-xs font-medium mb-3">
                        <CheckCircle2 size={14} />
                        <span>Good weather window available!</span>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <h4 className="text-sm font-semibold text-primary">{route.name}</h4>
                        <div className="flex items-center gap-1 text-xs text-secondary mt-1">
                            <MapPin size={12} className="text-tertiary" />
                            <span>{route.origin.name}</span>
                            <ArrowRight size={10} className="text-tertiary" />
                            <span>{route.destination.name}</span>
                        </div>
                    </div>
                    <div className={cn(
                        'flex items-center gap-1 px-2 py-1 rounded-full text-xs',
                        isRecommended
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-sky-500/20 text-sky-400'
                    )}>
                        <Eye size={12} />
                        <span>{isRecommended ? 'Ready' : 'Watching'}</span>
                    </div>
                </div>

                {/* Flexibility Info */}
                <div className="flex items-center gap-4 text-xs text-tertiary mb-3">
                    <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>{formatDateRange(route.flexibility.dateRange.start, route.flexibility.dateRange.end)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Thermometer size={12} />
                        <span>Max {route.weatherCriteria.maxPrecipProbability}% rain</span>
                    </div>
                </div>

                {/* Weather Windows (if recommended) */}
                {hasRecommendations && (
                    <div className="space-y-2 mb-3">
                        <div className="text-xs font-medium text-secondary">Best times to go:</div>
                        {route.recommendedWindows!.slice(0, 2).map((window, idx) => (
                            <WeatherWindowCard
                                key={idx}
                                window={window}
                                onBook={() => onBookWindow?.(idx)}
                            />
                        ))}
                        {route.recommendedWindows!.length > 2 && (
                            <button
                                onClick={onViewDetails}
                                className="text-xs text-[var(--glass-accent)] hover:underline"
                            >
                                +{route.recommendedWindows!.length - 2} more options
                            </button>
                        )}
                    </div>
                )}

                {/* No Recommendations Yet */}
                {!hasRecommendations && route.status === 'watching' && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--glass-bg-subtle)] text-sm text-secondary">
                        <AlertCircle size={16} className="text-tertiary" />
                        <span>Waiting for optimal weather conditions...</span>
                    </div>
                )}

                {/* Last Checked */}
                {route.lastChecked && (
                    <div className="flex items-center gap-1 text-xs text-tertiary mt-3">
                        <Clock size={10} />
                        <span>
                            Last checked: {new Date(route.lastChecked).toLocaleTimeString()}
                        </span>
                    </div>
                )}
            </GlassContainer>
        </motion.div>
    );
};

// ============================================================================
// Main Component
// ============================================================================

export interface RoutesToWatchProps {
    onAddRoute?: () => void;
    onViewRoute?: (routeId: string) => void;
    onBookWindow?: (routeId: string, windowIndex: number) => void;
}

export const RoutesToWatch: React.FC<RoutesToWatchProps> = ({
    onAddRoute,
    onViewRoute,
    onBookWindow,
}) => {
    // Select raw data with useShallow for stable reference
    const routesToWatch = useAuroraTravelStore(
        useShallow((state) => state.routesToWatch)
    );

    // Compute derived values with useMemo for stable references
    const recommendedRoutes = useMemo(
        () => routesToWatch.filter(r => r.status === 'recommended'),
        [routesToWatch]
    );

    const watchingRoutes = useMemo(
        () => routesToWatch.filter(r => r.status === 'watching'),
        [routesToWatch]
    );

    const allRoutes = useMemo(
        () => [...recommendedRoutes, ...watchingRoutes],
        [recommendedRoutes, watchingRoutes]
    );

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Route size={18} className="text-sky-400" />
                    <h3 className="text-sm font-semibold text-primary">Routes to Watch</h3>
                    {recommendedRoutes.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                            {recommendedRoutes.length} ready
                        </span>
                    )}
                </div>
                <GlassButton variant="ghost" size="sm" onClick={onAddRoute}>
                    <Plus size={14} className="mr-1" />
                    Add Route
                </GlassButton>
            </div>

            {/* Empty State */}
            {allRoutes.length === 0 && (
                <GlassContainer className="p-8 text-center" border>
                    <Route size={40} className="mx-auto mb-3 text-tertiary opacity-50" />
                    <p className="text-sm text-secondary mb-2">No routes being watched</p>
                    <p className="text-xs text-tertiary mb-4">
                        Add a flexible route and we'll notify you when weather is perfect
                    </p>
                    <GlassButton variant="primary" size="sm" onClick={onAddRoute}>
                        <Plus size={14} className="mr-1" />
                        Add Your First Route
                    </GlassButton>
                </GlassContainer>
            )}

            {/* Route Cards */}
            {allRoutes.map((route) => (
                <RouteWatchCard
                    key={route.id}
                    route={route}
                    onViewDetails={() => onViewRoute?.(route.id)}
                    onBookWindow={(idx) => onBookWindow?.(route.id, idx)}
                />
            ))}
        </div>
    );
};

export default RoutesToWatch;
