/**
 * A2A Video v1.0 Server
 *
 * Remotion-compatible video rendering server using Elysia.
 */

import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import { handleRequest, handleBatchRequest, jsonRpcError } from './handler.js';
import type {
  VideoConfig,
  VideoAgentCard,
  JsonRpcRequest,
  RenderStatus,
} from './types.js';
import {
  A2A_VIDEO_VERSION,
  A2A_VIDEO_PROTOCOL_VERSION,
  DEFAULT_VIDEO_CONFIG,
  JSON_RPC_ERRORS,
} from './types.js';

// ============================================================================
// Agent Card
// ============================================================================

/**
 * Generate the A2A Video Agent Card for A2A compatibility.
 */
export function getVideoAgentCard(baseUrl: string): VideoAgentCard {
  return {
    name: 'LiquidCrypto A2A Video',
    version: A2A_VIDEO_VERSION,
    protocolVersions: [A2A_VIDEO_PROTOCOL_VERSION],
    description:
      'Remotion-compatible video rendering server with FFmpeg. Supports frame-based animations, audio mixing, transitions, and multiple codecs.',
    supportedInterfaces: [
      { url: `${baseUrl}/video`, protocolBinding: 'JSONRPC' },
    ],
    capabilities: {
      streaming: true,
      pushNotifications: true,
    },
    defaultInputModes: [
      'text/plain',
      'application/json',
      'image/png',
      'image/jpeg',
      'video/mp4',
      'audio/mpeg',
      'application/lottie+json',
    ],
    defaultOutputModes: [
      'text/plain',
      'application/json',
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'image/png',
      'image/jpeg',
      'image/gif',
    ],
    skills: [
      {
        id: 'render',
        name: 'Render Video',
        description: 'Render a composition to video using FFmpeg',
        tags: ['video', 'rendering', 'ffmpeg', 'remotion'],
        examples: [
          'Render my-composition to MP4 at 1080p',
          'Create a video with title "Hello World"',
          'Generate a 30fps video with h264 codec',
        ],
      },
      {
        id: 'render-still',
        name: 'Render Still',
        description: 'Render a single frame as an image',
        tags: ['image', 'screenshot', 'still', 'thumbnail'],
        examples: [
          'Create a thumbnail at frame 30',
          'Export frame 0 as PNG',
          'Screenshot the final frame',
        ],
      },
      {
        id: 'extract-frames',
        name: 'Extract Frames',
        description: 'Extract frames from a video file',
        tags: ['frames', 'extraction', 'video'],
        examples: [
          'Extract all frames at 1 fps',
          'Get frames 0-60 from the video',
        ],
      },
      {
        id: 'media-info',
        name: 'Get Media Info',
        description: 'Get metadata about video/audio files (duration, resolution, codec)',
        tags: ['metadata', 'info', 'probe', 'duration'],
        examples: [
          'What is the duration of this video?',
          'Get the resolution and codec',
        ],
      },
      {
        id: 'composition-register',
        name: 'Register Composition',
        description: 'Register a new video composition template',
        tags: ['composition', 'template', 'setup'],
      },
    ],
    provider: {
      organization: 'LiquidCrypto',
      url: 'https://liquidcrypto.app',
    },
  };
}

// ============================================================================
// Progress Store (for SSE subscriptions)
// ============================================================================

type ProgressCallback = (event: { status: RenderStatus; progress: number; error?: string }) => void;
const progressSubscribers = new Map<string, Set<ProgressCallback>>();

/**
 * Subscribe to render progress updates.
 */
export function subscribeToProgress(renderId: string, callback: ProgressCallback): () => void {
  if (!progressSubscribers.has(renderId)) {
    progressSubscribers.set(renderId, new Set());
  }
  progressSubscribers.get(renderId)!.add(callback);

  return () => {
    const subscribers = progressSubscribers.get(renderId);
    if (subscribers) {
      subscribers.delete(callback);
      if (subscribers.size === 0) {
        progressSubscribers.delete(renderId);
      }
    }
  };
}

/**
 * Emit progress update to subscribers.
 */
export function emitProgress(
  renderId: string,
  event: { status: RenderStatus; progress: number; error?: string }
): void {
  const subscribers = progressSubscribers.get(renderId);
  if (subscribers) {
    for (const callback of subscribers) {
      callback(event);
    }
  }
}

// ============================================================================
// Server Factory
// ============================================================================

export interface VideoServerOptions {
  config?: Partial<VideoConfig>;
  enableCors?: boolean;
  enableLogging?: boolean;
}

/**
 * Create the A2A Video Elysia server.
 */
export function createVideoServer(options: VideoServerOptions = {}): Elysia {
  const {
    config: configOverrides = {},
    enableCors = true,
    enableLogging = true,
  } = options;

  // Merge config with defaults
  const config: VideoConfig = {
    port: configOverrides.port ?? DEFAULT_VIDEO_CONFIG.port ?? 8082,
    baseUrl: configOverrides.baseUrl ?? `http://localhost:${configOverrides.port ?? 8082}`,
    maxConcurrentRenders: configOverrides.maxConcurrentRenders ?? DEFAULT_VIDEO_CONFIG.maxConcurrentRenders ?? 4,
    defaultTimeout: configOverrides.defaultTimeout ?? DEFAULT_VIDEO_CONFIG.defaultTimeout ?? 600000,
    maxDuration: configOverrides.maxDuration ?? DEFAULT_VIDEO_CONFIG.maxDuration ?? 3600,
    maxResolution: configOverrides.maxResolution ?? DEFAULT_VIDEO_CONFIG.maxResolution ?? { width: 3840, height: 2160 },
    outputDir: configOverrides.outputDir ?? DEFAULT_VIDEO_CONFIG.outputDir ?? '/data/renders',
    tempDir: configOverrides.tempDir ?? DEFAULT_VIDEO_CONFIG.tempDir ?? '/tmp/video',
    assetDir: configOverrides.assetDir ?? DEFAULT_VIDEO_CONFIG.assetDir ?? '/data/assets',
    ffmpegPath: configOverrides.ffmpegPath ?? DEFAULT_VIDEO_CONFIG.ffmpegPath ?? '/usr/bin/ffmpeg',
    ffprobePath: configOverrides.ffprobePath ?? DEFAULT_VIDEO_CONFIG.ffprobePath ?? '/usr/bin/ffprobe',
    hardwareAcceleration: configOverrides.hardwareAcceleration ?? DEFAULT_VIDEO_CONFIG.hardwareAcceleration ?? false,
    defaultCodec: configOverrides.defaultCodec ?? DEFAULT_VIDEO_CONFIG.defaultCodec ?? 'h264',
    defaultCrf: configOverrides.defaultCrf ?? DEFAULT_VIDEO_CONFIG.defaultCrf ?? 18,
    containerImage: configOverrides.containerImage ?? 'liquidcrypto/a2a-video-runtime:latest',
    warmPoolSize: configOverrides.warmPoolSize ?? DEFAULT_VIDEO_CONFIG.warmPoolSize ?? 2,
    databaseUrl: configOverrides.databaseUrl ?? process.env.DATABASE_URL ?? '',
    redisUrl: configOverrides.redisUrl ?? process.env.REDIS_URL ?? '',
    natsUrl: configOverrides.natsUrl ?? process.env.NATS_URL ?? '',
  };

  const app = new Elysia({ name: 'a2a-video-server' });

  // Add CORS if enabled
  if (enableCors) {
    app.use(cors());
  }

  // Request logging
  if (enableLogging) {
    app.onRequest(({ request }) => {
      console.log(`[A2A Video] ${request.method} ${request.url}`);
    });
  }

  // Health check
  app.get('/health', () => ({
    status: 'ok',
    service: 'video',
    version: A2A_VIDEO_VERSION,
  }));

  // Agent Card (A2A compatibility)
  app.get('/.well-known/video-agent-card.json', () => getVideoAgentCard(config.baseUrl));
  app.get('/.well-known/agent-card.json', () => getVideoAgentCard(config.baseUrl));

  // JSON-RPC endpoint
  app.post(
    '/video',
    async ({ body, set }) => {
      try {
        // Handle batch requests
        if (Array.isArray(body)) {
          const responses = await handleBatchRequest(body as JsonRpcRequest[], config);
          return responses;
        }

        // Handle single request
        const request = body as JsonRpcRequest;
        const response = await handleRequest(request, config);
        return response;
      } catch (error) {
        set.status = 400;
        return jsonRpcError(
          0,
          JSON_RPC_ERRORS.PARSE_ERROR.code,
          'Failed to parse request'
        );
      }
    },
    {
      body: t.Unknown(),
    }
  );

  // SSE endpoint for render progress
  app.get(
    '/video/render/:renderId/stream',
    async ({ params, set }) => {
      set.headers['Content-Type'] = 'text/event-stream';
      set.headers['Cache-Control'] = 'no-cache';
      set.headers['Connection'] = 'keep-alive';

      const { renderId } = params;

      const stream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();

          // Send initial event
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ status: 'connected', renderId })}\n\n`)
          );

          // Subscribe to progress updates
          const unsubscribe = subscribeToProgress(renderId, (event) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
            );

            // Close stream on terminal states
            if (event.status === 'completed' || event.status === 'failed' || event.status === 'cancelled') {
              unsubscribe();
              controller.close();
            }
          });

          // Cleanup on abort
          return () => unsubscribe();
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    },
    {
      params: t.Object({
        renderId: t.String(),
      }),
    }
  );

  // Asset upload endpoint (multipart form)
  app.post(
    '/video/assets/upload',
    async ({ body }) => {
      // TODO: Implement file upload handling
      return {
        error: 'Not implemented yet. Use asset.upload JSON-RPC method with base64 data.',
      };
    }
  );

  // Static asset serving
  app.get('/renders/*', async ({ params, set }) => {
    // TODO: Implement static file serving from outputDir
    set.status = 404;
    return { error: 'File not found' };
  });

  app.get('/assets/*', async ({ params, set }) => {
    // TODO: Implement static file serving from assetDir
    set.status = 404;
    return { error: 'File not found' };
  });

  return app;
}

// ============================================================================
// Standalone Server
// ============================================================================

/**
 * Start the A2A Video server.
 */
export async function startVideoServer(options: VideoServerOptions = {}): Promise<void> {
  const port = options.config?.port ?? 8082;
  const app = createVideoServer(options);

  app.listen(port, () => {
    console.log(`[A2A Video] Server running at http://localhost:${port}`);
    console.log(`[A2A Video] Agent card: http://localhost:${port}/.well-known/video-agent-card.json`);
    console.log(`[A2A Video] JSON-RPC endpoint: http://localhost:${port}/video`);
  });
}

// ============================================================================
// Default Export
// ============================================================================

export default createVideoServer;
