/**
 * AI Resource Store
 *
 * Zustand store for managing AI resources (prompts, memory, context, knowledge,
 * artifacts, skills, MCP tools) in the frontend.
 * Provides CRUD, search, clipboard, and subscription capabilities.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// Types (mirrors server/src/resources/types.ts for frontend use)
// ============================================================================

export type ResourceType = 'prompt' | 'memory' | 'context' | 'knowledge' | 'artifact' | 'skill' | 'mcp';
export type OwnerType = 'app' | 'agent' | 'system' | 'user';
export type SharePermission = 'read' | 'write' | 'copy';
export type Provenance = 'user_input' | 'agent_generated' | 'extracted' | 'consolidated' | 'imported';

export interface AIResource {
  id: string;
  resourceType: ResourceType;
  ownerType: OwnerType;
  ownerId?: string;
  name: string;
  description?: string;
  content?: string;
  parts: ResourcePart[];
  typeMetadata: Record<string, any>;
  version: number;
  parentId?: string;
  isActive: boolean;
  isPinned: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  accessedAt: string;
  provenance: Provenance;
  usageFrequency: number;
  syncToFile: boolean;
}

export type ResourcePart =
  | { type: 'text'; text: string }
  | { type: 'file'; file: { uri?: string; bytes?: string; mimeType?: string; name?: string } }
  | { type: 'data'; data: Record<string, unknown> };

export interface ResourceShare {
  id: string;
  resourceId: string;
  targetType: OwnerType;
  targetId: string;
  permission: SharePermission;
  sharedBy?: string;
  sharedAt: string;
}

export interface ResourceSearchResult {
  resource: AIResource;
  score: number;
  highlights?: {
    name?: string;
    description?: string;
    content?: string;
  };
}

export interface ClipboardItem {
  resource: AIResource;
  mode: 'copy' | 'cut';
  sourceOwnerType: OwnerType;
  sourceOwnerId: string;
}

// ============================================================================
// API Client
// ============================================================================

const API_BASE = '/api/resources';

async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
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
// Store State
// ============================================================================

interface ResourceState {
  // Data
  resources: AIResource[];
  selectedResource: AIResource | null;
  searchResults: ResourceSearchResult[];

  // UI State
  isLoading: boolean;
  isSearching: boolean;
  error: string | null;
  searchQuery: string;
  typeFilter: ResourceType | null;

  // Clipboard
  clipboard: ClipboardItem | null;

  // Cache: resources grouped by target
  targetCache: Record<string, AIResource[]>;
}

interface ResourceActions {
  // Data fetching
  fetchResources: (filters?: Record<string, string>) => Promise<void>;
  fetchByTarget: (ownerType: OwnerType, ownerId: string, type?: ResourceType) => Promise<AIResource[]>;
  searchResources: (query: string, filters?: Record<string, string>) => Promise<void>;

  // CRUD
  createResource: (resource: Partial<AIResource>) => Promise<AIResource>;
  updateResource: (id: string, updates: Partial<AIResource>) => Promise<AIResource>;
  deleteResource: (id: string) => Promise<void>;

  // Selection
  selectResource: (resource: AIResource | null) => void;

  // Sharing
  shareResource: (id: string, targetType: OwnerType, targetId: string, permission?: SharePermission) => Promise<ResourceShare>;
  unshareResource: (id: string, targetType: OwnerType, targetId: string) => Promise<void>;

  // Clipboard
  copyResource: (resource: AIResource) => void;
  cutResource: (resource: AIResource) => void;
  pasteResource: (targetOwnerType: OwnerType, targetOwnerId: string) => Promise<AIResource | null>;
  clearClipboard: () => void;

  // UI
  setTypeFilter: (type: ResourceType | null) => void;
  setSearchQuery: (query: string) => void;
  setError: (error: string | null) => void;

  // Utility
  getByType: (type: ResourceType) => AIResource[];
  getByTarget: (ownerType: OwnerType, ownerId: string) => AIResource[];
  invalidateCache: (ownerType: OwnerType, ownerId: string) => void;
  reset: () => void;
}

export type ResourceStore = ResourceState & ResourceActions;

// ============================================================================
// Initial State
// ============================================================================

const initialState: ResourceState = {
  resources: [],
  selectedResource: null,
  searchResults: [],
  isLoading: false,
  isSearching: false,
  error: null,
  searchQuery: '',
  typeFilter: null,
  clipboard: null,
  targetCache: {},
};

// ============================================================================
// Store
// ============================================================================

export const useResourceStore = create<ResourceStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ----------------------------------------------------------------------
      // Data Fetching
      // ----------------------------------------------------------------------

      fetchResources: async (filters) => {
        set({ isLoading: true, error: null });
        try {
          const params = new URLSearchParams(filters || {});
          const { resources } = await apiRequest<{ resources: AIResource[] }>(
            `/?${params.toString()}`
          );
          set({ resources, isLoading: false });
        } catch (err) {
          set({ error: (err as Error).message, isLoading: false });
        }
      },

      fetchByTarget: async (ownerType, ownerId, type) => {
        const cacheKey = `${ownerType}:${ownerId}`;
        try {
          const params = type ? `?type=${type}` : '';
          const { resources } = await apiRequest<{ resources: AIResource[] }>(
            `/by-target/${ownerType}/${ownerId}${params}`
          );
          set((state) => ({
            targetCache: { ...state.targetCache, [cacheKey]: resources },
          }));
          return resources;
        } catch (err) {
          set({ error: (err as Error).message });
          return [];
        }
      },

      searchResources: async (query, filters) => {
        if (!query.trim()) {
          set({ searchResults: [], isSearching: false });
          return;
        }
        set({ isSearching: true, searchQuery: query });
        try {
          const params = new URLSearchParams({ q: query, ...filters });
          const { results } = await apiRequest<{ results: ResourceSearchResult[] }>(
            `/search?${params.toString()}`
          );
          set({ searchResults: results, isSearching: false });
        } catch (err) {
          set({ error: (err as Error).message, isSearching: false });
        }
      },

      // ----------------------------------------------------------------------
      // CRUD
      // ----------------------------------------------------------------------

      createResource: async (resource) => {
        try {
          const created = await apiRequest<AIResource>('/', {
            method: 'POST',
            body: JSON.stringify(resource),
          });
          set((state) => ({
            resources: [created, ...state.resources],
            error: null,
          }));
          // Invalidate target cache
          if (created.ownerId) {
            get().invalidateCache(created.ownerType, created.ownerId);
          }
          return created;
        } catch (err) {
          set({ error: (err as Error).message });
          throw err;
        }
      },

      updateResource: async (id, updates) => {
        try {
          const updated = await apiRequest<AIResource>(`/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
          });
          set((state) => ({
            resources: state.resources.map((r) => (r.id === id ? updated : r)),
            selectedResource: state.selectedResource?.id === id ? updated : state.selectedResource,
            error: null,
          }));
          if (updated.ownerId) {
            get().invalidateCache(updated.ownerType, updated.ownerId);
          }
          return updated;
        } catch (err) {
          set({ error: (err as Error).message });
          throw err;
        }
      },

      deleteResource: async (id) => {
        try {
          await apiRequest(`/${id}`, { method: 'DELETE' });
          const deleted = get().resources.find((r) => r.id === id);
          set((state) => ({
            resources: state.resources.filter((r) => r.id !== id),
            selectedResource: state.selectedResource?.id === id ? null : state.selectedResource,
            error: null,
          }));
          if (deleted?.ownerId) {
            get().invalidateCache(deleted.ownerType, deleted.ownerId);
          }
        } catch (err) {
          set({ error: (err as Error).message });
          throw err;
        }
      },

      // ----------------------------------------------------------------------
      // Selection
      // ----------------------------------------------------------------------

      selectResource: (resource) => set({ selectedResource: resource }),

      // ----------------------------------------------------------------------
      // Sharing
      // ----------------------------------------------------------------------

      shareResource: async (id, targetType, targetId, permission = 'read') => {
        const share = await apiRequest<ResourceShare>(`/${id}/share`, {
          method: 'POST',
          body: JSON.stringify({ targetType, targetId, permission }),
        });
        return share;
      },

      unshareResource: async (id, targetType, targetId) => {
        await apiRequest(`/${id}/share/${targetType}/${targetId}`, {
          method: 'DELETE',
        });
      },

      // ----------------------------------------------------------------------
      // Clipboard
      // ----------------------------------------------------------------------

      copyResource: (resource) => {
        set({
          clipboard: {
            resource,
            mode: 'copy',
            sourceOwnerType: resource.ownerType,
            sourceOwnerId: resource.ownerId || '',
          },
        });
      },

      cutResource: (resource) => {
        set({
          clipboard: {
            resource,
            mode: 'cut',
            sourceOwnerType: resource.ownerType,
            sourceOwnerId: resource.ownerId || '',
          },
        });
      },

      pasteResource: async (targetOwnerType, targetOwnerId) => {
        const { clipboard } = get();
        if (!clipboard) return null;

        try {
          // Create a copy in the new target
          const created = await get().createResource({
            resourceType: clipboard.resource.resourceType,
            ownerType: targetOwnerType,
            ownerId: targetOwnerId,
            name: clipboard.mode === 'copy'
              ? `${clipboard.resource.name} (copy)`
              : clipboard.resource.name,
            description: clipboard.resource.description,
            content: clipboard.resource.content,
            parts: clipboard.resource.parts,
            typeMetadata: clipboard.resource.typeMetadata,
            tags: clipboard.resource.tags,
            provenance: clipboard.resource.provenance,
            syncToFile: clipboard.resource.syncToFile,
          });

          // If cut mode, delete the original
          if (clipboard.mode === 'cut') {
            await get().deleteResource(clipboard.resource.id);
          }

          set({ clipboard: null });
          return created;
        } catch (err) {
          set({ error: (err as Error).message });
          return null;
        }
      },

      clearClipboard: () => set({ clipboard: null }),

      // ----------------------------------------------------------------------
      // UI
      // ----------------------------------------------------------------------

      setTypeFilter: (type) => set({ typeFilter: type }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setError: (error) => set({ error }),

      // ----------------------------------------------------------------------
      // Utility
      // ----------------------------------------------------------------------

      getByType: (type) => {
        return get().resources.filter((r) => r.resourceType === type && r.isActive);
      },

      getByTarget: (ownerType, ownerId) => {
        const cacheKey = `${ownerType}:${ownerId}`;
        return get().targetCache[cacheKey] || [];
      },

      invalidateCache: (ownerType, ownerId) => {
        const cacheKey = `${ownerType}:${ownerId}`;
        set((state) => {
          const { [cacheKey]: _, ...rest } = state.targetCache;
          return { targetCache: rest };
        });
      },

      reset: () => set(initialState),
    }),
    {
      name: 'liquid-resource-store',
      partialize: (state) => ({
        clipboard: state.clipboard,
        typeFilter: state.typeFilter,
      }),
    }
  )
);
