/**
 * Telegram Channel Adapter
 * 
 * Adapter for Telegram using the grammY library.
 * Supports both polling and webhook modes.
 * 
 * @see https://grammy.dev/
 */

import { Bot, Context, session, type Api } from 'grammy';
import { BaseChannelAdapter, registerAdapter } from './base.adapter';
import type {
    ChannelConfig,
    NormalizedMessage,
    NormalizedResponse,
    MediaType,
} from '../types';

// ============================================================================
// Telegram Adapter
// ============================================================================

export class TelegramAdapter extends BaseChannelAdapter {
    readonly channelType = 'telegram' as const;
    readonly displayName = 'Telegram';

    private bot: Bot | null = null;
    private botInfo: { id: number; username: string } | null = null;

    constructor(config: ChannelConfig) {
        super(config);
    }

    // ============================================================================
    // Lifecycle
    // ============================================================================

    async start(): Promise<void> {
        const token = this.config.credentials.botToken;
        if (!token) {
            throw new Error('Telegram bot token is required');
        }

        this.log('info', 'Starting Telegram adapter...');

        this.bot = new Bot(token);

        // Get bot info
        const me = await this.bot.api.getMe();
        this.botInfo = { id: me.id, username: me.username ?? 'bot' };
        this.log('info', `Connected as @${this.botInfo.username}`);

        // Set up message handler
        this.bot.on('message', async (ctx) => {
            try {
                const normalized = this.normalizeMessage(ctx);
                if (normalized) {
                    await this.handleIncomingMessage(normalized);
                }
            } catch (error) {
                this.log('error', 'Error handling message:', error);
            }
        });

        // Handle edited messages
        this.bot.on('edited_message', (ctx) => {
            if (ctx.editedMessage) {
                this.emitEvent('message_edit', String(ctx.editedMessage.chat.id), {
                    messageId: ctx.editedMessage.message_id,
                    text: ctx.editedMessage.text,
                });
            }
        });

        // Error handler
        this.bot.catch((err) => {
            this.log('error', 'Bot error:', err);
            this.emitEvent('error', '', err);
        });

        // Start polling or webhook based on config
        if (this.config.webhookUrl) {
            // Webhook mode will be handled by external endpoint
            this.log('info', 'Webhook mode - call handleWebhook for updates');
        } else {
            // Polling mode
            this.bot.start({
                onStart: () => {
                    this._connected = true;
                    this.emitEvent('connected', '', { username: this.botInfo?.username });
                },
            });
        }

        this._connected = true;
    }

    async stop(): Promise<void> {
        if (this.bot) {
            await this.bot.stop();
            this.bot = null;
        }
        this._connected = false;
        this.emitEvent('disconnected', '', {});
        this.log('info', 'Telegram adapter stopped');
    }

    // ============================================================================
    // Message Handling
    // ============================================================================

    async send(channelId: string, response: NormalizedResponse): Promise<string> {
        if (!this.bot) {
            throw new Error('Telegram bot not initialized');
        }

        const chatId = Number(channelId);
        const options: Record<string, unknown> = {};

        // Set reply
        if (response.replyTo) {
            options.reply_to_message_id = Number(response.replyTo);
        }

        // Set parse mode
        if (response.parseMode === 'html') {
            options.parse_mode = 'HTML';
        } else if (response.parseMode === 'markdown' || !response.parseMode) {
            options.parse_mode = 'MarkdownV2';
        }

        // Send text or media
        let sentMessage: { message_id: number };

        if (response.media && response.media.length > 0) {
            const media = response.media[0];

            if (media.type === 'image' && media.url) {
                sentMessage = await this.bot.api.sendPhoto(chatId, media.url, {
                    caption: response.text,
                    ...options,
                });
            } else if (media.type === 'document' && media.url) {
                sentMessage = await this.bot.api.sendDocument(chatId, media.url, {
                    caption: response.text,
                    ...options,
                });
            } else if (media.type === 'audio' && media.url) {
                sentMessage = await this.bot.api.sendAudio(chatId, media.url, {
                    caption: response.text,
                    ...options,
                });
            } else if (media.type === 'video' && media.url) {
                sentMessage = await this.bot.api.sendVideo(chatId, media.url, {
                    caption: response.text,
                    ...options,
                });
            } else if (media.type === 'voice' && media.url) {
                sentMessage = await this.bot.api.sendVoice(chatId, media.url, {
                    caption: response.text,
                    ...options,
                });
            } else {
                sentMessage = await this.bot.api.sendMessage(chatId, response.text ?? '', options);
            }
        } else if (response.buttons && response.buttons.length > 0) {
            // Send with inline keyboard
            const keyboard = {
                inline_keyboard: response.buttons.map((btn) => [{
                    text: btn.text,
                    callback_data: btn.callback,
                    url: btn.url,
                }]),
            };
            sentMessage = await this.bot.api.sendMessage(chatId, response.text ?? '', {
                ...options,
                reply_markup: keyboard,
            });
        } else {
            sentMessage = await this.bot.api.sendMessage(chatId, response.text ?? '', options);
        }

        return String(sentMessage.message_id);
    }

    async sendTyping(channelId: string): Promise<void> {
        if (!this.bot) return;
        await this.bot.api.sendChatAction(Number(channelId), 'typing');
    }

    // ============================================================================
    // Webhook Support
    // ============================================================================

    getWebhookPath(): string {
        return `/webhook/telegram/${this.config.credentials.botToken?.slice(-8) ?? 'default'}`;
    }

    async handleWebhook(request: Request): Promise<Response> {
        if (!this.bot) {
            return new Response('Bot not initialized', { status: 500 });
        }

        try {
            const update = await request.json();
            await this.bot.handleUpdate(update);
            return new Response('OK', { status: 200 });
        } catch (error) {
            this.log('error', 'Webhook error:', error);
            return new Response('Error', { status: 500 });
        }
    }

    // ============================================================================
    // Message Normalization
    // ============================================================================

    private normalizeMessage(ctx: Context): NormalizedMessage | null {
        const msg = ctx.message;
        if (!msg) return null;

        const from = msg.from;
        if (!from) return null;

        const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup';

        // Check for @mentions
        const botUsername = this.botInfo?.username ?? '';
        const text = msg.text ?? msg.caption ?? '';
        const mentionsBot = text.toLowerCase().includes(`@${botUsername.toLowerCase()}`);

        // Extract media
        const media = this.extractMedia(msg);

        return {
            id: String(msg.message_id),
            channelType: 'telegram',
            channelId: String(msg.chat.id),
            from: {
                id: String(from.id),
                name: [from.first_name, from.last_name].filter(Boolean).join(' '),
                handle: from.username,
                isBot: from.is_bot,
            },
            text,
            media,
            replyTo: msg.reply_to_message ? String(msg.reply_to_message.message_id) : undefined,
            threadId: msg.message_thread_id ? String(msg.message_thread_id) : undefined,
            isGroup,
            mentionsBot,
            timestamp: new Date(msg.date * 1000),
            raw: msg,
        };
    }

    private extractMedia(msg: NonNullable<Context['message']>): NormalizedMessage['media'] {
        const media: NormalizedMessage['media'] = [];

        if (msg.photo && msg.photo.length > 0) {
            const largest = msg.photo[msg.photo.length - 1];
            media.push({
                type: 'image',
                width: largest.width,
                height: largest.height,
                size: largest.file_size,
            });
        }

        if (msg.document) {
            media.push({
                type: 'document',
                filename: msg.document.file_name,
                mimeType: msg.document.mime_type,
                size: msg.document.file_size,
            });
        }

        if (msg.audio) {
            media.push({
                type: 'audio',
                duration: msg.audio.duration,
                mimeType: msg.audio.mime_type,
                size: msg.audio.file_size,
            });
        }

        if (msg.video) {
            media.push({
                type: 'video',
                width: msg.video.width,
                height: msg.video.height,
                duration: msg.video.duration,
                mimeType: msg.video.mime_type,
                size: msg.video.file_size,
            });
        }

        if (msg.voice) {
            media.push({
                type: 'voice',
                duration: msg.voice.duration,
                mimeType: msg.voice.mime_type,
                size: msg.voice.file_size,
            });
        }

        if (msg.sticker) {
            media.push({
                type: 'sticker',
                width: msg.sticker.width,
                height: msg.sticker.height,
            });
        }

        return media.length > 0 ? media : undefined;
    }

    // ============================================================================
    // Configuration
    // ============================================================================

    validateConfig(): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!this.config.credentials.botToken) {
            errors.push('Missing required credential: botToken');
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    getRequiredCredentials(): string[] {
        return ['botToken'];
    }
}

// Register adapter
registerAdapter('telegram', (config) => new TelegramAdapter(config));

export default TelegramAdapter;
