/**
 * useSmartGlass Hook
 * 
 * React hook for AI-enhanced content using Gemini 3.5 Flash.
 */

import { useState, useCallback, useEffect } from 'react';
import {
    SmartEnhancementOptions,
    SmartResult,
    SmartRenderProps,
} from './types';

// ============================================================================
// API Functions
// ============================================================================

/**
 * Call the smart enhancement API
 */
async function callSmartEnhanceAPI<T>(
    content: T,
    contentType: string,
    options: SmartEnhancementOptions
): Promise<SmartResult<T>> {
    const response = await fetch('/api/v1/smart/enhance', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            content,
            contentType,
            options: {
                ...options,
                model: options.model || 'gemini-3.5-flash',
            },
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Enhancement failed');
    }

    const data = await response.json();
    return data.result;
}

/**
 * Generate content hash for caching
 */
/*
function getContentHash(content: unknown): string {
    const str = JSON.stringify(content);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(16);
}
*/

// ============================================================================
// Hook
// ============================================================================

/**
 * SmartGlass Hook
 * 
 * Provides AI enhancement capabilities for any content type.
 * 
 * @param content - The content to enhance
 * @param contentType - Type of content (card, table, chart, text)
 * @param options - Enhancement options
 * @returns SmartGlass render props and methods
 */
export function useSmartGlass<T>(
    content: T,
    contentType: string,
    options: SmartEnhancementOptions = {}
): SmartRenderProps<T> {
    // State
    const [result, setResult] = useState<SmartResult<T> | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Options with defaults and enabled flag
    const opts = {
        model: 'gemini-3.5-flash' as const,
        autoEnhance: true,
        ...options,
    };
    const enabled = options.enabled !== false;

    // Auto-enhance on content change (debounced)
    useEffect(() => {
        if (!opts.autoEnhance || !enabled) return;

        const timer = setTimeout(() => {
            enhance();
        }, 1000); // Debounce 1 second

        return () => clearTimeout(timer);
    }, [JSON.stringify(content), opts.autoEnhance, enabled]);

    /**
     * Trigger enhancement
     */
    const enhance = useCallback(async () => {
        if (!enabled) return;

        setLoading(true);
        setError(null);
        // const startTime = Date.now();

        try {
            // Call API with Gemini 3.5 Flash
            const smartResult = await callSmartEnhanceAPI(
                content,
                contentType,
                opts
            );

            setResult(smartResult);
            return smartResult;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Enhancement failed');
            setError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [content, contentType, opts]);

    /**
     * Clear enhancement
     */
    const clear = useCallback(() => {
        setResult(null);
        setError(null);
        setLoading(false);
    }, []);

    /**
     * Force re-enhancement
     */
    const refresh = useCallback(async () => {
        setResult(null);
        await enhance();
    }, [enhance]);

    return {
        content,
        result,
        loading,
        error,
        enhance,
        clear,
        refresh,
        isEnhanced: result !== null,
    };
}

// ============================================================================
// Specialized Hooks
// ============================================================================

/**
 * Hook for SmartGlassCard
 */
export function useSmartCard(
    content: {
        title: string;
        body: string;
        tags?: string[];
        footer?: string;
        metadata?: Record<string, unknown>;
    },
    options: SmartEnhancementOptions = {}
) {
    return useSmartGlass(content, 'card', {
        summarize: true,
        suggestions: true,
        ...options,
    });
}

/**
 * Hook for SmartGlassTable
 */
export function useSmartTable(
    content: {
        columns: Array<{ key: string; header: string; type?: string }>;
        rows: Array<Record<string, unknown>>;
    },
    options: SmartEnhancementOptions = {}
) {
    return useSmartGlass(content, 'table', {
        patterns: true,
        anomalies: true,
        ...options,
    });
}

/**
 * Hook for SmartGlassChart
 */
export function useSmartChart(
    content: {
        title: string;
        data: Array<{ x: number | string | Date; y: number; label?: string }>;
        type: string;
    },
    options: SmartEnhancementOptions = {}
) {
    return useSmartGlass(content, 'chart', {
        insights: true,
        patterns: true,
        ...options,
    });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format processing time for display
 */
export function formatProcessingTime(ms: number): string {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.round(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

/**
 * Get confidence badge variant
 */
export function getConfidenceVariant(confidence: number): 'success' | 'warning' | 'destructive' {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.5) return 'warning';
    return 'destructive';
}

/**
 * Get anomaly severity color
 */
export function getAnomalyColor(severity: string): string {
    switch (severity) {
        case 'critical':
            return 'text-red-500 bg-red-500/10 border-red-500/30';
        case 'high':
            return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
        case 'medium':
            return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
        case 'low':
        default:
            return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
    }
}
