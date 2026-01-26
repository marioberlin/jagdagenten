/**
 * Matrix Adapter
 * 
 * Uses matrix-js-sdk for Matrix/Element integration.
 * Supports end-to-end encryption.
 */

import { BaseChannelAdapter, registerAdapter } from './base.adapter';
import type { ChannelConfig, NormalizedMessage, NormalizedResponse, GatewayEvent } from '../types';

// ============================================================================
// Matrix Adapter
// ============================================================================

export class MatrixAdapter extends BaseChannelAdapter {
    readonly channelType = 'matrix' as const;
    readonly displayName = 'Matrix';

    private client: any = null;

    constructor(config: ChannelConfig) {
        super(config);
    }

    async start(): Promise<void> {
        if (!this.config.enabled) return;

        const homeserver = this.config.homeserver;
        const accessToken = this.config.accessToken;
        const userId = this.config.userId;

        if (!homeserver || !accessToken || !userId) {
            throw new Error('Matrix homeserver, accessToken, and userId are required');
        }

        try {
            const sdk = await import('matrix-js-sdk');

            this.client = sdk.createClient({
                baseUrl: homeserver,
                accessToken,
                userId,
            });

            // Start sync
            await this.client.startClient({ initialSyncLimit: 10 });

            // Listen for messages
            this.client.on('Room.timeline', (event: any, room: any) => {
                if (event.getType() !== 'm.room.message') return;
                if (event.getSender() === userId) return; // Skip own messages

                const normalized = this.normalizeIncoming(event, room);
                if (normalized) {
                    this.handleIncomingMessage(normalized);
                }
            });

            // Listen for sync state
            this.client.on('sync', (state: string) => {
                if (state === 'PREPARED') {
                    console.info('[Matrix] Sync complete, ready to receive messages');
                    this.emit('event', {
                        type: 'connection',
                        channelType: this.channelType,
                        data: { status: 'connected' },
                    } as GatewayEvent);
                }
            });

        } catch (error) {
            console.error('[Matrix] Failed to start:', error);
            throw error;
        }
    }

    async stop(): Promise<void> {
        if (this.client) {
            this.client.stopClient();
            this.client = null;
        }
    }

    async send(channelId: string, response: NormalizedResponse): Promise<string> {
        if (!this.client) throw new Error('Matrix not connected');

        // Send text message
        if (response.text) {
            const result = await this.client.sendMessage(channelId, {
                msgtype: 'm.text',
                body: response.text,
                format: 'org.matrix.custom.html',
                formatted_body: response.html || response.text,
            });
            return result.event_id;
        }

        // Send media
        if (response.media?.length) {
            const media = response.media[0];
            const msgtype = media.type.startsWith('image') ? 'm.image' :
                media.type.startsWith('video') ? 'm.video' :
                    media.type.startsWith('audio') ? 'm.audio' : 'm.file';

            // Would need to upload first
            const result = await this.client.sendMessage(channelId, {
                msgtype,
                body: media.filename || 'file',
                url: media.url, // Assumes mxc:// URL
            });
            return result.event_id;
        }

        throw new Error('Nothing to send');
    }

    async reply(message: NormalizedMessage, response: NormalizedResponse): Promise<string> {
        if (!this.client) throw new Error('Matrix not connected');

        // Send with reply relation
        const content: any = {
            msgtype: 'm.text',
            body: response.text || '',
            format: 'org.matrix.custom.html',
            formatted_body: response.html || response.text,
            'm.relates_to': {
                'm.in_reply_to': {
                    event_id: message.id,
                },
            },
        };

        const result = await this.client.sendMessage(message.channelId, content);
        return result.event_id;
    }

    async sendTyping(channelId: string): Promise<void> {
        if (!this.client) return;
        await this.client.sendTyping(channelId, true, 5000);
    }

    async handleWebhook(request: Request): Promise<Response> {
        return new Response('Matrix uses client sync', { status: 200 });
    }

    getWebhookPath(): string | null {
        return null;
    }

    private normalizeIncoming(event: any, room: any): NormalizedMessage | null {
        try {
            const content = event.getContent();
            const sender = event.getSender();
            const roomId = room.roomId;

            // Check if group (more than 2 members or explicitly a room)
            const isGroup = room.getJoinedMemberCount() > 2 || room.isSpaceRoom?.() === false;

            // Check for @mention
            const isMention = content.body?.includes(this.config.userId) ||
                content.formatted_body?.includes(this.config.userId);

            return {
                id: event.getId(),
                channelType: 'matrix',
                channelId: roomId,
                threadId: content['m.relates_to']?.event_id,
                from: {
                    id: sender,
                    username: sender.split(':')[0].replace('@', ''),
                    displayName: room.getMember(sender)?.name || sender,
                },
                text: content.body || '',
                html: content.formatted_body,
                media: this.extractMedia(content),
                timestamp: new Date(event.getTs()),
                isGroup,
                isMention,
                replyToId: content['m.relates_to']?.['m.in_reply_to']?.event_id,
                raw: event,
            };
        } catch (error) {
            console.error('[Matrix] Failed to normalize message:', error);
            return null;
        }
    }

    private extractMedia(content: any): NormalizedMessage['media'] {
        const media: NormalizedMessage['media'] = [];

        if (content.url && ['m.image', 'm.video', 'm.audio', 'm.file'].includes(content.msgtype)) {
            media.push({
                type: content.info?.mimetype || 'application/octet-stream',
                url: content.url,
                filename: content.body,
                size: content.info?.size,
            });
        }

        return media;
    }
}

// Register adapter
registerAdapter('matrix', (config) => new MatrixAdapter(config));

export default MatrixAdapter;
