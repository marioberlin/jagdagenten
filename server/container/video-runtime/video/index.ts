/**
 * A2A Video v1.0 - Remotion-Compatible Video Rendering Server
 *
 * Main entry point for the A2A Video module.
 *
 * A2A Video is a Remotion-compatible video rendering server that uses FFmpeg
 * for high-performance video processing. It provides:
 *
 * - Frame-based animation (interpolate, spring, easing)
 * - Timeline management (sequences, series, transitions)
 * - FFmpeg integration (encoding, decoding, audio mixing)
 * - Asset management (fonts, images, videos, Lottie)
 * - Tailwind CSS compilation
 * - Natural language intent routing
 */

// Types
export * from './types.js';

// Server
export {
  createVideoServer,
  startVideoServer,
  getVideoAgentCard,
  subscribeToProgress,
  emitProgress,
  type VideoServerOptions,
} from './server.js';

// Handler
export {
  handleRequest,
  handleBatchRequest,
  registerMethod,
  getMethod,
  jsonRpcSuccess,
  jsonRpcError,
  type MethodContext,
  type MethodHandler,
} from './handler.js';

// Animation
export * from './animation/index.js';

// Timeline
export * from './timeline/index.js';

// FFmpeg
export * from './ffmpeg/index.js';

// Assets
export * from './assets/index.js';

// Renderer
export * from './renderer/index.js';

// Intent
export * from './intent/index.js';

// Jobs (NATS queue)
export * from './jobs/index.js';

// Store (PostgreSQL + Redis)
export * from './store/index.js';

// Observability (Metrics + Tracing)
export * from './observability/index.js';
