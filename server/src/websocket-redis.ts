/**
 * Distributed WebSocket Manager - Redis Pub/Sub for horizontal scaling
 *
 * @see ADR-006: Distributed WebSocket Architecture
 * @see docs/IMPLEMENTATION_PLAN.md - Item 2.2 WebSocket Horizontal Scaling
 */

import Redis from 'ioredis';
import { WebSocketManager, type WebSocketPermission } from './websocket';

interface BroadcastMessage {
    sourceInstance: string;
    payload: Record<string, unknown>;
    excludeIds: string[];
    channel?: string;
}

interface DistributedConfig {
    /** Require authentication for WebSocket connections */
    requireAuth?: boolean;
    /** Default permissions for anonymous connections */
    defaultPermissions?: WebSocketPermission[];
    /** Redis URL (defaults to localhost) */
    redisUrl?: string;
    /** Instance ID (auto-generated if not provided) */
    instanceId?: string;
}

export class DistributedWebSocketManager extends WebSocketManager {
    private pubClient: Redis | null = null;
    private subClient: Redis | null = null;
    private instanceId: string;
    private isConnected = false;

    constructor(config?: DistributedConfig) {
        super({
            requireAuth: config?.requireAuth,
            defaultPermissions: config?.defaultPermissions
        });
        this.instanceId = config?.instanceId || crypto.randomUUID();
    }

    /**
     * Initialize Redis pub/sub connections
     */
    async init(redisUrl?: string): Promise<boolean> {
        const url = redisUrl || process.env.REDIS_URL || 'redis://localhost:6379';

        try {
            // Create two Redis clients - one for publishing, one for subscribing
            // (Redis requires separate connections for pub/sub)
            this.pubClient = new Redis(url, {
                maxRetriesPerRequest: 3,
                retryStrategy: (times) => {
                    if (times > 3) return null; // Stop retrying
                    return Math.min(times * 100, 3000);
                }
            });

            this.subClient = new Redis(url, {
                maxRetriesPerRequest: 3,
                retryStrategy: (times) => {
                    if (times > 3) return null;
                    return Math.min(times * 100, 3000);
                }
            });

            // Subscribe to broadcast channel
            await this.subClient.subscribe('ws:broadcast');

            // Handle incoming messages from other instances
            this.subClient.on('message', (channel, message) => {
                if (channel === 'ws:broadcast') {
                    try {
                        const data = JSON.parse(message) as BroadcastMessage;
                        // Don't re-broadcast our own messages
                        if (data.sourceInstance !== this.instanceId) {
                            this.localBroadcast(data.payload, data.excludeIds);
                        }
                    } catch (err) {
                        console.error('[DistributedWS] Failed to parse broadcast message:', err);
                    }
                }
            });

            // Handle connection errors
            this.pubClient.on('error', (err) => {
                console.error('[DistributedWS] Pub client error:', err.message);
                this.isConnected = false;
            });

            this.subClient.on('error', (err) => {
                console.error('[DistributedWS] Sub client error:', err.message);
                this.isConnected = false;
            });

            // Handle reconnection
            this.pubClient.on('connect', () => {
                console.log('[DistributedWS] Pub client connected');
                this.isConnected = true;
            });

            this.isConnected = true;
            console.log(`[DistributedWS] Initialized with instance ID: ${this.instanceId}`);
            return true;
        } catch (err) {
            console.error('[DistributedWS] Failed to initialize Redis:', err);
            this.isConnected = false;
            return false;
        }
    }

    /**
     * Override broadcast to publish to Redis for cross-instance messaging
     */
    protected override broadcast(message: Record<string, unknown>, excludeIds: string[] = []) {
        // If Redis is connected, publish to all instances
        if (this.isConnected && this.pubClient) {
            const broadcastMessage: BroadcastMessage = {
                sourceInstance: this.instanceId,
                payload: message,
                excludeIds
            };

            this.pubClient.publish('ws:broadcast', JSON.stringify(broadcastMessage))
                .catch(err => {
                    console.error('[DistributedWS] Failed to publish broadcast:', err.message);
                    // Fall back to local-only broadcast
                    this.localBroadcast(message, excludeIds);
                });
        }

        // Always broadcast locally (for this instance's clients)
        this.localBroadcast(message, excludeIds);
    }

    /**
     * Store subscription in Redis for cross-instance awareness
     */
    async addSubscription(clientId: string, symbol: string): Promise<void> {
        const subscription = this.subscriptions.get(clientId);
        if (subscription) {
            subscription.symbols.add(symbol);
        }

        // Store in Redis for other instances to query
        if (this.isConnected && this.pubClient) {
            await this.pubClient.sadd(
                `ws:subs:${symbol}`,
                `${this.instanceId}:${clientId}`
            ).catch(err => {
                console.error('[DistributedWS] Failed to add subscription to Redis:', err.message);
            });
        }
    }

    /**
     * Remove subscription from Redis
     */
    async removeSubscription(clientId: string, symbol: string): Promise<void> {
        const subscription = this.subscriptions.get(clientId);
        if (subscription) {
            subscription.symbols.delete(symbol);
        }

        // Remove from Redis
        if (this.isConnected && this.pubClient) {
            await this.pubClient.srem(
                `ws:subs:${symbol}`,
                `${this.instanceId}:${clientId}`
            ).catch(err => {
                console.error('[DistributedWS] Failed to remove subscription from Redis:', err.message);
            });
        }
    }

    /**
     * Clean up Redis subscriptions when client disconnects
     */
    async cleanupClient(clientId: string): Promise<void> {
        const subscription = this.subscriptions.get(clientId);
        if (subscription && this.isConnected && this.pubClient) {
            // Remove all symbol subscriptions for this client
            for (const symbol of subscription.symbols) {
                await this.pubClient.srem(
                    `ws:subs:${symbol}`,
                    `${this.instanceId}:${clientId}`
                ).catch(() => {});
            }
        }
    }

    /**
     * Get subscriber count for a symbol across all instances
     */
    async getSymbolSubscriberCount(symbol: string): Promise<number> {
        if (!this.isConnected || !this.pubClient) {
            // Fall back to local count
            let count = 0;
            for (const sub of this.subscriptions.values()) {
                if (sub.symbols.has(symbol)) count++;
            }
            return count;
        }

        try {
            return await this.pubClient.scard(`ws:subs:${symbol}`);
        } catch {
            return 0;
        }
    }

    /**
     * Get instance statistics
     */
    getInstanceStats(): {
        instanceId: string;
        isConnected: boolean;
        localClients: number;
    } {
        return {
            instanceId: this.instanceId,
            isConnected: this.isConnected,
            localClients: this.clients.size
        };
    }

    /**
     * Graceful shutdown
     */
    override shutdown() {
        // Clean up Redis connections
        if (this.pubClient) {
            this.pubClient.quit().catch(() => {});
            this.pubClient = null;
        }
        if (this.subClient) {
            this.subClient.quit().catch(() => {});
            this.subClient = null;
        }
        this.isConnected = false;

        // Call parent shutdown
        super.shutdown();
        console.log(`[DistributedWS] Instance ${this.instanceId} shutdown complete`);
    }
}

/**
 * Create the appropriate WebSocket manager based on environment
 * Uses distributed manager when Redis is available, falls back to local
 */
export async function createWebSocketManager(
    config?: DistributedConfig
): Promise<WebSocketManager | DistributedWebSocketManager> {
    const redisUrl = config?.redisUrl || process.env.REDIS_URL;

    if (!redisUrl) {
        console.log('[WebSocket] No REDIS_URL configured, using local WebSocket manager');
        return new WebSocketManager({
            requireAuth: config?.requireAuth,
            defaultPermissions: config?.defaultPermissions
        });
    }

    const distributed = new DistributedWebSocketManager(config);
    const connected = await distributed.init(redisUrl);

    if (connected) {
        console.log('[WebSocket] Using distributed WebSocket manager with Redis');
        return distributed;
    }

    console.warn('[WebSocket] Failed to connect to Redis, falling back to local manager');
    return new WebSocketManager({
        requireAuth: config?.requireAuth,
        defaultPermissions: config?.defaultPermissions
    });
}

export default DistributedWebSocketManager;
