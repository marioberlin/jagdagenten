/**
 * Feed Store
 *
 * Zustand store for managing the Waidmann-Feed and weekly explore data.
 */

import { create } from 'zustand';

// ============================================================================
// Types
// ============================================================================

export interface FeedItem {
    id: string;
    type: 'news' | 'community' | 'tip' | 'regulation' | 'weather' | 'wildlife';
    title: string;
    summary: string;
    content?: string;
    source: string;
    sourceUrl?: string;
    imageUrl?: string;
    publishedAt: string;
    relevanceScore: number;
    bundesland?: string;
    tags: string[];
    isBookmarked: boolean;
    isRead: boolean;
}

export interface FeedSource {
    id: string;
    name: string;
    type: 'rss' | 'api' | 'scrape';
    url: string;
    isActive: boolean;
    lastFetchedAt?: string;
    bundesland?: string;
}

export interface FeedPreferences {
    userId: string;
    enabledTypes: FeedItem['type'][];
    bundeslandFilter: string[];
    showReadItems: boolean;
    sortBy: 'date' | 'relevance';
}

export interface WeeklyExplore {
    weekOf: string;
    summary: {
        totalHunts: number;
        totalHours: number;
        harvestCount: number;
        topSpecies: string;
        bestConditions: string;
    };
    huntabilityForecast: Array<{
        day: string;
        score: number;
        conditions: string;
    }>;
    topNews: FeedItem[];
    upcomingEvents: Array<{
        id: string;
        title: string;
        date: string;
        type: string;
    }>;
    regulationAlerts: Array<{
        id: string;
        title: string;
        effectiveDate: string;
    }>;
}

interface FeedStore {
    // Feed State
    feedItems: FeedItem[];
    feedLoading: boolean;
    feedError: string | null;

    // Sources
    sources: FeedSource[];
    sourcesLoading: boolean;

    // Preferences
    preferences: FeedPreferences | null;

    // Weekly Explore
    weeklyData: WeeklyExplore | null;
    weeklyLoading: boolean;

    // Actions
    fetchFeed: (filters?: { type?: string; bundesland?: string; unreadOnly?: boolean }) => Promise<void>;
    markAsRead: (itemId: string) => Promise<void>;
    toggleBookmark: (itemId: string) => Promise<void>;
    fetchSources: () => Promise<void>;
    addSource: (source: Partial<FeedSource>) => Promise<void>;
    deleteSource: (sourceId: string) => Promise<void>;
    fetchPreferences: () => Promise<void>;
    updatePreferences: (prefs: Partial<FeedPreferences>) => Promise<void>;
    fetchWeekly: () => Promise<void>;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useFeedStore = create<FeedStore>()((set, get) => ({
    // Initial State
    feedItems: [],
    feedLoading: false,
    feedError: null,
    sources: [],
    sourcesLoading: false,
    preferences: null,
    weeklyData: null,
    weeklyLoading: false,

    // Feed Actions
    fetchFeed: async (filters) => {
        set({ feedLoading: true, feedError: null });
        try {
            const params = new URLSearchParams();
            if (filters?.type) params.set('type', filters.type);
            if (filters?.bundesland) params.set('bundesland', filters.bundesland);
            if (filters?.unreadOnly) params.set('unreadOnly', 'true');

            const res = await fetch(`/api/v1/jagd/feed?${params.toString()}`);
            const data = await res.json();
            set({ feedItems: data.feed || [], feedLoading: false });
        } catch (error) {
            set({ feedError: 'Fehler beim Laden des Feeds', feedLoading: false });
        }
    },

    markAsRead: async (itemId) => {
        try {
            await fetch(`/api/v1/jagd/feed/${itemId}/read`, { method: 'POST' });
            set((state) => ({
                feedItems: state.feedItems.map((item) =>
                    item.id === itemId ? { ...item, isRead: true } : item
                ),
            }));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    },

    toggleBookmark: async (itemId) => {
        try {
            const res = await fetch(`/api/v1/jagd/feed/${itemId}/bookmark`, { method: 'POST' });
            const data = await res.json();
            set((state) => ({
                feedItems: state.feedItems.map((item) =>
                    item.id === itemId ? { ...item, isBookmarked: data.bookmarked } : item
                ),
            }));
        } catch (error) {
            console.error('Failed to toggle bookmark:', error);
        }
    },

    // Sources Actions
    fetchSources: async () => {
        set({ sourcesLoading: true });
        try {
            const res = await fetch('/api/v1/jagd/feed/sources');
            const data = await res.json();
            set({ sources: data.sources || [], sourcesLoading: false });
        } catch (error) {
            set({ sourcesLoading: false });
        }
    },

    addSource: async (source) => {
        try {
            const res = await fetch('/api/v1/jagd/feed/sources', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(source),
            });
            const data = await res.json();
            if (data.source) {
                set((state) => ({ sources: [...state.sources, data.source] }));
            }
        } catch (error) {
            console.error('Failed to add source:', error);
        }
    },

    deleteSource: async (sourceId) => {
        try {
            await fetch(`/api/v1/jagd/feed/sources/${sourceId}`, { method: 'DELETE' });
            set((state) => ({
                sources: state.sources.filter((s) => s.id !== sourceId),
            }));
        } catch (error) {
            console.error('Failed to delete source:', error);
        }
    },

    // Preferences Actions
    fetchPreferences: async () => {
        try {
            const res = await fetch('/api/v1/jagd/feed/preferences');
            const data = await res.json();
            set({ preferences: data.preferences });
        } catch (error) {
            console.error('Failed to fetch preferences:', error);
        }
    },

    updatePreferences: async (prefs) => {
        try {
            const current = get().preferences;
            const updated = { ...current, ...prefs };
            await fetch('/api/v1/jagd/feed/preferences', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated),
            });
            set({ preferences: updated as FeedPreferences });
        } catch (error) {
            console.error('Failed to update preferences:', error);
        }
    },

    // Weekly Explore Actions
    fetchWeekly: async () => {
        set({ weeklyLoading: true });
        try {
            const res = await fetch('/api/v1/jagd/explore/weekly');
            const data = await res.json();
            set({ weeklyData: data.weekly, weeklyLoading: false });
        } catch (error) {
            set({ weeklyLoading: false });
        }
    },
}));
