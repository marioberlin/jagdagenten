/**
 * A2A (Agent-to-Agent) Protocol Types
 *
 * Based on A2A Protocol v1.0 Specification
 * @see https://a2a-protocol.org
 *
 * This module re-exports types from the SDK for backward compatibility
 * and provides local type aliases for the legacy codebase.
 */

// Re-export SDK namespaces for convenience
export { v1, a2ui } from '@liquidcrypto/a2a-sdk';
import { v1 as v1Module } from '@liquidcrypto/a2a-sdk';
import type { a2ui as a2uiTypes, v1 as v1Types } from '@liquidcrypto/a2a-sdk';

// ============================================================================
// Core A2A Types (re-exported from SDK v1)
// ============================================================================

/** Agent Card - describes an agent's capabilities */
export type AgentCard = v1Types.AgentCard;

/** A2A Message structure */
export type A2AMessage = v1Types.Message;

/** A2A Task structure */
export type Task = v1Types.Task;

/** Task status information */
export type TaskStatus = v1Types.TaskStatus;

/** Task states in the A2A lifecycle - re-export enum for value access */
export const TaskState = v1Module.TaskState;
export type TaskState = v1Types.TaskState;

/** Artifact produced by agent */
export type Artifact = v1Types.Artifact;

/** Part types for message content */
export type Part = v1Types.Part;
export type TextPart = v1Types.TextPart;
export type FilePart = v1Types.FilePart;
export type DataPart = v1Types.DataPart;

/** Agent capabilities (defined locally - SDK uses different structure) */
export interface AgentCapabilities {
    streaming?: boolean;
    pushNotifications?: boolean;
    stateTransitionHistory?: boolean;
    extensions?: string[];
}

/** Agent skill definition (defined locally - SDK uses different structure) */
export interface AgentSkill {
    id: string;
    name: string;
    description?: string;
    tags?: string[];
    examples?: string[];
    inputSchema?: Record<string, unknown>;
}

/** Message role */
export type MessageRole = 'user' | 'agent';

/** Terminal states */
export const TERMINAL_STATES: v1Types.TaskState[] = [
    v1Module.TaskState.COMPLETED,
    v1Module.TaskState.FAILED,
    v1Module.TaskState.CANCELED,
    v1Module.TaskState.REJECTED,
];

// ============================================================================
// JSON-RPC Types
// ============================================================================

export interface JsonRpcRequest<T = unknown> {
    jsonrpc: '2.0';
    id: string | number;
    method: string;
    params?: T;
}

export interface JsonRpcResponse<T = unknown> {
    jsonrpc: '2.0';
    id: string | number;
    result?: T;
    error?: {
        code: number;
        message: string;
        data?: unknown;
    };
}

/** Send message request params */
export interface SendMessageParams {
    message: A2AMessage;
    configuration?: {
        acceptedOutputModes?: string[];
        historyLength?: number;
        pushNotificationConfig?: {
            url: string;
            token?: string;
        };
    };
}

/** Task query params */
export interface TaskQueryParams {
    id: string;
    historyLength?: number;
}

/** Task list params */
export interface TaskListParams {
    contextId?: string;
    state?: TaskState[];
    limit?: number;
    offset?: number;
}

/** A2UI Part for UI payloads (legacy compatibility) */
export interface A2UIPart {
    type: 'a2ui';
    a2ui: A2UIMessage[];
}

// ============================================================================
// A2UI Message Type Aliases (for backward compatibility)
// ============================================================================

/**
 * A2UI Message - re-exported from SDK
 * This is the canonical type used throughout the application.
 */
export type A2UIMessage = a2uiTypes.A2UIMessage;

/**
 * Begin rendering message - initializes a new UI surface
 * Defined locally since SDK uses different export pattern
 */
export interface BeginRenderingMessage {
    type: 'beginRendering';
    surfaceId: string;
    rootComponentId: string;
    kind?: string;
    styling?: Record<string, unknown>;
}

/**
 * Surface update message - updates component tree
 */
export interface SurfaceUpdateMessage {
    type: 'surfaceUpdate';
    surfaceId: string;
    rootComponent?: A2UIComponent;
    components: A2UIComponent[];
}

/**
 * Set model message - updates data bindings
 */
export interface DataModelUpdateMessage {
    type: 'setModel' | 'dataModelUpdate';
    surfaceId: string;
    model?: Record<string, unknown>;
    data?: Record<string, unknown>;
}

/**
 * A2UI Component - re-exported from SDK
 */
export type A2UIComponent = a2uiTypes.A2UIComponent;

/**
 * Component props union type
 */
export type ComponentType = a2uiTypes.A2UIComponentProps;

/**
 * Text value binding type (defined locally - matches SDK pattern)
 */
export type A2UITextValue =
    | string
    | { literalString: string }
    | { literalNumber: number }
    | { literalBoolean: boolean }
    | { path: string }
    | { template: string };

// ============================================================================
// Data Binding Types (Legacy Compatibility Layer)
// ============================================================================

/**
 * Legacy DataBinding type - maps to SDK A2UITextValue
 * For backward compatibility with existing transformer code.
 */
export interface LiteralBinding<T> {
    literalString?: string;
    literalNumber?: number;
    literalBoolean?: boolean;
    literal?: T;
}

export interface PathBinding {
    path: string;
}

export interface TemplateBinding {
    template: string;
}

export type DataBinding<T = string> = LiteralBinding<T> | PathBinding | TemplateBinding;

/**
 * Convert A2UITextValue to legacy DataBinding format
 */
export function textValueToDataBinding(value: A2UITextValue): DataBinding<string> {
    if (typeof value === 'string') {
        return { literalString: value };
    }
    if ('literalString' in value) {
        return { literalString: value.literalString };
    }
    if ('path' in value) {
        return { path: value.path };
    }
    if ('template' in value) {
        return { template: value.template };
    }
    return { literalString: '' };
}

/**
 * Resolve an A2UI text value to a string
 */
export function resolveTextValue(value: A2UITextValue, model?: Record<string, unknown>): string {
    if (typeof value === 'string') return value;
    if ('literalString' in value) return value.literalString;
    if ('literalNumber' in value) return String(value.literalNumber);
    if ('literalBoolean' in value) return String(value.literalBoolean);
    if ('path' in value && model) {
        const parts = value.path.split('.');
        let result: unknown = model;
        for (const part of parts) {
            if (result && typeof result === 'object') {
                result = (result as Record<string, unknown>)[part];
            }
        }
        return String(result ?? '');
    }
    return '';
}

// ============================================================================
// Legacy Component Type Aliases
// ============================================================================

/**
 * Component alignment options
 */
export type Alignment = 'start' | 'center' | 'end' | 'stretch';

/**
 * Distribution options for layout components
 */
export type Distribution = 'start' | 'center' | 'end' | 'spaceBetween' | 'spaceAround' | 'spaceEvenly';

/**
 * Text semantic hints
 */
export type TextSemantic = 'body' | 'heading' | 'subheading' | 'caption' | 'label' | 'code' | 'emphasis' | 'strong';

/**
 * TextField input types
 */
export type TextFieldType = 'shortText' | 'longText' | 'number' | 'date' | 'obscured';

/**
 * Action triggered by user interaction
 */
export interface A2UIAction {
    submit?: {
        data?: Record<string, unknown>;
    };
    navigate?: {
        url: string;
    };
    custom?: {
        actionId: string;
        data?: Record<string, unknown>;
    };
}

// ============================================================================
// Glass Component Catalog (Security)
// ============================================================================

/**
 * Allowed Glass components for A2UI mapping
 */
export const GLASS_COMPONENT_CATALOG = {
    // Layout
    GlassContainer: { maxChildren: 20, requiresAuth: false },
    GlassCard: { maxChildren: 10, requiresAuth: false },
    GlassStack: { maxChildren: 50, requiresAuth: false },
    GlassGrid: { maxChildren: 100, requiresAuth: false },

    // Display
    GlassText: { maxChildren: 0, requiresAuth: false },
    GlassImage: { maxChildren: 0, requiresAuth: false },
    GlassBadge: { maxChildren: 1, requiresAuth: false },
    GlassAvatar: { maxChildren: 0, requiresAuth: false },
    GlassMetric: { maxChildren: 0, requiresAuth: false },
    GlassDivider: { maxChildren: 0, requiresAuth: false },

    // Forms
    GlassButton: { maxChildren: 1, requiresAuth: false },
    GlassInput: { maxChildren: 0, requiresAuth: false },
    GlassSlider: { maxChildren: 0, requiresAuth: false },
    GlassSwitch: { maxChildren: 0, requiresAuth: false },
    GlassCheckbox: { maxChildren: 0, requiresAuth: false },
    GlassSelect: { maxChildren: 0, requiresAuth: false },
    GlassDatePicker: { maxChildren: 0, requiresAuth: false },

    // Data Display
    GlassChart: { maxChildren: 0, requiresAuth: false },
    GlassDataTable: { maxChildren: 0, requiresAuth: false },
    GlassTimeline: { maxChildren: 0, requiresAuth: false },
    GlassCarousel: { maxChildren: 20, requiresAuth: false },
    GlassMap: { maxChildren: 0, requiresAuth: false },

    // Media
    GlassVideo: { maxChildren: 0, requiresAuth: false },
    GlassAudio: { maxChildren: 0, requiresAuth: false },

    // Agentic (restricted)
    GlassAgent: { maxChildren: 0, requiresAuth: true },
    GlassCopilot: { maxChildren: 0, requiresAuth: true },
} as const;

export type GlassComponentName = keyof typeof GLASS_COMPONENT_CATALOG;
