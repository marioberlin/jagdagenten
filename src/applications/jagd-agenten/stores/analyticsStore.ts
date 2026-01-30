/**
 * Jagd-Agenten Analytics Store
 *
 * Tracks key metrics:
 * - % hunts started/ended via app
 * - Safety adoption (events with check-in/out)
 * - Trust signals (opt-in rates)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export interface HuntMetrics {
    totalHuntsStarted: number;
    totalHuntsCompleted: number;
    huntsWithEndTime: number;
    lastHuntDate: string | null;
}

export interface SafetyMetrics {
    totalEvents: number;
    eventsWithCheckIn: number;
    eventsWithCheckOut: number;
    emergencyBeaconsActivated: number;
}

export interface TrustMetrics {
    usersOptedIntoInsights: boolean;
    sightingsSharedPublicly: number;
    storiesPublished: number;
    privateHuntModeUsed: number;
}

export interface AnalyticsState {
    // Metrics
    hunts: HuntMetrics;
    safety: SafetyMetrics;
    trust: TrustMetrics;

    // Actions
    recordHuntStarted: () => void;
    recordHuntCompleted: (withEndTime: boolean) => void;
    recordEventCreated: () => void;
    recordEventCheckIn: () => void;
    recordEventCheckOut: () => void;
    recordEmergencyBeacon: () => void;
    recordSightingShared: () => void;
    recordStoryPublished: () => void;
    recordPrivateHuntMode: () => void;
    setInsightsOptIn: (optedIn: boolean) => void;

    // Computed
    getCompletionRate: () => number;
    getSafetyAdoptionRate: () => number;
    getPublicSharingRate: () => number;
}

// ============================================================================
// Store
// ============================================================================

export const useAnalyticsStore = create<AnalyticsState>()(
    persist(
        (set, get) => ({
            hunts: {
                totalHuntsStarted: 0,
                totalHuntsCompleted: 0,
                huntsWithEndTime: 0,
                lastHuntDate: null,
            },
            safety: {
                totalEvents: 0,
                eventsWithCheckIn: 0,
                eventsWithCheckOut: 0,
                emergencyBeaconsActivated: 0,
            },
            trust: {
                usersOptedIntoInsights: false,
                sightingsSharedPublicly: 0,
                storiesPublished: 0,
                privateHuntModeUsed: 0,
            },

            // Hunt tracking
            recordHuntStarted: () =>
                set((state) => ({
                    hunts: {
                        ...state.hunts,
                        totalHuntsStarted: state.hunts.totalHuntsStarted + 1,
                        lastHuntDate: new Date().toISOString(),
                    },
                })),

            recordHuntCompleted: (withEndTime) =>
                set((state) => ({
                    hunts: {
                        ...state.hunts,
                        totalHuntsCompleted: state.hunts.totalHuntsCompleted + 1,
                        huntsWithEndTime: withEndTime
                            ? state.hunts.huntsWithEndTime + 1
                            : state.hunts.huntsWithEndTime,
                    },
                })),

            // Safety tracking
            recordEventCreated: () =>
                set((state) => ({
                    safety: {
                        ...state.safety,
                        totalEvents: state.safety.totalEvents + 1,
                    },
                })),

            recordEventCheckIn: () =>
                set((state) => ({
                    safety: {
                        ...state.safety,
                        eventsWithCheckIn: state.safety.eventsWithCheckIn + 1,
                    },
                })),

            recordEventCheckOut: () =>
                set((state) => ({
                    safety: {
                        ...state.safety,
                        eventsWithCheckOut: state.safety.eventsWithCheckOut + 1,
                    },
                })),

            recordEmergencyBeacon: () =>
                set((state) => ({
                    safety: {
                        ...state.safety,
                        emergencyBeaconsActivated: state.safety.emergencyBeaconsActivated + 1,
                    },
                })),

            // Trust tracking
            recordSightingShared: () =>
                set((state) => ({
                    trust: {
                        ...state.trust,
                        sightingsSharedPublicly: state.trust.sightingsSharedPublicly + 1,
                    },
                })),

            recordStoryPublished: () =>
                set((state) => ({
                    trust: {
                        ...state.trust,
                        storiesPublished: state.trust.storiesPublished + 1,
                    },
                })),

            recordPrivateHuntMode: () =>
                set((state) => ({
                    trust: {
                        ...state.trust,
                        privateHuntModeUsed: state.trust.privateHuntModeUsed + 1,
                    },
                })),

            setInsightsOptIn: (optedIn) =>
                set((state) => ({
                    trust: {
                        ...state.trust,
                        usersOptedIntoInsights: optedIn,
                    },
                })),

            // Computed metrics
            getCompletionRate: () => {
                const { hunts } = get();
                if (hunts.totalHuntsStarted === 0) return 0;
                return Math.round(
                    (hunts.huntsWithEndTime / hunts.totalHuntsStarted) * 100
                );
            },

            getSafetyAdoptionRate: () => {
                const { safety } = get();
                if (safety.totalEvents === 0) return 0;
                const withBoth = Math.min(
                    safety.eventsWithCheckIn,
                    safety.eventsWithCheckOut
                );
                return Math.round((withBoth / safety.totalEvents) * 100);
            },

            getPublicSharingRate: () => {
                const { trust, hunts } = get();
                if (hunts.totalHuntsCompleted === 0) return 0;
                const totalShared = trust.sightingsSharedPublicly + trust.storiesPublished;
                return Math.round((totalShared / hunts.totalHuntsCompleted) * 100);
            },
        }),
        {
            name: 'jagd-analytics',
        }
    )
);

// ============================================================================
// Analytics Dashboard Hook
// ============================================================================

export function useAnalyticsSummary() {
    const store = useAnalyticsStore();

    return {
        hunts: {
            started: store.hunts.totalHuntsStarted,
            completed: store.hunts.totalHuntsCompleted,
            completionRate: store.getCompletionRate(),
            lastHunt: store.hunts.lastHuntDate,
        },
        safety: {
            events: store.safety.totalEvents,
            checkInRate: store.safety.totalEvents > 0
                ? Math.round((store.safety.eventsWithCheckIn / store.safety.totalEvents) * 100)
                : 0,
            checkOutRate: store.safety.totalEvents > 0
                ? Math.round((store.safety.eventsWithCheckOut / store.safety.totalEvents) * 100)
                : 0,
            adoptionRate: store.getSafetyAdoptionRate(),
        },
        trust: {
            insightsOptIn: store.trust.usersOptedIntoInsights,
            sightingsShared: store.trust.sightingsSharedPublicly,
            storiesPublished: store.trust.storiesPublished,
            sharingRate: store.getPublicSharingRate(),
        },
    };
}
