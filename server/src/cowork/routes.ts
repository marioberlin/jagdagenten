/**
 * Cowork REST API Routes
 *
 * Handles all Cowork session management endpoints.
 */

import { Elysia, t } from 'elysia';
import { coworkOrchestrator } from './orchestrator';
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
    });

export default coworkRoutes;
