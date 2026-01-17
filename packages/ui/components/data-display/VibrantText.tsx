import React, { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';
import { useContrastDetection } from '@/hooks/useContrastDetection';

export interface VibrantTextProps extends HTMLAttributes<HTMLSpanElement> {
    children: React.ReactNode;
    /** Text intensity. 'auto' adapts based on background context. */
    intensity?: 'low' | 'medium' | 'high' | 'auto';
    /** Adds additional contrast layer for accessibility */
    tinted?: boolean;
}

export const VibrantText = ({
    children,
    className,
    intensity = 'medium',
    tinted = false,
    ...props
}: VibrantTextProps) => {
    // Call hook unconditionally at top level (Rules of Hooks)
    const contrastSettings = useContrastDetection();

    // Derive adaptive settings based on intensity prop
    const adaptiveSettings = intensity === 'auto' ? contrastSettings : null;

    // Resolve final intensity
    const resolvedIntensity = intensity === 'auto' && adaptiveSettings
        ? adaptiveSettings.vibrantIntensity
        : (intensity === 'auto' ? 'medium' : intensity);

    // Resolve tinted state
    const isTinted = tinted || (adaptiveSettings?.useTintedLayer ?? false);
    const useDropShadow = adaptiveSettings?.useDropShadow ?? false;

    return (
        <span className={cn('relative inline-block', className)} {...props}>
            {/* The "Vibrant" Layer - Blends with glass */}
            <span
                className={cn(
                    "absolute inset-0 text-[var(--text-primary)] select-none",
                    resolvedIntensity === 'low' && "opacity-30 blur-[0.2px]",
                    resolvedIntensity === 'medium' && "opacity-50 blur-[0.5px]",
                    resolvedIntensity === 'high' && "opacity-70 blur-[1px]",
                )}
                style={{ mixBlendMode: 'var(--vibrant-blend)' as React.CSSProperties['mixBlendMode'] }}
                aria-hidden="true"
            >
                {children}
            </span>
            {/* Optional tinted layer for extra contrast on busy backgrounds */}
            {isTinted && (
                <span
                    className="absolute inset-0 text-[var(--text-primary)] opacity-20 select-none"
                    style={{ textShadow: '0 0 8px currentColor' }}
                    aria-hidden="true"
                >
                    {children}
                </span>
            )}
            {/* The "Legibility" Layer - High contrast */}
            <span
                className={cn(
                    "relative text-[var(--text-primary)]",
                    useDropShadow && "drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
                )}
            >
                {children}
            </span>
        </span>
    );
};

VibrantText.displayName = 'VibrantText';
