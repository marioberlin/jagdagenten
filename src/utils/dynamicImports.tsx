import { lazy, Suspense, ReactNode } from 'react';

// Simple lazy wrapper (no type constraints for flexibility)
export function lazyImport(importer: () => Promise<any>) {
    return lazy(importer);
}

// Pre-built lazy imports for heavy chart components
export const lazyCharts = {
    GlassRadarChart: lazyImport(() => import('../components/data-display/GlassRadarChart')),
    GlassPolarAreaChart: lazyImport(() => import('../components/data-display/GlassPolarAreaChart')),
    GlassStackedBarChart: lazyImport(() => import('../components/data-display/GlassStackedBarChart')),
    GlassHeatmap: lazyImport(() => import('../components/data-display/GlassHeatmap')),
    GlassTreemap: lazyImport(() => import('../components/data-display/GlassTreemap')),
    GlassFunnelChart: lazyImport(() => import('../components/data-display/GlassFunnelChart')),
    GlassCandlestickChart: lazyImport(() => import('../components/data-display/GlassCandlestickChart')),
    GlassScatterChart: lazyImport(() => import('../components/data-display/GlassScatterChart')),
    GlassGauge: lazyImport(() => import('../components/data-display/GlassGauge')),
    GlassSankey: lazyImport(() => import('../components/data-display/GlassSankey')),
    GlassDonutChart: lazyImport(() => import('../components/data-display/GlassDonutChart')),
    GlassCompare: lazyImport(() => import('../components/data-display/GlassCompare')),
};

// Heavy feature components
export const lazyFeatures = {
    GlassKanban: lazyImport(() => import('../components/features/GlassKanban')),
    GlassSpreadsheet: lazyImport(() => import('../components/features/GlassSpreadsheet')),
    GlassFlow: lazyImport(() => import('../components/features/GlassFlow')),
    GlassFileTree: lazyImport(() => import('../components/features/GlassFileTree')),
    GlassEditor: lazyImport(() => import('../components/features/GlassEditor')),
    GlassChat: lazyImport(() => import('../components/features/GlassChat')),
    GlassCollaborativeChat: lazyImport(() => import('../components/features/GlassCollaborativeChat')),
    GlassPayment: lazyImport(() => import('../components/features/GlassPayment')),
    GlassTerminal: lazyImport(() => import('../components/features/GlassTerminal')),
    GlassFilePreview: lazyImport(() => import('../components/features/GlassFilePreview')),
    GlassDataTable: lazyImport(() => import('../components/data-display/GlassDataTable')),
    // Heavy components requested by user
    GlassChart: lazyImport(() => import('../components/data-display/GlassChart')),
    GlassEmojiPicker: lazyImport(() => import('../components/forms/GlassEmojiPicker')),
};

// AI/Agentic components
export const lazyAgents = {
    GlassAgent: lazyImport(() => import('../components/agentic/GlassAgent')),
    GlassCopilot: lazyImport(() => import('../components/agentic/GlassCopilot')),
    GlassDynamicUI: lazyImport(() => import('../components/agentic/GlassDynamicUI')),
    GlassPrompt: lazyImport(() => import('../components/agentic/GlassPrompt')),
};

// Helper wrapper for lazy charts
export function LazyChart({ component, fallback, ...props }: {
    component: keyof typeof lazyCharts;
    fallback?: ReactNode;
    props?: Record<string, unknown>;
}) {
    const LazyComponent = lazyCharts[component];
    return (
        <Suspense fallback={fallback || <div className="animate-pulse bg-glass-surface rounded-lg h-64" />}>
            <LazyComponent {...(props as object)} />
        </Suspense>
    );
}

// Helper wrapper for lazy features
export function LazyFeature({ component, fallback, ...props }: {
    component: keyof typeof lazyFeatures;
    fallback?: ReactNode;
    props?: Record<string, unknown>;
}) {
    const LazyComponent = lazyFeatures[component];
    return (
        <Suspense fallback={fallback || <div className="animate-pulse bg-glass-surface rounded-lg h-96" />}>
            <LazyComponent {...(props as object)} />
        </Suspense>
    );
}
