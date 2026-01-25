/**
 * A2A Protocol v1.0 Client
 *
 * Production-ready client implementation fully compliant with A2A Protocol v1.0.
 * Features:
 * - PascalCase method names (v1.0 compliant)
 * - camelCase field naming
 * - Robust streaming with reconnection and heartbeat
 * - Comprehensive error handling with retryable error detection
 * - Request correlation and tracing
 * - Type-safe API
 */
import * as v1 from '../types/v1.js';
export interface A2AClientConfig {
    /** Base URL of the A2A agent */
    baseUrl: string;
    /** Authentication token (Bearer) */
    authToken?: string;
    /** Custom headers to include in requests */
    headers?: Record<string, string>;
    /** Default request timeout in milliseconds (default: 30000) */
    timeout?: number;
    /** Enable automatic retry for retryable errors (default: true) */
    autoRetry?: boolean;
    /** Maximum retry attempts (default: 3) */
    maxRetries?: number;
    /** Enable A2UI extension support (default: true) */
    enableA2UI?: boolean;
    /** Protocol version to use (default: '1.0') */
    protocolVersion?: '1.0' | '0.x';
    /** Stream heartbeat interval in ms (default: 30000) */
    heartbeatInterval?: number;
    /** Request ID generator (default: UUID) */
    requestIdGenerator?: () => string;
    /** RPC endpoint path (default: '/a2a'). Set to '' for remote agents that accept RPC at base URL */
    rpcPath?: string;
}
export interface RequestContext {
    /** Request timeout override */
    timeout?: number;
    /** Abort signal for cancellation */
    signal?: AbortSignal;
    /** Custom metadata for this request */
    metadata?: Record<string, v1.JSONValue>;
    /** Correlation ID for request tracing */
    correlationId?: string;
}
export declare class A2AClientError extends Error {
    readonly code: number;
    readonly data?: v1.JSONValue;
    readonly retryable: boolean;
    readonly correlationId?: string;
    constructor(message: string, code: number, data?: v1.JSONValue, retryable?: boolean, correlationId?: string);
    static fromJSONRPCError(error: v1.JSONRPCError, correlationId?: string): A2AClientError;
    static isRetryableError(code: number): boolean;
}
export declare class A2ATimeoutError extends A2AClientError {
    constructor(correlationId?: string);
}
export declare class A2AConnectionError extends A2AClientError {
    constructor(message: string, correlationId?: string);
}
export type StreamEvent = {
    type: 'status';
    data: v1.TaskStatusUpdateEvent;
} | {
    type: 'artifact';
    data: v1.TaskArtifactUpdateEvent;
} | {
    type: 'heartbeat';
    timestamp: string;
} | {
    type: 'error';
    error: A2AClientError;
} | {
    type: 'complete';
    task: v1.Task;
};
export declare class A2AClient {
    private config;
    private agentCardCache?;
    constructor(config: A2AClientConfig);
    /**
     * Fetch the agent card from /.well-known/agent.json
     * Results are cached for 5 minutes
     */
    getAgentCard(context?: RequestContext): Promise<v1.AgentCard>;
    /**
     * Get authenticated extended card (if supported)
     */
    getAuthenticatedExtendedCard(context?: RequestContext): Promise<v1.AgentCard>;
    /**
     * Send a message to the agent and wait for completion (blocking mode).
     *
     * @param params - Message parameters including the message content and optional configuration
     * @param context - Optional request context for timeout, abort signal, and correlation ID
     * @returns The completed task with status, artifacts, and history
     * @throws {A2AClientError} If the server returns an error
     * @throws {A2ATimeoutError} If the request times out
     * @throws {A2AConnectionError} If connection fails
     *
     * @example
     * ```typescript
     * const task = await client.sendMessage({
     *   message: { messageId: '123', role: 'user', parts: [{ text: 'Hello' }] },
     *   configuration: { acceptedOutputModes: ['text/plain'] }
     * });
     * console.log(task.status.state); // 'completed'
     * ```
     */
    sendMessage(params: v1.MessageSendParams, context?: RequestContext): Promise<v1.Task>;
    /**
     * Send a simple text message
     */
    sendText(text: string, options?: {
        contextId?: string;
        configuration?: v1.MessageSendConfiguration;
    }, context?: RequestContext): Promise<v1.Task>;
    /**
     * Send a message and receive streaming updates as they occur.
     *
     * The generator yields events as they arrive:
     * - `status`: Task status changed (submitted, working, completed, etc.)
     * - `artifact`: New artifact produced or existing artifact updated
     * - `heartbeat`: Connection keep-alive signal
     * - `error`: Error occurred during streaming
     * - `complete`: Task completed with final result
     *
     * @param params - Message parameters including the message content and optional configuration
     * @param context - Optional request context for timeout, abort signal, and correlation ID
     * @yields {StreamEvent} Events as they occur
     *
     * @example
     * ```typescript
     * for await (const event of client.sendMessageStreaming(params)) {
     *   if (event.type === 'status') {
     *     console.log('Status:', event.data.status.state);
     *   } else if (event.type === 'artifact') {
     *     console.log('Artifact:', event.data.artifact);
     *   } else if (event.type === 'complete') {
     *     console.log('Done:', event.task);
     *   }
     * }
     * ```
     */
    sendMessageStreaming(params: v1.MessageSendParams, context?: RequestContext): AsyncGenerator<StreamEvent, void, unknown>;
    /**
     * Stream a simple text message
     */
    streamText(text: string, options?: {
        contextId?: string;
        configuration?: v1.MessageSendConfiguration;
    }, context?: RequestContext): AsyncGenerator<StreamEvent, void, unknown>;
    /**
     * Get task by ID
     */
    getTask(taskId: string, options?: {
        historyLength?: number;
    }, context?: RequestContext): Promise<v1.Task>;
    /**
     * Cancel a running task
     */
    cancelTask(taskId: string, context?: RequestContext): Promise<v1.Task>;
    /**
     * List tasks, optionally filtered by context
     */
    listTasks(params?: v1.ListTasksParams, context?: RequestContext): Promise<v1.Task[]>;
    /**
     * Resubscribe to task updates (for resuming interrupted streams)
     */
    resubscribe(taskId: string, context?: RequestContext): AsyncGenerator<StreamEvent, void, unknown>;
    /**
     * Set push notification callback for a task
     */
    setTaskCallback(config: v1.TaskPushNotificationConfig, context?: RequestContext): Promise<v1.TaskPushNotificationConfig>;
    /**
     * Get push notification callback for a task
     */
    getTaskCallback(taskId: string, context?: RequestContext): Promise<v1.TaskPushNotificationConfig | null>;
    /**
     * Delete push notification callback for a task
     */
    deleteTaskCallback(taskId: string, context?: RequestContext): Promise<void>;
    /**
     * Extract A2UI parts from a task's artifacts
     */
    extractA2UIParts(task: v1.Task): v1.DataPart[];
    /**
     * Extract text from a message
     */
    extractText(message: v1.Message): string;
    /**
     * Check if agent supports a capability
     */
    supportsCapability(capability: 'streaming' | 'pushNotifications' | 'stateTransitionHistory', context?: RequestContext): Promise<boolean>;
    /**
     * Close client and cleanup resources
     */
    close(): Promise<void>;
    private rpcCall;
    private streamRpcCall;
    private parseStreamEvent;
    private httpRequest;
    private buildHeaders;
    private generateUUID;
    private delay;
}
/**
 * Create a new A2A v1.0 client
 */
export declare function createA2AClient(config: A2AClientConfig): A2AClient;
/**
 * Create a client from an agent URL (fetches agent card first)
 */
export declare function createA2AClientFromUrl(agentUrl: string, options?: Omit<A2AClientConfig, 'baseUrl'>): Promise<{
    client: A2AClient;
    agentCard: v1.AgentCard;
}>;
