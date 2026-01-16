/**
 * Main A2A Server implementation (v1.0)
 * Provides a unified interface for creating A2A protocol servers
 */

import type { ServerConfig, TelemetryConfig } from './interfaces';
import { FastifyA2AServer, FastifyA2AConfig } from './fastify-adapter';
import { ExpressA2AServer, ExpressA2AConfig } from './express-adapter';
import { InMemoryTaskStore } from './task-store';
import { InMemoryEventQueue } from './event-queue';
import { DefaultRequestHandler } from './request-handler';
import { TaskStoreFactory } from './database';
import type { DatabaseTaskStore } from './database';
import type { A2ATelemetryWrapper, TelemetryWrapperConfig } from './telemetry';

export type ServerFramework = 'fastify' | 'express';

/**
 * A2A Server (v1.0)
 * Main class for creating A2A protocol servers
 */
export class A2AServer {
  private config: ServerConfig;
  private taskStore: InMemoryTaskStore | DatabaseTaskStore;
  private eventQueue: InMemoryEventQueue;
  private requestHandler: DefaultRequestHandler;
  private server: FastifyA2AServer | ExpressA2AServer | null = null;
  private databaseInitialized = false;
  private telemetry: A2ATelemetryWrapper | null = null;
  private telemetryInitialized = false;

  /**
   * Creates a new A2A server
   */
  constructor(config: ServerConfig) {
    this.config = config;

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
      config.executor,
      this.taskStore,
      this.eventQueue
    );
  }

  /**
   * Starts the server using the specified framework
   */
  async start(framework: ServerFramework = 'fastify'): Promise<unknown> {
    // Initialize telemetry if configured
    if (this.config.telemetry && !this.telemetryInitialized) {
      await this.initializeTelemetry(this.config.telemetry);
      this.telemetryInitialized = true;
    }

    // Initialize database if configured
    if (this.config.database && !this.databaseInitialized) {
      await (this.taskStore as DatabaseTaskStore).initialize();
      this.databaseInitialized = true;
    }

    // Instrument task store with telemetry if available
    if (this.telemetry && this.config.database) {
      await this.instrumentTaskStore();
    }

    const serverConfig = {
      agentCard: this.config.agentCard,
      executor: this.config.executor,
      port: this.config.port || 3000,
      host: this.config.host || '0.0.0.0',
      logLevel: 'info',
    };

    switch (framework) {
      case 'fastify': {
        this.server = new FastifyA2AServer(serverConfig as FastifyA2AConfig);
        await this.server.start();
        break;
      }

      case 'express': {
        this.server = new ExpressA2AServer(serverConfig as ExpressA2AConfig);
        await this.server.start();
        break;
      }

      default: {
        throw new Error(`Unsupported framework: ${framework}`);
      }
    }

    return this.server?.instance || null;
  }

  /**
   * Initialize telemetry with dynamic import
   */
  private async initializeTelemetry(config: TelemetryConfig): Promise<void> {
    try {
      const telemetryModule = await import('./telemetry');

      const wrapperConfig: TelemetryWrapperConfig = {
        telemetry: {
          serviceName: config.serviceName || 'a2a-server',
          enabled: config.enabled ?? true,
        },
        metrics: {
          prefix: config.serviceName || 'a2a',
          enabled: config.enabled ?? true,
        },
      };

      this.telemetry = await telemetryModule.createTelemetryWrapper({
        ...wrapperConfig,
        openTelemetry: config.openTelemetry,
      });
    } catch (error) {
      console.warn('Failed to initialize telemetry:', error);
      this.telemetry = null;
    }
  }

  /**
   * Instrument task store with telemetry
   */
  private async instrumentTaskStore(): Promise<void> {
    if (!this.telemetry || !this.config.database) {
      return;
    }

    try {
      const telemetryModule = await import('./telemetry');
      this.taskStore = telemetryModule.instrumentTaskStore(
        this.taskStore as DatabaseTaskStore,
        this.telemetry,
        { tableName: this.config.database.tableName || 'a2a_tasks' }
      ) as unknown as DatabaseTaskStore;
    } catch (error) {
      console.warn('Failed to instrument task store:', error);
    }
  }

  /**
   * Stops the server
   */
  async stop(): Promise<void> {
    if (this.server) {
      await this.server.stop();
      this.server = null;
    }

    // Shutdown telemetry
    if (this.telemetry) {
      try {
        await this.telemetry.shutdown();
      } catch (error) {
        console.warn('Error shutting down telemetry:', error);
      }
      this.telemetry = null;
      this.telemetryInitialized = false;
    }

    // Close database connection if using database-backed task store
    if (this.config.database && 'close' in this.taskStore) {
      await (this.taskStore as DatabaseTaskStore).close();
    }
  }

  /**
   * Gets the server status
   */
  getStatus() {
    return {
      running: this.server !== null,
      uptime: 0,
      activeConnections: 0,
      processedRequests: 0,
    };
  }

  /**
   * Gets the underlying server instance
   */
  get instance(): unknown {
    return this.server?.instance || null;
  }

  /**
   * Gets the task store
   */
  getTaskStore(): InMemoryTaskStore | DatabaseTaskStore {
    return this.taskStore;
  }

  /**
   * Gets the event queue
   */
  getEventQueue(): InMemoryEventQueue {
    return this.eventQueue;
  }

  /**
   * Gets the telemetry wrapper
   */
  getTelemetry(): A2ATelemetryWrapper | null {
    return this.telemetry;
  }
}
