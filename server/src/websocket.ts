/**
 * WebSocket Server - Bidirectional communication for LiquidCrypto
 * Uses Bun's native WebSocket support
 *
 * @see ADR-005: Session-Scoped LiquidClient
 * @see docs/IMPLEMENTATION_PLAN.md - Item 1.4 WebSocket Authentication
 */

import { componentLoggers, logWebSocketEvent } from './logger.js';

const wsLog = componentLoggers.websocket;

// Permission types for WebSocket actions
export type WebSocketPermission = 'read:prices' | 'write:trades' | 'write:chat' | 'admin:*';

export interface WebSocketClient {
    ws: any;
    clientId: string;
    userId?: string;
    permissions: Set<WebSocketPermission>;
    connectedAt: number;
    ip: string;
}

export interface Subscription {
    clientId: string;
    symbols: Set<string>;
    channels: Set<string>;
}

interface TokenPayload {
    userId?: string;
    permissions?: WebSocketPermission[];
    exp?: number;
    iat?: number;
}

// WebSocket configuration
interface WebSocketConfig {
    /** Require authentication for WebSocket connections */
    requireAuth: boolean;
    /** Default permissions for anonymous connections */
    defaultPermissions: WebSocketPermission[];
}

export class WebSocketManager {
    protected subscriptions: Map<string, Subscription> = new Map();
    protected priceInterval: ReturnType<typeof setInterval> | null = null;
    protected clients: Map<string, WebSocketClient> = new Map();
    protected config: WebSocketConfig;

    constructor(config?: Partial<WebSocketConfig>) {
        this.config = {
            requireAuth: process.env.REQUIRE_WS_AUTH === 'true',
            defaultPermissions: ['read:prices'],
            ...config
        };
    }

    /**
     * Decode and validate a JWT token
     * In production, use a proper JWT library with secret verification
     */
    private decodeToken(token: string | null): TokenPayload | null {
        if (!token) return null;

        try {
            // Simple base64 decode for demo - use proper JWT in production
            // Expected format: header.payload.signature (base64 encoded)
            const parts = token.split('.');
            if (parts.length !== 3) return null;

            const payload = JSON.parse(atob(parts[1])) as TokenPayload;

            // Check expiration
            if (payload.exp && payload.exp < Date.now() / 1000) {
                wsLog.debug('Token expired');
                return null;
            }

            return payload;
        } catch {
            wsLog.debug('Token decode failed');
            return null;
        }
    }

    /**
     * Check if a client has a specific permission
     */
    hasPermission(clientId: string, permission: WebSocketPermission): boolean {
        const client = this.clients.get(clientId);
        if (!client) return false;

        // Admin has all permissions
        if (client.permissions.has('admin:*')) return true;

        return client.permissions.has(permission);
    }

    /**
     * Get client info by ID
     */
    getClientInfo(clientId: string): Omit<WebSocketClient, 'ws'> | null {
        const client = this.clients.get(clientId);
        if (!client) return null;

        return {
            clientId: client.clientId,
            userId: client.userId,
            permissions: client.permissions,
            connectedAt: client.connectedAt,
            ip: client.ip
        };
    }

    // Start WebSocket server using Bun.serve
    startWebSocketServer(port: number = 3001) {
        const self = this;

        // Create WebSocket server using Bun's native support
        const server = Bun.serve({
            port,
            fetch(req: Request, server): Response | undefined {
                const url = new URL(req.url);

                // Handle regular HTTP requests
                if (req.headers.get('upgrade') !== 'websocket') {
                    return new Response(JSON.stringify({
                        status: 'ok',
                        server: 'WebSocket',
                        requireAuth: self.config.requireAuth,
                        connections: self.clients.size
                    }), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                // Extract token from query string or Authorization header
                const token = url.searchParams.get('token')
                            || req.headers.get('Authorization')?.replace('Bearer ', '')
                            || null;

                // Get IP address
                const ip = req.headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
                        || req.headers.get('X-Real-IP')
                        || 'unknown';

                // Validate token if auth is required
                const decoded = self.decodeToken(token);

                if (self.config.requireAuth && !decoded) {
                    wsLog.warn({ ip }, 'Auth required but no valid token');
                    return new Response('Unauthorized', { status: 401 });
                }

                // Upgrade with metadata
                const upgraded = server.upgrade(req, {
                    data: {
                        token,
                        decoded,
                        ip
                    }
                });

                if (!upgraded) {
                    return new Response('WebSocket upgrade failed', { status: 400 });
                }

                // Return undefined to signal upgrade success
                return undefined;
            },
            websocket: {
                open: (ws: any) => {
                    const { decoded, ip } = ws.data || {};
                    const clientId = self.generateClientId();

                    // Determine permissions
                    const permissions = new Set<WebSocketPermission>(
                        decoded?.permissions || self.config.defaultPermissions
                    );

                    const client: WebSocketClient = {
                        ws,
                        clientId,
                        userId: decoded?.userId,
                        permissions,
                        connectedAt: Date.now(),
                        ip
                    };

                    self.clients.set(clientId, client);
                    self.subscriptions.set(clientId, {
                        clientId,
                        symbols: new Set(),
                        channels: new Set()
                    });

                    // Send connection confirmation with permissions
                    ws.send(JSON.stringify({
                        type: 'connected',
                        clientId,
                        userId: decoded?.userId || null,
                        permissions: Array.from(permissions),
                        timestamp: new Date().toISOString()
                    }));

                    logWebSocketEvent('connect', {
                        clientId,
                        userId: decoded?.userId
                    });
                },
                close: (ws: any) => {
                    // Find and remove client
                    for (const [clientId, client] of self.clients) {
                        if (client.ws === ws) {
                            self.clients.delete(clientId);
                            self.subscriptions.delete(clientId);
                            logWebSocketEvent('disconnect', {
                                clientId,
                                userId: client.userId
                            });
                            break;
                        }
                    }
                },
                message: (ws: any, message: string | Buffer) => {
                    // Find client
                    for (const [clientId, client] of self.clients) {
                        if (client.ws === ws) {
                            try {
                                const data = JSON.parse(message.toString());
                                self.handleMessage(clientId, data);
                            } catch {
                                wsLog.warn({ clientId }, 'Invalid message format');
                            }
                            break;
                        }
                    }
                }
            }
        });

        // Start price broadcast
        this.startPriceBroadcast();

        wsLog.info({ port }, 'WebSocket server started');
        return server;
    }

    /**
     * Send an error message to a client
     */
    private sendError(clientId: string, code: string, message: string) {
        this.sendToClient(clientId, {
            type: 'error',
            code,
            message,
            timestamp: new Date().toISOString()
        });
    }

    private handleMessage(clientId: string, message: Record<string, unknown>) {
        const subscription = this.subscriptions.get(clientId);
        if (!subscription) return;

        const type = message.type as string;

        switch (type) {
            case 'subscribe':
                // Check permission for subscribing to prices
                if (!this.hasPermission(clientId, 'read:prices')) {
                    this.sendError(clientId, 'FORBIDDEN', 'No permission to subscribe to prices');
                    return;
                }
                if (message.symbol) {
                    subscription.symbols.add(message.symbol as string);
                }
                if (message.channel) {
                    subscription.channels.add(message.channel as string);
                }
                this.sendToClient(clientId, {
                    type: 'subscribed',
                    symbol: message.symbol,
                    channel: message.channel,
                    timestamp: new Date().toISOString()
                });
                break;

            case 'unsubscribe':
                if (message.symbol) {
                    subscription.symbols.delete(message.symbol as string);
                }
                if (message.channel) {
                    subscription.channels.delete(message.channel as string);
                }
                this.sendToClient(clientId, {
                    type: 'unsubscribed',
                    symbol: message.symbol,
                    channel: message.channel,
                    timestamp: new Date().toISOString()
                });
                break;

            case 'ping':
                const client = this.clients.get(clientId);
                client?.ws?.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
                break;

            case 'trade':
                // Check permission for trading
                if (!this.hasPermission(clientId, 'write:trades')) {
                    this.sendError(clientId, 'FORBIDDEN', 'No permission to execute trades');
                    return;
                }
                wsLog.info({ clientId, trade: message.data }, 'Trade executed');
                this.sendToClient(clientId, {
                    type: 'trade_confirm',
                    data: message.data,
                    timestamp: new Date().toISOString()
                });
                break;

            case 'chat':
                // Check permission for chat
                if (!this.hasPermission(clientId, 'write:chat')) {
                    this.sendError(clientId, 'FORBIDDEN', 'No permission to send chat messages');
                    return;
                }
                this.broadcast({
                    type: 'chat',
                    data: message.data,
                    from: this.clients.get(clientId)?.userId || 'anonymous',
                    timestamp: new Date().toISOString()
                }, [clientId]);
                break;

            default:
                this.sendError(clientId, 'UNKNOWN_MESSAGE', `Unknown message type: ${type}`);
        }
    }

    private startPriceBroadcast() {
        this.priceInterval = setInterval(() => {
            const symbols = ['BTC', 'ETH', 'SOL', 'ADA'];
            const updates = symbols.map(symbol => ({
                type: 'price',
                symbol,
                price: (Math.random() * 1000 + 1000).toFixed(2),
                timestamp: new Date().toISOString()
            }));

            // Broadcast to all subscribed clients
            this.broadcastToSubscribed('price', updates);
        }, 2000);
    }

    private broadcastToSubscribed(eventType: string, data: Record<string, unknown>[]) {
        const message = { type: eventType, data, timestamp: new Date().toISOString() };

        for (const [clientId, subscription] of this.subscriptions) {
            if (eventType === 'price' && subscription.symbols.size > 0) {
                const filtered = data.filter(d => subscription.symbols.has(d.symbol as string));
                if (filtered.length > 0) {
                    this.sendToClient(clientId, { ...message, data: filtered });
                }
            } else if (eventType === 'chat' && subscription.channels.has('chat')) {
                this.sendToClient(clientId, message);
            }
        }
    }

    /**
     * Broadcast to all local clients. Override in distributed manager.
     */
    protected broadcast(message: Record<string, unknown>, excludeIds: string[] = []) {
        this.localBroadcast(message, excludeIds);
    }

    /**
     * Broadcast to local instance clients only.
     * Used by distributed manager to avoid re-broadcasting received messages.
     */
    protected localBroadcast(message: Record<string, unknown>, excludeIds: string[] = []) {
        const data = JSON.stringify(message);
        for (const [clientId, client] of this.clients) {
            if (!excludeIds.includes(clientId)) {
                client.ws.send(data);
            }
        }
    }

    private sendToClient(clientId: string, message: Record<string, unknown>) {
        const client = this.clients.get(clientId);
        if (client) {
            client.ws.send(JSON.stringify(message));
        }
    }

    private generateClientId(): string {
        return `ws_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    // Public methods
    getClientCount(): number {
        return this.clients.size;
    }

    shutdown() {
        if (this.priceInterval) {
            clearInterval(this.priceInterval);
        }
        for (const client of this.clients.values()) {
            client.ws.close();
        }
        this.clients.clear();
        this.subscriptions.clear();
        wsLog.info('Server shutdown');
    }

    /**
     * Get all connected client IDs
     */
    getConnectedClients(): string[] {
        return Array.from(this.clients.keys());
    }

    /**
     * Disconnect a specific client
     */
    disconnectClient(clientId: string, reason: string = 'Disconnected by server') {
        const client = this.clients.get(clientId);
        if (client) {
            client.ws.send(JSON.stringify({
                type: 'disconnect',
                reason,
                timestamp: new Date().toISOString()
            }));
            client.ws.close();
            this.clients.delete(clientId);
            this.subscriptions.delete(clientId);
            wsLog.info({ clientId, reason }, 'Client forcefully disconnected');
        }
    }
}

// Export singleton
export const wsManager = new WebSocketManager();
export default wsManager;
