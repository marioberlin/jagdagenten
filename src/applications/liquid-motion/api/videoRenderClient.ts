/**
 * Video Render API Client
 *
 * Client for communicating with the A2A video-render executor.
 */

import type { Composition, RenderOptions, RenderProgress } from '../types';

// ============================================================================
// Types
// ============================================================================

interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params?: unknown;
  id: string | number;
}

interface JsonRpcResponse<T = unknown> {
  jsonrpc: '2.0';
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
  id: string | number;
}

export interface ServerComposition {
  id: string;
  name: string;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  elements: ServerElement[];
  metadata?: Record<string, unknown>;
}

export interface ServerElement {
  type: 'text' | 'image' | 'shape' | 'gradient' | 'progress' | 'chart' | 'lottie' | 'video';
  startFrame?: number;
  endFrame?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  color?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  opacity?: number;
  effect?: string;
  easing?: string;
  src?: string;
  shapeType?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  chartType?: string;
  data?: unknown;
  [key: string]: unknown;
}

export interface RenderJob {
  jobId: string;
  compositionId: string;
  status: string;
  progress: number;
  currentFrame?: number;
  totalFrames?: number;
  outputUri?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface IntentResult {
  composition: ServerComposition;
  explanation: string;
}

// ============================================================================
// Client
// ============================================================================

export class VideoRenderClient {
  private baseUrl: string;
  private requestId = 0;
  private eventSource: EventSource | null = null;
  private progressCallbacks: Map<string, (progress: RenderProgress) => void> = new Map();

  constructor(baseUrl?: string) {
    // Default to /video in production (proxied through Caddy) or localhost for dev
    const defaultUrl = import.meta.env.PROD ? '/video' : 'http://localhost:8082';
    this.baseUrl = baseUrl || import.meta.env.VITE_VIDEO_RENDER_URL || defaultUrl;
  }

  // ==========================================================================
  // JSON-RPC Communication
  // ==========================================================================

  private async rpc<T>(method: string, params?: unknown): Promise<T> {
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      method,
      params,
      id: ++this.requestId,
    };

    const response = await fetch(`${this.baseUrl}/rpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const json: JsonRpcResponse<T> = await response.json();

    if (json.error) {
      throw new Error(`RPC Error ${json.error.code}: ${json.error.message}`);
    }

    return json.result as T;
  }

  // ==========================================================================
  // A2A Protocol Methods
  // ==========================================================================

  /**
   * Get the agent card (capabilities)
   */
  async getAgentCard(): Promise<{
    name: string;
    url: string;
    version: string;
    capabilities: string[];
  }> {
    const response = await fetch(`${this.baseUrl}/.well-known/agent.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch agent card: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Check server health
   */
  async health(): Promise<{ status: string; version: string }> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }
    return response.json();
  }

  // ==========================================================================
  // Composition Methods
  // ==========================================================================

  /**
   * Create a new composition
   */
  async createComposition(composition: Omit<ServerComposition, 'id'>): Promise<ServerComposition> {
    return this.rpc<ServerComposition>('composition.create', composition);
  }

  /**
   * Get a composition by ID
   */
  async getComposition(id: string): Promise<ServerComposition | null> {
    return this.rpc<ServerComposition | null>('composition.get', { id });
  }

  /**
   * Update a composition
   */
  async updateComposition(
    id: string,
    updates: Partial<ServerComposition>
  ): Promise<ServerComposition> {
    return this.rpc<ServerComposition>('composition.update', { id, ...updates });
  }

  /**
   * Delete a composition
   */
  async deleteComposition(id: string): Promise<boolean> {
    return this.rpc<boolean>('composition.delete', { id });
  }

  /**
   * List all compositions
   */
  async listCompositions(): Promise<ServerComposition[]> {
    return this.rpc<ServerComposition[]>('composition.list', {});
  }

  // ==========================================================================
  // Render Methods
  // ==========================================================================

  /**
   * Start rendering a composition
   */
  async render(
    compositionId: string,
    options: RenderOptions = { format: 'mp4' }
  ): Promise<RenderJob> {
    return this.rpc<RenderJob>('render.start', {
      compositionId,
      format: options.format || 'mp4',
      codec: options.codec || 'h264',
      quality: options.quality || 'high',
      crf: options.crf,
      bitrate: options.bitrate,
      frameRange: options.frameRange,
    });
  }

  /**
   * Get render job status
   */
  async getRenderStatus(jobId: string): Promise<RenderJob> {
    return this.rpc<RenderJob>('render.status', { jobId });
  }

  /**
   * Cancel a render job
   */
  async cancelRender(jobId: string): Promise<boolean> {
    return this.rpc<boolean>('render.cancel', { jobId });
  }

  /**
   * Generate a preview frame
   */
  async previewFrame(
    compositionId: string,
    frame: number,
    scale: number = 1
  ): Promise<string> {
    const result = await this.rpc<{ imageData: string }>('render.preview', {
      compositionId,
      frame,
      scale,
    });
    return result.imageData;
  }

  // ==========================================================================
  // Intent Methods
  // ==========================================================================

  /**
   * Parse natural language intent into a composition
   */
  async parseIntent(intent: string): Promise<IntentResult> {
    return this.rpc<IntentResult>('intent.parse', { intent });
  }

  // ==========================================================================
  // Progress Streaming
  // ==========================================================================

  /**
   * Subscribe to render progress updates via SSE
   */
  subscribeToProgress(
    jobId: string,
    onProgress: (progress: RenderProgress) => void
  ): () => void {
    // Store callback
    this.progressCallbacks.set(jobId, onProgress);

    // Create EventSource if not exists
    if (!this.eventSource) {
      this.eventSource = new EventSource(`${this.baseUrl}/events/progress`);

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const callback = this.progressCallbacks.get(data.jobId);
          if (callback) {
            callback({
              jobId: data.jobId,
              status: data.status,
              progress: data.progress,
              currentFrame: data.currentFrame,
              totalFrames: data.totalFrames,
              eta: data.eta,
              previewFrame: data.previewFrame,
              error: data.error,
            });
          }
        } catch {
          // Ignore parse errors
        }
      };

      this.eventSource.onerror = () => {
        // Reconnect will happen automatically
      };
    }

    // Return unsubscribe function
    return () => {
      this.progressCallbacks.delete(jobId);
      if (this.progressCallbacks.size === 0 && this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }
    };
  }

  /**
   * Poll for render progress (fallback when SSE not available)
   */
  async pollProgress(
    jobId: string,
    onProgress: (progress: RenderProgress) => void,
    intervalMs: number = 500
  ): Promise<() => void> {
    let stopped = false;

    const poll = async () => {
      while (!stopped) {
        try {
          const job = await this.getRenderStatus(jobId);
          onProgress({
            jobId: job.jobId,
            status: job.status as RenderProgress['status'],
            progress: job.progress,
            currentFrame: job.currentFrame || 0,
            totalFrames: job.totalFrames || 0,
            error: job.error,
          });

          if (['completed', 'failed', 'cancelled'].includes(job.status)) {
            break;
          }
        } catch {
          // Continue polling on error
        }

        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }
    };

    poll();

    return () => {
      stopped = true;
    };
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Convert frontend Composition to server format
   */
  static toServerComposition(composition: Composition): Omit<ServerComposition, 'id'> {
    return {
      name: composition.name,
      width: composition.width,
      height: composition.height,
      fps: composition.fps,
      durationInFrames: composition.durationInFrames,
      elements: [],
      metadata: {
        backgroundColor: composition.backgroundColor,
        ...composition.metadata,
      },
    };
  }

  /**
   * Convert server composition to frontend format
   */
  static fromServerComposition(server: ServerComposition): Composition {
    return {
      id: server.id,
      name: server.name,
      width: server.width,
      height: server.height,
      fps: server.fps,
      durationInFrames: server.durationInFrames,
      backgroundColor: server.metadata?.backgroundColor as string,
      metadata: server.metadata,
    };
  }
}

// Singleton instance
let clientInstance: VideoRenderClient | null = null;

export function getVideoRenderClient(): VideoRenderClient {
  if (!clientInstance) {
    clientInstance = new VideoRenderClient();
  }
  return clientInstance;
}
