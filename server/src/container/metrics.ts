/**
 * Container Pool Metrics & Tracing
 *
 * OpenTelemetry integration for container pool observability.
 *
 * @see docs/LIQUID_CONTAINER_ARCHITECTURE.md - Section 8
 */

import {
    metrics,
    trace,
    SpanKind,
    SpanStatusCode,
    type Span,
    type Counter,
    type Histogram,
    type ObservableGauge,
} from '@opentelemetry/api';
import type { ContainerPool } from './pool.js';
import type { ContainerScheduler } from './scheduler.js';
import type { PoolEvent, PooledContainer } from './types.js';

// ============================================================================
// Meter & Tracer
// ============================================================================

const meter = metrics.getMeter('liquid-container', '1.0.0');
const tracer = trace.getTracer('liquid-container', '1.0.0');

// ============================================================================
// Metrics Definitions
// ============================================================================

export interface ContainerMetrics {
    // Pool gauges
    poolIdleSize: ObservableGauge;
    poolAcquiredSize: ObservableGauge;
    poolTotalSize: ObservableGauge;

    // Container lifecycle counters
    containerCreations: Counter;
    containerDestructions: Counter;
    containerAcquisitions: Counter;
    containerReleases: Counter;

    // Error counters
    containerErrors: Counter;
    healthCheckFailures: Counter;
    poolExhaustedEvents: Counter;

    // Latency histograms
    acquireLatency: Histogram;
    createLatency: Histogram;
    executionDuration: Histogram;
    healthCheckDuration: Histogram;

    // Endpoint metrics
    endpointActiveContainers: ObservableGauge;
    endpointRequestLatency: Histogram;
}

let metricsInstance: ContainerMetrics | null = null;

/**
 * Initialize container metrics
 */
export function initializeMetrics(): ContainerMetrics {
    if (metricsInstance) {
        return metricsInstance;
    }

    metricsInstance = {
        // Pool gauges (values set via callbacks)
        poolIdleSize: meter.createObservableGauge('liquid.container.pool.idle', {
            description: 'Number of idle containers in pool',
            unit: 'containers',
        }),

        poolAcquiredSize: meter.createObservableGauge('liquid.container.pool.acquired', {
            description: 'Number of acquired containers',
            unit: 'containers',
        }),

        poolTotalSize: meter.createObservableGauge('liquid.container.pool.total', {
            description: 'Total containers in pool',
            unit: 'containers',
        }),

        // Lifecycle counters
        containerCreations: meter.createCounter('liquid.container.creations.total', {
            description: 'Total containers created',
        }),

        containerDestructions: meter.createCounter('liquid.container.destructions.total', {
            description: 'Total containers destroyed',
        }),

        containerAcquisitions: meter.createCounter('liquid.container.acquisitions.total', {
            description: 'Total container acquisitions',
        }),

        containerReleases: meter.createCounter('liquid.container.releases.total', {
            description: 'Total container releases',
        }),

        // Error counters
        containerErrors: meter.createCounter('liquid.container.errors.total', {
            description: 'Total container errors',
        }),

        healthCheckFailures: meter.createCounter('liquid.container.health.failures.total', {
            description: 'Total health check failures',
        }),

        poolExhaustedEvents: meter.createCounter('liquid.container.pool.exhausted.total', {
            description: 'Times pool was exhausted',
        }),

        // Latency histograms
        acquireLatency: meter.createHistogram('liquid.container.acquire.duration', {
            description: 'Container acquisition latency',
            unit: 'ms',
        }),

        createLatency: meter.createHistogram('liquid.container.create.duration', {
            description: 'Container creation latency',
            unit: 'ms',
        }),

        executionDuration: meter.createHistogram('liquid.container.execution.duration', {
            description: 'Command execution duration',
            unit: 'ms',
        }),

        healthCheckDuration: meter.createHistogram('liquid.container.health.duration', {
            description: 'Health check duration',
            unit: 'ms',
        }),

        // Endpoint metrics
        endpointActiveContainers: meter.createObservableGauge('liquid.container.endpoint.active', {
            description: 'Active containers per endpoint',
            unit: 'containers',
        }),

        endpointRequestLatency: meter.createHistogram('liquid.container.endpoint.latency', {
            description: 'Request latency per endpoint',
            unit: 'ms',
        }),
    };

    return metricsInstance;
}

/**
 * Get metrics instance (must be initialized first)
 */
export function getMetrics(): ContainerMetrics {
    if (!metricsInstance) {
        return initializeMetrics();
    }
    return metricsInstance;
}

// ============================================================================
// Pool Metrics Registration
// ============================================================================

/**
 * Register pool metrics callbacks
 */
export function registerPoolMetrics(pool: ContainerPool): void {
    const m = getMetrics();

    // Register observable callbacks
    m.poolIdleSize.addCallback((result) => {
        const status = pool.getStatus();
        result.observe(status.idle);
    });

    m.poolAcquiredSize.addCallback((result) => {
        const status = pool.getStatus();
        result.observe(status.acquired);
    });

    m.poolTotalSize.addCallback((result) => {
        const status = pool.getStatus();
        result.observe(status.total);
    });

    // Subscribe to pool events
    pool.onEvent((event) => {
        recordPoolEvent(event);
    });
}

/**
 * Register scheduler metrics callbacks
 */
export function registerSchedulerMetrics(scheduler: ContainerScheduler): void {
    const m = getMetrics();

    m.endpointActiveContainers.addCallback((result) => {
        const states = scheduler.getEndpointStates();
        for (const [endpointId, state] of states) {
            result.observe(state.activeContainers, { endpoint: endpointId });
        }
    });
}

/**
 * Record a pool event
 */
function recordPoolEvent(event: PoolEvent): void {
    const m = getMetrics();

    switch (event.type) {
        case 'container_created':
            m.containerCreations.add(1, { endpoint: event.endpointId });
            break;

        case 'container_acquired':
            m.containerAcquisitions.add(1, {
                from_pool: String(event.fromPool),
                agent: event.agentId ?? 'unknown',
            });
            break;

        case 'container_released':
            m.containerReleases.add(1, { recycled: String(event.recycled) });
            break;

        case 'container_destroyed':
            m.containerDestructions.add(1, { reason: event.reason });
            break;

        case 'container_error':
            m.containerErrors.add(1, { container: event.containerId });
            break;

        case 'health_check_failed':
            m.healthCheckFailures.add(1, { container: event.containerId });
            break;

        case 'pool_exhausted':
            m.poolExhaustedEvents.add(1);
            break;
    }
}

// ============================================================================
// Tracing Helpers
// ============================================================================

/**
 * Create a span for container acquisition
 */
export function traceAcquire<T>(
    fn: (span: Span) => Promise<T>,
    attributes?: Record<string, string>
): Promise<T> {
    return tracer.startActiveSpan(
        'container.acquire',
        { kind: SpanKind.INTERNAL },
        async (span) => {
            if (attributes) {
                span.setAttributes(attributes);
            }

            const startTime = Date.now();

            try {
                const result = await fn(span);
                span.setStatus({ code: SpanStatusCode.OK });

                getMetrics().acquireLatency.record(Date.now() - startTime, attributes);

                return result;
            } catch (error) {
                span.setStatus({
                    code: SpanStatusCode.ERROR,
                    message: (error as Error).message,
                });
                span.recordException(error as Error);
                throw error;
            } finally {
                span.end();
            }
        }
    );
}

/**
 * Create a span for container creation
 */
export function traceCreate<T>(
    endpointId: string,
    fn: (span: Span) => Promise<T>
): Promise<T> {
    return tracer.startActiveSpan(
        'container.create',
        { kind: SpanKind.INTERNAL },
        async (span) => {
            span.setAttribute('endpoint', endpointId);

            const startTime = Date.now();

            try {
                const result = await fn(span);
                span.setStatus({ code: SpanStatusCode.OK });

                getMetrics().createLatency.record(Date.now() - startTime, {
                    endpoint: endpointId,
                });

                return result;
            } catch (error) {
                span.setStatus({
                    code: SpanStatusCode.ERROR,
                    message: (error as Error).message,
                });
                span.recordException(error as Error);
                throw error;
            } finally {
                span.end();
            }
        }
    );
}

/**
 * Create a span for command execution
 */
export function traceExecution<T>(
    container: PooledContainer,
    command: string,
    fn: (span: Span) => Promise<T>
): Promise<T> {
    return tracer.startActiveSpan(
        'container.execute',
        { kind: SpanKind.INTERNAL },
        async (span) => {
            span.setAttributes({
                'container.id': container.shortId,
                'container.endpoint': container.endpointId,
                'container.agent': container.agentId ?? 'unknown',
                'command': command,
            });

            const startTime = Date.now();

            try {
                const result = await fn(span);
                span.setStatus({ code: SpanStatusCode.OK });

                getMetrics().executionDuration.record(Date.now() - startTime, {
                    container: container.shortId,
                    endpoint: container.endpointId,
                });

                return result;
            } catch (error) {
                span.setStatus({
                    code: SpanStatusCode.ERROR,
                    message: (error as Error).message,
                });
                span.recordException(error as Error);
                throw error;
            } finally {
                span.end();
            }
        }
    );
}

/**
 * Create a span for health check
 */
export function traceHealthCheck<T>(
    containerId: string,
    fn: (span: Span) => Promise<T>
): Promise<T> {
    return tracer.startActiveSpan(
        'container.health_check',
        { kind: SpanKind.INTERNAL },
        async (span) => {
            span.setAttribute('container.id', containerId);

            const startTime = Date.now();

            try {
                const result = await fn(span);
                span.setStatus({ code: SpanStatusCode.OK });

                getMetrics().healthCheckDuration.record(Date.now() - startTime, {
                    container: containerId,
                });

                return result;
            } catch (error) {
                span.setStatus({
                    code: SpanStatusCode.ERROR,
                    message: (error as Error).message,
                });
                throw error;
            } finally {
                span.end();
            }
        }
    );
}

// ============================================================================
// Utility
// ============================================================================

/**
 * Record endpoint latency
 */
export function recordEndpointLatency(endpointId: string, latencyMs: number): void {
    getMetrics().endpointRequestLatency.record(latencyMs, { endpoint: endpointId });
}
