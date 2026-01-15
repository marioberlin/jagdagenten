/**
 * Telemetry Wrapper for A2A SDK
 *
 * Provides a unified interface for tracing and metrics collection
 * across all A2A operations including client requests, server operations,
 * database interactions, and task management.
 */

import type { Span } from '@opentelemetry/api';
import { A2ATelemetryProvider } from './telemetry-provider';
import { A2AMetricsCollector } from './metrics-collector';
import type { TelemetryConfig, A2ASpanAttributes } from './telemetry-provider';
import type { MetricsConfig } from './metrics-collector';

export interface TelemetryWrapperConfig {
  /** Telemetry provider configuration */
  telemetry?: TelemetryConfig;

  /** Metrics collector configuration */
  metrics?: MetricsConfig;
}

export class A2ATelemetryWrapper {
  private telemetryProvider: A2ATelemetryProvider;
  private metricsCollector: A2AMetricsCollector;

  constructor(config: TelemetryWrapperConfig = {}) {
    this.telemetryProvider = new A2ATelemetryProvider(config.telemetry);
    this.metricsCollector = new A2AMetricsCollector(config.metrics);
  }

  /**
   * Initialize telemetry and metrics
   */
  async initialize(): Promise<void> {
    await this.telemetryProvider.initialize();
    await this.metricsCollector.initialize();
  }

  /**
   * Shutdown telemetry
   */
  async shutdown(): Promise<void> {
    await Promise.all([
      this.telemetryProvider.shutdown(),
      this.metricsCollector.shutdown(),
    ]);
  }

  // ============================================================================
  // Client-side Tracing
  // ============================================================================

  /**
   * Trace a client send message operation
   */
  traceClientSendMessage(
    contextId: string,
    operation: string,
    parentSpan?: Span
  ): Span | null {
    const attributes: A2ASpanAttributes = {
      'a2a.operation': operation,
      'a2a.context.id': contextId,
    };

    return this.telemetryProvider.createSpan('a2a.client.send_message', attributes, parentSpan);
  }

  /**
   * Trace a client get task operation
   */
  traceClientGetTask(
    taskId: string,
    parentSpan?: Span
  ): Span | null {
    const attributes: A2ASpanAttributes = {
      'a2a.operation': 'get_task',
      'a2a.task.id': taskId,
    };

    return this.telemetryProvider.createSpan('a2a.client.get_task', attributes, parentSpan);
  }

  /**
   * Trace a client cancel task operation
   */
  traceClientCancelTask(
    taskId: string,
    parentSpan?: Span
  ): Span | null {
    const attributes: A2ASpanAttributes = {
      'a2a.operation': 'cancel_task',
      'a2a.task.id': taskId,
    };

    return this.telemetryProvider.createSpan('a2a.client.cancel_task', attributes, parentSpan);
  }

  /**
   * Trace a client resubscribe operation
   */
  traceClientResubscribe(
    taskId: string,
    parentSpan?: Span
  ): Span | null {
    const attributes: A2ASpanAttributes = {
      'a2a.operation': 'resubscribe',
      'a2a.task.id': taskId,
    };

    return this.telemetryProvider.createSpan('a2a.client.resubscribe', attributes, parentSpan);
  }

  // ============================================================================
  // Server-side Tracing
  // ============================================================================

  /**
   * Trace a server request
   */
  traceServerRequest(
    method: string,
    route: string,
    parentSpan?: Span
  ): Span | null {
    const attributes: A2ASpanAttributes = {
      'http.method': method,
      'http.route': route,
      'a2a.operation': 'request',
    };

    return this.telemetryProvider.createSpan('a2a.server.request', attributes, parentSpan);
  }

  /**
   * Trace agent execution
   */
  traceAgentExecution(
    agentName: string,
    contextId: string,
    parentSpan?: Span
  ): Span | null {
    const attributes: A2ASpanAttributes = {
      'a2a.agent.name': agentName,
      'a2a.context.id': contextId,
      'a2a.operation': 'agent_execution',
    };

    return this.telemetryProvider.createSpan('a2a.server.agent_execution', attributes, parentSpan);
  }

  /**
   * Trace task creation
   */
  traceTaskCreate(
    taskId: string,
    contextId: string,
    parentSpan?: Span
  ): Span | null {
    const attributes: A2ASpanAttributes = {
      'a2a.task.id': taskId,
      'a2a.context.id': contextId,
      'a2a.task.state': 'created',
      'a2a.operation': 'task_create',
    };

    return this.telemetryProvider.createSpan('a2a.server.task_create', attributes, parentSpan);
  }

  /**
   * Trace task update
   */
  traceTaskUpdate(
    taskId: string,
    newState: string,
    parentSpan?: Span
  ): Span | null {
    const attributes: A2ASpanAttributes = {
      'a2a.task.id': taskId,
      'a2a.task.state': newState,
      'a2a.operation': 'task_update',
    };

    return this.telemetryProvider.createSpan('a2a.server.task_update', attributes, parentSpan);
  }

  /**
   * Trace event streaming
   */
  traceEventStream(
    taskId: string,
    contextId: string,
    parentSpan?: Span
  ): Span | null {
    const attributes: A2ASpanAttributes = {
      'a2a.task.id': taskId,
      'a2a.context.id': contextId,
      'a2a.operation': 'event_stream',
    };

    return this.telemetryProvider.createSpan('a2a.server.event_stream', attributes, parentSpan);
  }

  // ============================================================================
  // Database Tracing
  // ============================================================================

  /**
   * Trace database operation
   */
  traceDbOperation(
    operation: string,
    table: string,
    parentSpan?: Span
  ): Span | null {
    const attributes: A2ASpanAttributes = {
      'db.operation': operation,
      'db.table': table,
      'a2a.operation': `db_${operation}`,
    };

    return this.telemetryProvider.createSpan('a2a.db.operation', attributes, parentSpan);
  }

  // ============================================================================
  // Metrics Collection
  // ============================================================================

  /**
   * Record task execution
   */
  recordTaskExecution(durationMs: number, state: string): void {
    this.metricsCollector.recordTaskDuration(durationMs, state);
    this.metricsCollector.incrementTaskCount(state, 1);
  }

  /**
   * Record active task count
   */
  recordActiveTask(delta: number): void {
    this.metricsCollector.incrementActiveTasks(delta);
  }

  /**
   * Record task error
   */
  recordTaskError(errorType: string): void {
    this.metricsCollector.recordTaskError(errorType);
    this.metricsCollector.incrementTaskCount('error', 1);
  }

  /**
   * Record database operation
   */
  recordDbOperation(
    operation: string,
    table: string,
    durationMs: number,
    success: boolean
  ): void {
    this.metricsCollector.recordDbOperation(operation, table, durationMs, success);
  }

  /**
   * Record HTTP request
   */
  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    durationMs: number
  ): void {
    this.metricsCollector.recordRequest(method, route, statusCode, durationMs);
  }

  // ============================================================================
  // Span Management
  // ============================================================================

  /**
   * Record exception on span
   */
  recordException(span: Span | null, error: Error): void {
    this.telemetryProvider.recordException(span, error);
  }

  /**
   * Set success status on span
   */
  setSuccess(span: Span | null, success: boolean): void {
    this.telemetryProvider.setSuccess(span, success);
  }

  /**
   * Set task state on span
   */
  setTaskState(span: Span | null, state: string): void {
    this.telemetryProvider.setTaskState(span, state);
  }

  /**
   * Add custom attributes to span
   */
  addAttributes(span: Span | null, attributes: Record<string, string | number | boolean>): void {
    this.telemetryProvider.addAttributes(span, attributes);
  }

  /**
   * Get the underlying telemetry provider
   */
  getTelemetryProvider(): A2ATelemetryProvider {
    return this.telemetryProvider;
  }

  /**
   * Get the underlying metrics collector
   */
  getMetricsCollector(): A2AMetricsCollector {
    return this.metricsCollector;
  }

  /**
   * Check if telemetry is enabled
   */
  isEnabled(): boolean {
    return this.telemetryProvider.getConfig().enabled && this.metricsCollector.getConfig().enabled;
  }
}
