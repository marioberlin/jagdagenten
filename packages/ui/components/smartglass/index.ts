/**
 * SmartGlass Components Index
 * 
 * AI-enhanced components that provide intelligent content enhancement.
 */

// Types
export * from './types';

// Hooks
export { useSmartGlass, useSmartCard, useSmartTable, useSmartChart } from './useSmartGlass';
export { formatProcessingTime, getConfidenceVariant, getAnomalyColor } from './useSmartGlass';

// Components
export { SmartGlassCard, SmartGlassCardInline } from './SmartGlassCard';

// Re-export common types for convenience
export type {
    SmartEnhancementOptions,
    SmartResult,
    SmartSuggestion,
    SmartPattern,
    SmartAnomaly,
    SmartInsight,
    SmartMeta,
    SmartCardContent,
    SmartTableContent,
    SmartTableColumn,
    SmartChartContent,
    SmartChartDataPoint,
} from './types';
