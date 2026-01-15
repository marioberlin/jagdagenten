# Telemetry and Observability for A2A SDK

## Overview

The A2A TypeScript SDK provides comprehensive observability features through OpenTelemetry integration, enabling distributed tracing, metrics collection, and monitoring of all A2A protocol operations.

## Features

### Distributed Tracing
- **Automatic span creation** for all A2A operations
- **HTTP request tracing** with middleware integration
- **Database operation tracing** with task store instrumentation
- **Custom spans** for business logic
- **Span attributes** for rich context
- **Exception recording** with automatic error tracking

### Metrics Collection
- **Task execution metrics** (duration, count, success rate)
- **Database operation metrics** (duration, errors, throughput)
- **HTTP request metrics** (duration, count, status codes)
- **Active task tracking** with up/down counters
- **Histogram distributions** for latency analysis
- **Counter metrics** for event counting

### Observability
- **Jaeger integration** for trace visualization
- **Prometheus integration** for metrics collection
- **OTLP exporter** for standard telemetry protocol
- **Console exporter** for development/debugging
- **Custom attributes** for business context

## Quick Start

### 1. Basic Telemetry Setup

```typescript
import { A2AServer, AgentExecutor } from 'a2a-sdk';
import { createTelemetryWrapper } from 'a2a-sdk';

class MyAgent implements AgentExecutor {
  async execute(message: Message, context: any): Promise<AgentExecutionResult> {
    // Your agent logic here
    return { message: response };
  }
}

// Create telemetry wrapper
const telemetry = await createTelemetryWrapper({
  telemetry: {
    enabled: true,
    serviceName: 'my-a2a-agent',
    enableTracing: true,
    enableDbSpans: true,
  },
  metrics: {
    enabled: true,
    prefix: 'a2a',
    enableHistograms: true,
  },
});

// Create server with telemetry
const server = new A2AServer({
  agentCard: { /* ... */ },
  executor: new MyAgent(),
  port: 3000,
});

await server.start('fastify');
```

### 2. With OpenTelemetry Configuration

```typescript
import { createTelemetryWrapper } from 'a2a-sdk';

const telemetry = await createTelemetryWrapper({
  telemetry: { enabled: true },
  metrics: { enabled: true },
  openTelemetry: {
    serviceName: 'my-a2a-agent',
    serviceVersion: '1.0.0',
    environment: 'production',
    otlpEndpoint: 'http://localhost:4317/v1/traces',
    consoleExporter: false,
    traceSamplingRate: 0.1, // 10% sampling
    enableMetrics: true,
    enableTracing: true,
  },
});
```

## Configuration

### Telemetry Configuration

```typescript
interface TelemetryConfig {
  /** Enable telemetry */
  enabled?: boolean;

  /** Service name for tracing */
  serviceName?: string;

  /** Service version */
  serviceVersion?: string;

  /** OpenTelemetry collector endpoint */
  collectorEndpoint?: string;

  /** Enable metrics collection */
  enableMetrics?: boolean;

  /** Enable tracing */
  enableTracing?: boolean;

  /** Enable spans for database operations */
  enableDbSpans?: boolean;

  /** Custom span attributes */
  customAttributes?: Record<string, string | number | boolean>;
}
```

### Metrics Configuration

```typescript
interface MetricsConfig {
  /** Enable metrics collection */
  enabled?: boolean;

  /** Metrics prefix for all metric names */
  prefix?: string;

  /** Enable histograms for duration metrics */
  enableHistograms?: boolean;

  /** Buckets for duration histograms (in seconds) */
  durationBuckets?: number[];
}
```

### OpenTelemetry Configuration

```typescript
interface OpenTelemetryConfig {
  /** Service name */
  serviceName?: string;

  /** Service version */
  serviceVersion?: string;

  /** Environment (production, development, etc.) */
  environment?: string;

  /** OTLP collector endpoint */
  otlpEndpoint?: string;

  /** Enable console exporter for development */
  consoleExporter?: boolean;

  /** Enable trace sampling (0.0 to 1.0) */
  traceSamplingRate?: number;

  /** Enable metrics export */
  enableMetrics?: boolean;

  /** Enable tracing */
  enableTracing?: boolean;
}
```

## HTTP Middleware Integration

### Fastify Integration

```typescript
import { createFastifyTelemetryMiddleware } from 'a2a-sdk';

const telemetry = await createTelemetryWrapper(config);

const fastify = await server.start('fastify', {
  preHandler: createFastifyTelemetryMiddleware(telemetry, {
    attributeExtractor: extractHttpAttributes,
    skipPaths: [/^\/health$/, /^\/metrics$/],
  }),
});
```

### Express Integration

```typescript
import { createExpressTelemetryMiddleware } from 'a2a-sdk';

const telemetry = await createTelemetryWrapper(config);

const app = await server.start('express', {
  preMiddleware: [
    createExpressTelemetryMiddleware(telemetry, {
      attributeExtractor: extractHttpAttributes,
      skipPaths: [/^\/health$/, /^\/metrics$/],
    }),
  ],
});
```

## Database Instrumentation

The A2A SDK automatically instruments database operations when using database-backed task stores:

```typescript
import { instrumentTaskStore } from 'a2a-sdk';

const taskStore = server.getTaskStore();
const instrumentedTaskStore = instrumentTaskStore(taskStore, telemetry, {
  tableName: 'a2a_tasks',
});

// All CRUD operations will be traced
await instrumentedTaskStore.createTask(task);
await instrumentedTaskStore.getTask(id);
await instrumentedTaskStore.updateTask(id, updates);
await instrumentedTaskStore.deleteTask(id);
await instrumentedTaskStore.listTasks(filter);
```

## Manual Instrumentation

### Creating Custom Spans

```typescript
// Trace a custom operation
const span = telemetry.traceServerRequest('GET', '/custom-endpoint');
telemetry.addAttributes(span, {
  'custom.attribute': 'value',
  'custom.counter': 123,
});

try {
  // Your business logic here
  telemetry.setSuccess(span, true);
} catch (error) {
  telemetry.recordException(span, error);
  telemetry.setSuccess(span, false);
  throw error;
} finally {
  span?.end();
}
```

### Tracing Client Operations

```typescript
// Trace client send message
const span = telemetry.traceClientSendMessage(contextId, 'send_message');
try {
  const response = await client.sendMessage(message);
  telemetry.setSuccess(span, true);
  return response;
} catch (error) {
  telemetry.recordException(span, error);
  throw error;
} finally {
  span?.end();
}
```

### Recording Metrics

```typescript
// Record task execution
telemetry.recordTaskExecution(durationMs, 'completed');

// Record active tasks
telemetry.recordActiveTask(1); // Increment
telemetry.recordActiveTask(-1); // Decrement

// Record task error
telemetry.recordTaskError('ValidationError');

// Record database operation
telemetry.recordDbOperation('create', 'a2a_tasks', durationMs, true);

// Record HTTP request
telemetry.recordHttpRequest('GET', '/health', 200, 50);
```

## Spans Created Automatically

### Client Spans
- `a2a.client.send_message` - Message sending operation
- `a2a.client.get_task` - Task retrieval
- `a2a.client.cancel_task` - Task cancellation
- `a2a.client.resubscribe` - Event resubscription

### Server Spans
- `a2a.server.request` - HTTP request handling
- `a2a.server.agent_execution` - Agent execution
- `a2a.server.task_create` - Task creation
- `a2a.server.task_update` - Task status update
- `a2a.server.event_stream` - Event streaming

### Database Spans
- `a2a.db.operation` - Database CRUD operations

## Metrics Collected

### Task Metrics
- `a2a.task.execution.duration` - Task execution time (histogram)
- `a2a.task.count` - Task count by state (counter)
- `a2a.task.errors` - Task execution errors (counter)
- `a2a.task.active` - Active tasks (up/down counter)

### Database Metrics
- `a2a.db.operation.duration` - Database operation time (histogram)
- `a2a.db.errors` - Database errors (counter)

### HTTP Metrics
- `a2a.request.duration` - Request duration (histogram)
- `a2a.request.count` - Request count (counter)

## Span Attributes

### Standard Attributes
- `service.name` - Service name
- `service.version` - Service version
- `telemetry.sdk.name` - SDK name (a2a-sdk)
- `telemetry.sdk.version` - SDK version

### A2A-Specific Attributes
- `a2a.operation` - Operation name
- `a2a.task.id` - Task ID
- `a2a.context.id` - Context ID
- `a2a.agent.name` - Agent name
- `a2a.task.state` - Task state
- `a2a.duration.ms` - Duration in milliseconds
- `a2a.success` - Success status
- `a2a.error.message` - Error message

### HTTP Attributes
- `http.method` - HTTP method
- `http.route` - HTTP route
- `http.status_code` - Status code
- `http.url` - Full URL
- `http.user_agent` - User agent

### Database Attributes
- `db.operation` - Operation type (create, read, update, delete, list)
- `db.table` - Table name
- `db.success` - Operation success status

## Examples

See the `examples/` directory for complete implementations:

- `telemetry-example.ts` - Basic telemetry setup
- `telemetry-postgres-example.ts` - Telemetry with PostgreSQL

## Viewing Telemetry Data

### Jaeger (Tracing)
```bash
# Run Jaeger
docker run -d --name jaeger \
  -p 16686:16686 \
  -p 14268:14268 \
  jaegertracing/all-in-one:latest

# Access UI
open http://localhost:16686
```

### Prometheus (Metrics)
```bash
# Run Prometheus
docker run -d --name prometheus \
  -p 9090:9090 \
  -v $(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus

# Access UI
open http://localhost:9090
```

### Grafana (Visualization)
```bash
# Run Grafana
docker run -d --name grafana \
  -p 3001:3000 \
  -e "GF_SECURITY_ADMIN_PASSWORD=admin" \
  grafana/grafana

# Access UI
open http://localhost:3001
```

## Production Configuration

### High-Volume Applications

```typescript
const telemetryConfig = {
  telemetry: {
    enabled: true,
    serviceName: 'production-a2a-service',
    customAttributes: {
      'deployment.environment': 'production',
      'deployment.region': 'us-east-1',
    },
  },
  metrics: {
    enabled: true,
    enableHistograms: true,
  },
  openTelemetry: {
    serviceName: 'production-a2a-service',
    environment: 'production',
    otlpEndpoint: 'http://otel-collector:4317/v1/traces',
    consoleExporter: false,
    traceSamplingRate: 0.1, // 10% sampling for cost optimization
    enableMetrics: true,
    enableTracing: true,
  },
};
```

### Development Configuration

```typescript
const telemetryConfig = {
  telemetry: {
    enabled: true,
    serviceName: 'dev-a2a-service',
  },
  metrics: {
    enabled: true,
    enableHistograms: true,
  },
  openTelemetry: {
    serviceName: 'dev-a2a-service',
    environment: 'development',
    consoleExporter: true, // Console output for debugging
    traceSamplingRate: 1.0, // 100% sampling for detailed tracing
    enableMetrics: true,
    enableTracing: true,
  },
};
```

## Best Practices

### 1. Sampling Rate
- Use 100% sampling in development
- Use 10% sampling in production for cost optimization
- Use 50% sampling for critical path debugging

### 2. Custom Attributes
- Add business context (user ID, tenant ID)
- Add resource identifiers (task ID, context ID)
- Avoid sensitive data in attributes

### 3. Error Handling
- Always record exceptions on spans
- Use `setSuccess(span, false)` for failures
- Include error type and message

### 4. Performance
- Disable telemetry in unit tests
- Use appropriate sampling rates
- Monitor telemetry overhead

### 5. Security
- Never include passwords or secrets in spans
- Sanitize PII from attributes
- Use OTLP with TLS in production

## Troubleshooting

### No Spans Appearing

**Check configuration:**
```typescript
console.log(telemetry.isEnabled()); // Should be true
console.log(telemetry.getTelemetryProvider().getConfig()); // Check settings
```

**Verify OpenTelemetry initialization:**
```typescript
try {
  await telemetry.initialize();
  console.log('Telemetry initialized successfully');
} catch (error) {
  console.error('Telemetry initialization failed:', error);
}
```

### High Cardinality Metrics

**Problem:** Too many unique attribute values

**Solution:** Limit attribute values or use sampling

```typescript
// Instead of using full URL
span.setAttribute('http.url', req.url); // High cardinality

// Use route pattern
span.setAttribute('http.route', '/users/:id'); // Low cardinality
```

### Performance Impact

**Problem:** Telemetry overhead

**Solutions:**
- Reduce sampling rate
- Disable histograms
- Use sampling for metrics
- Skip health check endpoints

```typescript
createFastifyTelemetryMiddleware(telemetry, {
  skipPaths: [/^\/health$/, /^\/metrics$/, /^\/ping$/],
});
```

## API Reference

### A2ATelemetryWrapper

Main interface for telemetry operations.

#### Methods

- `initialize()` - Initialize telemetry
- `shutdown()` - Shutdown telemetry
- `traceServerRequest()` - Trace HTTP request
- `traceAgentExecution()` - Trace agent execution
- `traceTaskCreate()` - Trace task creation
- `traceTaskUpdate()` - Trace task update
- `traceDbOperation()` - Trace database operation
- `recordTaskExecution()` - Record task metrics
- `recordDbOperation()` - Record database metrics
- `recordHttpRequest()` - Record HTTP metrics
- `recordException()` - Record exception
- `setSuccess()` - Set success status
- `addAttributes()` - Add custom attributes

### instrumentTaskStore()

Wraps database task store with instrumentation.

```typescript
const instrumentedStore = instrumentTaskStore(taskStore, telemetry, {
  tableName: 'a2a_tasks',
});
```

### createExpressMiddleware()

Creates Express middleware for request tracing.

```typescript
app.use(createExpressTelemetryMiddleware(telemetry));
```

### createFastifyMiddleware()

Creates Fastify middleware for request tracing.

```typescript
await server.start('fastify', {
  preHandler: createFastifyTelemetryMiddleware(telemetry),
});
```

## Further Reading

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Distributed Tracing Best Practices](https://opentelemetry.io/docs/concepts/observability-primer/)

## Support

For issues and questions:
- GitHub: https://github.com/a2aproject/a2a-typescript/issues
- Documentation: https://a2a-protocol.org
