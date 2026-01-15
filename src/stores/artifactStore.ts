/**
 * Artifact Store
 *
 * Zustand store for managing artifact state in the frontend.
 * Handles fetching, caching, and real-time updates of artifacts.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export interface ArtifactPart {
  text?: string;
  file?: { uri?: string; bytes?: string; mimeType?: string; name?: string };
  data?: Record<string, unknown>;
}

export interface StoredArtifact {
  id: string;
  taskId: string;
  contextId: string;
  artifactId: string;
  name?: string;
  description?: string;
  parts: ArtifactPart[];
  metadata?: Record<string, unknown>;
  extensions?: string[];
  version: number;
  isStreaming: boolean;
  isComplete: boolean;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ArtifactSearchResult {
  artifact: StoredArtifact;
  score: number;
  highlights?: {
    name?: string;
    description?: string;
  };
}

export type ArtifactCategory =
  | 'trading'
  | 'analysis'
  | 'report'
  | 'chart'
  | 'portfolio'
  | 'alert'
  | 'custom';

export type ViewMode = 'grid' | 'list' | 'timeline' | 'graph';

// ============================================================================
// Category Constants
// ============================================================================

export const ARTIFACT_CATEGORIES = [
  { id: 'trading', label: 'Trading', icon: 'TrendingUp', color: 'bg-green-500/20' },
  { id: 'analysis', label: 'Analysis', icon: 'BarChart3', color: 'bg-blue-500/20' },
  { id: 'report', label: 'Report', icon: 'FileText', color: 'bg-gray-500/20' },
  { id: 'chart', label: 'Chart', icon: 'LineChart', color: 'bg-purple-500/20' },
  { id: 'portfolio', label: 'Portfolio', icon: 'Briefcase', color: 'bg-amber-500/20' },
  { id: 'alert', label: 'Alert', icon: 'Bell', color: 'bg-red-500/20' },
  { id: 'custom', label: 'Custom', icon: 'FileEdit', color: 'bg-pink-500/20' },
] as const;

// ============================================================================
// Store State
// ============================================================================

interface ArtifactState {
  // Data
  artifacts: StoredArtifact[];
  recentArtifacts: StoredArtifact[];
  selectedArtifact: StoredArtifact | null;
  searchResults: ArtifactSearchResult[];

  // UI State
  isLoading: boolean;
  isSearching: boolean;
  error: string | null;
  viewMode: ViewMode;
  searchQuery: string;
  categoryFilter: ArtifactCategory | null;

  // Dock State
  isDockVisible: boolean;
  pinnedArtifactIds: string[];
  newArtifactCount: number;

  // Quick Look
  quickLookArtifact: StoredArtifact | null;
  isQuickLookOpen: boolean;

  // Explorer
  isExplorerOpen: boolean;
}

interface ArtifactActions {
  // Data fetching
  fetchRecentArtifacts: (limit?: number) => Promise<void>;
  fetchArtifactsByTask: (taskId: string) => Promise<void>;
  fetchArtifactsByContext: (contextId: string) => Promise<void>;
  searchArtifacts: (query: string) => Promise<void>;
  getArtifact: (id: string) => Promise<StoredArtifact | null>;

  // Selection
  selectArtifact: (artifact: StoredArtifact | null) => void;

  // UI State
  setViewMode: (mode: ViewMode) => void;
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (category: ArtifactCategory | null) => void;
  setError: (error: string | null) => void;

  // Dock
  toggleDock: () => void;
  showDock: () => void;
  hideDock: () => void;
  pinArtifact: (id: string) => void;
  unpinArtifact: (id: string) => void;
  clearNewArtifactCount: () => void;

  // Quick Look
  openQuickLook: (artifact: StoredArtifact) => void;
  closeQuickLook: () => void;

  // Explorer
  openExplorer: () => void;
  closeExplorer: () => void;
  toggleExplorer: () => void;

  // Real-time updates
  addArtifact: (artifact: StoredArtifact) => void;
  updateArtifact: (id: string, updates: Partial<StoredArtifact>) => void;
  removeArtifact: (id: string) => void;
  deleteArtifact: (id: string) => Promise<void>;

  // Utility
  reset: () => void;
}

export type ArtifactStore = ArtifactState & ArtifactActions;

// ============================================================================
// API Client
// ============================================================================

const API_BASE = '/api/artifacts';

async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: ArtifactState = {
  artifacts: [],
  recentArtifacts: [],
  selectedArtifact: null,
  searchResults: [],
  isLoading: false,
  isSearching: false,
  error: null,
  viewMode: 'grid',
  searchQuery: '',
  categoryFilter: null,
  isDockVisible: true,
  pinnedArtifactIds: [],
  newArtifactCount: 0,
  quickLookArtifact: null,
  isQuickLookOpen: false,
  isExplorerOpen: false,
};

// ============================================================================
// Store
// ============================================================================

export const useArtifactStore = create<ArtifactStore>()(
  persist(
    (set, _get) => ({
      ...initialState,

      // Data fetching
      fetchRecentArtifacts: async (limit = 20) => {
        set({ isLoading: true, error: null });

        // Helper to fetch from tasks
        const fetchFromTasks = async () => {
          const taskData = await apiRequest<{
            artifacts: Array<{
              artifactId: string;
              taskId: string;
              contextId: string;
              name?: string;
              parts: unknown[];
              metadata?: Record<string, unknown>;
              createdAt: string;
            }>;
          }>(`/from-tasks?limit=${limit}`);

          // Transform task artifacts to StoredArtifact format
          return taskData.artifacts.map((a) => ({
            id: a.artifactId,
            taskId: a.taskId,
            contextId: a.contextId,
            artifactId: a.artifactId,
            name: a.name,
            parts: a.parts as ArtifactPart[],
            metadata: a.metadata,
            version: 1,
            isStreaming: false,
            isComplete: true,
            createdAt: a.createdAt,
            updatedAt: a.createdAt,
          })) as StoredArtifact[];
        };

        try {
          // Try the artifact store first
          const data = await apiRequest<{ artifacts: StoredArtifact[] }>(
            `/recent?limit=${limit}`
          );

          // If artifact store is empty, fall back to tasks
          if (data.artifacts.length === 0) {
            const taskArtifacts = await fetchFromTasks();
            set({ recentArtifacts: taskArtifacts, isLoading: false });
          } else {
            set({ recentArtifacts: data.artifacts, isLoading: false });
          }
        } catch {
          // Fall back to extracting artifacts from tasks on error
          try {
            const artifacts = await fetchFromTasks();
            set({ recentArtifacts: artifacts, isLoading: false });
          } catch (fallbackError) {
            set({
              error: fallbackError instanceof Error ? fallbackError.message : 'Failed to fetch artifacts',
              isLoading: false,
            });
          }
        }
      },

      fetchArtifactsByTask: async (taskId: string) => {
        set({ isLoading: true, error: null });
        try {
          const data = await apiRequest<{ artifacts: StoredArtifact[] }>(
            `/by-task/${taskId}`
          );
          set({ artifacts: data.artifacts, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch artifacts',
            isLoading: false,
          });
        }
      },

      fetchArtifactsByContext: async (contextId: string) => {
        set({ isLoading: true, error: null });
        try {
          const data = await apiRequest<{ artifacts: StoredArtifact[] }>(
            `/by-context/${contextId}`
          );
          set({ artifacts: data.artifacts, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch artifacts',
            isLoading: false,
          });
        }
      },

      searchArtifacts: async (query: string) => {
        if (!query.trim()) {
          set({ searchResults: [], isSearching: false });
          return;
        }

        set({ isSearching: true, searchQuery: query });
        try {
          const data = await apiRequest<{ results: ArtifactSearchResult[] }>(
            `/search?q=${encodeURIComponent(query)}`
          );
          set({ searchResults: data.results, isSearching: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Search failed',
            isSearching: false,
          });
        }
      },

      getArtifact: async (id: string) => {
        try {
          const data = await apiRequest<{ artifact: StoredArtifact }>(`/${id}`);
          return data.artifact;
        } catch {
          return null;
        }
      },

      // Selection
      selectArtifact: (artifact) => set({ selectedArtifact: artifact }),

      // UI State
      setViewMode: (mode) => set({ viewMode: mode }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setCategoryFilter: (category) => set({ categoryFilter: category }),
      setError: (error) => set({ error }),

      // Dock
      toggleDock: () => set((state) => ({ isDockVisible: !state.isDockVisible })),
      showDock: () => set({ isDockVisible: true }),
      hideDock: () => set({ isDockVisible: false }),

      pinArtifact: (id) =>
        set((state) => ({
          pinnedArtifactIds: state.pinnedArtifactIds.includes(id)
            ? state.pinnedArtifactIds
            : [...state.pinnedArtifactIds, id],
        })),

      unpinArtifact: (id) =>
        set((state) => ({
          pinnedArtifactIds: state.pinnedArtifactIds.filter((pid) => pid !== id),
        })),

      clearNewArtifactCount: () => set({ newArtifactCount: 0 }),

      // Quick Look
      openQuickLook: (artifact) =>
        set({ quickLookArtifact: artifact, isQuickLookOpen: true }),

      closeQuickLook: () =>
        set({ quickLookArtifact: null, isQuickLookOpen: false }),

      // Explorer
      openExplorer: () => set({ isExplorerOpen: true }),
      closeExplorer: () => set({ isExplorerOpen: false }),
      toggleExplorer: () => set((state) => ({ isExplorerOpen: !state.isExplorerOpen })),

      // Real-time updates
      addArtifact: (artifact) =>
        set((state) => ({
          artifacts: [artifact, ...state.artifacts],
          recentArtifacts: [artifact, ...state.recentArtifacts].slice(0, 20),
          newArtifactCount: state.newArtifactCount + 1,
        })),

      updateArtifact: (id, updates) =>
        set((state) => ({
          artifacts: state.artifacts.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
          recentArtifacts: state.recentArtifacts.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
          selectedArtifact:
            state.selectedArtifact?.id === id
              ? { ...state.selectedArtifact, ...updates }
              : state.selectedArtifact,
          quickLookArtifact:
            state.quickLookArtifact?.id === id
              ? { ...state.quickLookArtifact, ...updates }
              : state.quickLookArtifact,
        })),

      removeArtifact: (id) =>
        set((state) => ({
          artifacts: state.artifacts.filter((a) => a.id !== id),
          recentArtifacts: state.recentArtifacts.filter((a) => a.id !== id),
          selectedArtifact:
            state.selectedArtifact?.id === id ? null : state.selectedArtifact,
          quickLookArtifact:
            state.quickLookArtifact?.id === id ? null : state.quickLookArtifact,
          pinnedArtifactIds: state.pinnedArtifactIds.filter((pid) => pid !== id),
        })),

      deleteArtifact: async (id) => {
        try {
          await apiRequest(`/${id}`, { method: 'DELETE' });
          // Remove from local state
          set((state) => ({
            artifacts: state.artifacts.filter((a) => a.id !== id),
            recentArtifacts: state.recentArtifacts.filter((a) => a.id !== id),
            selectedArtifact:
              state.selectedArtifact?.id === id ? null : state.selectedArtifact,
            quickLookArtifact:
              state.quickLookArtifact?.id === id ? null : state.quickLookArtifact,
            pinnedArtifactIds: state.pinnedArtifactIds.filter((pid) => pid !== id),
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Delete failed' });
          throw error;
        }
      },

      // Utility
      reset: () => set(initialState),
    }),
    {
      name: 'artifact-store',
      partialize: (state) => ({
        pinnedArtifactIds: state.pinnedArtifactIds,
        isDockVisible: state.isDockVisible,
        viewMode: state.viewMode,
      }),
    }
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const selectPinnedArtifacts = (state: ArtifactStore) =>
  state.recentArtifacts.filter((a) => state.pinnedArtifactIds.includes(a.id));

export const selectUnpinnedRecentArtifacts = (state: ArtifactStore) =>
  state.recentArtifacts.filter((a) => !state.pinnedArtifactIds.includes(a.id));

export const selectFilteredArtifacts = (state: ArtifactStore) => {
  let artifacts = state.artifacts;

  if (state.categoryFilter) {
    artifacts = artifacts.filter(
      (a) => (a.metadata?.category as string) === state.categoryFilter
    );
  }

  return artifacts;
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get Lucide icon name for artifact based on category.
 * Returns the name of a Lucide React icon component.
 */
export type ArtifactIconName =
  | 'TrendingUp'
  | 'BarChart3'
  | 'FileText'
  | 'LineChart'
  | 'Briefcase'
  | 'Bell'
  | 'Folder'
  | 'FileEdit';

export function getArtifactIcon(artifact: StoredArtifact): ArtifactIconName {
  const category = artifact.metadata?.category as string | undefined;

  switch (category) {
    case 'trading':
      return 'TrendingUp';
    case 'analysis':
      return 'BarChart3';
    case 'report':
      return 'FileText';
    case 'chart':
      return 'LineChart';
    case 'portfolio':
      return 'Briefcase';
    case 'alert':
      return 'Bell';
    default:
      // Infer from parts
      if (artifact.parts.some((p) => p.file)) return 'Folder';
      if (artifact.parts.some((p) => p.data)) return 'FileEdit';
      return 'FileText';
  }
}

export function getArtifactPreviewText(artifact: StoredArtifact): string {
  // Find first text part
  const textPart = artifact.parts.find((p) => p.text);
  if (textPart?.text) {
    return textPart.text.slice(0, 150) + (textPart.text.length > 150 ? '...' : '');
  }

  // Show data summary
  const dataPart = artifact.parts.find((p) => p.data);
  if (dataPart?.data) {
    return `Data: ${Object.keys(dataPart.data).join(', ')}`;
  }

  // Show file info
  const filePart = artifact.parts.find((p) => p.file);
  if (filePart?.file) {
    return `File: ${filePart.file.name || filePart.file.mimeType || 'Unknown'}`;
  }

  return 'No preview available';
}

export function formatArtifactDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}
