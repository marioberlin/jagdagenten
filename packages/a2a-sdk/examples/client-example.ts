/**
 * A2A Client Example
 *
 * This example demonstrates how to use the A2A TypeScript SDK client
 * to interact with A2A servers. It shows how to:
 * - Create a client from an AgentCard or URL
 * - Send messages (streaming and non-streaming)
 * - Get task status
 * - Cancel tasks
 * - Handle events
 */

import {
  ClientFactory,
  ClientConfig,
  Message,
  Role,
} from '../src';

class A2AClientExample {
  private client: any = null;

  async setup() {
    // ============================================================================
    // Create a client from a URL
    // ============================================================================

    const clientConfig: ClientConfig = {
      baseUrl: 'http://localhost:3000',
      timeout: 30000,
      streaming: true,
    };

    this.client = await ClientFactory.createClientFromUrl(
      'http://localhost:3000/a2a/v1',
      clientConfig
    );

    console.log('✓ Client created from URL');
    console.log('  Base URL:', clientConfig.baseUrl);
    console.log('  Streaming:', clientConfig.streaming);
  }

  async demonstrateNonStreamingMessage() {
    console.log('\n--- Non-Streaming Message ---');

    // Create a message
    const message: Message = {
      kind: 'message',
      message_id: 'msg-' + Date.now(),
      role: Role.User,
      parts: [
        {
          root: {
            text: 'Hello, can you help me with my question?',
          },
        },
      ],
      context_id: 'ctx-' + Date.now(),
    };

    try {
      // Send a message (non-streaming)
      console.log('Sending message...');
      const response = await this.client.sendMessage(message, {
        stream: false,
      });

      console.log('✓ Message sent successfully');
      console.log('  Message ID:', response.message?.message_id);
      console.log('  Response:', response.message?.parts?.[0]?.root?.text);

      return response;
    } catch (error) {
      console.error('✗ Failed to send message:', error);
      throw error;
    }
  }

  async demonstrateStreamingMessage() {
    console.log('\n--- Streaming Message ---');

    const message: Message = {
      kind: 'message',
      message_id: 'msg-' + Date.now(),
      role: Role.User,
      parts: [
        {
          root: {
            text: 'Tell me a story about a robot learning to paint',
          },
        },
      ],
      context_id: 'ctx-' + Date.now(),
    };

    try {
      console.log('Sending streaming message...');
      console.log('Waiting for events...');

      const events: any[] = [];
      let taskId: string | null = null;

      // Send message with streaming
      for await (const event of this.client.sendMessage(message, {
        stream: true,
      })) {
        events.push(event);
        console.log('  Event received:', event.kind);

        // Capture task ID from events
        if (event.kind === 'task' && event.task?.id) {
          taskId = event.task.id;
          console.log('  Task ID:', taskId);
        }

        // Print message updates
        if (event.kind === 'message' && event.message?.parts?.[0]?.root?.text) {
          console.log('  Message:', event.message.parts[0].root.text);
        }

        // Stop after receiving some events
        if (events.length >= 10) {
          console.log('  (Stopping after 10 events for demo)');
          break;
        }
      }

      console.log('✓ Streaming completed');
      console.log('  Total events:', events.length);

      return taskId;
    } catch (error) {
      console.error('✗ Streaming failed:', error);
      throw error;
    }
  }

  async demonstrateGetTask(taskId: string) {
    console.log('\n--- Get Task Status ---');

    if (!taskId) {
      console.log('Skipping (no task ID available)');
      return;
    }

    try {
      const task = await this.client.getTask(taskId);

      console.log('✓ Task retrieved successfully');
      console.log('  Task ID:', task.id);
      console.log('  Status:', task.status?.state);
      console.log('  Created:', task.status?.timestamp);
      console.log('  History length:', task.history?.length || 0);
      console.log('  Artifacts:', task.artifacts?.length || 0);

      return task;
    } catch (error) {
      console.error('✗ Failed to get task:', error);
      throw error;
    }
  }

  async demonstrateCancelTask(taskId: string) {
    console.log('\n--- Cancel Task ---');

    if (!taskId) {
      console.log('Skipping (no task ID available)');
      return;
    }

    try {
      await this.client.cancelTask({
        id: taskId,
      });

      console.log('✓ Task cancelled successfully');
      console.log('  Task ID:', taskId);
    } catch (error) {
      console.error('✗ Failed to cancel task:', error);
      throw error;
    }
  }

  async demonstrateListTasks() {
    console.log('\n--- List Tasks ---');

    try {
      const tasks = await this.client.listTasks({
        limit: 10,
      });

      console.log('✓ Tasks listed successfully');
      console.log('  Total tasks:', tasks.length);

      if (tasks.length > 0) {
        console.log('  First task:', {
          id: tasks[0].id,
          status: tasks[0].status?.state,
        });
      }

      return tasks;
    } catch (error) {
      console.error('✗ Failed to list tasks:', error);
      throw error;
    }
  }

  async demonstrateResubscribe(taskId: string) {
    console.log('\n--- Resubscribe to Task ---');

    if (!taskId) {
      console.log('Skipping (no task ID available)');
      return;
    }

    try {
      console.log('Resubscribing to task events...');

      const events: any[] = [];
      let eventCount = 0;

      for await (const event of this.client.resubscribe({
        id: taskId,
      })) {
        events.push(event);
        eventCount++;

        console.log(`  Event ${eventCount}:`, event.kind);

        if (eventCount >= 5) {
          console.log('  (Stopping after 5 events for demo)');
          break;
        }
      }

      console.log('✓ Resubscription completed');
      console.log('  Events received:', events.length);
    } catch (error) {
      console.error('✗ Resubscription failed:', error);
      throw error;
    }
  }

  async demonstrateAgentCard() {
    console.log('\n--- Get Agent Card ---');

    try {
      const agentCard = await this.client.getAgentCard();

      console.log('✓ Agent card retrieved successfully');
      console.log('  Name:', agentCard.name);
      console.log('  Description:', agentCard.description);
      console.log('  Version:', agentCard.version);
      console.log('  URL:', agentCard.url);
      console.log('  Capabilities:', {
        streaming: agentCard.capabilities?.streaming,
        push_notifications: agentCard.capabilities?.push_notifications,
      });

      return agentCard;
    } catch (error) {
      console.error('✗ Failed to get agent card:', error);
      throw error;
    }
  }

  async cleanup() {
    if (this.client) {
      try {
        await this.client.close();
        console.log('\n✓ Client closed successfully');
      } catch (error) {
        console.error('✗ Error closing client:', error);
      }
    }
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('A2A TypeScript SDK - Client Example');
  console.log('='.repeat(70));

  const example = new A2AClientExample();

  try {
    // Setup
    await example.setup();

    // Get agent card
    await example.demonstrateAgentCard();

    // Non-streaming message
    const response1 = await example.demonstrateNonStreamingMessage();

    // Streaming message
    const taskId = await example.demonstrateStreamingMessage();

    // Get task
    await example.demonstrateGetTask(taskId || '');

    // List tasks
    await example.demonstrateListTasks();

    // Cancel task
    await example.demonstrateCancelTask(taskId || '');

    // Resubscribe (if task exists)
    await example.demonstrateResubscribe(taskId || '');

    console.log('\n' + '='.repeat(70));
    console.log('All examples completed successfully!');
    console.log('='.repeat(70));
  } catch (error) {
    console.error('\n✗ Example failed:', error);
    console.error('\nNote: This example requires a running A2A server.');
    console.error('Start a server with: npm run example:server');
    process.exit(1);
  } finally {
    await example.cleanup();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main as runClientExample };
