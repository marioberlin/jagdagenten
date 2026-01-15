/**
 * Client factory for creating A2A clients
 */

import {
  AgentCard,
  TransportProtocol,
} from '../types';
import { Client, ClientConfig } from './interfaces';
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
    // Return a client that uses the transport
    // In a real implementation, this would return a concrete client class
    return new (class implements Client {
      async *sendMessage(): AsyncIterableIterator<any> {}
      async getTask(): Promise<any> {
        return {};
      }
      async cancelTask(): Promise<any> {
        return {};
      }
      async setTaskCallback(): Promise<any> {
        return {};
      }
      async getTaskCallback(): Promise<any> {
        return {};
      }
      async *resubscribe(): AsyncIterableIterator<any> {}
      async getCard(): Promise<AgentCard> {
        return agentCard;
      }
      addEventConsumer(): void {}
      addRequestMiddleware(): void {}
      async close(): Promise<void> {}
    })();
  }

  /**
   * Selects the best transport based on agent card and client config
   */
  private static selectTransport(agentCard: AgentCard, config: ClientConfig): any {
    // Determine preferred transport
    let preferredTransport = config.preferredTransport || agentCard.preferred_transport || 'JSONRPC';

    // If using client preference, check if agent supports it
    if (config.useClientPreference && preferredTransport) {
      // Verify agent supports the preferred transport
      // For now, we'll just use the preferred transport
    }

    // Create appropriate transport
    switch (preferredTransport) {
      case TransportProtocol.JSONRPC:
        return new JSONRPCTransport(agentCard.url, config.headers);

      case TransportProtocol.GRPC:
        // gRPC transport would be implemented here
        throw new Error('gRPC transport not yet implemented');

      case TransportProtocol.HTTP_JSON:
        // HTTP+JSON transport would be implemented here
        throw new Error('HTTP+JSON transport not yet implemented');

      default:
        // Default to JSON-RPC
        return new JSONRPCTransport(agentCard.url, config.headers);
    }
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
   * Creates a client from an agent URL (fetches agent card first)
   */
  static async createClientFromUrl(
    agentUrl: string,
    config: ClientConfig = {}
  ): Promise<Client> {
    const agentCard = await this.fetchAgentCard(agentUrl);
    return this.createClient(agentCard, config);
  }
}
