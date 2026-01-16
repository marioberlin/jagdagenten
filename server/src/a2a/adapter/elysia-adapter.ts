/**
 * Elysia A2A Adapter (v1.0 Only)
 *
 * Bridges the @liquidcrypto/a2a-sdk to Elysia HTTP framework.
 * Implements A2A Protocol v1.0 Draft Specification.
 */

import { randomUUID } from 'crypto';
import { v1 } from '@liquidcrypto/a2a-sdk';

// ============================================================================
// Types
// ============================================================================

export interface AgentExecutor {
  /**
   * Execute a message and return a result
   */
  execute(
    message: v1.Message,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult>;
}

export interface AgentExecutionContext {
  taskId: string;
  contextId: string;
  metadata?: Record<string, v1.JSONValue>;
}

export interface AgentExecutionResult {
  message?: v1.Message;
  artifacts?: v1.Artifact[];
  status?: v1.TaskState;
  error?: {
    code: number;
    message: string;
    data?: v1.JSONValue;
  };
}

export interface TaskStore {
  get(taskId: string): Promise<v1.Task | null>;
  set(task: v1.Task): Promise<void>;
  delete(taskId: string): Promise<void>;
  listByContext(contextId: string): Promise<v1.Task[]>;
}

export interface PushNotificationStore {
  get(taskId: string): Promise<v1.PushNotificationConfig | null>;
  set(taskId: string, config: v1.PushNotificationConfig): Promise<void>;
  delete(taskId: string): Promise<void>;
}

export interface EventQueue {
  subscribe(taskId: string): AsyncGenerator<v1.TaskStatusUpdateEvent | v1.TaskArtifactUpdateEvent>;
  publish(event: v1.TaskStatusUpdateEvent | v1.TaskArtifactUpdateEvent): void;
}

export interface AuthenticatedExtendedCardProvider {
  /**
   * Returns extended agent card with authenticated user's context
   */
  getExtendedCard(authContext: AuthContext): Promise<v1.AgentCard>;
}

export interface AuthContext {
  userId?: string;
  token?: string;
  headers?: Record<string, string | undefined>;
}

export interface ElysiaAdapterConfig {
  agentCard: v1.AgentCard;
  executor: AgentExecutor;
  taskStore?: TaskStore;
  eventQueue?: EventQueue;
  pushNotificationStore?: PushNotificationStore;
  authenticatedExtendedCardProvider?: AuthenticatedExtendedCardProvider;
}

// ============================================================================
// In-Memory Implementations (for development)
// ============================================================================

class InMemoryTaskStore implements TaskStore {
  private tasks = new Map<string, v1.Task>();
  private contextIndex = new Map<string, Set<string>>();

  async get(taskId: string): Promise<v1.Task | null> {
    return this.tasks.get(taskId) ?? null;
  }

  async set(task: v1.Task): Promise<void> {
    this.tasks.set(task.id, task);

    // Update context index
    if (!this.contextIndex.has(task.contextId)) {
      this.contextIndex.set(task.contextId, new Set());
    }
    this.contextIndex.get(task.contextId)!.add(task.id);
  }

  async delete(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (task) {
      this.contextIndex.get(task.contextId)?.delete(taskId);
      this.tasks.delete(taskId);
    }
  }

  async listByContext(contextId: string): Promise<v1.Task[]> {
    const taskIds = this.contextIndex.get(contextId);
    if (!taskIds) return [];
    return Array.from(taskIds)
      .map(id => this.tasks.get(id))
      .filter((t): t is v1.Task => t !== undefined);
  }
}

class InMemoryPushNotificationStore implements PushNotificationStore {
  private configs = new Map<string, v1.PushNotificationConfig>();

  async get(taskId: string): Promise<v1.PushNotificationConfig | null> {
    return this.configs.get(taskId) ?? null;
  }

  async set(taskId: string, config: v1.PushNotificationConfig): Promise<void> {
    this.configs.set(taskId, config);
  }

  async delete(taskId: string): Promise<void> {
    this.configs.delete(taskId);
  }
}

class InMemoryEventQueue implements EventQueue {
  private subscribers = new Map<string, ((event: v1.TaskStatusUpdateEvent | v1.TaskArtifactUpdateEvent) => void)[]>();

  async *subscribe(taskId: string): AsyncGenerator<v1.TaskStatusUpdateEvent | v1.TaskArtifactUpdateEvent> {
    const queue: (v1.TaskStatusUpdateEvent | v1.TaskArtifactUpdateEvent)[] = [];
    let resolve: (() => void) | null = null;

    const handler = (event: v1.TaskStatusUpdateEvent | v1.TaskArtifactUpdateEvent) => {
      queue.push(event);
      if (resolve) {
        resolve();
        resolve = null;
      }
    };

    if (!this.subscribers.has(taskId)) {
      this.subscribers.set(taskId, []);
    }
    this.subscribers.get(taskId)!.push(handler);

    try {
      while (true) {
        if (queue.length > 0) {
          yield queue.shift()!;
        } else {
          await new Promise<void>(r => { resolve = r; });
        }
      }
    } finally {
      const handlers = this.subscribers.get(taskId);
      if (handlers) {
        const idx = handlers.indexOf(handler);
        if (idx >= 0) handlers.splice(idx, 1);
      }
    }
  }

  publish(event: v1.TaskStatusUpdateEvent | v1.TaskArtifactUpdateEvent): void {
    const taskId = event.taskId;
    const handlers = this.subscribers.get(taskId);
    if (handlers) {
      handlers.forEach(h => h(event));
    }
  }
}

// ============================================================================
// JSON-RPC Error Codes
// ============================================================================

const JSON_RPC_ERRORS = {
  PARSE_ERROR: { code: -32700, message: 'Parse error' },
  INVALID_REQUEST: { code: -32600, message: 'Invalid Request' },
  METHOD_NOT_FOUND: { code: -32601, message: 'Method not found' },
  INVALID_PARAMS: { code: -32602, message: 'Invalid params' },
  INTERNAL_ERROR: { code: -32603, message: 'Internal error' },
  TASK_NOT_FOUND: { code: -32001, message: 'Task not found' },
  TASK_NOT_CANCELABLE: { code: -32002, message: 'Task cannot be canceled' },
  PUSH_NOTIFICATION_NOT_SUPPORTED: { code: -32003, message: 'Push notifications not supported' },
  PUSH_NOTIFICATION_NOT_CONFIGURED: { code: -32003, message: 'Push notification not configured for task' },
  AUTHENTICATED_EXTENDED_CARD_NOT_CONFIGURED: { code: -32007, message: 'Authenticated extended card not configured' },
} as const;

const TERMINAL_STATES: v1.TaskState[] = [
  'completed',
  'cancelled',
  'failed',
  'rejected',
];

// ============================================================================
// Elysia Adapter
// ============================================================================

export class ElysiaA2AAdapter {
  private taskStore: TaskStore;
  private eventQueue: EventQueue;
  private pushNotificationStore: PushNotificationStore;
  private agentCard: v1.AgentCard;
  private executor: AgentExecutor;
  private authenticatedExtendedCardProvider?: AuthenticatedExtendedCardProvider;
  private authContext?: AuthContext;

  constructor(config: ElysiaAdapterConfig) {
    this.agentCard = config.agentCard;
    this.executor = config.executor;
    this.taskStore = config.taskStore ?? new InMemoryTaskStore();
    this.eventQueue = config.eventQueue ?? new InMemoryEventQueue();
    this.pushNotificationStore = config.pushNotificationStore ?? new InMemoryPushNotificationStore();
    this.authenticatedExtendedCardProvider = config.authenticatedExtendedCardProvider;
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Handle a JSON-RPC request (v1.0 only)
   */
  async handleRequest(
    body: unknown,
    headers?: Record<string, string | undefined>
  ): Promise<v1.JSONRPCResponse> {
    // Capture auth context for authenticated methods
    this.authContext = {
      headers,
      token: headers?.authorization?.replace(/^Bearer\s+/i, ''),
    };

    // Process the request directly (v1.0 only, no version detection)
    return this.processRequest(body as v1.JSONRPCRequest);
  }

  /**
   * Handle a streaming request (SSE) - v1.0 only
   */
  async *handleStreamRequest(
    body: unknown,
    _headers?: Record<string, string | undefined>
  ): AsyncGenerator<string> {
    const request = body as v1.JSONRPCRequest;
    const method = request.method;

    // Handle Resubscribe streaming method
    if (method === 'Resubscribe') {
      yield* this.handleResubscribe(request);
      return;
    }

    const params = request.params as v1.MessageSendParams | undefined;

    // Only message/send and message/stream support streaming
    if (method !== 'SendMessage' && method !== 'StreamMessage') {
      yield `data: ${JSON.stringify({
        jsonrpc: '2.0',
        id: request.id,
        error: JSON_RPC_ERRORS.METHOD_NOT_FOUND,
      })}\n\n`;
      return;
    }

    // Create task
    const taskId = randomUUID();
    const contextId = params?.message?.contextId ?? randomUUID();

    const task: v1.Task = {
      id: taskId,
      contextId,
      status: {
        state: 'submitted',
        timestamp: new Date().toISOString(),
      },
      artifacts: [],
      history: [],
    };

    await this.taskStore.set(task);

    // Send initial status
    yield this.formatSSE({
      jsonrpc: '2.0',
      id: request.id,
      result: {
        taskId,
        contextId,
        status: task.status,
      },
    });

    // Execute and stream updates
    try {
      // Update to working state
      task.status = {
        state: 'working',
        timestamp: new Date().toISOString(),
      };
      await this.taskStore.set(task);

      yield this.formatSSE({
        jsonrpc: '2.0',
        id: request.id,
        result: {
          type: 'status',
          taskId,
          status: task.status,
        },
      });

      // Execute agent
      const message = params?.message;
      if (!message) {
        throw { ...JSON_RPC_ERRORS.INVALID_PARAMS, data: 'message is required' };
      }

      const result = await this.executor.execute(message, {
        taskId,
        contextId,
        metadata: params?.metadata,
      });

      // Stream artifacts
      if (result.artifacts) {
        for (const artifact of result.artifacts) {
          task.artifacts = task.artifacts ?? [];
          task.artifacts.push(artifact);

          yield this.formatSSE({
            jsonrpc: '2.0',
            id: request.id,
            result: {
              type: 'artifact',
              taskId,
              artifact,
            },
          });
        }
      }

      // Complete task
      task.status = {
        state: result.status ?? 'completed',
        message: result.message,
        timestamp: new Date().toISOString(),
      };
      await this.taskStore.set(task);

      yield this.formatSSE({
        jsonrpc: '2.0',
        id: request.id,
        result: {
          type: 'status',
          taskId,
          status: task.status,
          final: true,
        },
      });

    } catch (error) {
      // Handle error
      task.status = {
        state: 'failed',
        timestamp: new Date().toISOString(),
      };
      await this.taskStore.set(task);

      const errorResponse = this.formatError(request.id, error);
      yield this.formatSSE(errorResponse);
    }
  }

  /**
   * Get the agent card
   */
  getAgentCard(): v1.AgentCard {
    return this.agentCard;
  }

  /**
   * Get response headers (v1.0 only)
   */
  getResponseHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'A2A-Protocol-Version': '1.0',
    };
  }

  /**
   * Get task store for external access
   */
  getTaskStore(): TaskStore {
    return this.taskStore;
  }

  /**
   * Get event queue for external access
   */
  getEventQueue(): EventQueue {
    return this.eventQueue;
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private async processRequest(
    request: v1.JSONRPCRequest
  ): Promise<v1.JSONRPCResponse> {
    const { id, method, params } = request;

    // Validate JSON-RPC version
    if (request.jsonrpc !== '2.0') {
      return {
        jsonrpc: '2.0',
        id,
        error: JSON_RPC_ERRORS.INVALID_REQUEST,
      } as v1.JSONRPCErrorResponse;
    }

    try {
      const result = await this.routeMethod(method, params);
      return {
        jsonrpc: '2.0',
        id,
        result: result as v1.JSONValue,
      } as v1.JSONRPCSuccessResponse;
    } catch (error) {
      return this.formatError(id, error);
    }
  }

  private async routeMethod(
    method: string,
    params: unknown
  ): Promise<unknown> {
    switch (method) {
      // v1.0 method names (PascalCase)
      case 'SendMessage':
        return this.handleSendMessage(params as v1.MessageSendParams);
      case 'GetTask':
        return this.handleGetTask(params as { id: string; historyLength?: number });
      case 'CancelTask':
        return this.handleCancelTask(params as { id: string });
      case 'ListTasks':
        return this.handleListTasks(params as { contextId?: string; state?: v1.TaskState[] });

      // Push notification methods (v1.0)
      case 'SetTaskPushNotificationConfig':
        return this.handleSetTaskPushNotificationConfig(params as v1.TaskPushNotificationConfig);
      case 'GetTaskPushNotificationConfig':
        return this.handleGetTaskPushNotificationConfig(params as { id: string });
      case 'DeleteTaskPushNotificationConfig':
        return this.handleDeleteTaskPushNotificationConfig(params as { id: string });

      // Resubscribe method (v1.0 streaming)
      case 'Resubscribe':
        // Resubscribe is only valid for streaming - throw error for non-streaming
        throw { ...JSON_RPC_ERRORS.INVALID_REQUEST, data: 'Resubscribe is only valid for streaming requests' };

      // Authenticated extended card (v1.0)
      case 'GetAuthenticatedExtendedCard':
        return this.handleGetAuthenticatedExtendedCard();

      // v0.x method names (for compatibility - already normalized but just in case)
      case 'message/send':
        return this.handleSendMessage(params as v1.MessageSendParams);
      case 'tasks/get':
        return this.handleGetTask(params as { id: string; historyLength?: number });
      case 'tasks/cancel':
        return this.handleCancelTask(params as { id: string });
      case 'tasks/list':
        return this.handleListTasks(params as { contextId?: string; state?: v1.TaskState[] });
      case 'agent/card':
        return this.agentCard;

      default:
        throw { ...JSON_RPC_ERRORS.METHOD_NOT_FOUND, data: { method } };
    }
  }

  private async handleSendMessage(params: v1.MessageSendParams): Promise<v1.Task> {
    const { message, configuration: _configuration } = params;

    // Create task
    const taskId = randomUUID();
    const contextId = message?.contextId ?? randomUUID();

    const task: v1.Task = {
      id: taskId,
      contextId,
      status: {
        state: 'submitted',
        timestamp: new Date().toISOString(),
      },
      artifacts: [],
      history: message ? [message] : [],
    };

    await this.taskStore.set(task);

    // Update to working
    task.status = {
      state: 'working',
      timestamp: new Date().toISOString(),
    };
    await this.taskStore.set(task);

    // Execute agent
    if (!message) {
      throw { ...JSON_RPC_ERRORS.INVALID_PARAMS, data: 'message is required' };
    }

    const result = await this.executor.execute(message, {
      taskId,
      contextId,
      metadata: params?.metadata,
    });

    // Apply result
    if (result.artifacts) {
      task.artifacts = result.artifacts;
    }

    if (result.message) {
      task.history?.push(result.message);
    }

    // Update status
    task.status = {
      state: result.status ?? 'completed',
      message: result.message,
      timestamp: new Date().toISOString(),
    };

    await this.taskStore.set(task);
    return task;
  }

  private async handleGetTask(
    params: { id: string; historyLength?: number }
  ): Promise<v1.Task> {
    const task = await this.taskStore.get(params.id);
    if (!task) {
      throw { ...JSON_RPC_ERRORS.TASK_NOT_FOUND, data: { taskId: params.id } };
    }

    // Apply history limit
    if (params.historyLength !== undefined && task.history) {
      return {
        ...task,
        history: task.history.slice(-params.historyLength),
      };
    }

    return task;
  }

  private async handleCancelTask(params: { id: string }): Promise<v1.Task> {
    const task = await this.taskStore.get(params.id);
    if (!task) {
      throw { ...JSON_RPC_ERRORS.TASK_NOT_FOUND, data: { taskId: params.id } };
    }

    if (TERMINAL_STATES.includes(task.status.state as v1.TaskState)) {
      throw { ...JSON_RPC_ERRORS.TASK_NOT_CANCELABLE, data: { state: task.status.state } };
    }

    task.status = {
      state: 'cancelled',
      timestamp: new Date().toISOString(),
    };

    await this.taskStore.set(task);
    return task;
  }

  private async handleListTasks(
    params: { contextId?: string; state?: v1.TaskState[]; offset?: number; limit?: number }
  ): Promise<v1.Task[]> {
    let tasks: v1.Task[];

    if (params.contextId) {
      tasks = await this.taskStore.listByContext(params.contextId);
    } else {
      // For now, return empty array if no contextId
      // TODO: Implement full listing with pagination
      tasks = [];
    }

    // Filter by state
    if (params.state && params.state.length > 0) {
      tasks = tasks.filter(t => params.state!.includes(t.status.state as v1.TaskState));
    }

    // Apply pagination
    const offset = params.offset ?? 0;
    const limit = params.limit ?? 20;
    return tasks.slice(offset, offset + limit);
  }

  // ==========================================================================
  // Push Notification Methods (v1.0)
  // ==========================================================================

  private async handleSetTaskPushNotificationConfig(
    params: v1.TaskPushNotificationConfig
  ): Promise<v1.TaskPushNotificationConfig> {
    // Verify task exists
    const task = await this.taskStore.get(params.taskId);
    if (!task) {
      throw { ...JSON_RPC_ERRORS.TASK_NOT_FOUND, data: { taskId: params.taskId } };
    }

    // Verify agent supports push notifications
    if (!this.agentCard.capabilities?.pushNotifications) {
      throw JSON_RPC_ERRORS.PUSH_NOTIFICATION_NOT_SUPPORTED;
    }

    // Store the push notification config
    await this.pushNotificationStore.set(params.taskId, params.pushNotificationConfig);

    return params;
  }

  private async handleGetTaskPushNotificationConfig(
    params: { id: string }
  ): Promise<v1.TaskPushNotificationConfig> {
    // Verify task exists
    const task = await this.taskStore.get(params.id);
    if (!task) {
      throw { ...JSON_RPC_ERRORS.TASK_NOT_FOUND, data: { taskId: params.id } };
    }

    // Get the push notification config
    const config = await this.pushNotificationStore.get(params.id);
    if (!config) {
      throw { ...JSON_RPC_ERRORS.PUSH_NOTIFICATION_NOT_CONFIGURED, data: { taskId: params.id } };
    }

    return {
      taskId: params.id,
      pushNotificationConfig: config,
    };
  }

  private async handleDeleteTaskPushNotificationConfig(
    params: { id: string }
  ): Promise<{ taskId: string; deleted: boolean }> {
    // Verify task exists
    const task = await this.taskStore.get(params.id);
    if (!task) {
      throw { ...JSON_RPC_ERRORS.TASK_NOT_FOUND, data: { taskId: params.id } };
    }

    // Delete the push notification config
    await this.pushNotificationStore.delete(params.id);

    return {
      taskId: params.id,
      deleted: true,
    };
  }

  // ==========================================================================
  // Authenticated Extended Card Method (v1.0)
  // ==========================================================================

  private async handleGetAuthenticatedExtendedCard(): Promise<v1.AgentCard> {
    // Check if extended card provider is configured
    if (!this.authenticatedExtendedCardProvider) {
      throw JSON_RPC_ERRORS.AUTHENTICATED_EXTENDED_CARD_NOT_CONFIGURED;
    }

    // Get extended card with auth context
    return this.authenticatedExtendedCardProvider.getExtendedCard(this.authContext ?? {});
  }

  // ==========================================================================
  // Resubscribe Method (v1.0 Streaming)
  // ==========================================================================

  private async *handleResubscribe(
    request: v1.JSONRPCRequest
  ): AsyncGenerator<string> {
    const params = request.params as { id: string } | undefined;

    if (!params?.id) {
      yield this.formatSSE({
        jsonrpc: '2.0',
        id: request.id,
        error: { ...JSON_RPC_ERRORS.INVALID_PARAMS, data: 'Task ID is required' },
      });
      return;
    }

    // Verify task exists
    const task = await this.taskStore.get(params.id);
    if (!task) {
      yield this.formatSSE({
        jsonrpc: '2.0',
        id: request.id,
        error: { ...JSON_RPC_ERRORS.TASK_NOT_FOUND, data: { taskId: params.id } },
      });
      return;
    }

    // Send current task status
    yield this.formatSSE({
      jsonrpc: '2.0',
      id: request.id,
      result: {
        type: 'status',
        taskId: task.id,
        contextId: task.contextId,
        status: task.status,
        final: TERMINAL_STATES.includes(task.status.state as v1.TaskState),
      },
    });

    // If task is already in terminal state, we're done
    if (TERMINAL_STATES.includes(task.status.state as v1.TaskState)) {
      return;
    }

    // Subscribe to future events
    const eventStream = this.eventQueue.subscribe(params.id);

    try {
      for await (const event of eventStream) {
        yield this.formatSSE({
          jsonrpc: '2.0',
          id: request.id,
          result: event,
        });

        // Check if this is a final status
        if ('status' in event && TERMINAL_STATES.includes(event.status.state as v1.TaskState)) {
          return;
        }
      }
    } finally {
      // Cleanup handled by generator
    }
  }

  // ==========================================================================
  // Error Formatting
  // ==========================================================================

  private formatError(
    id: string | number | undefined,
    error: unknown
  ): v1.JSONRPCErrorResponse {
    const normalizedId = id ?? null;

    if (typeof error === 'object' && error !== null && 'code' in error) {
      return {
        jsonrpc: '2.0',
        id: normalizedId,
        error: error as v1.JSONRPCError,
      };
    }

    console.error('[ElysiaA2AAdapter] Error:', error);
    return {
      jsonrpc: '2.0',
      id: normalizedId,
      error: {
        ...JSON_RPC_ERRORS.INTERNAL_ERROR,
        data: error instanceof Error ? error.message : String(error),
      },
    };
  }

  private formatSSE(data: unknown): string {
    return `data: ${JSON.stringify(data)}\n\n`;
  }
}

export { InMemoryTaskStore, InMemoryEventQueue, InMemoryPushNotificationStore };
