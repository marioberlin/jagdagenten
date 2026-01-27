/**
 * Spring Physics Animation
 *
 * Remotion-compatible spring() function for physics-based animations.
 * Implements damped harmonic oscillator for natural motion.
 */

export interface SpringConfig {
  mass?: number;
  damping?: number;
  stiffness?: number;
  overshootClamping?: boolean;
}

export interface SpringOptions {
  frame: number;
  fps: number;
  config?: SpringConfig;
  durationInFrames?: number;
  delay?: number;
  from?: number;
  to?: number;
}

// Presets matching Remotion's spring presets
export const SpringPresets = {
  default: { mass: 1, damping: 10, stiffness: 100 },
  gentle: { mass: 1, damping: 15, stiffness: 80 },
  wobbly: { mass: 1, damping: 8, stiffness: 180 },
  stiff: { mass: 1, damping: 20, stiffness: 200 },
  slow: { mass: 1, damping: 20, stiffness: 50 },
  molasses: { mass: 1, damping: 25, stiffness: 40 },
} as const;

export type SpringPresetName = keyof typeof SpringPresets;

/**
 * Spring animation function.
 * Returns a value from 0 to 1 (or from/to if specified) based on spring physics.
 *
 * @param options - Spring animation options
 * @returns The animated value at the given frame
 *
 * @example
 * ```ts
 * // Basic spring animation
 * const scale = spring({
 *   frame: currentFrame,
 *   fps: 30,
 * });
 *
 * // With custom config
 * const y = spring({
 *   frame: currentFrame,
 *   fps: 30,
 *   config: { mass: 1, damping: 15, stiffness: 100 },
 *   from: 0,
 *   to: 500,
 * });
 *
 * // With delay
 * const opacity = spring({
 *   frame: currentFrame,
 *   fps: 30,
 *   delay: 15,
 * });
 * ```
 */
export function spring(options: SpringOptions): number {
  const {
    frame,
    fps,
    config = SpringPresets.default,
    delay = 0,
    from = 0,
    to = 1,
  } = options;

  const { mass = 1, damping = 10, stiffness = 100, overshootClamping = false } = config as SpringConfig;

  // Apply delay
  const adjustedFrame = frame - delay;
  if (adjustedFrame < 0) {
    return from;
  }

  // Convert frame to time
  const time = adjustedFrame / fps;

  // Damped harmonic oscillator parameters
  const omega = Math.sqrt(stiffness / mass); // Natural frequency
  const zeta = damping / (2 * Math.sqrt(stiffness * mass)); // Damping ratio

  let progress: number;

  if (zeta < 1) {
    // Underdamped (oscillates)
    const omegaD = omega * Math.sqrt(1 - zeta * zeta); // Damped frequency
    progress =
      1 -
      Math.exp(-zeta * omega * time) *
        (Math.cos(omegaD * time) + ((zeta * omega) / omegaD) * Math.sin(omegaD * time));
  } else if (zeta === 1) {
    // Critically damped (fastest without oscillation)
    progress = 1 - Math.exp(-omega * time) * (1 + omega * time);
  } else {
    // Overdamped (slow approach)
    const s1 = -omega * (zeta + Math.sqrt(zeta * zeta - 1));
    const s2 = -omega * (zeta - Math.sqrt(zeta * zeta - 1));
    progress = 1 - (s2 * Math.exp(s1 * time) - s1 * Math.exp(s2 * time)) / (s2 - s1);
  }

  // Apply overshoot clamping if enabled
  if (overshootClamping) {
    progress = Math.max(0, Math.min(1, progress));
  }

  // Map to from/to range
  return from + progress * (to - from);
}

/**
 * Create a spring with a preset configuration.
 */
export function springWithPreset(
  frame: number,
  fps: number,
  preset: SpringPresetName,
  options: Omit<SpringOptions, 'frame' | 'fps' | 'config'> = {}
): number {
  return spring({
    frame,
    fps,
    config: SpringPresets[preset],
    ...options,
  });
}

/**
 * Calculate when a spring animation will be "settled" (within tolerance of target).
 * Useful for determining durationInFrames.
 *
 * @param config - Spring configuration
 * @param fps - Frames per second
 * @param tolerance - How close to 1 is considered "settled" (default 0.001)
 * @returns Number of frames until settled
 */
export function measureSpring(
  config: SpringConfig = SpringPresets.default,
  fps: number = 30,
  tolerance: number = 0.001
): number {
  let frame = 0;
  const maxFrames = fps * 60; // Max 60 seconds

  while (frame < maxFrames) {
    const value = spring({ frame, fps, config });
    if (Math.abs(1 - value) < tolerance) {
      // Check that it stays settled for a few more frames
      let settled = true;
      for (let i = 1; i <= 5; i++) {
        const futureValue = spring({ frame: frame + i, fps, config });
        if (Math.abs(1 - futureValue) >= tolerance) {
          settled = false;
          break;
        }
      }
      if (settled) {
        return frame;
      }
    }
    frame++;
  }

  return maxFrames;
}

/**
 * Chain multiple spring animations with delays.
 *
 * @example
 * ```ts
 * const [scale, opacity, x] = springSequence(frame, fps, [
 *   { config: SpringPresets.wobbly },
 *   { config: SpringPresets.gentle, delay: 10 },
 *   { config: SpringPresets.stiff, delay: 20 },
 * ]);
 * ```
 */
export function springSequence(
  frame: number,
  fps: number,
  configs: Array<Omit<SpringOptions, 'frame' | 'fps'>>
): number[] {
  return configs.map((config) => spring({ frame, fps, ...config }));
}
