/**
 * Nachsuche Store
 *
 * Zustand store for tracking/search case management:
 * cases, team assignments, track segments, outcome analytics.
 */

import { create } from 'zustand';

// ============================================================================
// Types
// ============================================================================

export interface NachsucheCase {
  id: string;
  sessionId: string;
  shotEventId?: string;
  shooterId: string;
  revierId?: string;
  geo: { lat: number; lng: number };
  shotConfidence: number;
  flightDirection?: string;
  signs: string[];
  waitTimeMinutes?: number;
  status: 'open' | 'started' | 'paused' | 'located' | 'recovered' | 'stopped' | 'closed';
  outcome?: string;
  lessonsLearned?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  caseId: string;
  userId: string;
  role: 'shooter' | 'handler' | 'dog' | 'driver' | 'safety_contact';
  dogName?: string;
  shareScope: 'private' | 'team_coarse';
  status: 'assigned' | 'accepted' | 'active' | 'completed';
}

export interface TrackSegment {
  id: string;
  caseId: string;
  recordedBy: string;
  geoStart: { lat: number; lng: number };
  geoEnd?: { lat: number; lng: number };
  startedAt: string;
  endedAt?: string;
  notes?: string;
  evidencePhotos: string[];
}

export interface NachsucheOutcomes {
  totalClosed: number;
  recovered: number;
  stopped: number;
  recoveryRate: number;
  avgConfidence: number | null;
}

export interface NachsucheState {
  cases: NachsucheCase[];
  activeCase: NachsucheCase | null;
  team: TeamMember[];
  tracks: TrackSegment[];
  outcomes: NachsucheOutcomes | null;
  loading: boolean;
  error: string | null;
}

export interface NachsucheActions {
  fetchCases: (filters?: { status?: string; sessionId?: string }) => Promise<void>;
  createCase: (data: { sessionId: string; geo: { lat: number; lng: number }; shotConfidence: number; flightDirection?: string; signs?: string[]; waitTimeMinutes?: number }) => Promise<void>;
  updateCaseStatus: (id: string, status: string, data?: { outcome?: string; lessonsLearned?: string }) => Promise<void>;
  selectCase: (id: string | null) => void;
  assignTeamMember: (caseId: string, member: { userId: string; role: string; dogName?: string }) => Promise<void>;
  updateTeamStatus: (memberId: string, status: string) => Promise<void>;
  addTrackSegment: (caseId: string, track: { geoStart: { lat: number; lng: number }; geoEnd?: { lat: number; lng: number }; notes?: string; evidencePhotos?: string[] }) => Promise<void>;
  fetchTracks: (caseId: string) => Promise<void>;
  fetchOutcomes: () => Promise<void>;
}

export type NachsucheStore = NachsucheState & NachsucheActions;

// ============================================================================
// Store
// ============================================================================

const API = '/api/v1/jagd/nachsuche';

export const useNachsucheStore = create<NachsucheStore>((set, get) => ({
  cases: [],
  activeCase: null,
  team: [],
  tracks: [],
  outcomes: null,
  loading: false,
  error: null,

  fetchCases: async (filters) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.sessionId) params.set('sessionId', filters.sessionId);
      const res = await fetch(`${API}/cases?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ cases: data.cases, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  createCase: async (caseData) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(caseData),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set((s) => ({ cases: [data.nachsuche, ...s.cases], activeCase: data.nachsuche, loading: false }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  updateCaseStatus: async (id, status, data) => {
    set({ error: null });
    try {
      const res = await fetch(`${API}/cases/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...data }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      set((s) => ({
        cases: s.cases.map((c) => (c.id === id ? result.nachsuche : c)),
        activeCase: s.activeCase?.id === id ? result.nachsuche : s.activeCase,
      }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  selectCase: (id) => {
    const c = id ? get().cases.find((c) => c.id === id) ?? null : null;
    set({ activeCase: c });
  },

  assignTeamMember: async (caseId, member) => {
    try {
      const res = await fetch(`${API}/cases/${caseId}/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(member),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set((s) => ({ team: [...s.team, data.member] }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  updateTeamStatus: async (memberId, status) => {
    try {
      const res = await fetch(`${API}/team/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set((s) => ({
        team: s.team.map((m) => (m.id === memberId ? data.member : m)),
      }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  addTrackSegment: async (caseId, track) => {
    try {
      const res = await fetch(`${API}/cases/${caseId}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(track),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set((s) => ({ tracks: [...s.tracks, data.track] }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  fetchTracks: async (caseId) => {
    try {
      const res = await fetch(`${API}/cases/${caseId}/tracks`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ tracks: data.tracks });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  fetchOutcomes: async () => {
    try {
      const res = await fetch(`${API}/outcomes`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ outcomes: data.outcomes });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },
}));
