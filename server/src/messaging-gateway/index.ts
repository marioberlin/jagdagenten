/**
 * Messaging Gateway
 * 
 * Unified multi-channel messaging gateway that bridges external messaging
 * platforms (Telegram, Slack, Discord, etc.) into the LiquidOS agent ecosystem.
 * 
 * @module messaging-gateway
 */

// Types
export * from './types';

// Configuration
export {
    loadGatewayConfig,
    DEFAULT_GATEWAY_CONFIG,
    CHANNEL_CAPABILITIES,
    type GatewayConfig,
    type SessionConfig,
    type MessageConfig,
    type AgentRoutingConfig,
} from './config';

// Base Adapter
export {
    BaseChannelAdapter,
    registerAdapter,
    createAdapter,
    getRegisteredAdapters,
    type AdapterFactory,
} from './adapters/base.adapter';

// Adapters
export { TelegramAdapter } from './adapters/telegram.adapter';
export { SlackAdapter } from './adapters/slack.adapter';
export { DiscordAdapter } from './adapters/discord.adapter';
export { GoogleChatAdapter } from './adapters/google-chat.adapter';

// Gateway Service
export {
    MessagingGateway,
    InMemorySessionStore,
    createGateway,
    getGateway,
    type SessionStore,
    type AgentHandler,
} from './gateway';

// Redis Session Store
export {
    RedisSessionStore,
    createRedisSessionStore,
    type RedisSessionStoreConfig,
} from './redis-session-store';

// Identity Linking
export {
    IdentityLinkingService,
    InMemoryIdentityStore,
    createIdentityLinkingService,
    type IdentityStore,
    type IdentityMetadata,
} from './identity-linking';

// Redis Identity Store
export {
    RedisIdentityStore,
    createRedisIdentityStore,
    type RedisIdentityStoreConfig,
} from './redis-identity-store';

// Elysia Plugin
export {
    createMessagingGatewayPlugin,
    type MessagingGatewayPluginOptions,
} from './elysia-plugin';
