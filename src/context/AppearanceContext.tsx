import React, { createContext, useState, useEffect } from 'react';
import type { Density } from '../types/ThemeTypes';

// ============================================================================
// AppearanceContext
// Manages visual customization: radius, density, shadow, material, outline
// ============================================================================

interface AppearanceContextType {
    // Density mode
    density: Density;
    setDensity: (value: Density) => void;
    // Glass Radius
    glassRadius: number;
    setGlassRadius: (value: number) => void;
    // Shadow Strength
    shadowStrength: number;
    setShadowStrength: (value: number) => void;
    // Glass Material
    glassMaterial: 'thin' | 'regular' | 'thick';
    setGlassMaterial: (value: 'thin' | 'regular' | 'thick') => void;
    // Outline Opacity
    outlineOpacity: number;
    setOutlineOpacity: (value: number) => void;
}

// Export context for use in hook file
export const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

// ============================================================================
// Helper: Create persisted state with localStorage
// ============================================================================
function usePersistedState<T>(
    key: string,
    defaultValue: T,
    parser?: (val: string) => T,
    validator?: (val: T) => boolean
): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [state, setState] = useState<T>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(key);
            if (saved !== null) {
                const parsed = parser ? parser(saved) : (saved as unknown as T);
                if (!validator || validator(parsed)) return parsed;
            }
        }
        return defaultValue;
    });

    useEffect(() => {
        localStorage.setItem(key, String(state));
    }, [key, state]);

    return [state, setState];
}

// ============================================================================
// AppearanceProvider
// ============================================================================
export const AppearanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Density
    const [density, setDensityState] = usePersistedState<Density>(
        'liquid-glass-density',
        'comfortable',
        (val) => val as Density,
        (val) => val === 'comfortable' || val === 'compact'
    );

    // Radius
    const [glassRadius, setGlassRadiusState] = usePersistedState<number>(
        'liquid-glass-radius',
        24,
        (val) => parseInt(val, 10)
    );

    // Shadow Strength
    const [shadowStrength, setShadowStrengthState] = usePersistedState<number>(
        'liquid-glass-shadow',
        50,
        (val) => parseInt(val, 10)
    );

    // Glass Material
    const [glassMaterial, setGlassMaterialState] = usePersistedState<'thin' | 'regular' | 'thick'>(
        'liquid-glass-material',
        'regular',
        (val) => val as 'thin' | 'regular' | 'thick',
        (val) => val === 'thin' || val === 'regular' || val === 'thick'
    );

    // Outline Opacity
    const [outlineOpacity, setOutlineOpacityState] = usePersistedState<number>(
        'liquid-glass-outline',
        30,
        (val) => parseInt(val, 10)
    );

    // ========================================================================
    // Apply CSS Variables
    // ========================================================================

    // Density class on html
    useEffect(() => {
        const html = document.documentElement;
        html.classList.remove('density-comfortable', 'density-compact');
        html.classList.add(`density-${density}`);
    }, [density]);

    // Radius CSS variable
    useEffect(() => {
        document.documentElement.style.setProperty('--glass-radius', `${glassRadius}px`);
    }, [glassRadius]);

    // Shadow opacity CSS variable
    useEffect(() => {
        const shadowOpacity = (shadowStrength / 100) * 0.5;
        document.documentElement.style.setProperty('--glass-shadow-opacity', shadowOpacity.toFixed(3));
    }, [shadowStrength]);

    // Outline opacity CSS variable
    useEffect(() => {
        const opacity = outlineOpacity / 100;
        document.documentElement.style.setProperty('--glass-border-opacity', opacity.toFixed(2));
        document.documentElement.style.setProperty('--glass-border', `rgba(255, 255, 255, ${opacity.toFixed(2)})`);
    }, [outlineOpacity]);

    // ========================================================================
    // Setters with validation
    // ========================================================================
    const setDensity = (value: Density) => setDensityState(value);
    const setGlassRadius = (value: number) => setGlassRadiusState(Math.max(0, Math.min(100, value)));
    const setShadowStrength = (value: number) => setShadowStrengthState(Math.max(0, Math.min(100, value)));
    const setGlassMaterial = (value: 'thin' | 'regular' | 'thick') => setGlassMaterialState(value);
    const setOutlineOpacity = (value: number) => setOutlineOpacityState(Math.max(0, Math.min(100, value)));

    return (
        <AppearanceContext.Provider value={{
            density,
            setDensity,
            glassRadius,
            setGlassRadius,
            shadowStrength,
            setShadowStrength,
            glassMaterial,
            setGlassMaterial,
            outlineOpacity,
            setOutlineOpacity,
        }}>
            {children}
        </AppearanceContext.Provider>
    );
};


