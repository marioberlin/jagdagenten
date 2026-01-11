import { PersistOptions } from 'zustand/middleware';
import { ThemeStore, ThemeActions } from '../types';

export const persistConfig: PersistOptions<ThemeStore & ThemeActions> = {
    name: 'liquid-glass-store',
    version: 2,
    partialize: (state) => ({
        mode: state.mode,
        useSystemPreference: state.useSystemPreference,
        activeBackgroundId: state.activeBackgroundId,
        glass: state.glass,
        visual: state.visual,
        overlay: state.overlay,
        density: state.density,
        performance: {
            mode: state.performance.mode,
            reducedMotion: false, // Don't persist environment detection
            reducedTransparency: false,
            gpuTier: 'high'
        },
        themes: {
            custom: state.themes.custom,
            activeId: state.themes.activeId,
            builtIn: [] // Don't persist built-ins
        },
    } as any), // Type assertion to match Partial
    onRehydrateStorage: () => (state) => {
        if (state) {
            state._hydrated = true;
        }
    }
};
