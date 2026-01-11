import { StateCreator } from 'zustand';
import { ThemeStore, ThemeActions, Theme, ThemeModeConfig } from '../types';


const DEFAULT_MODE_CONFIG: ThemeModeConfig = {
    glass: {
        intensity: 60,
        blurStrength: 60,
        material: 'regular',
        saturation: 110,
        noiseOpacity: 5,
        tintColor: null,
    },
    visual: {
        radius: 24,
        shadowStrength: 40,
        outlineOpacity: 40,
        specularEnabled: true,
        textShadowEnabled: true,
        textVibrancy: 50,
        accentColor: '#3b82f6',
        bounceIntensity: 50,
        pulseIntensity: 50,
        scaleIntensity: 50,
        wiggleIntensity: 50
    },
    overlay: {
        enabled: true,
        intensity: 15
    },
    background: {
        id: 'mesh-gradient-1',
        luminance: 'dark'
    },
    colors: {
        primary: '#ffffff',
        secondary: '#94a3b8',
        background: '#0f172a',
        surface: '#1e293b',
        accent: '#3b82f6',
        muted: '#334155',
        border: 'rgba(255,255,255,0.1)',
    }
};

const DEFAULT_BUILTIN_THEME: Theme = {
    id: 'default-glass',
    name: 'Default Glass',
    isBuiltIn: true,
    light: { ...DEFAULT_MODE_CONFIG, background: { id: 'mesh-gradient-1', luminance: 'light' } },
    dark: DEFAULT_MODE_CONFIG,
};

export const createThemePresetsSlice: StateCreator<
    ThemeStore & ThemeActions,
    [['zustand/immer', never]],
    [],
    Pick<ThemeStore, 'themes'> &
    Pick<ThemeActions,
        'applyTheme' | 'createTheme' | 'updateTheme' |
        'deleteTheme' | 'duplicateTheme' | 'exportTheme' | 'importTheme'>
> = (set, get) => ({
    themes: {
        builtIn: [DEFAULT_BUILTIN_THEME],
        custom: [],
        activeId: 'default-glass',
    },

    applyTheme: (id) => {
        set((state) => {
            const allThemes = [...state.themes.builtIn, ...state.themes.custom];
            const theme = allThemes.find(t => t.id === id);
            if (!theme) return;

            state.themes.activeId = id;

            // Determine mode config
            const mode = state.mode; // 'light' or 'dark'
            const config = theme[mode];

            // Apply values
            if (config.glass) Object.assign(state.glass, config.glass);
            if (config.visual) Object.assign(state.visual, config.visual);
            if (config.background) {
                state.activeBackgroundId = config.background.id;
                state.backgroundLuminance = config.background.luminance || mode;
            }
        });
    },

    createTheme: (name) => {
        const id = `custom-${Date.now()}`;
        set((state) => {
            // Snapshot current state
            const currentConfig: ThemeModeConfig = {
                glass: { ...state.glass },
                visual: { ...state.visual },
                background: {
                    id: state.activeBackgroundId,
                    luminance: state.backgroundLuminance
                },
                overlay: { ...state.overlay },
                colors: { ...DEFAULT_MODE_CONFIG.colors, accent: state.visual.accentColor } // fallback colors for now
            };

            state.themes.custom.push({
                id,
                name,
                isBuiltIn: false,
                light: currentConfig, // Apply same config to both modes initially
                dark: currentConfig
            });
            state.themes.activeId = id;
        });
        return id;
    },

    updateTheme: (id, updates) => set((state) => {
        const themeIndex = state.themes.custom.findIndex(t => t.id === id);
        if (themeIndex !== -1) {
            // Check if updates target root props or mode props
            // This signature expects Partial<Theme>, so it handles root props.
            // Deep merging might be needed for config? 
            // For now simple object assign, assuming caller passes valid Partial<Theme>
            // BUT Immer handles deep updates if we do it carefully.
            // Here we just merge the top level updates (id, name, light, dark).
            // If caller wants to update JUST light.glass, they need to pass full light object or we use deep merge.
            // Object.assign is shallow on the keys provided.
            const target = state.themes.custom[themeIndex];

            if (updates.name) target.name = updates.name;
            if (updates.light) {
                // Deep merge manually for properties we care about or assume replacement
                // Let's assume replacement for simplicity or spread
                target.light = { ...target.light, ...updates.light };
            }
            if (updates.dark) {
                target.dark = { ...target.dark, ...updates.dark };
            }
        }
    }),

    deleteTheme: (id) => set((state) => {
        state.themes.custom = state.themes.custom.filter(t => t.id !== id);
        if (state.themes.activeId === id) {
            state.themes.activeId = state.themes.builtIn[0].id;
            // We should re-apply the fallback theme
            // But we can't call actions from inside set easily without 'get' or external call.
            // We can just rely on the user to click or the component to react?
            // Actually better to re-apply logic here (duplicate logic) or defer.
            // Duplicate logic for safety:
            const fallback = state.themes.builtIn[0];
            const mode = state.mode;
            const config = fallback[mode];
            Object.assign(state.glass, config.glass);
            Object.assign(state.visual, config.visual);
            state.activeBackgroundId = config.background.id;
        }
    }),

    duplicateTheme: (id, newName) => {
        const newId = `custom-${Date.now()}`;
        set((state) => {
            const allThemes = [...state.themes.builtIn, ...state.themes.custom];
            const source = allThemes.find(t => t.id === id);
            if (source) {
                // Deep copy
                const newTheme = JSON.parse(JSON.stringify(source));
                newTheme.id = newId;
                newTheme.name = newName;
                newTheme.isBuiltIn = false;

                state.themes.custom.push(newTheme);
                state.themes.activeId = newId;
            }
        });
        return newId;
    },

    exportTheme: (id) => {
        const state = get();
        const allThemes = [...state.themes.builtIn, ...state.themes.custom];
        const theme = allThemes.find(t => t.id === id);
        return JSON.stringify(theme || {});
    },

    importTheme: (json) => {
        try {
            const theme = JSON.parse(json);
            if (!theme.id || !theme.name || !theme.light || !theme.dark) return null;

            const newId = `imported-${Date.now()}`;
            theme.id = newId;
            theme.isBuiltIn = false;

            set(state => {
                state.themes.custom.push(theme);
                state.themes.activeId = newId;
                // Optionally apply it immediately?
            });
            return newId;
        } catch (e) {
            return null;
        }
    }
});

