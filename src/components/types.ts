import { HTMLAttributes, ElementType } from 'react';

export type GlassMaterial = 'thin' | 'regular' | 'thick' | 'clear' | 'background' | 'surface' | 'prominent' | 'nav-glass';
export type GlassIntensity = 'subtle' | 'medium' | 'heavy';

export interface GlassComponentProps<T = HTMLElement> extends HTMLAttributes<T> {
    /** 
     * The glass material variant to apply.
     * @default 'regular'
     */
    material?: GlassMaterial | string;

    /**
     * Fine-grained control over glass effect strength.
     */
    intensity?: GlassIntensity;

    /** If true, adds hover effects and cursor-pointer. */
    interactive?: boolean;

    /** If true, renders a 1px glass border and edge highlight. @default true */
    border?: boolean;

    /** Polymorphic prop: Change the rendered element. */
    as?: ElementType;

    /**
     * If true, delegates rendering to the immediate child element using Radix Slot.
     */
    asChild?: boolean;

    /** Optionally disable the SVG liquid distortion filter for performance. @default true */
    enableLiquid?: boolean;

    /** Apply recede/inactive visual state. */
    inactive?: boolean;

    /** Disabled state */
    disabled?: boolean;
    type?: string;
}
