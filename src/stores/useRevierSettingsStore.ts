/**
 * Revier Settings Store
 *
 * Manages revier-level preferences like background images,
 * branding, and display settings.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export interface BackgroundOption {
    id: string;
    name: string;
    description: string;
    path: string;
    season: 'spring' | 'summer' | 'autumn' | 'winter' | 'all';
    thumbnail?: string;
}

export interface RevierSettings {
    backgroundId: string;
    customBackgroundUrl?: string;
    showWeatherOverlay: boolean;
    darkOverlayOpacity: number; // 0-100
}

interface RevierSettingsStore {
    settings: RevierSettings;
    availableBackgrounds: BackgroundOption[];

    // Actions
    setBackground: (backgroundId: string) => void;
    setCustomBackground: (url: string) => void;
    setDarkOverlay: (opacity: number) => void;
    toggleWeatherOverlay: () => void;
    getActiveBackground: () => BackgroundOption | undefined;
    getBackgroundUrl: () => string;
}

// ============================================================================
// Available Backgrounds
// ============================================================================

const AVAILABLE_BACKGROUNDS: BackgroundOption[] = [
    {
        id: 'heathland',
        name: 'Lüneburger Heide',
        description: 'Norddeutsche Heidelandschaft mit Rothirsch bei Sonnenaufgang',
        path: '/assets/backgrounds/jagd-heathland.png',
        season: 'summer',
    },
    {
        id: 'winter',
        name: 'Winterwald',
        description: 'Verschneiter Tannenwald mit Wildschweinrotte im Harz',
        path: '/assets/backgrounds/jagd-winter.png',
        season: 'winter',
    },
    {
        id: 'autumn',
        name: 'Herbstlicher Waldrand',
        description: 'Bayerische Lichtung mit Damwild im Abendlicht',
        path: '/assets/backgrounds/jagd-autumn.png',
        season: 'autumn',
    },
    {
        id: 'forest',
        name: 'Mystischer Buchenwald',
        description: 'Morgennebel im alten Wald mit Rehbock',
        path: '/assets/backgrounds/jagd-forest.png',
        season: 'all',
    },
];

// ============================================================================
// Store Implementation
// ============================================================================

export const useRevierSettingsStore = create<RevierSettingsStore>()(
    persist(
        (set, get) => ({
            settings: {
                backgroundId: 'heathland',
                showWeatherOverlay: true,
                darkOverlayOpacity: 50,
            },
            availableBackgrounds: AVAILABLE_BACKGROUNDS,

            setBackground: (backgroundId) => {
                set((state) => ({
                    settings: {
                        ...state.settings,
                        backgroundId,
                        customBackgroundUrl: undefined,
                    },
                }));
            },

            setCustomBackground: (url) => {
                set((state) => ({
                    settings: {
                        ...state.settings,
                        backgroundId: 'custom',
                        customBackgroundUrl: url,
                    },
                }));
            },

            setDarkOverlay: (opacity) => {
                set((state) => ({
                    settings: {
                        ...state.settings,
                        darkOverlayOpacity: Math.max(0, Math.min(100, opacity)),
                    },
                }));
            },

            toggleWeatherOverlay: () => {
                set((state) => ({
                    settings: {
                        ...state.settings,
                        showWeatherOverlay: !state.settings.showWeatherOverlay,
                    },
                }));
            },

            getActiveBackground: () => {
                const { settings, availableBackgrounds } = get();
                return availableBackgrounds.find((bg) => bg.id === settings.backgroundId);
            },

            getBackgroundUrl: () => {
                const { settings, availableBackgrounds } = get();
                if (settings.customBackgroundUrl) {
                    return settings.customBackgroundUrl;
                }
                const bg = availableBackgrounds.find((b) => b.id === settings.backgroundId);
                return bg?.path || AVAILABLE_BACKGROUNDS[0].path;
            },
        }),
        {
            name: 'jagd-revier-settings',
        }
    )
);
