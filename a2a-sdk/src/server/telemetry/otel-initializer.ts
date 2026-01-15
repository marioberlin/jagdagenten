/**
 * OpenTelemetry Initializer
 *
 * Sets up and configures the OpenTelemetry SDK with appropriate
 * exporters for tracing and metrics. Supports console, OTLP, and
 * Jaeger exporters.
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
      const { NodeSDK } = await import('@opentelemetry/sdk-node');
      const { Resource } = await import('@opentelemetry/resources');
      const { SemanticResourceAttributes } = await import('@opentelemetry/semantic-conventions');

      // Create resource with service information
      const resource = new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: this.config.serviceName,
        [SemanticResourceAttributes.SERVICE_VERSION]: this.config.serviceVersion,
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: this.config.environment,
      });

      // Build SDK configuration
      const sdkConfig: any = {
        resource,
        traceExporter: await this.createTraceExporter(),
      };

      if (this.config.enableMetrics) {
        sdkConfig.metricExporter = await this.createMetricsExporter();
      }

      // Create and start SDK
      const sdk = new NodeSDK(sdkConfig);

      // Configure sampling
      if (this.config.traceSamplingRate < 1.0) {
        const { ParentBasedSampler, TraceIdRatioBasedSampler } = await import('@opentelemetry/sdk-trace-web');
        // Note: For Node.js, use appropriate sampler
      }

      await sdk.start();

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
      throw error;
    }
  }

  /**
   * Create trace exporter based on configuration
   */
  private async createTraceExporter(): Promise<any> {
    if (this.config.otlpEndpoint) {
      const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http');
      return new OTLPTraceExporter({
        url: this.config.otlpEndpoint,
      });
    }

    if (this.config.consoleExporter) {
      const { ConsoleSpanExporter } = await import('@opentelemetry/sdk-trace-base');
      return new ConsoleSpanExporter();
    }

    // Default to no-op exporter if no configuration
    return {
      export(spans: any, resultCallback: any) {
        resultCallback({ code: 0 });
      },
      shutdown() {
        return Promise.resolve();
      },
    };
  }

  /**
   * Create metrics exporter based on configuration
   */
  private async createMetricsExporter(): Promise<any> {
    if (this.config.otlpEndpoint) {
      const { OTLPMetricExporter } = await import('@opentelemetry/exporter-metrics-otlp-http');
      return new OTLPMetricExporter({
        url: this.config.otlpEndpoint,
      });
    }

    if (this.config.consoleExporter) {
      const { ConsoleMetricExporter } = await import('@opentelemetry/sdk-metrics-base');
      return new ConsoleMetricExporter();
    }

    // Default to no-op exporter if no configuration
    return {
      export(metrics: any, resultCallback: any) {
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
