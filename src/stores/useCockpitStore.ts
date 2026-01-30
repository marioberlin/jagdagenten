/**
 * Cockpit Store
 *
 * Zustand state management for the Jagd-Agenten Daily Cockpit view.
 * Fetches huntability score, best time windows, weather conditions,
 * and recent hunting sessions from the backend.
 */

import { create } from 'zustand';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConditionsSnapshot {
  wind: { speed: number; direction: number; gustSpeed?: number };
  temperature: number;
  humidity: number;
  pressure: number;
  moonPhase: string;
  twilight: { civilDawn: string; sunrise: string; sunset: string; civilDusk: string };
  precipitation: number;
  cloudCover: number;
}

export interface HuntWindow {
  start: string;
  end: string;
  score: number;
  reason: string;
}

export interface RecentSession {
  id: string;
  sessionType: string;
  startTime: string;
  endTime?: string;
}

interface CockpitState {
  huntabilityScore: number | null;
  bestWindows: HuntWindow[];
  conditions: ConditionsSnapshot | null;
  recentSessions: RecentSession[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchDashboard: (lat: number, lon: number) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useCockpitStore = create<CockpitState>((set) => ({
  huntabilityScore: null,
  bestWindows: [],
  conditions: null,
  recentSessions: [],
  loading: false,
  error: null,

  fetchDashboard: async (lat: number, lon: number) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/v1/jagd/cockpit?lat=${lat}&lon=${lon}`);
      if (!res.ok) {
        throw new Error(`Cockpit fetch failed: ${res.status}`);
      }
      const data = await res.json();
      set({
        huntabilityScore: data.huntabilityScore,
        bestWindows: data.bestWindows ?? [],
        conditions: data.conditions ?? null,
        recentSessions: data.recentSessions ?? [],
        loading: false,
      });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  },
}));
