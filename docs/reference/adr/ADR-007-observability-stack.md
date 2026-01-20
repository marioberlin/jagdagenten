# ADR-007: Observability Stack (Pino + OpenTelemetry)

## Status
**Proposed** - January 2026

## Context

Current observability in LiquidCrypto is limited:

```typescript
// Current logging: unstructured console output
console.log('[Redis] Connected successfully');
console.error('[WebSocket] Invalid message');
```

Problems with current approach:

1. **No Log Aggregation**: Can't search/filter logs in production
2. **No Correlation**: Can't trace a request across components
3. **No Metrics**: No visibility into performance over time
4. **No Alerting**: Can't detect anomalies automatically
5. **Mixed Levels**: Debug logs appear in production

For production readiness, we need:
- Structured logging for log aggregation (ELK, Datadog, etc.)
- Distributed tracing for request flow visibility
- Metrics for dashboards and alerting
- Request correlation across services

## Decision

Implement a two-layer observability stack:

### Layer 1: Structured Logging with Pino

```typescript
import pino from 'pino';

export const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    base: {
        service: 'liquid-glass-server',
        version: process.env.npm_package_version
    }
});

// Usage
logger.info({ component: 'redis', duration: 15 }, 'Connected successfully');
```

**Why Pino:**
- Fastest JSON logger for Node.js
- Native Bun support
- Low overhead (~10% of winston)
- Simple API with child loggers

### Layer 2: Distributed Tracing with OpenTelemetry

```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { trace, SpanStatusCode } from '@opentelemetry/api';

const sdk = new NodeSDK({
    resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'liquid-glass-server'
    }),
    traceExporter: new OTLPTraceExporter(),
    metricReader: new OTLPMetricExporter()
});

// Usage
const tracer = trace.getTracer('liquid-server');

async function callAI(provider: string, messages: Message[]) {
    const span = tracer.startSpan('ai.call', {
        attributes: {
            'ai.provider': provider,
            'ai.message_count': messages.length
        }
    });

    try {
        const result = await actualCallAI(provider, messages);
        span.setAttribute('ai.cached', result.cached);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
    } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        throw error;
    } finally {
        span.end();
    }
}
```

**Why OpenTelemetry:**
- Vendor-neutral standard
- Works with any backend (Jaeger, Honeycomb, Datadog, etc.)
- Auto-instrumentation for HTTP, Redis, etc.
- Unified API for traces and metrics

### Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Code                         │
│                                                              │
│   logger.info()  ──►  Pino  ──►  stdout/file                │
│                                      │                       │
│   tracer.startSpan()  ──►  OTEL SDK  ──►  OTLP Exporter     │
│                                              │               │
└──────────────────────────────────────────────┼───────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Observability Backend                     │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Grafana   │  │   Jaeger    │  │   Elasticsearch     │ │
│  │  Dashboards │  │   Traces    │  │   Logs (via Loki)   │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Consequences

### Positive

1. **Debuggability**: Trace any request end-to-end
2. **Alerting**: Set up alerts on error rates, latency p99
3. **Optimization**: Identify slow components via trace analysis
4. **Compliance**: Audit logs for security review
5. **Vendor Choice**: OpenTelemetry works with any backend

### Negative

1. **Overhead**: ~2-5% performance impact for tracing
2. **Complexity**: More infrastructure to manage
3. **Cost**: Backend services (Jaeger, Grafana, etc.)
4. **Learning Curve**: Team needs to learn new tools

### Mitigations

- **Overhead**: Sampling in production (e.g., 10% of requests)
- **Complexity**: Use managed services (Grafana Cloud, Honeycomb)
- **Cost**: Open-source stack for staging, paid for production
- **Learning**: Document common queries and dashboards

## Alternatives Considered

### 1. Winston Logger Only

Use winston for logging, no tracing.

```typescript
import winston from 'winston';
const logger = winston.createLogger({ level: 'info' });
```

**Rejected**: No distributed tracing, winston is slower than Pino.

### 2. Datadog APM (All-in-One)

Use Datadog for logs, traces, and metrics.

**Rejected**: Vendor lock-in, expensive at scale. OpenTelemetry provides flexibility.

### 3. Console.log + Timestamps

Add timestamps and JSON formatting to console.log.

**Rejected**: No correlation IDs, no trace context, limited querying.

### 4. Bunyan Logger

Alternative to Pino with similar features.

**Rejected**: Pino is faster and more actively maintained.

## Implementation Notes

### Log Schema

```typescript
interface LogEntry {
    level: number;           // Pino level (10-60)
    time: number;            // Unix timestamp ms
    service: string;         // "liquid-glass-server"
    version: string;         // Package version
    requestId?: string;      // Correlation ID
    userId?: string;         // Authenticated user
    traceId?: string;        // OpenTelemetry trace ID
    spanId?: string;         // OpenTelemetry span ID
    component: string;       // "ai", "cache", "ws", "http"
    msg: string;             // Human-readable message
    [key: string]: unknown;  // Additional context
}
```

### Trace Context Propagation

```typescript
// Elysia middleware to extract/inject trace context
app.derive(({ request }) => {
    const traceContext = propagator.extract(request.headers);
    const requestId = request.headers.get('X-Request-ID') || crypto.randomUUID();

    return {
        requestId,
        traceContext,
        logger: createRequestLogger(requestId)
    };
});
```

### Span Naming Convention

| Operation | Span Name | Attributes |
|-----------|-----------|------------|
| HTTP Request | `http.request` | method, path, status |
| AI Call | `ai.call` | provider, cached, duration |
| Cache Get | `cache.get` | hit, key_prefix |
| Cache Set | `cache.set` | ttl, key_prefix |
| Redis Command | `redis.command` | command, key_prefix |
| WebSocket Message | `ws.message` | type, clientId |

### Metrics to Export

| Metric | Type | Labels |
|--------|------|--------|
| `http_request_duration_seconds` | Histogram | method, path, status |
| `ai_call_duration_seconds` | Histogram | provider, cached |
| `cache_hit_total` | Counter | type (ai, price, etc.) |
| `cache_miss_total` | Counter | type |
| `ws_connections_active` | Gauge | - |
| `ws_messages_total` | Counter | type |

### Configuration

```bash
# Logging
LOG_LEVEL=info              # trace, debug, info, warn, error, fatal
LOG_PRETTY=false            # Enable pino-pretty in development

# OpenTelemetry
OTEL_ENABLED=true
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_SERVICE_NAME=liquid-glass-server
OTEL_SAMPLING_RATE=1.0      # 0.0-1.0, use 0.1 for production
```

### Local Development Stack

```yaml
# docker-compose.observability.yml
services:
  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"  # UI
      - "4318:4318"    # OTLP HTTP

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3030:3000"
    volumes:
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards

  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
```

## Rollout Plan

1. **Phase 1**: Add Pino, replace console.log (no external dependencies)
2. **Phase 2**: Add OpenTelemetry SDK (disabled by default)
3. **Phase 3**: Enable tracing in staging, validate
4. **Phase 4**: Enable tracing in production with sampling

## Related Decisions

- ADR-001: 3-Layer Architecture (logging in Layer 3)
- ADR-004: Server-Side Proxy (logging AI calls)

## References

- Pino: https://getpino.io/
- OpenTelemetry JS: https://opentelemetry.io/docs/instrumentation/js/
- OTEL Semantic Conventions: https://opentelemetry.io/docs/specs/semconv/
- Grafana Loki: https://grafana.com/oss/loki/
