/**
 * Aurora Travel Components - Re-export Shim
 * @deprecated Use '@/applications/aurora-travel/components' directly.
 */

// Tab Components
export { AuroraHomeTab, AuroraHomeTabSkeleton } from '@/applications/aurora-travel/components/AuroraHomeTab';
export { AuroraTripsTab } from '@/applications/aurora-travel/components/AuroraTripsTab';
export { AuroraMapTab } from '@/applications/aurora-travel/components/AuroraMapTab';
export { AuroraProfileTab } from '@/applications/aurora-travel/components/AuroraProfileTab';

// Trip Components
export { TripCard } from '@/applications/aurora-travel/components/TripCard';
export { DestinationCard } from '@/applications/aurora-travel/components/DestinationCard';
export { TripPlanningFlow } from '@/applications/aurora-travel/components/TripPlanningFlow';
export { TripDetailSheet } from '@/applications/aurora-travel/components/TripDetailSheet';
export { PackingList } from '@/applications/aurora-travel/components/PackingList';

// Routes-to-Watch
export { RoutesToWatch } from '@/applications/aurora-travel/components/RoutesToWatch';
export { RouteWatchModal } from '@/applications/aurora-travel/components/RouteWatchModal';

// Timeline
export { HourlyTimeline } from '@/applications/aurora-travel/components/HourlyTimeline';

// Search
export { PlacesAutocomplete } from '@/applications/aurora-travel/components/PlacesAutocomplete';

// Radar
export { WeatherRadarOverlay } from '@/applications/aurora-travel/components/WeatherRadarOverlay';

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
} from '@/applications/aurora-travel/components/SkeletonLoaders';

// Re-export types
export type { TripCardProps } from '@/applications/aurora-travel/components/TripCard';
export type { DestinationCardProps, DestinationWeather } from '@/applications/aurora-travel/components/DestinationCard';
export type { RoutesToWatchProps } from '@/applications/aurora-travel/components/RoutesToWatch';
export type { TripPlanningFlowProps } from '@/applications/aurora-travel/components/TripPlanningFlow';
export type { RouteWatchModalProps } from '@/applications/aurora-travel/components/RouteWatchModal';
export type { TripDetailSheetProps } from '@/applications/aurora-travel/components/TripDetailSheet';
export type { PackingListProps, PackingItem, PackingCategory } from '@/applications/aurora-travel/components/PackingList';
export type { HourlyTimelineProps, HourlyForecast } from '@/applications/aurora-travel/components/HourlyTimeline';
export type { PlacesAutocompleteProps, PlaceResult } from '@/applications/aurora-travel/components/PlacesAutocomplete';
