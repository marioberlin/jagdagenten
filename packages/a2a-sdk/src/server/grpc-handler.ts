/**
 * gRPC Handler for the A2A server.
 */

import type { RequestHandler } from './request-handler.js';
import type { ServerCallContext } from './context.js';
import type {
  AgentCard,
  TaskNotFoundError,
} from '../types/index.js';

import { ToProto, FromProto } from '../utils/proto-utils.js';

import type {
  SendMessageRequest,
  SendMessageResponse,
  StreamResponse,
  GetTaskRequest,
  CancelTaskRequest,
  TaskSubscriptionRequest,
  GetAgentCardRequest,
  GetTaskPushNotificationConfigRequest,
  CreateTaskPushNotificationConfigRequest,
  TaskPushNotificationConfig as PbTaskPushNotificationConfig,
} from '../../proto/a2a_pb';

import type { ServerDuplexStream, ServerReadableStream, ServerWritableStream, ServiceError } from '@grpc/grpc-js';

export type CallContextBuilder = (context: any) => ServerCallContext;

export interface GrpcHandlerOptions {
  agentCard: AgentCard;
  requestHandler: RequestHandler;
  contextBuilder?: CallContextBuilder;
  cardModifier?: (card: AgentCard) => AgentCard;
}

export class GrpcHandler {
  private readonly agentCard: AgentCard;
  private readonly requestHandler: RequestHandler;
  private readonly contextBuilder: CallContextBuilder;
  private readonly cardModifier?: (card: AgentCard) => AgentCard;

  constructor(options: GrpcHandlerOptions) {
    this.agentCard = options.agentCard;
    this.requestHandler = options.requestHandler;
    this.contextBuilder = options.contextBuilder || this.defaultContextBuilder;
    this.cardModifier = options.cardModifier;
  }

  private defaultContextBuilder(grpcContext: any): ServerCallContext {
    return {
      user: { id: 'anonymous', type: 'unauthenticated' },
      state: {
        grpc_context: grpcContext,
      },
      requested_extensions: [],
    };
  }

  private getMetadataValue(context: any, key: string): string[] {
    const md = context.invocation_metadata;
    if (!md) {
      return [];
    }

    const values: string[] = [];
    for (const [k, v] of md) {
      if (k.toLowerCase() === key.toLowerCase()) {
        values.push(typeof v === 'string' ? v : v.toString());
      }
    }
    return values;
  }

  private getExtensionsFromMetadata(context: any): string[] {
    const extensions = this.getMetadataValue(context, 'x-a2a-extensions');
    if (extensions.length > 0) {
      return extensions[0].split(',').filter((e) => e.trim());
    }
    return [];
  }

  private async abortContext(error: Error, context: any): Promise<void> {
    // This is a simplified error mapping
    // In a full implementation, you'd map different error types to gRPC status codes
    const errorMessage = error instanceof Error ? error.message : String(error);
    context.abort(
      {
        code: 2, // INTERNAL
        details: errorMessage,
      },
    );
  }

  private setExtensionMetadata(context: any, serverContext: ServerCallContext): void {
    if (serverContext.requested_extensions && serverContext.requested_extensions.length > 0) {
      context.setTrailingMetadata([
        ['x-a2a-extensions', serverContext.requested_extensions.join(',')],
      ]);
    }
  }

  async sendMessage(
    pbRequest: SendMessageRequest,
    context: ServerWritableStream<SendMessageRequest, SendMessageResponse>,
  ): Promise<void> {
    try {
      const serverContext = this.contextBuilder(context);
      (serverContext as any).requested_extensions = this.getExtensionsFromMetadata(context);

      const a2aRequest = FromProto.messageSendParams(pbRequest);
      const taskOrMessage = await this.requestHandler.onMessageSend(a2aRequest, serverContext);

      this.setExtensionMetadata(context, serverContext);

      const pbResponse = ToProto.taskOrMessage(taskOrMessage);
      context.write(pbResponse);
      context.end();
    } catch (error) {
      await this.abortContext(error as Error, context);
    }
  }

  async *sendStreamingMessage(
    pbRequest: SendMessageRequest,
    context: ServerDuplexStream<SendMessageRequest, StreamResponse>,
  ): AsyncGenerator<StreamResponse, void, unknown> {
    try {
      const serverContext = this.contextBuilder(context);
      (serverContext as any).requested_extensions = this.getExtensionsFromMetadata(context);

      const a2aRequest = FromProto.messageSendParams(pbRequest);

      try {
        for await (const event of this.requestHandler.onMessageSendStream(a2aRequest, serverContext)) {
          const pbResponse = ToProto.streamResponse(event);
          yield pbResponse;
        }
        this.setExtensionMetadata(context, serverContext);
      } catch (error) {
        await this.abortContext(error as Error, context);
      }
    } catch (error) {
      await this.abortContext(error as Error, context);
    }
  }

  async getTask(
    pbRequest: GetTaskRequest,
    context: ServerWritableStream<GetTaskRequest, any>,
  ): Promise<void> {
    try {
      const serverContext = this.contextBuilder(context);
      (serverContext as any).requested_extensions = this.getExtensionsFromMetadata(context);

      const taskParams = FromProto.taskQueryParams(pbRequest);
      const task = await this.requestHandler.onGetTask(taskParams, serverContext);

      if (task) {
        const pbTask = ToProto.task(task);
        context.write(pbTask);
        context.end();
      } else {
        await this.abortContext(new Error('Task not found'), context);
      }
    } catch (error) {
      await this.abortContext(error as Error, context);
    }
  }

  async cancelTask(
    pbRequest: CancelTaskRequest,
    context: ServerWritableStream<CancelTaskRequest, any>,
  ): Promise<void> {
    try {
      const serverContext = this.contextBuilder(context);
      (serverContext as any).requested_extensions = this.getExtensionsFromMetadata(context);

      const taskIdParams = FromProto.taskIdParams(pbRequest);
      const task = await this.requestHandler.onCancelTask(taskIdParams, serverContext);

      if (task) {
        const pbTask = ToProto.task(task);
        context.write(pbTask);
        context.end();
      } else {
        await this.abortContext(new Error('Task not found'), context);
      }
    } catch (error) {
      await this.abortContext(error as Error, context);
    }
  }

  async *taskSubscription(
    pbRequest: TaskSubscriptionRequest,
    context: ServerDuplexStream<TaskSubscriptionRequest, StreamResponse>,
  ): AsyncGenerator<StreamResponse, void, unknown> {
    try {
      const serverContext = this.contextBuilder(context);
      (serverContext as any).requested_extensions = this.getExtensionsFromMetadata(context);

      const taskIdParams = FromProto.taskIdParams(pbRequest);

      try {
        for await (const event of this.requestHandler.onResubscribeToTask(taskIdParams, serverContext)) {
          const pbResponse = ToProto.streamResponse(event);
          yield pbResponse;
        }
      } catch (error) {
        await this.abortContext(error as Error, context);
      }
    } catch (error) {
      await this.abortContext(error as Error, context);
    }
  }

  async getTaskPushNotificationConfig(
    pbRequest: GetTaskPushNotificationConfigRequest,
    context: ServerWritableStream<GetTaskPushNotificationConfigRequest, PbTaskPushNotificationConfig>,
  ): Promise<void> {
    try {
      const serverContext = this.contextBuilder(context);
      (serverContext as any).requested_extensions = this.getExtensionsFromMetadata(context);

      const params = FromProto.taskIdParams(pbRequest);
      const config = await this.requestHandler.onGetTaskPushNotificationConfig(params, serverContext);

      const pbConfig = ToProto.taskPushNotificationConfig(config);
      context.write(pbConfig);
      context.end();
    } catch (error) {
      await this.abortContext(error as Error, context);
    }
  }

  async createTaskPushNotificationConfig(
    pbRequest: CreateTaskPushNotificationConfigRequest,
    context: ServerWritableStream<CreateTaskPushNotificationConfigRequest, PbTaskPushNotificationConfig>,
  ): Promise<void> {
    try {
      const serverContext = this.contextBuilder(context);
      (serverContext as any).requested_extensions = this.getExtensionsFromMetadata(context);

      // This is a simplified version - you'd need to implement the full conversion
      const config: any = {
        task_id: pbRequest.getParent().split('/')[1],
        push_notification_config: {
          id: pbRequest.getConfigId(),
          url: pbRequest.getConfig().getPushNotificationConfig()!.getUrl(),
          token: pbRequest.getConfig().getPushNotificationConfig()!.getToken(),
        },
      };

      const result = await this.requestHandler.onSetTaskPushNotificationConfig(config, serverContext);
      const pbConfig = ToProto.taskPushNotificationConfig(result);

      context.write(pbConfig);
      context.end();
    } catch (error) {
      await this.abortContext(error as Error, context);
    }
  }

  async getAgentCard(
    pbRequest: GetAgentCardRequest,
    context: ServerWritableStream<GetAgentCardRequest, any>,
  ): Promise<void> {
    let cardToServe = this.agentCard;
    if (this.cardModifier) {
      cardToServe = this.cardModifier(cardToServe);
    }

    const pbCard = ToProto.agentCard(cardToServe);
    context.write(pbCard);
    context.end();
  }
}
