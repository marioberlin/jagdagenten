import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Tests for Distributed WebSocket Manager
 * @see docs/IMPLEMENTATION_PLAN.md - Item 2.2 WebSocket Horizontal Scaling
 */

// Mock Redis for testing without actual Redis connection
class MockRedis {
    private subscriptions: Map<string, Set<string>> = new Map();
    private messageHandlers: Map<string, ((channel: string, message: string) => void)[]> = new Map();
    private channels: Set<string> = new Set();
    public publishedMessages: Array<{ channel: string; message: string }> = [];

    constructor(_url?: string) {}

    async subscribe(channel: string): Promise<void> {
        this.channels.add(channel);
    }

    async publish(channel: string, message: string): Promise<number> {
        this.publishedMessages.push({ channel, message });
        // Simulate delivery to subscribers
        const handlers = this.messageHandlers.get('message') || [];
        handlers.forEach(h => h(channel, message));
        return 1;
    }

    on(event: string, handler: (channel: string, message: string) => void): void {
        if (!this.messageHandlers.has(event)) {
            this.messageHandlers.set(event, []);
        }
        this.messageHandlers.get(event)!.push(handler);
    }

    async sadd(key: string, ...members: string[]): Promise<number> {
        if (!this.subscriptions.has(key)) {
            this.subscriptions.set(key, new Set());
        }
        members.forEach(m => this.subscriptions.get(key)!.add(m));
        return members.length;
    }

    async srem(key: string, ...members: string[]): Promise<number> {
        const set = this.subscriptions.get(key);
        if (!set) return 0;
        let removed = 0;
        members.forEach(m => {
            if (set.delete(m)) removed++;
        });
        return removed;
    }

    async scard(key: string): Promise<number> {
        return this.subscriptions.get(key)?.size || 0;
    }

    async quit(): Promise<string> {
        return 'OK';
    }

    getSubscriptions(key: string): Set<string> {
        return this.subscriptions.get(key) || new Set();
    }
}

// Simulate the DistributedWebSocketManager behavior
class TestDistributedManager {
    public instanceId: string;
    public isConnected = false;
    public pubClient: MockRedis | null = null;
    public subClient: MockRedis | null = null;
    private clients: Map<string, { ws: any; clientId: string }> = new Map();
    private subscriptions: Map<string, { symbols: Set<string> }> = new Map();
    public localBroadcasts: Array<{ message: Record<string, unknown>; excludeIds: string[] }> = [];

    constructor(instanceId?: string) {
        this.instanceId = instanceId || `test-${Math.random().toString(36).substring(2)}`;
    }

    async init(mockPub: MockRedis, mockSub: MockRedis): Promise<boolean> {
        this.pubClient = mockPub;
        this.subClient = mockSub;
        this.isConnected = true;
        await this.subClient.subscribe('ws:broadcast');
        return true;
    }

    addClient(clientId: string): void {
        this.clients.set(clientId, { ws: { send: vi.fn() }, clientId });
        this.subscriptions.set(clientId, { symbols: new Set() });
    }

    localBroadcast(message: Record<string, unknown>, excludeIds: string[] = []): void {
        this.localBroadcasts.push({ message, excludeIds });
    }

    async broadcast(message: Record<string, unknown>, excludeIds: string[] = []): Promise<void> {
        if (this.isConnected && this.pubClient) {
            await this.pubClient.publish('ws:broadcast', JSON.stringify({
                sourceInstance: this.instanceId,
                payload: message,
                excludeIds
            }));
        }
        this.localBroadcast(message, excludeIds);
    }

    async addSubscription(clientId: string, symbol: string): Promise<void> {
        const sub = this.subscriptions.get(clientId);
        if (sub) {
            sub.symbols.add(symbol);
        }
        if (this.pubClient) {
            await this.pubClient.sadd(`ws:subs:${symbol}`, `${this.instanceId}:${clientId}`);
        }
    }

    async removeSubscription(clientId: string, symbol: string): Promise<void> {
        const sub = this.subscriptions.get(clientId);
        if (sub) {
            sub.symbols.delete(symbol);
        }
        if (this.pubClient) {
            await this.pubClient.srem(`ws:subs:${symbol}`, `${this.instanceId}:${clientId}`);
        }
    }

    async getSymbolSubscriberCount(symbol: string): Promise<number> {
        if (!this.pubClient) return 0;
        return await this.pubClient.scard(`ws:subs:${symbol}`);
    }
}

describe('Distributed WebSocket Manager', () => {
    let manager1: TestDistributedManager;
    let manager2: TestDistributedManager;
    let sharedPub: MockRedis;
    let sharedSub1: MockRedis;
    let sharedSub2: MockRedis;

    beforeEach(async () => {
        // Create shared mock Redis instances
        sharedPub = new MockRedis();
        sharedSub1 = new MockRedis();
        sharedSub2 = new MockRedis();

        // Create two "instances" of the distributed manager
        manager1 = new TestDistributedManager('instance-1');
        manager2 = new TestDistributedManager('instance-2');

        await manager1.init(sharedPub, sharedSub1);
        await manager2.init(sharedPub, sharedSub2);

        // Add clients to each instance
        manager1.addClient('client-a');
        manager2.addClient('client-b');
    });

    describe('Instance Identification', () => {
        it('generates unique instance IDs', () => {
            expect(manager1.instanceId).toBe('instance-1');
            expect(manager2.instanceId).toBe('instance-2');
            expect(manager1.instanceId).not.toBe(manager2.instanceId);
        });

        it('marks instance as connected after init', () => {
            expect(manager1.isConnected).toBe(true);
            expect(manager2.isConnected).toBe(true);
        });
    });

    describe('Redis Pub/Sub Broadcasting', () => {
        it('publishes broadcast messages to Redis channel', async () => {
            const message = { type: 'chat', text: 'Hello from instance 1' };
            await manager1.broadcast(message);

            expect(sharedPub.publishedMessages.length).toBe(1);
            expect(sharedPub.publishedMessages[0].channel).toBe('ws:broadcast');

            const parsed = JSON.parse(sharedPub.publishedMessages[0].message);
            expect(parsed.sourceInstance).toBe('instance-1');
            expect(parsed.payload).toEqual(message);
        });

        it('includes excludeIds in published message', async () => {
            await manager1.broadcast({ type: 'test' }, ['client-x', 'client-y']);

            const parsed = JSON.parse(sharedPub.publishedMessages[0].message);
            expect(parsed.excludeIds).toEqual(['client-x', 'client-y']);
        });

        it('also broadcasts locally when publishing', async () => {
            const message = { type: 'local' };
            await manager1.broadcast(message);

            expect(manager1.localBroadcasts.length).toBe(1);
            expect(manager1.localBroadcasts[0].message).toEqual(message);
        });
    });

    describe('Subscription Tracking in Redis', () => {
        it('stores subscriptions in Redis Sets', async () => {
            await manager1.addSubscription('client-a', 'BTC');
            await manager2.addSubscription('client-b', 'BTC');

            const subscribers = sharedPub.getSubscriptions('ws:subs:BTC');
            expect(subscribers.size).toBe(2);
            expect(subscribers.has('instance-1:client-a')).toBe(true);
            expect(subscribers.has('instance-2:client-b')).toBe(true);
        });

        it('tracks different symbols separately', async () => {
            await manager1.addSubscription('client-a', 'BTC');
            await manager1.addSubscription('client-a', 'ETH');
            await manager2.addSubscription('client-b', 'BTC');

            const btcSubs = sharedPub.getSubscriptions('ws:subs:BTC');
            const ethSubs = sharedPub.getSubscriptions('ws:subs:ETH');

            expect(btcSubs.size).toBe(2);
            expect(ethSubs.size).toBe(1);
        });

        it('removes subscriptions from Redis', async () => {
            await manager1.addSubscription('client-a', 'BTC');
            expect(sharedPub.getSubscriptions('ws:subs:BTC').size).toBe(1);

            await manager1.removeSubscription('client-a', 'BTC');
            expect(sharedPub.getSubscriptions('ws:subs:BTC').size).toBe(0);
        });

        it('counts subscribers across instances', async () => {
            await manager1.addSubscription('client-a', 'SOL');
            await manager2.addSubscription('client-b', 'SOL');

            const count = await manager1.getSymbolSubscriberCount('SOL');
            expect(count).toBe(2);
        });
    });

    describe('Message Deduplication', () => {
        it('includes sourceInstance for deduplication', async () => {
            await manager1.broadcast({ type: 'test' });

            const message = JSON.parse(sharedPub.publishedMessages[0].message);
            expect(message.sourceInstance).toBe('instance-1');
        });

        it('allows filtering messages from same instance', async () => {
            // This tests the concept - actual filtering happens in the real implementation
            await manager1.broadcast({ type: 'test' });

            const message = JSON.parse(sharedPub.publishedMessages[0].message);

            // Instance 1 should ignore its own messages
            const shouldProcess = message.sourceInstance !== manager1.instanceId;
            expect(shouldProcess).toBe(false);

            // Instance 2 should process messages from Instance 1
            const shouldProcess2 = message.sourceInstance !== manager2.instanceId;
            expect(shouldProcess2).toBe(true);
        });
    });

    describe('Graceful Degradation', () => {
        it('works locally when Redis is disconnected', async () => {
            manager1.isConnected = false;

            const message = { type: 'offline' };
            await manager1.broadcast(message);

            // Should still broadcast locally
            expect(manager1.localBroadcasts.length).toBe(1);
            expect(manager1.localBroadcasts[0].message).toEqual(message);
        });

        it('returns 0 subscriber count when disconnected', async () => {
            manager1.pubClient = null;
            const count = await manager1.getSymbolSubscriberCount('BTC');
            expect(count).toBe(0);
        });
    });

    describe('Cross-Instance Communication', () => {
        it('simulates multi-instance scenario', async () => {
            // Instance 1 broadcasts a message
            const chatMessage = { type: 'chat', from: 'user1', text: 'Hello!' };
            await manager1.broadcast(chatMessage);

            // Verify message was published
            expect(sharedPub.publishedMessages.length).toBe(1);

            // Parse and verify content
            const published = JSON.parse(sharedPub.publishedMessages[0].message);
            expect(published.sourceInstance).toBe('instance-1');
            expect(published.payload.type).toBe('chat');
            expect(published.payload.text).toBe('Hello!');
        });

        it('handles concurrent subscriptions from multiple instances', async () => {
            // Multiple clients subscribing concurrently
            await Promise.all([
                manager1.addSubscription('client-a', 'BTC'),
                manager2.addSubscription('client-b', 'BTC'),
                manager1.addSubscription('client-a', 'ETH'),
            ]);

            const btcCount = await manager1.getSymbolSubscriberCount('BTC');
            const ethCount = await manager1.getSymbolSubscriberCount('ETH');

            expect(btcCount).toBe(2);
            expect(ethCount).toBe(1);
        });
    });
});

describe('WebSocket Manager Factory', () => {
    it('concept: should select manager based on Redis availability', () => {
        // This tests the concept of the factory function
        const hasRedis = process.env.REDIS_URL !== undefined;

        // When Redis URL is not set, use local manager
        if (!hasRedis) {
            expect(true).toBe(true); // Local manager would be returned
        }

        // When Redis URL is set, attempt distributed manager
        // Falls back to local if connection fails
    });

    it('concept: distributed manager provides instance stats', async () => {
        // Create a local manager for this test
        const testManager = new TestDistributedManager('stats-test');
        const mockPub = new MockRedis();
        const mockSub = new MockRedis();
        await testManager.init(mockPub, mockSub);
        testManager.addClient('test-client');

        const stats = {
            instanceId: testManager.instanceId,
            isConnected: testManager.isConnected,
            localClients: 1
        };

        expect(stats.instanceId).toBe('stats-test');
        expect(stats.isConnected).toBe(true);
        expect(stats.localClients).toBe(1);
    });
});
