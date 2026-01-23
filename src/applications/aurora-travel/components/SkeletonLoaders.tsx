/**
 * Skeleton Loaders
 * 
 * Reusable skeleton loading components for Aurora Travel Weather.
 */
import React from 'react';
import { cn } from '@/utils/cn';

// ============================================================================
// Base Skeleton
// ============================================================================

interface SkeletonProps {
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
    <div
        className={cn(
            'animate-pulse bg-gradient-to-r from-white/5 via-white/10 to-white/5 rounded',
            className
        )}
    />
);

// ============================================================================
// Specific Skeletons
// ============================================================================

export const TripCardSkeleton: React.FC = () => (
    <div className="p-4 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg-subtle)]">
        <div className="flex items-start gap-3">
            <Skeleton className="w-12 h-12 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4 rounded" />
                <Skeleton className="h-4 w-1/2 rounded" />
                <div className="flex gap-2 pt-1">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                </div>
            </div>
            <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
        </div>
    </div>
);

export const DestinationCardSkeleton: React.FC = () => (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg-subtle)]">
        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
        <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-1/2 rounded" />
            <Skeleton className="h-3 w-1/3 rounded" />
        </div>
        <Skeleton className="w-12 h-8 rounded shrink-0" />
    </div>
);

export const WeatherCardSkeleton: React.FC = () => (
    <div className="p-4 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg-subtle)]">
        <div className="flex items-center justify-between mb-4">
            <div className="space-y-2">
                <Skeleton className="h-10 w-24 rounded" />
                <Skeleton className="h-4 w-32 rounded" />
            </div>
            <Skeleton className="w-16 h-16 rounded-full" />
        </div>
        <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
        </div>
    </div>
);

export const HourlyTimelineSkeleton: React.FC = () => (
    <div className="flex gap-2 overflow-hidden py-2">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="flex flex-col items-center gap-1 min-w-14 p-2">
                <Skeleton className="h-3 w-8 rounded" />
                <Skeleton className="w-6 h-6 rounded-full" />
                <Skeleton className="h-4 w-8 rounded" />
                <Skeleton className="h-6 w-full rounded" />
            </div>
        ))}
    </div>
);

export const RouteCardSkeleton: React.FC = () => (
    <div className="p-4 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg-subtle)]">
        <div className="flex items-center gap-3 mb-3">
            <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
                <Skeleton className="h-5 w-40 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
            </div>
            <Skeleton className="w-16 h-8 rounded-full shrink-0" />
        </div>
        <div className="flex gap-2">
            {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-12 flex-1 rounded-lg" />
            ))}
        </div>
    </div>
);

export const MapSkeleton: React.FC = () => (
    <div className="h-[400px] rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg-subtle)] flex items-center justify-center">
        <div className="text-center space-y-2">
            <Skeleton className="w-12 h-12 rounded-full mx-auto" />
            <Skeleton className="h-3 w-24 rounded mx-auto" />
        </div>
    </div>
);

// ============================================================================
// Full Page Skeletons
// ============================================================================

export const TripsTabSkeleton: React.FC = () => (
    <div className="space-y-4">
        <div className="flex gap-2">
            <Skeleton className="h-10 w-24 rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
        <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-32 rounded" />
            <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
        <div className="space-y-3">
            <TripCardSkeleton />
            <TripCardSkeleton />
        </div>
    </div>
);

export const MapTabSkeleton: React.FC = () => (
    <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-xl" />
        <MapSkeleton />
        <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-16 w-16 rounded-lg" />
            ))}
        </div>
    </div>
);

export default {
    Skeleton,
    TripCardSkeleton,
    DestinationCardSkeleton,
    WeatherCardSkeleton,
    HourlyTimelineSkeleton,
    RouteCardSkeleton,
    MapSkeleton,
    TripsTabSkeleton,
    MapTabSkeleton,
};
