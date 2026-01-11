import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LiquidClientFactory, generateSessionId } from '../../src/liquid-engine/clientFactory';

describe('LiquidClientFactory', () => {
    let factory: LiquidClientFactory;

    beforeEach(() => {
        // Create factory with short TTL for testing
        // Use very long cleanupInterval to prevent auto-cleanup during tests
        factory = new LiquidClientFactory({
            sessionTTL: 100,      // 100ms
            cleanupInterval: 60000   // 60s - effectively disabled during test
        });
    });

    afterEach(() => {
        factory.shutdown();
    });

    describe('getClient', () => {
        it('returns same client for same session ID', () => {
            const client1 = factory.getClient('session-123');
            const client2 = factory.getClient('session-123');
            expect(client1).toBe(client2);
        });

        it('returns different clients for different session IDs', () => {
            const client1 = factory.getClient('session-123');
            const client2 = factory.getClient('session-456');
            expect(client1).not.toBe(client2);
        });

        it('updates lastAccess on getClient', async () => {
            factory.getClient('session-123');
            const firstAccess = factory.getSession('session-123')?.lastAccess ?? 0;

            await new Promise(resolve => setTimeout(resolve, 10));

            factory.getClient('session-123');
            const secondAccess = factory.getSession('session-123')?.lastAccess ?? 0;

            expect(secondAccess).toBeGreaterThan(firstAccess);
        });
    });

    describe('session management', () => {
        it('hasSession returns true for existing session', () => {
            factory.getClient('session-123');
            expect(factory.hasSession('session-123')).toBe(true);
        });

        it('hasSession returns false for non-existing session', () => {
            expect(factory.hasSession('non-existent')).toBe(false);
        });

        it('getSessionCount returns correct count', () => {
            expect(factory.getSessionCount()).toBe(0);
            factory.getClient('session-1');
            expect(factory.getSessionCount()).toBe(1);
            factory.getClient('session-2');
            expect(factory.getSessionCount()).toBe(2);
            factory.getClient('session-1'); // Same session
            expect(factory.getSessionCount()).toBe(2);
        });

        it('getSessionIds returns all session IDs', () => {
            factory.getClient('session-a');
            factory.getClient('session-b');
            factory.getClient('session-c');

            const ids = factory.getSessionIds();
            expect(ids).toHaveLength(3);
            expect(ids).toContain('session-a');
            expect(ids).toContain('session-b');
            expect(ids).toContain('session-c');
        });

        it('destroySession removes client immediately', () => {
            factory.getClient('session-123');
            expect(factory.hasSession('session-123')).toBe(true);

            const result = factory.destroySession('session-123');

            expect(result).toBe(true);
            expect(factory.hasSession('session-123')).toBe(false);
            expect(factory.getSessionCount()).toBe(0);
        });

        it('destroySession returns false for non-existing session', () => {
            const result = factory.destroySession('non-existent');
            expect(result).toBe(false);
        });
    });

    describe('cleanup', () => {
        it('cleans up stale sessions after TTL', async () => {
            factory.getClient('session-123');
            expect(factory.getSessionCount()).toBe(1);

            // Wait for TTL to expire (100ms TTL + buffer)
            await new Promise(resolve => setTimeout(resolve, 200));

            const cleaned = factory.cleanup();

            expect(cleaned).toBe(1);
            expect(factory.getSessionCount()).toBe(0);
        });

        it('does not clean up active sessions', async () => {
            factory.getClient('session-123');

            // Access within TTL
            await new Promise(resolve => setTimeout(resolve, 50));
            factory.getClient('session-123'); // Refresh lastAccess

            await new Promise(resolve => setTimeout(resolve, 60));
            const cleaned = factory.cleanup();

            expect(cleaned).toBe(0);
            expect(factory.getSessionCount()).toBe(1);
        });

        it('cleanup is selective', async () => {
            factory.getClient('session-old');

            await new Promise(resolve => setTimeout(resolve, 120));

            factory.getClient('session-new');

            await new Promise(resolve => setTimeout(resolve, 50));

            const cleaned = factory.cleanup();

            // session-old should be cleaned (120+50=170ms > 100ms TTL)
            // session-new should remain (50ms < 100ms TTL)
            expect(cleaned).toBe(1);
            expect(factory.hasSession('session-old')).toBe(false);
            expect(factory.hasSession('session-new')).toBe(true);
        });
    });

    describe('session isolation', () => {
        it('contexts registered in one session not visible in another', () => {
            const client1 = factory.getClient('session-1');
            const client2 = factory.getClient('session-2');

            client1.registerReadable({
                id: 'secret',
                description: 'Secret data',
                value: 'user1-data'
            });

            expect(client1.getReadableContexts()).toHaveLength(1);
            expect(client2.getReadableContexts()).toHaveLength(0);
        });

        it('tool states isolated between sessions', () => {
            const client1 = factory.getClient('session-1');
            const client2 = factory.getClient('session-2');

            client1.ingest({
                type: 'tool_start',
                id: 'tool-1',
                name: 'test_tool'
            });

            expect(client1.getToolState('tool-1')).toBeDefined();
            expect(client2.getToolState('tool-1')).toBeUndefined();
        });

        it('actions isolated between sessions', () => {
            const client1 = factory.getClient('session-1');
            const client2 = factory.getClient('session-2');

            client1.registerAction({
                name: 'secret_action',
                description: 'A secret action',
                parameters: [],
                handler: async () => ({ result: 'secret' })
            });

            expect(client1.getAction('secret_action')).toBeDefined();
            expect(client2.getAction('secret_action')).toBeUndefined();
        });
    });

    describe('shutdown', () => {
        it('clears all sessions on shutdown', () => {
            factory.getClient('session-1');
            factory.getClient('session-2');
            factory.getClient('session-3');

            expect(factory.getSessionCount()).toBe(3);

            factory.shutdown();

            expect(factory.getSessionCount()).toBe(0);
        });

        it('resets client state on shutdown', () => {
            const client = factory.getClient('session-1');
            client.registerReadable({
                id: 'test',
                description: 'Test',
                value: 'data'
            });

            expect(client.getContextCount()).toBe(1);

            factory.shutdown();

            // Client was reset
            expect(client.getContextCount()).toBe(0);
        });
    });
});

describe('generateSessionId', () => {
    it('generates unique IDs', () => {
        const ids = new Set<string>();
        for (let i = 0; i < 100; i++) {
            ids.add(generateSessionId());
        }
        expect(ids.size).toBe(100);
    });

    it('generates string IDs', () => {
        const id = generateSessionId();
        expect(typeof id).toBe('string');
        expect(id.length).toBeGreaterThan(0);
    });

    it('generates IDs in expected format', () => {
        const id = generateSessionId();
        // Should be UUID format or fallback format
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        const isFallback = /^session_\d+_[a-z0-9]+$/i.test(id);
        expect(isUUID || isFallback).toBe(true);
    });
});

describe('LiquidClient.reset', () => {
    it('clears all state', () => {
        const factory = new LiquidClientFactory();
        const client = factory.getClient('test-session');

        // Add some state
        client.registerReadable({
            id: 'context-1',
            description: 'Test context',
            value: 'data'
        });

        client.registerAction({
            name: 'test_action',
            description: 'Test action',
            parameters: [],
            handler: async () => ({})
        });

        client.ingest({
            type: 'tool_start',
            id: 'tool-1',
            name: 'test'
        });

        // Verify state exists
        expect(client.getContextCount()).toBe(1);
        expect(client.getActionCount()).toBe(1);
        expect(client.getToolStateCount()).toBe(1);

        // Reset
        client.reset();

        // Verify state cleared
        expect(client.getContextCount()).toBe(0);
        expect(client.getActionCount()).toBe(0);
        expect(client.getToolStateCount()).toBe(0);

        factory.shutdown();
    });
});
