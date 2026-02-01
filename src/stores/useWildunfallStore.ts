/**
 * Wildunfall Store
 *
 * Zustand store for wildlife collision incident management:
 * incidents, on-call roster, dispatch, and response metrics.
 */

import { create } from 'zustand';

// ============================================================================
// Types
// ============================================================================

export interface WildunfallIncident {
  id: string;
  reporterId: string;
  revierId?: string;
  time: string;
  geo: { lat: number; lng: number };
  suspectedSpecies?: string;
  injuryStatus?: 'unknown' | 'likely_alive' | 'likely_dead';
  reporterNotes?: string;
  status: 'open' | 'accepted' | 'arrived' | 'resolved' | 'closed';
  responderId?: string;
  acceptedAt?: string;
  arrivedAt?: string;
  resolvedAt?: string;
  outcome?: string;
  photos: string[];
  createdAt: string;
  updatedAt: string;
}

export interface OncallResponder {
  id: string;
  revierId: string;
  userId: string;
  priority: number;
  active: boolean;
  phone?: string;
  notifyMode: 'in_app' | 'sms' | 'whatsapp_link';
}

export interface WildunfallMetrics {
  totalIncidents: number;
  resolved: number;
  open: number;
  resolutionRate: number;
  avgAcceptTimeMinutes: number | null;
}

export interface WildunfallState {
  incidents: WildunfallIncident[];
  activeIncident: WildunfallIncident | null;
  oncallRoster: OncallResponder[];
  metrics: WildunfallMetrics | null;
  loading: boolean;
  error: string | null;
}

export interface WildunfallActions {
  fetchIncidents: (filters?: { status?: string; revierId?: string }) => Promise<void>;
  reportIncident: (incident: { geo: { lat: number; lng: number }; suspectedSpecies?: string; injuryStatus?: string; reporterNotes?: string; photos?: string[] }) => Promise<void>;
  updateIncidentStatus: (id: string, status: string, data?: { responderId?: string; outcome?: string; photos?: string[] }) => Promise<void>;
  selectIncident: (id: string | null) => void;
  fetchOncallRoster: (revierId?: string) => Promise<void>;
  addToRoster: (responder: { revierId: string; userId: string; priority?: number; phone?: string; notifyMode?: string }) => Promise<void>;
  removeFromRoster: (id: string) => Promise<void>;
  dispatchAlert: (incidentId: string) => Promise<void>;
  fetchMetrics: () => Promise<void>;
}

export type WildunfallStore = WildunfallState & WildunfallActions;

// ============================================================================
// Store
// ============================================================================

const API = '/api/v1/jagd/wildunfall';

export const useWildunfallStore = create<WildunfallStore>((set, get) => ({
  incidents: [],
  activeIncident: null,
  oncallRoster: [],
  metrics: null,
  loading: false,
  error: null,

  fetchIncidents: async (filters) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.revierId) params.set('revierId', filters.revierId);
      const res = await fetch(`${API}/incidents?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ incidents: data.incidents, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  reportIncident: async (incident) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incident),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set((s) => ({ incidents: [data.incident, ...s.incidents], activeIncident: data.incident, loading: false }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  updateIncidentStatus: async (id, status, data) => {
    set({ error: null });
    try {
      const res = await fetch(`${API}/incidents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...data }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      set((s) => ({
        incidents: s.incidents.map((i) => (i.id === id ? result.incident : i)),
        activeIncident: s.activeIncident?.id === id ? result.incident : s.activeIncident,
      }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  selectIncident: (id) => {
    const incident = id ? get().incidents.find((i) => i.id === id) ?? null : null;
    set({ activeIncident: incident });
  },

  fetchOncallRoster: async (revierId) => {
    try {
      const params = new URLSearchParams();
      if (revierId) params.set('revierId', revierId);
      const res = await fetch(`${API}/oncall?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ oncallRoster: data.roster });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  addToRoster: async (responder) => {
    try {
      const res = await fetch(`${API}/oncall`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(responder),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set((s) => ({ oncallRoster: [...s.oncallRoster, data.responder] }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  removeFromRoster: async (id) => {
    try {
      const res = await fetch(`${API}/oncall/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      set((s) => ({ oncallRoster: s.oncallRoster.filter((r) => r.id !== id) }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  dispatchAlert: async (incidentId) => {
    try {
      const res = await fetch(`${API}/dispatch/${incidentId}`, { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  fetchMetrics: async () => {
    try {
      const res = await fetch(`${API}/metrics`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ metrics: data.metrics });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },
}));
