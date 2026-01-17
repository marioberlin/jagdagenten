import React, { HTMLAttributes, ElementType, useState } from 'react';
import { motion } from 'framer-motion';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/utils/cn';
import { TRANSITIONS } from '@/styles/animations';
import { glassRegistry } from '@/styles/MaterialRegistry';

export type SurfaceMaterial = 'flat' | 'elevated' | 'sunken';

export interface SurfaceProps extends HTMLAttributes<HTMLElement> {
    /** 
    /**
     * The visual material style.
     * Can be one of the presets or a custom registered material name.
     * @default 'flat'
     */
    material?: SurfaceMaterial | string;

    /** If true, adds hover effects (scale, brightness) and cursor-pointer. */
    interactive?: boolean;

    /** If true, renders a border. @default true */
    border?: boolean;

    /** Polymorphic prop: Change the rendered element. */
    as?: ElementType;

    disabled?: boolean;

    /** Delegate rendering to child element (Slot pattern). */
    asChild?: boolean;
}

// Opaque material equivalents
const materialMap: Record<SurfaceMaterial, string> = {
    flat: 'bg-[var(--bg-primary)] border-[var(--glass-border)]',
    elevated: 'bg-white dark:bg-zinc-900 border-[var(--glass-border)] shadow-sm',
    sunken: 'bg-zinc-50 dark:bg-black border-transparent shadow-inner',
};

/**
 * SurfaceContainer
 *
 * An opaque alternative to GlassContainer for high-contrast or performance-sensitive
 * areas. Uses standard colors and shadows instead of backdrops filters.
 * Ideal for dense content areas or when glass effect is too heavy.
 *
 * @example
 * ```tsx
 * <SurfaceContainer material="elevated">
 *   <p>Opaque content</p>
 * </SurfaceContainer>
 * ```
 */
export const SurfaceContainer = React.forwardRef<HTMLElement, SurfaceProps>(
    ({ className, material = 'flat', interactive = false, border = true, children, style, as, asChild = false, ...props }, ref) => {
        const Component = asChild ? Slot : (as || 'div');
        const [isHovered, setIsHovered] = useState(false);

        const resolvedMaterialClass = glassRegistry.get(material) || materialMap[material as SurfaceMaterial];

        const handleMouseEnter = () => {
            if (interactive) {
                setIsHovered(true);
            }
        };

        const handleMouseLeave = () => {
            if (interactive) {
                setIsHovered(false);
            }
        };

        return (
            <Component
                ref={ref}
                className={cn(
                    'relative isolate overflow-hidden',
                    // Typography enforcement
                    'glass-typography',
                    interactive ? 'cursor-pointer' : '',
                    className
                )}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={{
                    ...style,
                    borderRadius: 'var(--glass-radius, 1.5rem)',
                } as React.CSSProperties}
                {...props}
            >
                {/* Background Layer (Opaque) */}
                <motion.div
                    className={cn(
                        'absolute inset-0 -z-10',
                        resolvedMaterialClass,
                        'transition-colors duration-500', // Smooth theme switch
                    )}
                    style={{
                        borderRadius: 'inherit',
                    }}
                    animate={{
                        scale: interactive && isHovered ? 1.01 : 1
                    }}
                    transition={TRANSITIONS.spring}
                />

                {/* Border Layer */}
                {border && (
                    <div
                        className="absolute inset-0 pointer-events-none -z-10 border border-[var(--glass-border)]"
                        style={{ borderRadius: 'inherit' }}
                    />
                )}

                {/* Content */}
                <div className="relative z-0 h-full w-full">
                    {children}
                </div>
            </Component>
        );
    }
);

SurfaceContainer.displayName = "SurfaceContainer";
