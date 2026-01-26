/**
 * Google Chat Adapter
 * 
 * Adapter for Google Chat using the Google Chat API.
 * Supports spaces (rooms), DMs, and interactive cards.
 * 
 * @see https://developers.google.com/chat/api
 */

import { google, chat_v1 } from 'googleapis';
import { BaseChannelAdapter, registerAdapter } from './base.adapter';
import type {
    ChannelConfig,
    NormalizedMessage,
    NormalizedResponse,
} from '../types';

// ============================================================================
// Google Chat Adapter
// ============================================================================

export class GoogleChatAdapter extends BaseChannelAdapter {
    readonly channelType = 'webchat' as const; // Using 'webchat' as closest type
    readonly displayName = 'Google Chat';

    private chatClient: chat_v1.Chat | null = null;
    private botName: string | null = null;
    private projectId: string | null = null;

    constructor(config: ChannelConfig) {
        super(config);
    }

    // ============================================================================
    // Lifecycle
    // ============================================================================

    async start(): Promise<void> {
        const serviceAccountJson = this.config.credentials.serviceAccountJson;
        this.projectId = this.config.credentials.projectId;

        if (!serviceAccountJson) {
            throw new Error('Google Chat service account JSON is required');
        }

        this.log('info', 'Starting Google Chat adapter...');

        try {
            // Parse service account credentials
            const credentials = JSON.parse(serviceAccountJson);

            // Create JWT auth client
            const auth = new google.auth.GoogleAuth({
                credentials,
                scopes: [
                    'https://www.googleapis.com/auth/chat.bot',
                    'https://www.googleapis.com/auth/chat.messages',
                    'https://www.googleapis.com/auth/chat.spaces',
                ],
            });

            // Initialize Chat client
            this.chatClient = google.chat({ version: 'v1', auth });

            // Verify connection by listing spaces (if we have permission)
            try {
                const spaces = await this.chatClient.spaces.list({ pageSize: 1 });
                this.log('info', `Connected to Google Chat, found ${spaces.data.spaces?.length ?? 0} spaces`);
            } catch {
                this.log('warn', 'Could not list spaces - may need webhook events instead');
            }

            this.botName = credentials.client_email?.split('@')[0] ?? 'google-chat-bot';
            this._connected = true;
            this.emitEvent('connected', '', { botName: this.botName });

        } catch (error) {
            this.log('error', 'Failed to initialize Google Chat:', error);
            throw error;
        }
    }

    async stop(): Promise<void> {
        this.chatClient = null;
        this._connected = false;
        this.emitEvent('disconnected', '', {});
        this.log('info', 'Google Chat adapter stopped');
    }

    // ============================================================================
    // Message Handling
    // ============================================================================

    async send(channelId: string, response: NormalizedResponse): Promise<string> {
        if (!this.chatClient) {
            throw new Error('Google Chat client not initialized');
        }

        // Build the message
        const message: chat_v1.Schema$Message = {};

        if (response.text) {
            message.text = response.text;
        }

        // Build interactive cards if buttons are present
        if (response.buttons && response.buttons.length > 0) {
            message.cardsV2 = [{
                cardId: 'action-card',
                card: {
                    sections: [{
                        widgets: [{
                            buttonList: {
                                buttons: response.buttons.map((btn) => ({
                                    text: btn.text,
                                    onClick: btn.url
                                        ? { openLink: { url: btn.url } }
                                        : { action: { function: btn.callback ?? btn.text } },
                                })),
                            },
                        }],
                    }],
                },
            }];
        }

        // Handle thread reply
        if (response.replyTo) {
            message.thread = { name: response.replyTo };
            message.threadReply = true;
        }

        // Send message
        const result = await this.chatClient.spaces.messages.create({
            parent: channelId, // spaces/{spaceId}
            requestBody: message,
        });

        return result.data.name ?? '';
    }

    async sendTyping(_channelId: string): Promise<void> {
        // Google Chat doesn't have a typing indicator API
    }

    // ============================================================================
    // Webhook Support
    // ============================================================================

    getWebhookPath(): string {
        return '/webhook/google-chat';
    }

    async handleWebhook(request: Request): Promise<Response> {
        try {
            const event = await request.json() as GoogleChatEvent;

            // Verify the request is from Google (in production, validate the Bearer token)

            if (event.type === 'MESSAGE') {
                const normalized = this.normalizeWebhookMessage(event);
                if (normalized) {
                    await this.handleIncomingMessage(normalized);
                }
            } else if (event.type === 'CARD_CLICKED') {
                // Handle card button clicks
                this.emitEvent('reaction', event.space?.name ?? '', {
                    action: event.action?.actionMethodName,
                    parameters: event.action?.parameters,
                });
            }

            // Google Chat expects a response message
            return new Response(JSON.stringify({ text: '' }), {
                headers: { 'Content-Type': 'application/json' },
            });

        } catch (error) {
            this.log('error', 'Webhook error:', error);
            return new Response('Error', { status: 500 });
        }
    }

    // ============================================================================
    // Message Normalization
    // ============================================================================

    private normalizeWebhookMessage(event: GoogleChatEvent): NormalizedMessage | null {
        if (!event.message || !event.user) return null;

        const message = event.message;
        const user = event.user;
        const space = event.space;

        // Check if bot was mentioned
        const mentionsBot = message.annotations?.some(
            (a) => a.type === 'USER_MENTION' && a.userMention?.type === 'BOT'
        ) ?? false;

        // Determine if group (SPACE = room, DM = direct)
        const isGroup = space?.type === 'ROOM' || space?.type === 'SPACE';

        // Clean text (remove @mentions)
        let text = message.text ?? '';
        if (message.annotations) {
            for (const annotation of message.annotations) {
                if (annotation.type === 'USER_MENTION' && annotation.startIndex !== undefined) {
                    // Remove the mention from text
                    const start = annotation.startIndex;
                    const length = annotation.length ?? 0;
                    text = text.substring(0, start) + text.substring(start + length);
                }
            }
        }
        text = text.trim();

        return {
            id: message.name ?? '',
            channelType: 'webchat', // Using webchat as closest type
            channelId: space?.name ?? '',
            from: {
                id: user.name ?? '',
                name: user.displayName ?? 'Unknown',
                handle: user.email,
                isBot: user.type === 'BOT',
                avatarUrl: user.avatarUrl,
            },
            text,
            media: this.extractMedia(message),
            replyTo: message.thread?.name,
            threadId: message.thread?.name,
            isGroup,
            mentionsBot,
            timestamp: new Date(message.createTime ?? Date.now()),
            raw: event,
        };
    }

    private extractMedia(message: GoogleChatMessage): NormalizedMessage['media'] {
        if (!message.attachment || message.attachment.length === 0) return undefined;

        return message.attachment.map((att) => ({
            type: this.getMediaType(att.contentType),
            url: att.downloadUri ?? att.driveDataRef?.driveFileId,
            filename: att.contentName,
            mimeType: att.contentType,
        }));
    }

    private getMediaType(contentType?: string | null): import('../types').MediaType {
        if (!contentType) return 'document';
        if (contentType.startsWith('image/')) return 'image';
        if (contentType.startsWith('video/')) return 'video';
        if (contentType.startsWith('audio/')) return 'audio';
        return 'document';
    }

    // ============================================================================
    // Configuration
    // ============================================================================

    validateConfig(): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!this.config.credentials.serviceAccountJson) {
            errors.push('Missing required credential: serviceAccountJson');
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    getRequiredCredentials(): string[] {
        return ['serviceAccountJson'];
    }
}

// ============================================================================
// Google Chat Webhook Types
// ============================================================================

interface GoogleChatEvent {
    type: 'MESSAGE' | 'ADDED_TO_SPACE' | 'REMOVED_FROM_SPACE' | 'CARD_CLICKED';
    eventTime?: string;
    message?: GoogleChatMessage;
    user?: {
        name?: string;
        displayName?: string;
        email?: string;
        avatarUrl?: string;
        type?: 'HUMAN' | 'BOT';
    };
    space?: {
        name?: string;
        type?: 'ROOM' | 'DM' | 'SPACE';
        displayName?: string;
    };
    action?: {
        actionMethodName?: string;
        parameters?: Array<{ key: string; value: string }>;
    };
}

interface GoogleChatMessage {
    name?: string;
    text?: string;
    createTime?: string;
    thread?: { name?: string };
    annotations?: Array<{
        type: string;
        startIndex?: number;
        length?: number;
        userMention?: { type?: string };
    }>;
    attachment?: Array<{
        name?: string;
        contentName?: string;
        contentType?: string | null;
        downloadUri?: string;
        driveDataRef?: { driveFileId?: string };
    }>;
}

// Register adapter (using 'webchat' type as Google Chat doesn't have dedicated type)
// In production, you'd add 'googlechat' to ChannelType
registerAdapter('webchat', (config) => new GoogleChatAdapter(config));

export default GoogleChatAdapter;
