/**
 * A2A Protocol Server Types
 *
 * Server-side types for A2A protocol support.
 * Based on A2A Protocol DRAFT v1.0 Specification
 * @see https://a2a-protocol.org/latest/specification/
 * 
 * These types are used by the WebSocket and HTTP handlers.
 */

// ============================================================================
// Protocol Version Constants (v1.0)
// ============================================================================

/** Current A2A Protocol version */
export const A2A_PROTOCOL_VERSION = '1.0';

/** Supported A2A protocol versions (for negotiation) */
export const A2A_SUPPORTED_VERSIONS = ['1.0', '0.3.0', '0.2.6'] as const;

/** A2A version header names */
export const A2A_HEADERS = {
    VERSION: 'A2A-Version',
    SUPPORTED_VERSIONS: 'A2A-Supported-Versions',
    REQUEST_ID: 'A2A-Request-Id',
} as const;

// ============================================================================
// Task Types
// ============================================================================

export type TaskState =
    | 'submitted'
    | 'working'
    | 'input_required'
    | 'auth_required'
    | 'completed'
    | 'failed'
    | 'cancelled'
    | 'rejected';

export const TERMINAL_STATES: TaskState[] = ['completed', 'failed', 'cancelled', 'rejected'];

export type MessageRole = 'user' | 'agent';

// ============================================================================
// Part Types
// ============================================================================

export interface TextPart {
    type: 'text';
    text: string;
}

export interface FilePart {
    type: 'file';
    file: {
        name: string;
        mimeType: string;
        bytes?: string;
        uri?: string;
    };
}

export interface DataPart {
    type: 'data';
    data: Record<string, unknown>;
}

export interface A2UIPart {
    type: 'a2ui';
    a2ui: A2UIMessage[];
}

export type Part = TextPart | FilePart | DataPart | A2UIPart;

// ============================================================================
// Message Types
// ============================================================================

export interface A2AMessage {
    role: MessageRole;
    parts: Part[];
    metadata?: Record<string, unknown>;
}

export interface Artifact {
    name?: string;
    description?: string;
    parts: Part[];
    index?: number;
    append?: boolean;
    lastChunk?: boolean;
}

export interface TaskStatus {
    state: TaskState;
    message?: A2AMessage;
    timestamp: string;
}

export interface Task {
    id: string;
    contextId: string;
    status: TaskStatus;
    artifacts?: Artifact[];
    history?: A2AMessage[];
    metadata?: Record<string, unknown>;
}

// ============================================================================
// A2UI Message Types
// ============================================================================

export type A2UIMessageType =
    | 'beginRendering'
    | 'surfaceUpdate'
    | 'dataModelUpdate'
    | 'deleteSurface';

export interface A2UIMessageBase {
    type: A2UIMessageType;
    surfaceId: string;
}

export interface BeginRenderingMessage extends A2UIMessageBase {
    type: 'beginRendering';
    rootComponentId: string;
    styling?: Record<string, unknown>;
}

export interface SurfaceUpdateMessage extends A2UIMessageBase {
    type: 'surfaceUpdate';
    components: A2UIComponent[];
}

export interface DataModelUpdateMessage extends A2UIMessageBase {
    type: 'dataModelUpdate';
    data: Record<string, unknown>;
}

export interface DeleteSurfaceMessage extends A2UIMessageBase {
    type: 'deleteSurface';
}

export type A2UIMessage =
    | BeginRenderingMessage
    | SurfaceUpdateMessage
    | DataModelUpdateMessage
    | DeleteSurfaceMessage;

export interface A2UIComponent {
    id: string;
    component: Record<string, unknown>;
    weight?: number;
}

// ============================================================================
// Agent Card Types (v1.0 Enhanced)
// ============================================================================

export interface AgentSkill {
    id: string;
    name: string;
    description: string;
    tags?: string[];
    examples?: string[];
}

export interface AgentCapabilities {
    streaming?: boolean;
    pushNotifications?: boolean;
    stateTransitionHistory?: boolean;
}

export interface A2UIExtension {
    version: string;
    supportedComponents: string[];
}

// v1.0: Protocol binding declarations
export interface ProtocolBindings {
    /** JSON-RPC over HTTP endpoint */
    jsonRpc?: {
        version: '2.0';
        endpoint?: string;
    };
    /** gRPC service endpoint */
    grpc?: {
        version: string;
        endpoint?: string;
        protoUrl?: string;
    };
    /** REST API endpoint */
    rest?: {
        version: string;
        endpoint?: string;
        openApiUrl?: string;
    };
}

// v1.0: Security scheme declarations
export interface SecurityScheme {
    /** OAuth 2.0 configuration */
    oauth2?: {
        flows: {
            clientCredentials?: {
                tokenUrl: string;
                scopes?: Record<string, string>;
            };
            authorizationCode?: {
                authorizationUrl: string;
                tokenUrl: string;
                scopes?: Record<string, string>;
            };
        };
    };
    /** API Key authentication */
    apiKey?: {
        in: 'header' | 'query';
        name: string;
    };
    /** Bearer token (JWT) */
    bearer?: {
        format?: 'JWT';
    };
}

export interface AgentCard {
    name: string;
    description: string;
    url: string;
    version: string;
    /** A2A protocol version(s) supported */
    protocolVersion?: string;
    supportedVersions?: string[];
    documentationUrl?: string;
    provider?: {
        organization: string;
        url?: string;
    };
    capabilities?: AgentCapabilities;
    skills?: AgentSkill[];
    defaultInputModes?: string[];
    defaultOutputModes?: string[];
    /** v1.0: Protocol bindings (JSON-RPC, gRPC, REST) */
    protocols?: ProtocolBindings;
    /** v1.0: Security/authentication schemes */
    securitySchemes?: Record<string, SecurityScheme>;
    /** Required security scheme names */
    security?: string[];
    extensions?: {
        a2ui?: A2UIExtension;
        [key: string]: unknown;
    };
}

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

export interface JsonRpcError {
    code: number;
    message: string;
    data?: unknown;
}

// Standard JSON-RPC error codes
export const JSON_RPC_ERRORS = {
    PARSE_ERROR: { code: -32700, message: 'Parse error' },
    INVALID_REQUEST: { code: -32600, message: 'Invalid Request' },
    METHOD_NOT_FOUND: { code: -32601, message: 'Method not found' },
    INVALID_PARAMS: { code: -32602, message: 'Invalid params' },
    INTERNAL_ERROR: { code: -32603, message: 'Internal error' },
    // A2A-specific errors (v0.3.0)
    TASK_NOT_FOUND: { code: -32001, message: 'Task not found' },
    TASK_CANCELLED: { code: -32002, message: 'Task cancelled' },
    AUTH_REQUIRED: { code: -32003, message: 'Authentication required' },
    // A2A v1.0 enhanced error codes
    VERSION_NOT_SUPPORTED: { code: -32004, message: 'A2A version not supported' },
    RATE_LIMIT_EXCEEDED: { code: -32005, message: 'Rate limit exceeded' },
    TASK_TIMEOUT: { code: -32006, message: 'Task execution timeout' },
    CONTENT_TYPE_NOT_SUPPORTED: { code: -32007, message: 'Content type not supported' },
    UNSUPPORTED_OPERATION: { code: -32008, message: 'Operation not supported for terminal task' },
    PUSH_NOTIFICATION_FAILED: { code: -32009, message: 'Push notification delivery failed' },
} as const;

// ============================================================================
// Request/Response Types
// ============================================================================

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

export interface TaskQueryParams {
    id: string;
    historyLength?: number;
}

export interface TaskListParams {
    contextId?: string;
    state?: TaskState[];
    limit?: number;
    offset?: number;
}

// ============================================================================
// WebSocket Extension
// ============================================================================

export interface A2AWebSocketMessage {
    type: 'a2a';
    method: string;
    id: string | number;
    params?: unknown;
}

export interface A2AWebSocketResponse {
    type: 'a2a';
    id: string | number;
    result?: unknown;
    error?: JsonRpcError;
}

// ============================================================================
// Supported Glass Components for A2UI
// ============================================================================

export const SUPPORTED_A2UI_COMPONENTS = [
    // Layout
    'Row',
    'Column',
    'Card',
    'List',
    'Tabs',
    'Modal',
    // Content
    'Text',
    'Image',
    'Icon',
    'Divider',
    // Interactive
    'Button',
    'TextField',
    'Checkbox',
    'Slider',
    'DateTimeInput',
    'MultipleChoice',
    // Media
    'Video',
    'AudioPlayer',
] as const;

export type SupportedA2UIComponent = typeof SUPPORTED_A2UI_COMPONENTS[number];
