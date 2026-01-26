/**
 * Gateway Configuration
 * 
 * Configuration schema and defaults for the messaging gateway.
 */

import type { ChannelType, ChannelConfig } from './types';

// ============================================================================
// Gateway Configuration Schema
// ============================================================================

export interface GatewayConfig {
    /** Gateway instance name */
    name: string;

    /** Gateway version */
    version: string;

    /** Enabled channels */
    channels: Partial<Record<ChannelType, ChannelConfig>>;

    /** Session configuration */
    session: SessionConfig;

    /** Message handling configuration */
    messages: MessageConfig;

    /** Redis connection for session store */
    redis?: {
        url?: string;
        prefix?: string;
    };

    /** Agent routing configuration */
    agentRouting: AgentRoutingConfig;
}

export interface SessionConfig {
    /** Default session scope */
    scope: 'global' | 'per-sender' | 'per-channel-peer';

    /** DM session scope */
    dmScope: 'main' | 'per-peer' | 'per-channel-peer';

    /** Identity links for cross-channel users */
    identityLinks?: Record<string, string[]>;

    /** Session reset configuration */
    reset: {
        /** Reset mode */
        mode: 'daily' | 'idle' | 'manual';
        /** Hour for daily reset (0-23) */
        atHour?: number;
        /** Minutes of idle before reset */
        idleMinutes?: number;
    };

    /** Per-session-type reset overrides */
    resetByType?: {
        dm?: SessionConfig['reset'];
        group?: SessionConfig['reset'];
        thread?: SessionConfig['reset'];
    };

    /** Per-channel reset overrides */
    resetByChannel?: Partial<Record<ChannelType, SessionConfig['reset']>>;

    /** Commands that trigger session reset */
    resetTriggers: string[];
}

export interface MessageConfig {
    /** Group chat settings */
    groupChat: {
        /** Patterns that @mention the bot */
        mentionPatterns: string[];
        /** Default activation mode for groups */
        defaultActivation: 'mention' | 'always' | 'never';
    };

    /** Rate limiting */
    rateLimit?: {
        /** Max messages per window */
        maxMessages: number;
        /** Window size in seconds */
        windowSeconds: number;
    };

    /** Message size limits */
    maxTextLength?: number;
    maxMediaSize?: number;
}

export interface AgentRoutingConfig {
    /** Default agent to route messages to */
    defaultAgent: string;

    /** Agent routing rules */
    rules?: Array<{
        /** Match criteria */
        match: {
            channelType?: ChannelType;
            channelId?: string;
            userId?: string;
            pattern?: string;
        };
        /** Agent to route to */
        agent: string;
    }>;
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_GATEWAY_CONFIG: GatewayConfig = {
    name: 'LiquidOS Messaging Gateway',
    version: '1.0.0',

    channels: {},

    session: {
        scope: 'per-sender',
        dmScope: 'main',
        identityLinks: {},
        reset: {
            mode: 'daily',
            atHour: 4, // 4 AM local time
        },
        resetTriggers: ['/new', '/reset'],
    },

    messages: {
        groupChat: {
            mentionPatterns: ['@liquid', '@bot', '@assistant'],
            defaultActivation: 'mention',
        },
        maxTextLength: 4096,
        maxMediaSize: 50 * 1024 * 1024, // 50MB
    },

    agentRouting: {
        defaultAgent: 'gateway-agent',
    },
};

// ============================================================================
// Channel Capability Defaults
// ============================================================================

export const CHANNEL_CAPABILITIES: Record<ChannelType, import('./types').ChannelCapabilities> = {
    telegram: {
        supportsMedia: true,
        supportsButtons: true,
        supportsThreads: true,
        supportsReactions: true,
        supportsEdits: true,
        supportsDeletes: true,
        maxMessageLength: 4096,
        richTextFormat: 'markdown',
        supportsTyping: true,
        supportsReadReceipts: false,
    },
    slack: {
        supportsMedia: true,
        supportsButtons: true,
        supportsThreads: true,
        supportsReactions: true,
        supportsEdits: true,
        supportsDeletes: true,
        maxMessageLength: 40000,
        richTextFormat: 'markdown',
        supportsTyping: true,
        supportsReadReceipts: false,
    },
    discord: {
        supportsMedia: true,
        supportsButtons: true,
        supportsThreads: true,
        supportsReactions: true,
        supportsEdits: true,
        supportsDeletes: true,
        maxMessageLength: 2000,
        richTextFormat: 'markdown',
        supportsTyping: true,
        supportsReadReceipts: false,
    },
    whatsapp: {
        supportsMedia: true,
        supportsButtons: true,
        supportsThreads: false,
        supportsReactions: true,
        supportsEdits: false,
        supportsDeletes: true,
        maxMessageLength: 65536,
        richTextFormat: 'plaintext',
        supportsTyping: true,
        supportsReadReceipts: true,
    },
    signal: {
        supportsMedia: true,
        supportsButtons: false,
        supportsThreads: false,
        supportsReactions: true,
        supportsEdits: false,
        supportsDeletes: false,
        maxMessageLength: 65536,
        richTextFormat: 'plaintext',
        supportsTyping: true,
        supportsReadReceipts: true,
    },
    matrix: {
        supportsMedia: true,
        supportsButtons: false,
        supportsThreads: true,
        supportsReactions: true,
        supportsEdits: true,
        supportsDeletes: true,
        maxMessageLength: 65536,
        richTextFormat: 'html',
        supportsTyping: true,
        supportsReadReceipts: true,
    },
    email: {
        supportsMedia: true,
        supportsButtons: false,
        supportsThreads: true,
        supportsReactions: false,
        supportsEdits: false,
        supportsDeletes: false,
        maxMessageLength: 1000000,
        richTextFormat: 'html',
        supportsTyping: false,
        supportsReadReceipts: false,
    },
    sms: {
        supportsMedia: true,
        supportsButtons: false,
        supportsThreads: false,
        supportsReactions: false,
        supportsEdits: false,
        supportsDeletes: false,
        maxMessageLength: 1600,
        richTextFormat: 'plaintext',
        supportsTyping: false,
        supportsReadReceipts: false,
    },
    line: {
        supportsMedia: true,
        supportsButtons: true,
        supportsThreads: false,
        supportsReactions: true,
        supportsEdits: false,
        supportsDeletes: false,
        maxMessageLength: 5000,
        richTextFormat: 'plaintext',
        supportsTyping: true,
        supportsReadReceipts: true,
    },
    teams: {
        supportsMedia: true,
        supportsButtons: true,
        supportsThreads: true,
        supportsReactions: true,
        supportsEdits: true,
        supportsDeletes: true,
        maxMessageLength: 28000,
        richTextFormat: 'html',
        supportsTyping: true,
        supportsReadReceipts: true,
    },
    imessage: {
        supportsMedia: true,
        supportsButtons: false,
        supportsThreads: false,
        supportsReactions: true,
        supportsEdits: false,
        supportsDeletes: false,
        maxMessageLength: 20000,
        richTextFormat: 'plaintext',
        supportsTyping: true,
        supportsReadReceipts: true,
    },
    webchat: {
        supportsMedia: true,
        supportsButtons: true,
        supportsThreads: false,
        supportsReactions: true,
        supportsEdits: true,
        supportsDeletes: true,
        maxMessageLength: 100000,
        richTextFormat: 'markdown',
        supportsTyping: true,
        supportsReadReceipts: false,
    },
};

// ============================================================================
// Configuration Loader
// ============================================================================

export function loadGatewayConfig(overrides?: Partial<GatewayConfig>): GatewayConfig {
    return {
        ...DEFAULT_GATEWAY_CONFIG,
        ...overrides,
        session: {
            ...DEFAULT_GATEWAY_CONFIG.session,
            ...overrides?.session,
        },
        messages: {
            ...DEFAULT_GATEWAY_CONFIG.messages,
            ...overrides?.messages,
        },
        agentRouting: {
            ...DEFAULT_GATEWAY_CONFIG.agentRouting,
            ...overrides?.agentRouting,
        },
    };
}
