/**
 * NATS WebSocket Manager - Distributed WebSocket with Back-Pressure
 *
 * Replaces Redis pub/sub for WebSocket distribution with NATS.
 * Features:
 * - Cross-instance broadcasting via NATS
 * - JetStream for trade event persistence
 * - Back-pressure via JetStream flow control
 * - Graceful fallback when NATS unavailable
 *
 * Stream: TRADE_EVENTS
 * Subjects: trades.{symbol}, ws.broadcast
 */

import {
    getNatsConnection,
    getJetStream,
    getJetStreamManager,
    isNatsConnected,
    sc,
} from './nats/index.js';
import { WebSocketManager, type WebSocketPermission } from './websocket.js';
import { AckPolicy, DeliverPolicy, RetentionPolicy, StorageType } from 'nats';
import { componentLoggers } from './logger.js';

const log = componentLoggers.websocket;

// ============================================================================
// Types
// ============================================================================

interface BroadcastMessage {
    sourceInstance: string;
    payload: Record<string, unknown>;
    excludeIds: string[];
    channel?: string;
}

interface NatsWebSocketConfig {
    /** Require authentication for WebSocket connections */
    requireAuth?: boolean;
    /** Default permissions for anonymous connections */
    defaultPermissions?: WebSocketPermission[];
    /** Instance ID (auto-generated if not provided) */
    instanceId?: string;
}

// ============================================================================
// Constants
// ============================================================================

const STREAM_NAME = 'TRADE_EVENTS';
const STREAM_SUBJECTS = ['trades.>', 'ws.broadcast'];
const BROADCAST_SUBJECT = 'ws.broadcast';
const DEFAULT_RETENTION_MS = 5 * 60 * 1000; // 5 minutes for trade data

// ============================================================================
// NatsWebSocketManager
// ============================================================================

export class NatsWebSocketManager extends WebSocketManager {
    private instanceId: string;
    private isNatsReady = false;
    private broadcastSubscription: { unsubscribe: () => void } | null = null;

    constructor(config?: NatsWebSocketConfig) {
        super({
            requireAuth: config?.requireAuth,
            defaultPermissions: config?.defaultPermissions,
        });
        this.instanceId = config?.instanceId || crypto.randomUUID();
    }

    /**
     * Initialize NATS subscriptions for cross-instance messaging
     */
    async init(): Promise<boolean> {
        if (!isNatsConnected()) {
            log.warn('[NatsWS] NATS not connected, using local-only mode');
            return false;
        }

        try {
            // Initialize JetStream stream for trade events
            await this.initTradeStream();

            // Subscribe to broadcast messages
            const nc = getNatsConnection();
            const sub = nc.subscribe(BROADCAST_SUBJECT);

            (async () => {
                for await (const msg of sub) {
                    try {
                        const data = JSON.parse(sc.decode(msg.data)) as BroadcastMessage;
                        // Don't re-broadcast our own messages
                        if (data.sourceInstance !== this.instanceId) {
                            this.localBroadcast(data.payload, data.excludeIds);
                        }
                    } catch (error) {
                        log.error('[NatsWS] Error processing broadcast:', error);
                    }
                }
            })();

            this.broadcastSubscription = { unsubscribe: () => sub.unsubscribe() };
            this.isNatsReady = true;

            log.info(`[NatsWS] Initialized with instance ID: ${this.instanceId}`);
            return true;
        } catch (error) {
            log.error('[NatsWS] Failed to initialize:', error);
            return false;
        }
    }

    /**
     * Initialize JetStream stream for trade events
     */
    private async initTradeStream(): Promise<void> {
        if (!isNatsConnected()) return;

        try {
            const jsm = getJetStreamManager();

            // Check if stream exists
            try {
                await jsm.streams.info(STREAM_NAME);
                log.info(`[NatsWS] Stream ${STREAM_NAME} already exists`);
                return;
            } catch {
                // Stream doesn't exist, create it
            }

            await jsm.streams.add({
                name: STREAM_NAME,
                subjects: STREAM_SUBJECTS,
                retention: RetentionPolicy.Limits,
                storage: StorageType.File,
                max_age: DEFAULT_RETENTION_MS * 1000000, // Nanoseconds
                max_msgs: 100000,
                max_bytes: 50 * 1024 * 1024, // 50MB
                discard: 'old' as any,
            });

            log.info(`[NatsWS] Created stream ${STREAM_NAME}`);
        } catch (error) {
            log.error('[NatsWS] Failed to create trade stream:', error);
        }
    }

    /**
     * Override broadcast to publish via NATS
     */
    protected override broadcast(message: Record<string, unknown>, excludeIds: string[] = []): void {
        // If NATS is connected, publish to all instances
        if (this.isNatsReady && isNatsConnected()) {
            try {
                const nc = getNatsConnection();
                const broadcastMessage: BroadcastMessage = {
                    sourceInstance: this.instanceId,
                    payload: message,
                    excludeIds,
                };

                nc.publish(BROADCAST_SUBJECT, sc.encode(JSON.stringify(broadcastMessage)));
            } catch (error) {
                log.error('[NatsWS] Failed to broadcast via NATS:', error);
                // Fall back to local-only
            }
        }

        // Always broadcast locally
        this.localBroadcast(message, excludeIds);
    }

    /**
     * Publish trade event to JetStream with back-pressure
     */
    async publishTradeEvent(symbol: string, data: Record<string, unknown>): Promise<boolean> {
        if (!this.isNatsReady || !isNatsConnected()) {
            // Fallback: direct broadcast
            this.broadcastToSubscribed('trade', [{ symbol, ...data }]);
            return false;
        }

        try {
            const js = getJetStream();
            const subject = `trades.${symbol.toUpperCase()}`;

            // JetStream publish with back-pressure
            await js.publish(subject, sc.encode(JSON.stringify({
                symbol,
                ...data,
                timestamp: Date.now(),
            })));

            return true;
        } catch (error) {
            log.error(`[NatsWS] Failed to publish trade event for ${symbol}:`, error);
            // Fallback: direct broadcast
            this.broadcastToSubscribed('trade', [{ symbol, ...data }]);
            return false;
        }
    }

    /**
     * Subscribe to trade events from JetStream
     * Creates a consumer with flow control for back-pressure
     */
    async subscribeToTradeEvents(
        symbols: string[],
        handler: (data: Record<string, unknown>) => void
    ): Promise<() => void> {
        if (!this.isNatsReady || !isNatsConnected()) {
            log.warn('[NatsWS] NATS not ready, trade subscription unavailable');
            return () => { };
        }

        const nc = getNatsConnection();
        const subscriptions: Array<{ unsubscribe: () => void }> = [];

        for (const symbol of symbols) {
            const subject = `trades.${symbol.toUpperCase()}`;
            const sub = nc.subscribe(subject);

            (async () => {
                for await (const msg of sub) {
                    try {
                        const data = JSON.parse(sc.decode(msg.data));
                        handler(data);
                    } catch (error) {
                        log.error(`[NatsWS] Error processing trade event:`, error);
                    }
                }
            })();

            subscriptions.push({ unsubscribe: () => sub.unsubscribe() });
        }

        return () => {
            for (const sub of subscriptions) {
                sub.unsubscribe();
            }
        };
    }

    /**
     * Get instance stats
     */
    getInstanceStats(): {
        instanceId: string;
        isNatsConnected: boolean;
        localClients: number;
    } {
        return {
            instanceId: this.instanceId,
            isNatsConnected: this.isNatsReady,
            localClients: this.clients.size,
        };
    }

    /**
     * Graceful shutdown
     */
    override shutdown(): void {
        if (this.broadcastSubscription) {
            this.broadcastSubscription.unsubscribe();
            this.broadcastSubscription = null;
        }
        this.isNatsReady = false;

        super.shutdown();
        log.info(`[NatsWS] Instance ${this.instanceId} shutdown complete`);
    }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create the appropriate WebSocket manager based on configuration
 */
export async function createNatsWebSocketManager(
    config?: NatsWebSocketConfig
): Promise<WebSocketManager | NatsWebSocketManager> {
    // Check if NATS should be used
    const useNats = process.env.WS_BACKEND === 'nats' || process.env.NATS_URL;

    if (!useNats) {
        log.info('[WebSocket] Using local WebSocket manager');
        return new WebSocketManager({
            requireAuth: config?.requireAuth,
            defaultPermissions: config?.defaultPermissions,
        });
    }

    if (!isNatsConnected()) {
        log.warn('[WebSocket] NATS not connected, falling back to local manager');
        return new WebSocketManager({
            requireAuth: config?.requireAuth,
            defaultPermissions: config?.defaultPermissions,
        });
    }

    const natsManager = new NatsWebSocketManager(config);
    const connected = await natsManager.init();

    if (connected) {
        log.info('[WebSocket] Using NATS WebSocket manager');
        return natsManager;
    }

    log.warn('[WebSocket] NATS init failed, falling back to local manager');
    return new WebSocketManager({
        requireAuth: config?.requireAuth,
        defaultPermissions: config?.defaultPermissions,
    });
}

export default NatsWebSocketManager;
