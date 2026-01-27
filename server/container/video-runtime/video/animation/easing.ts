/**
 * Easing Functions
 *
 * Remotion-compatible easing functions for animations.
 * Standard easing curves plus custom bezier support.
 */

/**
 * Easing function type
 */
export type EasingFunction = (t: number) => number;

/**
 * Standard easing functions.
 * All functions take a number from 0-1 and return a number from 0-1.
 */
export const Easing = {
  // Linear
  linear: (t: number): number => t,

  // Quad (power of 2)
  inQuad: (t: number): number => t * t,
  outQuad: (t: number): number => t * (2 - t),
  inOutQuad: (t: number): number => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

  // Cubic (power of 3)
  inCubic: (t: number): number => t * t * t,
  outCubic: (t: number): number => --t * t * t + 1,
  inOutCubic: (t: number): number =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  // Quart (power of 4)
  inQuart: (t: number): number => t * t * t * t,
  outQuart: (t: number): number => 1 - --t * t * t * t,
  inOutQuart: (t: number): number => (t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t),

  // Quint (power of 5)
  inQuint: (t: number): number => t * t * t * t * t,
  outQuint: (t: number): number => 1 + --t * t * t * t * t,
  inOutQuint: (t: number): number =>
    t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t,

  // Sine
  inSin: (t: number): number => 1 - Math.cos((t * Math.PI) / 2),
  outSin: (t: number): number => Math.sin((t * Math.PI) / 2),
  inOutSin: (t: number): number => -(Math.cos(Math.PI * t) - 1) / 2,

  // Exponential
  inExpo: (t: number): number => (t === 0 ? 0 : Math.pow(2, 10 * (t - 1))),
  outExpo: (t: number): number => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inOutExpo: (t: number): number => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
    return (2 - Math.pow(2, -20 * t + 10)) / 2;
  },

  // Circular
  inCirc: (t: number): number => 1 - Math.sqrt(1 - t * t),
  outCirc: (t: number): number => Math.sqrt(1 - --t * t),
  inOutCirc: (t: number): number =>
    t < 0.5
      ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
      : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2,

  // Back (overshoot)
  inBack: (t: number): number => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  outBack: (t: number): number => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  inOutBack: (t: number): number => {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },

  // Elastic
  inElastic: (t: number): number => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    const c4 = (2 * Math.PI) / 3;
    return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  },
  outElastic: (t: number): number => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    const c4 = (2 * Math.PI) / 3;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  inOutElastic: (t: number): number => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    const c5 = (2 * Math.PI) / 4.5;
    return t < 0.5
      ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
      : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
  },

  // Bounce
  inBounce: (t: number): number => 1 - Easing.outBounce(1 - t),
  outBounce: (t: number): number => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
  inOutBounce: (t: number): number =>
    t < 0.5 ? (1 - Easing.outBounce(1 - 2 * t)) / 2 : (1 + Easing.outBounce(2 * t - 1)) / 2,

  /**
   * Cubic bezier easing function.
   * Compatible with CSS cubic-bezier() values.
   *
   * @example
   * ```ts
   * const customEase = Easing.bezier(0.25, 0.1, 0.25, 1);
   * const value = interpolate(frame, [0, 60], [0, 100], {
   *   easing: customEase,
   * });
   * ```
   */
  bezier: (x1: number, y1: number, x2: number, y2: number): EasingFunction => {
    // Validate control points
    if (x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1) {
      throw new Error('Bezier x values must be between 0 and 1');
    }

    // Compute coefficients
    const cx = 3 * x1;
    const bx = 3 * (x2 - x1) - cx;
    const ax = 1 - cx - bx;

    const cy = 3 * y1;
    const by = 3 * (y2 - y1) - cy;
    const ay = 1 - cy - by;

    const sampleCurveX = (t: number): number => ((ax * t + bx) * t + cx) * t;
    const sampleCurveY = (t: number): number => ((ay * t + by) * t + cy) * t;
    const sampleCurveDerivativeX = (t: number): number => (3 * ax * t + 2 * bx) * t + cx;

    // Find t for given x using Newton-Raphson iteration
    const solveCurveX = (x: number): number => {
      let t = x;
      for (let i = 0; i < 8; i++) {
        const xError = sampleCurveX(t) - x;
        if (Math.abs(xError) < 1e-6) {
          return t;
        }
        const derivative = sampleCurveDerivativeX(t);
        if (Math.abs(derivative) < 1e-6) {
          break;
        }
        t -= xError / derivative;
      }

      // Fall back to bisection
      let a = 0;
      let b = 1;
      t = x;
      while (a < b) {
        const xMid = sampleCurveX(t);
        if (Math.abs(xMid - x) < 1e-6) {
          return t;
        }
        if (x > xMid) {
          a = t;
        } else {
          b = t;
        }
        t = (a + b) / 2;
      }
      return t;
    };

    return (t: number): number => {
      if (t === 0 || t === 1) return t;
      return sampleCurveY(solveCurveX(t));
    };
  },

  /**
   * Steps easing function (like CSS steps()).
   *
   * @param steps - Number of steps
   * @param jumpTerm - When to jump: 'start', 'end', 'both', 'none'
   */
  steps: (
    steps: number,
    jumpTerm: 'start' | 'end' | 'both' | 'none' = 'end'
  ): EasingFunction => {
    return (t: number): number => {
      const progress = t * steps;

      switch (jumpTerm) {
        case 'start':
          return Math.ceil(progress) / steps;
        case 'end':
          return Math.floor(progress) / steps;
        case 'both':
          return (Math.floor(progress) + 1) / (steps + 1);
        case 'none':
          return Math.floor(progress) / (steps - 1);
        default:
          return Math.floor(progress) / steps;
      }
    };
  },
} as const;

// Common CSS timing function equivalents
export const CSSEasing = {
  ease: Easing.bezier(0.25, 0.1, 0.25, 1),
  easeIn: Easing.bezier(0.42, 0, 1, 1),
  easeOut: Easing.bezier(0, 0, 0.58, 1),
  easeInOut: Easing.bezier(0.42, 0, 0.58, 1),
  linear: Easing.linear,
} as const;

// Named bezier presets
export const BezierPresets = {
  // Material Design
  standard: Easing.bezier(0.4, 0, 0.2, 1),
  decelerate: Easing.bezier(0, 0, 0.2, 1),
  accelerate: Easing.bezier(0.4, 0, 1, 1),

  // Apple
  appleEase: Easing.bezier(0.4, 0, 0.6, 1),

  // Custom
  smooth: Easing.bezier(0.4, 0, 0.2, 1),
  snappy: Easing.bezier(0.4, 0, 0, 1),
  heavy: Easing.bezier(0.7, 0, 0.6, 1),
} as const;

export type EasingName = keyof typeof Easing;
export type CSSEasingName = keyof typeof CSSEasing;
export type BezierPresetName = keyof typeof BezierPresets;

/**
 * Get an easing function by name.
 */
export function getEasing(name: EasingName): EasingFunction {
  const fn = Easing[name];
  if (typeof fn === 'function') {
    return fn as EasingFunction;
  }
  throw new Error(`Unknown easing: ${name}`);
}
