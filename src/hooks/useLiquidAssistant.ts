/**
 * useLiquidAssistant Hook
 * 
 * React hook for communicating with the LiquidOS Project Assistant.
 * Provides chat functionality with the Gemini-powered knowledge agent.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useResourceStore } from '@/stores/resourceStore';
import { compileContext, type ClientCompiledContext } from '@/utils/compileContext';
import { useFocusedTarget } from '@/hooks/useFocusedTarget';
import { useOptionalLiquidClient } from '@/liquid-engine/react';

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export interface LiquidAssistantState {
    messages: Message[];
    isLoading: boolean;
    error: string | null;
}

export interface LiquidAssistantActions {
    sendMessage: (prompt: string) => Promise<void>;
    clearMessages: () => void;
    clearError: () => void;
}

export type UseLiquidAssistantReturn = LiquidAssistantState & LiquidAssistantActions;

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Hook for interacting with the LiquidOS Project Assistant
 */
export function useLiquidAssistant(): UseLiquidAssistantReturn {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const target = useFocusedTarget();
    const compiledRef = useRef<ClientCompiledContext | null>(null);
    const liquidClient = useOptionalLiquidClient();

    // Sync compiled context to LiquidClient whenever target changes
    useEffect(() => {
        const cached = useResourceStore.getState().targetCache[`${target.ownerType}:${target.ownerId}`] || [];
        if (cached.length > 0) {
            const compiled = compileContext(cached, { tokenBudget: 8000 });
            compiledRef.current = compiled;
            liquidClient?.setCompiledContext(compiled);
        } else {
            liquidClient?.setCompiledContext(null);
        }
    }, [target.ownerType, target.ownerId, liquidClient]);

    const sendMessage = useCallback(async (prompt: string) => {
        if (!prompt.trim() || isLoading) return;

        // Add user message
        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: prompt,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        setError(null);

        try {
            // Client-side context compilation (fast path)
            const cached = useResourceStore.getState().targetCache[`${target.ownerType}:${target.ownerId}`] || [];
            if (cached.length > 0) {
                compiledRef.current = compileContext(cached, { tokenBudget: 8000 });
            }

            // Also trigger server-side canonical compilation (async, updates for next message)
            fetch(`${API_BASE}/api/resources/compile/${target.ownerType}/${target.ownerId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentQuery: prompt, tokenBudget: 8000 }),
            }).then(async (res) => {
                if (res.ok) {
                    const serverCompiled = await res.json();
                    // Update compiled context with richer server result for next message
                    if (serverCompiled.systemPrompt) {
                        compiledRef.current = serverCompiled;
                        liquidClient?.setCompiledContext(serverCompiled);
                    }
                }
            }).catch(() => { /* non-blocking */ });

            const response = await fetch(`${API_BASE}/agents/project-assistant/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    context: compiledRef.current?.systemPrompt || undefined,
                    tools: compiledRef.current?.tools || undefined,
                    ragStoreIds: compiledRef.current?.ragStoreIds || undefined,
                }),
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();

            // Add assistant response
            const assistantMessage: Message = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: data.text || 'No response received.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to get response';
            setError(errorMessage);

            // Add error message as assistant response
            const errorMsg: Message = {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: `Error: ${errorMessage}`,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading]);

    const clearMessages = useCallback(() => {
        setMessages([]);
        setError(null);
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        messages,
        isLoading,
        error,
        sendMessage,
        clearMessages,
        clearError,
    };
}

export default useLiquidAssistant;
