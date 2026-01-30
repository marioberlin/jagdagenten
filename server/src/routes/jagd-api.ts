/**
 * Jagd API Routes
 * 
 * Hunting-specific endpoints for:
 * - Weather/Conditions
 * - Streckenliste generation
 * - Cockpit dashboard data
 */

import { Elysia, t } from 'elysia';
import { componentLoggers } from '../logger.js';
import { fetchWeatherConditions, calculateHuntabilityScore } from '../services/weather-service.js';

const logger = componentLoggers.http;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CockpitBriefingResponse {
    huntabilityScore: number;
    conditions: Awaited<ReturnType<typeof fetchWeatherConditions>>;
    bestWindows: Array<{
        start: string;
        end: string;
        score: number;
        reason: string;
    }>;
    generatedAt: string;
}

// ---------------------------------------------------------------------------
// Helper: Calculate best hunting windows
// ---------------------------------------------------------------------------

function calculateBestWindows(conditions: Awaited<ReturnType<typeof fetchWeatherConditions>>): CockpitBriefingResponse['bestWindows'] {
    const twilight = conditions.twilight;
    const windows = [];

    // Morning window (civil dawn to ~1 hour after sunrise)
    const morningScore = 70 + (conditions.wind.speed < 10 ? 15 : 0) + (conditions.precipitation === 0 ? 10 : 0);
    windows.push({
        start: twilight.civilDawn,
        end: addMinutes(twilight.sunrise, 60),
        score: Math.min(100, morningScore),
        reason: 'Morgendämmerung',
    });

    // Evening window (1 hour before sunset to civil dusk)
    const eveningScore = 75 + (conditions.wind.speed < 15 ? 10 : 0) + (conditions.precipitation === 0 ? 10 : 0);
    windows.push({
        start: addMinutes(twilight.sunset, -60),
        end: twilight.civilDusk,
        score: Math.min(100, eveningScore),
        reason: 'Abenddämmerung',
    });

    // Sort by score descending
    return windows.sort((a, b) => b.score - a.score);
}

function addMinutes(timeStr: string, minutes: number): string {
    const [h, m] = timeStr.split(':').map(Number);
    const totalMins = h * 60 + m + minutes;
    const newH = Math.floor(totalMins / 60) % 24;
    const newM = totalMins % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export function createJagdRoutes() {
    return new Elysia({ prefix: '/api/v1/jagd' })

        /**
         * GET /api/v1/jagd/cockpit
         * 
         * Returns morning briefing data: huntability score, conditions, best windows
         */
        .get('/cockpit', async ({ query }) => {
            const lat = Number(query.lat) || 51.1657;
            const lon = Number(query.lon) || 10.4515;

            logger.info({ lat, lon }, 'Fetching cockpit briefing');

            try {
                const conditions = await fetchWeatherConditions(lat, lon);
                const huntabilityScore = calculateHuntabilityScore(conditions);
                const bestWindows = calculateBestWindows(conditions);

                const response: CockpitBriefingResponse = {
                    huntabilityScore,
                    conditions,
                    bestWindows,
                    generatedAt: new Date().toISOString(),
                };

                return response;
            } catch (error) {
                logger.error({ error }, 'Cockpit briefing error');
                throw error;
            }
        }, {
            query: t.Object({
                lat: t.Optional(t.String()),
                lon: t.Optional(t.String()),
            }),
        })

        /**
         * GET /api/v1/jagd/weather
         * 
         * Returns detailed weather conditions for a location
         */
        .get('/weather', async ({ query }) => {
            const lat = Number(query.lat) || 51.1657;
            const lon = Number(query.lon) || 10.4515;

            logger.info({ lat, lon }, 'Fetching weather conditions');

            try {
                const conditions = await fetchWeatherConditions(lat, lon);
                return {
                    conditions,
                    huntabilityScore: calculateHuntabilityScore(conditions),
                    fetchedAt: new Date().toISOString(),
                };
            } catch (error) {
                logger.error({ error }, 'Weather fetch error');
                throw error;
            }
        }, {
            query: t.Object({
                lat: t.Optional(t.String()),
                lon: t.Optional(t.String()),
            }),
        })

        /**
         * POST /api/v1/jagd/streckenliste
         * 
         * Generates a Streckenliste PDF for the specified data
         */
        .post('/streckenliste', async ({ body }) => {
            logger.info({ revier: body.revier, bundesland: body.bundesland }, 'Generating Streckenliste');

            try {
                // Dynamic import to avoid loading PDF libs on every request
                const { generateStreckenliste } = await import('../services/streckenliste-generator.js');

                const pdfBytes = await generateStreckenliste({
                    revier: body.revier,
                    revierNumber: body.revierNumber,
                    jagdpächter: body.jagdpächter,
                    jagdgenossenschaft: body.jagdgenossenschaft,
                    landkreis: body.landkreis,
                    bundesland: body.bundesland,
                    jagdjahr: body.jagdjahr,
                    entries: body.entries,
                    generatedAt: new Date().toISOString(),
                });

                return new Response(pdfBytes, {
                    headers: {
                        'Content-Type': 'application/pdf',
                        'Content-Disposition': `attachment; filename="streckenliste-${body.jagdjahr.replace('/', '-')}.pdf"`,
                    },
                });
            } catch (error) {
                logger.error({ error }, 'Streckenliste generation error');
                throw error;
            }
        }, {
            body: t.Object({
                revier: t.String(),
                revierNumber: t.Optional(t.String()),
                jagdpächter: t.String(),
                jagdgenossenschaft: t.Optional(t.String()),
                landkreis: t.String(),
                bundesland: t.String(),
                jagdjahr: t.String(),
                entries: t.Array(t.Object({
                    id: t.String(),
                    date: t.String(),
                    time: t.String(),
                    species: t.String(),
                    gender: t.Union([t.Literal('male'), t.Literal('female'), t.Literal('unknown')]),
                    ageClass: t.String(),
                    weight: t.Optional(t.Number()),
                    location: t.String(),
                    hunter: t.String(),
                    weaponCaliber: t.Optional(t.String()),
                    notes: t.Optional(t.String()),
                })),
            }),
        });
}

export default createJagdRoutes;
