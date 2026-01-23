/**
 * Unified AI Resource Management System
 *
 * Exports all resource management components:
 * - Types and interfaces
 * - PostgreSQL store
 * - REST API routes
 * - Context compiler
 * - Memory lifecycle services (decay, consolidation, scheduling)
 * - Markdown sync service
 * - Knowledge ingestion pipeline
 */

export * from './types.js';
export { PostgresResourceStore } from './postgres-store.js';
export { registerResourceRoutes, resourceStore } from './routes.js';
export { ContextCompiler } from './context-compiler.js';
export { MemoryDecayService, MemoryConsolidationService, MemoryScheduler } from './memory-lifecycle.js';
export { MarkdownSyncService } from './markdown-sync.js';
export { KnowledgePipeline } from './knowledge-pipeline.js';
