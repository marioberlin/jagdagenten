/**
 * A2A TypeScript SDK
 *
 * A TypeScript library for building agentic applications that follow the
 * Agent2Agent (A2A) Protocol.
 *
 * This SDK supports both v0.x and v1.0 protocol formats with automatic
 * detection and conversion via the compatibility layer.
 */

// Core types (v0.x format for backwards compatibility)
export * from './types/index.js';

// v1.0 types (import from '@liquidcrypto/a2a-sdk/types/v1' for explicit v1.0)
export * as v1 from './types/v1.js';

// A2UI types (Agent-to-UI rendering)
export * as a2ui from './types/a2ui.js';

// Compatibility layer for v0.x <-> v1.0 conversion
export * from './compat/index.js';

// v1.0 Client (production-ready, fully compliant)
export {
  A2AClient,
  createA2AClient,
  createA2AClientFromUrl,
  A2AClientError,
  A2ATimeoutError,
  A2AConnectionError,
  type A2AClientConfig,
  type RequestContext,
  type StreamEvent,
} from './client/v1-client.js';

// Database stores for task persistence
export {
  BaseDatabaseTaskStore,
  type DatabaseConfig,
  type DatabaseTaskStore,
} from './server/database/task-store.js';

export {
  PostgresTaskStore,
  type PostgresConfig,
} from './server/database/postgres-task-store.js';
