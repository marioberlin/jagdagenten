/**
 * Aurora Trips Tab
 * 
 * Trip listing and Routes-to-Watch management interface.
 */
import React, { useState, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Map,
    Plus,
    Route,
    Plane,
    ChevronRight,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassContainer, GlassButton } from '@/components';
import {
    useAuroraTravelStore,
    type Trip,
} from '@/stores/auroraTravelStore';

// Components
import { TripCard } from './TripCard';
import { RoutesToWatch } from './RoutesToWatch';
import { TripPlanningFlow } from './TripPlanningFlow';
import { RouteWatchModal } from './RouteWatchModal';
import { TripDetailSheet } from './TripDetailSheet';

// ============================================================================
// Section Toggle
// ============================================================================

type TripSection = 'trips' | 'routes';

interface SectionToggleProps {
    activeSection: TripSection;
    onSectionChange: (section: TripSection) => void;
    tripCount: number;
    routeCount: number;
    recommendedCount: number;
}

const SectionToggle: React.FC<SectionToggleProps> = ({
    activeSection,
    onSectionChange,
    tripCount,
    routeCount: _routeCount,
    recommendedCount,
}) => (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--glass-bg-subtle)]">
        <button
            onClick={() => onSectionChange('trips')}
            className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
                activeSection === 'trips'
                    ? 'bg-[var(--glass-accent)]/20 text-[var(--glass-accent)]'
                    : 'text-secondary hover:text-primary'
            )}
        >
            <Plane size={16} />
            My Trips
            {tripCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-xs">
                    {tripCount}
                </span>
            )}
        </button>
        <button
            onClick={() => onSectionChange('routes')}
            className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
                activeSection === 'routes'
                    ? 'bg-[var(--glass-accent)]/20 text-[var(--glass-accent)]'
                    : 'text-secondary hover:text-primary'
            )}
        >
            <Route size={16} />
            Routes to Watch
            {recommendedCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs">
                    {recommendedCount}
                </span>
            )}
        </button>
    </div>
);

// ============================================================================
// Empty States
// ============================================================================

const EmptyTripsState: React.FC<{ onCreateTrip: () => void }> = ({ onCreateTrip }) => (
    <GlassContainer className="p-8 text-center" border>
        <Plane size={40} className="mx-auto mb-3 text-tertiary opacity-50" />
        <p className="text-sm text-secondary mb-2">No trips planned yet</p>
        <p className="text-xs text-tertiary mb-4">
            Plan your next adventure with weather-aware itineraries
        </p>
        <GlassButton variant="primary" size="sm" onClick={onCreateTrip}>
            <Plus size={14} className="mr-1" />
            Plan a Trip
        </GlassButton>
    </GlassContainer>
);

// ============================================================================
// Active Trip Banner
// ============================================================================

interface ActiveTripBannerProps {
    tripName: string;
    nextStop?: string;
    onClick: () => void;
}

const ActiveTripBanner: React.FC<ActiveTripBannerProps> = ({ tripName, nextStop, onClick }) => (
    <motion.button
        onClick={onClick}
        className="w-full"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
    >
        <div className="p-4 rounded-xl bg-gradient-to-r from-sky-500/20 to-blue-500/20 border border-sky-500/30">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-sky-500/20">
                        <Map size={20} className="text-sky-400" />
                    </div>
                    <div className="text-left">
                        <div className="text-xs text-sky-400 font-medium">Active Trip</div>
                        <div className="text-sm font-semibold text-primary">{tripName}</div>
                        {nextStop && (
                            <div className="text-xs text-secondary">Next: {nextStop}</div>
                        )}
                    </div>
                </div>
                <ChevronRight size={20} className="text-sky-400" />
            </div>
        </div>
    </motion.button>
);

// ============================================================================
// Main Component
// ============================================================================

export const AuroraTripsTab: React.FC = () => {
    const [activeSection, setActiveSection] = useState<TripSection>('trips');
    const [showTripFlow, setShowTripFlow] = useState(false);
    const [showRouteModal, setShowRouteModal] = useState(false);
    const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
    const [_editingTrip, setEditingTrip] = useState<Trip | null>(null);

    // Store data - select raw arrays and compute derived data with useMemo
    const { trips, activeTripId, routesToWatch } = useAuroraTravelStore(
        useShallow((state) => ({
            trips: state.trips,
            activeTripId: state.activeTripId,
            routesToWatch: state.routesToWatch,
        }))
    );

    // Compute derived values with useMemo for stable references
    const activeTrip = useMemo(
        () => trips.find(t => t.id === activeTripId),
        [trips, activeTripId]
    );

    const upcomingTrips = useMemo(() => {
        const now = Date.now();
        return trips
            .filter(t => t.status === 'planned' && t.departureDate && new Date(t.departureDate).getTime() > now)
            .sort((a, b) => new Date(a.departureDate!).getTime() - new Date(b.departureDate!).getTime());
    }, [trips]);

    const recommendedRoutes = useMemo(
        () => routesToWatch.filter(r => r.status === 'recommended'),
        [routesToWatch]
    );

    // Handlers
    const handleCreateTrip = () => {
        setShowTripFlow(true);
    };

    const handleTripSaved = (tripId: string) => {
        console.log('Trip saved:', tripId);
        setShowTripFlow(false);
    };

    const handleViewTrip = (tripId: string) => {
        setSelectedTripId(tripId);
    };

    const handleEditTrip = (trip: Trip) => {
        setSelectedTripId(null);
        setEditingTrip(trip);
        setShowTripFlow(true);
    };

    const handleAddRoute = () => {
        setShowRouteModal(true);
    };

    const handleRouteSaved = (routeId: string) => {
        console.log('Route saved:', routeId);
        setShowRouteModal(false);
    };

    const handleViewRoute = (routeId: string) => {
        console.log('View route:', routeId);
    };

    const handleBookWindow = (routeId: string, windowIndex: number) => {
        console.log('Book window:', routeId, windowIndex);
        // TODO: Convert route-to-watch to planned trip
    };

    return (
        <div className="space-y-6">
            {/* Active Trip Banner */}
            {activeTrip && (
                <ActiveTripBanner
                    tripName={activeTrip.name}
                    nextStop={activeTrip.destinations[0]?.place.name}
                    onClick={() => handleViewTrip(activeTrip.id)}
                />
            )}

            {/* Section Toggle */}
            <SectionToggle
                activeSection={activeSection}
                onSectionChange={setActiveSection}
                tripCount={trips.length}
                routeCount={routesToWatch.length}
                recommendedCount={recommendedRoutes.length}
            />

            {/* Section Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeSection}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeSection === 'trips' && (
                        <div className="space-y-4">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-primary">
                                    {upcomingTrips.length > 0 ? 'Upcoming Trips' : 'My Trips'}
                                </h3>
                                <GlassButton variant="primary" size="sm" onClick={handleCreateTrip}>
                                    <Plus size={14} className="mr-1" />
                                    New Trip
                                </GlassButton>
                            </div>

                            {/* Trips List */}
                            {trips.length === 0 ? (
                                <EmptyTripsState onCreateTrip={handleCreateTrip} />
                            ) : (
                                <div className="space-y-3">
                                    {trips.map((trip) => (
                                        <TripCard
                                            key={trip.id}
                                            trip={trip}
                                            onClick={() => handleViewTrip(trip.id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeSection === 'routes' && (
                        <RoutesToWatch
                            onAddRoute={handleAddRoute}
                            onViewRoute={handleViewRoute}
                            onBookWindow={handleBookWindow}
                        />
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Trip Planning Modal */}
            <AnimatePresence>
                {showTripFlow && (
                    <TripPlanningFlow
                        onClose={() => setShowTripFlow(false)}
                        onSave={handleTripSaved}
                    />
                )}
            </AnimatePresence>

            {/* Route Watch Modal */}
            <AnimatePresence>
                {showRouteModal && (
                    <RouteWatchModal
                        onClose={() => setShowRouteModal(false)}
                        onSave={handleRouteSaved}
                    />
                )}
            </AnimatePresence>

            {/* Trip Detail Sheet */}
            <AnimatePresence>
                {selectedTripId && (() => {
                    const selectedTrip = trips.find(t => t.id === selectedTripId);
                    return selectedTrip ? (
                        <TripDetailSheet
                            trip={selectedTrip}
                            onClose={() => setSelectedTripId(null)}
                            onEdit={() => handleEditTrip(selectedTrip)}
                        />
                    ) : null;
                })()}
            </AnimatePresence>
        </div>
    );
};

export default AuroraTripsTab;
