/**
 * Journal Store - Harvest/Sighting Journal
 *
 * Zustand store for managing hunting journal entries (sightings, harvests, notes).
 * Entries are persisted via the /api/v1/jagd/journal backend which stores them
 * as timeline_events in PostgreSQL.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export interface JournalEntry {
  id: string;
  sessionId?: string;
  entryType: 'sighting' | 'harvest' | 'note';
  species?: string;
  time: string;
  location?: { lat: number; lon: number };
  notes: string;
  photos: string[];
  wildbretWeight?: number;
  processingSteps?: string[];
}

export interface JournalFilter {
  entryType?: string;
  species?: string;
  dateRange?: { from: string; to: string };
}

interface JournalState {
  entries: JournalEntry[];
  loading: boolean;
  error: string | null;
  filter: JournalFilter;
}

interface JournalActions {
  fetchEntries: () => Promise<void>;
  addEntry: (entry: Omit<JournalEntry, 'id'>) => Promise<void>;
  updateEntry: (id: string, updates: Partial<JournalEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  setFilter: (filter: Partial<JournalFilter>) => void;
}

export type JournalStore = JournalState & JournalActions;

// ============================================================================
// API Helpers
// ============================================================================

const API_BASE = '/api/v1/jagd/journal';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ============================================================================
// Store
// ============================================================================

export const useJournalStore = create<JournalStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      entries: [],
      loading: false,
      error: null,
      filter: {},

      // Fetch all entries (respects current filter)
      fetchEntries: async () => {
        set({ loading: true, error: null });
        try {
          const { filter } = get();
          const params = new URLSearchParams();
          if (filter.entryType) params.set('entryType', filter.entryType);
          if (filter.species) params.set('species', filter.species);
          if (filter.dateRange?.from) params.set('from', filter.dateRange.from);
          if (filter.dateRange?.to) params.set('to', filter.dateRange.to);

          const qs = params.toString();
          const url = qs ? `${API_BASE}?${qs}` : API_BASE;
          const data = await apiFetch<{ entries: JournalEntry[] }>(url);
          set({ entries: data.entries, loading: false });
        } catch (err) {
          set({ error: (err as Error).message, loading: false });
        }
      },

      // Create a new journal entry
      addEntry: async (entry) => {
        set({ loading: true, error: null });
        try {
          const data = await apiFetch<{ entry: JournalEntry }>(API_BASE, {
            method: 'POST',
            body: JSON.stringify(entry),
          });
          set((state) => ({
            entries: [data.entry, ...state.entries],
            loading: false,
          }));
        } catch (err) {
          set({ error: (err as Error).message, loading: false });
        }
      },

      // Update an existing entry
      updateEntry: async (id, updates) => {
        set({ loading: true, error: null });
        try {
          const data = await apiFetch<{ entry: JournalEntry }>(`${API_BASE}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
          });
          set((state) => ({
            entries: state.entries.map((e) => (e.id === id ? data.entry : e)),
            loading: false,
          }));
        } catch (err) {
          set({ error: (err as Error).message, loading: false });
        }
      },

      // Delete an entry
      deleteEntry: async (id) => {
        set({ loading: true, error: null });
        try {
          await apiFetch<{ success: boolean }>(`${API_BASE}/${id}`, {
            method: 'DELETE',
          });
          set((state) => ({
            entries: state.entries.filter((e) => e.id !== id),
            loading: false,
          }));
        } catch (err) {
          set({ error: (err as Error).message, loading: false });
        }
      },

      // Update filter (does not refetch automatically; caller should invoke fetchEntries)
      setFilter: (newFilter) => {
        set((state) => ({
          filter: { ...state.filter, ...newFilter },
        }));
      },
    }),
    { name: 'JournalStore', enabled: process.env.NODE_ENV === 'development' },
  ),
);
