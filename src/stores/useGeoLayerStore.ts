/**
 * GeoLayer Store
 *
 * Zustand store for managing geodata layers (Jagdreviere, Hegeringe, etc.)
 * fetched from the backend proxy to Diepholz ArcGIS REST services.
 */

import { create } from 'zustand';

// ============================================================================
// Types
// ============================================================================

export interface GeoLayerMeta {
  id: string;
  label: string;
  color: string;
  strokeColor: string;
  type: 'polygon' | 'point';
}

/** Search result for a single GeoJSON feature match */
export interface RevierSearchResult {
  layerId: string;
  layerLabel: string;
  featureName: string;
  area: number | null;
  hegering: string | null;
  revierNr: string | null;
  center: [number, number]; // [lat, lon]
  /** 0 = exact match, 1 = starts-with, 2 = contains */
  relevance: number;
}

export interface GeoLayerState {
  /** Available layer definitions from the backend */
  layers: GeoLayerMeta[];
  /** Fetched GeoJSON data per layer id */
  geojson: Record<string, GeoJSON.FeatureCollection | null>;
  /** Which layers are currently visible on the map */
  visibleLayers: Set<string>;
  /** Loading state per layer */
  loading: Record<string, boolean>;
  /** Global loading (fetching layer list) */
  initializing: boolean;
  /** Error message */
  error: string | null;
}

export interface GeoLayerActions {
  /** Fetch the list of available layers from backend */
  fetchLayers: () => Promise<void>;
  /** Fetch GeoJSON for a specific layer */
  fetchLayerData: (layerId: string) => Promise<void>;
  /** Toggle visibility of a layer (fetches data on first enable) */
  toggleLayer: (layerId: string) => void;
  /** Enable a layer */
  showLayer: (layerId: string) => void;
  /** Disable a layer */
  hideLayer: (layerId: string) => void;
  /** Check if a layer is visible */
  isVisible: (layerId: string) => boolean;
  /** Search all loaded GeoJSON features by name (case-insensitive, partial match) */
  searchFeatures: (query: string) => RevierSearchResult[];
}

export type GeoLayerStore = GeoLayerState & GeoLayerActions;

// ============================================================================
// Store
// ============================================================================

const API_BASE = '/api/v1/jagd/geodata';

export const useGeoLayerStore = create<GeoLayerStore>((set, get) => ({
  // State
  layers: [],
  geojson: {},
  visibleLayers: new Set<string>(),
  loading: {},
  initializing: false,
  error: null,

  // Actions
  fetchLayers: async () => {
    set({ initializing: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/layers`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ layers: data.layers, initializing: false });
    } catch (err) {
      set({ error: (err as Error).message, initializing: false });
    }
  },

  fetchLayerData: async (layerId: string) => {
    // Skip if already loaded
    if (get().geojson[layerId]) return;

    set((state) => ({
      loading: { ...state.loading, [layerId]: true },
      error: null,
    }));

    try {
      const res = await fetch(`${API_BASE}/${layerId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const geojson = await res.json();
      set((state) => ({
        geojson: { ...state.geojson, [layerId]: geojson },
        loading: { ...state.loading, [layerId]: false },
      }));
    } catch (err) {
      set((state) => ({
        loading: { ...state.loading, [layerId]: false },
        error: (err as Error).message,
      }));
    }
  },

  toggleLayer: (layerId: string) => {
    const { visibleLayers, geojson, fetchLayerData } = get();
    const newVisible = new Set(visibleLayers);

    if (newVisible.has(layerId)) {
      newVisible.delete(layerId);
    } else {
      newVisible.add(layerId);
      // Auto-fetch data if not loaded yet
      if (!geojson[layerId]) {
        fetchLayerData(layerId);
      }
    }

    set({ visibleLayers: newVisible });
  },

  showLayer: (layerId: string) => {
    const { visibleLayers, geojson, fetchLayerData } = get();
    const newVisible = new Set(visibleLayers);
    newVisible.add(layerId);
    if (!geojson[layerId]) {
      fetchLayerData(layerId);
    }
    set({ visibleLayers: newVisible });
  },

  hideLayer: (layerId: string) => {
    const { visibleLayers } = get();
    const newVisible = new Set(visibleLayers);
    newVisible.delete(layerId);
    set({ visibleLayers: newVisible });
  },

  isVisible: (layerId: string) => {
    return get().visibleLayers.has(layerId);
  },

  searchFeatures: (query: string) => {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const { geojson, layers } = get();
    const NAME_FIELDS = ['Name', 'Eigenjagd', 'Gemeinschaftsjagd', 'JG_Name', 'Revier_Nr', 'Hegering'];
    const results: RevierSearchResult[] = [];

    for (const layer of layers) {
      const fc = geojson[layer.id];
      if (!fc?.features) continue;

      for (const feature of fc.features) {
        const props = (feature.properties ?? {}) as Record<string, unknown>;

        // Collect all searchable text from the feature
        let bestMatch = '';
        let bestRelevance = 999;
        for (const field of NAME_FIELDS) {
          const val = props[field];
          if (!val) continue;
          const str = String(val).toLowerCase();

          if (str === q) {
            bestMatch = String(val);
            bestRelevance = 0; // exact
            break;
          } else if (str.startsWith(q) && bestRelevance > 1) {
            bestMatch = String(val);
            bestRelevance = 1; // starts-with
          } else if (str.includes(q) && bestRelevance > 2) {
            bestMatch = String(val);
            bestRelevance = 2; // contains
          }
          // Also try: query words all present in value
          if (bestRelevance > 2) {
            const words = q.split(/\s+/);
            if (words.length > 1 && words.every(w => str.includes(w))) {
              bestMatch = String(val);
              bestRelevance = 2;
            }
          }
        }

        if (!bestMatch) continue;

        // Calculate polygon centroid
        const center = computeCentroid(feature.geometry);
        if (!center) continue;

        // Extract display name (prefer specific name fields)
        const featureName = String(
          props['Eigenjagd'] ?? props['Gemeinschaftsjagd'] ?? props['JG_Name'] ?? props['Name'] ?? bestMatch
        );

        results.push({
          layerId: layer.id,
          layerLabel: layer.label,
          featureName,
          area: props['Flae_ha'] ? Number(props['Flae_ha']) : null,
          hegering: props['Hegering'] ? String(props['Hegering']) : null,
          revierNr: props['Revier_Nr'] ? String(props['Revier_Nr']) : null,
          center,
          relevance: bestRelevance,
        });
      }
    }

    // Sort by relevance (exact > starts-with > contains), then alphabetically
    results.sort((a, b) => a.relevance - b.relevance || a.featureName.localeCompare(b.featureName));

    return results.slice(0, 10);
  },
}));

// ============================================================================
// Helpers
// ============================================================================

/** Compute [lat, lon] centroid of a GeoJSON geometry by averaging ring coordinates. */
function computeCentroid(geometry: GeoJSON.Geometry): [number, number] | null {
  const coords: number[][] = [];

  function collect(arr: unknown): void {
    if (!Array.isArray(arr)) return;
    if (arr.length >= 2 && typeof arr[0] === 'number' && typeof arr[1] === 'number') {
      coords.push(arr as number[]);
    } else {
      for (const item of arr) collect(item);
    }
  }

  if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
    collect((geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon).coordinates);
  } else {
    return null;
  }

  if (coords.length === 0) return null;

  let lonSum = 0;
  let latSum = 0;
  for (const [lon, lat] of coords) {
    lonSum += lon;
    latSum += lat;
  }
  // GeoJSON is [lon, lat], we return [lat, lon] for pigeon-maps
  return [latSum / coords.length, lonSum / coords.length];
}
