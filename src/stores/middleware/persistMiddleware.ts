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
            // Don't persist built-ins - they come from initial state
        },
    } as any), // Type assertion to match Partial
    merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<ThemeStore> | undefined;
        return {
            ...currentState,
            ...persisted,
            // Deep merge themes to preserve builtIn from initial state
            themes: {
                ...currentState.themes,
                custom: persisted?.themes?.custom ?? currentState.themes.custom,
                activeId: persisted?.themes?.activeId ?? currentState.themes.activeId,
            },
            // Deep merge performance to preserve detection results
            performance: {
                ...currentState.performance,
                mode: persisted?.performance?.mode ?? currentState.performance.mode,
            },
        };
    },
    onRehydrateStorage: () => (state) => {
        if (state) {
            state._hydrated = true;
        }
    }
};
