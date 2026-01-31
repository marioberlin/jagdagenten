/**
 * Hege & Pflege Store
 *
 * Zustand store for conservation work management:
 * projects, activities, mowing notices, and weekly summaries.
 */

import { create } from 'zustand';

// ============================================================================
// Types
// ============================================================================

export interface HegeProject {
  id: string;
  userId: string;
  revierId?: string;
  projectType: 'revierarbeit' | 'kitzrettung' | 'feeding_round' | 'nest_boxes' | 'habitat' | 'infrastructure';
  title: string;
  date: string;
  meetingPointGeo?: { lat: number; lng: number };
  teamScope: 'private' | 'team';
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  tasks: Array<{ text: string; done: boolean }>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HegeActivity {
  id: string;
  userId: string;
  projectId?: string;
  activityType: 'feeding' | 'nest_box' | 'habitat' | 'infrastructure' | 'counting' | 'note';
  time: string;
  geo?: { lat: number; lng: number };
  data: Record<string, unknown>;
  photos: string[];
  createdAt: string;
}

export interface MowingNotice {
  id: string;
  revierId?: string;
  fieldName: string;
  geo: { lat: number; lng: number };
  mowingStart: string;
  mowingEnd?: string;
  contactName?: string;
  contactPhone?: string;
  notes?: string;
  status: 'pending' | 'assigned' | 'cleared' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface WeeklySummary {
  weekStart: string;
  totalActivities: number;
  byType: Record<string, number>;
}

export interface HegeState {
  projects: HegeProject[];
  activities: HegeActivity[];
  mowingNotices: MowingNotice[];
  weeklySummary: WeeklySummary | null;
  loading: boolean;
  error: string | null;
}

export interface HegeActions {
  fetchProjects: (filters?: { status?: string; type?: string }) => Promise<void>;
  createProject: (project: Partial<HegeProject> & { projectType: string; title: string; date: string }) => Promise<void>;
  updateProject: (id: string, updates: Partial<HegeProject>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  fetchActivities: (projectId?: string) => Promise<void>;
  logActivity: (activity: { activityType: string; time?: string; projectId?: string; geo?: { lat: number; lng: number }; data?: Record<string, unknown>; photos?: string[] }) => Promise<void>;
  fetchWeeklySummary: () => Promise<void>;
  fetchMowingNotices: () => Promise<void>;
  createMowingNotice: (notice: { fieldName: string; geo: { lat: number; lng: number }; mowingStart: string; mowingEnd?: string; contactName?: string; contactPhone?: string; notes?: string }) => Promise<void>;
  updateMowingStatus: (id: string, status: string) => Promise<void>;
}

export type HegeStore = HegeState & HegeActions;

// ============================================================================
// Store
// ============================================================================

const API = '/api/v1/jagd/hege';

export const useHegeStore = create<HegeStore>((set) => ({
  projects: [],
  activities: [],
  mowingNotices: [],
  weeklySummary: null,
  loading: false,
  error: null,

  fetchProjects: async (filters) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.type) params.set('type', filters.type);
      const res = await fetch(`${API}/projects?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ projects: data.projects, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  createProject: async (project) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set((s) => ({ projects: [...s.projects, data.project], loading: false }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  updateProject: async (id, updates) => {
    set({ error: null });
    try {
      const res = await fetch(`${API}/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set((s) => ({
        projects: s.projects.map((p) => (p.id === id ? data.project : p)),
      }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  deleteProject: async (id) => {
    set({ error: null });
    try {
      const res = await fetch(`${API}/projects/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  fetchActivities: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (projectId) params.set('projectId', projectId);
      const res = await fetch(`${API}/activities?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ activities: data.activities, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  logActivity: async (activity) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activity),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set((s) => ({ activities: [data.activity, ...s.activities], loading: false }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchWeeklySummary: async () => {
    try {
      const res = await fetch(`${API}/summary`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ weeklySummary: data });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  fetchMowingNotices: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/mowing`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ mowingNotices: data.notices, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  createMowingNotice: async (notice) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/mowing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notice),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set((s) => ({ mowingNotices: [...s.mowingNotices, data.notice], loading: false }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  updateMowingStatus: async (id, status) => {
    try {
      const res = await fetch(`${API}/mowing/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set((s) => ({
        mowingNotices: s.mowingNotices.map((n) => (n.id === id ? data.notice : n)),
      }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },
}));
