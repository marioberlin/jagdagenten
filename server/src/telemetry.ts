/**
 * OpenTelemetry Integration - Distributed Tracing & Metrics
 *
 * Provides observability for the LiquidCrypto server with:
 * - Distributed tracing for request flows
 * - Metrics for performance monitoring
 * - Context propagation for correlation
 *
 * @see docs/IMPLEMENTATION_PLAN.md - Item 3.2 OpenTelemetry Integration
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import {
    SEMRESATTRS_SERVICE_NAME as ATTR_SERVICE_NAME,
    SEMRESATTRS_SERVICE_VERSION as ATTR_SERVICE_VERSION
} from '@opentelemetry/semantic-conventions';
import {
    trace,
    context,
    SpanStatusCode,
    SpanKind,
    type Tracer,
    type Span,
    type Context
} from '@opentelemetry/api';
import { componentLoggers } from './logger.js';

const telemetryLog = componentLoggers.http;

// Configuration
const OTEL_ENABLED = process.env.OTEL_ENABLED === 'true';
const OTEL_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces';
const SERVICE_NAME = 'liquid-glass-server';
const SERVICE_VERSION = process.env.npm_package_version || '0.1.0';

let sdk: NodeSDK | null = null;
let tracer: Tracer | null = null;

/**
 * Initialize OpenTelemetry SDK
 * Only initializes if OTEL_ENABLED=true in environment
 */
export async function initTelemetry(): Promise<boolean> {
    if (!OTEL_ENABLED) {
        telemetryLog.info('OpenTelemetry disabled (set OTEL_ENABLED=true to enable)');
        return false;
    }

    try {
        sdk = new NodeSDK({
            resource: new Resource({
                [ATTR_SERVICE_NAME]: SERVICE_NAME,
                [ATTR_SERVICE_VERSION]: SERVICE_VERSION,
                'deployment.environment': process.env.NODE_ENV || 'development'
            }),
            traceExporter: new OTLPTraceExporter({
                url: OTEL_ENDPOINT
            })
        });

        sdk.start();

        // Get the tracer
        tracer = trace.getTracer(SERVICE_NAME, SERVICE_VERSION);

        // Handle graceful shutdown
        process.on('SIGTERM', () => {
            sdk?.shutdown()
                .then(() => telemetryLog.info('OpenTelemetry shutdown complete'))
                .catch((err) => telemetryLog.error({ error: err.message }, 'OpenTelemetry shutdown error'));
        });

        telemetryLog.info({ endpoint: OTEL_ENDPOINT }, 'OpenTelemetry initialized');
        return true;
    } catch (err) {
        telemetryLog.error({ error: (err as Error).message }, 'Failed to initialize OpenTelemetry');
        return false;
    }
}

/**
 * Get the tracer instance
 * Returns a no-op tracer if telemetry is not enabled
 */
export function getTracer(): Tracer {
    if (!tracer) {
        // Return the global tracer which acts as no-op if SDK not initialized
        return trace.getTracer(SERVICE_NAME);
    }
    return tracer;
}

/**
 * Create a span for tracing an operation
 */
export function createSpan(
    name: string,
    options?: {
        kind?: SpanKind;
        attributes?: Record<string, string | number | boolean>;
        parentContext?: Context;
    }
): Span {
    const t = getTracer();
    const ctx = options?.parentContext || context.active();

    return t.startSpan(
        name,
        {
            kind: options?.kind || SpanKind.INTERNAL,
            attributes: options?.attributes
        },
        ctx
    );
}

/**
 * Execute a function within a traced span
 */
export async function withSpan<T>(
    name: string,
    fn: (span: Span) => Promise<T>,
    options?: {
        kind?: SpanKind;
        attributes?: Record<string, string | number | boolean>;
    }
): Promise<T> {
    const span = createSpan(name, options);

    try {
        const result = await context.with(trace.setSpan(context.active(), span), () => fn(span));
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
    } catch (error) {
        span.setStatus({
            code: SpanStatusCode.ERROR,
            message: (error as Error).message
        });
        span.recordException(error as Error);
        throw error;
    } finally {
        span.end();
    }
}

/**
 * Trace an AI API call
 */
export async function traceAICall<T>(
    provider: 'gemini' | 'claude',
    promptLength: number,
    fn: () => Promise<T>
): Promise<T> {
    return withSpan(
        `ai.${provider}.call`,
        async (span) => {
            span.setAttribute('ai.provider', provider);
            span.setAttribute('ai.prompt_length', promptLength);

            const startTime = Date.now();
            const result = await fn();
            const duration = Date.now() - startTime;

            span.setAttribute('ai.duration_ms', duration);
            span.setAttribute('ai.success', true);

            return result;
        },
        {
            kind: SpanKind.CLIENT,
            attributes: {
                'ai.provider': provider
            }
        }
    );
}

/**
 * Trace a cache operation
 */
export async function traceCacheOperation<T>(
    operation: 'get' | 'set' | 'del',
    key: string,
    fn: () => Promise<T>
): Promise<T> {
    return withSpan(
        `cache.${operation}`,
        async (span) => {
            // Mask sensitive parts of the key
            const safeKey = key.replace(/ai:(gemini|claude):([a-f0-9]+)/g, 'ai:$1:*****');
            span.setAttribute('cache.operation', operation);
            span.setAttribute('cache.key', safeKey);

            const result = await fn();

            // Add hit/miss status for get operations
            if (operation === 'get') {
                span.setAttribute('cache.hit', result !== null && result !== undefined);
            }

            return result;
        },
        {
            kind: SpanKind.CLIENT,
            attributes: {
                'db.system': 'redis'
            }
        }
    );
}

/**
 * Trace an HTTP request handler
 */
export async function traceRequest<T>(
    method: string,
    path: string,
    fn: () => Promise<T>
): Promise<T> {
    return withSpan(
        `http.${method.toLowerCase()} ${path}`,
        async (span) => {
            span.setAttribute('http.method', method);
            span.setAttribute('http.route', path);

            const result = await fn();

            span.setAttribute('http.status_code', 200);

            return result;
        },
        {
            kind: SpanKind.SERVER,
            attributes: {
                'http.method': method,
                'http.route': path
            }
        }
    );
}

/**
 * Trace a WebSocket event
 */
export function traceWebSocketEvent(
    event: 'connect' | 'disconnect' | 'message' | 'broadcast',
    clientId: string,
    fn?: () => void
): void {
    const span = createSpan(`ws.${event}`, {
        kind: SpanKind.SERVER,
        attributes: {
            'ws.event': event,
            'ws.client_id': clientId
        }
    });

    try {
        fn?.();
        span.setStatus({ code: SpanStatusCode.OK });
    } catch (error) {
        span.setStatus({
            code: SpanStatusCode.ERROR,
            message: (error as Error).message
        });
        span.recordException(error as Error);
        throw error;
    } finally {
        span.end();
    }
}

/**
 * Add attributes to the current span
 */
export function addSpanAttributes(attributes: Record<string, string | number | boolean>): void {
    const span = trace.getActiveSpan();
    if (span) {
        for (const [key, value] of Object.entries(attributes)) {
            span.setAttribute(key, value);
        }
    }
}

/**
 * Record an error on the current span
 */
export function recordSpanError(error: Error): void {
    const span = trace.getActiveSpan();
    if (span) {
        span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error.message
        });
        span.recordException(error);
    }
}

/**
 * Check if telemetry is enabled
 */
export function isTelemetryEnabled(): boolean {
    return OTEL_ENABLED && sdk !== null;
}

/**
 * Get telemetry status for health checks
 */
export function getTelemetryStatus(): {
    enabled: boolean;
    endpoint: string;
    serviceName: string;
    serviceVersion: string;
} {
    return {
        enabled: isTelemetryEnabled(),
        endpoint: OTEL_ENDPOINT,
        serviceName: SERVICE_NAME,
        serviceVersion: SERVICE_VERSION
    };
}

/**
 * Shutdown telemetry gracefully
 */
export async function shutdownTelemetry(): Promise<void> {
    if (sdk) {
        await sdk.shutdown();
        sdk = null;
        tracer = null;
        telemetryLog.info('OpenTelemetry shutdown complete');
    }
}

export default {
    initTelemetry,
    getTracer,
    createSpan,
    withSpan,
    traceAICall,
    traceCacheOperation,
    traceRequest,
    traceWebSocketEvent,
    addSpanAttributes,
    recordSpanError,
    isTelemetryEnabled,
    getTelemetryStatus,
    shutdownTelemetry
};
