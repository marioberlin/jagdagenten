import { useAppearance } from './useAppearance';
import { useGlassIntensity } from './useGlassIntensity';
import { useTheme } from './useTheme';

/**
 * @deprecated Use `useTheme()` directly instead - it now includes all theme values. This hook will be removed in v2.0.
 * 
 * useUnifiedTheme - Combines all theme-related hooks into one object.
 * Use this for new code that wants access to all theme values.
 * For existing code, continue using useTheme() for backward compatibility.
 */
export const useUnifiedTheme = () => {
    const theme = useTheme();
    const appearance = useAppearance();
    const intensity = useGlassIntensity();

    return {
        ...theme,
        ...appearance,
        ...intensity,
    };
};
