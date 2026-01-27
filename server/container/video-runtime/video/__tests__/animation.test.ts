/**
 * Animation Function Tests
 */

import { describe, test, expect } from 'bun:test';
import { interpolate, interpolateMulti, interpolateColor } from '../animation/interpolate.js';
import { spring, measureSpring, SpringPresets } from '../animation/spring.js';
import { Easing } from '../animation/easing.js';

describe('interpolate', () => {
  test('basic interpolation', () => {
    expect(interpolate(0, [0, 100], [0, 1])).toBe(0);
    expect(interpolate(50, [0, 100], [0, 1])).toBe(0.5);
    expect(interpolate(100, [0, 100], [0, 1])).toBe(1);
  });

  test('extrapolate extend (default)', () => {
    expect(interpolate(-50, [0, 100], [0, 1])).toBe(-0.5);
    expect(interpolate(150, [0, 100], [0, 1])).toBe(1.5);
  });

  test('extrapolate clamp', () => {
    const result = interpolate(150, [0, 100], [0, 1], {
      extrapolateRight: 'clamp',
    });
    expect(result).toBe(1);

    const resultLeft = interpolate(-50, [0, 100], [0, 1], {
      extrapolateLeft: 'clamp',
    });
    expect(resultLeft).toBe(0);
  });

  test('extrapolate identity', () => {
    const result = interpolate(150, [0, 100], [0, 1], {
      extrapolateRight: 'identity',
    });
    expect(result).toBe(150);
  });

  test('with easing', () => {
    const result = interpolate(50, [0, 100], [0, 1], {
      easing: Easing.inQuad,
    });
    expect(result).toBe(0.25); // 0.5^2 = 0.25
  });

  test('reverse output range', () => {
    expect(interpolate(0, [0, 100], [100, 0])).toBe(100);
    expect(interpolate(100, [0, 100], [100, 0])).toBe(0);
  });

  test('throws on invalid input range', () => {
    expect(() => interpolate(50, [100, 100], [0, 1])).toThrow();
    expect(() => interpolate(50, [100, 0], [0, 1])).toThrow();
  });
});

describe('interpolateMulti', () => {
  test('keyframe interpolation', () => {
    // 0-30: 0->1, 30-60: 1->0.5, 60-90: 0.5->1
    expect(interpolateMulti(0, [0, 30, 60, 90], [0, 1, 0.5, 1])).toBe(0);
    expect(interpolateMulti(30, [0, 30, 60, 90], [0, 1, 0.5, 1])).toBe(1);
    expect(interpolateMulti(45, [0, 30, 60, 90], [0, 1, 0.5, 1])).toBe(0.75);
    expect(interpolateMulti(90, [0, 30, 60, 90], [0, 1, 0.5, 1])).toBe(1);
  });
});

describe('interpolateColor', () => {
  test('interpolates hex colors', () => {
    expect(interpolateColor(0, [0, 100], ['#ff0000', '#0000ff'])).toBe('#ff0000');
    expect(interpolateColor(100, [0, 100], ['#ff0000', '#0000ff'])).toBe('#0000ff');
  });

  test('interpolates mid-point', () => {
    const result = interpolateColor(50, [0, 100], ['#000000', '#ffffff']);
    // Should be around #808080 (gray)
    expect(result.toLowerCase()).toMatch(/^#[78][0-9a-f][78][0-9a-f][78][0-9a-f]$/);
  });
});

describe('spring', () => {
  test('returns 0 at frame 0', () => {
    const result = spring({ frame: 0, fps: 30 });
    expect(result).toBe(0);
  });

  test('approaches 1 over time', () => {
    const result = spring({ frame: 60, fps: 30 }); // 2 seconds
    expect(result).toBeGreaterThan(0.9);
    expect(result).toBeLessThanOrEqual(1.1); // May overshoot slightly
  });

  test('respects delay', () => {
    const result = spring({ frame: 0, fps: 30, delay: 15 });
    expect(result).toBe(0);

    const resultAfterDelay = spring({ frame: 15, fps: 30, delay: 15 });
    expect(resultAfterDelay).toBe(0);

    const resultDuring = spring({ frame: 30, fps: 30, delay: 15 });
    expect(resultDuring).toBeGreaterThan(0);
  });

  test('from/to range', () => {
    const result = spring({ frame: 60, fps: 30, from: 0, to: 100 });
    expect(result).toBeGreaterThan(90);
    expect(result).toBeLessThan(110);
  });

  test('different presets', () => {
    const wobbly = spring({ frame: 30, fps: 30, config: SpringPresets.wobbly });
    const stiff = spring({ frame: 30, fps: 30, config: SpringPresets.stiff });
    // Different configs should produce different values
    expect(Math.abs(wobbly - stiff)).toBeGreaterThan(0.01);
  });
});

describe('measureSpring', () => {
  test('measures spring duration', () => {
    const frames = measureSpring(SpringPresets.default, 30);
    expect(frames).toBeGreaterThan(30); // Should take more than 1 second
    expect(frames).toBeLessThan(300); // But less than 10 seconds
  });
});

describe('Easing', () => {
  test('linear', () => {
    expect(Easing.linear(0)).toBe(0);
    expect(Easing.linear(0.5)).toBe(0.5);
    expect(Easing.linear(1)).toBe(1);
  });

  test('inQuad', () => {
    expect(Easing.inQuad(0)).toBe(0);
    expect(Easing.inQuad(0.5)).toBe(0.25);
    expect(Easing.inQuad(1)).toBe(1);
  });

  test('outQuad', () => {
    expect(Easing.outQuad(0)).toBe(0);
    expect(Easing.outQuad(0.5)).toBe(0.75);
    expect(Easing.outQuad(1)).toBe(1);
  });

  test('bezier', () => {
    const ease = Easing.bezier(0.25, 0.1, 0.25, 1);
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
    expect(ease(0.5)).toBeGreaterThan(0.5); // ease-out effect
  });

  test('steps', () => {
    const stepEnd = Easing.steps(4, 'end');
    expect(stepEnd(0)).toBe(0);
    expect(stepEnd(0.25)).toBe(0.25);
    expect(stepEnd(0.26)).toBe(0.25);
    expect(stepEnd(0.5)).toBe(0.5);
  });
});
