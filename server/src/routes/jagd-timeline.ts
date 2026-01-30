/**
 * Jagd Timeline Routes
 *
 * REST API for hunt session and timeline event management.
 * Endpoints:
 *   POST   /api/v1/jagd/sessions          - Start a new hunt session
 *   GET    /api/v1/jagd/sessions          - List sessions (most recent first, limit 50)
 *   GET    /api/v1/jagd/sessions/:id      - Get single session with its events
 *   PATCH  /api/v1/jagd/sessions/:id/end  - End a session (set end_time)
 *   POST   /api/v1/jagd/events            - Log a timeline event
 *   GET    /api/v1/jagd/events            - List events for a session (?sessionId=xxx)
 */

import { Elysia, t } from 'elysia';
import { query } from '../db.js';
import { componentLoggers } from '../logger.js';

const logger = componentLoggers.http;

// ============================================================================
// Row-to-object mappers
// ============================================================================

function mapSessionRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    sessionType: row.session_type,
    startTime: row.start_time,
    endTime: row.end_time ?? undefined,
    geoMode: row.geo_mode,
    geoLat: row.geo_lat ?? undefined,
    geoLon: row.geo_lon ?? undefined,
    participants: row.participants ?? [],
    privacyMode: row.privacy_mode,
    weatherSnapshot: row.weather_snapshot ?? undefined,
    equipmentSnapshot: row.equipment_snapshot ?? undefined,
  };
}

function mapEventRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    sessionId: row.session_id,
    eventType: row.event_type,
    time: row.time,
    data: row.data ?? {},
    photos: row.photos ?? [],
    geoMode: row.geo_mode,
    geoLat: row.geo_lat ?? undefined,
    geoLon: row.geo_lon ?? undefined,
  };
}

// ============================================================================
// Route factory
// ============================================================================

export function createJagdTimelineRoutes() {
  return new Elysia({ prefix: '/api/v1/jagd' })

    // ------------------------------------------------------------------
    // POST /sessions - Start a new hunt session
    // ------------------------------------------------------------------
    .post('/sessions', async ({ body, set }) => {
      const {
        sessionType,
        geoLat,
        geoLon,
        privacyMode = 'private',
      } = body as {
        sessionType: string;
        geoLat?: number;
        geoLon?: number;
        privacyMode?: string;
      };

      try {
        // Determine geo mode from supplied coordinates
        const geoMode = geoLat != null && geoLon != null ? 'precise' : 'none';

        const result = await query(
          `INSERT INTO hunt_sessions
             (user_id, session_type, start_time, geo_mode, geo_lat, geo_lon, privacy_mode)
           VALUES
             ($1, $2, NOW(), $3, $4, $5, $6)
           RETURNING *`,
          [
            '00000000-0000-0000-0000-000000000000', // placeholder user
            sessionType,
            geoMode,
            geoLat ?? null,
            geoLon ?? null,
            privacyMode,
          ]
        );

        const session = mapSessionRow(result.rows[0]);
        set.status = 201;
        return { session };
      } catch (error) {
        logger.error({ error }, 'Failed to create hunt session');
        set.status = 500;
        return { error: 'Failed to create session' };
      }
    })

    // ------------------------------------------------------------------
    // GET /sessions - List sessions (most recent first, limit 50)
    // ------------------------------------------------------------------
    .get('/sessions', async ({ set }) => {
      try {
        const result = await query(
          `SELECT * FROM hunt_sessions
           ORDER BY start_time DESC
           LIMIT 50`
        );
        const sessions = result.rows.map(mapSessionRow);
        return { sessions };
      } catch (error) {
        logger.error({ error }, 'Failed to list hunt sessions');
        set.status = 500;
        return { error: 'Failed to list sessions' };
      }
    })

    // ------------------------------------------------------------------
    // GET /sessions/:id - Get single session with its events
    // ------------------------------------------------------------------
    .get('/sessions/:id', async ({ params, set }) => {
      try {
        const sessionResult = await query(
          `SELECT * FROM hunt_sessions WHERE id = $1`,
          [params.id]
        );

        if (sessionResult.rows.length === 0) {
          set.status = 404;
          return { error: 'Session not found' };
        }

        const eventsResult = await query(
          `SELECT * FROM timeline_events
           WHERE session_id = $1
           ORDER BY time DESC`,
          [params.id]
        );

        const session = mapSessionRow(sessionResult.rows[0]);
        const events = eventsResult.rows.map(mapEventRow);

        return { session, events };
      } catch (error) {
        logger.error({ error }, 'Failed to get hunt session');
        set.status = 500;
        return { error: 'Failed to get session' };
      }
    }, {
      params: t.Object({ id: t.String() }),
    })

    // ------------------------------------------------------------------
    // PATCH /sessions/:id/end - End a session (set end_time)
    // ------------------------------------------------------------------
    .patch('/sessions/:id/end', async ({ params, set }) => {
      try {
        const result = await query(
          `UPDATE hunt_sessions
           SET end_time = NOW(), updated_at = NOW()
           WHERE id = $1
           RETURNING *`,
          [params.id]
        );

        if (result.rows.length === 0) {
          set.status = 404;
          return { error: 'Session not found' };
        }

        const session = mapSessionRow(result.rows[0]);
        return { session };
      } catch (error) {
        logger.error({ error }, 'Failed to end hunt session');
        set.status = 500;
        return { error: 'Failed to end session' };
      }
    }, {
      params: t.Object({ id: t.String() }),
    })

    // ------------------------------------------------------------------
    // POST /events - Log a timeline event
    // ------------------------------------------------------------------
    .post('/events', async ({ body, set }) => {
      const {
        sessionId,
        eventType,
        data = {},
        photos = [],
      } = body as {
        sessionId: string;
        eventType: string;
        data?: Record<string, unknown>;
        photos?: string[];
      };

      try {
        const result = await query(
          `INSERT INTO timeline_events
             (session_id, event_type, time, data, photos, geo_mode)
           VALUES
             ($1, $2, NOW(), $3, $4, 'none')
           RETURNING *`,
          [sessionId, eventType, JSON.stringify(data), photos]
        );

        const event = mapEventRow(result.rows[0]);
        set.status = 201;
        return { event };
      } catch (error) {
        logger.error({ error }, 'Failed to log timeline event');
        set.status = 500;
        return { error: 'Failed to log event' };
      }
    })

    // ------------------------------------------------------------------
    // GET /events?sessionId=xxx - List events for a session
    // ------------------------------------------------------------------
    .get('/events', async ({ query: qs, set }) => {
      const sessionId = (qs as Record<string, string | undefined>).sessionId;

      if (!sessionId) {
        set.status = 400;
        return { error: 'sessionId query parameter is required' };
      }

      try {
        const result = await query(
          `SELECT * FROM timeline_events
           WHERE session_id = $1
           ORDER BY time DESC`,
          [sessionId]
        );
        const events = result.rows.map(mapEventRow);
        return { events };
      } catch (error) {
        logger.error({ error }, 'Failed to list timeline events');
        set.status = 500;
        return { error: 'Failed to list events' };
      }
    });
}

export default createJagdTimelineRoutes;
