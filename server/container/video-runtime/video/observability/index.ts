/**
 * A2A Video Observability Module
 *
 * Metrics, tracing, and logging for production monitoring.
 */

// Metrics
export {
  incrementCounter,
  setGauge,
  incrementGauge,
  decrementGauge,
  observeHistogram,
  timeAsync,
  startTimer,
  formatPrometheus,
  getMetricsJson,
  resetMetrics,
  a2sMetrics,
  type MetricValue,
  type HistogramBucket,
  type Metric,
} from './metrics.js';

// Tracing
export {
  startSpan,
  endSpan,
  setSpanAttributes,
  addSpanEvent,
  recordSpanError,
  setActiveSpan,
  getActiveSpan,
  withSpan,
  withSpanSync,
  extractTraceContext,
  injectTraceContext,
  getSpan,
  getTraceSpans,
  getTraceTree,
  exportOtlpJson,
  clearSpans,
  clearOldSpans,
  a2sTracing,
  type SpanContext,
  type SpanAttributes,
  type SpanEvent,
  type Span,
} from './tracing.js';
