/**
 * Jagd Cockpit API Routes
 *
 * Provides the Daily Cockpit endpoint that returns huntability score,
 * best hunting time windows (based on twilight), weather conditions
 * snapshot, and recent hunt sessions.
 */

import { Elysia, t } from 'elysia';
import SunCalc from 'suncalc';
import { query } from '../db.js';
import { componentLoggers } from '../logger.js';

const logger = componentLoggers.http;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(date: Date): string {
  return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/** Map SunCalc moon illumination phase (0-1) to a German label. */
function moonPhaseLabel(phase: number): string {
  if (phase < 0.03 || phase > 0.97) return 'Neumond';
  if (phase < 0.22) return 'Zunehmende Sichel';
  if (phase < 0.28) return 'Erstes Viertel';
  if (phase < 0.47) return 'Zunehmender Mond';
  if (phase < 0.53) return 'Vollmond';
  if (phase < 0.72) return 'Abnehmender Mond';
  if (phase < 0.78) return 'Letztes Viertel';
  return 'Abnehmende Sichel';
}

/** Generate a deterministic-looking mock huntability score for today. */
function computeHuntabilityScore(): number {
  return Math.floor(Math.random() * 56) + 40; // 40-95
}

/** Random number in range (for mock conditions). */
function rand(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export function createJagdCockpitRoutes() {
  return new Elysia({ prefix: '/api/v1/jagd' })
    .get('/cockpit', async ({ query: q, set }) => {
      const lat = parseFloat(q.lat as string);
      const lon = parseFloat(q.lon as string);

      if (Number.isNaN(lat) || Number.isNaN(lon)) {
        set.status = 400;
        return { error: 'lat and lon query parameters are required and must be numbers.' };
      }

      try {
        const now = new Date();

        // ------------------------------------------------------------------
        // Twilight & Sun times via suncalc
        // ------------------------------------------------------------------
        const sunTimes = SunCalc.getTimes(now, lat, lon);
        const twilight = {
          civilDawn: formatTime(sunTimes.dawn),
          sunrise: formatTime(sunTimes.sunrise),
          sunset: formatTime(sunTimes.sunset),
          civilDusk: formatTime(sunTimes.dusk),
        };

        // ------------------------------------------------------------------
        // Moon phase
        // ------------------------------------------------------------------
        const moonIllum = SunCalc.getMoonIllumination(now);
        const moonPhase = moonPhaseLabel(moonIllum.phase);

        // ------------------------------------------------------------------
        // Mock conditions snapshot
        // ------------------------------------------------------------------
        const windDirection = Math.floor(Math.random() * 360);
        const windSpeed = rand(2, 25);
        const conditions = {
          wind: {
            speed: windSpeed,
            direction: windDirection,
            gustSpeed: Math.round((windSpeed + rand(3, 12)) * 10) / 10,
          },
          temperature: rand(-5, 28),
          humidity: Math.floor(rand(40, 95)),
          pressure: Math.floor(rand(990, 1040)),
          moonPhase,
          twilight,
          precipitation: rand(0, 5),
          cloudCover: Math.floor(rand(0, 100)),
        };

        // ------------------------------------------------------------------
        // Huntability score (mock)
        // ------------------------------------------------------------------
        const huntabilityScore = computeHuntabilityScore();

        // ------------------------------------------------------------------
        // Best windows — derived from real twilight times
        // ------------------------------------------------------------------
        const morningStart = sunTimes.dawn;
        const morningEnd = new Date(sunTimes.sunrise.getTime() + 90 * 60_000); // sunrise + 90 min
        const eveningStart = new Date(sunTimes.sunset.getTime() - 60 * 60_000); // sunset - 60 min
        const eveningEnd = sunTimes.dusk;

        const bestWindows = [
          {
            start: formatTime(morningStart),
            end: formatTime(morningEnd),
            score: Math.min(huntabilityScore + Math.floor(rand(0, 10)), 100),
            reason: 'Morgenansitz',
          },
          {
            start: formatTime(eveningStart),
            end: formatTime(eveningEnd),
            score: Math.min(huntabilityScore + Math.floor(rand(0, 8)), 100),
            reason: 'Abendansitz',
          },
        ];

        // ------------------------------------------------------------------
        // Recent sessions from DB (last 5, gracefully fail if table absent)
        // ------------------------------------------------------------------
        let recentSessions: Array<{
          id: string;
          sessionType: string;
          startTime: string;
          endTime: string | null;
        }> = [];

        try {
          const result = await query(
            `SELECT id, session_type, start_time, end_time
             FROM hunt_sessions
             ORDER BY start_time DESC
             LIMIT 5`,
          );
          recentSessions = result.rows.map((r) => ({
            id: r.id,
            sessionType: r.session_type,
            startTime: r.start_time,
            endTime: r.end_time ?? null,
          }));
        } catch (dbErr) {
          // Table might not exist yet — return empty array, don't break the response
          logger.warn({ error: dbErr }, 'Could not fetch recent hunt sessions');
        }

        return {
          huntabilityScore,
          bestWindows,
          conditions,
          recentSessions,
        };
      } catch (err) {
        logger.error({ error: err }, 'Cockpit route error');
        set.status = 500;
        return { error: 'Internal server error' };
      }
    }, {
      query: t.Object({
        lat: t.String(),
        lon: t.String(),
      }),
    });
}
