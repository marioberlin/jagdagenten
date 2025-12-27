import { createContext, useState, useEffect, ReactNode } from 'react';

export type BackgroundType = 'light' | 'dark' | 'image' | 'gradient';
export type ContrastLevel = 'normal' | 'high';
export type MaterialThickness = 'ultra-thin' | 'thin' | 'regular' | 'thick';

export interface AdaptiveTextContextValue {
    backgroundType: BackgroundType;
    contrastLevel: ContrastLevel;
    materialThickness: MaterialThickness;
    setBackgroundType: (type: BackgroundType) => void;
    setContrastLevel: (level: ContrastLevel) => void;
    setMaterialThickness: (thickness: MaterialThickness) => void;
}

const defaultValue: AdaptiveTextContextValue = {
    backgroundType: 'dark',
    contrastLevel: 'normal',
    materialThickness: 'regular',
    setBackgroundType: () => { },
    setContrastLevel: () => { },
    setMaterialThickness: () => { },
};

// Export context for use in hook file
export const AdaptiveTextContext = createContext<AdaptiveTextContextValue>(defaultValue);

interface AdaptiveTextProviderProps {
    children: ReactNode;
    initialBackground?: BackgroundType;
    initialContrast?: ContrastLevel;
    initialThickness?: MaterialThickness;
}

export const AdaptiveTextProvider = ({
    children,
    initialBackground = 'dark',
    initialContrast = 'normal',
    initialThickness = 'regular',
}: AdaptiveTextProviderProps) => {
    const [backgroundType, setBackgroundType] = useState<BackgroundType>(initialBackground);
    const [contrastLevel, setContrastLevel] = useState<ContrastLevel>(initialContrast);
    const [materialThickness, setMaterialThickness] = useState<MaterialThickness>(initialThickness);

    // Sync with document class for dark/light mode
    useEffect(() => {
        const checkDarkMode = () => {
            const isDark = document.documentElement.classList.contains('dark');
            // Only auto-update if not using image/gradient background
            if (backgroundType !== 'image' && backgroundType !== 'gradient') {
                setBackgroundType(isDark ? 'dark' : 'light');
            }
        };

        checkDarkMode();

        // Watch for class changes on html element
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        return () => observer.disconnect();
    }, [backgroundType]);

    // Apply tinted mode class for accessibility
    useEffect(() => {
        if (contrastLevel === 'high') {
            document.documentElement.classList.add('tinted-mode');
        } else {
            document.documentElement.classList.remove('tinted-mode');
        }
    }, [contrastLevel]);

    return (
        <AdaptiveTextContext.Provider
            value={{
                backgroundType,
                contrastLevel,
                materialThickness,
                setBackgroundType,
                setContrastLevel,
                setMaterialThickness,
            }}
        >
            {children}
        </AdaptiveTextContext.Provider>
    );
};


