/**
 * A2A Protocol v1.0 Client
 *
 * Production-ready client implementation fully compliant with A2A Protocol v1.0.
 * Features:
 * - PascalCase method names (v1.0 compliant)
 * - camelCase field naming
 * - Robust streaming with reconnection and heartbeat
 * - Comprehensive error handling with retryable error detection
 * - Request correlation and tracing
 * - Type-safe API
 */

import * as v1 from '../types/v1.js';

// ============================================================================
// Client Configuration
// ============================================================================

export interface A2AClientConfig {
  /** Base URL of the A2A agent */
  baseUrl: string;
  /** Authentication token (Bearer) */
  authToken?: string;
  /** Custom headers to include in requests */
  headers?: Record<string, string>;
  /** Default request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Enable automatic retry for retryable errors (default: true) */
  autoRetry?: boolean;
  /** Maximum retry attempts (default: 3) */
  maxRetries?: number;
  /** Enable A2UI extension support (default: true) */
  enableA2UI?: boolean;
  /** Protocol version to use (default: '1.0') */
  protocolVersion?: '1.0' | '0.x';
  /** Stream heartbeat interval in ms (default: 30000) */
  heartbeatInterval?: number;
  /** Request ID generator (default: UUID) */
  requestIdGenerator?: () => string;
}

export interface RequestContext {
  /** Request timeout override */
  timeout?: number;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
  /** Custom metadata for this request */
  metadata?: Record<string, v1.JSONValue>;
  /** Correlation ID for request tracing */
  correlationId?: string;
}

// ============================================================================
// Error Types
// ============================================================================

export class A2AClientError extends Error {
  constructor(
    message: string,
    public readonly code: number,
    public readonly data?: v1.JSONValue,
    public readonly retryable: boolean = false,
    public readonly correlationId?: string
  ) {
    super(message);
    this.name = 'A2AClientError';
  }

  static fromJSONRPCError(error: v1.JSONRPCError, correlationId?: string): A2AClientError {
    const retryable = A2AClientError.isRetryableError(error.code);
    return new A2AClientError(
      error.message,
      error.code,
      error.data,
      retryable,
      correlationId
    );
  }

  static isRetryableError(code: number): boolean {
    // Server errors and some client errors are retryable
    const retryableCodes = [
      v1.A2A_ERROR_CODES.INTERNAL_ERROR,
      -32000, // Generic server error
      -32099, // Rate limited
    ];
    return retryableCodes.includes(code);
  }
}

export class A2ATimeoutError extends A2AClientError {
  constructor(correlationId?: string) {
    super('Request timed out', -32000, undefined, true, correlationId);
    this.name = 'A2ATimeoutError';
  }
}

export class A2AConnectionError extends A2AClientError {
  constructor(message: string, correlationId?: string) {
    super(message, -32001, undefined, true, correlationId);
    this.name = 'A2AConnectionError';
  }
}

// ============================================================================
// Stream Event Types
// ============================================================================

export type StreamEvent =
  | { type: 'status'; data: v1.TaskStatusUpdateEvent }
  | { type: 'artifact'; data: v1.TaskArtifactUpdateEvent }
  | { type: 'heartbeat'; timestamp: string }
  | { type: 'error'; error: A2AClientError }
  | { type: 'complete'; task: v1.Task };

// ============================================================================
// A2A v1.0 Client
// ============================================================================

export class A2AClient {
  private config: Required<Omit<A2AClientConfig, 'authToken' | 'headers'>> & {
    authToken?: string;
    headers: Record<string, string>;
  };
  private agentCardCache?: { card: v1.AgentCard; expiresAt: number };

  constructor(config: A2AClientConfig) {
    this.config = {
      baseUrl: config.baseUrl.replace(/\/$/, ''),
      authToken: config.authToken,
      headers: config.headers ?? {},
      timeout: config.timeout ?? 30000,
      autoRetry: config.autoRetry ?? true,
      maxRetries: config.maxRetries ?? 3,
      enableA2UI: config.enableA2UI ?? true,
      protocolVersion: config.protocolVersion ?? '1.0',
      heartbeatInterval: config.heartbeatInterval ?? 30000,
      requestIdGenerator: config.requestIdGenerator ?? this.generateUUID,
    };
  }

  // ==========================================================================
  // Agent Discovery
  // ==========================================================================

  /**
   * Fetch the agent card from /.well-known/agent.json
   * Results are cached for 5 minutes
   */
  async getAgentCard(context?: RequestContext): Promise<v1.AgentCard> {
    const now = Date.now();
    if (this.agentCardCache && this.agentCardCache.expiresAt > now) {
      return this.agentCardCache.card;
    }

    const response = await this.httpRequest<v1.AgentCard>(
      `${this.config.baseUrl}/.well-known/agent.json`,
      { method: 'GET' },
      context
    );

    this.agentCardCache = {
      card: response,
      expiresAt: now + 5 * 60 * 1000, // 5 minute cache
    };

    return response;
  }

  /**
   * Get authenticated extended card (if supported)
   */
  async getAuthenticatedExtendedCard(context?: RequestContext): Promise<v1.AgentCard> {
    return this.rpcCall<v1.AgentCard>(
      v1.V1_METHODS.GET_AUTHENTICATED_EXTENDED_CARD,
      undefined,
      context
    );
  }

  // ==========================================================================
  // Message Sending
  // ==========================================================================

  /**
   * Send a message to the agent and wait for completion (blocking mode).
   *
   * @param params - Message parameters including the message content and optional configuration
   * @param context - Optional request context for timeout, abort signal, and correlation ID
   * @returns The completed task with status, artifacts, and history
   * @throws {A2AClientError} If the server returns an error
   * @throws {A2ATimeoutError} If the request times out
   * @throws {A2AConnectionError} If connection fails
   *
   * @example
   * ```typescript
   * const task = await client.sendMessage({
   *   message: { messageId: '123', role: 'user', parts: [{ text: 'Hello' }] },
   *   configuration: { acceptedOutputModes: ['text/plain'] }
   * });
   * console.log(task.status.state); // 'completed'
   * ```
   */
  async sendMessage(
    params: v1.MessageSendParams,
    context?: RequestContext
  ): Promise<v1.Task> {
    // Add A2UI extension if enabled
    if (this.config.enableA2UI && params.message.extensions === undefined) {
      params.message.extensions = ['a2ui'];
    }

    return this.rpcCall<v1.Task>(
      v1.V1_METHODS.SEND_MESSAGE,
      params,
      context
    );
  }

  /**
   * Send a simple text message
   */
  async sendText(
    text: string,
    options?: {
      contextId?: string;
      configuration?: v1.MessageSendConfiguration;
    },
    context?: RequestContext
  ): Promise<v1.Task> {
    const messageId = this.config.requestIdGenerator();
    const message: v1.Message = {
      messageId,
      role: v1.Role.USER,
      parts: [{ text }],
      contextId: options?.contextId,
      extensions: this.config.enableA2UI ? ['a2ui'] : undefined,
    };

    return this.sendMessage(
      { message, configuration: options?.configuration },
      context
    );
  }

  /**
   * Send a message and receive streaming updates as they occur.
   *
   * The generator yields events as they arrive:
   * - `status`: Task status changed (submitted, working, completed, etc.)
   * - `artifact`: New artifact produced or existing artifact updated
   * - `heartbeat`: Connection keep-alive signal
   * - `error`: Error occurred during streaming
   * - `complete`: Task completed with final result
   *
   * @param params - Message parameters including the message content and optional configuration
   * @param context - Optional request context for timeout, abort signal, and correlation ID
   * @yields {StreamEvent} Events as they occur
   *
   * @example
   * ```typescript
   * for await (const event of client.sendMessageStreaming(params)) {
   *   if (event.type === 'status') {
   *     console.log('Status:', event.data.status.state);
   *   } else if (event.type === 'artifact') {
   *     console.log('Artifact:', event.data.artifact);
   *   } else if (event.type === 'complete') {
   *     console.log('Done:', event.task);
   *   }
   * }
   * ```
   */
  async *sendMessageStreaming(
    params: v1.MessageSendParams,
    context?: RequestContext
  ): AsyncGenerator<StreamEvent, void, unknown> {
    // Add A2UI extension if enabled
    if (this.config.enableA2UI && params.message.extensions === undefined) {
      params.message.extensions = ['a2ui'];
    }

    // Set streaming in configuration
    if (!params.configuration) {
      params.configuration = {};
    }
    params.configuration.blocking = false;

    yield* this.streamRpcCall(
      v1.V1_METHODS.SEND_MESSAGE,
      params,
      context
    );
  }

  /**
   * Stream a simple text message
   */
  async *streamText(
    text: string,
    options?: {
      contextId?: string;
      configuration?: v1.MessageSendConfiguration;
    },
    context?: RequestContext
  ): AsyncGenerator<StreamEvent, void, unknown> {
    const messageId = this.config.requestIdGenerator();
    const message: v1.Message = {
      messageId,
      role: v1.Role.USER,
      parts: [{ text }],
      contextId: options?.contextId,
      extensions: this.config.enableA2UI ? ['a2ui'] : undefined,
    };

    yield* this.sendMessageStreaming(
      { message, configuration: options?.configuration },
      context
    );
  }

  // ==========================================================================
  // Task Management
  // ==========================================================================

  /**
   * Get task by ID
   */
  async getTask(
    taskId: string,
    options?: { historyLength?: number },
    context?: RequestContext
  ): Promise<v1.Task> {
    return this.rpcCall<v1.Task>(
      v1.V1_METHODS.GET_TASK,
      { id: taskId, historyLength: options?.historyLength },
      context
    );
  }

  /**
   * Cancel a running task
   */
  async cancelTask(taskId: string, context?: RequestContext): Promise<v1.Task> {
    return this.rpcCall<v1.Task>(
      v1.V1_METHODS.CANCEL_TASK,
      { id: taskId },
      context
    );
  }

  /**
   * List tasks, optionally filtered by context
   */
  async listTasks(
    params?: v1.ListTasksParams,
    context?: RequestContext
  ): Promise<v1.Task[]> {
    return this.rpcCall<v1.Task[]>(
      v1.V1_METHODS.LIST_TASKS,
      params,
      context
    );
  }

  /**
   * Resubscribe to task updates (for resuming interrupted streams)
   */
  async *resubscribe(
    taskId: string,
    context?: RequestContext
  ): AsyncGenerator<StreamEvent, void, unknown> {
    yield* this.streamRpcCall(
      v1.V1_METHODS.RESUBSCRIBE,
      { id: taskId },
      context
    );
  }

  // ==========================================================================
  // Push Notifications
  // ==========================================================================

  /**
   * Set push notification callback for a task
   */
  async setTaskCallback(
    config: v1.TaskPushNotificationConfig,
    context?: RequestContext
  ): Promise<v1.TaskPushNotificationConfig> {
    return this.rpcCall<v1.TaskPushNotificationConfig>(
      v1.V1_METHODS.SET_TASK_PUSH_NOTIFICATION_CONFIG,
      config,
      context
    );
  }

  /**
   * Get push notification callback for a task
   */
  async getTaskCallback(
    taskId: string,
    context?: RequestContext
  ): Promise<v1.TaskPushNotificationConfig | null> {
    return this.rpcCall<v1.TaskPushNotificationConfig | null>(
      v1.V1_METHODS.GET_TASK_PUSH_NOTIFICATION_CONFIG,
      { id: taskId },
      context
    );
  }

  /**
   * Delete push notification callback for a task
   */
  async deleteTaskCallback(taskId: string, context?: RequestContext): Promise<void> {
    await this.rpcCall<void>(
      v1.V1_METHODS.DELETE_TASK_PUSH_NOTIFICATION_CONFIG,
      { id: taskId },
      context
    );
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Extract A2UI parts from a task's artifacts
   */
  extractA2UIParts(task: v1.Task): v1.DataPart[] {
    if (!task.artifacts) return [];

    const a2uiParts: v1.DataPart[] = [];
    for (const artifact of task.artifacts) {
      for (const part of artifact.parts) {
        if (v1.isDataPart(part) && part.data.type === 'a2ui') {
          a2uiParts.push(part);
        }
      }
    }
    return a2uiParts;
  }

  /**
   * Extract text from a message
   */
  extractText(message: v1.Message): string {
    return message.parts
      .filter(v1.isTextPart)
      .map(p => p.text)
      .join('\n');
  }

  /**
   * Check if agent supports a capability
   */
  async supportsCapability(
    capability: 'streaming' | 'pushNotifications' | 'stateTransitionHistory',
    context?: RequestContext
  ): Promise<boolean> {
    const card = await this.getAgentCard(context);
    const value = card.capabilities?.[capability];
    return value === true;
  }

  /**
   * Close client and cleanup resources
   */
  async close(): Promise<void> {
    this.agentCardCache = undefined;
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private async rpcCall<T>(
    method: string,
    params?: unknown,
    context?: RequestContext
  ): Promise<T> {
    const correlationId = context?.correlationId ?? this.config.requestIdGenerator();
    const requestId = this.config.requestIdGenerator();

    const request: v1.JSONRPCRequest = {
      jsonrpc: '2.0',
      id: requestId,
      method,
      params: params as v1.JSONRPCRequest['params'],
    };

    let lastError: A2AClientError | undefined;
    const maxAttempts = this.config.autoRetry ? this.config.maxRetries : 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await this.httpRequest<v1.JSONRPCResponse>(
          `${this.config.baseUrl}/a2a`,
          {
            method: 'POST',
            body: JSON.stringify(request),
          },
          context,
          correlationId
        );

        if ('error' in response) {
          throw A2AClientError.fromJSONRPCError(response.error, correlationId);
        }

        return response.result as T;
      } catch (error) {
        if (error instanceof A2AClientError) {
          lastError = error;
          if (!error.retryable || attempt >= maxAttempts) {
            throw error;
          }
          // Exponential backoff with jitter to prevent thundering herd
          const baseDelay = Math.pow(2, attempt - 1) * 1000;
          const jitter = Math.random() * 200; // 0-200ms jitter
          await this.delay(baseDelay + jitter);
        } else {
          throw new A2AConnectionError(
            error instanceof Error ? error.message : 'Unknown error',
            correlationId
          );
        }
      }
    }

    throw lastError ?? new A2AClientError('Unknown error', -32000);
  }

  private async *streamRpcCall(
    method: string,
    params: unknown,
    context?: RequestContext
  ): AsyncGenerator<StreamEvent, void, unknown> {
    const correlationId = context?.correlationId ?? this.config.requestIdGenerator();
    const requestId = this.config.requestIdGenerator();

    const request: v1.JSONRPCRequest = {
      jsonrpc: '2.0',
      id: requestId,
      method,
      params: params as v1.JSONRPCRequest['params'],
    };

    const headers = this.buildHeaders(correlationId);
    headers['Accept'] = 'text/event-stream';

    const controller = new AbortController();
    const connectionTimeout = context?.timeout ?? this.config.timeout;

    // Use context signal if provided
    if (context?.signal) {
      context.signal.addEventListener('abort', () => controller.abort());
    }

    // Set connection timeout (abort if no response within timeout)
    const connectionTimeoutId = setTimeout(() => controller.abort(), connectionTimeout);

    try {
      const response = await fetch(`${this.config.baseUrl}/a2a/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      // Clear connection timeout once connected
      clearTimeout(connectionTimeoutId);

      if (!response.ok) {
        throw new A2AConnectionError(
          `HTTP ${response.status}: ${response.statusText}`,
          correlationId
        );
      }

      if (!response.body) {
        throw new A2AConnectionError('No response body', correlationId);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let lastEventTime = Date.now();

      // Heartbeat timeout tracking
      let heartbeatTimedOut = false;
      const heartbeatChecker = setInterval(() => {
        const now = Date.now();
        if (now - lastEventTime > this.config.heartbeatInterval * 2) {
          heartbeatTimedOut = true;
          controller.abort();
        }
      }, this.config.heartbeatInterval);

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          lastEventTime = Date.now();
          buffer += decoder.decode(value, { stream: true });

          // Parse SSE events
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '') continue;

              try {
                const event = JSON.parse(data);
                const streamEvent = this.parseStreamEvent(event, correlationId);
                if (streamEvent) {
                  yield streamEvent;

                  // Check for completion
                  if (streamEvent.type === 'complete' || streamEvent.type === 'error') {
                    return;
                  }
                }
              } catch (parseError) {
                // Log malformed events for debugging but continue processing
                if (process.env.NODE_ENV === 'development') {
                  console.warn('[A2A SDK] Malformed SSE event:', data, parseError);
                }
              }
            } else if (line.startsWith('event: heartbeat')) {
              yield { type: 'heartbeat', timestamp: new Date().toISOString() };
            }
          }
        }
      } finally {
        clearInterval(heartbeatChecker);
        reader.releaseLock();
      }

      // Handle heartbeat timeout after cleanup
      if (heartbeatTimedOut) {
        throw new A2ATimeoutError(correlationId);
      }
    } catch (error) {
      // Ensure connection timeout is cleared on error
      clearTimeout(connectionTimeoutId);

      if (error instanceof A2AClientError) {
        yield { type: 'error', error };
      } else if (error instanceof Error && error.name === 'AbortError') {
        yield { type: 'error', error: new A2ATimeoutError(correlationId) };
      } else {
        yield {
          type: 'error',
          error: new A2AConnectionError(
            error instanceof Error ? error.message : 'Stream error',
            correlationId
          ),
        };
      }
    }
  }

  private parseStreamEvent(event: unknown, correlationId: string): StreamEvent | null {
    if (typeof event !== 'object' || event === null) return null;

    // Check for JSON-RPC error
    if ('error' in event) {
      const rpcError = event as v1.JSONRPCErrorResponse;
      return {
        type: 'error',
        error: A2AClientError.fromJSONRPCError(rpcError.error, correlationId),
      };
    }

    // Check for result (final task)
    if ('result' in event) {
      return { type: 'complete', task: (event as v1.JSONRPCSuccessResponse).result as unknown as v1.Task };
    }

    // Check for status update
    if ('status' in event) {
      return { type: 'status', data: event as v1.TaskStatusUpdateEvent };
    }

    // Check for artifact update
    if ('artifact' in event) {
      return { type: 'artifact', data: event as v1.TaskArtifactUpdateEvent };
    }

    return null;
  }

  private async httpRequest<T>(
    url: string,
    init: RequestInit,
    context?: RequestContext,
    correlationId?: string
  ): Promise<T> {
    const headers = this.buildHeaders(correlationId ?? this.config.requestIdGenerator());
    const timeout = context?.timeout ?? this.config.timeout;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Link to context signal if provided
    if (context?.signal) {
      context.signal.addEventListener('abort', () => controller.abort());
    }

    try {
      const response = await fetch(url, {
        ...init,
        headers: { ...headers, ...(init.headers as Record<string, string>) },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new A2AConnectionError(
          `HTTP ${response.status}: ${response.statusText}`,
          correlationId
        );
      }

      return await response.json() as T;
    } catch (error) {
      if (error instanceof A2AClientError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new A2ATimeoutError(correlationId);
      }
      throw new A2AConnectionError(
        error instanceof Error ? error.message : 'Request failed',
        correlationId
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private buildHeaders(correlationId: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      [v1.A2A_HEADERS.PROTOCOL_VERSION]: this.config.protocolVersion,
      [v1.A2A_HEADERS.REQUEST_ID]: correlationId,
      ...this.config.headers,
    };

    if (this.config.authToken) {
      headers['Authorization'] = `Bearer ${this.config.authToken}`;
    }

    if (this.config.enableA2UI) {
      headers['X-A2A-Extensions'] = 'a2ui';
    }

    return headers;
  }

  private generateUUID(): string {
    // Use native crypto.randomUUID when available (Node 15.6+, modern browsers)
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    // Fallback for older environments
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new A2A v1.0 client
 */
export function createA2AClient(config: A2AClientConfig): A2AClient {
  return new A2AClient(config);
}

/**
 * Create a client from an agent URL (fetches agent card first)
 */
export async function createA2AClientFromUrl(
  agentUrl: string,
  options?: Omit<A2AClientConfig, 'baseUrl'>
): Promise<{ client: A2AClient; agentCard: v1.AgentCard }> {
  const client = new A2AClient({ baseUrl: agentUrl, ...options });
  const agentCard = await client.getAgentCard();
  return { client, agentCard };
}
