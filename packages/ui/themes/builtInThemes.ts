import { Theme } from '../stores/types';

/**
 * Built-in themes for the Liquid Glass UI System
 * Refactored for Zustand Store structure (v2)
 */
export const BUILT_IN_THEMES: Theme[] = [
    {
        id: 'cyberpunk',
        name: 'Cyberpunk',
        isBuiltIn: true,
        light: {
            glass: {
                intensity: 60,
                tintColor: '#a855f7',
                material: 'thick',
                blurStrength: 40,
                saturation: 120,
                noiseOpacity: 10
            },
            visual: {
                radius: 0,
                shadowStrength: 80,
                outlineOpacity: 60,
                specularEnabled: true,
                textShadowEnabled: true,
                textVibrancy: 80,
                accentColor: '#FF2D55',
                bounceIntensity: 60,
                pulseIntensity: 70,
                scaleIntensity: 60,
                wiggleIntensity: 40
            },
            overlay: { enabled: true, intensity: 40 },
            background: { id: 'img-glass-prism', luminance: 'light' }
        },
        dark: {
            glass: {
                intensity: 80,
                tintColor: '#a855f7',
                material: 'thick',
                blurStrength: 40,
                saturation: 120,
                noiseOpacity: 10
            },
            visual: {
                radius: 0,
                shadowStrength: 80,
                outlineOpacity: 60,
                specularEnabled: true,
                textShadowEnabled: true,
                textVibrancy: 80,
                accentColor: '#FF2D55',
                bounceIntensity: 60,
                pulseIntensity: 70,
                scaleIntensity: 60,
                wiggleIntensity: 40
            },
            overlay: { enabled: true, intensity: 30 },
            background: { id: 'img-neon-city', luminance: 'dark' }
        }
    },
    {
        id: 'clean',
        name: 'Clean Dark Light',
        isBuiltIn: true,
        light: {
            glass: {
                intensity: 40,
                tintColor: null,
                material: 'thin',
                blurStrength: 30,
                saturation: 100,
                noiseOpacity: 2
            },
            visual: {
                radius: 12,
                shadowStrength: 20,
                outlineOpacity: 20,
                specularEnabled: false,
                textShadowEnabled: false,
                textVibrancy: 50,
                accentColor: '#007AFF',
                bounceIntensity: 30,
                pulseIntensity: 0,
                scaleIntensity: 30,
                wiggleIntensity: 0
            },
            overlay: { enabled: false, intensity: 0 },
            background: { id: 'soft-clouds', luminance: 'light' }
        },
        dark: {
            glass: {
                intensity: 40,
                tintColor: null,
                material: 'thin',
                blurStrength: 30,
                saturation: 100,
                noiseOpacity: 2
            },
            visual: {
                radius: 12,
                shadowStrength: 20,
                outlineOpacity: 20,
                specularEnabled: false,
                textShadowEnabled: false,
                textVibrancy: 50,
                accentColor: '#0A84FF',
                bounceIntensity: 30,
                pulseIntensity: 0,
                scaleIntensity: 30,
                wiggleIntensity: 0
            },
            overlay: { enabled: false, intensity: 0 },
            background: { id: 'aurora', luminance: 'dark' }
        }
    },
    {
        id: 'liquid-glass',
        name: 'Liquid Glass',
        isBuiltIn: true,
        light: {
            glass: {
                intensity: 50,
                tintColor: null,
                material: 'regular',
                blurStrength: 50,
                saturation: 110,
                noiseOpacity: 5
            },
            visual: {
                radius: 24,
                shadowStrength: 40,
                outlineOpacity: 40,
                specularEnabled: true,
                textShadowEnabled: true,
                textVibrancy: 60,
                accentColor: '#007AFF', // Light blue
                bounceIntensity: 50,
                pulseIntensity: 50,
                scaleIntensity: 50,
                wiggleIntensity: 50
            },
            overlay: { enabled: true, intensity: 15 },
            background: { id: 'liquid-1', luminance: 'light' }
        },
        dark: {
            glass: {
                intensity: 50,
                tintColor: null,
                material: 'regular',
                blurStrength: 50,
                saturation: 110,
                noiseOpacity: 5
            },
            visual: {
                radius: 24,
                shadowStrength: 40,
                outlineOpacity: 40,
                specularEnabled: true,
                textShadowEnabled: true,
                textVibrancy: 60,
                accentColor: '#0A84FF', // Dark blue
                bounceIntensity: 50,
                pulseIntensity: 50,
                scaleIntensity: 50,
                wiggleIntensity: 50
            },
            overlay: { enabled: true, intensity: 15 },
            background: { id: 'liquid-1', luminance: 'dark' }
        }
    },
    {
        id: 'minimal',
        name: 'Minimal',
        isBuiltIn: true,
        light: {
            glass: {
                intensity: 20,
                tintColor: '#3b82f6',
                material: 'thin',
                blurStrength: 20,
                saturation: 90,
                noiseOpacity: 0
            },
            visual: {
                radius: 4,
                shadowStrength: 0,
                outlineOpacity: 10,
                specularEnabled: false,
                textShadowEnabled: false,
                textVibrancy: 40,
                accentColor: '#5856D6',
                bounceIntensity: 0,
                pulseIntensity: 0,
                scaleIntensity: 0,
                wiggleIntensity: 0
            },
            overlay: { enabled: false, intensity: 0 },
            background: { id: 'clean-grid', luminance: 'light' }
        },
        dark: {
            glass: {
                intensity: 20,
                tintColor: '#3b82f6',
                material: 'thin',
                blurStrength: 20,
                saturation: 90,
                noiseOpacity: 0
            },
            visual: {
                radius: 4,
                shadowStrength: 0,
                outlineOpacity: 10,
                specularEnabled: false,
                textShadowEnabled: false,
                textVibrancy: 40,
                accentColor: '#5856D6',
                bounceIntensity: 0,
                pulseIntensity: 0,
                scaleIntensity: 0,
                wiggleIntensity: 0
            },
            overlay: { enabled: false, intensity: 0 },
            background: { id: 'neon-grid', luminance: 'dark' }
        }
    },
    {
        id: 'marketing-evolution',
        name: 'Liquid Evolution',
        isBuiltIn: true,
        light: {
            glass: {
                intensity: 70,
                tintColor: null,
                material: 'thick',
                blurStrength: 75,
                saturation: 120,
                noiseOpacity: 8
            },
            visual: {
                radius: 32,
                shadowStrength: 60,
                outlineOpacity: 40,
                specularEnabled: true,
                textShadowEnabled: true,
                textVibrancy: 70,
                accentColor: '#007AFF',
                bounceIntensity: 70,
                pulseIntensity: 70,
                scaleIntensity: 80,
                wiggleIntensity: 60
            },
            overlay: { enabled: true, intensity: 30 },
            background: { id: 'liquid-1', luminance: 'light' }
        },
        dark: {
            glass: {
                intensity: 70,
                tintColor: null,
                material: 'thick',
                blurStrength: 75,
                saturation: 120,
                noiseOpacity: 8
            },
            visual: {
                radius: 32,
                shadowStrength: 60,
                outlineOpacity: 40,
                specularEnabled: true,
                textShadowEnabled: true,
                textVibrancy: 70,
                accentColor: '#0A84FF',
                bounceIntensity: 70,
                pulseIntensity: 70,
                scaleIntensity: 80,
                wiggleIntensity: 60
            },
            overlay: { enabled: true, intensity: 30 },
            background: { id: 'liquid-1', luminance: 'dark' }
        }
    },
    {
        id: 'native-hig',
        name: 'Classic HIG',
        isBuiltIn: true,
        light: {
            glass: {
                intensity: 50,
                tintColor: null,
                material: 'regular',
                blurStrength: 50,
                saturation: 100,
                noiseOpacity: 5
            },
            visual: {
                radius: 20,
                shadowStrength: 30,
                outlineOpacity: 20,
                specularEnabled: true,
                textShadowEnabled: false,
                textVibrancy: 50,
                accentColor: '#007AFF',
                bounceIntensity: 40,
                pulseIntensity: 30,
                scaleIntensity: 40,
                wiggleIntensity: 20
            },
            overlay: { enabled: true, intensity: 15 },
            background: { id: 'img-mountains', luminance: 'light' }
        },
        dark: {
            glass: {
                intensity: 50,
                tintColor: null,
                material: 'regular',
                blurStrength: 50,
                saturation: 100,
                noiseOpacity: 5
            },
            visual: {
                radius: 20,
                shadowStrength: 30,
                outlineOpacity: 20,
                specularEnabled: true,
                textShadowEnabled: false,
                textVibrancy: 50,
                accentColor: '#0A84FF',
                bounceIntensity: 40,
                pulseIntensity: 30,
                scaleIntensity: 40,
                wiggleIntensity: 20
            },
            overlay: { enabled: true, intensity: 15 },
            background: { id: 'img-mountains', luminance: 'dark' }
        }
    },
    {
        id: 'liquid-web',
        name: 'Liquid Web',
        isBuiltIn: true,
        light: {
            glass: {
                intensity: 50,
                tintColor: null,
                material: 'regular',
                blurStrength: 50,
                saturation: 180,
                noiseOpacity: 5
            },
            visual: {
                radius: 32,
                shadowStrength: 40,
                outlineOpacity: 30,
                specularEnabled: true,
                textShadowEnabled: true,
                textVibrancy: 60,
                accentColor: '#007AFF',
                bounceIntensity: 60,
                pulseIntensity: 50,
                scaleIntensity: 60,
                wiggleIntensity: 40
            },
            overlay: { enabled: true, intensity: 20 },
            background: { id: 'abstract-mesh', luminance: 'light' }
        },
        dark: {
            glass: {
                intensity: 50,
                tintColor: null,
                material: 'regular',
                blurStrength: 50,
                saturation: 180,
                noiseOpacity: 5
            },
            visual: {
                radius: 32,
                shadowStrength: 40,
                outlineOpacity: 30,
                specularEnabled: true,
                textShadowEnabled: true,
                textVibrancy: 60,
                accentColor: '#0A84FF',
                bounceIntensity: 60,
                pulseIntensity: 50,
                scaleIntensity: 60,
                wiggleIntensity: 40
            },
            overlay: { enabled: true, intensity: 20 },
            background: { id: 'abstract-glass', luminance: 'dark' }
        }
    }
];
