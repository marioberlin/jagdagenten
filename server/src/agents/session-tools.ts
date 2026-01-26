/**
 * A2A Session Tools
 * 
 * Tools for cross-session communication between agents.
 * Implements the A2A protocol for agent-to-agent messaging.
 * 
 * Available tools:
 * - sessions_list: List active sessions
 * - sessions_history: Get conversation history for a session
 * - sessions_send: Send message to another session
 * - sessions_spawn: Create child session for sub-tasks
 */

import type { ChannelType, GatewaySession, NormalizedMessage, NormalizedResponse } from '../messaging-gateway/types';
import type { SessionStore } from '../messaging-gateway/gateway';

// ============================================================================
// Types
// ============================================================================

export interface SessionInfo {
    id: string;
    channelType: ChannelType;
    channelId: string;
    userId: string;
    displayName?: string;
    isGroup: boolean;
    lastActiveAt: Date;
    createdAt: Date;
    inputTokens: number;
    outputTokens: number;
}

export interface SessionHistoryEntry {
    id: string;
    timestamp: Date;
    role: 'user' | 'assistant';
    content: string;
    channelType: ChannelType;
    channelId: string;
}

export interface SendResult {
    messageId: string;
    sessionId: string;
    status: 'delivered' | 'pending' | 'failed';
    skipReply?: boolean;
}

export interface SpawnResult {
    sessionId: string;
    parentSessionId: string;
    taskId: string;
    status: 'active' | 'completed' | 'failed';
}

// ============================================================================
// Reply Skip Patterns
// ============================================================================

/**
 * Special patterns to control message flow
 * 
 * REPLY_SKIP: Tell the receiving agent not to reply
 * ANNOUNCE_SKIP: Broadcasting without expecting response
 */
export const REPLY_PATTERNS = {
    /** Message should not be replied to */
    REPLY_SKIP: '[REPLY_SKIP]',

    /** Broadcast announcement, no reply expected */
    ANNOUNCE_SKIP: '[ANNOUNCE_SKIP]',

    /** Request acknowledgment only (not full reply) */
    ACK_ONLY: '[ACK_ONLY]',

    /** Ping request expecting pong response */
    PING: '[PING]',

    /** Pong response to ping */
    PONG: '[PONG]',
} as const;

export function hasReplySkip(content: string): boolean {
    return content.includes(REPLY_PATTERNS.REPLY_SKIP) ||
        content.includes(REPLY_PATTERNS.ANNOUNCE_SKIP);
}

export function stripPatterns(content: string): string {
    let result = content;
    for (const pattern of Object.values(REPLY_PATTERNS)) {
        result = result.replace(pattern, '').trim();
    }
    return result;
}

// ============================================================================
// Session History Store Interface
// ============================================================================

export interface SessionHistoryStore {
    addEntry(sessionId: string, entry: SessionHistoryEntry): Promise<void>;
    getHistory(sessionId: string, options?: { limit?: number; before?: Date }): Promise<SessionHistoryEntry[]>;
    clearHistory(sessionId: string): Promise<void>;
}

// ============================================================================
// In-Memory History Store
// ============================================================================

export class InMemoryHistoryStore implements SessionHistoryStore {
    private history = new Map<string, SessionHistoryEntry[]>();
    private maxPerSession = 1000;

    async addEntry(sessionId: string, entry: SessionHistoryEntry): Promise<void> {
        let entries = this.history.get(sessionId);
        if (!entries) {
            entries = [];
            this.history.set(sessionId, entries);
        }

        entries.push(entry);

        // Trim if over limit
        if (entries.length > this.maxPerSession) {
            entries.splice(0, entries.length - this.maxPerSession);
        }
    }

    async getHistory(sessionId: string, options?: { limit?: number; before?: Date }): Promise<SessionHistoryEntry[]> {
        let entries = this.history.get(sessionId) ?? [];

        if (options?.before) {
            entries = entries.filter(e => e.timestamp < options.before!);
        }

        if (options?.limit) {
            entries = entries.slice(-options.limit);
        }

        return entries;
    }

    async clearHistory(sessionId: string): Promise<void> {
        this.history.delete(sessionId);
    }
}

// ============================================================================
// Session Tools Service
// ============================================================================

export interface MessageSender {
    send(channelType: ChannelType, channelId: string, response: NormalizedResponse): Promise<string>;
}

export class SessionToolsService {
    private sessionStore: SessionStore;
    private historyStore: SessionHistoryStore;
    private messageSender: MessageSender;
    private childSessions = new Map<string, { parentId: string; taskId: string; status: string }>();
    private pendingMessages = new Map<string, { resolve: (result: SendResult) => void; timeout: ReturnType<typeof setTimeout> }>();

    constructor(
        sessionStore: SessionStore,
        historyStore: SessionHistoryStore,
        messageSender: MessageSender
    ) {
        this.sessionStore = sessionStore;
        this.historyStore = historyStore;
        this.messageSender = messageSender;
    }

    // ============================================================================
    // sessions_list
    // ============================================================================

    /**
     * List active sessions with optional filtering
     */
    async sessionsList(options?: {
        channelType?: ChannelType;
        userId?: string;
        includeInactive?: boolean;
        limit?: number;
    }): Promise<SessionInfo[]> {
        const sessions = await this.sessionStore.list({
            channelType: options?.channelType,
            userId: options?.userId,
        });

        let filtered = sessions;

        // Filter to recently active (last 24h by default)
        if (!options?.includeInactive) {
            const cutoff = new Date();
            cutoff.setHours(cutoff.getHours() - 24);
            filtered = filtered.filter(s => new Date(s.lastActiveAt) > cutoff);
        }

        // Limit results
        if (options?.limit) {
            filtered = filtered.slice(0, options.limit);
        }

        return filtered.map(s => this.sessionToInfo(s));
    }

    // ============================================================================
    // sessions_history
    // ============================================================================

    /**
     * Get conversation history for a session
     */
    async sessionsHistory(sessionId: string, options?: {
        limit?: number;
        before?: Date;
        format?: 'entries' | 'markdown';
    }): Promise<SessionHistoryEntry[] | string> {
        const entries = await this.historyStore.getHistory(sessionId, {
            limit: options?.limit ?? 50,
            before: options?.before,
        });

        if (options?.format === 'markdown') {
            return this.formatHistoryAsMarkdown(entries);
        }

        return entries;
    }

    /**
     * Record a message in session history
     */
    async recordMessage(sessionId: string, message: NormalizedMessage): Promise<void> {
        const entry: SessionHistoryEntry = {
            id: message.id,
            timestamp: message.timestamp,
            role: 'user',
            content: message.text ?? '',
            channelType: message.channelType,
            channelId: message.channelId,
        };
        await this.historyStore.addEntry(sessionId, entry);
    }

    /**
     * Record an assistant response in session history
     */
    async recordResponse(sessionId: string, response: NormalizedResponse, channelType: ChannelType, channelId: string): Promise<void> {
        const entry: SessionHistoryEntry = {
            id: `resp-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            timestamp: new Date(),
            role: 'assistant',
            content: response.text ?? '',
            channelType,
            channelId,
        };
        await this.historyStore.addEntry(sessionId, entry);
    }

    // ============================================================================
    // sessions_send
    // ============================================================================

    /**
     * Send a message to another session
     * Supports ping-pong and skip patterns
     */
    async sessionsSend(
        targetSessionId: string,
        content: string,
        options?: {
            skipReply?: boolean;
            waitForResponse?: boolean;
            timeout?: number;
        }
    ): Promise<SendResult> {
        // Get target session
        const sessions = await this.sessionStore.list();
        const targetSession = sessions.find(s => s.id === targetSessionId);

        if (!targetSession) {
            return {
                messageId: '',
                sessionId: targetSessionId,
                status: 'failed',
            };
        }

        // Add skip pattern if requested
        let finalContent = content;
        if (options?.skipReply) {
            finalContent = `${REPLY_PATTERNS.REPLY_SKIP} ${content}`;
        }

        // Send message
        try {
            const messageId = await this.messageSender.send(
                targetSession.channelType,
                targetSession.channelId,
                { text: finalContent }
            );

            const result: SendResult = {
                messageId,
                sessionId: targetSessionId,
                status: 'delivered',
                skipReply: options?.skipReply,
            };

            // If waiting for response, set up pending listener
            if (options?.waitForResponse && !options?.skipReply) {
                return new Promise((resolve) => {
                    const timeout = setTimeout(() => {
                        this.pendingMessages.delete(messageId);
                        resolve({ ...result, status: 'pending' });
                    }, options?.timeout ?? 30000);

                    this.pendingMessages.set(messageId, { resolve, timeout });
                });
            }

            return result;
        } catch (error) {
            return {
                messageId: '',
                sessionId: targetSessionId,
                status: 'failed',
            };
        }
    }

    /**
     * Handle response to a pending message (for ping-pong)
     */
    onResponse(originalMessageId: string, response: NormalizedResponse): void {
        const pending = this.pendingMessages.get(originalMessageId);
        if (pending) {
            clearTimeout(pending.timeout);
            this.pendingMessages.delete(originalMessageId);
            pending.resolve({
                messageId: originalMessageId,
                sessionId: '',
                status: 'delivered',
            });
        }
    }

    // ============================================================================
    // sessions_spawn
    // ============================================================================

    /**
     * Spawn a child session for a sub-task
     */
    async sessionsSpawn(
        parentSessionId: string,
        taskDescription: string,
        options?: {
            channelType?: ChannelType;
            channelId?: string;
            autoComplete?: boolean;
        }
    ): Promise<SpawnResult> {
        const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const sessionId = `child-${parentSessionId}-${taskId}`;

        // Create child session record
        this.childSessions.set(sessionId, {
            parentId: parentSessionId,
            taskId,
            status: 'active',
        });

        // Create session in store
        const childSession: GatewaySession = {
            id: sessionId,
            channelType: options?.channelType ?? 'webchat',
            channelId: options?.channelId ?? `virtual-${sessionId}`,
            userId: `system`,
            isGroup: false,
            activationMode: 'always',
            thinkingLevel: 'medium',
            inputTokens: 0,
            outputTokens: 0,
            contextTokens: 0,
            createdAt: new Date(),
            lastActiveAt: new Date(),
        };

        await this.sessionStore.set(sessionId, childSession);

        // Add task context to history
        await this.historyStore.addEntry(sessionId, {
            id: `spawn-${taskId}`,
            timestamp: new Date(),
            role: 'user',
            content: `[SPAWNED_TASK] ${taskDescription}`,
            channelType: childSession.channelType,
            channelId: childSession.channelId,
        });

        return {
            sessionId,
            parentSessionId,
            taskId,
            status: 'active',
        };
    }

    /**
     * Complete a spawned child session
     */
    async completeSpawnedSession(sessionId: string, result?: string): Promise<void> {
        const child = this.childSessions.get(sessionId);
        if (!child) return;

        child.status = 'completed';

        // Send result back to parent if specified
        if (result && child.parentId) {
            await this.sessionsSend(child.parentId, `[TASK_COMPLETE:${child.taskId}] ${result}`, {
                skipReply: true,
            });
        }
    }

    /**
     * Get child sessions for a parent
     */
    async getChildSessions(parentSessionId: string): Promise<SpawnResult[]> {
        const children: SpawnResult[] = [];

        for (const [sessionId, info] of this.childSessions) {
            if (info.parentId === parentSessionId) {
                children.push({
                    sessionId,
                    parentSessionId,
                    taskId: info.taskId,
                    status: info.status as SpawnResult['status'],
                });
            }
        }

        return children;
    }

    // ============================================================================
    // Helpers
    // ============================================================================

    private sessionToInfo(session: GatewaySession): SessionInfo {
        return {
            id: session.id,
            channelType: session.channelType,
            channelId: session.channelId,
            userId: session.userId,
            isGroup: session.isGroup,
            lastActiveAt: session.lastActiveAt,
            createdAt: session.createdAt,
            inputTokens: session.inputTokens,
            outputTokens: session.outputTokens,
        };
    }

    private formatHistoryAsMarkdown(entries: SessionHistoryEntry[]): string {
        const lines: string[] = ['# Conversation History', ''];

        for (const entry of entries) {
            const time = entry.timestamp.toLocaleTimeString();
            const role = entry.role === 'user' ? '👤 User' : '🤖 Assistant';
            lines.push(`**${time}** ${role}`);
            lines.push(entry.content);
            lines.push('');
        }

        return lines.join('\n');
    }
}

// ============================================================================
// Tool Declarations (A2A Format)
// ============================================================================

export const SESSION_TOOL_DECLARATIONS = [
    {
        name: 'sessions_list',
        description: 'List active sessions across all channels. Returns session IDs, channel types, and activity timestamps.',
        parameters: {
            type: 'object',
            properties: {
                channelType: {
                    type: 'string',
                    enum: ['telegram', 'slack', 'discord', 'webchat'],
                    description: 'Filter by channel type',
                },
                includeInactive: {
                    type: 'boolean',
                    description: 'Include sessions inactive for more than 24 hours',
                },
                limit: {
                    type: 'number',
                    description: 'Maximum number of sessions to return',
                },
            },
        },
    },
    {
        name: 'sessions_history',
        description: 'Get conversation history for a specific session.',
        parameters: {
            type: 'object',
            properties: {
                sessionId: {
                    type: 'string',
                    description: 'The session ID to get history for',
                },
                limit: {
                    type: 'number',
                    description: 'Maximum number of messages to return (default: 50)',
                },
                format: {
                    type: 'string',
                    enum: ['entries', 'markdown'],
                    description: 'Output format (default: entries)',
                },
            },
            required: ['sessionId'],
        },
    },
    {
        name: 'sessions_send',
        description: 'Send a message to another session. Use REPLY_SKIP pattern to prevent automatic replies.',
        parameters: {
            type: 'object',
            properties: {
                targetSessionId: {
                    type: 'string',
                    description: 'The session ID to send to',
                },
                content: {
                    type: 'string',
                    description: 'Message content to send',
                },
                skipReply: {
                    type: 'boolean',
                    description: 'Add REPLY_SKIP pattern to prevent recipient from replying',
                },
                waitForResponse: {
                    type: 'boolean',
                    description: 'Wait for response (ping-pong mode)',
                },
            },
            required: ['targetSessionId', 'content'],
        },
    },
    {
        name: 'sessions_spawn',
        description: 'Spawn a child session for a sub-task. The child session operates independently but reports results back.',
        parameters: {
            type: 'object',
            properties: {
                taskDescription: {
                    type: 'string',
                    description: 'Description of the task for the child session',
                },
                autoComplete: {
                    type: 'boolean',
                    description: 'Automatically mark as complete when task is done',
                },
            },
            required: ['taskDescription'],
        },
    },
];

// ============================================================================
// Factory
// ============================================================================

export function createSessionToolsService(
    sessionStore: SessionStore,
    messageSender: MessageSender,
    historyStore?: SessionHistoryStore
): SessionToolsService {
    return new SessionToolsService(
        sessionStore,
        historyStore ?? new InMemoryHistoryStore(),
        messageSender
    );
}

export default SessionToolsService;
