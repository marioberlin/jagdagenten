import React, { createContext, useContext, useEffect, useMemo, ReactNode } from 'react';
import { LiquidClient } from './client';
import { liquidClientFactory, generateSessionId } from './clientFactory';

// ============ Session Context ============

interface SessionContextValue {
    sessionId: string;
}

const SessionContext = createContext<SessionContextValue | null>(null);

// ============ Client Context ============

const LiquidContext = createContext<LiquidClient | null>(null);

/**
 * LiquidProvider - Legacy provider that accepts a pre-created client
 * @deprecated Use LiquidSessionProvider instead for session isolation
 */
export const LiquidProvider: React.FC<{ client: LiquidClient; children: ReactNode }> = ({ client, children }) => {
    return (
        <LiquidContext.Provider value={client}>
            {children}
        </LiquidContext.Provider>
    );
};

// ============ Session-Scoped Provider ============

interface LiquidSessionProviderProps {
    children: ReactNode;
    /** Optional session ID. If not provided, one will be generated. */
    sessionId?: string;
}

/**
 * LiquidSessionProvider - Provides session-scoped LiquidClient
 *
 * Each session gets its own isolated client instance.
 * Sessions are automatically cleaned up after inactivity.
 *
 * @example
 * ```tsx
 * // App.tsx
 * <LiquidSessionProvider>
 *   <App />
 * </LiquidSessionProvider>
 * ```
 */
export const LiquidSessionProvider: React.FC<LiquidSessionProviderProps> = ({
    children,
    sessionId: providedSessionId
}) => {
    // Generate or use provided session ID
    const sessionId = useMemo(() => {
        return providedSessionId || generateSessionId();
    }, [providedSessionId]);

    // Get the client for this session
    const client = useMemo(() => {
        return liquidClientFactory.getClient(sessionId);
    }, [sessionId]);

    // Cleanup on unmount (e.g., tab close)
    useEffect(() => {
        const handleUnload = () => {
            liquidClientFactory.destroySession(sessionId);
        };

        window.addEventListener('beforeunload', handleUnload);

        return () => {
            window.removeEventListener('beforeunload', handleUnload);
            // Note: We don't destroy the session on component unmount
            // because React StrictMode causes double mount/unmount.
            // The factory's cleanup timer will handle stale sessions.
        };
    }, [sessionId]);

    return (
        <SessionContext.Provider value={{ sessionId }}>
            <LiquidContext.Provider value={client}>
                {children}
            </LiquidContext.Provider>
        </SessionContext.Provider>
    );
};

// ============ Hooks ============

/**
 * Get the current session ID
 */
export function useSessionId(): string {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error('useSessionId must be used within a LiquidSessionProvider');
    }
    return context.sessionId;
}

/**
 * Get the current session ID, or null if not in a session context
 */
export function useOptionalSessionId(): string | null {
    const context = useContext(SessionContext);
    return context?.sessionId ?? null;
}

/**
 * Get the LiquidClient for the current session
 */
export function useLiquidClient(): LiquidClient {
    const client = useContext(LiquidContext);
    if (!client) {
        throw new Error('useLiquidClient must be used within a LiquidProvider or LiquidSessionProvider');
    }
    return client;
}

/**
 * Get the LiquidClient if available, or null
 */
export function useOptionalLiquidClient(): LiquidClient | null {
    return useContext(LiquidContext);
}

// Re-export new hooks and components
export { useLiquidReadable } from './useLiquidReadable';
export { useLiquidAction, type ActionParameter } from './useLiquidAction';
export { useRenderToolCall, type RenderToolConfig } from './useRenderToolCall';
export { LiquidSmartComponent, type LiquidSmartComponentProps } from './LiquidSmartComponent';
export { useFlowState, type FlowStage, type FlowState, type FlowStateOptions } from './useFlowState';
export { type ReadableContext, type ActionDefinition } from './client';

// Re-export factory utilities
export { liquidClientFactory, generateSessionId } from './clientFactory';
export type { LiquidClient } from './client';
