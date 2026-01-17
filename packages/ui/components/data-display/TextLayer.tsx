import React, { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export type TextVariant =
    | 'display'      // Large headers, hero text
    | 'heading'      // Section headers
    | 'title'        // Card/component titles
    | 'body'         // Primary body text
    | 'secondary'    // Secondary/muted text
    | 'caption'      // Small labels, timestamps
    | 'label';       // Form labels, UI labels

export type TextSurface =
    | 'default'     // On solid backgrounds
    | 'glass'       // On glass/translucent surfaces
    | 'image';      // On image/gradient backgrounds

interface TextLayerProps extends HTMLAttributes<HTMLSpanElement> {
    children: React.ReactNode;
    /** Text semantic variant */
    variant?: TextVariant;
    /** Surface type the text sits on */
    surface?: TextSurface;
    /** Apply bold weight */
    bold?: boolean;
    /** Apply medium weight */
    medium?: boolean;
    /** HTML element to render */
    as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'label' | 'div';
}

// Size classes per variant
const variantSizes: Record<TextVariant, string> = {
    display: 'text-5xl md:text-6xl font-bold tracking-tight',
    heading: 'text-2xl font-semibold tracking-tight',
    title: 'text-lg font-medium',
    body: 'text-base',
    secondary: 'text-sm',
    caption: 'text-xs tracking-wide',
    label: 'text-sm font-medium',
};

// Color classes per variant + surface combination
const variantColors: Record<TextSurface, Record<TextVariant, string>> = {
    default: {
        display: 'text-primary',
        heading: 'text-primary',
        title: 'text-primary',
        body: 'text-primary',
        secondary: 'text-secondary',
        caption: 'text-label-tertiary',
        label: 'text-primary',
    },
    glass: {
        display: 'text-label-glass-primary',
        heading: 'text-label-glass-primary',
        title: 'text-label-glass-primary',
        body: 'text-label-glass-primary',
        secondary: 'text-label-glass-secondary',
        caption: 'text-label-glass-tertiary',
        label: 'text-label-glass-primary',
    },
    image: {
        // On images, use higher contrast + drop shadow
        display: 'text-white drop-shadow-lg',
        heading: 'text-white drop-shadow-md',
        title: 'text-white drop-shadow-sm',
        body: 'text-white/95 drop-shadow-sm',
        secondary: 'text-white/80 drop-shadow-sm',
        caption: 'text-white/70 drop-shadow-sm',
        label: 'text-white drop-shadow-sm',
    },
};

/**
 * TextLayer - Semantic text component with automatic styling based on variant and surface.
 * 
 * @example
 * // On a glass card
 * <TextLayer variant="title" surface="glass">Card Title</TextLayer>
 * <TextLayer variant="secondary" surface="glass">Description text</TextLayer>
 * 
 * @example
 * // On an image background
 * <TextLayer variant="display" surface="image">Hero Title</TextLayer>
 */
export const TextLayer = ({
    children,
    className,
    variant = 'body',
    surface = 'default',
    bold = false,
    medium = false,
    as: Component = 'span',
    ...props
}: TextLayerProps) => {
    return (
        <Component
            className={cn(
                variantSizes[variant],
                variantColors[surface][variant],
                bold && 'font-bold',
                medium && 'font-medium',
                className
            )}
            {...props}
        >
            {children}
        </Component>
    );
};

TextLayer.displayName = 'TextLayer';
