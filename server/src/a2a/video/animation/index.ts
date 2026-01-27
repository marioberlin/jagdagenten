/**
 * Animation Module
 *
 * Remotion-compatible animation functions.
 */

export {
  interpolate,
  interpolateMulti,
  interpolateColor,
  mapRange,
  createInterpolator,
  type ExtrapolationType,
  type InterpolateOptions,
} from './interpolate.js';

export {
  spring,
  springWithPreset,
  measureSpring,
  springSequence,
  SpringPresets,
  type SpringConfig,
  type SpringOptions,
  type SpringPresetName,
} from './spring.js';

export {
  Easing,
  CSSEasing,
  BezierPresets,
  getEasing,
  type EasingFunction,
  type EasingName,
  type CSSEasingName,
  type BezierPresetName,
} from './easing.js';
