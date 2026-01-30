/**
 * Jagd Pack Routes
 *
 * Endpoints for Pack Agent — group hunting events, member management,
 * safety check-ins, and emergency coordination.
 */

import { Elysia, t } from 'elysia';
import { randomUUID } from 'crypto';
import { loggerPlugin, dbLogger } from '../plugins/logger';

// ============================================================================
// Types
// ============================================================================

interface PackMember {
    id: string;
    name: string;
    role: 'leader' | 'member' | 'guest';
    phone?: string;
    email?: string;
    emergencyContact?: string;
    avatarUrl?: string;
    isActive: boolean;
    joinedAt: string;
}

interface PackEvent {
    id: string;
    packId: string;
    title: string;
    type: 'drueckjagd' | 'treibjagd' | 'ansitz' | 'pirsch' | 'meeting' | 'other';
    description?: string;
    date: string;
    startTime: string;
    endTime?: string;
    location: {
        name: string;
        lat?: number;
        lng?: number;
        bundesland?: string;
    };
    meetingPoint?: string;
    targetSpecies?: string[];
    maxParticipants?: number;
    participants: EventParticipant[];
    status: 'planned' | 'active' | 'completed' | 'cancelled';
    createdBy: string;
    createdAt: string;
}

interface EventParticipant {
    memberId: string;
    memberName: string;
    status: 'invited' | 'confirmed' | 'declined' | 'maybe';
    role?: 'schuetze' | 'treiber' | 'hundefuehrer' | 'helfer';
    checkedIn: boolean;
    checkedInAt?: string;
    checkedOut: boolean;
    checkedOutAt?: string;
    position?: { lat: number; lng: number };
    lastPositionUpdate?: string;
}

interface Pack {
    id: string;
    name: string;
    description?: string;
    revier?: string;
    bundesland?: string;
    members: PackMember[];
    createdAt: string;
}

interface EmergencyAlert {
    id: string;
    packId: string;
    eventId?: string;
    type: 'medical' | 'lost' | 'danger' | 'recall' | 'other';
    message: string;
    senderId: string;
    senderName: string;
    location?: { lat: number; lng: number };
    createdAt: string;
    acknowledged: string[];
}

// ============================================================================
// Mock Data
// ============================================================================

const mockPacks: Pack[] = [
    {
        id: 'pack-1',
        name: 'Hegering Waldau',
        description: 'Hegering für das Revier Waldau und Umgebung',
        revier: 'Waldau',
        bundesland: 'Bayern',
        members: [
            { id: 'm1', name: 'Hans Müller', role: 'leader', phone: '+49 170 1234567', isActive: true, joinedAt: '2024-01-15' },
            { id: 'm2', name: 'Klaus Schmidt', role: 'member', phone: '+49 171 2345678', isActive: true, joinedAt: '2024-03-20' },
            { id: 'm3', name: 'Maria Weber', role: 'member', isActive: true, joinedAt: '2024-06-10' },
            { id: 'm4', name: 'Thomas Bauer', role: 'member', isActive: false, joinedAt: '2023-11-01' },
        ],
        createdAt: '2023-01-01',
    },
];

const mockEvents: PackEvent[] = [
    {
        id: 'evt-1',
        packId: 'pack-1',
        title: 'Drückjagd Revier Süd',
        type: 'drueckjagd',
        description: 'Jährliche Drückjagd im südlichen Revierteil. Bitte pünktlich am Treffpunkt erscheinen.',
        date: '2026-02-15',
        startTime: '08:00',
        endTime: '15:00',
        location: { name: 'Waldrand Süd', lat: 48.1234, lng: 11.5678, bundesland: 'Bayern' },
        meetingPoint: 'Parkplatz am Forsthaus',
        targetSpecies: ['Schwarzwild', 'Rehwild'],
        maxParticipants: 20,
        participants: [
            { memberId: 'm1', memberName: 'Hans Müller', status: 'confirmed', role: 'schuetze', checkedIn: false, checkedOut: false },
            { memberId: 'm2', memberName: 'Klaus Schmidt', status: 'confirmed', role: 'treiber', checkedIn: false, checkedOut: false },
            { memberId: 'm3', memberName: 'Maria Weber', status: 'maybe', checkedIn: false, checkedOut: false },
        ],
        status: 'planned',
        createdBy: 'm1',
        createdAt: '2026-01-20',
    },
    {
        id: 'evt-2',
        packId: 'pack-1',
        title: 'Hegering Versammlung',
        type: 'meeting',
        description: 'Quartalsversammlung des Hegerings',
        date: '2026-02-18',
        startTime: '19:00',
        endTime: '21:00',
        location: { name: 'Gasthaus zum Hirsch', bundesland: 'Bayern' },
        participants: [
            { memberId: 'm1', memberName: 'Hans Müller', status: 'confirmed', checkedIn: false, checkedOut: false },
            { memberId: 'm2', memberName: 'Klaus Schmidt', status: 'invited', checkedIn: false, checkedOut: false },
        ],
        status: 'planned',
        createdBy: 'm1',
        createdAt: '2026-01-25',
    },
];

const mockAlerts: EmergencyAlert[] = [];

// ============================================================================
// Routes
// ============================================================================

export function createJagdPackRoutes() {
    return new Elysia({ prefix: '/api/v1/jagd' })
        .use(loggerPlugin)

        // =========================================================================
        // Pack Management
        // =========================================================================

        .get('/packs', async () => {
            try {
                return { packs: mockPacks };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to fetch packs');
                return { packs: [] };
            }
        })

        .get('/packs/:id', async ({ params }) => {
            try {
                const pack = mockPacks.find((p) => p.id === params.id);
                if (!pack) {
                    return { error: 'Pack not found' };
                }
                return { pack };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to get pack');
                return { error: 'Failed to get pack' };
            }
        })

        .post('/packs', async ({ body }) => {
            try {
                const input = body as Partial<Pack>;
                const newPack: Pack = {
                    id: randomUUID(),
                    name: input.name || 'Neuer Hegering',
                    description: input.description,
                    revier: input.revier,
                    bundesland: input.bundesland,
                    members: [],
                    createdAt: new Date().toISOString(),
                };
                mockPacks.push(newPack);
                return { pack: newPack };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to create pack');
                return { error: 'Failed to create pack' };
            }
        })

        // =========================================================================
        // Member Management
        // =========================================================================

        .post('/packs/:id/members', async ({ params, body }) => {
            try {
                const pack = mockPacks.find((p) => p.id === params.id);
                if (!pack) {
                    return { error: 'Pack not found' };
                }

                const input = body as Partial<PackMember>;
                const newMember: PackMember = {
                    id: randomUUID(),
                    name: input.name || 'Neues Mitglied',
                    role: input.role || 'member',
                    phone: input.phone,
                    email: input.email,
                    emergencyContact: input.emergencyContact,
                    isActive: true,
                    joinedAt: new Date().toISOString().split('T')[0],
                };
                pack.members.push(newMember);
                return { member: newMember };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to add member');
                return { error: 'Failed to add member' };
            }
        })

        .delete('/packs/:packId/members/:memberId', async ({ params }) => {
            try {
                const pack = mockPacks.find((p) => p.id === params.packId);
                if (!pack) {
                    return { error: 'Pack not found' };
                }

                const idx = pack.members.findIndex((m) => m.id === params.memberId);
                if (idx >= 0) {
                    pack.members.splice(idx, 1);
                }
                return { success: true };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to remove member');
                return { success: false };
            }
        })

        // =========================================================================
        // Pack Events
        // =========================================================================

        .get('/packs/:id/events', async ({ params, query }) => {
            try {
                const status = query?.status as PackEvent['status'] | undefined;
                let events = mockEvents.filter((e) => e.packId === params.id);

                if (status) {
                    events = events.filter((e) => e.status === status);
                }

                events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                return { events };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to fetch events');
                return { events: [] };
            }
        })

        .get('/events/:id', async ({ params }) => {
            try {
                const event = mockEvents.find((e) => e.id === params.id);
                if (!event) {
                    return { error: 'Event not found' };
                }
                return { event };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to get event');
                return { error: 'Failed to get event' };
            }
        })

        .post('/packs/:id/events', async ({ params, body }) => {
            try {
                const input = body as Partial<PackEvent>;
                const newEvent: PackEvent = {
                    id: randomUUID(),
                    packId: params.id,
                    title: input.title || 'Neue Jagdveranstaltung',
                    type: input.type || 'other',
                    description: input.description,
                    date: input.date || new Date().toISOString().split('T')[0],
                    startTime: input.startTime || '08:00',
                    endTime: input.endTime,
                    location: input.location || { name: 'TBD' },
                    meetingPoint: input.meetingPoint,
                    targetSpecies: input.targetSpecies,
                    maxParticipants: input.maxParticipants,
                    participants: [],
                    status: 'planned',
                    createdBy: 'current-user',
                    createdAt: new Date().toISOString(),
                };
                mockEvents.push(newEvent);
                return { event: newEvent };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to create event');
                return { error: 'Failed to create event' };
            }
        })

        .put('/events/:id', async ({ params, body }) => {
            try {
                const event = mockEvents.find((e) => e.id === params.id);
                if (!event) {
                    return { error: 'Event not found' };
                }

                const input = body as Partial<PackEvent>;
                Object.assign(event, {
                    title: input.title ?? event.title,
                    description: input.description ?? event.description,
                    date: input.date ?? event.date,
                    startTime: input.startTime ?? event.startTime,
                    endTime: input.endTime ?? event.endTime,
                    location: input.location ?? event.location,
                    meetingPoint: input.meetingPoint ?? event.meetingPoint,
                    status: input.status ?? event.status,
                });
                return { event };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to update event');
                return { error: 'Failed to update event' };
            }
        })

        .delete('/events/:id', async ({ params }) => {
            try {
                const idx = mockEvents.findIndex((e) => e.id === params.id);
                if (idx >= 0) {
                    mockEvents.splice(idx, 1);
                }
                return { success: true };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to delete event');
                return { success: false };
            }
        })

        // =========================================================================
        // RSVP / Participation
        // =========================================================================

        .post('/events/:id/rsvp', async ({ params, body }) => {
            try {
                const event = mockEvents.find((e) => e.id === params.id);
                if (!event) {
                    return { error: 'Event not found' };
                }

                const { memberId, memberName, status, role } = body as {
                    memberId: string;
                    memberName: string;
                    status: EventParticipant['status'];
                    role?: EventParticipant['role'];
                };

                const existing = event.participants.find((p) => p.memberId === memberId);
                if (existing) {
                    existing.status = status;
                    existing.role = role ?? existing.role;
                } else {
                    event.participants.push({
                        memberId,
                        memberName,
                        status,
                        role,
                        checkedIn: false,
                        checkedOut: false,
                    });
                }
                return { success: true, participants: event.participants };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to update RSVP');
                return { error: 'Failed to update RSVP' };
            }
        })

        // =========================================================================
        // Safety Check-in/Check-out
        // =========================================================================

        .post('/events/:id/checkin', async ({ params, body }) => {
            try {
                const event = mockEvents.find((e) => e.id === params.id);
                if (!event) {
                    return { error: 'Event not found' };
                }

                const { memberId, position } = body as {
                    memberId: string;
                    position?: { lat: number; lng: number };
                };

                const participant = event.participants.find((p) => p.memberId === memberId);
                if (participant) {
                    participant.checkedIn = true;
                    participant.checkedInAt = new Date().toISOString();
                    if (position) {
                        participant.position = position;
                        participant.lastPositionUpdate = new Date().toISOString();
                    }
                }
                return { success: true, participant };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to check in');
                return { error: 'Failed to check in' };
            }
        })

        .post('/events/:id/checkout', async ({ params, body }) => {
            try {
                const event = mockEvents.find((e) => e.id === params.id);
                if (!event) {
                    return { error: 'Event not found' };
                }

                const { memberId } = body as { memberId: string };

                const participant = event.participants.find((p) => p.memberId === memberId);
                if (participant) {
                    participant.checkedOut = true;
                    participant.checkedOutAt = new Date().toISOString();
                }
                return { success: true, participant };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to check out');
                return { error: 'Failed to check out' };
            }
        })

        .post('/events/:id/position', async ({ params, body }) => {
            try {
                const event = mockEvents.find((e) => e.id === params.id);
                if (!event) {
                    return { error: 'Event not found' };
                }

                const { memberId, position } = body as {
                    memberId: string;
                    position: { lat: number; lng: number };
                };

                const participant = event.participants.find((p) => p.memberId === memberId);
                if (participant) {
                    participant.position = position;
                    participant.lastPositionUpdate = new Date().toISOString();
                }
                return { success: true };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to update position');
                return { error: 'Failed to update position' };
            }
        })

        // =========================================================================
        // Emergency Alerts
        // =========================================================================

        .get('/packs/:id/alerts', async ({ params }) => {
            try {
                const alerts = mockAlerts.filter((a) => a.packId === params.id);
                return { alerts };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to fetch alerts');
                return { alerts: [] };
            }
        })

        .post('/packs/:id/alerts', async ({ params, body }) => {
            try {
                const input = body as Partial<EmergencyAlert>;
                const newAlert: EmergencyAlert = {
                    id: randomUUID(),
                    packId: params.id,
                    eventId: input.eventId,
                    type: input.type || 'other',
                    message: input.message || 'Notfall',
                    senderId: 'current-user',
                    senderName: input.senderName || 'Unbekannt',
                    location: input.location,
                    createdAt: new Date().toISOString(),
                    acknowledged: [],
                };
                mockAlerts.push(newAlert);

                // In production, this would trigger push notifications to all pack members
                dbLogger.warn({ alert: newAlert }, 'EMERGENCY ALERT BROADCAST');

                return { alert: newAlert };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to create alert');
                return { error: 'Failed to create alert' };
            }
        })

        .post('/alerts/:id/acknowledge', async ({ params, body }) => {
            try {
                const alert = mockAlerts.find((a) => a.id === params.id);
                if (!alert) {
                    return { error: 'Alert not found' };
                }

                const { memberId } = body as { memberId: string };
                if (!alert.acknowledged.includes(memberId)) {
                    alert.acknowledged.push(memberId);
                }
                return { success: true, acknowledged: alert.acknowledged };
            } catch (error) {
                dbLogger.error({ error }, 'Failed to acknowledge alert');
                return { error: 'Failed to acknowledge alert' };
            }
        });
}
