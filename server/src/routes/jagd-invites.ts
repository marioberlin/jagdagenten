/**
 * Invites API Routes
 *
 * Endpoints for Drückjagd invitations, public calls, and safety features.
 */

import { Elysia, t } from 'elysia';
import { randomUUID } from 'crypto';
import { componentLoggers } from '../logger.js';

const log = componentLoggers.http;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Invite {
    id: string;
    userId: string;
    inviteType: 'drueckjagd' | 'revierarbeit' | 'hundefuehrer' | 'begehung' | 'andere';
    title: string;
    description?: string;
    bundesland?: string;
    region?: string;
    eventDate?: string;
    eventTimeStart?: string;
    eventTimeEnd?: string;
    requiredRoles?: string[];
    maxParticipants?: number;
    currentParticipants: number;
    rulesAcknowledgementRequired: boolean;
    emergencyContactsRequired: boolean;
    experienceRequired?: 'none' | 'basic' | 'experienced';
    status: 'draft' | 'open' | 'closed' | 'cancelled';
    createdAt: string;
    expiresAt?: string;
}

interface Application {
    id: string;
    inviteId: string;
    userId: string;
    roleRequested?: string;
    message?: string;
    rulesAcknowledged: boolean;
    rulesAcknowledgedAt?: string;
    emergencyContact?: string;
    status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
    responseMessage?: string;
    respondedAt?: string;
    createdAt: string;
}

// ---------------------------------------------------------------------------
// In-Memory Stores
// ---------------------------------------------------------------------------

const inviteStore = new Map<string, Invite>();
const applicationStore = new Map<string, Application>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const INVITE_TYPE_CONFIG: Record<string, { label: string; icon: string }> = {
    drueckjagd: { label: 'Drückjagd', icon: '🎯' },
    revierarbeit: { label: 'Revierarbeit', icon: '🔧' },
    hundefuehrer: { label: 'Hundeführer gesucht', icon: '🐕' },
    begehung: { label: 'Revierbegehung', icon: '🚶' },
    andere: { label: 'Sonstige Einladung', icon: '📋' },
};

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export function createInviteRoutes() {
    return new Elysia({ prefix: '/api/v1/jagd/invites' })

        // Get invite types
        .get('/types', () => {
            return {
                success: true,
                types: Object.entries(INVITE_TYPE_CONFIG).map(([id, config]) => ({
                    id,
                    ...config,
                })),
            };
        })

        // Create invite
        .post(
            '/',
            async ({ body }) => {
                const id = randomUUID();
                const now = new Date();

                const invite: Invite = {
                    id,
                    userId: body.userId || 'anonymous',
                    inviteType: body.inviteType,
                    title: body.title,
                    description: body.description,
                    bundesland: body.bundesland,
                    region: body.region,
                    eventDate: body.eventDate,
                    eventTimeStart: body.eventTimeStart,
                    eventTimeEnd: body.eventTimeEnd,
                    requiredRoles: body.requiredRoles,
                    maxParticipants: body.maxParticipants,
                    currentParticipants: 0,
                    rulesAcknowledgementRequired: body.rulesAcknowledgementRequired ?? true,
                    emergencyContactsRequired: body.emergencyContactsRequired ?? true,
                    experienceRequired: body.experienceRequired,
                    status: body.publishNow ? 'open' : 'draft',
                    createdAt: now.toISOString(),
                    expiresAt: body.expiresAt,
                };

                inviteStore.set(id, invite);
                log.info({ inviteId: id, type: invite.inviteType }, 'Created invite');

                return {
                    success: true,
                    invite: {
                        id: invite.id,
                        title: invite.title,
                        status: invite.status,
                    },
                };
            },
            {
                body: t.Object({
                    userId: t.Optional(t.String()),
                    inviteType: t.String(),
                    title: t.String(),
                    description: t.Optional(t.String()),
                    bundesland: t.Optional(t.String()),
                    region: t.Optional(t.String()),
                    eventDate: t.Optional(t.String()),
                    eventTimeStart: t.Optional(t.String()),
                    eventTimeEnd: t.Optional(t.String()),
                    requiredRoles: t.Optional(t.Array(t.String())),
                    maxParticipants: t.Optional(t.Number()),
                    rulesAcknowledgementRequired: t.Optional(t.Boolean()),
                    emergencyContactsRequired: t.Optional(t.Boolean()),
                    experienceRequired: t.Optional(t.String()),
                    publishNow: t.Optional(t.Boolean()),
                    expiresAt: t.Optional(t.String()),
                }),
            }
        )

        // List invites
        .get('/', async ({ query }) => {
            const now = new Date();

            const invites = Array.from(inviteStore.values())
                .filter((i) => i.status === 'open')
                .filter((i) => !i.expiresAt || new Date(i.expiresAt) > now)
                .filter((i) => {
                    if (query.type && i.inviteType !== query.type) return false;
                    if (query.bundesland && i.bundesland !== query.bundesland) return false;
                    return true;
                })
                .sort((a, b) => {
                    // Sort by event date if available, otherwise by created date
                    if (a.eventDate && b.eventDate) {
                        return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
                    }
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                })
                .slice(0, Number(query.limit) || 20)
                .map((i) => ({
                    id: i.id,
                    inviteType: i.inviteType,
                    typeLabel: INVITE_TYPE_CONFIG[i.inviteType]?.label || i.inviteType,
                    typeIcon: INVITE_TYPE_CONFIG[i.inviteType]?.icon || '📋',
                    title: i.title,
                    description: i.description?.substring(0, 100),
                    bundesland: i.bundesland,
                    region: i.region,
                    eventDate: i.eventDate,
                    eventTimeStart: i.eventTimeStart,
                    requiredRoles: i.requiredRoles,
                    spotsLeft: i.maxParticipants ? i.maxParticipants - i.currentParticipants : null,
                    rulesRequired: i.rulesAcknowledgementRequired,
                }));

            return { success: true, invites, count: invites.length };
        })

        // Get single invite
        .get('/:id', async ({ params, set }) => {
            const invite = inviteStore.get(params.id);

            if (!invite) {
                set.status = 404;
                return { error: 'Einladung nicht gefunden' };
            }

            // Get applications count
            const applications = Array.from(applicationStore.values()).filter(
                (a) => a.inviteId === params.id
            );

            return {
                success: true,
                invite: {
                    ...invite,
                    typeLabel: INVITE_TYPE_CONFIG[invite.inviteType]?.label,
                    typeIcon: INVITE_TYPE_CONFIG[invite.inviteType]?.icon,
                    applicationsCount: applications.length,
                    acceptedCount: applications.filter((a) => a.status === 'accepted').length,
                },
            };
        })

        // Apply to invite
        .post(
            '/:id/apply',
            async ({ params, body, set }) => {
                const invite = inviteStore.get(params.id);

                if (!invite) {
                    set.status = 404;
                    return { error: 'Einladung nicht gefunden' };
                }

                if (invite.status !== 'open') {
                    set.status = 400;
                    return { error: 'Einladung nicht mehr offen' };
                }

                // Check if already applied
                const existing = Array.from(applicationStore.values()).find(
                    (a) => a.inviteId === params.id && a.userId === body.userId
                );

                if (existing) {
                    set.status = 400;
                    return { error: 'Bereits beworben' };
                }

                // Validate safety requirements
                if (invite.rulesAcknowledgementRequired && !body.rulesAcknowledged) {
                    set.status = 400;
                    return { error: 'Regeln müssen akzeptiert werden' };
                }

                if (invite.emergencyContactsRequired && !body.emergencyContact) {
                    set.status = 400;
                    return { error: 'Notfallkontakt erforderlich' };
                }

                const id = randomUUID();
                const now = new Date();

                const application: Application = {
                    id,
                    inviteId: params.id,
                    userId: body.userId,
                    roleRequested: body.roleRequested,
                    message: body.message,
                    rulesAcknowledged: body.rulesAcknowledged || false,
                    rulesAcknowledgedAt: body.rulesAcknowledged ? now.toISOString() : undefined,
                    emergencyContact: body.emergencyContact,
                    status: 'pending',
                    createdAt: now.toISOString(),
                };

                applicationStore.set(id, application);
                log.info({ applicationId: id, inviteId: params.id }, 'Created application');

                return {
                    success: true,
                    application: {
                        id: application.id,
                        status: application.status,
                    },
                };
            },
            {
                body: t.Object({
                    userId: t.String(),
                    roleRequested: t.Optional(t.String()),
                    message: t.Optional(t.String()),
                    rulesAcknowledged: t.Optional(t.Boolean()),
                    emergencyContact: t.Optional(t.String()),
                }),
            }
        )

        // Get applications for an invite (owner only)
        .get('/:id/applications', async ({ params, query, set }) => {
            const invite = inviteStore.get(params.id);

            if (!invite) {
                set.status = 404;
                return { error: 'Einladung nicht gefunden' };
            }

            // Check ownership
            if (invite.userId !== query.userId) {
                set.status = 403;
                return { error: 'Keine Berechtigung' };
            }

            const applications = Array.from(applicationStore.values())
                .filter((a) => a.inviteId === params.id)
                .map((a) => ({
                    id: a.id,
                    userId: a.userId,
                    roleRequested: a.roleRequested,
                    message: a.message,
                    rulesAcknowledged: a.rulesAcknowledged,
                    emergencyContact: a.emergencyContact,
                    status: a.status,
                    createdAt: a.createdAt,
                }));

            return { success: true, applications };
        })

        // Accept application
        .post('/:id/applications/:appId/accept', async ({ params, body, set }) => {
            const invite = inviteStore.get(params.id);
            const application = applicationStore.get(params.appId);

            if (!invite || !application) {
                set.status = 404;
                return { error: 'Nicht gefunden' };
            }

            if (invite.userId !== body?.userId) {
                set.status = 403;
                return { error: 'Keine Berechtigung' };
            }

            application.status = 'accepted';
            application.responseMessage = body?.message;
            application.respondedAt = new Date().toISOString();
            applicationStore.set(params.appId, application);

            // Increment participant count
            invite.currentParticipants++;
            inviteStore.set(params.id, invite);

            log.info({ applicationId: params.appId }, 'Accepted application');

            return { success: true };
        })

        // Reject application
        .post('/:id/applications/:appId/reject', async ({ params, body, set }) => {
            const invite = inviteStore.get(params.id);
            const application = applicationStore.get(params.appId);

            if (!invite || !application) {
                set.status = 404;
                return { error: 'Nicht gefunden' };
            }

            if (invite.userId !== body?.userId) {
                set.status = 403;
                return { error: 'Keine Berechtigung' };
            }

            application.status = 'rejected';
            application.responseMessage = body?.message;
            application.respondedAt = new Date().toISOString();
            applicationStore.set(params.appId, application);

            log.info({ applicationId: params.appId }, 'Rejected application');

            return { success: true };
        })

        // Close invite
        .post('/:id/close', async ({ params, body, set }) => {
            const invite = inviteStore.get(params.id);

            if (!invite) {
                set.status = 404;
                return { error: 'Einladung nicht gefunden' };
            }

            if (invite.userId !== body?.userId) {
                set.status = 403;
                return { error: 'Keine Berechtigung' };
            }

            invite.status = 'closed';
            inviteStore.set(params.id, invite);

            return { success: true };
        })

        // Delete invite
        .delete('/:id', async ({ params, body, set }) => {
            const invite = inviteStore.get(params.id);

            if (!invite) {
                set.status = 404;
                return { error: 'Einladung nicht gefunden' };
            }

            if (invite.userId !== body?.userId) {
                set.status = 403;
                return { error: 'Keine Berechtigung' };
            }

            inviteStore.delete(params.id);
            log.info({ inviteId: params.id }, 'Deleted invite');

            return { success: true };
        });
}

export default createInviteRoutes;
