/**
 * Liquid Glass Design Tokens
 *
 * Centralized source of truth for design constants to prevent hardcoding.
 * Based on Apple Human Interface Guidelines and Liquid Glass Design System.
 *
 * @see skills/liquid-design/SKILL.md
 */

/**
 * Apple System Colors - Dynamic mode (Light/Dark variants)
 * These are the exact hex values from Apple's HIG.
 */
export const APPLE_SYSTEM_COLORS = {
    blue: {
        light: '#007AFF',
        dark: '#0A84FF',
    },
    green: {
        light: '#34C759',
        dark: '#30D158',
    },
    red: {
        light: '#FF3B30',
        dark: '#FF453A',
    },
    orange: {
        light: '#FF9500',
        dark: '#FF9F0A',
    },
    yellow: {
        light: '#FFCC00',
        dark: '#FFD60A',
    },
    pink: {
        light: '#FF2D55',
        dark: '#FF375F',
    },
    purple: {
        light: '#AF52DE',
        dark: '#BF5AF2',
    },
    teal: {
        light: '#5AC8FA',
        dark: '#64D2FF',
    },
    indigo: {
        light: '#5856D6',
        dark: '#5E5CE6',
    },
} as const;

/**
 * Ordered System Color Palette for Charts
 * Use these in sequence for multi-series data visualization.
 * Order: Blue -> Green -> Orange -> Pink -> Purple -> Teal -> Yellow -> Red
 */
export const CHART_COLOR_PALETTE = {
    light: [
        APPLE_SYSTEM_COLORS.blue.light,
        APPLE_SYSTEM_COLORS.green.light,
        APPLE_SYSTEM_COLORS.orange.light,
        APPLE_SYSTEM_COLORS.pink.light,
        APPLE_SYSTEM_COLORS.purple.light,
        APPLE_SYSTEM_COLORS.teal.light,
        APPLE_SYSTEM_COLORS.yellow.light,
        APPLE_SYSTEM_COLORS.indigo.light,
    ],
    dark: [
        APPLE_SYSTEM_COLORS.blue.dark,
        APPLE_SYSTEM_COLORS.green.dark,
        APPLE_SYSTEM_COLORS.orange.dark,
        APPLE_SYSTEM_COLORS.pink.dark,
        APPLE_SYSTEM_COLORS.purple.dark,
        APPLE_SYSTEM_COLORS.teal.dark,
        APPLE_SYSTEM_COLORS.yellow.dark,
        APPLE_SYSTEM_COLORS.indigo.dark,
    ],
} as const;

/**
 * Semantic Colors for Financial Data
 */
export const FINANCIAL_COLORS = {
    positive: {
        light: APPLE_SYSTEM_COLORS.green.light,
        dark: APPLE_SYSTEM_COLORS.green.dark,
    },
    negative: {
        light: APPLE_SYSTEM_COLORS.red.light,
        dark: APPLE_SYSTEM_COLORS.red.dark,
    },
    neutral: {
        light: APPLE_SYSTEM_COLORS.blue.light,
        dark: APPLE_SYSTEM_COLORS.blue.dark,
    },
} as const;

/**
 * Glass Material Constants
 * Blur values in pixels for each theme variant.
 */
export const GLASS_BLUR = {
    // Material Type -> Theme Variant -> Blur Value (px)
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

/**
 * Typography Constants (Apple SF Pro system)
 */
export const TYPOGRAPHY = {
    // Font families
    fontFamily: {
        display: '"SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
        text: '"SF Pro Text", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
        mono: '"SF Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    },
    // Font sizes for charts/data visualization
    chart: {
        label: 11, // Axis labels, legend
        value: 13, // Data values
        title: 15, // Chart title
    },
} as const;

/**
 * Spacing Constants (Apple 4pt Grid)
 */
export const SPACING = {
    narrow: 16,   // Component internal padding
    standard: 44, // Navigation heights, touch targets
    wide: 60,     // Section spacing, page margins
    base: 4,      // Base unit
} as const;

/**
 * Border Radius Constants
 */
export const RADIUS = {
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32, // Default for glass containers
} as const;

// ============================================================================
// Helper functions for runtime theme detection
// ============================================================================

/**
 * Get the current color mode from the document
 * Falls back to 'dark' if not detectable (server-side rendering)
 */
export function getColorMode(): 'light' | 'dark' {
    if (typeof document === 'undefined') return 'dark';
    return document.documentElement.classList.contains('light') ? 'light' : 'dark';
}

/**
 * Get a system color for the current theme
 */
export function getSystemColor(color: keyof typeof APPLE_SYSTEM_COLORS): string {
    const mode = getColorMode();
    return APPLE_SYSTEM_COLORS[color][mode];
}

/**
 * Get the chart color palette for the current theme
 */
export function getChartPalette(): readonly string[] {
    const mode = getColorMode();
    return CHART_COLOR_PALETTE[mode];
}

/**
 * Get financial semantic colors for the current theme
 */
export function getFinancialColors(): { positive: string; negative: string; neutral: string } {
    const mode = getColorMode();
    return {
        positive: FINANCIAL_COLORS.positive[mode],
        negative: FINANCIAL_COLORS.negative[mode],
        neutral: FINANCIAL_COLORS.neutral[mode],
    };
}

// ============================================================================
// React Hook for theme-aware colors
// ============================================================================

import { useEffect, useState } from 'react';

/**
 * Hook to get theme-aware system colors
 * Automatically updates when theme changes.
 */
export function useSystemColors() {
    const [mode, setMode] = useState<'light' | 'dark'>(getColorMode);

    useEffect(() => {
        // Observe class changes on documentElement for theme switches
        const observer = new MutationObserver(() => {
            setMode(getColorMode());
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        return () => observer.disconnect();
    }, []);

    return {
        mode,
        colors: APPLE_SYSTEM_COLORS,
        chartPalette: CHART_COLOR_PALETTE[mode],
        financial: {
            positive: FINANCIAL_COLORS.positive[mode],
            negative: FINANCIAL_COLORS.negative[mode],
            neutral: FINANCIAL_COLORS.neutral[mode],
        },
        getColor: (color: keyof typeof APPLE_SYSTEM_COLORS) => APPLE_SYSTEM_COLORS[color][mode],
    };
}

/**
 * Hook specifically for chart colors
 */
export function useChartColors() {
    const { mode, chartPalette, financial, getColor } = useSystemColors();

    return {
        mode,
        palette: chartPalette,
        primary: getColor('blue'),
        positive: financial.positive,
        negative: financial.negative,
        // Helper to get color at index with wrap-around
        getColorAt: (index: number) => chartPalette[index % chartPalette.length],
    };
}
