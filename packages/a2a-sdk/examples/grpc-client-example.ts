/**
 * Example gRPC client implementation using the A2A TypeScript SDK.
 */

import {
  ClientFactory,
  Client,
  GrpcTransport,
} from '../src/index.js';
import type {
  Message,
  Task,
  MessageSendParams,
  AgentCard,
} from '../src/types/index.js';
import { Role } from '../src/types/index.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Example demonstrating gRPC client usage.
 */
async function main() {
  try {
    // Create agent card for the server
    const agentCard: AgentCard = {
      name: 'A2A gRPC Echo Agent',
      description: 'A simple echo agent running on gRPC',
      version: '1.0.0',
      url: 'grpc://localhost:50051',
      provider: {
        organization: 'A2A Project',
        url: 'https://a2a-protocol.org',
      },
      capabilities: {
        streaming: true,
        push_notifications: false,
        extensions: [],
      },
      default_input_modes: ['text'],
      default_output_modes: ['text'],
      protocol_version: '1.0',
      preferred_transport: 'grpc',
      supports_authenticated_extended_card: false,
    };

    // Create gRPC channel factory
    // In a real implementation, you'd configure this properly
    const grpcChannelFactory = (url: string) => {
      const { ChannelCredentials } = require('@grpc/grpc-js');
      // For this example, we'll use insecure credentials
      // In production, use secure credentials with TLS
      return new (require('@grpc/grpc-js').Client)(
        url,
        ChannelCredentials.createInsecure(),
      );
    };

    // Create client config
    const config = {
      grpcChannelFactory,
    };

    // Create gRPC transport
    const transport = GrpcTransport.create(
      agentCard,
      'localhost:50051',
      config,
    );

    // Create client
    const client = new Client(transport);

    console.log('Connected to gRPC server at localhost:50051\n');

    // Example 1: Simple message send
    console.log('=== Example 1: Simple Message Send ===');
    const message: Message = {
      message_id: uuidv4(),
      role: Role.user,
      parts: [
        {
          root: {
            text: 'Hello, gRPC server!',
          },
        },
      ],
    };

    const response = await client.sendMessage({
      message,
    });

    console.log('Received response:', JSON.stringify(response, null, 2));
    console.log();

    // Example 2: Streaming message
    console.log('=== Example 2: Streaming Message ===');
    const streamingMessage: Message = {
      message_id: uuidv4(),
      role: Role.user,
      parts: [
        {
          root: {
            text: 'Please stream a response',
          },
        },
      ],
    };

    const stream = client.sendMessageStreaming({
      message: streamingMessage,
    });

    for await (const event of stream) {
      console.log('Received streaming event:', JSON.stringify(event, null, 2));
    }
    console.log();

    // Example 3: Get agent card
    console.log('=== Example 3: Get Agent Card ===');
    const card = await client.getCard();
    console.log('Agent Card:', JSON.stringify(card, null, 2));
    console.log();

    // Example 4: Calculator example (if using CalculatorAgentExecutor)
    console.log('=== Example 4: Calculator (if available) ===');
    try {
      const calcMessage: Message = {
        message_id: uuidv4(),
        role: Role.user,
        parts: [
          {
            root: {
              text: '2 + 2 * 3',
            },
          },
        ],
      };

      const calcResponse = await client.sendMessage({
        message: calcMessage,
      });

      console.log('Calculation result:', JSON.stringify(calcResponse, null, 2));
    } catch (error) {
      console.log('Calculator not available on this server');
    }
    console.log();

    console.log('All examples completed successfully!');

    // Close the transport
    await transport.close();
  } catch (error) {
    console.error('Error running examples:', error);
    process.exit(1);
  }
}

// Run the examples
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as grpcClientExample };
