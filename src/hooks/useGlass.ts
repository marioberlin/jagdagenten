import { useThemeStore } from '../stores/themeStore';
import { useShallow } from 'zustand/react/shallow';

export const useGlass = () => {
    return useThemeStore(
        useShallow((state) => ({
            intensity: state.glass.intensity,
            blurStrength: state.glass.blurStrength,
            material: state.glass.material,
            saturation: state.glass.saturation,
            noiseOpacity: state.glass.noiseOpacity,
            tintColor: state.glass.tintColor,
            setIntensity: state.setGlassIntensity,
            setBlurStrength: state.setBlurStrength,
            setMaterial: state.setGlassMaterial,
            setSaturation: state.setGlassSaturation,
            setNoiseOpacity: state.setNoiseOpacity,
            setTintColor: state.setGlassTintColor,
            reset: state.resetGlassToDefaults,
        }))
    );
};
