/**
 * Messaging Gateway Elysia Plugin
 * 
 * Integrates the messaging gateway with the Elysia HTTP server.
 * Provides webhook endpoints and A2A protocol support.
 */

import { Elysia, t } from 'elysia';
import {
    MessagingGateway,
    createGateway,
    getGateway,
    type SessionStore,
} from './gateway';
import type { GatewayConfig } from './config';
import type { ChannelType, NormalizedResponse } from './types';

// ============================================================================
// Elysia Plugin
// ============================================================================

export interface MessagingGatewayPluginOptions {
    /** Gateway configuration */
    config?: Partial<GatewayConfig>;

    /** Custom session store */
    sessionStore?: SessionStore;

    /** Auto-start the gateway on plugin load */
    autoStart?: boolean;

    /** Base path for webhook endpoints */
    webhookBasePath?: string;
}

export function createMessagingGatewayPlugin(options: MessagingGatewayPluginOptions = {}) {
    const {
        config,
        sessionStore,
        autoStart = true,
        webhookBasePath = '/webhook',
    } = options;

    // Create gateway instance
    const gateway = createGateway(config, sessionStore);

    return new Elysia({ name: 'messaging-gateway' })
        // ========================================================================
        // Health & Status Endpoints
        // ========================================================================

        .get('/api/v1/gateway/status', () => {
            return {
                status: 'ok',
                adapters: gateway.getActiveAdapters(),
                available: gateway.getAvailableAdapters(),
                webhooks: Object.fromEntries(gateway.getWebhookPaths()),
            };
        })

        .get('/api/v1/gateway/sessions', async ({ query }) => {
            const sessions = await gateway.getSessions({
                channelType: query.channelType as ChannelType | undefined,
                userId: query.userId,
            });
            return { sessions };
        }, {
            query: t.Object({
                channelType: t.Optional(t.String()),
                userId: t.Optional(t.String()),
            }),
        })

        // ========================================================================
        // Send Message Endpoint
        // ========================================================================

        .post('/api/v1/gateway/send', async ({ body, set }) => {
            try {
                const messageId = await gateway.sendMessage(
                    body.channelType as ChannelType,
                    body.channelId,
                    body.response as NormalizedResponse,
                );
                return { success: true, messageId };
            } catch (error) {
                set.status = 400;
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                };
            }
        }, {
            body: t.Object({
                channelType: t.String(),
                channelId: t.String(),
                response: t.Object({
                    text: t.Optional(t.String()),
                    replyTo: t.Optional(t.String()),
                    buttons: t.Optional(t.Array(t.Object({
                        text: t.String(),
                        callback: t.Optional(t.String()),
                        url: t.Optional(t.String()),
                    }))),
                }),
            }),
        })

        // ========================================================================
        // Webhook Endpoints
        // ========================================================================

        .post(`${webhookBasePath}/telegram/:token`, async ({ params, request }) => {
            return gateway.handleWebhook('telegram', request);
        })

        .post(`${webhookBasePath}/slack`, async ({ request }) => {
            return gateway.handleWebhook('slack', request);
        })

        .post(`${webhookBasePath}/discord`, async ({ request }) => {
            return gateway.handleWebhook('discord', request);
        })

        .post(`${webhookBasePath}/google-chat`, async ({ request }) => {
            return gateway.handleWebhook('webchat', request);
        })

        // ========================================================================
        // A2A Protocol Endpoints (Agent-to-Agent)
        // ========================================================================

        .get('/api/v1/gateway/agent.json', () => {
            // Return A2A Agent Card for the messaging gateway
            return {
                '@context': 'https://a2aprotocol.ai/context/v1',
                '@type': 'AgentCard',
                name: gateway.getConfig().name,
                version: gateway.getConfig().version,
                description: 'Unified multi-channel messaging gateway for LiquidOS',
                url: `${process.env.BASE_URL ?? 'http://localhost:3000'}/api/v1/gateway`,
                capabilities: {
                    streaming: false,
                    pushNotifications: true,
                    a2ui: false,
                },
                skills: [
                    {
                        name: 'send_message',
                        description: 'Send a message to a specific channel',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                channelType: { type: 'string', enum: gateway.getAvailableAdapters() },
                                channelId: { type: 'string' },
                                text: { type: 'string' },
                            },
                            required: ['channelType', 'channelId', 'text'],
                        },
                    },
                    {
                        name: 'list_sessions',
                        description: 'List active sessions',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                channelType: { type: 'string' },
                                userId: { type: 'string' },
                            },
                        },
                    },
                ],
                authentication: {
                    schemes: ['bearer'],
                },
            };
        })

        .post('/api/v1/gateway/tasks/send', async ({ body, set }) => {
            // A2A task execution endpoint
            const { id, message } = body as { id?: string; message?: { parts?: Array<{ text?: string }> } };

            // Extract text from message parts
            const text = message?.parts?.map(p => p.text).join('') ?? '';

            // Simple routing - in production, this would parse the intent
            if (text.toLowerCase().includes('send message')) {
                // Parse send message command
                // Format: "send message to telegram:123 hello world"
                const match = text.match(/send message to (\w+):(\S+)\s+(.+)/i);
                if (match) {
                    const [, channelType, channelId, messageText] = match;
                    try {
                        const messageId = await gateway.sendMessage(
                            channelType as ChannelType,
                            channelId,
                            { text: messageText },
                        );
                        return {
                            id: id ?? `task-${Date.now()}`,
                            status: { state: 'completed' },
                            artifacts: [{
                                name: 'result',
                                parts: [{ text: `Message sent: ${messageId}` }],
                            }],
                        };
                    } catch (error) {
                        return {
                            id: id ?? `task-${Date.now()}`,
                            status: {
                                state: 'failed',
                                message: { parts: [{ text: error instanceof Error ? error.message : 'Unknown error' }] },
                            },
                        };
                    }
                }
            }

            // Default: list status
            return {
                id: id ?? `task-${Date.now()}`,
                status: { state: 'completed' },
                artifacts: [{
                    name: 'status',
                    parts: [{
                        text: `Gateway active with adapters: ${gateway.getActiveAdapters().join(', ')}`
                    }],
                }],
            };
        }, {
            body: t.Object({
                id: t.Optional(t.String()),
                message: t.Optional(t.Object({
                    parts: t.Optional(t.Array(t.Object({
                        text: t.Optional(t.String()),
                    }))),
                })),
            }),
        })

        // ========================================================================
        // Lifecycle Hooks
        // ========================================================================

        .onStart(async () => {
            if (autoStart) {
                await gateway.start();
            }
        })

        .onStop(async () => {
            await gateway.stop();
        })

        // ========================================================================
        // Decorate with Gateway Instance
        // ========================================================================

        .decorate('gateway', gateway);
}

// ============================================================================
// Export
// ============================================================================

export { getGateway, createGateway };
export default createMessagingGatewayPlugin;
