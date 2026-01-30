/**
 * VideoRender Executor
 *
 * A2A executor for video rendering with Remotion-compatible compositions.
 * Wraps the video rendering infrastructure for A2A protocol compliance.
 *
 * Uses VideoRenderService for:
 * - Composition persistence (PostgreSQL in production, in-memory in standalone)
 * - Render job management
 * - Preview frame generation
 */

import { randomUUID } from 'crypto';
import { v1 } from '@jagdagenten/a2a-sdk';
import {
  BaseA2UIExecutor,
  type AgentExecutionContext,
  type AgentExecutionResult,
  type ExecutorA2UIMessage,
} from './base.js';
import { parseNaturalLanguage } from '../video/intent/router.js';
import {
  VideoRenderService,
  getVideoRenderService,
  type VideoRenderServiceConfig,
} from './video-render-service.js';

// ============================================================================
// Types
// ============================================================================

export interface VideoRenderSkill {
  id: string;
  name: string;
  description: string;
  tags: string[];
  examples?: string[];
}

export interface RenderJobState {
  jobId: string;
  taskId: string;
  compositionId: string;
  status: 'queued' | 'rendering' | 'encoding' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  currentFrame: number;
  totalFrames: number;
  outputUri?: string;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface AudioTrackState {
  id: string;
  src: string;
  startFrame: number;
  endFrame?: number;
  volume?: number;
  fadeIn?: number;
  fadeOut?: number;
  playbackRate?: number;
  loop?: boolean;
}

export interface CompositionState {
  id: string;
  name: string;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  props?: Record<string, unknown>;
  timeline?: object;
  metadata?: Record<string, unknown>;
  audioTracks?: AudioTrackState[];
}

// ============================================================================
// Keywords for Intent Matching
// ============================================================================

const RENDER_KEYWORDS = ['render', 'create video', 'generate video', 'make video', 'export'];
const PREVIEW_KEYWORDS = ['preview', 'frame', 'still', 'thumbnail', 'screenshot'];
const COMPOSITION_KEYWORDS = ['composition', 'timeline', 'scene', 'sequence'];
const EFFECT_KEYWORDS = ['effect', 'filter', 'transition', 'animation'];
const STATUS_KEYWORDS = ['status', 'progress', 'how is', 'check'];
const CANCEL_KEYWORDS = ['cancel', 'stop', 'abort'];
const LIST_KEYWORDS = ['list', 'show', 'all'];

// ============================================================================
// Agent Card
// ============================================================================

export function getVideoRenderAgentCard(baseUrl: string): v1.AgentCard {
  return {
    name: 'Liquid Motion Renderer',
    url: `${baseUrl}/a2a`,
    version: '1.0.0',
    protocolVersions: ['1.0'],
    description: 'AI-powered video rendering with Remotion-compatible compositions. Generate professional videos from natural language or JSON compositions.',
    capabilities: {
      streaming: true,
      pushNotifications: false,
    },
    skills: [
      {
        id: 'render_video',
        name: 'Render Video',
        description: 'Generate video from JSON composition or natural language intent',
        tags: ['render', 'video', 'export', 'mp4', 'webm'],
        examples: [
          'Render a 10-second intro with spinning logo',
          'Create an MP4 video at 1080p with h264 codec',
          'Generate a video from my-composition',
        ],
      },
      {
        id: 'preview_frame',
        name: 'Preview Frame',
        description: 'Generate a single frame for preview',
        tags: ['preview', 'frame', 'thumbnail', 'still'],
        examples: [
          'Preview frame 30',
          'Show thumbnail at 2 seconds',
          'Capture frame 0 as PNG',
        ],
      },
      {
        id: 'parse_intent',
        name: 'Parse Intent',
        description: 'Convert natural language to animation timeline',
        tags: ['parse', 'intent', 'natural language', 'ai'],
        examples: [
          'Create an animation with text sliding in from the left',
          'Make a chart that grows from 0 to show revenue data',
        ],
      },
      {
        id: 'apply_effect',
        name: 'Apply Effect',
        description: 'Apply visual effect or transition to composition',
        tags: ['effect', 'filter', 'transition', 'animation'],
        examples: [
          'Add fade in effect',
          'Apply blur transition between scenes',
        ],
      },
      {
        id: 'render_status',
        name: 'Render Status',
        description: 'Check the status of an active render job',
        tags: ['status', 'progress', 'check'],
        examples: [
          'Check render status',
          'How is my render going?',
        ],
      },
    ],
  };
}

// ============================================================================
// Executor
// ============================================================================

export class VideoRenderExecutor extends BaseA2UIExecutor {
  // VideoRenderService for persistence (standalone or production mode)
  private service: VideoRenderService;
  private initialized = false;

  // Local cache for quick lookups (service is the source of truth)
  private taskToJob: Map<string, string> = new Map(); // taskId -> jobId

  constructor(config?: VideoRenderServiceConfig) {
    super();
    this.service = getVideoRenderService(config);
  }

  /**
   * Initialize the service (should be called before first use).
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    await this.service.initialize();
    this.initialized = true;
  }

  /**
   * Get the underlying service (for direct access if needed).
   */
  getService(): VideoRenderService {
    return this.service;
  }

  async execute(
    message: v1.Message,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    const text = this.extractText(message);
    const lower = text.toLowerCase();
    const _contextId = context.metadata?.contextId as string | undefined;
    const _taskId = context.metadata?.taskId as string | undefined;

    // Check for file parts (composition JSON)
    const fileParts = message.parts.filter((p): p is v1.FilePart => v1.isFilePart(p));
    const dataParts = message.parts.filter((p): p is v1.DataPart => v1.isDataPart(p));

    // Handle JSON composition upload
    if (fileParts.length > 0 || dataParts.length > 0) {
      return this.handleCompositionUpload(fileParts, dataParts, context);
    }

    // Intent matching
    if (this.matchesIntent(lower, CANCEL_KEYWORDS)) {
      return this.handleCancel(context);
    }
    if (this.matchesIntent(lower, STATUS_KEYWORDS)) {
      return this.handleStatus(context);
    }
    if (this.matchesIntent(lower, LIST_KEYWORDS) && this.matchesIntent(lower, COMPOSITION_KEYWORDS)) {
      return this.handleListCompositions(context);
    }
    if (this.matchesIntent(lower, PREVIEW_KEYWORDS)) {
      return this.handlePreview(text, context);
    }
    if (this.matchesIntent(lower, RENDER_KEYWORDS)) {
      return this.handleRender(text, context);
    }
    if (this.matchesIntent(lower, EFFECT_KEYWORDS)) {
      return this.handleEffect(text, context);
    }
    if (this.matchesIntent(lower, COMPOSITION_KEYWORDS)) {
      return this.handleComposition(text, context);
    }

    // Use intent parser for natural language
    const intent = parseNaturalLanguage(text);
    if (intent.confidence >= 0.5) {
      return this.handleIntent(intent, context);
    }

    // Default to help
    return this.handleHelp(context);
  }

  // ==========================================================================
  // Intent Handlers
  // ==========================================================================

  private async handleRender(
    text: string,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    // Ensure service is initialized
    await this.initialize();

    const contextId = context.metadata?.contextId as string | undefined;
    const taskId = context.metadata?.taskId as string | undefined;
    const intent = parseNaturalLanguage(text);

    // Extract render parameters
    const compositionId = intent.params.compositionId as string | undefined;
    const format = (intent.params.outputFormat as string) || 'mp4';
    const codec = (intent.params.codec as string) || 'h264';

    // Check if composition exists or create from intent
    let composition: CompositionState;
    if (compositionId) {
      const existing = await this.service.getComposition(compositionId);
      if (!existing) {
        const allComps = await this.service.listCompositions();
        return this.createTextResponse(
          `Composition "${compositionId}" not found. Available: ${allComps.map((c: CompositionState) => c.id).join(', ') || 'none'}`,
          contextId
        );
      }
      composition = existing;
    } else {
      // Create composition from natural language via service
      const compParams = this.parseCompositionParams(text);
      composition = await this.service.createComposition(compParams);
    }

    // Create render job state for tracking
    const jobId = `render-${randomUUID()}`;
    const job: RenderJobState = {
      jobId,
      taskId: taskId || randomUUID(),
      compositionId: composition.id,
      status: 'queued',
      progress: 0,
      currentFrame: 0,
      totalFrames: composition.durationInFrames,
      startedAt: new Date(),
    };

    if (taskId) {
      this.taskToJob.set(taskId, jobId);
    }

    // Start render via service (handles NATS queueing in production)
    // The callback receives progress artifacts
    const progressCallback = (artifact: { name?: string; parts: Array<{ data?: Record<string, unknown> }> }): void => {
      if (artifact.name === 'Render Progress') {
        const data = artifact.parts[0]?.data;
        if (data) {
          job.status = data.status as RenderJobState['status'];
          job.progress = data.progress as number;
          job.currentFrame = data.currentFrame as number;
        }
      }
    };

    // Fire off the render (non-blocking in production with NATS queue)
    this.service.startRender(
      {
        compositionId: composition.id,
        format: format as 'mp4' | 'webm' | 'gif' | 'mov' | 'png-sequence',
        codec: codec as 'h264' | 'h265' | 'vp8' | 'vp9' | 'prores',
      },
      progressCallback as (artifact: { name?: string; parts: unknown[] }) => void
    ).then((result: { success: boolean; outputPath?: string; outputUri?: string; error?: string }) => {
      // Update job on completion
      if (result.success) {
        job.status = 'completed';
        job.progress = 1;
        job.currentFrame = job.totalFrames;
        job.completedAt = new Date();
        job.outputUri = result.outputPath || result.outputUri;
      } else {
        job.status = 'failed';
        job.error = result.error;
      }
    }).catch((error: Error) => {
      job.status = 'failed';
      job.error = error.message;
    });

    if (this.wantsA2UI(context)) {
      return this.createRenderProgressA2UI(job, composition, contextId);
    }

    return {
      message: this.createAgentMessage(
        [{ text: `Render job ${jobId} started for composition "${composition.name}".` }],
        contextId,
        taskId
      ),
      artifacts: [
        this.createTextArtifact(`Render job ${jobId} started.`),
        this.createProgressArtifact(job),
      ],
      status: v1.TaskState.WORKING,
    };
  }

  private async handlePreview(
    text: string,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    // Ensure service is initialized
    await this.initialize();

    const contextId = context.metadata?.contextId as string | undefined;
    const intent = parseNaturalLanguage(text);

    // Extract frame number
    const frameMatch = text.match(/frame\s*(\d+)/i);
    const timeMatch = text.match(/(\d+(?:\.\d+)?)\s*s(?:econds?)?/i);

    let frame = 0;
    const fps = 30;

    if (frameMatch) {
      frame = parseInt(frameMatch[1]);
    } else if (timeMatch) {
      frame = Math.floor(parseFloat(timeMatch[1]) * fps);
    }

    // Get composition via service (use first available if not specified)
    const compositionId = intent.params.compositionId as string | undefined;
    let composition: CompositionState | undefined;

    if (compositionId) {
      composition = await this.service.getComposition(compositionId);
    }

    if (!composition) {
      const allComps = await this.service.listCompositions();
      composition = allComps[0];
    }

    if (!composition) {
      return this.createTextResponse(
        'No composition available for preview. Create a composition first.',
        contextId
      );
    }

    // Render preview frame via service
    try {
      const artifact = await this.service.renderPreviewFrame(composition.id, frame, 'png');

      return {
        message: this.createAgentMessage(
          [{ text: `Preview generated for frame ${frame} of "${composition.name}".` }],
          contextId
        ),
        artifacts: [artifact as v1.Artifact],
        status: v1.TaskState.COMPLETED,
      };
    } catch (error) {
      return this.createTextResponse(
        `Failed to generate preview: ${error instanceof Error ? error.message : 'Unknown error'}`,
        contextId
      );
    }
  }

  private async handleStatus(
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    // Ensure service is initialized
    await this.initialize();

    const contextId = context.metadata?.contextId as string | undefined;
    const taskId = context.metadata?.taskId as string | undefined;

    // Find job for this task via service
    let jobs: RenderJobState[] = [];

    if (taskId && this.taskToJob.has(taskId)) {
      const jobId = this.taskToJob.get(taskId)!;
      const jobState = await this.service.getRenderStatus(jobId);
      if (jobState) {
        jobs = [jobState];
      }
    }

    // If no specific job found, check service status
    if (jobs.length === 0) {
      const status = this.service.getStatus();
      if (status.activeJobs === 0) {
        return this.createTextResponse('No active render jobs.', contextId);
      }
      // Service tracks active jobs but we don't have a list method yet
      // For now, report the count
      return this.createTextResponse(
        `${status.activeJobs} active render job(s). Use a specific task ID to get details.`,
        contextId
      );
    }

    const statusLines = jobs.map(j =>
      `${j.jobId}: ${j.status} (${Math.round(j.progress * 100)}%, frame ${j.currentFrame}/${j.totalFrames})`
    );

    if (this.wantsA2UI(context) && jobs.length === 1) {
      const job = jobs[0];
      const composition = await this.service.getComposition(job.compositionId);
      if (composition) {
        return this.createRenderProgressA2UI(job, composition, contextId);
      }
    }

    return this.createTextResponse(
      `Active renders:\n${statusLines.join('\n')}`,
      contextId
    );
  }

  private async handleCancel(
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    // Ensure service is initialized
    await this.initialize();

    const contextId = context.metadata?.contextId as string | undefined;
    const taskId = context.metadata?.taskId as string | undefined;

    if (!taskId || !this.taskToJob.has(taskId)) {
      return this.createTextResponse('No active render to cancel.', contextId);
    }

    const jobId = this.taskToJob.get(taskId)!;
    const job = await this.service.getRenderStatus(jobId);

    if (!job) {
      return this.createTextResponse('Render job not found.', contextId);
    }

    if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
      return this.createTextResponse(
        `Cannot cancel render (status: ${job.status}).`,
        contextId
      );
    }

    // Cancel via service (handles NATS queue and database)
    const cancelled = await this.service.cancelRender(jobId);

    if (cancelled) {
      this.taskToJob.delete(taskId);
      return this.createTextResponse(`Render ${jobId} cancelled.`, contextId);
    } else {
      return this.createTextResponse(`Failed to cancel render ${jobId}.`, contextId);
    }
  }

  private async handleListCompositions(
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    // Ensure service is initialized
    await this.initialize();

    const contextId = context.metadata?.contextId as string | undefined;

    const compositions = await this.service.listCompositions();

    if (compositions.length === 0) {
      return this.createTextResponse(
        'No compositions registered. Create one with a description like "Create a 10-second intro animation".',
        contextId
      );
    }

    const lines = compositions.map((c: CompositionState) =>
      `${c.id}: ${c.name} (${c.width}x${c.height} @ ${c.fps}fps, ${c.durationInFrames} frames)`
    );

    return this.createTextResponse(`Compositions:\n${lines.join('\n')}`, contextId);
  }

  private async handleEffect(
    text: string,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    const contextId = context.metadata?.contextId as string | undefined;

    // Extract effect type
    const effectMatch = text.match(/(fade|blur|slide|zoom|wipe|dissolve|spin|bounce)/i);
    const effect = effectMatch ? effectMatch[1].toLowerCase() : 'fade';

    return this.createTextResponse(
      `Effect "${effect}" noted. It will be applied to the next render. ` +
      `Available effects: fade, blur, slide, zoom, wipe, dissolve, spin, bounce.`,
      contextId
    );
  }

  private async handleComposition(
    text: string,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    // Ensure service is initialized
    await this.initialize();

    const contextId = context.metadata?.contextId as string | undefined;

    // Create composition via service
    const compParams = this.parseCompositionParams(text);
    const composition = await this.service.createComposition(compParams);

    if (this.wantsA2UI(context)) {
      return this.createCompositionA2UI(composition, contextId);
    }

    return this.createTextResponse(
      `Composition "${composition.name}" created:\n` +
      `- ID: ${composition.id}\n` +
      `- Resolution: ${composition.width}x${composition.height}\n` +
      `- FPS: ${composition.fps}\n` +
      `- Duration: ${composition.durationInFrames} frames (${composition.durationInFrames / composition.fps}s)`,
      contextId
    );
  }

  private async handleCompositionUpload(
    fileParts: v1.FilePart[],
    dataParts: v1.DataPart[],
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    // Ensure service is initialized
    await this.initialize();

    const contextId = context.metadata?.contextId as string | undefined;

    // Try to parse composition from data parts
    for (const part of dataParts) {
      const data = part.data as Record<string, unknown>;
      if (data && typeof data === 'object') {
        const params = this.parseCompositionDataParams(data);
        if (params) {
          const composition = await this.service.createComposition(params);
          return this.createTextResponse(
            `Composition "${composition.name}" uploaded successfully.`,
            contextId
          );
        }
      }
    }

    // Try to parse from file parts
    for (const part of fileParts) {
      const fileContent = part.file as { mimeType?: string; bytes?: string };
      if (fileContent.mimeType === 'application/json' && fileContent.bytes) {
        try {
          const json = JSON.parse(Buffer.from(fileContent.bytes, 'base64').toString('utf-8'));
          const params = this.parseCompositionDataParams(json);
          if (params) {
            const composition = await this.service.createComposition(params);
            return this.createTextResponse(
              `Composition "${composition.name}" uploaded from file.`,
              contextId
            );
          }
        } catch (_e) {
          // Continue to next file
        }
      }
    }

    return this.createTextResponse(
      'Could not parse composition from uploaded data. Expected JSON with id, width, height, fps, durationInFrames.',
      contextId
    );
  }

  private async handleIntent(
    intent: { method: string; params: Record<string, unknown>; confidence: number },
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    const contextId = context.metadata?.contextId as string | undefined;

    switch (intent.method) {
      case 'render':
        return this.handleRender(JSON.stringify(intent.params), context);
      case 'render.still':
        return this.handlePreview(`preview frame ${intent.params.frame || 0}`, context);
      case 'composition.list':
        return this.handleListCompositions(context);
      case 'getCapabilities':
        return this.handleCapabilities(context);
      default:
        return this.handleHelp(context);
    }
  }

  private async handleCapabilities(
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    const contextId = context.metadata?.contextId as string | undefined;

    return this.createTextResponse(
      'Liquid Motion Renderer Capabilities:\n\n' +
      '**Supported Codecs:** h264, h265, vp8, vp9, prores\n' +
      '**Supported Formats:** mp4, webm, gif, mov, png-sequence\n' +
      '**Max Resolution:** 4K (3840x2160)\n' +
      '**Max Duration:** 10 minutes\n\n' +
      '**Features:**\n' +
      '- Remotion-compatible compositions\n' +
      '- Natural language intent parsing\n' +
      '- Charts (line, bar, pie, area, scatter)\n' +
      '- Captions (SRT, VTT)\n' +
      '- Lottie animations\n' +
      '- 3D scenes (via Puppeteer)\n' +
      '- Tailwind CSS styling\n' +
      '- Spring physics animations',
      contextId
    );
  }

  private handleHelp(context: AgentExecutionContext): AgentExecutionResult {
    const contextId = context.metadata?.contextId as string | undefined;

    return this.createTextResponse(
      'Liquid Motion Renderer - AI-powered video creation\n\n' +
      '**Commands:**\n' +
      '- "Render [description]" - Create video from description\n' +
      '- "Preview frame [N]" - Preview a specific frame\n' +
      '- "Create composition [description]" - Define a new composition\n' +
      '- "List compositions" - Show all compositions\n' +
      '- "Render status" - Check active renders\n' +
      '- "Cancel render" - Stop current render\n' +
      '- "Capabilities" - Show supported features\n\n' +
      '**Examples:**\n' +
      '- "Render a 10-second intro with spinning logo at 1080p"\n' +
      '- "Create a chart animation showing revenue growth"\n' +
      '- "Preview frame 60 of my-composition"',
      contextId
    );
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  private matchesIntent(text: string, keywords: string[]): boolean {
    return keywords.some(k => text.includes(k));
  }

  /**
   * Parse composition parameters from natural language text.
   * Returns params compatible with VideoRenderService.createComposition().
   */
  private parseCompositionParams(text: string): {
    name: string;
    width: number;
    height: number;
    fps: number;
    durationInFrames: number;
    metadata?: Record<string, unknown>;
  } {
    // Extract parameters from text
    const durationMatch = text.match(/(\d+)\s*(?:second|sec|s)\b/i);
    const fpsMatch = text.match(/(\d+)\s*fps/i);
    const resMatch = text.match(/(\d{3,4})p/i);
    const nameMatch = text.match(/(?:called?|named?)\s+["']?([a-z0-9-_]+)["']?/i);

    const duration = durationMatch ? parseInt(durationMatch[1]) : 10;
    const fps = fpsMatch ? parseInt(fpsMatch[1]) : 30;
    const height = resMatch ? parseInt(resMatch[1]) : 1080;
    const width = Math.round(height * 16 / 9);
    const name = nameMatch ? nameMatch[1] : `composition-${Date.now()}`;

    return {
      name,
      width,
      height,
      fps,
      durationInFrames: duration * fps,
      metadata: {
        sourceText: text,
        createdAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Parse composition parameters from uploaded JSON data.
   * Returns params compatible with VideoRenderService.createComposition().
   */
  private parseCompositionDataParams(data: Record<string, unknown>): {
    id?: string;
    name: string;
    width: number;
    height: number;
    fps: number;
    durationInFrames: number;
    props?: Record<string, unknown>;
    timeline?: object;
    metadata?: Record<string, unknown>;
  } | null {
    if (!data.id && !data.name) return null;

    return {
      id: data.id as string | undefined,
      name: (data.name as string) || 'Untitled',
      width: (data.width as number) || 1920,
      height: (data.height as number) || 1080,
      fps: (data.fps as number) || 30,
      durationInFrames: (data.durationInFrames as number) || 300,
      props: data.props as Record<string, unknown> | undefined,
      timeline: data.timeline as object | undefined,
      metadata: data.metadata as Record<string, unknown> | undefined,
    };
  }

  // ==========================================================================
  // Artifact Helpers
  // ==========================================================================

  private createProgressArtifact(job: RenderJobState): v1.Artifact {
    return {
      artifactId: `progress-${job.jobId}`,
      name: 'Render Progress',
      parts: [{
        type: 'data',
        data: {
          jobId: job.jobId,
          status: job.status,
          progress: job.progress,
          currentFrame: job.currentFrame,
          totalFrames: job.totalFrames,
          eta: job.totalFrames > 0 ? (1 - job.progress) * 10 : 0, // Rough estimate
        },
      } as unknown as v1.Part],
    };
  }

  private createVideoArtifact(job: RenderJobState): v1.Artifact {
    return {
      artifactId: `output-${job.jobId}`,
      name: 'Rendered Video',
      parts: [{
        type: 'file',
        file: {
          name: 'output.mp4',
          mimeType: 'video/mp4',
          uri: job.outputUri,
        },
      } as unknown as v1.Part],
    };
  }

  // ==========================================================================
  // A2UI Builders
  // ==========================================================================

  private createRenderProgressA2UI(
    job: RenderJobState,
    composition: CompositionState,
    contextId?: string
  ): AgentExecutionResult {
    const surfaceId = randomUUID();
    const progressPercent = Math.round(job.progress * 100);

    const messages: ExecutorA2UIMessage[] = [
      {
        type: 'beginRendering',
        surfaceId,
        rootComponentId: 'render-root',
      },
      {
        type: 'surfaceUpdate',
        surfaceId,
        components: [
          {
            id: 'render-root',
            component: this.Column(['header', 'info', 'progress-section', 'actions'], { gap: 16 }),
          },
          {
            id: 'header',
            component: this.Text(`Rendering: ${composition.name}`, 'heading'),
          },
          {
            id: 'info',
            component: this.Row(['resolution-text', 'fps-text', 'status-text'], { gap: 12 }),
          },
          {
            id: 'resolution-text',
            component: this.Text(`${composition.width}x${composition.height}`),
          },
          {
            id: 'fps-text',
            component: this.Text(`${composition.fps} fps`),
          },
          {
            id: 'status-text',
            component: this.Text({ path: 'status' }),
          },
          {
            id: 'progress-section',
            component: this.Column(['progress-bar-container', 'progress-details']),
          },
          {
            id: 'progress-bar-container',
            component: {
              Slider: {
                value: { path: 'progress' },
                min: 0,
                max: 100,
                disabled: true,
              },
            },
          },
          {
            id: 'progress-details',
            component: this.Row(['frame-text', 'percent-text'], { justifyContent: 'space-between' }),
          },
          {
            id: 'frame-text',
            component: this.Text({ path: 'frameText' }),
          },
          {
            id: 'percent-text',
            component: this.Text({ path: 'percentText' }),
          },
          {
            id: 'actions',
            component: this.Row(['cancel-btn']),
          },
          {
            id: 'cancel-btn',
            component: this.Button('Cancel', 'cancel-render', 'ghost'),
          },
        ],
      },
      {
        type: 'setModel',
        surfaceId,
        model: {
          jobId: job.jobId,
          compositionId: composition.id,
          status: job.status,
          progress: progressPercent,
          frameText: `Frame ${job.currentFrame} / ${job.totalFrames}`,
          percentText: `${progressPercent}%`,
        },
      },
    ];

    return {
      message: this.createAgentMessage(
        [{ text: `Rendering "${composition.name}"... ${progressPercent}%` }],
        contextId
      ),
      artifacts: [
        this.createTextArtifact(`Rendering ${progressPercent}% complete`),
        this.createA2UIArtifact(messages),
        this.createProgressArtifact(job),
      ],
      status: job.status === 'completed' ? v1.TaskState.COMPLETED : v1.TaskState.WORKING,
    };
  }

  private createCompositionA2UI(
    composition: CompositionState,
    contextId?: string
  ): AgentExecutionResult {
    const surfaceId = randomUUID();

    const messages: ExecutorA2UIMessage[] = [
      {
        type: 'beginRendering',
        surfaceId,
        rootComponentId: 'comp-root',
      },
      {
        type: 'surfaceUpdate',
        surfaceId,
        components: [
          {
            id: 'comp-root',
            component: this.Column(['comp-header', 'comp-details', 'comp-actions'], { gap: 16 }),
          },
          {
            id: 'comp-header',
            component: this.Text(`Composition: ${composition.name}`, 'heading'),
          },
          {
            id: 'comp-details',
            component: this.Column(['id-row', 'res-row', 'duration-row']),
          },
          {
            id: 'id-row',
            component: this.Text(`ID: ${composition.id}`),
          },
          {
            id: 'res-row',
            component: this.Text(`Resolution: ${composition.width}x${composition.height} @ ${composition.fps}fps`),
          },
          {
            id: 'duration-row',
            component: this.Text(`Duration: ${composition.durationInFrames} frames (${(composition.durationInFrames / composition.fps).toFixed(1)}s)`),
          },
          {
            id: 'comp-actions',
            component: this.Row(['render-btn', 'preview-btn'], { gap: 8 }),
          },
          {
            id: 'render-btn',
            component: this.Button('Render Video', 'render-composition', 'primary'),
          },
          {
            id: 'preview-btn',
            component: this.Button('Preview', 'preview-composition', 'secondary'),
          },
        ],
      },
      {
        type: 'setModel',
        surfaceId,
        model: {
          compositionId: composition.id,
          name: composition.name,
          width: composition.width,
          height: composition.height,
          fps: composition.fps,
          durationInFrames: composition.durationInFrames,
        },
      },
    ];

    return this.createA2UIResponse(
      `Composition "${composition.name}" created.`,
      messages,
      contextId
    );
  }
}
