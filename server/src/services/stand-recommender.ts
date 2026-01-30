/**
 * Stand Recommender Service
 *
 * AI-powered stand recommendations based on weather, recent sightings, and patterns.
 */

import type { ConditionsSnapshot } from '../routes/jagd-cockpit.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Stand {
    id: string;
    name: string;
    lat: number;
    lon: number;
    facing: number; // degrees (direction stand faces)
    type: 'hochsitz' | 'kanzel' | 'ansitz' | 'drückjagd';
    lastSat?: string; // ISO date of last sit
    recentSightings?: number; // count in last 30 days
    species?: string[]; // commonly seen species
}

export interface StandRecommendation {
    stand: Stand;
    score: number;
    reason: string;
    factors: {
        wind: number;
        sightings: number;
        freshness: number;
        huntability: number;
    };
    approach?: ApproachSuggestion;
}

export interface ApproachSuggestion {
    parkAt: [number, number];
    approachFrom: string; // cardinal direction
    avoidWechsel?: [number, number][];
    estimatedDistance: number; // meters
}

// ---------------------------------------------------------------------------
// Scoring Weights
// ---------------------------------------------------------------------------

const WEIGHTS = {
    WIND_ALIGNMENT: 0.35,
    RECENT_SIGHTINGS: 0.25,
    FRESHNESS: 0.20,
    HUNTABILITY: 0.20,
};

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/**
 * Calculate angle difference (0-180 degrees)
 */
function angleDifference(angle1: number, angle2: number): number {
    const diff = Math.abs(angle1 - angle2) % 360;
    return diff > 180 ? 360 - diff : diff;
}

/**
 * Get cardinal direction from degrees
 */
function getCardinalDirection(degrees: number): string {
    const directions = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
}

/**
 * Calculate wind score (0-100)
 * Best score when wind blows FROM the facing direction (downwind)
 */
function calculateWindScore(standFacing: number, windDirection: number): number {
    // Wind direction is where it's coming FROM
    // Ideal: wind comes from behind the stand (blows past hunter toward where game approaches)
    const idealWindDirection = (standFacing + 180) % 360;
    const difference = angleDifference(windDirection, idealWindDirection);

    // 0° difference = 100 score, 180° = 0 score
    return Math.round(100 - (difference / 180) * 100);
}

/**
 * Calculate sighting score (0-100)
 */
function calculateSightingScore(recentSightings: number): number {
    // More sightings = higher score, with diminishing returns
    // 0 sightings = 20 (still usable), 10+ = 100
    return Math.min(100, 20 + (recentSightings * 8));
}

/**
 * Calculate freshness score (0-100)
 * Higher score if stand hasn't been sat recently
 */
function calculateFreshnessScore(lastSat?: string): number {
    if (!lastSat) return 80; // Unknown = decent score

    const daysSince = Math.floor(
        (Date.now() - new Date(lastSat).getTime()) / (1000 * 60 * 60 * 24)
    );

    // 0 days = 20, 7+ days = 100
    return Math.min(100, 20 + (daysSince * 12));
}

/**
 * Calculate approach suggestion based on wind
 */
function calculateApproach(stand: Stand, windDirection: number): ApproachSuggestion {
    // Park should be downwind of the stand
    const approachDirection = (windDirection + 180) % 360;

    // Calculate parking spot ~300m away in approach direction
    const parkDistance = 300; // meters
    const earthRadius = 6371000; // meters
    const latOffset = (parkDistance / earthRadius) * (180 / Math.PI) * Math.cos(approachDirection * Math.PI / 180);
    const lonOffset = (parkDistance / earthRadius) * (180 / Math.PI) * Math.sin(approachDirection * Math.PI / 180) / Math.cos(stand.lat * Math.PI / 180);

    return {
        parkAt: [stand.lat - latOffset, stand.lon + lonOffset],
        approachFrom: getCardinalDirection(approachDirection),
        estimatedDistance: parkDistance,
    };
}

// ---------------------------------------------------------------------------
// Main Recommendation Function
// ---------------------------------------------------------------------------

export function recommendStands(
    stands: Stand[],
    conditions: ConditionsSnapshot,
    huntabilityScore: number,
    limit: number = 3
): StandRecommendation[] {
    if (stands.length === 0) return [];

    const recommendations: StandRecommendation[] = stands.map((stand) => {
        // Calculate individual factor scores
        const windScore = calculateWindScore(stand.facing, conditions.wind.direction);
        const sightingScore = calculateSightingScore(stand.recentSightings || 0);
        const freshnessScore = calculateFreshnessScore(stand.lastSat);
        const huntabilityFactor = huntabilityScore;

        // Calculate weighted total
        const totalScore = Math.round(
            windScore * WEIGHTS.WIND_ALIGNMENT +
            sightingScore * WEIGHTS.RECENT_SIGHTINGS +
            freshnessScore * WEIGHTS.FRESHNESS +
            huntabilityFactor * WEIGHTS.HUNTABILITY
        );

        // Generate reason based on top factors
        const reason = generateReason(windScore, sightingScore, freshnessScore, stand);

        return {
            stand,
            score: totalScore,
            reason,
            factors: {
                wind: windScore,
                sightings: sightingScore,
                freshness: freshnessScore,
                huntability: huntabilityFactor,
            },
            approach: calculateApproach(stand, conditions.wind.direction),
        };
    });

    // Sort by score descending and return top N
    return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}

/**
 * Generate human-readable reason
 */
function generateReason(
    windScore: number,
    sightingScore: number,
    freshnessScore: number,
    stand: Stand
): string {
    const parts: string[] = [];

    if (windScore >= 80) {
        parts.push('Wind optimal');
    } else if (windScore >= 60) {
        parts.push('Wind günstig');
    }

    if (sightingScore >= 80 && stand.recentSightings) {
        parts.push(`${stand.recentSightings} Sichtungen kürzlich`);
    }

    if (freshnessScore >= 80 && stand.lastSat) {
        const daysSince = Math.floor(
            (Date.now() - new Date(stand.lastSat).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSince > 0) {
            parts.push(`${daysSince} Tage unbesetzt`);
        }
    }

    if (stand.species && stand.species.length > 0) {
        parts.push(`bekannt für ${stand.species[0]}`);
    }

    return parts.length > 0 ? parts.join(', ') : 'Gute Gesamtbedingungen';
}

// ---------------------------------------------------------------------------
// Export for testing
// ---------------------------------------------------------------------------

export const _internal = {
    calculateWindScore,
    calculateSightingScore,
    calculateFreshnessScore,
    calculateApproach,
    angleDifference,
};

export default recommendStands;
