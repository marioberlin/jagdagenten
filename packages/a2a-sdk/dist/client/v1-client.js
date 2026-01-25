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
// ============================================================================
// Error Types
// ============================================================================
export class A2AClientError extends Error {
    constructor(message, code, data, retryable = false, correlationId) {
        super(message);
        this.code = code;
        this.data = data;
        this.retryable = retryable;
        this.correlationId = correlationId;
        this.name = 'A2AClientError';
    }
    static fromJSONRPCError(error, correlationId) {
        const retryable = A2AClientError.isRetryableError(error.code);
        return new A2AClientError(error.message, error.code, error.data, retryable, correlationId);
    }
    static isRetryableError(code) {
        // Server errors and some client errors are retryable
        const retryableCodes = [
            v1.A2A_ERROR_CODES.INTERNAL_ERROR,
            -32000, // Generic server error
            -32099, // Rate limited
        ];
        return retryableCodes.includes(code);
    }
}
export class A2ATimeoutError extends A2AClientError {
    constructor(correlationId) {
        super('Request timed out', -32000, undefined, true, correlationId);
        this.name = 'A2ATimeoutError';
    }
}
export class A2AConnectionError extends A2AClientError {
    constructor(message, correlationId) {
        super(message, -32001, undefined, true, correlationId);
        this.name = 'A2AConnectionError';
    }
}
// ============================================================================
// A2A v1.0 Client
// ============================================================================
export class A2AClient {
    constructor(config) {
        this.config = {
            baseUrl: config.baseUrl.replace(/\/$/, ''),
            authToken: config.authToken,
            headers: config.headers ?? {},
            timeout: config.timeout ?? 30000,
            autoRetry: config.autoRetry ?? true,
            maxRetries: config.maxRetries ?? 3,
            enableA2UI: config.enableA2UI ?? true,
            protocolVersion: config.protocolVersion ?? '1.0',
            heartbeatInterval: config.heartbeatInterval ?? 30000,
            requestIdGenerator: config.requestIdGenerator ?? this.generateUUID,
            // RPC path - defaults to '/a2a', but can be '' for remote agents that accept RPC at base URL
            rpcPath: config.rpcPath !== undefined ? config.rpcPath : '/a2a',
        };
    }
    // ==========================================================================
    // Agent Discovery
    // ==========================================================================
    /**
     * Fetch the agent card from /.well-known/agent.json
     * Results are cached for 5 minutes
     */
    async getAgentCard(context) {
        const now = Date.now();
        if (this.agentCardCache && this.agentCardCache.expiresAt > now) {
            return this.agentCardCache.card;
        }
        const response = await this.httpRequest(`${this.config.baseUrl}/.well-known/agent-card.json`, { method: 'GET' }, context);
        this.agentCardCache = {
            card: response,
            expiresAt: now + 5 * 60 * 1000, // 5 minute cache
        };
        return response;
    }
    /**
     * Get authenticated extended card (if supported)
     */
    async getAuthenticatedExtendedCard(context) {
        return this.rpcCall(v1.V1_METHODS.GET_AUTHENTICATED_EXTENDED_CARD, undefined, context);
    }
    // ==========================================================================
    // Message Sending
    // ==========================================================================
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
    async sendMessage(params, context) {
        // Add A2UI extension if enabled
        if (this.config.enableA2UI && params.message.extensions === undefined) {
            params.message.extensions = ['a2ui'];
        }
        return this.rpcCall(v1.V1_METHODS.SEND_MESSAGE, params, context);
    }
    /**
     * Send a simple text message
     */
    async sendText(text, options, context) {
        const messageId = this.config.requestIdGenerator();
        const message = {
            messageId,
            role: v1.Role.USER,
            parts: [{ text }],
            contextId: options?.contextId,
            extensions: this.config.enableA2UI ? ['a2ui'] : undefined,
        };
        return this.sendMessage({ message, configuration: options?.configuration }, context);
    }
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
    async *sendMessageStreaming(params, context) {
        // Add A2UI extension if enabled
        if (this.config.enableA2UI && params.message.extensions === undefined) {
            params.message.extensions = ['a2ui'];
        }
        // Set streaming in configuration
        if (!params.configuration) {
            params.configuration = {};
        }
        params.configuration.blocking = false;
        yield* this.streamRpcCall(v1.V1_METHODS.SEND_MESSAGE, params, context);
    }
    /**
     * Stream a simple text message
     */
    async *streamText(text, options, context) {
        const messageId = this.config.requestIdGenerator();
        const message = {
            messageId,
            role: v1.Role.USER,
            parts: [{ text }],
            contextId: options?.contextId,
            extensions: this.config.enableA2UI ? ['a2ui'] : undefined,
        };
        yield* this.sendMessageStreaming({ message, configuration: options?.configuration }, context);
    }
    // ==========================================================================
    // Task Management
    // ==========================================================================
    /**
     * Get task by ID
     */
    async getTask(taskId, options, context) {
        return this.rpcCall(v1.V1_METHODS.GET_TASK, { id: taskId, historyLength: options?.historyLength }, context);
    }
    /**
     * Cancel a running task
     */
    async cancelTask(taskId, context) {
        return this.rpcCall(v1.V1_METHODS.CANCEL_TASK, { id: taskId }, context);
    }
    /**
     * List tasks, optionally filtered by context
     */
    async listTasks(params, context) {
        return this.rpcCall(v1.V1_METHODS.LIST_TASKS, params, context);
    }
    /**
     * Resubscribe to task updates (for resuming interrupted streams)
     */
    async *resubscribe(taskId, context) {
        yield* this.streamRpcCall(v1.V1_METHODS.RESUBSCRIBE, { id: taskId }, context);
    }
    // ==========================================================================
    // Push Notifications
    // ==========================================================================
    /**
     * Set push notification callback for a task
     */
    async setTaskCallback(config, context) {
        return this.rpcCall(v1.V1_METHODS.SET_TASK_PUSH_NOTIFICATION_CONFIG, config, context);
    }
    /**
     * Get push notification callback for a task
     */
    async getTaskCallback(taskId, context) {
        return this.rpcCall(v1.V1_METHODS.GET_TASK_PUSH_NOTIFICATION_CONFIG, { id: taskId }, context);
    }
    /**
     * Delete push notification callback for a task
     */
    async deleteTaskCallback(taskId, context) {
        await this.rpcCall(v1.V1_METHODS.DELETE_TASK_PUSH_NOTIFICATION_CONFIG, { id: taskId }, context);
    }
    // ==========================================================================
    // Utility Methods
    // ==========================================================================
    /**
     * Extract A2UI parts from a task's artifacts
     */
    extractA2UIParts(task) {
        if (!task.artifacts)
            return [];
        const a2uiParts = [];
        for (const artifact of task.artifacts) {
            for (const part of artifact.parts) {
                if (v1.isDataPart(part) && part.data.type === 'a2ui') {
                    a2uiParts.push(part);
                }
            }
        }
        return a2uiParts;
    }
    /**
     * Extract text from a message
     */
    extractText(message) {
        return message.parts
            .filter(v1.isTextPart)
            .map(p => p.text)
            .join('\n');
    }
    /**
     * Check if agent supports a capability
     */
    async supportsCapability(capability, context) {
        const card = await this.getAgentCard(context);
        const value = card.capabilities?.[capability];
        return value === true;
    }
    /**
     * Close client and cleanup resources
     */
    async close() {
        this.agentCardCache = undefined;
    }
    // ==========================================================================
    // Private Methods
    // ==========================================================================
    async rpcCall(method, params, context) {
        const correlationId = context?.correlationId ?? this.config.requestIdGenerator();
        const requestId = this.config.requestIdGenerator();
        const request = {
            jsonrpc: '2.0',
            id: requestId,
            method,
            params: params,
        };
        let lastError;
        const maxAttempts = this.config.autoRetry ? this.config.maxRetries : 1;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const response = await this.httpRequest(`${this.config.baseUrl}${this.config.rpcPath}`, {
                    method: 'POST',
                    body: JSON.stringify(request),
                }, context, correlationId);
                if ('error' in response) {
                    throw A2AClientError.fromJSONRPCError(response.error, correlationId);
                }
                return response.result;
            }
            catch (error) {
                if (error instanceof A2AClientError) {
                    lastError = error;
                    if (!error.retryable || attempt >= maxAttempts) {
                        throw error;
                    }
                    // Exponential backoff with jitter to prevent thundering herd
                    const baseDelay = Math.pow(2, attempt - 1) * 1000;
                    const jitter = Math.random() * 200; // 0-200ms jitter
                    await this.delay(baseDelay + jitter);
                }
                else {
                    throw new A2AConnectionError(error instanceof Error ? error.message : 'Unknown error', correlationId);
                }
            }
        }
        throw lastError ?? new A2AClientError('Unknown error', -32000);
    }
    async *streamRpcCall(method, params, context) {
        const correlationId = context?.correlationId ?? this.config.requestIdGenerator();
        const requestId = this.config.requestIdGenerator();
        const request = {
            jsonrpc: '2.0',
            id: requestId,
            method,
            params: params,
        };
        const headers = this.buildHeaders(correlationId);
        headers['Accept'] = 'text/event-stream';
        const controller = new AbortController();
        const connectionTimeout = context?.timeout ?? this.config.timeout;
        // Use context signal if provided
        if (context?.signal) {
            context.signal.addEventListener('abort', () => controller.abort());
        }
        // Set connection timeout (abort if no response within timeout)
        const connectionTimeoutId = setTimeout(() => controller.abort(), connectionTimeout);
        try {
            const response = await fetch(`${this.config.baseUrl}${this.config.rpcPath}/stream`, {
                method: 'POST',
                headers,
                body: JSON.stringify(request),
                signal: controller.signal,
            });
            // Clear connection timeout once connected
            clearTimeout(connectionTimeoutId);
            if (!response.ok) {
                throw new A2AConnectionError(`HTTP ${response.status}: ${response.statusText}`, correlationId);
            }
            if (!response.body) {
                throw new A2AConnectionError('No response body', correlationId);
            }
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let lastEventTime = Date.now();
            // Heartbeat timeout tracking
            let heartbeatTimedOut = false;
            const heartbeatChecker = setInterval(() => {
                const now = Date.now();
                if (now - lastEventTime > this.config.heartbeatInterval * 2) {
                    heartbeatTimedOut = true;
                    controller.abort();
                }
            }, this.config.heartbeatInterval);
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done)
                        break;
                    lastEventTime = Date.now();
                    buffer += decoder.decode(value, { stream: true });
                    // Parse SSE events
                    const lines = buffer.split('\n');
                    buffer = lines.pop() ?? '';
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '')
                                continue;
                            try {
                                const event = JSON.parse(data);
                                const streamEvent = this.parseStreamEvent(event, correlationId);
                                if (streamEvent) {
                                    yield streamEvent;
                                    // Check for completion
                                    if (streamEvent.type === 'complete' || streamEvent.type === 'error') {
                                        return;
                                    }
                                }
                            }
                            catch (parseError) {
                                // Log malformed events for debugging but continue processing
                                if (process.env.NODE_ENV === 'development') {
                                    console.warn('[A2A SDK] Malformed SSE event:', data, parseError);
                                }
                            }
                        }
                        else if (line.startsWith('event: heartbeat')) {
                            yield { type: 'heartbeat', timestamp: new Date().toISOString() };
                        }
                    }
                }
            }
            finally {
                clearInterval(heartbeatChecker);
                reader.releaseLock();
            }
            // Handle heartbeat timeout after cleanup
            if (heartbeatTimedOut) {
                throw new A2ATimeoutError(correlationId);
            }
        }
        catch (error) {
            // Ensure connection timeout is cleared on error
            clearTimeout(connectionTimeoutId);
            if (error instanceof A2AClientError) {
                yield { type: 'error', error };
            }
            else if (error instanceof Error && error.name === 'AbortError') {
                yield { type: 'error', error: new A2ATimeoutError(correlationId) };
            }
            else {
                yield {
                    type: 'error',
                    error: new A2AConnectionError(error instanceof Error ? error.message : 'Stream error', correlationId),
                };
            }
        }
    }
    parseStreamEvent(event, correlationId) {
        if (typeof event !== 'object' || event === null)
            return null;
        // Check for JSON-RPC error
        if ('error' in event) {
            const rpcError = event;
            return {
                type: 'error',
                error: A2AClientError.fromJSONRPCError(rpcError.error, correlationId),
            };
        }
        // Check for result (final task)
        if ('result' in event) {
            return { type: 'complete', task: event.result };
        }
        // Check for status update
        if ('status' in event) {
            return { type: 'status', data: event };
        }
        // Check for artifact update
        if ('artifact' in event) {
            return { type: 'artifact', data: event };
        }
        return null;
    }
    async httpRequest(url, init, context, correlationId) {
        const headers = this.buildHeaders(correlationId ?? this.config.requestIdGenerator());
        const timeout = context?.timeout ?? this.config.timeout;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        // Link to context signal if provided
        if (context?.signal) {
            context.signal.addEventListener('abort', () => controller.abort());
        }
        try {
            const response = await fetch(url, {
                ...init,
                headers: { ...headers, ...init.headers },
                signal: controller.signal,
            });
            if (!response.ok) {
                throw new A2AConnectionError(`HTTP ${response.status}: ${response.statusText}`, correlationId);
            }
            return await response.json();
        }
        catch (error) {
            if (error instanceof A2AClientError)
                throw error;
            if (error instanceof Error && error.name === 'AbortError') {
                throw new A2ATimeoutError(correlationId);
            }
            throw new A2AConnectionError(error instanceof Error ? error.message : 'Request failed', correlationId);
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
    buildHeaders(correlationId) {
        const headers = {
            'Content-Type': 'application/json',
            [v1.A2A_HEADERS.PROTOCOL_VERSION]: this.config.protocolVersion,
            [v1.A2A_HEADERS.REQUEST_ID]: correlationId,
            ...this.config.headers,
        };
        if (this.config.authToken) {
            headers['Authorization'] = `Bearer ${this.config.authToken}`;
        }
        if (this.config.enableA2UI) {
            headers['X-A2A-Extensions'] = 'a2ui';
        }
        return headers;
    }
    generateUUID() {
        // Use native crypto.randomUUID when available (Node 15.6+, modern browsers)
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }
        // Fallback for older environments
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
// ============================================================================
// Factory Function
// ============================================================================
/**
 * Create a new A2A v1.0 client
 */
export function createA2AClient(config) {
    return new A2AClient(config);
}
/**
 * Create a client from an agent URL (fetches agent card first)
 */
export async function createA2AClientFromUrl(agentUrl, options) {
    const client = new A2AClient({ baseUrl: agentUrl, ...options });
    const agentCard = await client.getAgentCard();
    return { client, agentCard };
}
