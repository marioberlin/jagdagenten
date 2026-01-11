import { useState, useEffect } from 'react';
import { Monitor, Sparkles, Sliders, Bot, Puzzle } from 'lucide-react';
import { GlassContainer } from '@/components';
import { GlassPageHeader } from '@/components';
import { useTheme } from '../hooks/useTheme';
import { ThemeModeConfig } from '../stores/types';

// Import extracted sub-components
import { ThemesSection, CustomizationSection, WallpaperSection, PluginMarketplaceSettings } from './settings-components';
import { AgentConfigSettings } from './settings-components/AgentConfigSettings';

type SettingsSection = 'wallpaper' | 'glass' | 'themes' | 'customization' | 'agent-config' | 'marketplace';

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
        setOutlineOpacity,
        setGlassMaterial,
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
        bounceIntensity,
        setBounceIntensity,
        pulseIntensity,
        setPulseIntensity,
        scaleIntensity,
        setScaleIntensity,
        wiggleIntensity,
        setWiggleIntensity,
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

    // Local state for mode-specific settings
    // Local state for mode-specific settings
    const [localLightMode, setLocalLightMode] = useState<ThemeModeConfig>({
        glass: { intensity: 50, tintColor: null, material: 'regular' },
        visual: { accentColor: '#007AFF', textVibrancy: 50, outlineOpacity: 30 },
        background: { id: 'liquid-1', luminance: 'light' },
        overlay: { enabled: false, intensity: 25 }
    });
    const [localDarkMode, setLocalDarkMode] = useState<ThemeModeConfig>({
        glass: { intensity: 50, tintColor: null, material: 'regular' },
        visual: { accentColor: '#007AFF', textVibrancy: 50, outlineOpacity: 30 },
        background: { id: 'liquid-1', luminance: 'dark' },
        overlay: { enabled: false, intensity: 25 }
    });

    // Load mode-specific settings from active theme
    useEffect(() => {
        if (activeThemeId) {
            const activeTheme = [...builtInThemes, ...customThemes].find(t => t.id === activeThemeId);
            if (activeTheme) {
                // When loading settings, preserve the current background if it corresponds to the current mode
                const lightSettings = {
                    ...activeTheme.light,
                    background: {
                        ...activeTheme.light.background,
                        id: theme === 'light' ? activeBackgroundId : activeTheme.light.background.id
                    }
                };
                const darkSettings = {
                    ...activeTheme.dark,
                    background: {
                        ...activeTheme.dark.background,
                        id: theme === 'dark' ? activeBackgroundId : activeTheme.dark.background.id
                    }
                };

                setLocalLightMode(lightSettings);
                setLocalDarkMode(darkSettings);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeThemeId, builtInThemes, customThemes]);

    // Real-time sync: When local light mode settings change AND system is in light mode, apply immediately
    useEffect(() => {
        if (theme === 'light') {
            if (localLightMode.glass.intensity !== undefined) setGlassIntensity(localLightMode.glass.intensity);
            if (localLightMode.overlay.enabled !== undefined) setOverlayEnabled(localLightMode.overlay.enabled);
            if (localLightMode.overlay.intensity !== undefined) setOverlayIntensity(localLightMode.overlay.intensity);
            if (localLightMode.glass.tintColor !== undefined) setGlassTintColor(localLightMode.glass.tintColor);
            if (localLightMode.visual.accentColor) setAccentColor(localLightMode.visual.accentColor);
            if (localLightMode.visual.textVibrancy !== undefined) setTextVibrancy(localLightMode.visual.textVibrancy);
            if (localLightMode.visual.outlineOpacity !== undefined) setOutlineOpacity(localLightMode.visual.outlineOpacity);
            if (localLightMode.glass.material) setGlassMaterial(localLightMode.glass.material);
            if (localLightMode.background.id) {
                setActiveBackground(localLightMode.background.id);
            }
        }
    }, [localLightMode]);

    // Real-time sync: When local dark mode settings change AND system is in dark mode, apply immediately
    useEffect(() => {
        if (theme === 'dark') {
            if (localDarkMode.glass.intensity !== undefined) setGlassIntensity(localDarkMode.glass.intensity);
            if (localDarkMode.overlay.enabled !== undefined) setOverlayEnabled(localDarkMode.overlay.enabled);
            if (localDarkMode.overlay.intensity !== undefined) setOverlayIntensity(localDarkMode.overlay.intensity);
            if (localDarkMode.glass.tintColor !== undefined) setGlassTintColor(localDarkMode.glass.tintColor);
            if (localDarkMode.visual.accentColor) setAccentColor(localDarkMode.visual.accentColor);
            if (localDarkMode.visual.textVibrancy !== undefined) setTextVibrancy(localDarkMode.visual.textVibrancy);
            if (localDarkMode.visual.outlineOpacity !== undefined) setOutlineOpacity(localDarkMode.visual.outlineOpacity);
            if (localDarkMode.glass.material) setGlassMaterial(localDarkMode.glass.material);
            if (localDarkMode.background.id) {
                setActiveBackground(localDarkMode.background.id);
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
                    light: localLightMode,
                    dark: localDarkMode
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

                            <div className="text-xs font-medium text-label-tertiary uppercase tracking-widest mt-6 mb-3 px-2">Extensions</div>
                            <button
                                onClick={() => setActiveSection('marketplace')}
                                className={`w-full text-left px-4 py-3 rounded-xl font-medium flex items-center gap-3 transition-colors ${activeSection === 'marketplace' ? 'bg-primary/10 text-primary' : 'text-secondary hover:bg-primary/5 hover:text-primary'}`}
                            >
                                <Puzzle size={18} />
                                Plugins
                            </button>

                            <div className="text-xs font-medium text-label-tertiary uppercase tracking-widest mt-6 mb-3 px-2">Intelligence</div>
                            <button
                                onClick={() => setActiveSection('agent-config')}
                                className={`w-full text-left px-4 py-3 rounded-xl font-medium flex items-center gap-3 transition-colors ${activeSection === 'agent-config' ? 'bg-primary/10 text-primary' : 'text-secondary hover:bg-primary/5 hover:text-primary'}`}
                            >
                                <Bot size={18} />
                                Agent Config
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
                                    activeModeTab={theme === 'dark' ? 'dark' : 'light'}
                                    setActiveModeTab={(mode) => {
                                        if (mode === 'light' && theme !== 'light') toggleTheme();
                                        if (mode === 'dark' && theme !== 'dark') toggleTheme();
                                    }}
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
                                    bounceIntensity={bounceIntensity}
                                    setBounceIntensity={setBounceIntensity}
                                    pulseIntensity={pulseIntensity}
                                    setPulseIntensity={setPulseIntensity}
                                    scaleIntensity={scaleIntensity}
                                    setScaleIntensity={setScaleIntensity}
                                    wiggleIntensity={wiggleIntensity}
                                    setWiggleIntensity={setWiggleIntensity}
                                />
                            )}

                            {/* Wallpaper Section */}
                            {activeSection === 'wallpaper' && (
                                <WallpaperSection
                                    activeBackgroundId={activeBackgroundId}
                                    setActiveBackground={(id, preferredTheme) => {
                                        setActiveBackground(id, preferredTheme);
                                        // Sync local state immediately to keep UI in sync
                                        if (theme === 'light') {
                                            setLocalLightMode(prev => ({ ...prev, background: { ...prev.background, id: id } }));
                                        } else {
                                            setLocalDarkMode(prev => ({ ...prev, background: { ...prev.background, id: id } }));
                                        }
                                    }}
                                />
                            )}

                            {/* Agent Config Section */}
                            {activeSection === 'agent-config' && (
                                <AgentConfigSettings />
                            )}

                            {/* Plugin Marketplace Section */}
                            {activeSection === 'marketplace' && (
                                <PluginMarketplaceSettings />
                            )}
                        </div>
                    </div>
                </div>
            </GlassContainer>
        </div>
    );
};
