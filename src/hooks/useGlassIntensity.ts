import { useTheme } from './useTheme';

/**
 * @deprecated Use `useTheme()` or `useGlass()` directly instead. This hook will be removed in v2.0.
 * 
 * Hook to access glass intensity settings (intensity, overlay, tint, vibrancy)
 * Legacy wrapper around useTheme for backward compatibility.
 */
export const useGlassIntensity = () => {
    const {
        glassIntensity,
        setGlassIntensity,
        glassTintColor,
        setGlassTintColor,
        glassMaterial,
        setGlassMaterial,
        blurStrength,
        setBlurStrength
    } = useTheme();

    return {
        intensity: glassIntensity,
        setIntensity: setGlassIntensity,
        tint: glassTintColor,
        setTint: setGlassTintColor,
        material: glassMaterial,
        setMaterial: setGlassMaterial,
        blur: blurStrength,
        setBlur: setBlurStrength
    };
};
