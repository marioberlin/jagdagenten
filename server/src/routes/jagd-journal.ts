/**
 * Jagd Journal API Routes
 *
 * REST endpoints for hunting journal entries (sightings, harvests, notes).
 * Entries are stored as timeline_events in PostgreSQL with journal-specific
 * data in the JSONB `data` column.
 *
 * Endpoints:
 *   GET    /api/v1/jagd/journal       - List entries (filterable)
 *   POST   /api/v1/jagd/journal       - Create an entry
 *   GET    /api/v1/jagd/journal/:id   - Get single entry
 *   PUT    /api/v1/jagd/journal/:id   - Update an entry
 *   DELETE /api/v1/jagd/journal/:id   - Delete an entry
 */

import { Elysia, t } from 'elysia';
import { randomUUID } from 'crypto';
import { query } from '../db.js';
import { componentLoggers } from '../logger.js';

const log = componentLoggers.http;

// ============================================================================
// Types
// ============================================================================

/** Shape returned to / accepted from the frontend */
interface JournalEntryRow {
  id: string;
  session_id: string | null;
  event_type: string;
  time: string;
  geo_lat: number | null;
  geo_lon: number | null;
  data: Record<string, unknown>;
  photos: string[];
  created_at: string;
}

interface JournalEntryResponse {
  id: string;
  sessionId?: string;
  entryType: 'sighting' | 'harvest' | 'note';
  species?: string;
  time: string;
  location?: { lat: number; lon: number };
  notes: string;
  photos: string[];
  wildbretWeight?: number;
  processingSteps?: string[];
}

// ============================================================================
// Helpers
// ============================================================================

/** Map an event_type stored in the DB to the journal entryType */
function mapEventTypeToEntryType(eventType: string): 'sighting' | 'harvest' | 'note' {
  if (eventType === 'sighting') return 'sighting';
  if (eventType === 'harvest' || eventType === 'shot') return 'harvest';
  return 'note';
}

/** Map a journal entryType to the event_type stored in the DB */
function mapEntryTypeToEventType(entryType: string): string {
  if (entryType === 'sighting') return 'sighting';
  if (entryType === 'harvest') return 'harvest';
  return 'note';
}

/** Serialise a DB row into the API response shape */
function toResponse(row: JournalEntryRow): JournalEntryResponse {
  const data = (typeof row.data === 'string' ? JSON.parse(row.data) : row.data) as Record<string, unknown>;

  const entry: JournalEntryResponse = {
    id: row.id,
    sessionId: row.session_id ?? undefined,
    entryType: mapEventTypeToEntryType(row.event_type),
    species: (data.species as string) ?? undefined,
    time: row.time,
    notes: (data.notes as string) ?? '',
    photos: row.photos ?? [],
    wildbretWeight: (data.wildbretWeight as number) ?? undefined,
    processingSteps: (data.processingSteps as string[]) ?? undefined,
  };

  if (row.geo_lat != null && row.geo_lon != null) {
    entry.location = { lat: row.geo_lat, lon: row.geo_lon };
  }

  return entry;
}

// ============================================================================
// Route Plugin
// ============================================================================

export function createJagdJournalRoutes() {
  return new Elysia({ prefix: '/api/v1/jagd/journal' })

    // -----------------------------------------------------------------------
    // GET / - List journal entries with optional filters
    // -----------------------------------------------------------------------
    .get('/', async ({ query: qs }) => {
      try {
        const conditions: string[] = [];
        const params: unknown[] = [];
        let idx = 1;

        // Filter by entryType -> event_type
        if (qs.entryType) {
          const eventType = mapEntryTypeToEventType(qs.entryType as string);
          conditions.push(`event_type = $${idx++}`);
          params.push(eventType);
        } else {
          // Only return journal-relevant event types
          conditions.push(`event_type IN ('sighting', 'harvest', 'shot', 'note')`);
        }

        // Filter by species (stored inside JSONB data)
        if (qs.species) {
          conditions.push(`data->>'species' = $${idx++}`);
          params.push(qs.species);
        }

        // Filter by date range
        if (qs.from) {
          conditions.push(`time >= $${idx++}`);
          params.push(qs.from);
        }
        if (qs.to) {
          conditions.push(`time <= $${idx++}`);
          params.push(qs.to);
        }

        const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const result = await query<JournalEntryRow>(
          `SELECT id, session_id, event_type, time, geo_lat, geo_lon, data, photos, created_at
           FROM timeline_events
           ${where}
           ORDER BY time DESC
           LIMIT 200`,
          params,
        );

        return { entries: result.rows.map(toResponse) };
      } catch (err) {
        log.error({ error: (err as Error).message }, 'Failed to list journal entries');
        return { entries: [], error: (err as Error).message };
      }
    })

    // -----------------------------------------------------------------------
    // POST / - Create a new journal entry
    // -----------------------------------------------------------------------
    .post('/', async ({ body, set }) => {
      try {
        const {
          sessionId,
          entryType,
          species,
          time,
          location,
          notes,
          photos,
          wildbretWeight,
          processingSteps,
        } = body as Record<string, unknown>;

        const id = randomUUID();
        const eventType = mapEntryTypeToEventType((entryType as string) || 'note');

        // Build JSONB data payload
        const data: Record<string, unknown> = {};
        if (species) data.species = species;
        if (notes) data.notes = notes;
        if (wildbretWeight != null) data.wildbretWeight = wildbretWeight;
        if (processingSteps) data.processingSteps = processingSteps;

        const loc = location as { lat?: number; lon?: number } | undefined;
        const geoLat = loc?.lat ?? null;
        const geoLon = loc?.lon ?? null;

        // session_id is required by the DB FK constraint. When no session is
        // provided we still allow creation by passing NULL and relying on the
        // column being nullable. If the constraint is NOT NULL, the caller
        // must supply a valid sessionId.
        const result = await query<JournalEntryRow>(
          `INSERT INTO timeline_events
             (id, session_id, event_type, time, geo_lat, geo_lon, data, photos)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id, session_id, event_type, time, geo_lat, geo_lon, data, photos, created_at`,
          [
            id,
            (sessionId as string) || null,
            eventType,
            (time as string) || new Date().toISOString(),
            geoLat,
            geoLon,
            JSON.stringify(data),
            (photos as string[]) || [],
          ],
        );

        set.status = 201;
        return { entry: toResponse(result.rows[0]) };
      } catch (err) {
        log.error({ error: (err as Error).message }, 'Failed to create journal entry');
        set.status = 500;
        return { error: (err as Error).message };
      }
    })

    // -----------------------------------------------------------------------
    // GET /:id - Get a single journal entry
    // -----------------------------------------------------------------------
    .get('/:id', async ({ params, set }) => {
      try {
        const result = await query<JournalEntryRow>(
          `SELECT id, session_id, event_type, time, geo_lat, geo_lon, data, photos, created_at
           FROM timeline_events
           WHERE id = $1`,
          [params.id],
        );

        if (result.rows.length === 0) {
          set.status = 404;
          return { error: 'Entry not found' };
        }

        return { entry: toResponse(result.rows[0]) };
      } catch (err) {
        log.error({ error: (err as Error).message }, 'Failed to get journal entry');
        set.status = 500;
        return { error: (err as Error).message };
      }
    }, {
      params: t.Object({ id: t.String() }),
    })

    // -----------------------------------------------------------------------
    // PUT /:id - Update an existing journal entry
    // -----------------------------------------------------------------------
    .put('/:id', async ({ params, body, set }) => {
      try {
        // First fetch the existing row so we can merge data
        const existing = await query<JournalEntryRow>(
          `SELECT id, session_id, event_type, time, geo_lat, geo_lon, data, photos, created_at
           FROM timeline_events WHERE id = $1`,
          [params.id],
        );

        if (existing.rows.length === 0) {
          set.status = 404;
          return { error: 'Entry not found' };
        }

        const row = existing.rows[0];
        const oldData = (typeof row.data === 'string' ? JSON.parse(row.data) : row.data) as Record<string, unknown>;

        const {
          entryType,
          species,
          time,
          location,
          notes,
          photos,
          wildbretWeight,
          processingSteps,
          sessionId,
        } = body as Record<string, unknown>;

        // Merge data fields
        const newData = { ...oldData };
        if (species !== undefined) newData.species = species;
        if (notes !== undefined) newData.notes = notes;
        if (wildbretWeight !== undefined) newData.wildbretWeight = wildbretWeight;
        if (processingSteps !== undefined) newData.processingSteps = processingSteps;

        const loc = location as { lat?: number; lon?: number } | undefined;
        const geoLat = loc ? (loc.lat ?? null) : row.geo_lat;
        const geoLon = loc ? (loc.lon ?? null) : row.geo_lon;

        const eventType = entryType ? mapEntryTypeToEventType(entryType as string) : row.event_type;

        const result = await query<JournalEntryRow>(
          `UPDATE timeline_events
           SET event_type = $1,
               time       = $2,
               geo_lat    = $3,
               geo_lon    = $4,
               data       = $5,
               photos     = $6,
               session_id = COALESCE($7, session_id)
           WHERE id = $8
           RETURNING id, session_id, event_type, time, geo_lat, geo_lon, data, photos, created_at`,
          [
            eventType,
            (time as string) || row.time,
            geoLat,
            geoLon,
            JSON.stringify(newData),
            (photos as string[]) ?? row.photos,
            (sessionId as string) || null,
            params.id,
          ],
        );

        return { entry: toResponse(result.rows[0]) };
      } catch (err) {
        log.error({ error: (err as Error).message }, 'Failed to update journal entry');
        set.status = 500;
        return { error: (err as Error).message };
      }
    }, {
      params: t.Object({ id: t.String() }),
    })

    // -----------------------------------------------------------------------
    // DELETE /:id - Delete a journal entry
    // -----------------------------------------------------------------------
    .delete('/:id', async ({ params, set }) => {
      try {
        const result = await query(
          `DELETE FROM timeline_events WHERE id = $1 RETURNING id`,
          [params.id],
        );

        if (result.rowCount === 0) {
          set.status = 404;
          return { error: 'Entry not found' };
        }

        return { success: true };
      } catch (err) {
        log.error({ error: (err as Error).message }, 'Failed to delete journal entry');
        set.status = 500;
        return { error: (err as Error).message };
      }
    }, {
      params: t.Object({ id: t.String() }),
    });
}
