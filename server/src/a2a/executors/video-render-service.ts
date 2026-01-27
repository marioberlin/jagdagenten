/**
 * Video Render Service
 *
 * Central orchestration layer that combines:
 * - VideoRenderPipeline (FFmpeg, Canvas)
 * - PostgreSQL Store (compositions, renders, assets)
 * - NATS Queue (distributed job processing)
 *
 * This service can operate in two modes:
 * - Standalone: Uses in-memory storage, no external dependencies
 * - Production: Uses PostgreSQL, Redis cache, and NATS queue
 */

import { randomUUID } from 'crypto';
import { EventEmitter } from 'events';
import {
  VideoRenderPipeline,
  createVideoRenderPipeline,
  type RenderOptions,
  type RenderResult,
  type A2AArtifact,
  type PipelineConfig,
} from './video-render-pipeline.js';
import type { CompositionState, RenderJobState } from './video-render.js';

// Video module imports (only used when services are available)
import type { RenderStatus } from '../video/types.js';

// ============================================================================
// Types
// ============================================================================

export interface VideoRenderServiceConfig {
  // Pipeline config
  outputDir?: string;
  tempDir?: string;
  ffmpegPath?: string;
  ffprobePath?: string;

  // Database connection (optional)
  databaseUrl?: string;
  redisUrl?: string;
  natsUrl?: string;

  // Mode
  mode?: 'standalone' | 'production';
}

export interface CreateCompositionParams {
  id?: string;
  name: string;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  props?: Record<string, unknown>;
  timeline?: object;
  metadata?: Record<string, unknown>;
}

export interface RenderJobParams {
  compositionId: string;
  format?: 'mp4' | 'webm' | 'gif' | 'mov' | 'png-sequence';
  codec?: 'h264' | 'h265' | 'vp8' | 'vp9' | 'prores';
  quality?: 'low' | 'medium' | 'high' | 'lossless';
  crf?: number;
  preset?: 'ultrafast' | 'fast' | 'medium' | 'slow' | 'veryslow';
}

// ============================================================================
// Video Render Service
// ============================================================================

export class VideoRenderService extends EventEmitter {
  private pipeline: VideoRenderPipeline;
  private config: VideoRenderServiceConfig;
  private mode: 'standalone' | 'production';

  // In-memory storage for standalone mode
  private compositions: Map<string, CompositionState> = new Map();
  private renderJobs: Map<string, RenderJobState> = new Map();

  // Database connections (for production mode)
  private storeInitialized = false;
  private queueInitialized = false;

  constructor(config: VideoRenderServiceConfig = {}) {
    super();
    this.config = config;
    this.mode = config.mode || 'standalone';

    // Create pipeline with config
    const pipelineConfig: Partial<PipelineConfig> = {
      outputDir: config.outputDir,
      tempDir: config.tempDir,
      ffmpegPath: config.ffmpegPath,
      ffprobePath: config.ffprobePath,
    };
    this.pipeline = createVideoRenderPipeline(pipelineConfig);

    console.log(`[VideoRenderService] Created in ${this.mode} mode`);
  }

  /**
   * Initialize services (for production mode).
   */
  async initialize(): Promise<void> {
    // Initialize pipeline
    await this.pipeline.initialize();

    if (this.mode === 'production') {
      await this.initializeProductionServices();
    }
  }

  /**
   * Initialize production services (Postgres, Redis, NATS).
   */
  private async initializeProductionServices(): Promise<void> {
    // Initialize PostgreSQL store
    if (this.config.databaseUrl) {
      try {
        const { initializePostgresStore } = await import('../video/store/postgres.js');
        const { query } = await import('../../db.js');
        initializePostgresStore(query);
        this.storeInitialized = true;
        console.log('[VideoRenderService] PostgreSQL store initialized');
      } catch (error) {
        console.warn('[VideoRenderService] PostgreSQL store not available:', error);
      }
    }

    // Initialize NATS queue
    if (this.config.natsUrl) {
      try {
        const { initializeQueue } = await import('../video/jobs/queue.js');
        await initializeQueue({ natsUrl: this.config.natsUrl });
        this.queueInitialized = true;
        console.log('[VideoRenderService] NATS queue initialized');
      } catch (error) {
        console.warn('[VideoRenderService] NATS queue not available:', error);
      }
    }
  }

  // ==========================================================================
  // Composition Management
  // ==========================================================================

  /**
   * Create a new composition.
   */
  async createComposition(params: CreateCompositionParams): Promise<CompositionState> {
    const composition: CompositionState = {
      id: params.id || `comp-${randomUUID()}`,
      name: params.name,
      width: params.width,
      height: params.height,
      fps: params.fps,
      durationInFrames: params.durationInFrames,
      props: params.props,
      timeline: params.timeline,
      metadata: params.metadata,
    };

    // Store in database if available
    if (this.storeInitialized) {
      try {
        const { createComposition } = await import('../video/store/postgres.js');
        await createComposition({
          id: composition.id,
          width: composition.width,
          height: composition.height,
          fps: composition.fps,
          durationInFrames: composition.durationInFrames,
          defaultProps: composition.props,
        });
      } catch (error) {
        console.warn('[VideoRenderService] Failed to persist composition:', error);
      }
    }

    // Always store in memory for fast access
    this.compositions.set(composition.id, composition);

    return composition;
  }

  /**
   * Get a composition by ID.
   */
  async getComposition(id: string): Promise<CompositionState | undefined> {
    // Check memory first
    const cached = this.compositions.get(id);
    if (cached) return cached;

    // Try database
    if (this.storeInitialized) {
      try {
        const { getComposition } = await import('../video/store/postgres.js');
        const record = await getComposition(id);
        if (record) {
          const composition: CompositionState = {
            id: record.id,
            name: record.id, // Name might not be stored
            width: record.width,
            height: record.height,
            fps: record.fps,
            durationInFrames: record.durationInFrames,
            props: record.defaultProps as Record<string, unknown>,
          };
          this.compositions.set(id, composition);
          return composition;
        }
      } catch (error) {
        console.warn('[VideoRenderService] Failed to fetch composition:', error);
      }
    }

    return undefined;
  }

  /**
   * List all compositions.
   */
  async listCompositions(): Promise<CompositionState[]> {
    // If store is available, get from database
    if (this.storeInitialized) {
      try {
        const { listCompositions } = await import('../video/store/postgres.js');
        const records = await listCompositions();
        return records.map(record => ({
          id: record.id,
          name: record.id,
          width: record.width,
          height: record.height,
          fps: record.fps,
          durationInFrames: record.durationInFrames,
          props: record.defaultProps as Record<string, unknown>,
        }));
      } catch (error) {
        console.warn('[VideoRenderService] Failed to list compositions:', error);
      }
    }

    // Fallback to memory
    return Array.from(this.compositions.values());
  }

  // ==========================================================================
  // Render Job Management
  // ==========================================================================

  /**
   * Start a render job.
   */
  async startRender(
    params: RenderJobParams,
    onArtifact?: (artifact: A2AArtifact) => void
  ): Promise<RenderResult> {
    // Get composition
    const composition = await this.getComposition(params.compositionId);
    if (!composition) {
      throw new Error(`Composition "${params.compositionId}" not found`);
    }

    // Build render options
    const options: RenderOptions = {
      format: params.format || 'mp4',
      codec: params.codec || 'h264',
      quality: params.quality || 'medium',
      crf: params.crf,
      preset: params.preset,
    };

    // Create render record in database if available
    const jobId = `render-${randomUUID()}`;
    if (this.storeInitialized) {
      try {
        const { createRender } = await import('../video/store/postgres.js');
        await createRender({
          id: jobId,
          compositionId: params.compositionId,
          status: 'queued',
          outputFormat: options.format,
          codec: options.codec,
          width: composition.width,
          height: composition.height,
          fps: composition.fps,
          crf: options.crf,
          props: composition.props,
        });
      } catch (error) {
        console.warn('[VideoRenderService] Failed to create render record:', error);
      }
    }

    // If queue is available and not in standalone mode, enqueue job
    if (this.queueInitialized && this.mode === 'production') {
      try {
        const { enqueueJob } = await import('../video/jobs/queue.js');
        await enqueueJob({
          compositionId: params.compositionId,
          outputFormat: options.format,
          codec: options.codec,
          quality: options.quality ? { crf: options.crf, preset: options.preset } : undefined,
        } as any);

        // Return immediately with job ID (async processing)
        return {
          jobId,
          success: true,
          outputUri: `pending://${jobId}`,
        };
      } catch (error) {
        console.warn('[VideoRenderService] Failed to enqueue job, processing locally:', error);
      }
    }

    // Process locally via pipeline
    const artifactCallback = onArtifact || (() => {});

    // Wrap callback to update database
    const wrappedCallback = async (artifact: A2AArtifact) => {
      artifactCallback(artifact);

      // Update render progress in database
      if (this.storeInitialized && artifact.name === 'Render Progress') {
        try {
          const { updateRender } = await import('../video/store/postgres.js');
          const data = artifact.parts[0]?.data as Record<string, unknown> | undefined;
          if (data) {
            await updateRender(jobId, {
              status: data.status as RenderStatus,
              progress: (data.progress as number) * 100,
              currentFrame: data.currentFrame as number,
            });
          }
        } catch (error) {
          // Ignore database errors during progress updates
        }
      }
    };

    const result = await this.pipeline.startRender(composition, options, wrappedCallback);

    // Update final status in database
    if (this.storeInitialized) {
      try {
        const { updateRender } = await import('../video/store/postgres.js');
        await updateRender(jobId, {
          status: result.success ? 'completed' : 'failed',
          progress: result.success ? 100 : 0,
          outputUrl: result.outputPath,
          outputSize: result.fileSize,
          error: result.error,
        });
      } catch (error) {
        console.warn('[VideoRenderService] Failed to update render status:', error);
      }
    }

    return result;
  }

  /**
   * Get render job status.
   */
  async getRenderStatus(jobId: string): Promise<RenderJobState | undefined> {
    // Check pipeline first
    const pipelineStatus = this.pipeline.getJobStatus(jobId);
    if (pipelineStatus) return pipelineStatus;

    // Check memory
    const cached = this.renderJobs.get(jobId);
    if (cached) return cached;

    // Check database
    if (this.storeInitialized) {
      try {
        const { getRender } = await import('../video/store/postgres.js');
        const record = await getRender(jobId);
        if (record) {
          const job: RenderJobState = {
            jobId: record.id,
            taskId: record.id,
            compositionId: record.compositionId,
            status: record.status as RenderJobState['status'],
            progress: (record.progress || 0) / 100,
            currentFrame: 0, // Derived from progress in actual implementation
            totalFrames: 0, // Not stored
            outputUri: record.outputUrl,
            error: record.error,
          };
          this.renderJobs.set(jobId, job);
          return job;
        }
      } catch (error) {
        console.warn('[VideoRenderService] Failed to fetch render status:', error);
      }
    }

    return undefined;
  }

  /**
   * Cancel a render job.
   */
  async cancelRender(jobId: string): Promise<boolean> {
    // Try to cancel in pipeline
    const cancelled = this.pipeline.cancelRender(jobId);

    // Also cancel in queue if available
    if (this.queueInitialized) {
      try {
        const { cancelJob } = await import('../video/jobs/queue.js');
        await cancelJob(jobId);
      } catch (error) {
        console.warn('[VideoRenderService] Failed to cancel in queue:', error);
      }
    }

    // Update database
    if (this.storeInitialized) {
      try {
        const { updateRender } = await import('../video/store/postgres.js');
        await updateRender(jobId, { status: 'cancelled' });
      } catch (error) {
        console.warn('[VideoRenderService] Failed to update cancelled status:', error);
      }
    }

    return cancelled;
  }

  /**
   * Render a preview frame.
   */
  async renderPreviewFrame(
    compositionId: string,
    frame: number,
    format: 'png' | 'jpeg' | 'webp' = 'png'
  ): Promise<A2AArtifact> {
    const composition = await this.getComposition(compositionId);
    if (!composition) {
      throw new Error(`Composition "${compositionId}" not found`);
    }

    return this.pipeline.renderPreviewFrame(composition, frame, format);
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Check if services are available.
   */
  getStatus(): {
    mode: 'standalone' | 'production';
    storeAvailable: boolean;
    queueAvailable: boolean;
    compositionCount: number;
    activeJobs: number;
  } {
    return {
      mode: this.mode,
      storeAvailable: this.storeInitialized,
      queueAvailable: this.queueInitialized,
      compositionCount: this.compositions.size,
      activeJobs: this.renderJobs.size,
    };
  }

  /**
   * Shutdown the service.
   */
  async shutdown(): Promise<void> {
    // Close queue connection
    if (this.queueInitialized) {
      try {
        const { closeQueue } = await import('../video/jobs/queue.js');
        await closeQueue();
      } catch (error) {
        console.warn('[VideoRenderService] Error closing queue:', error);
      }
    }

    console.log('[VideoRenderService] Shutdown complete');
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let serviceInstance: VideoRenderService | null = null;

/**
 * Get or create the video render service singleton.
 */
export function getVideoRenderService(config?: VideoRenderServiceConfig): VideoRenderService {
  if (!serviceInstance) {
    serviceInstance = new VideoRenderService(config);
  }
  return serviceInstance;
}

/**
 * Create a new service instance (for testing or custom configs).
 */
export function createVideoRenderService(config?: VideoRenderServiceConfig): VideoRenderService {
  return new VideoRenderService(config);
}
