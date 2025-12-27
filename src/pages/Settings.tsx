import { useState, useEffect } from 'react';
import { Monitor, Sparkles, Sliders } from 'lucide-react';
import { GlassContainer } from '@/components';
import { GlassPageHeader } from '@/components';
import { useTheme } from '../hooks/useTheme';
import type { ModeSpecificSettings } from '../types/ThemeTypes';

// Import extracted sub-components
import { ThemesSection, CustomizationSection, WallpaperSection } from './settings-components';

type SettingsSection = 'wallpaper' | 'glass' | 'themes' | 'customization';

export const Settings = () => {
    const {
        theme,
        toggleTheme,
        activeBackgroundId,
        setActiveBackground,
        setGlassIntensity,
        setOverlayEnabled,
        setOverlayIntensity,
        density,
        setDensity,
        glassRadius,
        setGlassRadius,
        shadowStrength,
        setShadowStrength,
        setGlassTintColor,
        setAccentColor,
        setTextVibrancy,
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
        builtInThemes,
        customThemes,
        activeThemeId,
        createTheme,
        updateTheme,
        deleteTheme,
        applyTheme,
        copyTheme
    } = useTheme();

    const [activeSection, setActiveSection] = useState<SettingsSection>('themes');
    const [activeModeTab, setActiveModeTab] = useState<'light' | 'dark'>('dark');

    // Local state for mode-specific settings
    const [localLightMode, setLocalLightMode] = useState<ModeSpecificSettings>({
        glassIntensity: 50,
        overlayEnabled: false,
        overlayIntensity: 25,
        glassTintColor: null,
        backgroundId: 'liquid-1',
        accentColor: '#007AFF',
        textVibrancy: 50
    });
    const [localDarkMode, setLocalDarkMode] = useState<ModeSpecificSettings>({
        glassIntensity: 50,
        overlayEnabled: false,
        overlayIntensity: 25,
        glassTintColor: null,
        backgroundId: 'liquid-1',
        accentColor: '#007AFF',
        textVibrancy: 50
    });

    // Load mode-specific settings from active theme
    useEffect(() => {
        if (activeThemeId) {
            const activeTheme = [...builtInThemes, ...customThemes].find(t => t.id === activeThemeId);
            if (activeTheme) {
                setLocalLightMode(activeTheme.lightMode);
                setLocalDarkMode(activeTheme.darkMode);
            }
        }
    }, [activeThemeId, builtInThemes, customThemes]);

    // Sync mode tab with system theme on initial load
    useEffect(() => {
        setActiveModeTab(theme === 'dark' ? 'dark' : 'light');
    }, []);

    // Real-time sync: When local light mode settings change AND system is in light mode, apply immediately
    useEffect(() => {
        if (theme === 'light') {
            setGlassIntensity(localLightMode.glassIntensity);
            setOverlayEnabled(localLightMode.overlayEnabled);
            setOverlayIntensity(localLightMode.overlayIntensity);
            setGlassTintColor(localLightMode.glassTintColor);
            setAccentColor(localLightMode.accentColor ?? '#007AFF');
            setTextVibrancy(localLightMode.textVibrancy ?? 50);
            if (localLightMode.backgroundId) {
                setActiveBackground(localLightMode.backgroundId);
            }
        }
    }, [localLightMode]);

    // Real-time sync: When local dark mode settings change AND system is in dark mode, apply immediately
    useEffect(() => {
        if (theme === 'dark') {
            setGlassIntensity(localDarkMode.glassIntensity);
            setOverlayEnabled(localDarkMode.overlayEnabled);
            setOverlayIntensity(localDarkMode.overlayIntensity);
            setGlassTintColor(localDarkMode.glassTintColor);
            setAccentColor(localDarkMode.accentColor ?? '#007AFF');
            setTextVibrancy(localDarkMode.textVibrancy ?? 50);
            if (localDarkMode.backgroundId) {
                setActiveBackground(localDarkMode.backgroundId);
            }
        }
    }, [localDarkMode]);

    // Auto-save changes for Custom Themes
    useEffect(() => {
        if (!activeThemeId) return;

        // Only auto-save if it's a custom theme
        const isCustomTheme = customThemes.some(t => t.id === activeThemeId);
        if (isCustomTheme) {
            const timer = setTimeout(() => {
                updateTheme(activeThemeId, {
                    backgroundId: activeBackgroundId,
                    glassRadius,
                    shadowStrength,
                    density,
                    lightMode: localLightMode,
                    darkMode: localDarkMode
                });
            }, 1000); // 1s debounce

            return () => clearTimeout(timer);
        }
    }, [
        activeThemeId,
        activeBackgroundId,
        glassRadius,
        shadowStrength,
        density,
        localLightMode,
        localDarkMode,
        updateTheme
    ]);

    return (
        <div className="min-h-screen p-4 md:p-8 pt-20 md:pt-24 text-primary relative z-10 transition-colors duration-500">
            {/* Unified Header */}
            <div className="max-w-6xl mx-auto mb-6">
                <GlassPageHeader
                    title="Settings"
                    subtitle="Customize your experience"
                />
            </div>

            <GlassContainer className="max-w-6xl mx-auto h-[calc(100vh-10rem)] overflow-hidden">
                <div className="flex h-full w-full relative z-10">
                    {/* Sidebar */}
                    <div className="w-64 flex-shrink-0 relative z-20 border-r border-[var(--glass-border)] p-6 flex flex-col gap-6 bg-glass-surface backdrop-blur-md hidden md:flex h-full">
                        <div className="space-y-1">
                            <div className="text-xs font-medium text-label-tertiary uppercase tracking-widest mb-3 px-2">Appearance</div>
                            <button
                                onClick={() => setActiveSection('themes')}
                                className={`w-full text-left px-4 py-3 rounded-xl font-medium flex items-center gap-3 transition-colors ${activeSection === 'themes' ? 'bg-primary/10 text-primary' : 'text-secondary hover:bg-primary/5 hover:text-primary'}`}
                            >
                                <Sparkles size={18} />
                                Themes
                            </button>
                            <button
                                onClick={() => setActiveSection('customization')}
                                className={`w-full text-left px-4 py-3 rounded-xl font-medium flex items-center gap-3 transition-colors ${activeSection === 'customization' ? 'bg-primary/10 text-primary' : 'text-secondary hover:bg-primary/5 hover:text-primary'}`}
                            >
                                <Sliders size={18} />
                                Customization
                            </button>
                            <button
                                onClick={() => setActiveSection('wallpaper')}
                                className={`w-full text-left px-4 py-3 rounded-xl font-medium flex items-center gap-3 transition-colors ${activeSection === 'wallpaper' ? 'bg-primary/10 text-primary' : 'text-secondary hover:bg-primary/5 hover:text-primary'}`}
                            >
                                <Monitor size={18} />
                                Wallpaper
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 relative z-10 p-8 overflow-y-auto h-full scroll-smooth">
                        <div className="max-w-4xl mx-auto">
                            {/* Themes Section */}
                            {activeSection === 'themes' && (
                                <ThemesSection
                                    builtInThemes={builtInThemes}
                                    customThemes={customThemes}
                                    activeThemeId={activeThemeId}
                                    applyTheme={applyTheme}
                                    createTheme={createTheme}
                                    updateTheme={updateTheme}
                                    deleteTheme={deleteTheme}
                                    copyTheme={copyTheme}
                                    onNavigateToCustomization={() => setActiveSection('customization')}
                                />
                            )}

                            {/* Customization Section */}
                            {activeSection === 'customization' && (
                                <CustomizationSection
                                    theme={theme}
                                    toggleTheme={toggleTheme}
                                    builtInThemes={builtInThemes}
                                    customThemes={customThemes}
                                    activeThemeId={activeThemeId}
                                    glassRadius={glassRadius}
                                    setGlassRadius={setGlassRadius}
                                    shadowStrength={shadowStrength}
                                    setShadowStrength={setShadowStrength}
                                    density={density}
                                    setDensity={setDensity}
                                    localLightMode={localLightMode}
                                    setLocalLightMode={setLocalLightMode}
                                    localDarkMode={localDarkMode}
                                    setLocalDarkMode={setLocalDarkMode}
                                    activeModeTab={activeModeTab}
                                    setActiveModeTab={setActiveModeTab}
                                    specularEnabled={specularEnabled}
                                    setSpecularEnabled={setSpecularEnabled}
                                    blurStrength={blurStrength}
                                    setBlurStrength={setBlurStrength}
                                    saturation={saturation}
                                    setSaturation={setSaturation}
                                    noiseOpacity={noiseOpacity}
                                    setNoiseOpacity={setNoiseOpacity}
                                    textShadowEnabled={textShadowEnabled}
                                    setTextShadowEnabled={setTextShadowEnabled}
                                    performanceMode={performanceMode}
                                    setPerformanceMode={setPerformanceMode}
                                />
                            )}

                            {/* Wallpaper Section */}
                            {activeSection === 'wallpaper' && (
                                <WallpaperSection
                                    activeBackgroundId={activeBackgroundId}
                                    setActiveBackground={setActiveBackground}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </GlassContainer>
        </div>
    );
};
