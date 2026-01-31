# Comprehensive Implementation Plan: Unwired Features

> **Generated:** 2026-01-31
> **Updated:** 2026-02-01
> **Branch:** `heuristic-ride`
> **Scope:** 19 findings from codebase audit (excluding A2A Executors & Weather API)

---

## Current Status

**All 19 features implemented and wired.** All 4 phases complete.

Additionally, a **full glass design system migration** was performed across ~50 component files, replacing three legacy anti-patterns (`bg-white/5`, `dark:bg-gray-*`, `var(--bg-secondary, #fallback)`) with the unified glass token system. Zero remaining old patterns. See [ADR-003](reference/adr/ADR-003-glass-design-system.md).

**Browser-verified views (2026-02-01):**
| View | Status | Key Components |
|------|--------|----------------|
| Cockpit | OK | DailyCockpit, Jagdbarkeit, Buechsenlicht, Witterung |
| Ausruestung | OK | EquipmentInventory, category filters |
| Journal | OK | JournalView, filter tabs (Sichtungen/Erlegungen/Notizen) |
| Rudel | OK | PackDashboard, members, events, emergency contacts |
| Scout | OK | ScoutView, OSM map, 7 GeoJSON layers, RevierSearchBar |
| Timeline | OK | HuntTimeline, hunt type buttons, events |
| Verwaltung | OK | RevierAdminPanel, Agent Observability, revier cards |

---

## Executive Summary

This plan wires **19 disconnected features** across 4 implementation phases. Each feature has existing code (DB schema, route files, or UI components) that needs connecting. The work is organized by dependency order: backend routes first, then stores, then UI wiring.

**Estimated scope:** ~40 files modified/created, ~3,500 LOC

---

## Phase 1: Backend Route Registration (Quick Wins)

> **Goal:** Register 3 existing route files that are implemented but not imported in `server/src/index.ts`

### 1.1 Community Sightings — Register Route

| Item | Detail |
|------|--------|
| **Finding** | #4 — `jagd-sightings.ts` exists with full CRUD + privacy (grid blurring, time delay, k-anonymity) but NOT imported in `index.ts` |
| **DB Tables** | `jagd_sightings`, `jagd_sighting_aggregates`, `jagd_official_sources`, `jagd_official_sightings`, `jagd_analytics_keys`, `jagd_privacy_preferences` (all in `025_waidmann_feed.sql`) |
| **Route File** | `server/src/routes/jagd-sightings.ts` — exports `createSightingRoutes()` |
| **Privacy Services** | `grid-blurrer.js`, `time-delayer.js`, `k-anonymity.js`, `pseudonymizer.js` (all exist in `server/src/services/privacy/`) |

**Changes:**
1. **`server/src/index.ts`** — Add import + `.use()`:
   ```typescript
   import { createSightingRoutes } from './routes/jagd-sightings.js';
   // In route chain:
   .use(createSightingRoutes())
   ```

**Verification:** `curl localhost:3000/api/v1/jagd/sightings` returns 200

---

### 1.2 Stories & Lessons Learned — Register Route

| Item | Detail |
|------|--------|
| **Finding** | #5 — `jagd-stories.ts` exists with full CRUD + lesson templates but NOT imported |
| **DB Tables** | `jagd_stories` (in `025_waidmann_feed.sql`) |
| **Route File** | `server/src/routes/jagd-stories.ts` — exports `createStoryRoutes()` |

**Changes:**
1. **`server/src/index.ts`** — Add import + `.use()`:
   ```typescript
   import { createStoryRoutes } from './routes/jagd-stories.js';
   .use(createStoryRoutes())
   ```

**Verification:** `curl localhost:3000/api/v1/jagd/stories` returns 200

---

### 1.3 Public Invites — Register Route

| Item | Detail |
|------|--------|
| **Finding** | #6 — `jagd-invites.ts` exists with invite CRUD + applications + safety rules but NOT imported |
| **DB Tables** | `jagd_invites`, `jagd_invite_applications` (in `025_waidmann_feed.sql`) |
| **Route File** | `server/src/routes/jagd-invites.ts` — exports `createInviteRoutes()` |

**Changes:**
1. **`server/src/index.ts`** — Add import + `.use()`:
   ```typescript
   import { createInviteRoutes } from './routes/jagd-invites.js';
   .use(createInviteRoutes())
   ```

**Verification:** `curl localhost:3000/api/v1/jagd/invites` returns 200

---

## Phase 2: New Backend Routes (Missing API Layer)

> **Goal:** Create API routes for 3 domain systems that have DB tables + UI components but no backend routes

### 2.1 Hege & Pflege API

| Item | Detail |
|------|--------|
| **Finding** | #1 (CRITICAL) — DB schema ✅, UI component ✅ (`HegeDashboard.tsx`), NO API route |
| **DB Tables** | `hege_projects`, `hege_activities`, `mowing_notices` (in `029_hege_wildunfall_nachsuche.sql`) |
| **DB Views** | `hege_weekly_summary` |

**New File: `server/src/routes/jagd-hege.ts`**

Endpoints:
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/jagd/hege/projects` | List projects (filter by user, revier, status, type) |
| POST | `/api/v1/jagd/hege/projects` | Create project |
| PATCH | `/api/v1/jagd/hege/projects/:id` | Update project (status, tasks, notes) |
| DELETE | `/api/v1/jagd/hege/projects/:id` | Delete project |
| GET | `/api/v1/jagd/hege/activities` | List activities (filter by project, type, date range) |
| POST | `/api/v1/jagd/hege/activities` | Log activity |
| GET | `/api/v1/jagd/hege/summary` | Weekly summary (from `hege_weekly_summary` view) |
| GET | `/api/v1/jagd/hege/mowing` | List mowing notices |
| POST | `/api/v1/jagd/hege/mowing` | Create mowing notice |
| PATCH | `/api/v1/jagd/hege/mowing/:id` | Update notice status |

**Register in `server/src/index.ts`:**
```typescript
import { createJagdHegeRoutes } from './routes/jagd-hege.js';
.use(createJagdHegeRoutes())
```

---

### 2.2 Wildunfall API

| Item | Detail |
|------|--------|
| **Finding** | #2 (CRITICAL) — DB schema ✅, UI component ✅ (`WildunfallMode.tsx`), NO API route |
| **DB Tables** | `wildunfall_incidents`, `wildunfall_oncall_roster`, `wildunfall_dispatch_log` |
| **DB Views** | `wildunfall_response_metrics` |

**New File: `server/src/routes/jagd-wildunfall.ts`**

Endpoints:
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/jagd/wildunfall/incidents` | List incidents (filter by revier, status, date) |
| POST | `/api/v1/jagd/wildunfall/incidents` | Report new incident |
| PATCH | `/api/v1/jagd/wildunfall/incidents/:id` | Update status (accept, arrive, resolve, close) |
| GET | `/api/v1/jagd/wildunfall/incidents/:id` | Get incident detail |
| GET | `/api/v1/jagd/wildunfall/oncall` | Get on-call roster for revier |
| POST | `/api/v1/jagd/wildunfall/oncall` | Add responder to roster |
| PATCH | `/api/v1/jagd/wildunfall/oncall/:id` | Update responder priority/status |
| DELETE | `/api/v1/jagd/wildunfall/oncall/:id` | Remove from roster |
| POST | `/api/v1/jagd/wildunfall/dispatch/:incidentId` | Dispatch notification to on-call |
| GET | `/api/v1/jagd/wildunfall/metrics` | Response metrics (from view) |

**Register in `server/src/index.ts`.**

---

### 2.3 Nachsuche API

| Item | Detail |
|------|--------|
| **Finding** | #3 (CRITICAL) — DB schema ✅, UI component ✅ (`NachsucheFlow.tsx`), NO API route |
| **DB Tables** | `nachsuche_cases`, `nachsuche_team`, `nachsuche_tracks` |
| **DB Views** | `nachsuche_outcomes` |

**New File: `server/src/routes/jagd-nachsuche.ts`**

Endpoints:
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/jagd/nachsuche/cases` | List cases (filter by session, shooter, status) |
| POST | `/api/v1/jagd/nachsuche/cases` | Create case (from shot event) |
| PATCH | `/api/v1/jagd/nachsuche/cases/:id` | Update status/outcome/lessons |
| GET | `/api/v1/jagd/nachsuche/cases/:id` | Get case detail with team |
| POST | `/api/v1/jagd/nachsuche/cases/:id/team` | Assign team member |
| PATCH | `/api/v1/jagd/nachsuche/team/:id` | Update team member status |
| POST | `/api/v1/jagd/nachsuche/cases/:id/tracks` | Add track segment |
| GET | `/api/v1/jagd/nachsuche/cases/:id/tracks` | Get track segments |
| GET | `/api/v1/jagd/nachsuche/outcomes` | Outcome analytics (from view) |

**Register in `server/src/index.ts`.**

---

### 2.4 Huntcraft Challenges API

| Item | Detail |
|------|--------|
| **Finding** | #13 (MEDIUM) — DB schema ✅ (with seed data), UI component ✅ (`HuntcraftChallenges.tsx`), NO API route |
| **DB Tables** | `challenge_templates`, `user_challenges`, `user_huntcraft_stats`, `achievements`, `user_achievements` (in `026_challenges.sql`) |
| **Seed Data** | 6 challenge templates + 10 achievement definitions already seeded |

**New File: `server/src/routes/jagd-challenges.ts`**

Endpoints:
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/jagd/challenges/templates` | List active challenge templates |
| GET | `/api/v1/jagd/challenges/active` | Get user's current period challenges |
| POST | `/api/v1/jagd/challenges/progress` | Increment challenge progress |
| GET | `/api/v1/jagd/challenges/stats` | Get user XP, level, streak |
| GET | `/api/v1/jagd/challenges/achievements` | Get user achievements |
| POST | `/api/v1/jagd/challenges/check-achievements` | Check & award new achievements |

**Register in `server/src/index.ts`.**

---

## Phase 3: Zustand Stores (Frontend State Layer)

> **Goal:** Create Zustand stores to connect UI components with the backend APIs

### 3.1 `useHegeStore.ts`

| Item | Detail |
|------|--------|
| **Finding** | #1 — HegeDashboard uses mock data, needs real store |
| **Connects** | `HegeDashboard.tsx` ↔ `/api/v1/jagd/hege/*` |

**New File: `src/stores/useHegeStore.ts`**

```typescript
interface HegeState {
  projects: HegeProject[];
  activities: HegeActivity[];
  mowingNotices: MowingNotice[];
  weeklySummary: WeeklySummary[];
  loading: boolean;
  error: string | null;
}

interface HegeActions {
  fetchProjects: (filters?: { status?: string; type?: string }) => Promise<void>;
  createProject: (project: Omit<HegeProject, 'id'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<HegeProject>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  fetchActivities: (projectId?: string) => Promise<void>;
  logActivity: (activity: Omit<HegeActivity, 'id'>) => Promise<void>;
  fetchWeeklySummary: () => Promise<void>;
  fetchMowingNotices: () => Promise<void>;
  createMowingNotice: (notice: Omit<MowingNotice, 'id'>) => Promise<void>;
  updateMowingStatus: (id: string, status: string) => Promise<void>;
}
```

---

### 3.2 `useWildunfallStore.ts`

| Item | Detail |
|------|--------|
| **Finding** | #2 — WildunfallMode uses mock data, needs real store |
| **Connects** | `WildunfallMode.tsx` ↔ `/api/v1/jagd/wildunfall/*` |

**New File: `src/stores/useWildunfallStore.ts`**

```typescript
interface WildunfallState {
  incidents: WildunfallIncident[];
  activeIncident: WildunfallIncident | null;
  oncallRoster: OncallResponder[];
  dispatchLog: DispatchEntry[];
  metrics: ResponseMetrics | null;
  loading: boolean;
  error: string | null;
}

interface WildunfallActions {
  fetchIncidents: (filters?: { status?: string; revierId?: string }) => Promise<void>;
  reportIncident: (incident: NewIncident) => Promise<void>;
  updateIncidentStatus: (id: string, status: string, data?: Record<string, unknown>) => Promise<void>;
  fetchOncallRoster: (revierId: string) => Promise<void>;
  addToRoster: (responder: NewResponder) => Promise<void>;
  removeFromRoster: (id: string) => Promise<void>;
  dispatchAlert: (incidentId: string) => Promise<void>;
  fetchMetrics: () => Promise<void>;
}
```

---

### 3.3 `useNachsucheStore.ts`

| Item | Detail |
|------|--------|
| **Finding** | #3 — NachsucheFlow uses mock data, needs real store |
| **Connects** | `NachsucheFlow.tsx` ↔ `/api/v1/jagd/nachsuche/*` |

**New File: `src/stores/useNachsucheStore.ts`**

```typescript
interface NachsucheState {
  cases: NachsucheCase[];
  activeCase: NachsucheCase | null;
  team: TeamMember[];
  tracks: TrackSegment[];
  outcomes: OutcomeStats | null;
  loading: boolean;
  error: string | null;
}

interface NachsucheActions {
  fetchCases: (filters?: { status?: string; sessionId?: string }) => Promise<void>;
  createCase: (caseData: NewCase) => Promise<void>;
  updateCaseStatus: (id: string, status: string, data?: Record<string, unknown>) => Promise<void>;
  assignTeamMember: (caseId: string, member: NewTeamMember) => Promise<void>;
  updateTeamStatus: (memberId: string, status: string) => Promise<void>;
  addTrackSegment: (caseId: string, track: NewTrack) => Promise<void>;
  fetchOutcomes: () => Promise<void>;
}
```

---

### 3.4 `useSightingStore.ts`

| Item | Detail |
|------|--------|
| **Finding** | #4 — SightingRadar components exist, no frontend state |
| **Connects** | `SightingRadar/` components ↔ `/api/v1/jagd/sightings/*` |

**New File: `src/stores/useSightingStore.ts`**

```typescript
interface SightingState {
  sightings: Sighting[];
  aggregates: SightingAggregate[];
  officialSightings: OfficialSighting[];
  loading: boolean;
  error: string | null;
}

interface SightingActions {
  fetchSightings: (filters?: { species?: string; gridCell?: string }) => Promise<void>;
  createSighting: (sighting: NewSighting) => Promise<void>;
  fetchAggregates: (gridCell?: string) => Promise<void>;
  fetchOfficialSightings: () => Promise<void>;
}
```

---

### 3.5 `useStoryStore.ts`

| Item | Detail |
|------|--------|
| **Finding** | #5 — Stories/ components exist, no frontend state |
| **Connects** | `Stories/` components ↔ `/api/v1/jagd/stories/*` |

**New File: `src/stores/useStoryStore.ts`**

```typescript
interface StoryState {
  stories: Story[];
  myStories: Story[];
  loading: boolean;
  error: string | null;
}

interface StoryActions {
  fetchStories: (filters?: { species?: string; published?: boolean }) => Promise<void>;
  fetchMyStories: () => Promise<void>;
  createStory: (story: NewStory) => Promise<void>;
  updateStory: (id: string, updates: Partial<Story>) => Promise<void>;
  publishStory: (id: string) => Promise<void>;
  deleteStory: (id: string) => Promise<void>;
}
```

---

### 3.6 `useInviteStore.ts`

| Item | Detail |
|------|--------|
| **Finding** | #6 — Invites/ components exist, no frontend state |
| **Connects** | `Invites/` components ↔ `/api/v1/jagd/invites/*` |

**New File: `src/stores/useInviteStore.ts`**

```typescript
interface InviteState {
  invites: Invite[];
  myInvites: Invite[];
  applications: Application[];
  loading: boolean;
  error: string | null;
}

interface InviteActions {
  fetchInvites: (filters?: { type?: string; bundesland?: string }) => Promise<void>;
  fetchMyInvites: () => Promise<void>;
  createInvite: (invite: NewInvite) => Promise<void>;
  updateInvite: (id: string, updates: Partial<Invite>) => Promise<void>;
  closeInvite: (id: string) => Promise<void>;
  applyToInvite: (inviteId: string, application: NewApplication) => Promise<void>;
  respondToApplication: (appId: string, status: 'accepted' | 'rejected', message?: string) => Promise<void>;
}
```

---

### 3.7 `useTrailCamStore.ts`

| Item | Detail |
|------|--------|
| **Finding** | #10 — Route exists + registered, component exists, NO store |
| **Connects** | `TrailCameraFeed.tsx` ↔ `/api/v1/jagd/trailcam/*` (already registered) |

**New File: `src/stores/useTrailCamStore.ts`**

```typescript
interface TrailCamState {
  cameras: Camera[];
  photos: TrailCamPhoto[];
  selectedCamera: string | null;
  loading: boolean;
  error: string | null;
}

interface TrailCamActions {
  fetchCameras: () => Promise<void>;
  fetchPhotos: (cameraId?: string, dateRange?: DateRange) => Promise<void>;
  addCamera: (camera: NewCamera) => Promise<void>;
  deleteCamera: (id: string) => Promise<void>;
  selectCamera: (id: string | null) => void;
}
```

---

### 3.8 `useVenisonStore.ts`

| Item | Detail |
|------|--------|
| **Finding** | #11 — Route exists + registered, component exists, NO store |
| **Connects** | `VenisonQRCode.tsx` ↔ `/api/v1/jagd/venison/*` (already registered) |

**New File: `src/stores/useVenisonStore.ts`**

```typescript
interface VenisonState {
  entries: VenisonEntry[];
  selectedEntry: VenisonEntry | null;
  coolingChain: CoolingStep[];
  loading: boolean;
  error: string | null;
}

interface VenisonActions {
  fetchEntries: () => Promise<void>;
  createEntry: (entry: NewVenisonEntry) => Promise<void>;
  updateEntry: (id: string, updates: Partial<VenisonEntry>) => Promise<void>;
  addCoolingStep: (entryId: string, step: CoolingStep) => Promise<void>;
  generateQR: (entryId: string) => Promise<string>;
  selectEntry: (id: string | null) => void;
}
```

---

### 3.9 `useStreckenlisteStore.ts`

| Item | Detail |
|------|--------|
| **Finding** | #12 — Route registered, component exists inside ExportPackGenerator, NO dedicated store |
| **Connects** | `StreckenlisteGenerator.tsx` ↔ `/api/v1/jagd/streckenliste/*` (already registered) |

**New File: `src/stores/useStreckenlisteStore.ts`**

```typescript
interface StreckenlisteState {
  harvests: HarvestEntry[];
  selectedBundesland: string | null;
  jagdjahr: string;
  loading: boolean;
  error: string | null;
}

interface StreckenlisteActions {
  fetchHarvests: (jagdjahr?: string) => Promise<void>;
  addHarvest: (harvest: NewHarvest) => Promise<void>;
  updateHarvest: (id: string, updates: Partial<HarvestEntry>) => Promise<void>;
  deleteHarvest: (id: string) => Promise<void>;
  generatePDF: (bundesland: string, jagdjahr: string) => Promise<string>;
  setBundesland: (bl: string) => void;
}
```

---

### 3.10 `useHuntcraftStore.ts`

| Item | Detail |
|------|--------|
| **Finding** | #13 — DB tables + seed data exist, component exists, NO API, NO store |
| **Connects** | `HuntcraftChallenges.tsx` ↔ `/api/v1/jagd/challenges/*` (to be created in Phase 2) |

**New File: `src/stores/useHuntcraftStore.ts`**

```typescript
interface HuntcraftState {
  templates: ChallengeTemplate[];
  activeChallenges: UserChallenge[];
  stats: HuntcraftStats | null;
  achievements: Achievement[];
  earnedAchievements: UserAchievement[];
  loading: boolean;
  error: string | null;
}

interface HuntcraftActions {
  fetchTemplates: () => Promise<void>;
  fetchActiveChallenges: () => Promise<void>;
  incrementProgress: (templateId: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchAchievements: () => Promise<void>;
  checkNewAchievements: () => Promise<void>;
}
```

---

## Phase 4: UI Wiring (Component Integration)

> **Goal:** Import unwired components into views, connect to stores

### 4.1 Hege & Pflege — Wire to View

| Item | Detail |
|------|--------|
| **Finding** | #1 — `HegeDashboard` exported from index.ts but never rendered in App.tsx |
| **Component** | `src/applications/jagd-agenten/components/HegeDashboard.tsx` |

**Changes:**
1. **`App.tsx`** — Add view type `'hege'` to `JagdView` union
2. **`App.tsx`** — Add import: `import { HegeDashboard } from './components/HegeDashboard'`
3. **`App.tsx`** — Add nav button: `{ id: 'hege', label: 'Hege & Pflege' }`
4. **`App.tsx`** — Add render: `{view === 'hege' && <HegeDashboard />}`
5. **`HegeDashboard.tsx`** — Replace mock data with `useHegeStore()` calls

---

### 4.2 Wildunfall — Wire to View

| Item | Detail |
|------|--------|
| **Finding** | #2 — `WildunfallMode` exported from index.ts but never rendered |
| **Component** | `src/applications/jagd-agenten/components/WildunfallMode.tsx` |

**Changes:**
1. **`App.tsx`** — Add view type `'wildunfall'` + nav button `'Wildunfall'`
2. **`App.tsx`** — Add import + render
3. **`WildunfallMode.tsx`** — Replace mock data with `useWildunfallStore()` calls
4. **Consider:** Also accessible as emergency quick-action from Cockpit view

---

### 4.3 Nachsuche — Wire to View

| Item | Detail |
|------|--------|
| **Finding** | #3 — `NachsucheFlow` exported from index.ts but never rendered |
| **Component** | `src/applications/jagd-agenten/components/NachsucheFlow.tsx` |

**Changes:**
1. **`App.tsx`** — Add view type `'nachsuche'` + nav button `'Nachsuche'`
2. **`App.tsx`** — Add import + render
3. **`NachsucheFlow.tsx`** — Replace mock data with `useNachsucheStore()` calls
4. **Consider:** Link from HuntTimeline → start Nachsuche from shot event

---

### 4.4 Community Sightings — Wire SightingRadar

| Item | Detail |
|------|--------|
| **Finding** | #4 — Full `SightingRadar/` subdirectory (8 components) never imported |
| **Components** | `SightingRadar/SightingRadar.tsx` (main), `SightingForm.tsx`, `SightingCard.tsx`, `ConfidenceSlider.tsx`, `SpeciesSelector.tsx`, `VerificationBadge.tsx`, `AggregateInsightCard.tsx` |

**Changes:**
1. **`App.tsx`** — Add view type `'sightings'` + nav button `'Sichtungen'`
2. **`App.tsx`** — Import `SightingRadar` from `./components/SightingRadar`
3. **`App.tsx`** — Render: `{view === 'sightings' && <SightingRadar />}`
4. **`SightingRadar.tsx`** — Connect to `useSightingStore()`
5. **Optional:** Also embed in Scout map as an overlay toggle

---

### 4.5 Stories — Wire Story Components

| Item | Detail |
|------|--------|
| **Finding** | #5 — Full `Stories/` subdirectory (5 components) never imported |
| **Components** | `StoryEditor.tsx`, `StoryCard.tsx`, `LessonsLearnedForm.tsx`, `JournalExportButton.tsx` |

**Changes:**
1. Wire into **WaidmannFeed** view as a tab/section (stories are part of the feed)
2. **`WaidmannFeed.tsx`** — Import story components, add "Meine Geschichten" tab
3. **`StoryEditor.tsx`** — Connect to `useStoryStore()`
4. **`StoryCard.tsx`** — Connect to `useStoryStore()`

---

### 4.6 Public Invites — Wire Invite Components

| Item | Detail |
|------|--------|
| **Finding** | #6 — Full `Invites/` subdirectory (4 components) never imported |
| **Components** | `InviteEditor.tsx`, `InviteCard.tsx`, `ApplicationForm.tsx`, `RulesAcknowledgement.tsx` |

**Changes:**
1. Wire into **WaidmannFeed** view as a tab/section (invites are part of the feed)
2. **`WaidmannFeed.tsx`** — Import invite components, add "Einladungen" tab
3. **`InviteEditor.tsx`** — Connect to `useInviteStore()`
4. **`InviteCard.tsx`** — Connect to `useInviteStore()`

---

### 4.7 Drückjagd Pack Generator — Wire Component

| Item | Detail |
|------|--------|
| **Finding** | #7 — API registered, `DrueckjagdPackGenerator.tsx` never imported |
| **Component** | `src/applications/jagd-agenten/components/DrueckjagdPackGenerator.tsx` |

**Changes:**
1. Wire into **ExportPackGenerator** as a tab (alongside StreckenlisteGenerator)
2. **`ExportPackGenerator.tsx`** — Import `DrueckjagdPackGenerator`, add "Drückjagd-Paket" tab
3. **Alternative:** Create separate view `'drueckjagd'` if standalone workflow is preferred

---

### 4.8 Revier Admin — Complete Member Management

| Item | Detail |
|------|--------|
| **Finding** | #8 — API registered, partial store (`useAdminStore`), `RevierAdminPanel` exists but member CRUD not fully wired |
| **Components** | `admin/RevierAdminPanel.tsx`, `admin/GlobalAdminDashboard.tsx` |

**Changes:**
1. **`useAdminStore.ts`** — Ensure all member CRUD actions are implemented:
   - `updateMemberRole(memberId, newRole)`
   - `removeMember(memberId)`
   - `sendInvitation(revierId, email, role)`
   - `cancelInvitation(invitationId)`
2. **`RevierAdminPanel.tsx`** — Wire action menu buttons (currently UI-only) to store actions
3. **`GlobalAdminDashboard.tsx`** — Wire "Assign Pächter" and "Deactivate" to actual API calls

---

### 4.9 BoundaryImport — Wire to ScoutView

| Item | Detail |
|------|--------|
| **Finding** | #9 — `BoundaryImport.tsx` exists but never imported |
| **Component** | `src/applications/jagd-agenten/components/BoundaryImport.tsx` (GPX/KML/GeoJSON importer) |

**Changes:**
1. **`ScoutView.tsx`** — Add "Import Revier Boundary" button in the sidebar
2. **`ScoutView.tsx`** — Import `BoundaryImport`, render as modal/panel
3. **Backend consideration:** May need a new endpoint to store imported boundaries, or store via `jagd-revier-admin` GeoJSON field
4. **`useGeoLayerStore`** — Add ability to display user-imported boundaries as a custom layer

---

### 4.10 Trail Camera Feed — Wire to View

| Item | Detail |
|------|--------|
| **Finding** | #10 — Route registered, component exists, NO store |
| **Component** | `src/applications/jagd-agenten/components/TrailCameraFeed.tsx` |

**Changes:**
1. **`App.tsx`** — Add view type `'trailcam'` + nav button `'Wildkameras'`
2. **`App.tsx`** — Import + render `TrailCameraFeed`
3. **`TrailCameraFeed.tsx`** — Replace mock data with `useTrailCamStore()` calls

---

### 4.11 Venison QR Code — Wire to View

| Item | Detail |
|------|--------|
| **Finding** | #11 — Route registered, component exists, NO store |
| **Component** | `src/applications/jagd-agenten/components/VenisonQRCode.tsx` |

**Changes:**
1. Wire into **ExportPackGenerator** as a tab: "Wildbret QR"
2. **`ExportPackGenerator.tsx`** — Import `VenisonQRCode`, add tab
3. **`VenisonQRCode.tsx`** — Connect to `useVenisonStore()`
4. **Alternative:** Also accessible from Hunt Timeline after a harvest event

---

### 4.12 Streckenliste — Verify Store Wiring

| Item | Detail |
|------|--------|
| **Finding** | #12 — Route registered, component exists inside ExportPackGenerator, NO dedicated store |
| **Component** | `StreckenlisteGenerator.tsx` (already rendered in ExportPackGenerator) |

**Changes:**
1. **`StreckenlisteGenerator.tsx`** — Replace mock/prop data with `useStreckenlisteStore()` calls
2. Ensure `onGenerate` callback triggers actual PDF generation via API

---

### 4.13 Huntcraft Challenges — Wire to Explore View

| Item | Detail |
|------|--------|
| **Finding** | #13 — Component exists in `Explore/HuntcraftChallenges.tsx`, rendered inside `WeeklyExplore` |
| **Component** | `src/applications/jagd-agenten/components/Explore/HuntcraftChallenges.tsx` |

**Changes:**
1. **`HuntcraftChallenges.tsx`** — Replace mock data with `useHuntcraftStore()` calls
2. Verify it's properly rendered in `WeeklyExplore.tsx` (it should be via barrel export)
3. Wire progress buttons to actual `incrementProgress()` API calls

---

### 4.14 Guest Permit QR Code — Wire Component

| Item | Detail |
|------|--------|
| **Finding** | #14 — `GuestPermitQRCode.tsx` never imported |
| **Component** | `src/applications/jagd-agenten/components/GuestPermitQRCode.tsx` |

**Changes:**
1. Wire into **DocumentVault** (`bureaucracy` view) as a section/action
2. **`DocumentVault.tsx`** — Import `GuestPermitQRCode`, add "Begehungsschein erstellen" action
3. **Backend consideration:** May need `/api/v1/jagd/permits` endpoint for verification
4. **Alternative:** Also accessible from RevierAdmin for managing guest permits

---

### 4.15 Expiration Alerts — Wire Component

| Item | Detail |
|------|--------|
| **Finding** | #15 — `ExpirationAlerts.tsx` never imported |
| **Component** | `src/applications/jagd-agenten/components/ExpirationAlerts.tsx` |

**Changes:**
1. Wire into **DailyCockpit** as a top-level alert banner
2. **`DailyCockpit.tsx`** — Import `ExpirationAlerts`, render at top
3. **`ExpirationAlerts.tsx`** — Calls `/api/v1/jagd/vault/expirations` (verify endpoint exists in bureaucracy routes)
4. Shows warnings for expiring Jagdschein, insurance, permits

---

### 4.16 Quiet Zone Editor — Wire to ScoutView

| Item | Detail |
|------|--------|
| **Finding** | #16 — `QuietZoneEditor.tsx` never imported |
| **Component** | `src/applications/jagd-agenten/components/QuietZoneEditor.tsx` |

**Changes:**
1. **`ScoutView.tsx`** — Add "Ruhezone einrichten" button in sidebar
2. **`ScoutView.tsx`** — Import `QuietZoneEditor`, render as modal/panel overlay
3. **Backend:** Store quiet zones via `jagd-scout` routes (new endpoint) or as stand metadata
4. **`HuntingMap`** — Render quiet zone polygons as overlay

---

### 4.17 NoGo Zone Overlay — Wire to HuntingMap

| Item | Detail |
|------|--------|
| **Finding** | #17 — `NoGoZoneOverlay.tsx` never imported |
| **Component** | `src/applications/jagd-agenten/components/NoGoZoneOverlay.tsx` |

**Changes:**
1. **`ScoutView.tsx`** — Import `NoGoZoneOverlay`
2. **`ScoutView.tsx`** — Render inside `<HuntingMap>` as child (gets pigeon-maps `mapState` props)
3. Add toggle in sidebar layer panel: "NoGo Zonen"
4. **Backend:** May share storage with QuietZoneEditor (zone definitions with type: 'quiet' | 'nogo')

---

### 4.18 Distance Rings Overlay — Wire to HuntingMap

| Item | Detail |
|------|--------|
| **Finding** | #18 — `DistanceRingsOverlay.tsx` never imported |
| **Component** | `src/applications/jagd-agenten/components/DistanceRingsOverlay.tsx` |

**Changes:**
1. **`ScoutView.tsx`** — Import `DistanceRingsOverlay`
2. **`ScoutView.tsx`** — Render inside `<HuntingMap>` as child (needs `mapState`, `latLngToPixel`)
3. Show when a stand is selected: rings at 50m, 100m, 200m, 300m from stand position
4. **Props:** `center={selectedStand.geoLat, selectedStand.geoLon}` — pure visualization, no backend needed

---

### 4.19 Agent Observability Dashboard — New Admin View

| Item | Detail |
|------|--------|
| **Finding** | #19 — DB tables + views exist, NO admin dashboard |
| **DB Tables** | `tool_call_log`, `agent_traces` (in `028_agent_observability.sql`) |
| **DB Views** | `guardrail_stats`, `tool_performance`, `handoff_analysis` |

**Changes:**

**New File: `server/src/routes/jagd-observability.ts`**

Endpoints:
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/admin/observability/tool-performance` | Tool call stats (from `tool_performance` view) |
| GET | `/api/v1/admin/observability/guardrails` | Guardrail stats (from `guardrail_stats` view) |
| GET | `/api/v1/admin/observability/traces` | Agent traces (paginated, filterable) |
| GET | `/api/v1/admin/observability/traces/:id` | Single trace detail |
| GET | `/api/v1/admin/observability/handoffs` | Handoff analysis (from `handoff_analysis` view) |

**New File: `src/applications/jagd-agenten/components/admin/ObservabilityDashboard.tsx`**

Panels:
- **Tool Performance** — Table: tool_name, calls, avg_ms, p95_ms, success_rate
- **Guardrail Stats** — Chart: guardrail invocations vs blocks per day
- **Agent Traces** — Searchable list with status badges (completed/error/pending)
- **Trace Detail** — Expandable spans_json visualization (timeline)
- **Handoff Analysis** — Chain depth distribution chart

**Wire:** Add as tab/section in `GlobalAdminDashboard.tsx`

---

## Dependency Graph

```
Phase 1 (no deps)          Phase 2 (no deps)         Phase 3 (needs Phase 1+2)    Phase 4 (needs Phase 3)
├─ 1.1 Register Sightings  ├─ 2.1 Hege API          ├─ 3.1 useHegeStore          ├─ 4.1 HegeDashboard
├─ 1.2 Register Stories     ├─ 2.2 Wildunfall API    ├─ 3.2 useWildunfallStore    ├─ 4.2 WildunfallMode
├─ 1.3 Register Invites     ├─ 2.3 Nachsuche API     ├─ 3.3 useNachsucheStore     ├─ 4.3 NachsucheFlow
                             ├─ 2.4 Challenges API    ├─ 3.4 useSightingStore      ├─ 4.4 SightingRadar
                                                      ├─ 3.5 useStoryStore         ├─ 4.5 Stories
                                                      ├─ 3.6 useInviteStore        ├─ 4.6 Invites
                                                      ├─ 3.7 useTrailCamStore      ├─ 4.7 DrueckjagdPack
                                                      ├─ 3.8 useVenisonStore       ├─ 4.8 RevierAdmin
                                                      ├─ 3.9 useStreckenlisteStore ├─ 4.9 BoundaryImport
                                                      ├─ 3.10 useHuntcraftStore    ├─ 4.10 TrailCamFeed
                                                                                    ├─ 4.11 VenisonQR
                                                                                    ├─ 4.12 Streckenliste
                                                                                    ├─ 4.13 Challenges
                                                                                    ├─ 4.14 GuestPermit
                                                                                    ├─ 4.15 ExpirationAlerts
                                                                                    ├─ 4.16 QuietZoneEditor
                                                                                    ├─ 4.17 NoGoZoneOverlay
                                                                                    ├─ 4.18 DistanceRings
                                                                                    └─ 4.19 Observability
```

---

## File Summary

### New Files (~22)

| # | File | Type | LOC Est. |
|---|------|------|----------|
| 1 | `server/src/routes/jagd-hege.ts` | Backend route | ~200 |
| 2 | `server/src/routes/jagd-wildunfall.ts` | Backend route | ~250 |
| 3 | `server/src/routes/jagd-nachsuche.ts` | Backend route | ~220 |
| 4 | `server/src/routes/jagd-challenges.ts` | Backend route | ~150 |
| 5 | `server/src/routes/jagd-observability.ts` | Backend route | ~120 |
| 6 | `src/stores/useHegeStore.ts` | Zustand store | ~120 |
| 7 | `src/stores/useWildunfallStore.ts` | Zustand store | ~130 |
| 8 | `src/stores/useNachsucheStore.ts` | Zustand store | ~120 |
| 9 | `src/stores/useSightingStore.ts` | Zustand store | ~100 |
| 10 | `src/stores/useStoryStore.ts` | Zustand store | ~100 |
| 11 | `src/stores/useInviteStore.ts` | Zustand store | ~110 |
| 12 | `src/stores/useTrailCamStore.ts` | Zustand store | ~90 |
| 13 | `src/stores/useVenisonStore.ts` | Zustand store | ~90 |
| 14 | `src/stores/useStreckenlisteStore.ts` | Zustand store | ~80 |
| 15 | `src/stores/useHuntcraftStore.ts` | Zustand store | ~100 |
| 16 | `src/components/admin/ObservabilityDashboard.tsx` | UI component | ~300 |

### Modified Files (~18)

| # | File | Changes |
|---|------|---------|
| 1 | `server/src/index.ts` | +8 import lines, +8 `.use()` calls |
| 2 | `src/applications/jagd-agenten/App.tsx` | +6 view types, +6 imports, +6 nav buttons, +6 renders |
| 3 | `src/applications/jagd-agenten/components/ScoutView.tsx` | +3 imports (BoundaryImport, QuietZoneEditor, NoGoZone, DistanceRings) |
| 4 | `src/applications/jagd-agenten/components/HegeDashboard.tsx` | Replace mock → useHegeStore |
| 5 | `src/applications/jagd-agenten/components/WildunfallMode.tsx` | Replace mock → useWildunfallStore |
| 6 | `src/applications/jagd-agenten/components/NachsucheFlow.tsx` | Replace mock → useNachsucheStore |
| 7 | `src/applications/jagd-agenten/components/TrailCameraFeed.tsx` | Replace mock → useTrailCamStore |
| 8 | `src/applications/jagd-agenten/components/VenisonQRCode.tsx` | Replace mock → useVenisonStore |
| 9 | `src/applications/jagd-agenten/components/StreckenlisteGenerator.tsx` | Replace mock → useStreckenlisteStore |
| 10 | `src/applications/jagd-agenten/components/Explore/HuntcraftChallenges.tsx` | Replace mock → useHuntcraftStore |
| 11 | `src/applications/jagd-agenten/components/SightingRadar/SightingRadar.tsx` | Connect to useSightingStore |
| 12 | `src/applications/jagd-agenten/components/Stories/StoryEditor.tsx` | Connect to useStoryStore |
| 13 | `src/applications/jagd-agenten/components/Invites/InviteEditor.tsx` | Connect to useInviteStore |
| 14 | `src/applications/jagd-agenten/components/ExportPackGenerator.tsx` | +2 tabs (DrueckjagdPack, VenisonQR) |
| 15 | `src/applications/jagd-agenten/components/DailyCockpit.tsx` | +1 import (ExpirationAlerts) |
| 16 | `src/applications/jagd-agenten/components/DocumentVault.tsx` | +1 import (GuestPermitQRCode) |
| 17 | `src/applications/jagd-agenten/components/admin/GlobalAdminDashboard.tsx` | +1 tab (Observability) |
| 18 | `src/stores/useAdminStore.ts` | Complete member CRUD actions |

---

## Recommended Build Order

For a single developer working iteratively:

1. **Day 1:** Phase 1 (register 3 routes in index.ts) — 15 min
2. **Day 1:** Phase 2.1-2.3 (Hege/Wildunfall/Nachsuche APIs) — 4-6 hours
3. **Day 2:** Phase 2.4 (Challenges API) + Phase 3.1-3.3 (critical stores) — 4-6 hours
4. **Day 2:** Phase 4.1-4.3 (wire Hege/Wildunfall/Nachsuche views) — 3-4 hours
5. **Day 3:** Phase 3.4-3.10 (remaining stores) — 4-5 hours
6. **Day 3:** Phase 4.4-4.8 (wire Feed features + DrueckjagdPack + RevierAdmin) — 3-4 hours
7. **Day 4:** Phase 4.9-4.18 (wire map overlays + peripherals) — 4-5 hours
8. **Day 4:** Phase 4.19 (Observability dashboard) — 3-4 hours

**Total estimated effort: ~4 full development days**

---

## Verification Checklist

All features verified (2026-02-01):

- [x] Phase 1: `curl localhost:3000/api/v1/jagd/sightings` → 200
- [x] Phase 1: `curl localhost:3000/api/v1/jagd/stories` → 200
- [x] Phase 1: `curl localhost:3000/api/v1/jagd/invites` → 200
- [x] Phase 2: `curl -X POST localhost:3000/api/v1/jagd/hege/projects` → 201
- [x] Phase 2: `curl -X POST localhost:3000/api/v1/jagd/wildunfall/incidents` → 201
- [x] Phase 2: `curl -X POST localhost:3000/api/v1/jagd/nachsuche/cases` → 201
- [x] Phase 2: `curl localhost:3000/api/v1/jagd/challenges/templates` → 200
- [x] Phase 4: Open App → All 7 dock views visible and rendering
- [x] Phase 4: Hege Dashboard → Component renders with glass styling
- [x] Phase 4: Wildunfall Mode → Component renders with glass styling
- [x] Phase 4: Nachsuche Flow → Component renders with glass styling
- [x] Phase 4: Sichtungen → SightingRadar renders with glass styling
- [x] Phase 4: Feed → WaidmannFeed renders with glass styling
- [x] Phase 4: Scout → Map loads, 7 GeoJSON layers, RevierSearchBar functional
- [x] Phase 4: Admin → Observability tab shows tool performance metrics
- [x] Phase 4: Cockpit → Full dashboard with weather, Buechsenlicht, Zeitfenster
- [x] Glass migration: 0 remaining `bg-white/5`, `dark:bg-gray-*`, or inline fallback patterns
