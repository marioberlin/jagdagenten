/**
 * Jagd Session Routes
 *
 * API endpoints for hunt session management.
 */

import { Elysia, t } from 'elysia';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HuntSession {
    id: string;
    type: 'ansitz' | 'pirsch' | 'drueckjagd';
    status: 'active' | 'completed' | 'cancelled';
    startTime: string;
    endTime?: string;
    stand?: {
        id: string;
        name: string;
        type: string;
        lat: number;
        lon: number;
    };
    weatherSnapshot?: Record<string, unknown>;
    observations: Array<{
        id: string;
        timestamp: string;
        species: string;
        count: number;
        behavior?: string;
        notes?: string;
    }>;
    shots: Array<{
        id: string;
        timestamp: string;
        result: 'hit' | 'miss' | 'unknown';
        harvestId?: string;
    }>;
    harvests: Array<{
        id: string;
        timestamp: string;
        species: string;
        gender?: string;
        weight?: number;
    }>;
    notes?: string;
    userId?: string;
}

// ---------------------------------------------------------------------------
// In-Memory Store (use PostgreSQL in production)
// ---------------------------------------------------------------------------

const sessionStore = new Map<string, HuntSession>();

// ---------------------------------------------------------------------------
// Route Factory
// ---------------------------------------------------------------------------

export function createSessionRoutes() {
    return new Elysia({ prefix: '/api/v1/jagd/session' })

        // -----------------------------------------------------------------
        // Start a new session
        // -----------------------------------------------------------------
        .post(
            '/start',
            async ({ body }) => {
                const session = body as HuntSession;
                sessionStore.set(session.id, session);

                return {
                    success: true,
                    sessionId: session.id,
                    message: 'Session gestartet',
                };
            },
            {
                body: t.Object({
                    id: t.String(),
                    type: t.String(),
                    status: t.String(),
                    startTime: t.String(),
                    stand: t.Optional(t.Object({
                        id: t.String(),
                        name: t.String(),
                        type: t.String(),
                        lat: t.Number(),
                        lon: t.Number(),
                    })),
                    weatherSnapshot: t.Optional(t.Any()),
                    observations: t.Array(t.Any()),
                    shots: t.Array(t.Any()),
                    harvests: t.Array(t.Any()),
                    notes: t.Optional(t.String()),
                }),
            }
        )

        // -----------------------------------------------------------------
        // End active session
        // -----------------------------------------------------------------
        .post(
            '/end',
            async ({ body }) => {
                const session = body as HuntSession;
                sessionStore.set(session.id, session);

                // Calculate summary
                const duration = session.endTime
                    ? Math.round(
                        (new Date(session.endTime).getTime() -
                            new Date(session.startTime).getTime()) /
                        60000
                    )
                    : 0;

                return {
                    success: true,
                    summary: {
                        id: session.id,
                        type: session.type,
                        status: session.status,
                        startTime: session.startTime,
                        endTime: session.endTime,
                        duration,
                        standName: session.stand?.name,
                        observationCount: session.observations.length,
                        shotCount: session.shots.length,
                        harvestCount: session.harvests.length,
                    },
                };
            },
            {
                body: t.Object({
                    id: t.String(),
                    type: t.String(),
                    status: t.String(),
                    startTime: t.String(),
                    endTime: t.Optional(t.String()),
                    stand: t.Optional(t.Any()),
                    weatherSnapshot: t.Optional(t.Any()),
                    observations: t.Array(t.Any()),
                    shots: t.Array(t.Any()),
                    harvests: t.Array(t.Any()),
                    notes: t.Optional(t.String()),
                }),
            }
        )

        // -----------------------------------------------------------------
        // Get active session
        // -----------------------------------------------------------------
        .get('/active', async () => {
            // Find active session (in production, filter by userId)
            const activeSessions = Array.from(sessionStore.values()).filter(
                (s) => s.status === 'active'
            );

            return {
                session: activeSessions[0] || null,
            };
        })

        // -----------------------------------------------------------------
        // Get session by ID
        // -----------------------------------------------------------------
        .get(
            '/:id',
            async ({ params }) => {
                const session = sessionStore.get(params.id);

                if (!session) {
                    return { error: 'Session nicht gefunden' };
                }

                return { session };
            },
            {
                params: t.Object({
                    id: t.String(),
                }),
            }
        )

        // -----------------------------------------------------------------
        // Get session history
        // -----------------------------------------------------------------
        .get('/history', async () => {
            const sessions = Array.from(sessionStore.values())
                .filter((s) => s.status === 'completed')
                .sort(
                    (a, b) =>
                        new Date(b.startTime).getTime() -
                        new Date(a.startTime).getTime()
                )
                .slice(0, 50)
                .map((s) => ({
                    id: s.id,
                    type: s.type,
                    status: s.status,
                    startTime: s.startTime,
                    endTime: s.endTime,
                    duration: s.endTime
                        ? Math.round(
                            (new Date(s.endTime).getTime() -
                                new Date(s.startTime).getTime()) /
                            60000
                        )
                        : 0,
                    standName: s.stand?.name,
                    observationCount: s.observations.length,
                    shotCount: s.shots.length,
                    harvestCount: s.harvests.length,
                }));

            return { sessions };
        })

        // -----------------------------------------------------------------
        // Add observation to active session
        // -----------------------------------------------------------------
        .post(
            '/:id/observation',
            async ({ params, body }) => {
                const session = sessionStore.get(params.id);

                if (!session) {
                    return { error: 'Session nicht gefunden' };
                }

                if (session.status !== 'active') {
                    return { error: 'Session ist nicht aktiv' };
                }

                const observation = {
                    id: `obs-${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    ...body,
                };

                session.observations.push(observation);
                sessionStore.set(session.id, session);

                return { success: true, observation };
            },
            {
                params: t.Object({
                    id: t.String(),
                }),
                body: t.Object({
                    species: t.String(),
                    count: t.Number(),
                    behavior: t.Optional(t.String()),
                    notes: t.Optional(t.String()),
                }),
            }
        )

        // -----------------------------------------------------------------
        // Add shot to active session
        // -----------------------------------------------------------------
        .post(
            '/:id/shot',
            async ({ params, body }) => {
                const session = sessionStore.get(params.id);

                if (!session) {
                    return { error: 'Session nicht gefunden' };
                }

                if (session.status !== 'active') {
                    return { error: 'Session ist nicht aktiv' };
                }

                const shot = {
                    id: `shot-${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    ...body,
                };

                session.shots.push(shot);
                sessionStore.set(session.id, session);

                return { success: true, shot };
            },
            {
                params: t.Object({
                    id: t.String(),
                }),
                body: t.Object({
                    result: t.String(),
                    harvestId: t.Optional(t.String()),
                }),
            }
        )

        // -----------------------------------------------------------------
        // Add harvest to active session
        // -----------------------------------------------------------------
        .post(
            '/:id/harvest',
            async ({ params, body }) => {
                const session = sessionStore.get(params.id);

                if (!session) {
                    return { error: 'Session nicht gefunden' };
                }

                if (session.status !== 'active') {
                    return { error: 'Session ist nicht aktiv' };
                }

                const harvest = {
                    id: `harvest-${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    ...body,
                };

                session.harvests.push(harvest);
                sessionStore.set(session.id, session);

                return { success: true, harvest };
            },
            {
                params: t.Object({
                    id: t.String(),
                }),
                body: t.Object({
                    species: t.String(),
                    gender: t.Optional(t.String()),
                    weight: t.Optional(t.Number()),
                }),
            }
        );
}

export default createSessionRoutes;
