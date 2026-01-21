/**
 * Aurora Travel Components
 * 
 * Barrel export for all Aurora Travel Weather components.
 */

// Tab Components
export { AuroraHomeTab, AuroraHomeTabSkeleton } from './AuroraHomeTab';
export { AuroraTripsTab } from './AuroraTripsTab';
export { AuroraMapTab } from './AuroraMapTab';
export { AuroraProfileTab } from './AuroraProfileTab';

// Trip Components
export { TripCard } from './TripCard';
export { DestinationCard } from './DestinationCard';
export { TripPlanningFlow } from './TripPlanningFlow';
export { TripDetailSheet } from './TripDetailSheet';
export { PackingList } from './PackingList';

// Routes-to-Watch
export { RoutesToWatch } from './RoutesToWatch';
export { RouteWatchModal } from './RouteWatchModal';

// Timeline
export { HourlyTimeline } from './HourlyTimeline';

// Search
export { PlacesAutocomplete } from './PlacesAutocomplete';

// Radar
export { WeatherRadarOverlay } from './WeatherRadarOverlay';

// Loading States
export {
    Skeleton,
    TripCardSkeleton,
    DestinationCardSkeleton,
    WeatherCardSkeleton,
    HourlyTimelineSkeleton,
    RouteCardSkeleton,
    MapSkeleton,
    TripsTabSkeleton,
    MapTabSkeleton,
} from './SkeletonLoaders';

// Re-export types
export type { TripCardProps } from './TripCard';
export type { DestinationCardProps, DestinationWeather } from './DestinationCard';
export type { RoutesToWatchProps } from './RoutesToWatch';
export type { TripPlanningFlowProps } from './TripPlanningFlow';
export type { RouteWatchModalProps } from './RouteWatchModal';
export type { TripDetailSheetProps } from './TripDetailSheet';
export type { PackingListProps, PackingItem, PackingCategory } from './PackingList';
export type { HourlyTimelineProps, HourlyForecast } from './HourlyTimeline';
export type { PlacesAutocompleteProps, PlaceResult } from './PlacesAutocomplete';
