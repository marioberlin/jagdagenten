import { useMemo } from 'react';
import { useAdaptiveText } from './useAdaptiveText';

interface ContrastRecommendation {
    vibrantIntensity: 'low' | 'medium' | 'high';
    textOpacity: number;
    useDropShadow: boolean;
    useTintedLayer: boolean;
}

/**
 * Hook that provides contrast recommendations based on background and material context.
 * Follows Apple Liquid Glass guidelines for text legibility.
 */
export const useContrastDetection = (): ContrastRecommendation => {
    const { backgroundType, contrastLevel, materialThickness } = useAdaptiveText();

    return useMemo(() => {
        // Base recommendations
        let vibrantIntensity: 'low' | 'medium' | 'high' = 'medium';
        let textOpacity = 0.95;
        let useDropShadow = false;
        let useTintedLayer = contrastLevel === 'high';

        // Adjust based on background type
        switch (backgroundType) {
            case 'light':
                vibrantIntensity = 'low';
                textOpacity = 0.9;
                break;
            case 'dark':
                vibrantIntensity = 'medium';
                textOpacity = 0.95;
                break;
            case 'image':
            case 'gradient':
                // Image/gradient backgrounds need more contrast help
                vibrantIntensity = 'high';
                textOpacity = 1;
                useDropShadow = true;
                break;
        }

        // Adjust based on material thickness
        // Thinner materials = more background bleed = need more contrast
        switch (materialThickness) {
            case 'ultra-thin':
                vibrantIntensity = 'high';
                useDropShadow = true;
                break;
            case 'thin':
                if (vibrantIntensity === 'low') vibrantIntensity = 'medium';
                break;
            case 'thick':
                // Thick glass provides its own contrast
                if (vibrantIntensity === 'high') vibrantIntensity = 'medium';
                useDropShadow = false;
                break;
        }

        // High contrast mode overrides
        if (contrastLevel === 'high') {
            textOpacity = 1;
            useTintedLayer = true;
        }

        return {
            vibrantIntensity,
            textOpacity,
            useDropShadow,
            useTintedLayer,
        };
    }, [backgroundType, contrastLevel, materialThickness]);
};
