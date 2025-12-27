import { Theme } from '../types/ThemeTypes';

/**
 * Built-in themes for the Liquid Glass UI System
 * These are curated themes that work in both light and dark modes
 */
export const BUILT_IN_THEMES: Theme[] = [
    {
        id: 'cyberpunk',
        name: 'Cyberpunk',
        isBuiltIn: true,
        backgroundId: 'img-neon-city',
        glassRadius: 0,
        shadowStrength: 80,
        density: 'comfortable',
        lightMode: {
            glassIntensity: 60,
            overlayEnabled: true,
            overlayIntensity: 40,
            glassTintColor: '#a855f7',
            backgroundId: 'img-glass-prism',
            accentColor: '#FF2D55',
            textVibrancy: 80,
            glassMaterial: 'thick'
        },
        darkMode: {
            glassIntensity: 80,
            overlayEnabled: true,
            overlayIntensity: 30,
            glassTintColor: '#a855f7',
            backgroundId: 'img-neon-city',
            accentColor: '#FF2D55',
            textVibrancy: 80,
            glassMaterial: 'thick'
        }
    },
    {
        id: 'clean',
        name: 'Clean Dark Light',
        isBuiltIn: true,
        backgroundId: 'soft-clouds',
        glassRadius: 12,
        shadowStrength: 20,
        density: 'comfortable',
        lightMode: {
            glassIntensity: 40,
            overlayEnabled: false,
            overlayIntensity: 0,
            glassTintColor: null,
            backgroundId: 'soft-clouds',
            accentColor: '#007AFF',
            textVibrancy: 50,
            glassMaterial: 'thin'
        },
        darkMode: {
            glassIntensity: 40,
            overlayEnabled: false,
            overlayIntensity: 0,
            glassTintColor: null,
            backgroundId: 'aurora',
            accentColor: '#007AFF',
            textVibrancy: 50,
            glassMaterial: 'thin'
        }
    },
    {
        id: 'liquid-glass',
        name: 'Liquid Glass',
        isBuiltIn: true,
        backgroundId: 'liquid-1',
        glassRadius: 24,
        shadowStrength: 50,
        density: 'comfortable',
        lightMode: {
            glassIntensity: 50,
            overlayEnabled: true,
            overlayIntensity: 20,
            glassTintColor: null,
            backgroundId: 'liquid-1',
            accentColor: '#5AC8FA',
            textVibrancy: 60,
            glassMaterial: 'regular'
        },
        darkMode: {
            glassIntensity: 50,
            overlayEnabled: true,
            overlayIntensity: 20,
            glassTintColor: null,
            backgroundId: 'liquid-1',
            accentColor: '#5AC8FA',
            textVibrancy: 60,
            glassMaterial: 'regular'
        }
    },
    {
        id: 'minimal',
        name: 'Minimal',
        isBuiltIn: true,
        backgroundId: 'clean-grid',
        glassRadius: 4,
        shadowStrength: 0,
        density: 'compact',
        lightMode: {
            glassIntensity: 20,
            overlayEnabled: false,
            overlayIntensity: 0,
            glassTintColor: '#3b82f6',
            backgroundId: 'clean-grid',
            accentColor: '#5856D6',
            textVibrancy: 40,
            glassMaterial: 'thin'
        },
        darkMode: {
            glassIntensity: 20,
            overlayEnabled: false,
            overlayIntensity: 0,
            glassTintColor: '#3b82f6',
            backgroundId: 'neon-grid',
            accentColor: '#5856D6',
            textVibrancy: 40,
            glassMaterial: 'thin'
        }
    },
];
