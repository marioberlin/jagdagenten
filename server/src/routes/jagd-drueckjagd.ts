/**
 * Drückjagd Routes
 *
 * API endpoints for driven hunt management, check-in, and pack generation.
 */

import { Elysia, t } from 'elysia';
import { componentLoggers } from '../logger.js';

const logger = componentLoggers.http;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ParticipantRole = 'stand' | 'treiber' | 'hundefuehrer' | 'jagdleiter';

interface Participant {
    id: string;
    name: string;
    role: ParticipantRole;
    standNumber?: number;
    phone?: string;
    checkedIn: boolean;
    checkedInAt?: string;
}

interface DruckjagdEvent {
    id: string;
    name: string;
    date: string;
    startTime: string;
    endTime?: string;
    location: string;
    meetingPoint: string;
    participants: Participant[];
    emergencyContact: {
        name: string;
        phone: string;
    };
    status: 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled';
    checkInCode?: string;
    createdAt: string;
    updatedAt: string;
}

// ---------------------------------------------------------------------------
// In-Memory Store (use PostgreSQL in production)
// ---------------------------------------------------------------------------

const eventStore = new Map<string, DruckjagdEvent>();

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

function generateCheckInCode(): string {
    // 6-character alphanumeric code
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ---------------------------------------------------------------------------
// Route Factory
// ---------------------------------------------------------------------------

export function createDrueckjagdRoutes() {
    return new Elysia({ prefix: '/api/v1/jagd/drueckjagd' })

        // -----------------------------------------------------------------
        // List all events
        // -----------------------------------------------------------------
        .get('/events', async () => {
            const events = Array.from(eventStore.values())
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            return { events };
        })

        // -----------------------------------------------------------------
        // Create new event
        // -----------------------------------------------------------------
        .post(
            '/events',
            async ({ body }) => {
                const event: DruckjagdEvent = {
                    id: `dj-${Date.now()}`,
                    name: body.name,
                    date: body.date,
                    startTime: body.startTime,
                    endTime: body.endTime,
                    location: body.location,
                    meetingPoint: body.meetingPoint || '',
                    participants: [],
                    emergencyContact: body.emergencyContact || { name: '', phone: '' },
                    status: 'draft',
                    checkInCode: generateCheckInCode(),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };

                eventStore.set(event.id, event);
                logger.info({ eventId: event.id }, 'Drückjagd event created');

                return { success: true, event };
            },
            {
                body: t.Object({
                    name: t.String(),
                    date: t.String(),
                    startTime: t.String(),
                    endTime: t.Optional(t.String()),
                    location: t.String(),
                    meetingPoint: t.Optional(t.String()),
                    emergencyContact: t.Optional(
                        t.Object({
                            name: t.String(),
                            phone: t.String(),
                        })
                    ),
                }),
            }
        )

        // -----------------------------------------------------------------
        // Get single event
        // -----------------------------------------------------------------
        .get(
            '/events/:id',
            async ({ params, set }) => {
                const event = eventStore.get(params.id);
                if (!event) {
                    set.status = 404;
                    return { error: 'Event nicht gefunden' };
                }
                return { event };
            },
            {
                params: t.Object({ id: t.String() }),
            }
        )

        // -----------------------------------------------------------------
        // Update event
        // -----------------------------------------------------------------
        .patch(
            '/events/:id',
            async ({ params, body, set }) => {
                const event = eventStore.get(params.id);
                if (!event) {
                    set.status = 404;
                    return { error: 'Event nicht gefunden' };
                }

                const updated = {
                    ...event,
                    ...body,
                    updatedAt: new Date().toISOString(),
                };
                eventStore.set(params.id, updated);

                return { success: true, event: updated };
            },
            {
                params: t.Object({ id: t.String() }),
            }
        )

        // -----------------------------------------------------------------
        // Add participant
        // -----------------------------------------------------------------
        .post(
            '/events/:id/participants',
            async ({ params, body, set }) => {
                const event = eventStore.get(params.id);
                if (!event) {
                    set.status = 404;
                    return { error: 'Event nicht gefunden' };
                }

                const standCount = event.participants.filter(p => p.role === 'stand').length;

                const participant: Participant = {
                    id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    name: body.name,
                    role: body.role as ParticipantRole,
                    standNumber: body.role === 'stand' ? standCount + 1 : undefined,
                    phone: body.phone,
                    checkedIn: false,
                };

                event.participants.push(participant);
                event.updatedAt = new Date().toISOString();
                eventStore.set(params.id, event);

                return { success: true, participant };
            },
            {
                params: t.Object({ id: t.String() }),
                body: t.Object({
                    name: t.String(),
                    role: t.String(),
                    phone: t.Optional(t.String()),
                }),
            }
        )

        // -----------------------------------------------------------------
        // Remove participant
        // -----------------------------------------------------------------
        .delete(
            '/events/:eventId/participants/:participantId',
            async ({ params, set }) => {
                const event = eventStore.get(params.eventId);
                if (!event) {
                    set.status = 404;
                    return { error: 'Event nicht gefunden' };
                }

                const index = event.participants.findIndex(p => p.id === params.participantId);
                if (index === -1) {
                    set.status = 404;
                    return { error: 'Teilnehmer nicht gefunden' };
                }

                event.participants.splice(index, 1);
                event.updatedAt = new Date().toISOString();
                eventStore.set(params.eventId, event);

                return { success: true };
            },
            {
                params: t.Object({
                    eventId: t.String(),
                    participantId: t.String(),
                }),
            }
        )

        // -----------------------------------------------------------------
        // Check-in with code
        // -----------------------------------------------------------------
        .post(
            '/check-in',
            async ({ body, set }) => {
                // Find event by check-in code
                const event = Array.from(eventStore.values()).find(
                    e => e.checkInCode === body.code.toUpperCase()
                );

                if (!event) {
                    set.status = 404;
                    return { error: 'Ungültiger Check-In Code' };
                }

                // Find participant by name (case-insensitive)
                const participant = event.participants.find(
                    p => p.name.toLowerCase() === body.name.toLowerCase()
                );

                if (!participant) {
                    set.status = 404;
                    return { error: 'Teilnehmer nicht gefunden' };
                }

                if (participant.checkedIn) {
                    return {
                        success: true,
                        alreadyCheckedIn: true,
                        message: 'Bereits eingecheckt',
                        participant,
                    };
                }

                participant.checkedIn = true;
                participant.checkedInAt = new Date().toISOString();
                event.updatedAt = new Date().toISOString();
                eventStore.set(event.id, event);

                logger.info({ eventId: event.id, participant: participant.name }, 'Participant checked in');

                return {
                    success: true,
                    participant,
                    event: {
                        name: event.name,
                        startTime: event.startTime,
                        location: event.location,
                    },
                };
            },
            {
                body: t.Object({
                    code: t.String(),
                    name: t.String(),
                }),
            }
        )

        // -----------------------------------------------------------------
        // Auto check-in by geolocation
        // -----------------------------------------------------------------
        .post(
            '/events/:id/auto-check-in',
            async ({ params, body, set }) => {
                const event = eventStore.get(params.id);
                if (!event) {
                    set.status = 404;
                    return { error: 'Event nicht gefunden' };
                }

                // TODO: Verify location is within meeting point geofence
                // For now, just mark as checked in

                const participant = event.participants.find(p => p.id === body.participantId);
                if (!participant) {
                    set.status = 404;
                    return { error: 'Teilnehmer nicht gefunden' };
                }

                participant.checkedIn = true;
                participant.checkedInAt = new Date().toISOString();
                event.updatedAt = new Date().toISOString();
                eventStore.set(params.id, event);

                logger.info({ eventId: event.id, participant: participant.name }, 'Auto check-in successful');

                return { success: true, participant };
            },
            {
                params: t.Object({ id: t.String() }),
                body: t.Object({
                    participantId: t.String(),
                    lat: t.Number(),
                    lon: t.Number(),
                }),
            }
        )

        // -----------------------------------------------------------------
        // Get check-in status dashboard
        // -----------------------------------------------------------------
        .get(
            '/events/:id/status',
            async ({ params, set }) => {
                const event = eventStore.get(params.id);
                if (!event) {
                    set.status = 404;
                    return { error: 'Event nicht gefunden' };
                }

                const total = event.participants.length;
                const checkedIn = event.participants.filter(p => p.checkedIn).length;
                const stands = event.participants.filter(p => p.role === 'stand');
                const standsCheckedIn = stands.filter(p => p.checkedIn).length;

                return {
                    eventName: event.name,
                    status: event.status,
                    checkInCode: event.checkInCode,
                    participants: {
                        total,
                        checkedIn,
                        percentage: total > 0 ? Math.round((checkedIn / total) * 100) : 0,
                    },
                    stands: {
                        total: stands.length,
                        checkedIn: standsCheckedIn,
                    },
                    participantDetails: event.participants.map(p => ({
                        name: p.name,
                        role: p.role,
                        standNumber: p.standNumber,
                        checkedIn: p.checkedIn,
                        checkedInAt: p.checkedInAt,
                    })),
                };
            },
            {
                params: t.Object({ id: t.String() }),
            }
        )

        // -----------------------------------------------------------------
        // Start event
        // -----------------------------------------------------------------
        .post(
            '/events/:id/start',
            async ({ params, set }) => {
                const event = eventStore.get(params.id);
                if (!event) {
                    set.status = 404;
                    return { error: 'Event nicht gefunden' };
                }

                event.status = 'active';
                event.updatedAt = new Date().toISOString();
                eventStore.set(params.id, event);

                logger.info({ eventId: event.id }, 'Drückjagd started');

                return { success: true, event };
            },
            {
                params: t.Object({ id: t.String() }),
            }
        )

        // -----------------------------------------------------------------
        // End event
        // -----------------------------------------------------------------
        .post(
            '/events/:id/end',
            async ({ params, set }) => {
                const event = eventStore.get(params.id);
                if (!event) {
                    set.status = 404;
                    return { error: 'Event nicht gefunden' };
                }

                event.status = 'completed';
                event.endTime = new Date().toISOString();
                event.updatedAt = new Date().toISOString();
                eventStore.set(params.id, event);

                logger.info({ eventId: event.id }, 'Drückjagd ended');

                return { success: true, event };
            },
            {
                params: t.Object({ id: t.String() }),
            }
        );
}

export default createDrueckjagdRoutes;
