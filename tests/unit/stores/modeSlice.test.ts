import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createModeSlice } from '@/stores/slices/modeSlice';
import { ThemeStore, ThemeActions } from '@/stores/types';

// Mock other slices as they are required by the types but we only want to test modeSlice logic
// Minimal mock of the store for testing modeSlice in isolation
const createTestStore = () => {
    return createStore<ThemeStore & ThemeActions>()(
        immer((set, get, store) => ({
            // @ts-expect-error - Partial mock
            ...createModeSlice(set, get, store),
            // Mock other required parts for applyThemeForMode to not crash if accessed
            // @ts-expect-error - Partial mock
            glass: { intensity: 50 },
            // @ts-expect-error - Partial mock
            visual: { radius: 10 },
            themes: {
                builtIn: [
                    {
                        id: 'test-theme',
                        name: 'Test Theme',
                        // @ts-expect-error - Partial mock
                        light: {
                            glass: { intensity: 10 },
                            visual: { radius: 5 },
                            background: { id: 'bg-light' }
                        },
                        // @ts-expect-error - Partial mock
                        dark: {
                            glass: { intensity: 90 },
                            visual: { radius: 20 },
                            background: { id: 'bg-dark' }
                        }
                    }
                ],
                activeId: 'test-theme',
                custom: []
            },
            // Mock setters that might be called by applyThemeForMode (although logic is direct state mutation in slice)
        }))
    );
};

describe('modeSlice', () => {
    let store: ReturnType<typeof createTestStore>;

    beforeEach(() => {
        store = createTestStore();
    });

    it('should initialize with default mode', () => {
        expect(store.getState().mode).toBe('dark');
    });

    it('should set mode correctly', () => {
        store.getState().setMode('light');
        expect(store.getState().mode).toBe('light');
        expect(store.getState().useSystemPreference).toBe(false);
    });

    it('should toggle mode', () => {
        // Initial is dark
        store.getState().toggleMode();
        expect(store.getState().mode).toBe('light');
        store.getState().toggleMode();
        expect(store.getState().mode).toBe('dark');
    });

    it('should apply theme settings when switching to light mode', () => {
        // Setup initial state overrides if needed, here we rely on the mock theme in createTestStore
        store.getState().setMode('light');

        const state = store.getState();
        expect(state.glass.intensity).toBe(10);
        expect(state.visual.radius).toBe(5);
        expect(state.activeBackgroundId).toBe('bg-light');
    });

    it('should apply theme settings when switching to dark mode', () => {
        store.getState().setMode('light'); // Switch to light first
        store.getState().setMode('dark');  // Then back to dark

        const state = store.getState();
        expect(state.glass.intensity).toBe(90);
        expect(state.visual.radius).toBe(20);
        expect(state.activeBackgroundId).toBe('bg-dark');
    });

    it('should handle system preference', () => {
        // Mock system preference
        store.setState({ systemPreference: 'light' });

        store.getState().setUseSystemPreference(true);
        expect(store.getState().useSystemPreference).toBe(true);
        expect(store.getState().mode).toBe('light'); // Should sync with preference
    });
});
