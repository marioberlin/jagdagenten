/**
 * Container Runtime Client
 *
 * HTTP client for communicating with the runtime server inside containers.
 *
 * @see docs/LIQUID_CONTAINER_ARCHITECTURE.md - Section 4
 */

import type {
    InitRequest,
    ExecuteRequest,
    ExecuteResponse,
    HealthResponse,
} from './types.js';
import { componentLoggers } from '../logger.js';

const log = componentLoggers.http.child({ component: 'container-client' });

// ============================================================================
// Types
// ============================================================================

interface ClientOptions {
    /** Request timeout in ms */
    timeout?: number;
    /** Retry count for transient failures */
    retries?: number;
    /** Retry delay in ms */
    retryDelay?: number;
}

interface StateResponse {
    mode: string;
    agentId?: string;
    workdir: string;
    envKeys: string[];
    executionCount: number;
    uptime: number;
    hasProcess: boolean;
}

// ============================================================================
// Client Implementation
// ============================================================================

export class ContainerClient {
    private baseUrl: string;
    private options: Required<ClientOptions>;

    constructor(
        ipAddress: string,
        port: number,
        options: ClientOptions = {}
    ) {
        this.baseUrl = `http://${ipAddress}:${port}`;
        this.options = {
            timeout: options.timeout ?? 30000,
            retries: options.retries ?? 3,
            retryDelay: options.retryDelay ?? 1000,
        };
    }

    /**
     * Check if the container is healthy
     */
    async health(): Promise<HealthResponse> {
        return this.request<HealthResponse>('GET', '/health');
    }

    /**
     * Wait for container to be ready
     */
    async waitForReady(timeoutMs: number = 30000): Promise<boolean> {
        const startTime = Date.now();
        const pollInterval = 100;

        while (Date.now() - startTime < timeoutMs) {
            try {
                const health = await this.health();
                if (health.status === 'ok') {
                    return true;
                }
            } catch {
                // Ignore errors during startup
            }

            await new Promise(resolve => setTimeout(resolve, pollInterval));
        }

        return false;
    }

    /**
     * Initialize the container for an agent
     */
    async init(request: InitRequest): Promise<{ status: string; agentId: string; workdir?: string; error?: string }> {
        return this.request('POST', '/init', request);
    }

    /**
     * Execute a command in the container
     */
    async execute(request: ExecuteRequest): Promise<ExecuteResponse> {
        const timeout = request.timeout ?? this.options.timeout;
        return this.request<ExecuteResponse>('POST', '/execute', request, timeout + 5000);
    }

    /**
     * Execute a command with streaming output
     * Returns an async iterator of SSE events
     */
    async *executeStream(request: Omit<ExecuteRequest, 'stream'>): AsyncGenerator<StreamEvent> {
        const params = new URLSearchParams({
            command: request.command,
            ...(request.args && { args: request.args.join(',') }),
            ...(request.timeout && { timeout: request.timeout.toString() }),
            ...(request.cwd && { cwd: request.cwd }),
        });

        const url = `${this.baseUrl}/execute/stream?${params}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'text/event-stream' },
        });

        if (!response.ok) {
            throw new Error(`Stream request failed: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const events = buffer.split('\n\n');
                buffer = events.pop() ?? '';

                for (const event of events) {
                    const parsed = this.parseSSE(event);
                    if (parsed) {
                        yield parsed;
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    }

    /**
     * Reset the container state for reuse
     */
    async reset(): Promise<{ status: string }> {
        return this.request('POST', '/reset');
    }

    /**
     * Shutdown the container gracefully
     */
    async shutdown(): Promise<{ status: string }> {
        return this.request('POST', '/shutdown');
    }

    /**
     * Get current container state (for debugging)
     */
    async getState(): Promise<StateResponse> {
        return this.request<StateResponse>('GET', '/state');
    }

    /**
     * Make an HTTP request with retries
     */
    private async request<T>(
        method: string,
        path: string,
        body?: unknown,
        timeout?: number
    ): Promise<T> {
        const url = `${this.baseUrl}${path}`;
        const requestTimeout = timeout ?? this.options.timeout;
        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= this.options.retries; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), requestTimeout);

                const response = await fetch(url, {
                    method,
                    headers: body ? { 'Content-Type': 'application/json' } : undefined,
                    body: body ? JSON.stringify(body) : undefined,
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorBody = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errorBody}`);
                }

                return await response.json() as T;
            } catch (error) {
                lastError = error as Error;

                // Don't retry on certain errors
                if (
                    error instanceof Error &&
                    (error.name === 'AbortError' || error.message.includes('HTTP 4'))
                ) {
                    throw error;
                }

                if (attempt < this.options.retries) {
                    log.debug({
                        attempt: attempt + 1,
                        maxRetries: this.options.retries,
                        error: (error as Error).message,
                    }, 'Retrying request');

                    await new Promise(resolve =>
                        setTimeout(resolve, this.options.retryDelay * (attempt + 1))
                    );
                }
            }
        }

        throw lastError ?? new Error('Request failed');
    }

    /**
     * Parse a Server-Sent Event
     */
    private parseSSE(text: string): StreamEvent | null {
        const lines = text.split('\n');
        let eventType = 'message';
        let data = '';

        for (const line of lines) {
            if (line.startsWith('event:')) {
                eventType = line.slice(6).trim();
            } else if (line.startsWith('data:')) {
                data = line.slice(5).trim();
            }
        }

        if (!data) return null;

        try {
            const parsed = JSON.parse(data);

            switch (eventType) {
                case 'stdout':
                    return { type: 'stdout', data: parsed.data };
                case 'stderr':
                    return { type: 'stderr', data: parsed.data };
                case 'exit':
                    return {
                        type: 'exit',
                        exitCode: parsed.exitCode,
                        duration: parsed.duration,
                        signal: parsed.signal,
                    };
                case 'timeout':
                    return { type: 'timeout', timeout: parsed.timeout };
                case 'error':
                    return { type: 'error', message: parsed.message };
                default:
                    return null;
            }
        } catch {
            return null;
        }
    }
}

// ============================================================================
// Stream Event Types
// ============================================================================

export type StreamEvent =
    | { type: 'stdout'; data: string }
    | { type: 'stderr'; data: string }
    | { type: 'exit'; exitCode: number; duration: number; signal?: string }
    | { type: 'timeout'; timeout: number }
    | { type: 'error'; message: string };

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a client for a container
 */
export function createContainerClient(
    ipAddress: string,
    port: number,
    options?: ClientOptions
): ContainerClient {
    return new ContainerClient(ipAddress, port, options);
}
