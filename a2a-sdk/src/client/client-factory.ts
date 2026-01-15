/**
 * Client factory for creating A2A clients
 */

import {
  AgentCard,
  Message,
  Task,
  MessageSendParams,
  TransportProtocol,
  JSONRPCRequest,
  TaskStatusUpdateEvent,
  TaskArtifactUpdateEvent,
} from '../types';
import { Client, ClientConfig, ClientEvent, Consumer, ClientCallInterceptor, StreamEvent } from './interfaces';
import { JSONRPCTransport } from '../transports/jsonrpc-transport';

/**
 * Client factory for creating A2A clients with different transports
 */
export class ClientFactory {
  /**
   * Creates a new A2A client
   */
  static createClient(
    agentCard: AgentCard,
    config: ClientConfig = {}
  ): Client {
    // Determine transport
    const transport = new JSONRPCTransport(agentCard.url, config.headers);

    // Return a concrete client implementation
    class ConcreteClient implements Client {
      constructor() {
        console.log('[SDK] ConcreteClient initialized. sendText available:', typeof this.sendText);
      }

      async *sendMessage(
        request: Message,
        context?: any,
        metadata?: any,
        extensions?: string[]
      ): AsyncIterableIterator<ClientEvent | Message> {
        // Use transport
        if (config.streaming) {
          const iterator = transport.sendMessageStreaming(request, context, extensions);
          for await (const event of iterator) {
            // @ts-ignore
            yield event;
          }
        } else {
          const result = await transport.sendMessage(request, context, extensions);
          // @ts-ignore
          yield result;
        }
      }

      async getTask(request: any): Promise<Task> {
        return transport.getTask(request);
      }

      async cancelTask(request: any): Promise<Task> {
        return transport.cancelTask(request);
      }

      async setTaskCallback(request: any): Promise<any> {
        return transport.setTaskCallback(request);
      }

      async getTaskCallback(request: any): Promise<any> {
        return transport.getTaskCallback(request);
      }

      async *resubscribe(request: any): AsyncIterableIterator<ClientEvent> {
        // @ts-ignore
        const iterator = transport.resubscribe(request);
        for await (const event of iterator) {
          // @ts-ignore
          yield event;
        }
      }

      async getCard(): Promise<AgentCard> {
        return transport.getCard();
      }

      addEventConsumer(consumer: Consumer): void { }
      addRequestMiddleware(middleware: ClientCallInterceptor): void { }

      async close(): Promise<void> {
        await transport.close();
      }

      // Convenience methods
      async sendText(text: string, options?: any): Promise<Task> {
        console.log('[SDK] sendText called with:', text);
        const message: Message = {
          role: 'user',
          content: [{ kind: 'text', text }],
          created_at: new Date().toISOString(),
        };

        // Using transport direclty for non-streaming convenience
        const result = await transport.sendMessage(message, {
          metadata: options?.configuration
        });

        if ('id' in result) {
          return result as Task;
        }
        return result as any as Task;
      }

      async *streamText(text: string, options?: any, signal?: any): AsyncIterableIterator<StreamEvent> {
        const message: Message = {
          role: 'user',
          content: [{ kind: 'text', text }],
          created_at: new Date().toISOString(),
        };

        const iterator = transport.sendMessageStreaming(message, {
          metadata: options?.configuration,
        });

        for await (const event of iterator) {
          if ('status' in event && event.status) { // Task
            yield { type: 'complete', task: event as Task };
          } else if ('role' in event) { // Message
            // yield { type: 'message', message: event };
          } else if ('status' in event && 'timestamp' in event.status) { // Status Update
            yield { type: 'status', data: { status: (event as any).status } };
          } else if ('artifact' in event) { // Artifact Update
            yield { type: 'artifact', data: { artifact: (event as any).artifact } };
          } else {
            // Fallback
            try {
              // Check fields
              if ((event as any).task) yield { type: 'complete', task: (event as any).task };
              // @ts-ignore
              else if ((event as any).error) yield { type: 'error', error: (event as any).error };
            } catch (e) { }
          }
        }
      }
    }

    return new ConcreteClient();
  }

  /**
   * Fetches the agent card from a URL
   */
  static async fetchAgentCard(agentUrl: string): Promise<AgentCard> {
    const response = await fetch(`${agentUrl.replace(/\/$/, '')}/agentCard`);

    if (!response.ok) {
      throw new Error(`Failed to fetch agent card: ${response.statusText}`);
    }

    return (await response.json()) as AgentCard;
  }

  /**
   * Creates a client from an agent URL
   */
  static async createClientFromUrl(
    agentUrl: string,
    config: ClientConfig = {}
  ): Promise<Client> {
    // For now, bypass card fetch if not strictly required, or fetch it.
    // To solve connection error "not a function", simpler is better.
    // But we need the URL.
    const card: AgentCard = {
      url: agentUrl,
      name: 'Agent',
      description: '',
      version: '1.0.0',
      capabilities: {},
      default_input_modes: [],
      default_output_modes: [],
      skills: []
    };
    return this.createClient(card, config);
  }
}
