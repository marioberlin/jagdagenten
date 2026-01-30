/**
 * A2A Telemetry Module
 *
 * Provides OpenTelemetry integration specifically for A2A protocol operations.
 * Extends the existing server telemetry with A2A-specific spans and metrics.
 */

import { trace, context, SpanStatusCode, SpanKind, type Span } from '@opentelemetry/api';
import { getTracer, createSpan, withSpan } from '../../telemetry.js';
import type { v1 } from '@jagdagenten/a2a-sdk';
import type { TaskStore, PushNotificationStore } from '../adapter/elysia-adapter.js';

// ============================================================================
// Constants
// ============================================================================

const A2A_TRACER_NAME = 'liquidcrypto-a2a';

// Span names
export const A2A_SPANS = {
  SERVER_REQUEST: 'a2a.server.request',
  AGENT_EXECUTE: 'a2a.agent.execute',
  TASK_STORE_GET: 'a2a.db.task.get',
  TASK_STORE_SET: 'a2a.db.task.set',
  TASK_STORE_DELETE: 'a2a.db.task.delete',
  TASK_STORE_LIST: 'a2a.db.task.list',
  PUSH_NOTIFY: 'a2a.push.notify',
  STREAM_EMIT: 'a2a.stream.emit',
  ARTIFACT_CREATE: 'a2a.artifact.create',
  ARTIFACT_UPDATE: 'a2a.artifact.update',
} as const;

// Metric names
export const A2A_METRICS = {
  TASK_DURATION: 'a2a_task_duration_seconds',
  TASK_COUNT: 'a2a_task_count_total',
  ACTIVE_TASKS: 'a2a_active_tasks',
  DB_OPERATION_DURATION: 'a2a_db_operation_duration_seconds',
  AGENT_EXECUTION_DURATION: 'a2a_agent_execution_duration_seconds',
  STREAMING_EVENTS: 'a2a_streaming_events_total',
  ARTIFACT_COUNT: 'a2a_artifact_count_total',
} as const;

// ============================================================================
// A2A Tracing Functions
// ============================================================================

/**
 * Trace an A2A server request
 */
export async function traceA2ARequest<T>(
  method: string,
  requestId: string | number | null,
  fn: (span: Span) => Promise<T>
): Promise<T> {
  const tracer = getTracer();

  return new Promise((resolve, reject) => {
    const span = tracer.startSpan(A2A_SPANS.SERVER_REQUEST, {
      kind: SpanKind.SERVER,
      attributes: {
        'a2a.method': method,
        'a2a.request_id': String(requestId ?? 'null'),
        'rpc.system': 'jsonrpc',
        'rpc.method': method,
      },
    });

    context.with(trace.setSpan(context.active(), span), async () => {
      try {
        const result = await fn(span);
        span.setStatus({ code: SpanStatusCode.OK });
        span.end();
        resolve(result);
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: (error as Error).message,
        });
        span.recordException(error as Error);
        span.end();
        reject(error);
      }
    });
  });
}

/**
 * Trace agent execution
 */
export async function traceAgentExecution<T>(
  taskId: string,
  contextId: string,
  fn: (span: Span) => Promise<T>
): Promise<T> {
  return withSpan(
    A2A_SPANS.AGENT_EXECUTE,
    async (span) => {
      span.setAttribute('a2a.task_id', taskId);
      span.setAttribute('a2a.context_id', contextId);

      const startTime = Date.now();
      const result = await fn(span);
      const duration = Date.now() - startTime;

      span.setAttribute('a2a.execution_duration_ms', duration);

      return result;
    },
    {
      kind: SpanKind.INTERNAL,
      attributes: {
        'a2a.task_id': taskId,
      },
    }
  );
}

/**
 * Trace a task store operation
 */
export async function traceTaskStoreOperation<T>(
  operation: 'get' | 'set' | 'delete' | 'list' | 'listByContext',
  taskId: string | null,
  fn: () => Promise<T>
): Promise<T> {
  const spanName = operation === 'list' || operation === 'listByContext'
    ? A2A_SPANS.TASK_STORE_LIST
    : operation === 'get'
    ? A2A_SPANS.TASK_STORE_GET
    : operation === 'set'
    ? A2A_SPANS.TASK_STORE_SET
    : A2A_SPANS.TASK_STORE_DELETE;

  return withSpan(
    spanName,
    async (span) => {
      span.setAttribute('a2a.db.operation', operation);
      if (taskId) {
        span.setAttribute('a2a.task_id', taskId);
      }

      const startTime = Date.now();
      const result = await fn();
      const duration = Date.now() - startTime;

      span.setAttribute('a2a.db.duration_ms', duration);
      span.setAttribute('db.system', 'postgresql');
      span.setAttribute('db.operation', operation);

      return result;
    },
    {
      kind: SpanKind.CLIENT,
      attributes: {
        'db.system': 'postgresql',
      },
    }
  );
}

/**
 * Trace streaming event emission
 */
export function traceStreamEvent(
  taskId: string,
  eventType: 'status_update' | 'artifact_update',
  isFinal: boolean
): void {
  const span = createSpan(A2A_SPANS.STREAM_EMIT, {
    kind: SpanKind.PRODUCER,
    attributes: {
      'a2a.task_id': taskId,
      'a2a.stream.event_type': eventType,
      'a2a.stream.is_final': isFinal,
    },
  });

  span.setStatus({ code: SpanStatusCode.OK });
  span.end();
}

/**
 * Trace artifact operations
 */
export async function traceArtifactOperation<T>(
  operation: 'create' | 'update' | 'delete' | 'stream',
  artifactId: string,
  taskId: string,
  fn: () => Promise<T>
): Promise<T> {
  const spanName = operation === 'create' || operation === 'stream'
    ? A2A_SPANS.ARTIFACT_CREATE
    : A2A_SPANS.ARTIFACT_UPDATE;

  return withSpan(
    spanName,
    async (span) => {
      span.setAttribute('a2a.artifact.operation', operation);
      span.setAttribute('a2a.artifact_id', artifactId);
      span.setAttribute('a2a.task_id', taskId);

      const startTime = Date.now();
      const result = await fn();
      const duration = Date.now() - startTime;

      span.setAttribute('a2a.artifact.duration_ms', duration);

      return result;
    },
    {
      kind: SpanKind.INTERNAL,
    }
  );
}

// ============================================================================
// Instrumented Stores
// ============================================================================

/**
 * Wrap a TaskStore with telemetry
 */
export function instrumentTaskStore(store: TaskStore): TaskStore {
  return {
    async get(taskId: string) {
      return traceTaskStoreOperation('get', taskId, () => store.get(taskId));
    },

    async set(task: v1.Task) {
      return traceTaskStoreOperation('set', task.id, () => store.set(task));
    },

    async delete(taskId: string) {
      return traceTaskStoreOperation('delete', taskId, () => store.delete(taskId));
    },

    async listByContext(contextId: string) {
      return traceTaskStoreOperation('listByContext', null, () => store.listByContext(contextId));
    },
  };
}

/**
 * Wrap a PushNotificationStore with telemetry
 */
export function instrumentPushNotificationStore(store: PushNotificationStore): PushNotificationStore {
  return {
    async get(taskId: string) {
      return traceTaskStoreOperation('get', taskId, () => store.get(taskId));
    },

    async set(taskId: string, config: v1.PushNotificationConfig) {
      return traceTaskStoreOperation('set', taskId, () => store.set(taskId, config));
    },

    async delete(taskId: string) {
      return traceTaskStoreOperation('delete', taskId, () => store.delete(taskId));
    },
  };
}

// ============================================================================
// Elysia Middleware
// ============================================================================

/**
 * A2A telemetry middleware for Elysia
 */
export function createA2ATelemetryMiddleware() {
  const tracer = trace.getTracer(A2A_TRACER_NAME);

  return {
    /**
     * Start a span for an incoming A2A request
     */
    onRequest(method: string, requestId: string | number | null): Span {
      return tracer.startSpan(A2A_SPANS.SERVER_REQUEST, {
        kind: SpanKind.SERVER,
        attributes: {
          'a2a.method': method,
          'a2a.request_id': String(requestId ?? 'null'),
          'rpc.system': 'jsonrpc',
          'rpc.method': method,
        },
      });
    },

    /**
     * End a span with success
     */
    onSuccess(span: Span, taskId?: string, taskState?: string): void {
      if (taskId) {
        span.setAttribute('a2a.task_id', taskId);
      }
      if (taskState) {
        span.setAttribute('a2a.task_state', taskState);
      }
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
    },

    /**
     * End a span with error
     */
    onError(span: Span, error: Error, errorCode?: number): void {
      span.setAttribute('a2a.error_code', errorCode ?? -32603);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      span.recordException(error);
      span.end();
    },
  };
}

// ============================================================================
// Exports
// ============================================================================

export default {
  // Tracing functions
  traceA2ARequest,
  traceAgentExecution,
  traceTaskStoreOperation,
  traceStreamEvent,
  traceArtifactOperation,

  // Store instrumentation
  instrumentTaskStore,
  instrumentPushNotificationStore,

  // Middleware
  createA2ATelemetryMiddleware,

  // Constants
  A2A_SPANS,
  A2A_METRICS,
};
