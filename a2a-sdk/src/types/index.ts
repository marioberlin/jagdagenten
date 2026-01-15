/**
 * Core A2A Protocol Types
 *
 * This module contains TypeScript interfaces for the Agent2Agent (A2A) Protocol.
 * These types are generated from the A2A JSON Schema specification.
 */

// Enums
export enum Role {
  USER = 'user',
  AGENT = 'agent',
}

export enum TaskState {
  SUBMITTED = 'submitted',
  WORKING = 'working',
  INPUT_REQUIRED = 'input-required',
  COMPLETED = 'completed',
  CANCELED = 'canceled',
  FAILED = 'failed',
  REJECTED = 'rejected',
  AUTH_REQUIRED = 'auth-required',
  UNKNOWN = 'unknown',
}

export enum TransportProtocol {
  JSONRPC = 'JSONRPC',
  GRPC = 'GRPC',
  HTTP_JSON = 'HTTP+JSON',
}

export enum In {
  COOKIE = 'cookie',
  HEADER = 'header',
  QUERY = 'query',
}

// Base types
export type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };

// Security Scheme Types
export interface APIKeySecurityScheme {
  description?: string;
  in: In;
  name: string;
  type: 'apiKey';
}

export interface HTTPAuthSecurityScheme {
  bearer_format?: string;
  description?: string;
  scheme: string;
  type: 'http';
}

export interface OAuthFlows {
  authorization_code?: AuthorizationCodeOAuthFlow;
  client_credentials?: ClientCredentialsOAuthFlow;
  implicit?: ImplicitOAuthFlow;
  password?: PasswordOAuthFlow;
}

export interface OAuth2SecurityScheme {
  description?: string;
  flows: OAuthFlows;
  oauth2_metadata_url?: string;
  type: 'oauth2';
}

export interface OpenIdConnectSecurityScheme {
  description?: string;
  open_id_connect_url: string;
  type: 'openIdConnect';
}

export interface MutualTLSSecurityScheme {
  description?: string;
  type: 'mutualTLS';
}

export interface SecuritySchemeBase {
  description?: string;
}

export type SecurityScheme =
  | APIKeySecurityScheme
  | HTTPAuthSecurityScheme
  | OAuth2SecurityScheme
  | OpenIdConnectSecurityScheme
  | MutualTLSSecurityScheme;

// OAuth Flow Types
export interface AuthorizationCodeOAuthFlow {
  authorization_url: string;
  refresh_url?: string;
  scopes: Record<string, string>;
  token_url: string;
}

export interface ClientCredentialsOAuthFlow {
  refresh_url?: string;
  scopes: Record<string, string>;
  token_url: string;
}

export interface ImplicitOAuthFlow {
  authorization_url: string;
  refresh_url?: string;
  scopes: Record<string, string>;
}

export interface PasswordOAuthFlow {
  refresh_url?: string;
  scopes: Record<string, string>;
  token_url: string;
}

// Extension and Capability Types
export interface AgentExtension {
  description?: string;
  params?: Record<string, JSONValue>;
  required?: boolean;
  uri: string;
}

export interface AgentCapabilities {
  extensions?: AgentExtension[];
  push_notifications?: boolean;
  state_transition_history?: boolean;
  streaming?: boolean;
}

// Agent Description Types
export interface AgentInterface {
  transport: string;
  url: string;
}

export interface AgentProvider {
  organization: string;
  url: string;
}

export interface AgentSkill {
  description: string;
  examples?: string[];
  id: string;
  input_modes?: string[];
  name: string;
  output_modes?: string[];
  security?: Array<Record<string, string[]>>;
  tags: string[];
}

// Agent Card Types
export interface AgentCardSignature {
  header?: Record<string, JSONValue>;
  protected: string;
  signature: string;
}

export interface AgentCard {
  additional_interfaces?: AgentInterface[];
  capabilities: AgentCapabilities;
  default_input_modes: string[];
  default_output_modes: string[];
  description: string;
  documentation_url?: string;
  icon_url?: string;
  name: string;
  preferred_transport?: string;
  protocol_version?: string;
  provider?: AgentProvider;
  security?: Array<Record<string, string[]>>;
  security_schemes?: Record<string, SecurityScheme>;
  signatures?: AgentCardSignature[];
  skills: AgentSkill[];
  supports_authenticated_extended_card?: boolean;
  url: string;
  version: string;
}

// Message and Part Types
export interface PartBase {
  metadata?: Record<string, JSONValue>;
}

export interface TextPart extends PartBase {
  kind: 'text';
  text: string;
}

export interface FileWithBytes {
  bytes: string;
  mime_type?: string;
  name?: string;
}

export interface FileWithUri {
  mime_type?: string;
  name?: string;
  uri: string;
}

export interface FileBase {
  mime_type?: string;
  name?: string;
}

export interface FilePart extends PartBase {
  kind: 'file';
  file: FileWithBytes | FileWithUri;
}

export interface DataPart extends PartBase {
  kind: 'data';
  data: Record<string, JSONValue>;
}

export type Part = TextPart | FilePart | DataPart;

// Message Types
export interface Message {
  context_id?: string;
  extensions?: string[];
  kind: 'message';
  message_id: string;
  metadata?: Record<string, JSONValue>;
  parts: Part[];
  reference_task_ids?: string[];
  role: Role;
  task_id?: string;
}

export interface MessageSendConfiguration {
  accepted_output_modes?: string[];
  blocking?: boolean;
  history_length?: number;
  push_notification_config?: PushNotificationConfig;
}

export interface MessageSendParams {
  configuration?: MessageSendConfiguration;
  message: Message;
  metadata?: Record<string, JSONValue>;
}

// Artifact Types
export interface Artifact {
  artifact_id: string;
  description?: string;
  extensions?: string[];
  metadata?: Record<string, JSONValue>;
  name?: string;
  parts: Part[];
}

// Task Types
export interface TaskStatus {
  message?: Message;
  state: TaskState;
  timestamp?: string;
}

export interface Task {
  artifacts?: Artifact[];
  context_id: string;
  history?: Message[];
  id: string;
  kind: 'task';
  metadata?: Record<string, JSONValue>;
  status: TaskStatus;
}

// Push Notification Types
export interface PushNotificationAuthenticationInfo {
  credentials?: string;
  schemes: string[];
}

export interface PushNotificationConfig {
  authentication?: PushNotificationAuthenticationInfo;
  id?: string;
  token?: string;
  url: string;
}

// Event Types
export interface TaskStatusUpdateEvent {
  context_id: string;
  final: boolean;
  kind: 'status-update';
  metadata?: Record<string, JSONValue>;
  status: TaskStatus;
  task_id: string;
}

export interface TaskArtifactUpdateEvent {
  append?: boolean;
  artifact: Artifact;
  context_id: string;
  kind: 'artifact-update';
  last_chunk?: boolean;
  metadata?: Record<string, JSONValue>;
  task_id: string;
}

export type TaskEvent = TaskStatusUpdateEvent | TaskArtifactUpdateEvent;

// Error Types
export interface JSONRPCError {
  code: number;
  data?: JSONValue;
  message: string;
}

export interface JSONParseError extends JSONRPCError {
  code: -32700;
  message?: 'Invalid JSON payload';
}

export interface InvalidRequestError extends JSONRPCError {
  code: -32600;
  message?: 'Request payload validation error';
}

export interface MethodNotFoundError extends JSONRPCError {
  code: -32601;
  message?: 'Method not found';
}

export interface InvalidParamsError extends JSONRPCError {
  code: -32602;
  message?: 'Invalid parameters';
}

export interface InternalError extends JSONRPCError {
  code: -32603;
  message?: 'Internal error';
}

export interface TaskNotFoundError extends JSONRPCError {
  code: -32001;
  message?: 'Task not found';
}

export interface TaskNotCancelableError extends JSONRPCError {
  code: -32002;
  message?: 'Task cannot be canceled';
}

export interface PushNotificationNotSupportedError extends JSONRPCError {
  code: -32003;
  message?: 'Push Notification is not supported';
}

export interface UnsupportedOperationError extends JSONRPCError {
  code: -32004;
  message?: 'This operation is not supported';
}

export interface ContentTypeNotSupportedError extends JSONRPCError {
  code: -32005;
  message?: 'Incompatible content types';
}

export interface InvalidAgentResponseError extends JSONRPCError {
  code: -32006;
  message?: 'Invalid agent response';
}

export interface AuthenticatedExtendedCardNotConfiguredError extends JSONRPCError {
  code: -32007;
  message?: 'Authenticated Extended Card is not configured';
}

export type A2AError =
  | JSONParseError
  | InvalidRequestError
  | MethodNotFoundError
  | InvalidParamsError
  | InternalError
  | TaskNotFoundError
  | TaskNotCancelableError
  | PushNotificationNotSupportedError
  | UnsupportedOperationError
  | ContentTypeNotSupportedError
  | InvalidAgentResponseError
  | AuthenticatedExtendedCardNotConfiguredError;

// JSON-RPC Types
export interface JSONRPCMessage {
  id?: string | number;
  jsonrpc: '2.0';
}

export interface JSONRPCRequest extends JSONRPCMessage {
  method: string;
  params?: Record<string, JSONValue>;
}

export interface JSONRPCSuccessResponse extends JSONRPCMessage {
  result: JSONValue;
}

export interface JSONRPCErrorResponse extends JSONRPCMessage {
  error: JSONRPCError;
}

export type JSONRPCResponse = JSONRPCSuccessResponse | JSONRPCErrorResponse;

// Request/Response Types
export interface TaskIdParams {
  id: string;
  metadata?: Record<string, JSONValue>;
}

export interface TaskQueryParams extends TaskIdParams {
  history_length?: number;
}

export interface GetTaskPushNotificationConfigParams extends TaskIdParams {
  push_notification_config_id?: string;
}

export interface ListTaskPushNotificationConfigParams extends TaskIdParams {}

export interface DeleteTaskPushNotificationConfigParams extends TaskIdParams {
  push_notification_config_id: string;
}

export interface TaskPushNotificationConfig {
  push_notification_config: PushNotificationConfig;
  task_id: string;
}

export interface TaskResubscriptionRequest extends JSONRPCRequest {
  method: 'tasks/resubscribe';
  params: TaskIdParams;
}

export interface CancelTaskRequest extends JSONRPCRequest {
  method: 'tasks/cancel';
  params: TaskIdParams;
}

export interface GetTaskRequest extends JSONRPCRequest {
  method: 'tasks/get';
  params: TaskQueryParams;
}

export interface SendMessageRequest extends JSONRPCRequest {
  method: 'message/send';
  params: MessageSendParams;
}

export interface SendStreamingMessageRequest extends JSONRPCRequest {
  method: 'message/stream';
  params: MessageSendParams;
}

export interface SetTaskPushNotificationConfigRequest extends JSONRPCRequest {
  method: 'tasks/pushNotificationConfig/set';
  params: TaskPushNotificationConfig;
}

export interface GetTaskPushNotificationConfigRequest extends JSONRPCRequest {
  method: 'tasks/pushNotificationConfig/get';
  params: TaskIdParams | GetTaskPushNotificationConfigParams;
}

export interface ListTaskPushNotificationConfigRequest extends JSONRPCRequest {
  method: 'tasks/pushNotificationConfig/list';
  params: ListTaskPushNotificationConfigParams;
}

export interface DeleteTaskPushNotificationConfigRequest extends JSONRPCRequest {
  method: 'tasks/pushNotificationConfig/delete';
  params: DeleteTaskPushNotificationConfigParams;
}

export interface GetAuthenticatedExtendedCardRequest extends JSONRPCRequest {
  method: 'agent/getAuthenticatedExtendedCard';
}

export type A2ARequest =
  | SendMessageRequest
  | SendStreamingMessageRequest
  | GetTaskRequest
  | CancelTaskRequest
  | SetTaskPushNotificationConfigRequest
  | GetTaskPushNotificationConfigRequest
  | TaskResubscriptionRequest
  | ListTaskPushNotificationConfigRequest
  | DeleteTaskPushNotificationConfigRequest
  | GetAuthenticatedExtendedCardRequest;

// Response Types
export interface SendMessageSuccessResponse extends JSONRPCSuccessResponse {
  result: Task | Message;
}

export interface SendStreamingMessageSuccessResponse extends JSONRPCSuccessResponse {
  result: Task | Message | TaskStatusUpdateEvent | TaskArtifactUpdateEvent;
}

export interface GetTaskSuccessResponse extends JSONRPCSuccessResponse {
  result: Task;
}

export interface CancelTaskSuccessResponse extends JSONRPCSuccessResponse {
  result: Task;
}

export interface GetAuthenticatedExtendedCardSuccessResponse extends JSONRPCSuccessResponse {
  result: AgentCard;
}

export interface GetTaskPushNotificationConfigSuccessResponse extends JSONRPCSuccessResponse {
  result: TaskPushNotificationConfig;
}

export interface ListTaskPushNotificationConfigSuccessResponse extends JSONRPCSuccessResponse {
  result: TaskPushNotificationConfig[];
}

export interface DeleteTaskPushNotificationConfigSuccessResponse extends JSONRPCSuccessResponse {
  result: null;
}

export interface SetTaskPushNotificationConfigSuccessResponse extends JSONRPCSuccessResponse {
  result: TaskPushNotificationConfig;
}

export type SendMessageResponse = JSONRPCErrorResponse | SendMessageSuccessResponse;
export type SendStreamingMessageResponse = JSONRPCErrorResponse | SendStreamingMessageSuccessResponse;
export type GetTaskResponse = JSONRPCErrorResponse | GetTaskSuccessResponse;
export type CancelTaskResponse = JSONRPCErrorResponse | CancelTaskSuccessResponse;
export type GetAuthenticatedExtendedCardResponse = JSONRPCErrorResponse | GetAuthenticatedExtendedCardSuccessResponse;
export type GetTaskPushNotificationConfigResponse = JSONRPCErrorResponse | GetTaskPushNotificationConfigSuccessResponse;
export type ListTaskPushNotificationConfigResponse = JSONRPCErrorResponse | ListTaskPushNotificationConfigSuccessResponse;
export type DeleteTaskPushNotificationConfigResponse = JSONRPCErrorResponse | DeleteTaskPushNotificationConfigSuccessResponse;
export type SetTaskPushNotificationConfigResponse = JSONRPCErrorResponse | SetTaskPushNotificationConfigSuccessResponse;
export type JSONRPCResponse =
  | JSONRPCErrorResponse
  | SendMessageSuccessResponse
  | SendStreamingMessageSuccessResponse
  | GetTaskSuccessResponse
  | CancelTaskSuccessResponse
  | SetTaskPushNotificationConfigSuccessResponse
  | GetTaskPushNotificationConfigSuccessResponse
  | ListTaskPushNotificationConfigSuccessResponse
  | DeleteTaskPushNotificationConfigSuccessResponse
  | GetAuthenticatedExtendedCardSuccessResponse;
