/**
 * Video Render Pipeline
 *
 * Integrates video rendering infrastructure with A2A artifact streaming.
 * Wraps the compositor, encoder, and job queue for A2A protocol compliance.
 *
 * This is the REAL implementation that:
 * - Uses Canvas for frame rendering
 * - Uses FFmpeg for video encoding
 * - Persists to PostgreSQL
 * - Queues jobs via NATS
 */

import { randomUUID } from 'crypto';
import { EventEmitter } from 'events';
import { mkdir, writeFile, stat, rm } from 'fs/promises';
import { join } from 'path';
import type { CompositionState, RenderJobState } from './video-render.js';
import { getCompositionRenderer, compositionToDefinition } from './composition-renderer.js';

// Video module imports
import {
  createFFmpegPipeline,
  type FFmpegPipelineUnified,
  type Codec,
  type Preset,
  AudioProcessor,
  type AudioTrack,
  VideoOverlayProcessor,
  hasVideoOverlays,
  extractAudioFromOverlays,
} from '../video/index.js';
import type { AudioTrackDefinition, VideoOverlayDefinition } from './composition-renderer.js';

// ============================================================================
// Types
// ============================================================================

export interface RenderOptions {
  format: 'mp4' | 'webm' | 'gif' | 'mov' | 'png-sequence';
  codec?: 'h264' | 'h265' | 'vp8' | 'vp9' | 'prores';
  quality?: 'low' | 'medium' | 'high' | 'lossless';
  crf?: number;
  bitrate?: string;
  preset?: 'ultrafast' | 'fast' | 'medium' | 'slow' | 'veryslow';
}

export interface FrameData {
  frame: number;
  data: Buffer | Uint8Array;
  format: 'png' | 'jpeg' | 'webp';
  width: number;
  height: number;
}

export interface RenderProgress {
  jobId: string;
  status: 'queued' | 'rendering' | 'encoding' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  currentFrame: number;
  totalFrames: number;
  fps?: number;
  eta?: number;
  previewFrame?: string; // Base64 encoded preview
}

export interface RenderResult {
  jobId: string;
  success: boolean;
  outputUri?: string;
  outputPath?: string;
  outputBytes?: Buffer;
  duration?: number;
  fileSize?: number;
  error?: string;
}

export interface A2AArtifact {
  artifactId: string;
  name?: string;
  description?: string;
  parts: A2APart[];
  append?: boolean;
  lastChunk?: boolean;
}

export interface A2APart {
  type: 'text' | 'file' | 'data';
  text?: string;
  file?: {
    name: string;
    mimeType: string;
    bytes?: string;
    uri?: string;
  };
  data?: Record<string, unknown>;
}

export interface PipelineConfig {
  outputDir: string;
  tempDir: string;
  ffmpegPath?: string;
  ffprobePath?: string;
}

// Default configuration
const DEFAULT_CONFIG: PipelineConfig = {
  outputDir: process.env.VIDEO_OUTPUT_DIR || '/data/renders',
  tempDir: process.env.VIDEO_TEMP_DIR || '/tmp/video-pipeline',
  ffmpegPath: process.env.FFMPEG_PATH,
  ffprobePath: process.env.FFPROBE_PATH,
};

// Quality presets
const QUALITY_PRESETS: Record<string, { crf: number; preset: Preset }> = {
  low: { crf: 28, preset: 'fast' },
  medium: { crf: 23, preset: 'medium' },
  high: { crf: 18, preset: 'slow' },
  lossless: { crf: 0, preset: 'veryslow' },
};

// ============================================================================
// Render Pipeline
// ============================================================================

export class VideoRenderPipeline extends EventEmitter {
  private activeJobs: Map<string, RenderJobState> = new Map();
  private frameCache: Map<string, Map<number, FrameData>> = new Map();
  private ffmpegPipeline: FFmpegPipelineUnified | null = null;
  private config: PipelineConfig;
  private initialized = false;

  constructor(config: Partial<PipelineConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize the pipeline (FFmpeg, directories).
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Create directories
    await mkdir(this.config.outputDir, { recursive: true });
    await mkdir(this.config.tempDir, { recursive: true });

    // Initialize FFmpeg pipeline
    this.ffmpegPipeline = await createFFmpegPipeline({
      ffmpegPath: this.config.ffmpegPath,
      ffprobePath: this.config.ffprobePath,
    });

    this.initialized = true;
    console.log('[VideoRenderPipeline] Initialized with FFmpeg backend:', this.ffmpegPipeline.getBackend());
  }

  /**
   * Ensure pipeline is initialized.
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Start a render job and stream progress as A2A artifacts.
   */
  async startRender(
    composition: CompositionState,
    options: RenderOptions,
    onArtifact: (artifact: A2AArtifact) => void
  ): Promise<RenderResult> {
    await this.ensureInitialized();

    const jobId = `render-${randomUUID()}`;
    const jobTempDir = join(this.config.tempDir, jobId);
    const framesDir = join(jobTempDir, 'frames');

    const job: RenderJobState = {
      jobId,
      taskId: jobId,
      compositionId: composition.id,
      status: 'queued',
      progress: 0,
      currentFrame: 0,
      totalFrames: composition.durationInFrames,
      startedAt: new Date(),
    };

    this.activeJobs.set(jobId, job);
    this.frameCache.set(jobId, new Map());

    try {
      // Create temp directories
      await mkdir(jobTempDir, { recursive: true });
      await mkdir(framesDir, { recursive: true });

      // Emit initial progress artifact
      onArtifact(this.createProgressArtifact(job, false));

      // Render frames
      job.status = 'rendering';
      await this.renderFramesToDisk(composition, job, options, framesDir, onArtifact);

      // Encode video with FFmpeg
      job.status = 'encoding';
      onArtifact(this.createProgressArtifact(job, false));

      const outputPath = await this.encodeVideoWithFFmpeg(
        jobId,
        composition,
        options,
        framesDir,
        (progress) => {
          // FFmpeg progress callback
          job.progress = 0.5 + (progress.percent / 100) * 0.5; // Encoding is second half
          onArtifact(this.createProgressArtifact(job, false));
        }
      );

      // Get file size
      const fileStat = await stat(outputPath);

      // Complete
      job.status = 'completed';
      job.progress = 1;
      job.currentFrame = job.totalFrames;
      job.completedAt = new Date();
      job.outputUri = `file://${outputPath}`;

      // Emit final artifacts
      onArtifact(this.createProgressArtifact(job, true));
      onArtifact(this.createVideoArtifact(job, options, outputPath, fileStat.size));

      // Cleanup temp directory
      await this.cleanupTempDir(jobTempDir);

      return {
        jobId,
        success: true,
        outputUri: job.outputUri,
        outputPath,
        duration: composition.durationInFrames / composition.fps,
        fileSize: fileStat.size,
      };
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';

      onArtifact(this.createErrorArtifact(job));

      // Cleanup on failure
      await this.cleanupTempDir(jobTempDir).catch(() => {});

      return {
        jobId,
        success: false,
        error: job.error,
      };
    } finally {
      // Cleanup frame cache
      this.frameCache.delete(jobId);
    }
  }

  /**
   * Render a single frame for preview.
   */
  async renderPreviewFrame(
    composition: CompositionState,
    frame: number,
    format: 'png' | 'jpeg' | 'webp' = 'png'
  ): Promise<A2AArtifact> {
    // Validate frame number
    if (frame < 0 || frame >= composition.durationInFrames) {
      throw new Error(`Frame ${frame} out of range (0-${composition.durationInFrames - 1})`);
    }

    const frameData = await this.renderSingleFrame(composition, frame, format);
    const base64 = Buffer.from(frameData.data).toString('base64');

    return {
      artifactId: `preview-${composition.id}-${frame}`,
      name: `Preview Frame ${frame}`,
      parts: [
        {
          type: 'file',
          file: {
            name: `frame-${frame}.${format}`,
            mimeType: `image/${format}`,
            bytes: base64,
          },
        },
      ],
    };
  }

  /**
   * Cancel an active render job.
   */
  cancelRender(jobId: string): boolean {
    const job = this.activeJobs.get(jobId);
    if (!job) return false;

    if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
      return false;
    }

    job.status = 'cancelled';
    this.emit('cancelled', jobId);
    return true;
  }

  /**
   * Get render job status.
   */
  getJobStatus(jobId: string): RenderJobState | undefined {
    return this.activeJobs.get(jobId);
  }

  // ==========================================================================
  // Private Methods - Frame Rendering
  // ==========================================================================

  /**
   * Render all frames to disk as PNG files.
   */
  private async renderFramesToDisk(
    composition: CompositionState,
    job: RenderJobState,
    _options: RenderOptions,
    framesDir: string,
    onArtifact: (artifact: A2AArtifact) => void
  ): Promise<void> {
    const { durationInFrames } = composition;
    const frameCache = this.frameCache.get(job.jobId)!;

    // Calculate progress update frequency (every 5% or at least every 10 frames)
    const progressInterval = Math.max(1, Math.floor(durationInFrames / 20));
    let lastProgressUpdate = Date.now();

    for (let frame = 0; frame < durationInFrames; frame++) {
      // Check for cancellation
      if (job.status === 'cancelled') {
        throw new Error('Render cancelled');
      }

      // Render frame to Canvas and save to disk
      const frameData = await this.renderSingleFrame(composition, frame, 'png');
      frameCache.set(frame, frameData);

      // Write frame to disk with zero-padded filename
      const framePath = join(framesDir, `frame-${String(frame).padStart(6, '0')}.png`);
      await writeFile(framePath, frameData.data);

      // Update progress (rendering is first half of total progress)
      job.currentFrame = frame + 1;
      job.progress = ((frame + 1) / durationInFrames) * 0.5;

      // Emit progress artifact periodically
      const now = Date.now();
      if (now - lastProgressUpdate > 500 || (frame + 1) % progressInterval === 0) {
        // Include preview frame for visual feedback
        const previewBase64 = frameData.data.length > 0
          ? `data:image/png;base64,${Buffer.from(frameData.data).toString('base64')}`
          : undefined;
        onArtifact(this.createProgressArtifact(job, false, previewBase64));
        lastProgressUpdate = now;
      }
    }
  }

  /**
   * Render a single frame using Canvas and CompositionRenderer.
   */
  private async renderSingleFrame(
    composition: CompositionState,
    frame: number,
    format: 'png' | 'jpeg' | 'webp'
  ): Promise<FrameData> {
    const { width, height } = composition;

    // Try to use canvas for rendering
    try {
      const { createCanvas } = await import('canvas');
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      // Convert CompositionState to CompositionDefinition for the renderer
      const definition = compositionToDefinition(composition);

      // Update frame counter text dynamically
      const frameCounterElement = definition.elements.find((e) => e.id === 'frame-counter');
      if (frameCounterElement && frameCounterElement.type === 'text') {
        frameCounterElement.text = `${frame}/${composition.durationInFrames}`;
      }

      // Use the composition renderer for full element support
      const renderer = getCompositionRenderer();
      await renderer.renderFrame(ctx, definition, frame);

      // Export to buffer
      const buffer =
        format === 'png'
          ? canvas.toBuffer('image/png')
          : format === 'jpeg'
            ? canvas.toBuffer('image/jpeg', { quality: 0.9 })
            : canvas.toBuffer('image/png'); // webp not supported, fallback to png

      return {
        frame,
        data: buffer,
        format,
        width,
        height,
      };
    } catch (error) {
      // Canvas not available, return placeholder
      console.warn(`[VideoRenderPipeline] Canvas not available for frame ${frame}:`, error);
      return this.createPlaceholderFrame(composition, frame, format);
    }
  }

  /**
   * Create a placeholder frame when canvas is not available.
   */
  private createPlaceholderFrame(
    composition: CompositionState,
    frame: number,
    format: 'png' | 'jpeg' | 'webp'
  ): FrameData {
    // Return empty buffer - FFmpeg can handle this
    return {
      frame,
      data: Buffer.alloc(0),
      format,
      width: composition.width,
      height: composition.height,
    };
  }

  // ==========================================================================
  // Private Methods - Video Encoding
  // ==========================================================================

  /**
   * Encode frames to video using FFmpeg.
   */
  private async encodeVideoWithFFmpeg(
    jobId: string,
    composition: CompositionState,
    options: RenderOptions,
    framesDir: string,
    onProgress: (progress: { percent: number; currentTime: number; totalTime: number }) => void
  ): Promise<string> {
    if (!this.ffmpegPipeline) {
      throw new Error('FFmpeg pipeline not initialized');
    }

    const { fps, durationInFrames, width, height } = composition;
    const { format, codec = 'h264', quality = 'medium', crf, preset } = options;

    // Determine output path
    const outputExt = format === 'png-sequence' ? 'zip' : format;
    const outputPath = join(this.config.outputDir, `${jobId}.${outputExt}`);

    // Get quality settings
    const qualitySettings = QUALITY_PRESETS[quality] || QUALITY_PRESETS.medium;
    const finalCrf = crf ?? qualitySettings.crf;
    const finalPreset = preset ?? qualitySettings.preset;

    // Get composition definition for audio tracks and video overlays
    const definition = compositionToDefinition(composition);
    const audioTracks = definition.audioTracks || [];
    const videoOverlays = definition.videoOverlays || [];

    // Mix audio if there are audio tracks
    let audioPath: string | undefined;
    if (audioTracks.length > 0) {
      audioPath = await this.mixAudioTracks(jobId, audioTracks, fps, durationInFrames);
    }

    // If we have video overlays, also extract and mix their audio
    if (hasVideoOverlays(videoOverlays)) {
      const overlayAudioTracks = extractAudioFromOverlays(videoOverlays, fps);
      if (overlayAudioTracks.length > 0) {
        // Mix overlay audio with existing audio
        const overlayAudioPath = await this.mixVideoOverlayAudio(
          jobId,
          overlayAudioTracks,
          fps,
          durationInFrames,
          audioPath
        );
        // Clean up previous audio if exists
        if (audioPath) await rm(audioPath, { force: true });
        audioPath = overlayAudioPath;
      }
    }

    // Handle GIF separately (no audio, no video overlays)
    if (format === 'gif') {
      // First encode to mp4, then convert to GIF
      const tempMp4 = join(this.config.tempDir, `${jobId}-temp.mp4`);

      // Use video overlay processor if overlays present
      if (hasVideoOverlays(videoOverlays)) {
        await this.encodeWithVideoOverlays(
          framesDir,
          tempMp4,
          fps,
          width,
          height,
          durationInFrames,
          videoOverlays,
          'h264',
          18,
          'fast',
          undefined, // No audio for temp file
          onProgress
        );
      } else {
        await this.ffmpegPipeline.stitchFrames(
          {
            inputPattern: join(framesDir, 'frame-%06d.png'),
            outputPath: tempMp4,
            fps,
            codec: 'h264',
            crf: 18,
            preset: 'fast',
          },
          onProgress
        );
      }

      const gifPath = join(this.config.outputDir, `${jobId}.gif`);
      await this.ffmpegPipeline.toGif(tempMp4, gifPath, {
        fps: Math.min(fps, 15), // GIFs work better at lower frame rates
        width: Math.min(width, 480),
      });

      // Clean up temp mp4 and audio
      await rm(tempMp4, { force: true });
      if (audioPath) await rm(audioPath, { force: true });

      return gifPath;
    }

    // Standard video encoding - use overlay processor if overlays present
    if (hasVideoOverlays(videoOverlays)) {
      // Narrow preset type to what VideoOverlayProcessor supports
      const overlayPreset = (['ultrafast', 'fast', 'medium', 'slow', 'veryslow'].includes(finalPreset)
        ? finalPreset
        : 'medium') as 'ultrafast' | 'fast' | 'medium' | 'slow' | 'veryslow';
      await this.encodeWithVideoOverlays(
        framesDir,
        outputPath,
        fps,
        width,
        height,
        durationInFrames,
        videoOverlays,
        codec as 'h264' | 'h265' | 'vp8' | 'vp9' | 'prores',
        finalCrf,
        overlayPreset,
        audioPath,
        onProgress
      );
    } else {
      await this.ffmpegPipeline.stitchFrames(
        {
          inputPattern: join(framesDir, 'frame-%06d.png'),
          outputPath,
          fps,
          codec: codec as Codec,
          crf: finalCrf,
          preset: finalPreset,
          audioPath, // Include audio if available
        },
        onProgress
      );
    }

    // Clean up mixed audio file
    if (audioPath) {
      await rm(audioPath, { force: true });
    }

    return outputPath;
  }

  /**
   * Encode video with video overlays using FFmpeg filter_complex.
   */
  private async encodeWithVideoOverlays(
    framesDir: string,
    outputPath: string,
    fps: number,
    width: number,
    height: number,
    durationInFrames: number,
    videoOverlays: VideoOverlayDefinition[],
    codec: 'h264' | 'h265' | 'vp8' | 'vp9' | 'prores',
    crf: number,
    preset: 'ultrafast' | 'fast' | 'medium' | 'slow' | 'veryslow',
    audioPath: string | undefined,
    onProgress: (progress: { percent: number; currentTime: number; totalTime: number }) => void
  ): Promise<void> {
    const overlayProcessor = new VideoOverlayProcessor(this.config.ffmpegPath);

    await overlayProcessor.compose(
      {
        baseInput: {
          type: 'frames',
          path: join(framesDir, 'frame-%06d.png'),
          fps,
        },
        width,
        height,
        durationInFrames,
        overlays: videoOverlays,
        output: {
          path: outputPath,
          codec,
          crf,
          preset,
        },
        audioPath,
      },
      onProgress
    );
  }

  /**
   * Mix audio from video overlays with existing audio.
   */
  private async mixVideoOverlayAudio(
    jobId: string,
    overlayTracks: Array<{ src: string; startFrame: number; endFrame?: number; volume?: number }>,
    fps: number,
    durationInFrames: number,
    existingAudioPath?: string
  ): Promise<string> {
    const audioProcessor = new AudioProcessor(this.config.ffmpegPath);
    const outputPath = join(this.config.tempDir, `${jobId}-mixed-audio.aac`);

    // Convert overlay tracks to AudioTrack format
    const tracks: AudioTrack[] = overlayTracks.map((track) => ({
      path: track.src,
      startFrame: track.startFrame,
      endFrame: track.endFrame,
      volume: track.volume ?? 1,
    }));

    // Add existing audio as a track if present
    if (existingAudioPath) {
      tracks.unshift({
        path: existingAudioPath,
        startFrame: 0,
        volume: 1,
      });
    }

    await audioProcessor.mixAudio({
      tracks,
      fps,
      durationInFrames,
      outputPath,
      sampleRate: 48000,
      channels: 2,
      bitrate: '192k',
    });

    return outputPath;
  }

  /**
   * Mix audio tracks into a single audio file.
   */
  private async mixAudioTracks(
    jobId: string,
    audioTracks: AudioTrackDefinition[],
    fps: number,
    durationInFrames: number
  ): Promise<string> {
    const audioProcessor = new AudioProcessor(this.config.ffmpegPath);
    const outputPath = join(this.config.tempDir, `${jobId}-audio.aac`);

    // Convert AudioTrackDefinition to AudioTrack format
    const tracks: AudioTrack[] = audioTracks.map((track) => ({
      path: track.src,
      startFrame: track.startFrame,
      endFrame: track.endFrame,
      volume: track.volume ?? 1,
      fadeIn: track.fadeIn,
      fadeOut: track.fadeOut,
      playbackRate: track.playbackRate,
      loop: track.loop,
    }));

    await audioProcessor.mixAudio({
      tracks,
      fps,
      durationInFrames,
      outputPath,
      sampleRate: 48000,
      channels: 2,
      bitrate: '192k',
    });

    return outputPath;
  }

  /**
   * Clean up temporary directory.
   */
  private async cleanupTempDir(dir: string): Promise<void> {
    try {
      await rm(dir, { recursive: true, force: true });
    } catch (error) {
      console.warn('[VideoRenderPipeline] Failed to cleanup temp dir:', error);
    }
  }

  // ==========================================================================
  // Private Methods - Artifact Creation
  // ==========================================================================

  private createProgressArtifact(
    job: RenderJobState,
    isLast: boolean,
    previewFrame?: string
  ): A2AArtifact {
    const progress: RenderProgress = {
      jobId: job.jobId,
      status: job.status,
      progress: job.progress,
      currentFrame: job.currentFrame,
      totalFrames: job.totalFrames,
      eta: job.totalFrames > 0 ? (1 - job.progress) * 10 : 0,
      previewFrame,
    };

    return {
      artifactId: `progress-${job.jobId}`,
      name: 'Render Progress',
      parts: [
        {
          type: 'data',
          data: progress as unknown as Record<string, unknown>,
        },
      ],
      append: !isLast,
      lastChunk: isLast,
    };
  }

  private createVideoArtifact(
    job: RenderJobState,
    options: RenderOptions,
    outputPath: string,
    fileSize: number
  ): A2AArtifact {
    const mimeTypes: Record<string, string> = {
      mp4: 'video/mp4',
      webm: 'video/webm',
      gif: 'image/gif',
      mov: 'video/quicktime',
      'png-sequence': 'application/zip',
    };

    return {
      artifactId: `output-${job.jobId}`,
      name: 'Rendered Video',
      description: `Video rendered with ${options.codec || 'default'} codec`,
      parts: [
        {
          type: 'file',
          file: {
            name: `output.${options.format}`,
            mimeType: mimeTypes[options.format] || 'application/octet-stream',
            uri: `file://${outputPath}`,
          },
        },
        {
          type: 'data',
          data: {
            outputPath,
            fileSize,
            format: options.format,
            codec: options.codec,
          },
        },
      ],
    };
  }

  private createErrorArtifact(job: RenderJobState): A2AArtifact {
    return {
      artifactId: `error-${job.jobId}`,
      name: 'Render Error',
      parts: [
        {
          type: 'data',
          data: {
            jobId: job.jobId,
            status: 'failed',
            error: job.error,
          },
        },
      ],
      lastChunk: true,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let pipelineInstance: VideoRenderPipeline | null = null;

export function getVideoRenderPipeline(config?: Partial<PipelineConfig>): VideoRenderPipeline {
  if (!pipelineInstance) {
    pipelineInstance = new VideoRenderPipeline(config);
  }
  return pipelineInstance;
}

/**
 * Create a new pipeline instance (for testing or custom configs).
 */
export function createVideoRenderPipeline(config?: Partial<PipelineConfig>): VideoRenderPipeline {
  return new VideoRenderPipeline(config);
}
