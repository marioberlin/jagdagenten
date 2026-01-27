/**
 * FFmpeg Video Overlay
 *
 * Builds FFmpeg filter_complex commands for compositing video overlays
 * directly during encoding - no intermediate frame extraction needed.
 */

import { spawn } from 'child_process';
import type { FFmpegProgress } from '../types.js';

// Re-define types here to avoid circular dependency
export interface VideoFilterDefinition {
  type: 'blur' | 'brightness' | 'contrast' | 'saturation' | 'hue' | 'grayscale' | 'sepia' | 'invert';
  value?: number;
}

export interface VideoOverlayDefinition {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  startFrame: number;
  endFrame?: number;
  zIndex?: number;
  volume?: number;
  muted?: boolean;
  loop?: boolean;
  playbackRate?: number;
  trim?: {
    start: number;
    end?: number;
  };
  fit?: 'contain' | 'cover' | 'fill' | 'none';
  opacity?: number;
  chromaKey?: {
    color: string;
    similarity?: number;
    blend?: number;
  };
  filters?: VideoFilterDefinition[];
}

export interface VideoOverlayOptions {
  /** Base video/image sequence input */
  baseInput: {
    type: 'frames' | 'video';
    path: string; // Pattern for frames (e.g., 'frame_%04d.png') or video file path
    fps: number;
  };
  /** Canvas dimensions */
  width: number;
  height: number;
  /** Total duration in frames */
  durationInFrames: number;
  /** Video overlays to composite */
  overlays: VideoOverlayDefinition[];
  /** Output settings */
  output: {
    path: string;
    codec?: 'h264' | 'h265' | 'vp8' | 'vp9' | 'prores';
    crf?: number;
    preset?: 'ultrafast' | 'fast' | 'medium' | 'slow' | 'veryslow';
  };
  /** Optional mixed audio track */
  audioPath?: string;
}

export interface VideoOverlayResult {
  outputPath: string;
  duration: number;
}

/**
 * Builds and executes FFmpeg filter_complex for video overlays.
 */
export class VideoOverlayProcessor {
  private ffmpegPath: string;

  constructor(ffmpegPath: string = 'ffmpeg') {
    this.ffmpegPath = ffmpegPath;
  }

  /**
   * Compose video overlays onto base video/frames.
   */
  async compose(
    options: VideoOverlayOptions,
    onProgress?: (progress: FFmpegProgress) => void
  ): Promise<VideoOverlayResult> {
    const { baseInput, width, height, durationInFrames, overlays, output, audioPath } = options;
    const fps = baseInput.fps;
    const totalDuration = durationInFrames / fps;

    // Sort overlays by zIndex
    const sortedOverlays = [...overlays].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));

    // Build FFmpeg command
    const args: string[] = ['-y'];

    // Input 0: Base video/frames
    if (baseInput.type === 'frames') {
      args.push('-framerate', String(fps), '-i', baseInput.path);
    } else {
      args.push('-i', baseInput.path);
    }

    // Inputs 1..N: Video overlays
    for (const overlay of sortedOverlays) {
      // Apply input options (trim, loop, speed)
      if (overlay.trim?.start !== undefined) {
        args.push('-ss', String(overlay.trim.start));
      }
      args.push('-i', overlay.src);
    }

    // Input N+1: Audio (if provided)
    const audioInputIndex = sortedOverlays.length + 1;
    if (audioPath) {
      args.push('-i', audioPath);
    }

    // Build filter_complex
    const filterComplex = this.buildFilterComplex(sortedOverlays, width, height, fps, durationInFrames);

    if (filterComplex) {
      args.push('-filter_complex', filterComplex);
      args.push('-map', '[vout]');
    } else {
      args.push('-map', '0:v');
    }

    // Map audio
    if (audioPath) {
      args.push('-map', `${audioInputIndex}:a`);
      args.push('-c:a', 'aac', '-b:a', '192k');
    }

    // Video codec settings
    const codec = output.codec || 'h264';
    args.push('-c:v', this.mapCodecName(codec));

    // Quality
    if (output.crf !== undefined) {
      args.push('-crf', String(output.crf));
    }

    // Preset
    if (codec === 'h264' || codec === 'h265') {
      args.push('-preset', output.preset || 'medium');
    }

    // Pixel format
    args.push('-pix_fmt', 'yuv420p');

    // Duration limit
    args.push('-t', String(totalDuration));

    // Output
    args.push(output.path);

    // Execute
    const result = await this.execute(args, onProgress, totalDuration);

    return {
      outputPath: output.path,
      duration: result.duration,
    };
  }

  /**
   * Build the filter_complex string for all overlays.
   */
  private buildFilterComplex(
    overlays: VideoOverlayDefinition[],
    canvasWidth: number,
    canvasHeight: number,
    fps: number,
    durationInFrames: number
  ): string | null {
    if (overlays.length === 0) {
      return null;
    }

    const filters: string[] = [];
    let currentOutput = '[0:v]';

    for (let i = 0; i < overlays.length; i++) {
      const overlay = overlays[i];
      const inputIndex = i + 1;
      const inputLabel = `[${inputIndex}:v]`;
      const outputLabel = i === overlays.length - 1 ? '[vout]' : `[v${i}]`;

      // Build filter chain for this overlay
      const overlayFilters = this.buildOverlayFilters(overlay, inputIndex, fps, durationInFrames);

      // Scale to fit
      const scaleFilter = this.buildScaleFilter(overlay, canvasWidth, canvasHeight);
      if (scaleFilter) {
        filters.push(`${inputLabel}${scaleFilter}[scaled${i}]`);
      }
      const scaledLabel = scaleFilter ? `[scaled${i}]` : inputLabel;

      // Apply video filters (brightness, contrast, etc.)
      let processedLabel = scaledLabel;
      if (overlayFilters.length > 0) {
        filters.push(`${scaledLabel}${overlayFilters.join(',')}[proc${i}]`);
        processedLabel = `[proc${i}]`;
      }

      // Build overlay filter with enable expression for timing
      const overlayFilter = this.buildOverlayFilter(overlay, fps, durationInFrames);
      filters.push(`${currentOutput}${processedLabel}${overlayFilter}${outputLabel}`);

      currentOutput = outputLabel;
    }

    return filters.join(';');
  }

  /**
   * Build scale filter for overlay.
   */
  private buildScaleFilter(
    overlay: VideoOverlayDefinition,
    _canvasWidth: number,
    _canvasHeight: number
  ): string | null {
    const targetWidth = overlay.width;
    const targetHeight = overlay.height;

    switch (overlay.fit) {
      case 'fill':
        return `scale=${targetWidth}:${targetHeight}`;
      case 'contain':
        return `scale='min(${targetWidth}/iw,${targetHeight}/ih)*iw':'min(${targetWidth}/iw,${targetHeight}/ih)*ih',pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2`;
      case 'cover':
        return `scale='max(${targetWidth}/iw,${targetHeight}/ih)*iw':'max(${targetWidth}/iw,${targetHeight}/ih)*ih',crop=${targetWidth}:${targetHeight}`;
      case 'none':
        return null;
      default:
        // Default to fill
        return `scale=${targetWidth}:${targetHeight}`;
    }
  }

  /**
   * Build video filter chain for an overlay.
   */
  private buildOverlayFilters(
    overlay: VideoOverlayDefinition,
    _inputIndex: number,
    fps: number,
    durationInFrames: number
  ): string[] {
    const filters: string[] = [];

    // Playback rate (setpts for video, atempo for audio)
    if (overlay.playbackRate && overlay.playbackRate !== 1) {
      filters.push(`setpts=PTS/${overlay.playbackRate}`);
    }

    // Loop if needed
    if (overlay.loop) {
      const overlayDurationFrames = (overlay.endFrame ?? durationInFrames) - (overlay.startFrame ?? 0);
      const overlayDurationSec = overlayDurationFrames / fps;
      filters.push(`loop=loop=-1:size=32767:start=0,trim=duration=${overlayDurationSec}`);
    }

    // Trim (duration limit)
    if (overlay.trim?.end !== undefined) {
      const duration = overlay.trim.end - (overlay.trim.start ?? 0);
      filters.push(`trim=duration=${duration}`);
    }

    // Chroma key (green screen)
    if (overlay.chromaKey) {
      const { color, similarity = 0.3, blend = 0.1 } = overlay.chromaKey;
      // Convert hex color to FFmpeg colorkey format
      const colorHex = color.replace('#', '0x');
      filters.push(`colorkey=${colorHex}:${similarity}:${blend}`);
    }

    // Opacity
    if (overlay.opacity !== undefined && overlay.opacity < 1) {
      filters.push(`format=rgba,colorchannelmixer=aa=${overlay.opacity}`);
    }

    // Additional filters
    if (overlay.filters) {
      for (const filter of overlay.filters) {
        const filterStr = this.mapVideoFilter(filter);
        if (filterStr) {
          filters.push(filterStr);
        }
      }
    }

    return filters;
  }

  /**
   * Build overlay filter with timing.
   */
  private buildOverlayFilter(
    overlay: VideoOverlayDefinition,
    fps: number,
    durationInFrames: number
  ): string {
    const startTime = (overlay.startFrame ?? 0) / fps;
    const endTime = (overlay.endFrame ?? durationInFrames) / fps;

    // Position
    const x = overlay.x;
    const y = overlay.y;

    // Enable expression for timing
    const enable = `between(t,${startTime},${endTime})`;

    return `overlay=${x}:${y}:enable='${enable}'`;
  }

  /**
   * Map video filter definition to FFmpeg filter string.
   */
  private mapVideoFilter(filter: VideoFilterDefinition): string | null {
    const value = filter.value ?? 1;
    switch (filter.type) {
      case 'blur':
        return `boxblur=${value}:${value}`;
      case 'brightness':
        return `eq=brightness=${(value - 1) * 0.5}`;
      case 'contrast':
        return `eq=contrast=${value}`;
      case 'saturation':
        return `eq=saturation=${value}`;
      case 'hue':
        return `hue=h=${value}`;
      case 'grayscale':
        return `colorchannelmixer=.3:.4:.3:0:.3:.4:.3:0:.3:.4:.3`;
      case 'sepia':
        return `colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131`;
      case 'invert':
        return `negate`;
      default:
        return null;
    }
  }

  /**
   * Map codec name to FFmpeg encoder.
   */
  private mapCodecName(codec: string): string {
    const codecMap: Record<string, string> = {
      h264: 'libx264',
      h265: 'libx265',
      vp8: 'libvpx',
      vp9: 'libvpx-vp9',
      prores: 'prores_ks',
    };
    return codecMap[codec] || 'libx264';
  }

  /**
   * Execute FFmpeg command.
   */
  private async execute(
    args: string[],
    onProgress?: (progress: FFmpegProgress) => void,
    totalDuration?: number
  ): Promise<{ exitCode: number; duration: number; stderr: string }> {
    return new Promise((resolve, reject) => {
      const fullArgs = ['-progress', 'pipe:1', ...args];

      const ffmpeg = spawn(this.ffmpegPath, fullArgs, {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let duration = totalDuration || 0;
      let currentTime = 0;
      let stderr = '';

      ffmpeg.stdout?.on('data', (data: Buffer) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
          if (line.startsWith('out_time_ms=')) {
            currentTime = parseInt(line.split('=')[1]) / 1000000;
            if (duration > 0 && onProgress) {
              onProgress({
                percent: Math.min(100, (currentTime / duration) * 100),
                currentTime,
                totalTime: duration,
              });
            }
          }
        }
      });

      ffmpeg.stderr?.on('data', (data: Buffer) => {
        const text = data.toString();
        stderr += text;

        // Parse duration if not provided
        if (!totalDuration) {
          const durationMatch = text.match(/Duration:\s*(\d+):(\d+):(\d+\.?\d*)/);
          if (durationMatch) {
            const [, h, m, s] = durationMatch;
            duration = parseInt(h) * 3600 + parseInt(m) * 60 + parseFloat(s);
          }
        }
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve({ exitCode: code, duration, stderr });
        } else {
          reject(new Error(`FFmpeg exited with code ${code}: ${stderr.slice(-1000)}`));
        }
      });

      ffmpeg.on('error', (err) => {
        reject(new Error(`Failed to start FFmpeg: ${err.message}`));
      });
    });
  }
}

/**
 * Helper to check if a composition has video overlays.
 */
export function hasVideoOverlays(overlays?: VideoOverlayDefinition[]): boolean {
  return Array.isArray(overlays) && overlays.length > 0;
}

/**
 * Extract audio tracks from video overlays (for mixing).
 */
export function extractAudioFromOverlays(
  overlays: VideoOverlayDefinition[],
  _fps: number
): Array<{ src: string; startFrame: number; endFrame?: number; volume?: number }> {
  return overlays
    .filter(o => !o.muted && o.volume !== 0)
    .map(o => ({
      src: o.src,
      startFrame: o.startFrame,
      endFrame: o.endFrame,
      volume: o.volume,
    }));
}
