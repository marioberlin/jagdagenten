/**
 * Webhook Adapter
 * 
 * Generic webhook adapter for custom integrations.
 * Receives messages via HTTP POST and sends via configurable endpoints.
 * 
 * Useful for:
 * - Custom chat applications
 * - Internal tools integration
 * - Third-party services without native adapters
 */

import { BaseChannelAdapter, registerAdapter } from './base.adapter';
import type { ChannelConfig, NormalizedMessage, NormalizedResponse, GatewayEvent } from '../types';

// ============================================================================
// Webhook Adapter
// ============================================================================

export interface WebhookConfig extends ChannelConfig {
    /** URL to POST outgoing messages to */
    outboundUrl?: string;

    /** Secret for verifying incoming webhooks */
    webhookSecret?: string;

    /** Custom headers for outbound requests */
    outboundHeaders?: Record<string, string>;

    /** Field mappings for incoming webhook payload */
    inboundMapping?: {
        id?: string;
        text?: string;
        from?: string;
        fromName?: string;
        channelId?: string;
        timestamp?: string;
        isGroup?: string;
    };

    /** Field mappings for outgoing webhook payload */
    outboundMapping?: {
        text?: string;
        channelId?: string;
        replyToId?: string;
    };
}

export class WebhookAdapter extends BaseChannelAdapter {
    readonly channelType = 'webchat' as const;
    readonly displayName = 'Webhook';

    private webhookConfig: WebhookConfig;

    constructor(config: WebhookConfig) {
        super(config);
        this.webhookConfig = config;
    }

    async start(): Promise<void> {
        if (!this.config.enabled) return;

        console.info('[Webhook] Adapter started, waiting for incoming webhooks');
        this.emit('event', {
            type: 'connection',
            channelType: this.channelType,
            data: { status: 'connected' },
        } as GatewayEvent);
    }

    async stop(): Promise<void> {
        // No persistent connections to close
    }

    async send(channelId: string, response: NormalizedResponse): Promise<string> {
        const outboundUrl = this.webhookConfig.outboundUrl;
        if (!outboundUrl) {
            console.warn('[Webhook] No outbound URL configured, message not sent');
            return `local-${Date.now()}`;
        }

        const mapping = this.webhookConfig.outboundMapping ?? {};

        // Build payload using mapping
        const payload: Record<string, unknown> = {};
        payload[mapping.text ?? 'text'] = response.text;
        payload[mapping.channelId ?? 'channelId'] = channelId;

        if (response.html) {
            payload.html = response.html;
        }

        if (response.media?.length) {
            payload.media = response.media;
        }

        if (response.buttons?.length) {
            payload.buttons = response.buttons;
        }

        try {
            const res = await fetch(outboundUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.webhookConfig.outboundHeaders,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                throw new Error(`Webhook returned ${res.status}: ${await res.text()}`);
            }

            const data = await res.json().catch(() => ({}));
            return data.messageId ?? `webhook-${Date.now()}`;
        } catch (error) {
            console.error('[Webhook] Send error:', error);
            throw error;
        }
    }

    async reply(message: NormalizedMessage, response: NormalizedResponse): Promise<string> {
        const outboundUrl = this.webhookConfig.outboundUrl;
        if (!outboundUrl) {
            return `local-${Date.now()}`;
        }

        const mapping = this.webhookConfig.outboundMapping ?? {};

        const payload: Record<string, unknown> = {};
        payload[mapping.text ?? 'text'] = response.text;
        payload[mapping.channelId ?? 'channelId'] = message.channelId;
        payload[mapping.replyToId ?? 'replyToId'] = message.id;

        if (response.html) payload.html = response.html;
        if (response.media?.length) payload.media = response.media;

        try {
            const res = await fetch(outboundUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.webhookConfig.outboundHeaders,
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json().catch(() => ({}));
            return data.messageId ?? `webhook-${Date.now()}`;
        } catch (error) {
            console.error('[Webhook] Reply error:', error);
            throw error;
        }
    }

    async sendTyping(channelId: string): Promise<void> {
        // Could send typing indicator to outbound webhook if supported
        const outboundUrl = this.webhookConfig.outboundUrl;
        if (!outboundUrl) return;

        try {
            await fetch(outboundUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.webhookConfig.outboundHeaders,
                },
                body: JSON.stringify({
                    type: 'typing',
                    channelId,
                }),
            });
        } catch {
            // Ignore typing errors
        }
    }

    async handleWebhook(request: Request): Promise<Response> {
        try {
            // Verify webhook secret if configured
            const secret = this.webhookConfig.webhookSecret;
            if (secret) {
                const providedSecret = request.headers.get('x-webhook-secret') ||
                    request.headers.get('authorization')?.replace('Bearer ', '');

                if (providedSecret !== secret) {
                    return new Response('Unauthorized', { status: 401 });
                }
            }

            // Parse incoming payload
            const body = await request.json();

            // Normalize using field mappings
            const normalized = this.normalizeIncoming(body);

            if (normalized) {
                this.handleIncomingMessage(normalized);
            }

            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        } catch (error) {
            console.error('[Webhook] Handle error:', error);
            return new Response(JSON.stringify({ error: 'Invalid payload' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }
    }

    getWebhookPath(): string {
        return '/webhooks/custom';
    }

    private normalizeIncoming(body: any): NormalizedMessage | null {
        const mapping = this.webhookConfig.inboundMapping ?? {};

        // Extract values using mapping or defaults
        const getValue = (key: string, defaultPath: string) => {
            const path = (mapping as any)[key] ?? defaultPath;
            return this.getNestedValue(body, path);
        };

        const id = getValue('id', 'id') || getValue('id', 'messageId') || `${Date.now()}`;
        const text = getValue('text', 'text') || getValue('text', 'message') || getValue('text', 'content');
        const from = getValue('from', 'from') || getValue('from', 'userId') || getValue('from', 'sender');
        const fromName = getValue('fromName', 'fromName') || getValue('fromName', 'userName') || from;
        const channelId = getValue('channelId', 'channelId') || getValue('channelId', 'chatId') || from;
        const timestamp = getValue('timestamp', 'timestamp') || getValue('timestamp', 'createdAt');
        const isGroup = getValue('isGroup', 'isGroup') ?? false;

        if (!text && !body.media) {
            console.warn('[Webhook] No text or media in payload');
            return null;
        }

        return {
            id: String(id),
            channelType: 'webchat',
            channelId: String(channelId),
            from: {
                id: String(from || 'unknown'),
                displayName: String(fromName || from || 'Unknown'),
            },
            text: String(text || ''),
            media: body.media || [],
            timestamp: timestamp ? new Date(timestamp) : new Date(),
            isGroup: Boolean(isGroup),
            isMention: body.isMention ?? true,
            replyToId: body.replyToId,
            raw: body,
        };
    }

    private getNestedValue(obj: any, path: string): any {
        const keys = path.split('.');
        let value = obj;
        for (const key of keys) {
            if (value === null || value === undefined) return undefined;
            value = value[key];
        }
        return value;
    }
}

// Register adapter
registerAdapter('webchat', (config) => new WebhookAdapter(config as WebhookConfig));

export default WebhookAdapter;
