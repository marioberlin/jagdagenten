/**
 * A2A Video JSON-RPC Handler
 *
 * Handles JSON-RPC 2.0 requests for the A2A Video video rendering server.
 */

import type {
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcError,
  VideoConfig,
  RenderRequest,
  RenderResponse,
  RenderStillRequest,
  CompositionRegistration,
  AssetUpload,
  VideoCapabilities,
  RenderRequestSchema,
  RenderStillRequestSchema,
  CompositionRegistrationSchema,
  AssetUploadSchema,
} from './types.js';
import { JSON_RPC_ERRORS, A2A_VIDEO_VERSION, A2A_VIDEO_PROTOCOL_VERSION } from './types.js';

// ============================================================================
// Method Handler Types
// ============================================================================

export interface MethodContext {
  config: VideoConfig;
  requestId: string | number;
}

export type MethodHandler<P = unknown, R = unknown> = (
  params: P,
  context: MethodContext
) => Promise<R>;

// ============================================================================
// Method Registry
// ============================================================================

const methods: Map<string, MethodHandler> = new Map();

/**
 * Register a method handler.
 */
export function registerMethod<P, R>(
  name: string,
  handler: MethodHandler<P, R>
): void {
  methods.set(name, handler as MethodHandler);
}

/**
 * Get a registered method handler.
 */
export function getMethod(name: string): MethodHandler | undefined {
  return methods.get(name);
}

// ============================================================================
// Core Method Implementations
// ============================================================================

// Placeholder stores (will be replaced with PostgreSQL/Redis in Phase 5)
const compositions = new Map<string, CompositionRegistration>();
const renders = new Map<string, RenderResponse>();
const assets = new Map<string, AssetUpload & { id: string; createdAt: Date }>();

/**
 * Render a video composition.
 */
registerMethod<RenderRequest, RenderResponse>('render', async (params, context) => {
  // Validate params
  // const validated = RenderRequestSchema.parse(params);

  const renderId = `render-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const composition = compositions.get(params.compositionId);
  if (!composition) {
    throw createError(
      JSON_RPC_ERRORS.COMPOSITION_NOT_FOUND.code,
      `Composition "${params.compositionId}" not found`
    );
  }

  const response: RenderResponse = {
    renderId,
    status: 'queued',
    progress: 0,
    estimatedTimeRemaining: 60, // Placeholder
  };

  renders.set(renderId, response);

  // In production, this would enqueue a job to NATS
  // For now, return immediately with queued status

  return response;
});

/**
 * Get render status.
 */
registerMethod<{ renderId: string }, RenderResponse>('render.status', async (params) => {
  const render = renders.get(params.renderId);
  if (!render) {
    throw createError(
      JSON_RPC_ERRORS.RENDER_NOT_FOUND.code,
      `Render "${params.renderId}" not found`
    );
  }
  return render;
});

/**
 * Cancel a render.
 */
registerMethod<{ renderId: string }, { cancelled: boolean }>('render.cancel', async (params) => {
  const render = renders.get(params.renderId);
  if (!render) {
    throw createError(
      JSON_RPC_ERRORS.RENDER_NOT_FOUND.code,
      `Render "${params.renderId}" not found`
    );
  }

  if (render.status === 'completed' || render.status === 'failed' || render.status === 'cancelled') {
    throw createError(
      JSON_RPC_ERRORS.RENDER_NOT_CANCELABLE.code,
      `Render "${params.renderId}" cannot be cancelled (status: ${render.status})`
    );
  }

  render.status = 'cancelled';
  renders.set(params.renderId, render);

  return { cancelled: true };
});

/**
 * List renders.
 */
registerMethod<{ limit?: number; offset?: number; status?: string }, RenderResponse[]>(
  'render.list',
  async (params) => {
    const { limit = 20, offset = 0, status } = params;

    let results = Array.from(renders.values());

    if (status) {
      results = results.filter((r) => r.status === status);
    }

    return results.slice(offset, offset + limit);
  }
);

/**
 * Render a single frame (still).
 */
registerMethod<RenderStillRequest, { imageUrl: string; frame: number }>(
  'render.still',
  async (params) => {
    const composition = compositions.get(params.compositionId);
    if (!composition) {
      throw createError(
        JSON_RPC_ERRORS.COMPOSITION_NOT_FOUND.code,
        `Composition "${params.compositionId}" not found`
      );
    }

    // Placeholder - in production, render the frame
    return {
      imageUrl: `/renders/still-${params.compositionId}-${params.frame}.${params.imageFormat}`,
      frame: params.frame || 0,
    };
  }
);

/**
 * Register a composition.
 */
registerMethod<CompositionRegistration, { compositionId: string; registered: boolean }>(
  'composition.register',
  async (params) => {
    // Validate params
    // const validated = CompositionRegistrationSchema.parse(params);

    if (compositions.has(params.id)) {
      // Update existing
      compositions.set(params.id, params);
      return { compositionId: params.id, registered: true };
    }

    compositions.set(params.id, params);
    return { compositionId: params.id, registered: true };
  }
);

/**
 * List compositions.
 */
registerMethod<{ limit?: number; offset?: number }, CompositionRegistration[]>(
  'composition.list',
  async (params) => {
    const { limit = 20, offset = 0 } = params;
    return Array.from(compositions.values()).slice(offset, offset + limit);
  }
);

/**
 * Get a composition.
 */
registerMethod<{ compositionId: string }, CompositionRegistration>(
  'composition.get',
  async (params) => {
    const composition = compositions.get(params.compositionId);
    if (!composition) {
      throw createError(
        JSON_RPC_ERRORS.COMPOSITION_NOT_FOUND.code,
        `Composition "${params.compositionId}" not found`
      );
    }
    return composition;
  }
);

/**
 * Delete a composition.
 */
registerMethod<{ compositionId: string }, { deleted: boolean }>(
  'composition.delete',
  async (params) => {
    if (!compositions.has(params.compositionId)) {
      throw createError(
        JSON_RPC_ERRORS.COMPOSITION_NOT_FOUND.code,
        `Composition "${params.compositionId}" not found`
      );
    }
    compositions.delete(params.compositionId);
    return { deleted: true };
  }
);

/**
 * Upload an asset.
 */
registerMethod<AssetUpload, { assetId: string; uploaded: boolean }>(
  'asset.upload',
  async (params) => {
    const assetId = `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    assets.set(assetId, {
      ...params,
      id: assetId,
      createdAt: new Date(),
    });

    return { assetId, uploaded: true };
  }
);

/**
 * List assets.
 */
registerMethod<{ type?: string; limit?: number; offset?: number }, Array<AssetUpload & { id: string }>>(
  'asset.list',
  async (params) => {
    const { type, limit = 20, offset = 0 } = params;

    let results = Array.from(assets.values());

    if (type) {
      results = results.filter((a) => a.type === type);
    }

    return results.slice(offset, offset + limit);
  }
);

/**
 * Delete an asset.
 */
registerMethod<{ assetId: string }, { deleted: boolean }>(
  'asset.delete',
  async (params) => {
    if (!assets.has(params.assetId)) {
      throw createError(
        JSON_RPC_ERRORS.ASSET_NOT_FOUND.code,
        `Asset "${params.assetId}" not found`
      );
    }
    assets.delete(params.assetId);
    return { deleted: true };
  }
);

/**
 * Get server capabilities.
 */
registerMethod<undefined, VideoCapabilities>('getCapabilities', async (_, context) => {
  return {
    version: A2A_VIDEO_VERSION,
    protocolVersion: A2A_VIDEO_PROTOCOL_VERSION,
    supportedCodecs: ['h264', 'h265', 'vp8', 'vp9', 'prores'],
    supportedFormats: ['mp4', 'webm', 'gif', 'mov', 'png-sequence'],
    maxDuration: context.config.maxDuration,
    maxResolution: context.config.maxResolution,
    hardwareAcceleration: context.config.hardwareAcceleration,
    maxConcurrentRenders: context.config.maxConcurrentRenders,
    features: {
      audio: true,
      transitions: true,
      threeD: true, // Via Puppeteer fallback
      lottie: true,
      captions: true,
      tailwind: true,
      charts: true,
    },
  };
});

// ============================================================================
// Handler Functions
// ============================================================================

/**
 * Create a JSON-RPC error.
 */
function createError(code: number, message: string, data?: unknown): JsonRpcError {
  return { code, message, data };
}

/**
 * Create a JSON-RPC success response.
 */
export function jsonRpcSuccess<T>(id: string | number, result: T): JsonRpcResponse<T> {
  return {
    jsonrpc: '2.0',
    id,
    result,
  };
}

/**
 * Create a JSON-RPC error response.
 */
export function jsonRpcError(
  id: string | number,
  code: number,
  message: string,
  data?: unknown
): JsonRpcResponse {
  return {
    jsonrpc: '2.0',
    id,
    error: { code, message, data },
  };
}

/**
 * Handle a JSON-RPC request.
 */
export async function handleRequest(
  request: JsonRpcRequest,
  config: VideoConfig
): Promise<JsonRpcResponse> {
  // Validate JSON-RPC version
  if (request.jsonrpc !== '2.0') {
    return jsonRpcError(
      request.id,
      JSON_RPC_ERRORS.INVALID_REQUEST.code,
      'Invalid JSON-RPC version'
    );
  }

  // Get method handler
  const handler = getMethod(request.method);
  if (!handler) {
    return jsonRpcError(
      request.id,
      JSON_RPC_ERRORS.METHOD_NOT_FOUND.code,
      `Method "${request.method}" not found`
    );
  }

  try {
    const context: MethodContext = {
      config,
      requestId: request.id,
    };

    const result = await handler(request.params, context);
    return jsonRpcSuccess(request.id, result);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
      // JSON-RPC error
      const rpcError = error as JsonRpcError;
      return jsonRpcError(request.id, rpcError.code, rpcError.message, rpcError.data);
    }

    // Internal error
    const message = error instanceof Error ? error.message : 'Unknown error';
    return jsonRpcError(
      request.id,
      JSON_RPC_ERRORS.INTERNAL_ERROR.code,
      message
    );
  }
}

/**
 * Handle a batch of JSON-RPC requests.
 */
export async function handleBatchRequest(
  requests: JsonRpcRequest[],
  config: VideoConfig
): Promise<JsonRpcResponse[]> {
  return Promise.all(requests.map((req) => handleRequest(req, config)));
}
