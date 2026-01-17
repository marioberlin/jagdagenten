/**
 * A2A Elysia Plugin
 *
 * Integrates the A2A adapter into the Elysia server.
 * Provides /.well-known/agent-card.json discovery and /a2a endpoints.
 */

import { Elysia } from 'elysia';
import {
  ElysiaA2AAdapter,
  createPostgresStoresFromEnv,
  type TaskStore,
  type PushNotificationStore,
  type ArtifactStore,
  type MessageStore,
  type SessionStore,
} from './adapter/index.js';
import { LiquidCryptoExecutor, getLiquidCryptoAgentCard } from './executors/index.js';
import {
  instrumentTaskStore,
  instrumentPushNotificationStore,
  createA2ATelemetryMiddleware,
  traceStreamEvent,
} from './telemetry/index.js';
import { isTelemetryEnabled } from '../telemetry.js';

export interface A2APluginConfig {
  baseUrl?: string;
  enableStreaming?: boolean;
  /** Override task store (defaults to PostgreSQL if DATABASE_URL is set, else in-memory) */
  taskStore?: TaskStore;
  /** Override push notification store */
  pushNotificationStore?: PushNotificationStore;
  /** Artifact store for session logging */
  artifactStore?: ArtifactStore;
  /** Message store for session logging */
  messageStore?: MessageStore;
  /** Session store for tracking contexts */
  sessionStore?: SessionStore;
  /** Enable telemetry instrumentation (defaults to OTEL_ENABLED) */
  enableTelemetry?: boolean;
}

/**
 * Create the A2A plugin for Elysia
 */
export function createA2APlugin(config: A2APluginConfig = {}) {
  const baseUrl = config.baseUrl || `http://localhost:${process.env.PORT || 3000}`;
  const telemetryEnabled = config.enableTelemetry ?? isTelemetryEnabled();

  // Determine which stores to use
  let taskStore = config.taskStore;
  let pushNotificationStore = config.pushNotificationStore;
  let artifactStore = config.artifactStore;
  let messageStore = config.messageStore;
  let sessionStore = config.sessionStore;

  // Auto-configure PostgreSQL stores if DATABASE_URL is available
  if (!taskStore && !pushNotificationStore) {
    const pgStores = createPostgresStoresFromEnv();
    if (pgStores) {
      taskStore = pgStores.taskStore;
      pushNotificationStore = pgStores.pushNotificationStore;
      artifactStore = pgStores.artifactStore;
      messageStore = pgStores.messageStore;
      sessionStore = pgStores.sessionStore;
      console.log('[A2A] Using PostgreSQL stores for task/artifact/message persistence');
    } else {
      console.log('[A2A] Using in-memory stores (set DATABASE_URL for PostgreSQL)');
    }
  }

  // Wrap stores with telemetry if enabled
  if (telemetryEnabled) {
    if (taskStore) {
      taskStore = instrumentTaskStore(taskStore);
    }
    if (pushNotificationStore) {
      pushNotificationStore = instrumentPushNotificationStore(pushNotificationStore);
    }
    console.log('[A2A] Telemetry instrumentation enabled');
  }

  // Create executor and adapter
  const executor = new LiquidCryptoExecutor();
  const agentCard = getLiquidCryptoAgentCard(baseUrl);
  const adapter = new ElysiaA2AAdapter({
    agentCard,
    executor,
    taskStore,
    pushNotificationStore,
    // A2A v1.0 persistence stores
    artifactStore,
    messageStore,
    sessionStore,
  });

  // Create telemetry middleware
  const telemetry = telemetryEnabled ? createA2ATelemetryMiddleware() : null;

  return new Elysia({ name: 'a2a' })
    // Canonical Agent Card discovery (A2A v1.0 spec)
    .get('/.well-known/agent-card.json', () => {
      return getLiquidCryptoAgentCard(baseUrl);
    })

    // Legacy Agent Card discovery (backward compatibility)
    .get('/.well-known/agent.json', () => {
      return getLiquidCryptoAgentCard(baseUrl);
    })

    // Main A2A JSON-RPC endpoint
    .post('/a2a', async ({ body, set }) => {
      const request = body as { method?: string; id?: string | number };
      const span = telemetry?.onRequest(request.method ?? 'unknown', request.id ?? null);

      try {
        const result = await adapter.handleRequest(body);

        // Extract task info for telemetry
        const response = result as { result?: { id?: string; status?: { state?: string } } };
        if (span && telemetry) {
          telemetry.onSuccess(
            span,
            response.result?.id,
            response.result?.status?.state
          );
        }

        return result;
      } catch (error) {
        if (span && telemetry) {
          telemetry.onError(span, error instanceof Error ? error : new Error(String(error)));
        }
        set.status = 500;
        return {
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: error instanceof Error ? error.message : 'Internal error',
          },
          id: null,
        };
      }
    })

    // Streaming endpoint (SSE)
    .get('/a2a/stream', async function* ({ query, set }) {
      const taskId = query.taskId as string | undefined;

      if (!taskId) {
        set.status = 400;
        yield `data: ${JSON.stringify({ error: 'taskId required' })}\n\n`;
        return;
      }

      set.headers['Content-Type'] = 'text/event-stream';
      set.headers['Cache-Control'] = 'no-cache';
      set.headers['Connection'] = 'keep-alive';

      try {
        for await (const event of adapter.handleStreamRequest({ taskId })) {
          // Trace stream events if event is an object
          if (telemetryEnabled && typeof event === 'object' && event !== null) {
            const evt = event as Record<string, unknown>;
            const eventType: 'status_update' | 'artifact_update' = 'status' in evt ? 'status_update' : 'artifact_update';
            const isFinal = 'final' in evt ? Boolean(evt.final) : false;
            traceStreamEvent(taskId, eventType, isFinal);
          }
          yield `data: ${JSON.stringify(event)}\n\n`;
        }
      } catch (error) {
        yield `data: ${JSON.stringify({
          error: error instanceof Error ? error.message : 'Stream error'
        })}\n\n`;
      }
    })

    // Alternative streaming via POST
    .post('/a2a/stream', async function* ({ body, set }) {
      set.headers['Content-Type'] = 'text/event-stream';
      set.headers['Cache-Control'] = 'no-cache';
      set.headers['Connection'] = 'keep-alive';

      const request = body as { taskId?: string };

      if (!request.taskId) {
        yield `data: ${JSON.stringify({ error: 'taskId required' })}\n\n`;
        return;
      }

      try {
        for await (const event of adapter.handleStreamRequest({ taskId: request.taskId })) {
          // Trace stream events if event is an object
          if (telemetryEnabled && typeof event === 'object' && event !== null) {
            const evt = event as Record<string, unknown>;
            const eventType: 'status_update' | 'artifact_update' = 'status' in evt ? 'status_update' : 'artifact_update';
            const isFinal = 'final' in evt ? Boolean(evt.final) : false;
            traceStreamEvent(request.taskId, eventType, isFinal);
          }
          yield `data: ${JSON.stringify(event)}\n\n`;
        }
      } catch (error) {
        yield `data: ${JSON.stringify({
          error: error instanceof Error ? error.message : 'Stream error'
        })}\n\n`;
      }
    });
}

export { ElysiaA2AAdapter, LiquidCryptoExecutor, getLiquidCryptoAgentCard };
