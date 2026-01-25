/**
 * A2A TypeScript SDK
 *
 * A TypeScript library for building agentic applications that follow the
 * Agent2Agent (A2A) Protocol.
 *
 * This SDK supports both v0.x and v1.0 protocol formats with automatic
 * detection and conversion via the compatibility layer.
 */
export * from './types/index.js';
export * as v1 from './types/v1.js';
export * as a2ui from './types/a2ui.js';
export * from './compat/index.js';
export { A2AClient, createA2AClient, createA2AClientFromUrl, A2AClientError, A2ATimeoutError, A2AConnectionError, type A2AClientConfig, type RequestContext, type StreamEvent, } from './client/v1-client.js';
export { BaseDatabaseTaskStore, type DatabaseConfig, type DatabaseTaskStore, } from './server/database/task-store.js';
export { PostgresTaskStore, type PostgresConfig, } from './server/database/postgres-task-store.js';
