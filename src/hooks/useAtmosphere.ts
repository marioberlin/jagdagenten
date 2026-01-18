/**
 * useAtmosphere Hook
 * 
 * Derives UI atmosphere configuration from weather data and destination.
 * Core implementation of "Liquid Glass" philosophy: glass that reacts to data.
 */
import { useMemo } from 'react';
import type { AtmosphereConfig, WeatherCondition } from '../services/a2a/NeonTokyoService';

// Extended atmosphere config with CSS-ready values
export interface AtmosphereUIConfig {
    // Core weather data
    condition: WeatherCondition;
    temperature: number;
    humidity: number;
    mood: string;

    // Tailwind gradient classes
    gradientFrom: string;
    gradientVia?: string;
    gradientTo: string;

    // Accent color (Tailwind class without prefix)
    accentColor: string;
    accentColorHex: string;

    // Glass blur intensity
    glassBlur: 'thin' | 'regular' | 'thick';
    blurValue: string; // CSS value like "8px"

    // Animation settings
    animationSpeed: 'calm' | 'normal' | 'energetic';

    // Background settings
    overlayOpacity: number;
    videoKeyword?: string; // For Pexels/Unsplash lookup

    // Border glow
    glowColor: string;
    glowIntensity: 'subtle' | 'medium' | 'vibrant';
}

// Color mappings for different conditions
const CONDITION_COLORS: Record<WeatherCondition, { accent: string; hex: string; glow: string }> = {
    sunny: { accent: 'amber-500', hex: '#f59e0b', glow: 'rgba(245, 158, 11, 0.3)' },
    cloudy: { accent: 'slate-400', hex: '#94a3b8', glow: 'rgba(148, 163, 184, 0.2)' },
    rainy: { accent: 'purple-500', hex: '#a855f7', glow: 'rgba(168, 85, 247, 0.3)' },
    snowy: { accent: 'blue-300', hex: '#93c5fd', glow: 'rgba(147, 197, 253, 0.3)' },
    night: { accent: 'pink-500', hex: '#ec4899', glow: 'rgba(236, 72, 153, 0.4)' },
    foggy: { accent: 'gray-400', hex: '#9ca3af', glow: 'rgba(156, 163, 175, 0.2)' }
};

// Gradient presets for different atmospheres
const ATMOSPHERE_GRADIENTS: Record<WeatherCondition, { from: string; via?: string; to: string }> = {
    sunny: { from: 'from-amber-900/20', via: 'via-orange-900/10', to: 'to-rose-900/20' },
    cloudy: { from: 'from-slate-900/30', to: 'to-gray-900/20' },
    rainy: { from: 'from-purple-900/30', via: 'via-indigo-900/20', to: 'to-slate-900/30' },
    snowy: { from: 'from-slate-800/30', via: 'via-blue-900/20', to: 'to-cyan-900/20' },
    night: { from: 'from-pink-900/20', via: 'via-purple-900/20', to: 'to-cyan-900/20' },
    foggy: { from: 'from-gray-800/40', to: 'to-slate-900/30' }
};

// Video keywords for background footage lookup
const VIDEO_KEYWORDS: Record<WeatherCondition, string> = {
    sunny: 'golden hour city timelapse',
    cloudy: 'overcast city skyline',
    rainy: 'rain window city night',
    snowy: 'snow falling city',
    night: 'neon city night tokyo',
    foggy: 'fog mist cityscape'
};

// Blur values
const BLUR_VALUES: Record<'thin' | 'regular' | 'thick', string> = {
    thin: '8px',
    regular: '12px',
    thick: '20px'
};

/**
 * Hook to derive full UI atmosphere configuration from weather data
 */
export function useAtmosphere(
    atmosphere?: AtmosphereConfig,
    destination?: string
): AtmosphereUIConfig {
    return useMemo(() => {
        // Defaults for when no atmosphere data is available
        const condition: WeatherCondition = atmosphere?.condition || 'night';
        const temperature = atmosphere?.temperature ?? 18;
        const humidity = atmosphere?.humidity ?? 50;
        const mood = atmosphere?.mood || 'Wanderlust';
        const glassBlur = atmosphere?.glassBlur || 'regular';

        // Get color mapping
        const colors = CONDITION_COLORS[condition];

        // Get gradient mapping
        const gradients = ATMOSPHERE_GRADIENTS[condition];

        // Determine animation speed based on condition
        let animationSpeed: 'calm' | 'normal' | 'energetic' = 'normal';
        if (condition === 'rainy' || condition === 'foggy') {
            animationSpeed = 'calm';
        } else if (condition === 'night') {
            animationSpeed = 'energetic';
        }

        // Determine overlay opacity based on condition
        let overlayOpacity = 0.3;
        if (condition === 'rainy' || condition === 'foggy') {
            overlayOpacity = 0.5;
        } else if (condition === 'sunny') {
            overlayOpacity = 0.2;
        }

        // Determine glow intensity
        let glowIntensity: 'subtle' | 'medium' | 'vibrant' = 'medium';
        if (condition === 'night') {
            glowIntensity = 'vibrant';
        } else if (condition === 'cloudy' || condition === 'foggy') {
            glowIntensity = 'subtle';
        }

        return {
            condition,
            temperature,
            humidity,
            mood,
            gradientFrom: gradients.from,
            gradientVia: gradients.via,
            gradientTo: gradients.to,
            accentColor: colors.accent,
            accentColorHex: colors.hex,
            glassBlur,
            blurValue: BLUR_VALUES[glassBlur],
            animationSpeed,
            overlayOpacity,
            videoKeyword: VIDEO_KEYWORDS[condition],
            glowColor: colors.glow,
            glowIntensity
        };
    }, [atmosphere, destination]);
}

/**
 * Get CSS custom properties for atmosphere
 */
export function getAtmosphereCSSVars(config: AtmosphereUIConfig): Record<string, string> {
    return {
        '--atmosphere-accent': config.accentColorHex,
        '--atmosphere-glow': config.glowColor,
        '--atmosphere-blur': config.blurValue,
        '--atmosphere-overlay-opacity': String(config.overlayOpacity),
    };
}

/**
 * Get animation duration based on speed
 */
export function getAnimationDuration(speed: 'calm' | 'normal' | 'energetic'): string {
    switch (speed) {
        case 'calm': return '3s';
        case 'energetic': return '1s';
        default: return '2s';
    }
}

export default useAtmosphere;
