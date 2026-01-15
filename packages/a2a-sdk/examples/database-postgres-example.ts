/**
 * PostgreSQL Database Task Store Example
 *
 * This example demonstrates how to use PostgreSQL as the task store
 * for persistent task storage in an A2A server.
 */

import { A2AServer, AgentExecutor } from 'a2a-sdk';
import type { Message, AgentExecutionResult } from 'a2a-sdk';
import { v4 as uuidv4 } from 'uuid';

class EchoAgent implements AgentExecutor {
  async execute(
    message: Message,
    context: any
  ): Promise<AgentExecutionResult> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    const response: Message = {
      kind: 'message',
      message_id: uuidv4(),
      role: 'agent',
      parts: [
        {
          root: {
            text: `Echo: ${message.parts[0]?.root?.text || 'No text'}`,
          },
        },
      ],
      context_id: message.context_id,
    };

    return {
      message: response,
    };
  }
}

async function main() {
  // PostgreSQL configuration
  const postgresConfig = {
    type: 'postgres' as const,
    connection: 'postgresql://user:password@localhost:5432/a2a_db',
    tableName: 'a2a_tasks',
    timeout: 30000,
    maxConnections: 20,
    ssl: false, // Set to true for production with SSL
    retryAttempts: 3,
    retryDelay: 1000,
  };

  const serverConfig = {
    agentCard: {
      name: 'PostgreSQL Task Store Agent',
      description: 'A2A agent with PostgreSQL persistent task storage',
      version: '1.0.0',
      url: 'http://localhost:3000',
      capabilities: {
        streaming: true,
        push_notifications: false,
        extensions: [],
      },
      protocol_version: '1.0',
      supports_authenticated_extended_card: false,
    },
    executor: new EchoAgent(),
    port: 3000,
    host: '0.0.0.0',
    database: postgresConfig,
  };

  const server = new A2AServer(serverConfig);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    await server.stop();
    process.exit(0);
  });

  try {
    await server.start('fastify');
    console.log('A2A server with PostgreSQL task store started on http://localhost:3000');
    console.log('Database:', postgresConfig.connection);

    // Test task persistence
    console.log('\nTasks will be persisted to PostgreSQL database.');
    console.log('You can query them using:');
    console.log(`  SELECT * FROM ${postgresConfig.tableName};`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main().catch(console.error);
