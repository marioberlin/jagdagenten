/**
 * Story Store
 *
 * Zustand store for hunt stories and lessons learned.
 */

import { create } from 'zustand';

// ============================================================================
// Types
// ============================================================================

export interface Story {
  id: string;
  userId: string;
  harvestId?: string;
  title?: string;
  content: string;
  photoUrls: string[];
  videoUrl?: string;
  species?: string;
  weightKg?: number;
  dateWindow?: string;
  coarseArea?: string;
  windConditions?: string;
  approachDirection?: string;
  shotDistanceM?: number;
  afterSearchNotes?: string;
  equipmentNotes?: string;
  isPublished: boolean;
  publishAt?: string;
  createdAt: string;
  viewCount: number;
  likeCount: number;
}

export interface StoryState {
  stories: Story[];
  myStories: Story[];
  loading: boolean;
  error: string | null;
}

export interface StoryActions {
  fetchStories: (filters?: { species?: string }) => Promise<void>;
  fetchMyStories: () => Promise<void>;
  createStory: (story: Partial<Story> & { content: string }) => Promise<void>;
  updateStory: (id: string, updates: Partial<Story>) => Promise<void>;
  publishStory: (id: string) => Promise<void>;
  deleteStory: (id: string) => Promise<void>;
}

export type StoryStore = StoryState & StoryActions;

// ============================================================================
// Store
// ============================================================================

const API = '/api/v1/jagd/stories';

export const useStoryStore = create<StoryStore>((set) => ({
  stories: [],
  myStories: [],
  loading: false,
  error: null,

  fetchStories: async (filters) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.species) params.set('species', filters.species);
      const res = await fetch(`${API}?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ stories: data.stories ?? [], loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchMyStories: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/mine`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ myStories: data.stories ?? [], loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  createStory: async (story) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(story),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set((s) => ({ myStories: [data.story, ...s.myStories], loading: false }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  updateStory: async (id, updates) => {
    try {
      const res = await fetch(`${API}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set((s) => ({
        myStories: s.myStories.map((st) => (st.id === id ? data.story : st)),
        stories: s.stories.map((st) => (st.id === id ? data.story : st)),
      }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  publishStory: async (id) => {
    try {
      const res = await fetch(`${API}/${id}/publish`, { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set((s) => ({
        myStories: s.myStories.map((st) => (st.id === id ? data.story : st)),
      }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  deleteStory: async (id) => {
    try {
      const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      set((s) => ({
        myStories: s.myStories.filter((st) => st.id !== id),
        stories: s.stories.filter((st) => st.id !== id),
      }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },
}));
