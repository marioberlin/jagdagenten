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
// Geodata Layer Definitions (Diepholz ArcGIS REST)
// ============================================================================

interface GeoLayerDef {
  id: string;
  label: string;
  layerIndex: number;
  color: string;
  strokeColor: string;
  nameField: string;
  areaField: string;
  type: 'polygon' | 'point';
}

const DIEPHOLZ_BASE = 'https://geo.diepholz.de/arcgis/rest/services/Jagdreviere/MapServer';

const GEO_LAYERS: Record<string, GeoLayerDef> = {
  eigenjagd: {
    id: 'eigenjagd',
    label: 'Eigenjagd',
    layerIndex: 6,
    color: 'rgba(255,190,190,0.35)',
    strokeColor: '#730000',
    nameField: 'Eigenjagd',
    areaField: 'Flae_ha',
    type: 'polygon',
  },
  gemeinschaftsjagd: {
    id: 'gemeinschaftsjagd',
    label: 'Gemeinschaftsjagd',
    layerIndex: 7,
    color: 'rgba(190,232,255,0.3)',
    strokeColor: '#004da8',
    nameField: 'Gemeinschaftsjagd',
    areaField: 'Flae_ha',
    type: 'polygon',
  },
  hegeringe: {
    id: 'hegeringe',
    label: 'Hegeringe',
    layerIndex: 8,
    color: 'rgba(230,0,0,0.08)',
    strokeColor: '#e60000',
    nameField: 'Name',
    areaField: 'Flae_ha',
    type: 'polygon',
  },
  jagdgenossenschaften: {
    id: 'jagdgenossenschaften',
    label: 'Jagdgenossenschaften',
    layerIndex: 4,
    color: 'rgba(255,235,175,0.3)',
    strokeColor: '#a87000',
    nameField: 'JG_Name',
    areaField: 'Flae_ha',
    type: 'polygon',
  },
  damwild: {
    id: 'damwild',
    label: 'Damwildhegegemeinschaften',
    layerIndex: 1,
    color: 'rgba(163,255,115,0.25)',
    strokeColor: '#38a800',
    nameField: 'Name',
    areaField: 'Flae_ha',
    type: 'polygon',
  },
  forstreviere: {
    id: 'forstreviere',
    label: 'Forstreviere',
    layerIndex: 5,
    color: 'rgba(56,168,0,0.2)',
    strokeColor: '#267300',
    nameField: 'Name',
    areaField: 'Flae_ha',
    type: 'polygon',
  },
  jagdfreie: {
    id: 'jagdfreie',
    label: 'Jagdfreie Sonderflächen',
    layerIndex: 9,
    color: 'rgba(255,0,0,0.15)',
    strokeColor: '#ff0000',
    nameField: 'Name',
    areaField: 'Flae_ha',
    type: 'polygon',
  },
};

// In-memory cache: layer id → { data, fetchedAt }
const geoCache = new Map<string, { data: unknown; fetchedAt: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

async function fetchGeoLayer(layerDef: GeoLayerDef): Promise<unknown> {
  const cached = geoCache.get(layerDef.id);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  const url = `${DIEPHOLZ_BASE}/${layerDef.layerIndex}/query?where=1%3D1&outFields=*&f=geojson&outSR=4326`;
  logger.info({ layer: layerDef.id, url }, 'Fetching geodata from Diepholz');

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Geodata fetch failed: ${response.status} ${response.statusText}`);
  }

  const geojson = await response.json();
  geoCache.set(layerDef.id, { data: geojson, fetchedAt: Date.now() });
  return geojson;
}

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
    // Geodata: List available layers
    // -----------------------------------------------------------------------
    .get('/geodata/layers', () => {
      return {
        layers: Object.values(GEO_LAYERS).map((l) => ({
          id: l.id,
          label: l.label,
          color: l.color,
          strokeColor: l.strokeColor,
          type: l.type,
        })),
      };
    })

    // -----------------------------------------------------------------------
    // Geodata: Get GeoJSON for a specific layer
    // -----------------------------------------------------------------------
    .get(
      '/geodata/:layer',
      async ({ params, set }) => {
        const layerDef = GEO_LAYERS[params.layer];
        if (!layerDef) {
          set.status = 404;
          return { error: `Unknown layer: ${params.layer}. Available: ${Object.keys(GEO_LAYERS).join(', ')}` };
        }

        try {
          const geojson = await fetchGeoLayer(layerDef);
          return geojson;
        } catch (err) {
          logger.error({ error: err, layer: params.layer }, 'Failed to fetch geodata');
          set.status = 502;
          return { error: 'Failed to fetch geodata from upstream' };
        }
      },
      {
        params: t.Object({ layer: t.String() }),
      },
    )

    // -----------------------------------------------------------------------
    // Geodata: Get all layers at once (for initial load)
    // -----------------------------------------------------------------------
    .get('/geodata/bundle/all', async ({ set }) => {
      try {
        const results: Record<string, unknown> = {};
        const layerKeys = Object.keys(GEO_LAYERS);

        // Fetch all layers in parallel
        const fetched = await Promise.allSettled(
          layerKeys.map((key) => fetchGeoLayer(GEO_LAYERS[key]))
        );

        for (let i = 0; i < layerKeys.length; i++) {
          const result = fetched[i];
          if (result.status === 'fulfilled') {
            results[layerKeys[i]] = result.value;
          } else {
            logger.error({ layer: layerKeys[i], error: result.reason }, 'Failed to fetch layer in bundle');
            results[layerKeys[i]] = null;
          }
        }

        return {
          layers: Object.values(GEO_LAYERS).map((l) => ({
            id: l.id,
            label: l.label,
            color: l.color,
            strokeColor: l.strokeColor,
          })),
          geojson: results,
        };
      } catch (err) {
        logger.error({ error: err }, 'Failed to fetch geodata bundle');
        set.status = 500;
        return { error: 'Failed to fetch geodata bundle' };
      }
    })

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
    )

    // -----------------------------------------------------------------------
    // Stand Recommendations (AI-powered)
    // -----------------------------------------------------------------------
    .get(
      '/recommend',
      async ({ query: qs, set }) => {
        const lat = Number(qs.lat ?? 52.52);
        const lon = Number(qs.lon ?? 13.405);
        const windDirection = Number(qs.windDir ?? 270);
        const limit = Number(qs.limit ?? 3);

        try {
          // Get user's stands from DB
          const standsResult = await query(
            `SELECT id, name, stand_type, geo_lat, geo_lon, notes,
                    wind_history, performance_stats
             FROM hunt_stands WHERE user_id = $1`,
            [DEMO_USER_ID],
          );

          if (standsResult.rows.length === 0) {
            return {
              recommendations: [],
              message: 'Keine Stände konfiguriert. Fügen Sie zuerst Stände hinzu.',
            };
          }

          // Convert DB rows to recommendation format
          const stands = standsResult.rows.map((row) => ({
            id: row.id as string,
            name: row.name as string,
            lat: row.geo_lat as number,
            lon: row.geo_lon as number,
            facing: estimateFacingFromHistory(row.wind_history as Array<{ direction: number }> | null),
            type: (row.stand_type as 'hochsitz' | 'kanzel' | 'ansitz' | 'drückjagd') || 'hochsitz',
            lastSat: (row.performance_stats as { lastSat?: string } | null)?.lastSat,
            recentSightings: (row.performance_stats as { recentSightings?: number } | null)?.recentSightings || 0,
            species: (row.performance_stats as { species?: string[] } | null)?.species || [],
          }));

          // Calculate current conditions (use real data if available)
          const now = new Date();
          const sunTimes = SunCalc.getTimes(now, lat, lon);
          const moonIllum = SunCalc.getMoonIllumination(now);

          const conditions = {
            wind: {
              direction: windDirection,
              speed: 12,
              gustSpeed: 18,
            },
            temperature: 8,
            humidity: 75,
            pressure: 1015,
            moonPhase: getMoonPhaseName(moonIllum.phase),
            twilight: {
              civilDawn: sunTimes.dawn?.toISOString().slice(11, 16) ?? '06:30',
              sunrise: sunTimes.sunrise?.toISOString().slice(11, 16) ?? '07:00',
              sunset: sunTimes.sunset?.toISOString().slice(11, 16) ?? '17:00',
              civilDusk: sunTimes.dusk?.toISOString().slice(11, 16) ?? '17:30',
            },
            precipitation: 0,
            cloudCover: 40,
          };

          // Calculate huntability score (simplified)
          const huntabilityScore = calculateSimpleHuntability(conditions);

          // Generate recommendations
          const recommendations = stands
            .map((stand) => {
              const windScore = calculateWindScore(stand.facing, windDirection);
              const sightingScore = Math.min(100, 20 + (stand.recentSightings * 8));
              const freshnessScore = calculateFreshnessScore(stand.lastSat);

              const totalScore = Math.round(
                windScore * 0.35 +
                sightingScore * 0.25 +
                freshnessScore * 0.20 +
                huntabilityScore * 0.20
              );

              const reason = generateReason(windScore, sightingScore, freshnessScore, stand);

              return {
                stand: {
                  id: stand.id,
                  name: stand.name,
                  lat: stand.lat,
                  lon: stand.lon,
                  type: stand.type,
                },
                score: totalScore,
                reason,
                factors: {
                  wind: windScore,
                  sightings: sightingScore,
                  freshness: freshnessScore,
                  huntability: huntabilityScore,
                },
                approach: {
                  approachFrom: getCardinalDirection((windDirection + 180) % 360),
                  estimatedDistance: 300,
                },
              };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

          return {
            recommendations,
            conditions: {
              windDirection,
              huntabilityScore,
            },
          };
        } catch (err) {
          logger.error({ error: err }, 'Failed to generate recommendations');
          set.status = 500;
          return { error: 'Failed to generate recommendations' };
        }
      },
      {
        query: t.Object({
          lat: t.Optional(t.String()),
          lon: t.Optional(t.String()),
          windDir: t.Optional(t.String()),
          limit: t.Optional(t.String()),
        }),
      },
    );
}

// ============================================================================
// Recommendation Helpers
// ============================================================================

function estimateFacingFromHistory(windHistory: Array<{ direction: number }> | null): number {
  if (!windHistory || windHistory.length === 0) return 180; // Default: faces south
  // Assume stand faces opposite to average successful wind direction
  const avgDir = windHistory.reduce((sum, w) => sum + w.direction, 0) / windHistory.length;
  return (avgDir + 180) % 360;
}

function calculateWindScore(standFacing: number, windDirection: number): number {
  const idealWind = (standFacing + 180) % 360;
  const diff = Math.abs(windDirection - idealWind);
  const normalizedDiff = diff > 180 ? 360 - diff : diff;
  return Math.round(100 - (normalizedDiff / 180) * 100);
}

function calculateFreshnessScore(lastSat?: string): number {
  if (!lastSat) return 80;
  const daysSince = Math.floor((Date.now() - new Date(lastSat).getTime()) / (1000 * 60 * 60 * 24));
  return Math.min(100, 20 + (daysSince * 12));
}

function calculateSimpleHuntability(conditions: { wind: { speed: number }; precipitation: number }): number {
  let score = 70;
  if (conditions.wind.speed < 15) score += 10;
  if (conditions.wind.speed > 25) score -= 20;
  if (conditions.precipitation > 0) score -= 15;
  return Math.max(0, Math.min(100, score));
}

function getCardinalDirection(degrees: number): string {
  const directions = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'];
  return directions[Math.round(degrees / 45) % 8];
}

function getMoonPhaseName(phase: number): string {
  if (phase < 0.125) return 'Neumond';
  if (phase < 0.25) return 'Zunehmend (Sichel)';
  if (phase < 0.375) return 'Erstes Viertel';
  if (phase < 0.5) return 'Zunehmend (Dreiviertel)';
  if (phase < 0.625) return 'Vollmond';
  if (phase < 0.75) return 'Abnehmend (Dreiviertel)';
  if (phase < 0.875) return 'Letztes Viertel';
  return 'Abnehmend (Sichel)';
}

function generateReason(
  windScore: number,
  sightingScore: number,
  freshnessScore: number,
  stand: { recentSightings: number; lastSat?: string; species: string[] }
): string {
  const parts: string[] = [];

  if (windScore >= 80) parts.push('Wind optimal');
  else if (windScore >= 60) parts.push('Wind günstig');

  if (sightingScore >= 80 && stand.recentSightings > 0) {
    parts.push(`${stand.recentSightings} Sichtungen kürzlich`);
  }

  if (freshnessScore >= 80 && stand.lastSat) {
    const days = Math.floor((Date.now() - new Date(stand.lastSat).getTime()) / (1000 * 60 * 60 * 24));
    if (days > 0) parts.push(`${days} Tage unbesetzt`);
  }

  if (stand.species.length > 0) {
    parts.push(`bekannt für ${stand.species[0]}`);
  }

  return parts.length > 0 ? parts.join(', ') : 'Gute Gesamtbedingungen';
}

export default createJagdScoutRoutes;
