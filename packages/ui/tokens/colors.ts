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
