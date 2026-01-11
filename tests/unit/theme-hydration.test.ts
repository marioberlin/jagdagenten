import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Tests for Theme Hydration Race Fix
 * @see docs/IMPLEMENTATION_PLAN.md - Item 2.3 Theme Hydration Race Fix
 */

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
        removeItem: vi.fn((key: string) => { delete store[key]; }),
        clear: vi.fn(() => { store = {}; }),
        get length() { return Object.keys(store).length; },
        key: vi.fn((i: number) => Object.keys(store)[i] || null),
    };
})();

// Mock document.documentElement
const mockClassList = {
    classes: new Set<string>(),
    add: vi.fn((c: string) => mockClassList.classes.add(c)),
    remove: vi.fn((c: string) => mockClassList.classes.delete(c)),
    contains: vi.fn((c: string) => mockClassList.classes.has(c)),
};

const mockStyle = {
    props: new Map<string, string>(),
    setProperty: vi.fn((prop: string, value: string) => mockStyle.props.set(prop, value)),
    removeProperty: vi.fn((prop: string) => mockStyle.props.delete(prop)),
};

const mockDocumentElement = {
    classList: mockClassList,
    style: mockStyle,
    setAttribute: vi.fn(),
    getAttribute: vi.fn(),
};

// Store original globals
const originalLocalStorage = globalThis.localStorage;
const originalDocument = globalThis.document;

describe('Theme Hydration', () => {
    beforeEach(() => {
        // Reset mocks
        localStorageMock.clear();
        mockClassList.classes.clear();
        mockStyle.props.clear();
        vi.clearAllMocks();

        // Setup global mocks
        Object.defineProperty(globalThis, 'localStorage', {
            value: localStorageMock,
            writable: true,
        });

        Object.defineProperty(globalThis, 'document', {
            value: {
                documentElement: mockDocumentElement,
            },
            writable: true,
        });
    });

    afterEach(() => {
        // Restore originals
        Object.defineProperty(globalThis, 'localStorage', {
            value: originalLocalStorage,
            writable: true,
        });
        Object.defineProperty(globalThis, 'document', {
            value: originalDocument,
            writable: true,
        });
    });

    // Import dynamically to use mocked globals
    const importSyncHydrate = async () => {
        // Clear module cache
        vi.resetModules();
        return import('../../src/stores/utils/syncHydrate');
    };

    describe('syncHydrateTheme', () => {
        it('applies dark mode from localStorage', async () => {
            const storedState = {
                state: {
                    mode: 'dark',
                    density: 'comfortable',
                }
            };
            localStorageMock.setItem('theme-store', JSON.stringify(storedState));

            const { syncHydrateTheme } = await importSyncHydrate();
            syncHydrateTheme();

            expect(mockClassList.add).toHaveBeenCalledWith('dark');
            expect(mockClassList.remove).toHaveBeenCalledWith('light');
            expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
        });

        it('applies light mode from localStorage', async () => {
            const storedState = {
                state: {
                    mode: 'light',
                    density: 'comfortable',
                }
            };
            localStorageMock.setItem('theme-store', JSON.stringify(storedState));

            const { syncHydrateTheme } = await importSyncHydrate();
            syncHydrateTheme();

            expect(mockClassList.add).toHaveBeenCalledWith('light');
            expect(mockClassList.remove).toHaveBeenCalledWith('dark');
            expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
        });

        it('applies density class', async () => {
            const storedState = {
                state: {
                    mode: 'dark',
                    density: 'compact',
                }
            };
            localStorageMock.setItem('theme-store', JSON.stringify(storedState));

            const { syncHydrateTheme } = await importSyncHydrate();
            syncHydrateTheme();

            expect(mockClassList.add).toHaveBeenCalledWith('density-compact');
        });

        it('applies glass blur strength', async () => {
            const storedState = {
                state: {
                    mode: 'dark',
                    glass: {
                        blurStrength: 50, // Default
                    }
                }
            };
            localStorageMock.setItem('theme-store', JSON.stringify(storedState));

            const { syncHydrateTheme } = await importSyncHydrate();
            syncHydrateTheme();

            // blurFactor = 50 / 50 = 1
            // thin = 1 + (1 * 5) = 6px
            // regular = 2 + (1 * 8) = 10px
            // thick = 4 + (1 * 14) = 18px
            expect(mockStyle.setProperty).toHaveBeenCalledWith('--glass-blur-thin', '6px');
            expect(mockStyle.setProperty).toHaveBeenCalledWith('--glass-blur-regular', '10px');
            expect(mockStyle.setProperty).toHaveBeenCalledWith('--glass-blur-thick', '18px');
        });

        it('applies visual radius', async () => {
            const storedState = {
                state: {
                    mode: 'dark',
                    visual: {
                        radius: 12,
                    }
                }
            };
            localStorageMock.setItem('theme-store', JSON.stringify(storedState));

            const { syncHydrateTheme } = await importSyncHydrate();
            syncHydrateTheme();

            expect(mockStyle.setProperty).toHaveBeenCalledWith('--glass-radius', '12px');
        });

        it('applies accent color', async () => {
            const storedState = {
                state: {
                    mode: 'dark',
                    visual: {
                        accentColor: '#ff5500',
                    }
                }
            };
            localStorageMock.setItem('theme-store', JSON.stringify(storedState));

            const { syncHydrateTheme } = await importSyncHydrate();
            syncHydrateTheme();

            expect(mockStyle.setProperty).toHaveBeenCalledWith('--color-accent', '#ff5500');
        });

        it('handles performance mode', async () => {
            const storedState = {
                state: {
                    mode: 'dark',
                    performance: {
                        mode: true,
                    }
                }
            };
            localStorageMock.setItem('theme-store', JSON.stringify(storedState));

            const { syncHydrateTheme } = await importSyncHydrate();
            syncHydrateTheme();

            expect(mockStyle.setProperty).toHaveBeenCalledWith('--liquid-filter', 'none');
        });

        it('handles missing localStorage gracefully', async () => {
            // No item set
            const { syncHydrateTheme } = await importSyncHydrate();

            expect(() => syncHydrateTheme()).not.toThrow();
            expect(mockClassList.add).not.toHaveBeenCalled();
        });

        it('handles invalid JSON gracefully', async () => {
            localStorageMock.setItem('theme-store', 'not valid json{{{');

            const { syncHydrateTheme } = await importSyncHydrate();

            expect(() => syncHydrateTheme()).not.toThrow();
            expect(mockClassList.add).not.toHaveBeenCalled();
        });

        it('handles missing state property gracefully', async () => {
            localStorageMock.setItem('theme-store', JSON.stringify({ version: 1 }));

            const { syncHydrateTheme } = await importSyncHydrate();

            expect(() => syncHydrateTheme()).not.toThrow();
        });

        it('defaults to dark mode when mode is missing', async () => {
            const storedState = {
                state: {
                    // No mode specified
                    density: 'comfortable',
                }
            };
            localStorageMock.setItem('theme-store', JSON.stringify(storedState));

            const { syncHydrateTheme } = await importSyncHydrate();
            syncHydrateTheme();

            expect(mockClassList.add).toHaveBeenCalledWith('dark');
            expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
        });
    });

    describe('isThemePreHydrated', () => {
        it('returns true when dark class is present', async () => {
            mockClassList.classes.add('dark');

            const { isThemePreHydrated } = await importSyncHydrate();

            expect(isThemePreHydrated()).toBe(true);
        });

        it('returns true when light class is present', async () => {
            mockClassList.classes.add('light');

            const { isThemePreHydrated } = await importSyncHydrate();

            expect(isThemePreHydrated()).toBe(true);
        });

        it('returns false when no theme class is present', async () => {
            // No classes set

            const { isThemePreHydrated } = await importSyncHydrate();

            expect(isThemePreHydrated()).toBe(false);
        });
    });

    describe('Full Theme State Hydration', () => {
        it('applies complete theme state correctly', async () => {
            const fullState = {
                state: {
                    mode: 'light',
                    density: 'compact',
                    glass: {
                        saturation: 180,
                        noiseOpacity: 5,
                        material: 'frosted',
                        blurStrength: 75,
                    },
                    visual: {
                        radius: 16,
                        shadowStrength: 50,
                        outlineOpacity: 30,
                        accentColor: '#007aff',
                    },
                    performance: {
                        mode: false,
                    }
                }
            };
            localStorageMock.setItem('theme-store', JSON.stringify(fullState));

            const { syncHydrateTheme } = await importSyncHydrate();
            syncHydrateTheme();

            // Mode
            expect(mockClassList.add).toHaveBeenCalledWith('light');
            expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light');

            // Density
            expect(mockClassList.add).toHaveBeenCalledWith('density-compact');

            // Glass (all values are converted to strings by setCSS)
            expect(mockStyle.setProperty).toHaveBeenCalledWith('--glass-saturate', '1.8'); // 180/100
            expect(mockStyle.setProperty).toHaveBeenCalledWith('--glass-noise-opacity', '0.05'); // 5/100
            expect(mockStyle.setProperty).toHaveBeenCalledWith('--glass-material', 'frosted');

            // Visual
            expect(mockStyle.setProperty).toHaveBeenCalledWith('--glass-radius', '16px');
            expect(mockStyle.setProperty).toHaveBeenCalledWith('--glass-shadow-opacity', '0.25'); // (50/100) * 0.5
            expect(mockStyle.setProperty).toHaveBeenCalledWith('--glass-border-opacity', '0.3'); // 30/100
            expect(mockStyle.setProperty).toHaveBeenCalledWith('--color-accent', '#007aff');
        });
    });
});
