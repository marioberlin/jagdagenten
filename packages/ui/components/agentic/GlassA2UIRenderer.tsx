/**
 * GlassA2UIRenderer
 *
 * Renders A2UI payloads from external A2A agents using the Liquid Glass
 * component system. Supports streaming updates and progressive rendering.
 *
 * @see https://a2ui.org
 * @see src/a2a/transformer.ts
 */

import React, { useState, useEffect, useCallback } from 'react';
import { GlassDynamicUI } from './GlassDynamicUI';
import type { UINode } from './GlassDynamicUI';
import type { A2UIMessage } from '../../a2a/types';
import {
    transformA2UIToGlass,
    validateA2UIPayload,
} from '../../a2a/transformer';
import { GLASS_COMPONENT_CATALOG } from '../../a2a/types';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';

// ============================================================================
// Types
// ============================================================================

export interface GlassA2UIRendererProps extends React.HTMLAttributes<HTMLDivElement> {
    /** A2UI messages to render */
    messages: A2UIMessage[];
    /** Callback when user triggers an action */
    onAction?: (actionId: string, data?: unknown) => void;
    /** Enable streaming mode for progressive updates */
    streaming?: boolean;
    /** Show loading state */
    loading?: boolean;
    /** Custom error component */
    errorFallback?: React.ReactNode;
    /** Enable validation (default: true) */
    validate?: boolean;
    /** Surface ID to render (renders all if not specified) */
    surfaceId?: string;
}

interface RenderState {
    surfaces: Map<string, UINode>;
    errors: string[];
    lastUpdate: number;
}

// ============================================================================
// Component
// ============================================================================

export const GlassA2UIRenderer = React.forwardRef<HTMLDivElement, GlassA2UIRendererProps>(
    (
        {
            className,
            messages,
            onAction,
            streaming = false,
            loading = false,
            errorFallback,
            validate = true,
            surfaceId,
            ...props
        },
        ref
    ) => {
        const [renderState, setRenderState] = useState<RenderState>({
            surfaces: new Map(),
            errors: [],
            lastUpdate: Date.now(),
        });

        // Validate and transform messages
        useEffect(() => {
            if (!messages || messages.length === 0) {
                setRenderState({
                    surfaces: new Map(),
                    errors: [],
                    lastUpdate: Date.now(),
                });
                return;
            }

            // Validate if enabled
            if (validate) {
                const validation = validateA2UIPayload(messages, GLASS_COMPONENT_CATALOG);
                if (!validation.valid) {
                    setRenderState({
                        surfaces: new Map(),
                        errors: validation.errors,
                        lastUpdate: Date.now(),
                    });
                    return;
                }
            }

            // Transform to Glass nodes
            try {
                const surfaces = transformA2UIToGlass(messages, onAction);
                setRenderState({
                    surfaces,
                    errors: [],
                    lastUpdate: Date.now(),
                });
            } catch (error) {
                console.error('[GlassA2UIRenderer] Transform error:', error);
                setRenderState({
                    surfaces: new Map(),
                    errors: [error instanceof Error ? error.message : 'Transform failed'],
                    lastUpdate: Date.now(),
                });
            }
        }, [messages, onAction, validate]);

        // Handle action callback
        const handleAction = useCallback(
            (actionId: string, data?: unknown) => {
                onAction?.(actionId, data);
            },
            [onAction]
        );

        // Render loading state
        if (loading) {
            return (
                <GlassContainer
                    ref={ref}
                    className={cn('glass-a2ui-renderer p-4', className)}
                    {...props}
                >
                    <div className="flex items-center justify-center gap-2 text-secondary animate-pulse">
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-200" />
                        <span className="ml-2">Generating UI...</span>
                    </div>
                </GlassContainer>
            );
        }

        // Render errors
        if (renderState.errors.length > 0) {
            if (errorFallback) {
                return <>{errorFallback}</>;
            }

            return (
                <GlassContainer
                    ref={ref}
                    className={cn('glass-a2ui-renderer p-4 border-red-500/20', className)}
                    {...props}
                >
                    <div className="text-red-400">
                        <p className="font-medium mb-2">A2UI Render Error</p>
                        <ul className="text-sm list-disc list-inside">
                            {renderState.errors.map((error, i) => (
                                <li key={i}>{error}</li>
                            ))}
                        </ul>
                    </div>
                </GlassContainer>
            );
        }

        // Render empty state
        if (renderState.surfaces.size === 0) {
            return (
                <GlassContainer
                    ref={ref}
                    className={cn('glass-a2ui-renderer p-4', className)}
                    {...props}
                >
                    <div className="text-secondary text-center">
                        No UI to display
                    </div>
                </GlassContainer>
            );
        }

        // Render specific surface or all surfaces
        const surfacesToRender = surfaceId
            ? renderState.surfaces.has(surfaceId)
                ? [[surfaceId, renderState.surfaces.get(surfaceId)!] as const]
                : []
            : Array.from(renderState.surfaces.entries());

        return (
            <div
                ref={ref}
                className={cn('glass-a2ui-renderer space-y-4', className)}
                {...props}
            >
                {surfacesToRender.map(([id, node]) => (
                    <div key={id} data-surface-id={id}>
                        <GlassDynamicUI
                            schema={node}
                            onAction={handleAction}
                            className={streaming ? 'transition-opacity duration-300' : ''}
                        />
                    </div>
                ))}
            </div>
        );
    }
);

GlassA2UIRenderer.displayName = 'GlassA2UIRenderer';

// ============================================================================
// Streaming Hook
// ============================================================================

/**
 * Hook for streaming A2UI updates
 */
export function useA2UIStream(
    initialMessages: A2UIMessage[] = []
): {
    messages: A2UIMessage[];
    addMessage: (message: A2UIMessage) => void;
    addMessages: (messages: A2UIMessage[]) => void;
    reset: () => void;
    isStreaming: boolean;
    setStreaming: (streaming: boolean) => void;
} {
    const [messages, setMessages] = useState<A2UIMessage[]>(initialMessages);
    const [isStreaming, setStreaming] = useState(false);

    const addMessage = useCallback((message: A2UIMessage) => {
        setMessages(prev => [...prev, message]);
    }, []);

    const addMessages = useCallback((newMessages: A2UIMessage[]) => {
        setMessages(prev => [...prev, ...newMessages]);
    }, []);

    const reset = useCallback(() => {
        setMessages([]);
        setStreaming(false);
    }, []);

    return {
        messages,
        addMessage,
        addMessages,
        reset,
        isStreaming,
        setStreaming,
    };
}

// ============================================================================
// Connected Component (with A2A client)
// ============================================================================

export interface ConnectedA2UIRendererProps extends Omit<GlassA2UIRendererProps, 'messages'> {
    /** A2A agent URL */
    agentUrl: string;
    /** Initial prompt to send */
    initialPrompt?: string;
    /** Auth token for the agent */
    authToken?: string;
}

/**
 * A2UI Renderer connected to an A2A agent
 */
export const ConnectedA2UIRenderer: React.FC<ConnectedA2UIRendererProps> = ({
    agentUrl,
    initialPrompt,
    authToken,
    onAction,
    ...props
}) => {
    const [messages, setMessages] = useState<A2UIMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Send message to agent
    const sendMessage = useCallback(
        async (text: string) => {
            setLoading(true);
            setError(null);

            try {
                const { createA2AClient, a2ui } = await import('@liquidcrypto/a2a-sdk');
                const client = createA2AClient({
                    baseUrl: agentUrl,
                    authToken,
                    enableA2UI: true
                });

                // Get capabilities to verify usage
                await client.getCard();

                const task = await client.sendText(text);

                // Extract A2UI parts from task
                const allMessages: A2UIMessage[] = [];
                if (task.artifacts) {
                    for (const artifact of task.artifacts) {
                        if (a2ui.isA2UIArtifact(artifact)) {
                            allMessages.push(...a2ui.extractA2UIMessages(artifact));
                        }
                    }
                }

                setMessages(allMessages);
            } catch (err) {
                console.error('[ConnectedA2UIRenderer] Error:', err);
                setError(err instanceof Error ? err.message : 'Failed to communicate with agent');
            } finally {
                setLoading(false);
            }
        },
        [agentUrl, authToken]
    );

    // Send initial prompt on mount
    useEffect(() => {
        if (initialPrompt) {
            sendMessage(initialPrompt);
        }
    }, [initialPrompt, sendMessage]);

    // Handle actions by forwarding to agent
    const handleAction = useCallback(
        async (actionId: string, data?: unknown) => {
            onAction?.(actionId, data);

            // Optionally send action back to agent
            if (actionId.startsWith('submit_') || actionId === 'submit') {
                await sendMessage(JSON.stringify({ action: actionId, data }));
            }
        },
        [onAction, sendMessage]
    );

    if (error) {
        return (
            <GlassContainer className="p-4 border-red-500/20">
                <div className="text-red-400">
                    <p className="font-medium">Agent Error</p>
                    <p className="text-sm">{error}</p>
                </div>
            </GlassContainer>
        );
    }

    return (
        <GlassA2UIRenderer
            messages={messages}
            loading={loading}
            onAction={handleAction}
            {...props}
        />
    );
};

// ============================================================================
// Exports
// ============================================================================

export type { RenderState };
