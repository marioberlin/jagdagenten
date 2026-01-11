/**
 * useSecureNLWeb.ts
 * 
 * React hook for the Secure NLWeb pipeline.
 * Combines Guard Dog security with NLWeb query decomposition.
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import { GeminiService } from '../../services/gemini';
import { NLWebOrchestrator, type PipelineStage, type SecureSession } from './NLWebOrchestrator';
import type { ConversationTurn } from './Decontextualizer';

// ============================================================================
// TYPES
// ============================================================================

export interface UseSecureNLWebOptions {
    /** Gemini API key (required) */
    apiKey: string;
    /** Knowledge base items from Settings (Schema.org JSON-LD or plain text) */
    knowledgeBase?: string[];
    /** Initial session state (for restoring from storage) */
    initialSession?: Partial<SecureSession>;
    /** Callback when the main agent should generate a response */
    onSynthesize?: (context: SynthesisContext) => Promise<string>;
}

export interface SynthesisContext {
    resolvedQuery: string;
    retrievedContext: string[];
    preferredLanguage: string;
    userPreferences: Record<string, string>;
}

export interface SecureNLWebState {
    stage: PipelineStage;
    stageMessage: string;
    isProcessing: boolean;
    wasBlocked: boolean;
    lastRefusal?: string;
    session: SecureSession;
}

export interface UseSecureNLWebReturn {
    /** Current pipeline state */
    state: SecureNLWebState;
    /** Process a user query through the pipeline */
    processQuery: (query: string) => Promise<string | null>;
    /** Add a turn to conversation history (for decontextualization) */
    addToHistory: (role: 'user' | 'assistant', content: string) => void;
    /** Clear conversation history */
    clearHistory: () => void;
    /** Update user preferences in session memory */
    setPreference: (key: string, value: string) => void;
    /** Reset the session */
    resetSession: () => void;
}

// ============================================================================
// DEFAULT SESSION
// ============================================================================

function createDefaultSession(): SecureSession {
    return {
        sessionId: `nlweb-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        preferredLanguage: null,
        userPreferences: {},
        blockedAttempts: 0,
        lastActive: Date.now(),
    };
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useSecureNLWeb(options: UseSecureNLWebOptions): UseSecureNLWebReturn {
    const { apiKey, knowledgeBase = [], initialSession, onSynthesize } = options;

    // State
    const [stage, setStage] = useState<PipelineStage>('idle');
    const [stageMessage, setStageMessage] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [wasBlocked, setWasBlocked] = useState(false);
    const [lastRefusal, setLastRefusal] = useState<string>();
    const [session, setSession] = useState<SecureSession>(() => ({
        ...createDefaultSession(),
        ...initialSession,
    }));

    // Refs for mutable state
    const conversationHistory = useRef<ConversationTurn[]>([]);

    // Memoized Gemini service
    const geminiService = useMemo(() => {
        if (!apiKey) return null;
        try {
            // Create a minimal mock client for the service
            const mockClient = {
                getActions: () => [],
                buildContextPrompt: () => '',
                ingest: () => { },
                executeAction: async () => ({}),
            } as any;
            return new GeminiService(apiKey, mockClient);
        } catch (e) {
            console.error('[useSecureNLWeb] Failed to create GeminiService:', e);
            return null;
        }
    }, [apiKey]);

    // Stage change handler
    const handleStageChange = useCallback((newStage: PipelineStage, message: string) => {
        setStage(newStage);
        setStageMessage(message);
    }, []);

    // Main processing function
    const processQuery = useCallback(async (query: string): Promise<string | null> => {
        if (!geminiService) {
            console.error('[useSecureNLWeb] No Gemini service available');
            return null;
        }

        setIsProcessing(true);
        setWasBlocked(false);
        setLastRefusal(undefined);

        try {
            const orchestrator = new NLWebOrchestrator({
                geminiService,
                session,
                conversationHistory: conversationHistory.current,
                knowledgeBase,
                onStageChange: handleStageChange,
            });

            const result = await orchestrator.process(query);

            // Update session from result
            setSession(result.session);

            if (result.blocked) {
                setWasBlocked(true);
                setLastRefusal(result.refusalMessage);
                setStage('blocked');
                return result.refusalMessage || null;
            }

            // If synthesis callback provided, generate response
            if (onSynthesize && result.resolvedQuery) {
                setStage('synthesizing');
                const response = await onSynthesize({
                    resolvedQuery: result.resolvedQuery,
                    retrievedContext: result.retrievedContext || [],
                    preferredLanguage: result.session.preferredLanguage || 'en',
                    userPreferences: result.session.userPreferences,
                });
                setStage('complete');
                return response;
            }

            setStage('complete');
            return result.resolvedQuery || null;

        } catch (error) {
            console.error('[useSecureNLWeb] Pipeline error:', error);
            setStage('idle');
            return null;
        } finally {
            setIsProcessing(false);
        }
    }, [geminiService, session, knowledgeBase, handleStageChange, onSynthesize]);

    // History management
    const addToHistory = useCallback((role: 'user' | 'assistant', content: string) => {
        conversationHistory.current.push({ role, content });
        // Keep only last 20 turns to prevent memory bloat
        if (conversationHistory.current.length > 20) {
            conversationHistory.current = conversationHistory.current.slice(-20);
        }
    }, []);

    const clearHistory = useCallback(() => {
        conversationHistory.current = [];
    }, []);

    // Preference management
    const setPreference = useCallback((key: string, value: string) => {
        setSession(prev => ({
            ...prev,
            userPreferences: { ...prev.userPreferences, [key]: value },
        }));
    }, []);

    // Session reset
    const resetSession = useCallback(() => {
        setSession(createDefaultSession());
        conversationHistory.current = [];
        setStage('idle');
        setWasBlocked(false);
        setLastRefusal(undefined);
    }, []);

    return {
        state: {
            stage,
            stageMessage,
            isProcessing,
            wasBlocked,
            lastRefusal,
            session,
        },
        processQuery,
        addToHistory,
        clearHistory,
        setPreference,
        resetSession,
    };
}
