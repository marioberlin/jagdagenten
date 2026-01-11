import { StateCreator } from 'zustand';
import { ThemeStore, ThemeActions } from '../types';

// Helper to re-apply theme settings for a specific mode
const applyThemeForMode = (state: ThemeStore, mode: 'light' | 'dark') => {
    try {
        if (!state.themes) return;
        const activeThemeId = state.themes.activeId;
        if (activeThemeId) {
            const allThemes = [...(state.themes.builtIn || []), ...(state.themes.custom || [])];
            const theme = allThemes.find(t => t.id === activeThemeId);
            if (theme) {
                const config = theme[mode];
                if (config) {
                    if (config.glass && state.glass) Object.assign(state.glass, config.glass);
                    if (config.visual && state.visual) Object.assign(state.visual, config.visual);
                    if (config.background) {
                        state.activeBackgroundId = config.background.id;
                        state.backgroundLuminance = config.background.luminance || mode;
                    }
                }
            }
        }
    } catch (err) {
        console.error('[ThemeStore] Error in applyThemeForMode:', err);
    }
};

export const createModeSlice: StateCreator<
    ThemeStore & ThemeActions,
    [['zustand/immer', never]],
    [],
    Pick<ThemeStore, 'mode' | 'systemPreference' | 'useSystemPreference'> &
    Pick<ThemeActions, 'setMode' | 'toggleMode' | 'setUseSystemPreference'>
> = (set) => ({
    mode: 'dark',
    systemPreference: null,
    useSystemPreference: true,

    setMode: (mode) => set((state) => {
        state.mode = mode;
        state.useSystemPreference = false;
        applyThemeForMode(state, mode);
    }),

    toggleMode: () => set((state) => {
        const newMode = state.mode === 'light' ? 'dark' : 'light';
        state.mode = newMode;
        state.useSystemPreference = false;
        applyThemeForMode(state, newMode);
    }),

    setUseSystemPreference: (use) => set((state) => {
        state.useSystemPreference = use;
        if (use && state.systemPreference) {
            state.mode = state.systemPreference;
            applyThemeForMode(state, state.systemPreference);
        }
    }),
});
