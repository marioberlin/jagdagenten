/**
 * Messaging Gateway Types
 * 
 * Core type definitions for the unified multi-channel messaging gateway.
 * Normalizes messages from various platforms (Telegram, Slack, Discord, etc.)
 * into a common format for processing by LiquidOS agents.
 */

// ============================================================================
// Channel Types
// ============================================================================

export type ChannelType =
    | 'telegram'
    | 'whatsapp'
    | 'slack'
    | 'discord'
    | 'signal'
    | 'matrix'
    | 'email'
    | 'sms'
    | 'line'
    | 'teams'
    | 'imessage'
    | 'webchat';

export type MediaType = 'image' | 'audio' | 'video' | 'document' | 'sticker' | 'voice';
export type RichTextFormat = 'markdown' | 'html' | 'plaintext';

// ============================================================================
// Normalized Message Format
// ============================================================================

export interface NormalizedMessage {
    /** Platform-specific message ID */
    id: string;

    /** Channel type (telegram, slack, etc.) */
    channelType: ChannelType;

    /** Platform-specific chat/channel/room ID */
    channelId: string;

    /** Sender information */
    from: {
        id: string;
        name?: string;
        handle?: string;
        isBot?: boolean;
        avatarUrl?: string;
    };

    /** Plain text content */
    text?: string;

    /** Media attachments */
    media?: NormalizedMedia[];

    /** ID of message being replied to */
    replyTo?: string;

    /** Thread/topic ID if applicable */
    threadId?: string;

    /** Is this from a group chat? */
    isGroup: boolean;

    /** Does this @mention the bot? */
    mentionsBot: boolean;

    /** Message timestamp */
    timestamp: Date;

    /** Original platform message for debugging */
    raw: unknown;
}

export interface NormalizedMedia {
    type: MediaType;
    url?: string;
    mimeType?: string;
    data?: Buffer;
    filename?: string;
    size?: number;
    width?: number;
    height?: number;
    duration?: number;
}

// ============================================================================
// Normalized Response Format
// ============================================================================

export interface NormalizedResponse {
    /** Plain text response */
    text?: string;

    /** Media attachments to send */
    media?: NormalizedMedia[];

    /** Reply to a specific message */
    replyTo?: string;

    /** Interactive buttons (platform-dependent) */
    buttons?: ResponseButton[];

    /** A2UI layout for capable platforms */
    a2ui?: unknown; // A2UIMessage[] from a2a/types

    /** Split response into multiple messages */
    multipart?: boolean;

    /** Parse mode for formatting */
    parseMode?: RichTextFormat;
}

export interface ResponseButton {
    text: string;
    callback?: string;
    url?: string;
}

// ============================================================================
// Channel Capabilities
// ============================================================================

export interface ChannelCapabilities {
    /** Supports image/video/audio attachments */
    supportsMedia: boolean;

    /** Supports interactive buttons */
    supportsButtons: boolean;

    /** Supports threaded conversations */
    supportsThreads: boolean;

    /** Supports message reactions */
    supportsReactions: boolean;

    /** Supports editing sent messages */
    supportsEdits: boolean;

    /** Supports deleting messages */
    supportsDeletes: boolean;

    /** Maximum message length in characters */
    maxMessageLength: number;

    /** Text formatting support */
    richTextFormat: RichTextFormat;

    /** Supports typing indicator */
    supportsTyping: boolean;

    /** Supports read receipts */
    supportsReadReceipts: boolean;
}

// ============================================================================
// Channel Configuration
// ============================================================================

export interface ChannelConfig {
    /** Channel type identifier */
    type: ChannelType;

    /** Is this channel enabled? */
    enabled: boolean;

    /** Platform-specific credentials */
    credentials: Record<string, string>;

    /** Allowlist of user IDs allowed to interact */
    allowFrom?: string[];

    /** Denylist of user IDs to ignore */
    denyFrom?: string[];

    /** Group chat settings */
    groups?: {
        /** Require @mention to respond */
        requireMention?: boolean;

        /** Activation mode: 'mention' | 'always' | 'never' */
        activationMode?: 'mention' | 'always' | 'never';

        /** Trigger patterns that activate the bot */
        triggerPatterns?: string[];
    };

    /** Webhook URL for this channel (if applicable) */
    webhookUrl?: string;

    /** Custom bot name for this channel */
    botName?: string;
}

// ============================================================================
// Session Types (inspired by Clawdbot)
// ============================================================================

export interface GatewaySession {
    /** Unique session ID */
    id: string;

    /** Channel type */
    channelType: ChannelType;

    /** Platform-specific channel ID */
    channelId: string;

    /** User identity (may span multiple channels) */
    userId: string;

    /** Is this a group chat? */
    isGroup: boolean;

    /** How the bot activates in this session */
    activationMode: 'mention' | 'always' | 'never';

    /** Model override for this session */
    model?: string;

    /** Thinking level for this session */
    thinkingLevel: 'off' | 'minimal' | 'low' | 'medium' | 'high';

    /** Token counts */
    inputTokens: number;
    outputTokens: number;
    contextTokens: number;

    /** Timestamps */
    createdAt: Date;
    lastActiveAt: Date;

    /** Session metadata */
    metadata?: Record<string, unknown>;
}

// ============================================================================
// Identity Linking
// ============================================================================

export interface IdentityLink {
    /** Canonical user ID */
    canonicalId: string;

    /** Display name */
    displayName?: string;

    /** Linked platform identities */
    linkedIds: Array<{
        channelType: ChannelType;
        platformId: string;
    }>;
}

// ============================================================================
// Gateway Events
// ============================================================================

export type GatewayEventType =
    | 'message'
    | 'message_edit'
    | 'message_delete'
    | 'reaction'
    | 'typing'
    | 'presence'
    | 'error'
    | 'connected'
    | 'disconnected';

export interface GatewayEvent<T = unknown> {
    type: GatewayEventType;
    channelType: ChannelType;
    channelId: string;
    timestamp: Date;
    data: T;
}

// ============================================================================
// Message Handler
// ============================================================================

export type MessageHandler = (message: NormalizedMessage) => Promise<NormalizedResponse | null>;

export interface MessageContext {
    message: NormalizedMessage;
    session: GatewaySession;
    identityLink?: IdentityLink;
    replyTo: (response: NormalizedResponse) => Promise<string>;
    sendTyping: () => Promise<void>;
}
