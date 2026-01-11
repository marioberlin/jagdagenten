import { useMemo } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { TRANSITIONS, VARIANTS } from '@/styles/animations';

export interface GlassAnimationOptions {
    /** Override the default spring physics */
    physics?: keyof typeof TRANSITIONS;
    /** Scale factor for hover state (default: 1.02) */
    hoverScale?: number;
    /** Scale factor for tap/active state (default: 0.98) */
    tapScale?: number;
    /** Disable all animations */
    disabled?: boolean;
}

/**
 * Hook to provide standardized animation props for Glass components.
 * Respects system reduced motion preferences and global performance settings.
 */
export const useGlassAnimation = (options: GlassAnimationOptions = {}) => {
    const { performanceMode, reducedMotion } = useTheme();
    const {
        physics = 'springFast',
        hoverScale = 1.02,
        tapScale = 0.98,
        disabled = false
    } = options;

    const shouldAnimate = !disabled && !reducedMotion && !performanceMode;

    const animationProps = useMemo(() => {
        if (!shouldAnimate) {
            return {
                whileHover: {},
                whileTap: {},
                transition: { duration: 0 } // Instant updates
            };
        }

        return {
            whileHover: { scale: hoverScale },
            whileTap: { scale: tapScale },
            transition: TRANSITIONS[physics] || TRANSITIONS.spring,
        };
    }, [shouldAnimate, hoverScale, tapScale, physics]);

    return {
        ...animationProps,
        shouldAnimate,
        variants: VARIANTS
    };
};
