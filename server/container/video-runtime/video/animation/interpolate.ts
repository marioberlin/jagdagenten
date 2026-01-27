/**
 * Interpolation Functions
 *
 * Remotion-compatible interpolate() function for frame-based animations.
 * Maps input ranges to output ranges with optional easing.
 */

export type ExtrapolationType = 'clamp' | 'extend' | 'wrap' | 'identity';

export interface InterpolateOptions {
  easing?: (t: number) => number;
  extrapolateLeft?: ExtrapolationType;
  extrapolateRight?: ExtrapolationType;
}

/**
 * Interpolate a value from one range to another.
 * Remotion-compatible implementation.
 *
 * @param input - The input value (usually current frame)
 * @param inputRange - The input range [min, max]
 * @param outputRange - The output range [min, max]
 * @param options - Optional easing and extrapolation settings
 * @returns The interpolated output value
 *
 * @example
 * ```ts
 * // Fade in over 30 frames
 * const opacity = interpolate(frame, [0, 30], [0, 1]);
 *
 * // Move with easing
 * const x = interpolate(frame, [0, 60], [0, 500], {
 *   easing: Easing.outCubic,
 * });
 *
 * // Clamp at boundaries
 * const scale = interpolate(frame, [0, 30], [0.5, 1], {
 *   extrapolateLeft: 'clamp',
 *   extrapolateRight: 'clamp',
 * });
 * ```
 */
export function interpolate(
  input: number,
  inputRange: [number, number],
  outputRange: [number, number],
  options: InterpolateOptions = {}
): number {
  const { easing = (t) => t, extrapolateLeft = 'extend', extrapolateRight = 'extend' } = options;

  const [inputMin, inputMax] = inputRange;
  const [outputMin, outputMax] = outputRange;

  // Validate ranges
  if (inputMin >= inputMax) {
    throw new Error(`Invalid input range: [${inputMin}, ${inputMax}]. Min must be less than max.`);
  }

  // Normalize input to 0-1 range
  let progress = (input - inputMin) / (inputMax - inputMin);

  // Handle extrapolation for values outside input range
  if (progress < 0) {
    switch (extrapolateLeft) {
      case 'clamp':
        progress = 0;
        break;
      case 'identity':
        return input;
      case 'wrap':
        progress = 1 - (Math.abs(progress) % 1);
        break;
      case 'extend':
      default:
        // Continue with linear extrapolation
        break;
    }
  } else if (progress > 1) {
    switch (extrapolateRight) {
      case 'clamp':
        progress = 1;
        break;
      case 'identity':
        return input;
      case 'wrap':
        progress = progress % 1;
        break;
      case 'extend':
      default:
        // Continue with linear extrapolation
        break;
    }
  }

  // Apply easing function only to values within 0-1 range
  const easedProgress = progress >= 0 && progress <= 1 ? easing(progress) : progress;

  // Map to output range
  return outputMin + easedProgress * (outputMax - outputMin);
}

/**
 * Interpolate with multiple input/output ranges.
 * Creates piecewise linear interpolation.
 *
 * @example
 * ```ts
 * // Keyframe animation
 * const scale = interpolateMulti(frame,
 *   [0, 30, 60, 90],
 *   [1, 1.5, 0.8, 1]
 * );
 * ```
 */
export function interpolateMulti(
  input: number,
  inputRange: number[],
  outputRange: number[],
  options: InterpolateOptions = {}
): number {
  if (inputRange.length !== outputRange.length) {
    throw new Error('Input range and output range must have the same length');
  }
  if (inputRange.length < 2) {
    throw new Error('Ranges must have at least 2 values');
  }

  // Find the segment
  let i = 1;
  for (; i < inputRange.length; i++) {
    if (inputRange[i] > input) {
      break;
    }
  }

  // Clamp to valid segment
  i = Math.min(i, inputRange.length - 1);

  // Interpolate within segment
  return interpolate(
    input,
    [inputRange[i - 1], inputRange[i]],
    [outputRange[i - 1], outputRange[i]],
    options
  );
}

/**
 * Interpolate colors between two hex values.
 *
 * @example
 * ```ts
 * const color = interpolateColor(frame, [0, 60], ['#ff0000', '#0000ff']);
 * ```
 */
export function interpolateColor(
  input: number,
  inputRange: [number, number],
  colorRange: [string, string],
  options: InterpolateOptions = {}
): string {
  const [color1, color2] = colorRange;

  // Parse hex colors
  const parseHex = (hex: string): [number, number, number] => {
    const cleanHex = hex.replace('#', '');
    return [
      parseInt(cleanHex.substring(0, 2), 16),
      parseInt(cleanHex.substring(2, 4), 16),
      parseInt(cleanHex.substring(4, 6), 16),
    ];
  };

  const [r1, g1, b1] = parseHex(color1);
  const [r2, g2, b2] = parseHex(color2);

  const r = Math.round(interpolate(input, inputRange, [r1, r2], options));
  const g = Math.round(interpolate(input, inputRange, [g1, g2], options));
  const b = Math.round(interpolate(input, inputRange, [b1, b2], options));

  // Convert back to hex
  const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Map a value from one range to another (alias for interpolate with clamp).
 * Useful for quick mapping operations.
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return interpolate(value, [inMin, inMax], [outMin, outMax], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

/**
 * Create an interpolator function for repeated use.
 * More efficient when interpolating many values with same config.
 */
export function createInterpolator(
  inputRange: [number, number],
  outputRange: [number, number],
  options: InterpolateOptions = {}
): (input: number) => number {
  return (input: number) => interpolate(input, inputRange, outputRange, options);
}
