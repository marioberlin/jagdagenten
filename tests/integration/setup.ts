/**
 * A2A Integration Test Setup
 * 
 * Provides utilities for testing A2A agent flows.
 */

import { beforeAll, afterAll, vi } from 'vitest';

// Test server configuration
export const TEST_CONFIG = {
    // Local development server
    SERVER_URL: process.env.TEST_SERVER_URL || 'http://localhost:3000',

    // Agent endpoints
    AGENT_BASE_PATH: '/agents',

    // Timeouts
    DISCOVERY_TIMEOUT: 5000,
    MESSAGE_TIMEOUT: 30000,
    STREAMING_TIMEOUT: 60000,
};

// Mock server state for unit tests
export interface MockAgentState {
    connected: boolean;
    messages: Array<{ role: string; content: string }>;
    tasks: Map<string, { id: string; status: string }>;
}

export const createMockAgentState = (): MockAgentState => ({
    connected: false,
    messages: [],
    tasks: new Map(),
});

/**
 * Utility to wait for a condition with timeout
 */
export async function waitFor(
    condition: () => boolean | Promise<boolean>,
    timeout: number = 5000,
    interval: number = 100
): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        if (await condition()) {
            return;
        }
        await new Promise(r => setTimeout(r, interval));
    }
    throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Skip integration tests if server is not available
 */
export async function checkServerAvailable(): Promise<boolean> {
    try {
        const response = await fetch(`${TEST_CONFIG.SERVER_URL}/api/v1/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(3000),
        });
        return response.ok;
    } catch {
        return false;
    }
}

/**
 * Create a test message in A2A format
 */
export function createTestMessage(content: string) {
    return {
        role: 'user' as const,
        parts: [{ type: 'text' as const, text: content }],
    };
}

// Global setup for integration tests
let serverAvailable = false;

beforeAll(async () => {
    serverAvailable = await checkServerAvailable();
    if (!serverAvailable) {
        console.warn('⚠️ Test server not available. Integration tests will be skipped.');
    }
});

afterAll(() => {
    vi.restoreAllMocks();
});

export { serverAvailable };
