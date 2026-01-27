/**
 * A2A Video Tracing
 *
 * OpenTelemetry-compatible distributed tracing.
 */

export interface SpanContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  sampled: boolean;
}

export interface SpanAttributes {
  [key: string]: string | number | boolean | string[] | number[] | boolean[];
}

export interface SpanEvent {
  name: string;
  timestamp: number;
  attributes?: SpanAttributes;
}

export interface Span {
  name: string;
  context: SpanContext;
  startTime: number;
  endTime?: number;
  status: 'unset' | 'ok' | 'error';
  statusMessage?: string;
  attributes: SpanAttributes;
  events: SpanEvent[];
  links: SpanContext[];
}

// In-memory span storage (for development/testing)
const spans = new Map<string, Span>();
const traceSpans = new Map<string, string[]>();

// Active span context (thread-local-like storage using AsyncLocalStorage if available)
let activeSpanContext: SpanContext | null = null;

// ============================================================================
// ID generation
// ============================================================================

function generateId(length: 16 | 32): string {
  const bytes = new Uint8Array(length / 2);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateTraceId(): string {
  return generateId(32);
}

function generateSpanId(): string {
  return generateId(16);
}

// ============================================================================
// Span operations
// ============================================================================

/**
 * Create and start a new span.
 */
export function startSpan(
  name: string,
  options?: {
    parent?: SpanContext;
    attributes?: SpanAttributes;
    links?: SpanContext[];
  }
): Span {
  const parent = options?.parent || activeSpanContext;

  const context: SpanContext = {
    traceId: parent?.traceId || generateTraceId(),
    spanId: generateSpanId(),
    parentSpanId: parent?.spanId,
    sampled: parent?.sampled ?? true,
  };

  const span: Span = {
    name,
    context,
    startTime: performance.now(),
    status: 'unset',
    attributes: { ...options?.attributes },
    events: [],
    links: options?.links || [],
  };

  // Store span
  spans.set(context.spanId, span);

  // Track spans by trace
  if (!traceSpans.has(context.traceId)) {
    traceSpans.set(context.traceId, []);
  }
  traceSpans.get(context.traceId)!.push(context.spanId);

  return span;
}

/**
 * End a span.
 */
export function endSpan(
  span: Span,
  status?: 'ok' | 'error',
  statusMessage?: string
): void {
  span.endTime = performance.now();

  if (status) {
    span.status = status;
    span.statusMessage = statusMessage;
  } else if (span.status === 'unset') {
    span.status = 'ok';
  }
}

/**
 * Set span attributes.
 */
export function setSpanAttributes(span: Span, attributes: SpanAttributes): void {
  Object.assign(span.attributes, attributes);
}

/**
 * Add an event to a span.
 */
export function addSpanEvent(
  span: Span,
  name: string,
  attributes?: SpanAttributes
): void {
  span.events.push({
    name,
    timestamp: performance.now(),
    attributes,
  });
}

/**
 * Record an error on a span.
 */
export function recordSpanError(span: Span, error: Error): void {
  span.status = 'error';
  span.statusMessage = error.message;

  addSpanEvent(span, 'exception', {
    'exception.type': error.name,
    'exception.message': error.message,
    'exception.stacktrace': error.stack || '',
  });
}

// ============================================================================
// Context management
// ============================================================================

/**
 * Set the active span context.
 */
export function setActiveSpan(context: SpanContext | null): void {
  activeSpanContext = context;
}

/**
 * Get the active span context.
 */
export function getActiveSpan(): SpanContext | null {
  return activeSpanContext;
}

/**
 * Run a function with a span as the active context.
 */
export async function withSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  options?: {
    attributes?: SpanAttributes;
  }
): Promise<T> {
  const span = startSpan(name, options);
  const previousContext = activeSpanContext;
  activeSpanContext = span.context;

  try {
    const result = await fn(span);
    endSpan(span, 'ok');
    return result;
  } catch (error) {
    recordSpanError(span, error as Error);
    endSpan(span, 'error', (error as Error).message);
    throw error;
  } finally {
    activeSpanContext = previousContext;
  }
}

/**
 * Synchronous version of withSpan.
 */
export function withSpanSync<T>(
  name: string,
  fn: (span: Span) => T,
  options?: {
    attributes?: SpanAttributes;
  }
): T {
  const span = startSpan(name, options);
  const previousContext = activeSpanContext;
  activeSpanContext = span.context;

  try {
    const result = fn(span);
    endSpan(span, 'ok');
    return result;
  } catch (error) {
    recordSpanError(span, error as Error);
    endSpan(span, 'error', (error as Error).message);
    throw error;
  } finally {
    activeSpanContext = previousContext;
  }
}

// ============================================================================
// Trace context propagation
// ============================================================================

const W3C_TRACEPARENT_HEADER = 'traceparent';
const W3C_TRACESTATE_HEADER = 'tracestate';

/**
 * Parse W3C Trace Context from headers.
 */
export function extractTraceContext(headers: Record<string, string | undefined>): SpanContext | null {
  const traceparent = headers[W3C_TRACEPARENT_HEADER];
  if (!traceparent) return null;

  // Format: version-traceId-spanId-flags
  const match = traceparent.match(/^([0-9a-f]{2})-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/);
  if (!match) return null;

  const [, version, traceId, spanId, flags] = match;

  // Only support version 00
  if (version !== '00') return null;

  return {
    traceId,
    spanId,
    sampled: (parseInt(flags, 16) & 0x01) === 1,
  };
}

/**
 * Inject W3C Trace Context into headers.
 */
export function injectTraceContext(
  context: SpanContext,
  headers: Record<string, string>
): void {
  const flags = context.sampled ? '01' : '00';
  headers[W3C_TRACEPARENT_HEADER] = `00-${context.traceId}-${context.spanId}-${flags}`;
}

// ============================================================================
// Trace retrieval
// ============================================================================

/**
 * Get a span by ID.
 */
export function getSpan(spanId: string): Span | undefined {
  return spans.get(spanId);
}

/**
 * Get all spans for a trace.
 */
export function getTraceSpans(traceId: string): Span[] {
  const spanIds = traceSpans.get(traceId) || [];
  return spanIds.map((id) => spans.get(id)).filter((s): s is Span => s !== undefined);
}

/**
 * Get trace as a tree structure.
 */
export function getTraceTree(traceId: string): {
  span: Span;
  children: ReturnType<typeof getTraceTree>[];
} | null {
  const allSpans = getTraceSpans(traceId);
  if (allSpans.length === 0) return null;

  // Find root span
  const root = allSpans.find((s) => !s.context.parentSpanId);
  if (!root) return null;

  // Build tree recursively
  function buildTree(span: Span): { span: Span; children: ReturnType<typeof buildTree>[] } {
    const children = allSpans
      .filter((s) => s.context.parentSpanId === span.context.spanId)
      .map(buildTree);
    return { span, children };
  }

  return buildTree(root);
}

// ============================================================================
// Export formats
// ============================================================================

/**
 * Export spans in OTLP JSON format.
 */
export function exportOtlpJson(spans: Span[]): object {
  return {
    resourceSpans: [
      {
        resource: {
          attributes: [
            { key: 'service.name', value: { stringValue: 'a2s' } },
            { key: 'service.version', value: { stringValue: '1.0.0' } },
          ],
        },
        scopeSpans: [
          {
            scope: {
              name: 'a2a-video-tracer',
              version: '1.0.0',
            },
            spans: spans.map((span) => ({
              traceId: span.context.traceId,
              spanId: span.context.spanId,
              parentSpanId: span.context.parentSpanId,
              name: span.name,
              kind: 1, // INTERNAL
              startTimeUnixNano: Math.floor(span.startTime * 1e6).toString(),
              endTimeUnixNano: span.endTime
                ? Math.floor(span.endTime * 1e6).toString()
                : undefined,
              attributes: Object.entries(span.attributes).map(([key, value]) => ({
                key,
                value: formatAttributeValue(value),
              })),
              status: {
                code: span.status === 'error' ? 2 : span.status === 'ok' ? 1 : 0,
                message: span.statusMessage,
              },
              events: span.events.map((event) => ({
                name: event.name,
                timeUnixNano: Math.floor(event.timestamp * 1e6).toString(),
                attributes: event.attributes
                  ? Object.entries(event.attributes).map(([key, value]) => ({
                      key,
                      value: formatAttributeValue(value),
                    }))
                  : [],
              })),
            })),
          },
        ],
      },
    ],
  };
}

function formatAttributeValue(
  value: string | number | boolean | string[] | number[] | boolean[]
): object {
  if (typeof value === 'string') {
    return { stringValue: value };
  } else if (typeof value === 'number') {
    return Number.isInteger(value) ? { intValue: value.toString() } : { doubleValue: value };
  } else if (typeof value === 'boolean') {
    return { boolValue: value };
  } else if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map((v) => formatAttributeValue(v as string | number | boolean)),
      },
    };
  }
  return { stringValue: String(value) };
}

// ============================================================================
// Cleanup
// ============================================================================

/**
 * Clear all stored spans.
 */
export function clearSpans(): void {
  spans.clear();
  traceSpans.clear();
}

/**
 * Clear spans older than a given duration.
 */
export function clearOldSpans(maxAgeMs: number): number {
  const cutoff = performance.now() - maxAgeMs;
  let deleted = 0;

  for (const [spanId, span] of spans) {
    if (span.endTime && span.endTime < cutoff) {
      spans.delete(spanId);
      deleted++;

      // Remove from trace map
      const traceSpanIds = traceSpans.get(span.context.traceId);
      if (traceSpanIds) {
        const index = traceSpanIds.indexOf(spanId);
        if (index >= 0) {
          traceSpanIds.splice(index, 1);
        }
        if (traceSpanIds.length === 0) {
          traceSpans.delete(span.context.traceId);
        }
      }
    }
  }

  return deleted;
}

// ============================================================================
// A2A Video-specific tracing helpers
// ============================================================================

export const a2sTracing = {
  /**
   * Start a render operation span.
   */
  startRender(renderId: string, compositionId: string, options?: SpanAttributes): Span {
    return startSpan('a2s.render', {
      attributes: {
        'render.id': renderId,
        'composition.id': compositionId,
        ...options,
      },
    });
  },

  /**
   * Start a frame render span.
   */
  startFrameRender(renderId: string, frame: number, totalFrames: number): Span {
    return startSpan('a2s.render.frame', {
      attributes: {
        'render.id': renderId,
        'frame.number': frame,
        'frame.total': totalFrames,
      },
    });
  },

  /**
   * Start an FFmpeg operation span.
   */
  startFfmpeg(operation: string, args?: SpanAttributes): Span {
    return startSpan(`a2s.ffmpeg.${operation}`, {
      attributes: {
        'ffmpeg.operation': operation,
        ...args,
      },
    });
  },

  /**
   * Start an API request span.
   */
  startApiRequest(method: string, path: string): Span {
    return startSpan('a2s.api.request', {
      attributes: {
        'http.method': 'POST',
        'http.url': path,
        'rpc.method': method,
      },
    });
  },

  /**
   * Start a cache operation span.
   */
  startCacheOp(operation: 'get' | 'set' | 'delete', key: string): Span {
    return startSpan(`a2s.cache.${operation}`, {
      attributes: {
        'cache.operation': operation,
        'cache.key': key,
      },
    });
  },
};
