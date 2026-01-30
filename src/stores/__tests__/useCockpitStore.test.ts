/**
 * Tests for useCockpitStore - Daily Cockpit functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCockpitStore } from '../useCockpitStore';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useCockpitStore', () => {
    beforeEach(() => {
        // Reset store state
        useCockpitStore.setState({
            huntabilityScore: null,
            bestWindows: [],
            conditions: null,
            recentSessions: [],
            loading: false,
            error: null,
        });
        mockFetch.mockClear();
    });

    describe('initial state', () => {
        it('should start with null huntability score', () => {
            const state = useCockpitStore.getState();
            expect(state.huntabilityScore).toBeNull();
        });

        it('should start with empty best windows', () => {
            const state = useCockpitStore.getState();
            expect(state.bestWindows).toEqual([]);
        });

        it('should start with null conditions', () => {
            const state = useCockpitStore.getState();
            expect(state.conditions).toBeNull();
        });

        it('should start with loading false', () => {
            const state = useCockpitStore.getState();
            expect(state.loading).toBe(false);
        });

        it('should start with no error', () => {
            const state = useCockpitStore.getState();
            expect(state.error).toBeNull();
        });
    });

    describe('fetchDashboard', () => {
        it('should set loading state when fetching', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    huntabilityScore: 75,
                    bestWindows: [],
                    conditions: null,
                    recentSessions: [],
                }),
            });

            const { fetchDashboard } = useCockpitStore.getState();
            const fetchPromise = fetchDashboard(51.1657, 10.4515);

            expect(useCockpitStore.getState().loading).toBe(true);

            await fetchPromise;

            expect(useCockpitStore.getState().loading).toBe(false);
        });

        it('should update huntability score on success', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    huntabilityScore: 85,
                    bestWindows: [{ start: '06:00', end: '08:00', score: 90, reason: 'Optimal' }],
                    conditions: {
                        wind: { speed: 10, direction: 180 },
                        temperature: 12,
                        humidity: 65,
                        pressure: 1015,
                        moonPhase: 'Vollmond',
                        twilight: { civilDawn: '05:30', sunrise: '06:00', sunset: '20:00', civilDusk: '20:30' },
                        precipitation: 0,
                        cloudCover: 20,
                    },
                    recentSessions: [],
                }),
            });

            const { fetchDashboard } = useCockpitStore.getState();
            await fetchDashboard(51.1657, 10.4515);

            const state = useCockpitStore.getState();
            expect(state.huntabilityScore).toBe(85);
            expect(state.bestWindows).toHaveLength(1);
            expect(state.conditions).not.toBeNull();
        });

        it('should handle fetch error gracefully', async () => {
            mockFetch.mockRejectedValueOnce(new Error('API Error'));

            const { fetchDashboard } = useCockpitStore.getState();
            await fetchDashboard(51.1657, 10.4515);

            const state = useCockpitStore.getState();
            expect(state.loading).toBe(false);
            expect(state.error).toBe('API Error');
        });

        it('should pass coordinates to API', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    huntabilityScore: 70,
                    bestWindows: [],
                    conditions: null,
                    recentSessions: [],
                }),
            });

            const { fetchDashboard } = useCockpitStore.getState();
            await fetchDashboard(52.5200, 13.4050); // Berlin coordinates

            // Check that fetch was called with URL containing the coordinates
            const callUrl = mockFetch.mock.calls[0][0];
            expect(callUrl).toContain('lat=52.52');
            expect(callUrl).toContain('lon=13.405');
        });
    });

    describe('recent sessions', () => {
        it('should store recent sessions from API', async () => {
            const mockSessions = [
                { id: '1', sessionType: 'ansitz', startTime: '2024-01-15T06:00:00Z', endTime: '2024-01-15T08:00:00Z' },
                { id: '2', sessionType: 'pirsch', startTime: '2024-01-14T16:00:00Z', endTime: '2024-01-14T18:30:00Z' },
            ];

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    huntabilityScore: 60,
                    bestWindows: [],
                    conditions: null,
                    recentSessions: mockSessions,
                }),
            });

            const { fetchDashboard } = useCockpitStore.getState();
            await fetchDashboard(51.1657, 10.4515);

            const state = useCockpitStore.getState();
            expect(state.recentSessions).toHaveLength(2);
            expect(state.recentSessions[0].sessionType).toBe('ansitz');
        });
    });
});
