/**
 * Huntcraft Store
 *
 * Zustand store for gamified challenges, XP, achievements.
 */

import { create } from 'zustand';

// ============================================================================
// Types
// ============================================================================

export interface ChallengeTemplate {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  targetValue: number;
  period: 'daily' | 'weekly' | 'monthly';
  xpReward: number;
  category: 'skill' | 'maintenance' | 'learning';
}

export interface UserChallenge {
  id: string;
  userId: string;
  templateId: string;
  periodStart: string;
  periodEnd: string;
  progress: number;
  completedAt?: string;
  template?: ChallengeTemplate;
}

export interface HuntcraftStats {
  userId: string;
  totalXp: number;
  level: number;
  challengesCompleted: number;
  currentStreak: number;
  longestStreak: number;
  lastChallengeDate?: string;
}

export interface Achievement {
  id: string;
  slug: string;
  title: string;
  description: string;
  tier: 'bronze' | 'silver' | 'gold';
  requirementType: string;
  requirementValue: number;
  earned: boolean;
  earnedAt?: string | null;
}

export interface HuntcraftState {
  templates: ChallengeTemplate[];
  activeChallenges: UserChallenge[];
  stats: HuntcraftStats | null;
  achievements: Achievement[];
  loading: boolean;
  error: string | null;
}

export interface HuntcraftActions {
  fetchTemplates: () => Promise<void>;
  fetchActiveChallenges: () => Promise<void>;
  incrementProgress: (templateId: string) => Promise<{ justCompleted: boolean; xpAwarded: number } | null>;
  fetchStats: () => Promise<void>;
  fetchAchievements: () => Promise<void>;
  checkNewAchievements: () => Promise<void>;
}

export type HuntcraftStore = HuntcraftState & HuntcraftActions;

// ============================================================================
// Store
// ============================================================================

const API = '/api/v1/jagd/challenges';

export const useHuntcraftStore = create<HuntcraftStore>((set) => ({
  templates: [],
  activeChallenges: [],
  stats: null,
  achievements: [],
  loading: false,
  error: null,

  fetchTemplates: async () => {
    try {
      const res = await fetch(`${API}/templates`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ templates: data.templates ?? [] });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  fetchActiveChallenges: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/active`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ activeChallenges: data.challenges ?? [], loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  incrementProgress: async (templateId) => {
    try {
      const res = await fetch(`${API}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.challenge) {
        set((s) => ({
          activeChallenges: s.activeChallenges.map((c) =>
            c.templateId === templateId ? { ...c, ...data.challenge } : c
          ),
        }));
      }
      return { justCompleted: data.justCompleted, xpAwarded: data.xpAwarded };
    } catch (err) {
      set({ error: (err as Error).message });
      return null;
    }
  },

  fetchStats: async () => {
    try {
      const res = await fetch(`${API}/stats`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ stats: data.stats });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  fetchAchievements: async () => {
    try {
      const res = await fetch(`${API}/achievements`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ achievements: data.achievements ?? [] });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  checkNewAchievements: async () => {
    try {
      const res = await fetch(`${API}/check-achievements`, { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.count > 0) {
        // Refresh achievements list
        const achRes = await fetch(`${API}/achievements`);
        if (achRes.ok) {
          const achData = await achRes.json();
          set({ achievements: achData.achievements ?? [] });
        }
      }
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },
}));
