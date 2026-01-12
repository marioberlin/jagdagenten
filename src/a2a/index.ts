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

// Client
export {
    A2AClient,
    A2AError,
    createA2AClient,
    discoverAgent,
    useA2AClient,
    type A2AClientConfig,
    type TaskStreamEvent,
    type TaskStatusUpdateEvent,
    type TaskArtifactUpdateEvent,
    type TaskMessageEvent,
} from './client';

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
