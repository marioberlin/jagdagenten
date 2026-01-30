/**
 * Tests for useRevierSettingsStore
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useRevierSettingsStore } from '../useRevierSettingsStore';

describe('useRevierSettingsStore', () => {
    beforeEach(() => {
        // Reset store state before each test
        useRevierSettingsStore.setState({
            settings: {
                backgroundId: 'heathland',
                showWeatherOverlay: true,
                darkOverlayOpacity: 50,
            },
        });
    });

    describe('background selection', () => {
        it('should have heathland as default background', () => {
            const state = useRevierSettingsStore.getState();
            expect(state.settings.backgroundId).toBe('heathland');
        });

        it('should change background when setBackground is called', () => {
            const { setBackground } = useRevierSettingsStore.getState();
            setBackground('winter');
            expect(useRevierSettingsStore.getState().settings.backgroundId).toBe('winter');
        });

        it('should clear custom URL when switching to preset background', () => {
            useRevierSettingsStore.setState({
                settings: {
                    ...useRevierSettingsStore.getState().settings,
                    customBackgroundUrl: 'https://example.com/bg.png',
                },
            });

            const { setBackground } = useRevierSettingsStore.getState();
            setBackground('autumn');

            expect(useRevierSettingsStore.getState().settings.customBackgroundUrl).toBeUndefined();
        });

        it('should set custom background URL', () => {
            const { setCustomBackground } = useRevierSettingsStore.getState();
            setCustomBackground('https://example.com/custom.jpg');

            const state = useRevierSettingsStore.getState();
            expect(state.settings.backgroundId).toBe('custom');
            expect(state.settings.customBackgroundUrl).toBe('https://example.com/custom.jpg');
        });
    });

    describe('dark overlay', () => {
        it('should have 50% default overlay opacity', () => {
            const state = useRevierSettingsStore.getState();
            expect(state.settings.darkOverlayOpacity).toBe(50);
        });

        it('should update overlay opacity', () => {
            const { setDarkOverlay } = useRevierSettingsStore.getState();
            setDarkOverlay(70);
            expect(useRevierSettingsStore.getState().settings.darkOverlayOpacity).toBe(70);
        });

        it('should clamp overlay opacity to 0-100 range', () => {
            const { setDarkOverlay } = useRevierSettingsStore.getState();

            setDarkOverlay(-20);
            expect(useRevierSettingsStore.getState().settings.darkOverlayOpacity).toBe(0);

            setDarkOverlay(150);
            expect(useRevierSettingsStore.getState().settings.darkOverlayOpacity).toBe(100);
        });
    });

    describe('weather overlay', () => {
        it('should have weather overlay enabled by default', () => {
            const state = useRevierSettingsStore.getState();
            expect(state.settings.showWeatherOverlay).toBe(true);
        });

        it('should toggle weather overlay', () => {
            const { toggleWeatherOverlay } = useRevierSettingsStore.getState();
            toggleWeatherOverlay();
            expect(useRevierSettingsStore.getState().settings.showWeatherOverlay).toBe(false);
            toggleWeatherOverlay();
            expect(useRevierSettingsStore.getState().settings.showWeatherOverlay).toBe(true);
        });
    });

    describe('available backgrounds', () => {
        it('should have 4 available backgrounds', () => {
            const state = useRevierSettingsStore.getState();
            expect(state.availableBackgrounds).toHaveLength(4);
        });

        it('should include all seasons', () => {
            const state = useRevierSettingsStore.getState();
            const seasons = state.availableBackgrounds.map((bg) => bg.season);
            expect(seasons).toContain('summer');
            expect(seasons).toContain('winter');
            expect(seasons).toContain('autumn');
            expect(seasons).toContain('all');
        });

        it('should return correct background URL for preset', () => {
            const { getBackgroundUrl } = useRevierSettingsStore.getState();
            const url = getBackgroundUrl();
            expect(url).toBe('/assets/backgrounds/jagd-heathland.png');
        });

        it('should return custom URL when set', () => {
            const { setCustomBackground, getBackgroundUrl } = useRevierSettingsStore.getState();
            setCustomBackground('https://example.com/my-bg.jpg');
            expect(getBackgroundUrl()).toBe('https://example.com/my-bg.jpg');
        });

        it('should get active background object', () => {
            const { getActiveBackground } = useRevierSettingsStore.getState();
            const active = getActiveBackground();
            expect(active?.id).toBe('heathland');
            expect(active?.name).toBe('Lüneburger Heide');
        });
    });
});
