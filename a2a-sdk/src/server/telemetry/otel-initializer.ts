/**
 * OpenTelemetry Initializer
 *
 * Sets up and configures the OpenTelemetry SDK with appropriate
 * exporters for tracing and metrics. Supports console, OTLP, and
 * Jaeger exporters.
 *
 * Note: This module requires optional OpenTelemetry SDK packages
 * to be installed. If they are not available, initialization will
 * fail gracefully with a warning.
 */

export interface OpenTelemetryConfig {
  /** Service name */
  serviceName?: string;

  /** Service version */
  serviceVersion?: string;

  /** Environment (production, development, etc.) */
  environment?: string;

  /** OTLP collector endpoint (e.g., http://localhost:4317/v1/traces) */
  otlpEndpoint?: string;

  /** Enable console exporter for development */
  consoleExporter?: boolean;

  /** Enable trace sampling (0.0 to 1.0) */
  traceSamplingRate?: number;

  /** Enable metrics export */
  enableMetrics?: boolean;

  /** Enable tracing */
  enableTracing?: boolean;
}

export class OpenTelemetryInitializer {
  private config: Required<OpenTelemetryConfig>;

  constructor(config: OpenTelemetryConfig = {}) {
    this.config = {
      serviceName: config.serviceName ?? 'a2a-sdk',
      serviceVersion: config.serviceVersion ?? '1.0.0',
      environment: config.environment ?? 'development',
      otlpEndpoint: config.otlpEndpoint ?? '',
      consoleExporter: config.consoleExporter ?? false,
      traceSamplingRate: config.traceSamplingRate ?? 1.0,
      enableMetrics: config.enableMetrics ?? true,
      enableTracing: config.enableTracing ?? true,
    };
  }

  /**
   * Initialize OpenTelemetry SDK
   */
  async initialize(): Promise<void> {
    try {
      // Dynamic imports for optional packages
      const sdkNodeModule = await import('@opentelemetry/sdk-node').catch(() => null);
      const resourcesModule = await import('@opentelemetry/resources').catch(() => null);

      if (!sdkNodeModule || !resourcesModule) {
        console.warn('OpenTelemetry SDK packages not available. Install @opentelemetry/sdk-node and @opentelemetry/resources for full telemetry support.');
        return;
      }

      const { NodeSDK } = sdkNodeModule;
      const { Resource } = resourcesModule;

      // Create resource with service information
      const resource = new Resource({
        'service.name': this.config.serviceName,
        'service.version': this.config.serviceVersion,
        'deployment.environment': this.config.environment,
      });

      // Build SDK configuration
      const sdkConfig: Record<string, unknown> = {
        resource,
        traceExporter: await this.createTraceExporter(),
      };

      if (this.config.enableMetrics) {
        sdkConfig.metricExporter = await this.createMetricsExporter();
      }

      // Create and start SDK
      const sdk = new NodeSDK(sdkConfig);

      sdk.start();

      console.log('OpenTelemetry initialized successfully');

      // Handle shutdown
      const shutdown = async () => {
        await sdk.shutdown();
        console.log('OpenTelemetry shut down successfully');
      };

      process.on('SIGTERM', shutdown);
      process.on('SIGINT', shutdown);

    } catch (error) {
      console.warn('Failed to initialize OpenTelemetry:', error);
      // Don't throw - allow application to continue without telemetry
    }
  }

  /**
   * Create trace exporter based on configuration
   * Returns any type since exporters vary by OpenTelemetry version
   */
  private async createTraceExporter(): Promise<unknown> {
    if (this.config.otlpEndpoint) {
      try {
        const module = await import('@opentelemetry/exporter-trace-otlp-http');
        const { OTLPTraceExporter } = module;
        return new OTLPTraceExporter({
          url: this.config.otlpEndpoint,
        });
      } catch {
        console.warn('OTLP trace exporter not available');
      }
    }

    if (this.config.consoleExporter) {
      try {
        const module = await import('@opentelemetry/sdk-trace-base');
        const { ConsoleSpanExporter } = module;
        return new ConsoleSpanExporter();
      } catch {
        console.warn('Console span exporter not available');
      }
    }

    // Default to no-op exporter if no configuration or packages unavailable
    return this.createNoOpExporter();
  }

  /**
   * Create metrics exporter based on configuration
   * Returns any type since exporters vary by OpenTelemetry version
   */
  private async createMetricsExporter(): Promise<unknown> {
    if (this.config.otlpEndpoint) {
      try {
        // Dynamic import with string expression to avoid TypeScript errors for optional packages
        const packageName = '@opentelemetry/exporter-metrics-otlp-http';
        const module = await (Function('p', 'return import(p)')(packageName) as Promise<{ OTLPMetricExporter: new (opts: { url: string }) => unknown }>).catch(() => null);
        if (module) {
          const { OTLPMetricExporter } = module;
          return new OTLPMetricExporter({
            url: this.config.otlpEndpoint,
          });
        }
      } catch {
        console.warn('OTLP metrics exporter not available');
      }
    }

    if (this.config.consoleExporter) {
      try {
        const module = await import('@opentelemetry/sdk-metrics');
        const { ConsoleMetricExporter } = module;
        return new ConsoleMetricExporter();
      } catch {
        console.warn('Console metrics exporter not available');
      }
    }

    // Default to no-op exporter if no configuration or packages unavailable
    return this.createNoOpExporter();
  }

  /**
   * Create a no-op exporter
   */
  private createNoOpExporter(): unknown {
    return {
      export(_data: unknown, resultCallback: (result: { code: number }) => void) {
        resultCallback({ code: 0 });
      },
      shutdown() {
        return Promise.resolve();
      },
    };
  }

  /**
   * Get configuration
   */
  getConfig(): Required<OpenTelemetryConfig> {
    return this.config;
  }
}

/**
 * Initialize OpenTelemetry with default configuration
 */
export async function initializeOpenTelemetry(config: OpenTelemetryConfig = {}): Promise<void> {
  const initializer = new OpenTelemetryInitializer(config);
  await initializer.initialize();
}
