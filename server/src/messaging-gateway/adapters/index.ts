/**
 * Channel Adapters
 * 
 * Re-exports all channel adapters for convenient importing.
 */

export { BaseChannelAdapter, registerAdapter, createAdapter, getRegisteredAdapters } from './base.adapter';
export { TelegramAdapter } from './telegram.adapter';
export { SlackAdapter } from './slack.adapter';
export { DiscordAdapter } from './discord.adapter';
export { GoogleChatAdapter } from './google-chat.adapter';

// Type exports
export type { AdapterFactory } from './base.adapter';
