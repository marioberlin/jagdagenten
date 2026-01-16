/**
 * A2A TypeScript SDK v1.0
 *
 * A TypeScript library for building agentic applications that follow the
 * Agent2Agent (A2A) Protocol v1.0 Draft Specification.
 *
 * @see https://a2a-protocol.org/latest/specification/
 */

// Export everything from the shim (which re-exports v1.0 types)
export {
  // Client
  A2AClientError,
  type A2AClient,
  type A2AClientConfig,
  type SendOptions,
  type StreamEvent,
  createA2AClient,

  // v1 namespace for backward compatibility
  v1,

  // A2UI extension
  a2ui,

  // Core v1.0 types (also available via v1 namespace)
  type AgentCard,
  type AgentInterface,
  type AgentProvider,
  type AgentSkill,
  type AgentExtension,
  type AgentCapabilities,
  type AgentCardSignature,
  type Task,
  type TaskStatus,
  type TaskState,
  type TaskStatusUpdateEvent,
  type TaskArtifactUpdateEvent,
  type Message,
  type MessageSendConfiguration,
  type MessageSendParams,
  type Role,
  type Part,
  type FilePart,
  type DataPart,
  type Artifact,
  type PushNotificationConfig,
  type TaskPushNotificationConfig,
  type JSONValue,
  type JSONRPCRequest,
  type JSONRPCResponse,
  type JSONRPCSuccessResponse,
  type JSONRPCErrorResponse,
  type JSONRPCError,
  type ProtocolBinding,
  type SecurityScheme,
  type APIKeySecurityScheme,
  type HTTPAuthSecurityScheme,
  type OAuth2SecurityScheme,
  type OpenIdConnectSecurityScheme,
  type MutualTLSSecurityScheme,

  // Constants
  A2AErrorCodes,
  A2AMethods,

  // Type guards
  isTextPart,
  isFilePart,
  isDataPart,
  isJSONRPCError,
  isJSONRPCSuccess,
  isTaskStatusUpdateEvent,
  isTaskArtifactUpdateEvent,

  // Utility functions
  textPart,
  filePartFromUri,
  filePartFromBytes,
  dataPart,
  userMessage,
  agentMessage,
  createRequest,
  createSuccessResponse,
  createErrorResponse,
} from './shim';
