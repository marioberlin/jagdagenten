/**
 * Analytics Store Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useAnalyticsStore } from '../analyticsStore';

describe('analyticsStore', () => {
    beforeEach(() => {
        // Reset store to defaults
        useAnalyticsStore.setState({
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
        });
    });

    describe('hunt tracking', () => {
        it('records hunt started', () => {
            const { recordHuntStarted } = useAnalyticsStore.getState();
            recordHuntStarted();

            const state = useAnalyticsStore.getState();
            expect(state.hunts.totalHuntsStarted).toBe(1);
            expect(state.hunts.lastHuntDate).toBeTruthy();
        });

        it('records hunt completed with end time', () => {
            const { recordHuntCompleted } = useAnalyticsStore.getState();
            recordHuntCompleted(true);

            const state = useAnalyticsStore.getState();
            expect(state.hunts.totalHuntsCompleted).toBe(1);
            expect(state.hunts.huntsWithEndTime).toBe(1);
        });

        it('records hunt completed without end time', () => {
            const { recordHuntCompleted } = useAnalyticsStore.getState();
            recordHuntCompleted(false);

            const state = useAnalyticsStore.getState();
            expect(state.hunts.totalHuntsCompleted).toBe(1);
            expect(state.hunts.huntsWithEndTime).toBe(0);
        });

        it('calculates completion rate', () => {
            const store = useAnalyticsStore.getState();

            // Record 4 hunts started, 3 with end time
            store.recordHuntStarted();
            store.recordHuntStarted();
            store.recordHuntStarted();
            store.recordHuntStarted();
            store.recordHuntCompleted(true);
            store.recordHuntCompleted(true);
            store.recordHuntCompleted(true);
            store.recordHuntCompleted(false);

            expect(useAnalyticsStore.getState().getCompletionRate()).toBe(75);
        });

        it('returns 0 completion rate with no hunts', () => {
            expect(useAnalyticsStore.getState().getCompletionRate()).toBe(0);
        });
    });

    describe('safety tracking', () => {
        it('records event created', () => {
            const { recordEventCreated } = useAnalyticsStore.getState();
            recordEventCreated();

            expect(useAnalyticsStore.getState().safety.totalEvents).toBe(1);
        });

        it('records check-in', () => {
            const { recordEventCheckIn } = useAnalyticsStore.getState();
            recordEventCheckIn();

            expect(useAnalyticsStore.getState().safety.eventsWithCheckIn).toBe(1);
        });

        it('records check-out', () => {
            const { recordEventCheckOut } = useAnalyticsStore.getState();
            recordEventCheckOut();

            expect(useAnalyticsStore.getState().safety.eventsWithCheckOut).toBe(1);
        });

        it('records emergency beacon', () => {
            const { recordEmergencyBeacon } = useAnalyticsStore.getState();
            recordEmergencyBeacon();

            expect(useAnalyticsStore.getState().safety.emergencyBeaconsActivated).toBe(1);
        });

        it('calculates safety adoption rate', () => {
            const store = useAnalyticsStore.getState();

            // 4 events, 3 with check-in, 2 with check-out
            store.recordEventCreated();
            store.recordEventCreated();
            store.recordEventCreated();
            store.recordEventCreated();
            store.recordEventCheckIn();
            store.recordEventCheckIn();
            store.recordEventCheckIn();
            store.recordEventCheckOut();
            store.recordEventCheckOut();

            // Adoption = min(checkIn, checkOut) / total = 2/4 = 50%
            expect(useAnalyticsStore.getState().getSafetyAdoptionRate()).toBe(50);
        });
    });

    describe('trust tracking', () => {
        it('records sighting shared', () => {
            const { recordSightingShared } = useAnalyticsStore.getState();
            recordSightingShared();

            expect(useAnalyticsStore.getState().trust.sightingsSharedPublicly).toBe(1);
        });

        it('records story published', () => {
            const { recordStoryPublished } = useAnalyticsStore.getState();
            recordStoryPublished();

            expect(useAnalyticsStore.getState().trust.storiesPublished).toBe(1);
        });

        it('records private hunt mode', () => {
            const { recordPrivateHuntMode } = useAnalyticsStore.getState();
            recordPrivateHuntMode();

            expect(useAnalyticsStore.getState().trust.privateHuntModeUsed).toBe(1);
        });

        it('sets insights opt-in', () => {
            const { setInsightsOptIn } = useAnalyticsStore.getState();
            setInsightsOptIn(true);

            expect(useAnalyticsStore.getState().trust.usersOptedIntoInsights).toBe(true);
        });

        it('calculates public sharing rate', () => {
            const store = useAnalyticsStore.getState();

            // 4 hunts completed, 2 sightings + 1 story shared
            store.recordHuntCompleted(true);
            store.recordHuntCompleted(true);
            store.recordHuntCompleted(true);
            store.recordHuntCompleted(true);
            store.recordSightingShared();
            store.recordSightingShared();
            store.recordStoryPublished();

            // Rate = (2+1)/4 = 75%
            expect(useAnalyticsStore.getState().getPublicSharingRate()).toBe(75);
        });
    });
});
