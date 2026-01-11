import { lazy, Suspense, ReactNode } from 'react';
import { ErrorBoundary } from '../components/feedback/ErrorBoundary';

// Simple lazy wrapper (no type constraints for flexibility)
export function lazyImport(importer: () => Promise<any>) {
    return lazy(importer);
}

// Default fallback for loading states
const LoadingFallback = ({ height = 'h-64' }: { height?: string }) => (
    <div className={`animate-pulse bg-glass-surface rounded-lg ${height}`} />
);

// Default fallback for error states
const ErrorFallback = ({ componentName }: { componentName: string }) => (
    <div className="flex items-center justify-center p-4 rounded-lg bg-red-50/50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
        <p className="text-red-600 dark:text-red-400 text-sm">
            Unable to load {componentName}
        </p>
    </div>
);

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

// Helper wrapper for lazy charts with ErrorBoundary
export function LazyChart({ component, fallback, errorFallback, ...props }: {
    component: keyof typeof lazyCharts;
    fallback?: ReactNode;
    errorFallback?: ReactNode;
    [key: string]: unknown;
}) {
    const LazyComponent = lazyCharts[component];
    return (
        <ErrorBoundary
            fallback={errorFallback || <ErrorFallback componentName={component} />}
            componentName={component}
            level="component"
        >
            <Suspense fallback={fallback || <LoadingFallback height="h-64" />}>
                <LazyComponent {...(props as object)} />
            </Suspense>
        </ErrorBoundary>
    );
}

// Helper wrapper for lazy features with ErrorBoundary
export function LazyFeature({ component, fallback, errorFallback, ...props }: {
    component: keyof typeof lazyFeatures;
    fallback?: ReactNode;
    errorFallback?: ReactNode;
    [key: string]: unknown;
}) {
    const LazyComponent = lazyFeatures[component];
    return (
        <ErrorBoundary
            fallback={errorFallback || <ErrorFallback componentName={component} />}
            componentName={component}
            level="component"
        >
            <Suspense fallback={fallback || <LoadingFallback height="h-96" />}>
                <LazyComponent {...(props as object)} />
            </Suspense>
        </ErrorBoundary>
    );
}

// Helper wrapper for lazy agents with ErrorBoundary
export function LazyAgent({ component, fallback, errorFallback, ...props }: {
    component: keyof typeof lazyAgents;
    fallback?: ReactNode;
    errorFallback?: ReactNode;
    [key: string]: unknown;
}) {
    const LazyComponent = lazyAgents[component];
    return (
        <ErrorBoundary
            fallback={errorFallback || <ErrorFallback componentName={component} />}
            componentName={component}
            level="component"
        >
            <Suspense fallback={fallback || <LoadingFallback height="h-48" />}>
                <LazyComponent {...(props as object)} />
            </Suspense>
        </ErrorBoundary>
    );
}
