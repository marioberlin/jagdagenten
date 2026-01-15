/**
 * MySQL Database Task Store Example
 *
 * This example demonstrates how to use MySQL as the task store
 * for persistent task storage in an A2A server.
 */

import { A2AServer, AgentExecutor } from 'a2a-sdk';
import type { Message, AgentExecutionResult } from 'a2a-sdk';
import { v4 as uuidv4 } from 'uuid';

class CalculatorAgent implements AgentExecutor {
  async execute(
    message: Message,
    context: any
  ): Promise<AgentExecutionResult> {
    const text = message.parts[0]?.root?.text || '';
    const match = text.match(/(\d+)\s*([+\-*/])\s*(\d+)/);

    if (!match) {
      const response: Message = {
        kind: 'message',
        message_id: uuidv4(),
        role: 'agent',
        parts: [
          {
            root: {
              text: 'Please provide a math expression like "5 + 3"',
            },
          },
        ],
        context_id: message.context_id,
      };

      return { message: response };
    }

    const [, num1, operator, num2] = match;
    const a = parseInt(num1, 10);
    const b = parseInt(num2, 10);

    let result: number;
    switch (operator) {
      case '+':
        result = a + b;
        break;
      case '-':
        result = a - b;
        break;
      case '*':
        result = a * b;
        break;
      case '/':
        result = a / b;
        break;
      default:
        throw new Error('Invalid operator');
    }

    const response: Message = {
      kind: 'message',
      message_id: uuidv4(),
      role: 'agent',
      parts: [
        {
          root: {
            text: `${a} ${operator} ${b} = ${result}`,
          },
        },
      ],
      context_id: message.context_id,
    };

    return { message: response };
  }
}

async function main() {
  // MySQL configuration
  const mysqlConfig = {
    type: 'mysql' as const,
    connection: {
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'password',
      database: 'a2a_db',
    },
    tableName: 'a2a_tasks',
    timeout: 30000,
    maxConnections: 20,
    ssl: false, // Set to true for production with SSL
    retryAttempts: 3,
    retryDelay: 1000,
  };

  const serverConfig = {
    agentCard: {
      name: 'MySQL Task Store Agent',
      description: 'A2A agent with MySQL persistent task storage',
      version: '1.0.0',
      url: 'http://localhost:3001',
      capabilities: {
        streaming: true,
        push_notifications: false,
        extensions: [],
      },
      protocol_version: '1.0',
      supports_authenticated_extended_card: false,
    },
    executor: new CalculatorAgent(),
    port: 3001,
    host: '0.0.0.0',
    database: mysqlConfig,
  };

  const server = new A2AServer(serverConfig);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    await server.stop();
    process.exit(0);
  });

  try {
    await server.start('express');
    console.log('A2A server with MySQL task store started on http://localhost:3001');
    console.log('Database:', mysqlConfig.connection.host + ':' + mysqlConfig.connection.port);

    // Test task persistence
    console.log('\nTasks will be persisted to MySQL database.');
    console.log('You can query them using:');
    console.log(`  USE ${mysqlConfig.connection.database};`);
    console.log(`  SELECT * FROM ${mysqlConfig.tableName};`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main().catch(console.error);
