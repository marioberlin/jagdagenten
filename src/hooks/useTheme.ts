import { useThemeStore } from '../stores/themeStore';
import { useShallow } from 'zustand/react/shallow';

/**
 * Hook to access theme settings
 * Reimplemented to use Zustand store while maintaining ThemeContext interface compatibility.
 */
export const useTheme = () => {
    return useThemeStore(useShallow((state) => ({
        // === Core ===
        theme: state.mode,
        toggleTheme: state.toggleMode,
        activeBackgroundId: state.activeBackgroundId,
        setActiveBackground: state.setBackground,
        backgroundLuminance: state.backgroundLuminance,

        // === Glass Customization ===
        glassIntensity: state.glass.intensity,
        setGlassIntensity: state.setGlassIntensity,
        blurStrength: state.glass.blurStrength,
        setBlurStrength: state.setBlurStrength,
        glassMaterial: state.glass.material,
        setGlassMaterial: state.setGlassMaterial,
        glassTintColor: state.glass.tintColor,
        setGlassTintColor: state.setGlassTintColor,
        saturation: state.glass.saturation,
        setSaturation: state.setGlassSaturation,
        noiseOpacity: state.glass.noiseOpacity,
        setNoiseOpacity: state.setNoiseOpacity,

        // === Overlay ===
        overlayEnabled: state.overlay.enabled,
        setOverlayEnabled: state.setOverlayEnabled,
        overlayIntensity: state.overlay.intensity,
        setOverlayIntensity: state.setOverlayIntensity,

        // === Visual & Advanced ===
        glassRadius: state.visual.radius,
        setGlassRadius: state.setRadius,
        shadowStrength: state.visual.shadowStrength,
        setShadowStrength: state.setShadowStrength,
        outlineOpacity: state.visual.outlineOpacity,
        setOutlineOpacity: state.setOutlineOpacity,
        specularEnabled: state.visual.specularEnabled,
        setSpecularEnabled: state.setSpecularEnabled,
        textShadowEnabled: state.visual.textShadowEnabled,
        setTextShadowEnabled: state.setTextShadowEnabled,

        // === Typography & Color ===
        textVibrancy: state.visual.textVibrancy,
        setTextVibrancy: state.setTextVibrancy,
        accentColor: state.visual.accentColor,
        setAccentColor: state.setAccentColor,

        // === Layout ===
        density: state.density,
        setDensity: state.setDensity,

        // === Performance ===
        performanceMode: state.performance.mode,
        setPerformanceMode: state.setPerformanceMode,
        reducedMotion: state.performance.reducedMotion,
        reducedTransparency: state.performance.reducedTransparency,

        // === Animation Effects ===
        bounceIntensity: state.visual.bounceIntensity,
        setBounceIntensity: state.setBounceIntensity,
        pulseIntensity: state.visual.pulseIntensity,
        setPulseIntensity: state.setPulseIntensity,
        scaleIntensity: state.visual.scaleIntensity,
        setScaleIntensity: state.setScaleIntensity,
        wiggleIntensity: state.visual.wiggleIntensity,
        setWiggleIntensity: state.setWiggleIntensity,

        // === Theme Management ===
        customThemes: state.themes.custom,
        activeThemeId: state.themes.activeId,
        builtInThemes: state.themes.builtIn,
        createTheme: state.createTheme,
        updateTheme: state.updateTheme,
        deleteTheme: state.deleteTheme,
        applyTheme: state.applyTheme,
        copyTheme: state.duplicateTheme,
    })));
};
