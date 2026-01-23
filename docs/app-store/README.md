# LiquidOS App Store

> **Version:** January 2026
> **Status:** Complete (Phases 1-5)

The LiquidOS App Store is a manifest-driven, registry-based application lifecycle system with an Apple App Store-inspired UI for browsing, installing, and managing LiquidOS applications.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [App Manifest Schema](#app-manifest-schema)
3. [Application Directory Structure](#application-directory-structure)
4. [App Lifecycle Manager](#app-lifecycle-manager)
5. [Permission System](#permission-system)
6. [App Store UI](#app-store-ui)
7. [Remote App Protocol](#remote-app-protocol)
8. [Bundle Storage](#bundle-storage)
9. [Database Persistence](#database-persistence)
10. [Vite Build Integration](#vite-build-integration)
11. [Testing](#testing)
12. [API Reference](#api-reference)

---

## Architecture Overview

The App Store follows a 3-layer architecture:

```
┌─────────────────────────────────────────────────────────┐
│                  APP STORE UI (Layer 1)                  │
│  src/applications/_system/app-store/                    │
│  Browse, Install, Uninstall, Publish, Search            │
├─────────────────────────────────────────────────────────┤
│              SYSTEM CORE (Layer 2)                       │
│  src/system/app-store/                                  │
│  AppLoader, AppPanel, IntegrationRegistry,              │
│  PermissionManager, appStoreStore (Zustand)             │
├─────────────────────────────────────────────────────────┤
│            SERVER REGISTRY (Layer 3)                     │
│  server/src/registry/                                   │
│  REST API, PostgreSQL persistence, Bundle storage       │
└─────────────────────────────────────────────────────────┘
```

### Key Design Decisions

- **Manifest-driven**: Every app is defined by a declarative `manifest.json`
- **Capability-based security**: Apps declare required permissions; users approve at install time
- **Lazy loading**: Each app gets its own Vite chunk, loaded on demand
- **Graceful fallback**: PostgreSQL persistence falls back to in-memory when DB is unavailable
- **Hybrid loading**: Trusted apps use dynamic `import()`, untrusted apps run in iframe sandbox

---

## App Manifest Schema

Every app lives in `src/applications/<app-id>/` with a `manifest.json`:

```typescript
interface AppManifest {
  // Identity
  id: string;                        // Kebab-case unique ID
  name: string;                      // Display name
  version: string;                   // Semver (e.g., "1.2.0")
  description: string;               // Short description
  longDescription?: string;          // Detailed description for detail view
  author: string;
  license?: string;
  homepage?: string;

  // Categorization
  category: AppCategory;
  keywords: string[];
  icon: string;                      // Lucide icon name OR asset path
  screenshots?: string[];

  // Entry Points
  entry: string;                     // "./App.tsx"
  store?: string;                    // "./store.ts"

  // Window Configuration
  window: WindowConfig;

  // Integration Declarations
  integrations: AppIntegrations;

  // Security
  capabilities: AppCapability[];
  dependencies?: Record<string, string>;

  // Remote App Config (marketplace apps only)
  remote?: RemoteAppConfig;
}
```

### Categories

| Category | Description |
|----------|-------------|
| `productivity` | Task management, timers, notes |
| `communication` | Email, messaging, collaboration |
| `finance` | Trading, charts, portfolio |
| `weather` | Weather forecasts, alerts |
| `travel` | Trip planning, maps |
| `developer` | Git, editors, terminals |
| `utilities` | Calculators, converters |
| `entertainment` | Music, games, media |
| `system` | System apps (always installed) |

### Capabilities (Permissions)

| Capability | Risk | Description |
|------------|------|-------------|
| `storage:local` | Low | Browser localStorage (auto-granted) |
| `storage:indexeddb` | Low | IndexedDB storage (auto-granted) |
| `notification:toast` | Low | In-app toasts (auto-granted) |
| `system:fullscreen` | Low | Fullscreen mode (auto-granted) |
| `notification:push` | Low | Push notifications |
| `network:http` | Medium | HTTP requests to external servers |
| `network:websocket` | Medium | WebSocket connections |
| `ai:llm` | Medium | AI language model access |
| `system:clipboard` | Medium | Clipboard read/write |
| `ai:agent` | High | Autonomous AI agent tasks |
| `a2a:connect` | High | Agent-to-Agent protocol |
| `media:camera` | High | Camera access |
| `media:microphone` | High | Microphone access |
| `media:geolocation` | High | Location access |

### Window Configuration

```typescript
interface WindowConfig {
  mode: 'panel' | 'fullscreen' | 'floating';
  title: string;
  defaultSize?: { width: number; height: number };
  defaultPosition?: { x: number; y: number };
  resizable?: boolean;
  minimizable?: boolean;
}
```

### Integration Declarations

```typescript
interface AppIntegrations {
  dock?: { enabled: boolean; position?: number; badge?: string };
  menuBar?: { hookPath?: string };
  shortcuts?: { hookPath?: string };
  aiContext?: { systemPrompt?: string; knowledge?: string[]; agentId?: string };
  commandPalette?: { commands?: CommandPaletteEntry[] };
  notifications?: { channels?: string[] };
}
```

---

## Application Directory Structure

```
src/applications/
  _system/                   # System apps (always installed, cannot uninstall)
    app-store/               # The App Store itself
      manifest.json
      App.tsx
      store.ts
      components/
        AppStoreHome.tsx
        AppStoreSidebar.tsx
        AppDetailView.tsx
        AppCategoryView.tsx
        AppSearchResults.tsx
        InstalledAppsView.tsx
        AppStoreDialogs.tsx
        AppPublishView.tsx
        CatalogCard.tsx
        AppCard.tsx
        iconResolver.ts

  ibird/                     # Email/Calendar app
  sparkles/                  # AI assistant app
  rush-hour-trading/         # Trading game
  aurora-weather/            # Weather app
  aurora-travel/             # Travel planner
  ...
```

Each app is self-contained with its own manifest, components, store, and hooks.

---

## App Lifecycle Manager

**Location:** `src/system/app-store/`

### State Machine

```
[Not Installed] ──install()──> [Installed/Inactive]
[Installed/Inactive] ──openApp()──> [Active/Running]
[Active/Running] ──closeApp()──> [Installed/Inactive]
[Installed/Inactive] ──uninstall()──> [Not Installed]
```

### Core Store (`appStoreStore.ts`)

Zustand store managing all app lifecycle state:

```typescript
// Key state
installedApps: Record<string, InstalledApp>
activeAppId: string | null
dockApps: string[]
catalog: AppCatalogEntry[]

// Key actions
installApp(manifest, source?)    // Install from manifest
uninstallApp(appId)              // Remove app + cleanup
openApp(appId)                   // Activate app panel
closeApp()                       // Close active panel
addToDock(appId, position?)      // Pin to dock
removeFromDock(appId)            // Unpin from dock
registerLocalApps(manifests[])   // Bulk register on boot
setCatalog(entries[])            // Set remote catalog
```

### App Loader (`AppLoader.tsx`)

Dynamic component loading using `import.meta.glob`:

```typescript
const appModules = import.meta.glob('/src/applications/*/App.tsx');
// Resolved at build time, loaded on demand
```

### App Panel (`AppPanel.tsx`)

Generic panel renderer that replaces hardcoded `{activePanel === 'xxx' && <XxxApp />}` patterns.

### Integration Registry (`IntegrationRegistry.ts`)

Manages menu bar, shortcuts, AI context, and command palette registrations per-app.

---

## Permission System

**Location:** `src/system/app-store/permissions.ts`

### Auto-Granted Capabilities

These require no user prompt:
- `storage:local`
- `storage:indexeddb`
- `notification:toast`
- `system:fullscreen`

### Permission Flow

1. App declares `capabilities` in manifest
2. On install, sensitive capabilities are shown in permission dialog
3. User approves or denies
4. Grants stored in localStorage (`liquid-os-permissions` key)
5. On uninstall, all grants are cleared

### API

```typescript
PermissionManager.hasPermission(appId, capability)     // Check single
PermissionManager.hasAllPermissions(appId, caps[])     // Check all
PermissionManager.getRequiredPermissions(appId, caps[]) // What needs approval
PermissionManager.grant(appId, capability)             // Grant single
PermissionManager.grantAll(appId, caps[])              // Grant batch
PermissionManager.revoke(appId, capability)            // Revoke
PermissionManager.clearAppPermissions(appId)           // Clear all for app
```

---

## App Store UI

**Location:** `src/applications/_system/app-store/`

### Views

| View | Component | Description |
|------|-----------|-------------|
| `home` | `AppStoreHome` | Hero banner, installed apps, marketplace catalog |
| `detail` | `AppDetailView` | Full app details, permissions, integrations |
| `installed` | `InstalledAppsView` | Manage installed apps |
| `category` | `AppCategoryView` | Browse by category |
| `search` | `AppSearchResults` | Search installed + remote |
| `updates` | `InstalledAppsView` | Available updates |
| `publish` | `AppPublishView` | Submit new app to registry |

### Install Flow

1. User clicks "Get" on a catalog app
2. `InstallDialog` shows with permission review
3. Sensitive capabilities displayed with risk indicators (green/yellow/red)
4. User clicks "Install"
5. `installRemoteApp(manifest)` called
6. App added to `installedApps` + dock (if `dock.enabled`)
7. Dialog closes

### Uninstall Flow

1. User clicks "Remove" on detail view
2. `UninstallDialog` shows with warning
3. User confirms
4. App closed if active
5. Removed from `installedApps` and dock
6. Permissions cleared

### Publish Flow

1. User navigates to Publish view
2. Fills out manifest form (identity, description, window config, capabilities)
3. Validates required fields
4. POSTs to `/api/v1/apps` with manifest (+ optional base64 bundle)
5. Success/error feedback shown

---

## Remote App Protocol

### Discovery

The frontend fetches the remote catalog on App Store mount:

```typescript
// src/system/app-store/remoteAppLoader.ts
export async function fetchCatalog(): Promise<AppCatalogEntry[]> {
  const response = await fetch('/api/v1/apps');
  const { apps } = await response.json();
  useAppStoreStore.getState().setCatalog(apps);
  return apps;
}
```

### Loading Strategy

| Trust Level | Method | Integration |
|-------------|--------|-------------|
| Trusted (verified publisher) | Dynamic `import()` | Full system access |
| Untrusted | `<iframe sandbox>` | Limited `postMessage` API |

Controlled by `manifest.remote.sandbox` flag.

### Integrity Verification

Remote bundles include SHA-256 hash verification:
```typescript
export async function installRemoteApp(manifest: AppManifest) {
  // Fetch bundle, verify hash, cache locally
  const bundle = await fetch(`/api/v1/apps/${manifest.id}/bundle`);
  // Integrity check via X-Bundle-Hash header
}
```

---

## Bundle Storage

**Location:** `server/src/registry/bundle-storage.ts`

Filesystem-based storage for compiled app bundles.

### Storage Layout

```
data/app-bundles/
  pomodoro-timer@1.2.0.js         # Compiled bundle
  pomodoro-timer@1.2.0.meta.json  # Metadata (hash, size, timestamps)
  markdown-editor@2.0.1.js
  markdown-editor@2.0.1.meta.json
```

### API

```typescript
storeBundle(appId, version, base64Data)   // Store from base64
storeBundleBuffer(appId, version, buffer) // Store from buffer
getBundle(appId, version, expectedHash?)  // Retrieve + verify integrity
bundleExists(appId, version)              // Check existence
deleteBundle(appId, version)              // Remove bundle + metadata
getBundleMetadata(appId, version)         // Get metadata without content
```

### Security

- Path traversal prevention via ID/version sanitization
- SHA-256 integrity verification on retrieval
- Immutable cache headers on serve (`Cache-Control: public, max-age=31536000, immutable`)

---

## Database Persistence

**Location:** `server/src/registry/app-store-db.ts`

PostgreSQL-backed persistence with automatic fallback to in-memory.

### Schema

```sql
CREATE TABLE app_registry (
  id TEXT PRIMARY KEY,
  manifest JSONB NOT NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_by TEXT NOT NULL DEFAULT 'local',
  downloads INTEGER NOT NULL DEFAULT 0,
  rating REAL NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  bundle_url TEXT,
  bundle_hash TEXT,
  bundle_size INTEGER
);

-- Indexes for efficient queries
CREATE INDEX idx_app_registry_category ON app_registry ((manifest->>'category'));
CREATE INDEX idx_app_registry_author ON app_registry ((manifest->>'author'));
CREATE INDEX idx_app_registry_featured ON app_registry (featured) WHERE featured = TRUE;
CREATE INDEX idx_app_registry_name ON app_registry ((manifest->>'name'));
```

### Fallback Behavior

On server startup:
1. Attempt `migrateAppStoreSchema()` (CREATE TABLE IF NOT EXISTS)
2. If successful, `useDatabase = true` - all queries go to PostgreSQL
3. If DB unavailable, `useDatabase = false` - uses in-memory `Map<string, AppRegistryEntry>`
4. Seed data (6 sample apps) loaded into whichever store is active

### API

```typescript
migrateAppStoreSchema()              // Run DDL
getAllApps(params?)                   // Filtered + paginated list
getApp(id)                           // Single app by ID
upsertApp(entry)                     // Create or update
deleteApp(id)                        // Remove
incrementDownloads(id)               // Bump counter
getFeaturedApps()                    // Featured only
getCategoryCounts()                  // Category stats
getStats()                           // Aggregate stats
```

---

## Vite Build Integration

**Location:** `vite.config.ts` (lines 167-174)

Each app gets its own code-split chunk for lazy loading:

```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks(id) {
        if (id.includes('/src/applications/')) {
          // Handles nested paths like _system/app-store
          const match = id.match(
            /\/src\/applications\/(.+?)\/(?:App\.tsx|components\/|hooks\/|store|modals\/|...)/
          );
          if (match) return `app-${match[1].replace('/', '-')}`;
          const simple = id.match(/\/src\/applications\/([^/]+)\//);
          if (simple) return `app-${simple[1]}`;
        }
      }
    }
  }
}
```

**Result:** Each app produces a separate chunk (e.g., `app-ibird.js`, `app-_system-app-store.js`) that is only loaded when the user opens that app.

---

## Testing

**Location:** `src/system/app-store/__tests__/`

### Test Suites

| Suite | Tests | Coverage |
|-------|-------|----------|
| `appStoreStore.test.ts` | 25 | Install, uninstall, update, dock, panels, bulk registration, catalog |
| `permissions.test.ts` | 24 | Auto-grants, explicit grants, revocation, checks, descriptions |

### Running Tests

```bash
npx vitest run src/system/app-store/__tests__/
```

### Key Test Scenarios

**Lifecycle:**
- Install from manifest adds to `installedApps`
- Install with `dock.enabled` auto-adds to dock
- Uninstall removes from apps + dock
- Uninstall closes active app
- Update preserves install metadata

**Dock:**
- Add/remove from dock
- Position-based insertion
- No duplicate entries
- Reorder operation

**Permissions:**
- Auto-granted capabilities (storage, toast, fullscreen)
- Explicit grant/revoke
- Bulk grant
- Per-app isolation
- Clear on uninstall

---

## API Reference

### REST Endpoints

All endpoints prefixed with `/api/v1/apps`.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | List apps (search, filter, paginate) |
| `GET` | `/:id` | Get single app |
| `GET` | `/search?q=...` | Search apps |
| `GET` | `/featured` | Featured apps |
| `GET` | `/categories` | Category counts |
| `GET` | `/stats` | Registry statistics |
| `GET` | `/:id/bundle` | Download app bundle |
| `POST` | `/` | Publish/update app |
| `DELETE` | `/:id` | Remove app |

### Query Parameters (List)

| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Search query (name, description, keywords) |
| `category` | string | Filter by category |
| `author` | string | Filter by author |
| `featured` | boolean | Only featured apps |
| `limit` | number | Page size (default: 50) |
| `offset` | number | Pagination offset |

### Publish Request Body

```json
{
  "manifest": {
    "id": "my-app",
    "name": "My App",
    "version": "1.0.0",
    "description": "...",
    "author": "...",
    "category": "productivity",
    "keywords": ["..."],
    "icon": "Box",
    "window": { "mode": "panel", "title": "My App" },
    "integrations": { "dock": { "enabled": true } },
    "capabilities": ["storage:local"]
  },
  "bundleData": "<base64-encoded JS bundle>"
}
```

### Bundle Download Response

```
Content-Type: application/javascript
Content-Length: 45000
X-Bundle-Hash: a1b2c3d4...
Cache-Control: public, max-age=31536000, immutable
```

---

## File Reference

### System Core (`src/system/app-store/`)

| File | Purpose |
|------|---------|
| `types.ts` | AppManifest, AppCapability, AppCategory, InstalledApp types |
| `appStoreStore.ts` | Central Zustand store for app lifecycle |
| `AppLoader.tsx` | Dynamic component loader via `import.meta.glob` |
| `AppPanel.tsx` | Generic panel renderer |
| `IntegrationRegistry.ts` | Menu bar, shortcuts, AI context management |
| `permissions.ts` | Capability-based permission manager |
| `appDiscovery.ts` | Build-time manifest scanner |
| `remoteAppLoader.ts` | Remote catalog fetcher + bundle installer |
| `SandboxedApp.tsx` | Iframe sandbox for untrusted apps |
| `iconResolver.ts` | Lucide icon name to component resolver |
| `index.ts` | Barrel exports |

### App Store UI (`src/applications/_system/app-store/`)

| File | Purpose |
|------|---------|
| `App.tsx` | Root component with view routing |
| `store.ts` | UI-only state (current view, selected app, dialogs) |
| `components/AppStoreHome.tsx` | Home view with installed + marketplace |
| `components/AppStoreSidebar.tsx` | Category navigation |
| `components/AppDetailView.tsx` | App details + install/remove |
| `components/AppStoreDialogs.tsx` | Install/uninstall confirmation dialogs |
| `components/AppPublishView.tsx` | App submission form |
| `components/AppSearchResults.tsx` | Search across installed + remote |
| `components/InstalledAppsView.tsx` | Manage installed apps |
| `components/AppCategoryView.tsx` | Browse by category |
| `components/CatalogCard.tsx` | Remote app card component |
| `components/AppCard.tsx` | Installed app card component |

### Server (`server/src/registry/`)

| File | Purpose |
|------|---------|
| `app-types.ts` | Server-side type definitions |
| `app-routes.ts` | Elysia REST API routes |
| `app-store-db.ts` | PostgreSQL CRUD layer |
| `bundle-storage.ts` | Filesystem bundle storage |

### Tests (`src/system/app-store/__tests__/`)

| File | Tests |
|------|-------|
| `appStoreStore.test.ts` | 25 tests: lifecycle, dock, panels, bulk ops |
| `permissions.test.ts` | 24 tests: grants, revocation, risk levels |
