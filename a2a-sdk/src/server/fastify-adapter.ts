/**
 * Fastify adapter for A2A server
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AgentExecutor } from './interfaces';
import { AgentCard } from '../types';
import { DefaultRequestHandler } from './request-handler';
import { InMemoryTaskStore } from './task-store';
import { InMemoryEventQueue } from './event-queue';
import { JSONRPCHandler } from './jsonrpc-handler';
import { DefaultServerCallContext } from './context';
import { ServerError } from '../utils/errors';

export interface FastifyA2AConfig {
  /** Agent card describing the agent */
  agentCard: AgentCard;

  /** Agent executor implementation */
  executor: AgentExecutor;

  /** Port to listen on */
  port?: number;

  /** Host to bind to */
  host?: string;

  /** Log level */
  logLevel?: string;
}

/**
 * Creates a Fastify server for A2A protocol
 */
export class FastifyA2AServer {
  private fastify: FastifyInstance;
  private config: FastifyA2AConfig;
  private taskStore: InMemoryTaskStore;
  private eventQueue: InMemoryEventQueue;
  private requestHandler: DefaultRequestHandler;
  private jsonrpcHandler: JSONRPCHandler;

  constructor(config: FastifyA2AConfig) {
    this.config = config;
    this.taskStore = new InMemoryTaskStore();
    this.eventQueue = new InMemoryEventQueue();
    this.requestHandler = new DefaultRequestHandler(
      config.executor,
      this.taskStore,
      this.eventQueue
    );
    this.jsonrpcHandler = new JSONRPCHandler(
      config.agentCard,
      this.requestHandler
    );

    this.fastify = require('fastify')({
      logger: {
        level: config.logLevel || 'info',
      },
    });

    this.setupRoutes();
  }

  /**
   * Sets up the Fastify routes
   */
  private setupRoutes(): void {
    // JSON-RPC endpoint
    this.fastify.post('/a2a/v1', async (
      request: FastifyRequest,
      reply: FastifyReply
    ) => {
      try {
        const body = request.body as any;
        const requestId = body?.id || null;

        // Build context
        const context = new DefaultServerCallContext({
          headers: request.headers as Record<string, string>,
        });

        // Route based on method
        const method = body?.method;

        switch (method) {
          case 'message/send': {
            const response = await this.jsonrpcHandler.onMessageSend(body, context);
            return reply.send(response);
          }

          case 'message/stream': {
            reply.raw.writeHead(200, {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              Connection: 'keep-alive',
            });

            for await (const event of this.jsonrpcHandler.onMessageSendStream(body, context)) {
              reply.raw.write(`data: ${JSON.stringify(event.root)}\n\n`);
            }

            reply.raw.end();
            return reply;
          }

          case 'tasks/get': {
            const response = await this.jsonrpcHandler.onGetTask(body, context);
            return reply.send(response);
          }

          case 'tasks/cancel': {
            const response = await this.jsonrpcHandler.onCancelTask(body, context);
            return reply.send(response);
          }

          case 'tasks/resubscribe': {
            reply.raw.writeHead(200, {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              Connection: 'keep-alive',
            });

            for await (const event of this.jsonrpcHandler.onResubscribeToTask(body, context)) {
              reply.raw.write(`data: ${JSON.stringify(event.root)}\n\n`);
            }

            reply.raw.end();
            return reply;
          }

          case 'tasks/pushNotificationConfig/get': {
            const response = await this.jsonrpcHandler.getPushNotificationConfig(body, context);
            return reply.send(response);
          }

          case 'tasks/pushNotificationConfig/set': {
            const response = await this.jsonrpcHandler.setPushNotificationConfig(body, context);
            return reply.send(response);
          }

          case 'tasks/pushNotificationConfig/list': {
            const response = await this.jsonrpcHandler.listPushNotificationConfig(body, context);
            return reply.send(response);
          }

          case 'tasks/pushNotificationConfig/delete': {
            const response = await this.jsonrpcHandler.deletePushNotificationConfig(body, context);
            return reply.send(response);
          }

          case 'agent/authenticatedExtendedCard': {
            const response = await this.jsonrpcHandler.getAuthenticatedExtendedCard(body, context);
            return reply.send(response);
          }

          default: {
            return reply.send({
              root: {
                id: requestId,
                error: {
                  code: -32601,
                  message: 'Method not found',
                },
              },
            });
          }
        }
      } catch (error) {
        request.log.error(error);
        return reply.send({
          root: {
            id: (request.body as any)?.id || null,
            error: {
              code: -32000,
              message: error instanceof Error ? error.message : 'Internal error',
            },
          },
        });
      }
    });

    // Agent card endpoint
    this.fastify.get('/.well-known/agent.json', async (
      request: FastifyRequest,
      reply: FastifyReply
    ) => {
      return reply.send(this.config.agentCard);
    });

    // Previous agent card endpoint (deprecated)
    this.fastify.get('/agentCard', async (
      request: FastifyRequest,
      reply: FastifyReply
    ) => {
      request.log.warn('Deprecated endpoint /agentCard accessed. Use /.well-known/agent.json instead.');
      return reply.send(this.config.agentCard);
    });
  }

  /**
   * Starts the server
   */
  async start(): Promise<void> {
    try {
      await this.fastify.listen({
        port: this.config.port || 3000,
        host: this.config.host || '0.0.0.0',
      });
      this.fastify.log.info(`A2A server listening on port ${this.config.port || 3000}`);
    } catch (error) {
      this.fastify.log.error(error);
      process.exit(1);
    }
  }

  /**
   * Stops the server
   */
  async stop(): Promise<void> {
    await this.fastify.close();
  }

  /**
   * Gets the Fastify instance
   */
  get instance(): FastifyInstance {
    return this.fastify;
  }
}
