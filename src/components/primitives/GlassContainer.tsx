import React, { HTMLAttributes, ElementType, useState, useEffect } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { cn } from '@/utils/cn';
import { useTheme } from '@/hooks/useTheme';

export type GlassMaterial = 'thin' | 'regular' | 'thick' | 'clear' | 'background' | 'surface' | 'prominent' | 'nav-glass';
export type GlassIntensity = 'subtle' | 'medium' | 'heavy';

// Luminance-aware glass materials using CSS variables
// These adapt to --glass-bg-* and --glass-blur-* variables set by ThemeContext
const materialMap: Record<GlassMaterial, string> = {
    // Original technical presets - now using CSS variable blur values
    thin: 'backdrop-blur-[var(--glass-blur-thin,8px)] backdrop-saturate-[var(--glass-saturate,1)] bg-[var(--glass-bg-thin)] border-[var(--glass-border)]',
    regular: 'backdrop-blur-[var(--glass-blur-regular,16px)] backdrop-saturate-[var(--glass-saturate,1)] bg-[var(--glass-bg-regular)] border-[var(--glass-border)] shadow-[0_8px_32px_0_rgba(0,0,0,var(--glass-shadow-opacity,0.1))]',
    thick: 'backdrop-blur-[var(--glass-blur-thick,32px)] backdrop-saturate-[var(--glass-saturate,1)] bg-[var(--glass-bg-thick)] border-[var(--glass-border)] shadow-[0_8px_32px_0_rgba(0,0,0,var(--glass-shadow-opacity,0.2))]',
    // Clear variant: For media overlays - highly translucent, preserves background visibility
    // Use over photos, videos, and visually rich content
    clear: 'backdrop-blur-[var(--glass-blur-thin,8px)] backdrop-saturate-[var(--glass-saturate,1)] bg-[var(--glass-bg-clear,rgba(0,0,0,0.15))] border-[var(--glass-border-clear,rgba(255,255,255,0.1))]',
    // Semantic presets for visual hierarchy
    background: 'backdrop-blur-[4px] backdrop-saturate-[var(--glass-saturate,1)] bg-[var(--glass-bg-thin)]/50 border-transparent',
    surface: 'backdrop-blur-[var(--glass-blur-regular,16px)] backdrop-saturate-[var(--glass-saturate,1)] bg-[var(--bg-primary)]/90 border-[var(--glass-border)] shadow-[0_8px_32px_0_rgba(0,0,0,var(--glass-shadow-opacity,0.1))]',
    // Navigation variant with guaranteed readability
    'nav-glass': 'backdrop-blur-[var(--glass-blur-regular,16px)] backdrop-saturate-[var(--glass-saturate,1)] bg-[var(--glass-bg-thick)]/80 border-[var(--glass-border)]',
    prominent: 'backdrop-blur-[var(--glass-blur-thick,32px)] backdrop-saturate-[var(--glass-saturate,1)] bg-[var(--glass-bg-thick)] border-[var(--glass-border)] shadow-[0_8px_32px_0_rgba(0,0,0,var(--glass-shadow-opacity,0.2))] ring-1 ring-accent/10',
};

// Intensity modifiers - override blur and opacity for finer control
// subtle: Minimal glass effect for busy backgrounds or secondary elements
// medium: Default balanced effect for primary cards/modals
// heavy: Maximum glass effect for hero sections or focus areas
const intensityConfig: Record<GlassIntensity, { blur: string; opacity: string }> = {
    subtle: { blur: '4px', opacity: '0.3' },
    medium: { blur: '16px', opacity: '0.5' },
    heavy: { blur: '32px', opacity: '0.7' },
};

export interface GlassProps extends HTMLAttributes<HTMLElement> {
    material?: GlassMaterial;
    /** Fine-grained control over glass effect strength */
    intensity?: GlassIntensity;
    interactive?: boolean;
    border?: boolean;
    as?: ElementType;
    enableLiquid?: boolean; // Optionally disable the liquid filter
    // Additional props for button usage
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
}

export const GlassContainer = React.forwardRef<HTMLElement, GlassProps>(
    ({ className, material = 'regular', intensity, interactive = false, border = true, enableLiquid = true, children, style, as: Component = 'div', ...props }, ref) => {
        // Compute intensity style overrides if provided
        const intensityStyles = intensity ? {
            backdropFilter: `blur(${intensityConfig[intensity].blur})`,
            WebkitBackdropFilter: `blur(${intensityConfig[intensity].blur})`,
            opacity: intensityConfig[intensity].opacity,
        } : {};
        // Accessibility: Reduced Motion
        const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

        useEffect(() => {
            const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            setPrefersReducedMotion(mediaQuery.matches);

            const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
            mediaQuery.addEventListener('change', handler);
            return () => mediaQuery.removeEventListener('change', handler);
            return () => mediaQuery.removeEventListener('change', handler);
        }, []);

        const { performanceMode } = useTheme();

        const [springProps, api] = useSpring(() => ({
            scale: 1,
            rotateX: 0,
            rotateY: 0,
            config: { tension: 300, friction: 20 },
        }));

        const handleMouseEnter = () => {
            if (interactive && !prefersReducedMotion) {
                api.start({ scale: 1.02, config: { tension: 300, friction: 15 } });
            }
        };

        const handleMouseLeave = () => {
            if (interactive && !prefersReducedMotion) {
                api.start({ scale: 1, rotateX: 0, rotateY: 0 });
            }
        };

        // Only disable filter for reduced motion preference OR if explicitly disabled OR in performance mode
        // Removed isScrolling check to prevent flicker during scroll
        const shouldDisableFilter = prefersReducedMotion || !enableLiquid || performanceMode;
        const activeFilter = shouldDisableFilter ? 'none' : 'url(#liquid-glass-normal)';

        return (
            <Component
                ref={ref}
                className={cn(
                    // Container Layout
                    'relative isolate',
                    // Rounded structure - dynamic
                    'overflow-hidden',
                    // Typography enforcement
                    'glass-typography',

                    // Interactive Layout Wrapper
                    interactive && 'cursor-pointer',
                    interactive && !prefersReducedMotion && 'transition-transform duration-glass ease-glass',
                    interactive && !prefersReducedMotion && 'active:scale-[0.98] will-change-transform',

                    className
                )}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={{
                    ...style,
                    // Use CSS variable injection for radius
                    borderRadius: 'var(--glass-radius, 1.5rem)',
                } as React.CSSProperties}
                {...props}
            >
                {/* Layer 0: The Liquid Material (Background) */}
                {/* 
                    Wrapper: Strict clipping mask. 
                    We moved overflow-hidden here and use borderRadius: inherit to unsure 
                    the large liquid layer below is strictly clipped to the parent's shape.
                */}
                {/* Layer 0: The Liquid Material (Background) */}
                {shouldDisableFilter ? (
                    // SIMPLIFIED RENDER: Single layer, no filter, strict shape inheritance
                    <div
                        className={cn(
                            'absolute inset-0 -z-10',
                            materialMap[material],
                            // Explicitly inherit border radius from parent to ensure perfect match
                            // Using style={{ borderRadius: 'inherit' }} is safer than class
                            'transition-all duration-glass ease-glass',
                            interactive && 'group-hover:brightness-110',
                        )}
                        style={{ borderRadius: 'inherit', ...intensityStyles }}
                    />
                ) : (
                    // COMPLEX RENDER: Nested wrapper for clipping liquid displacement
                    <div
                        className="absolute inset-0 -z-10"
                        style={{
                            borderRadius: 'inherit',
                            overflow: 'hidden',
                            // clip-path provides robust clipping for backdrop-filter and SVG filters
                            // Using var(--glass-radius) for consistent radius with the parent container
                            clipPath: 'inset(0 round var(--glass-radius, 1.5rem))',
                            // Force hardware acceleration/isolation to ensure clipping works with child transforms
                            transform: 'translateZ(0)',
                            isolation: 'isolate'
                        }}
                    >
                        {/* 
                            Liquid Layer: Larger than container (-inset-10) to provide sampling buffer 
                            for the displacement map (fixing color leakage/edge artifacts).
                        */}
                        <animated.div
                            className={cn(
                                'absolute -inset-10', // Bleed for valid pixels for the filter
                                materialMap[material],
                                // Interactive Effects (Brightness/Shadow on the material itself)
                                'transition-all duration-glass ease-glass',
                                interactive && 'group-hover:brightness-110',
                            )}
                            style={{
                                // Bind Spring Scale - reduce motion if needed
                                transform: !prefersReducedMotion ? springProps.scale.to(s => `scale(${s}) translateZ(0)`) : undefined,
                                // Toggle Filter for Performance - with smooth transition
                                filter: activeFilter,
                                transition: 'filter 200ms ease-out',
                                willChange: 'filter',
                                ...intensityStyles,
                            }}
                        />
                    </div>
                )}

                {/* Layer 1: Borders */}
                {border && (
                    <div
                        className="absolute inset-0 pointer-events-none -z-10 border border-[var(--glass-border)] shadow-glass-edge"
                        style={{ borderRadius: 'inherit' }}
                    />
                )}

                {/* Layer 1.5: Specular Highlight - Simulates 3D light source */}
                {/* Visibility controlled by --specular-enabled CSS variable from ThemeContext */}
                <div
                    className="absolute inset-0 pointer-events-none -z-10"
                    style={{
                        borderRadius: 'inherit',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 30%, transparent 60%)',
                        opacity: 'var(--specular-enabled, 1)',
                        transition: 'opacity 300ms ease-out',
                    }}
                    aria-hidden="true"
                />

                {/* Layer 2: Content */}
                <div className="relative z-0 h-full w-full">
                    {children}
                </div>
            </Component>
        );
    }
);

GlassContainer.displayName = "GlassContainer";
