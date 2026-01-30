/**
 * Jagd Demo Data — Mock Sessions, Events, Posts for UI Demonstration
 * 
 * This file provides comprehensive mock data that can be seeded into
 * the database for UI development and demonstration purposes.
 */

import type { GeoScope } from '@jagdagenten/types-jagd';

// ============================================================================
// Mock Hunt Sessions
// ============================================================================

export interface DemoSession {
    id: string;
    sessionType: 'ansitz' | 'pirsch' | 'drueckjagd' | 'revierarbeit' | 'training';
    startTime: string;
    endTime: string | null;
    geo: GeoScope;
    privacyMode: 'private' | 'friends' | 'public';
    revierName: string;
    weather: { temp: number; wind: string; conditions: string };
    notes?: string;
}

export const DEMO_SESSIONS: DemoSession[] = [
    {
        id: 'demo-session-1',
        sessionType: 'ansitz',
        startTime: '2026-01-28T16:30:00Z',
        endTime: '2026-01-28T19:45:00Z',
        geo: { mode: 'coarse_grid', gridId: 'G52.5_13.4', blurMeters: 1000 },
        privacyMode: 'friends',
        revierName: 'Märkische Heide',
        weather: { temp: 4, wind: 'NW 12 km/h', conditions: 'bewölkt' },
        notes: 'Erfolgreicher Abendansitz. Rehbock erlegt.',
    },
    {
        id: 'demo-session-2',
        sessionType: 'pirsch',
        startTime: '2026-01-27T05:45:00Z',
        endTime: '2026-01-27T08:30:00Z',
        geo: { mode: 'coarse_grid', gridId: 'G52.4_13.5', blurMeters: 1000 },
        privacyMode: 'private',
        revierName: 'Märkische Heide',
        weather: { temp: 1, wind: 'O 5 km/h', conditions: 'Nebel' },
        notes: 'Morgenpirsch ohne Anblick.',
    },
    {
        id: 'demo-session-3',
        sessionType: 'drueckjagd',
        startTime: '2026-01-20T08:00:00Z',
        endTime: '2026-01-20T14:00:00Z',
        geo: { mode: 'coarse_grid', gridId: 'G52.3_13.3', blurMeters: 2000 },
        privacyMode: 'friends',
        revierName: 'Gemeinschaftsjagd Bernau',
        weather: { temp: 2, wind: 'SW 8 km/h', conditions: 'sonnig' },
        notes: 'Drückjagd mit 12 Teilnehmern. 5 Stück Schwarzwild gestreckt.',
    },
    {
        id: 'demo-session-4',
        sessionType: 'revierarbeit',
        startTime: '2026-01-25T10:00:00Z',
        endTime: '2026-01-25T15:00:00Z',
        geo: { mode: 'coarse_grid', gridId: 'G52.5_13.4', blurMeters: 1000 },
        privacyMode: 'private',
        revierName: 'Märkische Heide',
        weather: { temp: 6, wind: 'W 15 km/h', conditions: 'bedeckt' },
        notes: 'Kirrung ausgebracht, 2 Hochsitze gewartet.',
    },
    {
        id: 'demo-session-5',
        sessionType: 'ansitz',
        startTime: '2026-01-29T16:00:00Z',
        endTime: null, // Active session
        geo: { mode: 'coarse_grid', gridId: 'G52.5_13.4', blurMeters: 1000 },
        privacyMode: 'private',
        revierName: 'Märkische Heide',
        weather: { temp: 5, wind: 'NW 10 km/h', conditions: 'leicht bewölkt' },
        notes: 'Aktueller Ansitz.',
    },
];

// ============================================================================
// Mock Timeline Events
// ============================================================================

export interface DemoEvent {
    id: string;
    sessionId: string;
    eventType: 'sighting' | 'shot' | 'harvest' | 'note' | 'processing' | 'handover';
    time: string;
    data: Record<string, unknown>;
    geo?: GeoScope;
    photos?: string[];
}

export const DEMO_EVENTS: DemoEvent[] = [
    // Session 1 events
    {
        id: 'demo-event-1',
        sessionId: 'demo-session-1',
        eventType: 'sighting',
        time: '2026-01-28T17:15:00Z',
        data: {
            species: 'Rehwild',
            count: 3,
            behavior: 'Äsend am Waldrand',
            distance: 120,
        },
    },
    {
        id: 'demo-event-2',
        sessionId: 'demo-session-1',
        eventType: 'shot',
        time: '2026-01-28T18:32:00Z',
        data: {
            species: 'Rehbock',
            caliber: '.308 Win',
            distance: 85,
            position: 'Breit stehend',
        },
    },
    {
        id: 'demo-event-3',
        sessionId: 'demo-session-1',
        eventType: 'harvest',
        time: '2026-01-28T18:45:00Z',
        data: {
            species: 'Rehbock',
            age: '2-jährig',
            weight: 18,
            antlerPoints: 6,
            notes: 'Guter Knopfbock, sauberer Blattschuss',
        },
    },
    {
        id: 'demo-event-4',
        sessionId: 'demo-session-1',
        eventType: 'processing',
        time: '2026-01-28T19:00:00Z',
        data: {
            activity: 'Aufbrechen',
            location: 'Wald',
        },
    },
    // Session 2 events
    {
        id: 'demo-event-5',
        sessionId: 'demo-session-2',
        eventType: 'note',
        time: '2026-01-27T06:30:00Z',
        data: {
            text: 'Dichter Bodennebel, Sicht unter 50m',
        },
    },
    // Session 3 events (Drückjagd)
    {
        id: 'demo-event-6',
        sessionId: 'demo-session-3',
        eventType: 'sighting',
        time: '2026-01-20T10:45:00Z',
        data: {
            species: 'Schwarzwild',
            count: 4,
            behavior: 'Rotte in Bewegung',
            notes: 'Von Treiben aufgemüdet',
        },
    },
    {
        id: 'demo-event-7',
        sessionId: 'demo-session-3',
        eventType: 'shot',
        time: '2026-01-20T11:02:00Z',
        data: {
            species: 'Überläufer',
            caliber: '.30-06',
            distance: 45,
            position: 'Flüchtig',
        },
    },
    {
        id: 'demo-event-8',
        sessionId: 'demo-session-3',
        eventType: 'harvest',
        time: '2026-01-20T11:15:00Z',
        data: {
            species: 'Überläufer',
            age: '1-jährig',
            weight: 42,
            notes: 'Weiblich, guter Zustand',
        },
    },
    // Session 4 events
    {
        id: 'demo-event-9',
        sessionId: 'demo-session-4',
        eventType: 'note',
        time: '2026-01-25T11:00:00Z',
        data: {
            text: 'Hochsitz Waldrand: Neue Sprossen angebracht, Leiter überprüft',
        },
    },
    {
        id: 'demo-event-10',
        sessionId: 'demo-session-4',
        eventType: 'note',
        time: '2026-01-25T13:30:00Z',
        data: {
            text: 'Kirrung Eicheneck: 50kg Mais nachgefüllt, frische Schwarzwildspuren',
        },
    },
    // Session 5 events (active session)
    {
        id: 'demo-event-11',
        sessionId: 'demo-session-5',
        eventType: 'note',
        time: '2026-01-29T16:15:00Z',
        data: {
            text: 'Gute Bedingungen, leichter Nordwestwind',
        },
    },
    {
        id: 'demo-event-12',
        sessionId: 'demo-session-5',
        eventType: 'sighting',
        time: '2026-01-29T17:05:00Z',
        data: {
            species: 'Fuchs',
            count: 1,
            behavior: 'Mausend auf Wiese',
            distance: 200,
        },
    },
];

// ============================================================================
// Mock Pack Events
// ============================================================================

export interface DemoPackEvent {
    id: string;
    eventType: 'drueckjagd' | 'revierarbeit' | 'training' | 'meeting';
    date: string;
    title: string;
    meetingPointGeo: GeoScope;
    roles: { role: string; person: string; status: string }[];
    participants: string[];
    status: 'scheduled' | 'active' | 'completed' | 'cancelled';
}

export const DEMO_PACK_EVENTS: DemoPackEvent[] = [
    {
        id: 'demo-pack-1',
        eventType: 'drueckjagd',
        date: '2026-02-15T08:00:00Z',
        title: 'Drückjagd Bernauer Forst',
        meetingPointGeo: { mode: 'coarse_grid', gridId: 'G52.6_13.5', blurMeters: 500 },
        roles: [
            { role: 'Jagdleiter', person: 'Hans Müller', status: 'confirmed' },
            { role: 'Sicherheitsbeauftragter', person: 'Peter Schmidt', status: 'confirmed' },
            { role: 'Schütze', person: 'Klaus Weber', status: 'pending' },
            { role: 'Treiber', person: 'Michael Fischer', status: 'confirmed' },
            { role: 'Hundeführer', person: 'Thomas Braun', status: 'confirmed' },
        ],
        participants: ['Hans Müller', 'Peter Schmidt', 'Klaus Weber', 'Michael Fischer', 'Thomas Braun'],
        status: 'scheduled',
    },
    {
        id: 'demo-pack-2',
        eventType: 'revierarbeit',
        date: '2026-02-08T09:00:00Z',
        title: 'Hochsitzwartung Frühjahr',
        meetingPointGeo: { mode: 'coarse_grid', gridId: 'G52.5_13.4', blurMeters: 500 },
        roles: [
            { role: 'Leitung', person: 'Hans Müller', status: 'confirmed' },
        ],
        participants: ['Hans Müller', 'Klaus Weber', 'Michael Fischer'],
        status: 'scheduled',
    },
];

// ============================================================================
// Mock Feed Posts
// ============================================================================

export interface DemoFeedPost {
    id: string;
    postType: 'sighting' | 'story' | 'invite' | 'news';
    title: string;
    content: string;
    author: string;
    publishedAt: string;
    geo?: GeoScope;
    publishScope: 'private' | 'friends' | 'public';
    likes: number;
    comments: number;
    tags: string[];
}

export const DEMO_FEED_POSTS: DemoFeedPost[] = [
    {
        id: 'demo-post-1',
        postType: 'story',
        title: 'Erfolgreicher Winteransitz',
        content: 'Nach drei Stunden Geduld bei -2°C wurde ich mit einem schönen Rehbock belohnt. Waidmannsheil!',
        author: 'Jäger_Brandenburg',
        publishedAt: '2026-01-28T20:30:00Z',
        geo: { mode: 'coarse_grid', gridId: 'G52.5_13.4', blurMeters: 2000 },
        publishScope: 'public',
        likes: 24,
        comments: 5,
        tags: ['Rehwild', 'Ansitz', 'Winter'],
    },
    {
        id: 'demo-post-2',
        postType: 'sighting',
        title: 'Starke Rotte gesichtet',
        content: 'Heute Abend starke Schwarzwildrotte (8 Stück) am Maisfeld beobachtet. Führende Bache mit Frischlingen.',
        author: 'WaldläuferNord',
        publishedAt: '2026-01-27T19:15:00Z',
        geo: { mode: 'coarse_grid', gridId: 'G52.3_13.2', blurMeters: 2000 },
        publishScope: 'friends',
        likes: 12,
        comments: 3,
        tags: ['Schwarzwild', 'Sichtung'],
    },
    {
        id: 'demo-post-3',
        postType: 'invite',
        title: 'Gastjäger gesucht für Drückjagd',
        content: 'Für unsere Drückjagd am 15.02. suchen wir noch 2 erfahrene Drückjagdschützen. Revier bei Bernau.',
        author: 'JagdgemeinschaftBernau',
        publishedAt: '2026-01-26T10:00:00Z',
        publishScope: 'public',
        likes: 8,
        comments: 7,
        tags: ['Drückjagd', 'Einladung', 'Brandenburg'],
    },
    {
        id: 'demo-post-4',
        postType: 'news',
        title: 'Neue ASP-Kerngebiete ausgewiesen',
        content: 'Das Ministerium hat neue Restriktionszonen für ASP in Brandenburg veröffentlicht. Bitte beachten Sie die aktuellen Vorgaben.',
        author: 'DJV_Official',
        publishedAt: '2026-01-25T08:00:00Z',
        publishScope: 'public',
        likes: 156,
        comments: 23,
        tags: ['ASP', 'Regulierung', 'Brandenburg'],
    },
];

// ============================================================================
// Mock Moderation Cases
// ============================================================================

export interface DemoModerationCase {
    id: string;
    contentId: string;
    contentType: 'post' | 'comment' | 'photo';
    reportReason: string;
    reportedBy: string;
    reportedAt: string;
    status: 'pending' | 'reviewed' | 'resolved' | 'appealed';
    decision?: 'approve' | 'remove' | 'warn';
    moderatorNotes?: string;
}

export const DEMO_MODERATION_CASES: DemoModerationCase[] = [
    {
        id: 'demo-mod-1',
        contentId: 'post-xyz',
        contentType: 'post',
        reportReason: 'Präzise Standortdaten öffentlich geteilt',
        reportedBy: 'anonymous',
        reportedAt: '2026-01-28T14:00:00Z',
        status: 'reviewed',
        decision: 'warn',
        moderatorNotes: 'Nutzer informiert, Post mit Blur versehen',
    },
    {
        id: 'demo-mod-2',
        contentId: 'comment-abc',
        contentType: 'comment',
        reportReason: 'Unangemessene Sprache',
        reportedBy: 'user123',
        reportedAt: '2026-01-27T16:30:00Z',
        status: 'resolved',
        decision: 'remove',
        moderatorNotes: 'Beleidigung entfernt, Verwarnung ausgesprochen',
    },
];

// ============================================================================
// Mock Equipment Inventory
// ============================================================================

export interface DemoEquipment {
    id: string;
    category: 'weapon' | 'optic' | 'clothing' | 'safety' | 'dog' | 'other';
    name: string;
    description?: string;
    lastMaintenance?: string;
    nextMaintenance?: string;
    notes?: string;
}

export const DEMO_EQUIPMENT: DemoEquipment[] = [
    {
        id: 'equip-1',
        category: 'weapon',
        name: 'Repetierbüchse .308 Win',
        description: 'Hauptwaffe für Ansitz und Pirsch',
        lastMaintenance: '2026-01-15',
        nextMaintenance: '2026-03-15',
    },
    {
        id: 'equip-2',
        category: 'weapon',
        name: 'Bockflinte 12/70',
        description: 'Für Niederwild und Drückjagd',
        lastMaintenance: '2026-01-10',
        nextMaintenance: '2026-03-10',
    },
    {
        id: 'equip-3',
        category: 'optic',
        name: 'Zielfernrohr 3-12x56',
        description: 'Leuchtabsehen, auf Repetierer montiert',
        lastMaintenance: '2026-01-15',
    },
    {
        id: 'equip-4',
        category: 'safety',
        name: 'Signalweste Orange',
        description: 'Für Drückjagden',
    },
    {
        id: 'equip-5',
        category: 'dog',
        name: 'GPS-Halsband',
        description: 'Für Jagdhündin Bella',
        notes: 'Akku alle 3 Tage laden',
    },
];

// ============================================================================
// Seed/Clear Functions
// ============================================================================

export function getAllDemoData() {
    return {
        sessions: DEMO_SESSIONS,
        events: DEMO_EVENTS,
        packEvents: DEMO_PACK_EVENTS,
        feedPosts: DEMO_FEED_POSTS,
        moderationCases: DEMO_MODERATION_CASES,
        equipment: DEMO_EQUIPMENT,
    };
}

export function getDemoStats() {
    return {
        sessions: DEMO_SESSIONS.length,
        events: DEMO_EVENTS.length,
        packEvents: DEMO_PACK_EVENTS.length,
        feedPosts: DEMO_FEED_POSTS.length,
        moderationCases: DEMO_MODERATION_CASES.length,
        equipment: DEMO_EQUIPMENT.length,
        activeSessions: DEMO_SESSIONS.filter(s => !s.endTime).length,
        totalHarvests: DEMO_EVENTS.filter(e => e.eventType === 'harvest').length,
    };
}
