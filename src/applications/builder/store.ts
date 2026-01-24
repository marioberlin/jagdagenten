/**
 * Builder Store
 *
 * Zustand state management for the Builder app.
 */

import { create } from 'zustand';

export type BuilderTab = 'new' | 'active' | 'edit' | 'history';

export interface BuildRecord {
  id: string;
  appId: string;
  phase: string;
  progress: { completed: number; total: number; currentStory?: string };
  description: string;
  createdAt: string;
  updatedAt: string;
  error?: string;
}

export interface ContextFile {
  name: string;
  size: number;
  modified: string;
}

export interface AppDoc {
  name: string;
  content: string;
}

interface BuilderState {
  currentTab: BuilderTab;
  builds: BuildRecord[];
  activeBuildId: string | null;
  selectedAppId: string | null;
  contextFiles: ContextFile[];
  appDocs: AppDoc[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setTab: (tab: BuilderTab) => void;
  submitBuild: (description: string, options?: BuildOptions) => Promise<void>;
  approveBuild: (buildId: string) => Promise<void>;
  resumeBuild: (buildId: string) => Promise<void>;
  cancelBuild: (buildId: string) => Promise<void>;
  installBuild: (buildId: string) => Promise<void>;
  pollStatus: (buildId: string) => Promise<void>;
  loadHistory: () => Promise<void>;
  loadContext: (appId: string) => Promise<void>;
  loadAppDocs: (appId: string) => Promise<void>;
  deleteBuild: (buildId: string) => Promise<void>;
  editApp: (appId: string) => void;
}

interface BuildOptions {
  appId?: string;
  category?: string;
  hasAgent?: boolean;
  hasResources?: boolean;
  hasCustomComponents?: boolean;
  researchMode?: 'standard' | 'deep';
  buildMode?: 'automatic' | 'review';
}

const API_BASE = '/api/builder';

export const useBuilderStore = create<BuilderState>((set, _get) => ({
  currentTab: 'new',
  builds: [],
  activeBuildId: null,
  selectedAppId: null,
  contextFiles: [],
  appDocs: [],
  isLoading: false,
  error: null,

  setTab: (tab) => set({ currentTab: tab }),

  submitBuild: async (description, options = {}) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/builds/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, ...options }),
      });
      const record = await res.json();
      set((state) => ({
        builds: [...state.builds, record],
        activeBuildId: record.id,
        isLoading: false,
        currentTab: 'active',
      }));

      // Immediately start execution (runs in background on server)
      await fetch(`${API_BASE}/builds/${record.id}/execute`, { method: 'POST' });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Build failed', isLoading: false });
    }
  },

  approveBuild: async (buildId) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_BASE}/builds/${buildId}/approve`, { method: 'POST' });
      const record = await res.json();
      set((state) => ({
        builds: state.builds.map(b => b.id === buildId ? { ...b, ...record } : b),
        isLoading: false,
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Approve failed', isLoading: false });
    }
  },

  resumeBuild: async (buildId) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_BASE}/builds/${buildId}/resume`, { method: 'POST' });
      const record = await res.json();
      set((state) => ({
        builds: state.builds.map(b => b.id === buildId ? { ...b, ...record } : b),
        activeBuildId: buildId,
        currentTab: 'active',
        isLoading: false,
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Resume failed', isLoading: false });
    }
  },

  installBuild: async (buildId) => {
    set({ isLoading: true });
    try {
      await fetch(`${API_BASE}/builds/${buildId}/install`, { method: 'POST' });
      // Page will reload due to Vite detecting new files — that's expected
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Install failed', isLoading: false });
    }
  },

  cancelBuild: async (buildId) => {
    try {
      await fetch(`${API_BASE}/builds/${buildId}/cancel`, { method: 'POST' });
      set((state) => ({
        builds: state.builds.map(b => b.id === buildId ? { ...b, phase: 'failed', error: 'Cancelled' } : b),
        activeBuildId: state.activeBuildId === buildId ? null : state.activeBuildId,
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Cancel failed' });
    }
  },

  pollStatus: async (buildId) => {
    try {
      const res = await fetch(`${API_BASE}/builds/${buildId}/status`);
      const record = await res.json();
      set((state) => ({
        builds: state.builds.map(b => b.id === buildId ? { ...b, ...record } : b),
      }));
    } catch {
      // Silently fail on poll
    }
  },

  loadHistory: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_BASE}/builds/history`);
      const builds = await res.json();
      set({ builds, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Load failed', isLoading: false });
    }
  },

  loadContext: async (appId) => {
    try {
      const res = await fetch(`${API_BASE}/context/${appId}`);
      const data = await res.json();
      set({ contextFiles: data.files || [], selectedAppId: appId });
    } catch {
      set({ contextFiles: [] });
    }
  },

  loadAppDocs: async (appId) => {
    try {
      const res = await fetch(`${API_BASE}/apps/${appId}/docs`);
      const data = await res.json();
      set({ appDocs: data.docs || [] });
    } catch {
      set({ appDocs: [] });
    }
  },

  deleteBuild: async (buildId) => {
    try {
      await fetch(`${API_BASE}/builds/${buildId}`, { method: 'DELETE' });
      set((state) => ({
        builds: state.builds.filter(b => b.id !== buildId),
        activeBuildId: state.activeBuildId === buildId ? null : state.activeBuildId,
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Delete failed' });
    }
  },

  editApp: (appId) => {
    set({ selectedAppId: appId, currentTab: 'edit' });
  },
}));
