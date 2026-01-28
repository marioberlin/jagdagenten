/**
 * Agent Session Store
 *
 * Manages persistent chat sessions for agents.
 * Sessions are stored in PostgreSQL via the A2A session/artifact stores.
 *
 * Features:
 * - Session CRUD operations
 * - Auto-save on message send/receive
 * - Session memory extraction via decontextualizer
 * - Cross-device sync via PostgreSQL
 */

import { create } from 'zustand';
import type { StoredChatMessage } from './agentChatStore';

// ============================================================================
// Types
// ============================================================================

export interface AgentSession {
    /** Unique session ID */
    id: string;
    /** Agent ID this session belongs to */
    agentId: string;
    /** Session title (auto-generated or user-named) */
    title: string;
    /** Preview text (first ~100 chars of last message) */
    preview: string;
    /** Number of messages in session */
    messageCount: number;
    /** When the session was created */
    createdAt: Date;
    /** When the session was last active */
    lastActiveAt: Date;
    /** Whether session is archived */
    isArchived: boolean;
    /** Extracted memories from this session */
    memories?: SessionMemory[];
}

export interface SessionMemory {
    /** The decontextualized memory statement */
    content: string;
    /** Importance score (0-100) */
    importance: number;
    /** When this memory was extracted */
    extractedAt: Date;
    /** Source message ID */
    sourceMessageId?: string;
}

export interface SessionWithMessages extends AgentSession {
    /** All messages in this session */
    messages: StoredChatMessage[];
}

// ============================================================================
// Store State
// ============================================================================

interface AgentSessionState {
    /** Sessions indexed by agent ID, then session ID */
    sessions: Record<string, Record<string, AgentSession>>;

    /** Currently active session per agent */
    activeSessionId: Record<string, string | null>;

    /** Loading state per agent */
    isLoading: Record<string, boolean>;

    /** Error state per agent */
    error: Record<string, string | null>;
}

interface AgentSessionActions {
    // --- Session Lifecycle ---

    /** Create a new session for an agent */
    createSession: (agentId: string, initialMessage?: string) => Promise<AgentSession>;

    /** Load sessions for an agent from backend */
    loadSessions: (agentId: string) => Promise<void>;

    /** Set the active session for an agent */
    setActiveSession: (agentId: string, sessionId: string | null) => void;

    /** Get the active session for an agent */
    getActiveSession: (agentId: string) => AgentSession | null;

    /** Get all sessions for an agent (sorted by lastActiveAt) */
    getSessionsForAgent: (agentId: string) => AgentSession[];

    /** Update session metadata */
    updateSession: (agentId: string, sessionId: string, updates: Partial<AgentSession>) => Promise<void>;

    /** Rename a session */
    renameSession: (agentId: string, sessionId: string, newTitle: string) => Promise<void>;

    /** Archive a session */
    archiveSession: (agentId: string, sessionId: string) => Promise<void>;

    /** Delete a session permanently */
    deleteSession: (agentId: string, sessionId: string) => Promise<void>;

    // --- Message Operations ---

    /** Save messages to a session */
    saveMessages: (agentId: string, sessionId: string, messages: StoredChatMessage[]) => Promise<void>;

    /** Load messages for a session */
    loadMessages: (agentId: string, sessionId: string) => Promise<StoredChatMessage[]>;

    /** Add a memory to a session */
    addMemory: (agentId: string, sessionId: string, memory: SessionMemory) => Promise<void>;

    /** Extract and store memory from a message using the decontextualizer */
    extractMemory: (agentId: string, sessionId: string, content: string, sourceMessageId?: string) => Promise<{
        extracted: boolean;
        memory?: SessionMemory;
        wasResolved?: boolean;
    }>;

    // --- Utility ---

    /** Generate a session title from the first message */
    generateTitle: (firstMessage: string) => string;

    /** Clear all sessions for an agent */
    clearAgentSessions: (agentId: string) => void;
}

type AgentSessionStore = AgentSessionState & AgentSessionActions;

// ============================================================================
// API Functions
// ============================================================================

const API_BASE = '/api/agent-sessions';

async function fetchSessions(agentId: string): Promise<AgentSession[]> {
    const response = await fetch(`${API_BASE}/${agentId}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch sessions: ${response.statusText}`);
    }
    const data = await response.json();
    return data.sessions.map((s: any) => ({
        ...s,
        createdAt: new Date(s.createdAt),
        lastActiveAt: new Date(s.lastActiveAt),
    }));
}

async function createSessionAPI(agentId: string, title: string): Promise<AgentSession> {
    const response = await fetch(`${API_BASE}/${agentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
    });
    if (!response.ok) {
        throw new Error(`Failed to create session: ${response.statusText}`);
    }
    const data = await response.json();
    return {
        ...data.session,
        createdAt: new Date(data.session.createdAt),
        lastActiveAt: new Date(data.session.lastActiveAt),
    };
}

async function updateSessionAPI(agentId: string, sessionId: string, updates: Partial<AgentSession>): Promise<void> {
    const response = await fetch(`${API_BASE}/${agentId}/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
    });
    if (!response.ok) {
        throw new Error(`Failed to update session: ${response.statusText}`);
    }
}

async function deleteSessionAPI(agentId: string, sessionId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${agentId}/${sessionId}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error(`Failed to delete session: ${response.statusText}`);
    }
}

async function saveMessagesAPI(agentId: string, sessionId: string, messages: StoredChatMessage[]): Promise<void> {
    const response = await fetch(`${API_BASE}/${agentId}/${sessionId}/messages`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
    });
    if (!response.ok) {
        throw new Error(`Failed to save messages: ${response.statusText}`);
    }
}

async function loadMessagesAPI(agentId: string, sessionId: string): Promise<StoredChatMessage[]> {
    const response = await fetch(`${API_BASE}/${agentId}/${sessionId}/messages`);
    if (!response.ok) {
        throw new Error(`Failed to load messages: ${response.statusText}`);
    }
    const data = await response.json();
    return data.messages.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp),
    }));
}

async function addMemoryAPI(agentId: string, sessionId: string, memory: SessionMemory): Promise<void> {
    const response = await fetch(`${API_BASE}/${agentId}/${sessionId}/memories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memory }),
    });
    if (!response.ok) {
        throw new Error(`Failed to add memory: ${response.statusText}`);
    }
}

interface ExtractMemoryResult {
    extracted: boolean;
    memory?: SessionMemory;
    wasResolved?: boolean;
    reason?: string;
    original?: string;
}

async function extractMemoryAPI(agentId: string, sessionId: string, content: string, sourceMessageId?: string): Promise<ExtractMemoryResult> {
    const response = await fetch(`${API_BASE}/${agentId}/${sessionId}/extract-memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, sourceMessageId }),
    });
    if (!response.ok) {
        throw new Error(`Failed to extract memory: ${response.statusText}`);
    }
    const data = await response.json();
    if (data.memory) {
        data.memory.extractedAt = new Date(data.memory.extractedAt);
    }
    return data;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useAgentSessionStore = create<AgentSessionStore>((set, get) => ({
    sessions: {},
    activeSessionId: {},
    isLoading: {},
    error: {},

    // --- Session Lifecycle ---

    createSession: async (agentId, initialMessage) => {
        const title = initialMessage
            ? get().generateTitle(initialMessage)
            : `Session ${new Date().toLocaleDateString()}`;

        try {
            set(state => ({
                isLoading: { ...state.isLoading, [agentId]: true },
                error: { ...state.error, [agentId]: null },
            }));

            const session = await createSessionAPI(agentId, title);

            set(state => ({
                sessions: {
                    ...state.sessions,
                    [agentId]: {
                        ...state.sessions[agentId],
                        [session.id]: session,
                    },
                },
                activeSessionId: {
                    ...state.activeSessionId,
                    [agentId]: session.id,
                },
                isLoading: { ...state.isLoading, [agentId]: false },
            }));

            return session;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create session';
            set(state => ({
                isLoading: { ...state.isLoading, [agentId]: false },
                error: { ...state.error, [agentId]: errorMessage },
            }));
            throw err;
        }
    },

    loadSessions: async (agentId) => {
        try {
            set(state => ({
                isLoading: { ...state.isLoading, [agentId]: true },
                error: { ...state.error, [agentId]: null },
            }));

            const sessions = await fetchSessions(agentId);
            const sessionMap: Record<string, AgentSession> = {};
            for (const session of sessions) {
                sessionMap[session.id] = session;
            }

            set(state => ({
                sessions: {
                    ...state.sessions,
                    [agentId]: sessionMap,
                },
                isLoading: { ...state.isLoading, [agentId]: false },
            }));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load sessions';
            set(state => ({
                isLoading: { ...state.isLoading, [agentId]: false },
                error: { ...state.error, [agentId]: errorMessage },
            }));
        }
    },

    setActiveSession: (agentId, sessionId) => {
        set(state => ({
            activeSessionId: {
                ...state.activeSessionId,
                [agentId]: sessionId,
            },
        }));
    },

    getActiveSession: (agentId) => {
        const state = get();
        const sessionId = state.activeSessionId[agentId];
        if (!sessionId) return null;
        return state.sessions[agentId]?.[sessionId] ?? null;
    },

    getSessionsForAgent: (agentId) => {
        const agentSessions = get().sessions[agentId] ?? {};
        return Object.values(agentSessions)
            .filter(s => !s.isArchived)
            .sort((a, b) => b.lastActiveAt.getTime() - a.lastActiveAt.getTime());
    },

    updateSession: async (agentId, sessionId, updates) => {
        try {
            await updateSessionAPI(agentId, sessionId, updates);

            set(state => ({
                sessions: {
                    ...state.sessions,
                    [agentId]: {
                        ...state.sessions[agentId],
                        [sessionId]: {
                            ...state.sessions[agentId]?.[sessionId],
                            ...updates,
                            lastActiveAt: new Date(),
                        } as AgentSession,
                    },
                },
            }));
        } catch (err) {
            console.error('[AgentSessionStore] Update failed:', err);
            throw err;
        }
    },

    renameSession: async (agentId, sessionId, newTitle) => {
        await get().updateSession(agentId, sessionId, { title: newTitle });
    },

    archiveSession: async (agentId, sessionId) => {
        await get().updateSession(agentId, sessionId, { isArchived: true });
    },

    deleteSession: async (agentId, sessionId) => {
        try {
            await deleteSessionAPI(agentId, sessionId);

            set(state => {
                const { [sessionId]: _, ...remainingSessions } = state.sessions[agentId] ?? {};
                const isActive = state.activeSessionId[agentId] === sessionId;

                return {
                    sessions: {
                        ...state.sessions,
                        [agentId]: remainingSessions,
                    },
                    activeSessionId: isActive
                        ? { ...state.activeSessionId, [agentId]: null }
                        : state.activeSessionId,
                };
            });
        } catch (err) {
            console.error('[AgentSessionStore] Delete failed:', err);
            throw err;
        }
    },

    // --- Message Operations ---

    saveMessages: async (agentId, sessionId, messages) => {
        try {
            await saveMessagesAPI(agentId, sessionId, messages);

            // Update session metadata
            const lastMessage = messages[messages.length - 1];
            const preview = lastMessage?.content?.substring(0, 100) || '';

            set(state => ({
                sessions: {
                    ...state.sessions,
                    [agentId]: {
                        ...state.sessions[agentId],
                        [sessionId]: {
                            ...state.sessions[agentId]?.[sessionId],
                            messageCount: messages.length,
                            preview,
                            lastActiveAt: new Date(),
                        } as AgentSession,
                    },
                },
            }));
        } catch (err) {
            console.error('[AgentSessionStore] Save messages failed:', err);
            throw err;
        }
    },

    loadMessages: async (agentId, sessionId) => {
        try {
            return await loadMessagesAPI(agentId, sessionId);
        } catch (err) {
            console.error('[AgentSessionStore] Load messages failed:', err);
            return [];
        }
    },

    addMemory: async (agentId, sessionId, memory) => {
        try {
            await addMemoryAPI(agentId, sessionId, memory);

            set(state => {
                const session = state.sessions[agentId]?.[sessionId];
                if (!session) return state;

                return {
                    sessions: {
                        ...state.sessions,
                        [agentId]: {
                            ...state.sessions[agentId],
                            [sessionId]: {
                                ...session,
                                memories: [...(session.memories || []), memory],
                            },
                        },
                    },
                };
            });
        } catch (err) {
            console.error('[AgentSessionStore] Add memory failed:', err);
        }
    },

    extractMemory: async (agentId, sessionId, content, sourceMessageId) => {
        try {
            const result = await extractMemoryAPI(agentId, sessionId, content, sourceMessageId);

            // If memory was extracted and stored, update local state
            if (result.extracted && result.memory) {
                set(state => {
                    const session = state.sessions[agentId]?.[sessionId];
                    if (!session) return state;

                    return {
                        sessions: {
                            ...state.sessions,
                            [agentId]: {
                                ...state.sessions[agentId],
                                [sessionId]: {
                                    ...session,
                                    memories: [...(session.memories || []), result.memory!],
                                },
                            },
                        },
                    };
                });
            }

            return {
                extracted: result.extracted,
                memory: result.memory,
                wasResolved: result.wasResolved,
            };
        } catch (err) {
            console.error('[AgentSessionStore] Extract memory failed:', err);
            return { extracted: false };
        }
    },

    // --- Utility ---

    generateTitle: (firstMessage) => {
        // Take first 50 chars of message, trim to last word boundary
        const trimmed = firstMessage.substring(0, 50);
        const lastSpace = trimmed.lastIndexOf(' ');
        const title = lastSpace > 20 ? trimmed.substring(0, lastSpace) : trimmed;
        return title + (firstMessage.length > 50 ? '...' : '');
    },

    clearAgentSessions: (agentId) => {
        set(state => ({
            sessions: {
                ...state.sessions,
                [agentId]: {},
            },
            activeSessionId: {
                ...state.activeSessionId,
                [agentId]: null,
            },
        }));
    },
}));

// ============================================================================
// Selectors
// ============================================================================

/** Get recent sessions for an agent (max 10) */
export const selectRecentSessions = (agentId: string) => (state: AgentSessionStore) =>
    state.getSessionsForAgent(agentId).slice(0, 10);

/** Get active session for an agent */
export const selectActiveSession = (agentId: string) => (state: AgentSessionStore) =>
    state.getActiveSession(agentId);

/** Check if sessions are loading for an agent */
export const selectIsLoading = (agentId: string) => (state: AgentSessionStore) =>
    state.isLoading[agentId] ?? false;
