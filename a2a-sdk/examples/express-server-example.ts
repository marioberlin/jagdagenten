/**
 * Example: Creating an A2A Server with Express
 *
 * This example demonstrates how to create a simple A2A agent server
 * using the Express adapter.
 */

import {
  ExpressA2AServer,
  AgentExecutor,
  AgentExecutionResult,
  AgentExecutionContext,
  Message,
  Role,
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
}

/**
 * Example server configuration
 */
const serverConfig = {
  agentCard: {
    name: 'Echo Agent (Express)',
    description: 'A simple agent that echoes back messages using Express',
    version: '1.0.0',
    url: 'http://localhost:3001/a2a/v1',
    capabilities: {
      streaming: false,
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
  },
  executor: new EchoAgentExecutor(),
  port: 3001,
  host: '0.0.0.0',
};

/**
 * Main function to start the Express server
 */
async function main() {
  console.log('Starting A2A Echo Server (Express)...');

  const server = new ExpressA2AServer(serverConfig);

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
    await server.start();
    console.log('Server is running on http://localhost:3001');
    console.log('Agent card available at http://localhost:3001/.well-known/agent.json');
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
