/**
 * Example: Creating an A2A Server with Fastify
 *
 * This example demonstrates how to create a simple A2A agent server
 * using the Fastify adapter.
 */

import {
  A2AServer,
  AgentExecutor,
  AgentExecutionResult,
  AgentExecutionContext,
  Message,
  Task,
  ServerConfig,
  Role,
  A2AError,
  ServerError,
} from '../src/index';

/**
 * Example agent executor that echoes messages
 */
class EchoAgentExecutor implements AgentExecutor {
  async execute(
    message: Message,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    // Extract the text from the message
    const text = message.parts
      .filter(part => part.kind === 'text')
      .map(part => (part as any).text)
      .join(' ');

    // Create a response message
    const response: Message = {
      kind: 'message',
      message_id: crypto.randomUUID(),
      role: Role.AGENT,
      parts: [
        {
          kind: 'text',
          text: `Echo: ${text}`,
        },
      ],
    };

    // Return the result
    return {
      message: response,
    };
  }

  async *executeStream(
    message: Message,
    context: AgentExecutionContext
  ): AsyncIterableIterator<any> {
    // Extract the text from the message
    const text = message.parts
      .filter(part => part.kind === 'text')
      .map(part => (part as any).text)
      .join(' ');

    // Simulate streaming by yielding chunks
    const words = text.split(' ');
    for (let i = 0; i < words.length; i++) {
      yield {
        kind: 'message',
        message_id: crypto.randomUUID(),
        role: Role.AGENT,
        parts: [
          {
            kind: 'text',
            text: `Echo ${i + 1}/${words.length}: ${words.slice(0, i + 1).join(' ')}`,
          },
        ],
      };

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

/**
 * Example agent executor that performs calculations
 */
class CalculatorAgentExecutor implements AgentExecutor {
  async execute(
    message: Message,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    // Extract the text from the message
    const text = message.parts
      .filter(part => part.kind === 'text')
      .map(part => (part as any).text)
      .join(' ');

    // Simple calculation parsing (supports addition and subtraction)
    const match = text.match(/(\d+)\s*([+\-])\s*(\d+)/);
    if (match) {
      const num1 = parseInt(match[1], 10);
      const operator = match[2];
      const num2 = parseInt(match[3], 10);

      let result: number;
      if (operator === '+') {
        result = num1 + num2;
      } else {
        result = num1 - num2;
      }

      const response: Message = {
        kind: 'message',
        message_id: crypto.randomUUID(),
        role: Role.AGENT,
        parts: [
          {
            kind: 'text',
            text: `${num1} ${operator} ${num2} = ${result}`,
          },
        ],
      };

      return {
        message: response,
      };
    }

    // If no calculation found, return an error
    const response: Message = {
      kind: 'message',
      message_id: crypto.randomUUID(),
      role: Role.AGENT,
      parts: [
        {
          kind: 'text',
          text: 'Sorry, I can only perform simple addition and subtraction. Please use the format: number + number or number - number',
        },
      ],
    };

    return {
      message: response,
    };
  }

  async *executeStream(
    message: Message,
    context: AgentExecutionContext
  ): AsyncIterableIterator<any> {
    // For calculator, we'll just execute and return the result as a single message
    const result = await this.execute(message, context);
    if (result.message) {
      yield result.message;
    }
  }
}

/**
 * Example agent card configuration
 */
const agentCard = {
  name: 'Echo Agent',
  description: 'A simple agent that echoes back messages',
  version: '1.0.0',
  url: 'http://localhost:3000/a2a/v1',
  capabilities: {
    streaming: true,
    push_notifications: false,
    state_transition_history: true,
  },
  skills: [
    {
      id: 'echo',
      name: 'Echo',
      description: 'Echoes back any text message',
    },
  ],
  default_input_modes: ['text/plain'],
  default_output_modes: ['text/plain'],
};

/**
 * Example server configuration
 */
const serverConfig: ServerConfig = {
  agentCard,
  executor: new EchoAgentExecutor(),
  port: 3000,
  host: '0.0.0.0',
};

/**
 * Main function to start the server
 */
async function main() {
  console.log('Starting A2A Echo Server...');

  const server = new A2AServer(serverConfig);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down server...');
    await server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('Shutting down server...');
    await server.stop();
    process.exit(0);
  });

  try {
    await server.start('fastify');
    console.log('Server is running on http://localhost:3000');
    console.log('Agent card available at http://localhost:3000/.well-known/agent.json');
    console.log('\nTry sending a message to test:');
    console.log('curl -X POST http://localhost:3000/a2a/v1 \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"jsonrpc": "2.0", "id": 1, "method": "message/send", "params": {"message": {"kind": "message", "message_id": "msg-123", "role": "user", "parts": [{"kind": "text", "text": "Hello World!"}]}}}\'');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { main as runExample };
