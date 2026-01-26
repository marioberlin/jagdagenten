/**
 * Messaging Gateway Service
 * 
 * Central orchestrator for all messaging channel adapters.
 * Routes messages to agents and delivers responses.
 */

import { EventEmitter } from 'events';
import type {
    ChannelType,
    ChannelConfig,
    NormalizedMessage,
    NormalizedResponse,
    GatewaySession,
    GatewayEvent,
    IdentityLink,
    MessageContext,
} from './types';
import { BaseChannelAdapter, createAdapter, getRegisteredAdapters } from './adapters/base.adapter';
import { loadGatewayConfig, type GatewayConfig } from './config';

// Import adapters to register them
import './adapters/telegram.adapter';
import './adapters/slack.adapter';
import './adapters/discord.adapter';
import './adapters/google-chat.adapter';

// ============================================================================
// Session Store Interface
// ============================================================================

export interface SessionStore {
    get(key: string): Promise<GatewaySession | null>;
    set(key: string, session: GatewaySession): Promise<void>;
    delete(key: string): Promise<void>;
    list(filter?: { channelType?: ChannelType; userId?: string }): Promise<GatewaySession[]>;
}

// ============================================================================
// In-Memory Session Store (default)
// ============================================================================

export class InMemorySessionStore implements SessionStore {
    private sessions = new Map<string, GatewaySession>();

    async get(key: string): Promise<GatewaySession | null> {
        return this.sessions.get(key) ?? null;
    }

    async set(key: string, session: GatewaySession): Promise<void> {
        this.sessions.set(key, session);
    }

    async delete(key: string): Promise<void> {
        this.sessions.delete(key);
    }

    async list(filter?: { channelType?: ChannelType; userId?: string }): Promise<GatewaySession[]> {
        let sessions = Array.from(this.sessions.values());

        if (filter?.channelType) {
            sessions = sessions.filter(s => s.channelType === filter.channelType);
        }
        if (filter?.userId) {
            sessions = sessions.filter(s => s.userId === filter.userId);
        }

        return sessions;
    }
}

// ============================================================================
// Agent Handler Interface
// ============================================================================

export type AgentHandler = (context: MessageContext) => Promise<NormalizedResponse | null>;

// ============================================================================
// Messaging Gateway
// ============================================================================

export class MessagingGateway extends EventEmitter {
    private config: GatewayConfig;
    private adapters = new Map<ChannelType, BaseChannelAdapter>();
    private sessionStore: SessionStore;
    private identityLinks = new Map<string, IdentityLink>();
    private agentHandler: AgentHandler | null = null;

    constructor(config?: Partial<GatewayConfig>, sessionStore?: SessionStore) {
        super();
        this.config = loadGatewayConfig(config);
        this.sessionStore = sessionStore ?? new InMemorySessionStore();

        // Load identity links from config
        if (this.config.session.identityLinks) {
            for (const [canonicalId, linkedIds] of Object.entries(this.config.session.identityLinks)) {
                this.identityLinks.set(canonicalId, {
                    canonicalId,
                    linkedIds: linkedIds.map(id => {
                        const [channelType, platformId] = id.split(':');
                        return { channelType: channelType as ChannelType, platformId };
                    }),
                });
            }
        }
    }

    // ============================================================================
    // Lifecycle
    // ============================================================================

    async start(): Promise<void> {
        console.info('[Gateway] Starting messaging gateway...');

        // Initialize enabled adapters
        for (const [type, channelConfig] of Object.entries(this.config.channels)) {
            if (!channelConfig?.enabled) continue;

            try {
                const adapter = createAdapter(type as ChannelType, channelConfig);

                // Set up event forwarding
                adapter.on('event', (event: GatewayEvent) => {
                    this.emit('event', event);
                });

                // Set up message handler
                adapter.onMessage(async (message) => {
                    await this.handleMessage(adapter, message);
                });

                await adapter.start();
                this.adapters.set(type as ChannelType, adapter);
                console.info(`[Gateway] Started ${adapter.displayName} adapter`);

            } catch (error) {
                console.error(`[Gateway] Failed to start ${type} adapter:`, error);
            }
        }

        console.info(`[Gateway] Started with ${this.adapters.size} adapters`);
        this.emit('started', { adapters: Array.from(this.adapters.keys()) });
    }

    async stop(): Promise<void> {
        console.info('[Gateway] Stopping messaging gateway...');

        for (const [type, adapter] of this.adapters) {
            try {
                await adapter.stop();
                console.info(`[Gateway] Stopped ${type} adapter`);
            } catch (error) {
                console.error(`[Gateway] Error stopping ${type} adapter:`, error);
            }
        }

        this.adapters.clear();
        this.emit('stopped', {});
    }

    // ============================================================================
    // Agent Handler
    // ============================================================================

    onAgent(handler: AgentHandler): void {
        this.agentHandler = handler;
    }

    // ============================================================================
    // Message Handling
    // ============================================================================

    private async handleMessage(adapter: BaseChannelAdapter, message: NormalizedMessage): Promise<void> {
        try {
            // Get or create session
            const session = await this.getOrCreateSession(message);

            // Resolve identity link
            const identityLink = this.resolveIdentity(message);

            // Build context
            const context: MessageContext = {
                message,
                session,
                identityLink,
                replyTo: async (response) => {
                    return adapter.reply(message, response);
                },
                sendTyping: async () => {
                    await adapter.sendTyping(message.channelId);
                },
            };

            // Update session activity
            session.lastActiveAt = new Date();
            await this.sessionStore.set(this.getSessionKey(message), session);

            // Emit message event
            this.emit('message', context);

            // Route to agent handler
            if (this.agentHandler) {
                // Show typing indicator
                await context.sendTyping();

                // Get response
                const response = await this.agentHandler(context);

                if (response) {
                    await context.replyTo(response);
                }
            }

        } catch (error) {
            console.error('[Gateway] Error handling message:', error);
            this.emit('error', { message, error });
        }
    }

    // ============================================================================
    // Session Management
    // ============================================================================

    private getSessionKey(message: NormalizedMessage): string {
        // Resolve identity first
        const identity = this.resolveIdentity(message);
        const userId = identity?.canonicalId ?? message.from.id;

        if (message.isGroup) {
            const threadKey = message.threadId ? `:thread:${message.threadId}` : '';
            return `${message.channelType}:group:${message.channelId}${threadKey}`;
        }

        // DM scope handling
        switch (this.config.session.dmScope) {
            case 'main':
                return `dm:main:${userId}`;
            case 'per-peer':
                return `dm:${userId}`;
            case 'per-channel-peer':
                return `${message.channelType}:dm:${userId}`;
            default:
                return `dm:${userId}`;
        }
    }

    private async getOrCreateSession(message: NormalizedMessage): Promise<GatewaySession> {
        const key = this.getSessionKey(message);

        let session = await this.sessionStore.get(key);

        if (session) {
            // Check if session needs reset
            if (this.shouldResetSession(session, message)) {
                session = null;
            }
        }

        if (!session) {
            session = {
                id: `session-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                channelType: message.channelType,
                channelId: message.channelId,
                userId: message.from.id,
                isGroup: message.isGroup,
                activationMode: message.isGroup
                    ? (this.config.messages.groupChat.defaultActivation as 'mention' | 'always' | 'never')
                    : 'always',
                thinkingLevel: 'medium',
                inputTokens: 0,
                outputTokens: 0,
                contextTokens: 0,
                createdAt: new Date(),
                lastActiveAt: new Date(),
            };

            await this.sessionStore.set(key, session);
        }

        return session;
    }

    private shouldResetSession(session: GatewaySession, message: NormalizedMessage): boolean {
        const resetConfig = this.config.session.reset;

        // Check for reset triggers in message
        const text = message.text?.toLowerCase() ?? '';
        for (const trigger of this.config.session.resetTriggers) {
            if (text.startsWith(trigger.toLowerCase())) {
                return true;
            }
        }

        // Check daily reset
        if (resetConfig.mode === 'daily') {
            const resetHour = resetConfig.atHour ?? 4;
            const now = new Date();
            const lastActive = new Date(session.lastActiveAt);

            // Check if we crossed the reset hour
            const todayResetTime = new Date(now);
            todayResetTime.setHours(resetHour, 0, 0, 0);

            if (now >= todayResetTime && lastActive < todayResetTime) {
                return true;
            }
        }

        // Check idle reset
        if (resetConfig.mode === 'idle' && resetConfig.idleMinutes) {
            const idleMs = resetConfig.idleMinutes * 60 * 1000;
            const elapsed = Date.now() - new Date(session.lastActiveAt).getTime();
            if (elapsed > idleMs) {
                return true;
            }
        }

        return false;
    }

    // ============================================================================
    // Identity Resolution
    // ============================================================================

    private resolveIdentity(message: NormalizedMessage): IdentityLink | undefined {
        const platformKey = `${message.channelType}:${message.from.id}`;

        for (const link of this.identityLinks.values()) {
            const match = link.linkedIds.find(
                id => `${id.channelType}:${id.platformId}` === platformKey
            );
            if (match) {
                return link;
            }
        }

        return undefined;
    }

    // ============================================================================
    // Public API
    // ============================================================================

    getAdapter(type: ChannelType): BaseChannelAdapter | undefined {
        return this.adapters.get(type);
    }

    getActiveAdapters(): ChannelType[] {
        return Array.from(this.adapters.keys());
    }

    getAvailableAdapters(): ChannelType[] {
        return getRegisteredAdapters();
    }

    async sendMessage(channelType: ChannelType, channelId: string, response: NormalizedResponse): Promise<string> {
        const adapter = this.adapters.get(channelType);
        if (!adapter) {
            throw new Error(`Adapter ${channelType} not active`);
        }
        return adapter.send(channelId, response);
    }

    async getSessions(filter?: { channelType?: ChannelType; userId?: string }): Promise<GatewaySession[]> {
        return this.sessionStore.list(filter);
    }

    getConfig(): GatewayConfig {
        return this.config;
    }

    // ============================================================================
    // Webhook Handler
    // ============================================================================

    async handleWebhook(channelType: ChannelType, request: Request): Promise<Response> {
        const adapter = this.adapters.get(channelType);
        if (!adapter) {
            return new Response(`Adapter ${channelType} not active`, { status: 404 });
        }
        return adapter.handleWebhook(request);
    }

    getWebhookPaths(): Map<ChannelType, string | null> {
        const paths = new Map<ChannelType, string | null>();
        for (const [type, adapter] of this.adapters) {
            paths.set(type, adapter.getWebhookPath());
        }
        return paths;
    }

    // ============================================================================
    // Public Session Management
    // ============================================================================

    /**
     * Get or create a session for a message (public wrapper)
     */
    async getOrCreateSession(message: NormalizedMessage): Promise<GatewaySession> {
        const key = this.getSessionKey(message);

        let session = await this.sessionStore.get(key);

        if (session) {
            if (this.shouldResetSession(session, message)) {
                session = null;
            }
        }

        if (!session) {
            session = {
                id: `session-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                channelType: message.channelType,
                channelId: message.channelId,
                senderId: message.from.id,
                userId: message.from.id,
                isGroup: message.isGroup,
                activationMode: message.isGroup
                    ? (this.config.messages.groupChat.defaultActivation as 'mention' | 'always' | 'never')
                    : 'always',
                thinkingLevel: 'medium',
                inputTokens: 0,
                outputTokens: 0,
                contextTokens: 0,
                createdAt: new Date(),
                lastActiveAt: new Date(),
            };

            await this.sessionStore.set(key, session);
        }

        return session;
    }

    /**
     * Check if a message should activate the bot
     */
    shouldActivate(message: NormalizedMessage): boolean {
        // Always activate for DMs
        if (!message.isGroup) {
            return true;
        }

        // For groups, check activation mode
        const activationMode = this.config.messages.groupChat.defaultActivation;

        switch (activationMode) {
            case 'always':
                return true;
            case 'never':
                return false;
            case 'mention':
            default:
                return message.isMention;
        }
    }

    /**
     * Check if a message is a reset trigger
     */
    isResetTrigger(text: string): boolean {
        const triggers = this.config.session.resetTriggers ?? [];
        return triggers.some(trigger =>
            text.toLowerCase().trim() === trigger.toLowerCase()
        );
    }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let gatewayInstance: MessagingGateway | null = null;

export function getGateway(): MessagingGateway {
    if (!gatewayInstance) {
        throw new Error('Messaging gateway not initialized. Call createGateway() first.');
    }
    return gatewayInstance;
}

export function createGateway(config?: Partial<GatewayConfig>, sessionStore?: SessionStore): MessagingGateway {
    if (gatewayInstance) {
        console.warn('[Gateway] Gateway already exists, returning existing instance');
        return gatewayInstance;
    }
    gatewayInstance = new MessagingGateway(config, sessionStore);
    return gatewayInstance;
}

export default MessagingGateway;
