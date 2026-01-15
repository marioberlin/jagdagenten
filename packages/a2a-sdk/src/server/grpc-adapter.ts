/**
 * gRPC Server Adapter for the A2A server.
 */

import type { AgentExecutor } from './request-handler.js';
import type { AgentCard } from '../types/index.js';
import { DefaultRequestHandler } from './request-handler.js';
import { GrpcHandler } from './grpc-handler.js';
import { InMemoryTaskStore } from './task-store.js';
import { InMemoryEventQueue } from './event-queue.js';
import { TaskStoreFactory } from './database';
import type { DatabaseTaskStore } from './database';
import type { DatabaseConfig } from './interfaces';

import type { Server } from '@grpc/grpc-js';
import type {
  ServerCredentials,
  ServiceDefinition,
} from '@grpc/grpc-js';

export interface GrpcServerConfig {
  agentCard: AgentCard;
  executor: AgentExecutor;
  port: number;
  host?: string;
  credentials?: ServerCredentials;
  serviceDefinition?: ServiceDefinition;
  database?: DatabaseConfig;
}

export class GrpcA2AServer {
  private readonly config: GrpcServerConfig;
  private server?: Server;
  private requestHandler: DefaultRequestHandler;
  private grpcHandler: GrpcHandler;
  private taskStore: InMemoryTaskStore | DatabaseTaskStore;
  private eventQueue: InMemoryEventQueue;
  private databaseInitialized = false;

  constructor(config: GrpcServerConfig) {
    this.config = {
      host: '0.0.0.0',
      ...config,
    };

    // Initialize task store based on configuration
    if (config.database) {
      // Database-backed task store
      this.taskStore = TaskStoreFactory.create(config.database);
    } else {
      // In-memory task store (default)
      this.taskStore = new InMemoryTaskStore();
    }

    this.eventQueue = new InMemoryEventQueue();
    this.requestHandler = new DefaultRequestHandler(
      this.config.executor,
      this.taskStore,
      this.eventQueue
    );
    this.grpcHandler = new GrpcHandler({
      agentCard: this.config.agentCard,
      requestHandler: this.requestHandler,
    });
  }

  async start(): Promise<void> {
    const grpc = await import('@grpc/grpc-js');

    // Initialize database if configured
    if (this.config.database && !this.databaseInitialized) {
      await this.taskStore.initialize();
      this.databaseInitialized = true;
    }

    this.server = new grpc.Server();

    // Add service to server
    // In a real implementation, you'd use the generated service definition
    this.server.addService(
      this.config.serviceDefinition || ({} as ServiceDefinition),
      {
        sendMessage: this.grpcHandler.sendMessage.bind(this.grpcHandler),
        sendStreamingMessage: this.grpcHandler.sendStreamingMessage.bind(this.grpcHandler),
        getTask: this.grpcHandler.getTask.bind(this.grpcHandler),
        cancelTask: this.grpcHandler.cancelTask.bind(this.grpcHandler),
        taskSubscription: this.grpcHandler.taskSubscription.bind(this.grpcHandler),
        getAgentCard: this.grpcHandler.getAgentCard.bind(this.grpcHandler),
        getTaskPushNotificationConfig: this.grpcHandler.getTaskPushNotificationConfig.bind(this.grpcHandler),
        createTaskPushNotificationConfig: this.grpcHandler.createTaskPushNotificationConfig.bind(this.grpcHandler),
      },
    );

    return new Promise((resolve, reject) => {
      this.server!.bindAsync(
        `${this.config.host}:${this.config.port}`,
        this.config.credentials || grpc.ServerCredentials.createInsecure(),
        (error, port) => {
          if (error) {
            reject(error);
          } else {
            console.log(`gRPC server listening on ${this.config.host}:${port}`);
            resolve();
          }
        },
      );
    });
  }

  async stop(): Promise<void> {
    return new Promise(async (resolve) => {
      if (this.server) {
        this.server.tryShutdown(async () => {
          // Close database connection if using database-backed task store
          if (this.config.database && 'close' in this.taskStore) {
            await this.taskStore.close();
          }
          console.log('gRPC server shutdown complete');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}
