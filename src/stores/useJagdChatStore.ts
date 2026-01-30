/**
 * Jagd Chat Store
 *
 * Zustand store for AI chat with the hunting advisor.
 * Manages messages, loading state, and communication with the backend.
 */

import { create } from 'zustand';

// ============================================================================
// Types
// ============================================================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  toolCalls?: Array<{
    name: string;
    status: 'pending' | 'completed' | 'error';
    result?: string;
  }>;
}

interface JagdChatState {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
}

interface JagdChatActions {
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
}

export type JagdChatStore = JagdChatState & JagdChatActions;

// ============================================================================
// API Client
// ============================================================================

const API_BASE = '/api/v1/jagd';

interface ChatResponse {
  response: string;
  toolCalls?: Array<{ name: string; result: string }>;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: JagdChatState = {
  messages: [],
  loading: false,
  error: null,
};

// ============================================================================
// Store
// ============================================================================

export const useJagdChatStore = create<JagdChatStore>()((set, _get) => ({
  ...initialState,

  sendMessage: async (content: string) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      loading: true,
      error: null,
    }));

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: content }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errorBody.error || `HTTP ${response.status}`);
      }

      const data: ChatResponse = await response.json();

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
        toolCalls: data.toolCalls?.map((tc) => ({
          name: tc.name,
          status: 'completed' as const,
          result: tc.result,
        })),
      };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        loading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to send message',
        loading: false,
      });
    }
  },

  clearChat: () => {
    set(initialState);
  },
}));
