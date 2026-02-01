/**
 * Wildunfall API Routes
 *
 * Endpoints for wildlife collision incident management:
 * - Incident reporting and status tracking
 * - On-call roster management
 * - Dispatch notifications
 * - Response metrics
 *
 * DB tables: wildunfall_incidents, wildunfall_oncall_roster, wildunfall_dispatch_log
 */

import { Elysia, t } from 'elysia';
import { randomUUID } from 'crypto';
import { componentLoggers } from '../logger.js';

const log = componentLoggers.http;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WildunfallIncident {
    id: string;
    reporterId: string;
    revierId?: string;
    time: string;
    geo: { lat: number; lng: number };
    suspectedSpecies?: string;
    injuryStatus?: 'unknown' | 'likely_alive' | 'likely_dead';
    reporterNotes?: string;
    status: 'open' | 'accepted' | 'arrived' | 'resolved' | 'closed';
    responderId?: string;
    acceptedAt?: string;
    arrivedAt?: string;
    resolvedAt?: string;
    outcome?: string;
    photos: string[];
    data: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}

interface OncallResponder {
    id: string;
    revierId: string;
    userId: string;
    priority: number;
    active: boolean;
    phone?: string;
    notifyMode: 'in_app' | 'sms' | 'whatsapp_link';
    createdAt: string;
}

interface DispatchEntry {
    id: string;
    incidentId: string;
    userId: string;
    notifyMode: string;
    message?: string;
    status: 'sent' | 'delivered' | 'accepted' | 'declined' | 'timeout';
    sentAt: string;
    respondedAt?: string;
}

// ---------------------------------------------------------------------------
// In-Memory Store (use PostgreSQL in production)
// ---------------------------------------------------------------------------

const incidentStore = new Map<string, WildunfallIncident>();
const rosterStore = new Map<string, OncallResponder>();
const dispatchStore = new Map<string, DispatchEntry>();

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export function createJagdWildunfallRoutes() {
    return new Elysia({ prefix: '/api/v1/jagd/wildunfall' })

        // ── Incidents ──

        .get('/incidents', async ({ query }) => {
            let incidents = Array.from(incidentStore.values());

            if (query.status) {
                incidents = incidents.filter(i => i.status === query.status);
            }
            if (query.revierId) {
                incidents = incidents.filter(i => i.revierId === query.revierId);
            }

            incidents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            return { success: true, incidents, count: incidents.length };
        })

        .get('/incidents/:id', async ({ params, set }) => {
            const incident = incidentStore.get(params.id);
            if (!incident) {
                set.status = 404;
                return { error: 'Vorfall nicht gefunden' };
            }
            return { success: true, incident };
        })

        .post(
            '/incidents',
            async ({ body }) => {
                const id = randomUUID();
                const now = new Date().toISOString();

                const incident: WildunfallIncident = {
                    id,
                    reporterId: body.reporterId ?? 'demo-user',
                    revierId: body.revierId,
                    time: body.time ?? now,
                    geo: body.geo,
                    suspectedSpecies: body.suspectedSpecies,
                    injuryStatus: body.injuryStatus ?? 'unknown',
                    reporterNotes: body.reporterNotes,
                    status: 'open',
                    photos: body.photos ?? [],
                    data: {},
                    createdAt: now,
                    updatedAt: now,
                };

                incidentStore.set(id, incident);
                log.info({ incidentId: id, species: body.suspectedSpecies }, 'Reported wildunfall incident');

                return { success: true, incident };
            },
            {
                body: t.Object({
                    reporterId: t.Optional(t.String()),
                    revierId: t.Optional(t.String()),
                    time: t.Optional(t.String()),
                    geo: t.Object({ lat: t.Number(), lng: t.Number() }),
                    suspectedSpecies: t.Optional(t.String()),
                    injuryStatus: t.Optional(t.Union([
                        t.Literal('unknown'),
                        t.Literal('likely_alive'),
                        t.Literal('likely_dead'),
                    ])),
                    reporterNotes: t.Optional(t.String()),
                    photos: t.Optional(t.Array(t.String())),
                }),
            }
        )

        .patch(
            '/incidents/:id',
            async ({ params, body, set }) => {
                const incident = incidentStore.get(params.id);
                if (!incident) {
                    set.status = 404;
                    return { error: 'Vorfall nicht gefunden' };
                }

                const now = new Date().toISOString();

                if (body.status === 'accepted' && !incident.acceptedAt) {
                    incident.acceptedAt = now;
                    incident.responderId = body.responderId;
                }
                if (body.status === 'arrived' && !incident.arrivedAt) {
                    incident.arrivedAt = now;
                }
                if (body.status === 'resolved' && !incident.resolvedAt) {
                    incident.resolvedAt = now;
                    incident.outcome = body.outcome;
                }

                incident.status = (body.status as WildunfallIncident['status']) ?? incident.status;
                incident.updatedAt = now;

                if (body.photos) {
                    incident.photos.push(...body.photos);
                }

                incidentStore.set(params.id, incident);
                log.info({ incidentId: params.id, status: incident.status }, 'Updated wildunfall incident');

                return { success: true, incident };
            },
            {
                body: t.Object({
                    status: t.Optional(t.String()),
                    responderId: t.Optional(t.String()),
                    outcome: t.Optional(t.String()),
                    photos: t.Optional(t.Array(t.String())),
                }),
            }
        )

        // ── On-Call Roster ──

        .get('/oncall', async ({ query }) => {
            let roster = Array.from(rosterStore.values());

            if (query.revierId) {
                roster = roster.filter(r => r.revierId === query.revierId);
            }

            roster = roster.filter(r => r.active)
                .sort((a, b) => a.priority - b.priority);

            return { success: true, roster, count: roster.length };
        })

        .post(
            '/oncall',
            async ({ body }) => {
                const id = randomUUID();
                const now = new Date().toISOString();

                const responder: OncallResponder = {
                    id,
                    revierId: body.revierId,
                    userId: body.userId,
                    priority: body.priority ?? 1,
                    active: true,
                    phone: body.phone,
                    notifyMode: body.notifyMode ?? 'in_app',
                    createdAt: now,
                };

                rosterStore.set(id, responder);
                log.info({ responderId: id }, 'Added on-call responder');

                return { success: true, responder };
            },
            {
                body: t.Object({
                    revierId: t.String(),
                    userId: t.String(),
                    priority: t.Optional(t.Number()),
                    phone: t.Optional(t.String()),
                    notifyMode: t.Optional(t.Union([
                        t.Literal('in_app'),
                        t.Literal('sms'),
                        t.Literal('whatsapp_link'),
                    ])),
                }),
            }
        )

        .patch(
            '/oncall/:id',
            async ({ params, body, set }) => {
                const responder = rosterStore.get(params.id);
                if (!responder) {
                    set.status = 404;
                    return { error: 'Bereitschaft nicht gefunden' };
                }

                Object.assign(responder, body);
                rosterStore.set(params.id, responder);

                return { success: true, responder };
            },
            {
                body: t.Object({
                    priority: t.Optional(t.Number()),
                    active: t.Optional(t.Boolean()),
                    phone: t.Optional(t.String()),
                    notifyMode: t.Optional(t.String()),
                }),
            }
        )

        .delete('/oncall/:id', async ({ params, set }) => {
            if (!rosterStore.has(params.id)) {
                set.status = 404;
                return { error: 'Bereitschaft nicht gefunden' };
            }
            rosterStore.delete(params.id);
            return { success: true };
        })

        // ── Dispatch ──

        .post(
            '/dispatch/:incidentId',
            async ({ params, set }) => {
                const incident = incidentStore.get(params.incidentId);
                if (!incident) {
                    set.status = 404;
                    return { error: 'Vorfall nicht gefunden' };
                }

                // Find on-call responders for the revier
                const roster = Array.from(rosterStore.values())
                    .filter(r => r.active && (r.revierId === incident.revierId || !incident.revierId))
                    .sort((a, b) => a.priority - b.priority);

                const dispatched: DispatchEntry[] = [];

                for (const responder of roster) {
                    const entry: DispatchEntry = {
                        id: randomUUID(),
                        incidentId: params.incidentId,
                        userId: responder.userId,
                        notifyMode: responder.notifyMode,
                        message: `Wildunfall gemeldet: ${incident.suspectedSpecies ?? 'Unbekannte Wildart'} bei ${incident.geo.lat.toFixed(4)}, ${incident.geo.lng.toFixed(4)}`,
                        status: 'sent',
                        sentAt: new Date().toISOString(),
                    };

                    dispatchStore.set(entry.id, entry);
                    dispatched.push(entry);
                }

                log.info({ incidentId: params.incidentId, dispatched: dispatched.length }, 'Dispatched wildunfall alerts');

                return { success: true, dispatched, count: dispatched.length };
            }
        )

        // ── Metrics ──

        .get('/metrics', async () => {
            const incidents = Array.from(incidentStore.values());
            const total = incidents.length;
            const resolved = incidents.filter(i => i.status === 'resolved' || i.status === 'closed').length;
            const open = incidents.filter(i => i.status === 'open').length;

            // Calculate average response time
            const withAccept = incidents.filter(i => i.acceptedAt);
            const avgAcceptMin = withAccept.length > 0
                ? withAccept.reduce((sum, i) => {
                    return sum + (new Date(i.acceptedAt!).getTime() - new Date(i.createdAt).getTime()) / 60000;
                }, 0) / withAccept.length
                : null;

            return {
                success: true,
                metrics: {
                    totalIncidents: total,
                    resolved,
                    open,
                    resolutionRate: total > 0 ? resolved / total : 0,
                    avgAcceptTimeMinutes: avgAcceptMin ? Math.round(avgAcceptMin) : null,
                },
            };
        });
}

export default createJagdWildunfallRoutes;
