/**
 * Telemetry Provider for A2A SDK
 *
 * Provides tracing and metrics instrumentation for A2A protocol operations.
 * Supports OpenTelemetry for distributed tracing and metrics collection.
 */

import type { Span, Tracer } from '@opentelemetry/api';

export interface TelemetryConfig {
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

export interface A2ASpanAttributes {
  /** Operation name */
  'a2a.operation'?: string;

  /** Task ID */
  'a2a.task.id'?: string;

  /** Context ID */
  'a2a.context.id'?: string;

  /** Agent name */
  'a2a.agent.name'?: string;

  /** Task state */
  'a2a.task.state'?: string;

  /** Duration in milliseconds */
  'a2a.duration.ms'?: number;

  /** Success status */
  'a2a.success'?: boolean;

  /** Error message */
  'a2a.error.message'?: string;

  /** Database operation */
  'db.operation'?: string;

  /** Database table */
  'db.table'?: string;

  /** HTTP method */
  'http.method'?: string;

  /** HTTP route */
  'http.route'?: string;

  /** Network protocol */
  'net.protocol.name'?: string;

  /** Network protocol version */
  'net.protocol.version'?: string;
}

export class A2ATelemetryProvider {
  private tracer: Tracer | null = null;
  private config: Required<TelemetryConfig>;

  constructor(config: TelemetryConfig = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      serviceName: config.serviceName ?? 'a2a-sdk',
      serviceVersion: config.serviceVersion ?? '1.0.0',
      collectorEndpoint: config.collectorEndpoint ?? '',
      enableMetrics: config.enableMetrics ?? true,
      enableTracing: config.enableTracing ?? true,
      enableDbSpans: config.enableDbSpans ?? true,
      customAttributes: config.customAttributes ?? {},
    };
  }

  /**
   * Initialize the telemetry provider
   */
  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      const api = await import('@opentelemetry/api');
      this.tracer = api.trace.getTracer(
        this.config.serviceName,
        this.config.serviceVersion
      );
    } catch (error) {
      console.warn('OpenTelemetry not available, telemetry disabled:', error);
      this.config.enabled = false;
    }
  }

  /**
   * Get the tracer instance
   */
  getTracer(): Tracer | null {
    return this.config.enabled ? this.tracer : null;
  }

  /**
   * Create a span for an A2A operation
   */
  createSpan(
    operationName: string,
    attributes: A2ASpanAttributes = {},
    _parentSpan?: Span
  ): Span | null {
    if (!this.config.enabled || !this.tracer) {
      return null;
    }

    const span = this.tracer.startSpan(operationName, {
      attributes: {
        ...this.config.customAttributes,
        ...attributes,
        'service.name': this.config.serviceName,
        'service.version': this.config.serviceVersion,
        'telemetry.sdk.name': 'a2a-sdk',
        'telemetry.sdk.version': this.config.serviceVersion,
      },
    });

    return span;
  }

  /**
   * Record an exception
   */
  recordException(span: Span | null, error: Error): void {
    if (span && this.config.enabled) {
      span.recordException(error);
      span.setAttribute('a2a.error', true);
      span.setAttribute('a2a.error.message', error.message);
    }
  }

  /**
   * Set success status on a span
   */
  setSuccess(span: Span | null, success: boolean): void {
    if (span && this.config.enabled) {
      span.setAttribute('a2a.success', success);
    }
  }

  /**
   * Set task state on a span
   */
  setTaskState(span: Span | null, state: string): void {
    if (span && this.config.enabled) {
      span.setAttribute('a2a.task.state', state);
    }
  }

  /**
   * Add custom attributes to a span
   */
  addAttributes(span: Span | null, attributes: Record<string, string | number | boolean>): void {
    if (span && this.config.enabled) {
      span.setAttributes(attributes);
    }
  }

  /**
   * Shutdown the telemetry provider
   */
  async shutdown(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      const api = await import('@opentelemetry/api');
      const provider = api.trace.getTracerProvider() as any;
      if (provider && typeof provider.shutdown === 'function') {
        await provider.shutdown();
      }
    } catch (error) {
      console.warn('Error shutting down telemetry:', error);
    }
  }

  /**
   * Get configuration
   */
  getConfig(): Required<TelemetryConfig> {
    return this.config;
  }
}
