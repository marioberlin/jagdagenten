/**
 * IBird Skeleton Loaders
 * 
 * High-fidelity skeleton loading states that match
 * the actual component layouts.
 */

import { cn } from '@/lib/utils';

// =============================================================================
// Base Skeleton Pulse Animation
// =============================================================================

function SkeletonPulse({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                'animate-pulse rounded bg-[var(--glass-surface-hover)]',
                className
            )}
        />
    );
}

// =============================================================================
// Message List Skeleton
// =============================================================================

export function MessageListSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div className="h-full overflow-hidden">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="flex items-start gap-3 px-4 py-3 border-b border-[var(--glass-border)]/50"
                    style={{ animationDelay: `${i * 50}ms` }}
                >
                    {/* Checkbox */}
                    <SkeletonPulse className="w-5 h-5 mt-0.5 rounded" />

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                        {/* Header Row */}
                        <div className="flex items-center gap-2">
                            <SkeletonPulse className="h-4 w-32" />
                            <div className="flex-1" />
                            <SkeletonPulse className="h-3 w-12" />
                        </div>

                        {/* Subject */}
                        <SkeletonPulse className="h-4 w-4/5" />

                        {/* Snippet */}
                        <SkeletonPulse className="h-3 w-3/5" />
                    </div>

                    {/* Indicators */}
                    <SkeletonPulse className="w-4 h-4 rounded-full" />
                </div>
            ))}
        </div>
    );
}

// =============================================================================
// Reading Pane Skeleton
// =============================================================================

export function ReadingPaneSkeleton() {
    return (
        <div className="h-full flex flex-col bg-[var(--glass-surface)]/20">
            {/* Header */}
            <div className="flex-shrink-0 p-4 border-b border-[var(--glass-border)]">
                {/* Actions Row */}
                <div className="flex items-center gap-2 mb-4">
                    <SkeletonPulse className="h-8 w-20 rounded-lg" />
                    <SkeletonPulse className="h-8 w-24 rounded-lg" />
                    <SkeletonPulse className="h-8 w-20 rounded-lg" />
                    <div className="flex-1" />
                    <SkeletonPulse className="h-8 w-8 rounded-lg" />
                    <SkeletonPulse className="h-8 w-8 rounded-lg" />
                </div>

                {/* Subject */}
                <SkeletonPulse className="h-7 w-3/4 mb-3" />

                {/* Sender Info */}
                <div className="flex items-start gap-3">
                    <SkeletonPulse className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                            <SkeletonPulse className="h-4 w-32" />
                            <SkeletonPulse className="h-3 w-40" />
                        </div>
                        <SkeletonPulse className="h-3 w-48" />
                    </div>
                    <SkeletonPulse className="h-3 w-24" />
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <SkeletonPulse className="h-4 w-full" />
                <SkeletonPulse className="h-4 w-5/6" />
                <SkeletonPulse className="h-4 w-4/5" />
                <SkeletonPulse className="h-4 w-full" />
                <SkeletonPulse className="h-4 w-3/4" />
                <div className="h-4" />
                <SkeletonPulse className="h-4 w-full" />
                <SkeletonPulse className="h-4 w-2/3" />
            </div>
        </div>
    );
}

// =============================================================================
// Calendar Skeleton
// =============================================================================

export function CalendarSkeleton() {
    return (
        <div className="flex-1 flex flex-col overflow-hidden p-4">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
                {Array.from({ length: 7 }).map((_, i) => (
                    <SkeletonPulse key={i} className="h-6 mx-auto w-10" />
                ))}
            </div>

            {/* Calendar grid */}
            <div className="flex-1 grid grid-rows-6 gap-1">
                {Array.from({ length: 6 }).map((_, weekIndex) => (
                    <div key={weekIndex} className="grid grid-cols-7 gap-1">
                        {Array.from({ length: 7 }).map((_, dayIndex) => (
                            <div
                                key={dayIndex}
                                className="min-h-[80px] p-1 rounded-lg bg-[var(--glass-surface)]/30"
                            >
                                <SkeletonPulse className="w-6 h-6 rounded-full mb-1" />
                                {(weekIndex + dayIndex) % 3 === 0 && (
                                    <SkeletonPulse className="h-4 w-full rounded" />
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

// =============================================================================
// Booking Card Skeleton
// =============================================================================

export function BookingCardSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className={cn(
                        'p-4 rounded-xl',
                        'bg-[var(--glass-surface)] border border-[var(--glass-border)]'
                    )}
                >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                        <div className="space-y-2">
                            <SkeletonPulse className="h-5 w-32" />
                            <div className="flex items-center gap-2">
                                <SkeletonPulse className="h-3 w-3" />
                                <SkeletonPulse className="h-3 w-24" />
                            </div>
                        </div>
                        <SkeletonPulse className="h-5 w-16 rounded-full" />
                    </div>

                    {/* Invitee Info */}
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-[var(--glass-bg)] mb-3">
                        <SkeletonPulse className="w-8 h-8 rounded-full" />
                        <div className="flex-1 space-y-1">
                            <SkeletonPulse className="h-4 w-24" />
                            <SkeletonPulse className="h-3 w-32" />
                        </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2">
                        <SkeletonPulse className="w-4 h-4 rounded" />
                        <SkeletonPulse className="h-3 w-20" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// =============================================================================
// Appointment Type Card Skeleton
// =============================================================================

export function AppointmentTypeCardSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className={cn(
                        'p-4 rounded-xl',
                        'bg-[var(--glass-surface)] border border-[var(--glass-border)]'
                    )}
                >
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-3">
                        <SkeletonPulse className="w-3 h-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <SkeletonPulse className="h-5 w-28" />
                            <SkeletonPulse className="h-3 w-full" />
                        </div>
                    </div>

                    {/* Details */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                            <SkeletonPulse className="w-3 h-3 rounded" />
                            <SkeletonPulse className="h-3 w-12" />
                        </div>
                        <div className="flex items-center gap-1">
                            <SkeletonPulse className="w-3 h-3 rounded" />
                            <SkeletonPulse className="h-3 w-16" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default {
    MessageListSkeleton,
    ReadingPaneSkeleton,
    CalendarSkeleton,
    BookingCardSkeleton,
    AppointmentTypeCardSkeleton,
};
