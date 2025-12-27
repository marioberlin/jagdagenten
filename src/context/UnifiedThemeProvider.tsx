import React from 'react';
import { AppearanceProvider } from './AppearanceContext';
import { GlassIntensityProvider } from './GlassIntensityContext';
import { ThemeProvider as CoreThemeProvider } from './ThemeContext';
import { useTheme as useCoreTheme } from '../hooks/useTheme';

// ============================================================================
// Unified ThemeProvider
// Composes all sub-contexts into a single provider for App.tsx
// ============================================================================

/**
 * UnifiedThemeProvider wraps all theme-related contexts.
 * This provides backward compatibility while enabling gradual migration.
 * 
 * Components can use either:
 * - useTheme() - Legacy API, all values in one hook
 * - useAppearance() - New API for radius, density, material, outline
 * - useGlassIntensity() - New API for intensity, overlay, tint, vibrancy
 */
export const UnifiedThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <CoreThemeProvider>
            <InnerProviders>
                {children}
            </InnerProviders>
        </CoreThemeProvider>
    );
};

// Inner component that has access to CoreTheme for passing theme to GlassIntensityProvider
const InnerProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { theme } = useCoreTheme();

    return (
        <AppearanceProvider>
            <GlassIntensityProvider theme={theme}>
                {children}
            </GlassIntensityProvider>
        </AppearanceProvider>
    );
};

// Re-export sub-hooks for direct access - REMOVED to satisfy HMR
// Please import hooks directly from @/hooks/
