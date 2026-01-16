/**
 * Cowork REST API Routes
 *
 * Handles all Cowork session management endpoints.
 */

import { Elysia, t } from 'elysia';
import { coworkOrchestrator } from './orchestrator';
import { a2aTaskBridge, agentDiscoveryService } from './a2a-bridge';
import { componentLoggers } from '../logger';

const logger = componentLoggers.http;

export const coworkRoutes = new Elysia({ prefix: '/api/v1/cowork' })

    // ========================================================================
    // Session Management
    // ========================================================================

    // Create new session
    .post('/sessions', async ({ body }) => {
        try {
            const { description, options } = body as {
                description: string;
                options?: {
                    workspacePath?: string;
                    inputPaths?: string[];
                    maxCost?: number;
                };
            };

            // For now, use a default user ID (in production, from auth)
            const userId = 'default-user';

            const session = await coworkOrchestrator.createSession(
                userId,
                description,
                options
            );

            return { success: true, session };
        } catch (error: any) {
            logger.error({ error }, 'Failed to create cowork session');
            return { success: false, error: error.message };
        }
    }, {
        body: t.Object({
            description: t.String({ minLength: 5 }),
            options: t.Optional(t.Object({
                workspacePath: t.Optional(t.String()),
                inputPaths: t.Optional(t.Array(t.String())),
                maxCost: t.Optional(t.Number())
            }))
        })
    })

    // Get session details
    .get('/sessions/:id', async ({ params }) => {
        try {
            const session = await coworkOrchestrator.getSession(params.id);
            return { success: true, session };
        } catch (error: any) {
            logger.error({ sessionId: params.id, error }, 'Failed to get session');
            return { success: false, error: error.message };
        }
    }, {
        params: t.Object({
            id: t.String()
        })
    })

    // List user's sessions
    .get('/sessions', async ({ query }) => {
        try {
            const userId = 'default-user'; // In production, from auth
            const sessions = await coworkOrchestrator.getUserSessions(userId, {
                limit: query.limit ? parseInt(query.limit as string) : undefined,
                status: query.status as any
            });
            return { success: true, sessions };
        } catch (error: any) {
            logger.error({ error }, 'Failed to list sessions');
            return { success: false, error: error.message };
        }
    }, {
        query: t.Object({
            limit: t.Optional(t.String()),
            status: t.Optional(t.String())
        })
    })

    // ========================================================================
    // Plan Management
    // ========================================================================

    // Approve plan and start execution
    .post('/sessions/:id/approve', async ({ params, body }) => {
        try {
            const { modifications } = body as {
                modifications?: Array<{
                    stepId: string;
                    action: 'remove' | 'modify';
                    newTitle?: string;
                    newDescription?: string;
                }>;
            };

            await coworkOrchestrator.approvePlan(params.id, modifications);
            return { success: true };
        } catch (error: any) {
            logger.error({ sessionId: params.id, error }, 'Failed to approve plan');
            return { success: false, error: error.message };
        }
    }, {
        params: t.Object({
            id: t.String()
        }),
        body: t.Object({
            modifications: t.Optional(t.Array(t.Object({
                stepId: t.String(),
                action: t.Union([t.Literal('remove'), t.Literal('modify')]),
                newTitle: t.Optional(t.String()),
                newDescription: t.Optional(t.String())
            })))
        })
    })

    // ========================================================================
    // Execution Control
    // ========================================================================

    // Pause session
    .post('/sessions/:id/pause', async ({ params }) => {
        try {
            await coworkOrchestrator.pauseSession(params.id);
            return { success: true };
        } catch (error: any) {
            logger.error({ sessionId: params.id, error }, 'Failed to pause session');
            return { success: false, error: error.message };
        }
    }, {
        params: t.Object({
            id: t.String()
        })
    })

    // Resume session
    .post('/sessions/:id/resume', async ({ params }) => {
        try {
            await coworkOrchestrator.resumeSession(params.id);
            return { success: true };
        } catch (error: any) {
            logger.error({ sessionId: params.id, error }, 'Failed to resume session');
            return { success: false, error: error.message };
        }
    }, {
        params: t.Object({
            id: t.String()
        })
    })

    // Cancel session
    .post('/sessions/:id/cancel', async ({ params }) => {
        try {
            await coworkOrchestrator.cancelSession(params.id);
            return { success: true };
        } catch (error: any) {
            logger.error({ sessionId: params.id, error }, 'Failed to cancel session');
            return { success: false, error: error.message };
        }
    }, {
        params: t.Object({
            id: t.String()
        })
    })

    // Send steering guidance
    .post('/sessions/:id/steer', async ({ params, body }) => {
        try {
            const { guidance } = body as { guidance: string };
            await coworkOrchestrator.steerSession(params.id, guidance);
            return { success: true };
        } catch (error: any) {
            logger.error({ sessionId: params.id, error }, 'Failed to steer session');
            return { success: false, error: error.message };
        }
    }, {
        params: t.Object({
            id: t.String()
        }),
        body: t.Object({
            guidance: t.String({ minLength: 1 })
        })
    })

    // ========================================================================
    // Artifacts
    // ========================================================================

    // Get session artifacts
    .get('/sessions/:id/artifacts', async ({ params }) => {
        try {
            const session = await coworkOrchestrator.getSession(params.id);
            return { success: true, artifacts: session.artifacts };
        } catch (error: any) {
            logger.error({ sessionId: params.id, error }, 'Failed to get artifacts');
            return { success: false, error: error.message };
        }
    }, {
        params: t.Object({
            id: t.String()
        })
    })

    // ========================================================================
    // Task Queue Management
    // ========================================================================

    // Create batch tasks (multiple tasks at once)
    .post('/queue/batch', async ({ body }) => {
        try {
            const { tasks, queueOptions } = body as {
                tasks: Array<{
                    description: string;
                    priority?: number;
                    options?: {
                        workspacePath?: string;
                        inputPaths?: string[];
                        maxCost?: number;
                    };
                }>;
                queueOptions?: {
                    startImmediately?: boolean;
                    sequential?: boolean;
                };
            };

            const userId = 'default-user';
            const createdSessions = [];

            for (let i = 0; i < tasks.length; i++) {
                const task = tasks[i];
                const session = await coworkOrchestrator.createSession(
                    userId,
                    task.description,
                    {
                        ...task.options,
                        // Store priority in session metadata (will be used when we add DB persistence)
                    }
                );

                createdSessions.push({
                    id: session.id,
                    title: session.title,
                    priority: task.priority ?? i + 1,
                    status: session.status,
                });
            }

            logger.info({ count: createdSessions.length }, 'Batch tasks created');

            return {
                success: true,
                tasks: createdSessions,
                queueId: `queue_${Date.now()}`,
            };
        } catch (error: any) {
            logger.error({ error }, 'Failed to create batch tasks');
            return { success: false, error: error.message };
        }
    }, {
        body: t.Object({
            tasks: t.Array(t.Object({
                description: t.String({ minLength: 5 }),
                priority: t.Optional(t.Number({ minimum: 1 })),
                options: t.Optional(t.Object({
                    workspacePath: t.Optional(t.String()),
                    inputPaths: t.Optional(t.Array(t.String())),
                    maxCost: t.Optional(t.Number())
                }))
            }), { minItems: 1, maxItems: 50 }),
            queueOptions: t.Optional(t.Object({
                startImmediately: t.Optional(t.Boolean()),
                sequential: t.Optional(t.Boolean())
            }))
        })
    })

    // Get queue status
    .get('/queue', async ({ query }) => {
        try {
            const userId = 'default-user';
            const sessions = await coworkOrchestrator.getUserSessions(userId);

            // Categorize by status
            const queued = sessions.filter(s => s.status === 'planning' || s.status === 'awaiting_approval');
            const active = sessions.filter(s => s.status === 'executing');
            const paused = sessions.filter(s => s.status === 'paused');
            const completed = sessions.filter(s =>
                s.status === 'completed' || s.status === 'failed' || s.status === 'cancelled'
            );

            return {
                success: true,
                queue: {
                    queued: queued.map(s => ({ id: s.id, title: s.title, status: s.status })),
                    active: active.map(s => ({ id: s.id, title: s.title, status: s.status })),
                    paused: paused.map(s => ({ id: s.id, title: s.title, status: s.status })),
                    completed: completed.slice(0, 10).map(s => ({
                        id: s.id,
                        title: s.title,
                        status: s.status
                    })),
                },
                stats: {
                    queuedCount: queued.length,
                    activeCount: active.length,
                    pausedCount: paused.length,
                    completedCount: completed.length,
                    totalCount: sessions.length,
                },
            };
        } catch (error: any) {
            logger.error({ error }, 'Failed to get queue status');
            return { success: false, error: error.message };
        }
    })

    // Pause entire queue (pause all active sessions)
    .post('/queue/pause', async () => {
        try {
            const userId = 'default-user';
            const sessions = await coworkOrchestrator.getUserSessions(userId);
            const activeSessions = sessions.filter(s => s.status === 'executing');

            const paused = [];
            for (const session of activeSessions) {
                try {
                    await coworkOrchestrator.pauseSession(session.id);
                    paused.push(session.id);
                } catch (e) {
                    logger.warn({ sessionId: session.id }, 'Failed to pause session');
                }
            }

            logger.info({ count: paused.length }, 'Queue paused');
            return { success: true, pausedCount: paused.length, pausedIds: paused };
        } catch (error: any) {
            logger.error({ error }, 'Failed to pause queue');
            return { success: false, error: error.message };
        }
    })

    // Resume entire queue (resume all paused sessions)
    .post('/queue/resume', async () => {
        try {
            const userId = 'default-user';
            const sessions = await coworkOrchestrator.getUserSessions(userId);
            const pausedSessions = sessions.filter(s => s.status === 'paused');

            const resumed = [];
            for (const session of pausedSessions) {
                try {
                    await coworkOrchestrator.resumeSession(session.id);
                    resumed.push(session.id);
                } catch (e) {
                    logger.warn({ sessionId: session.id }, 'Failed to resume session');
                }
            }

            logger.info({ count: resumed.length }, 'Queue resumed');
            return { success: true, resumedCount: resumed.length, resumedIds: resumed };
        } catch (error: any) {
            logger.error({ error }, 'Failed to resume queue');
            return { success: false, error: error.message };
        }
    })

    // Cancel multiple tasks
    .post('/queue/cancel', async ({ body }) => {
        try {
            const { sessionIds } = body as { sessionIds: string[] };

            const cancelled = [];
            const failed = [];

            for (const sessionId of sessionIds) {
                try {
                    await coworkOrchestrator.cancelSession(sessionId);
                    cancelled.push(sessionId);
                } catch (e: any) {
                    failed.push({ id: sessionId, error: e.message });
                }
            }

            logger.info({ cancelled: cancelled.length, failed: failed.length }, 'Batch cancel completed');
            return {
                success: true,
                cancelledCount: cancelled.length,
                cancelledIds: cancelled,
                failed
            };
        } catch (error: any) {
            logger.error({ error }, 'Failed to cancel tasks');
            return { success: false, error: error.message };
        }
    }, {
        body: t.Object({
            sessionIds: t.Array(t.String(), { minItems: 1 })
        })
    })

    // Reorder queue (update priorities)
    .post('/queue/reorder', async ({ body }) => {
        try {
            const { order } = body as { order: Array<{ sessionId: string; priority: number }> };

            // In a real implementation, this would update priority in the database
            // For now, we just acknowledge the request
            logger.info({ count: order.length }, 'Queue reorder requested');

            return {
                success: true,
                message: 'Queue order updated',
                order: order.map(item => ({
                    sessionId: item.sessionId,
                    priority: item.priority,
                })),
            };
        } catch (error: any) {
            logger.error({ error }, 'Failed to reorder queue');
            return { success: false, error: error.message };
        }
    }, {
        body: t.Object({
            order: t.Array(t.Object({
                sessionId: t.String(),
                priority: t.Number({ minimum: 1 })
            }), { minItems: 1 })
        })
    })

    // ========================================================================
    // A2A Agent Management (Remote Agent Delegation)
    // ========================================================================

    // List discovered remote agents
    .get('/agents/remote', async () => {
        try {
            const agents = coworkOrchestrator.getRemoteAgents();

            return {
                success: true,
                agents: agents.map(a => ({
                    url: a.url,
                    name: a.card.name,
                    description: a.card.description,
                    skills: a.card.skills?.map(s => ({
                        name: s.name,
                        tags: s.tags,
                    })) || [],
                    capabilities: a.card.extensions?.a2a?.capabilities || [],
                })),
                count: agents.length,
            };
        } catch (error: any) {
            logger.error({ error }, 'Failed to list remote agents');
            return { success: false, error: error.message };
        }
    })

    // Discover remote agents
    .post('/agents/remote/discover', async () => {
        try {
            const discovered = await agentDiscoveryService.discoverAgents();

            // Update orchestrator with discovered agents
            for (const agent of discovered) {
                await coworkOrchestrator.addRemoteAgent(agent.url);
            }

            return {
                success: true,
                discovered: discovered.map(a => ({
                    url: a.url,
                    name: a.card.name,
                })),
                count: discovered.length,
            };
        } catch (error: any) {
            logger.error({ error }, 'Failed to discover remote agents');
            return { success: false, error: error.message };
        }
    })

    // Add a specific remote agent by URL
    .post('/agents/remote', async ({ body }) => {
        try {
            const { url } = body as { url: string };

            const agent = await coworkOrchestrator.addRemoteAgent(url);

            if (!agent) {
                return {
                    success: false,
                    error: 'Failed to connect to agent at the provided URL',
                };
            }

            return {
                success: true,
                agent: {
                    url: agent.url,
                    name: agent.card.name,
                    description: agent.card.description,
                    skills: agent.card.skills?.map(s => ({
                        name: s.name,
                        tags: s.tags,
                    })) || [],
                },
            };
        } catch (error: any) {
            logger.error({ error }, 'Failed to add remote agent');
            return { success: false, error: error.message };
        }
    }, {
        body: t.Object({
            url: t.String({ format: 'uri' })
        })
    })

    // Probe a URL to check if it's an A2A agent
    .post('/agents/remote/probe', async ({ body }) => {
        try {
            const { url, timeout } = body as { url: string; timeout?: number };

            const agent = await agentDiscoveryService.probeAgent(url, timeout);

            if (!agent) {
                return {
                    success: false,
                    error: 'No A2A agent found at the provided URL',
                };
            }

            return {
                success: true,
                agent: {
                    url: agent.url,
                    name: agent.card.name,
                    description: agent.card.description,
                    version: agent.card.version,
                    skills: agent.card.skills?.map(s => ({
                        name: s.name,
                        description: s.description,
                        tags: s.tags,
                    })) || [],
                    capabilities: agent.card.extensions?.a2a?.capabilities || [],
                },
            };
        } catch (error: any) {
            logger.error({ error }, 'Failed to probe remote agent');
            return { success: false, error: error.message };
        }
    }, {
        body: t.Object({
            url: t.String({ format: 'uri' }),
            timeout: t.Optional(t.Number({ minimum: 1000, maximum: 30000 }))
        })
    })

    // Configure A2A delegation settings
    .post('/agents/remote/config', async ({ body }) => {
        try {
            const { enabled, preferRemote } = body as {
                enabled: boolean;
                preferRemote?: boolean;
            };

            coworkOrchestrator.setRemoteAgentDelegation(enabled, preferRemote);

            return {
                success: true,
                config: {
                    enabled,
                    preferRemote: preferRemote ?? false,
                },
            };
        } catch (error: any) {
            logger.error({ error }, 'Failed to configure A2A delegation');
            return { success: false, error: error.message };
        }
    }, {
        body: t.Object({
            enabled: t.Boolean(),
            preferRemote: t.Optional(t.Boolean())
        })
    })

    // Get A2A bridge status
    .get('/agents/remote/status', async () => {
        try {
            const agents = coworkOrchestrator.getRemoteAgents();
            const activeConnections = a2aTaskBridge.getActiveConnectionCount();

            return {
                success: true,
                status: {
                    agentCount: agents.length,
                    activeConnections,
                    agents: agents.map(a => ({
                        url: a.url,
                        name: a.card.name,
                    })),
                },
            };
        } catch (error: any) {
            logger.error({ error }, 'Failed to get A2A status');
            return { success: false, error: error.message };
        }
    })

    // Cancel all active remote executions
    .post('/agents/remote/cancel-all', async () => {
        try {
            const cancelled = a2aTaskBridge.cancelAllExecutions();

            return {
                success: true,
                cancelledCount: cancelled,
            };
        } catch (error: any) {
            logger.error({ error }, 'Failed to cancel remote executions');
            return { success: false, error: error.message };
        }
    });

export default coworkRoutes;
