/**
 * A2A Server with Telemetry and PostgreSQL Example
 *
 * This example demonstrates comprehensive observability with:
 * - OpenTelemetry tracing
 * - Database operation instrumentation
 * - Metrics collection
 * - PostgreSQL task store with telemetry
 * - Request tracing middleware
 */

import { A2AServer, AgentExecutor } from 'a2a-sdk';
import type { Message, AgentExecutionResult } from 'a2a-sdk';
import { v4 as uuidv4 } from 'uuid';

// Import telemetry and database components
import {
  createTelemetryWrapper,
  instrumentTaskStore,
  type TelemetryWrapperConfig,
  type OpenTelemetryConfig,
} from '../src/server/telemetry';

class CalculatorAgent implements AgentExecutor {
  async execute(
    message: Message,
    context: any
  ): Promise<AgentExecutionResult> {
    const text = message.parts[0]?.root?.text || '';
    const match = text.match(/(\d+)\s*([+\-*/])\s*(\d+)/);

    if (!match) {
      return {
        message: {
          kind: 'message',
          message_id: uuidv4(),
          role: 'agent',
          parts: [{ root: { text: 'Please provide a valid calculation (e.g., 2 + 3)' } }],
          context_id: message.context_id,
        },
      };
    }

    const [, a, operator, b] = match;
    const num1 = parseFloat(a);
    const num2 = parseFloat(b);

    let result: number;
    switch (operator) {
      case '+':
        result = num1 + num2;
        break;
      case '-':
        result = num1 - num2;
        break;
      case '*':
        result = num1 * num2;
        break;
      case '/':
        result = num1 / num2;
        break;
      default:
        result = 0;
    }

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 100));

    const response: Message = {
      kind: 'message',
      message_id: uuidv4(),
      role: 'agent',
      parts: [
        {
          root: {
            text: `${num1} ${operator} ${num2} = ${result}`,
          },
        },
      ],
      context_id: message.context_id,
    };

    return { message: response };
  }
}

async function main() {
  // ============================================================================
  // Telemetry Configuration
  // ============================================================================

  const openTelemetryConfig: OpenTelemetryConfig = {
    serviceName: 'a2a-calculator-postgres',
    serviceVersion: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    otlpEndpoint: process.env.OTLP_ENDPOINT || 'http://localhost:4317/v1/traces',
    consoleExporter: process.env.NODE_ENV !== 'production',
    traceSamplingRate: 1.0,
    enableMetrics: true,
    enableTracing: true,
  };

  const telemetryConfig: TelemetryWrapperConfig = {
    telemetry: {
      enabled: true,
      serviceName: 'a2a-calculator-postgres',
      enableTracing: true,
      enableDbSpans: true,
    },
    metrics: {
      enabled: true,
      prefix: 'a2a',
      enableHistograms: true,
    },
  };

  // Create telemetry wrapper
  console.log('Initializing telemetry...');
  const telemetry = await createTelemetryWrapper({
    ...telemetryConfig,
    openTelemetry: openTelemetryConfig,
  });

  // ============================================================================
  // Database Configuration with Telemetry
  // ============================================================================

  const postgresConfig = {
    type: 'postgres' as const,
    connection: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/a2a_db',
    maxConnections: 20,
    ssl: false,
    retryAttempts: 3,
    retryDelay: 1000,
  };

  console.log('Database configuration:', {
    type: postgresConfig.type,
    connection: postgresConfig.connection,
    maxConnections: postgresConfig.maxConnections,
  });

  // ============================================================================
  // Server Configuration with Instrumented Database
  // ============================================================================

  const serverConfig = {
    agentCard: {
      name: 'Calculator Agent (PostgreSQL + Telemetry)',
      description: 'A2A agent with PostgreSQL persistence and comprehensive telemetry',
      version: '1.0.0',
      url: 'http://localhost:3004',
      capabilities: {
        streaming: true,
        push_notifications: false,
        extensions: [],
      },
      protocol_version: '1.0',
      supports_authenticated_extended_card: false,
    },
    executor: new CalculatorAgent(),
    port: 3004,
    host: '0.0.0.0',
    database: postgresConfig,
  };

  const server = new A2AServer(serverConfig);

  // The server will automatically use the database task store
  // We can access it and wrap it with additional instrumentation if needed
  const taskStore = server.getTaskStore();
  const instrumentedTaskStore = instrumentTaskStore(taskStore, telemetry, {
    tableName: 'a2a_tasks',
  });

  console.log('');
  console.log('Server Configuration:');
  console.log('  ✓ PostgreSQL database persistence');
  console.log('  ✓ Database operation tracing');
  console.log('  ✓ Task execution metrics');
  console.log('  ✓ Request tracing middleware');
  console.log('  ✓ Custom spans and attributes');
  console.log('');

  await server.start('fastify');

  console.log('A2A server with PostgreSQL and telemetry started on http://localhost:3004');
  console.log('');
  console.log('Database Information:');
  console.log('  Type: PostgreSQL');
  console.log('  Connection:', postgresConfig.connection);
  console.log('  Pool Size:', postgresConfig.maxConnections);
  console.log('');
  console.log('Telemetry Information:');
  console.log('  Service:', openTelemetryConfig.serviceName);
  console.log('  Environment:', openTelemetryConfig.environment);
  console.log('  OTLP Endpoint:', openTelemetryConfig.otlpEndpoint);
  console.log('');
  console.log('Metrics Available:');
  console.log('  - Task execution duration (histogram)');
  console.log('  - Task count by state (counter)');
  console.log('  - Active tasks (up/down counter)');
  console.log('  - Database operation duration (histogram)');
  console.log('  - Database errors (counter)');
  console.log('  - HTTP request duration (histogram)');
  console.log('  - HTTP request count (counter)');
  console.log('');
  console.log('Spans Created:');
  console.log('  - HTTP requests');
  console.log('  - Agent executions');
  console.log('  - Task create/update/delete');
  console.log('  - Database operations (CRUD)');
  console.log('  - Event streaming');
  console.log('');
  console.log('View telemetry data:');
  console.log('  - Traces: http://localhost:16686 (Jaeger)');
  console.log('  - Metrics: http://localhost:9090 (Prometheus + Grafana)');
  console.log('');

  // ============================================================================
  // Test Database Operations
  // ============================================================================

  console.log('Testing database operations with telemetry...');

  // Create a test task
  const testTask = {
    id: 'test-task-' + Date.now(),
    contextId: 'test-context',
    status: {
      state: 'running',
      timestamp: new Date().toISOString(),
    },
    artifacts: [],
    history: [],
    metadata: { test: true },
  };

  await instrumentedTaskStore.createTask(testTask);
  console.log('✓ Task created with tracing');

  // Get the task
  const retrievedTask = await instrumentedTaskStore.getTask(testTask.id);
  console.log('✓ Task retrieved with tracing:', retrievedTask?.id);

  // Update the task
  const updatedTask = await instrumentedTaskStore.updateTask(testTask.id, {
    status: {
      state: 'completed',
      timestamp: new Date().toISOString(),
    },
  });
  console.log('✓ Task updated with tracing:', updatedTask.status?.state);

  // List tasks
  const tasks = await instrumentedTaskStore.listTasks({ contextId: 'test-context' });
  console.log('✓ Tasks listed with tracing:', tasks.length);

  // Delete the task
  await instrumentedTaskStore.deleteTask(testTask.id);
  console.log('✓ Task deleted with tracing');

  console.log('');
  console.log('All database operations instrumented successfully!');
  console.log('');

  // ============================================================================
  // Graceful Shutdown
  // ============================================================================

  process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    await server.stop();
    await telemetry.shutdown();
    console.log('Shutdown complete');
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
