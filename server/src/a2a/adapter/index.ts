/**
 * A2A Adapter Exports
 */

export {
  ElysiaA2AAdapter,
  InMemoryTaskStore,
  InMemoryPushNotificationStore,
  InMemoryEventQueue,
  type ElysiaAdapterConfig,
  type AgentExecutor,
  type AgentExecutionContext,
  type AgentExecutionResult,
  type TaskStore,
  type PushNotificationStore,
  type EventQueue,
} from './elysia-adapter.js';

// PostgreSQL stores for production
export {
  PostgresTaskStoreV1,
  PostgresPushNotificationStore,
  PostgresArtifactStore,
  PostgresMessageStore,
  PostgresSessionStore,
  createPostgresStores,
  createPostgresStoresFromEnv,
  type PostgresTaskStoreConfig,
  type ArtifactStore,
  type MessageStore,
  type SessionStore,
  type A2ASession,
} from './postgres-store.js';

