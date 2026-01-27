/**
 * A2A Video Redis Cache
 *
 * Redis-based caching for render status, assets, and temporary data.
 */

import type { RenderJob, Composition, Asset } from '../types.js';

// Dynamic Redis import
let redisModule: typeof import('redis') | null = null;
let redisClient: ReturnType<typeof import('redis').createClient> | null = null;

async function getRedis() {
  if (!redisModule) {
    redisModule = await import('redis');
  }
  return redisModule;
}

export interface CacheConfig {
  redisUrl: string;
  keyPrefix?: string;
  defaultTtl?: number; // seconds
}

const DEFAULT_CONFIG: Partial<CacheConfig> = {
  keyPrefix: 'video:',
  defaultTtl: 3600, // 1 hour
};

// TTL constants (in seconds)
const TTL = {
  renderStatus: 300, // 5 minutes
  composition: 3600, // 1 hour
  asset: 86400, // 24 hours
  progress: 60, // 1 minute
  lock: 300, // 5 minutes
};

let keyPrefix = DEFAULT_CONFIG.keyPrefix!;

/**
 * Initialize Redis connection.
 */
export async function initializeRedisCache(config: CacheConfig): Promise<void> {
  const redis = await getRedis();

  keyPrefix = config.keyPrefix || DEFAULT_CONFIG.keyPrefix!;

  redisClient = redis.createClient({
    url: config.redisUrl,
  });

  redisClient.on('error', (err) => {
    console.error('[A2A Video Redis] Error:', err);
  });

  redisClient.on('connect', () => {
    console.log(`[A2A Video Redis] Connected to ${config.redisUrl}`);
  });

  await redisClient.connect();
}

/**
 * Close Redis connection.
 */
export async function closeRedisCache(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

/**
 * Get Redis client (for advanced operations).
 */
export function getRedisClient() {
  return redisClient;
}

// ============================================================================
// Key helpers
// ============================================================================

function key(...parts: string[]): string {
  return keyPrefix + parts.join(':');
}

// ============================================================================
// Render caching
// ============================================================================

/**
 * Cache render job status.
 */
export async function cacheRenderStatus(render: RenderJob): Promise<void> {
  if (!redisClient) return;

  const cacheKey = key('render', render.id);
  await redisClient.setEx(cacheKey, TTL.renderStatus, JSON.stringify(render));
}

/**
 * Get cached render status.
 */
export async function getCachedRenderStatus(renderId: string): Promise<RenderJob | null> {
  if (!redisClient) return null;

  const cacheKey = key('render', renderId);
  const cached = await redisClient.get(cacheKey);

  return cached ? (JSON.parse(cached) as RenderJob) : null;
}

/**
 * Invalidate render cache.
 */
export async function invalidateRenderCache(renderId: string): Promise<void> {
  if (!redisClient) return;

  await redisClient.del(key('render', renderId));
}

/**
 * Cache render progress (short TTL for real-time updates).
 */
export async function cacheRenderProgress(
  renderId: string,
  progress: {
    status: string;
    progress: number;
    currentFrame?: number;
    totalFrames?: number;
  }
): Promise<void> {
  if (!redisClient) return;

  const cacheKey = key('progress', renderId);
  await redisClient.setEx(cacheKey, TTL.progress, JSON.stringify(progress));
}

/**
 * Get cached render progress.
 */
export async function getCachedRenderProgress(
  renderId: string
): Promise<{
  status: string;
  progress: number;
  currentFrame?: number;
  totalFrames?: number;
} | null> {
  if (!redisClient) return null;

  const cacheKey = key('progress', renderId);
  const cached = await redisClient.get(cacheKey);

  return cached ? JSON.parse(cached) : null;
}

// ============================================================================
// Composition caching
// ============================================================================

/**
 * Cache composition.
 */
export async function cacheComposition(composition: Composition): Promise<void> {
  if (!redisClient) return;

  const cacheKey = key('composition', composition.id);
  await redisClient.setEx(cacheKey, TTL.composition, JSON.stringify(composition));
}

/**
 * Get cached composition.
 */
export async function getCachedComposition(compositionId: string): Promise<Composition | null> {
  if (!redisClient) return null;

  const cacheKey = key('composition', compositionId);
  const cached = await redisClient.get(cacheKey);

  return cached ? (JSON.parse(cached) as Composition) : null;
}

/**
 * Invalidate composition cache.
 */
export async function invalidateCompositionCache(compositionId: string): Promise<void> {
  if (!redisClient) return;

  await redisClient.del(key('composition', compositionId));
}

/**
 * Cache composition list.
 */
export async function cacheCompositionList(compositions: Composition[]): Promise<void> {
  if (!redisClient) return;

  const cacheKey = key('compositions', 'list');
  await redisClient.setEx(cacheKey, TTL.composition, JSON.stringify(compositions));
}

/**
 * Get cached composition list.
 */
export async function getCachedCompositionList(): Promise<Composition[] | null> {
  if (!redisClient) return null;

  const cacheKey = key('compositions', 'list');
  const cached = await redisClient.get(cacheKey);

  return cached ? (JSON.parse(cached) as Composition[]) : null;
}

/**
 * Invalidate composition list cache.
 */
export async function invalidateCompositionListCache(): Promise<void> {
  if (!redisClient) return;

  await redisClient.del(key('compositions', 'list'));
}

// ============================================================================
// Asset caching
// ============================================================================

/**
 * Cache asset metadata.
 */
export async function cacheAsset(asset: Asset): Promise<void> {
  if (!redisClient) return;

  const cacheKey = key('asset', asset.id);
  await redisClient.setEx(cacheKey, TTL.asset, JSON.stringify(asset));

  // Also cache by hash for deduplication lookups
  if (asset.hash) {
    const hashKey = key('asset-hash', asset.hash);
    await redisClient.setEx(hashKey, TTL.asset, asset.id);
  }
}

/**
 * Get cached asset.
 */
export async function getCachedAsset(assetId: string): Promise<Asset | null> {
  if (!redisClient) return null;

  const cacheKey = key('asset', assetId);
  const cached = await redisClient.get(cacheKey);

  return cached ? (JSON.parse(cached) as Asset) : null;
}

/**
 * Get asset ID by hash.
 */
export async function getAssetIdByHash(hash: string): Promise<string | null> {
  if (!redisClient) return null;

  const hashKey = key('asset-hash', hash);
  return redisClient.get(hashKey);
}

/**
 * Invalidate asset cache.
 */
export async function invalidateAssetCache(assetId: string, hash?: string): Promise<void> {
  if (!redisClient) return;

  await redisClient.del(key('asset', assetId));

  if (hash) {
    await redisClient.del(key('asset-hash', hash));
  }
}

// ============================================================================
// Distributed locking
// ============================================================================

/**
 * Acquire a distributed lock.
 */
export async function acquireLock(
  lockName: string,
  ttlSeconds: number = TTL.lock
): Promise<string | null> {
  if (!redisClient) return null;

  const lockKey = key('lock', lockName);
  const lockValue = crypto.randomUUID();

  // Use SET NX to atomically acquire lock
  const result = await redisClient.set(lockKey, lockValue, {
    NX: true,
    EX: ttlSeconds,
  });

  return result === 'OK' ? lockValue : null;
}

/**
 * Release a distributed lock.
 */
export async function releaseLock(lockName: string, lockValue: string): Promise<boolean> {
  if (!redisClient) return false;

  const lockKey = key('lock', lockName);

  // Use Lua script to atomically check and delete
  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;

  const result = await redisClient.eval(script, {
    keys: [lockKey],
    arguments: [lockValue],
  });

  return result === 1;
}

/**
 * Extend a lock's TTL.
 */
export async function extendLock(
  lockName: string,
  lockValue: string,
  ttlSeconds: number
): Promise<boolean> {
  if (!redisClient) return false;

  const lockKey = key('lock', lockName);

  // Use Lua script to atomically check and extend
  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("expire", KEYS[1], ARGV[2])
    else
      return 0
    end
  `;

  const result = await redisClient.eval(script, {
    keys: [lockKey],
    arguments: [lockValue, ttlSeconds.toString()],
  });

  return result === 1;
}

// ============================================================================
// Rate limiting
// ============================================================================

/**
 * Check rate limit using sliding window.
 */
export async function checkRateLimit(
  key_: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  if (!redisClient) {
    return { allowed: true, remaining: limit, resetAt: Date.now() + windowSeconds * 1000 };
  }

  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;
  const rateKey = key('rate', key_);

  // Remove old entries and count current
  await redisClient.zRemRangeByScore(rateKey, 0, windowStart);
  const count = await redisClient.zCard(rateKey);

  if (count >= limit) {
    const oldest = await redisClient.zRange(rateKey, 0, 0, { BY: 'SCORE' });
    const resetAt = oldest.length > 0 ? parseInt(oldest[0]) + windowSeconds * 1000 : now + windowSeconds * 1000;

    return {
      allowed: false,
      remaining: 0,
      resetAt,
    };
  }

  // Add current request
  await redisClient.zAdd(rateKey, { score: now, value: now.toString() });
  await redisClient.expire(rateKey, windowSeconds);

  return {
    allowed: true,
    remaining: limit - count - 1,
    resetAt: now + windowSeconds * 1000,
  };
}

// ============================================================================
// Pub/Sub for real-time updates
// ============================================================================

/**
 * Subscribe to render progress updates.
 */
export async function subscribeToRenderUpdates(
  renderId: string,
  callback: (progress: unknown) => void
): Promise<() => void> {
  if (!redisClient) {
    return () => {};
  }

  const redis = await getRedis();
  const subscriber = redisClient.duplicate();
  await subscriber.connect();

  const channel = key('updates', renderId);

  await subscriber.subscribe(channel, (message) => {
    try {
      callback(JSON.parse(message));
    } catch (e) {
      console.error('[A2A Video Redis] Failed to parse update:', e);
    }
  });

  return async () => {
    await subscriber.unsubscribe(channel);
    await subscriber.quit();
  };
}

/**
 * Publish render progress update.
 */
export async function publishRenderUpdate(renderId: string, progress: unknown): Promise<void> {
  if (!redisClient) return;

  const channel = key('updates', renderId);
  await redisClient.publish(channel, JSON.stringify(progress));
}

// ============================================================================
// Cache statistics
// ============================================================================

/**
 * Get cache statistics.
 */
export async function getCacheStats(): Promise<{
  connected: boolean;
  memoryUsed?: number;
  keyCount?: number;
}> {
  if (!redisClient) {
    return { connected: false };
  }

  try {
    const info = await redisClient.info('memory');
    const keyCount = await redisClient.dbSize();

    const memoryMatch = info.match(/used_memory:(\d+)/);
    const memoryUsed = memoryMatch ? parseInt(memoryMatch[1]) : undefined;

    return {
      connected: true,
      memoryUsed,
      keyCount,
    };
  } catch {
    return { connected: false };
  }
}

/**
 * Clear all A2A Video cache keys.
 */
export async function clearCache(): Promise<number> {
  if (!redisClient) return 0;

  const pattern = key('*');
  let deleted = 0;
  let cursor = 0;

  do {
    const result = await redisClient.scan(cursor, { MATCH: pattern, COUNT: 100 });
    cursor = result.cursor;

    if (result.keys.length > 0) {
      await redisClient.del(result.keys);
      deleted += result.keys.length;
    }
  } while (cursor !== 0);

  return deleted;
}
