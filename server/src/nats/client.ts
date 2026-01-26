/**
 * NATS Client - Connection Manager for LiquidCrypto
 *
 * Provides a singleton NATS connection with JetStream support.
 * Features:
 * - Auto-reconnect with exponential backoff
 * - Graceful shutdown with drain
 * - Health check for monitoring
 * - JetStream client for persistent messaging
 *
 * @see https://nats.io
 */

import { connect, NatsConnection, JetStreamClient, JetStreamManager, StringCodec } from 'nats';

// Safe logger - fallback to console if componentLoggers not available
let log: { info: (...args: unknown[]) => void; warn: (...args: unknown[]) => void; error: (...args: unknown[]) => void; debug: (...args: unknown[]) => void };
try {
    const { componentLoggers } = await import('../logger.js');
    log = componentLoggers?.system || console;
} catch {
    log = console;
}

// ============================================================================
// Types
// ============================================================================

interface NatsConfig {
    /** NATS server URL (default: nats://localhost:4222) */
    url: string;
    /** Connection name for debugging */
    name: string;
    /** Max reconnect attempts (-1 for infinite) */
    maxReconnectAttempts: number;
    /** Reconnect delay in ms */
    reconnectTimeWait: number;
    /** JetStream domain (optional) */
    domain?: string;
}

interface NatsHealth {
    connected: boolean;
    server?: string;
    rtt?: number;
    jetstream?: {
        enabled: boolean;
        streams?: number;
    };
}

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_CONFIG: NatsConfig = {
    url: process.env.NATS_URL || 'nats://localhost:4222',
    name: 'liquidcrypto',
    maxReconnectAttempts: -1, // Infinite
    reconnectTimeWait: 2000,  // 2 seconds
};

// ============================================================================
// State
// ============================================================================

let nc: NatsConnection | null = null;
let js: JetStreamClient | null = null;
let jsm: JetStreamManager | null = null;
let config: NatsConfig = { ...DEFAULT_CONFIG };

// String codec for encoding/decoding messages
export const sc = StringCodec();

// ============================================================================
// Connection Management
// ============================================================================

/**
 * Initialize NATS connection with JetStream
 */
export async function initNats(userConfig?: Partial<NatsConfig>): Promise<boolean> {
    if (nc) {
        log.warn('[NATS] Already connected');
        return true;
    }

    config = { ...DEFAULT_CONFIG, ...userConfig };

    try {
        log.info(`[NATS] Connecting to ${config.url}...`);

        nc = await connect({
            servers: config.url,
            name: config.name,
            maxReconnectAttempts: config.maxReconnectAttempts,
            reconnectTimeWait: config.reconnectTimeWait,
        });

        // Set up event handlers
        nc.closed().then(() => {
            log.info('[NATS] Connection closed');
            nc = null;
            js = null;
            jsm = null;
        });

        (async () => {
            for await (const status of nc!.status()) {
                switch (status.type) {
                    case 'reconnecting':
                        log.warn('[NATS] Reconnecting...');
                        break;
                    case 'reconnect':
                        log.info('[NATS] Reconnected');
                        break;
                    case 'disconnect':
                        log.warn('[NATS] Disconnected');
                        break;
                    case 'error':
                        log.error('[NATS] Error:', status.data);
                        break;
                }
            }
        })();

        // Initialize JetStream
        js = nc.jetstream();
        jsm = await nc.jetstreamManager();

        const serverInfo = nc.info;
        log.info(`[NATS] Connected to ${serverInfo?.server_name} (v${serverInfo?.version})`);
        log.info(`[NATS] JetStream enabled`);

        return true;
    } catch (error) {
        log.error('[NATS] Failed to connect:', error);
        nc = null;
        return false;
    }
}

/**
 * Close NATS connection gracefully
 */
export async function closeNats(): Promise<void> {
    if (!nc) {
        return;
    }

    log.info('[NATS] Draining connection...');

    try {
        await nc.drain();
        log.info('[NATS] Connection drained and closed');
    } catch (error) {
        log.error('[NATS] Error during close:', error);
        // Force close
        await nc.close();
    }

    nc = null;
    js = null;
    jsm = null;
}

// ============================================================================
// Accessors
// ============================================================================

/**
 * Get the NATS connection (throws if not connected)
 */
export function getNatsConnection(): NatsConnection {
    if (!nc) {
        throw new Error('NATS not connected. Call initNats() first.');
    }
    return nc;
}

/**
 * Get the JetStream client (throws if not connected)
 */
export function getJetStream(): JetStreamClient {
    if (!js) {
        throw new Error('JetStream not available. Call initNats() first.');
    }
    return js;
}

/**
 * Get the JetStream manager (throws if not connected)
 */
export function getJetStreamManager(): JetStreamManager {
    if (!jsm) {
        throw new Error('JetStream manager not available. Call initNats() first.');
    }
    return jsm;
}

/**
 * Check if NATS is connected
 */
export function isNatsConnected(): boolean {
    return nc !== null && !nc.isClosed();
}

// ============================================================================
// Health Check
// ============================================================================

/**
 * Get NATS health status
 */
export async function getNatsHealth(): Promise<NatsHealth> {
    if (!nc || nc.isClosed()) {
        return { connected: false };
    }

    try {
        // Measure round-trip time
        const start = Date.now();
        await nc.flush();
        const rtt = Date.now() - start;

        // Get JetStream info
        let streamCount = 0;
        if (jsm) {
            try {
                const streams = await jsm.streams.list().next();
                streamCount = streams ? 1 : 0;
                // Count all streams
                for await (const _ of jsm.streams.list()) {
                    streamCount++;
                }
                streamCount--; // Adjust for double count
            } catch {
                // JetStream might not have streams yet
            }
        }

        return {
            connected: true,
            server: nc.info?.server_name,
            rtt,
            jetstream: {
                enabled: js !== null,
                streams: streamCount,
            },
        };
    } catch (error) {
        return { connected: false };
    }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Publish a message to a subject
 */
export function publish(subject: string, data: unknown): void {
    if (!nc) {
        throw new Error('NATS not connected');
    }
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    nc.publish(subject, sc.encode(payload));
}

/**
 * Subscribe to a subject with a handler
 */
export async function subscribe(
    subject: string,
    handler: (data: unknown, subject: string) => void | Promise<void>,
    options?: { queue?: string }
): Promise<{ unsubscribe: () => void }> {
    if (!nc) {
        throw new Error('NATS not connected');
    }

    const sub = nc.subscribe(subject, { queue: options?.queue });

    (async () => {
        for await (const msg of sub) {
            try {
                const data = JSON.parse(sc.decode(msg.data));
                await handler(data, msg.subject);
            } catch (error) {
                log.error(`[NATS] Error handling message on ${msg.subject}:`, error);
            }
        }
    })();

    return {
        unsubscribe: () => sub.unsubscribe(),
    };
}

/**
 * Request-reply pattern
 */
export async function request<T = unknown>(
    subject: string,
    data: unknown,
    timeoutMs: number = 5000
): Promise<T> {
    if (!nc) {
        throw new Error('NATS not connected');
    }

    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    const response = await nc.request(subject, sc.encode(payload), { timeout: timeoutMs });
    return JSON.parse(sc.decode(response.data)) as T;
}

// ============================================================================
// Exports
// ============================================================================

export default {
    initNats,
    closeNats,
    getNatsConnection,
    getJetStream,
    getJetStreamManager,
    isNatsConnected,
    getNatsHealth,
    publish,
    subscribe,
    request,
    sc,
};
