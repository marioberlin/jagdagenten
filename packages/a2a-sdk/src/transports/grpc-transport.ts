/**
 * gRPC Transport for the A2A client.
 */

import type {
  ClientConfig,
  ClientCallContext,
} from '../client/interfaces.js';
import type {
  MessageSendParams,
  TaskIdParams,
  TaskQueryParams,
  GetTaskPushNotificationConfigParams,
  TaskPushNotificationConfig,
  Task,
  Message,
  TaskArtifactUpdateEvent,
  TaskStatusUpdateEvent,
  AgentCard,
  StreamEvent,
} from '../types/index.js';
import { ClientTransport } from '../client/interfaces.js';
import { ToProto, FromProto } from '../utils/proto-utils.js';
import type { Channel } from '@grpc/grpc-js';
import type { CallContext } from '@grpc/grpc-js/build/src/call-context';
import {
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
import {
  A2AServiceClient,
  // Service implementation types will be generated
} from '../../proto/a2a_grpc_pb';

export type GrpcChannelFactory = (url: string) => Channel;

export class GrpcTransport implements ClientTransport {
  private readonly channel: Channel;
  private readonly stub: A2AServiceClient;
  private readonly agentCard: AgentCard | null;
  private readonly extensions: string[] | undefined;
  private needsExtendedCard: boolean;

  constructor(
    channel: Channel,
    agentCard: AgentCard | null,
    extensions?: string[],
  ) {
    this.channel = channel;
    this.stub = new A2AServiceClient(channel);
    this.agentCard = agentCard;
    this.needsExtendedCard = agentCard?.supports_authenticated_extended_card ?? true;
    this.extensions = extensions;
  }

  static create(
    card: AgentCard,
    url: string,
    config: ClientConfig,
  ): GrpcTransport {
    if (!config.grpcChannelFactory) {
      throw new Error('grpc_channel_factory is required when using gRPC');
    }
    return new GrpcTransport(
      config.grpcChannelFactory(url),
      card,
      config.extensions,
    );
  }

  private getGrpcMetadata(extensions?: string[]): Array<[string, string]> | undefined {
    if (extensions) {
      return [['x-a2a-extensions', extensions.join(',')]];
    }
    if (this.extensions) {
      return [['x-a2a-extensions', this.extensions.join(',')]];
    }
    return undefined;
  }

  async sendMessage(
    request: MessageSendParams,
    context?: ClientCallContext,
    extensions?: string[],
  ): Promise<Task | Message> {
    const pbRequest = new SendMessageRequest();
    pbRequest.setRequest(ToProto.message(request.message)!);
    pbRequest.setConfiguration(ToProto.messageSendConfiguration(request.configuration));
    pbRequest.setMetadata(ToProto.metadata(request.metadata));

    const response: SendMessageResponse = await new Promise((resolve, reject) => {
      this.stub.sendMessage(
        pbRequest,
        {
          deadline: context?.deadline,
          metadata: this.getGrpcMetadata(extensions),
        },
        (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res!);
          }
        },
      );
    });

    return FromProto.taskOrMessage(response);
  }

  async *sendMessageStreaming(
    request: MessageSendParams,
    context?: ClientCallContext,
    extensions?: string[],
  ): AsyncIterableIterator<Message | Task | TaskStatusUpdateEvent | TaskArtifactUpdateEvent> {
    const pbRequest = new SendMessageRequest();
    pbRequest.setRequest(ToProto.message(request.message)!);
    pbRequest.setConfiguration(ToProto.messageSendConfiguration(request.configuration));
    pbRequest.setMetadata(ToProto.metadata(request.metadata));

    const call = this.stub.sendStreamingMessage(
      pbRequest,
      {
        deadline: context?.deadline,
        metadata: this.getGrpcMetadata(extensions),
      },
    );

    for await (const response of call) {
      yield FromProto.streamResponse(response);
    }
  }

  async *resubscribe(
    request: TaskIdParams,
    context?: ClientCallContext,
    extensions?: string[],
  ): AsyncIterableIterator<Task | Message | TaskStatusUpdateEvent | TaskArtifactUpdateEvent> {
    const pbRequest = new TaskSubscriptionRequest();
    pbRequest.setName(`tasks/${request.id}`);

    const call = this.stub.taskSubscription(
      pbRequest,
      {
        deadline: context?.deadline,
        metadata: this.getGrpcMetadata(extensions),
      },
    );

    for await (const response of call) {
      yield FromProto.streamResponse(response);
    }
  }

  async getTask(
    request: TaskQueryParams,
    context?: ClientCallContext,
    extensions?: string[],
  ): Promise<Task> {
    const pbRequest = new GetTaskRequest();
    pbRequest.setName(`tasks/${request.id}`);
    if (request.history_length !== undefined) {
      pbRequest.setHistoryLength(request.history_length);
    }

    const task: Task = await new Promise((resolve, reject) => {
      this.stub.getTask(
        pbRequest,
        {
          deadline: context?.deadline,
          metadata: this.getGrpcMetadata(extensions),
        },
        (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(FromProto.task(res!));
          }
        },
      );
    });

    return task;
  }

  async cancelTask(
    request: TaskIdParams,
    context?: ClientCallContext,
    extensions?: string[],
  ): Promise<Task> {
    const pbRequest = new CancelTaskRequest();
    pbRequest.setName(`tasks/${request.id}`);

    const task: Task = await new Promise((resolve, reject) => {
      this.stub.cancelTask(
        pbRequest,
        {
          deadline: context?.deadline,
          metadata: this.getGrpcMetadata(extensions),
        },
        (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(FromProto.task(res!));
          }
        },
      );
    });

    return task;
  }

  async setTaskCallback(
    request: TaskPushNotificationConfig,
    context?: ClientCallContext,
    extensions?: string[],
  ): Promise<TaskPushNotificationConfig> {
    const pbRequest = new CreateTaskPushNotificationConfigRequest();
    pbRequest.setParent(`tasks/${request.task_id}`);
    pbRequest.setConfigId(request.push_notification_config.id);
    pbRequest.setConfig(ToProto.taskPushNotificationConfig(request));

    const config: TaskPushNotificationConfig = await new Promise((resolve, reject) => {
      this.stub.createTaskPushNotificationConfig(
        pbRequest,
        {
          deadline: context?.deadline,
          metadata: this.getGrpcMetadata(extensions),
        },
        (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(FromProto.taskPushNotificationConfig(res!));
          }
        },
      );
    });

    return config;
  }

  async getTaskCallback(
    request: GetTaskPushNotificationConfigParams,
    context?: ClientCallContext,
    extensions?: string[],
  ): Promise<TaskPushNotificationConfig> {
    const pbRequest = new GetTaskPushNotificationConfigRequest();
    pbRequest.setName(`tasks/${request.id}/pushNotificationConfigs/${request.push_notification_config_id}`);

    const config: TaskPushNotificationConfig = await new Promise((resolve, reject) => {
      this.stub.getTaskPushNotificationConfig(
        pbRequest,
        {
          deadline: context?.deadline,
          metadata: this.getGrpcMetadata(extensions),
        },
        (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(FromProto.taskPushNotificationConfig(res!));
          }
        },
      );
    });

    return config;
  }

  async getCard(
    context?: ClientCallContext,
    extensions?: string[],
    signatureVerifier?: (card: AgentCard) => void,
  ): Promise<AgentCard> {
    if (this.agentCard && !this.needsExtendedCard) {
      return this.agentCard;
    }
    if (this.agentCard === null && !this.needsExtendedCard) {
      throw new Error('Agent card is not available.');
    }

    const pbRequest = new GetAgentCardRequest();

    const card: AgentCard = await new Promise((resolve, reject) => {
      this.stub.getAgentCard(
        pbRequest,
        {
          deadline: context?.deadline,
          metadata: this.getGrpcMetadata(extensions),
        },
        (err, res) => {
          if (err) {
            reject(err);
          } else {
            const card = FromProto.agentCard(res!);
            if (signatureVerifier) {
              signatureVerifier(card);
            }
            resolve(card);
          }
        },
      );
    });

    // Update cached card
    (this as any).agentCard = card;
    this.needsExtendedCard = false;

    return card;
  }

  async close(): Promise<void> {
    await this.channel.close();
  }
}
