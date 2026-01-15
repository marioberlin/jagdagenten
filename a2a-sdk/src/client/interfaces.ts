/**
 * Client interfaces and types for the A2A TypeScript SDK
 */

import {
  AgentCard,
  GetTaskPushNotificationConfigParams,
  Message,
  PushNotificationConfig,
  Task,
  TaskArtifactUpdateEvent,
  TaskIdParams,
  TaskPushNotificationConfig,
  TaskQueryParams,
  TaskStatusUpdateEvent,
} from '../types';

/**
 * Configuration for the A2A client.
 */
export interface ClientConfig {
  /** Whether client supports streaming */
  streaming?: boolean;

  /** Whether client prefers to poll for updates from message:send */
  polling?: boolean;

  /** The set of accepted output modes for the client */
  acceptedOutputModes?: string[];

  /** Push notification callbacks to use for every request */
  pushNotificationConfigs?: PushNotificationConfig[];

  /** A list of extension URIs the client supports */
  extensions?: string[];

  /** Transport protocol preference */
  preferredTransport?: string;

  /** Whether to use client transport preferences over server preferences */
  useClientPreference?: boolean;

  /** Request timeout in milliseconds */
  timeout?: number;

  /** Headers to include with every request */
  headers?: Record<string, string>;
}

/**
 * Type alias for emitted events from client
 */
export type UpdateEvent = TaskStatusUpdateEvent | TaskArtifactUpdateEvent | null;

/**
 * Type alias for an event consuming callback
 */
export type ClientEvent = [Task, UpdateEvent] | null;

/**
 * Event consumer callback type
 */
export type Consumer = (
  event: ClientEvent | Message,
  agentCard: AgentCard
) => Promise<void> | void;

export type StreamEvent =
  | { type: 'complete'; task: Task }
  | { type: 'error'; error: any }
  | { type: 'status'; data: { status: TaskStatusUpdateEvent['status'] } } // Approximate
  | { type: 'artifact'; data: { artifact: TaskArtifactUpdateEvent['artifact'] } };


/**
 * Client call context for middleware
 */
export interface ClientCallContext {
  /** Request ID for tracing */
  requestId?: string;

  /** Metadata for the request */
  metadata?: Record<string, string>;

  /** Timeout in milliseconds */
  timeout?: number;

  /** Cancellation token */
  signal?: AbortSignal;
}

/**
 * Client call interceptor middleware
 */
export interface ClientCallInterceptor {
  /**
   * Intercept a client call
   */
  intercept(
    request: any,
    context: ClientCallContext,
    next: () => Promise<any>
  ): Promise<any>;
}

/**
 * Abstract interface for an A2A client.
 */
export interface Client {
  /**
   * Sends a message to the server.
   * This will automatically use the streaming or non-streaming approach
   * as supported by the server and the client config.
   */
  sendMessage(
    request: Message,
    context?: ClientCallContext,
    requestMetadata?: Record<string, string>,
    extensions?: string[]
  ): AsyncIterableIterator<ClientEvent | Message>;

  /**
   * Retrieves the current state and history of a specific task.
   */
  getTask(
    request: TaskQueryParams,
    context?: ClientCallContext,
    extensions?: string[]
  ): Promise<Task>;

  /**
   * Requests the agent to cancel a specific task.
   */
  cancelTask(
    request: TaskIdParams,
    context?: ClientCallContext,
    extensions?: string[]
  ): Promise<Task>;

  /**
   * Sets or updates the push notification configuration for a specific task.
   */
  setTaskCallback(
    request: TaskPushNotificationConfig,
    context?: ClientCallContext,
    extensions?: string[]
  ): Promise<TaskPushNotificationConfig>;

  /**
   * Retrieves the push notification configuration for a specific task.
   */
  getTaskCallback(
    request: GetTaskPushNotificationConfigParams,
    context?: ClientCallContext,
    extensions?: string[]
  ): Promise<TaskPushNotificationConfig>;

  /**
   * Resubscribes to a task's event stream.
   */
  resubscribe(
    request: TaskIdParams,
    context?: ClientCallContext,
    extensions?: string[]
  ): AsyncIterableIterator<ClientEvent>;

  /**
   * Retrieves the agent's card.
   */
  getCard(
    context?: ClientCallContext,
    extensions?: string[],
    signatureVerifier?: (card: AgentCard) => void
  ): Promise<AgentCard>;

  /**
   * Attaches additional consumers to the client.
   */
  addEventConsumer(consumer: Consumer): void;

  /**
   * Attaches additional middleware to the client.
   */
  addRequestMiddleware(middleware: ClientCallInterceptor): void;

  /**
   * Closes the client and releases resources.
   */
  close(): Promise<void> | void;

  sendText(text: string, options?: { contextId?: string; configuration?: any }): Promise<Task>;
  streamText(text: string, options?: { contextId?: string; configuration?: any }, signal?: { signal?: AbortSignal }): AsyncIterableIterator<StreamEvent>;
}

/**
 * Abstract interface for a client transport.
 */
export interface ClientTransport {
  /**
   * Sends a non-streaming message request to the agent.
   */
  sendMessage(
    request: Message,
    context?: ClientCallContext,
    extensions?: string[]
  ): Promise<Task | Message>;

  /**
   * Sends a streaming message request to the agent and yields responses as they arrive.
   */
  sendMessageStreaming(
    request: Message,
    context?: ClientCallContext,
    extensions?: string[]
  ): AsyncIterableIterator<Message | Task | TaskStatusUpdateEvent | TaskArtifactUpdateEvent>;

  /**
   * Retrieves the current state and history of a specific task.
   */
  getTask(
    request: TaskQueryParams,
    context?: ClientCallContext,
    extensions?: string[]
  ): Promise<Task>;

  /**
   * Requests the agent to cancel a specific task.
   */
  cancelTask(
    request: TaskIdParams,
    context?: ClientCallContext,
    extensions?: string[]
  ): Promise<Task>;

  /**
   * Sets or updates the push notification configuration for a specific task.
   */
  setTaskCallback(
    request: TaskPushNotificationConfig,
    context?: ClientCallContext,
    extensions?: string[]
  ): Promise<TaskPushNotificationConfig>;

  /**
   * Retrieves the push notification configuration for a specific task.
   */
  getTaskCallback(
    request: GetTaskPushNotificationConfigParams,
    context?: ClientCallContext,
    extensions?: string[]
  ): Promise<TaskPushNotificationConfig>;

  /**
   * Resubscribes to a task's event stream.
   */
  resubscribe(
    request: TaskIdParams,
    context?: ClientCallContext,
    extensions?: string[]
  ): AsyncIterableIterator<Task | Message | TaskStatusUpdateEvent | TaskArtifactUpdateEvent>;

  /**
   * Retrieves the agent's card.
   */
  getCard(
    context?: ClientCallContext,
    extensions?: string[]
  ): Promise<AgentCard>;

  /**
   * Closes the transport and releases resources.
   */
  close(): Promise<void> | void;
}
