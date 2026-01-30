/**
 * AI Respond Endpoint — Main BFF for Agent Orchestration
 * 
 * POST /api/v1/ai/respond
 * 
 * This is the primary endpoint that the frontend calls for all AI interactions.
 * It routes through the multi-agent system and returns structured responses.
 */

import { Elysia, t } from 'elysia';
import { RouterAgent } from '../agents/jagd/router.js';
import type { AgentContext, AgentSession, AgentUser } from '../agents/jagd/types.js';
import { componentLoggers } from '../logger.js';

const logger = componentLoggers.http;

// Singleton router agent
const routerAgent = new RouterAgent();

// Request schema
const AIRespondBody = t.Object({
    message: t.String({ minLength: 1 }),
    sessionId: t.Optional(t.String()),
    conversationId: t.Optional(t.String()),
    geo: t.Optional(t.Object({
        mode: t.Union([t.Literal('none'), t.Literal('coarse_grid'), t.Literal('precise')]),
        gridId: t.Optional(t.String()),
        lat: t.Optional(t.Number()),
        lon: t.Optional(t.Number()),
        blurMeters: t.Optional(t.Number()),
    })),
    locale: t.Optional(t.Union([t.Literal('de'), t.Literal('en')])),
});

// Response schema
const AIRespondResponse = t.Object({
    success: t.Boolean(),
    response: t.Optional(t.Object({
        text: t.String(),
        agentRole: t.String(),
        toolCalls: t.Optional(t.Array(t.Any())),
        ui: t.Optional(t.Object({
            chips: t.Optional(t.Array(t.String())),
            primaryAction: t.Optional(t.Object({
                label: t.String(),
                tool: t.String(),
                params: t.Optional(t.Any()),
            })),
            secondaryActions: t.Optional(t.Array(t.Any())),
            explain: t.Optional(t.Array(t.String())),
        })),
        confirmationRequired: t.Optional(t.Object({
            tier: t.Number(),
            action: t.String(),
            summary: t.String(),
            preview: t.Any(),
            confirmToken: t.String(),
        })),
    })),
    error: t.Optional(t.String()),
});

export function createAIRespondRoutes() {
    return new Elysia({ prefix: '/api/v1/ai' })
        .post('/respond', async ({ body, set }) => {
            const startTime = Date.now();

            try {
                // Build agent context
                const context: AgentContext = {
                    user: buildMockUser(),
                    session: buildSession(body.sessionId, body.conversationId),
                    geo: body.geo,
                    locale: body.locale || 'de',
                    timestamp: new Date().toISOString(),
                };

                logger.info({
                    message: body.message.substring(0, 50),
                    hasGeo: !!body.geo,
                    locale: context.locale,
                }, 'AI respond request');

                // Route through agent system
                const response = await routerAgent.route(body.message, context);

                logger.info({
                    agentRole: response.agentRole,
                    hasToolCalls: !!response.toolCalls?.length,
                    hasUI: !!response.ui,
                    durationMs: Date.now() - startTime,
                }, 'AI respond complete');

                return {
                    success: true,
                    response,
                };
            } catch (error) {
                logger.error({ error, durationMs: Date.now() - startTime }, 'AI respond failed');
                set.status = 500;
                return {
                    success: false,
                    error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
                };
            }
        }, {
            body: AIRespondBody,
            response: AIRespondResponse,
        })

        // Confirm a pending action (Tier 2/3)
        .post('/confirm', async ({ body, set }) => {
            try {
                const { confirmToken, approved } = body as { confirmToken: string; approved: boolean };

                if (!confirmToken) {
                    set.status = 400;
                    return { success: false, error: 'confirmToken required' };
                }

                // In production, this would validate the token and execute the pending action
                logger.info({ confirmToken, approved }, 'Action confirmation');

                return {
                    success: true,
                    message: approved ? 'Aktion bestätigt' : 'Aktion abgebrochen',
                };
            } catch (error) {
                logger.error({ error }, 'Confirm action failed');
                set.status = 500;
                return { success: false, error: 'Confirmation failed' };
            }
        });
}

// Helper: Build mock user (in production, extracted from auth)
function buildMockUser(): AgentUser {
    return {
        id: 'demo-user-1',
        displayName: 'Demo Jäger',
        permissions: ['read', 'write', 'publish_friends'],
        revierIds: ['revier-1'],
        isGlobalAdmin: false,
    };
}

// Helper: Build session context
function buildSession(sessionId?: string, conversationId?: string): AgentSession {
    return {
        id: conversationId || `conv-${Date.now()}`,
        conversationHistory: [],
        activeSessionId: sessionId,
        lastToolCalls: [],
    };
}

export default createAIRespondRoutes;
