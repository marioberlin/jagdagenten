# Liquid Glass UI - State Management API

## Overview
Liquid Glass UI 2.0 uses **Zustand** for state management, replacing the legacy React Context API. This provides better performance (no unnecessary re-renders), persistence, and a cleaner API.

## Core Hook: `useTheme`

The `useTheme` hook is the primary entry point for accessing and modifying the UI state.

```tsx
import { useTheme } from '@/hooks/useTheme';

const component = () => {
    const { theme, toggleTheme, setGlassIntensity } = useTheme();
    // ...
}
```

### Properties

#### Theme Mode
- `theme`: `'light' | 'dark'` - Current active mode.
- `toggleTheme()`: Toggle between light and dark modes.

#### Glass Customization
- `glassIntensity`: `number` (0-100) - Global glass intensity.
- `setGlassIntensity(value)`: Set global intensity.
- `blurStrength`: `number` (0-100) - Base blur strength (px).
- `setBlurStrength(value)`: Set base blur.
- `glassMaterial`: `string` - Default material preset.
- `saturation`: `number` (0-200) - Backdrop saturation %.

#### Visual Settings
- `glassRadius`: `number` - Global border radius (px).
- `setGlassRadius(value)`: Set global radius.
- `accentColor`: `string` - Primary accent color hex.
- `performanceMode`: `boolean` - If proper, disables heavy effects.

## Store Architecture

The store is split into slices for modularity:
- `modeSlice`: Handles Light/Dark mode and System preference.
- `glassSlice`: Handles Glass effect variables (blur, saturation).
- `visualSlice`: Handles Layout and Visual properties (radius, colors).
- `themePresetsSlice`: Manages built-in and custom theme configs.
- `performanceSlice`: Handles performance optimizations (reduced motion, etc).

## Migration Guide

If you were using `useContext(ThemeContext)`, replace it with `useTheme()`.
The API is backward compatible for most common properties.

### Legacy Contexts (Removed)
- `ThemeContext` -> `useTheme`
- `GlassStyleContext` -> `useTheme`
- `ThemeCoreContext` -> `useTheme`
- `UnifiedThemeProvider` -> No longer needed (Store is global).
