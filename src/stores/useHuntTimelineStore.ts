/**
 * Hunt Timeline Store
 *
 * Zustand store managing hunt sessions and timeline events
 * for the Jagd-Agenten hunting companion app.
 */

import { create } from 'zustand';

// ============================================================================
// Types
// ============================================================================

export interface HuntSession {
  id: string;
  sessionType: 'ansitz' | 'pirsch' | 'drueckjagd' | 'other';
  startTime: string;
  endTime?: string;
  geoMode: 'none' | 'coarse_grid' | 'precise';
  geoLat?: number;
  geoLon?: number;
  participants: string[];
  privacyMode: 'private' | 'team_event_only' | 'public_blurred';
  weatherSnapshot?: Record<string, unknown>;
  equipmentSnapshot?: Record<string, unknown>;
}

export interface TimelineEvent {
  id: string;
  sessionId: string;
  eventType: 'sighting' | 'shot' | 'harvest' | 'note' | 'processing' | 'handover';
  time: string;
  data: Record<string, unknown>;
  photos: string[];
  geoMode: 'none' | 'coarse_grid' | 'precise';
  geoLat?: number;
  geoLon?: number;
}

// ============================================================================
// Store State & Actions
// ============================================================================

interface HuntTimelineState {
  sessions: HuntSession[];
  activeSession: HuntSession | null;
  events: TimelineEvent[];
  loading: boolean;
  error: string | null;
}

interface HuntTimelineActions {
  startSession: (params: {
    sessionType: HuntSession['sessionType'];
    geoLat?: number;
    geoLon?: number;
    privacyMode?: HuntSession['privacyMode'];
  }) => Promise<void>;
  endSession: (sessionId: string) => Promise<void>;
  logEvent: (params: {
    sessionId: string;
    eventType: TimelineEvent['eventType'];
    data: Record<string, unknown>;
    photos?: string[];
  }) => Promise<void>;
  fetchSessions: () => Promise<void>;
  fetchEvents: (sessionId: string) => Promise<void>;
}

export type HuntTimelineStore = HuntTimelineState & HuntTimelineActions;

// ============================================================================
// API Client
// ============================================================================

const API_BASE = '/api/v1/jagd';

async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: HuntTimelineState = {
  sessions: [],
  activeSession: null,
  events: [],
  loading: false,
  error: null,
};

// ============================================================================
// Store
// ============================================================================

export const useHuntTimelineStore = create<HuntTimelineStore>()((set) => ({
  ...initialState,

  startSession: async (params) => {
    set({ loading: true, error: null });
    try {
      const data = await apiRequest<{ session: HuntSession }>('/sessions', {
        method: 'POST',
        body: JSON.stringify({
          sessionType: params.sessionType,
          geoLat: params.geoLat,
          geoLon: params.geoLon,
          privacyMode: params.privacyMode ?? 'private',
        }),
      });
      set((state) => ({
        sessions: [data.session, ...state.sessions],
        activeSession: data.session,
        loading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to start session',
        loading: false,
      });
    }
  },

  endSession: async (sessionId) => {
    set({ loading: true, error: null });
    try {
      const data = await apiRequest<{ session: HuntSession }>(
        `/sessions/${sessionId}/end`,
        { method: 'PATCH' }
      );
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === sessionId ? data.session : s
        ),
        activeSession:
          state.activeSession?.id === sessionId ? null : state.activeSession,
        loading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to end session',
        loading: false,
      });
    }
  },

  logEvent: async (params) => {
    set({ loading: true, error: null });
    try {
      const data = await apiRequest<{ event: TimelineEvent }>('/events', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: params.sessionId,
          eventType: params.eventType,
          data: params.data,
          photos: params.photos ?? [],
        }),
      });
      set((state) => ({
        events: [data.event, ...state.events],
        loading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to log event',
        loading: false,
      });
    }
  },

  fetchSessions: async () => {
    set({ loading: true, error: null });
    try {
      const data = await apiRequest<{ sessions: HuntSession[] }>('/sessions');

      // Determine active session: first session without an endTime
      const active = data.sessions.find((s) => !s.endTime) ?? null;

      set({
        sessions: data.sessions,
        activeSession: active,
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch sessions',
        loading: false,
      });
    }
  },

  fetchEvents: async (sessionId) => {
    set({ loading: true, error: null });
    try {
      const data = await apiRequest<{ events: TimelineEvent[] }>(
        `/events?sessionId=${encodeURIComponent(sessionId)}`
      );
      set({ events: data.events, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch events',
        loading: false,
      });
    }
  },
}));
