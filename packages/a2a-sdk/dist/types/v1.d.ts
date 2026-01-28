/**
 * A2A Protocol v1.0 Types
 *
 * This module contains TypeScript interfaces compliant with A2A Protocol v1.0 specification.
 * Key differences from v0.x:
 * - camelCase naming convention for JSON fields
 * - Part discriminator uses member presence instead of 'kind' field
 * - Method names use PascalCase
 * - New fields: protocolVersions, supportedInterfaces, AgentCardSignature
 */
export declare enum Role {
    USER = "user",
    AGENT = "agent"
}
export declare enum TaskState {
    SUBMITTED = "submitted",
    WORKING = "working",
    INPUT_REQUIRED = "input-required",
    COMPLETED = "completed",
    CANCELED = "canceled",
    CANCELLED = "cancelled",
    FAILED = "failed",
    REJECTED = "rejected",
    AUTH_REQUIRED = "auth-required",
    UNKNOWN = "unknown"
}
export type JSONValue = string | number | boolean | null | JSONValue[] | {
    [key: string]: JSONValue;
};
export interface PartMetadata {
    metadata?: Record<string, JSONValue>;
}
/**
 * Text part - discriminated by presence of 'text' member
 */
export interface TextPart extends PartMetadata {
    text: string;
}
/**
 * File content with bytes (base64 encoded)
 */
export interface FileWithBytes {
    bytes: string;
    mimeType?: string;
    name?: string;
}
/**
 * File content with URI reference
 */
export interface FileWithUri {
    uri: string;
    mimeType?: string;
    name?: string;
}
export type FileContent = FileWithBytes | FileWithUri;
/**
 * File part - discriminated by presence of 'file' member
 */
export interface FilePart extends PartMetadata {
    file: FileContent;
}
/**
 * Data part - discriminated by presence of 'data' member
 */
export interface DataPart extends PartMetadata {
    data: Record<string, JSONValue>;
}
/**
 * Union type for all parts - v1.0 uses member presence as discriminator
 */
export type Part = TextPart | FilePart | DataPart;
export declare function isTextPart(part: Part): part is TextPart;
export declare function isFilePart(part: Part): part is FilePart;
export declare function isDataPart(part: Part): part is DataPart;
export interface Artifact {
    artifactId: string;
    name?: string;
    description?: string;
    parts: Part[];
    index?: number;
    append?: boolean;
    lastChunk?: boolean;
    metadata?: Record<string, JSONValue>;
    extensions?: string[];
}
export interface Message {
    messageId: string;
    role: Role;
    parts: Part[];
    contextId?: string;
    taskId?: string;
    referenceTaskIds?: string[];
    extensions?: string[];
    metadata?: Record<string, JSONValue>;
}
export interface MessageSendConfiguration {
    acceptedOutputModes?: string[];
    blocking?: boolean;
    historyLength?: number;
    pushNotificationConfig?: PushNotificationConfig;
}
export interface MessageSendParams {
    message: Message;
    configuration?: MessageSendConfiguration;
    metadata?: Record<string, JSONValue>;
}
export interface TaskStatus {
    state: TaskState;
    message?: Message;
    timestamp?: string;
}
export interface Task {
    id: string;
    contextId: string;
    status: TaskStatus;
    artifacts?: Artifact[];
    history?: Message[];
    metadata?: Record<string, JSONValue>;
}
export interface TaskStatusUpdateEvent {
    taskId: string;
    contextId: string;
    status: TaskStatus;
    final: boolean;
    metadata?: Record<string, JSONValue>;
}
export interface TaskArtifactUpdateEvent {
    taskId: string;
    contextId: string;
    artifact: Artifact;
    metadata?: Record<string, JSONValue>;
}
export type TaskEvent = TaskStatusUpdateEvent | TaskArtifactUpdateEvent;
export declare function isStatusUpdateEvent(event: TaskEvent): event is TaskStatusUpdateEvent;
export declare function isArtifactUpdateEvent(event: TaskEvent): event is TaskArtifactUpdateEvent;
export interface PushNotificationAuthenticationInfo {
    schemes: string[];
    credentials?: string;
}
export interface PushNotificationConfig {
    url: string;
    id?: string;
    token?: string;
    authentication?: PushNotificationAuthenticationInfo;
}
export interface TaskPushNotificationConfig {
    taskId: string;
    pushNotificationConfig: PushNotificationConfig;
}
export type SecuritySchemeIn = 'cookie' | 'header' | 'query';
export interface APIKeySecurityScheme {
    type: 'apiKey';
    name: string;
    in: SecuritySchemeIn;
    description?: string;
}
export interface HTTPAuthSecurityScheme {
    type: 'http';
    scheme: string;
    bearerFormat?: string;
    description?: string;
}
export interface OAuthFlows {
    authorizationCode?: {
        authorizationUrl: string;
        tokenUrl: string;
        refreshUrl?: string;
        scopes: Record<string, string>;
    };
    clientCredentials?: {
        tokenUrl: string;
        refreshUrl?: string;
        scopes: Record<string, string>;
    };
    implicit?: {
        authorizationUrl: string;
        refreshUrl?: string;
        scopes: Record<string, string>;
    };
    password?: {
        tokenUrl: string;
        refreshUrl?: string;
        scopes: Record<string, string>;
    };
}
export interface OAuth2SecurityScheme {
    type: 'oauth2';
    flows: OAuthFlows;
    oauth2MetadataUrl?: string;
    description?: string;
}
export interface OpenIdConnectSecurityScheme {
    type: 'openIdConnect';
    openIdConnectUrl: string;
    description?: string;
}
export interface MutualTLSSecurityScheme {
    type: 'mutualTLS';
    description?: string;
}
export type SecurityScheme = APIKeySecurityScheme | HTTPAuthSecurityScheme | OAuth2SecurityScheme | OpenIdConnectSecurityScheme | MutualTLSSecurityScheme;
export type SecurityRequirement = Record<string, string[]>;
export interface AgentExtension {
    uri: string;
    description?: string;
    required?: boolean;
    params?: Record<string, JSONValue>;
}
export interface AgentCapabilities {
    streaming?: boolean;
    pushNotifications?: boolean;
    stateTransitionHistory?: boolean;
    supportedInterfaces?: string[];
    extensions?: AgentExtension[];
}
export interface AgentInterface {
    url: string;
    transport: string;
}
export interface AgentProvider {
    organization: string;
    url?: string;
}
export interface AgentSkill {
    id: string;
    name: string;
    description: string;
    tags?: string[];
    examples?: string[];
    inputModes?: string[];
    outputModes?: string[];
    security?: SecurityRequirement[];
}
export interface AgentCardSignature {
    signature: string;
    publicKey: string;
    algorithm: 'ed25519' | 'secp256k1';
    timestamp: string;
}
export interface AgentCard {
    name: string;
    url: string;
    version: string;
    protocolVersions: string[];
    description?: string;
    iconUrl?: string;
    documentationUrl?: string;
    provider?: AgentProvider;
    capabilities?: AgentCapabilities;
    skills?: AgentSkill[];
    defaultInputModes?: string[];
    defaultOutputModes?: string[];
    securitySchemes?: Record<string, SecurityScheme>;
    security?: SecurityRequirement[];
    preferredTransport?: string;
    additionalInterfaces?: AgentInterface[];
    supportsAuthenticatedExtendedCard?: boolean;
    agentCardSignature?: AgentCardSignature;
    signatures?: AgentCardSignature[];
}
export interface JSONRPCMessage {
    jsonrpc: '2.0';
    id?: string | number;
}
export interface JSONRPCRequest<T = unknown> extends JSONRPCMessage {
    method: string;
    params?: T;
}
export interface JSONRPCSuccessResponse extends JSONRPCMessage {
    result: JSONValue;
}
export interface JSONRPCError {
    code: number;
    message: string;
    data?: JSONValue;
}
export interface JSONRPCErrorResponse extends JSONRPCMessage {
    error: JSONRPCError;
}
export type JSONRPCResponse = JSONRPCSuccessResponse | JSONRPCErrorResponse;
export declare const V1_METHODS: {
    readonly SEND_MESSAGE: "SendMessage";
    readonly GET_TASK: "GetTask";
    readonly CANCEL_TASK: "CancelTask";
    readonly LIST_TASKS: "ListTasks";
    readonly SET_TASK_PUSH_NOTIFICATION_CONFIG: "SetTaskPushNotificationConfig";
    readonly GET_TASK_PUSH_NOTIFICATION_CONFIG: "GetTaskPushNotificationConfig";
    readonly DELETE_TASK_PUSH_NOTIFICATION_CONFIG: "DeleteTaskPushNotificationConfig";
    readonly RESUBSCRIBE: "Resubscribe";
    readonly GET_AUTHENTICATED_EXTENDED_CARD: "GetAuthenticatedExtendedCard";
};
export interface TaskIdParams {
    id: string;
    metadata?: Record<string, JSONValue>;
}
export interface TaskQueryParams extends TaskIdParams {
    historyLength?: number;
}
export interface SendMessageRequest extends JSONRPCRequest<MessageSendParams> {
    method: typeof V1_METHODS.SEND_MESSAGE;
    params: MessageSendParams;
}
export interface GetTaskRequest extends JSONRPCRequest<TaskQueryParams> {
    method: typeof V1_METHODS.GET_TASK;
    params: TaskQueryParams;
}
export interface CancelTaskRequest extends JSONRPCRequest<TaskIdParams> {
    method: typeof V1_METHODS.CANCEL_TASK;
    params: TaskIdParams;
}
export interface ListTasksParams {
    contextId?: string;
    limit?: number;
    offset?: number;
}
export interface ListTasksRequest extends JSONRPCRequest<ListTasksParams> {
    method: typeof V1_METHODS.LIST_TASKS;
    params?: ListTasksParams;
}
export interface ResubscribeRequest extends JSONRPCRequest<TaskIdParams> {
    method: typeof V1_METHODS.RESUBSCRIBE;
    params: TaskIdParams;
}
export type A2ARequest = SendMessageRequest | GetTaskRequest | CancelTaskRequest | ListTasksRequest | ResubscribeRequest;
export declare const A2A_ERROR_CODES: {
    readonly PARSE_ERROR: -32700;
    readonly INVALID_REQUEST: -32600;
    readonly METHOD_NOT_FOUND: -32601;
    readonly INVALID_PARAMS: -32602;
    readonly INTERNAL_ERROR: -32603;
    readonly TASK_NOT_FOUND: -32001;
    readonly TASK_NOT_CANCELABLE: -32002;
    readonly PUSH_NOTIFICATION_NOT_SUPPORTED: -32003;
    readonly UNSUPPORTED_OPERATION: -32004;
    readonly CONTENT_TYPE_NOT_SUPPORTED: -32005;
    readonly INVALID_AGENT_RESPONSE: -32006;
    readonly AUTHENTICATED_EXTENDED_CARD_NOT_CONFIGURED: -32007;
};
export type A2AErrorCode = typeof A2A_ERROR_CODES[keyof typeof A2A_ERROR_CODES];
export declare function createA2AError(code: A2AErrorCode, message: string, data?: JSONValue): JSONRPCError;
export declare const A2A_PROTOCOL_VERSION = "1.0";
export declare const A2A_HEADERS: {
    readonly PROTOCOL_VERSION: "A2A-Protocol-Version";
    readonly REQUEST_ID: "A2A-Request-Id";
};
