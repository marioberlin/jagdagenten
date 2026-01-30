/**
 * Jagd Scout Routes
 *
 * REST API for managing hunt stands and retrieving conditions snapshots
 * (twilight times via suncalc, mock weather data).
 */

import { Elysia, t } from 'elysia';
import { query } from '../db.js';
import SunCalc from 'suncalc';
import { componentLoggers } from '../logger.js';

const logger = componentLoggers.http;

// ============================================================================
// Helpers
// ============================================================================

/** Map a DB row from hunt_stands to a JSON-friendly object. */
function rowToStand(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    name: row.name as string,
    standType: row.stand_type as string,
    geoLat: row.geo_lat as number,
    geoLon: row.geo_lon as number,
    notes: (row.notes as string) ?? '',
    windHistory: (row.wind_history ?? []) as Array<{ direction: number; speed: number; timestamp: string }>,
    performanceStats: (row.performance_stats ?? {}) as Record<string, unknown>,
  };
}

// Hard-coded demo user id until auth middleware is wired in.
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

// ============================================================================
// Routes
// ============================================================================

export function createJagdScoutRoutes() {
  return new Elysia({ prefix: '/api/v1/jagd' })
    // -----------------------------------------------------------------------
    // List all stands for the user
    // -----------------------------------------------------------------------
    .get('/stands', async ({ set }) => {
      try {
        const result = await query(
          'SELECT * FROM hunt_stands WHERE user_id = $1 ORDER BY name ASC',
          [DEMO_USER_ID],
        );
        return { stands: result.rows.map(rowToStand) };
      } catch (err) {
        logger.error({ error: err }, 'Failed to list stands');
        set.status = 500;
        return { error: 'Failed to fetch stands' };
      }
    })

    // -----------------------------------------------------------------------
    // Create a new stand
    // -----------------------------------------------------------------------
    .post(
      '/stands',
      async ({ body, set }) => {
        const { name, standType, geoLat, geoLon, notes } = body as {
          name: string;
          standType?: string;
          geoLat: number;
          geoLon: number;
          notes?: string;
        };

        try {
          const result = await query(
            `INSERT INTO hunt_stands (user_id, name, stand_type, geo_lat, geo_lon, notes)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [DEMO_USER_ID, name, standType ?? 'hochsitz', geoLat, geoLon, notes ?? ''],
          );
          set.status = 201;
          return { stand: rowToStand(result.rows[0]) };
        } catch (err) {
          logger.error({ error: err }, 'Failed to create stand');
          set.status = 500;
          return { error: 'Failed to create stand' };
        }
      },
      {
        body: t.Object({
          name: t.String(),
          standType: t.Optional(t.String()),
          geoLat: t.Number(),
          geoLon: t.Number(),
          notes: t.Optional(t.String()),
        }),
      },
    )

    // -----------------------------------------------------------------------
    // Get a single stand with wind history
    // -----------------------------------------------------------------------
    .get(
      '/stands/:id',
      async ({ params, set }) => {
        try {
          const result = await query(
            'SELECT * FROM hunt_stands WHERE id = $1 AND user_id = $2',
            [params.id, DEMO_USER_ID],
          );
          if (result.rows.length === 0) {
            set.status = 404;
            return { error: 'Stand not found' };
          }
          return { stand: rowToStand(result.rows[0]) };
        } catch (err) {
          logger.error({ error: err }, 'Failed to get stand');
          set.status = 500;
          return { error: 'Failed to fetch stand' };
        }
      },
      {
        params: t.Object({ id: t.String() }),
      },
    )

    // -----------------------------------------------------------------------
    // Update a stand
    // -----------------------------------------------------------------------
    .put(
      '/stands/:id',
      async ({ params, body, set }) => {
        const updates = body as Record<string, unknown>;
        const fields: string[] = [];
        const values: unknown[] = [];
        let idx = 1;

        const columnMap: Record<string, string> = {
          name: 'name',
          standType: 'stand_type',
          geoLat: 'geo_lat',
          geoLon: 'geo_lon',
          notes: 'notes',
        };

        for (const [key, col] of Object.entries(columnMap)) {
          if (updates[key] !== undefined) {
            fields.push(`${col} = $${idx}`);
            values.push(updates[key]);
            idx++;
          }
        }

        if (fields.length === 0) {
          set.status = 400;
          return { error: 'No fields to update' };
        }

        fields.push(`updated_at = NOW()`);
        values.push(params.id, DEMO_USER_ID);

        try {
          const result = await query(
            `UPDATE hunt_stands SET ${fields.join(', ')} WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING *`,
            values,
          );
          if (result.rows.length === 0) {
            set.status = 404;
            return { error: 'Stand not found' };
          }
          return { stand: rowToStand(result.rows[0]) };
        } catch (err) {
          logger.error({ error: err }, 'Failed to update stand');
          set.status = 500;
          return { error: 'Failed to update stand' };
        }
      },
      {
        params: t.Object({ id: t.String() }),
      },
    )

    // -----------------------------------------------------------------------
    // Delete a stand
    // -----------------------------------------------------------------------
    .delete(
      '/stands/:id',
      async ({ params, set }) => {
        try {
          const result = await query(
            'DELETE FROM hunt_stands WHERE id = $1 AND user_id = $2 RETURNING id',
            [params.id, DEMO_USER_ID],
          );
          if (result.rows.length === 0) {
            set.status = 404;
            return { error: 'Stand not found' };
          }
          return { success: true };
        } catch (err) {
          logger.error({ error: err }, 'Failed to delete stand');
          set.status = 500;
          return { error: 'Failed to delete stand' };
        }
      },
      {
        params: t.Object({ id: t.String() }),
      },
    )

    // -----------------------------------------------------------------------
    // Conditions snapshot (suncalc twilight + mock weather)
    // -----------------------------------------------------------------------
    .get(
      '/conditions',
      async ({ query: qs, set }) => {
        const lat = Number(qs.lat);
        const lon = Number(qs.lon);

        if (Number.isNaN(lat) || Number.isNaN(lon)) {
          set.status = 400;
          return { error: 'lat and lon query parameters are required' };
        }

        try {
          const now = new Date();
          const sunTimes = SunCalc.getTimes(now, lat, lon);
          const moonIllum = SunCalc.getMoonIllumination(now);

          // Mock weather data (replace with real provider later)
          const mockWind = {
            direction: Math.round(Math.random() * 360),
            speed: Math.round(Math.random() * 25 * 10) / 10,
          };
          const mockTemperature = Math.round((Math.random() * 30 - 5) * 10) / 10;
          const mockHumidity = Math.round(Math.random() * 60 + 40);
          const mockPressure = Math.round(Math.random() * 40 + 990);

          return {
            wind: mockWind,
            temperature: mockTemperature,
            humidity: mockHumidity,
            pressure: mockPressure,
            moonPhase: Math.round(moonIllum.phase * 100) / 100,
            twilight: {
              civilDawn: sunTimes.dawn?.toISOString() ?? '',
              sunrise: sunTimes.sunrise?.toISOString() ?? '',
              sunset: sunTimes.sunset?.toISOString() ?? '',
              civilDusk: sunTimes.dusk?.toISOString() ?? '',
            },
            timestamp: now.toISOString(),
          };
        } catch (err) {
          logger.error({ error: err }, 'Failed to compute conditions');
          set.status = 500;
          return { error: 'Failed to compute conditions' };
        }
      },
    );
}

export default createJagdScoutRoutes;
