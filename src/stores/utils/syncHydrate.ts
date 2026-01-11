/**
 * Synchronous Theme Hydration - Prevents flash of wrong theme
 *
 * This runs BEFORE React mounts to apply critical CSS variables from localStorage.
 * This prevents the "flash of unstyled content" where the page briefly shows
 * the default theme before the store hydrates.
 *
 * @see docs/IMPLEMENTATION_PLAN.md - Item 2.3 Theme Hydration Race Fix
 */

// Storage key must match themeStore's persist config
const THEME_STORAGE_KEY = 'theme-store';

interface StoredThemeState {
    state?: {
        mode?: 'dark' | 'light';
        density?: 'comfortable' | 'compact';
        glass?: {
            saturation?: number;
            noiseOpacity?: number;
            material?: string;
            blurStrength?: number;
        };
        visual?: {
            radius?: number;
            shadowStrength?: number;
            outlineOpacity?: number;
            accentColor?: string;
        };
        performance?: {
            mode?: boolean;
        };
    };
}

/**
 * Helper to set CSS variable on document root
 */
function setCSS(prop: string, value: string | number | null): void {
    if (typeof document === 'undefined') return;
    if (value === null) {
        document.documentElement.style.removeProperty(prop);
    } else {
        document.documentElement.style.setProperty(prop, String(value));
    }
}

/**
 * Synchronously hydrate CSS variables from localStorage
 * Must run BEFORE React mounts to prevent theme flash
 */
export function syncHydrateTheme(): void {
    // Guard for SSR
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return;
    }

    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (!stored) return;

        const parsed: StoredThemeState = JSON.parse(stored);
        const state = parsed?.state;
        if (!state) return;

        const root = document.documentElement;

        // === Mode (dark/light) ===
        const mode = state.mode || 'dark';
        if (mode === 'dark') {
            root.classList.add('dark');
            root.classList.remove('light');
        } else {
            root.classList.remove('dark');
            root.classList.add('light');
        }
        root.setAttribute('data-theme', mode);

        // === Density ===
        const density = state.density || 'comfortable';
        root.classList.remove('density-comfortable', 'density-compact');
        root.classList.add(`density-${density}`);

        // === Glass properties ===
        const glass = state.glass;
        if (glass) {
            if (glass.saturation !== undefined) {
                setCSS('--glass-saturate', glass.saturation / 100);
            }
            if (glass.noiseOpacity !== undefined) {
                setCSS('--glass-noise-opacity', glass.noiseOpacity / 100);
            }
            if (glass.material !== undefined) {
                setCSS('--glass-material', glass.material);
            }
            if (glass.blurStrength !== undefined) {
                const blurFactor = glass.blurStrength / 50;
                setCSS('--glass-blur-thin', `${Math.round(1 + (blurFactor * 5))}px`);
                setCSS('--glass-blur-regular', `${Math.round(2 + (blurFactor * 8))}px`);
                setCSS('--glass-blur-thick', `${Math.round(4 + (blurFactor * 14))}px`);
            }
        }

        // === Visual properties ===
        const visual = state.visual;
        if (visual) {
            if (visual.radius !== undefined) {
                setCSS('--glass-radius', `${visual.radius}px`);
            }
            if (visual.shadowStrength !== undefined) {
                setCSS('--glass-shadow-opacity', (visual.shadowStrength / 100) * 0.5);
            }
            if (visual.outlineOpacity !== undefined) {
                setCSS('--glass-border-opacity', visual.outlineOpacity / 100);
            }
            if (visual.accentColor !== undefined) {
                setCSS('--color-accent', visual.accentColor);
            }
        }

        // === Performance mode ===
        if (state.performance?.mode) {
            setCSS('--liquid-filter', 'none');
        }

    } catch (e) {
        // Silently fail - the store will hydrate normally and apply styles
        // This is just an optimization to prevent flash
        if (process.env.NODE_ENV === 'development') {
            console.warn('[SyncHydrate] Failed to pre-hydrate theme:', e);
        }
    }
}

/**
 * Check if theme has been pre-hydrated
 * Useful for debugging and testing
 */
export function isThemePreHydrated(): boolean {
    if (typeof document === 'undefined') return false;
    const root = document.documentElement;
    return root.classList.contains('dark') || root.classList.contains('light');
}

export default syncHydrateTheme;
