/**
 * Unified FFmpeg Pipeline
 *
 * Auto-switching implementation that uses node-av when available,
 * falling back to child_process for maximum reliability.
 */

import { FFmpegChildProcess } from './child-process.js';
import type { FrameStitchOptions, FFmpegProgress, Codec } from '../types.js';

export interface UnifiedPipelineOptions {
  preferNodeAv?: boolean;
  ffmpegPath?: string;
  ffprobePath?: string;
}

/**
 * Unified FFmpeg pipeline with automatic fallback.
 */
export class FFmpegPipelineUnified {
  private childProcess: FFmpegChildProcess;
  private useNodeAv: boolean = false;
  private nodeAvAvailable: boolean | null = null;

  constructor(options: UnifiedPipelineOptions = {}) {
    const { preferNodeAv = true, ffmpegPath, ffprobePath } = options;
    this.childProcess = new FFmpegChildProcess(ffmpegPath, ffprobePath);
    this.useNodeAv = preferNodeAv;
  }

  /**
   * Initialize and check for node-av availability.
   */
  async initialize(): Promise<void> {
    if (this.useNodeAv) {
      this.nodeAvAvailable = await this.checkNodeAvAvailable();
      if (!this.nodeAvAvailable) {
        console.log('[FFmpeg] node-av not available, using child_process fallback');
        this.useNodeAv = false;
      } else {
        console.log('[FFmpeg] node-av available');
      }
    }
  }

  /**
   * Check if node-av is available.
   */
  private async checkNodeAvAvailable(): Promise<boolean> {
    try {
      // Dynamic import to avoid errors if not installed
      await import('node-av');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Stitch frames to video with automatic backend selection.
   */
  async stitchFrames(
    options: FrameStitchOptions,
    onProgress?: (progress: FFmpegProgress) => void
  ): Promise<{ outputPath: string; duration: number }> {
    if (this.useNodeAv && this.nodeAvAvailable) {
      try {
        return await this.stitchFramesNodeAv(options, onProgress);
      } catch (error) {
        console.warn('[FFmpeg] node-av failed, falling back to child_process:', error);
        this.useNodeAv = false;
      }
    }

    return this.childProcess.stitchFrames(options, onProgress);
  }

  /**
   * Stitch frames using node-av.
   */
  private async stitchFramesNodeAv(
    options: FrameStitchOptions,
    onProgress?: (progress: FFmpegProgress) => void
  ): Promise<{ outputPath: string; duration: number }> {
    // Note: This is a placeholder implementation.
    // In production, implement proper node-av pipeline.
    // For now, delegate to child_process.

    // The node-av API would look something like:
    // const { Pipeline } = await import('node-av');
    // const pipeline = new Pipeline();
    // pipeline.addInput({ type: 'image_sequence', pattern: options.inputPattern, frameRate: options.fps });
    // ... configure encoder, output
    // const result = await pipeline.run();

    console.log('[FFmpeg] Using node-av pipeline (delegating to child_process for now)');
    return this.childProcess.stitchFrames(options, onProgress);
  }

  /**
   * Extract frames from video.
   */
  async extractFrames(
    inputPath: string,
    outputPattern: string,
    fps?: number
  ): Promise<string[]> {
    return this.childProcess.extractFrames(inputPath, outputPattern, fps);
  }

  /**
   * Trim video.
   */
  async trim(
    inputPath: string,
    outputPath: string,
    startSeconds?: number,
    endSeconds?: number,
    codec?: Codec
  ): Promise<{ outputPath: string; duration: number }> {
    return this.childProcess.trim(inputPath, outputPath, startSeconds, endSeconds, codec);
  }

  /**
   * Concatenate videos.
   */
  async concat(
    inputPaths: string[],
    outputPath: string,
    codec?: Codec
  ): Promise<{ outputPath: string; duration: number }> {
    return this.childProcess.concat(inputPaths, outputPath, codec);
  }

  /**
   * Add audio to video.
   */
  async addAudio(
    videoPath: string,
    audioPath: string,
    outputPath: string,
    options?: {
      replaceAudio?: boolean;
      audioVolume?: number;
      audioDelay?: number;
    }
  ): Promise<{ outputPath: string; duration: number }> {
    return this.childProcess.addAudio(videoPath, audioPath, outputPath, options);
  }

  /**
   * Convert to GIF.
   */
  async toGif(
    inputPath: string,
    outputPath: string,
    options?: {
      fps?: number;
      width?: number;
      loop?: number;
    }
  ): Promise<{ outputPath: string; duration: number }> {
    return this.childProcess.toGif(inputPath, outputPath, options);
  }

  /**
   * Get the current backend being used.
   */
  getBackend(): 'node-av' | 'child_process' {
    return this.useNodeAv ? 'node-av' : 'child_process';
  }

  /**
   * Force a specific backend.
   */
  setBackend(backend: 'node-av' | 'child_process'): void {
    this.useNodeAv = backend === 'node-av' && this.nodeAvAvailable === true;
  }
}

/**
 * Create a unified pipeline with optional initialization.
 */
export async function createFFmpegPipeline(
  options?: UnifiedPipelineOptions
): Promise<FFmpegPipelineUnified> {
  const pipeline = new FFmpegPipelineUnified(options);
  await pipeline.initialize();
  return pipeline;
}
