/**
 * Wrapped Component Exports
 *
 * These exports wrap complex components with ErrorBoundary protection.
 * Use these instead of direct imports for production safety.
 *
 * @see ADR-005: Session-Scoped LiquidClient
 * @see docs/IMPLEMENTATION_PLAN.md - Item 1.3 ErrorBoundary Expansion
 */

import { withErrorBoundary } from '../feedback/ErrorBoundary';

// Feature Components
import { GlassEditor as GlassEditorRaw } from '../features/GlassEditor';
import { GlassKanban as GlassKanbanRaw } from '../features/GlassKanban';
import { GlassPayment as GlassPaymentRaw } from '../features/GlassPayment';
import { GlassTerminal as GlassTerminalRaw } from '../features/GlassTerminal';
import { GlassFileTree as GlassFileTreeRaw } from '../features/GlassFileTree';
import { GlassFilePreview as GlassFilePreviewRaw } from '../features/GlassFilePreview';
import { GlassVoice as GlassVoiceRaw } from '../features/GlassVoice';

// Data Display Components
import { GlassDataTable as GlassDataTableRaw } from '../data-display/GlassDataTable';
import { GlassTimeline as GlassTimelineRaw } from '../data-display/GlassTimeline';
import { GlassCarousel as GlassCarouselRaw } from '../data-display/GlassCarousel';

// Agentic Components
import { GlassAgent as GlassAgentRaw } from '../agentic/GlassAgent';
import { GlassCopilot as GlassCopilotRaw } from '../agentic/GlassCopilot';
import { GlassDynamicUI as GlassDynamicUIRaw } from '../agentic/GlassDynamicUI';
import { GlassPrompt as GlassPromptRaw } from '../agentic/GlassPrompt';

// ============ Feature Components (Wrapped) ============

export const GlassEditorSafe = withErrorBoundary(GlassEditorRaw, {
    componentName: 'GlassEditor'
});

export const GlassKanbanSafe = withErrorBoundary(GlassKanbanRaw, {
    componentName: 'GlassKanban'
});

export const GlassPaymentSafe = withErrorBoundary(GlassPaymentRaw, {
    componentName: 'GlassPayment'
});

export const GlassTerminalSafe = withErrorBoundary(GlassTerminalRaw, {
    componentName: 'GlassTerminal'
});

export const GlassFileTreeSafe = withErrorBoundary(GlassFileTreeRaw, {
    componentName: 'GlassFileTree'
});

export const GlassFilePreviewSafe = withErrorBoundary(GlassFilePreviewRaw, {
    componentName: 'GlassFilePreview'
});

export const GlassVoiceSafe = withErrorBoundary(GlassVoiceRaw, {
    componentName: 'GlassVoice'
});

// ============ Data Display Components (Wrapped) ============

export const GlassDataTableSafe = withErrorBoundary(GlassDataTableRaw, {
    componentName: 'GlassDataTable'
});

export const GlassTimelineSafe = withErrorBoundary(GlassTimelineRaw, {
    componentName: 'GlassTimeline'
});

export const GlassCarouselSafe = withErrorBoundary(GlassCarouselRaw, {
    componentName: 'GlassCarousel'
});

// ============ Agentic Components (Wrapped) ============

export const GlassAgentSafe = withErrorBoundary(GlassAgentRaw, {
    componentName: 'GlassAgent'
});

export const GlassCopilotSafe = withErrorBoundary(GlassCopilotRaw, {
    componentName: 'GlassCopilot'
});

export const GlassDynamicUISafe = withErrorBoundary(GlassDynamicUIRaw, {
    componentName: 'GlassDynamicUI'
});

export const GlassPromptSafe = withErrorBoundary(GlassPromptRaw, {
    componentName: 'GlassPrompt'
});

// ============ Re-export Raw Components for Testing ============

export {
    GlassEditorRaw,
    GlassKanbanRaw,
    GlassPaymentRaw,
    GlassTerminalRaw,
    GlassFileTreeRaw,
    GlassFilePreviewRaw,
    GlassVoiceRaw,
    GlassDataTableRaw,
    GlassTimelineRaw,
    GlassCarouselRaw,
    GlassAgentRaw,
    GlassCopilotRaw,
    GlassDynamicUIRaw,
    GlassPromptRaw
};
