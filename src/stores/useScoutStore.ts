/**
 * Scout Store
 *
 * Zustand store for managing hunt stands and conditions data
 * in the Jagd-Agenten Scout view.
 */

import { create } from 'zustand';

// ============================================================================
// Types
// ============================================================================

export interface WindEntry {
  direction: number;
  speed: number;
  timestamp: string;
}

export interface HuntStand {
  id: string;
  name: string;
  standType: string;
  geoLat: number;
  geoLon: number;
  notes?: string;
  windHistory: WindEntry[];
  performanceStats: Record<string, unknown>;
}

export interface ConditionsSnapshot {
  wind: { direction: number; speed: number };
  temperature: number;
  humidity: number;
  pressure: number;
  moonPhase: number;
  twilight: {
    civilDawn: string;
    sunrise: string;
    sunset: string;
    civilDusk: string;
  };
  timestamp: string;
}

export interface ScoutState {
  stands: HuntStand[];
  selectedStand: HuntStand | null;
  windData: WindEntry[];
  conditions: ConditionsSnapshot | null;
  loading: boolean;
  error: string | null;
}

export interface ScoutActions {
  fetchStands: () => Promise<void>;
  addStand: (stand: Omit<HuntStand, 'id' | 'windHistory' | 'performanceStats'>) => Promise<void>;
  updateStand: (id: string, updates: Partial<Pick<HuntStand, 'name' | 'standType' | 'notes' | 'geoLat' | 'geoLon'>>) => Promise<void>;
  deleteStand: (id: string) => Promise<void>;
  selectStand: (id: string) => void;
  fetchWindData: (standId: string) => Promise<void>;
  fetchConditions: (lat: number, lon: number) => Promise<void>;
}

export type ScoutStore = ScoutState & ScoutActions;

// ============================================================================
// API helpers
// ============================================================================

const API_BASE = '/api/v1/jagd/stands';

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `HTTP ${res.status}`);
  }
  return res.json();
}

// ============================================================================
// Store
// ============================================================================

export const useScoutStore = create<ScoutStore>((set, get) => ({
  // State
  stands: [],
  selectedStand: null,
  windData: [],
  conditions: null,
  loading: false,
  error: null,

  // Actions
  fetchStands: async () => {
    set({ loading: true, error: null });
    try {
      const data = await apiFetch<{ stands: HuntStand[] }>(API_BASE);
      set({ stands: data.stands, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  addStand: async (stand) => {
    set({ loading: true, error: null });
    try {
      const data = await apiFetch<{ stand: HuntStand }>(API_BASE, {
        method: 'POST',
        body: JSON.stringify(stand),
      });
      set((state) => ({
        stands: [...state.stands, data.stand],
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  updateStand: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const data = await apiFetch<{ stand: HuntStand }>(`${API_BASE}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      set((state) => ({
        stands: state.stands.map((s) => (s.id === id ? data.stand : s)),
        selectedStand: state.selectedStand?.id === id ? data.stand : state.selectedStand,
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  deleteStand: async (id) => {
    set({ loading: true, error: null });
    try {
      await apiFetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      set((state) => ({
        stands: state.stands.filter((s) => s.id !== id),
        selectedStand: state.selectedStand?.id === id ? null : state.selectedStand,
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  selectStand: (id) => {
    const stand = get().stands.find((s) => s.id === id) ?? null;
    set({ selectedStand: stand });
    if (stand) {
      get().fetchWindData(id);
      get().fetchConditions(stand.geoLat, stand.geoLon);
    }
  },

  fetchWindData: async (standId) => {
    try {
      const data = await apiFetch<{ stand: HuntStand }>(`${API_BASE}/${standId}`);
      set({ windData: data.stand.windHistory ?? [] });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  fetchConditions: async (lat, lon) => {
    try {
      const data = await apiFetch<ConditionsSnapshot>(
        `/api/v1/jagd/conditions?lat=${lat}&lon=${lon}`,
      );
      set({ conditions: data });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },
}));
