/**
 * Nachsuche API Routes
 *
 * Endpoints for tracking/search case management:
 * - Case creation from shot events
 * - Team assignment (shooter, handler, dog, driver, safety)
 * - Track segment logging
 * - Outcome analytics
 *
 * DB tables: nachsuche_cases, nachsuche_team, nachsuche_tracks
 */

import { Elysia, t } from 'elysia';
import { randomUUID } from 'crypto';
import { componentLoggers } from '../logger.js';

const log = componentLoggers.http;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NachsucheCase {
    id: string;
    sessionId: string;
    shotEventId?: string;
    shooterId: string;
    revierId?: string;
    geo: { lat: number; lng: number };
    shotConfidence: number;
    flightDirection?: string;
    signs: string[];
    waitTimeMinutes?: number;
    status: 'open' | 'started' | 'paused' | 'located' | 'recovered' | 'stopped' | 'closed';
    outcome?: string;
    lessonsLearned?: string;
    data: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}

interface TeamMember {
    id: string;
    caseId: string;
    userId: string;
    role: 'shooter' | 'handler' | 'dog' | 'driver' | 'safety_contact';
    dogName?: string;
    shareScope: 'private' | 'team_coarse';
    status: 'assigned' | 'accepted' | 'active' | 'completed';
    createdAt: string;
}

interface TrackSegment {
    id: string;
    caseId: string;
    recordedBy: string;
    geoStart: { lat: number; lng: number };
    geoEnd?: { lat: number; lng: number };
    startedAt: string;
    endedAt?: string;
    notes?: string;
    evidencePhotos: string[];
}

// ---------------------------------------------------------------------------
// In-Memory Store
// ---------------------------------------------------------------------------

const caseStore = new Map<string, NachsucheCase>();
const teamStore = new Map<string, TeamMember>();
const trackStore = new Map<string, TrackSegment>();

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export function createJagdNachsucheRoutes() {
    return new Elysia({ prefix: '/api/v1/jagd/nachsuche' })

        // ── Cases ──

        .get('/cases', async ({ query }) => {
            let cases = Array.from(caseStore.values());

            if (query.status) {
                cases = cases.filter(c => c.status === query.status);
            }
            if (query.sessionId) {
                cases = cases.filter(c => c.sessionId === query.sessionId);
            }

            cases.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            return { success: true, cases, count: cases.length };
        })

        .get('/cases/:id', async ({ params, set }) => {
            const nachsuche = caseStore.get(params.id);
            if (!nachsuche) {
                set.status = 404;
                return { error: 'Nachsuche nicht gefunden' };
            }

            // Include team members
            const team = Array.from(teamStore.values()).filter(m => m.caseId === params.id);

            return { success: true, nachsuche, team };
        })

        .post(
            '/cases',
            async ({ body }) => {
                const id = randomUUID();
                const now = new Date().toISOString();

                const nachsuche: NachsucheCase = {
                    id,
                    sessionId: body.sessionId,
                    shotEventId: body.shotEventId,
                    shooterId: body.shooterId ?? 'demo-user',
                    revierId: body.revierId,
                    geo: body.geo,
                    shotConfidence: body.shotConfidence,
                    flightDirection: body.flightDirection,
                    signs: body.signs ?? [],
                    waitTimeMinutes: body.waitTimeMinutes,
                    status: 'open',
                    data: {},
                    createdAt: now,
                    updatedAt: now,
                };

                caseStore.set(id, nachsuche);
                log.info({ caseId: id, confidence: body.shotConfidence }, 'Created nachsuche case');

                return { success: true, nachsuche };
            },
            {
                body: t.Object({
                    sessionId: t.String(),
                    shotEventId: t.Optional(t.String()),
                    shooterId: t.Optional(t.String()),
                    revierId: t.Optional(t.String()),
                    geo: t.Object({ lat: t.Number(), lng: t.Number() }),
                    shotConfidence: t.Number({ minimum: 0, maximum: 100 }),
                    flightDirection: t.Optional(t.String()),
                    signs: t.Optional(t.Array(t.String())),
                    waitTimeMinutes: t.Optional(t.Number()),
                }),
            }
        )

        .patch(
            '/cases/:id',
            async ({ params, body, set }) => {
                const nachsuche = caseStore.get(params.id);
                if (!nachsuche) {
                    set.status = 404;
                    return { error: 'Nachsuche nicht gefunden' };
                }

                if (body.status) nachsuche.status = body.status as NachsucheCase['status'];
                if (body.outcome !== undefined) nachsuche.outcome = body.outcome;
                if (body.lessonsLearned !== undefined) nachsuche.lessonsLearned = body.lessonsLearned;
                nachsuche.updatedAt = new Date().toISOString();

                caseStore.set(params.id, nachsuche);
                log.info({ caseId: params.id, status: nachsuche.status }, 'Updated nachsuche case');

                return { success: true, nachsuche };
            },
            {
                body: t.Object({
                    status: t.Optional(t.String()),
                    outcome: t.Optional(t.String()),
                    lessonsLearned: t.Optional(t.String()),
                }),
            }
        )

        // ── Team ──

        .post(
            '/cases/:id/team',
            async ({ params, body, set }) => {
                if (!caseStore.has(params.id)) {
                    set.status = 404;
                    return { error: 'Nachsuche nicht gefunden' };
                }

                const id = randomUUID();
                const member: TeamMember = {
                    id,
                    caseId: params.id,
                    userId: body.userId,
                    role: body.role,
                    dogName: body.dogName,
                    shareScope: body.shareScope ?? 'private',
                    status: 'assigned',
                    createdAt: new Date().toISOString(),
                };

                teamStore.set(id, member);
                log.info({ memberId: id, caseId: params.id, role: body.role }, 'Assigned nachsuche team member');

                return { success: true, member };
            },
            {
                body: t.Object({
                    userId: t.String(),
                    role: t.Union([
                        t.Literal('shooter'),
                        t.Literal('handler'),
                        t.Literal('dog'),
                        t.Literal('driver'),
                        t.Literal('safety_contact'),
                    ]),
                    dogName: t.Optional(t.String()),
                    shareScope: t.Optional(t.Union([t.Literal('private'), t.Literal('team_coarse')])),
                }),
            }
        )

        .patch(
            '/team/:id',
            async ({ params, body, set }) => {
                const member = teamStore.get(params.id);
                if (!member) {
                    set.status = 404;
                    return { error: 'Teammitglied nicht gefunden' };
                }

                if (body.status) member.status = body.status as TeamMember['status'];
                teamStore.set(params.id, member);

                return { success: true, member };
            },
            {
                body: t.Object({
                    status: t.Optional(t.String()),
                }),
            }
        )

        // ── Track Segments ──

        .get('/cases/:id/tracks', async ({ params }) => {
            const tracks = Array.from(trackStore.values())
                .filter(t => t.caseId === params.id)
                .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

            return { success: true, tracks, count: tracks.length };
        })

        .post(
            '/cases/:id/tracks',
            async ({ params, body, set }) => {
                if (!caseStore.has(params.id)) {
                    set.status = 404;
                    return { error: 'Nachsuche nicht gefunden' };
                }

                const id = randomUUID();
                const track: TrackSegment = {
                    id,
                    caseId: params.id,
                    recordedBy: body.recordedBy ?? 'demo-user',
                    geoStart: body.geoStart,
                    geoEnd: body.geoEnd,
                    startedAt: body.startedAt ?? new Date().toISOString(),
                    endedAt: body.endedAt,
                    notes: body.notes,
                    evidencePhotos: body.evidencePhotos ?? [],
                };

                trackStore.set(id, track);
                log.info({ trackId: id, caseId: params.id }, 'Added track segment');

                return { success: true, track };
            },
            {
                body: t.Object({
                    recordedBy: t.Optional(t.String()),
                    geoStart: t.Object({ lat: t.Number(), lng: t.Number() }),
                    geoEnd: t.Optional(t.Object({ lat: t.Number(), lng: t.Number() })),
                    startedAt: t.Optional(t.String()),
                    endedAt: t.Optional(t.String()),
                    notes: t.Optional(t.String()),
                    evidencePhotos: t.Optional(t.Array(t.String())),
                }),
            }
        )

        // ── Outcome Analytics ──

        .get('/outcomes', async () => {
            const cases = Array.from(caseStore.values())
                .filter(c => ['recovered', 'stopped', 'closed'].includes(c.status));

            const recovered = cases.filter(c => c.status === 'recovered').length;
            const stopped = cases.filter(c => c.status === 'stopped').length;
            const avgConfidence = cases.length > 0
                ? Math.round(cases.reduce((s, c) => s + c.shotConfidence, 0) / cases.length)
                : null;

            return {
                success: true,
                outcomes: {
                    totalClosed: cases.length,
                    recovered,
                    stopped,
                    recoveryRate: cases.length > 0 ? recovered / cases.length : 0,
                    avgConfidence,
                },
            };
        });
}

export default createJagdNachsucheRoutes;
