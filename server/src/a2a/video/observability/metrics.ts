/**
 * A2A Video Metrics
 *
 * Prometheus-compatible metrics for monitoring.
 */

export interface MetricValue {
  value: number;
  labels?: Record<string, string>;
  timestamp?: number;
}

export interface HistogramBucket {
  le: number;
  count: number;
}

export interface Metric {
  name: string;
  help: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  values: MetricValue[];
  buckets?: HistogramBucket[];
}

// In-memory metrics storage
const metrics = new Map<string, Metric>();
const histogramData = new Map<string, number[]>();

// Histogram default buckets (in seconds)
const DEFAULT_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

// ============================================================================
// Metric definitions
// ============================================================================

const METRIC_DEFINITIONS: Array<{
  name: string;
  help: string;
  type: 'counter' | 'gauge' | 'histogram';
  labelNames?: string[];
  buckets?: number[];
}> = [
  // Counters
  {
    name: 'a2a_video_renders_total',
    help: 'Total number of render requests',
    type: 'counter',
    labelNames: ['status', 'format', 'codec'],
  },
  {
    name: 'a2a_video_renders_started_total',
    help: 'Total number of renders started',
    type: 'counter',
    labelNames: ['format', 'codec'],
  },
  {
    name: 'a2a_video_renders_completed_total',
    help: 'Total number of renders completed successfully',
    type: 'counter',
    labelNames: ['format', 'codec'],
  },
  {
    name: 'a2a_video_renders_failed_total',
    help: 'Total number of renders that failed',
    type: 'counter',
    labelNames: ['format', 'codec', 'error_type'],
  },
  {
    name: 'a2a_video_frames_rendered_total',
    help: 'Total number of frames rendered',
    type: 'counter',
    labelNames: ['composition'],
  },
  {
    name: 'a2a_video_assets_uploaded_total',
    help: 'Total number of assets uploaded',
    type: 'counter',
    labelNames: ['type'],
  },
  {
    name: 'a2a_video_api_requests_total',
    help: 'Total number of API requests',
    type: 'counter',
    labelNames: ['method', 'status'],
  },
  {
    name: 'a2a_video_cache_hits_total',
    help: 'Total number of cache hits',
    type: 'counter',
    labelNames: ['cache_type'],
  },
  {
    name: 'a2a_video_cache_misses_total',
    help: 'Total number of cache misses',
    type: 'counter',
    labelNames: ['cache_type'],
  },

  // Gauges
  {
    name: 'a2a_video_renders_in_progress',
    help: 'Number of renders currently in progress',
    type: 'gauge',
    labelNames: ['worker'],
  },
  {
    name: 'a2a_video_queue_size',
    help: 'Number of jobs in the queue',
    type: 'gauge',
    labelNames: ['priority'],
  },
  {
    name: 'a2a_video_workers_active',
    help: 'Number of active workers',
    type: 'gauge',
  },
  {
    name: 'a2a_video_storage_bytes',
    help: 'Total storage used in bytes',
    type: 'gauge',
    labelNames: ['type'],
  },
  {
    name: 'a2a_video_compositions_count',
    help: 'Number of registered compositions',
    type: 'gauge',
  },

  // Histograms
  {
    name: 'a2a_video_render_duration_seconds',
    help: 'Render duration in seconds',
    type: 'histogram',
    labelNames: ['format', 'codec', 'resolution'],
    buckets: [1, 5, 10, 30, 60, 120, 300, 600, 1800],
  },
  {
    name: 'a2a_video_frame_render_duration_seconds',
    help: 'Individual frame render duration in seconds',
    type: 'histogram',
    labelNames: ['composition'],
    buckets: DEFAULT_BUCKETS,
  },
  {
    name: 'a2a_video_api_request_duration_seconds',
    help: 'API request duration in seconds',
    type: 'histogram',
    labelNames: ['method'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
  },
  {
    name: 'a2a_video_output_size_bytes',
    help: 'Rendered video output size in bytes',
    type: 'histogram',
    labelNames: ['format', 'codec'],
    buckets: [1e6, 5e6, 10e6, 50e6, 100e6, 500e6, 1e9],
  },
];

// ============================================================================
// Initialize metrics
// ============================================================================

function initializeMetrics(): void {
  for (const def of METRIC_DEFINITIONS) {
    metrics.set(def.name, {
      name: def.name,
      help: def.help,
      type: def.type,
      values: [],
      buckets: def.buckets?.map((le) => ({ le, count: 0 })),
    });
  }
}

initializeMetrics();

// ============================================================================
// Metric operations
// ============================================================================

function labelKey(labels?: Record<string, string>): string {
  if (!labels) return '';
  return Object.entries(labels)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}="${v}"`)
    .join(',');
}

function findOrCreateValue(metric: Metric, labels?: Record<string, string>): MetricValue {
  const key = labelKey(labels);
  let value = metric.values.find((v) => labelKey(v.labels) === key);

  if (!value) {
    value = { value: 0, labels };
    metric.values.push(value);
  }

  return value;
}

/**
 * Increment a counter.
 */
export function incrementCounter(name: string, labels?: Record<string, string>, amount = 1): void {
  const metric = metrics.get(name);
  if (!metric || metric.type !== 'counter') return;

  const value = findOrCreateValue(metric, labels);
  value.value += amount;
  value.timestamp = Date.now();
}

/**
 * Set a gauge value.
 */
export function setGauge(name: string, value: number, labels?: Record<string, string>): void {
  const metric = metrics.get(name);
  if (!metric || metric.type !== 'gauge') return;

  const metricValue = findOrCreateValue(metric, labels);
  metricValue.value = value;
  metricValue.timestamp = Date.now();
}

/**
 * Increment a gauge.
 */
export function incrementGauge(name: string, labels?: Record<string, string>, amount = 1): void {
  const metric = metrics.get(name);
  if (!metric || metric.type !== 'gauge') return;

  const value = findOrCreateValue(metric, labels);
  value.value += amount;
  value.timestamp = Date.now();
}

/**
 * Decrement a gauge.
 */
export function decrementGauge(name: string, labels?: Record<string, string>, amount = 1): void {
  incrementGauge(name, labels, -amount);
}

/**
 * Record a histogram observation.
 */
export function observeHistogram(name: string, value: number, labels?: Record<string, string>): void {
  const metric = metrics.get(name);
  if (!metric || metric.type !== 'histogram') return;

  // Store raw value for percentile calculations
  const dataKey = `${name}:${labelKey(labels)}`;
  if (!histogramData.has(dataKey)) {
    histogramData.set(dataKey, []);
  }
  const data = histogramData.get(dataKey)!;
  data.push(value);

  // Keep only last 1000 observations
  if (data.length > 1000) {
    data.shift();
  }

  // Update bucket counts
  const buckets = metric.buckets || [];
  for (const bucket of buckets) {
    if (value <= bucket.le) {
      bucket.count++;
    }
  }

  // Update sum and count
  const metricValue = findOrCreateValue(metric, labels);
  metricValue.value += value; // Sum
  metricValue.timestamp = Date.now();
}

/**
 * Time a function and record to histogram.
 */
export async function timeAsync<T>(
  name: string,
  fn: () => Promise<T>,
  labels?: Record<string, string>
): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    const duration = (performance.now() - start) / 1000;
    observeHistogram(name, duration, labels);
  }
}

/**
 * Create a timer for manual timing.
 */
export function startTimer(name: string, labels?: Record<string, string>): () => void {
  const start = performance.now();
  return () => {
    const duration = (performance.now() - start) / 1000;
    observeHistogram(name, duration, labels);
  };
}

// ============================================================================
// Prometheus export
// ============================================================================

/**
 * Format metrics in Prometheus text format.
 */
export function formatPrometheus(): string {
  const lines: string[] = [];

  for (const metric of metrics.values()) {
    lines.push(`# HELP ${metric.name} ${metric.help}`);
    lines.push(`# TYPE ${metric.name} ${metric.type}`);

    if (metric.type === 'histogram') {
      // Output histogram buckets
      const bucketCounts = new Map<string, number>();
      const sums = new Map<string, number>();
      const counts = new Map<string, number>();

      for (const bucket of metric.buckets || []) {
        const labelStr = '';
        lines.push(`${metric.name}_bucket{le="${bucket.le}"${labelStr}} ${bucket.count}`);
      }

      // Sum and count
      for (const value of metric.values) {
        const labelStr = value.labels ? `{${labelKey(value.labels)}}` : '';
        const dataKey = `${metric.name}:${labelKey(value.labels)}`;
        const data = histogramData.get(dataKey) || [];
        const count = data.length;
        const sum = value.value;

        lines.push(`${metric.name}_sum${labelStr} ${sum}`);
        lines.push(`${metric.name}_count${labelStr} ${count}`);
      }
    } else {
      // Counter or gauge
      for (const value of metric.values) {
        const labelStr = value.labels ? `{${labelKey(value.labels)}}` : '';
        lines.push(`${metric.name}${labelStr} ${value.value}`);
      }

      // If no values, output 0
      if (metric.values.length === 0) {
        lines.push(`${metric.name} 0`);
      }
    }
  }

  return lines.join('\n');
}

/**
 * Get metrics as JSON.
 */
export function getMetricsJson(): Record<string, Metric> {
  const result: Record<string, Metric> = {};

  for (const [name, metric] of metrics) {
    result[name] = { ...metric };
  }

  return result;
}

/**
 * Reset all metrics.
 */
export function resetMetrics(): void {
  for (const metric of metrics.values()) {
    metric.values = [];
    if (metric.buckets) {
      for (const bucket of metric.buckets) {
        bucket.count = 0;
      }
    }
  }
  histogramData.clear();
}

// ============================================================================
// Convenience functions
// ============================================================================

export const a2sMetrics = {
  // Renders
  renderRequested(format: string, codec: string): void {
    incrementCounter('a2a_video_renders_total', { status: 'requested', format, codec });
  },

  renderStarted(format: string, codec: string): void {
    incrementCounter('a2a_video_renders_started_total', { format, codec });
    incrementGauge('a2a_video_renders_in_progress');
  },

  renderCompleted(format: string, codec: string, durationSeconds: number, sizeBytes: number, resolution: string): void {
    incrementCounter('a2a_video_renders_completed_total', { format, codec });
    decrementGauge('a2a_video_renders_in_progress');
    observeHistogram('a2a_video_render_duration_seconds', durationSeconds, { format, codec, resolution });
    observeHistogram('a2a_video_output_size_bytes', sizeBytes, { format, codec });
  },

  renderFailed(format: string, codec: string, errorType: string): void {
    incrementCounter('a2a_video_renders_failed_total', { format, codec, error_type: errorType });
    decrementGauge('a2a_video_renders_in_progress');
  },

  frameRendered(composition: string, durationSeconds: number): void {
    incrementCounter('a2a_video_frames_rendered_total', { composition });
    observeHistogram('a2a_video_frame_render_duration_seconds', durationSeconds, { composition });
  },

  // Assets
  assetUploaded(type: string): void {
    incrementCounter('a2a_video_assets_uploaded_total', { type });
  },

  // API
  apiRequest(method: string, status: string, durationSeconds: number): void {
    incrementCounter('a2a_video_api_requests_total', { method, status });
    observeHistogram('a2a_video_api_request_duration_seconds', durationSeconds, { method });
  },

  // Cache
  cacheHit(cacheType: string): void {
    incrementCounter('a2a_video_cache_hits_total', { cache_type: cacheType });
  },

  cacheMiss(cacheType: string): void {
    incrementCounter('a2a_video_cache_misses_total', { cache_type: cacheType });
  },

  // Queue
  setQueueSize(priority: number, size: number): void {
    setGauge('a2a_video_queue_size', size, { priority: priority.toString() });
  },

  setActiveWorkers(count: number): void {
    setGauge('a2a_video_workers_active', count);
  },

  // Storage
  setStorageBytes(type: string, bytes: number): void {
    setGauge('a2a_video_storage_bytes', bytes, { type });
  },

  setCompositionsCount(count: number): void {
    setGauge('a2a_video_compositions_count', count);
  },
};
