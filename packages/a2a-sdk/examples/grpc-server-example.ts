/**
 * Example gRPC server implementation using the A2A TypeScript SDK.
 */

import { GrpcA2AServer, AgentExecutor, AgentExecutionResult } from '../src/index.js';
import type {
  Message,
  Task,
  TaskArtifact,
} from '../src/types/index.js';
import { TaskState } from '../src/types/index.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Example Echo Agent Executor.
 * Simply echoes back the user's message.
 */
class EchoAgentExecutor implements AgentExecutor {
  async execute(message: Message): Promise<AgentExecutionResult> {
    console.log(`Received message: ${message.message_id}`);

    // Create response message
    const responseMessage: Message = {
      message_id: uuidv4(),
      role: 'agent',
      parts: message.parts,
      context_id: message.context_id,
      task_id: message.task_id,
    };

    return {
      message: responseMessage,
    };
  }

  async executeStream(message: Message): AsyncGenerator<any, AgentExecutionResult, unknown> {
    console.log(`Received streaming message: ${message.message_id}`);

    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 100));

    const responseMessage: Message = {
      message_id: uuidv4(),
      role: 'agent',
      parts: message.parts,
      context_id: message.context_id,
      task_id: message.task_id,
    };

    yield responseMessage;

    return {
      message: responseMessage,
    };
  }
}

/**
 * Example Calculator Agent Executor.
 * Performs arithmetic operations on numbers in messages.
 */
class CalculatorAgentExecutor implements AgentExecutor {
  async execute(message: Message): Promise<AgentExecutionResult> {
    console.log(`Calculator received message: ${message.message_id}`);

    // Extract text from message
    const text = message.parts
      .map((part) => ('text' in part.root ? part.root.text : ''))
      .join(' ');

    // Try to evaluate simple arithmetic
    const result = this.evaluateExpression(text);

    const responseMessage: Message = {
      message_id: uuidv4(),
      role: 'agent',
      parts: [
        {
          root: {
            text: `Result: ${result}`,
          },
        },
      ],
      context_id: message.context_id,
      task_id: message.task_id,
    };

    return {
      message: responseMessage,
    };
  }

  async executeStream(message: Message): AsyncGenerator<any, AgentExecutionResult, unknown> {
    console.log(`Calculator streaming message: ${message.message_id}`);

    // Extract text from message
    const text = message.parts
      .map((part) => ('text' in part.root ? part.root.text : ''))
      .join(' ');

    // Emit status update
    yield {
      task_id: message.task_id || uuidv4(),
      context_id: message.context_id,
      status: {
        state: 'working',
        message: {
          message_id: uuidv4(),
          role: 'agent',
          parts: [{ root: { text: 'Calculating...' } }],
        },
      },
      final: false,
    };

    await new Promise(resolve => setTimeout(resolve, 500));

    // Emit artifact update
    yield {
      task_id: message.task_id || uuidv4(),
      context_id: message.context_id,
      artifact: {
        artifact_id: uuidv4(),
        name: 'calculation_result',
        parts: [
          {
            root: {
              text: `Calculation result: ${this.evaluateExpression(text)}`,
            },
          },
        ],
      },
      append: false,
      last_chunk: true,
    };

    const result = this.evaluateExpression(text);

    return {
      message: {
        message_id: uuidv4(),
        role: 'agent',
        parts: [
          {
            root: {
              text: `Final Result: ${result}`,
            },
          },
        ],
        context_id: message.context_id,
        task_id: message.task_id,
      },
    };
  }

  private evaluateExpression(expression: string): string {
    try {
      // Simple arithmetic evaluation
      // WARNING: eval() is dangerous in production - use a proper parser!
      const result = eval(expression);
      return String(result);
    } catch (error) {
      return 'Error: Invalid expression';
    }
  }
}

/**
 * Main function to start the gRPC server.
 */
async function main() {
  // Create agent card
  const agentCard = {
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
  };

  // Choose executor
  const executor = new EchoAgentExecutor();
  // const executor = new CalculatorAgentExecutor();

  // Create and start server
  const server = new GrpcA2AServer({
    agentCard,
    executor,
    port: 50051,
    host: '0.0.0.0',
  });

  // Handle shutdown gracefully
  const shutdown = async () => {
    console.log('\nShutting down gRPC server...');
    await server.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  try {
    await server.start();
    console.log('gRPC A2A server is running...');
    console.log('Server listening on grpc://localhost:50051');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { EchoAgentExecutor, CalculatorAgentExecutor };
