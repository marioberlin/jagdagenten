/**
 * Redis Identity Store
 * 
 * Persistent identity storage using Redis.
 * Indexes identities by canonical ID and platform keys for fast lookups.
 */

import Redis from 'ioredis';
import type { ChannelType, IdentityLink } from './types';
import type { IdentityStore } from './identity-linking';

// ============================================================================
// Redis Identity Store Configuration
// ============================================================================

export interface RedisIdentityStoreConfig {
    /** Redis connection URL */
    url?: string;

    /** Key prefix for identity keys */
    prefix?: string;
}

const DEFAULT_CONFIG: Required<RedisIdentityStoreConfig> = {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    prefix: 'gateway:identity:',
};

// ============================================================================
// Redis Identity Store Implementation
// ============================================================================

export class RedisIdentityStore implements IdentityStore {
    private client: Redis | null = null;
    private config: Required<RedisIdentityStoreConfig>;
    private connected = false;

    constructor(config?: RedisIdentityStoreConfig) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    // ============================================================================
    // Connection Management
    // ============================================================================

    async connect(): Promise<boolean> {
        try {
            this.client = new Redis(this.config.url, {
                maxRetriesPerRequest: 3,
                lazyConnect: true,
            });

            await this.client.connect();
            await this.client.ping();
            this.connected = true;
            console.info('[RedisIdentityStore] Connected to Redis');
            return true;
        } catch (error) {
            console.error('[RedisIdentityStore] Connection failed:', error);
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
    // Identity Store Interface
    // ============================================================================

    async get(canonicalId: string): Promise<IdentityLink | null> {
        if (!this.client) return null;

        try {
            const data = await this.client.get(this.identityKey(canonicalId));
            if (!data) return null;
            return JSON.parse(data) as IdentityLink;
        } catch (error) {
            console.error('[RedisIdentityStore] Get error:', error);
            return null;
        }
    }

    async getByPlatform(channelType: ChannelType, platformId: string): Promise<IdentityLink | null> {
        if (!this.client) return null;

        try {
            const canonicalId = await this.client.get(this.platformKey(channelType, platformId));
            if (!canonicalId) return null;
            return this.get(canonicalId);
        } catch (error) {
            console.error('[RedisIdentityStore] GetByPlatform error:', error);
            return null;
        }
    }

    async create(identity: IdentityLink): Promise<void> {
        if (!this.client) return;

        try {
            // Store identity data
            await this.client.set(
                this.identityKey(identity.canonicalId),
                JSON.stringify(identity)
            );

            // Create platform indexes
            for (const linked of identity.linkedIds) {
                await this.client.set(
                    this.platformKey(linked.channelType, linked.platformId),
                    identity.canonicalId
                );
            }

            // Add to identity list
            await this.client.sadd(this.listKey(), identity.canonicalId);
        } catch (error) {
            console.error('[RedisIdentityStore] Create error:', error);
        }
    }

    async update(canonicalId: string, updates: Partial<IdentityLink>): Promise<void> {
        if (!this.client) return;

        try {
            const existing = await this.get(canonicalId);
            if (!existing) return;

            const updated = { ...existing, ...updates };
            await this.client.set(
                this.identityKey(canonicalId),
                JSON.stringify(updated)
            );
        } catch (error) {
            console.error('[RedisIdentityStore] Update error:', error);
        }
    }

    async linkPlatform(canonicalId: string, channelType: ChannelType, platformId: string): Promise<void> {
        if (!this.client) return;

        try {
            // Check if already linked elsewhere
            const existingCanonicalId = await this.client.get(
                this.platformKey(channelType, platformId)
            );
            if (existingCanonicalId && existingCanonicalId !== canonicalId) {
                throw new Error(`Platform ${channelType}:${platformId} is already linked to identity ${existingCanonicalId}`);
            }

            // Get identity and update
            const identity = await this.get(canonicalId);
            if (!identity) return;

            // Add to linked IDs if not present
            const exists = identity.linkedIds.find(
                l => l.channelType === channelType && l.platformId === platformId
            );
            if (!exists) {
                identity.linkedIds.push({ channelType, platformId });
                await this.client.set(
                    this.identityKey(canonicalId),
                    JSON.stringify(identity)
                );
                await this.client.set(
                    this.platformKey(channelType, platformId),
                    canonicalId
                );
            }
        } catch (error) {
            console.error('[RedisIdentityStore] LinkPlatform error:', error);
            throw error;
        }
    }

    async unlinkPlatform(canonicalId: string, channelType: ChannelType, platformId: string): Promise<void> {
        if (!this.client) return;

        try {
            const identity = await this.get(canonicalId);
            if (!identity) return;

            identity.linkedIds = identity.linkedIds.filter(
                l => !(l.channelType === channelType && l.platformId === platformId)
            );

            await this.client.set(
                this.identityKey(canonicalId),
                JSON.stringify(identity)
            );
            await this.client.del(this.platformKey(channelType, platformId));
        } catch (error) {
            console.error('[RedisIdentityStore] UnlinkPlatform error:', error);
        }
    }

    async list(): Promise<IdentityLink[]> {
        if (!this.client) return [];

        try {
            const canonicalIds = await this.client.smembers(this.listKey());
            const identities: IdentityLink[] = [];

            for (const id of canonicalIds) {
                const identity = await this.get(id);
                if (identity) {
                    identities.push(identity);
                }
            }

            return identities;
        } catch (error) {
            console.error('[RedisIdentityStore] List error:', error);
            return [];
        }
    }

    async delete(canonicalId: string): Promise<void> {
        if (!this.client) return;

        try {
            const identity = await this.get(canonicalId);
            if (!identity) return;

            // Delete platform indexes
            for (const linked of identity.linkedIds) {
                await this.client.del(this.platformKey(linked.channelType, linked.platformId));
            }

            // Delete identity data
            await this.client.del(this.identityKey(canonicalId));

            // Remove from list
            await this.client.srem(this.listKey(), canonicalId);
        } catch (error) {
            console.error('[RedisIdentityStore] Delete error:', error);
        }
    }

    // ============================================================================
    // Helper Methods
    // ============================================================================

    private identityKey(canonicalId: string): string {
        return `${this.config.prefix}id:${canonicalId}`;
    }

    private platformKey(channelType: ChannelType, platformId: string): string {
        return `${this.config.prefix}platform:${channelType}:${platformId}`;
    }

    private listKey(): string {
        return `${this.config.prefix}list`;
    }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createRedisIdentityStore(config?: RedisIdentityStoreConfig): RedisIdentityStore {
    return new RedisIdentityStore(config);
}

export default RedisIdentityStore;
