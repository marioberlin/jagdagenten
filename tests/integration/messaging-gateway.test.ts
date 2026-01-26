/**
 * Messaging Gateway Integration Tests
 * 
 * Tests for the unified messaging gateway including:
 * - Channel adapter registration
 * - Message normalization
 * - Session management
 * - Identity linking
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MessagingGateway } from '../../server/src/messaging-gateway/gateway';
import { IdentityLinkingService } from '../../server/src/messaging-gateway/identity-linking';
import type { NormalizedMessage, GatewaySession } from '../../server/src/messaging-gateway/types';

// ============================================================================
// Test Setup
// ============================================================================

describe('Messaging Gateway', () => {
    let gateway: MessagingGateway;
    let identityService: IdentityLinkingService;

    beforeAll(async () => {
        gateway = new MessagingGateway({
            name: 'Test Gateway',
            version: '1.0.0',
            channels: {},
            session: {
                scope: 'per-sender',
                dmScope: 'main',
                reset: { mode: 'manual' },
                resetTriggers: ['/reset'],
            },
            messages: {
                groupChat: {
                    mentionPatterns: ['@bot'],
                    defaultActivation: 'mention',
                },
            },
            agentRouting: {
                defaultAgent: 'test-agent',
            },
        });

        identityService = new IdentityLinkingService();

        await gateway.start();
    });

    afterAll(async () => {
        await gateway.stop();
    });

    // ============================================================================
    // Session Management Tests
    // ============================================================================

    describe('Session Management', () => {
        it('should create a new session for a sender', async () => {
            const message: NormalizedMessage = {
                id: 'msg-1',
                channelType: 'telegram',
                channelId: 'chat-123',
                from: { id: 'user-1', displayName: 'Test User' },
                text: 'Hello',
                media: [],
                timestamp: new Date(),
                isGroup: false,
                isMention: true,
                raw: {},
            };

            const session = await gateway.getOrCreateSession(message);

            expect(session).toBeDefined();
            expect(session.channelType).toBe('telegram');
            expect(session.senderId).toBe('user-1');
        });

        it('should reuse existing session for same sender', async () => {
            const message1: NormalizedMessage = {
                id: 'msg-1',
                channelType: 'telegram',
                channelId: 'chat-123',
                from: { id: 'user-2', displayName: 'Test User 2' },
                text: 'First message',
                media: [],
                timestamp: new Date(),
                isGroup: false,
                isMention: true,
                raw: {},
            };

            const message2: NormalizedMessage = {
                ...message1,
                id: 'msg-2',
                text: 'Second message',
            };

            const session1 = await gateway.getOrCreateSession(message1);
            const session2 = await gateway.getOrCreateSession(message2);

            expect(session1.id).toBe(session2.id);
        });

        it('should create separate sessions for group threads', async () => {
            const message1: NormalizedMessage = {
                id: 'msg-1',
                channelType: 'slack',
                channelId: 'channel-1',
                threadId: 'thread-1',
                from: { id: 'user-3', displayName: 'Test User' },
                text: 'Thread 1',
                media: [],
                timestamp: new Date(),
                isGroup: true,
                isMention: true,
                raw: {},
            };

            const message2: NormalizedMessage = {
                ...message1,
                id: 'msg-2',
                threadId: 'thread-2',
                text: 'Thread 2',
            };

            const session1 = await gateway.getOrCreateSession(message1);
            const session2 = await gateway.getOrCreateSession(message2);

            expect(session1.id).not.toBe(session2.id);
        });
    });

    // ============================================================================
    // Identity Linking Tests
    // ============================================================================

    describe('Identity Linking', () => {
        it('should create a new identity for first-time user', async () => {
            const identityId = await identityService.getOrCreateIdentity(
                'telegram',
                'new-user-1',
                'NewUser'
            );

            expect(identityId).toBeDefined();
            expect(typeof identityId).toBe('string');
        });

        it('should return same identity for same platform user', async () => {
            const id1 = await identityService.getOrCreateIdentity(
                'telegram',
                'existing-user-1',
                'ExistingUser'
            );

            const id2 = await identityService.getOrCreateIdentity(
                'telegram',
                'existing-user-1',
                'ExistingUser'
            );

            expect(id1).toBe(id2);
        });

        it('should link multiple platforms to same identity', async () => {
            // Create identity on Telegram
            const identityId = await identityService.getOrCreateIdentity(
                'telegram',
                'link-test-user',
                'LinkTestUser'
            );

            // Link Discord account
            await identityService.linkPlatform(identityId, {
                platform: 'discord',
                platformUserId: 'discord-123',
                platformUsername: 'LinkTestUser#1234',
            });

            // Verify both platforms are linked
            const links = await identityService.getLinkedPlatforms(identityId);

            expect(links.length).toBe(2);
            expect(links.map(l => l.platform)).toContain('telegram');
            expect(links.map(l => l.platform)).toContain('discord');
        });

        it('should find identity by any linked platform', async () => {
            // Create identity with Slack
            const identityId = await identityService.getOrCreateIdentity(
                'slack',
                'cross-platform-user',
                'CrossPlatformUser'
            );

            // Link WhatsApp
            await identityService.linkPlatform(identityId, {
                platform: 'whatsapp',
                platformUserId: '+1234567890',
            });

            // Find by WhatsApp
            const foundId = await identityService.findIdentity('whatsapp', '+1234567890');

            expect(foundId).toBe(identityId);
        });
    });

    // ============================================================================
    // Message Routing Tests
    // ============================================================================

    describe('Message Routing', () => {
        it('should activate on mention in group chat', async () => {
            const message: NormalizedMessage = {
                id: 'msg-route-1',
                channelType: 'discord',
                channelId: 'server-channel',
                from: { id: 'user-route-1', displayName: 'RouteUser' },
                text: '@bot help me',
                media: [],
                timestamp: new Date(),
                isGroup: true,
                isMention: true,
                raw: {},
            };

            const shouldActivate = gateway.shouldActivate(message);
            expect(shouldActivate).toBe(true);
        });

        it('should skip non-mentioned messages in groups', async () => {
            const message: NormalizedMessage = {
                id: 'msg-route-2',
                channelType: 'discord',
                channelId: 'server-channel',
                from: { id: 'user-route-2', displayName: 'RouteUser' },
                text: 'Just chatting',
                media: [],
                timestamp: new Date(),
                isGroup: true,
                isMention: false,
                raw: {},
            };

            const shouldActivate = gateway.shouldActivate(message);
            expect(shouldActivate).toBe(false);
        });

        it('should always activate for DMs', async () => {
            const message: NormalizedMessage = {
                id: 'msg-route-3',
                channelType: 'telegram',
                channelId: 'dm-123',
                from: { id: 'user-route-3', displayName: 'DMUser' },
                text: 'Private message',
                media: [],
                timestamp: new Date(),
                isGroup: false,
                isMention: false,
                raw: {},
            };

            const shouldActivate = gateway.shouldActivate(message);
            expect(shouldActivate).toBe(true);
        });
    });

    // ============================================================================
    // Reset Command Tests
    // ============================================================================

    describe('Session Reset', () => {
        it('should recognize reset triggers', () => {
            expect(gateway.isResetTrigger('/reset')).toBe(true);
            expect(gateway.isResetTrigger('/new')).toBe(false); // Not in our config
            expect(gateway.isResetTrigger('hello')).toBe(false);
        });
    });
});
