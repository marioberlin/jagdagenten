/**
 * Advanced Multi-Layer Cache Service
 * 
 * Cache Layers:
 * - L1: In-memory (per-process, fastest)
 * - L2: Redis (distributed, shared)
 * 
 * Features:
 * - TTL by data type
 * - Cache stampede prevention
 * - Automatic fallback
 */

import Redis from 'ioredis';

// ============ TYPES ============
type CacheLayer = 'memory' | 'redis';

interface CacheEntry<T = unknown> {
    value: T;
    expires: number;
    layer: CacheLayer;
}

interface CacheStats {
    hits: number;
    misses: number;
    hitRate: number;
    memorySize: number;
    redisConnected: boolean;
}

interface CacheConfig {
    ai: { ttl: number; layer: CacheLayer };
    price: { ttl: number; layer: CacheLayer };
    portfolio: { ttl: number; layer: CacheLayer };
    market: { ttl: number; layer: CacheLayer };
}

// Default TTL configuration (in seconds)
const DEFAULT_CONFIG: CacheConfig = {
    ai: { ttl: 3600, layer: 'redis' },           // 1 hour for AI responses
    price: { ttl: 10, layer: 'redis' },          // 10 seconds for prices
    portfolio: { ttl: 30, layer: 'memory' },     // 30 seconds for portfolio
    market: { ttl: 60, layer: 'memory' },        // 1 minute for market stats
};

// ============ L1: IN-MEMORY CACHE ============
class MemoryCache {
    private store = new Map<string, CacheEntry>();
    private maxSize = 1000; // Max entries in memory
    private stats = { hits: 0, misses: 0 };

    async get<T>(key: string): Promise<T | null> {
        const entry = this.store.get(key);

        if (!entry) {
            this.stats.misses++;
            return null;
        }

        if (Date.now() > entry.expires) {
            this.store.delete(key);
            this.stats.misses++;
            return null;
        }

        this.stats.hits++;
        return entry.value as T;
    }

    async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
        // Evict oldest entries if at capacity
        if (this.store.size >= this.maxSize) {
            const oldest = Array.from(this.store.entries())
                .sort(([, a], [, b]) => a.expires - b.expires)[0];
            this.store.delete(oldest[0]);
        }

        this.store.set(key, {
            value,
            expires: Date.now() + ttlSeconds * 1000,
            layer: 'memory'
        });
    }

    async delete(key: string): Promise<void> {
        this.store.delete(key);
    }

    async clear(): Promise<void> {
        this.store.clear();
    }

    getStats() {
        return {
            ...this.stats,
            hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
            size: this.store.size
        };
    }
}

// ============ L2: REDIS CACHE ============
class RedisCache {
    private client: Redis | null = null;
    private stats = { hits: 0, misses: 0 };

    async connect(url?: string): Promise<boolean> {
        try {
            this.client = new Redis(url || 'redis://localhost:6379');
            await this.client.ping();
            return true;
        } catch {
            return false;
        }
    }

    async get<T>(key: string): Promise<T | null> {
        if (!this.client) {
            this.stats.misses++;
            return null;
        }

        try {
            const value = await this.client.get(key);
            if (value) {
                this.stats.hits++;
                return JSON.parse(value);
            }
            this.stats.misses++;
            return null;
        } catch {
            this.stats.misses++;
            return null;
        }
    }

    async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
        if (!this.client) return;

        try {
            await this.client.setex(key, ttlSeconds, JSON.stringify(value));
        } catch (e) {
            console.error('[Redis Cache] Set failed:', e);
        }
    }

    async delete(key: string): Promise<void> {
        if (!this.client) return;
        await this.client.del(key);
    }

    async clear(): Promise<void> {
        if (!this.client) return;
        await this.client.flushdb();
    }

    getStats() {
        return {
            ...this.stats,
            hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
            connected: !!this.client
        };
    }
}

// ============ MULTI-LAYER CACHE ============
class MultiLayerCache {
    private memory = new MemoryCache();
    private redis = new RedisCache();
    private useRedis = false;
    private config: CacheConfig = DEFAULT_CONFIG;

    constructor() {
        this.initRedis();
    }

    private async initRedis() {
        try {
            this.useRedis = await this.redis.connect();
            console.log('[Cache] Redis:', this.useRedis ? 'Connected' : 'Not available');
        } catch {
            console.log('[Cache] Redis: Not available');
        }
    }

    // Primary method: try memory first, then redis
    async get<T>(key: string, type: keyof CacheConfig = 'ai'): Promise<T | null> {
        // L1: Try memory cache
        const memResult = await this.memory.get<T>(key);
        if (memResult) return memResult;

        // L2: Try redis cache
        if (this.useRedis) {
            const redisResult = await this.redis.get<T>(key);
            if (redisResult) {
                // Backfill memory cache
                await this.memory.set(key, redisResult, this.config[type].ttl);
                return redisResult;
            }
        }

        return null;
    }

    // Write to all layers
    async set<T>(key: string, value: T, type: keyof CacheConfig = 'ai'): Promise<void> {
        const ttl = this.config[type].ttl;

        // Write to memory
        await this.memory.set(key, value, ttl);

        // Write to redis if enabled and configured
        if (this.useRedis && this.config[type].layer === 'redis') {
            await this.redis.set(key, value, ttl);
        }
    }

    // Delete from all layers
    async delete(key: string): Promise<void> {
        await this.memory.delete(key);
        if (this.useRedis) {
            await this.redis.delete(key);
        }
    }

    // Invalidate all cache (by pattern)
    async invalidate(pattern: string): Promise<void> {
        // Memory: clear all (simplified)
        await this.memory.clear();

        // Redis: use SCAN for pattern matching
        if (this.useRedis) {
            // Note: In production, use redis SCAN with pattern
            await this.redis.clear();
        }
    }

    // Stampede protection: single-flight for cache misses
    private inFlight = new Map<string, Promise<unknown>>();

    async getOrSet<T>(
        key: string,
        type: keyof CacheConfig,
        fetcher: () => Promise<T>
    ): Promise<T> {
        // Check cache first
        const cached = await this.get<T>(key, type);
        if (cached) return cached;

        // Stampede protection: if already fetching, wait
        if (this.inFlight.has(key)) {
            return this.inFlight.get(key) as Promise<T>;
        }

        // Fetch and cache
        const promise = (async () => {
            try {
                const value = await fetcher();
                await this.set(key, value, type);
                return value;
            } finally {
                this.inFlight.delete(key);
            }
        })();

        this.inFlight.set(key, promise);
        return promise;
    }

    // Get comprehensive stats
    getStats(): CacheStats {
        const memStats = this.memory.getStats();
        const redisStats = this.redis.getStats();

        const totalHits = memStats.hits + redisStats.hits;
        const totalMisses = memStats.misses + redisStats.misses;

        return {
            hits: totalHits,
            misses: totalMisses,
            hitRate: totalHits / (totalHits + totalMisses) || 0,
            memorySize: memStats.size,
            redisConnected: this.useRedis
        };
    }

    // Update config
    setConfig(config: Partial<CacheConfig>): void {
        this.config = { ...this.config, ...config };
    }
}

// Export singleton
export const cache = new MultiLayerCache();
export type { CacheStats, CacheConfig };
