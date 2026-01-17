/**
 * A2A Protocol Module
 *
 * Provides A2A (Agent-to-Agent) protocol support for LiquidCrypto.
 * Enables communication with external A2A-compliant agents and
 * rendering A2UI payloads using the Liquid Glass component system.
 *
 * @see https://a2a-protocol.org
 * @see https://a2ui.org
 */

// Types
export * from './types';

// Client (from a2a-sdk)
export {
    createA2AClient,
    A2AClientError as A2AError,
    type A2AClient,
    type A2AClientConfig,
    type StreamEvent as TaskStreamEvent,
} from '@liquidcrypto/a2a-sdk';

// Event types from SDK
export type { TaskStatusUpdateEvent, TaskArtifactUpdateEvent } from '@liquidcrypto/a2a-sdk';

// Custom event type for backward compatibility
export type TaskMessageEvent = {
    type: 'message';
    content: string;
};

// Hook (from local hooks)
export { useA2AClient } from '../hooks/useA2AClient';

// Agent discovery utility
export const discoverAgent = async (url: string) => {
    const response = await fetch(`${url}/.well-known/agent.json`);
    if (!response.ok) throw new Error(`Failed to discover agent at ${url}`);
    return response.json();
};

// Transformer
export {
    transformA2UI,
    transformA2UIToGlass,
    validateA2UIPayload,
    createTransformerState,
    processA2UIMessage,
    resolveBinding,
    type TransformerState,
    type SurfaceState,
} from './transformer';

// Examples
export { allExamples, restaurantFinderExamples, rizzchartsExamples } from './examples';
