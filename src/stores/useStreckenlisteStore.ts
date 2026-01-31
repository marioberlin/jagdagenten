/**
 * Streckenliste Store
 *
 * Zustand store for harvest list management and Bundesland-specific reporting.
 */

import { create } from 'zustand';

// ============================================================================
// Types
// ============================================================================

export interface HarvestEntry {
  id: string;
  date: string;
  species: string;
  gender: 'male' | 'female' | 'unknown';
  age?: string;
  weight?: number;
  location?: string;
  revier?: string;
}

export interface StreckenlisteState {
  harvests: HarvestEntry[];
  selectedBundesland: string | null;
  jagdjahr: string;
  loading: boolean;
  error: string | null;
}

export interface StreckenlisteActions {
  fetchHarvests: (jagdjahr?: string) => Promise<void>;
  addHarvest: (harvest: Omit<HarvestEntry, 'id'>) => Promise<void>;
  updateHarvest: (id: string, updates: Partial<HarvestEntry>) => Promise<void>;
  deleteHarvest: (id: string) => Promise<void>;
  generatePDF: (bundesland: string, jagdjahr: string) => Promise<string | null>;
  setBundesland: (bl: string) => void;
}

export type StreckenlisteStore = StreckenlisteState & StreckenlisteActions;

// ============================================================================
// Store
// ============================================================================

const API = '/api/v1/jagd/streckenliste';

// Calculate current Jagdjahr (April 1 - March 31)
function currentJagdjahr(): string {
  const now = new Date();
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}/${year + 1}`;
}

export const useStreckenlisteStore = create<StreckenlisteStore>((set) => ({
  harvests: [],
  selectedBundesland: null,
  jagdjahr: currentJagdjahr(),
  loading: false,
  error: null,

  fetchHarvests: async (jagdjahr) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (jagdjahr) params.set('jagdjahr', jagdjahr);
      const res = await fetch(`${API}/harvests?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ harvests: data.harvests ?? [], loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  addHarvest: async (harvest) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/harvests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(harvest),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set((s) => ({ harvests: [data.harvest, ...s.harvests], loading: false }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  updateHarvest: async (id, updates) => {
    try {
      const res = await fetch(`${API}/harvests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set((s) => ({
        harvests: s.harvests.map((h) => (h.id === id ? data.harvest : h)),
      }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  deleteHarvest: async (id) => {
    try {
      const res = await fetch(`${API}/harvests/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      set((s) => ({ harvests: s.harvests.filter((h) => h.id !== id) }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  generatePDF: async (bundesland, jagdjahr) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bundesland, jagdjahr }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ loading: false });
      return data.pdfUrl ?? null;
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      return null;
    }
  },

  setBundesland: (bl) => {
    set({ selectedBundesland: bl });
  },
}));
