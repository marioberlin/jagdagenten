// @ts-nocheck
/**
 * A2A Protocol Client
 *
 * @deprecated This client is deprecated. Use the SDK client from '@liquidcrypto/a2a-sdk' instead.
 * Example: import { createA2AClient } from '@liquidcrypto/a2a-sdk';
 *
 * Client for communicating with A2A-compliant agents.
 * Supports JSON-RPC over HTTP(S) with SSE streaming.
 *
 * @see https://a2a-protocol.org
 */

import type {
    AgentCard,
    A2AMessage,
    Task,
    TaskStatus,
    JsonRpcRequest,
    JsonRpcResponse,
    SendMessageParams,
    TaskQueryParams,
    TaskListParams,
    A2UIPart,
    Part,
} from './types';

// ============================================================================
// Configuration
// ============================================================================

export interface A2AClientConfig {
    /** Base URL of the A2A agent */
    agentUrl: string;
    /** Optional authentication token */
    authToken?: string;
    /** Request timeout in milliseconds */
    timeout?: number;
    /** Enable A2UI extension */
    enableA2UI?: boolean;
    /** Custom headers */
    headers?: Record<string, string>;
}

// ============================================================================
// A2A Client Class
// ============================================================================

export class A2AClient {
    private config: Required<Omit<A2AClientConfig, 'authToken' | 'headers'>> & Pick<A2AClientConfig, 'authToken' | 'headers'>;
    private agentCard: AgentCard | null = null;
    private requestId = 0;

    constructor(config: A2AClientConfig) {
        this.config = {
            agentUrl: config.agentUrl.replace(/\/$/, ''), // Remove trailing slash
            authToken: config.authToken,
            timeout: config.timeout ?? 30000,
            enableA2UI: config.enableA2UI ?? true,
            headers: config.headers,
        };
    }

    // ========================================================================
    // Agent Discovery
    // ========================================================================

    /**
     * Fetches the agent card describing the agent's capabilities
     */
    async getAgentCard(): Promise<AgentCard> {
        if (this.agentCard) {
            return this.agentCard;
        }

        const response = await this.rpcCall<AgentCard>('agent/card', {});
        this.agentCard = response;
        return response;
    }

    /**
     * Checks if the agent supports A2UI
     */
    async supportsA2UI(): Promise<boolean> {
        const card = await this.getAgentCard();
        return !!card.extensions?.a2ui;
    }

    /**
     * Gets the agent's A2UI extension info
     */
    async getA2UIExtension(): Promise<{ version: string; supportedComponents: string[] } | null> {
        const card = await this.getAgentCard();
        return card.extensions?.a2ui || null;
    }

    // ========================================================================
    // Message Sending
    // ========================================================================

    /**
     * Sends a message to the agent and waits for response
     */
    async sendMessage(
        message: A2AMessage,
        options?: {
            acceptedOutputModes?: string[];
            historyLength?: number;
        }
    ): Promise<Task> {
        const params: SendMessageParams = {
            message,
            configuration: {
                acceptedOutputModes: options?.acceptedOutputModes,
                historyLength: options?.historyLength,
            },
        };

        return this.rpcCall<Task>('message/send', params);
    }

    /**
     * Sends a message and streams the response
     */
    async *streamMessage(
        message: A2AMessage,
        options?: {
            acceptedOutputModes?: string[];
            historyLength?: number;
        }
    ): AsyncGenerator<TaskStreamEvent> {
        const params: SendMessageParams = {
            message,
            configuration: {
                acceptedOutputModes: options?.acceptedOutputModes,
                historyLength: options?.historyLength,
            },
        };

        yield* this.rpcStream('message/stream', params);
    }

    /**
     * Sends a text message (convenience method)
     */
    async sendText(text: string): Promise<Task> {
        return this.sendMessage({
            role: 'user',
            parts: [{ type: 'text', text }],
        });
    }

    /**
     * Sends a text message and streams the response
     */
    async *streamText(text: string): AsyncGenerator<TaskStreamEvent> {
        yield* this.streamMessage({
            role: 'user',
            parts: [{ type: 'text', text }],
        });
    }

    // ========================================================================
    // Task Management
    // ========================================================================

    /**
     * Gets a task by ID
     */
    async getTask(id: string, historyLength?: number): Promise<Task> {
        const params: TaskQueryParams = { id, historyLength };
        return this.rpcCall<Task>('tasks/get', params);
    }

    /**
     * Lists tasks with optional filters
     */
    async listTasks(params?: TaskListParams): Promise<Task[]> {
        return this.rpcCall<Task[]>('tasks/list', params || {});
    }

    /**
     * Cancels a task
     */
    async cancelTask(id: string): Promise<Task> {
        return this.rpcCall<Task>('tasks/cancel', { id });
    }

    /**
     * Subscribes to task updates
     */
    async *subscribeToTask(id: string): AsyncGenerator<TaskStreamEvent> {
        yield* this.rpcStream('tasks/subscribe', { id });
    }

    // ========================================================================
    // A2UI Helpers
    // ========================================================================

    /**
     * Extracts A2UI parts from a task's artifacts
     */
    extractA2UIParts(task: Task): A2UIPart[] {
        const a2uiParts: A2UIPart[] = [];

        if (task.artifacts) {
            for (const artifact of task.artifacts) {
                for (const part of artifact.parts) {
                    if (part.type === 'a2ui') {
                        a2uiParts.push(part);
                    }
                }
            }
        }

        return a2uiParts;
    }

    /**
     * Checks if a task has A2UI content
     */
    hasA2UIContent(task: Task): boolean {
        return this.extractA2UIParts(task).length > 0;
    }

    // ========================================================================
    // Internal RPC Methods
    // ========================================================================

    private getNextRequestId(): number {
        return ++this.requestId;
    }

    private getHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...this.config.headers,
        };

        if (this.config.authToken) {
            headers['Authorization'] = `Bearer ${this.config.authToken}`;
        }

        if (this.config.enableA2UI) {
            headers['X-A2A-Extensions'] = 'https://a2ui.org/a2a-extension/a2ui/v0.8';
        }

        return headers;
    }

    private async rpcCall<T>(method: string, params: unknown): Promise<T> {
        const request: JsonRpcRequest = {
            jsonrpc: '2.0',
            id: this.getNextRequestId(),
            method,
            params: params as Record<string, unknown>,
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        try {
            const response = await fetch(this.config.agentUrl, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(request),
                signal: controller.signal,
            });

            if (!response.ok) {
                throw new A2AError(
                    `HTTP error: ${response.status} ${response.statusText}`,
                    response.status
                );
            }

            const json = await response.json() as JsonRpcResponse<T>;

            if (json.error) {
                throw new A2AError(
                    json.error.message,
                    json.error.code,
                    json.error.data
                );
            }

            return json.result as T;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    private async *rpcStream(method: string, params: unknown): AsyncGenerator<TaskStreamEvent> {
        const request: JsonRpcRequest = {
            jsonrpc: '2.0',
            id: this.getNextRequestId(),
            method,
            params: params as Record<string, unknown>,
        };

        const controller = new AbortController();

        try {
            const response = await fetch(this.config.agentUrl, {
                method: 'POST',
                headers: {
                    ...this.getHeaders(),
                    'Accept': 'text/event-stream',
                },
                body: JSON.stringify(request),
                signal: controller.signal,
            });

            if (!response.ok) {
                throw new A2AError(
                    `HTTP error: ${response.status} ${response.statusText}`,
                    response.status
                );
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new A2AError('Response body is not readable', -1);
            }

            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Parse SSE events
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            return;
                        }

                        try {
                            const event = JSON.parse(data) as TaskStreamEvent;
                            yield event;
                        } catch (e) {
                            console.warn('[A2A Client] Failed to parse SSE event:', data);
                        }
                    }
                }
            }
        } finally {
            controller.abort();
        }
    }
}

// ============================================================================
// Stream Event Types
// ============================================================================

export interface TaskStatusUpdateEvent {
    type: 'status_update';
    taskId: string;
    status: TaskStatus;
}

export interface TaskArtifactUpdateEvent {
    type: 'artifact_update';
    taskId: string;
    artifact: {
        name?: string;
        parts: Part[];
        index?: number;
        append?: boolean;
        lastChunk?: boolean;
    };
}

export interface TaskMessageEvent {
    type: 'message';
    taskId: string;
    message: A2AMessage;
}

export type TaskStreamEvent =
    | TaskStatusUpdateEvent
    | TaskArtifactUpdateEvent
    | TaskMessageEvent;

// ============================================================================
// Error Handling
// ============================================================================

export class A2AError extends Error {
    constructor(
        message: string,
        public code: number,
        public data?: unknown
    ) {
        super(message);
        this.name = 'A2AError';
    }
}

/**
 * Creates an A2A client for an agent URL
 */
export function createA2AClient(url: string, options?: Omit<A2AClientConfig, 'agentUrl'>): A2AClient {
    return new A2AClient({
        agentUrl: url,
        ...options,
    });
}

/**
 * Discovers an agent's capabilities from its well-known URL
 */
export async function discoverAgent(baseUrl: string): Promise<AgentCard> {
    const wellKnownUrl = `${baseUrl.replace(/\/$/, '')}/.well-known/agent.json`;

    const response = await fetch(wellKnownUrl);
    if (!response.ok) {
        throw new A2AError(
            `Failed to discover agent: ${response.status} ${response.statusText}`,
            response.status
        );
    }

    return response.json();
}

// ============================================================================
// React Hook
// ============================================================================

/**
 * React hook for A2A client
 * Note: Import React where using this hook
 */
export function useA2AClient(config: A2AClientConfig) {
    // This would use React hooks - keeping as placeholder for now
    // Implementation should be in a separate file that imports React
    return new A2AClient(config);
}
