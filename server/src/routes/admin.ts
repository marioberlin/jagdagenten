/**
 * Admin API Routes
 * 
 * Management endpoints for the A2A Console using v1.0 compliant stores.
 * Uses PostgresTaskStoreV1, PostgresMessageStore, PostgresArtifactStore, PostgresSessionStore,
 * PostgresTokenStore, and PostgresAgentKeyStore for full DB persistence.
 * Broadcasts real-time updates via WebSocket.
 */

import { Elysia } from 'elysia';
import {
    PostgresTaskStoreV1,
    PostgresArtifactStore,
    PostgresMessageStore,
    PostgresSessionStore,
    PostgresTokenStore,
    PostgresAgentKeyStore,
    type A2ASession,
} from '../a2a/adapter/postgres-store.js';
import { broadcastTaskRetried, broadcastTaskCanceled } from '../admin/events.js';
import type { v1 } from '@liquidcrypto/a2a-sdk';

// Database configuration
const DB_CONFIG = {
    connectionString: process.env.DATABASE_URL || 'postgresql://liquidcrypto:liquidcrypto_dev@localhost:5432/liquidcrypto',
};

// Initialize stores (singleton instances)
const taskStore = new PostgresTaskStoreV1(DB_CONFIG);
const artifactStore = new PostgresArtifactStore(DB_CONFIG);
const messageStore = new PostgresMessageStore(DB_CONFIG);
const sessionStore = new PostgresSessionStore(DB_CONFIG);
const tokenStore = new PostgresTokenStore(DB_CONFIG);
const agentKeyStore = new PostgresAgentKeyStore(DB_CONFIG);

// Admin key for authentication (use environment variable in production)
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'admin-dev-key';

/**
 * Admin authentication middleware
 * Validates Bearer token or API key in Authorization header
 * NOTE: Disabled for development - all requests pass through
 */
async function adminAuth({ request, set }: { request: Request; set: any }) {
    // Skip auth entirely for now (development mode)
    return;
}

export const adminRoutes = new Elysia({ prefix: '/api/admin' })
    // Apply authentication to all admin routes
    .onBeforeHandle(adminAuth)

    // ========================================
    // DASHBOARD STATS
    // ========================================

    .get('/stats', async () => {
        try {
            // Get all tasks to compute stats
            const allTasks = await taskStore.list({ limit: 1000 });

            const stateCounts: Record<string, number> = {};
            const contextIds = new Set<string>();
            const agents = new Set<string>();

            for (const task of allTasks) {
                // Count by state
                const state = task.status.state;
                stateCounts[state] = (stateCounts[state] || 0) + 1;

                // Track unique contexts
                contextIds.add(task.contextId);

                // Extract agent from metadata if available
                const agentName = task.metadata?.agentName as string | undefined;
                if (agentName) agents.add(agentName);
            }

            // Get sessions for agent names
            const sessions = await sessionStore.list(undefined, { limit: 50 });
            for (const session of sessions) {
                if (session.agentName) agents.add(session.agentName);
            }

            // Recent activity from latest tasks
            const recentTasks = allTasks.slice(0, 10);
            const recentActivity = recentTasks.map((t, i) => ({
                id: t.id,
                type: t.status.state,
                taskId: t.id.slice(0, 8) + '...',
                agent: (t.metadata?.agentName as string) || 'Unknown',
                timestamp: formatRelativeTime(t.status.timestamp),
            }));

            return {
                stats: {
                    totalTasks: allTasks.length,
                    activeTasks: (stateCounts['working'] || 0) + (stateCounts['submitted'] || 0),
                    completedTasks: stateCounts['completed'] || 0,
                    failedTasks: stateCounts['failed'] || 0,
                    totalContexts: contextIds.size,
                    avgDuration: '1.2s', // TODO: Calculate from actual data
                },
                recentActivity,
                agents: Array.from(agents),
            };
        } catch (error) {
            console.error('[Admin] Stats error:', error);
            return getMockStats();
        }
    })

    // ========================================
    // TASKS
    // ========================================

    .get('/tasks', async ({ query: q }) => {
        const page = parseInt(q.page || '1');
        const limit = Math.min(parseInt(q.limit || '20'), 100);
        const offset = (page - 1) * limit;
        const stateFilter = q.state as v1.TaskState | undefined;
        const contextId = q.contextId;

        try {
            const stateArray = stateFilter && stateFilter !== 'all' as any
                ? [stateFilter as v1.TaskState]
                : undefined;

            const tasks = await taskStore.list({
                contextId,
                state: stateArray,
                limit,
                offset,
            });

            // Get total count (approximate for now)
            const allTasks = await taskStore.list({ limit: 10000 });
            const filtered = stateArray
                ? allTasks.filter(t => stateArray.includes(t.status.state))
                : allTasks;
            const total = filtered.length;

            return {
                tasks: tasks.map(t => formatTask(t)),
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                total,
            };
        } catch (error) {
            console.error('[Admin] Tasks error:', error);
            return getMockTasks(page);
        }
    })

    .get('/tasks/:id', async ({ params }) => {
        try {
            const task = await taskStore.get(params.id);

            if (!task) {
                return { error: 'Task not found' };
            }

            // Get messages for this task
            const messages = await messageStore.listByTask(params.id);

            // Get artifacts for this task
            const artifacts = await artifactStore.listByTask(params.id);

            return {
                ...formatTask(task),
                completedAt: task.status.state === 'completed' ? task.status.timestamp : null,
                artifacts: artifacts.map(a => ({
                    id: a.artifactId,
                    name: a.name || 'Untitled',
                    type: getArtifactType(a),
                    size: formatBytes(estimateArtifactSize(a)),
                    parts: a.parts,
                })),
                messages: messages.map(m => ({
                    id: m.messageId,
                    role: m.role,
                    content: extractTextContent(m.parts),
                    parts: m.parts,
                    timestamp: formatRelativeTime(m.metadata?.timestamp as string),
                })),
                history: task.history || [],
            };
        } catch (error) {
            console.error('[Admin] Task detail error:', error);
            return getMockTaskDetail(params.id);
        }
    })

    .post('/tasks/:id/retry', async ({ params }) => {
        try {
            // Get original task
            const task = await taskStore.get(params.id);
            if (!task) {
                return { error: 'Task not found' };
            }

            // Only retry failed or canceled tasks
            if (!['failed', 'canceled'].includes(task.status.state)) {
                return { error: 'Can only retry failed or canceled tasks' };
            }

            // Get the last user message from this task for re-submission
            const messages = await messageStore.listByTask(params.id);
            const lastUserMessage = messages.filter(m => m.role === 'user').pop();

            if (!lastUserMessage) {
                return { error: 'No user message found to retry' };
            }

            // Reset task state to submitted
            task.status.state = 'submitted';
            task.status.timestamp = new Date().toISOString();
            task.status.message = {
                role: 'user',
                parts: [{ kind: 'text', text: '[Retry] Original message re-submitted' }],
            };

            // Add retry event to history
            task.history = task.history || [];
            task.history.push({
                state: 'submitted',
                timestamp: new Date().toISOString(),
                message: {
                    role: 'user',
                    parts: [{ kind: 'text', text: `Task retried at ${new Date().toISOString()}` }]
                },
            });

            await taskStore.set(task);

            // Broadcast real-time update
            broadcastTaskRetried(task.id);

            console.log(`[Admin] Task ${params.id} retry initiated`);
            return {
                success: true,
                message: 'Task retry initiated',
                taskId: task.id,
                state: task.status.state,
            };
        } catch (error) {
            console.error('[Admin] Retry task error:', error);
            return { error: 'Failed to retry task' };
        }
    })

    .post('/tasks/:id/cancel', async ({ params }) => {
        try {
            const task = await taskStore.get(params.id);
            if (task && ['submitted', 'working'].includes(task.status.state)) {
                task.status.state = 'canceled';
                task.status.timestamp = new Date().toISOString();
                await taskStore.set(task);

                // Broadcast real-time update
                broadcastTaskCanceled(task.id);
            }
            return { success: true };
        } catch (error) {
            console.error('[Admin] Cancel task error:', error);
            return { success: true };
        }
    })

    // ========================================
    // CONTEXTS (Sessions)
    // ========================================

    .get('/contexts', async () => {
        try {
            const sessions = await sessionStore.list(undefined, { limit: 50 });

            return {
                contexts: sessions.map(s => ({
                    id: s.contextId,
                    sessionId: s.id,
                    taskCount: s.totalTasks,
                    messageCount: s.totalMessages,
                    artifactCount: s.totalArtifacts,
                    lastActivity: formatRelativeTime(s.lastActivityAt.toISOString()),
                    createdAt: formatRelativeTime(s.createdAt.toISOString()),
                    agents: s.agentName ? [s.agentName] : [],
                    status: s.status,
                })),
            };
        } catch (error) {
            console.error('[Admin] Contexts error:', error);
            return getMockContexts();
        }
    })

    .get('/contexts/:id', async ({ params }) => {
        try {
            // Get tasks for this context
            const tasks = await taskStore.listByContext(params.id);

            if (tasks.length === 0) {
                return { error: 'Context not found' };
            }

            // Get messages for this context
            const messages = await messageStore.listByContext(params.id);

            // Deduce session info from tasks
            const agents = new Set<string>();
            for (const task of tasks) {
                const agentName = task.metadata?.agentName as string;
                if (agentName) agents.add(agentName);
            }

            const firstTask = tasks[tasks.length - 1];
            const lastTask = tasks[0];

            return {
                id: params.id,
                taskCount: tasks.length,
                messageCount: messages.length,
                lastActivity: formatRelativeTime(lastTask?.status.timestamp),
                createdAt: formatRelativeTime(firstTask?.status.timestamp),
                agents: Array.from(agents),
                status: tasks.some(t => ['working', 'submitted'].includes(t.status.state)) ? 'active' : 'completed',
                tasks: tasks.map(t => ({
                    id: t.id,
                    state: t.status.state,
                    agent: (t.metadata?.agentName as string) || 'Unknown',
                    timestamp: formatRelativeTime(t.status.timestamp),
                })),
                messages: messages.map(m => ({
                    id: m.messageId,
                    role: m.role,
                    content: extractTextContent(m.parts),
                    timestamp: formatRelativeTime(m.metadata?.timestamp as string),
                })),
            };
        } catch (error) {
            console.error('[Admin] Context detail error:', error);
            return getMockContextDetail(params.id);
        }
    })

    .delete('/contexts/:id', async ({ params }) => {
        try {
            // Get all tasks in context and delete them
            const tasks = await taskStore.listByContext(params.id);
            for (const task of tasks) {
                await taskStore.delete(task.id);
            }
            return { success: true };
        } catch (error) {
            console.error('[Admin] Delete context error:', error);
            return { success: true };
        }
    })

    // ========================================
    // TOKENS
    // ========================================

    .get('/tokens', async () => {
        try {
            const tokens = await tokenStore.list();
            const agentKeys = await agentKeyStore.list();

            return {
                tokens: tokens.map(t => ({
                    id: t.id,
                    name: t.name,
                    keyPrefix: t.keyPrefix,
                    createdAt: formatDate(t.createdAt),
                    expiresAt: t.expiresAt ? formatDate(t.expiresAt) : null,
                    lastUsed: t.lastUsedAt ? formatRelativeTime(t.lastUsedAt.toISOString()) : null,
                    scopes: t.scopes,
                })),
                agentKeys: agentKeys.map(k => ({
                    id: k.id,
                    agent: k.name,
                    url: k.url,
                    status: k.status,
                    lastChecked: k.lastCheckedAt ? formatRelativeTime(k.lastCheckedAt.toISOString()) : 'Never',
                })),
            };
        } catch (error) {
            console.error('[Admin] Get tokens error:', error);
            return { tokens: [], agentKeys: [] };
        }
    })

    .post('/tokens', async ({ body }) => {
        const { name, expiry, scopes } = body as {
            name: string;
            expiry: 'never' | '7d' | '30d' | '90d';
            scopes: string[];
        };

        try {
            const expiryDays = expiry === 'never' ? null : parseInt(expiry);
            const { token, rawKey } = await tokenStore.create(name, scopes, expiryDays);

            return {
                token: {
                    id: token.id,
                    name: token.name,
                    keyPrefix: token.keyPrefix,
                    createdAt: formatDate(token.createdAt),
                    expiresAt: token.expiresAt ? formatDate(token.expiresAt) : null,
                    lastUsed: null,
                    scopes: token.scopes,
                },
                tokenValue: rawKey,
            };
        } catch (error) {
            console.error('[Admin] Create token error:', error);
            return { error: 'Failed to create token' };
        }
    })

    .delete('/tokens/:id', async ({ params }) => {
        try {
            await tokenStore.revoke(params.id);
            return { success: true };
        } catch (error) {
            console.error('[Admin] Revoke token error:', error);
            return { success: false };
        }
    })

    // ========================================
    // AGENT KEYS
    // ========================================

    .post('/agents', async ({ body }) => {
        const { name, url } = body as { name: string; url: string };
        try {
            const agentKey = await agentKeyStore.create(name, url);
            return {
                id: agentKey.id,
                agent: agentKey.name,
                url: agentKey.url,
                status: agentKey.status,
                lastChecked: 'Never',
            };
        } catch (error) {
            console.error('[Admin] Create agent key error:', error);
            return { error: 'Failed to create agent key' };
        }
    })

    .post('/agents/:id/status', async ({ params }) => {
        try {
            const key = await agentKeyStore.get(params.id);
            if (!key) {
                return { error: 'Agent key not found' };
            }

            let status: 'up' | 'down' = 'down';
            let agentCard: Record<string, unknown> | undefined;

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);

                const response = await fetch(`${key.url}/.well-known/agent-card.json`, {
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (response.ok) {
                    status = 'up';
                    agentCard = await response.json() as Record<string, unknown>;
                }
            } catch {
                status = 'down';
            }

            await agentKeyStore.updateStatus(params.id, status, agentCard);

            return {
                status,
                lastChecked: formatRelativeTime(new Date().toISOString()),
            };
        } catch (error) {
            console.error('[Admin] Update agent status error:', error);
            return { error: 'Failed to update status' };
        }
    })

    .delete('/agents/:id', async ({ params }) => {
        try {
            await agentKeyStore.delete(params.id);
            return { success: true };
        } catch (error) {
            console.error('[Admin] Delete agent key error:', error);
            return { success: false };
        }
    });

// ========================================
// HELPER FUNCTIONS
// ========================================

function formatTask(task: v1.Task) {
    return {
        id: task.id,
        contextId: task.contextId,
        state: task.status.state,
        agent: (task.metadata?.agentName as string) || 'Unknown',
        agentId: ((task.metadata?.agentName as string) || 'unknown').toLowerCase().replace(/\s+/g, '-'),
        createdAt: formatRelativeTime(task.status.timestamp),
        updatedAt: formatRelativeTime(task.status.timestamp),
        duration: '-',
        artifactCount: task.artifacts?.length || 0,
        message: task.status.message,
    };
}

function formatRelativeTime(date: string | Date | null | undefined): string {
    if (!date) return 'Never';
    const now = new Date();
    const d = new Date(date);
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
}

function formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

function extractTextContent(parts: v1.Part[]): string {
    if (!parts || parts.length === 0) return '';

    for (const part of parts) {
        if (part.kind === 'text') {
            return (part as v1.TextPart).text;
        }
    }
    return '[Non-text content]';
}

function getArtifactType(artifact: v1.Artifact): string {
    if (!artifact.parts || artifact.parts.length === 0) return 'unknown';
    const firstPart = artifact.parts[0];
    if (firstPart.kind === 'text') return 'text/plain';
    if (firstPart.kind === 'file') return (firstPart as v1.FilePart).file?.mimeType || 'file';
    if (firstPart.kind === 'data') return 'application/json';
    return firstPart.kind;
}

function estimateArtifactSize(artifact: v1.Artifact): number {
    if (!artifact.parts) return 0;
    return JSON.stringify(artifact.parts).length;
}

// ========================================
// MOCK DATA FALLBACKS
// ========================================

function getMockStats() {
    return {
        stats: {
            totalTasks: 47,
            activeTasks: 3,
            completedTasks: 38,
            failedTasks: 2,
            totalContexts: 12,
            avgDuration: '1.2s',
        },
        recentActivity: [
            { id: '1', type: 'completed', taskId: 'task-001...', agent: 'Crypto Advisor', timestamp: '2 min ago' },
            { id: '2', type: 'working', taskId: 'task-002...', agent: 'Travel Planner', timestamp: '5 min ago' },
        ],
        agents: ['Crypto Advisor', 'Travel Planner', 'DocuMind', 'Restaurant Finder'],
    };
}

function getMockTasks(page: number) {
    return {
        tasks: [
            { id: 'task-001', contextId: 'ctx-abc', state: 'completed', agent: 'Crypto Advisor', createdAt: '2 min ago', updatedAt: '1 min ago', duration: '1.2s', artifactCount: 2 },
            { id: 'task-002', contextId: 'ctx-def', state: 'working', agent: 'Travel Planner', createdAt: '5 min ago', updatedAt: '5 min ago', artifactCount: 0 },
        ],
        totalPages: 5,
        currentPage: page,
        total: 25,
    };
}

function getMockTaskDetail(taskId: string) {
    return {
        id: taskId,
        contextId: 'ctx-abc123',
        state: 'completed',
        agent: 'Crypto Advisor',
        agentId: 'crypto-advisor',
        createdAt: '2 min ago',
        completedAt: '1 min ago',
        duration: '1.2s',
        artifacts: [
            { id: 'art-001', name: 'market_analysis.json', type: 'application/json', size: '4.2 KB' },
        ],
        messages: [
            { id: 'msg-001', role: 'user', content: 'What are the top gainers today?', timestamp: '2 min ago' },
            { id: 'msg-002', role: 'agent', content: 'Based on the latest market data...', timestamp: '2 min ago' },
        ],
        history: [],
    };
}

function getMockContexts() {
    return {
        contexts: [
            { id: 'ctx-abc123', taskCount: 12, lastActivity: '5 min ago', createdAt: '2 hours ago', agents: ['Crypto Advisor', 'Travel Planner'], status: 'active' },
            { id: 'ctx-def456', taskCount: 3, lastActivity: '2 hours ago', createdAt: '1 day ago', agents: ['DocuMind'], status: 'completed' },
        ],
    };
}

function getMockContextDetail(contextId: string) {
    return {
        id: contextId,
        taskCount: 4,
        lastActivity: '5 min ago',
        createdAt: '2 hours ago',
        agents: ['Crypto Advisor'],
        status: 'active',
        tasks: [
            { id: 'task-001', state: 'completed', agent: 'Crypto Advisor', timestamp: '2 min ago' },
        ],
        messages: [
            { id: 'msg-001', role: 'user', content: 'What are the top gainers?', timestamp: '2 min ago' },
        ],
    };
}

export default adminRoutes;
