/**
 * Slack Channel Adapter
 * 
 * Adapter for Slack using the Bolt framework.
 * Supports Socket Mode and Event Subscriptions.
 * 
 * @see https://slack.dev/bolt-js/
 */

import { App, type SlackEventMiddlewareArgs, type AllMiddlewareArgs } from '@slack/bolt';
import { BaseChannelAdapter, registerAdapter } from './base.adapter';
import type {
    ChannelConfig,
    NormalizedMessage,
    NormalizedResponse,
} from '../types';

// ============================================================================
// Slack Adapter
// ============================================================================

export class SlackAdapter extends BaseChannelAdapter {
    readonly channelType = 'slack' as const;
    readonly displayName = 'Slack';

    private app: App | null = null;
    private botUserId: string | null = null;
    private botName: string | null = null;

    constructor(config: ChannelConfig) {
        super(config);
    }

    // ============================================================================
    // Lifecycle
    // ============================================================================

    async start(): Promise<void> {
        const token = this.config.credentials.botToken;
        const signingSecret = this.config.credentials.signingSecret;
        const appToken = this.config.credentials.appToken; // For Socket Mode

        if (!token) {
            throw new Error('Slack bot token is required');
        }
        if (!signingSecret && !appToken) {
            throw new Error('Either signingSecret or appToken is required');
        }

        this.log('info', 'Starting Slack adapter...');

        // Initialize Bolt app
        this.app = new App({
            token,
            signingSecret: signingSecret || undefined,
            socketMode: !!appToken,
            appToken: appToken || undefined,
        });

        // Get bot info
        const auth = await this.app.client.auth.test({ token });
        this.botUserId = auth.user_id as string;
        this.botName = auth.user as string;
        this.log('info', `Connected as @${this.botName}`);

        // Handle messages
        this.app.message(async ({ message, say, client }) => {
            try {
                // Skip bot messages
                if ('bot_id' in message) return;

                const normalized = await this.normalizeMessage(message, client);
                if (normalized) {
                    await this.handleIncomingMessage(normalized);
                }
            } catch (error) {
                this.log('error', 'Error handling message:', error);
            }
        });

        // Handle app mentions
        this.app.event('app_mention', async ({ event, client }) => {
            try {
                const normalized = await this.normalizeAppMention(event, client);
                if (normalized) {
                    await this.handleIncomingMessage(normalized);
                }
            } catch (error) {
                this.log('error', 'Error handling mention:', error);
            }
        });

        // Start the app
        if (appToken) {
            await this.app.start();
            this.log('info', 'Slack Socket Mode started');
        } else {
            this.log('info', 'Slack adapter ready (use handleWebhook for events)');
        }

        this._connected = true;
        this.emitEvent('connected', '', { userId: this.botUserId, name: this.botName });
    }

    async stop(): Promise<void> {
        if (this.app) {
            await this.app.stop();
            this.app = null;
        }
        this._connected = false;
        this.emitEvent('disconnected', '', {});
        this.log('info', 'Slack adapter stopped');
    }

    // ============================================================================
    // Message Handling
    // ============================================================================

    async send(channelId: string, response: NormalizedResponse): Promise<string> {
        if (!this.app) {
            throw new Error('Slack app not initialized');
        }

        const options: Record<string, unknown> = {
            channel: channelId,
        };

        // Handle reply to thread
        if (response.replyTo) {
            options.thread_ts = response.replyTo;
        }

        // Build blocks for rich content
        const blocks: unknown[] = [];

        if (response.text) {
            blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: response.text,
                },
            });
        }

        // Add buttons
        if (response.buttons && response.buttons.length > 0) {
            blocks.push({
                type: 'actions',
                elements: response.buttons.map((btn, i) => ({
                    type: btn.url ? 'button' : 'button',
                    text: {
                        type: 'plain_text',
                        text: btn.text,
                    },
                    action_id: btn.callback ?? `action_${i}`,
                    url: btn.url,
                })),
            });
        }

        const result = await this.app.client.chat.postMessage({
            ...options,
            text: response.text ?? '',
            blocks: blocks.length > 0 ? blocks : undefined,
        });

        return result.ts as string;
    }

    async sendTyping(channelId: string): Promise<void> {
        // Slack doesn't have a direct typing indicator API
        // Could use chat.meMessage or just skip
    }

    // ============================================================================
    // Webhook Support
    // ============================================================================

    getWebhookPath(): string {
        return '/webhook/slack';
    }

    async handleWebhook(request: Request): Promise<Response> {
        if (!this.app) {
            return new Response('App not initialized', { status: 500 });
        }

        // Bolt handles this internally when using Express/Fastify
        // For custom handling, we'd need to implement challenge/verification
        try {
            const body = await request.json();

            // Handle URL verification
            if (body.type === 'url_verification') {
                return new Response(JSON.stringify({ challenge: body.challenge }), {
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            // Process event
            // Note: In production, use Bolt's built-in request handling
            return new Response('OK', { status: 200 });
        } catch (error) {
            this.log('error', 'Webhook error:', error);
            return new Response('Error', { status: 500 });
        }
    }

    // ============================================================================
    // Message Normalization
    // ============================================================================

    private async normalizeMessage(
        message: Record<string, unknown>,
        client: { users?: { info: (args: { user: string }) => Promise<{ user?: { real_name?: string; name?: string } }> } }
    ): Promise<NormalizedMessage | null> {
        const userId = message.user as string;
        const text = message.text as string;
        const channelId = message.channel as string;
        const ts = message.ts as string;
        const threadTs = message.thread_ts as string | undefined;

        if (!userId || !text) return null;

        // Get user info
        let userName = 'Unknown';
        let userHandle = '';
        try {
            if (client.users) {
                const userInfo = await client.users.info({ user: userId });
                userName = userInfo.user?.real_name ?? userInfo.user?.name ?? 'Unknown';
                userHandle = userInfo.user?.name ?? '';
            }
        } catch {
            // Ignore user lookup failures
        }

        // Check for mentions
        const mentionsBot = text.includes(`<@${this.botUserId}>`);

        // Determine if group (channels are always "group-like")
        const isGroup = true; // Slack channels are always multi-user

        return {
            id: ts,
            channelType: 'slack',
            channelId,
            from: {
                id: userId,
                name: userName,
                handle: userHandle,
                isBot: false,
            },
            text: this.cleanMentions(text),
            replyTo: threadTs,
            threadId: threadTs,
            isGroup,
            mentionsBot,
            timestamp: new Date(parseFloat(ts) * 1000),
            raw: message,
        };
    }

    private async normalizeAppMention(
        event: Record<string, unknown>,
        client: { users?: { info: (args: { user: string }) => Promise<{ user?: { real_name?: string; name?: string } }> } }
    ): Promise<NormalizedMessage | null> {
        // App mentions are similar to messages
        return this.normalizeMessage(event, client);
    }

    private cleanMentions(text: string): string {
        // Remove <@USERID> patterns but keep the text readable
        return text.replace(/<@[A-Z0-9]+>/g, '').trim();
    }

    // ============================================================================
    // Configuration
    // ============================================================================

    validateConfig(): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!this.config.credentials.botToken) {
            errors.push('Missing required credential: botToken');
        }
        if (!this.config.credentials.signingSecret && !this.config.credentials.appToken) {
            errors.push('Either signingSecret or appToken is required');
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    getRequiredCredentials(): string[] {
        return ['botToken', 'signingSecret'];
    }
}

// Register adapter
registerAdapter('slack', (config) => new SlackAdapter(config));

export default SlackAdapter;
