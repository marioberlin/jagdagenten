/**
 * Base client implementation for A2A TypeScript SDK
 */

import {
  AgentCard,
  GetTaskPushNotificationConfigParams,
  Message,
  Task,
  TaskIdParams,
  TaskPushNotificationConfig,
  TaskQueryParams,
} from '../types';
import {
  Client,
  ClientCallContext,
  ClientCallInterceptor,
  ClientConfig,
  ClientEvent,
  Consumer,
} from './interfaces';

/**
 * Abstract base client class that provides common functionality
 * for A2A clients.
 */
export abstract class BaseClient implements Client {
  protected consumers: Consumer[] = [];
  protected middleware: ClientCallInterceptor[] = [];
  protected config: Required<ClientConfig>;

  constructor(config: ClientConfig = {}) {
    this.config = {
      streaming: config.streaming ?? true,
      polling: config.polling ?? false,
      acceptedOutputModes: config.acceptedOutputModes ?? [],
      pushNotificationConfigs: config.pushNotificationConfigs ?? [],
      extensions: config.extensions ?? [],
      preferredTransport: config.preferredTransport ?? 'JSONRPC',
      useClientPreference: config.useClientPreference ?? false,
      timeout: config.timeout ?? 30000,
      headers: config.headers ?? {},
      ...config,
    };
  }

  abstract sendMessage(
    request: Message,
    context?: ClientCallContext,
    requestMetadata?: Record<string, string>,
    extensions?: string[]
  ): AsyncIterableIterator<ClientEvent | Message>;

  abstract getTask(
    request: TaskQueryParams,
    context?: ClientCallContext,
    extensions?: string[]
  ): Promise<Task>;

  abstract cancelTask(
    request: TaskIdParams,
    context?: ClientCallContext,
    extensions?: string[]
  ): Promise<Task>;

  abstract setTaskCallback(
    request: TaskPushNotificationConfig,
    context?: ClientCallContext,
    extensions?: string[]
  ): Promise<TaskPushNotificationConfig>;

  abstract getTaskCallback(
    request: GetTaskPushNotificationConfigParams,
    context?: ClientCallContext,
    extensions?: string[]
  ): Promise<TaskPushNotificationConfig>;

  abstract resubscribe(
    request: TaskIdParams,
    context?: ClientCallContext,
    extensions?: string[]
  ): AsyncIterableIterator<ClientEvent>;

  abstract getCard(
    context?: ClientCallContext,
    extensions?: string[],
    signatureVerifier?: (card: AgentCard) => void
  ): Promise<AgentCard>;

  addEventConsumer(consumer: Consumer): void {
    this.consumers.push(consumer);
  }

  addRequestMiddleware(middleware: ClientCallInterceptor): void {
    this.middleware.push(middleware);
  }

  async consume(event: ClientEvent | Message | null, card: AgentCard): Promise<void> {
    if (!event) {
      return;
    }

    for (const consumer of this.consumers) {
      try {
        await consumer(event, card);
      } catch (error) {
        // Log error but continue processing other consumers
        console.error('Error in event consumer:', error);
      }
    }
  }

  abstract close(): Promise<void> | void;
}

/**
 * Helper function to create a default client call context
 */
export function createDefaultContext(config: Required<ClientConfig>): ClientCallContext {
  return {
    timeout: config.timeout,
  };
}

/**
 * Helper function to merge context with default config
 */
export function mergeContext(
  context: ClientCallContext | undefined,
  defaultContext: ClientCallContext
): ClientCallContext {
  return {
    ...defaultContext,
    ...context,
  };
}
