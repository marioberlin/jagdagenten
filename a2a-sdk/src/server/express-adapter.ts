/**
 * Express adapter for A2A server (v1.0)
 * Provides Express.js integration for the A2A Protocol
 */

import type { Express, Request, Response } from 'express';
import type { AgentCard, JSONRPCRequest } from '../types/v1';
import type { AgentExecutor } from './interfaces';
import { DefaultRequestHandler } from './request-handler';
import { InMemoryTaskStore } from './task-store';
import { InMemoryEventQueue } from './event-queue';
import { JSONRPCHandler } from './jsonrpc-handler';
import { DefaultServerCallContext } from './context';

export interface ExpressA2AConfig {
  /** Agent card describing the agent */
  agentCard: AgentCard;

  /** Agent executor implementation */
  executor: AgentExecutor;

  /** Port to listen on */
  port?: number;

  /** Host to bind to */
  host?: string;
}

/**
 * Creates an Express server for A2A protocol (v1.0)
 */
export class ExpressA2AServer {
  private app: Express;
  private config: ExpressA2AConfig;
  private taskStore: InMemoryTaskStore;
  private eventQueue: InMemoryEventQueue;
  private requestHandler: DefaultRequestHandler;
  private jsonrpcHandler: JSONRPCHandler;
  private server: ReturnType<Express['listen']> | null = null;

  constructor(config: ExpressA2AConfig) {
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

    // Dynamic import to avoid bundling issues
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    this.app = require('express')();
    this.app.use(require('express').json());
    this.setupRoutes();
  }

  /**
   * Sets up the Express routes for A2A v1.0 methods
   */
  private setupRoutes(): void {
    // JSON-RPC endpoint (A2A v1.0)
    this.app.post('/a2a/v1', async (req: Request, res: Response) => {
      try {
        const body = req.body as JSONRPCRequest;
        const requestId = body?.id ?? null;

        // Build context
        const context = new DefaultServerCallContext({
          headers: req.headers as Record<string, string>,
        });

        // Route based on method (v1.0 PascalCase methods)
        const method = body?.method;

        switch (method) {
          // v1.0 Methods
          case 'SendMessage': {
            const response = await this.jsonrpcHandler.onSendMessage(body, context);
            return res.json(response);
          }

          case 'StreamMessage': {
            res.writeHead(200, {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              Connection: 'keep-alive',
            });

            for await (const event of this.jsonrpcHandler.onStreamMessage(body, context)) {
              res.write(`data: ${JSON.stringify(event)}\n\n`);
            }

            res.end();
            return;
          }

          case 'GetTask': {
            const response = await this.jsonrpcHandler.onGetTask(body, context);
            return res.json(response);
          }

          case 'CancelTask': {
            const response = await this.jsonrpcHandler.onCancelTask(body, context);
            return res.json(response);
          }

          case 'SubscribeToTask': {
            res.writeHead(200, {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              Connection: 'keep-alive',
            });

            for await (const event of this.jsonrpcHandler.onSubscribeToTask(body, context)) {
              res.write(`data: ${JSON.stringify(event)}\n\n`);
            }

            res.end();
            return;
          }

          case 'SetTaskPushNotificationConfig': {
            const response = await this.jsonrpcHandler.onSetPushNotificationConfig(body, context);
            return res.json(response);
          }

          case 'GetTaskPushNotificationConfig': {
            const response = await this.jsonrpcHandler.onGetPushNotificationConfig(body, context);
            return res.json(response);
          }

          case 'ListTaskPushNotificationConfig': {
            const response = await this.jsonrpcHandler.onListPushNotificationConfig(body, context);
            return res.json(response);
          }

          case 'DeleteTaskPushNotificationConfig': {
            const response = await this.jsonrpcHandler.onDeletePushNotificationConfig(body, context);
            return res.json(response);
          }

          case 'GetExtendedAgentCard': {
            const response = await this.jsonrpcHandler.onGetExtendedAgentCard(body, context);
            return res.json(response);
          }

          // Legacy methods (backward compatibility)
          case 'message/send': {
            const response = await this.jsonrpcHandler.onMessageSend(body, context);
            return res.json(response);
          }

          case 'message/stream': {
            res.writeHead(200, {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              Connection: 'keep-alive',
            });

            for await (const event of this.jsonrpcHandler.onMessageSendStream(body, context)) {
              res.write(`data: ${JSON.stringify(event)}\n\n`);
            }

            res.end();
            return;
          }

          case 'tasks/get': {
            const response = await this.jsonrpcHandler.onGetTask(body, context);
            return res.json(response);
          }

          case 'tasks/cancel': {
            const response = await this.jsonrpcHandler.onCancelTask(body, context);
            return res.json(response);
          }

          case 'tasks/resubscribe': {
            res.writeHead(200, {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              Connection: 'keep-alive',
            });

            for await (const event of this.jsonrpcHandler.onResubscribeToTask(body, context)) {
              res.write(`data: ${JSON.stringify(event)}\n\n`);
            }

            res.end();
            return;
          }

          case 'tasks/pushNotificationConfig/get': {
            const response = await this.jsonrpcHandler.getPushNotificationConfig(body, context);
            return res.json(response);
          }

          case 'tasks/pushNotificationConfig/set': {
            const response = await this.jsonrpcHandler.setPushNotificationConfig(body, context);
            return res.json(response);
          }

          case 'tasks/pushNotificationConfig/list': {
            const response = await this.jsonrpcHandler.listPushNotificationConfig(body, context);
            return res.json(response);
          }

          case 'tasks/pushNotificationConfig/delete': {
            const response = await this.jsonrpcHandler.deletePushNotificationConfig(body, context);
            return res.json(response);
          }

          case 'agent/authenticatedExtendedCard': {
            const response = await this.jsonrpcHandler.getAuthenticatedExtendedCard(body, context);
            return res.json(response);
          }

          default: {
            return res.json({
              jsonrpc: '2.0',
              id: requestId,
              error: {
                code: -32601,
                message: 'Method not found',
              },
            });
          }
        }
      } catch (error) {
        console.error('Error handling request:', error);
        return res.status(500).json({
          jsonrpc: '2.0',
          id: (req.body as JSONRPCRequest)?.id ?? null,
          error: {
            code: -32603,
            message: error instanceof Error ? error.message : 'Internal error',
          },
        });
      }
    });

    // Agent card endpoint (v1.0 standard location)
    this.app.get('/.well-known/agent.json', (_req: Request, res: Response) => {
      return res.json(this.config.agentCard);
    });

    // Legacy agent card endpoint (deprecated)
    this.app.get('/agentCard', (_req: Request, res: Response) => {
      console.warn('Deprecated endpoint /agentCard accessed. Use /.well-known/agent.json instead.');
      return res.json(this.config.agentCard);
    });
  }

  /**
   * Starts the server
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(
        this.config.port || 3000,
        this.config.host || '0.0.0.0',
        () => {
          console.log(`A2A server listening on port ${this.config.port || 3000}`);
          resolve();
        }
      );
      this.server.on('error', reject);
    });
  }

  /**
   * Stops the server
   */
  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Gets the Express app
   */
  get instance(): Express {
    return this.app;
  }
}
