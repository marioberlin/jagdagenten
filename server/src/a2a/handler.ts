/**
 * A2A Protocol Handler
 *
 * Handles A2A JSON-RPC requests for the LiquidCrypto server.
 * Implements the Agent-to-Agent protocol for external agent communication.
 *
 * @see https://a2a-protocol.org
 */

import { randomUUID } from 'crypto';
import type {
    JsonRpcRequest,
    JsonRpcResponse,
    JsonRpcError,
    Task,
    TaskState,
    A2AMessage,
    Artifact,
    A2UIMessage,
    SendMessageParams,
    TaskQueryParams,
    TaskListParams,
    AgentCard,
} from './types.js';
import { JSON_RPC_ERRORS, TERMINAL_STATES } from './types.js';

// ============================================================================
// Task Store
// ============================================================================

interface TaskStore {
    tasks: Map<string, Task>;
    contextIndex: Map<string, Set<string>>; // contextId -> taskIds
}

const store: TaskStore = {
    tasks: new Map(),
    contextIndex: new Map(),
};

// ============================================================================
// Agent Card
// ============================================================================

/**
 * LiquidCrypto Agent Card (A2A v1.0 compliant)
 */
export function getAgentCard(baseUrl: string): AgentCard {
    return {
        // Required A2A v1.0 fields
        protocolVersions: ['1.0'],
        name: 'LiquidCrypto AI',
        description: 'AI-powered cryptocurrency trading assistant with rich UI generation',
        version: '1.0.0',
        supportedInterfaces: [
            { url: `${baseUrl}/a2a`, protocolBinding: 'JSONRPC' },
        ],
        capabilities: {
            streaming: true,
            pushNotifications: false,
            stateTransitionHistory: true,
            extendedAgentCard: false,
            extensions: [],
        },
        defaultInputModes: ['text/plain'],
        defaultOutputModes: ['text/plain', 'application/json'],
        skills: [
            {
                id: 'portfolio',
                name: 'Portfolio Management',
                description: 'View and manage cryptocurrency portfolios',
                tags: ['crypto', 'portfolio', 'trading'],
                examples: ['Show my portfolio', 'What are my holdings?'],
            },
            {
                id: 'trading',
                name: 'Trading Assistant',
                description: 'Execute trades and analyze market conditions',
                tags: ['crypto', 'trading', 'analysis'],
                examples: ['Buy 0.1 BTC', 'What\'s the price of ETH?'],
            },
            {
                id: 'charts',
                name: 'Chart Generation',
                description: 'Generate interactive charts and visualizations',
                tags: ['charts', 'visualization', 'data'],
                examples: ['Show BTC price chart', 'Compare ETH and SOL'],
            },
        ],
        // Optional fields
        documentationUrl: `${baseUrl}/docs`,
        provider: {
            organization: 'LiquidCrypto',
            url: 'https://liquidcrypto.io',
        },
        extensions: {
            a2ui: {
                version: '0.8',
                supportedComponents: [
                    'Row', 'Column', 'Card', 'List', 'Tabs',
                    'Text', 'Image', 'Icon', 'Button', 'TextField',
                    'Checkbox', 'Slider', 'Divider',
                ],
            },
        },
    };
}

// ============================================================================
// Task Management
// ============================================================================

function createTask(contextId?: string): Task {
    const taskId = randomUUID();
    const ctx = contextId || randomUUID();

    const task: Task = {
        id: taskId,
        contextId: ctx,
        status: {
            state: 'submitted',
            timestamp: new Date().toISOString(),
        },
        artifacts: [],
        history: [],
    };

    store.tasks.set(taskId, task);

    // Update context index
    if (!store.contextIndex.has(ctx)) {
        store.contextIndex.set(ctx, new Set());
    }
    store.contextIndex.get(ctx)!.add(taskId);

    return task;
}

function updateTaskState(taskId: string, state: TaskState, message?: A2AMessage): Task | null {
    const task = store.tasks.get(taskId);
    if (!task) return null;

    task.status = {
        state,
        message,
        timestamp: new Date().toISOString(),
    };

    if (message) {
        task.history = task.history || [];
        task.history.push(message);
    }

    return task;
}

function addArtifact(taskId: string, artifact: Artifact): Task | null {
    const task = store.tasks.get(taskId);
    if (!task) return null;

    task.artifacts = task.artifacts || [];
    task.artifacts.push(artifact);

    return task;
}

// ============================================================================
// A2UI Generation
// ============================================================================

/**
 * Generates A2UI messages for a response
 * This is a placeholder - actual implementation would integrate with AI
 */
function generateA2UI(prompt: string): A2UIMessage[] {
    // Example: Generate a simple response card
    return [
        {
            type: 'beginRendering',
            surfaceId: 'response-surface',
            rootComponentId: 'root',
            styling: {
                primaryColor: '#6366f1',
                fontFamily: 'Inter, system-ui, sans-serif',
            },
        },
        {
            type: 'surfaceUpdate',
            surfaceId: 'response-surface',
            components: [
                {
                    id: 'root',
                    component: {
                        Card: {
                            children: ['content'],
                        },
                    },
                },
                {
                    id: 'content',
                    component: {
                        Column: {
                            children: ['title', 'message'],
                        },
                    },
                },
                {
                    id: 'title',
                    component: {
                        Text: {
                            text: { literalString: 'Response' },
                            semantic: 'h2',
                        },
                    },
                },
                {
                    id: 'message',
                    component: {
                        Text: {
                            text: { literalString: `Processing: ${prompt}` },
                        },
                    },
                },
            ],
        },
    ];
}

// ============================================================================
// Request Handlers
// ============================================================================

type MethodHandler<P = unknown, R = unknown> = (params: P) => Promise<R>;

const handlers: Record<string, MethodHandler> = {
    // A2A v1.0: GetAgentCard (note: clients should use /.well-known/agent-card.json instead)
    'GetAgentCard': async () => {
        return getAgentCard(process.env.BASE_URL || 'http://localhost:3001');
    },

    // A2A v1.0: SendMessage
    'SendMessage': async (params: SendMessageParams) => {
        const { message, configuration } = params;

        // Create task
        const task = createTask();

        // Add user message to history
        task.history?.push(message);

        // Update to working state
        updateTaskState(task.id, 'working');

        // Extract text from message (A2A v1.0: parts use mutually exclusive fields, not discriminators)
        const textParts = message.parts.filter((p: { text?: string }) => p.text !== undefined);
        const prompt = textParts.map((p: { text?: string }) => p.text || '').join('\n');

        // Check if A2UI is requested
        const wantsA2UI = configuration?.acceptedOutputModes?.includes('a2ui') ||
            message.metadata?.['X-A2A-Extensions']?.includes('a2ui');

        // Generate response
        let artifact: Artifact;

        if (wantsA2UI) {
            const a2uiMessages = generateA2UI(prompt);
            artifact = {
                name: 'ui',
                parts: [{
                    // A2A v1.0: data part for structured content
                    data: { a2ui: a2uiMessages },
                }],
            };
        } else {
            artifact = {
                name: 'response',
                parts: [{
                    // A2A v1.0: text field directly, no type discriminator
                    text: `Processed: ${prompt}`,
                }],
            };
        }

        addArtifact(task.id, artifact);

        // Complete task
        const completedTask = updateTaskState(task.id, 'completed', {
            role: 'agent',
            parts: artifact.parts,
        });

        return completedTask;
    },

    // A2A v1.0: GetTask
    'GetTask': async (params: TaskQueryParams) => {
        const task = store.tasks.get(params.id);
        if (!task) {
            throw { ...JSON_RPC_ERRORS.TASK_NOT_FOUND, data: { taskId: params.id } };
        }

        // Apply history limit if specified
        if (params.historyLength !== undefined && task.history) {
            const limited = { ...task };
            limited.history = task.history.slice(-params.historyLength);
            return limited;
        }

        return task;
    },

    // A2A v1.0: ListTasks
    'ListTasks': async (params: TaskListParams) => {
        let tasks = Array.from(store.tasks.values());

        // Filter by context
        if (params.contextId) {
            const taskIds = store.contextIndex.get(params.contextId);
            if (taskIds) {
                tasks = tasks.filter(t => taskIds.has(t.id));
            } else {
                tasks = [];
            }
        }

        // Filter by state
        if (params.state && params.state.length > 0) {
            tasks = tasks.filter(t => params.state!.includes(t.status.state));
        }

        // Apply pagination
        const offset = params.offset || 0;
        const limit = params.limit || 20;
        tasks = tasks.slice(offset, offset + limit);

        return tasks;
    },

    // A2A v1.0: CancelTask
    'CancelTask': async (params: TaskQueryParams) => {
        const task = store.tasks.get(params.id);
        if (!task) {
            throw { ...JSON_RPC_ERRORS.TASK_NOT_FOUND, data: { taskId: params.id } };
        }

        if (TERMINAL_STATES.includes(task.status.state)) {
            throw { ...JSON_RPC_ERRORS.TASK_NOT_CANCELABLE, data: { state: task.status.state } };
        }

        return updateTaskState(task.id, 'cancelled');
    },
};

// ============================================================================
// Main Handler
// ============================================================================

/**
 * Handles an A2A JSON-RPC request
 */
export async function handleA2ARequest(
    request: JsonRpcRequest
): Promise<JsonRpcResponse> {
    const { id, method, params } = request;

    // Validate JSON-RPC version
    if (request.jsonrpc !== '2.0') {
        return {
            jsonrpc: '2.0',
            id: id || null,
            error: JSON_RPC_ERRORS.INVALID_REQUEST,
        };
    }

    // Get handler
    const handler = handlers[method];
    if (!handler) {
        return {
            jsonrpc: '2.0',
            id,
            error: { ...JSON_RPC_ERRORS.METHOD_NOT_FOUND, data: { method } },
        };
    }

    try {
        const result = await handler(params);
        return {
            jsonrpc: '2.0',
            id,
            result,
        };
    } catch (error) {
        // Handle known errors
        if (typeof error === 'object' && error !== null && 'code' in error) {
            return {
                jsonrpc: '2.0',
                id,
                error: error as JsonRpcError,
            };
        }

        // Handle unknown errors
        console.error('[A2A Handler] Error:', error);
        return {
            jsonrpc: '2.0',
            id,
            error: {
                ...JSON_RPC_ERRORS.INTERNAL_ERROR,
                data: error instanceof Error ? error.message : String(error),
            },
        };
    }
}

/**
 * Handles an A2A request from HTTP
 */
export async function handleA2AHttpRequest(
    body: unknown,
    headers: Record<string, string>
): Promise<JsonRpcResponse | JsonRpcResponse[]> {
    // Check for A2UI extension header
    const a2uiExtension = headers['x-a2a-extensions'];
    const wantsA2UI = a2uiExtension?.includes('a2ui');

    // Handle batch requests
    if (Array.isArray(body)) {
        const responses = await Promise.all(
            body.map(req => handleA2ARequest(req as JsonRpcRequest))
        );
        return responses;
    }

    // Handle single request
    const request = body as JsonRpcRequest;

    // Inject A2UI preference into params if header is set
    if (wantsA2UI && request.params && typeof request.params === 'object') {
        (request.params as Record<string, unknown>).metadata = {
            ...(request.params as Record<string, unknown>).metadata,
            'X-A2A-Extensions': a2uiExtension,
        };
    }

    return handleA2ARequest(request);
}

// ============================================================================
// Exports
// ============================================================================

export { store as taskStore };
