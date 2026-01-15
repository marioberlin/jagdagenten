/**
 * Express adapter for A2A server
 */

import { Express, Request, Response, NextFunction } from 'express';
import { AgentExecutor } from './interfaces';
import { AgentCard } from '../types';
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
 * Creates an Express server for A2A protocol
 */
export class ExpressA2AServer {
  private app: Express;
  private config: ExpressA2AConfig;
  private taskStore: InMemoryTaskStore;
  private eventQueue: InMemoryEventQueue;
  private requestHandler: DefaultRequestHandler;
  private jsonrpcHandler: JSONRPCHandler;
  private server: any;

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

    this.app = require('express')();
    this.setupRoutes();
  }

  /**
   * Sets up the Express routes
   */
  private setupRoutes(): void {
    // JSON-RPC endpoint
    this.app.post('/a2a/v1', async (req: Request, res: Response) => {
      try {
        const body = req.body;
        const requestId = body?.id || null;

        // Build context
        const context = new DefaultServerCallContext({
          headers: req.headers as Record<string, string>,
        });

        // Route based on method
        const method = body?.method;

        switch (method) {
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
              res.write(`data: ${JSON.stringify(event.root)}\n\n`);
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
              res.write(`data: ${JSON.stringify(event.root)}\n\n`);
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
        console.error('Error handling request:', error);
        return res.status(500).json({
          root: {
            id: (req.body as any)?.id || null,
            error: {
              code: -32000,
              message: error instanceof Error ? error.message : 'Internal error',
            },
          },
        });
      }
    });

    // Agent card endpoint
    this.app.get('/.well-known/agent.json', (req: Request, res: Response) => {
      return res.json(this.config.agentCard);
    });

    // Previous agent card endpoint (deprecated)
    this.app.get('/agentCard', (req: Request, res: Response) => {
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
        this.server.close(err => {
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
