export type GlassMaterial = 'thin' | 'regular' | 'thick' | 'clear' | 'background' | 'surface' | 'prominent' | 'nav-glass';
export type GlassIntensity = 'subtle' | 'medium' | 'heavy';

export interface ThemeModeConfig {
    glass: Partial<GlassSettings>;
    visual: Partial<VisualSettings>;
    background: {
        id: string;
        luminance?: 'light' | 'dark';
    };
    overlay: OverlaySettings;
    colors?: Partial<{
        primary: string;
        secondary: string;
        background: string;
        surface: string;
        accent: string;
        muted: string;
        border: string;
    }>;
}

export interface Theme {
    id: string;
    name: string;
    isBuiltIn?: boolean;
    light: ThemeModeConfig;
    dark: ThemeModeConfig;
}

export interface GlassSettings {
    intensity: number;          // 0-100
    blurStrength: number;       // 0-100
    material: GlassMaterial;    // 'thin' | 'regular' | 'thick'
    tintColor: string | null;   // Hex or null
    saturation: number;         // 0-200
    noiseOpacity: number;       // 0-100
}

export interface VisualSettings {
    radius: number;             // px
    shadowStrength: number;     // 0-100
    outlineOpacity: number;     // 0-100
    specularEnabled: boolean;
    textShadowEnabled: boolean;
    textVibrancy: number;       // 0-100
    accentColor: string;        // Hex
    // Animation Intensities (0-100)
    bounceIntensity: number;
    pulseIntensity: number;
    scaleIntensity: number;
    wiggleIntensity: number;
}

export interface OverlaySettings {
    enabled: boolean;
    intensity: number;          // 0-100
}

export interface PerformanceSettings {
    mode: boolean;              // Disables liquid effects
    reducedMotion: boolean;     // From OS preference
    reducedTransparency: boolean; // From OS preference
    gpuTier: 'low' | 'medium' | 'high';
}

export interface ThemeStore {
    // === Mode State ===
    mode: 'light' | 'dark';
    systemPreference: 'light' | 'dark' | null;
    useSystemPreference: boolean;

    // === Background State ===
    activeBackgroundId: string;
    backgroundLuminance: 'light' | 'dark';

    // === Glass Effect State ===
    glass: GlassSettings;

    // === Visual State ===
    visual: VisualSettings;

    // === Overlay State ===
    overlay: OverlaySettings;

    // === Layout State ===
    density: 'comfortable' | 'compact';

    // === Performance State ===
    performance: PerformanceSettings;

    // === Theme Presets ===
    themes: {
        builtIn: Theme[];
        custom: Theme[];
        activeId: string | null;
    };

    // === Hydration State ===
    _hydrated: boolean;
}

export interface ThemeActions {
    // Mode
    setMode: (mode: 'light' | 'dark') => void;
    toggleMode: () => void;
    setUseSystemPreference: (use: boolean) => void;

    // Background
    setBackground: (id: string, preferredMode?: 'light' | 'dark') => void;

    // Glass (granular setters)
    setGlassIntensity: (value: number) => void;
    setBlurStrength: (value: number) => void;
    setGlassMaterial: (material: GlassMaterial) => void;
    setGlassTintColor: (color: string | null) => void;
    setGlassSaturation: (value: number) => void;
    setNoiseOpacity: (value: number) => void;

    // Visual
    setRadius: (value: number) => void;
    setShadowStrength: (value: number) => void;
    setOutlineOpacity: (value: number) => void;
    setSpecularEnabled: (enabled: boolean) => void;
    setTextShadowEnabled: (enabled: boolean) => void;
    setTextVibrancy: (value: number) => void;
    setAccentColor: (color: string) => void;

    // Animation Setters
    setBounceIntensity: (value: number) => void;
    setPulseIntensity: (value: number) => void;
    setScaleIntensity: (value: number) => void;
    setWiggleIntensity: (value: number) => void;

    // Overlay
    setOverlayEnabled: (enabled: boolean) => void;
    setOverlayIntensity: (value: number) => void;

    // Layout
    setDensity: (density: 'comfortable' | 'compact') => void;

    // Performance
    setPerformanceMode: (enabled: boolean) => void;

    // Theme Presets
    applyTheme: (id: string) => void;
    createTheme: (name: string) => string; // Returns new ID
    updateTheme: (id: string, updates: Partial<Theme>) => void;
    deleteTheme: (id: string) => void;
    duplicateTheme: (id: string, newName: string) => string;
    exportTheme: (id: string) => string; // JSON string
    importTheme: (json: string) => string | null; // Returns ID or null on error

    // Batch updates
    applyGlassSettings: (settings: Partial<GlassSettings>) => void;
    applyVisualSettings: (settings: Partial<VisualSettings>) => void;

    // Reset
    resetToDefaults: () => void;
    resetGlassToDefaults: () => void;
}
