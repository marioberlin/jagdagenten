/**
 * Agent Chat Store
 *
 * Manages state for agent chat windows opened from AgentHub.
 * Allows AgentHub to pass agent data to independently opened chat windows.
 */

import { create } from 'zustand';
import type { CuratedAgent } from '@/services/agents/registry';

export type AgentConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'working' | 'error';

export interface StoredChatMessage {
    id: string;
    role: 'user' | 'agent';
    content: string;
    timestamp: Date;
    error?: string;
}

interface AgentChatState {
    /** Map of agent ID to agent data for open chats */
    openAgents: Record<string, CuratedAgent>;

    /** Currently focused agent chat ID */
    focusedAgentId: string | null;

    /** Connection status for each agent */
    connectionStatus: Record<string, AgentConnectionStatus>;

    /** Messages for each agent (for copy-to-clipboard feature) */
    agentMessages: Record<string, StoredChatMessage[]>;
}

interface AgentChatActions {
    /** Register an agent for opening a chat window */
    openAgentChat: (agent: CuratedAgent) => void;

    /** Close an agent chat */
    closeAgentChat: (agentId: string) => void;

    /** Set the focused agent */
    setFocusedAgent: (agentId: string | null) => void;

    /** Get agent data by ID */
    getAgent: (agentId: string) => CuratedAgent | null;

    /** Check if an agent chat is open */
    isAgentChatOpen: (agentId: string) => boolean;

    /** Update connection status for an agent */
    setConnectionStatus: (agentId: string, status: AgentConnectionStatus) => void;

    /** Update messages for an agent (for copy feature) */
    setAgentMessages: (agentId: string, messages: StoredChatMessage[]) => void;

    /** Get messages for an agent */
    getAgentMessages: (agentId: string) => StoredChatMessage[];
}

type AgentChatStore = AgentChatState & AgentChatActions;

export const useAgentChatStore = create<AgentChatStore>((set, get) => ({
    openAgents: {},
    focusedAgentId: null,
    connectionStatus: {},
    agentMessages: {},

    openAgentChat: (agent) => {
        set((state) => ({
            openAgents: {
                ...state.openAgents,
                [agent.id]: agent,
            },
            focusedAgentId: agent.id,
            connectionStatus: {
                ...state.connectionStatus,
                [agent.id]: 'connecting',
            },
        }));
    },

    closeAgentChat: (agentId) => {
        set((state) => {
            const { [agentId]: _, ...remaining } = state.openAgents;
            const { [agentId]: __, ...remainingStatus } = state.connectionStatus;
            return {
                openAgents: remaining,
                connectionStatus: remainingStatus,
                focusedAgentId: state.focusedAgentId === agentId ? null : state.focusedAgentId,
            };
        });
    },

    setFocusedAgent: (agentId) => {
        set({ focusedAgentId: agentId });
    },

    getAgent: (agentId) => {
        return get().openAgents[agentId] ?? null;
    },

    isAgentChatOpen: (agentId) => {
        return agentId in get().openAgents;
    },

    setConnectionStatus: (agentId, status) => {
        set((state) => ({
            connectionStatus: {
                ...state.connectionStatus,
                [agentId]: status,
            },
        }));
    },

    setAgentMessages: (agentId, messages) => {
        set((state) => ({
            agentMessages: {
                ...state.agentMessages,
                [agentId]: messages,
            },
        }));
    },

    getAgentMessages: (agentId) => {
        return get().agentMessages[agentId] ?? [];
    },
}));

/** Selector: Get all open agents as array */
export const selectOpenAgents = (state: AgentChatStore) =>
    Object.values(state.openAgents);

/** Selector: Get the focused agent */
export const selectFocusedAgent = (state: AgentChatStore) =>
    state.focusedAgentId ? state.openAgents[state.focusedAgentId] : null;

/** Selector: Get the focused agent's connection status */
export const selectFocusedAgentStatus = (state: AgentChatStore): AgentConnectionStatus | null =>
    state.focusedAgentId ? state.connectionStatus[state.focusedAgentId] ?? null : null;
