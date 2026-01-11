import { StateCreator } from 'zustand';
import { ThemeStore, ThemeActions } from '../types';

export const createVisualSlice: StateCreator<
    ThemeStore & ThemeActions,
    [['zustand/immer', never]],
    [],
    Pick<ThemeStore, 'visual' | 'overlay' | 'density'> &
    Pick<ThemeActions,
        'setRadius' | 'setShadowStrength' | 'setOutlineOpacity' |
        'setSpecularEnabled' | 'setTextShadowEnabled' | 'setTextVibrancy' | 'setAccentColor' |
        'setBounceIntensity' | 'setPulseIntensity' | 'setScaleIntensity' | 'setWiggleIntensity' |
        'setOverlayEnabled' | 'setOverlayIntensity' | 'setDensity' |
        'applyVisualSettings'
    >
> = (set) => ({
    visual: {
        radius: 24, // 1.5rem default
        shadowStrength: 40,
        outlineOpacity: 40,
        specularEnabled: true,
        textShadowEnabled: true,
        textVibrancy: 50,
        accentColor: '#3b82f6',
        // Animation defaults
        bounceIntensity: 50,
        pulseIntensity: 50,
        scaleIntensity: 50,
        wiggleIntensity: 50,
    },
    overlay: {
        enabled: false,
        intensity: 50,
    },
    density: 'comfortable',

    setRadius: (v) => set(s => { s.visual.radius = v; }),
    setShadowStrength: (v) => set(s => { s.visual.shadowStrength = v; }),
    setOutlineOpacity: (v) => set(s => { s.visual.outlineOpacity = v; }),
    setSpecularEnabled: (v) => set(s => { s.visual.specularEnabled = v; }),
    setTextShadowEnabled: (v) => set(s => { s.visual.textShadowEnabled = v; }),
    setTextVibrancy: (v) => set(s => { s.visual.textVibrancy = v; }),
    setAccentColor: (v) => set(s => { s.visual.accentColor = v; }),

    setBounceIntensity: (v) => set(s => { s.visual.bounceIntensity = v; }),
    setPulseIntensity: (v) => set(s => { s.visual.pulseIntensity = v; }),
    setScaleIntensity: (v) => set(s => { s.visual.scaleIntensity = v; }),
    setWiggleIntensity: (v) => set(s => { s.visual.wiggleIntensity = v; }),

    setOverlayEnabled: (v) => set(s => { s.overlay.enabled = v; }),
    setOverlayIntensity: (v) => set(s => { s.overlay.intensity = v; }),

    setDensity: (v) => set(s => { s.density = v; }),

    applyVisualSettings: (settings) => set(s => { Object.assign(s.visual, settings); }),
});
