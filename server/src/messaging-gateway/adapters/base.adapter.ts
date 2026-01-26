/**
 * Base Channel Adapter
 * 
 * Abstract base class for messaging channel adapters.
 * Each platform (Telegram, Slack, Discord, etc.) implements this interface.
 */

import type {
    ChannelType,
    ChannelConfig,
    ChannelCapabilities,
    NormalizedMessage,
    NormalizedResponse,
    GatewayEvent,
} from '../types';
import { CHANNEL_CAPABILITIES } from '../config';
import { EventEmitter } from 'events';

// ============================================================================
// Base Adapter Abstract Class
// ============================================================================

export abstract class BaseChannelAdapter extends EventEmitter {
    /** Channel type identifier */
    abstract readonly channelType: ChannelType;

    /** Human-readable channel name */
    abstract readonly displayName: string;

    /** Configuration for this channel */
    protected config: ChannelConfig;

    /** Is the adapter currently connected? */
    protected _connected: boolean = false;

    /** Message handler callback */
    protected messageHandler?: (msg: NormalizedMessage) => Promise<void>;

    constructor(config: ChannelConfig) {
        super();
        this.config = config;
    }

    // ============================================================================
    // Lifecycle Methods
    // ============================================================================

    /**
     * Start the adapter and establish connection
     */
    abstract start(): Promise<void>;

    /**
     * Stop the adapter and clean up resources
     */
    abstract stop(): Promise<void>;

    /**
     * Check if the adapter is connected
     */
    get connected(): boolean {
        return this._connected;
    }

    // ============================================================================
    // Message Handling
    // ============================================================================

    /**
     * Register message handler
     */
    onMessage(handler: (msg: NormalizedMessage) => Promise<void>): void {
        this.messageHandler = handler;
    }

    /**
     * Send a response to a channel
     */
    abstract send(channelId: string, response: NormalizedResponse): Promise<string>;

    /**
     * Send typing indicator
     */
    abstract sendTyping(channelId: string): Promise<void>;

    /**
     * Reply to a specific message
     */
    async reply(message: NormalizedMessage, response: NormalizedResponse): Promise<string> {
        return this.send(message.channelId, {
            ...response,
            replyTo: message.id,
        });
    }

    // ============================================================================
    // Channel Capabilities
    // ============================================================================

    /**
     * Get capabilities for this channel
     */
    get capabilities(): ChannelCapabilities {
        return CHANNEL_CAPABILITIES[this.channelType];
    }

    // ============================================================================
    // Webhook Support
    // ============================================================================

    /**
     * Get webhook endpoint path (if using webhooks)
     */
    getWebhookPath(): string | null {
        return null;
    }

    /**
     * Handle incoming webhook request
     */
    async handleWebhook(_request: Request): Promise<Response> {
        return new Response('Webhooks not supported', { status: 501 });
    }

    // ============================================================================
    // Configuration
    // ============================================================================

    /**
     * Validate adapter configuration
     */
    abstract validateConfig(): { valid: boolean; errors: string[] };

    /**
     * Get required credential keys
     */
    abstract getRequiredCredentials(): string[];

    /**
     * Update configuration at runtime
     */
    updateConfig(config: Partial<ChannelConfig>): void {
        this.config = { ...this.config, ...config };
    }

    // ============================================================================
    // Access Control
    // ============================================================================

    /**
     * Check if a user is allowed to interact
     */
    isUserAllowed(userId: string): boolean {
        // Check denylist first
        if (this.config.denyFrom?.includes(userId)) {
            return false;
        }

        // If allowlist is defined, user must be in it
        if (this.config.allowFrom && this.config.allowFrom.length > 0) {
            return this.config.allowFrom.includes(userId);
        }

        // No restrictions
        return true;
    }

    /**
     * Check if bot should respond in group chat
     */
    shouldRespondInGroup(message: NormalizedMessage): boolean {
        if (!message.isGroup) {
            return true;
        }

        const groupConfig = this.config.groups;
        const activationMode = groupConfig?.activationMode ?? 'mention';

        switch (activationMode) {
            case 'always':
                return true;
            case 'never':
                return false;
            case 'mention':
            default:
                return message.mentionsBot;
        }
    }

    // ============================================================================
    // Event Helpers
    // ============================================================================

    /**
     * Emit a gateway event
     */
    protected emitEvent<T>(type: GatewayEvent['type'], channelId: string, data: T): void {
        const event: GatewayEvent<T> = {
            type,
            channelType: this.channelType,
            channelId,
            timestamp: new Date(),
            data,
        };
        this.emit(type, event);
        this.emit('event', event);
    }

    /**
     * Handle incoming message from platform
     */
    protected async handleIncomingMessage(message: NormalizedMessage): Promise<void> {
        // Check access control
        if (!this.isUserAllowed(message.from.id)) {
            return;
        }

        // Check group activation
        if (!this.shouldRespondInGroup(message)) {
            return;
        }

        // Emit event
        this.emitEvent('message', message.channelId, message);

        // Call handler
        if (this.messageHandler) {
            await this.messageHandler(message);
        }
    }

    // ============================================================================
    // Logging
    // ============================================================================

    protected log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: unknown): void {
        const prefix = `[${this.displayName}]`;
        switch (level) {
            case 'debug':
                console.debug(prefix, message, data ?? '');
                break;
            case 'info':
                console.info(prefix, message, data ?? '');
                break;
            case 'warn':
                console.warn(prefix, message, data ?? '');
                break;
            case 'error':
                console.error(prefix, message, data ?? '');
                break;
        }
    }
}

// ============================================================================
// Adapter Registry
// ============================================================================

export type AdapterFactory = (config: ChannelConfig) => BaseChannelAdapter;

const adapterRegistry = new Map<ChannelType, AdapterFactory>();

export function registerAdapter(type: ChannelType, factory: AdapterFactory): void {
    adapterRegistry.set(type, factory);
}

export function createAdapter(type: ChannelType, config: ChannelConfig): BaseChannelAdapter {
    const factory = adapterRegistry.get(type);
    if (!factory) {
        throw new Error(`No adapter registered for channel type: ${type}`);
    }
    return factory(config);
}

export function getRegisteredAdapters(): ChannelType[] {
    return Array.from(adapterRegistry.keys());
}
