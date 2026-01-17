/**
 * Glass Material Constants
 * Blur values in pixels for each theme variant.
 */
export const GLASS_BLUR = {
    ultraThin: {
        evolution: 15,
        hig: 6,
        web: 6,
    },
    regular: {
        evolution: 25,
        hig: 10,
        web: 10,
    },
    thick: {
        evolution: 40,
        hig: 18,
        web: 18,
    },
} as const;

/**
 * Glass Opacity Constants
 */
export const GLASS_OPACITY = {
    regular: 0.40,
    clear: 0.15,
    evolution: 0.60,
} as const;
