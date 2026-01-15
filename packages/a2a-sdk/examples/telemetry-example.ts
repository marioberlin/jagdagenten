/**
 * A2A Server with Telemetry Example
 *
 * This example demonstrates how to enable and configure telemetry
 * for an A2A server, including distributed tracing and metrics collection.
 *
 * Features demonstrated:
 * - OpenTelemetry initialization
 * - Request tracing with middleware
 * - Task store instrumentation
 * - Database operation tracing
 * - Custom spans and metrics
 */

import { A2AServer, AgentExecutor } from 'a2a-sdk';
import type { Message, AgentExecutionResult } from 'a2a-sdk';
import { v4 as uuidv4 } from 'uuid';

// Import telemetry components
import {
  createTelemetryWrapper,
  createFastifyTelemetryMiddleware,
  createExpressTelemetryMiddleware,
  extractHttpAttributes,
  type TelemetryWrapperConfig,
  type OpenTelemetryConfig,
} from '../src/server/telemetry';

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
            text: `Weather for ${location}: Sunny, 22°C (simulated)`,
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

  // OpenTelemetry configuration
  const openTelemetryConfig: OpenTelemetryConfig = {
    serviceName: 'a2a-weather-agent',
    serviceVersion: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    otlpEndpoint: process.env.OTLP_ENDPOINT || 'http://localhost:4317/v1/traces',
    consoleExporter: process.env.NODE_ENV !== 'production',
    traceSamplingRate: 1.0, // 100% sampling for demo (use 0.1 for production)
    enableMetrics: true,
    enableTracing: true,
  };

  // Telemetry wrapper configuration
  const telemetryConfig: TelemetryWrapperConfig = {
    telemetry: {
      enabled: true,
      serviceName: 'a2a-weather-agent',
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
  // Server Configuration with Telemetry
  // ============================================================================

  const serverConfig = {
    agentCard: {
      name: 'Weather Agent with Telemetry',
      description: 'A2A agent with comprehensive telemetry and observability',
      version: '1.0.0',
      url: 'http://localhost:3003',
      capabilities: {
        streaming: true,
        push_notifications: false,
        extensions: [],
      },
      protocol_version: '1.0',
      supports_authenticated_extended_card: false,
    },
    executor: new WeatherAgent(),
    port: 3003,
    host: '0.0.0.0',
  };

  const server = new A2AServer(serverConfig);

  // ============================================================================
  // Middleware Integration
  // ============================================================================

  // For Fastify server
  const fastifyInstance = await server.start('fastify', {
    preHandler: createFastifyTelemetryMiddleware(telemetry, {
      attributeExtractor: extractHttpAttributes,
      skipPaths: [/^\/health$/, /^\/metrics$/],
    }),
  });

  // For Express server (alternative)
  /*
  const expressInstance = await server.start('express', {
    preMiddleware: [
      createExpressTelemetryMiddleware(telemetry, {
        attributeExtractor: extractHttpAttributes,
        skipPaths: [/^\/health$/, /^\/metrics$/],
      }),
    ],
  });
  */

  console.log('A2A server with telemetry started on http://localhost:3003');
  console.log('');
  console.log('Telemetry Features Enabled:');
  console.log('  ✓ Distributed tracing with OpenTelemetry');
  console.log('  ✓ HTTP request tracing');
  console.log('  ✓ Task execution metrics');
  console.log('  ✓ Database operation tracing');
  console.log('  ✓ Custom spans and attributes');
  console.log('');
  console.log('Configuration:');
  console.log('  Service:', openTelemetryConfig.serviceName);
  console.log('  Environment:', openTelemetryConfig.environment);
  console.log('  OTLP Endpoint:', openTelemetryConfig.otlpEndpoint);
  console.log('  Console Export:', openTelemetryConfig.consoleExporter);
  console.log('');
  console.log('View telemetry data:');
  console.log('  - Traces: http://localhost:16686 (Jaeger)');
  console.log('  - Metrics: http://localhost:9090 (Prometheus)');
  console.log('');

  // ============================================================================
  // Custom Instrumentation Example
  // ============================================================================

  // Add custom span for specific operations
  const customSpan = telemetry.traceServerRequest('GET', '/custom-operation');
  telemetry.addAttributes(customSpan, {
    'custom.attribute': 'example-value',
    'custom.counter': 123,
  });
  telemetry.setSuccess(customSpan, true);
  customSpan?.end();

  // Record custom metrics
  telemetry.recordTaskExecution(250, 'completed');
  telemetry.recordActiveTask(1);
  telemetry.recordHttpRequest('GET', '/health', 200, 50);

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

  process.on('SIGTERM', async () => {
    console.log('\nReceived SIGTERM, shutting down...');
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
