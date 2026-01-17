import { useEffect, useState } from 'react';
import { APPLE_SYSTEM_COLORS, CHART_COLOR_PALETTE, FINANCIAL_COLORS } from './colors';

/**
 * Get the current color mode from the document
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

/**
 * Hook to get theme-aware system colors
 */
export function useSystemColors() {
    const [mode, setMode] = useState<'light' | 'dark'>(getColorMode);

    useEffect(() => {
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
        getColorAt: (index: number) => chartPalette[index % chartPalette.length],
    };
}
