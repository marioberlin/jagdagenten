/**
 * Sighting API Routes
 *
 * Endpoints for community sightings with privacy protection.
 * Features:
 * - Create sightings with automatic grid blurring
 * - Time-delayed publication (24-72h)
 * - k-Anonymized aggregates
 * - Official data integration
 */

import { Elysia, t } from 'elysia';
import { randomUUID } from 'crypto';
import { componentLoggers } from '../logger.js';
import {
    latLngToGridCell,
    getGridCellCenter,
    formatGridCellForDisplay,
} from '../services/privacy/grid-blurrer.js';
import {
    calculateDelayResult,
    isReadyToPublish,
    getTimeUntilPublish,
} from '../services/privacy/time-delayer.js';
import {
    meetsKAnonymity,
    K_THRESHOLD,
    getISOWeek,
} from '../services/privacy/k-anonymity.js';
import { getOrCreateAnalyticsKey } from '../services/privacy/pseudonymizer.js';

const log = componentLoggers.http;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Sighting {
    id: string;
    userId: string;
    species: string;
    confidence: number;
    description?: string;
    photoUrls?: string[];
    gridCell: string;
    bundesland?: string;
    observedAt: string;
    publishAt: string;
    status: 'pending' | 'published' | 'hidden';
    createdAt: string;
}

interface SightingAggregate {
    gridCell: string;
    species: string;
    timeWindow: string;
    count: number;
    trendPercentage?: number;
    contributorCount: number;
}

// ---------------------------------------------------------------------------
// In-Memory Store (use PostgreSQL in production)
// ---------------------------------------------------------------------------

const sightingStore = new Map<string, Sighting>();
const aggregateStore = new Map<string, SightingAggregate>();
const contributorSets = new Map<string, Set<string>>();

// Helper to get aggregate key
function getAggregateKey(gridCell: string, species: string, timeWindow: string): string {
    return `${gridCell}:${species}:${timeWindow}`;
}

// ---------------------------------------------------------------------------
// Species Configuration
// ---------------------------------------------------------------------------

const SPECIES_CONFIG: Record<string, { label: string; icon: string; sensitivity: 'low' | 'medium' | 'high' }> = {
    wolf: { label: 'Wolf', icon: '🐺', sensitivity: 'high' },
    luchs: { label: 'Luchs', icon: '🐱', sensitivity: 'high' },
    wildkatze: { label: 'Wildkatze', icon: '🐈', sensitivity: 'high' },
    schwarzwild: { label: 'Schwarzwild', icon: '🐗', sensitivity: 'medium' },
    rotwild: { label: 'Rotwild', icon: '🦌', sensitivity: 'medium' },
    rehwild: { label: 'Rehwild', icon: '🦌', sensitivity: 'low' },
    damwild: { label: 'Damwild', icon: '🦌', sensitivity: 'low' },
    muffelwild: { label: 'Muffelwild', icon: '🐏', sensitivity: 'low' },
    rotwildwechsel: { label: 'Rotwild-Wechsel', icon: '🦶', sensitivity: 'medium' },
    krankes_wild: { label: 'Krankes Wild', icon: '⚠️', sensitivity: 'medium' },
    andere: { label: 'Andere', icon: '👁️', sensitivity: 'low' },
};

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export function createSightingRoutes() {
    return new Elysia({ prefix: '/api/v1/jagd/sightings' })

        // Get available species
        .get('/species', () => {
            return {
                success: true,
                species: Object.entries(SPECIES_CONFIG).map(([id, config]) => ({
                    id,
                    ...config,
                })),
            };
        })

        // Create sighting
        .post(
            '/',
            async ({ body }) => {
                const id = randomUUID();
                const now = new Date();
                const userId = body.userId || 'anonymous';

                // Calculate grid cell (privacy blur)
                const gridCell = latLngToGridCell(body.lat, body.lng);

                // Calculate publish time (delay)
                const delayResult = calculateDelayResult(
                    new Date(body.observedAt),
                    body.species,
                    body.delayHours
                );

                const sighting: Sighting = {
                    id,
                    userId,
                    species: body.species,
                    confidence: body.confidence,
                    description: body.description,
                    photoUrls: body.photoUrls,
                    gridCell,
                    bundesland: body.bundesland,
                    observedAt: body.observedAt,
                    publishAt: delayResult.publishAt.toISOString(),
                    status: 'pending',
                    createdAt: now.toISOString(),
                };

                sightingStore.set(id, sighting);

                // Update aggregates (using analytics key for privacy)
                const timeWindow = getISOWeek(new Date(body.observedAt));
                const aggKey = getAggregateKey(gridCell, body.species, timeWindow);

                let contributors = contributorSets.get(aggKey);
                if (!contributors) {
                    contributors = new Set();
                    contributorSets.set(aggKey, contributors);
                }

                const analyticsKey = getOrCreateAnalyticsKey(userId);
                contributors.add(analyticsKey);

                const existing = aggregateStore.get(aggKey);
                if (existing) {
                    existing.count++;
                    existing.contributorCount = contributors.size;
                    aggregateStore.set(aggKey, existing);
                } else {
                    aggregateStore.set(aggKey, {
                        gridCell,
                        species: body.species,
                        timeWindow,
                        count: 1,
                        contributorCount: 1,
                    });
                }

                log.info({ sightingId: id, species: body.species, gridCell }, 'Created sighting');

                // Return timing info
                const timing = getTimeUntilPublish(new Date(sighting.publishAt));

                return {
                    success: true,
                    sighting: {
                        id: sighting.id,
                        species: sighting.species,
                        gridCell: sighting.gridCell,
                        gridCellDisplay: formatGridCellForDisplay(sighting.gridCell),
                        status: sighting.status,
                        publishAt: sighting.publishAt,
                        publishIn: timing.displayString,
                    },
                    privacyInfo: {
                        delayHours: delayResult.delayHours,
                        delayReason: delayResult.reason,
                        locationBlurred: true,
                        gridSizeKm: 5,
                    },
                };
            },
            {
                body: t.Object({
                    userId: t.Optional(t.String()),
                    species: t.String(),
                    confidence: t.Number({ minimum: 1, maximum: 5 }),
                    description: t.Optional(t.String()),
                    photoUrls: t.Optional(t.Array(t.String())),
                    lat: t.Number(),
                    lng: t.Number(),
                    bundesland: t.Optional(t.String()),
                    observedAt: t.String(),
                    delayHours: t.Optional(t.Number()),
                }),
            }
        )

        // Get published sightings (public, filtered)
        .get(
            '/',
            async ({ query }) => {
                const now = new Date();
                const sightings = Array.from(sightingStore.values())
                    .filter(s => {
                        // Only show published sightings
                        if (!isReadyToPublish(new Date(s.publishAt), now)) return false;
                        if (s.status !== 'pending' && s.status !== 'published') return false;

                        // Apply filters
                        if (query.species && s.species !== query.species) return false;
                        if (query.gridCell && s.gridCell !== query.gridCell) return false;
                        if (query.bundesland && s.bundesland !== query.bundesland) return false;

                        return true;
                    })
                    .map(s => ({
                        id: s.id,
                        species: s.species,
                        speciesLabel: SPECIES_CONFIG[s.species]?.label || s.species,
                        speciesIcon: SPECIES_CONFIG[s.species]?.icon || '👁️',
                        confidence: s.confidence,
                        description: s.description,
                        photoUrls: s.photoUrls,
                        gridCell: s.gridCell,
                        gridCellDisplay: formatGridCellForDisplay(s.gridCell),
                        gridCellCenter: getGridCellCenter(s.gridCell),
                        bundesland: s.bundesland,
                        publishedAt: s.publishAt,
                        badge: 'community',
                    }))
                    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

                return {
                    success: true,
                    sightings,
                    count: sightings.length,
                    filters: {
                        species: query.species,
                        gridCell: query.gridCell,
                        bundesland: query.bundesland,
                    },
                };
            },
            {
                query: t.Object({
                    species: t.Optional(t.String()),
                    gridCell: t.Optional(t.String()),
                    bundesland: t.Optional(t.String()),
                    limit: t.Optional(t.String()),
                }),
            }
        )

        // Get single sighting
        .get('/:id', async ({ params, set }) => {
            const sighting = sightingStore.get(params.id);

            if (!sighting) {
                set.status = 404;
                return { error: 'Sichtung nicht gefunden' };
            }

            // Check if ready to publish
            if (!isReadyToPublish(new Date(sighting.publishAt))) {
                set.status = 403;
                return { error: 'Sichtung noch nicht veröffentlicht' };
            }

            return {
                success: true,
                sighting: {
                    id: sighting.id,
                    species: sighting.species,
                    speciesLabel: SPECIES_CONFIG[sighting.species]?.label,
                    confidence: sighting.confidence,
                    description: sighting.description,
                    photoUrls: sighting.photoUrls,
                    gridCell: sighting.gridCell,
                    gridCellDisplay: formatGridCellForDisplay(sighting.gridCell),
                    gridCellCenter: getGridCellCenter(sighting.gridCell),
                    bundesland: sighting.bundesland,
                    publishedAt: sighting.publishAt,
                    badge: 'community',
                },
            };
        })

        // Delete own sighting
        .delete('/:id', async ({ params, body, set }) => {
            const sighting = sightingStore.get(params.id);

            if (!sighting) {
                set.status = 404;
                return { error: 'Sichtung nicht gefunden' };
            }

            // Check ownership
            if (sighting.userId !== body?.userId) {
                set.status = 403;
                return { error: 'Keine Berechtigung' };
            }

            sightingStore.delete(params.id);
            log.info({ sightingId: params.id }, 'Deleted sighting');

            return { success: true };
        })

        // Get aggregated insights (k-anonymized)
        .get('/aggregates', async ({ query }) => {
            const aggregates = Array.from(aggregateStore.values())
                // Filter by k-anonymity threshold
                .filter(a => meetsKAnonymity(a.contributorCount))
                // Apply filters
                .filter(a => {
                    if (query.species && a.species !== query.species) return false;
                    if (query.gridCell && a.gridCell !== query.gridCell) return false;
                    if (query.timeWindow && a.timeWindow !== query.timeWindow) return false;
                    return true;
                })
                .map(a => ({
                    ...a,
                    speciesLabel: SPECIES_CONFIG[a.species]?.label || a.species,
                    gridCellDisplay: formatGridCellForDisplay(a.gridCell),
                    isAboveThreshold: true,
                }));

            return {
                success: true,
                aggregates,
                count: aggregates.length,
                privacyInfo: {
                    kThreshold: K_THRESHOLD,
                    note: 'Nur Aggregate mit mindestens 10 Beitragenden werden angezeigt',
                },
            };
        })

        // Get my pending sightings
        .get('/my/pending', async ({ query }) => {
            const now = new Date();
            const userId = query.userId;

            if (!userId) {
                return { success: true, sightings: [], count: 0 };
            }

            const pending = Array.from(sightingStore.values())
                .filter(s => s.userId === userId && !isReadyToPublish(new Date(s.publishAt), now))
                .map(s => {
                    const timing = getTimeUntilPublish(new Date(s.publishAt), now);
                    return {
                        id: s.id,
                        species: s.species,
                        speciesLabel: SPECIES_CONFIG[s.species]?.label,
                        gridCell: s.gridCell,
                        gridCellDisplay: formatGridCellForDisplay(s.gridCell),
                        publishAt: s.publishAt,
                        publishIn: timing.displayString,
                        remainingHours: timing.remainingHours,
                    };
                })
                .sort((a, b) => a.remainingHours - b.remainingHours);

            return {
                success: true,
                sightings: pending,
                count: pending.length,
            };
        });
}

export default createSightingRoutes;
