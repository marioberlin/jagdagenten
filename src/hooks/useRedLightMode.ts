/**
 * Red Light Mode Hook
 * 
 * Standalone hook for toggling night-vision-preserving red light mode.
 * Works independently from the main theme store to avoid type conflicts.
 * 
 * Can auto-activate after sunset based on geolocation.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

interface RedLightSettings {
    enabled: boolean;
    autoActivate: boolean;
}

interface SunTimes {
    civilDusk: Date;
    civilDawn: Date;
}

const STORAGE_KEY = 'jagd-red-light-settings';
const CSS_CLASS = 'red-light-mode';

const DEFAULT_SETTINGS: RedLightSettings = {
    enabled: false,
    autoActivate: false,
};

/**
 * Calculate civil twilight times (simplified)
 */
function calculateSunTimes(lat: number, lon: number): SunTimes {
    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
    const declination = -23.45 * Math.cos((360 / 365) * (dayOfYear + 10) * Math.PI / 180);

    const latRad = lat * Math.PI / 180;
    const decRad = declination * Math.PI / 180;

    // Civil twilight: sun 6 degrees below horizon
    const cosHourAngle = (Math.sin(-6 * Math.PI / 180) - Math.sin(latRad) * Math.sin(decRad)) /
        (Math.cos(latRad) * Math.cos(decRad));
    const hourAngle = Math.acos(Math.max(-1, Math.min(1, cosHourAngle))) * 180 / Math.PI;

    const solarNoon = 12 - lon / 15;
    const civilDawnHour = solarNoon - hourAngle / 15;
    const civilDuskHour = solarNoon + hourAngle / 15;

    const toDate = (hours: number): Date => {
        const result = new Date(now);
        result.setHours(Math.floor(hours), Math.round((hours % 1) * 60), 0, 0);
        return result;
    };

    return {
        civilDawn: toDate(civilDawnHour),
        civilDusk: toDate(civilDuskHour),
    };
}

/**
 * Check if current time is after civil dusk or before civil dawn
 */
function isNightTime(sunTimes: SunTimes): boolean {
    const now = new Date();
    return now > sunTimes.civilDusk || now < sunTimes.civilDawn;
}

/**
 * Apply red light mode class to document
 */
function applyRedLightClass(enabled: boolean) {
    const html = document.documentElement;

    // Add transition class
    html.classList.add('transitioning-theme');

    if (enabled) {
        html.classList.add(CSS_CLASS);
    } else {
        html.classList.remove(CSS_CLASS);
    }

    // Remove transition class after animation
    setTimeout(() => {
        html.classList.remove('transitioning-theme');
    }, 500);
}

export function useRedLightMode() {
    const [settings, setSettings] = useState<RedLightSettings>(() => {
        if (typeof window === 'undefined') return DEFAULT_SETTINGS;

        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
        } catch {
            return DEFAULT_SETTINGS;
        }
    });

    const [sunTimes, setSunTimes] = useState<SunTimes | null>(null);
    const [isAutoActive, setIsAutoActive] = useState(false);

    // Determine effective state
    const isActive = useMemo(() => {
        if (settings.enabled) return true;
        if (settings.autoActivate && isAutoActive) return true;
        return false;
    }, [settings.enabled, settings.autoActivate, isAutoActive]);

    // Get geolocation and calculate sun times
    useEffect(() => {
        if (!settings.autoActivate) return;

        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setSunTimes(calculateSunTimes(pos.coords.latitude, pos.coords.longitude));
                },
                () => {
                    // Default to central Germany
                    setSunTimes(calculateSunTimes(51.1657, 10.4515));
                }
            );
        } else {
            setSunTimes(calculateSunTimes(51.1657, 10.4515));
        }
    }, [settings.autoActivate]);

    // Check if it's night time for auto mode
    useEffect(() => {
        if (!settings.autoActivate || !sunTimes) return;

        const checkTime = () => {
            setIsAutoActive(isNightTime(sunTimes));
        };

        checkTime();
        const interval = setInterval(checkTime, 60000); // Check every minute

        return () => clearInterval(interval);
    }, [settings.autoActivate, sunTimes]);

    // Apply CSS class when state changes
    useEffect(() => {
        applyRedLightClass(isActive);
    }, [isActive]);

    // Persist settings
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch {
            // Ignore storage errors
        }
    }, [settings]);

    // Actions
    const toggle = useCallback(() => {
        setSettings(prev => ({ ...prev, enabled: !prev.enabled }));
    }, []);

    const enable = useCallback(() => {
        setSettings(prev => ({ ...prev, enabled: true }));
    }, []);

    const disable = useCallback(() => {
        setSettings(prev => ({ ...prev, enabled: false }));
    }, []);

    const setAutoActivate = useCallback((auto: boolean) => {
        setSettings(prev => ({ ...prev, autoActivate: auto }));
    }, []);

    return {
        // State
        isActive,
        isManuallyEnabled: settings.enabled,
        isAutoActivate: settings.autoActivate,
        sunTimes,

        // Actions
        toggle,
        enable,
        disable,
        setAutoActivate,
    };
}

export default useRedLightMode;
