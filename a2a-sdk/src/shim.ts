/**
 * A2A SDK v1.0 - Clean, Minimal Implementation
 *
 * This module provides a simple, high-performance A2A client
 * strictly compliant with A2A Protocol v1.0 Draft Specification.
 *
 * @see https://a2a-protocol.org/latest/specification/
 */

// Re-export all v1.0 types
export * from './types/v1';

import type {
  AgentCard,
  Task,
  JSONRPCRequest,
  JSONRPCResponse,
  JSONRPCSuccessResponse,
  TaskStatusUpdateEvent,
  TaskArtifactUpdateEvent,
  MessageSendParams,
  JSONValue,
  TaskStatus,
  Artifact,
} from './types/v1';

import {
  A2AMethods,
  isJSONRPCError,
  userMessage,
  textPart,
} from './types/v1';

// ============================================================================
// A2A Client
// ============================================================================

export class A2AClientError extends Error {
  constructor(
    message: string,
    public code: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'A2AClientError';
  }
}

export interface A2AClientConfig {
  baseUrl: string;
  authToken?: string;
  headers?: Record<string, string>;
  timeout?: number;
  // Legacy fields for backward compatibility
  enableA2UI?: boolean;
  streaming?: boolean;
  polling?: boolean;
  acceptedOutputModes?: string[];
  extensions?: string[];
  preferredTransport?: string;
}

export interface SendOptions {
  contextId?: string;
  blocking?: boolean;
  historyLength?: number;
  configuration?: Record<string, unknown>;
}

export type StreamEvent =
  | { type: 'status'; data: TaskStatusUpdateEvent | { status: TaskStatus } }
  | { type: 'artifact'; data: TaskArtifactUpdateEvent | { artifact: Artifact } }
  | { type: 'complete'; task: Task }
  | { type: 'error'; error: { code: number; message: string; data?: unknown } };

export interface A2AClient {
  /** Send a text message and wait for response */
  sendText(text: string, options?: SendOptions): Promise<Task>;

  /** Send a message with custom parts */
  sendMessage(params: MessageSendParams): Promise<Task>;

  /** Stream a text message with SSE events */
  streamText(text: string, options?: SendOptions, signal?: { signal?: AbortSignal }): AsyncIterableIterator<StreamEvent>;

  /** Stream a message with custom parts */
  streamMessage(params: MessageSendParams, signal?: AbortSignal): AsyncIterableIterator<StreamEvent>;

  /** Get the agent card */
  getCard(): Promise<AgentCard>;

  /** Get a task by ID */
  getTask?(taskId: string, historyLength?: number): Promise<Task>;

  /** Cancel a task */
  cancelTask?(taskId: string): Promise<Task>;

  /** Close the client */
  close(): void;
}

/**
 * Create an A2A v1.0 client
 */
export function createA2AClient(config: A2AClientConfig): A2AClient {
  const baseUrl = config.baseUrl || '';
  const requestTimeout = config.timeout || 30000;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'A2A-Protocol-Version': '1.0',
    ...config.headers,
  };

  if (config.authToken) {
    headers['Authorization'] = `Bearer ${config.authToken}`;
  }

  async function rpc<T>(method: string, params?: Record<string, JSONValue>): Promise<T> {
    const request: JSONRPCRequest = {
      jsonrpc: '2.0',
      id: crypto.randomUUID?.() || `req-${Date.now()}`,
      method,
      params,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), requestTimeout);

    try {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new A2AClientError(`HTTP error: ${response.status}`, response.status);
      }

      const json = (await response.json()) as JSONRPCResponse;

      if (isJSONRPCError(json)) {
        throw new A2AClientError(json.error.message, json.error.code, json.error.data);
      }

      return (json as JSONRPCSuccessResponse).result as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async function* streamRpc(
    method: string,
    params?: Record<string, JSONValue>,
    signal?: AbortSignal
  ): AsyncIterableIterator<StreamEvent> {
    const request: JSONRPCRequest = {
      jsonrpc: '2.0',
      id: crypto.randomUUID?.() || `req-${Date.now()}`,
      method,
      params,
    };

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        ...headers,
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(request),
      signal,
    });

    if (!response.ok) {
      throw new A2AClientError(`HTTP error: ${response.status}`, response.status);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new A2AClientError('No response body', -1);
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (!dataStr || dataStr === '[DONE]') continue;

            try {
              const data = JSON.parse(dataStr) as JSONRPCResponse;

              if (isJSONRPCError(data)) {
                yield { type: 'error', error: data.error };
                continue;
              }

              const result = (data as JSONRPCSuccessResponse).result as Record<string, unknown>;

              // Determine event type based on result structure
              if ('status' in result && 'final' in result) {
                const event = result as unknown as TaskStatusUpdateEvent;
                if (event.final) {
                  yield {
                    type: 'complete',
                    task: {
                      id: event.taskId,
                      contextId: event.contextId,
                      status: event.status,
                    } as Task,
                  };
                } else {
                  yield { type: 'status', data: event };
                }
              } else if ('artifact' in result) {
                yield { type: 'artifact', data: result as unknown as TaskArtifactUpdateEvent };
              } else if ('id' in result && 'status' in result) {
                yield { type: 'complete', task: result as unknown as Task };
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  return {
    async sendText(text: string, options?: SendOptions): Promise<Task> {
      const message = userMessage([textPart(text)], {
        contextId: options?.contextId,
      });

      return this.sendMessage({
        message,
        configuration: {
          blocking: options?.blocking,
          historyLength: options?.historyLength,
        },
      });
    },

    async sendMessage(params: MessageSendParams): Promise<Task> {
      return rpc<Task>(A2AMethods.SEND_MESSAGE, params as unknown as Record<string, JSONValue>);
    },

    async *streamText(
      text: string,
      options?: SendOptions,
      signalWrapper?: { signal?: AbortSignal }
    ): AsyncIterableIterator<StreamEvent> {
      const message = userMessage([textPart(text)], {
        contextId: options?.contextId,
      });

      yield* this.streamMessage(
        {
          message,
          configuration: {
            blocking: options?.blocking,
            historyLength: options?.historyLength,
          },
        },
        signalWrapper?.signal
      );
    },

    async *streamMessage(
      params: MessageSendParams,
      signal?: AbortSignal
    ): AsyncIterableIterator<StreamEvent> {
      yield* streamRpc(A2AMethods.STREAM_MESSAGE, params as unknown as Record<string, JSONValue>, signal);
    },

    async getCard(): Promise<AgentCard> {
      // A2A v1.0 spec path
      const cardUrl = baseUrl.replace(/\/$/, '') + '/.well-known/agent-card.json';
      const response = await fetch(cardUrl, { headers });

      if (!response.ok) {
        throw new A2AClientError(`Failed to fetch agent card: ${response.status}`, response.status);
      }

      return response.json() as Promise<AgentCard>;
    },

    async getTask(taskId: string, historyLength?: number): Promise<Task> {
      return rpc<Task>(A2AMethods.GET_TASK, { id: taskId, historyLength } as unknown as Record<string, JSONValue>);
    },

    async cancelTask(taskId: string): Promise<Task> {
      return rpc<Task>(A2AMethods.CANCEL_TASK, { id: taskId } as unknown as Record<string, JSONValue>);
    },

    close(): void {
      // No-op for HTTP client
    },
  };
}

// ============================================================================
// v1 Namespace (for backward compatibility with imports like `v1.Task`)
// ============================================================================

import * as V1Types from './types/v1';

export namespace v1 {
  // Core types
  export type Task = V1Types.Task;
  export type TextPart = V1Types.TextPart;
  export type AgentCard = V1Types.AgentCard;
  export type Message = V1Types.Message;
  export type MessageSendConfiguration = V1Types.MessageSendConfiguration;
  export type MessageSendParams = V1Types.MessageSendParams;
  export type JSONValue = V1Types.JSONValue;
  export type Artifact = V1Types.Artifact;
  export type TaskStatus = V1Types.TaskStatus;
  export type TaskState = V1Types.TaskState;
  export type Part = V1Types.Part;
  export type FilePart = V1Types.FilePart;
  export type DataPart = V1Types.DataPart;
  export type Role = V1Types.Role;

  // Role constants for backward compatibility (use string literals in new code)
  export const Role = {
    USER: 'user' as const,
    AGENT: 'agent' as const,
  };

  // TaskState constants for backward compatibility (use string literals in new code)
  export const TaskState = {
    SUBMITTED: 'submitted' as const,
    WORKING: 'working' as const,
    COMPLETED: 'completed' as const,
    FAILED: 'failed' as const,
    CANCELLED: 'cancelled' as const,
    INPUT_REQUIRED: 'input-required' as const,
    REJECTED: 'rejected' as const,
    AUTH_REQUIRED: 'auth-required' as const,
  };

  // Event types
  export type TaskStatusUpdateEvent = V1Types.TaskStatusUpdateEvent;
  export type TaskArtifactUpdateEvent = V1Types.TaskArtifactUpdateEvent;

  // Push notification types
  export type PushNotificationConfig = V1Types.PushNotificationConfig;
  export type TaskPushNotificationConfig = V1Types.TaskPushNotificationConfig;

  // JSON-RPC types
  export type JSONRPCRequest = V1Types.JSONRPCRequest;
  export type JSONRPCResponse = V1Types.JSONRPCResponse;
  export type JSONRPCSuccessResponse = V1Types.JSONRPCSuccessResponse;
  export type JSONRPCErrorResponse = V1Types.JSONRPCErrorResponse;
  export type JSONRPCError = V1Types.JSONRPCError;

  // Re-export type guards
  export const isTextPart = V1Types.isTextPart;
  export const isFilePart = V1Types.isFilePart;
  export const isDataPart = V1Types.isDataPart;
  export const isJSONRPCError = V1Types.isJSONRPCError;

  // Re-export utility functions
  export const textPart = V1Types.textPart;
  export const userMessage = V1Types.userMessage;
  export const agentMessage = V1Types.agentMessage;
  export const createRequest = V1Types.createRequest;
  export const createSuccessResponse = V1Types.createSuccessResponse;
  export const createErrorResponse = V1Types.createErrorResponse;

  // Re-export constants
  export const A2AErrorCodes = V1Types.A2AErrorCodes;
  export const A2AMethods = V1Types.A2AMethods;
}

// ============================================================================
// A2UI Extension Types (re-exported from types/a2ui)
// ============================================================================

import * as A2UITypes from './types/a2ui';

export namespace a2ui {
  // Re-export all types
  export type A2UIComponentType = A2UITypes.A2UIComponentType;
  export type A2UIComponent = A2UITypes.A2UIComponent;
  export type A2UIComponentBase = A2UITypes.A2UIComponentBase;
  export type A2UIComponentProps = A2UITypes.A2UIComponentProps;
  export type A2UIStyle = A2UITypes.A2UIStyle;
  export type A2UIEventBinding = A2UITypes.A2UIEventBinding;
  export type A2UIEventAction = A2UITypes.A2UIEventAction;
  export type A2UICallbackAction = A2UITypes.A2UICallbackAction;
  export type A2UINavigateAction = A2UITypes.A2UINavigateAction;
  export type A2UISetModelAction = A2UITypes.A2UISetModelAction;
  export type A2UISubmitAction = A2UITypes.A2UISubmitAction;
  export type A2UIAccessibility = A2UITypes.A2UIAccessibility;
  export type A2UISurfaceStyling = A2UITypes.A2UISurfaceStyling;
  export type A2UIMessage = A2UITypes.A2UIMessage;
  export type BeginRenderingMessage = A2UITypes.BeginRenderingMessage;
  export type SurfaceUpdateMessage = A2UITypes.SurfaceUpdateMessage;
  export type SetModelMessage = A2UITypes.SetModelMessage;
  export type EndRenderingMessage = A2UITypes.EndRenderingMessage;
  export type ClearSurfaceMessage = A2UITypes.ClearSurfaceMessage;
  export type UserActionMessage = A2UITypes.UserActionMessage;
  export type A2UIPart = A2UITypes.A2UIPart;
  export type A2UISelectOption = A2UITypes.A2UISelectOption;
  export type A2UITableColumn = A2UITypes.A2UITableColumn;
  export type A2UIChartSeries = A2UITypes.A2UIChartSeries;

  // Re-export functions
  export const isA2UIArtifact = A2UITypes.isA2UIArtifact;
  export const extractA2UIMessages = A2UITypes.extractA2UIMessages;
  export const isBeginRenderingMessage = A2UITypes.isBeginRenderingMessage;
  export const isSurfaceUpdateMessage = A2UITypes.isSurfaceUpdateMessage;
  export const isSetModelMessage = A2UITypes.isSetModelMessage;
  export const isEndRenderingMessage = A2UITypes.isEndRenderingMessage;
  export const isClearSurfaceMessage = A2UITypes.isClearSurfaceMessage;

  // Re-export builders
  export const text = A2UITypes.text;
  export const button = A2UITypes.button;
  export const card = A2UITypes.card;
  export const list = A2UITypes.list;
  export const image = A2UITypes.image;
  export const textField = A2UITypes.textField;
  export const form = A2UITypes.form;
  export const row = A2UITypes.row;
  export const column = A2UITypes.column;
  export const callback = A2UITypes.callback;
  export const beginRendering = A2UITypes.beginRendering;
  export const surfaceUpdate = A2UITypes.surfaceUpdate;
  export const setModel = A2UITypes.setModel;
  export const createA2UIPart = A2UITypes.createA2UIPart;

  // Legacy aliases (backward compatibility)
  /** @deprecated Use A2UIComponentType instead */
  export type ComponentType = A2UIComponentType;
}
