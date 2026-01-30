/**
 * useRedLightMode Hook
 *
 * Manages red light mode for night vision preservation.
 * Features:
 * - Manual toggle
 * - Auto-activate at civil twilight (Büchsenlicht)
 * - Persists preference to localStorage
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

// @ts-ignore - suncalc has no types but works correctly at runtime
import SunCalc from 'suncalc';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SunTimes {
    sunrise: Date;
    sunset: Date;
    civilDawn: Date;     // Büchsenlicht Beginn
    civilDusk: Date;     // Büchsenlicht Ende
    nauticalDawn: Date;
    nauticalDusk: Date;
}

interface RedLightModeState {
    isActive: boolean;
    isAutoActivate: boolean;
    sunTimes: SunTimes | null;
    toggle: () => void;
    activate: () => void;
    deactivate: () => void;
    setAutoActivate: (enabled: boolean) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'jagd-redlight-mode';
const AUTO_STORAGE_KEY = 'jagd-redlight-auto';

// Default location (Berlin) - should be user-configurable
const DEFAULT_LAT = 52.52;
const DEFAULT_LNG = 13.405;

// CSS custom properties for red light mode
const RED_LIGHT_STYLES = {
    '--glass-accent': '#991b1b',
    '--text-primary': '#fca5a5',
    '--text-secondary': '#f87171',
    '--glass-bg-primary': 'rgba(153, 27, 27, 0.2)',
    '--glass-surface': 'rgba(127, 29, 29, 0.15)',
    '--glass-border': 'rgba(220, 38, 38, 0.3)',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSunTimes(lat: number, lng: number, date: Date = new Date()): SunTimes {
    const times = SunCalc.getTimes(date, lat, lng);

    return {
        sunrise: times.sunrise,
        sunset: times.sunset,
        civilDawn: times.dawn,        // Civil twilight start (6° below horizon)
        civilDusk: times.dusk,        // Civil twilight end
        nauticalDawn: times.nauticalDawn,
        nauticalDusk: times.nauticalDusk,
    };
}

function isDarkTime(sunTimes: SunTimes): boolean {
    const now = new Date();
    // Dark = after civil dusk OR before civil dawn
    return now >= sunTimes.civilDusk || now <= sunTimes.civilDawn;
}

function applyRedLightStyles(active: boolean): void {
    const root = document.documentElement;

    if (active) {
        // Store original values
        const originals: Record<string, string> = {};
        for (const prop of Object.keys(RED_LIGHT_STYLES)) {
            originals[prop] = getComputedStyle(root).getPropertyValue(prop);
        }
        sessionStorage.setItem('redlight-originals', JSON.stringify(originals));

        // Apply red light overrides
        for (const [prop, value] of Object.entries(RED_LIGHT_STYLES)) {
            root.style.setProperty(prop, value);
        }
        root.classList.add('redlight-mode');
    } else {
        // Restore originals
        const stored = sessionStorage.getItem('redlight-originals');
        if (stored) {
            const originals = JSON.parse(stored);
            for (const prop of Object.keys(RED_LIGHT_STYLES)) {
                if (originals[prop]) {
                    root.style.setProperty(prop, originals[prop]);
                } else {
                    root.style.removeProperty(prop);
                }
            }
        }
        root.classList.remove('redlight-mode');
    }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useRedLightMode(
    lat: number = DEFAULT_LAT,
    lng: number = DEFAULT_LNG
): RedLightModeState {
    // Load persisted state
    const [isActive, setIsActive] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        return localStorage.getItem(STORAGE_KEY) === 'true';
    });

    const [isAutoActivate, setIsAutoActivateState] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        return localStorage.getItem(AUTO_STORAGE_KEY) === 'true';
    });

    // Calculate sun times
    const sunTimes = useMemo(() => {
        if (typeof window === 'undefined') return null;
        try {
            return getSunTimes(lat, lng);
        } catch {
            return null;
        }
    }, [lat, lng]);

    // Apply styles when active changes
    useEffect(() => {
        applyRedLightStyles(isActive);
    }, [isActive]);

    // Auto-activate check
    useEffect(() => {
        if (!isAutoActivate || !sunTimes) return;

        const checkDarkTime = () => {
            const shouldBeActive = isDarkTime(sunTimes);
            if (shouldBeActive !== isActive) {
                setIsActive(shouldBeActive);
                localStorage.setItem(STORAGE_KEY, String(shouldBeActive));
            }
        };

        // Check immediately
        checkDarkTime();

        // Check every minute
        const interval = setInterval(checkDarkTime, 60000);
        return () => clearInterval(interval);
    }, [isAutoActivate, sunTimes, isActive]);

    // Toggle function
    const toggle = useCallback(() => {
        setIsActive((prev) => {
            const next = !prev;
            localStorage.setItem(STORAGE_KEY, String(next));
            return next;
        });
    }, []);

    const activate = useCallback(() => {
        setIsActive(true);
        localStorage.setItem(STORAGE_KEY, 'true');
    }, []);

    const deactivate = useCallback(() => {
        setIsActive(false);
        localStorage.setItem(STORAGE_KEY, 'false');
    }, []);

    const setAutoActivate = useCallback((enabled: boolean) => {
        setIsAutoActivateState(enabled);
        localStorage.setItem(AUTO_STORAGE_KEY, String(enabled));
    }, []);

    return {
        isActive,
        isAutoActivate,
        sunTimes,
        toggle,
        activate,
        deactivate,
        setAutoActivate,
    };
}

export default useRedLightMode;
