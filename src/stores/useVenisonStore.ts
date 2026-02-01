/**
 * Venison Store
 *
 * Zustand store for venison tracking and food safety QR codes.
 */

import { create } from 'zustand';

// ============================================================================
// Types
// ============================================================================

export interface CoolingEvent {
  id: string;
  timestamp: string;
  type: 'harvest' | 'transport' | 'storage' | 'butcher' | 'sale';
  temperature?: number;
  location?: string;
  notes?: string;
}

export interface VenisonEntry {
  id: string;
  harvestId: string;
  harvestDate: string;
  species: string;
  weight?: number;
  location?: string;
  revierName?: string;
  hunterName?: string;
  coolingChain: CoolingEvent[];
  createdAt: string;
}

export interface VenisonState {
  entries: VenisonEntry[];
  selectedEntry: VenisonEntry | null;
  loading: boolean;
  error: string | null;
}

export interface VenisonActions {
  fetchEntries: () => Promise<void>;
  createEntry: (entry: { harvestId: string; harvestDate: string; species: string; weight?: number; location?: string; revierName?: string; hunterName?: string }) => Promise<void>;
  addCoolingStep: (entryId: string, step: { type: string; temperature?: number; location?: string; notes?: string }) => Promise<void>;
  getLabelUrl: (entryId: string) => string;
  selectEntry: (id: string | null) => void;
}

export type VenisonStore = VenisonState & VenisonActions;

// ============================================================================
// Store
// ============================================================================

const API = '/api/v1/jagd/venison';

export const useVenisonStore = create<VenisonStore>((set, get) => ({
  entries: [],
  selectedEntry: null,
  loading: false,
  error: null,

  fetchEntries: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/list`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ entries: data.records ?? [], loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  createEntry: async (entry) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set((s) => ({ entries: [data.venison, ...s.entries], loading: false }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  addCoolingStep: async (entryId, step) => {
    try {
      const res = await fetch(`${API}/${entryId}/chain`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(step),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set((s) => ({
        entries: s.entries.map((e) => (e.id === entryId ? data.venison : e)),
        selectedEntry: s.selectedEntry?.id === entryId ? data.venison : s.selectedEntry,
      }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  getLabelUrl: (entryId) => {
    return `${API}/${entryId}/label`;
  },

  selectEntry: (id) => {
    const entry = id ? get().entries.find((e) => e.id === id) ?? null : null;
    set({ selectedEntry: entry });
  },
}));
