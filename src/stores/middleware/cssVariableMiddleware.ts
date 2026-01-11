import { StoreApi } from 'zustand';
import { ThemeStore, ThemeActions } from '../types';

// Helper to set CSS ref
const setCSS = (prop: string, value: string | number | null) => {
    if (value === null) {
        document.documentElement.style.removeProperty(prop);
    } else {
        document.documentElement.style.setProperty(prop, String(value));
    }
};

export const initializeCSSVariableSubscriber = (
    store: StoreApi<ThemeStore & ThemeActions>
) => {
    const applyState = (state: ThemeStore) => {
        // === Mode ===
        if (state.mode === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
        }

        // === Density ===
        document.documentElement.classList.remove('density-comfortable', 'density-compact');
        document.documentElement.classList.add(`density-${state.density}`);

        // === Glass ===
        const { glass } = state;
        setCSS('--glass-saturate', glass.saturation / 100);
        setCSS('--glass-noise-opacity', glass.noiseOpacity / 100);
        setCSS('--glass-material', glass.material);

        // Blur logic matching context roughly
        const blurFactor = glass.blurStrength / 50;
        setCSS('--glass-blur-thin', `${Math.round(1 + (blurFactor * 5))}px`);
        setCSS('--glass-blur-regular', `${Math.round(2 + (blurFactor * 8))}px`);
        setCSS('--glass-blur-thick', `${Math.round(4 + (blurFactor * 14))}px`);

        // === Visual ===
        const { visual } = state;
        setCSS('--glass-radius', `${visual.radius}px`);
        setCSS('--specular-enabled', visual.specularEnabled ? '1' : '0');
        setCSS('--glass-shadow-opacity', (visual.shadowStrength / 100) * 0.5);
        setCSS('--glass-border-opacity', visual.outlineOpacity / 100);
        setCSS('--color-accent', visual.accentColor);
        setCSS('--text-shadow-on-glass', visual.textShadowEnabled ? '0 1px 2px rgba(0, 0, 0, 0.15)' : 'none');

        // Animation CSS Variables
        const { bounceIntensity, pulseIntensity, scaleIntensity, wiggleIntensity } = visual;

        const bounceScale = bounceIntensity === 0 ? 0 : (1 + (bounceIntensity / 100) * 0.15);
        setCSS('--anim-bounce-scale', bounceScale);
        setCSS('--anim-bounce-enabled', bounceIntensity > 0 ? '1' : '0');

        const pulseOpacity = pulseIntensity === 0 ? 0 : (pulseIntensity / 100) * 0.3;
        setCSS('--anim-pulse-opacity', pulseOpacity);
        setCSS('--anim-pulse-enabled', pulseIntensity > 0 ? '1' : '0');

        const scaleAmount = scaleIntensity === 0 ? 0 : (scaleIntensity / 100) * 0.2;
        setCSS('--anim-scale-amount', scaleAmount);
        setCSS('--anim-scale-enabled', scaleIntensity > 0 ? '1' : '0');

        const wiggleAmount = wiggleIntensity === 0 ? 0 : (wiggleIntensity / 100) * 5;
        setCSS('--anim-wiggle-deg', `${wiggleAmount}deg`);
        setCSS('--anim-wiggle-enabled', wiggleIntensity > 0 ? '1' : '0');

        // === Performance ===
        if (state.performance.mode) {
            setCSS('--liquid-filter', 'none');
        } else {
            setCSS('--liquid-filter', 'url(#liquid-glass-normal)');
        }
    };

    store.subscribe(applyState);

    // Apply initial state
    applyState(store.getState());
};
