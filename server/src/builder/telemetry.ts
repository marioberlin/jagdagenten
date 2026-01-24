/**
 * Builder Telemetry
 *
 * OpenTelemetry span and metric helpers for build observability.
 */

import type { BuildPhase } from './types.js';

interface SpanOptions {
  buildId: string;
  phase: BuildPhase;
  appId: string;
  attributes?: Record<string, string | number | boolean>;
}

/**
 * Create a telemetry span for a build phase.
 * Placeholder until OpenTelemetry SDK is fully integrated.
 */
export function startBuildSpan(options: SpanOptions): BuildSpan {
  return new BuildSpan(options);
}

export class BuildSpan {
  private startTime: number;
  private options: SpanOptions;

  constructor(options: SpanOptions) {
    this.options = options;
    this.startTime = Date.now();
  }

  addEvent(name: string, attributes?: Record<string, string | number>): void {
    // Will forward to OTel span.addEvent when integrated
    void name;
    void attributes;
  }

  setStatus(status: 'ok' | 'error', message?: string): void {
    void status;
    void message;
  }

  end(): number {
    return Date.now() - this.startTime;
  }
}

/**
 * Record a build metric.
 */
export function recordBuildMetric(
  name: string,
  value: number,
  attributes?: Record<string, string | number>
): void {
  // Will forward to OTel meter when integrated
  void name;
  void value;
  void attributes;
}
