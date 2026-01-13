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
    light: { ...DEFAULT_MODE_CONFIG, background: { id: 'mesh-gradient', luminance: 'light' } },
    dark: { ...DEFAULT_MODE_CONFIG, background: { id: 'liquid-1', luminance: 'dark' } },
};

// Ocean Theme - Deep blues and teals
const OCEAN_THEME: Theme = {
    id: 'ocean-depths',
    name: 'Ocean Depths',
    isBuiltIn: true,
    light: {
        glass: {
            intensity: 55,
            blurStrength: 65,
            material: 'thick',
            saturation: 120,
            noiseOpacity: 3,
            tintColor: '#0ea5e9',
        },
        visual: {
            radius: 28,
            shadowStrength: 35,
            outlineOpacity: 35,
            specularEnabled: true,
            textShadowEnabled: false,
            textVibrancy: 45,
            accentColor: '#0ea5e9',
            bounceIntensity: 40,
            pulseIntensity: 45,
            scaleIntensity: 45,
            wiggleIntensity: 35
        },
        overlay: { enabled: true, intensity: 12 },
        background: { id: 'soft-clouds', luminance: 'light' },
        colors: {
            primary: '#0c4a6e',
            secondary: '#0369a1',
            background: '#f0f9ff',
            surface: '#e0f2fe',
            accent: '#0ea5e9',
            muted: '#bae6fd',
            border: 'rgba(14,165,233,0.2)',
        }
    },
    dark: {
        glass: {
            intensity: 65,
            blurStrength: 70,
            material: 'thick',
            saturation: 115,
            noiseOpacity: 4,
            tintColor: '#0284c7',
        },
        visual: {
            radius: 28,
            shadowStrength: 50,
            outlineOpacity: 45,
            specularEnabled: true,
            textShadowEnabled: true,
            textVibrancy: 55,
            accentColor: '#38bdf8',
            bounceIntensity: 45,
            pulseIntensity: 50,
            scaleIntensity: 50,
            wiggleIntensity: 40
        },
        overlay: { enabled: true, intensity: 18 },
        background: { id: 'deep-ocean', luminance: 'dark' },
        colors: {
            primary: '#f0f9ff',
            secondary: '#7dd3fc',
            background: '#082f49',
            surface: '#0c4a6e',
            accent: '#38bdf8',
            muted: '#075985',
            border: 'rgba(56,189,248,0.15)',
        }
    }
};

// Forest Theme - Earthy greens
const FOREST_THEME: Theme = {
    id: 'forest-canopy',
    name: 'Forest Canopy',
    isBuiltIn: true,
    light: {
        glass: {
            intensity: 50,
            blurStrength: 55,
            material: 'regular',
            saturation: 105,
            noiseOpacity: 6,
            tintColor: '#22c55e',
        },
        visual: {
            radius: 20,
            shadowStrength: 30,
            outlineOpacity: 30,
            specularEnabled: false,
            textShadowEnabled: false,
            textVibrancy: 40,
            accentColor: '#22c55e',
            bounceIntensity: 35,
            pulseIntensity: 40,
            scaleIntensity: 40,
            wiggleIntensity: 30
        },
        overlay: { enabled: true, intensity: 10 },
        background: { id: 'geo-shapes', luminance: 'light' },
        colors: {
            primary: '#14532d',
            secondary: '#166534',
            background: '#f0fdf4',
            surface: '#dcfce7',
            accent: '#22c55e',
            muted: '#bbf7d0',
            border: 'rgba(34,197,94,0.2)',
        }
    },
    dark: {
        glass: {
            intensity: 60,
            blurStrength: 65,
            material: 'regular',
            saturation: 110,
            noiseOpacity: 5,
            tintColor: '#16a34a',
        },
        visual: {
            radius: 20,
            shadowStrength: 45,
            outlineOpacity: 40,
            specularEnabled: true,
            textShadowEnabled: true,
            textVibrancy: 50,
            accentColor: '#4ade80',
            bounceIntensity: 45,
            pulseIntensity: 50,
            scaleIntensity: 50,
            wiggleIntensity: 40
        },
        overlay: { enabled: true, intensity: 15 },
        background: { id: 'aurora', luminance: 'dark' },
        colors: {
            primary: '#f0fdf4',
            secondary: '#86efac',
            background: '#052e16',
            surface: '#14532d',
            accent: '#4ade80',
            muted: '#166534',
            border: 'rgba(74,222,128,0.15)',
        }
    }
};

// Sunset Theme - Warm oranges and pinks
const SUNSET_THEME: Theme = {
    id: 'sunset-glow',
    name: 'Sunset Glow',
    isBuiltIn: true,
    light: {
        glass: {
            intensity: 55,
            blurStrength: 60,
            material: 'thin',
            saturation: 125,
            noiseOpacity: 4,
            tintColor: '#f97316',
        },
        visual: {
            radius: 32,
            shadowStrength: 40,
            outlineOpacity: 35,
            specularEnabled: true,
            textShadowEnabled: false,
            textVibrancy: 55,
            accentColor: '#f97316',
            bounceIntensity: 50,
            pulseIntensity: 55,
            scaleIntensity: 55,
            wiggleIntensity: 45
        },
        overlay: { enabled: true, intensity: 8 },
        background: { id: 'img-dune', luminance: 'light' },
        colors: {
            primary: '#7c2d12',
            secondary: '#c2410c',
            background: '#fff7ed',
            surface: '#ffedd5',
            accent: '#f97316',
            muted: '#fed7aa',
            border: 'rgba(249,115,22,0.2)',
        }
    },
    dark: {
        glass: {
            intensity: 65,
            blurStrength: 70,
            material: 'thick',
            saturation: 120,
            noiseOpacity: 5,
            tintColor: '#ea580c',
        },
        visual: {
            radius: 32,
            shadowStrength: 55,
            outlineOpacity: 50,
            specularEnabled: true,
            textShadowEnabled: true,
            textVibrancy: 60,
            accentColor: '#fb923c',
            bounceIntensity: 55,
            pulseIntensity: 60,
            scaleIntensity: 60,
            wiggleIntensity: 50
        },
        overlay: { enabled: true, intensity: 20 },
        background: { id: 'abstract-waves', luminance: 'dark' },
        colors: {
            primary: '#fff7ed',
            secondary: '#fdba74',
            background: '#431407',
            surface: '#7c2d12',
            accent: '#fb923c',
            muted: '#9a3412',
            border: 'rgba(251,146,60,0.15)',
        }
    }
};

// Midnight Theme - Deep purples and blues
const MIDNIGHT_THEME: Theme = {
    id: 'midnight-purple',
    name: 'Midnight Purple',
    isBuiltIn: true,
    light: {
        glass: {
            intensity: 50,
            blurStrength: 55,
            material: 'thick',
            saturation: 115,
            noiseOpacity: 3,
            tintColor: '#8b5cf6',
        },
        visual: {
            radius: 24,
            shadowStrength: 35,
            outlineOpacity: 40,
            specularEnabled: true,
            textShadowEnabled: false,
            textVibrancy: 50,
            accentColor: '#8b5cf6',
            bounceIntensity: 45,
            pulseIntensity: 50,
            scaleIntensity: 50,
            wiggleIntensity: 40
        },
        overlay: { enabled: true, intensity: 10 },
        background: { id: 'img-soft-pastel', luminance: 'light' },
        colors: {
            primary: '#4c1d95',
            secondary: '#6d28d9',
            background: '#faf5ff',
            surface: '#f3e8ff',
            accent: '#8b5cf6',
            muted: '#ddd6fe',
            border: 'rgba(139,92,246,0.2)',
        }
    },
    dark: {
        glass: {
            intensity: 70,
            blurStrength: 75,
            material: 'thick',
            saturation: 120,
            noiseOpacity: 6,
            tintColor: '#7c3aed',
        },
        visual: {
            radius: 24,
            shadowStrength: 60,
            outlineOpacity: 55,
            specularEnabled: true,
            textShadowEnabled: true,
            textVibrancy: 65,
            accentColor: '#a78bfa',
            bounceIntensity: 55,
            pulseIntensity: 60,
            scaleIntensity: 60,
            wiggleIntensity: 50
        },
        overlay: { enabled: true, intensity: 22 },
        background: { id: 'neon-grid', luminance: 'dark' },
        colors: {
            primary: '#faf5ff',
            secondary: '#c4b5fd',
            background: '#2e1065',
            surface: '#4c1d95',
            accent: '#a78bfa',
            muted: '#5b21b6',
            border: 'rgba(167,139,250,0.15)',
        }
    }
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
        builtIn: [DEFAULT_BUILTIN_THEME, OCEAN_THEME, FOREST_THEME, SUNSET_THEME, MIDNIGHT_THEME],
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

