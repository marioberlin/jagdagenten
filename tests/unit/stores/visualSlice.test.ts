import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createVisualSlice } from '@/stores/slices/visualSlice';
import { ThemeStore, ThemeActions } from '@/stores/types';

const createVisualTestStore = () => {
    return createStore<ThemeStore & ThemeActions>()(
        immer((set, get, store) => ({
            // @ts-expect-error - Partial logic
            ...createVisualSlice(set, get, store),
            visual: {
                radius: 20,
                shadowStrength: 30,
                outlineOpacity: 40,
                specularEnabled: true,
                textShadowEnabled: true,
                textVibrancy: 50,
                accentColor: '#000000',
                bounceIntensity: 50,
                pulseIntensity: 50,
                scaleIntensity: 50,
                wiggleIntensity: 50
            }
        }))
    );
};

describe('visualSlice', () => {
    let store: ReturnType<typeof createVisualTestStore>;

    beforeEach(() => {
        store = createVisualTestStore();
    });

    it('should set radius', () => {
        store.getState().setRadius(30);
        expect(store.getState().visual.radius).toBe(30);
    });

    it('should set accent color', () => {
        store.getState().setAccentColor('#ff0000');
        expect(store.getState().visual.accentColor).toBe('#ff0000');
    });

    it('should set animation intensities', () => {
        store.getState().setBounceIntensity(80);
        expect(store.getState().visual.bounceIntensity).toBe(80);

        store.getState().setPulseIntensity(90);
        expect(store.getState().visual.pulseIntensity).toBe(90);
    });

    it('should apply partial visual settings', () => {
        store.getState().applyVisualSettings({
            radius: 10,
            textVibrancy: 90
        });
        expect(store.getState().visual.radius).toBe(10);
        expect(store.getState().visual.textVibrancy).toBe(90);
        expect(store.getState().visual.specularEnabled).toBe(true); // preserved
    });
});
