import { StateCreator } from 'zustand';
import { ThemeStore, ThemeActions } from '../types';

// Default configuration for 'regular' glass
const DEFAULT_GLASS_STATE = {
    intensity: 60,
    blurStrength: 60,
    material: 'regular' as const,
    tintColor: null,
    saturation: 110,
    noiseOpacity: 5,
};

export const createGlassSlice: StateCreator<
    ThemeStore & ThemeActions,
    [['zustand/immer', never]],
    [],
    Pick<ThemeStore, 'glass'> &
    Pick<ThemeActions,
        'setGlassIntensity' | 'setBlurStrength' | 'setGlassMaterial' |
        'setGlassTintColor' | 'setGlassSaturation' | 'setNoiseOpacity' |
        'applyGlassSettings' | 'resetGlassToDefaults'>
> = (set) => ({
    glass: DEFAULT_GLASS_STATE,

    setGlassIntensity: (value) => set((state) => {
        state.glass.intensity = Math.max(0, Math.min(100, value));
    }),

    setBlurStrength: (value) => set((state) => {
        state.glass.blurStrength = Math.max(0, Math.min(100, value));
    }),

    setGlassMaterial: (material) => set((state) => {
        state.glass.material = material;
    }),

    setGlassTintColor: (color) => set((state) => {
        state.glass.tintColor = color;
    }),

    setGlassSaturation: (value) => set((state) => {
        state.glass.saturation = Math.max(0, Math.min(200, value));
    }),

    setNoiseOpacity: (value) => set((state) => {
        state.glass.noiseOpacity = Math.max(0, Math.min(100, value));
    }),

    applyGlassSettings: (settings) => set((state) => {
        Object.assign(state.glass, settings);
    }),

    resetGlassToDefaults: () => set((state) => {
        state.glass = DEFAULT_GLASS_STATE;
    }),
});
