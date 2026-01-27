/**
 * A2A Idempotency Middleware
 *
 * Provides message deduplication using messageId.
 * Caches responses for 24 hours to handle retries.
 *
 * For production, this should use Redis. For demo, we use in-memory cache.
 */

import type { JsonRpcResponse } from '../types.js';

// ============================================================================
// Types
// ============================================================================

export interface IdempotencyEntry {
  messageId: string;
  response: JsonRpcResponse;
  createdAt: Date;
  expiresAt: Date;
}

export interface IdempotencyStore {
  get(messageId: string): Promise<IdempotencyEntry | null>;
  set(entry: IdempotencyEntry): Promise<void>;
  delete(messageId: string): Promise<void>;
  cleanup(): Promise<void>;
}

// ============================================================================
// In-Memory Store (for demo)
// ============================================================================

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

class InMemoryIdempotencyStore implements IdempotencyStore {
  private cache = new Map<string, IdempotencyEntry>();
  private cleanupInterval: Timer | null = null;

  constructor(cleanupIntervalMs: number = 60 * 60 * 1000) {
    // Clean up expired entries every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, cleanupIntervalMs);
  }

  async get(messageId: string): Promise<IdempotencyEntry | null> {
    const entry = this.cache.get(messageId);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (entry.expiresAt < new Date()) {
      this.cache.delete(messageId);
      return null;
    }

    return entry;
  }

  async set(entry: IdempotencyEntry): Promise<void> {
    this.cache.set(entry.messageId, entry);
  }

  async delete(messageId: string): Promise<void> {
    this.cache.delete(messageId);
  }

  async cleanup(): Promise<void> {
    const now = new Date();
    for (const [messageId, entry] of this.cache) {
      if (entry.expiresAt < now) {
        this.cache.delete(messageId);
      }
    }
  }

  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  size(): number {
    return this.cache.size;
  }
}

// ============================================================================
// Redis Store (for production)
// ============================================================================

// Note: This is a placeholder. In production, you'd implement this with ioredis.
// For now, we're using the in-memory store for the demo.

export interface RedisIdempotencyStoreOptions {
  redisUrl: string;
  keyPrefix?: string;
  ttlMs?: number;
}

// Placeholder for future Redis implementation
// class RedisIdempotencyStore implements IdempotencyStore { ... }

// ============================================================================
// Singleton Instance
// ============================================================================

let idempotencyStore: InMemoryIdempotencyStore | null = null;

export function getIdempotencyStore(): IdempotencyStore {
  if (!idempotencyStore) {
    idempotencyStore = new InMemoryIdempotencyStore();
  }
  return idempotencyStore;
}

export function resetIdempotencyStore(): void {
  if (idempotencyStore) {
    idempotencyStore.stop();
    idempotencyStore = null;
  }
}

// ============================================================================
// Middleware Handler
// ============================================================================

export interface IdempotencyOptions {
  ttlMs?: number;
  store?: IdempotencyStore;
}

/**
 * Handle a request with idempotency checking.
 *
 * If the messageId has been seen before and the cached response hasn't expired,
 * returns the cached response. Otherwise, executes the handler and caches the result.
 *
 * @param messageId - The unique message identifier
 * @param handler - The function to execute if not cached
 * @param options - Configuration options
 * @returns The response (cached or fresh)
 */
export async function handleIdempotency<T extends JsonRpcResponse>(
  messageId: string,
  handler: () => Promise<T>,
  options: IdempotencyOptions = {}
): Promise<T> {
  const { ttlMs = DEFAULT_TTL_MS, store = getIdempotencyStore() } = options;

  // Check for cached response
  const cached = await store.get(messageId);
  if (cached) {
    console.log(`[Idempotency] Cache hit for messageId: ${messageId}`);
    return cached.response as T;
  }

  // Execute handler
  const response = await handler();

  // Cache the response
  const now = new Date();
  const entry: IdempotencyEntry = {
    messageId,
    response,
    createdAt: now,
    expiresAt: new Date(now.getTime() + ttlMs),
  };

  await store.set(entry);
  console.log(`[Idempotency] Cached response for messageId: ${messageId}`);

  return response;
}

/**
 * Invalidate a cached response.
 *
 * Use this when you need to force re-execution of a request
 * (e.g., after fixing an error condition).
 */
export async function invalidateIdempotency(
  messageId: string,
  store: IdempotencyStore = getIdempotencyStore()
): Promise<void> {
  await store.delete(messageId);
  console.log(`[Idempotency] Invalidated cache for messageId: ${messageId}`);
}

// ============================================================================
// Elysia Plugin (optional integration)
// ============================================================================

import { Elysia } from 'elysia';

/**
 * Elysia plugin that adds idempotency checking to the context.
 *
 * Usage:
 * ```typescript
 * const app = new Elysia()
 *   .use(idempotencyPlugin)
 *   .post('/a2a', async ({ body, idempotency }) => {
 *     return idempotency.handle(body.id, async () => {
 *       // Your handler logic
 *     });
 *   });
 * ```
 */
export const idempotencyPlugin = new Elysia({ name: 'idempotency' }).derive(() => {
  const store = getIdempotencyStore();

  return {
    idempotency: {
      /**
       * Handle a request with idempotency checking
       */
      handle: <T extends JsonRpcResponse>(
        messageId: string,
        handler: () => Promise<T>,
        ttlMs?: number
      ) => handleIdempotency(messageId, handler, { store, ttlMs }),

      /**
       * Invalidate a cached response
       */
      invalidate: (messageId: string) => invalidateIdempotency(messageId, store),

      /**
       * Get cache statistics
       */
      stats: () => ({
        size: (store as InMemoryIdempotencyStore).size?.() ?? -1,
      }),
    },
  };
});

// ============================================================================
// Helper: Extract messageId from A2A request
// ============================================================================

/**
 * Extract the messageId from an A2A JSON-RPC request body.
 *
 * In A2A, the messageId is typically in params.message.messageId
 */
export function extractMessageId(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;

  const request = body as Record<string, unknown>;

  // Check params.message.messageId (SendMessage/SendStreamingMessage)
  const params = request.params as Record<string, unknown> | undefined;
  if (params?.message && typeof params.message === 'object') {
    const message = params.message as Record<string, unknown>;
    if (typeof message.messageId === 'string') {
      return message.messageId;
    }
  }

  // Check params.messageId directly
  if (typeof params?.messageId === 'string') {
    return params.messageId;
  }

  // Fallback to request id (not ideal but ensures uniqueness)
  if (typeof request.id === 'string' || typeof request.id === 'number') {
    return String(request.id);
  }

  return null;
}
