/**
 * JSON-RPC transport implementation for A2A TypeScript SDK
 */

import { EventEmitter } from 'events';
import {
  AgentCard,
  GetTaskPushNotificationConfigParams,
  JSONRPCErrorResponse,
  JSONRPCRequest,
  JSONRPCResponse,
  Message,
  MessageSendParams,
  SendMessageRequest,
  SendMessageResponse,
  Task,
  TaskArtifactUpdateEvent,
  TaskIdParams,
  TaskPushNotificationConfig,
  TaskQueryParams,
  TaskResubscriptionRequest,
  TaskStatusUpdateEvent,
} from '../types';
import { ClientCallContext, ClientTransport } from '../client/interfaces';

/**
 * JSON-RPC transport implementation
 */
export class JSONRPCTransport implements ClientTransport {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(baseUrl: string, headers: Record<string, string> = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.headers = {
      'Content-Type': 'application/json',
      ...headers,
    };
  }

  async sendMessage(
    request: Message,
    context?: ClientCallContext,
    extensions?: string[]
  ): Promise<Task | Message> {
    const params: MessageSendParams = {
      message: request,
      configuration: {
        accepted_output_modes: [],
        push_notification_config: undefined,
      },
      metadata: context?.metadata,
    };

    const jsonrpcRequest: SendMessageRequest = {
      jsonrpc: '2.0',
      id: this.generateId(),
      method: 'message/send',
      params,
    };

    const response = await this.sendRequest<SendMessageResponse>(jsonrpcRequest, context);

    if ('error' in response) {
      throw new Error(`JSON-RPC Error: ${response.error.message} (code: ${response.error.code})`);
    }

    return response.result as Task | Message;
  }

  async *sendMessageStreaming(
    request: Message,
    context?: ClientCallContext,
    extensions?: string[]
  ): AsyncIterableIterator<Message | Task | TaskStatusUpdateEvent | TaskArtifactUpdateEvent> {
    const params: MessageSendParams = {
      message: request,
      configuration: {
        accepted_output_modes: [],
        push_notification_config: undefined,
      },
      metadata: context?.metadata,
    };

    const jsonrpcRequest: SendMessageRequest = {
      jsonrpc: '2.0',
      id: this.generateId(),
      method: 'message/stream',
      params,
    };

    const stream = this.sendStreamingRequest<Message | Task | TaskStatusUpdateEvent | TaskArtifactUpdateEvent>(
      jsonrpcRequest,
      context
    );

    for await (const event of stream) {
      yield event;
    }
  }

  async getTask(
    request: TaskQueryParams,
    context?: ClientCallContext,
    extensions?: string[]
  ): Promise<Task> {
    const jsonrpcRequest: JSONRPCRequest = {
      jsonrpc: '2.0',
      id: this.generateId(),
      method: 'tasks/get',
      params: request,
    };

    const response = await this.sendRequest(jsonrpcRequest, context);

    if ('error' in response) {
      throw new Error(`JSON-RPC Error: ${response.error.message} (code: ${response.error.code})`);
    }

    return (response as any).result;
  }

  async cancelTask(
    request: TaskIdParams,
    context?: ClientCallContext,
    extensions?: string[]
  ): Promise<Task> {
    const jsonrpcRequest: JSONRPCRequest = {
      jsonrpc: '2.0',
      id: this.generateId(),
      method: 'tasks/cancel',
      params: request,
    };

    const response = await this.sendRequest(jsonrpcRequest, context);

    if ('error' in response) {
      throw new Error(`JSON-RPC Error: ${response.error.message} (code: ${response.error.code})`);
    }

    return (response as any).result;
  }

  async setTaskCallback(
    request: TaskPushNotificationConfig,
    context?: ClientCallContext,
    extensions?: string[]
  ): Promise<TaskPushNotificationConfig> {
    const jsonrpcRequest: JSONRPCRequest = {
      jsonrpc: '2.0',
      id: this.generateId(),
      method: 'tasks/pushNotificationConfig/set',
      params: request,
    };

    const response = await this.sendRequest(jsonrpcRequest, context);

    if ('error' in response) {
      throw new Error(`JSON-RPC Error: ${response.error.message} (code: ${response.error.code})`);
    }

    return (response as any).result;
  }

  async getTaskCallback(
    request: GetTaskPushNotificationConfigParams,
    context?: ClientCallContext,
    extensions?: string[]
  ): Promise<TaskPushNotificationConfig> {
    const jsonrpcRequest: JSONRPCRequest = {
      jsonrpc: '2.0',
      id: this.generateId(),
      method: 'tasks/pushNotificationConfig/get',
      params: request,
    };

    const response = await this.sendRequest(jsonrpcRequest, context);

    if ('error' in response) {
      throw new Error(`JSON-RPC Error: ${response.error.message} (code: ${response.error.code})`);
    }

    return (response as any).result;
  }

  async *resubscribe(
    request: TaskIdParams,
    context?: ClientCallContext,
    extensions?: string[]
  ): AsyncIterableIterator<Task | Message | TaskStatusUpdateEvent | TaskArtifactUpdateEvent> {
    const jsonrpcRequest: TaskResubscriptionRequest = {
      jsonrpc: '2.0',
      id: this.generateId(),
      method: 'tasks/resubscribe',
      params: request,
    };

    const stream = this.sendStreamingRequest<Task | Message | TaskStatusUpdateEvent | TaskArtifactUpdateEvent>(
      jsonrpcRequest,
      context
    );

    for await (const event of stream) {
      yield event;
    }
  }

  async getCard(
    context?: ClientCallContext,
    extensions?: string[]
  ): Promise<AgentCard> {
    const jsonrpcRequest: JSONRPCRequest = {
      jsonrpc: '2.0',
      id: this.generateId(),
      method: 'agent/getAuthenticatedExtendedCard',
    };

    const response = await this.sendRequest(jsonrpcRequest, context);

    if ('error' in response) {
      throw new Error(`JSON-RPC Error: ${response.error.message} (code: ${response.error.code})`);
    }

    return (response as any).result;
  }

  async close(): Promise<void> {
    // Clean up any resources if needed
  }

  private async sendRequest<T extends JSONRPCResponse>(
    request: JSONRPCRequest,
    context?: ClientCallContext
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), context?.timeout ?? 30000);

    try {
      const response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async *sendStreamingRequest<T>(
    request: JSONRPCRequest,
    context: ClientCallContext | undefined,
  ): AsyncIterableIterator<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), context?.timeout ?? 30000);

    try {
      const response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;

          try {
            const event = JSON.parse(line) as T;
            yield event;
          } catch (error) {
            console.error('Error parsing streaming event:', error);
          }
        }
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
