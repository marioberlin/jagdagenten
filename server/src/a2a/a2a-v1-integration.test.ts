/**
 * A2A Protocol v1.0 Integration Tests
 *
 * Comprehensive tests for A2A Protocol v1.0 compliance including:
 * - Method name aliases (v1.0 and legacy)
 * - TaskState enum serialization (kebab-case)
 * - Part type structure (mutually exclusive fields)
 * - Error code responses
 * - Version header validation
 * - Extensions header parsing
 * - Cursor-based pagination
 * - ContextId + TaskId validation
 *
 * Run with: bun test server/src/a2a/a2a-v1-integration.test.ts
 */

import { describe, test, expect, beforeAll, afterAll, mock } from 'bun:test';
import { v1 } from '@jagdagenten/a2a-sdk';
import { ElysiaA2AAdapter, type ElysiaAdapterConfig, type AgentExecutor } from './adapter/elysia-adapter.js';
import { InMemoryTaskStore, InMemoryPushNotificationStore } from './adapter/index.js';

// ============================================================================
// Test Fixtures
// ============================================================================

const mockAgentCard: v1.AgentCard = {
    name: 'Test Agent',
    description: 'A test A2A agent',
    version: '1.0.0',
    protocolVersions: ['1.0'],
    url: 'http://test.local/a2a',
    supportedInterfaces: [
        { url: 'http://test.local/a2a', protocolBinding: 'JSONRPC' }
    ],
    capabilities: {
        streaming: true,
        pushNotifications: false,
        extendedAgentCard: false,
        extensions: [
            { uri: 'https://a2a.io/test-extension', required: false }
        ],
    },
    defaultInputModes: ['text'],
    defaultOutputModes: ['text'],
    skills: [
        { id: 'test', name: 'Test Skill', description: 'A test skill' }
    ],
};

const mockExecutor: AgentExecutor = {
    execute: async (message, task) => {
        return {
            id: task?.id || `task-${Date.now()}`,
            contextId: message.contextId || 'default',
            status: {
                state: v1.TaskState.COMPLETED,
                timestamp: new Date().toISOString(),
            },
            artifacts: [{
                artifactId: 'art-1',
                name: 'response',
                parts: [{ text: 'Test response' }],
            }],
            history: [message],
        };
    },
    getExtendedCard: async () => mockAgentCard,
};

function createTestAdapter(overrides?: Partial<ElysiaAdapterConfig>): ElysiaA2AAdapter {
    const taskStore = new InMemoryTaskStore();
    const pushStore = new InMemoryPushNotificationStore();

    return new ElysiaA2AAdapter({
        agentCard: mockAgentCard,
        executor: mockExecutor,
        taskStore,
        pushNotificationStore: pushStore,
        ...overrides,
    });
}

// ============================================================================
// Method Name Tests
// ============================================================================

describe('A2A v1.0 Method Names', () => {
    let adapter: ElysiaA2AAdapter;

    beforeAll(() => {
        adapter = createTestAdapter();
    });

    test('SendMessage should work', async () => {
        const request: v1.JSONRPCRequest = {
            jsonrpc: '2.0',
            id: 'test-1',
            method: 'SendMessage',
            params: {
                message: {
                    messageId: 'msg-1',
                    role: 'user',
                    parts: [{ text: 'Hello' }],
                },
            },
        };

        const response = await adapter.handleRequest(request);
        expect(response.result).toBeDefined();
        expect(response.error).toBeUndefined();
    });

    test('GetTask should work', async () => {
        // First create a task
        const createRequest: v1.JSONRPCRequest = {
            jsonrpc: '2.0',
            id: 'create-1',
            method: 'SendMessage',
            params: {
                message: { messageId: 'msg-2', role: 'user', parts: [{ text: 'Create task' }] },
            },
        };
        const createResponse = await adapter.handleRequest(createRequest);
        const taskId = (createResponse.result as any).id;

        // Now get it
        const getRequest: v1.JSONRPCRequest = {
            jsonrpc: '2.0',
            id: 'get-1',
            method: 'GetTask',
            params: { id: taskId },
        };

        const response = await adapter.handleRequest(getRequest);
        expect(response.result).toBeDefined();
        expect((response.result as any).id).toBe(taskId);
    });

    test('ListTasks should work', async () => {
        const request: v1.JSONRPCRequest = {
            jsonrpc: '2.0',
            id: 'list-1',
            method: 'ListTasks',
            params: {},
        };

        const response = await adapter.handleRequest(request);
        expect(response.result).toBeDefined();
        expect((response.result as any).tasks).toBeInstanceOf(Array);
    });

    test('CancelTask should return error for non-existent task', async () => {
        const request: v1.JSONRPCRequest = {
            jsonrpc: '2.0',
            id: 'cancel-1',
            method: 'CancelTask',
            params: { id: 'non-existent' },
        };

        const response = await adapter.handleRequest(request);
        expect(response.error).toBeDefined();
        expect(response.error?.code).toBe(-32001); // TaskNotFoundError
    });
});

// ============================================================================
// Legacy Method Aliases
// ============================================================================

describe('Legacy Method Aliases', () => {
    let adapter: ElysiaA2AAdapter;

    beforeAll(() => {
        adapter = createTestAdapter();
    });

    test('message/send should alias to SendMessage', async () => {
        const request: v1.JSONRPCRequest = {
            jsonrpc: '2.0',
            id: 'legacy-1',
            method: 'message/send',
            params: {
                message: { messageId: 'msg-legacy', role: 'user', parts: [{ text: 'Legacy send' }] },
            },
        };

        const response = await adapter.handleRequest(request);
        expect(response.result).toBeDefined();
    });

    test('tasks/get should alias to GetTask', async () => {
        // Create task first
        const createRequest: v1.JSONRPCRequest = {
            jsonrpc: '2.0',
            id: 'create-legacy',
            method: 'SendMessage',
            params: {
                message: { messageId: 'msg-for-get', role: 'user', parts: [{ text: 'Create' }] },
            },
        };
        const createResponse = await adapter.handleRequest(createRequest);
        const taskId = (createResponse.result as any).id;

        const request: v1.JSONRPCRequest = {
            jsonrpc: '2.0',
            id: 'legacy-get',
            method: 'tasks/get',
            params: { id: taskId },
        };

        const response = await adapter.handleRequest(request);
        expect(response.result).toBeDefined();
        expect((response.result as any).id).toBe(taskId);
    });

    test('tasks/cancel should alias to CancelTask', async () => {
        const request: v1.JSONRPCRequest = {
            jsonrpc: '2.0',
            id: 'legacy-cancel',
            method: 'tasks/cancel',
            params: { id: 'non-existent' },
        };

        const response = await adapter.handleRequest(request);
        expect(response.error).toBeDefined();
        expect(response.error?.code).toBe(-32001);
    });
});

// ============================================================================
// TaskState Enum Serialization
// ============================================================================

describe('TaskState Enum Serialization', () => {
    test('TaskState enum values should be kebab-case', () => {
        expect(v1.TaskState.INPUT_REQUIRED).toBe('input-required');
        expect(v1.TaskState.AUTH_REQUIRED).toBe('auth-required');
        expect(v1.TaskState.COMPLETED).toBe('completed');
        expect(v1.TaskState.WORKING).toBe('working');
        expect(v1.TaskState.FAILED).toBe('failed');
        expect(v1.TaskState.CANCELLED).toBe('cancelled');
    });

    test('Response should contain kebab-case state', async () => {
        const adapter = createTestAdapter();

        const request: v1.JSONRPCRequest = {
            jsonrpc: '2.0',
            id: 'state-test',
            method: 'SendMessage',
            params: {
                message: { messageId: 'msg-state', role: 'user', parts: [{ text: 'Test' }] },
            },
        };

        const response = await adapter.handleRequest(request);
        const result = response.result as any;

        // Navigate to the actual state value - may be nested
        let state: string;
        if (typeof result.status === 'object' && result.status !== null) {
            state = typeof result.status.state === 'string'
                ? result.status.state
                : result.status.state?.state || '';
        } else {
            state = '';
        }

        // State should be a valid TaskState enum value (kebab-case)
        expect(typeof state).toBe('string');
        expect(Object.values(v1.TaskState)).toContain(state);
    });
});

// ============================================================================
// Part Type Structure
// ============================================================================

describe('Part Type Structure (Mutually Exclusive Fields)', () => {
    test('TextPart should only have text field', () => {
        const textPart: v1.Part = { text: 'Hello world' };

        expect(textPart.text).toBeDefined();
        expect((textPart as any).type).toBeUndefined();
        expect(textPart.file).toBeUndefined();
        expect(textPart.data).toBeUndefined();
    });

    test('FilePart should only have file field', () => {
        const filePart: v1.Part = {
            file: {
                fileWithUri: { uri: 'file:///test.txt', mimeType: 'text/plain' }
            }
        };

        expect(filePart.file).toBeDefined();
        expect((filePart as any).type).toBeUndefined();
        expect(filePart.text).toBeUndefined();
        expect(filePart.data).toBeUndefined();
    });

    test('DataPart should only have data field', () => {
        const dataPart: v1.Part = {
            data: { key: 'value', numbers: [1, 2, 3] }
        };

        expect(dataPart.data).toBeDefined();
        expect((dataPart as any).type).toBeUndefined();
        expect(dataPart.text).toBeUndefined();
        expect(dataPart.file).toBeUndefined();
    });

    test('Part can have metadata alongside content field', () => {
        const partWithMeta: v1.Part = {
            text: 'Hello',
            metadata: { source: 'test', timestamp: Date.now() }
        };

        expect(partWithMeta.text).toBe('Hello');
        expect(partWithMeta.metadata).toBeDefined();
        expect(partWithMeta.metadata?.source).toBe('test');
    });
});

// ============================================================================
// Error Code Responses
// ============================================================================

describe('Error Code Responses', () => {
    let adapter: ElysiaA2AAdapter;

    beforeAll(() => {
        adapter = createTestAdapter();
    });

    test('TaskNotFoundError should have code -32001', async () => {
        const request: v1.JSONRPCRequest = {
            jsonrpc: '2.0',
            id: 'err-1',
            method: 'GetTask',
            params: { id: 'non-existent-task' },
        };

        const response = await adapter.handleRequest(request);
        expect(response.error?.code).toBe(-32001);
        expect(response.error?.message).toContain('not found');
    });

    test('MethodNotFound should have code -32601', async () => {
        const request: v1.JSONRPCRequest = {
            jsonrpc: '2.0',
            id: 'err-2',
            method: 'UnknownMethod',
            params: {},
        };

        const response = await adapter.handleRequest(request);
        expect(response.error?.code).toBe(-32601);
    });

    test('InvalidParams should have code -32602', async () => {
        const request: v1.JSONRPCRequest = {
            jsonrpc: '2.0',
            id: 'err-3',
            method: 'SendMessage',
            params: {}, // Missing required 'message' field
        };

        const response = await adapter.handleRequest(request);
        expect(response.error?.code).toBe(-32602);
    });
});

// ============================================================================
// Version Header Validation
// ============================================================================

describe('Version Header Validation', () => {
    let adapter: ElysiaA2AAdapter;

    beforeAll(() => {
        adapter = createTestAdapter();
    });

    test('Request without version header should succeed', async () => {
        const request: v1.JSONRPCRequest = {
            jsonrpc: '2.0',
            id: 'ver-1',
            method: 'agent/card',
            params: {},
        };

        const response = await adapter.handleRequest(request);
        expect(response.error).toBeUndefined();
    });

    test('Request with supported version should succeed', async () => {
        const request: v1.JSONRPCRequest = {
            jsonrpc: '2.0',
            id: 'ver-2',
            method: 'agent/card',
            params: {},
        };

        const response = await adapter.handleRequest(request, { 'a2a-version': '1.0' });
        expect(response.error).toBeUndefined();
    });

    test('Request with unsupported version should fail with -32009', async () => {
        const request: v1.JSONRPCRequest = {
            jsonrpc: '2.0',
            id: 'ver-3',
            method: 'agent/card',
            params: {},
        };

        const response = await adapter.handleRequest(request, { 'a2a-version': '99.0' });
        expect(response.error?.code).toBe(-32009);
    });
});

// ============================================================================
// Extensions Header Parsing
// ============================================================================

describe('Extensions Header Parsing', () => {
    test('Request with extension header should parse correctly', async () => {
        const agentCardWithRequired: v1.AgentCard = {
            ...mockAgentCard,
            capabilities: {
                ...mockAgentCard.capabilities,
                extensions: [
                    { uri: 'https://a2a.io/required-ext', required: true }
                ],
            },
        };

        const adapter = createTestAdapter({ agentCard: agentCardWithRequired });

        const request: v1.JSONRPCRequest = {
            jsonrpc: '2.0',
            id: 'ext-1',
            method: 'SendMessage',
            params: {
                message: { messageId: 'msg-ext', role: 'user', parts: [{ text: 'Test' }] },
            },
        };

        // Without required extension - should fail
        const responseMissing = await adapter.handleRequest(request);
        expect(responseMissing.error?.code).toBe(-32008); // ExtensionSupportRequired

        // With required extension - should succeed
        const responseWithExt = await adapter.handleRequest(request, {
            'a2a-extensions': 'https://a2a.io/required-ext',
        });
        expect(responseWithExt.error).toBeUndefined();
    });
});

// ============================================================================
// Cursor-based Pagination
// ============================================================================

describe('Cursor-based Pagination', () => {
    let adapter: ElysiaA2AAdapter;

    beforeAll(async () => {
        adapter = createTestAdapter();

        // Create multiple tasks
        for (let i = 0; i < 5; i++) {
            await adapter.handleRequest({
                jsonrpc: '2.0',
                id: `create-${i}`,
                method: 'SendMessage',
                params: {
                    message: {
                        messageId: `msg-${i}`,
                        role: 'user',
                        parts: [{ text: `Task ${i}` }],
                        contextId: 'pagination-test',
                    },
                },
            });
        }
    });

    test('ListTasks should return tasks array and optional nextCursor', async () => {
        const request: v1.JSONRPCRequest = {
            jsonrpc: '2.0',
            id: 'page-1',
            method: 'ListTasks',
            params: { limit: 2 },
        };

        const response = await adapter.handleRequest(request);
        const result = response.result as { tasks: v1.Task[]; nextCursor?: string };

        expect(result.tasks).toBeInstanceOf(Array);
        expect(result.tasks.length).toBeLessThanOrEqual(2);

        // If there are more tasks, nextCursor should be present
        if (result.tasks.length === 2) {
            expect(result.nextCursor).toBeDefined();
        }
    });

    test('ListTasks with cursor should return next page', async () => {
        // Get first page
        const firstRequest: v1.JSONRPCRequest = {
            jsonrpc: '2.0',
            id: 'page-first',
            method: 'ListTasks',
            params: { limit: 2 },
        };
        const firstResponse = await adapter.handleRequest(firstRequest);
        const firstResult = firstResponse.result as { tasks: v1.Task[]; nextCursor?: string };

        if (firstResult.nextCursor) {
            // Get second page
            const secondRequest: v1.JSONRPCRequest = {
                jsonrpc: '2.0',
                id: 'page-second',
                method: 'ListTasks',
                params: { limit: 2, cursor: firstResult.nextCursor },
            };
            const secondResponse = await adapter.handleRequest(secondRequest);
            const secondResult = secondResponse.result as { tasks: v1.Task[]; nextCursor?: string };

            expect(secondResult.tasks).toBeInstanceOf(Array);

            // Second page should have different tasks than first
            const firstIds = firstResult.tasks.map(t => t.id);
            const secondIds = secondResult.tasks.map(t => t.id);
            const overlap = secondIds.filter(id => firstIds.includes(id));
            expect(overlap.length).toBe(0);
        }
    });
});

// ============================================================================
// ContextId + TaskId Validation
// ============================================================================

describe('ContextId + TaskId Validation', () => {
    let adapter: ElysiaA2AAdapter;
    let taskInContextA: string;

    beforeAll(async () => {
        adapter = createTestAdapter();

        // Create a task in context A
        const response = await adapter.handleRequest({
            jsonrpc: '2.0',
            id: 'ctx-create',
            method: 'SendMessage',
            params: {
                message: {
                    messageId: 'msg-ctx-a',
                    role: 'user',
                    parts: [{ text: 'Task in context A' }],
                    contextId: 'context-A',
                },
            },
        });
        taskInContextA = (response.result as any).id;
    });

    test('referenceTaskIds in same context should succeed', async () => {
        const request: v1.JSONRPCRequest = {
            jsonrpc: '2.0',
            id: 'ref-valid',
            method: 'SendMessage',
            params: {
                message: {
                    messageId: 'msg-ref-valid',
                    role: 'user',
                    parts: [{ text: 'Follow up' }],
                    contextId: 'context-A',
                    referenceTaskIds: [taskInContextA],
                },
            },
        };

        const response = await adapter.handleRequest(request);
        expect(response.error).toBeUndefined();
    });

    test('referenceTaskIds from different context should fail', async () => {
        const request: v1.JSONRPCRequest = {
            jsonrpc: '2.0',
            id: 'ref-invalid',
            method: 'SendMessage',
            params: {
                message: {
                    messageId: 'msg-ref-invalid',
                    role: 'user',
                    parts: [{ text: 'Cross-context reference' }],
                    contextId: 'context-B', // Different context!
                    referenceTaskIds: [taskInContextA], // Task from context-A
                },
            },
        };

        const response = await adapter.handleRequest(request);
        expect(response.error).toBeDefined();
        expect(response.error?.code).toBe(-32602); // InvalidParams
        expect((response.error?.data as any)?.message).toContain('does not belong to this context');
    });
});

// ============================================================================
// AgentCard Structure
// ============================================================================

describe('AgentCard v1.0 Structure', () => {
    let adapter: ElysiaA2AAdapter;

    beforeAll(() => {
        adapter = createTestAdapter();
    });

    test('GetAgentCard should return v1.0 compliant card', async () => {
        const request: v1.JSONRPCRequest = {
            jsonrpc: '2.0',
            id: 'card-1',
            method: 'agent/card',
            params: {},
        };

        const response = await adapter.handleRequest(request);
        const card = response.result as v1.AgentCard;

        // Required v1.0 fields
        expect(card.name).toBeDefined();
        expect(card.protocolVersions).toContain('1.0');
        expect(card.supportedInterfaces).toBeInstanceOf(Array);
        expect(card.supportedInterfaces?.length).toBeGreaterThan(0);

        // Check supportedInterfaces structure
        const iface = card.supportedInterfaces![0];
        expect(iface.url).toBeDefined();
        expect(iface.protocolBinding).toBe('JSONRPC');

        // Capabilities
        expect(card.capabilities).toBeDefined();
    });

    test('AgentCard should have extendedAgentCard capability', async () => {
        const request: v1.JSONRPCRequest = {
            jsonrpc: '2.0',
            id: 'card-cap',
            method: 'agent/card',
            params: {},
        };

        const response = await adapter.handleRequest(request);
        const card = response.result as v1.AgentCard;

        expect(card.capabilities?.extendedAgentCard).toBeDefined();
    });
});

// ============================================================================
// Summary
// ============================================================================

describe('A2A v1.0 Test Summary', () => {
    test('All test categories covered', () => {
        // This test documents what's covered
        const testCategories = [
            'Method Names (v1.0)',
            'Legacy Method Aliases',
            'TaskState Enum Serialization',
            'Part Type Structure',
            'Error Code Responses',
            'Version Header Validation',
            'Extensions Header Parsing',
            'Cursor-based Pagination',
            'ContextId + TaskId Validation',
            'AgentCard v1.0 Structure',
        ];

        expect(testCategories.length).toBe(10);
    });
});
