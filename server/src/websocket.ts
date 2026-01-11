/**
 * WebSocket Server - Bidirectional communication for LiquidCrypto
 * Uses Bun's native WebSocket support
 */
interface Subscription {
    clientId: string;
    symbols: Set<string>;
    channels: Set<string>;
}

export class WebSocketManager {
    private subscriptions: Map<string, Subscription> = new Map();
    private priceInterval: ReturnType<typeof setInterval> | null = null;
    private clients: Map<string, any> = new Map();

    // Start WebSocket server using Bun.serve
    startWebSocketServer(port: number = 3001) {
        // Create WebSocket server using Bun's native support
        const server = Bun.serve({
            port,
            fetch(req: Request): Response {
                return new Response('WebSocket server running', { status: 200 });
            },
            websocket: {
                open: (ws: any) => {
                    const clientId = this.generateClientId();

                    this.clients.set(clientId, ws);
                    this.subscriptions.set(clientId, {
                        clientId,
                        symbols: new Set(),
                        channels: new Set()
                    });

                    // Send connection confirmation
                    ws.send(JSON.stringify({
                        type: 'connected',
                        clientId,
                        timestamp: new Date().toISOString()
                    }));

                    console.log(`[WebSocket] Client connected: ${clientId}`);
                },
                close: (ws: any) => {
                    // Find and remove client
                    for (const [clientId, socket] of this.clients) {
                        if (socket === ws) {
                            this.clients.delete(clientId);
                            this.subscriptions.delete(clientId);
                            console.log(`[WebSocket] Client disconnected: ${clientId}`);
                            break;
                        }
                    }
                },
                message: (ws: any, message: string | Buffer) => {
                    // Find client
                    for (const [clientId, socket] of this.clients) {
                        if (socket === ws) {
                            try {
                                const data = JSON.parse(message.toString());
                                this.handleMessage(clientId, data);
                            } catch {
                                console.error('[WebSocket] Invalid message');
                            }
                            break;
                        }
                    }
                }
            }
        });

        // Start price broadcast
        this.startPriceBroadcast();

        console.log(`[WebSocket] Server started on port ${port}`);
        return server;
    }

    private handleMessage(clientId: string, message: Record<string, unknown>) {
        const subscription = this.subscriptions.get(clientId);
        if (!subscription) return;

        const type = message.type as string;

        switch (type) {
            case 'subscribe':
                if (message.symbol) {
                    subscription.symbols.add(message.symbol as string);
                }
                if (message.channel) {
                    subscription.channels.add(message.channel as string);
                }
                break;

            case 'unsubscribe':
                if (message.symbol) {
                    subscription.symbols.delete(message.symbol as string);
                }
                if (message.channel) {
                    subscription.channels.delete(message.channel as string);
                }
                break;

            case 'ping':
                const ws = this.clients.get(clientId);
                ws?.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
                break;

            case 'trade':
                console.log(`[WebSocket] Trade from ${clientId}:`, message.data);
                this.sendToClient(clientId, {
                    type: 'trade_confirm',
                    data: message.data,
                    timestamp: new Date().toISOString()
                });
                break;

            case 'chat':
                this.broadcast({
                    type: 'chat',
                    data: message.data,
                    timestamp: new Date().toISOString()
                }, [clientId]);
                break;
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

    private broadcast(message: Record<string, unknown>, excludeIds: string[] = []) {
        const data = JSON.stringify(message);
        for (const [clientId, socket] of this.clients) {
            if (!excludeIds.includes(clientId)) {
                socket.send(data);
            }
        }
    }

    private sendToClient(clientId: string, message: Record<string, unknown>) {
        const socket = this.clients.get(clientId);
        if (socket) {
            socket.send(JSON.stringify(message));
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
        for (const socket of this.clients.values()) {
            socket.close();
        }
        this.clients.clear();
        this.subscriptions.clear();
        console.log('[WebSocket] Server shutdown');
    }
}

// Export singleton
export const wsManager = new WebSocketManager();
export default wsManager;
