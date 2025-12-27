import React from 'react';

export type BackgroundType = 'element' | 'image' | 'video';
export type BackgroundLuminance = 'light' | 'dark';
export type Density = 'comfortable' | 'compact';

export interface BackgroundConfig {
    id: string;
    type: BackgroundType;
    name: string;
    component?: React.ComponentType; // For 'element' type
    src?: string; // For 'image' type
    videoUrl?: string; // For 'video' type - YouTube embed URL
    thumbnail?: string; // Thumbnail for video previews
    preferredTheme?: 'light' | 'dark';
}

export interface ModeSpecificSettings {
    glassIntensity: number;
    overlayEnabled: boolean;
    overlayIntensity: number;
    glassTintColor: string | null;
    backgroundId: string;
    // Accent & Vibrancy (optional for backward compatibility)
    accentColor?: string;      // Hex color, default #007AFF (system blue)
    textVibrancy?: number;     // 0-100, affects label opacity levels (default 50)
    glassMaterial?: 'thin' | 'regular' | 'thick';  // Default material thickness
    outlineOpacity?: number;   // 0-100, glass border opacity (default 30)
}

export interface Theme {
    id: string;
    name: string;
    isBuiltIn: boolean;
    backgroundId: string; // Keep for backward compatibility, will be deprecated
    glassRadius: number;
    shadowStrength: number;
    density: Density;
    // Mode-specific settings (includes backgroundId)
    lightMode: ModeSpecificSettings;
    darkMode: ModeSpecificSettings;
}
