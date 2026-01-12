/**
 * A2A (Agent-to-Agent) Protocol Types
 *
 * Based on A2A Protocol v1.0 Specification
 * @see https://a2a-protocol.org
 *
 * This module provides TypeScript types for A2A protocol compatibility,
 * enabling LiquidCrypto to communicate with external A2A-compliant agents.
 */

// ============================================================================
// Core A2A Types
// ============================================================================

/**
 * Task states in the A2A lifecycle
 */
export type TaskState =
    | 'submitted'
    | 'working'
    | 'input_required'
    | 'auth_required'
    | 'completed'
    | 'failed'
    | 'cancelled'
    | 'rejected';

/**
 * Terminal states where no further transitions occur
 */
export const TERMINAL_STATES: TaskState[] = ['completed', 'failed', 'cancelled', 'rejected'];

/**
 * Message roles in A2A communication
 */
export type MessageRole = 'user' | 'agent';

/**
 * Part types for message content
 */
export interface TextPart {
    type: 'text';
    text: string;
}

export interface FilePart {
    type: 'file';
    file: {
        name: string;
        mimeType: string;
        bytes?: string; // base64 encoded
        uri?: string;
    };
}

export interface DataPart {
    type: 'data';
    data: Record<string, unknown>;
}

/**
 * A2UI Part for UI payloads
 */
export interface A2UIPart {
    type: 'a2ui';
    a2ui: A2UIMessage[];
}

export type Part = TextPart | FilePart | DataPart | A2UIPart;

/**
 * A2A Message structure
 */
export interface A2AMessage {
    role: MessageRole;
    parts: Part[];
    metadata?: Record<string, unknown>;
}

/**
 * Artifact produced by agent
 */
export interface Artifact {
    name?: string;
    description?: string;
    parts: Part[];
    index?: number;
    append?: boolean;
    lastChunk?: boolean;
}

/**
 * Task status information
 */
export interface TaskStatus {
    state: TaskState;
    message?: A2AMessage;
    timestamp: string;
}

/**
 * A2A Task structure
 */
export interface Task {
    id: string;
    contextId: string;
    status: TaskStatus;
    artifacts?: Artifact[];
    history?: A2AMessage[];
    metadata?: Record<string, unknown>;
}

// ============================================================================
// Agent Card Types
// ============================================================================

/**
 * Skill definition in Agent Card
 */
export interface AgentSkill {
    id: string;
    name: string;
    description: string;
    tags?: string[];
    examples?: string[];
    inputModes?: string[];
    outputModes?: string[];
}

/**
 * Security scheme for authentication
 */
export interface SecurityScheme {
    type: 'http' | 'oauth2' | 'apiKey' | 'openIdConnect';
    scheme?: string; // for http type
    bearerFormat?: string;
    flows?: Record<string, unknown>; // for oauth2
    in?: 'header' | 'query' | 'cookie'; // for apiKey
    name?: string; // for apiKey
}

/**
 * Agent capabilities
 */
export interface AgentCapabilities {
    streaming?: boolean;
    pushNotifications?: boolean;
    stateTransitionHistory?: boolean;
}

/**
 * A2UI extension capabilities
 */
export interface A2UIExtension {
    version: string;
    supportedComponents: string[];
    customComponents?: Record<string, unknown>;
}

/**
 * Agent Card - metadata describing an agent's capabilities
 */
export interface AgentCard {
    name: string;
    description: string;
    url: string;
    version: string;
    documentationUrl?: string;
    provider?: {
        organization: string;
        url?: string;
    };
    capabilities?: AgentCapabilities;
    skills?: AgentSkill[];
    securitySchemes?: Record<string, SecurityScheme>;
    security?: Array<Record<string, string[]>>;
    defaultInputModes?: string[];
    defaultOutputModes?: string[];
    extensions?: {
        a2ui?: A2UIExtension;
        [key: string]: unknown;
    };
}

// ============================================================================
// A2UI Message Types (v0.8)
// ============================================================================

/**
 * A2UI message types for UI generation
 */
export type A2UIMessageType =
    | 'beginRendering'
    | 'surfaceUpdate'
    | 'dataModelUpdate'
    | 'deleteSurface';

/**
 * Base A2UI message structure
 */
export interface A2UIMessageBase {
    type: A2UIMessageType;
    surfaceId: string;
}

/**
 * Begin rendering message - initializes a new UI surface
 */
export interface BeginRenderingMessage extends A2UIMessageBase {
    type: 'beginRendering';
    rootComponentId: string;
    styling?: {
        primaryColor?: string;
        fontFamily?: string;
        [key: string]: unknown;
    };
}

/**
 * Surface update message - updates component tree
 */
export interface SurfaceUpdateMessage extends A2UIMessageBase {
    type: 'surfaceUpdate';
    components: A2UIComponent[];
}

/**
 * Data model update message - updates data bindings
 */
export interface DataModelUpdateMessage extends A2UIMessageBase {
    type: 'dataModelUpdate';
    data: Record<string, unknown>;
}

/**
 * Delete surface message - removes a UI surface
 */
export interface DeleteSurfaceMessage extends A2UIMessageBase {
    type: 'deleteSurface';
}

export type A2UIMessage =
    | BeginRenderingMessage
    | SurfaceUpdateMessage
    | DataModelUpdateMessage
    | DeleteSurfaceMessage;

// ============================================================================
// A2UI Component Types
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
export type TextSemantic = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'caption' | 'body';

/**
 * TextField input types
 */
export type TextFieldType = 'shortText' | 'longText' | 'number' | 'date' | 'obscured';

/**
 * Data binding - either literal or path reference
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

// Component definitions
export interface TextComponent {
    Text: {
        text: DataBinding<string>;
        semantic?: TextSemantic;
    };
}

export interface ImageComponent {
    Image: {
        src: DataBinding<string>;
        alt?: DataBinding<string>;
        width?: number;
        height?: number;
    };
}

export interface IconComponent {
    Icon: {
        name: DataBinding<string>;
        size?: number;
    };
}

export interface ButtonComponent {
    Button: {
        label: DataBinding<string>;
        action?: A2UIAction;
        primary?: boolean;
        disabled?: DataBinding<boolean>;
    };
}

export interface TextFieldComponent {
    TextField: {
        placeholder?: DataBinding<string>;
        value?: DataBinding<string>;
        inputType?: TextFieldType;
        label?: DataBinding<string>;
        binding?: string; // path to bind value to
    };
}

export interface CheckboxComponent {
    Checkbox: {
        label?: DataBinding<string>;
        checked?: DataBinding<boolean>;
        binding?: string;
    };
}

export interface SliderComponent {
    Slider: {
        min?: number;
        max?: number;
        step?: number;
        value?: DataBinding<number>;
        label?: DataBinding<string>;
        binding?: string;
    };
}

export interface DateTimeInputComponent {
    DateTimeInput: {
        label?: DataBinding<string>;
        value?: DataBinding<string>;
        binding?: string;
    };
}

export interface MultipleChoiceComponent {
    MultipleChoice: {
        label?: DataBinding<string>;
        options: Array<{
            value: string;
            label: DataBinding<string>;
        }>;
        selected?: DataBinding<string>;
        binding?: string;
    };
}

export interface DividerComponent {
    Divider: Record<string, never>;
}

export interface RowComponent {
    Row: {
        children: string[]; // component IDs
        distribution?: Distribution;
        alignment?: Alignment;
    };
}

export interface ColumnComponent {
    Column: {
        children: string[];
        distribution?: Distribution;
        alignment?: Alignment;
    };
}

export interface CardComponent {
    Card: {
        children: string[];
        elevation?: number;
    };
}

export interface ListComponent {
    List: {
        items: DataBinding<unknown[]>;
        template: string; // component ID for template
        direction?: 'vertical' | 'horizontal';
    };
}

export interface TabsComponent {
    Tabs: {
        tabs: Array<{
            title: DataBinding<string>;
            content: string; // component ID
        }>;
    };
}

export interface ModalComponent {
    Modal: {
        title?: DataBinding<string>;
        content: string; // component ID
        open?: DataBinding<boolean>;
    };
}

export interface VideoComponent {
    Video: {
        src: DataBinding<string>;
        autoplay?: boolean;
        controls?: boolean;
    };
}

export interface AudioPlayerComponent {
    AudioPlayer: {
        src: DataBinding<string>;
        autoplay?: boolean;
    };
}

/**
 * Union of all component types
 */
export type ComponentType =
    | TextComponent
    | ImageComponent
    | IconComponent
    | ButtonComponent
    | TextFieldComponent
    | CheckboxComponent
    | SliderComponent
    | DateTimeInputComponent
    | MultipleChoiceComponent
    | DividerComponent
    | RowComponent
    | ColumnComponent
    | CardComponent
    | ListComponent
    | TabsComponent
    | ModalComponent
    | VideoComponent
    | AudioPlayerComponent;

/**
 * A2UI Component structure
 */
export interface A2UIComponent {
    id: string;
    component: ComponentType;
    weight?: number; // flex-grow value
}

// ============================================================================
// JSON-RPC Types for A2A Protocol
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

/**
 * A2A RPC Methods
 */
export type A2AMethod =
    | 'message/send'
    | 'message/stream'
    | 'tasks/get'
    | 'tasks/list'
    | 'tasks/cancel'
    | 'tasks/subscribe'
    | 'tasks/pushNotificationConfig/set'
    | 'tasks/pushNotificationConfig/get'
    | 'tasks/pushNotificationConfig/list'
    | 'tasks/pushNotificationConfig/delete'
    | 'agent/card';

/**
 * Send message request params
 */
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

/**
 * Task query params
 */
export interface TaskQueryParams {
    id: string;
    historyLength?: number;
}

/**
 * Task list params
 */
export interface TaskListParams {
    contextId?: string;
    state?: TaskState[];
    limit?: number;
    offset?: number;
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
