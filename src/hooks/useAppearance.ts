import { useTheme } from './useTheme';

/**
 * Hook to access appearance settings (density, radius, shadow, material, outline)
 * Legacy wrapper around useTheme for backward compatibility.
 */
export const useAppearance = () => {
    const {
        density,
        setDensity,
        glassRadius,
        setGlassRadius,
        shadowStrength,
        setShadowStrength,
        outlineOpacity,
        setOutlineOpacity
    } = useTheme();

    return {
        density,
        setDensity,
        radius: glassRadius,
        setRadius: setGlassRadius,
        shadow: shadowStrength,
        setShadow: setShadowStrength,
        outline: outlineOpacity,
        setOutline: setOutlineOpacity
    };
};
