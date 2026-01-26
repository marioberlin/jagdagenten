/**
 * Discord Channel Adapter
 * 
 * Adapter for Discord using discord.js library.
 * Supports text channels, DMs, threads, and slash commands.
 * 
 * @see https://discord.js.org/
 */

import {
    Client,
    GatewayIntentBits,
    Partials,
    Message,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    type Interaction,
} from 'discord.js';
import { BaseChannelAdapter, registerAdapter } from './base.adapter';
import type {
    ChannelConfig,
    NormalizedMessage,
    NormalizedResponse,
} from '../types';

// ============================================================================
// Discord Adapter
// ============================================================================

export class DiscordAdapter extends BaseChannelAdapter {
    readonly channelType = 'discord' as const;
    readonly displayName = 'Discord';

    private client: Client | null = null;
    private botUserId: string | null = null;
    private botUsername: string | null = null;

    constructor(config: ChannelConfig) {
        super(config);
    }

    // ============================================================================
    // Lifecycle
    // ============================================================================

    async start(): Promise<void> {
        const token = this.config.credentials.botToken;
        if (!token) {
            throw new Error('Discord bot token is required');
        }

        this.log('info', 'Starting Discord adapter...');

        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.DirectMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMessageReactions,
            ],
            partials: [
                Partials.Channel, // Required for DMs
                Partials.Message,
                Partials.Reaction,
            ],
        });

        // Ready event
        this.client.once('ready', (c) => {
            this.botUserId = c.user.id;
            this.botUsername = c.user.username;
            this._connected = true;
            this.log('info', `Connected as ${this.botUsername}`);
            this.emitEvent('connected', '', { userId: this.botUserId, username: this.botUsername });
        });

        // Message handler
        this.client.on('messageCreate', async (message) => {
            try {
                // Ignore bot messages
                if (message.author.bot) return;

                const normalized = this.normalizeMessage(message);
                if (normalized) {
                    await this.handleIncomingMessage(normalized);
                }
            } catch (error) {
                this.log('error', 'Error handling message:', error);
            }
        });

        // Message edit handler
        this.client.on('messageUpdate', (oldMessage, newMessage) => {
            if (newMessage.partial) return;
            this.emitEvent('message_edit', newMessage.channelId, {
                messageId: newMessage.id,
                text: newMessage.content,
            });
        });

        // Message delete handler
        this.client.on('messageDelete', (message) => {
            this.emitEvent('message_delete', message.channelId, {
                messageId: message.id,
            });
        });

        // Reaction handler
        this.client.on('messageReactionAdd', (reaction, user) => {
            this.emitEvent('reaction', reaction.message.channelId, {
                messageId: reaction.message.id,
                emoji: reaction.emoji.name,
                userId: user.id,
            });
        });

        // Error handler
        this.client.on('error', (error) => {
            this.log('error', 'Discord error:', error);
            this.emitEvent('error', '', error);
        });

        // Login
        await this.client.login(token);
    }

    async stop(): Promise<void> {
        if (this.client) {
            await this.client.destroy();
            this.client = null;
        }
        this._connected = false;
        this.emitEvent('disconnected', '', {});
        this.log('info', 'Discord adapter stopped');
    }

    // ============================================================================
    // Message Handling
    // ============================================================================

    async send(channelId: string, response: NormalizedResponse): Promise<string> {
        if (!this.client) {
            throw new Error('Discord client not initialized');
        }

        const channel = await this.client.channels.fetch(channelId);
        if (!channel || !channel.isTextBased()) {
            throw new Error(`Channel ${channelId} not found or not a text channel`);
        }

        const options: Record<string, unknown> = {};

        // Handle reply
        if (response.replyTo) {
            options.reply = { messageReference: response.replyTo };
        }

        // Build content
        let content = response.text ?? '';

        // Truncate to Discord's limit
        if (content.length > 2000) {
            content = content.substring(0, 1997) + '...';
        }

        // Build components (buttons)
        const components: ActionRowBuilder<ButtonBuilder>[] = [];
        if (response.buttons && response.buttons.length > 0) {
            const row = new ActionRowBuilder<ButtonBuilder>();

            for (const btn of response.buttons) {
                const button = new ButtonBuilder()
                    .setLabel(btn.text);

                if (btn.url) {
                    button.setStyle(ButtonStyle.Link).setURL(btn.url);
                } else {
                    button.setStyle(ButtonStyle.Primary).setCustomId(btn.callback ?? btn.text);
                }

                row.addComponents(button);
            }

            components.push(row);
        }

        // Handle media
        const files: unknown[] = [];
        if (response.media && response.media.length > 0) {
            for (const media of response.media) {
                if (media.url) {
                    files.push({ attachment: media.url, name: media.filename });
                }
            }
        }

        // Send message
        const textChannel = channel as { send: (opts: unknown) => Promise<{ id: string }> };
        const sentMessage = await textChannel.send({
            content,
            components: components.length > 0 ? components : undefined,
            files: files.length > 0 ? files : undefined,
            ...options,
        });

        return sentMessage.id;
    }

    async sendTyping(channelId: string): Promise<void> {
        if (!this.client) return;

        const channel = await this.client.channels.fetch(channelId);
        if (channel && channel.isTextBased()) {
            const textChannel = channel as { sendTyping: () => Promise<void> };
            await textChannel.sendTyping();
        }
    }

    // ============================================================================
    // Message Normalization
    // ============================================================================

    private normalizeMessage(message: Message): NormalizedMessage | null {
        // Check for bot mention
        const mentionsBot = this.botUserId
            ? message.mentions.users.has(this.botUserId)
            : false;

        // Determine if group (guild channels are group-like)
        const isGroup = message.guild !== null;

        // Clean content (remove mention if replying to bot)
        let text = message.content;
        if (this.botUserId) {
            text = text.replace(new RegExp(`<@!?${this.botUserId}>`, 'g'), '').trim();
        }

        // Extract media
        const media = this.extractMedia(message);

        return {
            id: message.id,
            channelType: 'discord',
            channelId: message.channelId,
            from: {
                id: message.author.id,
                name: message.member?.displayName ?? message.author.displayName,
                handle: message.author.username,
                isBot: message.author.bot,
                avatarUrl: message.author.avatarURL() ?? undefined,
            },
            text,
            media,
            replyTo: message.reference?.messageId,
            threadId: message.thread?.id,
            isGroup,
            mentionsBot,
            timestamp: message.createdAt,
            raw: message,
        };
    }

    private extractMedia(message: Message): NormalizedMessage['media'] {
        const media: NormalizedMessage['media'] = [];

        for (const attachment of message.attachments.values()) {
            const type = this.getMediaType(attachment.contentType);
            media.push({
                type,
                url: attachment.url,
                filename: attachment.name ?? undefined,
                mimeType: attachment.contentType ?? undefined,
                size: attachment.size,
                width: attachment.width ?? undefined,
                height: attachment.height ?? undefined,
            });
        }

        return media.length > 0 ? media : undefined;
    }

    private getMediaType(contentType: string | null): import('../types').MediaType {
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
registerAdapter('discord', (config) => new DiscordAdapter(config));

export default DiscordAdapter;
