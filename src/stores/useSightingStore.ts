/**
 * Sighting Store
 *
 * Zustand store for community wildlife sightings with privacy protection.
 */

import { create } from 'zustand';

// ============================================================================
// Types
// ============================================================================

export interface Sighting {
  id: string;
  species: string;
  confidence: number;
  description?: string;
  photoUrls: string[];
  gridCell: string;
  bundesland?: string;
  observedAt: string;
  publishAt: string;
  status: 'pending' | 'published' | 'hidden' | 'deleted';
  createdAt: string;
}

export interface SightingAggregate {
  gridCell: string;
  species: string;
  timeWindow: string;
  sightingCount: number;
  trendPercentage?: number;
  contributorCount: number;
}

export interface SightingState {
  sightings: Sighting[];
  aggregates: SightingAggregate[];
  loading: boolean;
  error: string | null;
}

export interface SightingActions {
  fetchSightings: (filters?: { species?: string; gridCell?: string }) => Promise<void>;
  createSighting: (sighting: { species: string; confidence: number; description?: string; photoUrls?: string[]; lat: number; lng: number; observedAt: string }) => Promise<void>;
  fetchAggregates: (gridCell?: string) => Promise<void>;
}

export type SightingStore = SightingState & SightingActions;

// ============================================================================
// Store
// ============================================================================

const API = '/api/v1/jagd/sightings';

export const useSightingStore = create<SightingStore>((set) => ({
  sightings: [],
  aggregates: [],
  loading: false,
  error: null,

  fetchSightings: async (filters) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.species) params.set('species', filters.species);
      if (filters?.gridCell) params.set('gridCell', filters.gridCell);
      const res = await fetch(`${API}?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ sightings: data.sightings ?? [], loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  createSighting: async (sighting) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sighting),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set((s) => ({ sightings: [data.sighting, ...s.sightings], loading: false }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchAggregates: async (gridCell) => {
    try {
      const params = new URLSearchParams();
      if (gridCell) params.set('gridCell', gridCell);
      const res = await fetch(`${API}/aggregates?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ aggregates: data.aggregates ?? [] });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },
}));
