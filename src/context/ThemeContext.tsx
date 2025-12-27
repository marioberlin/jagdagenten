import React, { createContext, useState, useEffect } from 'react';
export * from '../types/ThemeTypes';
import { BackgroundLuminance, Density, Theme } from '../types/ThemeTypes';

export interface ThemeContextType {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    activeBackgroundId: string;
    setActiveBackground: (id: string, preferredTheme?: 'light' | 'dark') => void;
    backgroundLuminance: BackgroundLuminance;
    // Glass customization
    glassIntensity: number;
    setGlassIntensity: (value: number) => void;
    overlayEnabled: boolean;
    setOverlayEnabled: (value: boolean) => void;
    overlayIntensity: number;
    setOverlayIntensity: (value: number) => void;
    // Density mode
    density: Density;
    setDensity: (value: Density) => void;
    // Advanced Customization
    glassRadius: number; // px, default 24
    setGlassRadius: (value: number) => void;
    shadowStrength: number; // 0-100, default 50
    setShadowStrength: (value: number) => void;
    glassTintColor: string | null; // hex or rgba, null = default
    setGlassTintColor: (value: string | null) => void;
    // Accent & Vibrancy
    accentColor: string;
    setAccentColor: (value: string) => void;
    textVibrancy: number;
    setTextVibrancy: (value: number) => void;
    // Glass Material
    glassMaterial: 'thin' | 'regular' | 'thick';
    setGlassMaterial: (value: 'thin' | 'regular' | 'thick') => void;
    // Outline Opacity
    outlineOpacity: number;
    setOutlineOpacity: (value: number) => void;
    // Specular Highlight Toggle
    specularEnabled: boolean;
    setSpecularEnabled: (value: boolean) => void;
    // NEW: Blur Strength (controls blur radius)
    blurStrength: number; // 0-100, default 50
    setBlurStrength: (value: number) => void;
    // NEW: Saturation Boost (adds vibrancy behind glass)
    saturation: number; // 0-200, default 100 (100 = no change)
    setSaturation: (value: number) => void;
    // NEW: Noise/Grain Opacity (adds texture)
    noiseOpacity: number; // 0-100, default 0 (off)
    setNoiseOpacity: (value: number) => void;
    // NEW: Text Shadow on Glass Toggle
    textShadowEnabled: boolean;
    setTextShadowEnabled: (value: boolean) => void;
    // NEW: Performance Mode (disables liquid effects globally)
    performanceMode: boolean;
    setPerformanceMode: (value: boolean) => void;
    // Custom Themes
    customThemes: Theme[];
    activeThemeId: string | null;
    builtInThemes: Theme[];
    createTheme: (name: string) => void;
    updateTheme: (id: string, updates: Partial<Theme>) => void;
    deleteTheme: (id: string) => void;
    applyTheme: (id: string) => void;
    copyTheme: (id: string, newName: string) => void;
}

// Export context for use in hook file
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

import { Backgrounds } from '../components/Backgrounds/BackgroundRegistry';

// Helper to get luminance from background config
const getLuminanceFromBackground = (bgId: string): BackgroundLuminance => {
    const bg = Backgrounds.find(b => b.id === bgId);
    return bg?.preferredTheme === 'light' ? 'light' : 'dark';
};

// Import built-in themes from external file
import { BUILT_IN_THEMES } from '../themes/builtInThemes';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeBackgroundId, setActiveBackgroundId] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('liquid-glass-bg') || 'liquid-1';
        }
        return 'liquid-1';
    });

    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (typeof window !== 'undefined') {
            // Priority: Check if the saved background enforces a theme
            const savedBgId = localStorage.getItem('liquid-glass-bg');
            if (savedBgId) {
                const bg = Backgrounds.find(b => b.id === savedBgId);
                if (bg?.preferredTheme) {
                    return bg.preferredTheme;
                }
            }

            // Fallback to saved theme
            const saved = localStorage.getItem('liquid-glass-theme');
            if (saved === 'light' || saved === 'dark') return saved;
        }
        return 'dark';
    });

    // Derive background luminance from the active background
    const [backgroundLuminance, setBackgroundLuminance] = useState<BackgroundLuminance>(() => {
        if (typeof window !== 'undefined') {
            const savedBgId = localStorage.getItem('liquid-glass-bg') || 'liquid-1';
            return getLuminanceFromBackground(savedBgId);
        }
        return 'dark';
    });

    // Glass intensity (0-100, default 50)
    const [glassIntensity, setGlassIntensityState] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('liquid-glass-intensity');
            return saved ? parseInt(saved, 10) : 50;
        }
        return 50;
    });

    // Background overlay toggle
    const [overlayEnabled, setOverlayEnabledState] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('liquid-glass-overlay') === 'true';
        }
        return false;
    });

    // Background overlay intensity (0-100, default 25)
    const [overlayIntensity, setOverlayIntensityState] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('liquid-glass-overlay-intensity');
            return saved ? parseInt(saved, 10) : 25;
        }
        return 25;
    });

    // Density mode (comfortable or compact)
    const [density, setDensityState] = useState<Density>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('liquid-glass-density');
            if (saved === 'comfortable' || saved === 'compact') return saved;
        }
        return 'comfortable';
    });

    // Radius (default 24px)
    const [glassRadius, setGlassRadiusState] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('liquid-glass-radius');
            return saved ? parseInt(saved, 10) : 24;
        }
        return 24;
    });

    // Shadow Strength (0-100, default 50)
    const [shadowStrength, setShadowStrengthState] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('liquid-glass-shadow');
            return saved ? parseInt(saved, 10) : 50;
        }
        return 50;
    });

    // Tint Color (default null)
    const [glassTintColor, setGlassTintColorState] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('liquid-glass-tint');
        }
        return null;
    });

    // Accent Color (default system blue)
    const [accentColor, setAccentColorState] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('liquid-glass-accent') || '#007AFF';
        }
        return '#007AFF';
    });

    // Text Vibrancy (0-100, default 50)
    const [textVibrancy, setTextVibrancyState] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('liquid-glass-vibrancy');
            return saved ? parseInt(saved, 10) : 50;
        }
        return 50;
    });

    // Glass Material (thin/regular/thick, default regular)
    const [glassMaterial, setGlassMaterialState] = useState<'thin' | 'regular' | 'thick'>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('liquid-glass-material');
            if (saved === 'thin' || saved === 'regular' || saved === 'thick') return saved;
        }
        return 'regular';
    });

    // Outline Opacity (0-100, default 30)
    const [outlineOpacity, setOutlineOpacityState] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('liquid-glass-outline');
            return saved ? parseInt(saved, 10) : 30;
        }
        return 30;
    });

    // Specular Highlight Toggle (default true for new HIG layer)
    const [specularEnabled, setSpecularEnabledState] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('liquid-glass-specular');
            return saved !== 'false'; // Default to true
        }
        return true;
    });

    // NEW: Blur Strength (0-100, default 50)
    const [blurStrength, setBlurStrengthState] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('liquid-glass-blur');
            return saved ? parseInt(saved, 10) : 50;
        }
        return 50;
    });

    // NEW: Saturation Boost (0-200, default 100 = no change)
    const [saturation, setSaturationState] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('liquid-glass-saturation');
            return saved ? parseInt(saved, 10) : 100;
        }
        return 100;
    });

    // NEW: Noise/Grain Opacity (0-100, default 0 = off)
    const [noiseOpacity, setNoiseOpacityState] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('liquid-glass-noise');
            return saved ? parseInt(saved, 10) : 0;
        }
        return 0;
    });

    // NEW: Text Shadow on Glass Toggle (default true for accessibility)
    const [textShadowEnabled, setTextShadowEnabledState] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('liquid-glass-text-shadow');
            return saved !== 'false'; // Default to true
        }
        return true;
    });

    // NEW: Performance Mode (default false)
    const [performanceMode, setPerformanceModeState] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('liquid-glass-performance-mode');
            return saved === 'true';
        }
        return false;
    });

    // Legacy theme format (pre-mode-specific structure)
    interface LegacyTheme {
        id: string;
        name: string;
        isBuiltIn?: boolean;
        backgroundId?: string;
        glassRadius?: number;
        shadowStrength?: number;
        density?: Density;
        glassIntensity?: number;
        overlayEnabled?: boolean;
        overlayIntensity?: number;
        glassTintColor?: string | null;
        lightMode?: Theme['lightMode'];
        darkMode?: Theme['darkMode'];
    }

    // Custom Themes with migration for old format
    const [customThemes, setCustomThemes] = useState<Theme[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('liquid-glass-custom-themes');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved) as LegacyTheme[];
                    // Migrate old themes to new format
                    return parsed.map((theme: LegacyTheme): Theme => {
                        // Check if theme already has mode-specific structure
                        if (theme.lightMode && theme.darkMode) {
                            return theme as Theme;
                        }
                        // Migrate old format to new format
                        const bgId = theme.backgroundId || 'img-mountains';
                        return {
                            id: theme.id,
                            name: theme.name,
                            isBuiltIn: theme.isBuiltIn || false,
                            backgroundId: bgId,
                            glassRadius: theme.glassRadius || 24,
                            shadowStrength: theme.shadowStrength || 50,
                            density: theme.density || 'comfortable',
                            lightMode: {
                                glassIntensity: theme.glassIntensity || 50,
                                overlayEnabled: theme.overlayEnabled || false,
                                overlayIntensity: theme.overlayIntensity || 25,
                                glassTintColor: theme.glassTintColor || null,
                                backgroundId: bgId
                            },
                            darkMode: {
                                glassIntensity: theme.glassIntensity || 50,
                                overlayEnabled: theme.overlayEnabled || false,
                                overlayIntensity: theme.overlayIntensity || 25,
                                glassTintColor: theme.glassTintColor || null,
                                backgroundId: bgId
                            }
                        };
                    });
                } catch (e) {
                    console.error('Failed to parse custom themes', e);
                }
            }
        }
        return [];
    });

    const [activeThemeId, setActiveThemeId] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('liquid-glass-active-theme');
        }
        return null;
    });

    // Update luminance when background changes
    useEffect(() => {
        const luminance = getLuminanceFromBackground(activeBackgroundId);
        setBackgroundLuminance(luminance);
    }, [activeBackgroundId]);

    // Apply theme and luminance classes to html element
    useEffect(() => {
        const html = document.documentElement;

        // Theme class
        if (theme === 'dark') {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }

        // Background luminance class (for glass tinting)
        html.classList.remove('light-bg', 'dark-bg');
        html.classList.add(backgroundLuminance === 'light' ? 'light-bg' : 'dark-bg');

        localStorage.setItem('liquid-glass-theme', theme);
    }, [theme, backgroundLuminance]);

    // Apply density class to html element
    useEffect(() => {
        const html = document.documentElement;
        html.classList.remove('density-comfortable', 'density-compact');
        html.classList.add(`density-${density}`);
        localStorage.setItem('liquid-glass-density', density);
    }, [density]);

    // Apply glass intensity as CSS variables
    useEffect(() => {
        const html = document.documentElement;
        const intensity = glassIntensity / 100; // Normalize to 0-1

        // Determine base colors
        let baseR = 0, baseG = 0, baseB = 0; // Dark mode default (black)

        if (glassTintColor) {
            // If custom tint is set, parse hex to rgb
            // Simple hex parser for #RRGGBB
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
            // Dark mode: tinted glass (BLACK overlay for dark scrim effect OR custom color)
            // Intensity 0 = very subtle (0.10), Intensity 100 = nearly opaque (0.90)
            const thinOpacity = 0.10 + intensity * 0.50;
            const regularOpacity = 0.15 + intensity * 0.60;
            const thickOpacity = 0.20 + intensity * 0.70;

            html.style.setProperty('--glass-bg-thin', `rgba(${baseR}, ${baseG}, ${baseB}, ${thinOpacity.toFixed(3)})`);
            html.style.setProperty('--glass-bg-regular', `rgba(${baseR}, ${baseG}, ${baseB}, ${regularOpacity.toFixed(3)})`);
            html.style.setProperty('--glass-bg-thick', `rgba(${baseR}, ${baseG}, ${baseB}, ${thickOpacity.toFixed(3)})`);
        } else {
            // Light mode: frosted glass (white overlay with high opacity OR custom color)
            // Intensity 0 = transparent (0.3), Intensity 100 = opaque (0.95)
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

    // Persist overlay setting
    useEffect(() => {
        localStorage.setItem('liquid-glass-overlay', overlayEnabled.toString());
    }, [overlayEnabled]);

    // Persist overlay intensity
    useEffect(() => {
        localStorage.setItem('liquid-glass-overlay-intensity', overlayIntensity.toString());
    }, [overlayIntensity]);

    useEffect(() => {
        localStorage.setItem('liquid-glass-bg', activeBackgroundId);
    }, [activeBackgroundId]);

    // Apply Radius and Shadow
    useEffect(() => {
        const html = document.documentElement;
        html.style.setProperty('--glass-radius', `${glassRadius}px`);
        localStorage.setItem('liquid-glass-radius', glassRadius.toString());
    }, [glassRadius]);

    useEffect(() => {
        const html = document.documentElement;
        // Shadow opacity: 0 to 0.5 based on strength
        const shadowOpacity = (shadowStrength / 100) * 0.5;
        // Inject into a variable that GlassContainer uses (we'll update GlassContainer to use this)
        // We'll update the shadow-glass utility to use this variable in index.css if possible,
        // or just rely on GlassContainer using it.
        // For now, let's set a variable --glass-shadow-opacity
        html.style.setProperty('--glass-shadow-opacity', shadowOpacity.toFixed(3));
        localStorage.setItem('liquid-glass-shadow', shadowStrength.toString());
    }, [shadowStrength]);

    useEffect(() => {
        if (glassTintColor) {
            localStorage.setItem('liquid-glass-tint', glassTintColor);
        } else {
            localStorage.removeItem('liquid-glass-tint');
        }
    }, [glassTintColor]);

    // Apply accent color as CSS variables
    useEffect(() => {
        const html = document.documentElement;

        // Set accent color
        html.style.setProperty('--color-accent', accentColor);

        // Parse hex to RGB for muted variants
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(accentColor);
        if (result) {
            const r = parseInt(result[1], 16);
            const g = parseInt(result[2], 16);
            const b = parseInt(result[3], 16);

            // Muted variant (for backgrounds)
            const mutedOpacity = theme === 'dark' ? 0.20 : 0.15;
            html.style.setProperty('--color-accent-muted', `rgba(${r}, ${g}, ${b}, ${mutedOpacity})`);

            // Hover variant
            const hoverOpacity = theme === 'dark' ? 0.30 : 0.25;
            html.style.setProperty('--color-accent-hover', `rgba(${r}, ${g}, ${b}, ${hoverOpacity})`);
        }

        localStorage.setItem('liquid-glass-accent', accentColor);
    }, [accentColor, theme]);

    // Apply text vibrancy as CSS variables
    useEffect(() => {
        const html = document.documentElement;
        const vibrancyFactor = textVibrancy / 100;

        if (theme === 'dark') {
            // Dark mode: white text with varying opacity
            // Vibrancy 0 = muted (0.45, 0.18), Vibrancy 100 = vibrant (0.75, 0.55)
            const secondaryAlpha = 0.45 + (vibrancyFactor * 0.30);
            const tertiaryAlpha = 0.18 + (vibrancyFactor * 0.37);

            html.style.setProperty('--label-secondary', `rgba(255, 255, 255, ${secondaryAlpha.toFixed(2)})`);
            html.style.setProperty('--label-tertiary', `rgba(255, 255, 255, ${tertiaryAlpha.toFixed(2)})`);
            html.style.setProperty('--glass-text-secondary', `rgba(255, 255, 255, ${(secondaryAlpha + 0.10).toFixed(2)})`);
            html.style.setProperty('--glass-text-tertiary', `rgba(255, 255, 255, ${(tertiaryAlpha + 0.15).toFixed(2)})`);
        } else {
            // Light mode: black text with varying opacity
            // Vibrancy 0 = muted (0.40, 0.15), Vibrancy 100 = vibrant (0.70, 0.45)
            const secondaryAlpha = 0.40 + (vibrancyFactor * 0.30);
            const tertiaryAlpha = 0.15 + (vibrancyFactor * 0.30);

            html.style.setProperty('--label-secondary', `rgba(0, 0, 0, ${secondaryAlpha.toFixed(2)})`);
            html.style.setProperty('--label-tertiary', `rgba(0, 0, 0, ${tertiaryAlpha.toFixed(2)})`);
            html.style.setProperty('--glass-text-secondary', `rgba(0, 0, 0, ${(secondaryAlpha + 0.05).toFixed(2)})`);
            html.style.setProperty('--glass-text-tertiary', `rgba(0, 0, 0, ${(tertiaryAlpha + 0.10).toFixed(2)})`);
        }

        localStorage.setItem('liquid-glass-vibrancy', textVibrancy.toString());
    }, [textVibrancy, theme]);

    // Apply glass material as CSS variable
    useEffect(() => {
        const html = document.documentElement;
        html.style.setProperty('--glass-material', glassMaterial);
        localStorage.setItem('liquid-glass-material', glassMaterial);
    }, [glassMaterial]);

    // Apply outline opacity as CSS variable
    useEffect(() => {
        const html = document.documentElement;
        const opacity = outlineOpacity / 100;
        html.style.setProperty('--glass-border-opacity', opacity.toFixed(2));
        html.style.setProperty('--glass-border', `rgba(255, 255, 255, ${opacity.toFixed(2)})`);
        localStorage.setItem('liquid-glass-outline', outlineOpacity.toString());
    }, [outlineOpacity]);

    // Persist specular setting and inject CSS variable
    useEffect(() => {
        const html = document.documentElement;
        html.style.setProperty('--specular-enabled', specularEnabled ? '1' : '0');
        localStorage.setItem('liquid-glass-specular', specularEnabled.toString());
    }, [specularEnabled]);

    // NEW: Apply blur strength as CSS variables
    useEffect(() => {
        const html = document.documentElement;
        // Map 0-100 to blur radius: 0 = 4px (minimal), 50 = 16px (default), 100 = 48px (max)
        const blurThin = Math.round(4 + (blurStrength / 100) * 12); // 4-16px
        const blurRegular = Math.round(8 + (blurStrength / 100) * 24); // 8-32px
        const blurThick = Math.round(16 + (blurStrength / 100) * 48); // 16-64px

        html.style.setProperty('--glass-blur-thin', `${blurThin}px`);
        html.style.setProperty('--glass-blur-regular', `${blurRegular}px`);
        html.style.setProperty('--glass-blur-thick', `${blurThick}px`);
        localStorage.setItem('liquid-glass-blur', blurStrength.toString());
    }, [blurStrength]);

    // NEW: Apply saturation boost as CSS variable
    useEffect(() => {
        const html = document.documentElement;
        // Map 0-200 to saturation multiplier (100 = 1.0 = no change)
        const saturationValue = saturation / 100;
        html.style.setProperty('--glass-saturate', saturationValue.toFixed(2));
        localStorage.setItem('liquid-glass-saturation', saturation.toString());
    }, [saturation]);

    // NEW: Apply noise/grain opacity as CSS variable
    useEffect(() => {
        const html = document.documentElement;
        const opacity = noiseOpacity / 100;
        html.style.setProperty('--glass-noise-opacity', opacity.toFixed(2));
        localStorage.setItem('liquid-glass-noise', noiseOpacity.toString());
    }, [noiseOpacity]);

    // NEW: Apply text shadow toggle as CSS variable
    useEffect(() => {
        const html = document.documentElement;
        html.style.setProperty('--text-shadow-on-glass', textShadowEnabled ? '0 1px 2px rgba(0, 0, 0, 0.15)' : 'none');
        localStorage.setItem('liquid-glass-text-shadow', textShadowEnabled.toString());
    }, [textShadowEnabled]);

    // NEW: Persist performance mode
    useEffect(() => {
        localStorage.setItem('liquid-glass-performance-mode', performanceMode.toString());
    }, [performanceMode]);

    // Re-apply mode-specific settings when theme (light/dark) changes
    useEffect(() => {
        if (activeThemeId) {
            const themeConfig = [...BUILT_IN_THEMES, ...customThemes].find(t => t.id === activeThemeId);
            if (themeConfig) {
                const modeSettings = theme === 'dark' ? themeConfig.darkMode : themeConfig.lightMode;
                setGlassIntensity(modeSettings.glassIntensity);
                setOverlayEnabled(modeSettings.overlayEnabled);
                setOverlayIntensity(modeSettings.overlayIntensity);
                setGlassTintColor(modeSettings.glassTintColor);
                // Apply accent and vibrancy (with defaults for backward compatibility)
                setAccentColor(modeSettings.accentColor ?? '#007AFF');
                setTextVibrancy(modeSettings.textVibrancy ?? 50);
                // Apply glass material (with default for backward compatibility)
                setGlassMaterial(modeSettings.glassMaterial ?? 'regular');
                // Apply outline opacity (with default for backward compatibility)
                setOutlineOpacity(modeSettings.outlineOpacity ?? 30);
                // Also apply mode-specific background
                if (modeSettings.backgroundId) {
                    setActiveBackgroundId(modeSettings.backgroundId);
                }
            }
        }
    }, [theme]); // Only run when theme changes


    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const setActiveBackground = (id: string, preferredTheme?: 'light' | 'dark') => {
        setActiveBackgroundId(id);
        if (preferredTheme) {
            setTheme(preferredTheme);
        }
    };

    const setGlassIntensity = (value: number) => {
        setGlassIntensityState(Math.max(0, Math.min(100, value)));
    };

    const setOverlayEnabled = (value: boolean) => {
        setOverlayEnabledState(value);
    };

    const setOverlayIntensity = (value: number) => {
        setOverlayIntensityState(Math.max(0, Math.min(100, value)));
    };

    const setDensity = (value: Density) => {
        setDensityState(value);
    };

    const setGlassRadius = (value: number) => setGlassRadiusState(value);
    const setShadowStrength = (value: number) => setShadowStrengthState(value);
    const setGlassTintColor = (value: string | null) => setGlassTintColorState(value);
    const setAccentColor = (value: string) => setAccentColorState(value);
    const setTextVibrancy = (value: number) => setTextVibrancyState(Math.max(0, Math.min(100, value)));
    const setGlassMaterial = (value: 'thin' | 'regular' | 'thick') => setGlassMaterialState(value);
    const setOutlineOpacity = (value: number) => setOutlineOpacityState(Math.max(0, Math.min(100, value)));
    const setSpecularEnabled = (value: boolean) => setSpecularEnabledState(value);
    const setBlurStrength = (value: number) => setBlurStrengthState(Math.max(0, Math.min(100, value)));
    const setSaturation = (value: number) => setSaturationState(Math.max(0, Math.min(200, value)));
    const setNoiseOpacity = (value: number) => setNoiseOpacityState(Math.max(0, Math.min(100, value)));
    const setTextShadowEnabled = (value: boolean) => setTextShadowEnabledState(value);
    const setPerformanceMode = (value: boolean) => setPerformanceModeState(value);

    // Theme CRUD operations
    const createTheme = (name: string) => {
        const newTheme: Theme = {
            id: `custom-${Date.now()}`,
            name,
            isBuiltIn: false,
            backgroundId: activeBackgroundId,
            glassRadius,
            shadowStrength,
            density,
            lightMode: {
                glassIntensity,
                overlayEnabled,
                overlayIntensity,
                glassTintColor,
                backgroundId: activeBackgroundId,
                accentColor,
                textVibrancy,
                glassMaterial,
                outlineOpacity
            },
            darkMode: {
                glassIntensity,
                overlayEnabled,
                overlayIntensity,
                glassTintColor,
                backgroundId: activeBackgroundId,
                accentColor,
                textVibrancy,
                glassMaterial,
                outlineOpacity
            }
        };
        const updated = [...customThemes, newTheme];
        setCustomThemes(updated);
        localStorage.setItem('liquid-glass-custom-themes', JSON.stringify(updated));
        setActiveThemeId(newTheme.id);
        localStorage.setItem('liquid-glass-active-theme', newTheme.id);
    };

    const updateTheme = (id: string, updates: Partial<Theme>) => {
        const updated = customThemes.map(t =>
            t.id === id ? { ...t, ...updates } : t
        );
        setCustomThemes(updated);
        localStorage.setItem('liquid-glass-custom-themes', JSON.stringify(updated));
    };

    const deleteTheme = (id: string) => {
        const updated = customThemes.filter(t => t.id !== id);
        setCustomThemes(updated);
        localStorage.setItem('liquid-glass-custom-themes', JSON.stringify(updated));
        if (activeThemeId === id) {
            setActiveThemeId(null);
            localStorage.removeItem('liquid-glass-active-theme');
        }
    };

    const applyTheme = (id: string) => {
        const themeConfig = [...BUILT_IN_THEMES, ...customThemes].find(t => t.id === id);
        if (themeConfig) {
            // Apply mode-specific settings based on current theme
            const modeSettings = theme === 'dark' ? themeConfig.darkMode : themeConfig.lightMode;

            // Use mode-specific background, fall back to top-level for backward compatibility
            setActiveBackgroundId(modeSettings.backgroundId || themeConfig.backgroundId);
            setGlassIntensity(modeSettings.glassIntensity);
            setOverlayEnabled(modeSettings.overlayEnabled);
            setOverlayIntensity(modeSettings.overlayIntensity);
            setGlassTintColor(modeSettings.glassTintColor);
            // Apply accent color and vibrancy (with defaults for backward compatibility)
            setAccentColor(modeSettings.accentColor ?? '#007AFF');
            setTextVibrancy(modeSettings.textVibrancy ?? 50);
            // Apply glass material (with default for backward compatibility)
            setGlassMaterial(modeSettings.glassMaterial ?? 'regular');
            // Apply outline opacity (with default for backward compatibility)
            setOutlineOpacity(modeSettings.outlineOpacity ?? 30);
            setGlassRadius(themeConfig.glassRadius);
            setShadowStrength(themeConfig.shadowStrength);
            setDensity(themeConfig.density);
            setActiveThemeId(id);
            localStorage.setItem('liquid-glass-active-theme', id);
        }
    };

    const copyTheme = (id: string, newName: string) => {
        const sourceTheme = [...BUILT_IN_THEMES, ...customThemes].find(t => t.id === id);
        if (sourceTheme) {
            const newTheme: Theme = {
                ...sourceTheme,
                id: `custom-${Date.now()}`,
                name: newName,
                isBuiltIn: false
            };
            const updated = [...customThemes, newTheme];
            setCustomThemes(updated);
            localStorage.setItem('liquid-glass-custom-themes', JSON.stringify(updated));
            // Also set the copied theme as active
            setActiveThemeId(newTheme.id);
            localStorage.setItem('liquid-glass-active-theme', newTheme.id);
        }
    };

    return (
        <ThemeContext.Provider value={{
            theme,
            toggleTheme,
            activeBackgroundId,
            setActiveBackground,
            backgroundLuminance,
            glassIntensity,
            setGlassIntensity,
            overlayEnabled,
            setOverlayEnabled,
            overlayIntensity,
            setOverlayIntensity,
            density,
            setDensity,
            glassRadius,
            setGlassRadius,
            shadowStrength,
            setShadowStrength,
            glassTintColor,
            setGlassTintColor,
            accentColor,
            setAccentColor,
            textVibrancy,
            setTextVibrancy,
            glassMaterial,
            setGlassMaterial,
            outlineOpacity,
            setOutlineOpacity,
            specularEnabled,
            setSpecularEnabled,
            blurStrength,
            setBlurStrength,
            saturation,
            setSaturation,
            noiseOpacity,
            setNoiseOpacity,
            textShadowEnabled,
            setTextShadowEnabled,
            performanceMode,
            setPerformanceMode,
            customThemes,
            activeThemeId,
            builtInThemes: BUILT_IN_THEMES,
            createTheme,
            updateTheme,
            deleteTheme,
            applyTheme,
            copyTheme
        }}>
            {children}
        </ThemeContext.Provider>
    );
};


