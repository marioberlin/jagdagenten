import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ThemeStore, ThemeActions } from './types';
import { createModeSlice } from './slices/modeSlice';
import { createGlassSlice } from './slices/glassSlice';
import { createBackgroundSlice } from './slices/backgroundSlice';
import { createVisualSlice } from './slices/visualSlice';
import { createThemePresetsSlice } from './slices/themePresetsSlice';
import { createPerformanceSlice } from './slices/performanceSlice';
import { persistConfig } from './middleware/persistMiddleware';
import { initializeCSSVariableSubscriber } from './middleware/cssVariableMiddleware';
import { runLegacyMigration } from './utils/migrationUtils';

// Run migration before store creation
runLegacyMigration();

export const useThemeStore = create<ThemeStore & ThemeActions>()(
    subscribeWithSelector(
        persist(
            immer((set, get, store) => ({
                // === Initial State Stubs (overwritten by slices) ===
                _hydrated: false,

                // === Slices ===
                ...createModeSlice(set, get, store),
                ...createGlassSlice(set, get, store),
                ...createBackgroundSlice(set, get, store),
                ...createVisualSlice(set, get, store),
                ...createThemePresetsSlice(set, get, store),
                ...createPerformanceSlice(set, get, store),

                resetToDefaults: () => {
                    // Reset to a known safe state
                    const { applyTheme, setMode } = get();
                    setMode('dark');
                    // We assume 'liquid-glass' exists as it's built-in
                    applyTheme('liquid-glass');
                },
            })),
            persistConfig
        )
    )
);

// Initialize subscribers
initializeCSSVariableSubscriber(useThemeStore);
