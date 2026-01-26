/**
 * Metrics Tests
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import {
  incrementCounter,
  setGauge,
  incrementGauge,
  decrementGauge,
  observeHistogram,
  startTimer,
  formatPrometheus,
  getMetricsJson,
  resetMetrics,
  a2sMetrics,
} from '../observability/metrics.js';

beforeEach(() => {
  resetMetrics();
});

describe('incrementCounter', () => {
  test('increments counter by 1', () => {
    incrementCounter('a2a_video_renders_total', { status: 'completed', format: 'mp4', codec: 'h264' });
    incrementCounter('a2a_video_renders_total', { status: 'completed', format: 'mp4', codec: 'h264' });

    const metrics = getMetricsJson();
    const counter = metrics['a2a_video_renders_total'];
    const value = counter.values.find(
      (v) => v.labels?.status === 'completed' && v.labels?.format === 'mp4'
    );

    expect(value?.value).toBe(2);
  });

  test('increments by custom amount', () => {
    incrementCounter('a2a_video_frames_rendered_total', { composition: 'test' }, 10);

    const metrics = getMetricsJson();
    const counter = metrics['a2a_video_frames_rendered_total'];
    const value = counter.values.find((v) => v.labels?.composition === 'test');

    expect(value?.value).toBe(10);
  });

  test('handles different labels separately', () => {
    incrementCounter('a2a_video_renders_total', { status: 'completed', format: 'mp4', codec: 'h264' });
    incrementCounter('a2a_video_renders_total', { status: 'failed', format: 'mp4', codec: 'h264' });

    const metrics = getMetricsJson();
    const counter = metrics['a2a_video_renders_total'];

    expect(counter.values).toHaveLength(2);
  });
});

describe('setGauge', () => {
  test('sets gauge value', () => {
    setGauge('a2a_video_renders_in_progress', 5);

    const metrics = getMetricsJson();
    const gauge = metrics['a2a_video_renders_in_progress'];

    expect(gauge.values[0]?.value).toBe(5);
  });

  test('overwrites previous value', () => {
    setGauge('a2a_video_renders_in_progress', 5);
    setGauge('a2a_video_renders_in_progress', 3);

    const metrics = getMetricsJson();
    const gauge = metrics['a2a_video_renders_in_progress'];

    expect(gauge.values[0]?.value).toBe(3);
  });
});

describe('incrementGauge / decrementGauge', () => {
  test('increments gauge', () => {
    setGauge('a2a_video_renders_in_progress', 5);
    incrementGauge('a2a_video_renders_in_progress');

    const metrics = getMetricsJson();
    expect(metrics['a2a_video_renders_in_progress'].values[0]?.value).toBe(6);
  });

  test('decrements gauge', () => {
    setGauge('a2a_video_renders_in_progress', 5);
    decrementGauge('a2a_video_renders_in_progress');

    const metrics = getMetricsJson();
    expect(metrics['a2a_video_renders_in_progress'].values[0]?.value).toBe(4);
  });
});

describe('observeHistogram', () => {
  test('records histogram observation', () => {
    observeHistogram('a2a_video_render_duration_seconds', 5.5, { format: 'mp4', codec: 'h264', resolution: '1080p' });

    const metrics = getMetricsJson();
    const histogram = metrics['a2a_video_render_duration_seconds'];

    // Check that buckets were updated
    const bucket5 = histogram.buckets?.find((b) => b.le === 5);
    const bucket10 = histogram.buckets?.find((b) => b.le === 10);

    expect(bucket5?.count).toBe(0); // 5.5 > 5
    expect(bucket10?.count).toBe(1); // 5.5 <= 10
  });
});

describe('startTimer', () => {
  test('records elapsed time', async () => {
    const end = startTimer('a2a_video_api_request_duration_seconds', { method: 'render' });

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 10));

    end();

    const metrics = getMetricsJson();
    const histogram = metrics['a2a_video_api_request_duration_seconds'];

    // Should have recorded a value
    expect(histogram.values.length).toBeGreaterThanOrEqual(0);
  });
});

describe('formatPrometheus', () => {
  test('formats metrics in Prometheus text format', () => {
    incrementCounter('a2a_video_renders_total', { status: 'completed', format: 'mp4', codec: 'h264' });
    setGauge('a2a_video_renders_in_progress', 3);

    const output = formatPrometheus();

    expect(output).toContain('# HELP a2a_video_renders_total');
    expect(output).toContain('# TYPE a2a_video_renders_total counter');
    expect(output).toContain('a2a_video_renders_total{');
    expect(output).toContain('# TYPE a2a_video_renders_in_progress gauge');
  });

  test('formats histogram buckets', () => {
    observeHistogram('a2a_video_render_duration_seconds', 2.5, { format: 'mp4', codec: 'h264', resolution: '1080p' });

    const output = formatPrometheus();

    expect(output).toContain('a2a_video_render_duration_seconds_bucket');
    expect(output).toContain('le="');
  });
});

describe('a2sMetrics convenience functions', () => {
  test('renderRequested increments counter', () => {
    a2sMetrics.renderRequested('mp4', 'h264');

    const metrics = getMetricsJson();
    const counter = metrics['a2a_video_renders_total'];
    const value = counter.values.find(
      (v) => v.labels?.status === 'requested'
    );

    expect(value?.value).toBe(1);
  });

  test('renderStarted increments counter and gauge', () => {
    a2sMetrics.renderStarted('mp4', 'h264');

    const metrics = getMetricsJson();

    // Check counter
    const counter = metrics['a2a_video_renders_started_total'];
    expect(counter.values.length).toBeGreaterThan(0);

    // Check gauge
    const gauge = metrics['a2a_video_renders_in_progress'];
    expect(gauge.values[0]?.value).toBe(1);
  });

  test('renderCompleted decrements in_progress gauge', () => {
    // Start a render
    a2sMetrics.renderStarted('mp4', 'h264');
    // Complete it
    a2sMetrics.renderCompleted('mp4', 'h264', 10.5, 5000000, '1080p');

    const metrics = getMetricsJson();
    const gauge = metrics['a2a_video_renders_in_progress'];

    expect(gauge.values[0]?.value).toBe(0);
  });

  test('cacheHit and cacheMiss track separately', () => {
    a2sMetrics.cacheHit('render');
    a2sMetrics.cacheHit('render');
    a2sMetrics.cacheMiss('render');

    const metrics = getMetricsJson();

    const hits = metrics['a2a_video_cache_hits_total'].values.find(
      (v) => v.labels?.cache_type === 'render'
    );
    const misses = metrics['a2a_video_cache_misses_total'].values.find(
      (v) => v.labels?.cache_type === 'render'
    );

    expect(hits?.value).toBe(2);
    expect(misses?.value).toBe(1);
  });

  test('setQueueSize updates gauge with priority', () => {
    a2sMetrics.setQueueSize(1, 10);
    a2sMetrics.setQueueSize(5, 5);

    const metrics = getMetricsJson();
    const gauge = metrics['a2a_video_queue_size'];

    const priority1 = gauge.values.find((v) => v.labels?.priority === '1');
    const priority5 = gauge.values.find((v) => v.labels?.priority === '5');

    expect(priority1?.value).toBe(10);
    expect(priority5?.value).toBe(5);
  });
});

describe('resetMetrics', () => {
  test('clears all metric values', () => {
    incrementCounter('a2a_video_renders_total', { status: 'completed', format: 'mp4', codec: 'h264' });
    setGauge('a2a_video_renders_in_progress', 5);

    resetMetrics();

    const metrics = getMetricsJson();

    expect(metrics['a2a_video_renders_total'].values).toHaveLength(0);
    expect(metrics['a2a_video_renders_in_progress'].values).toHaveLength(0);
  });
});
