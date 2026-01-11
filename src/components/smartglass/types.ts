/**
 * SmartGlass Types
 * 
 * AI-enhanced component interfaces for context-aware UI components.
 */

import React from 'react';

// ============================================================================
// Core Types
// ============================================================================

/**
 * SmartGlass Enhancement Options
 */
export interface SmartEnhancementOptions {
    /** Enable auto-summarization */
    summarize?: boolean;
    /** Maximum summary length in characters */
    maxSummaryLength?: number;
    /** Enable smart suggestions */
    suggestions?: boolean;
    /** Enable pattern detection (for tables/charts) */
    patterns?: boolean;
    /** Enable anomaly detection (for tables/charts) */
    anomalies?: boolean;
    /** Enable insights generation (for charts) */
    insights?: boolean;
    /** Custom AI prompt for enhancement */
    aiPrompt?: string;
    /** Whether to auto-enhance or wait for user trigger */
    autoEnhance?: boolean;
    /** Whether enhancement is enabled */
    enabled?: boolean;
    /** Model to use for enhancement */
    model?: 'gemini-3.5-flash' | 'claude-sonnet-4';
}

/**
 * SmartGlass Enhancement Result
 */
export interface SmartResult<T = unknown> {
    /** Enhanced content */
    enhanced: T;
    /** AI-generated summary */
    summary?: string;
    /** Suggested actions */
    suggestions?: SmartSuggestion[];
    /** Detected patterns */
    patterns?: SmartPattern[];
    /** Detected anomalies */
    anomalies?: SmartAnomaly[];
    /** Chart-specific insights */
    insights?: SmartInsight[];
    /** Processing metadata */
    meta: SmartMeta;
}

/**
 * Smart Suggestion
 */
export interface SmartSuggestion {
    /** Action label */
    label: string;
    /** Action callback */
    action: () => void;
    /** Confidence score 0-1 */
    confidence: number;
    /** Suggestion type */
    type?: 'primary' | 'secondary' | 'destructive';
}

/**
 * Smart Pattern Detection
 */
export interface SmartPattern {
    /** Pattern name */
    name: string;
    /** Confidence score 0-1 */
    confidence: number;
    /** Pattern description */
    description: string;
    /** Affected data points */
    indices?: number[];
}

/**
 * Smart Anomaly Detection
 */
export interface SmartAnomaly {
    /** Row/index identifier */
    index: number | string;
    /** Anomaly severity */
    severity: 'low' | 'medium' | 'high' | 'critical';
    /** Anomaly description */
    description: string;
    /** Expected vs actual value */
    expected?: string;
    actual?: string;
}

/**
 * Smart Chart Insight
 */
export interface SmartInsight {
    /** Insight type */
    type: 'trend' | 'correlation' | 'outlier' | 'change-point' | 'forecast';
    /** Insight description */
    description: string;
    /** Confidence score */
    confidence: number;
    /** Affected data range */
    range?: { start: number; end: number };
    /** Suggested action */
    recommendation?: string;
}

/**
 * Processing Metadata
 */
export interface SmartMeta {
    /** Enhancement timestamp */
    enhancedAt: Date;
    /** Model used */
    modelUsed: string;
    /** Tokens consumed */
    tokensUsed: number;
    /** Processing time in ms */
    processingTime: number;
    /** Cache hit status */
    cached?: boolean;
}

// ============================================================================
// Component Props
// ============================================================================

/**
 * Base SmartGlass Component Props
 */
export interface SmartGlassProps<T> {
    /** The content to enhance */
    content: T;
    /** Enhancement options */
    options?: SmartEnhancementOptions;
    /** Callback when enhancement completes */
    onEnhance?: (result: SmartResult<T>) => void;
    /** Callback on error */
    onError?: (error: Error) => void;
    /** Custom loading component */
    loading?: React.ReactNode;
    /** Custom error component */
    error?: React.ReactNode;
    /** Whether enhancement is enabled */
    enabled?: boolean;
    /** CSS class name */
    className?: string;
}

// ============================================================================
// Card Content Types
// ============================================================================

/**
 * SmartGlassCard Content
 */
export interface SmartCardContent {
    /** Card title */
    title: string;
    /** Card body text */
    body: string;
    /** Tags for categorization */
    tags?: string[];
    /** Optional footer text */
    footer?: string;
    /** Metadata object */
    metadata?: Record<string, unknown>;
    /** Image URL (optional) */
    imageUrl?: string;
}

// ============================================================================
// Table Content Types
// ============================================================================

/**
 * SmartGlassTable Column Definition
 */
export interface SmartTableColumn {
    /** Column key */
    key: string;
    /** Column header */
    header: string;
    /** Data type for pattern detection */
    type?: 'text' | 'number' | 'date' | 'currency' | 'percentage' | 'boolean';
    /** Format pattern */
    format?: string;
}

/**
 * SmartGlassTable Content
 */
export interface SmartTableContent {
    /** Column definitions */
    columns: SmartTableColumn[];
    /** Table rows */
    rows: Array<Record<string, unknown>>;
    /** Primary key column */
    primaryKey?: string;
}

// ============================================================================
// Chart Content Types
// ============================================================================

/**
 * SmartGlassChart Data Point
 */
export interface SmartChartDataPoint {
    /** X-axis value */
    x: number | string | Date;
    /** Y-axis value */
    y: number;
    /** Label (optional) */
    label?: string;
    /** Metadata (optional) */
    metadata?: Record<string, unknown>;
}

/**
 * SmartGlassChart Content
 */
export interface SmartChartContent {
    /** Chart title */
    title: string;
    /** Data points */
    data: SmartChartDataPoint[];
    /** Chart type */
    type: 'line' | 'bar' | 'area' | 'scatter' | 'candlestick';
    /** X-axis label */
    xLabel?: string;
    /** Y-axis label */
    yLabel?: string;
    /** Color scheme */
    colors?: string[];
}

// ============================================================================
// API Types
// ============================================================================

/**
 * Smart Enhancement API Request
 */
export interface SmartEnhanceRequest {
    /** Content type */
    contentType: 'card' | 'table' | 'chart' | 'text';
    /** Content to enhance */
    content: unknown;
    /** Enhancement options */
    options: SmartEnhancementOptions;
}

/**
 * Smart Enhancement API Response
 */
export interface SmartEnhanceResponse {
    /** Enhancement result */
    result: SmartResult<unknown>;
    /** Success status */
    success: boolean;
    /** Error message (if any) */
    error?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * SmartGlass Component Render Props
 */
export interface SmartRenderProps<T> {
    /** Original content */
    content: T;
    /** Enhancement result */
    result: SmartResult<T> | null;
    /** Loading state */
    loading: boolean;
    /** Error state */
    error: Error | null;
    /** Manual trigger enhancement */
    enhance: () => Promise<SmartResult<T> | undefined>;
    /** Clear enhancement */
    clear: () => void;
    /** Force refresh */
    refresh: () => Promise<void>;
    /** Whether enhancement has been applied */
    isEnhanced: boolean;
}

/**
 * Pattern Detection Result
 */
export interface PatternDetectionResult {
    patterns: SmartPattern[];
    anomalies: SmartAnomaly[];
    trends: SmartPattern[];
}
