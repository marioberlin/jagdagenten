import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createGlassSlice } from '@/stores/slices/glassSlice';
import { createVisualSlice } from '@/stores/slices/visualSlice';
import { ThemeStore, ThemeActions } from '@/stores/types';

const createGlassTestStore = () => {
    return createStore<ThemeStore & ThemeActions>()(
        immer((set, get, store) => ({
            // @ts-ignore - Partial logic
            ...createGlassSlice(set, get, store),
            glass: {
                intensity: 50,
                blurStrength: 50,
                material: 'regular',
                tintColor: null,
                saturation: 100,
                noiseOpacity: 0
            }
        }))
    );
};

describe('glassSlice', () => {
    let store: ReturnType<typeof createGlassTestStore>;

    beforeEach(() => {
        store = createGlassTestStore();
    });

    it('should set glass intensity', () => {
        store.getState().setGlassIntensity(75);
        expect(store.getState().glass.intensity).toBe(75);
    });

    it('should set glass material', () => {
        store.getState().setGlassMaterial('thin');
        expect(store.getState().glass.material).toBe('thin');
    });

    it('should apply partial glass settings', () => {
        store.getState().applyGlassSettings({
            intensity: 80,
            blurStrength: 20
        });
        expect(store.getState().glass.intensity).toBe(80);
        expect(store.getState().glass.blurStrength).toBe(20);
        // Should preserve other values
        expect(store.getState().glass.saturation).toBe(100);
    });
});
