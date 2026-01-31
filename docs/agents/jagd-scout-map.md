# Jagd-Agenten: Scout & Revierkarten

> Comprehensive documentation for the Scout map feature including stand management, Diepholz Jagdrevier geodata integration, and intelligent revier search.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Component Hierarchy](#component-hierarchy)
- [ScoutView Layout](#scoutview-layout)
- [Interactive Map (HuntingMap)](#interactive-map-huntingmap)
- [Geodata Layer System](#geodata-layer-system)
- [Revier Search](#revier-search)
- [Stand Management](#stand-management)
- [Wind & Conditions](#wind--conditions)
- [Backend API Reference](#backend-api-reference)
- [Database Schema](#database-schema)
- [Data Flow](#data-flow)
- [Caching Strategy](#caching-strategy)
- [ArcGIS Integration](#arcgis-integration)
- [Overlay Components](#overlay-components)
- [File Reference](#file-reference)
- [Known Limitations](#known-limitations)

---

## Architecture Overview

The Scout feature is a three-panel map application that combines pigeon-maps (v0.22.1) with live geodata from the Landkreis Diepholz ArcGIS REST service. All geodata flows through a backend proxy with 30-minute caching, and the frontend Zustand store provides instant client-side search across all loaded features.

```
User
 |
 v
ScoutView (3-panel layout)
 |
 +-- Left Sidebar: Stand list + Layer toggles (useGeoLayerStore)
 |
 +-- Center: HuntingMap (pigeon-maps)
 |    +-- JagdrevierLayers (GeoJSON polygons)
 |    +-- RevierSearchBar (floating search)
 |    +-- Stand markers + Scent cones
 |
 +-- Right Panel: Detail (Wind compass, conditions, notes)
 |
 v
Zustand Stores
 |
 +-- useScoutStore ----> GET/POST /api/v1/jagd/stands
 |                       GET /api/v1/jagd/conditions
 |
 +-- useGeoLayerStore -> GET /api/v1/jagd/geodata/layers
                         GET /api/v1/jagd/geodata/:layer
                              |
                              v
                         Diepholz ArcGIS MapServer
                         https://geo.diepholz.de/arcgis/rest/services/Jagdreviere/MapServer
```

---

## Component Hierarchy

```
ScoutView
 +-- WindCompass              (SVG wind rose)
 +-- AddStandForm             (collapsible form)
 +-- StandListItem[]          (selectable stand cards)
 +-- Layer toggle buttons     (7 Diepholz layers)
 +-- HuntingMap               (pigeon-maps <Map>)
 |    +-- Stand Markers       (Overlay, per stand)
 |    +-- Scent Cones         (SVG, wind-based)
 |    +-- Wind Indicator      (top-right panel)
 |    +-- Layer Controls      (bottom-left toggles)
 |    +-- JagdrevierLayers    (GeoJson per active layer)
 |    |    +-- FeatureInfoPopup (click-to-inspect)
 |    +-- [HeatmapLayer]      (canvas overlay, opt-in)
 +-- RevierSearchBar          (floating, absolute over map)
 +-- StandDetail              (right panel, collapsible)
      +-- WindCompass
      +-- Conditions snapshot
      +-- Twilight times
      +-- Notes editor
```

---

## ScoutView Layout

**File:** `src/applications/jagd-agenten/components/ScoutView.tsx`

```
+---------------------------------------------------------------+
| Sidebar (lg:w-72)  |  Map (flex-1, relative)  | Detail (lg:w-80)
|                     |                          |
| [+] Ansitze         |                          | Stand name
|                     |                          | Wind compass
| Kartenebenen [v] 3  |     OpenStreetMap        | Conditions
|  * Eigenjagd        |     with GeoJSON         |   Temperature
|  * Gemeinschaftsjagd|     overlays             |   Humidity
|  * Hegeringe        |                          |   Pressure
|  * Jagdgenossen...  |                          |   Moon phase
|  * Damwild...       |                          | Twilight
|  * Forstreviere     |  +-------------------+   |   Dawn
|  * Jagdfreie        |  | Revier suchen ... |   |   Sunrise
|                     |  +-------------------+   |   Sunset
| Stand 1             |                          |   Dusk
| Stand 2             |                          | Notes [edit]
| Stand 3             |                          |
+---------------------------------------------------------------+
                         Taskbar
```

### Map Center Priority

The map center is computed with the following priority:

1. **Search override** (`searchCenter`) -- set when user picks a search result
2. **Selected stand** -- centers on the stand's lat/lon
3. **Average of all stands** -- if multiple stands exist
4. **Diepholz default** -- `[52.6064, 8.7018]` as fallback

### Zoom Priority

1. **Search override** -- usually zoom 14 (revier-level)
2. **Selected stand** -- zoom 15 (close-up)
3. **Multiple stands** -- zoom 14
4. **No stands** -- zoom 11 (county-level overview)

---

## Interactive Map (HuntingMap)

**File:** `src/applications/jagd-agenten/components/HuntingMap.tsx`

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `stands` | `HuntStand[]` | required | Array of hunting stands to display as markers |
| `wind` | `WindData` | undefined | Wind direction (0-360) and speed (km/h) |
| `boundaries` | `RevierBoundary[]` | `[]` | Polygon boundaries for revier outlines |
| `harvests` | `HarvestPoint[]` | `[]` | Harvest locations for heatmap |
| `center` | `[number, number]` | `[51.1657, 10.4515]` | Map center [lat, lon] |
| `zoom` | `number` | `14` | Zoom level (1-18) |
| `selectedStandId` | `string` | undefined | Highlight selected stand |
| `onStandClick` | `(stand) => void` | undefined | Stand marker click handler |
| `onAddStand` | `(lat, lon) => void` | undefined | Map click handler for adding stands |
| `children` | `ReactNode` | undefined | Extra layers (JagdrevierLayers, CadastralLayer) |

### Types

```typescript
interface HuntStand {
  id: string;
  name: string;
  type: 'hochsitz' | 'kanzel' | 'ansitz' | 'other';
  lat: number;
  lon: number;
  notes?: string;
  lastHarvest?: string;
}

interface WindData {
  direction: number;  // 0-360 degrees (0=N, 90=E, 180=S, 270=W)
  speed: number;      // km/h
}
```

### Stand Markers

Color-coded by type:

| Type | Color | Description |
|------|-------|-------------|
| `hochsitz` | `#22c55e` (green) | Raised hide |
| `kanzel` | `#3b82f6` (blue) | Enclosed stand |
| `ansitz` | `#f59e0b` (amber) | Ground sit |
| `other` | `#6b7280` (gray) | Other type |

Markers are 32x32px teardrop shapes with a Crosshair icon overlay. Selected markers get a scale transform and accent border.

### Scent Cone Visualization

When wind data is available and the wind toggle is active, the map displays a downwind scent cone for each stand:

- **Cone length:** 300m -- 800m (scales with wind speed)
- **Spread angle:** 15 -- 45 degrees (wider in weaker wind)
- **Color:** `rgba(251, 146, 60, 0.3)` (semi-transparent orange)
- **Direction:** Opposite to wind direction (downwind)

**Formula:**
```
downwindAngle = (windDirection + 180) % 360
coneLength = 0.3 + (windSpeed / 30) * 0.5  // km
spreadAngle = max(15, 45 - windSpeed)       // degrees
```

### pigeon-maps Integration

HuntingMap uses `<Map>` from pigeon-maps which injects `mapState`, `latLngToPixel`, and `setCenterZoom` into direct children via `React.cloneElement`. Any wrapper component placed inside `<Map>` must forward these injected props via rest spread (`{...pigeonProps}`).

---

## Geodata Layer System

### Store: useGeoLayerStore

**File:** `src/stores/useGeoLayerStore.ts`

```typescript
interface GeoLayerState {
  layers: GeoLayerMeta[];                              // Layer definitions from backend
  geojson: Record<string, GeoJSON.FeatureCollection>;  // Cached GeoJSON per layer
  visibleLayers: Set<string>;                          // Currently visible layer IDs
  loading: Record<string, boolean>;                    // Per-layer loading state
  initializing: boolean;                               // Layer list fetch in progress
  error: string | null;
}
```

### Available Layers (Landkreis Diepholz)

| ID | Label | ArcGIS Index | Fill Color | Stroke | Features |
|----|-------|-------------|------------|--------|----------|
| `eigenjagd` | Eigenjagd | 6 | `rgba(255,190,190,0.35)` | `#730000` | ~133 |
| `gemeinschaftsjagd` | Gemeinschaftsjagd | 7 | `rgba(190,232,255,0.3)` | `#004da8` | ~185 |
| `hegeringe` | Hegeringe | 8 | `rgba(230,0,0,0.08)` | `#e60000` | ~17 |
| `jagdgenossenschaften` | Jagdgenossenschaften | 4 | `rgba(255,235,175,0.3)` | `#a87000` | ~159 |
| `damwild` | Damwildhegegemeinschaften | 1 | `rgba(163,255,115,0.25)` | `#38a800` | ~3 |
| `forstreviere` | Forstreviere | 5 | `rgba(56,168,0,0.2)` | `#267300` | ~47 |
| `jagdfreie` | Jagdfreie Sonderflachen | 9 | `rgba(255,0,0,0.15)` | `#ff0000` | ~2 |

### Layer Toggle Behavior

1. User clicks toggle button in sidebar
2. `toggleLayer(layerId)` called on store
3. If enabling and GeoJSON not cached: `fetchLayerData(layerId)` fires
4. Backend proxy fetches from Diepholz ArcGIS (or returns cached)
5. GeoJSON stored in `geojson[layerId]`
6. `JagdrevierLayers` re-renders, adding `<GeoJson>` components for visible layers

### JagdrevierLayers Component

**File:** `src/applications/jagd-agenten/components/JagdrevierLayers.tsx`

Renders active geodata layers as pigeon-maps `<GeoJson>` overlays. Accepts pigeon-maps injected props via `{...pigeonProps}` rest spread.

**Feature name resolution** (checked in order):

1. `properties.Name`
2. `properties.Eigenjagd`
3. `properties.Gemeinschaftsjagd`
4. `properties.JG_Name`
5. `properties.Revier_Nr`
6. Fallback: `"Unbenannt"`

**Click-to-inspect popup** shows:
- Feature name
- Layer label badge
- Area in hectares (`Flae_ha` field)
- Hegering name
- Revier number

---

## Revier Search

**File:** `src/applications/jagd-agenten/components/RevierSearchBar.tsx`

A floating search bar positioned at the bottom center of the map area. Searches all loaded GeoJSON features client-side with instant results.

### How It Works

1. User types query (minimum 2 characters)
2. `searchFeatures(query)` runs on the GeoLayer store (client-side, no API call)
3. Searches across all loaded layers (not just visible ones)
4. Matching features displayed in a drop-up dropdown
5. User selects result via click, Enter key, or arrow key navigation
6. Map centers on feature centroid at zoom 14
7. Layer auto-activates if not already visible

### Search Fields

The search checks these GeoJSON property fields (case-insensitive, partial match):

| Field | Used By |
|-------|---------|
| `Name` | Hegeringe, Damwild, Forstreviere, Jagdfreie |
| `Eigenjagd` | Eigenjagd layer |
| `Gemeinschaftsjagd` | Gemeinschaftsjagd layer |
| `JG_Name` | Jagdgenossenschaften layer |
| `Revier_Nr` | All layers with revier numbers |
| `Hegering` | All layers with hegering assignment |

### Relevance Ranking

| Rank | Match Type | Example |
|------|-----------|---------|
| 0 | Exact match | Query "Barnstorf" matches field "Barnstorf" |
| 1 | Starts-with | Query "Barn" matches field "Barnstorf" |
| 2 | Contains | Query "storf" matches field "Barnstorf" |
| 2 | Multi-word | Query "Heerde Kuppendorf" - all words found in field |

Results sorted by relevance then alphabetically, limited to 10.

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Enter` | Select highlighted result (or first result) |
| `Arrow Up/Down` | Navigate results |
| `Escape` | Close dropdown and blur input |

### Result Item Display

Each result shows:
- Color-coded MapPin icon (matches layer stroke color)
- Feature name (bold)
- Layer label badge (e.g., "Gemeinschaftsjagd")
- Area in hectares
- Hegering name (if available)

### Centroid Calculation

For each matched polygon, the centroid is computed by averaging all coordinate pairs:

```typescript
// GeoJSON stores [lon, lat], pigeon-maps expects [lat, lon]
center = [avg(all_latitudes), avg(all_longitudes)]
```

This handles both `Polygon` and `MultiPolygon` geometry types.

---

## Stand Management

### Store: useScoutStore

**File:** `src/stores/useScoutStore.ts`

```typescript
interface HuntStand {
  id: string;
  name: string;
  standType: string;              // hochsitz, kanzel, druckjagdstand, ansitzleiter, bodenschirm, other
  geoLat: number;
  geoLon: number;
  notes?: string;
  windHistory: WindEntry[];       // [{ direction, speed, timestamp }]
  performanceStats: Record<string, unknown>;
}
```

### Actions

| Action | API Call | Description |
|--------|----------|-------------|
| `fetchStands()` | `GET /stands` | Load all user stands |
| `addStand(data)` | `POST /stands` | Create new stand |
| `updateStand(id, updates)` | `PUT /stands/:id` | Update stand fields |
| `deleteStand(id)` | `DELETE /stands/:id` | Remove stand |
| `selectStand(id)` | `GET /stands/:id` + `GET /conditions` | Select and load details |

### Stand Types

| Value | Label (German) | Description |
|-------|---------------|-------------|
| `hochsitz` | Hochsitz | Raised deer stand |
| `kanzel` | Kanzel | Enclosed elevated blind |
| `druckjagdstand` | Druckjagdstand | Driven hunt stand |
| `ansitzleiter` | Ansitzleiter | Ladder stand |
| `bodenschirm` | Bodenschirm | Ground blind |
| `other` | Sonstige | Other |

---

## Wind & Conditions

### ConditionsSnapshot

```typescript
interface ConditionsSnapshot {
  wind: { direction: number; speed: number };
  temperature: number;    // Celsius
  humidity: number;       // Percent
  pressure: number;       // hPa
  moonPhase: number;      // 0-1 (0=new, 0.5=full)
  twilight: {
    civilDawn: string;    // ISO timestamp
    sunrise: string;
    sunset: string;
    civilDusk: string;
  };
  timestamp: string;
}
```

### Wind Compass (SVG)

The WindCompass component renders:
- Outer circle (radius 60px) with tick marks
- Cardinal labels (N, E, S, W) at 45-degree intervals
- Directional arrow from center to wind direction
- Arrowhead dot and center dot
- Speed + direction readout below

### Twilight Calculation

Uses the `suncalc` library on the backend:
- `SunCalc.getTimes(date, lat, lon)` for dawn/sunrise/sunset/dusk
- `SunCalc.getMoonIllumination(date)` for moon phase

---

## Backend API Reference

**Base path:** `/api/v1/jagd`

### Stand Endpoints

#### `GET /stands`

Returns all stands for the current user.

```json
{
  "stands": [
    {
      "id": "uuid",
      "name": "Eichenkanzel",
      "standType": "kanzel",
      "geoLat": 52.6064,
      "geoLon": 8.7018,
      "notes": "Guter Einstand",
      "windHistory": [],
      "performanceStats": {}
    }
  ]
}
```

#### `POST /stands`

Create a new stand.

**Body:**
```json
{
  "name": "Waldrand Hochsitz",
  "standType": "hochsitz",
  "geoLat": 52.61,
  "geoLon": 8.72,
  "notes": "Am Waldrand, gute Sicht"
}
```

#### `PUT /stands/:id`

Update stand fields. Only provided fields are updated.

**Body:** Any subset of `{ name, standType, geoLat, geoLon, notes }`

#### `DELETE /stands/:id`

Delete a stand. Returns `{ success: true }`.

### Geodata Endpoints

#### `GET /geodata/layers`

Returns available layer definitions (no GeoJSON data).

```json
{
  "layers": [
    {
      "id": "eigenjagd",
      "label": "Eigenjagd",
      "color": "rgba(255,190,190,0.35)",
      "strokeColor": "#730000",
      "type": "polygon"
    }
  ]
}
```

#### `GET /geodata/:layer`

Returns GeoJSON FeatureCollection for the specified layer. Cached for 30 minutes.

**Params:** Layer ID (e.g., `eigenjagd`, `gemeinschaftsjagd`, `hegeringe`)

**Response:** Standard GeoJSON FeatureCollection with properties:
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "Eigenjagd": "Musterhof",
        "Flae_ha": 45.2,
        "Hegering": "Barnstorf",
        "Revier_Nr": "DH-123"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[8.7, 52.6], [8.71, 52.61], ...]]
      }
    }
  ]
}
```

#### `GET /geodata/bundle/all`

Fetch all layers in parallel. Uses `Promise.allSettled` for fault tolerance.

```json
{
  "layers": [...],
  "geojson": {
    "eigenjagd": { "type": "FeatureCollection", ... },
    "gemeinschaftsjagd": { "type": "FeatureCollection", ... },
    "hegeringe": null
  }
}
```

### Conditions Endpoint

#### `GET /conditions?lat={lat}&lon={lon}`

Returns weather and twilight data for a location.

**Note:** Wind and weather values are currently mocked (random). Twilight times are real via suncalc.

### Recommendation Endpoint

#### `GET /recommend?lat={lat}&lon={lon}&windDir={dir}&limit={n}`

AI-powered stand recommendations based on current conditions.

**Scoring factors:**
- Wind alignment (35%) -- perpendicular wind to stand is ideal
- Recent sightings (25%) -- from performance_stats
- Freshness (20%) -- days since last use
- Huntability (20%) -- wind speed, weather conditions

---

## Database Schema

### `hunt_stands` Table

```sql
CREATE TABLE hunt_stands (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL,
  name             TEXT NOT NULL,
  stand_type       TEXT DEFAULT 'hochsitz',
  geo_lat          DOUBLE PRECISION NOT NULL,
  geo_lon          DOUBLE PRECISION NOT NULL,
  notes            TEXT,
  wind_history     JSONB DEFAULT '[]',
  performance_stats JSONB DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
```

**Column mapping (API <-> DB):**

| API field | DB column | Type |
|-----------|-----------|------|
| `name` | `name` | TEXT |
| `standType` | `stand_type` | TEXT |
| `geoLat` | `geo_lat` | DOUBLE PRECISION |
| `geoLon` | `geo_lon` | DOUBLE PRECISION |
| `notes` | `notes` | TEXT |
| `windHistory` | `wind_history` | JSONB |
| `performanceStats` | `performance_stats` | JSONB |

---

## Data Flow

### Stand Selection

```
StandListItem click
  -> selectStand(id) in useScoutStore
  -> fetchWindData(id): GET /stands/:id
  -> fetchConditions(lat, lon): GET /conditions?lat=X&lon=Y
  -> ScoutView re-renders with selectedStand
  -> mapCenter = [stand.geoLat, stand.geoLon], zoom = 15
  -> HuntingMap syncs center/zoom via useEffect
  -> Right panel shows WindCompass + ConditionsSnapshot
```

### Revier Search Navigation

```
User types "Heerde Kuppendorf" in RevierSearchBar
  -> useGeoLayerStore.searchFeatures("Heerde Kuppendorf")
  -> Searches all geojson[*].features[*].properties
  -> Finds match: Gemeinschaftsjagd "Heerde Kuppendorf"
  -> Computes polygon centroid
  -> Returns [{ layerId, featureName, center, area, ... }]
  -> User presses Enter
  -> pick(result):
     -> showLayer("gemeinschaftsjagd") -- auto-activates layer
     -> onNavigate([52.xx, 8.xx], 14, "gemeinschaftsjagd")
  -> ScoutView sets searchCenter/searchZoom
  -> HuntingMap centers on revier at zoom 14
```

### Layer Activation

```
Layer toggle click
  -> toggleLayer("eigenjagd") in useGeoLayerStore
  -> visibleLayers.add("eigenjagd")
  -> If !geojson["eigenjagd"]: fetchLayerData("eigenjagd")
     -> GET /api/v1/jagd/geodata/eigenjagd
     -> Backend checks cache (30-min TTL)
     -> Cache miss: GET https://geo.diepholz.de/arcgis/rest/services/Jagdreviere/MapServer/6/query?where=1%3D1&outFields=*&f=geojson&outSR=4326
     -> Cache hit: return cached FeatureCollection
     -> Store in geojson["eigenjagd"]
  -> JagdrevierLayers re-renders
  -> <GeoJson> component added for eigenjagd layer
```

---

## Caching Strategy

### Backend (In-Memory)

```
Map<string, { data: unknown; fetchedAt: number }>
TTL: 30 minutes (1,800,000 ms)
```

- Each ArcGIS layer response cached by layer ID
- Cache check: `Date.now() - cached.fetchedAt < CACHE_TTL_MS`
- Cache miss triggers fresh fetch from Diepholz ArcGIS
- No cache invalidation mechanism (TTL-based only)

### Frontend (Zustand Store)

- GeoJSON stored in `geojson` record by layer ID
- `fetchLayerData` skips if `geojson[layerId]` already exists
- Persists for session lifetime (no TTL on frontend)
- Search operates over all cached data (fast, no network)

---

## ArcGIS Integration

**Service:** Landkreis Diepholz Jagdreviere MapServer
**Base URL:** `https://geo.diepholz.de/arcgis/rest/services/Jagdreviere/MapServer`

### Query Pattern

```
GET {BASE}/{layerIndex}/query?where=1%3D1&outFields=*&f=geojson&outSR=4326
```

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `where` | `1=1` | Select all features |
| `outFields` | `*` | Return all properties |
| `f` | `geojson` | Output as GeoJSON |
| `outSR` | `4326` | WGS84 coordinate system |

### Layer Indices

| Index | Content |
|-------|---------|
| 0 | (unused) |
| 1 | Damwildhegegemeinschaften |
| 2-3 | (unused) |
| 4 | Jagdgenossenschaften |
| 5 | Forstreviere |
| 6 | Eigenjagd |
| 7 | Gemeinschaftsjagd |
| 8 | Hegeringe |
| 9 | Jagdfreie Sonderflachen |

### GeoJSON Property Fields

| Field | Type | Present In | Description |
|-------|------|-----------|-------------|
| `Name` | string | Hegeringe, Damwild, Forstreviere, Jagdfreie | Feature name |
| `Eigenjagd` | string | Eigenjagd | Private hunt name |
| `Gemeinschaftsjagd` | string | Gemeinschaftsjagd | Community hunt name |
| `JG_Name` | string | Jagdgenossenschaften | Cooperative name |
| `Flae_ha` | number | All | Area in hectares |
| `Hegering` | string | Most | Hegering district |
| `Revier_Nr` | string | Some | Revier number |

---

## Overlay Components

### HeatmapLayer

**File:** `src/applications/jagd-agenten/components/HeatmapLayer.tsx`

Canvas-based harvest density visualization using 2D gradient rendering.

**Color gradient:** Transparent -> Blue -> Green -> Yellow -> Orange -> Red

Currently not connected to real harvest data.

### CadastralLayer

**File:** `src/applications/jagd-agenten/components/CadastralLayer.tsx`

Property boundary overlay for Flurstucke (cadastral parcels). Supports owned/leased status with color coding:

- **Owned:** Green fill + border
- **Leased:** Blue fill + border
- **Default:** Gray fill + border

Includes ParcelInfoPanel popup with Flurstuck, Gemarkung, Gemeinde, Flache, Nutzungsart.

Not currently rendered in ScoutView (replaced by JagdrevierLayers).

### DistanceRingsOverlay

**File:** `src/applications/jagd-agenten/components/DistanceRingsOverlay.tsx`

Concentric distance rings from a stand position. Distances: 50m, 100m, 150m, 200m, 250m, 300m.

Not currently integrated.

---

## File Reference

| File | Lines | Purpose |
|------|-------|---------|
| `src/applications/jagd-agenten/components/ScoutView.tsx` | ~680 | Main view layout |
| `src/applications/jagd-agenten/components/HuntingMap.tsx` | ~456 | Interactive pigeon-maps component |
| `src/applications/jagd-agenten/components/JagdrevierLayers.tsx` | ~186 | GeoJSON layer renderer |
| `src/applications/jagd-agenten/components/RevierSearchBar.tsx` | ~194 | Floating revier search |
| `src/applications/jagd-agenten/components/CadastralLayer.tsx` | ~275 | Cadastral parcel overlay |
| `src/applications/jagd-agenten/components/HeatmapLayer.tsx` | ~253 | Canvas heatmap overlay |
| `src/applications/jagd-agenten/components/DistanceRingsOverlay.tsx` | ~121 | Distance ring overlay |
| `src/stores/useScoutStore.ts` | ~184 | Stand + conditions store |
| `src/stores/useGeoLayerStore.ts` | ~268 | Geodata layer store + search |
| `server/src/routes/jagd-scout.ts` | ~660 | Backend REST API |
| `src/applications/jagd-agenten/manifest.json` | ~70 | App registration |
| `src/applications/jagd-agenten/App.tsx` | ~68 | View router |

**Total core Scout feature: ~4,000 LOC**

---

## Known Limitations

1. **Weather data is mocked** -- The `/conditions` endpoint returns random wind/temperature values. Real weather API integration pending.
2. **Auth hardcoded** -- All stand operations use a demo user ID. No authentication middleware yet.
3. **Wind history not populated** -- The `wind_history` JSONB field exists in the DB but is never written to.
4. **No offline tile cache** -- pigeon-maps supports offline tiles, but no service worker is configured.
5. **Heatmap has no data source** -- HeatmapLayer exists but harvest data is not sourced from journal entries.
6. **DistanceRingsOverlay not integrated** -- Component exists but is not rendered in the map.
7. **CadastralLayer replaced** -- Original cadastral overlay replaced by JagdrevierLayers in ScoutView.
8. **No Umlaut normalization in search** -- Searching "Schwafoerden" won't find "Schwaförden". Must use exact characters or prefix like "Schwaf".
9. **ArcGIS Services Directory disabled** -- The Diepholz admin has disabled the REST directory (403), but data queries still work.
10. **Recommendation engine simplified** -- Uses basic scoring formula, not ML-based.
