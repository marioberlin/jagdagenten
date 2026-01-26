/**
 * WhatsApp Adapter
 * 
 * Uses Baileys (WhatsApp Web API) for WhatsApp integration.
 * Supports personal and business accounts.
 */

import { EventEmitter } from 'events';
import { BaseChannelAdapter, registerAdapter } from './base.adapter';
import type { ChannelConfig, NormalizedMessage, NormalizedResponse, GatewayEvent } from '../types';

// ============================================================================
// WhatsApp Adapter
// ============================================================================

export class WhatsAppAdapter extends BaseChannelAdapter {
    readonly channelType = 'whatsapp' as const;
    readonly displayName = 'WhatsApp';

    private socket: any = null;
    private authState: any = null;

    constructor(config: ChannelConfig) {
        super(config);
    }

    async start(): Promise<void> {
        if (!this.config.enabled) return;

        try {
            // Dynamic import to avoid bundling if not used
            const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = await import('@whiskeysockets/baileys');
            const { Boom } = await import('@hapi/boom');

            // Load auth state
            const authDir = this.config.authDir ?? './whatsapp-auth';
            const { state, saveCreds } = await useMultiFileAuthState(authDir);
            this.authState = state;

            // Create socket
            this.socket = makeWASocket({
                auth: state,
                printQRInTerminal: true,
            });

            // Handle connection updates
            this.socket.ev.on('connection.update', async (update: any) => {
                const { connection, lastDisconnect, qr } = update;

                if (qr) {
                    this.emit('event', {
                        type: 'connection',
                        channelType: this.channelType,
                        data: { status: 'qr_code', qr },
                    } as GatewayEvent);
                }

                if (connection === 'close') {
                    const reason = (lastDisconnect?.error as any)?.output?.statusCode;
                    const shouldReconnect = reason !== DisconnectReason.loggedOut;

                    if (shouldReconnect) {
                        console.warn('[WhatsApp] Connection closed, reconnecting...');
                        await this.start();
                    } else {
                        console.info('[WhatsApp] Logged out');
                    }
                }

                if (connection === 'open') {
                    console.info('[WhatsApp] Connected successfully');
                    this.emit('event', {
                        type: 'connection',
                        channelType: this.channelType,
                        data: { status: 'connected' },
                    } as GatewayEvent);
                }
            });

            // Save credentials
            this.socket.ev.on('creds.update', saveCreds);

            // Handle messages
            this.socket.ev.on('messages.upsert', async (m: any) => {
                for (const msg of m.messages) {
                    if (msg.key.fromMe) continue; // Skip own messages

                    const normalized = this.normalizeIncoming(msg);
                    if (normalized) {
                        this.handleIncomingMessage(normalized);
                    }
                }
            });

        } catch (error) {
            console.error('[WhatsApp] Failed to start:', error);
            throw error;
        }
    }

    async stop(): Promise<void> {
        if (this.socket) {
            await this.socket.logout();
            this.socket = null;
        }
    }

    async send(channelId: string, response: NormalizedResponse): Promise<string> {
        if (!this.socket) throw new Error('WhatsApp not connected');

        const jid = channelId.includes('@') ? channelId : `${channelId}@s.whatsapp.net`;

        // Send text
        if (response.text) {
            const result = await this.socket.sendMessage(jid, { text: response.text });
            return result.key.id;
        }

        // Send media
        if (response.media?.length) {
            const media = response.media[0];
            const mediaType = media.type.startsWith('image') ? 'image' :
                media.type.startsWith('video') ? 'video' :
                    media.type.startsWith('audio') ? 'audio' : 'document';

            const result = await this.socket.sendMessage(jid, {
                [mediaType]: { url: media.url },
                caption: response.text,
            });
            return result.key.id;
        }

        throw new Error('Nothing to send');
    }

    async reply(message: NormalizedMessage, response: NormalizedResponse): Promise<string> {
        return this.send(message.channelId, response);
    }

    async sendTyping(channelId: string): Promise<void> {
        if (!this.socket) return;
        const jid = channelId.includes('@') ? channelId : `${channelId}@s.whatsapp.net`;
        await this.socket.sendPresenceUpdate('composing', jid);
    }

    async handleWebhook(request: Request): Promise<Response> {
        // WhatsApp uses WebSocket, not webhooks for Baileys
        return new Response('WhatsApp uses WebSocket connection', { status: 200 });
    }

    getWebhookPath(): string | null {
        return null; // No webhook needed
    }

    private normalizeIncoming(msg: any): NormalizedMessage | null {
        try {
            const key = msg.key;
            const chat = key.remoteJid;
            const isGroup = chat?.endsWith('@g.us');

            // Extract text
            let text = msg.message?.conversation ||
                msg.message?.extendedTextMessage?.text ||
                msg.message?.imageMessage?.caption ||
                msg.message?.videoMessage?.caption || '';

            // Extract sender
            const senderId = isGroup ? key.participant : chat;
            const pushName = msg.pushName || 'Unknown';

            return {
                id: key.id,
                channelType: 'whatsapp',
                channelId: chat,
                threadId: undefined,
                from: {
                    id: senderId?.replace('@s.whatsapp.net', '') || 'unknown',
                    username: undefined,
                    displayName: pushName,
                },
                text,
                media: this.extractMedia(msg),
                timestamp: new Date(msg.messageTimestamp * 1000),
                isGroup,
                isMention: text.includes(`@${this.socket?.user?.id?.split(':')[0]}`),
                replyToId: msg.message?.extendedTextMessage?.contextInfo?.stanzaId,
                raw: msg,
            };
        } catch (error) {
            console.error('[WhatsApp] Failed to normalize message:', error);
            return null;
        }
    }

    private extractMedia(msg: any): NormalizedMessage['media'] {
        const media: NormalizedMessage['media'] = [];

        const types = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'];

        for (const type of types) {
            const m = msg.message?.[type];
            if (m) {
                media.push({
                    type: m.mimetype || 'application/octet-stream',
                    url: '', // Would need to download
                    filename: m.fileName,
                    size: m.fileLength,
                });
            }
        }

        return media;
    }
}

// Register adapter
registerAdapter('whatsapp', (config) => new WhatsAppAdapter(config));

export default WhatsAppAdapter;
