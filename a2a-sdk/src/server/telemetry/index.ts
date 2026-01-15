/**
 * Telemetry Module
 *
 * Provides comprehensive observability features for the A2A SDK including:
 * - Distributed tracing with OpenTelemetry
 * - Metrics collection
 * - Task store instrumentation
 * - HTTP middleware for request tracing
 * - Automatic span creation for A2A operations
 */

// Core telemetry components
export { A2ATelemetryProvider } from './telemetry-provider';
export type { TelemetryConfig, A2ASpanAttributes } from './telemetry-provider';

export { A2AMetricsCollector } from './metrics-collector';
export type { MetricsConfig } from './metrics-collector';

export { A2ATelemetryWrapper } from './telemetry-wrapper';
export type { TelemetryWrapperConfig } from './telemetry-wrapper';

export { OpenTelemetryInitializer, initializeOpenTelemetry } from './otel-initializer';
export type { OpenTelemetryConfig } from './otel-initializer';

// Instrumentation
export { InstrumentedTaskStore, instrumentTaskStore } from './task-store-instrumentation';
export type { TaskStoreInstrumentationOptions } from './task-store-instrumentation';

// HTTP middleware
export {
  createExpressTelemetryMiddleware,
  createFastifyTelemetryMiddleware,
  extractHttpAttributes,
} from './http-middleware';
export type { TelemetryMiddlewareOptions } from './http-middleware';

// Convenience function to create a fully configured telemetry wrapper
export async function createTelemetryWrapper(
  config: TelemetryWrapperConfig & {
    openTelemetry?: OpenTelemetryConfig;
  }
): Promise<A2ATelemetryWrapper> {
  const wrapper = new A2ATelemetryWrapper(config);

  // Initialize OpenTelemetry if configured
  if (config.openTelemetry) {
    const initializer = new OpenTelemetryInitializer(config.openTelemetry);
    await initializer.initialize();
  }

  // Initialize telemetry wrapper
  await wrapper.initialize();

  return wrapper;
}
