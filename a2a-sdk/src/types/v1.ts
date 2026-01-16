/**
 * A2A Protocol v1.0 Types (Draft Specification)
 *
 * This module contains TypeScript interfaces strictly compliant with
 * the Agent2Agent (A2A) Protocol v1.0 Draft Specification.
 *
 * All field names use camelCase as specified in Section 5.5 of the spec.
 * All enums use lowercase kebab-case in JSON representation.
 *
 * @see https://a2a-protocol.org/latest/specification/
 */

// ============================================================================
// Enums
// ============================================================================

/** Task lifecycle states */
export type TaskState =
  | 'submitted'      // Task created and acknowledged
  | 'working'        // Task actively processing
  | 'completed'      // Task finished successfully (terminal)
  | 'failed'         // Task finished with failure (terminal)
  | 'cancelled'      // Task cancelled before completion (terminal)
  | 'input-required' // Task awaiting additional information
  | 'rejected'       // Agent declined task (terminal)
  | 'auth-required'; // Out-of-band authentication needed

/** Message sender role */
export type Role = 'user' | 'agent';

/** Protocol binding types */
export type ProtocolBinding = 'JSONRPC' | 'GRPC' | 'HTTP+JSON';

/** Security scheme location */
export type SecuritySchemeIn = 'cookie' | 'header' | 'query';

// ============================================================================
// Base Types
// ============================================================================

export type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };

// ============================================================================
// Part Types (discriminated union - exactly one field present)
// ============================================================================

/** File content via URI or bytes */
export interface FilePart {
  fileWithUri?: string;      // URL pointing to file content
  fileWithBytes?: string;    // Base64-encoded file content
  mediaType?: string;        // MIME type (e.g., "application/pdf")
  name?: string;             // Optional filename
}

/** Structured JSON data */
export interface DataPart {
  data: JSONValue;           // Arbitrary JSON content
}

/** Text content part */
export interface TextPart {
  text: string;              // Text content
  metadata?: Record<string, JSONValue>;
}

/** Content unit within Message or Artifact */
export interface Part {
  text?: string;             // Text content (mutually exclusive with file/data)
  file?: FilePart;           // File content (mutually exclusive with text/data)
  data?: DataPart;           // Structured data (mutually exclusive with text/file)
  metadata?: Record<string, JSONValue>;
}

// ============================================================================
// Message Types
// ============================================================================

/** Single communication unit */
export interface Message {
  messageId: string;                    // Required: Unique identifier (UUID)
  role: Role;                           // Required: Sender identification
  parts: Part[];                        // Required: Message content
  contextId?: string;                   // Optional: Conversation grouping
  taskId?: string;                      // Optional: Associated task
  metadata?: Record<string, JSONValue>; // Optional: Custom metadata
  extensions?: string[];                // Optional: Extension URIs
  referenceTaskIds?: string[];          // Optional: Related task IDs
}

/** Configuration for sending messages */
export interface MessageSendConfiguration {
  acceptedOutputModes?: string[];           // Accepted output media types
  blocking?: boolean;                       // Wait for terminal state
  historyLength?: number;                   // Limit returned messages
  pushNotificationConfig?: PushNotificationConfig;
}

/** Parameters for SendMessage/StreamMessage */
export interface MessageSendParams {
  message: Message;
  configuration?: MessageSendConfiguration;
  metadata?: Record<string, JSONValue>;
}

// ============================================================================
// Artifact Types
// ============================================================================

/** Task output representation */
export interface Artifact {
  artifactId: string;                   // Required: Unique identifier
  parts: Part[];                        // Required: Content (at least one)
  name?: string;                        // Optional: Human-readable name
  description?: string;                 // Optional: Human-readable description
  metadata?: Record<string, JSONValue>; // Optional: Custom metadata
  extensions?: string[];                // Optional: Extension URIs
}

// ============================================================================
// Task Types
// ============================================================================

/** Task status with state and optional message */
export interface TaskStatus {
  state: TaskState;                     // Required: Current lifecycle state
  message?: Message;                    // Optional: Associated status message
  timestamp?: string;                   // Optional: ISO 8601 timestamp
}

/** Fundamental unit of work */
export interface Task {
  id: string;                           // Required: Unique identifier (UUID)
  contextId: string;                    // Required: Context identifier
  status: TaskStatus;                   // Required: Current status
  artifacts?: Artifact[];               // Optional: Generated outputs
  history?: Message[];                  // Optional: Interaction history
  metadata?: Record<string, JSONValue>; // Optional: Custom metadata
}

// ============================================================================
// Event Types (for streaming)
// ============================================================================

/** Task status update event */
export interface TaskStatusUpdateEvent {
  taskId: string;
  contextId: string;
  status: TaskStatus;
  final: boolean;                       // True if terminal state
  metadata?: Record<string, JSONValue>;
}

/** Task artifact update event */
export interface TaskArtifactUpdateEvent {
  taskId: string;
  contextId: string;
  artifact: Artifact;
  append?: boolean;                     // Append to existing artifact
  lastChunk?: boolean;                  // Final chunk of artifact
  metadata?: Record<string, JSONValue>;
}

// ============================================================================
// Agent Card Types
// ============================================================================

/** Agent endpoint interface */
export interface AgentInterface {
  url: string;                          // Required: Absolute HTTPS URL
  protocolBinding: ProtocolBinding;     // Required: Protocol type
  tenant?: string;                      // Optional: Tenant parameter
}

/** Service provider information */
export interface AgentProvider {
  organization: string;
  url?: string;
}

/** Agent capability */
export interface AgentSkill {
  id: string;                           // Required: Unique identifier
  name: string;                         // Required: Human-readable name
  description: string;                  // Required: Detailed description
  tags: string[];                       // Required: Keywords
  examples?: string[];                  // Optional: Example prompts
  inputModes?: string[];                // Optional: Override default inputs
  outputModes?: string[];               // Optional: Override default outputs
  security?: Array<Record<string, string[]>>; // Optional: Skill-specific auth
}

/** Protocol extension */
export interface AgentExtension {
  uri: string;
  description?: string;
  required?: boolean;
  params?: Record<string, JSONValue>;
}

/** Agent capabilities */
export interface AgentCapabilities {
  streaming?: boolean;                  // Supports streaming responses
  pushNotifications?: boolean;          // Supports webhook notifications
  stateTransitionHistory?: boolean;     // Provides state history
  extendedAgentCard?: boolean;          // Provides authenticated card
  extensions?: AgentExtension[];        // Supported extensions
}

// Security Scheme Types
export interface APIKeySecurityScheme {
  type: 'apiKey';
  in: SecuritySchemeIn;
  name: string;
  description?: string;
}

export interface HTTPAuthSecurityScheme {
  type: 'http';
  scheme: string;
  bearerFormat?: string;
  description?: string;
}

export interface OAuth2Flow {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes: Record<string, string>;
}

export interface OAuth2SecurityScheme {
  type: 'oauth2';
  flows: {
    authorizationCode?: OAuth2Flow;
    clientCredentials?: OAuth2Flow;
    implicit?: OAuth2Flow;
    password?: OAuth2Flow;
  };
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

export type SecurityScheme =
  | APIKeySecurityScheme
  | HTTPAuthSecurityScheme
  | OAuth2SecurityScheme
  | OpenIdConnectSecurityScheme
  | MutualTLSSecurityScheme;

/** JWS signature for card authenticity */
export interface AgentCardSignature {
  protected: string;
  signature: string;
  header?: Record<string, JSONValue>;
}

/** Self-describing agent manifest */
export interface AgentCard {
  // Required fields
  protocolVersions: string[];           // Supported A2A versions (e.g., ["1.0"])
  name: string;                         // Human-readable agent name
  description: string;                  // Agent purpose description
  version: string;                      // Agent version (semver)
  supportedInterfaces: AgentInterface[];// Ordered list of interfaces
  capabilities: AgentCapabilities;      // Capability set
  defaultInputModes: string[];          // Supported input media types
  defaultOutputModes: string[];         // Supported output media types
  skills: AgentSkill[];                 // Agent capabilities

  // Optional fields
  provider?: AgentProvider;             // Service provider info
  documentationUrl?: string;            // Additional documentation
  iconUrl?: string;                     // Agent icon
  securitySchemes?: Record<string, SecurityScheme>; // Auth scheme details
  security?: Array<Record<string, string[]>>;       // Required security
  signatures?: AgentCardSignature[];    // Card authenticity
}

// ============================================================================
// Push Notification Types
// ============================================================================

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

// ============================================================================
// JSON-RPC Types
// ============================================================================

export interface JSONRPCRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, JSONValue>;
}

export interface JSONRPCSuccessResponse {
  jsonrpc: '2.0';
  id: string | number;
  result: JSONValue;
}

export interface JSONRPCError {
  code: number;
  message: string;
  data?: JSONValue;
}

export interface JSONRPCErrorResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  error: JSONRPCError;
}

export type JSONRPCResponse = JSONRPCSuccessResponse | JSONRPCErrorResponse;

// ============================================================================
// A2A Error Codes
// ============================================================================

export const A2AErrorCodes = {
  // JSON-RPC standard errors
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,

  // A2A-specific errors (-32001 to -32099)
  TASK_NOT_FOUND: -32001,
  TASK_NOT_CANCELABLE: -32002,
  PUSH_NOTIFICATION_NOT_SUPPORTED: -32003,
  UNSUPPORTED_OPERATION: -32004,
  CONTENT_TYPE_NOT_SUPPORTED: -32005,
  INVALID_AGENT_RESPONSE: -32006,
  EXTENDED_CARD_NOT_CONFIGURED: -32007,
} as const;

// ============================================================================
// A2A v1.0 Method Names (PascalCase)
// ============================================================================

export const A2AMethods = {
  // Message operations
  SEND_MESSAGE: 'SendMessage',
  STREAM_MESSAGE: 'StreamMessage',

  // Task management
  GET_TASK: 'GetTask',
  LIST_TASKS: 'ListTasks',
  CANCEL_TASK: 'CancelTask',
  SUBSCRIBE_TO_TASK: 'SubscribeToTask',

  // Push notifications
  SET_PUSH_NOTIFICATION_CONFIG: 'SetTaskPushNotificationConfig',
  GET_PUSH_NOTIFICATION_CONFIG: 'GetTaskPushNotificationConfig',
  LIST_PUSH_NOTIFICATION_CONFIG: 'ListTaskPushNotificationConfig',
  DELETE_PUSH_NOTIFICATION_CONFIG: 'DeleteTaskPushNotificationConfig',

  // Discovery
  GET_EXTENDED_AGENT_CARD: 'GetExtendedAgentCard',
} as const;

// ============================================================================
// Type Guards
// ============================================================================

export function isTextPart(part: Part): boolean {
  return typeof part.text === 'string';
}

export function isFilePart(part: Part): boolean {
  return part.file !== undefined;
}

export function isDataPart(part: Part): boolean {
  return part.data !== undefined;
}

export function isTaskStatusUpdateEvent(event: unknown): event is TaskStatusUpdateEvent {
  return (
    typeof event === 'object' &&
    event !== null &&
    'taskId' in event &&
    'status' in event &&
    'final' in event
  );
}

export function isTaskArtifactUpdateEvent(event: unknown): event is TaskArtifactUpdateEvent {
  return (
    typeof event === 'object' &&
    event !== null &&
    'taskId' in event &&
    'artifact' in event
  );
}

export function isJSONRPCError(response: JSONRPCResponse): response is JSONRPCErrorResponse {
  return 'error' in response;
}

export function isJSONRPCSuccess(response: JSONRPCResponse): response is JSONRPCSuccessResponse {
  return 'result' in response;
}

// ============================================================================
// Utility Functions
// ============================================================================

/** Create a text Part */
export function textPart(text: string, metadata?: Record<string, JSONValue>): Part {
  return { text, metadata };
}

/** Create a file Part from URI */
export function filePartFromUri(
  uri: string,
  mediaType?: string,
  name?: string,
  metadata?: Record<string, JSONValue>
): Part {
  return {
    file: { fileWithUri: uri, mediaType, name },
    metadata,
  };
}

/** Create a file Part from bytes */
export function filePartFromBytes(
  bytes: string,
  mediaType?: string,
  name?: string,
  metadata?: Record<string, JSONValue>
): Part {
  return {
    file: { fileWithBytes: bytes, mediaType, name },
    metadata,
  };
}

/** Create a data Part */
export function dataPart(data: JSONValue, metadata?: Record<string, JSONValue>): Part {
  return { data: { data }, metadata };
}

/** Create a user Message */
export function userMessage(parts: Part[], options?: Partial<Omit<Message, 'role' | 'parts'>>): Message {
  return {
    messageId: options?.messageId ?? crypto.randomUUID(),
    role: 'user',
    parts,
    ...options,
  };
}

/** Create an agent Message */
export function agentMessage(parts: Part[], options?: Partial<Omit<Message, 'role' | 'parts'>>): Message {
  return {
    messageId: options?.messageId ?? crypto.randomUUID(),
    role: 'agent',
    parts,
    ...options,
  };
}

/** Create a JSON-RPC request */
export function createRequest(
  method: string,
  params?: Record<string, JSONValue>,
  id?: string | number
): JSONRPCRequest {
  return {
    jsonrpc: '2.0',
    id: id ?? crypto.randomUUID(),
    method,
    params,
  };
}

/** Create a JSON-RPC success response */
export function createSuccessResponse(
  id: string | number,
  result: JSONValue
): JSONRPCSuccessResponse {
  return {
    jsonrpc: '2.0',
    id,
    result,
  };
}

/** Create a JSON-RPC error response */
export function createErrorResponse(
  id: string | number | null,
  code: number,
  message: string,
  data?: JSONValue
): JSONRPCErrorResponse {
  return {
    jsonrpc: '2.0',
    id,
    error: { code, message, data },
  };
}
