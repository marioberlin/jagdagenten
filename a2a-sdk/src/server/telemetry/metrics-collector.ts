/**
 * Metrics Collector for A2A SDK
 *
 * Collects and exports metrics about A2A operations including:
 * - Task execution counts
 * - Task execution duration
 * - Success/error rates
 * - Active task counts
 * - Database operation metrics
 */

// OpenTelemetry types are imported dynamically

export interface MetricsConfig {
  /** Enable metrics collection */
  enabled?: boolean;

  /** Metrics prefix for all metric names */
  prefix?: string;

  /** Enable histograms for duration metrics */
  enableHistograms?: boolean;

  /** Buckets for duration histograms (in seconds) */
  durationBuckets?: number[];
}

export class A2AMetricsCollector {
  private config: Required<MetricsConfig>;
  private metrics: {
    taskExecutionDuration?: any;
    taskCount?: any;
    taskErrors?: any;
    activeTasks?: any;
    dbOperationDuration?: any;
    dbErrors?: any;
    requestCount?: any;
    requestDuration?: any;
  } = {};

  constructor(config: MetricsConfig = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      prefix: config.prefix ?? 'a2a',
      enableHistograms: config.enableHistograms ?? true,
      durationBuckets: config.durationBuckets ?? [0.1, 0.5, 1, 2, 5, 10],
    };
  }

  /**
   * Initialize the metrics collector
   */
  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      const api = await import('@opentelemetry/api');

      // Get the global meter provider (assumes SDK is already configured)
      // If SDK is not configured, getMeter will return a no-op meter
      const meter = api.metrics.getMeter(
        this.config.prefix,
        '1.0.0'
      );

      // Task execution duration (histogram)
      this.metrics.taskExecutionDuration = this.config.enableHistograms
        ? meter.createHistogram(`${this.config.prefix}.task.execution.duration`, {
            description: 'Task execution duration in seconds',
            advice: { explicitBucketBoundaries: this.config.durationBuckets },
          })
        : meter.createCounter(`${this.config.prefix}.task.execution.duration`, {
            description: 'Task execution duration in seconds',
          });

      // Task count by state
      this.metrics.taskCount = meter.createCounter(`${this.config.prefix}.task.count`, {
        description: 'Total number of tasks by state',
      });

      // Task errors
      this.metrics.taskErrors = meter.createCounter(`${this.config.prefix}.task.errors`, {
        description: 'Total number of task execution errors',
      });

      // Active tasks
      this.metrics.activeTasks = meter.createUpDownCounter(`${this.config.prefix}.task.active`, {
        description: 'Number of currently active tasks',
      });

      // Database operation duration
      this.metrics.dbOperationDuration = this.config.enableHistograms
        ? meter.createHistogram(`${this.config.prefix}.db.operation.duration`, {
            description: 'Database operation duration in seconds',
            advice: { explicitBucketBoundaries: this.config.durationBuckets },
          })
        : meter.createCounter(`${this.config.prefix}.db.operation.duration`, {
            description: 'Database operation duration in seconds',
          });

      // Database errors
      this.metrics.dbErrors = meter.createCounter(`${this.config.prefix}.db.errors`, {
        description: 'Total number of database operation errors',
      });

      // Request count
      this.metrics.requestCount = meter.createCounter(`${this.config.prefix}.request.count`, {
        description: 'Total number of requests',
      });

      // Request duration
      this.metrics.requestDuration = this.config.enableHistograms
        ? meter.createHistogram(`${this.config.prefix}.request.duration`, {
            description: 'Request duration in seconds',
            advice: { explicitBucketBoundaries: this.config.durationBuckets },
          })
        : meter.createCounter(`${this.config.prefix}.request.duration`, {
            description: 'Request duration in seconds',
          });

    } catch (error) {
      console.warn('OpenTelemetry metrics not available, metrics disabled:', error);
      this.config.enabled = false;
    }
  }

  /**
   * Record task execution duration
   */
  recordTaskDuration(durationMs: number, taskState: string): void {
    if (!this.config.enabled || !this.metrics.taskExecutionDuration) {
      return;
    }

    const durationSec = durationMs / 1000;
    this.metrics.taskExecutionDuration.record(durationSec, {
      'task.state': taskState,
    });
  }

  /**
   * Increment task count
   */
  incrementTaskCount(taskState: string, delta: number = 1): void {
    if (!this.config.enabled || !this.metrics.taskCount) {
      return;
    }

    this.metrics.taskCount.add(delta, {
      'task.state': taskState,
    });
  }

  /**
   * Record task error
   */
  recordTaskError(errorType: string): void {
    if (!this.config.enabled || !this.metrics.taskErrors) {
      return;
    }

    this.metrics.taskErrors.add(1, {
      'error.type': errorType,
    });
  }

  /**
   * Increment active task count
   */
  incrementActiveTasks(delta: number): void {
    if (!this.config.enabled || !this.metrics.activeTasks) {
      return;
    }

    this.metrics.activeTasks.add(delta);
  }

  /**
   * Record database operation duration
   */
  recordDbOperation(
    operation: string,
    table: string,
    durationMs: number,
    success: boolean
  ): void {
    if (!this.config.enabled || !this.metrics.dbOperationDuration) {
      return;
    }

    const durationSec = durationMs / 1000;
    this.metrics.dbOperationDuration.record(durationSec, {
      'db.operation': operation,
      'db.table': table,
      'db.success': success,
    });

    if (!success && this.metrics.dbErrors) {
      this.metrics.dbErrors.add(1, {
        'db.operation': operation,
        'db.table': table,
      });
    }
  }

  /**
   * Record request
   */
  recordRequest(
    method: string,
    route: string,
    statusCode: number,
    durationMs: number
  ): void {
    if (!this.config.enabled || !this.metrics.requestCount || !this.metrics.requestDuration) {
      return;
    }

    const durationSec = durationMs / 1000;

    this.metrics.requestCount.add(1, {
      'http.method': method,
      'http.route': route,
      'http.status_code': statusCode,
    });

    this.metrics.requestDuration.record(durationSec, {
      'http.method': method,
      'http.route': route,
      'http.status_code': statusCode,
    });
  }

  /**
   * Shutdown the metrics collector
   */
  async shutdown(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      const api = await import('@opentelemetry/api');
      const provider = api.metrics.getMeterProvider() as any;
      if (provider && typeof provider.shutdown === 'function') {
        await provider.shutdown();
      }
    } catch (error) {
      console.warn('Error shutting down metrics:', error);
    }
  }

  /**
   * Get configuration
   */
  getConfig(): Required<MetricsConfig> {
    return this.config;
  }
}
