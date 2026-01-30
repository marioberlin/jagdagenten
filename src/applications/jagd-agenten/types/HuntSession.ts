/**
 * HuntSession Types
 *
 * Core data model for hunting sessions.
 * A session represents a single hunting outing (Ansitz, Pirsch, or Drückjagd).
 */

// ---------------------------------------------------------------------------
// Session Types
// ---------------------------------------------------------------------------

export type SessionType = 'ansitz' | 'pirsch' | 'drueckjagd';

export type SessionStatus = 'active' | 'completed' | 'cancelled';

// ---------------------------------------------------------------------------
// Core Session Interface
// ---------------------------------------------------------------------------

export interface HuntSession {
    id: string;
    type: SessionType;
    status: SessionStatus;
    startTime: string;
    endTime?: string;

    // Location
    stand?: StandReference;
    startPosition?: GeoPosition;

    // Weather at start
    weatherSnapshot?: WeatherSnapshot;

    // Events during session
    observations: Observation[];
    shots: Shot[];
    harvests: Harvest[];

    // Notes
    notes?: string;

    // Participants (for Drückjagd)
    participants?: Participant[];
}

// ---------------------------------------------------------------------------
// Stand Reference
// ---------------------------------------------------------------------------

export interface StandReference {
    id: string;
    name: string;
    type: 'hochsitz' | 'kanzel' | 'ansitz' | 'other';
    lat: number;
    lon: number;
}

// ---------------------------------------------------------------------------
// Geographic Position
// ---------------------------------------------------------------------------

export interface GeoPosition {
    lat: number;
    lon: number;
    accuracy?: number;
    timestamp: string;
}

// ---------------------------------------------------------------------------
// Weather Snapshot
// ---------------------------------------------------------------------------

export interface WeatherSnapshot {
    temperature: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    pressure: number;
    visibility: number;
    cloudCover: number;
    precipitation: number;
    moonPhase: string;
    capturedAt: string;
}

// ---------------------------------------------------------------------------
// Observation
// ---------------------------------------------------------------------------

export interface Observation {
    id: string;
    timestamp: string;
    species: string;
    count: number;
    behavior?: 'grazing' | 'moving' | 'alert' | 'fleeing' | 'other';
    direction?: number; // degrees
    distance?: number; // meters
    notes?: string;
}

// ---------------------------------------------------------------------------
// Shot
// ---------------------------------------------------------------------------

export interface Shot {
    id: string;
    timestamp: string;
    weaponId?: string;
    caliber?: string;
    distance?: number;
    result: 'hit' | 'miss' | 'unknown';
    harvestId?: string; // Link to harvest if hit
    notes?: string;
}

// ---------------------------------------------------------------------------
// Harvest
// ---------------------------------------------------------------------------

export interface Harvest {
    id: string;
    timestamp: string;
    species: string;
    gender?: 'male' | 'female' | 'unknown';
    ageClass?: string;
    weight?: number;
    position?: GeoPosition;
    shotId?: string;
    venisonRecordId?: string;
    notes?: string;
}

// ---------------------------------------------------------------------------
// Participant (for Drückjagd)
// ---------------------------------------------------------------------------

export type ParticipantRole = 'stand' | 'treiber' | 'hundefuehrer' | 'jagdleiter';

export interface Participant {
    id: string;
    userId?: string;
    name: string;
    role: ParticipantRole;
    standNumber?: number;
    checkedIn: boolean;
    checkedInAt?: string;
}

// ---------------------------------------------------------------------------
// Session Summary (for display)
// ---------------------------------------------------------------------------

export interface SessionSummary {
    id: string;
    type: SessionType;
    status: SessionStatus;
    startTime: string;
    endTime?: string;
    duration?: number; // minutes
    standName?: string;
    observationCount: number;
    shotCount: number;
    harvestCount: number;
    weatherSummary?: string;
}

// ---------------------------------------------------------------------------
// Session Labels (German)
// ---------------------------------------------------------------------------

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
    ansitz: 'Ansitz',
    pirsch: 'Pirsch',
    drueckjagd: 'Drückjagd',
};

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
    active: 'Aktiv',
    completed: 'Abgeschlossen',
    cancelled: 'Abgebrochen',
};

export const PARTICIPANT_ROLE_LABELS: Record<ParticipantRole, string> = {
    stand: 'Schütze',
    treiber: 'Treiber',
    hundefuehrer: 'Hundeführer',
    jagdleiter: 'Jagdleiter',
};

export const SPECIES_LABELS: Record<string, string> = {
    rotwild: 'Rotwild',
    rehwild: 'Rehwild',
    damwild: 'Damwild',
    schwarzwild: 'Schwarzwild',
    muffelwild: 'Muffelwild',
    hase: 'Feldhase',
    fuchs: 'Rotfuchs',
    dachs: 'Dachs',
    fasan: 'Fasan',
    ente: 'Stockente',
    gans: 'Graugans',
    taube: 'Ringeltaube',
};

export const BEHAVIOR_LABELS: Record<string, string> = {
    grazing: 'Äsend',
    moving: 'Ziehend',
    alert: 'Sichernd',
    fleeing: 'Flüchtend',
    other: 'Sonstig',
};
