import { create } from 'zustand';

export interface Skill {
    id: string; // path or UUID
    name: string;
    type: 'skill' | 'plugin';
    description: string;
    enabled: boolean;
    author: 'community' | 'vendor' | 'core' | 'user';
    path?: string; // For markdown skills
    config?: Record<string, any>; // For plugins
}

interface SkillStore {
    skills: Skill[];
    plugins: Skill[];
    isLoading: boolean;
    error: string | null;
    fetchSkills: () => Promise<void>;
    fetchPlugins: () => Promise<void>;
    toggleSkill: (id: string, enabled: boolean) => Promise<void>;
    togglePlugin: (id: string, enabled: boolean) => Promise<void>;
}

export const useSkillStore = create<SkillStore>((set, _get) => ({
    skills: [],
    plugins: [],
    isLoading: false,
    error: null,

    fetchSkills: async () => {
        set({ isLoading: true, error: null });
        try {
            const res = await fetch('/api/v1/skills');
            const data = await res.json();
            if (data.success) {
                set({ skills: data.data });
            } else {
                set({ error: data.error });
            }
        } catch (e) {
            set({ error: 'Failed to fetch skills' });
        } finally {
            set({ isLoading: false });
        }
    },

    fetchPlugins: async () => {
        try {
            const res = await fetch('/api/v1/plugins');
            const data = await res.json();
            if (data.success) {
                // Map DB plugins to Skill interface
                const mappedPlugins: Skill[] = data.data.map((p: any) => ({
                    id: p.id,
                    name: p.plugin_name,
                    type: 'plugin',
                    description: `Version: ${p.plugin_version} (${p.source})`,
                    enabled: p.enabled,
                    author: p.source === 'registry' ? 'vendor' : 'user',
                    config: p.config
                }));
                set({ plugins: mappedPlugins });
            }
        } catch (e) {
            console.error('Failed to fetch plugins', e);
        }
    },

    toggleSkill: async (id, enabled) => {
        try {
            // Optimistic update
            set(state => ({
                skills: state.skills.map(s => s.id === id ? { ...s, enabled } : s)
            }));

            const res = await fetch('/api/v1/skills/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, enabled })
            });
            const data = await res.json();

            if (!data.success) {
                // Revert
                set(state => ({
                    skills: state.skills.map(s => s.id === id ? { ...s, enabled: !enabled } : s),
                    error: data.error
                }));
            }
        } catch (e) {
            // Revert
            set(state => ({
                skills: state.skills.map(s => s.id === id ? { ...s, enabled: !enabled } : s),
                error: 'Failed to toggle skill'
            }));
        }
    },

    togglePlugin: async (id, enabled) => {
        try {
            // Optimistic update
            set(state => ({
                plugins: state.plugins.map(p => p.id === id ? { ...p, enabled } : p)
            }));

            const res = await fetch(`/api/v1/plugins/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled })
            });
            const data = await res.json();

            if (!data.success) {
                // Revert
                set(state => ({
                    plugins: state.plugins.map(p => p.id === id ? { ...p, enabled: !enabled } : p),
                    error: data.error
                }));
            }
        } catch (e) {
            // Revert
            set(state => ({
                plugins: state.plugins.map(p => p.id === id ? { ...p, enabled: !enabled } : p),
                error: 'Failed to toggle plugin'
            }));
        }
    }
}));
