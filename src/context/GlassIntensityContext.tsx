import React, { createContext, useState, useEffect } from 'react';

// ============================================================================
// GlassIntensityContext
// Manages glass effect parameters: intensity, overlay, tint, vibrancy
// ============================================================================

interface GlassIntensityContextType {
    // Glass intensity (0-100)
    glassIntensity: number;
    setGlassIntensity: (value: number) => void;
    // Background overlay
    overlayEnabled: boolean;
    setOverlayEnabled: (value: boolean) => void;
    overlayIntensity: number;
    setOverlayIntensity: (value: number) => void;
    // Glass tint
    glassTintColor: string | null;
    setGlassTintColor: (value: string | null) => void;
    // Text vibrancy
    textVibrancy: number;
    setTextVibrancy: (value: number) => void;
}

// Export context for use in hook file
export const GlassIntensityContext = createContext<GlassIntensityContextType | undefined>(undefined);

// ============================================================================
// GlassIntensityProvider
// ============================================================================
export const GlassIntensityProvider: React.FC<{
    children: React.ReactNode;
    theme: 'light' | 'dark'; // Passed from parent ThemeContext
}> = ({ children, theme }) => {
    // Glass intensity
    const [glassIntensity, setGlassIntensityState] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('liquid-glass-intensity');
            return saved ? parseInt(saved, 10) : 50;
        }
        return 50;
    });

    // Overlay
    const [overlayEnabled, setOverlayEnabledState] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('liquid-glass-overlay') === 'true';
        }
        return false;
    });

    const [overlayIntensity, setOverlayIntensityState] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('liquid-glass-overlay-intensity');
            return saved ? parseInt(saved, 10) : 25;
        }
        return 25;
    });

    // Tint
    const [glassTintColor, setGlassTintColorState] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('liquid-glass-tint');
        }
        return null;
    });

    // Vibrancy
    const [textVibrancy, setTextVibrancyState] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('liquid-glass-vibrancy');
            return saved ? parseInt(saved, 10) : 50;
        }
        return 50;
    });

    // ========================================================================
    // Apply CSS Variables for Glass Intensity
    // ========================================================================
    useEffect(() => {
        const html = document.documentElement;
        const intensity = glassIntensity / 100;

        let baseR = 0, baseG = 0, baseB = 0;

        if (glassTintColor) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(glassTintColor);
            if (result) {
                baseR = parseInt(result[1], 16);
                baseG = parseInt(result[2], 16);
                baseB = parseInt(result[3], 16);
            }
        } else if (theme === 'light') {
            baseR = 255; baseG = 255; baseB = 255;
        }

        if (theme === 'dark') {
            const thinOpacity = 0.10 + intensity * 0.50;
            const regularOpacity = 0.15 + intensity * 0.60;
            const thickOpacity = 0.20 + intensity * 0.70;

            html.style.setProperty('--glass-bg-thin', `rgba(${baseR}, ${baseG}, ${baseB}, ${thinOpacity.toFixed(3)})`);
            html.style.setProperty('--glass-bg-regular', `rgba(${baseR}, ${baseG}, ${baseB}, ${regularOpacity.toFixed(3)})`);
            html.style.setProperty('--glass-bg-thick', `rgba(${baseR}, ${baseG}, ${baseB}, ${thickOpacity.toFixed(3)})`);
        } else {
            const thinOpacity = 0.35 + intensity * 0.40;
            const regularOpacity = 0.50 + intensity * 0.40;
            const thickOpacity = 0.65 + intensity * 0.30;

            html.style.setProperty('--glass-bg-thin', `rgba(${baseR}, ${baseG}, ${baseB}, ${thinOpacity.toFixed(3)})`);
            html.style.setProperty('--glass-bg-regular', `rgba(${baseR}, ${baseG}, ${baseB}, ${regularOpacity.toFixed(3)})`);
            html.style.setProperty('--glass-bg-thick', `rgba(${baseR}, ${baseG}, ${baseB}, ${thickOpacity.toFixed(3)})`);
        }

        html.style.setProperty('--glass-intensity', glassIntensity.toString());
        localStorage.setItem('liquid-glass-intensity', glassIntensity.toString());
    }, [glassIntensity, theme, glassTintColor]);

    // Persist overlay
    useEffect(() => {
        localStorage.setItem('liquid-glass-overlay', overlayEnabled.toString());
    }, [overlayEnabled]);

    useEffect(() => {
        localStorage.setItem('liquid-glass-overlay-intensity', overlayIntensity.toString());
    }, [overlayIntensity]);

    // Persist tint
    useEffect(() => {
        if (glassTintColor) {
            localStorage.setItem('liquid-glass-tint', glassTintColor);
        } else {
            localStorage.removeItem('liquid-glass-tint');
        }
    }, [glassTintColor]);

    // Apply text vibrancy
    useEffect(() => {
        const html = document.documentElement;
        const vibrancyFactor = textVibrancy / 100;

        if (theme === 'dark') {
            const secondaryAlpha = 0.45 + (vibrancyFactor * 0.30);
            const tertiaryAlpha = 0.18 + (vibrancyFactor * 0.37);

            html.style.setProperty('--label-secondary', `rgba(255, 255, 255, ${secondaryAlpha.toFixed(2)})`);
            html.style.setProperty('--label-tertiary', `rgba(255, 255, 255, ${tertiaryAlpha.toFixed(2)})`);
            html.style.setProperty('--glass-text-secondary', `rgba(255, 255, 255, ${(secondaryAlpha + 0.10).toFixed(2)})`);
            html.style.setProperty('--glass-text-tertiary', `rgba(255, 255, 255, ${(tertiaryAlpha + 0.15).toFixed(2)})`);
        } else {
            const secondaryAlpha = 0.40 + (vibrancyFactor * 0.30);
            const tertiaryAlpha = 0.15 + (vibrancyFactor * 0.30);

            html.style.setProperty('--label-secondary', `rgba(0, 0, 0, ${secondaryAlpha.toFixed(2)})`);
            html.style.setProperty('--label-tertiary', `rgba(0, 0, 0, ${tertiaryAlpha.toFixed(2)})`);
            html.style.setProperty('--glass-text-secondary', `rgba(0, 0, 0, ${(secondaryAlpha + 0.05).toFixed(2)})`);
            html.style.setProperty('--glass-text-tertiary', `rgba(0, 0, 0, ${(tertiaryAlpha + 0.10).toFixed(2)})`);
        }

        localStorage.setItem('liquid-glass-vibrancy', textVibrancy.toString());
    }, [textVibrancy, theme]);

    // ========================================================================
    // Setters
    // ========================================================================
    const setGlassIntensity = (value: number) => setGlassIntensityState(Math.max(0, Math.min(100, value)));
    const setOverlayEnabled = (value: boolean) => setOverlayEnabledState(value);
    const setOverlayIntensity = (value: number) => setOverlayIntensityState(Math.max(0, Math.min(100, value)));
    const setGlassTintColor = (value: string | null) => setGlassTintColorState(value);
    const setTextVibrancy = (value: number) => setTextVibrancyState(Math.max(0, Math.min(100, value)));

    return (
        <GlassIntensityContext.Provider value={{
            glassIntensity,
            setGlassIntensity,
            overlayEnabled,
            setOverlayEnabled,
            overlayIntensity,
            setOverlayIntensity,
            glassTintColor,
            setGlassTintColor,
            textVibrancy,
            setTextVibrancy,
        }}>
            {children}
        </GlassIntensityContext.Provider>
    );
};


