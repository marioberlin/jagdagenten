/**
 * Hunt Session Store
 *
 * Zustand store for managing active and past hunt sessions.
 * Provides actions for starting, ending, and updating sessions.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    HuntSession,
    SessionType,
    Observation,
    Shot,
    Harvest,
    StandReference,
    WeatherSnapshot,
    SessionSummary,
} from '../types/HuntSession';

// ---------------------------------------------------------------------------
// Store State
// ---------------------------------------------------------------------------

interface HuntSessionState {
    // Current active session (only one at a time)
    activeSession: HuntSession | null;

    // Recent sessions (last 30 days)
    recentSessions: SessionSummary[];

    // Loading/error state
    isLoading: boolean;
    error: string | null;
}

// ---------------------------------------------------------------------------
// Store Actions
// ---------------------------------------------------------------------------

interface HuntSessionActions {
    // Session lifecycle
    startSession: (
        type: SessionType,
        stand?: StandReference,
        weather?: WeatherSnapshot
    ) => Promise<HuntSession>;

    endSession: (notes?: string) => Promise<SessionSummary>;

    cancelSession: () => void;

    // Get current session
    getActiveSession: () => HuntSession | null;

    // Add events to active session
    addObservation: (observation: Omit<Observation, 'id' | 'timestamp'>) => void;

    addShot: (shot: Omit<Shot, 'id' | 'timestamp'>) => void;

    addHarvest: (harvest: Omit<Harvest, 'id' | 'timestamp'>) => void;

    // Update session
    updateNotes: (notes: string) => void;

    updateStand: (stand: StandReference) => void;

    // Load history
    loadRecentSessions: () => Promise<void>;

    // Clear state
    reset: () => void;
}

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function calculateDuration(start: string, end?: string): number {
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    return Math.round((endTime - startTime) / 60000); // minutes
}

function sessionToSummary(session: HuntSession): SessionSummary {
    return {
        id: session.id,
        type: session.type,
        status: session.status,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: calculateDuration(session.startTime, session.endTime),
        standName: session.stand?.name,
        observationCount: session.observations.length,
        shotCount: session.shots.length,
        harvestCount: session.harvests.length,
        weatherSummary: session.weatherSnapshot
            ? `${Math.round(session.weatherSnapshot.temperature)}°C, ${session.weatherSnapshot.windSpeed} km/h`
            : undefined,
    };
}

// ---------------------------------------------------------------------------
// Store Implementation
// ---------------------------------------------------------------------------

const initialState: HuntSessionState = {
    activeSession: null,
    recentSessions: [],
    isLoading: false,
    error: null,
};

export const useHuntSessionStore = create<HuntSessionState & HuntSessionActions>()(
    persist(
        (set, get) => ({
            ...initialState,

            // Start a new session
            startSession: async (type, stand, weather) => {
                const session: HuntSession = {
                    id: generateId(),
                    type,
                    status: 'active',
                    startTime: new Date().toISOString(),
                    stand,
                    weatherSnapshot: weather,
                    observations: [],
                    shots: [],
                    harvests: [],
                };

                set({ activeSession: session, error: null });

                // Sync with backend
                try {
                    await fetch('/api/v1/jagd/session/start', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(session),
                    });
                } catch (err) {
                    console.warn('Failed to sync session start:', err);
                    // Continue offline
                }

                return session;
            },

            // End the active session
            endSession: async (notes) => {
                const { activeSession } = get();
                if (!activeSession) {
                    throw new Error('No active session');
                }

                const endTime = new Date().toISOString();
                const completedSession: HuntSession = {
                    ...activeSession,
                    status: 'completed',
                    endTime,
                    notes: notes || activeSession.notes,
                };

                const summary = sessionToSummary(completedSession);

                set((state) => ({
                    activeSession: null,
                    recentSessions: [summary, ...state.recentSessions].slice(0, 50),
                    error: null,
                }));

                // Sync with backend
                try {
                    await fetch('/api/v1/jagd/session/end', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(completedSession),
                    });
                } catch (err) {
                    console.warn('Failed to sync session end:', err);
                }

                return summary;
            },

            // Cancel without saving
            cancelSession: () => {
                set({ activeSession: null });
            },

            // Get current session
            getActiveSession: () => get().activeSession,

            // Add observation
            addObservation: (obs) => {
                set((state) => {
                    if (!state.activeSession) return state;

                    const observation: Observation = {
                        id: generateId(),
                        timestamp: new Date().toISOString(),
                        ...obs,
                    };

                    return {
                        activeSession: {
                            ...state.activeSession,
                            observations: [...state.activeSession.observations, observation],
                        },
                    };
                });
            },

            // Add shot
            addShot: (shotData) => {
                set((state) => {
                    if (!state.activeSession) return state;

                    const shot: Shot = {
                        id: generateId(),
                        timestamp: new Date().toISOString(),
                        ...shotData,
                    };

                    return {
                        activeSession: {
                            ...state.activeSession,
                            shots: [...state.activeSession.shots, shot],
                        },
                    };
                });
            },

            // Add harvest
            addHarvest: (harvestData) => {
                set((state) => {
                    if (!state.activeSession) return state;

                    const harvest: Harvest = {
                        id: generateId(),
                        timestamp: new Date().toISOString(),
                        ...harvestData,
                    };

                    return {
                        activeSession: {
                            ...state.activeSession,
                            harvests: [...state.activeSession.harvests, harvest],
                        },
                    };
                });
            },

            // Update notes
            updateNotes: (notes) => {
                set((state) => {
                    if (!state.activeSession) return state;
                    return {
                        activeSession: { ...state.activeSession, notes },
                    };
                });
            },

            // Update stand
            updateStand: (stand) => {
                set((state) => {
                    if (!state.activeSession) return state;
                    return {
                        activeSession: { ...state.activeSession, stand },
                    };
                });
            },

            // Load recent sessions from backend
            loadRecentSessions: async () => {
                set({ isLoading: true, error: null });

                try {
                    const response = await fetch('/api/v1/jagd/session/history');
                    if (response.ok) {
                        const data = await response.json();
                        set({ recentSessions: data.sessions || [], isLoading: false });
                    }
                } catch (err) {
                    console.warn('Failed to load sessions:', err);
                    set({ isLoading: false });
                }
            },

            // Reset store
            reset: () => set(initialState),
        }),
        {
            name: 'jagd-hunt-session',
            partialize: (state) => ({
                activeSession: state.activeSession,
                recentSessions: state.recentSessions,
            }),
        }
    )
);

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export const selectActiveSession = (state: HuntSessionState) => state.activeSession;
export const selectIsHunting = (state: HuntSessionState) => state.activeSession !== null;
export const selectRecentSessions = (state: HuntSessionState) => state.recentSessions;
export const selectSessionDuration = (state: HuntSessionState) => {
    if (!state.activeSession) return 0;
    return calculateDuration(state.activeSession.startTime);
};
