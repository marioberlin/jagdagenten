/**
 * Pack Store
 *
 * Zustand store for managing hunting packs (groups), events, members, and safety.
 */

import { create } from 'zustand';

// ============================================================================
// Types
// ============================================================================

export interface PackMember {
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

export interface EventParticipant {
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

export interface PackEvent {
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

export interface Pack {
    id: string;
    name: string;
    description?: string;
    revier?: string;
    bundesland?: string;
    members: PackMember[];
    createdAt: string;
}

export interface EmergencyAlert {
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

interface PackStore {
    // Packs State
    packs: Pack[];
    currentPack: Pack | null;
    packsLoading: boolean;
    packsError: string | null;

    // Events State
    events: PackEvent[];
    currentEvent: PackEvent | null;
    eventsLoading: boolean;

    // Alerts State
    alerts: EmergencyAlert[];

    // Actions
    fetchPacks: () => Promise<void>;
    fetchPack: (packId: string) => Promise<void>;
    createPack: (pack: Partial<Pack>) => Promise<void>;
    addMember: (packId: string, member: Partial<PackMember>) => Promise<void>;
    removeMember: (packId: string, memberId: string) => Promise<void>;

    fetchEvents: (packId: string) => Promise<void>;
    fetchEvent: (eventId: string) => Promise<void>;
    createEvent: (packId: string, event: Partial<PackEvent>) => Promise<void>;
    updateEvent: (eventId: string, updates: Partial<PackEvent>) => Promise<void>;
    deleteEvent: (eventId: string) => Promise<void>;

    rsvpEvent: (eventId: string, memberId: string, memberName: string, status: EventParticipant['status'], role?: EventParticipant['role']) => Promise<void>;
    checkIn: (eventId: string, memberId: string, position?: { lat: number; lng: number }) => Promise<void>;
    checkOut: (eventId: string, memberId: string) => Promise<void>;

    fetchAlerts: (packId: string) => Promise<void>;
    sendAlert: (packId: string, alert: Partial<EmergencyAlert>) => Promise<void>;
    acknowledgeAlert: (alertId: string, memberId: string) => Promise<void>;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const usePackStore = create<PackStore>()((set, get) => ({
    // Initial State
    packs: [],
    currentPack: null,
    packsLoading: false,
    packsError: null,
    events: [],
    currentEvent: null,
    eventsLoading: false,
    alerts: [],

    // Pack Actions
    fetchPacks: async () => {
        set({ packsLoading: true, packsError: null });
        try {
            const res = await fetch('/api/v1/jagd/packs');
            const data = await res.json();
            set({ packs: data.packs || [], packsLoading: false });
        } catch (error) {
            set({ packsError: 'Fehler beim Laden der Gruppen', packsLoading: false });
        }
    },

    fetchPack: async (packId) => {
        try {
            const res = await fetch(`/api/v1/jagd/packs/${packId}`);
            const data = await res.json();
            set({ currentPack: data.pack || null });
        } catch (error) {
            console.error('Failed to fetch pack:', error);
        }
    },

    createPack: async (pack) => {
        try {
            const res = await fetch('/api/v1/jagd/packs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pack),
            });
            const data = await res.json();
            if (data.pack) {
                set((state) => ({ packs: [...state.packs, data.pack] }));
            }
        } catch (error) {
            console.error('Failed to create pack:', error);
        }
    },

    addMember: async (packId, member) => {
        try {
            const res = await fetch(`/api/v1/jagd/packs/${packId}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(member),
            });
            const data = await res.json();
            if (data.member) {
                set((state) => ({
                    packs: state.packs.map((p) =>
                        p.id === packId ? { ...p, members: [...p.members, data.member] } : p
                    ),
                    currentPack: state.currentPack?.id === packId
                        ? { ...state.currentPack, members: [...state.currentPack.members, data.member] }
                        : state.currentPack,
                }));
            }
        } catch (error) {
            console.error('Failed to add member:', error);
        }
    },

    removeMember: async (packId, memberId) => {
        try {
            await fetch(`/api/v1/jagd/packs/${packId}/members/${memberId}`, { method: 'DELETE' });
            set((state) => ({
                packs: state.packs.map((p) =>
                    p.id === packId ? { ...p, members: p.members.filter((m) => m.id !== memberId) } : p
                ),
                currentPack: state.currentPack?.id === packId
                    ? { ...state.currentPack, members: state.currentPack.members.filter((m) => m.id !== memberId) }
                    : state.currentPack,
            }));
        } catch (error) {
            console.error('Failed to remove member:', error);
        }
    },

    // Event Actions
    fetchEvents: async (packId) => {
        set({ eventsLoading: true });
        try {
            const res = await fetch(`/api/v1/jagd/packs/${packId}/events`);
            const data = await res.json();
            set({ events: data.events || [], eventsLoading: false });
        } catch (error) {
            set({ eventsLoading: false });
        }
    },

    fetchEvent: async (eventId) => {
        try {
            const res = await fetch(`/api/v1/jagd/events/${eventId}`);
            const data = await res.json();
            set({ currentEvent: data.event || null });
        } catch (error) {
            console.error('Failed to fetch event:', error);
        }
    },

    createEvent: async (packId, event) => {
        try {
            const res = await fetch(`/api/v1/jagd/packs/${packId}/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(event),
            });
            const data = await res.json();
            if (data.event) {
                set((state) => ({ events: [...state.events, data.event] }));
            }
        } catch (error) {
            console.error('Failed to create event:', error);
        }
    },

    updateEvent: async (eventId, updates) => {
        try {
            const res = await fetch(`/api/v1/jagd/events/${eventId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            const data = await res.json();
            if (data.event) {
                set((state) => ({
                    events: state.events.map((e) => (e.id === eventId ? data.event : e)),
                    currentEvent: state.currentEvent?.id === eventId ? data.event : state.currentEvent,
                }));
            }
        } catch (error) {
            console.error('Failed to update event:', error);
        }
    },

    deleteEvent: async (eventId) => {
        try {
            await fetch(`/api/v1/jagd/events/${eventId}`, { method: 'DELETE' });
            set((state) => ({
                events: state.events.filter((e) => e.id !== eventId),
                currentEvent: state.currentEvent?.id === eventId ? null : state.currentEvent,
            }));
        } catch (error) {
            console.error('Failed to delete event:', error);
        }
    },

    rsvpEvent: async (eventId, memberId, memberName, status, role) => {
        try {
            await fetch(`/api/v1/jagd/events/${eventId}/rsvp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberId, memberName, status, role }),
            });
            // Refresh event
            get().fetchEvent(eventId);
        } catch (error) {
            console.error('Failed to RSVP:', error);
        }
    },

    checkIn: async (eventId, memberId, position) => {
        try {
            await fetch(`/api/v1/jagd/events/${eventId}/checkin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberId, position }),
            });
            get().fetchEvent(eventId);
        } catch (error) {
            console.error('Failed to check in:', error);
        }
    },

    checkOut: async (eventId, memberId) => {
        try {
            await fetch(`/api/v1/jagd/events/${eventId}/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberId }),
            });
            get().fetchEvent(eventId);
        } catch (error) {
            console.error('Failed to check out:', error);
        }
    },

    // Alert Actions
    fetchAlerts: async (packId) => {
        try {
            const res = await fetch(`/api/v1/jagd/packs/${packId}/alerts`);
            const data = await res.json();
            set({ alerts: data.alerts || [] });
        } catch (error) {
            console.error('Failed to fetch alerts:', error);
        }
    },

    sendAlert: async (packId, alert) => {
        try {
            const res = await fetch(`/api/v1/jagd/packs/${packId}/alerts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(alert),
            });
            const data = await res.json();
            if (data.alert) {
                set((state) => ({ alerts: [...state.alerts, data.alert] }));
            }
        } catch (error) {
            console.error('Failed to send alert:', error);
        }
    },

    acknowledgeAlert: async (alertId, memberId) => {
        try {
            await fetch(`/api/v1/jagd/alerts/${alertId}/acknowledge`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberId }),
            });
            set((state) => ({
                alerts: state.alerts.map((a) =>
                    a.id === alertId ? { ...a, acknowledged: [...a.acknowledged, memberId] } : a
                ),
            }));
        } catch (error) {
            console.error('Failed to acknowledge alert:', error);
        }
    },
}));
