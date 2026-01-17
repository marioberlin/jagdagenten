import { useState, useEffect } from 'react';

interface SFSymbolProps {
    name: string;
    size?: number;
    className?: string;
    style?: React.CSSProperties;
}

/**
 * SF Symbol component that renders symbols from the local asset library.
 * Symbols are theme-aware and will invert in dark mode automatically.
 * 
 * @example
 * <SFSymbol name="gear" size={24} />
 * <SFSymbol name="cloud.sun.rain.fill" size={32} className="opacity-80" />
 */
export const SFSymbol = ({ name, size = 24, className = '', style }: SFSymbolProps) => {
    // Detect dark mode from html class (Tailwind pattern)
    const [isDarkMode, setIsDarkMode] = useState(() =>
        typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
    );

    // Listen for theme changes
    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const [hasError, setHasError] = useState(false);

    // Icon filter: invert in dark mode (icons are black by default)
    const iconFilter = isDarkMode ? 'invert(1)' : 'none';

    if (hasError) {
        return (
            <span
                className={`inline-flex items-center justify-center text-tertiary ${className}`}
                style={{ width: size, height: size, fontSize: size * 0.4, ...style }}
            >
                ?
            </span>
        );
    }

    return (
        <img
            src={`/symbols/${name}/regular.svg`}
            alt=""
            aria-hidden="true"
            width={size}
            height={size}
            onError={() => setHasError(true)}
            className={`object-contain ${className}`}
            style={{ filter: iconFilter, width: size, height: size, ...style }}
            loading="lazy"
        />
    );
};

export default SFSymbol;
