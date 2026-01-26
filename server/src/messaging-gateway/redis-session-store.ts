/**
 * Redis Session Store
 * 
 * Persistent session storage for the messaging gateway using Redis.
 * Provides distributed session management across multiple gateway instances.
 */

import Redis from 'ioredis';
import type { SessionStore } from './gateway';
import type { ChannelType, GatewaySession } from './types';

// ============================================================================
// Redis Session Store Configuration
// ============================================================================

export interface RedisSessionStoreConfig {
    /** Redis connection URL */
    url?: string;

    /** Key prefix for session keys */
    prefix?: string;

    /** Default TTL for sessions in seconds (7 days) */
    defaultTTL?: number;

    /** TTL for idle sessions in seconds (24 hours) */
    idleTTL?: number;
}

const DEFAULT_CONFIG: Required<RedisSessionStoreConfig> = {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    prefix: 'gateway:session:',
    defaultTTL: 7 * 24 * 60 * 60, // 7 days
    idleTTL: 24 * 60 * 60, // 24 hours
};

// ============================================================================
// Redis Session Store Implementation
// ============================================================================

export class RedisSessionStore implements SessionStore {
    private client: Redis | null = null;
    private config: Required<RedisSessionStoreConfig>;
    private connected = false;

    constructor(config?: RedisSessionStoreConfig) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    // ============================================================================
    // Connection Management
    // ============================================================================

    async connect(): Promise<boolean> {
        try {
            this.client = new Redis(this.config.url, {
                maxRetriesPerRequest: 3,
                retryDelayOnFailover: 1000,
                lazyConnect: true,
            });

            await this.client.connect();
            await this.client.ping();
            this.connected = true;
            console.info('[RedisSessionStore] Connected to Redis');
            return true;
        } catch (error) {
            console.error('[RedisSessionStore] Connection failed:', error);
            this.connected = false;
            return false;
        }
    }

    async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.quit();
            this.client = null;
            this.connected = false;
        }
    }

    isConnected(): boolean {
        return this.connected && this.client !== null;
    }

    // ============================================================================
    // Session Store Interface
    // ============================================================================

    async get(key: string): Promise<GatewaySession | null> {
        if (!this.client) return null;

        try {
            const data = await this.client.get(this.prefixKey(key));
            if (!data) return null;

            const session = JSON.parse(data) as GatewaySession;

            // Convert date strings back to Date objects
            session.createdAt = new Date(session.createdAt);
            session.lastActiveAt = new Date(session.lastActiveAt);

            return session;
        } catch (error) {
            console.error('[RedisSessionStore] Get error:', error);
            return null;
        }
    }

    async set(key: string, session: GatewaySession): Promise<void> {
        if (!this.client) return;

        try {
            const data = JSON.stringify(session);
            await this.client.setex(
                this.prefixKey(key),
                this.config.defaultTTL,
                data
            );

            // Add to channel type index for filtering
            await this.client.sadd(
                this.indexKey('channel', session.channelType),
                key
            );

            // Add to user index for filtering
            await this.client.sadd(
                this.indexKey('user', session.userId),
                key
            );
        } catch (error) {
            console.error('[RedisSessionStore] Set error:', error);
        }
    }

    async delete(key: string): Promise<void> {
        if (!this.client) return;

        try {
            // Get session first to clean up indexes
            const session = await this.get(key);
            if (session) {
                await this.client.srem(
                    this.indexKey('channel', session.channelType),
                    key
                );
                await this.client.srem(
                    this.indexKey('user', session.userId),
                    key
                );
            }

            await this.client.del(this.prefixKey(key));
        } catch (error) {
            console.error('[RedisSessionStore] Delete error:', error);
        }
    }

    async list(filter?: { channelType?: ChannelType; userId?: string }): Promise<GatewaySession[]> {
        if (!this.client) return [];

        try {
            let keys: string[];

            if (filter?.channelType && filter?.userId) {
                // Intersection of both filters
                const channelKeys = await this.client.smembers(
                    this.indexKey('channel', filter.channelType)
                );
                const userKeys = await this.client.smembers(
                    this.indexKey('user', filter.userId)
                );
                keys = channelKeys.filter(k => userKeys.includes(k));
            } else if (filter?.channelType) {
                keys = await this.client.smembers(
                    this.indexKey('channel', filter.channelType)
                );
            } else if (filter?.userId) {
                keys = await this.client.smembers(
                    this.indexKey('user', filter.userId)
                );
            } else {
                // Get all sessions via pattern matching
                const pattern = `${this.config.prefix}*`;
                keys = await this.scanKeys(pattern);
                // Remove prefix from keys for consistency
                keys = keys.map(k => k.replace(this.config.prefix, ''));
            }

            // Fetch all sessions
            const sessions: GatewaySession[] = [];
            for (const key of keys) {
                const session = await this.get(key);
                if (session) {
                    sessions.push(session);
                }
            }

            return sessions;
        } catch (error) {
            console.error('[RedisSessionStore] List error:', error);
            return [];
        }
    }

    // ============================================================================
    // Extended Methods
    // ============================================================================

    /**
     * Update session activity timestamp and extend TTL
     */
    async touch(key: string): Promise<void> {
        if (!this.client) return;

        const session = await this.get(key);
        if (session) {
            session.lastActiveAt = new Date();
            await this.set(key, session);
        }
    }

    /**
     * Get sessions by user identity (resolved identity)
     */
    async getByUser(userId: string): Promise<GatewaySession[]> {
        return this.list({ userId });
    }

    /**
     * Get sessions by channel type
     */
    async getByChannel(channelType: ChannelType): Promise<GatewaySession[]> {
        return this.list({ channelType });
    }

    /**
     * Count active sessions
     */
    async count(filter?: { channelType?: ChannelType }): Promise<number> {
        if (!this.client) return 0;

        try {
            if (filter?.channelType) {
                return await this.client.scard(
                    this.indexKey('channel', filter.channelType)
                );
            }

            // Count all keys matching pattern
            const pattern = `${this.config.prefix}*`;
            return (await this.scanKeys(pattern)).length;
        } catch (error) {
            console.error('[RedisSessionStore] Count error:', error);
            return 0;
        }
    }

    /**
     * Clear expired sessions from indexes
     */
    async cleanup(): Promise<number> {
        if (!this.client) return 0;

        let cleaned = 0;

        try {
            // Get all session keys
            const pattern = `${this.config.prefix}*`;
            const keys = await this.scanKeys(pattern);

            for (const fullKey of keys) {
                const key = fullKey.replace(this.config.prefix, '');
                const exists = await this.client.exists(fullKey);

                if (!exists) {
                    // Key expired, clean up indexes
                    await this.removeFromAllIndexes(key);
                    cleaned++;
                }
            }
        } catch (error) {
            console.error('[RedisSessionStore] Cleanup error:', error);
        }

        return cleaned;
    }

    // ============================================================================
    // Helper Methods
    // ============================================================================

    private prefixKey(key: string): string {
        return `${this.config.prefix}${key}`;
    }

    private indexKey(type: 'channel' | 'user', value: string): string {
        return `${this.config.prefix}idx:${type}:${value}`;
    }

    private async scanKeys(pattern: string): Promise<string[]> {
        if (!this.client) return [];

        const keys: string[] = [];
        let cursor = '0';

        do {
            const [nextCursor, batch] = await this.client.scan(
                cursor,
                'MATCH',
                pattern,
                'COUNT',
                100
            );
            cursor = nextCursor;
            keys.push(...batch);
        } while (cursor !== '0');

        return keys;
    }

    private async removeFromAllIndexes(key: string): Promise<void> {
        if (!this.client) return;

        // Get all index keys
        const channelPattern = `${this.config.prefix}idx:channel:*`;
        const userPattern = `${this.config.prefix}idx:user:*`;

        const indexKeys = [
            ...(await this.scanKeys(channelPattern)),
            ...(await this.scanKeys(userPattern)),
        ];

        for (const indexKey of indexKeys) {
            await this.client.srem(indexKey, key);
        }
    }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createRedisSessionStore(config?: RedisSessionStoreConfig): RedisSessionStore {
    return new RedisSessionStore(config);
}

export default RedisSessionStore;
