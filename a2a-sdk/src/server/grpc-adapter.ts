/**
 * gRPC Server Adapter for the A2A server.
 *
 * NOTE: To use gRPC, you need to:
 * 1. Install @grpc/grpc-js: npm install @grpc/grpc-js
 * 2. Generate proto types from the official A2A proto file
 * 3. Provide the generated service definition
 */

import type { AgentExecutor, TaskStore, EventQueue, DatabaseConfig } from './interfaces';
import type { AgentCard } from '../types/v1';
import { DefaultRequestHandler } from './request-handler';
import { InMemoryTaskStore } from './task-store';
import { InMemoryEventQueue } from './event-queue';
import { TaskStoreFactory } from './database';

export interface GrpcServerConfig {
  agentCard: AgentCard;
  executor: AgentExecutor;
  port: number;
  host?: string;
  /** gRPC credentials - if not provided, uses insecure credentials */
  credentials?: unknown;
  /** Generated gRPC service definition from proto file */
  serviceDefinition?: unknown;
  database?: DatabaseConfig;
}

/**
 * gRPC A2A Server
 *
 * Provides a gRPC transport for the A2A protocol as defined in the
 * official A2A v1.0 specification.
 */
export class GrpcA2AServer {
  private readonly config: GrpcServerConfig;
  private server?: unknown;
  private requestHandler: DefaultRequestHandler;
  private taskStore: TaskStore;
  private eventQueue: EventQueue;
  private databaseInitialized = false;

  constructor(config: GrpcServerConfig) {
    this.config = {
      host: '0.0.0.0',
      ...config,
    };

    // Initialize task store based on configuration
    if (config.database) {
      // Database-backed task store
      this.taskStore = TaskStoreFactory.create(config.database) as TaskStore;
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
  }

  /**
   * Get the request handler for custom gRPC implementations
   */
  getRequestHandler(): DefaultRequestHandler {
    return this.requestHandler;
  }

  /**
   * Get the agent card
   */
  getAgentCard(): AgentCard {
    return this.config.agentCard;
  }

  async start(): Promise<void> {
    const grpc = await import('@grpc/grpc-js');

    // Initialize database if configured
    if (this.config.database && !this.databaseInitialized) {
      if (this.taskStore.initialize) {
        await this.taskStore.initialize();
      }
      this.databaseInitialized = true;
    }

    const server = new grpc.Server();
    this.server = server;

    if (!this.config.serviceDefinition) {
      throw new Error(
        'gRPC service definition is required. ' +
        'Generate it from the official A2A proto file: ' +
        'https://github.com/a2aproject/A2A/blob/main/specification/grpc/a2a.proto'
      );
    }

    // Add service to server
    // The service definition and implementation types depend on the generated proto
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    server.addService(
      this.config.serviceDefinition as any,
      this.createServiceImplementation() as any
    );

    return new Promise((resolve, reject) => {
      const credentials = this.config.credentials || grpc.ServerCredentials.createInsecure();
      server.bindAsync(
        `${this.config.host}:${this.config.port}`,
        credentials as any,
        (error: Error | null, port: number) => {
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

  /**
   * Create the gRPC service implementation
   * Override this method to provide custom implementations
   */
  protected createServiceImplementation(): Record<string, unknown> {
    // These methods should be implemented based on the generated proto types
    // The implementation will depend on the generated types from the proto file
    return {
      sendMessage: async (_call: unknown, callback: (error: Error | null, response?: unknown) => void) => {
        try {
          callback(new Error('Proto types not generated. Please generate from a2a.proto'));
        } catch (error) {
          callback(error as Error);
        }
      },

      sendStreamingMessage: async (_call: unknown) => {
        console.warn('Proto types not generated. Please generate from a2a.proto');
      },

      getTask: async (_call: unknown, callback: (error: Error | null, response?: unknown) => void) => {
        try {
          callback(new Error('Proto types not generated. Please generate from a2a.proto'));
        } catch (error) {
          callback(error as Error);
        }
      },

      cancelTask: async (_call: unknown, callback: (error: Error | null, response?: unknown) => void) => {
        try {
          callback(new Error('Proto types not generated. Please generate from a2a.proto'));
        } catch (error) {
          callback(error as Error);
        }
      },

      subscribeToTask: async (_call: unknown) => {
        console.warn('Proto types not generated. Please generate from a2a.proto');
      },

      getAgentCard: async (_call: unknown, callback: (error: Error | null, response?: unknown) => void) => {
        try {
          // Return the agent card (this doesn't depend on proto types)
          callback(null, this.config.agentCard);
        } catch (error) {
          callback(error as Error);
        }
      },
    };
  }

  async stop(): Promise<void> {
    return new Promise(async (resolve) => {
      const server = this.server as { tryShutdown?: (callback: () => void) => void };
      if (server && server.tryShutdown) {
        server.tryShutdown(async () => {
          // Close database connection if using database-backed task store
          if (this.config.database && this.taskStore.close) {
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
