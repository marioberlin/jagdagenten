import type { ModeSpecificSettings, Density, Theme } from '@/types/ThemeTypes';

export interface SettingsSectionProps {
    /** Current system theme (light/dark) */
    theme: 'light' | 'dark';
    /** Toggle between light and dark mode */
    toggleTheme: () => void;
    /** Currently active background ID */
    activeBackgroundId: string;
    /** Set active background */
    setActiveBackground: (id: string, preferredTheme?: 'light' | 'dark') => void;
    /** Current glass radius */
    glassRadius: number;
    /** Set glass radius */
    setGlassRadius: (radius: number) => void;
    /** Current shadow strength */
    shadowStrength: number;
    /** Set shadow strength */
    setShadowStrength: (strength: number) => void;
    /** Current density setting */
    density: Density;
    /** Set density */
    setDensity: (density: Density) => void;
    /** Built-in themes array */
    builtInThemes: Theme[];
    /** Custom user themes */
    customThemes: Theme[];
    /** Currently active theme ID */
    activeThemeId: string | null;
    /** Apply a theme by ID */
    applyTheme: (id: string) => void;
    /** Create a new theme */
    createTheme: (name: string) => void;
    /** Update an existing theme */
    updateTheme: (id: string, updates: Partial<Theme>) => void;
    /** Delete a theme */
    deleteTheme: (id: string) => void;
    /** Copy/duplicate a theme */
    copyTheme: (id: string, newName: string) => void;
    /** Local light mode settings */
    localLightMode: ModeSpecificSettings;
    /** Set local light mode */
    setLocalLightMode: React.Dispatch<React.SetStateAction<ModeSpecificSettings>>;
    /** Local dark mode settings */
    localDarkMode: ModeSpecificSettings;
    /** Set local dark mode */
    setLocalDarkMode: React.Dispatch<React.SetStateAction<ModeSpecificSettings>>;
    /** Currently active mode tab in customization */
    activeModeTab: 'light' | 'dark';
    /** Set active mode tab */
    setActiveModeTab: (tab: 'light' | 'dark') => void;
}

export interface ThemesSectionProps extends Pick<
    SettingsSectionProps,
    | 'builtInThemes'
    | 'customThemes'
    | 'activeThemeId'
    | 'applyTheme'
    | 'createTheme'
    | 'updateTheme'
    | 'deleteTheme'
    | 'copyTheme'
> {
    /** Navigate to customization section */
    onNavigateToCustomization: () => void;
}

export interface CustomizationSectionProps extends Pick<
    SettingsSectionProps,
    | 'theme'
    | 'toggleTheme'
    | 'builtInThemes'
    | 'customThemes'
    | 'activeThemeId'
    | 'glassRadius'
    | 'setGlassRadius'
    | 'shadowStrength'
    | 'setShadowStrength'
    | 'density'
    | 'setDensity'
    | 'localLightMode'
    | 'setLocalLightMode'
    | 'localDarkMode'
    | 'setLocalDarkMode'
    | 'activeModeTab'
    | 'setActiveModeTab'
> {
    /** Specular highlight toggle */
    specularEnabled: boolean;
    /** Set specular enabled */
    setSpecularEnabled: (enabled: boolean) => void;
    /** Blur strength (0-100) */
    blurStrength: number;
    /** Set blur strength */
    setBlurStrength: (value: number) => void;
    /** Saturation boost (0-200) */
    saturation: number;
    /** Set saturation */
    setSaturation: (value: number) => void;
    /** Noise/grain opacity (0-100) */
    noiseOpacity: number;
    /** Set noise opacity */
    setNoiseOpacity: (value: number) => void;
    /** Text shadow toggle */
    textShadowEnabled: boolean;
    /** Set text shadow enabled */
    setTextShadowEnabled: (enabled: boolean) => void;
    /** Performance mode toggle */
    performanceMode: boolean;
    /** Set performance mode */
    setPerformanceMode: (enabled: boolean) => void;
}

export interface WallpaperSectionProps extends Pick<
    SettingsSectionProps,
    | 'activeBackgroundId'
    | 'setActiveBackground'
> { }
