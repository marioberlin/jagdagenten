/**
 * A2A TypeScript SDK - Browser Entry Point
 *
 * This is a browser-safe entry point that excludes Node.js-specific
 * modules like PostgresTaskStore that require 'pg' and 'Buffer'.
 */

// Core types (v0.x format for backwards compatibility)
export * from './types/index.js';

// v1.0 types
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
} from './client/v1-client.js';

// NOTE: Database stores (PostgresTaskStore, BaseDatabaseTaskStore) are
// excluded from this browser entry point. Import from '@liquidcrypto/a2a-sdk/server'
// for server-side code that needs database persistence.
