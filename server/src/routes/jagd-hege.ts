/**
 * Hege & Pflege API Routes
 *
 * Endpoints for conservation work management:
 * - Hege projects (Revierarbeit, Kitzrettung, feeding, etc.)
 * - Activity logging
 * - Mowing notices (Kitzrettung trigger)
 * - Weekly summary
 *
 * DB tables: hege_projects, hege_activities, mowing_notices
 */

import { Elysia, t } from 'elysia';
import { randomUUID } from 'crypto';
import { componentLoggers } from '../logger.js';

const log = componentLoggers.http;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HegeProject {
    id: string;
    userId: string;
    revierId?: string;
    projectType: string;
    title: string;
    date: string;
    meetingPointGeo?: { lat: number; lng: number };
    teamScope: 'private' | 'team';
    status: 'planned' | 'active' | 'completed' | 'cancelled';
    tasks: Array<{ text: string; done: boolean }>;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

interface HegeActivity {
    id: string;
    userId: string;
    projectId?: string;
    activityType: string;
    time: string;
    geo?: { lat: number; lng: number };
    data: Record<string, unknown>;
    photos: string[];
    createdAt: string;
}

interface MowingNotice {
    id: string;
    revierId?: string;
    fieldName: string;
    geo: { lat: number; lng: number };
    mowingStart: string;
    mowingEnd?: string;
    contactName?: string;
    contactPhone?: string;
    notes?: string;
    status: 'pending' | 'assigned' | 'cleared' | 'cancelled';
    kitzrettungProjectId?: string;
    createdAt: string;
    updatedAt: string;
}

// ---------------------------------------------------------------------------
// In-Memory Store (use PostgreSQL in production via 029_hege_wildunfall_nachsuche.sql)
// ---------------------------------------------------------------------------

const projectStore = new Map<string, HegeProject>();
const activityStore = new Map<string, HegeActivity>();
const mowingStore = new Map<string, MowingNotice>();

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export function createJagdHegeRoutes() {
    return new Elysia({ prefix: '/api/v1/jagd/hege' })

        // ── Projects ──

        .get('/projects', async ({ query }) => {
            let projects = Array.from(projectStore.values());

            if (query.status) {
                projects = projects.filter(p => p.status === query.status);
            }
            if (query.type) {
                projects = projects.filter(p => p.projectType === query.type);
            }

            projects.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            return { success: true, projects, count: projects.length };
        })

        .post(
            '/projects',
            async ({ body }) => {
                const id = randomUUID();
                const now = new Date().toISOString();

                const project: HegeProject = {
                    id,
                    userId: body.userId ?? 'demo-user',
                    revierId: body.revierId,
                    projectType: body.projectType,
                    title: body.title,
                    date: body.date,
                    meetingPointGeo: body.meetingPointGeo,
                    teamScope: body.teamScope ?? 'private',
                    status: 'planned',
                    tasks: body.tasks ?? [],
                    notes: body.notes,
                    createdAt: now,
                    updatedAt: now,
                };

                projectStore.set(id, project);
                log.info({ projectId: id, type: body.projectType }, 'Created hege project');

                return { success: true, project };
            },
            {
                body: t.Object({
                    userId: t.Optional(t.String()),
                    revierId: t.Optional(t.String()),
                    projectType: t.Union([
                        t.Literal('revierarbeit'),
                        t.Literal('kitzrettung'),
                        t.Literal('feeding_round'),
                        t.Literal('nest_boxes'),
                        t.Literal('habitat'),
                        t.Literal('infrastructure'),
                    ]),
                    title: t.String(),
                    date: t.String(),
                    meetingPointGeo: t.Optional(t.Object({ lat: t.Number(), lng: t.Number() })),
                    teamScope: t.Optional(t.Union([t.Literal('private'), t.Literal('team')])),
                    tasks: t.Optional(t.Array(t.Object({ text: t.String(), done: t.Boolean() }))),
                    notes: t.Optional(t.String()),
                }),
            }
        )

        .patch(
            '/projects/:id',
            async ({ params, body, set }) => {
                const project = projectStore.get(params.id);
                if (!project) {
                    set.status = 404;
                    return { error: 'Projekt nicht gefunden' };
                }

                Object.assign(project, body, { updatedAt: new Date().toISOString() });
                projectStore.set(params.id, project);
                log.info({ projectId: params.id }, 'Updated hege project');

                return { success: true, project };
            },
            {
                body: t.Object({
                    title: t.Optional(t.String()),
                    status: t.Optional(t.String()),
                    tasks: t.Optional(t.Array(t.Object({ text: t.String(), done: t.Boolean() }))),
                    notes: t.Optional(t.String()),
                    teamScope: t.Optional(t.String()),
                }),
            }
        )

        .delete('/projects/:id', async ({ params, set }) => {
            if (!projectStore.has(params.id)) {
                set.status = 404;
                return { error: 'Projekt nicht gefunden' };
            }
            projectStore.delete(params.id);
            log.info({ projectId: params.id }, 'Deleted hege project');
            return { success: true };
        })

        // ── Activities ──

        .get('/activities', async ({ query }) => {
            let activities = Array.from(activityStore.values());

            if (query.projectId) {
                activities = activities.filter(a => a.projectId === query.projectId);
            }
            if (query.type) {
                activities = activities.filter(a => a.activityType === query.type);
            }

            activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

            return { success: true, activities, count: activities.length };
        })

        .post(
            '/activities',
            async ({ body }) => {
                const id = randomUUID();
                const now = new Date().toISOString();

                const activity: HegeActivity = {
                    id,
                    userId: body.userId ?? 'demo-user',
                    projectId: body.projectId,
                    activityType: body.activityType,
                    time: body.time ?? now,
                    geo: body.geo,
                    data: body.data ?? {},
                    photos: body.photos ?? [],
                    createdAt: now,
                };

                activityStore.set(id, activity);
                log.info({ activityId: id, type: body.activityType }, 'Logged hege activity');

                return { success: true, activity };
            },
            {
                body: t.Object({
                    userId: t.Optional(t.String()),
                    projectId: t.Optional(t.String()),
                    activityType: t.Union([
                        t.Literal('feeding'),
                        t.Literal('nest_box'),
                        t.Literal('habitat'),
                        t.Literal('infrastructure'),
                        t.Literal('counting'),
                        t.Literal('note'),
                    ]),
                    time: t.Optional(t.String()),
                    geo: t.Optional(t.Object({ lat: t.Number(), lng: t.Number() })),
                    data: t.Optional(t.Record(t.String(), t.Unknown())),
                    photos: t.Optional(t.Array(t.String())),
                }),
            }
        )

        // ── Weekly Summary ──

        .get('/summary', async () => {
            const now = new Date();
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            weekStart.setHours(0, 0, 0, 0);

            const activities = Array.from(activityStore.values())
                .filter(a => new Date(a.time) >= weekStart);

            const summary: Record<string, number> = {};
            for (const a of activities) {
                summary[a.activityType] = (summary[a.activityType] ?? 0) + 1;
            }

            return {
                success: true,
                weekStart: weekStart.toISOString(),
                totalActivities: activities.length,
                byType: summary,
            };
        })

        // ── Mowing Notices ──

        .get('/mowing', async ({ query }) => {
            let notices = Array.from(mowingStore.values());

            if (query.status) {
                notices = notices.filter(n => n.status === query.status);
            }

            notices.sort((a, b) => new Date(a.mowingStart).getTime() - new Date(b.mowingStart).getTime());

            return { success: true, notices, count: notices.length };
        })

        .post(
            '/mowing',
            async ({ body }) => {
                const id = randomUUID();
                const now = new Date().toISOString();

                const notice: MowingNotice = {
                    id,
                    revierId: body.revierId,
                    fieldName: body.fieldName,
                    geo: body.geo,
                    mowingStart: body.mowingStart,
                    mowingEnd: body.mowingEnd,
                    contactName: body.contactName,
                    contactPhone: body.contactPhone,
                    notes: body.notes,
                    status: 'pending',
                    createdAt: now,
                    updatedAt: now,
                };

                mowingStore.set(id, notice);
                log.info({ noticeId: id, field: body.fieldName }, 'Created mowing notice');

                return { success: true, notice };
            },
            {
                body: t.Object({
                    revierId: t.Optional(t.String()),
                    fieldName: t.String(),
                    geo: t.Object({ lat: t.Number(), lng: t.Number() }),
                    mowingStart: t.String(),
                    mowingEnd: t.Optional(t.String()),
                    contactName: t.Optional(t.String()),
                    contactPhone: t.Optional(t.String()),
                    notes: t.Optional(t.String()),
                }),
            }
        )

        .patch(
            '/mowing/:id',
            async ({ params, body, set }) => {
                const notice = mowingStore.get(params.id);
                if (!notice) {
                    set.status = 404;
                    return { error: 'Mahd-Meldung nicht gefunden' };
                }

                Object.assign(notice, body, { updatedAt: new Date().toISOString() });
                mowingStore.set(params.id, notice);
                log.info({ noticeId: params.id, status: body.status }, 'Updated mowing notice');

                return { success: true, notice };
            },
            {
                body: t.Object({
                    status: t.Optional(t.String()),
                    kitzrettungProjectId: t.Optional(t.String()),
                    notes: t.Optional(t.String()),
                }),
            }
        );
}

export default createJagdHegeRoutes;
