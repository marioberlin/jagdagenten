/**
 * A2A gRPC Server Integration
 *
 * Provides gRPC transport for the A2A protocol alongside HTTP/JSON-RPC.
 * Uses dynamic proto loading to avoid compilation step.
 */

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { resolve } from 'path';
import type { v1 } from '@liquidcrypto/a2a-sdk';
import type { TaskStore, PushNotificationStore } from '../adapter/elysia-adapter.js';
import { LiquidCryptoExecutor, getLiquidCryptoAgentCard } from '../executors/index.js';
import { createPostgresStoresFromEnv } from '../adapter/index.js';
import {
  instrumentTaskStore,
  instrumentPushNotificationStore,
} from '../telemetry/index.js';
import { isTelemetryEnabled } from '../../telemetry.js';

// ============================================================================
// Types
// ============================================================================

export interface GrpcServerConfig {
  port?: number;
  host?: string;
  baseUrl?: string;
  taskStore?: TaskStore;
  pushNotificationStore?: PushNotificationStore;
  enableTelemetry?: boolean;
}

// Proto state mappings
const TASK_STATE_TO_PROTO: Record<string, number> = {
  submitted: 1,
  working: 2,
  completed: 3,
  canceled: 4,
  failed: 5,
  'input-required': 6,
  'auth-required': 7,
  unknown: 0,
};

const ROLE_TO_PROTO: Record<string, number> = {
  user: 1,
  agent: 2,
};

const PROTO_TO_ROLE: Record<number, string> = {
  0: 'agent',
  1: 'user',
  2: 'agent',
};

// ============================================================================
// Proto Conversion Utilities
// ============================================================================

function toProtoTask(task: v1.Task): unknown {
  return {
    id: task.id,
    context_id: task.contextId,
    status: {
      state: TASK_STATE_TO_PROTO[task.status.state] || 0,
      update: task.status.message ? toProtoMessage(task.status.message) : undefined,
    },
    artifacts: task.artifacts?.map(toProtoArtifact),
    history: task.history?.map(toProtoMessage),
    metadata: task.metadata,
  };
}

function toProtoMessage(message: v1.Message): unknown {
  return {
    message_id: message.messageId,
    content: message.parts.map(toProtoPart),
    context_id: message.contextId,
    task_id: message.taskId,
    role: ROLE_TO_PROTO[message.role] || 0,
    metadata: message.metadata,
    extensions: message.extensions,
  };
}

function toProtoPart(part: v1.Part): unknown {
  const proto: Record<string, unknown> = { metadata: (part as v1.TextPart).metadata };

  if ('text' in part) {
    proto.text = (part as v1.TextPart).text;
  } else if ('file' in part) {
    const filePart = part as v1.FilePart;
    proto.file = {
      mime_type: filePart.file.mimeType,
      name: filePart.file.name,
    };
    if ('uri' in filePart.file) {
      (proto.file as Record<string, unknown>).file_with_uri = filePart.file.uri;
    } else if ('bytes' in filePart.file) {
      (proto.file as Record<string, unknown>).file_with_bytes = Buffer.from(
        (filePart.file as v1.FileWithBytes).bytes,
        'base64'
      );
    }
  } else if ('data' in part) {
    proto.data = { data: (part as v1.DataPart).data };
  }

  return proto;
}

function toProtoArtifact(artifact: v1.Artifact): unknown {
  return {
    artifact_id: artifact.artifactId,
    name: artifact.name,
    description: artifact.description,
    parts: artifact.parts.map(toProtoPart),
    metadata: artifact.metadata,
    extensions: artifact.extensions,
  };
}

function toProtoAgentCard(card: v1.AgentCard): unknown {
  return {
    name: card.name,
    description: card.description,
    url: card.url,
    version: card.version,
    documentation_url: card.documentationUrl,
    provider: card.provider
      ? {
          organization: card.provider.organization,
          url: card.provider.url || '',
        }
      : undefined,
    capabilities: card.capabilities
      ? {
          streaming: card.capabilities.streaming,
          push_notifications: card.capabilities.pushNotifications,
          extensions: card.capabilities.extensions?.map((e) => ({
            uri: e.uri,
            description: e.description,
            params: e.params,
            required: e.required,
          })),
        }
      : undefined,
    default_input_modes: card.defaultInputModes,
    default_output_modes: card.defaultOutputModes,
    skills: card.skills?.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      tags: s.tags,
      examples: s.examples,
      input_modes: s.inputModes,
      output_modes: s.outputModes,
    })),
    supports_authenticated_extended_card: card.supportsAuthenticatedExtendedCard,
    preferred_transport: card.preferredTransport,
    protocol_version: card.protocolVersions?.[0] || '1.0',
  };
}

function fromProtoMessage(proto: Record<string, unknown>): v1.Message {
  const content = proto.content as Array<Record<string, unknown>> || [];
  return {
    messageId: proto.message_id as string,
    parts: content.map(fromProtoPart),
    contextId: proto.context_id as string | undefined,
    taskId: proto.task_id as string | undefined,
    role: (PROTO_TO_ROLE[proto.role as number] || 'agent') as v1.Role,
    metadata: proto.metadata as Record<string, v1.JSONValue> | undefined,
    extensions: proto.extensions as string[] | undefined,
  };
}

function fromProtoPart(proto: Record<string, unknown>): v1.Part {
  if (proto.text !== undefined) {
    return {
      text: proto.text as string,
      metadata: proto.metadata as Record<string, v1.JSONValue> | undefined,
    };
  }
  if (proto.file) {
    const filePart = proto.file as Record<string, unknown>;
    const file: v1.FileContent = filePart.file_with_uri
      ? {
          uri: filePart.file_with_uri as string,
          mimeType: filePart.mime_type as string | undefined,
          name: filePart.name as string | undefined,
        }
      : {
          bytes: (filePart.file_with_bytes as Buffer)?.toString('base64') || '',
          mimeType: filePart.mime_type as string | undefined,
          name: filePart.name as string | undefined,
        };
    return {
      file,
      metadata: proto.metadata as Record<string, v1.JSONValue> | undefined,
    };
  }
  if (proto.data) {
    const dataPart = proto.data as Record<string, unknown>;
    return {
      data: (dataPart.data || {}) as Record<string, v1.JSONValue>,
      metadata: proto.metadata as Record<string, v1.JSONValue> | undefined,
    };
  }
  return {
    text: '',
    metadata: proto.metadata as Record<string, v1.JSONValue> | undefined,
  };
}

// ============================================================================
// In-Memory Task Store for gRPC
// ============================================================================

class InMemoryTaskStore implements TaskStore {
  private tasks = new Map<string, v1.Task>();

  async get(taskId: string): Promise<v1.Task | null> {
    return this.tasks.get(taskId) || null;
  }

  async set(task: v1.Task): Promise<void> {
    this.tasks.set(task.id, task);
  }

  async delete(taskId: string): Promise<void> {
    this.tasks.delete(taskId);
  }

  async listByContext(contextId: string): Promise<v1.Task[]> {
    return Array.from(this.tasks.values()).filter((t) => t.contextId === contextId);
  }
}

class InMemoryPushNotificationStore implements PushNotificationStore {
  private configs = new Map<string, v1.PushNotificationConfig>();

  async get(taskId: string): Promise<v1.PushNotificationConfig | null> {
    return this.configs.get(taskId) || null;
  }

  async set(taskId: string, config: v1.PushNotificationConfig): Promise<void> {
    this.configs.set(taskId, config);
  }

  async delete(taskId: string): Promise<void> {
    this.configs.delete(taskId);
  }
}

// ============================================================================
// gRPC Server
// ============================================================================

export class A2AGrpcServer {
  private server: grpc.Server;
  private executor: LiquidCryptoExecutor;
  private taskStore: TaskStore;
  private pushStore: PushNotificationStore;
  private agentCard: v1.AgentCard;
  private config: {
    port: number;
    host: string;
    baseUrl: string;
    enableTelemetry: boolean;
  };

  constructor(config: GrpcServerConfig = {}) {
    this.config = {
      port: config.port ?? 50051,
      host: config.host ?? '0.0.0.0',
      baseUrl: config.baseUrl ?? `http://localhost:${process.env.PORT || 3000}`,
      enableTelemetry: config.enableTelemetry ?? isTelemetryEnabled(),
    };

    // Initialize stores
    let taskStore = config.taskStore;
    let pushStore = config.pushNotificationStore;

    if (!taskStore || !pushStore) {
      const pgStores = createPostgresStoresFromEnv();
      if (pgStores) {
        taskStore = taskStore ?? pgStores.taskStore;
        pushStore = pushStore ?? pgStores.pushNotificationStore;
        console.log('[gRPC] Using PostgreSQL stores for task persistence');
      } else {
        taskStore = taskStore ?? new InMemoryTaskStore();
        pushStore = pushStore ?? new InMemoryPushNotificationStore();
        console.log('[gRPC] Using in-memory stores');
      }
    }

    // Wrap with telemetry if enabled
    if (this.config.enableTelemetry) {
      taskStore = instrumentTaskStore(taskStore);
      pushStore = instrumentPushNotificationStore(pushStore);
      console.log('[gRPC] Telemetry instrumentation enabled');
    }

    this.taskStore = taskStore;
    this.pushStore = pushStore;
    this.executor = new LiquidCryptoExecutor();
    this.agentCard = getLiquidCryptoAgentCard(this.config.baseUrl);
    this.server = new grpc.Server();
  }

  async start(): Promise<void> {
    // Load proto dynamically
    const protoPath = resolve(__dirname, '../../../../packages/a2a-sdk/proto/a2a.proto');

    const packageDefinition = await protoLoader.load(protoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
      includeDirs: [
        resolve(__dirname, '../../../../node_modules'),
        resolve(__dirname, '../../../../packages/a2a-sdk/proto'),
      ],
    });

    const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
    const a2aProto = protoDescriptor.a2a as grpc.GrpcObject;
    const A2AService = a2aProto.A2AService as grpc.ServiceClientConstructor;

    // Add service implementation
    this.server.addService(A2AService.service, {
      SendMessage: this.handleSendMessage.bind(this),
      SendStreamingMessage: this.handleSendStreamingMessage.bind(this),
      GetTask: this.handleGetTask.bind(this),
      CancelTask: this.handleCancelTask.bind(this),
      TaskSubscription: this.handleTaskSubscription.bind(this),
      GetAgentCard: this.handleGetAgentCard.bind(this),
      GetTaskPushNotificationConfig: this.handleGetTaskPushNotificationConfig.bind(this),
      CreateTaskPushNotificationConfig: this.handleCreateTaskPushNotificationConfig.bind(this),
    });

    // Start server
    return new Promise((resolve, reject) => {
      this.server.bindAsync(
        `${this.config.host}:${this.config.port}`,
        grpc.ServerCredentials.createInsecure(),
        (error, port) => {
          if (error) {
            reject(error);
          } else {
            console.log(`[gRPC] A2A server listening on ${this.config.host}:${port}`);
            resolve();
          }
        }
      );
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.tryShutdown(() => {
        console.log('[gRPC] Server shutdown complete');
        resolve();
      });
    });
  }

  private async handleSendMessage(
    call: grpc.ServerUnaryCall<unknown, unknown>,
    callback: grpc.sendUnaryData<unknown>
  ): Promise<void> {
    try {
      const request = call.request as Record<string, unknown>;
      if (!request.request) {
        callback({ code: grpc.status.INVALID_ARGUMENT, message: 'Message required' });
        return;
      }

      const message = fromProtoMessage(request.request as Record<string, unknown>);
      const contextId = message.contextId || `ctx-${Date.now()}`;
      const taskId = message.taskId || `task-${Date.now()}`;

      // Create task
      const task: v1.Task = {
        id: taskId,
        contextId,
        status: { state: 'working' as v1.TaskState },
        history: [message],
      };

      await this.taskStore.set(task);

      // Execute - executor.execute(message, context)
      const result = await this.executor.execute(message, {
        taskId,
        contextId,
        requestVersion: '1.0',
      });

      // Update task with result (result.status is v1.TaskState, task.status is v1.TaskStatus)
      if (result.status) {
        task.status = { state: result.status };
      }
      if (result.artifacts) {
        task.artifacts = result.artifacts;
      }
      await this.taskStore.set(task);

      callback(null, { task: toProtoTask(task) });
    } catch (error) {
      console.error('[gRPC] SendMessage error:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: error instanceof Error ? error.message : 'Internal error',
      });
    }
  }

  private handleSendStreamingMessage(
    call: grpc.ServerWritableStream<unknown, unknown>
  ): void {
    const request = call.request as Record<string, unknown>;
    if (!request.request) {
      call.destroy(new Error('Message required'));
      return;
    }

    const message = fromProtoMessage(request.request as Record<string, unknown>);
    const contextId = message.contextId || `ctx-${Date.now()}`;
    const taskId = message.taskId || `task-${Date.now()}`;

    // Create task
    const task: v1.Task = {
      id: taskId,
      contextId,
      status: { state: 'working' as v1.TaskState },
      history: [message],
    };

    this.taskStore.set(task).then(async () => {
      try {
        // Send initial status
        call.write({
          status_update: {
            task_id: taskId,
            context_id: contextId,
            status: { state: TASK_STATE_TO_PROTO['working'] },
            final: false,
          },
        });

        // Execute and stream results - executor.execute(message, context)
        const result = await this.executor.execute(message, {
          taskId,
          contextId,
          requestVersion: '1.0',
        });

        // Send artifacts
        if (result.artifacts) {
          for (const artifact of result.artifacts) {
            call.write({
              artifact_update: {
                task_id: taskId,
                context_id: contextId,
                artifact: toProtoArtifact(artifact),
                append: false,
                last_chunk: true,
              },
            });
          }
        }

        // Update task (result.status is v1.TaskState string, task.status is v1.TaskStatus object)
        task.status = result.status ? { state: result.status } : { state: 'completed' as v1.TaskState };
        task.artifacts = result.artifacts;
        await this.taskStore.set(task);

        // Send final status
        call.write({
          status_update: {
            task_id: taskId,
            context_id: contextId,
            status: { state: TASK_STATE_TO_PROTO[task.status.state] || 0 },
            final: true,
          },
        });

        call.end();
      } catch (error) {
        console.error('[gRPC] SendStreamingMessage error:', error);
        call.destroy(error instanceof Error ? error : new Error('Stream error'));
      }
    });
  }

  private async handleGetTask(
    call: grpc.ServerUnaryCall<unknown, unknown>,
    callback: grpc.sendUnaryData<unknown>
  ): Promise<void> {
    try {
      const request = call.request as Record<string, unknown>;
      const taskId = (request.name as string).replace('tasks/', '');
      const task = await this.taskStore.get(taskId);

      if (!task) {
        callback({ code: grpc.status.NOT_FOUND, message: 'Task not found' });
        return;
      }

      callback(null, toProtoTask(task));
    } catch (error) {
      console.error('[gRPC] GetTask error:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: error instanceof Error ? error.message : 'Internal error',
      });
    }
  }

  private async handleCancelTask(
    call: grpc.ServerUnaryCall<unknown, unknown>,
    callback: grpc.sendUnaryData<unknown>
  ): Promise<void> {
    try {
      const request = call.request as Record<string, unknown>;
      const taskId = (request.name as string).replace('tasks/', '');
      const task = await this.taskStore.get(taskId);

      if (!task) {
        callback({ code: grpc.status.NOT_FOUND, message: 'Task not found' });
        return;
      }

      task.status = { state: 'canceled' as v1.TaskState };
      await this.taskStore.set(task);

      callback(null, toProtoTask(task));
    } catch (error) {
      console.error('[gRPC] CancelTask error:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: error instanceof Error ? error.message : 'Internal error',
      });
    }
  }

  private handleTaskSubscription(
    call: grpc.ServerWritableStream<unknown, unknown>
  ): void {
    const request = call.request as Record<string, unknown>;
    const taskId = (request.name as string).replace('tasks/', '');

    this.taskStore.get(taskId).then((task) => {
      if (!task) {
        call.destroy(new Error('Task not found'));
        return;
      }

      // Send current task state
      call.write({ task: toProtoTask(task) });

      // In a real implementation, you'd subscribe to task updates
      // For now, just end the stream
      call.end();
    });
  }

  private handleGetAgentCard(
    _call: grpc.ServerUnaryCall<unknown, unknown>,
    callback: grpc.sendUnaryData<unknown>
  ): void {
    callback(null, toProtoAgentCard(this.agentCard));
  }

  private async handleGetTaskPushNotificationConfig(
    call: grpc.ServerUnaryCall<unknown, unknown>,
    callback: grpc.sendUnaryData<unknown>
  ): Promise<void> {
    try {
      const request = call.request as Record<string, unknown>;
      const match = (request.name as string).match(
        /tasks\/([^/]+)\/pushNotificationConfigs\/([^/]+)/
      );
      if (!match) {
        callback({ code: grpc.status.INVALID_ARGUMENT, message: 'Invalid resource name' });
        return;
      }

      const taskId = match[1];
      const config = await this.pushStore.get(taskId);

      if (!config) {
        callback({ code: grpc.status.NOT_FOUND, message: 'Config not found' });
        return;
      }

      callback(null, {
        name: request.name,
        push_notification_config: {
          id: config.id,
          url: config.url,
          token: config.token,
        },
      });
    } catch (error) {
      console.error('[gRPC] GetTaskPushNotificationConfig error:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: error instanceof Error ? error.message : 'Internal error',
      });
    }
  }

  private async handleCreateTaskPushNotificationConfig(
    call: grpc.ServerUnaryCall<unknown, unknown>,
    callback: grpc.sendUnaryData<unknown>
  ): Promise<void> {
    try {
      const request = call.request as Record<string, unknown>;
      const taskId = (request.parent as string).replace('tasks/', '');
      const configData = request.config as Record<string, unknown>;
      const pushConfig = configData?.push_notification_config as Record<string, unknown>;

      if (!pushConfig) {
        callback({ code: grpc.status.INVALID_ARGUMENT, message: 'Config required' });
        return;
      }

      const config: v1.PushNotificationConfig = {
        id: request.config_id as string,
        url: pushConfig.url as string,
        token: pushConfig.token as string | undefined,
      };

      await this.pushStore.set(taskId, config);

      callback(null, {
        name: `tasks/${taskId}/pushNotificationConfigs/${config.id}`,
        push_notification_config: {
          id: config.id,
          url: config.url,
          token: config.token,
        },
      });
    } catch (error) {
      console.error('[gRPC] CreateTaskPushNotificationConfig error:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: error instanceof Error ? error.message : 'Internal error',
      });
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createA2AGrpcServer(config?: GrpcServerConfig): A2AGrpcServer {
  return new A2AGrpcServer(config);
}

export default A2AGrpcServer;
