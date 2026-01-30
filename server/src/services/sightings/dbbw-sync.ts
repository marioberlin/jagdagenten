/**
 * DBBW Sync Service
 *
 * Synchronizes wolf sighting data from the official
 * Dokumentations- und Beratungsstelle des Bundes zum Thema Wolf (DBBW).
 *
 * Source: https://www.dbb-wolf.de
 *
 * Note: This is a read-only sync to enrich community sightings with
 * official confirmation data.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DBBWSighting {
    id: string;
    eventType: 'sighting' | 'evidence' | 'incident';
    species: 'wolf';
    date: Date;
    bundesland: string;
    territory?: string;
    packId?: string;
    confirmationStatus: 'confirmed' | 'probable' | 'unconfirmed';
    evidenceType?: 'photo' | 'dna' | 'track' | 'carcass' | 'other';
    description?: string;
    sourceUrl: string;
}

interface DBBWTerritory {
    id: string;
    name: string;
    bundesland: string;
    type: 'pack' | 'pair' | 'resident';
    status: 'confirmed' | 'suspected';
    lastConfirmed: Date;
    packSize?: number;
}

interface SyncResult {
    success: boolean;
    sightingsAdded: number;
    territoriesUpdated: number;
    lastSyncAt: Date;
    errors: string[];
}

interface SyncConfig {
    enabled: boolean;
    intervalHours: number;
    lastSyncAt?: Date;
}

// ---------------------------------------------------------------------------
// DBBW API Configuration
// ---------------------------------------------------------------------------

// Note: DBBW doesn't have a public API, so this simulates
// what would be fetched from their public data or a future API

const DBBW_BASE_URL = 'https://www.dbb-wolf.de';
const USER_AGENT = 'JagdAgenten-DBBWSync/1.0 (+https://jagdagenten.de)';

// Default sync configuration
const defaultConfig: SyncConfig = {
    enabled: true,
    intervalHours: 24,
};

// ---------------------------------------------------------------------------
// Bundesland Territory Mapping
// ---------------------------------------------------------------------------

const BUNDESLAND_TERRITORIES: Record<string, string[]> = {
    'Brandenburg': ['Döberitzer Heide', 'Lieberoser Heide', 'Welzow', 'Schmerzke'],
    'Sachsen': ['Daubitz', 'Kollm', 'Milkel', 'Nochtener Heide', 'Rosenthal'],
    'Niedersachsen': ['Munster', 'Gartow', 'Schneverdingen', 'Rodewald'],
    'Mecklenburg-Vorpommern': ['Lübtheen', 'Ueckermünde', 'Kaliß'],
    'Sachsen-Anhalt': ['Oranienbaumer Heide', 'Altengrabow', 'Colbitz-Letzlingen'],
    'Bayern': ['Veldensteiner Forst', 'Manteler Forst'],
    'Thüringen': ['Ohrdruf', 'Ilmenau'],
    'Hessen': ['Stölzingen', 'Rüdesheim'],
};

// ---------------------------------------------------------------------------
// Data Fetching (Simulation)
// ---------------------------------------------------------------------------

/**
 * Fetch latest wolf sightings from DBBW.
 * In production, this would parse their public data or call an API.
 */
export async function fetchDBBWSightings(
    bundesland?: string,
    since?: Date,
): Promise<DBBWSighting[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // In production, this would fetch from DBBW's data sources
    // For now, return simulated data based on known territories

    const sightings: DBBWSighting[] = [];
    const territories = bundesland
        ? BUNDESLAND_TERRITORIES[bundesland] || []
        : Object.values(BUNDESLAND_TERRITORIES).flat();

    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sinceDate = since || oneMonthAgo;

    // Generate simulated confirmed sightings
    for (const territory of territories.slice(0, 5)) {
        const sightingDate = new Date(
            sinceDate.getTime() + Math.random() * (now.getTime() - sinceDate.getTime())
        );

        sightings.push({
            id: `dbbw-${territory.toLowerCase().replace(/\s/g, '-')}-${Date.now()}`,
            eventType: 'sighting',
            species: 'wolf',
            date: sightingDate,
            bundesland: findBundeslandForTerritory(territory),
            territory,
            confirmationStatus: 'confirmed',
            evidenceType: Math.random() > 0.5 ? 'photo' : 'dna',
            sourceUrl: `${DBBW_BASE_URL}/territorien/${territory.toLowerCase()}`,
        });
    }

    return sightings;
}

function findBundeslandForTerritory(territory: string): string {
    for (const [land, territories] of Object.entries(BUNDESLAND_TERRITORIES)) {
        if (territories.includes(territory)) return land;
    }
    return 'Unknown';
}

/**
 * Fetch current wolf territories.
 */
export async function fetchDBBWTerritories(
    bundesland?: string,
): Promise<DBBWTerritory[]> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const territories: DBBWTerritory[] = [];
    const targetLands = bundesland
        ? [bundesland]
        : Object.keys(BUNDESLAND_TERRITORIES);

    for (const land of targetLands) {
        const landTerritories = BUNDESLAND_TERRITORIES[land] || [];

        for (const name of landTerritories) {
            territories.push({
                id: `territory-${name.toLowerCase().replace(/\s/g, '-')}`,
                name,
                bundesland: land,
                type: Math.random() > 0.3 ? 'pack' : 'pair',
                status: 'confirmed',
                lastConfirmed: new Date(),
                packSize: Math.floor(Math.random() * 8) + 2,
            });
        }
    }

    return territories;
}

// ---------------------------------------------------------------------------
// Sync Functions
// ---------------------------------------------------------------------------

let syncConfig = { ...defaultConfig };

export function configureSyncInterval(config: Partial<SyncConfig>): void {
    syncConfig = { ...syncConfig, ...config };
}

export function getSyncConfig(): SyncConfig {
    return { ...syncConfig };
}

export async function syncFromDBBW(bundesland?: string): Promise<SyncResult> {
    const errors: string[] = [];
    let sightingsAdded = 0;
    let territoriesUpdated = 0;

    if (!syncConfig.enabled) {
        return {
            success: false,
            sightingsAdded: 0,
            territoriesUpdated: 0,
            lastSyncAt: new Date(),
            errors: ['Sync is disabled'],
        };
    }

    try {
        // Fetch sightings
        const sightings = await fetchDBBWSightings(bundesland, syncConfig.lastSyncAt);
        sightingsAdded = sightings.length;

        // Fetch territories
        const territories = await fetchDBBWTerritories(bundesland);
        territoriesUpdated = territories.length;

        // In production, would save to database here

        syncConfig.lastSyncAt = new Date();

        return {
            success: true,
            sightingsAdded,
            territoriesUpdated,
            lastSyncAt: syncConfig.lastSyncAt,
            errors,
        };
    } catch (err) {
        errors.push(err instanceof Error ? err.message : 'Unknown error');
        return {
            success: false,
            sightingsAdded: 0,
            territoriesUpdated: 0,
            lastSyncAt: new Date(),
            errors,
        };
    }
}

// ---------------------------------------------------------------------------
// Matching Functions
// ---------------------------------------------------------------------------

/**
 * Check if a community sighting matches known DBBW activity.
 */
export async function matchCommunityToOfficial(
    gridCell: string,
    species: string,
    date: Date,
): Promise<{ matched: boolean; territory?: string; confidence: number }> {
    if (species !== 'wolf') {
        return { matched: false, confidence: 0 };
    }

    // Extract bundesland from grid cell
    const bundeslandCode = gridCell.match(/DE-([A-Z]{2})-/)?.[1];
    if (!bundeslandCode) {
        return { matched: false, confidence: 0 };
    }

    // Map code to name
    const codeToName: Record<string, string> = {
        'BB': 'Brandenburg',
        'SN': 'Sachsen',
        'NI': 'Niedersachsen',
        'MV': 'Mecklenburg-Vorpommern',
        'ST': 'Sachsen-Anhalt',
        'BY': 'Bayern',
        'TH': 'Thüringen',
        'HE': 'Hessen',
    };

    const bundesland = codeToName[bundeslandCode];
    if (!bundesland) {
        return { matched: false, confidence: 0 };
    }

    // Check if there are known territories in this area
    const territories = BUNDESLAND_TERRITORIES[bundesland] || [];
    if (territories.length === 0) {
        return { matched: false, confidence: 0 };
    }

    // In production, would do proper geospatial matching
    // For now, return a match if any territory exists in the bundesland
    return {
        matched: true,
        territory: territories[0],
        confidence: 0.7,
    };
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export type { DBBWSighting, DBBWTerritory, SyncResult, SyncConfig };
