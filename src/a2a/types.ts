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
import { a2ui as a2uiModule, v1 as v1Module } from '@liquidcrypto/a2a-sdk';
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

/** Agent capabilities */
export type AgentCapabilities = v1Types.AgentCapabilities;

/** Agent skill definition */
export type AgentSkill = v1Types.AgentSkill;

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
 */
export type BeginRenderingMessage = a2uiTypes.A2UIBeginRenderingMessage;

/**
 * Surface update message - updates component tree
 */
export type SurfaceUpdateMessage = a2uiTypes.A2UISurfaceUpdateMessage;

/**
 * Set model message - updates data bindings
 * (Note: SDK uses 'setModel', legacy used 'dataModelUpdate')
 */
export type DataModelUpdateMessage = a2uiTypes.A2UISetModelMessage;

/**
 * A2UI Component - re-exported from SDK
 */
export type A2UIComponent = a2uiTypes.A2UIComponent;

/**
 * Component props union type
 */
export type ComponentType = a2uiTypes.A2UIComponentProps;

/**
 * Text value binding type from SDK
 */
export type A2UITextValue = a2uiTypes.A2UITextValue;

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
 * Convert SDK A2UITextValue to legacy DataBinding format
 */
export function textValueToDataBinding(value: a2uiTypes.A2UITextValue): DataBinding<string> {
    if (typeof value === 'string') {
        return { literalString: value };
    }
    if ('literalString' in value) {
        return { literalString: value.literalString };
    }
    if ('path' in value) {
        return { path: value.path };
    }
    return { literalString: '' };
}

/**
 * Resolve an A2UI text value to a string
 * Re-exported from SDK for convenience
 */
export const resolveTextValue = a2uiModule.resolveTextValue;

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
export type TextSemantic = a2uiTypes.A2UITextSemantic;

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
