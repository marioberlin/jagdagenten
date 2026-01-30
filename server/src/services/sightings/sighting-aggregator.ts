/**
 * Sighting Aggregator Service
 *
 * Aggregates individual sightings into grid-based statistics
 * while maintaining k-anonymity.
 */

import { meetsKAnonymity, K_THRESHOLD } from '../privacy/k-anonymity';
import { latLngToGridCell } from '../privacy/grid-blurrer';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RawSighting {
    id: string;
    userId: string;
    species: string;
    lat: number;
    lng: number;
    observedAt: Date;
    confidence: number;
    isVerified: boolean;
}

interface AggregatedCell {
    gridCell: string;
    species: string;
    timeWindow: string; // e.g., '2026-01', '2026-W05'
    contributorCount: number;
    sightingCount: number;
    avgConfidence: number;
    verifiedCount: number;
    lastActivityAt: Date;
    meetsKAnonymity: boolean;
}

interface TrendSummary {
    species: string;
    bundesland: string;
    currentWeekCount: number;
    previousWeekCount: number;
    changePercent: number;
    direction: 'up' | 'down' | 'stable';
}

type TimeWindowType = 'hourly' | 'daily' | 'weekly' | 'monthly';

// ---------------------------------------------------------------------------
// Time Window Helpers
// ---------------------------------------------------------------------------

function getTimeWindow(date: Date, type: TimeWindowType): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    switch (type) {
        case 'hourly': {
            const hour = String(date.getHours()).padStart(2, '0');
            return `${year}-${month}-${day}T${hour}`;
        }
        case 'daily':
            return `${year}-${month}-${day}`;
        case 'weekly': {
            const weekNum = getWeekNumber(date);
            return `${year}-W${String(weekNum).padStart(2, '0')}`;
        }
        case 'monthly':
            return `${year}-${month}`;
    }
}

function getWeekNumber(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 1);
    const diff = date.getTime() - start.getTime();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    return Math.ceil((diff / oneWeek) + 1);
}

function getPreviousTimeWindow(timeWindow: string, type: TimeWindowType): string {
    if (type === 'weekly') {
        const match = timeWindow.match(/(\d{4})-W(\d{2})/);
        if (match) {
            const year = parseInt(match[1]);
            const week = parseInt(match[2]);
            if (week === 1) return `${year - 1}-W52`;
            return `${year}-W${String(week - 1).padStart(2, '0')}`;
        }
    }
    if (type === 'monthly') {
        const match = timeWindow.match(/(\d{4})-(\d{2})/);
        if (match) {
            const year = parseInt(match[1]);
            const month = parseInt(match[2]);
            if (month === 1) return `${year - 1}-12`;
            return `${year}-${String(month - 1).padStart(2, '0')}`;
        }
    }
    return timeWindow;
}

// ---------------------------------------------------------------------------
// Aggregation Functions
// ---------------------------------------------------------------------------

export function aggregateSightings(
    sightings: RawSighting[],
    timeWindowType: TimeWindowType = 'weekly',
): AggregatedCell[] {
    // Group by gridCell + species + timeWindow
    const groups = new Map<string, {
        gridCell: string;
        species: string;
        timeWindow: string;
        contributors: Set<string>;
        sightings: RawSighting[];
    }>();

    for (const sighting of sightings) {
        const gridCell = latLngToGridCell(sighting.lat, sighting.lng);
        const timeWindow = getTimeWindow(sighting.observedAt, timeWindowType);
        const key = `${gridCell}|${sighting.species}|${timeWindow}`;

        if (!groups.has(key)) {
            groups.set(key, {
                gridCell,
                species: sighting.species,
                timeWindow,
                contributors: new Set(),
                sightings: [],
            });
        }

        const group = groups.get(key)!;
        group.contributors.add(sighting.userId);
        group.sightings.push(sighting);
    }

    // Convert to aggregated cells
    const result: AggregatedCell[] = [];

    for (const group of groups.values()) {
        const contributorCount = group.contributors.size;
        const sightingCount = group.sightings.length;
        const avgConfidence = group.sightings.reduce((sum, s) => sum + s.confidence, 0) / sightingCount;
        const verifiedCount = group.sightings.filter(s => s.isVerified).length;
        const lastActivityAt = new Date(Math.max(...group.sightings.map(s => s.observedAt.getTime())));

        result.push({
            gridCell: group.gridCell,
            species: group.species,
            timeWindow: group.timeWindow,
            contributorCount,
            sightingCount,
            avgConfidence: Math.round(avgConfidence * 100) / 100,
            verifiedCount,
            lastActivityAt,
            meetsKAnonymity: meetsKAnonymity(contributorCount),
        });
    }

    return result;
}

// ---------------------------------------------------------------------------
// Filter by k-Anonymity
// ---------------------------------------------------------------------------

export function filterByKAnonymity(
    aggregates: AggregatedCell[],
    threshold: number = K_THRESHOLD,
): AggregatedCell[] {
    return aggregates.filter(a => a.contributorCount >= threshold);
}

// ---------------------------------------------------------------------------
// Trend Calculation
// ---------------------------------------------------------------------------

export function calculateTrends(
    currentAggregates: AggregatedCell[],
    previousAggregates: AggregatedCell[],
): TrendSummary[] {
    const trends: TrendSummary[] = [];

    // Group by species + bundesland (extracted from gridCell)
    const currentByKey = new Map<string, number>();
    const previousByKey = new Map<string, number>();

    for (const agg of currentAggregates) {
        if (!agg.meetsKAnonymity) continue;
        const bundesland = extractBundeslandFromGridCell(agg.gridCell);
        const key = `${agg.species}|${bundesland}`;
        currentByKey.set(key, (currentByKey.get(key) || 0) + agg.sightingCount);
    }

    for (const agg of previousAggregates) {
        if (!agg.meetsKAnonymity) continue;
        const bundesland = extractBundeslandFromGridCell(agg.gridCell);
        const key = `${agg.species}|${bundesland}`;
        previousByKey.set(key, (previousByKey.get(key) || 0) + agg.sightingCount);
    }

    // Calculate changes
    const allKeys = new Set([...currentByKey.keys(), ...previousByKey.keys()]);

    for (const key of allKeys) {
        const [species, bundesland] = key.split('|');
        const current = currentByKey.get(key) || 0;
        const previous = previousByKey.get(key) || 0;

        let changePercent = 0;
        if (previous > 0) {
            changePercent = Math.round(((current - previous) / previous) * 100);
        } else if (current > 0) {
            changePercent = 100;
        }

        let direction: 'up' | 'down' | 'stable';
        if (changePercent > 10) direction = 'up';
        else if (changePercent < -10) direction = 'down';
        else direction = 'stable';

        trends.push({
            species,
            bundesland,
            currentWeekCount: current,
            previousWeekCount: previous,
            changePercent,
            direction,
        });
    }

    return trends.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
}

function extractBundeslandFromGridCell(gridCell: string): string {
    // Format: DE-BY-12345 -> BY
    const match = gridCell.match(/DE-([A-Z]{2})-/);
    return match ? match[1] : 'Unknown';
}

// ---------------------------------------------------------------------------
// Hotspot Detection
// ---------------------------------------------------------------------------

export interface Hotspot {
    gridCell: string;
    species: string;
    score: number;
    sightingCount: number;
    contributorCount: number;
    trend: 'increasing' | 'stable' | 'decreasing';
}

export function detectHotspots(
    aggregates: AggregatedCell[],
    minScore: number = 5,
): Hotspot[] {
    const hotspots: Hotspot[] = [];

    // Only consider k-anonymous aggregates
    const validAggregates = filterByKAnonymity(aggregates);

    for (const agg of validAggregates) {
        // Score based on sighting count, contributor diversity, and recency
        const recencyBonus = isRecent(agg.lastActivityAt) ? 1.5 : 1.0;
        const score = (agg.sightingCount * agg.contributorCount * recencyBonus) / K_THRESHOLD;

        if (score >= minScore) {
            hotspots.push({
                gridCell: agg.gridCell,
                species: agg.species,
                score: Math.round(score * 10) / 10,
                sightingCount: agg.sightingCount,
                contributorCount: agg.contributorCount,
                trend: 'stable', // Would need historical data to calculate
            });
        }
    }

    return hotspots.sort((a, b) => b.score - a.score).slice(0, 10);
}

function isRecent(date: Date, withinDays: number = 7): boolean {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays <= withinDays;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export type {
    RawSighting,
    AggregatedCell,
    TrendSummary,
    TimeWindowType,
};

export { getTimeWindow, getPreviousTimeWindow };
