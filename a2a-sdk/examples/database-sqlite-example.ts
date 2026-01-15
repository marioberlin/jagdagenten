/**
 * SQLite Database Task Store Example
 *
 * This example demonstrates how to use SQLite as the task store
 * for lightweight, file-based task storage in an A2A server.
 *
 * SQLite is perfect for:
 * - Development and testing
 * - Small to medium deployments
 * - Edge computing scenarios
 * - Applications where external database is not available
 */

import { A2AServer, AgentExecutor } from 'a2a-sdk';
import type { Message, AgentExecutionResult } from 'a2a-sdk';
import { v4 as uuidv4 } from 'uuid';

class WeatherAgent implements AgentExecutor {
  async execute(
    message: Message,
    context: any
  ): Promise<AgentExecutionResult> {
    const text = message.parts[0]?.root?.text || '';
    const location = text.replace('weather', '').trim() || 'Unknown';

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    const response: Message = {
      kind: 'message',
      message_id: uuidv4(),
      role: 'agent',
      parts: [
        {
          root: {
            text: `Weather for ${location}: Sunny, 22°C (no data source, simulated)`,
          },
        },
      ],
      context_id: message.context_id,
    };

    return { message: response };
  }
}

async function main() {
  // SQLite configuration
  const sqliteConfig = {
    type: 'sqlite' as const,
    connection: './a2a-tasks.db', // File-based database
    tableName: 'a2a_tasks',
    walMode: true, // Write-Ahead Logging for better concurrency
    foreignKeys: true,
    cacheSize: 2000, // 2000 pages (default ~1.5MB)
  };

  const serverConfig = {
    agentCard: {
      name: 'SQLite Task Store Agent',
      description: 'A2A agent with SQLite file-based task storage',
      version: '1.0.0',
      url: 'http://localhost:3002',
      capabilities: {
        streaming: true,
        push_notifications: false,
        extensions: [],
      },
      protocol_version: '1.0',
      supports_authenticated_extended_card: false,
    },
    executor: new WeatherAgent(),
    port: 3002,
    host: '0.0.0.0',
    database: sqliteConfig,
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
    console.log('A2A server with SQLite task store started on http://localhost:3002');
    console.log('Database file:', sqliteConfig.connection);

    // Test task persistence
    console.log('\nTasks will be persisted to SQLite database file.');
    console.log('You can inspect it using:');
    console.log('  sqlite3', sqliteConfig.connection);
    console.log('  > SELECT * FROM', sqliteConfig.tableName + ';');
    console.log('  > .schema', sqliteConfig.tableName);

    // Show database stats
    const taskStore = server.getTaskStore();
    if ('getDatabase' in taskStore) {
      const db = (taskStore as any).getDatabase();
      const stats = db.prepare('PRAGMA page_count;').get();
      console.log('\nDatabase stats:');
      console.log('  Page count:', stats.page_count);
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main().catch(console.error);
