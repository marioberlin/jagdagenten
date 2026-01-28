# LiquidCrypto System Documentation

> **Version:** January 2026  
> **Status:** Production Ready with Enterprise Features

This document contains detailed system documentation extracted from AGENTS.md.

---

## Table of Contents

1. [Implementation Summary](#implementation-summary)
2. [Phase 1: Security & Stability](#phase-1-critical-security--stability)
3. [Phase 2: Performance & Scalability](#phase-2-performance--scalability)
4. [Phase 3: Developer Experience & Observability](#phase-3-developer-experience--observability)
5. [Phase 4: Advanced Features](#phase-4-advanced-features)
6. [Phase 5: Agent Interoperability](#phase-5-agent-interoperability)
7. [Phase 6: Agent Hub UI](#phase-6-agent-hub-ui)
8. [Phase 7: Container Runtime](#phase-7-container-runtime)
9. [Phase 8: SDK Intelligence](#phase-8-sdk-intelligence-system)
10. [Phase 9: Cowork Mode](#phase-9-cowork-mode-deep-work-system)
11. [Phase 10: Generative Media](#phase-10-generative-media-pipeline)
12. [Phase 11: App Store](#phase-11-app-store--application-lifecycle)
13. [Phase 12: UCP Discovery](#phase-12-ucp-merchant-discovery)
14. [Phase 13: Agent UX Configuration](#phase-13-agent-ux-configuration-system)
15. [Phase 14: Agent Session Management](#phase-14-agent-session-management)
16. [Architecture Summary](#architecture-summary)
17. [Environment Variables](#environment-variables)
18. [Test Coverage](#test-coverage)

---

## Implementation Summary

**All features across 10 phases have been implemented and tested.**

| Phase | Status | Features |
|-------|--------|----------|
| **Phase 1** | ✅ Complete | Session-Scoped Client, Rate Limiting, ErrorBoundary, WebSocket Auth |
| **Phase 2** | ✅ Complete | Request Coalescing, WebSocket Scaling, Theme Hydration Fix |
| **Phase 3** | ✅ Complete | Pino Logging, OpenTelemetry, GraphQL Schema, Directive Checksums |
| **Phase 4** | ✅ Complete | Plugin Sandbox, Self-Healing Loop, Multi-Agent Orchestration, Plugin Registry |
| **Phase 5** | ✅ Complete | A2A Protocol, A2UI Rendering, External Agent Communication |
| **Phase 6** | ✅ Complete | Agent Hub UI, Agent Discovery, Agent Cards, Chat Windows |
| **Phase 7** | ✅ Complete | Container Runtime, Container Settings UI, Remote Deployment, Provider Presets |
| **Phase 8** | ✅ Complete | SDK Intelligence, Auto-Configuration, Smart Defaults, Task Analyzer |
| **Phase 9** | ✅ Complete | Cowork Mode, Task Orchestration, Sandbox System, Agent Manager, Permissions |
| **Phase 10** | ✅ Complete | Generative Media, Video Backgrounds, Gemini Image, Veo Video, Job Queue |
| **Phase 11** | ✅ Complete | App Store, App Lifecycle, Manifest-Driven Apps, Bundle Storage, PostgreSQL Registry |
| **Phase 12** | ✅ Complete | UCP Discovery, Merchant Registry, Crawler, Health Monitoring, WebSocket Progress |
| **Phase 13** | ✅ Complete | Agent UX Configuration, Per-Agent Theming, Quick Actions, Contextual Suggestions, Visual Editor |
| **Phase 14** | ✅ Complete | Session Management, Auto-Save, Memory Extraction, Decontextualizer, Session History Panel |

---

## Phase 1: Critical Security & Stability

### 1.1 Session-Scoped LiquidClient
**File:** `src/liquid-engine/clientFactory.ts`

Per-session AI client isolation preventing context leakage between users.

```typescript
import { LiquidClientFactory, generateSessionId } from '@/liquid-engine/clientFactory';

const factory = new LiquidClientFactory({ sessionTTL: 30 * 60 * 1000 }); // 30 min
const sessionId = generateSessionId();
const client = factory.getClient(sessionId);
```

**Features:**
- 30-minute session TTL with automatic cleanup
- Background cleanup every 5 minutes
- `destroySession()` for explicit cleanup
- `getSessionCount()` for monitoring

### 1.2 Tiered Rate Limiting
**File:** `server/src/index.ts`

Three-tier rate limiting with priority detection.

| Tier | Key Source | Limit |
|------|------------|-------|
| User | `Authorization: Bearer` | 100 req/15min |
| Session | `X-Session-Token` | 50 req/15min |
| IP | `X-Forwarded-For` / Request IP | 30 req/15min |

### 1.3 ErrorBoundary Expansion
**File:** `src/components/wrapped/index.ts`

13+ complex components wrapped with ErrorBoundary:
- **Features:** GlassEditor, GlassKanban, GlassPayment, GlassTerminal
- **Data Display:** GlassDataTable, GlassTimeline, GlassCarousel
- **Agentic:** GlassAgent, GlassCopilot, GlassDynamicUI, GlassPrompt

### 1.4 WebSocket Authentication
**File:** `server/src/websocket.ts`

Token-based WebSocket security with permission checks.

**Permissions:**
- `read:prices` - Subscribe to price updates
- `write:trades` - Execute trades
- `write:chat` - Send chat messages
- `admin:*` - Full access

---

## Phase 2: Performance & Scalability

### 2.1 Request Coalescing
**File:** `server/src/cache.ts`

Stampede protection for AI API calls.

### 2.2 Distributed WebSocket (Redis)
**File:** `server/src/websocket-redis.ts`

Horizontal scaling with Redis pub/sub.

### 2.3 Theme Hydration Fix
**File:** `src/stores/utils/syncHydrate.ts`

Pre-React CSS variable application to prevent flash.

---

## Phase 3: Developer Experience & Observability

### 3.1 Structured Logging (Pino)
**File:** `server/src/logger.ts`

Component Loggers: `redis`, `cache`, `ai`, `websocket`, `security`, `http`, `graphql`

### 3.2 OpenTelemetry Integration
**File:** `server/src/telemetry.ts`

### 3.3 GraphQL Schema
**Files:** `server/src/graphql/schema.ts`, `server/src/graphql/resolvers.ts`

- **Queries (12):** chat, serverStatus, portfolio, marketData, priceHistory, watchlist...
- **Mutations (11):** sendMessage, createTrade, installPlugin...
- **Subscriptions (5):** priceUpdates, chatStream, healingProgress...

### 3.4 Directive Version Checksums
**File:** `scripts/verify_directives.ts`

---

## Phase 4: Advanced Features

### 4.1 Plugin Sandbox Execution
**File:** `server/src/sandbox.ts`

### 4.2 Self-Healing Production Loop
**Directory:** `server/src/healer/`

### 4.3 Multi-Agent Orchestration
**Directory:** `server/src/orchestrator/`

**Specialist Agents:**
| Agent | Domain | File Patterns |
|-------|--------|---------------|
| UI | ui | `src/components/**/*.tsx` |
| API | api | `server/src/**/*.ts` |
| Security | security | `**/auth/**/*.ts`, `**/security/**/*.ts` |
| Test | test | `tests/**/*.ts`, `**/*.test.ts` |

### 4.4 Federated Plugin Registry
**Directory:** `server/src/registry/`

---

## Phase 5: Agent Interoperability

### 5.1 A2A Protocol Support
**Directory:** `server/src/a2a/`

Full A2A (Agent-to-Agent) Protocol v1.0 implementation.

**API Endpoints:**
- `GET /.well-known/agent-card.json` - Agent Card discovery (v1.0 canonical)
- `POST /a2a` - JSON-RPC 2.0 endpoint for A2A protocol
- `POST /a2a/stream` - Streaming endpoint (SSE)

**v1.0 JSON-RPC Methods (PascalCase):**
| Method | Description |
|--------|-------------|
| `SendMessage` | Send message and wait for completion |
| `GetTask` | Retrieve task by ID |
| `ListTasks` | List tasks with filtering |
| `CancelTask` | Request task cancellation |

> **Note**: As of January 2026, LiquidCrypto operates in strict v1.0 mode. Legacy v0.x method names (`message/send`, `tasks/get`) and the legacy discovery endpoint (`/.well-known/agent.json`) have been removed.

### 5.2 A2UI Rendering
**Directory:** `src/a2a/`

Transforms A2UI payloads from external agents into Liquid Glass components.

**Supported A2UI Components (v1.0):**
| A2UI Component | Glass Equivalent |
|----------------|------------------|
| `Text` | `text` |
| `Button` | `button` |
| `TextField` | `input` |
| `Row` | `stack` (horizontal) |
| `Column` | `stack` (vertical) |
| `Card` | `card` |
| `MultipleChoice` | `radiogroup` |
| `DateTimeInput` | `datepicker` |
| `Video` | `video` |
| `AudioPlayer` | `audio` |
| `Modal` | `modal` |

### 5.3 A2A Client
**File:** `src/a2a/client.ts`

---

## Phase 6: Agent Hub UI

### 6.1 Agent Hub Page
**File:** `src/pages/agents/AgentHub.tsx`

The "App Store" for A2A agents.

**Features:**
- Hero section with gradient orb background
- Real-time search with filtering
- 8 category pills
- Featured agents carousel
- Grid/List view toggle
- Agent detail modal with full info
- URL probe for dynamic discovery
- Multiple concurrent chat windows

### 6.2 Agent Cards
**File:** `src/components/agents/AgentCard.tsx`

### 6.3 Agent Discovery (URL Probe)
**File:** `src/components/agents/AgentProbe.tsx`

### 6.4 Agent Chat Windows
**File:** `src/components/agents/AgentChatWindow.tsx`

### 6.5 Curated Agent Registry
**File:** `src/services/agents/registry.ts`

---

## Phase 7: Container Runtime

### 7.1 LiquidContainer System
**Directory:** `server/src/container/`

**Core Components:**
| File | Purpose |
|------|---------|
| `types.ts` | Type definitions, error classes |
| `config.ts` | Zod schemas, env parsing |
| `pool.ts` | Container pool manager |
| `scheduler.ts` | Weighted load balancing |
| `client.ts` | HTTP client for runtime server |
| `secrets.ts` | Multi-backend secrets (Env, Vault, AWS) |
| `metrics.ts` | OpenTelemetry integration |
| `executor.ts` | Orchestrator integration |
| `lifecycle.ts` | Docker daemon detection, auto-start |

### 7.2 Container Lifecycle Management
**File:** `server/src/container/lifecycle.ts`

Automatic container initialization on server startup.

**Features:**
- Docker daemon detection
- Container image verification and auto-build
- `ensureContainersReady()` for startup hook
- Graceful shutdown handling
- Fallback mode when Docker unavailable

### 7.3 Container Settings UI
**Files:**
- `src/stores/containerStore.ts` - Zustand store
- `src/components/settings/GlassContainerSettings.tsx` - Settings panel

**Features:**
- 6 Configuration Tabs: Placement, Pool, Resources, Network, Secrets, Telemetry
- 9 Cloud Providers: Hetzner, DigitalOcean, Fly.io, Railway, AWS, GCP, Azure, Bare Metal, Custom

### 7.4 Sandbox ↔ Container Integration
**Files:** `server/src/cowork/sandbox/SandboxManager.ts`, `server/src/cowork/sandbox/types.ts`

Sandboxes can attach Docker containers for isolated AI agent execution.

**Container Attachment API:**
| Method | Purpose |
|--------|---------|
| `attachContainer()` | Bind container to sandbox |
| `detachContainer()` | Release container to pool |
| `getContainerInfo()` | Get attached container details |
| `updateA2ATask()` | Track A2A task completion |
| `markPendingResume()` | Mark session for later resume |
| `resumeSession()` | Resume pending session |

---

## Phase 9: Cowork Mode (Deep Work System)

### 9.1 Cowork Orchestrator
**Directory:** `server/src/cowork/`

Deep work orchestration enabling complex, multi-step task execution with full visibility and control.

**Core Services:**
| File | Purpose |
|------|---------|
| `orchestrator.ts` | Main coordinator, session lifecycle, task distribution |
| `planner.ts` | Gemini-powered task planning and decomposition |
| `executor.ts` | Task execution with sandbox support and streaming output |
| `permissions.ts` | Security layer with path validation and capability checks |
| `agent-manager.ts` | Concurrent agent spawning with priority queue |
| `a2a-bridge.ts` | Remote agent delegation via A2A protocol |
| `repository.ts` | Database persistence layer |

**Execution Flow:**
```
User Input → TaskPlanner → SubTasks → Permission Check → Executor/AgentManager → Artifacts
                ↓                           ↓
         Plan Review Modal          Security Validation
```

### 9.2 Permission Service
**File:** `server/src/cowork/permissions.ts`

Multi-layer security validation for all file operations.

**Validation Pipeline:**
1. **Normalize** - Resolve symlinks, canonicalize paths
2. **Blocked Prefix** - Deny `/etc`, `/var`, `/usr`, `/System`, etc.
3. **Workspace Boundary** - Enforce project directory limits
4. **Extension Filter** - Block/whitelist file types
5. **Capability Check** - read/write/delete/execute permissions
6. **Size Limit** - Per-file and per-session limits
7. **Sandbox Isolation** - Enforce sandbox boundaries when active

### 9.3 Agent Manager
**File:** `server/src/cowork/agent-manager.ts`

Concurrent agent spawning with intelligent scheduling.

**Features:**
- Priority queue (critical > high > normal > low)
- Semaphore-based concurrency control (configurable max)
- Health monitoring with heartbeat detection
- Retry logic with exponential backoff
- Pause/resume queue processing
- Batch spawning for parallel execution
- Graceful termination (single, session, or all)

### 9.4 File Sandbox System
**Directory:** `server/src/cowork/sandbox/`

Isolated file staging for safe task execution with Docker container integration.

**Components:**
| File | Purpose |
|------|---------|
| `SandboxManager.ts` | Create, commit, rollback sandboxes, container attachment |
| `types.ts` | Session types, container state, status enums |
| `BackupManager.ts` | Original file preservation |
| `ConflictDetector.ts` | Detect file conflicts |
| `AuditLogger.ts` | Compliance trail |
| `FileHasher.ts` | SHA-256 hash computation for change detection |
| `routes.ts` | Elysia REST endpoints |

**Sandbox REST API (`/api/v1/sandbox`):**
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | POST | Create sandbox |
| `/:id` | GET | Get sandbox details |
| `/:id/diff` | GET | Get file changes |
| `/:id/apply` | POST | Apply changes to source |
| `/:id/discard` | POST | Discard sandbox |
| `/:id/rollback` | POST | Rollback to backup |
| `/:id/attach` | POST | Attach container |
| `/:id/detach` | POST | Detach container |
| `/:id/container` | GET | Get container info |
| `/:id/task` | POST | Update A2A task |
| `/pending-resume` | GET | List pending sessions |
| `/:id/resume` | POST | Resume pending session |

### 9.5 A2A Task Bridge
**File:** `server/src/cowork/a2a-bridge.ts`

Remote agent delegation via A2A protocol.

**Capabilities:**
- `AgentDiscoveryService` - Probe and discover remote agents
- Capability matching - Match subtasks to agent skills
- Message translation - Convert Cowork ↔ A2A formats
- Polling execution - Monitor remote task progress
- Result transformation - A2A artifacts → Cowork format

### 9.6 Cowork UI Components
**Directory:** `src/components/cowork/`

**Components:**
| Component | Purpose |
|-----------|---------|
| `GlassCoworkPanel` | Main 3-column layout |
| `CoworkInput` | Task input with file picker |
| `PlanReviewModal` | Review AI-generated plans |
| `TaskQueuePanel` | Multi-task queue management |
| `TaskTicket` | Individual task card |
| `TaskProgress` | Real-time execution progress |
| `AgentCardsPanel` | Active agent visualization |
| `ArtifactsPanel` | Generated artifact display |
| `DiffReviewer` | Review sandbox changes |
| `SandboxIndicator` | Sandbox status display |

### 9.7 Cowork API Endpoints
**File:** `server/src/cowork/routes.ts`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/sessions` | POST | Create new session |
| `/sessions/:id` | GET | Get session details |
| `/sessions/:id/plan` | POST | Generate task plan |
| `/sessions/:id/approve` | POST | Approve plan |
| `/sessions/:id/cancel` | POST | Cancel session |
| `/sessions/:id/pause` | POST | Pause execution |
| `/sessions/:id/resume` | POST | Resume execution |
| `/queue/batch` | POST | Batch task creation |
| `/queue/pause` | POST | Pause queue |
| `/queue/resume` | POST | Resume queue |
| `/queue/reorder` | POST | Reorder tasks |
| `/agents/remote/discover` | POST | Discover remote agents |
| `/agents/remote/:id/delegate` | POST | Delegate to remote agent |

### 9.8 WebSocket Events
**File:** `server/src/cowork/events.ts`

| Event | Payload | Description |
|-------|---------|-------------|
| `session:created` | Session | New session started |
| `plan:generated` | Plan | AI plan ready for review |
| `plan:approved` | Session | Plan execution started |
| `subtask:started` | SubTask | Task execution began |
| `subtask:progress` | Progress | Execution progress update |
| `subtask:completed` | SubTask + Artifacts | Task finished |
| `session:completed` | Session | All tasks done |
| `agent:spawned` | Agent | New agent started |
| `agent:health` | Health | Agent health update |
| `queue:stats` | Stats | Queue statistics |

---

## Phase 8: SDK Intelligence System

### 8.1 Auto-Configuration Engine
**File:** `server/src/container/auto-config.ts`

### 8.2 Smart Defaults Generator
**File:** `server/src/container/smart-defaults.ts`

### 8.3 SDK Intelligence (Task Analyzer)
**File:** `server/src/container/sdk-intelligence.ts`

| Task Type | Preferred SDK | Reasoning |
|-----------|---------------|-----------|
| Security | Claude | Most careful reasoning |
| UI/Components | Claude | Best React/CSS understanding |
| API/Backend | Gemini CLI | Fastest, most cost-effective |
| Tests | Gemini CLI / OpenAI | Fast iteration |

### 8.4 SDK Runners
**Directory:** `server/src/container/runners/`

---

## Phase 10: Generative Media Pipeline

### 10.1 Overview

AI-powered background media generation for destination-aware atmospheric UIs using Gemini 3 Pro Image and Veo 3.1 Fast.

**Features:**
- Destination-specific cityscape images (15 cities)
- Weather-responsive video backgrounds (6 conditions)
- PostgreSQL artifact persistence
- Redis caching (24-hour TTL)
- Background job queue for async video generation
- Graceful fallback when services unavailable

### 10.2 Media Generation Agents
**Directory:** `server/src/agents/media-common/`, `server/src/agents/`

| Agent | Model | Purpose |
|-------|-------|---------|
| **ImageGen** | Gemini 3 Pro Image | Generate iconic destination cityscape images |
| **VideoGen** | Veo 3.1 Fast | Animate images into 8-second looping videos |

**Agent Files:**
| File | Purpose |
|------|---------|
| `media-common/types.ts` | Shared TypeScript interfaces |
| `media-common/destinations.ts` | 15 destination profiles with landmarks |
| `media-common/prompts.ts` | Prompt engineering for image/video |
| `media-common/storage.ts` | PostgreSQL, Redis, Job Queue |
| `media-imagegen.ts` | ImageGen A2A agent |
| `media-videogen.ts` | VideoGen A2A agent |

### 10.3 Storage Architecture
**File:** `server/src/agents/media-common/storage.ts`

Multi-layer storage with graceful degradation:

```
┌─────────────────────────────────────────┐
│          MediaStorageManager            │
├─────────────────────────────────────────┤
│  L1: Redis Cache (24h TTL)              │
│  ↓ miss                                 │
│  L2: PostgreSQL (persistent)            │
│  ↓ miss                                 │
│  L3: Filesystem (public/videos/)        │
└─────────────────────────────────────────┘
```

**PostgreSQL Table (`media_artifacts`):**
```sql
CREATE TABLE media_artifacts (
    id VARCHAR(255) PRIMARY KEY,
    cache_key VARCHAR(255) UNIQUE,
    destination VARCHAR(100),
    condition VARCHAR(50),
    type VARCHAR(20),           -- 'image' | 'video'
    status VARCHAR(50),         -- 'pending' | 'generating' | 'complete' | 'failed'
    file_path VARCHAR(500),
    public_url VARCHAR(500),
    prompt TEXT,
    model VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);
```

### 10.4 Background Job Queue
**File:** `server/src/agents/media-common/storage.ts` (MediaJobQueue class)

EventEmitter-based in-process job queue for async video generation.

**Features:**
- Max 2 concurrent video generations
- Status tracking: `queued` → `processing` → `complete`/`failed`
- Redis-backed job status (1-hour TTL)
- Registered handlers per job type

**Job Lifecycle:**
```
enqueue(job) → queued → processing → complete/failed
     ↓
  jobId returned immediately (async mode)
```

### 10.5 Media API Endpoints
**File:** `server/src/routes/media.ts`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/media/status` | GET | Storage health (postgres, redis, queue) |
| `/api/media/background/:dest/:cond` | GET | Get best available media URL |
| `/api/media/image/:dest/:cond` | GET | Check image status |
| `/api/media/video/:dest/:cond` | GET | Check video status |
| `/api/media/job/:jobId` | GET | Check async job progress |
| `/api/media/generate/image` | POST | Generate single image |
| `/api/media/generate/video` | POST | Generate/queue single video |
| `/api/media/generate/pipeline` | POST | Image + Video in one call |
| `/api/media/list` | GET | List all generated media |

### 10.6 Supported Destinations
**File:** `server/src/agents/media-common/destinations.ts`

| City | Slug | Primary Landmark |
|------|------|------------------|
| Tokyo | `tokyo` | Tokyo Tower |
| Paris | `paris` | Eiffel Tower |
| London | `london` | Big Ben |
| New York | `new-york` | Empire State Building |
| Berlin | `berlin` | Brandenburg Gate |
| Toronto | `toronto` | CN Tower |
| Milan | `milan` | Duomo di Milano |
| Dubai | `dubai` | Burj Khalifa |
| Sydney | `sydney` | Sydney Opera House |
| Rome | `rome` | Colosseum |
| Barcelona | `barcelona` | Sagrada Familia |
| Amsterdam | `amsterdam` | Canal Houses |
| Singapore | `singapore` | Marina Bay Sands |
| Hong Kong | `hong-kong` | Victoria Peak |
| Los Angeles | `los-angeles` | Hollywood Sign |

### 10.7 Weather Conditions
**File:** `server/src/agents/media-common/prompts.ts`

| Condition | Visual Style | Video Motion |
|-----------|--------------|--------------|
| `sunny` | Golden light, blue sky | Birds, clouds, lens flare |
| `cloudy` | Dramatic overcast | Timelapse clouds |
| `rainy` | Wet reflections, purple-blue | Rain streaks, thunder |
| `night` | Neon glow, city lights | Light trails, twinkling |
| `snowy` | Winter wonderland | Snowflakes drifting |
| `foggy` | Ethereal mist | Rolling fog |

### 10.8 Frontend Integration
**Files:** `src/components/atmospheric/VideoBackground.tsx`, `AtmosphericBackground.tsx`

**VideoBackground Features:**
- Fetches from `/api/media/background/:dest/:cond`
- Supports video, image, or gradient fallback
- Lazy loading with IntersectionObserver
- Auto-generation trigger (optional)
- Loading states and error handling

### 10.9 Pre-Generation Script
**File:** `scripts/pre-generate-backgrounds.ts`

Batch generation for cache warming.

```bash
# Dry run (preview what would be generated)
bun scripts/pre-generate-backgrounds.ts --dry-run

# Generate images only
bun scripts/pre-generate-backgrounds.ts --images-only

# Generate videos only (requires images)
bun scripts/pre-generate-backgrounds.ts --videos-only

# Full generation (6 cities × 4 conditions = 24 combos)
bun scripts/pre-generate-backgrounds.ts
```

**Default Configuration:**
- Cities: Berlin, London, Tokyo, New York, Toronto, Milan
- Conditions: sunny, rainy, night, snowy
- Estimated cost: ~$3.65 for all 24 image+video pairs

---

## Phase 11: App Store & Application Lifecycle

### 11.1 Overview

Manifest-driven application lifecycle system with Apple App Store-inspired marketplace UI. Transforms the static app system into a dynamic, registry-based architecture.

**Status:** ✅ Complete (5 implementation phases)

### 11.2 System Core
**Directory:** `src/system/app-store/`

| File | Purpose |
|------|---------|
| `types.ts` | AppManifest, AppCapability, AppCategory, InstalledApp |
| `appStoreStore.ts` | Central Zustand store for app lifecycle |
| `AppLoader.tsx` | Dynamic component loader (`import.meta.glob`) |
| `AppPanel.tsx` | Generic panel renderer |
| `IntegrationRegistry.ts` | Menu bar, shortcuts, AI context |
| `permissions.ts` | Capability-based permission manager |
| `appDiscovery.ts` | Build-time manifest scanner |
| `remoteAppLoader.ts` | Remote catalog + bundle installer |
| `SandboxedApp.tsx` | Iframe sandbox for untrusted apps |

### 11.3 App Store UI
**Directory:** `src/applications/_system/app-store/`

| View | Description |
|------|-------------|
| Home | Hero banner, installed grid, marketplace catalog |
| Detail | App info, permissions, integrations, install/remove |
| Categories | Browse by category with counts |
| Search | Search installed + remote catalog |
| Installed | Manage installed apps |
| Publish | Submit new app to registry |

### 11.4 Server Registry
**Directory:** `server/src/registry/`

| File | Purpose |
|------|---------|
| `app-routes.ts` | REST API (`/api/v1/apps`) with PostgreSQL + in-memory fallback |
| `app-store-db.ts` | PostgreSQL CRUD layer with JSONB indexes |
| `app-types.ts` | Server-side type definitions |
| `bundle-storage.ts` | Filesystem bundle storage with SHA-256 integrity |

**Database:** `app_registry` table with JSONB manifest, download counts, ratings, verified status.

### 11.5 Security Model

- **14 capability types** across 3 risk levels (low/medium/high)
- 4 auto-granted capabilities (storage, toast, fullscreen)
- Permission dialog at install time for sensitive capabilities
- SHA-256 bundle integrity verification
- Iframe sandbox for untrusted remote apps

### 11.6 Build Integration

Per-app code splitting via Vite `manualChunks`:
```typescript
// Each app gets its own chunk: app-ibird.js, app-_system-app-store.js
if (id.includes('/src/applications/')) {
  const match = id.match(/\/src\/applications\/(.+?)\/(?:App\.tsx|components\/|...)/);
  if (match) return `app-${match[1].replace('/', '-')}`;
}
```

### 11.7 Test Coverage

| Suite | Tests | Coverage |
|-------|-------|----------|
| `appStoreStore.test.ts` | 25 | Lifecycle, dock, panels, bulk ops |
| `permissions.test.ts` | 24 | Grants, revocation, risk classification |

**Full documentation:** See [docs/app-store/README.md](../app-store/README.md)

---

## Phase 12: UCP Merchant Discovery

### 12.1 Overview

UCP Merchant Discovery is a comprehensive service for discovering, crawling, validating, and monitoring merchants that implement the Universal Commerce Protocol (UCP).

**Key Features:**
- Multi-source seed providers (awesome-ucp, ucptools, ucp-checker)
- Concurrent crawling with per-domain rate limiting
- PostgreSQL persistence with JSONB profiles
- Real-time WebSocket progress streaming
- Health tier system (A/B/C) with adaptive scheduling
- A2A capability detection

### 12.2 Architecture

**Directory:** `server/src/services/ucp-discovery/`

| File | Purpose |
|------|---------|
| `index.ts` | Main exports |
| `types.ts` | TypeScript interfaces |
| `store.ts` | Unified PostgreSQL storage interface |
| `pg-storage.ts` | PostgreSQL implementation |
| `crawler.ts` | Crawl orchestration |
| `fetchers.ts` | HTTP fetching with timeouts |
| `validators.ts` | Schema validation |
| `scoring.ts` | Merchant scoring (0-100) |
| `seed-providers.ts` | Multi-source seed fetching |
| `notifications.ts` | Tier change notifications |

### 12.3 Database Schema

8 PostgreSQL tables:

```sql
-- Core tables
ucp_merchants          -- Merchant registry (domain, score, health_tier, has_a2a)
ucp_merchant_sources   -- Discovery source tracking
ucp_profiles           -- UCP profile snapshots (JSONB)
ucp_agent_cards        -- A2A Agent Card snapshots (JSONB)
ucp_validation_results -- Schema validation results
ucp_crawl_state        -- Per-merchant crawl state
ucp_fetch_history      -- Latency tracking
ucp_crawler_runs       -- Crawl run history
```

### 12.4 API Endpoints

**File:** `server/src/routes/ucp-discovery-api.ts`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/merchants` | GET | List merchants with filtering |
| `/merchants/:id` | GET | Get merchant details |
| `/merchants` | POST | Add domain manually |
| `/merchants/:domain` | DELETE | Remove merchant |
| `/crawl/full` | POST | Run full crawl |
| `/crawl/incremental` | POST | Run incremental crawl |
| `/crawl/status` | GET | Get crawler status |
| `/crawl/config` | PATCH | Update crawler config |
| `/crawl/progress` | WS | WebSocket progress stream |
| `/scheduler/start` | POST | Start background scheduler |
| `/scheduler/stop` | POST | Stop scheduler |
| `/stats` | GET | Registry statistics |
| `/health` | GET | Health summary |
| `/notifications` | GET | Recent notifications |
| `/export` | GET | Export registry |
| `/import` | POST | Import registry |

### 12.5 Health Tier System

| Tier | Score Range | Check Interval | Description |
|------|-------------|----------------|-------------|
| A | 70-100 | 6-24 hours | Healthy |
| B | 40-69 | 2-7 days | Degraded |
| C | 0-39 | 7-30 days | Failing |

### 12.6 Frontend UI

**File:** `src/applications/ucp-discovery/UCPDiscoveryApp.tsx`

Features:
- Filterable merchant table
- Real-time WebSocket progress display
- Crawl controls (full/incremental)
- Scheduler toggle
- Stats dashboard
- Export/Import UI

**Full documentation:** See [docs/infrastructure/ucp-discovery.md](./ucp-discovery.md)

---

## Phase 13: Agent UX Configuration System

### 13.1 Overview

Per-agent UX customization system that allows each agent to have its own theme, input options, quick actions, and contextual suggestion strategy.

**Features:**
- YAML frontmatter configuration in markdown files
- Per-agent theming (colors, message style, backgrounds)
- Configurable input options (placeholder, voice, file upload)
- Quick actions bar with dynamic icons
- Multiple contextual suggestion strategies
- Visual UX configuration editor

### 13.2 Configuration Schema

**Directory:** `src/applications/agent-chat/`

**File Pattern:** `agentUX_{agent-id}.md`

```yaml
---
version: "1.0"
displayName: "Agent Name"

theme:
  accentColor: "#6366f1"       # Primary color
  secondaryColor: "#818cf8"    # Secondary/highlight color
  messageStyle: glass | bubble | minimal
  avatarStyle: circle | rounded | square
  glassEffects: true | false
  backgroundImage: "agent-id"  # Maps to public/backgrounds/

formatting:
  markdown: true | false
  emojiToIcons: true | false
  codeHighlighting: true | false
  codeTheme: dark | light
  mathRendering: true | false

input:
  placeholder: "Message text..."
  voiceEnabled: true | false
  fileUpload: true | false
  allowedFileTypes: ["image/*", "application/pdf"]
  maxFileSize: 10  # MB
  multiline: true | false

contextualUI:
  suggestionsEnabled: true | false
  suggestionStrategy: semantic | heuristic | agent-defined | none
  maxSuggestions: 4
  suggestionLayout: horizontal | vertical | grid

quickActions:
  - label: "Action Name"
    value: "Message to send"
    icon: "LucideIconName"
    description: "Tooltip text"
---
```

### 13.3 Core Files

| File | Purpose |
|------|---------|
| `src/applications/agent-chat/ux/schema.ts` | Zod validation schemas |
| `src/applications/agent-chat/ux/parser.ts` | YAML frontmatter parser |
| `src/applications/agent-chat/ux/loader.ts` | `import.meta.glob` static loader |
| `src/applications/agent-chat/ux/index.ts` | React hook `useAgentUXConfig()` |
| `src/components/agents/AgentUXConfigEditor.tsx` | Visual configuration editor |
| `src/components/agents/AgentChatWindow.tsx` | Chat window with UX integration |

### 13.4 Suggestion Strategies

| Strategy | Description | Use Case |
|----------|-------------|----------|
| `semantic` | AI-powered contextual analysis | General agents |
| `heuristic` | Fast pattern-based suggestions | Simple Q&A agents |
| `agent-defined` | Server-provided suggestions | Specialized workflows |
| `none` | Disable suggestions | Minimal UIs |

### 13.5 Agent Configurations

24 agents configured with unique themes and quick actions:

| Agent ID | Display Name | Accent Color | Strategy |
|----------|--------------|--------------|----------|
| `wr-demo` | WR Demo | #6366f1 | semantic |
| `crypto-advisor` | Crypto Advisor | #F7931A | semantic |
| `restaurant-finder` | Restaurant Finder | #EF4444 | heuristic |
| `market-data` | Market Data | #10B981 | heuristic |
| `trade-executor` | Trade Executor | #F59E0B | heuristic |
| `strategy` | Strategy Agent | #8B5CF6 | semantic |
| `risk` | Risk Manager | #DC2626 | heuristic |
| `orchestrator` | Orchestrator | #0EA5E9 | semantic |
| `notification` | Notification Agent | #F97316 | heuristic |
| `symbol-manager` | Symbol Manager | #14B8A6 | heuristic |
| `webhook-gateway` | Webhook Gateway | #6366F1 | heuristic |
| `maintenance` | Maintenance Agent | #78716C | heuristic |
| `rizzcharts` | RizzCharts | #EC4899 | semantic |
| `documind` | DocuMind | #3B82F6 | semantic |
| `nanobanana` | NanoBanana | #FACC15 | semantic |
| `travel-planner` | Travel Planner | #0EA5E9 | semantic |
| `dashboard-builder` | Dashboard Builder | #8B5CF6 | semantic |
| `ai-researcher` | AI Researcher | #6366F1 | semantic |
| `research-canvas` | Research Canvas | #10B981 | semantic |
| `qa-agent` | QA Agent | #22C55E | heuristic |
| `state-machine` | State Machine | #7C3AED | semantic |
| `copilot-form` | Copilot Form | #EF4444 | semantic |
| `remote-password` | Password Manager | #DC2626 | heuristic |
| `remote-oneflow` | OneFlow | #10B981 | semantic |

### 13.6 Visual Editor

**File:** `src/components/agents/AgentUXConfigEditor.tsx`

Collapsible section-based editor with:
- **Theme Section:** Color pickers, message style, avatar style toggles
- **Input Options:** Placeholder, voice, file upload settings
- **Contextual UI:** Strategy dropdown, layout selector
- **Quick Actions:** Add/edit/remove actions with icon selection

### 13.7 Background Generation

**File:** `scripts/generate-agent-backgrounds.ts`

NanoBanana API integration for generating unique agent backgrounds:
- 24 agent-specific prompts
- Style presets matching agent themes
- Automatic file naming and storage

**Full documentation:** See [docs/infrastructure/agent-ux-system.md](./agent-ux-system.md)

---

## Phase 14: Agent Session Management

### 14.1 Overview

Persistent session management for agent chats with automatic memory extraction using the Decontextualizer. Sessions are stored in PostgreSQL and synchronized across devices.

**Features:**
- Session persistence with auto-save
- Cross-device synchronization via PostgreSQL
- Automatic memory extraction using Decontextualizer
- Session history panel with search
- Session menu with CRUD operations
- Last 50 sessions retained per agent

### 14.2 Architecture

**Frontend Components:**

| File | Purpose |
|------|---------|
| `src/stores/agentSessionStore.ts` | Zustand store for session state |
| `src/components/agents/SessionListPanel.tsx` | Slide-out session history panel |
| `src/components/agents/SessionMenu.tsx` | Dropdown menu for session actions |
| `src/components/agents/AgentChatWindow.tsx` | Chat window with session integration |

**Backend Routes:**

| File | Purpose |
|------|---------|
| `server/src/routes/agent-sessions.ts` | REST API for session persistence |
| `server/src/agents/memory-decontextualizer.ts` | Memory extraction service |

### 14.3 Database Schema

```sql
CREATE TABLE agent_chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    preview TEXT DEFAULT '',
    message_count INTEGER DEFAULT 0,
    messages JSONB DEFAULT '[]'::jsonb,
    memories JSONB DEFAULT '[]'::jsonb,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_sessions_agent_id ON agent_chat_sessions (agent_id);
CREATE INDEX idx_agent_sessions_last_active ON agent_chat_sessions (last_active_at DESC);
```

### 14.4 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agent-sessions/:agentId` | GET | List sessions for agent |
| `/api/agent-sessions/:agentId` | POST | Create new session |
| `/api/agent-sessions/:agentId/:sessionId` | PATCH | Update session metadata |
| `/api/agent-sessions/:agentId/:sessionId` | DELETE | Delete session |
| `/api/agent-sessions/:agentId/:sessionId/messages` | GET | Get session messages |
| `/api/agent-sessions/:agentId/:sessionId/messages` | PUT | Save session messages |
| `/api/agent-sessions/:agentId/:sessionId/memories` | GET | Get extracted memories |
| `/api/agent-sessions/:agentId/:sessionId/memories` | POST | Add memory manually |
| `/api/agent-sessions/:agentId/:sessionId/extract-memory` | POST | Extract memory with decontextualizer |
| `/api/agent-sessions/:agentId/:sessionId/extract-memories-batch` | POST | Batch memory extraction |

### 14.5 Memory Decontextualizer

The `MemoryDecontextualizer` resolves pronouns and references to create self-contained memory statements.

**Transformations:**
- "I really like how you did that" → "User likes the modular auth pattern in authStore.ts"
- "That's the approach I prefer" → "User prefers the TypeScript-first development approach"

**Importance Scoring:**
Memories are scored 0-100 based on keyword heuristics:
- High importance: "prefer", "always", "never", "important", "remember", "must"
- Low importance: "maybe", "perhaps", "sometimes", "might", "could"

### 14.6 Session Menu Actions

| Action | Description |
|--------|-------------|
| Session History | Open slide-out panel with recent sessions |
| New Session | Create a fresh session |
| Rename Session | Edit session title |
| Export Session | Download as JSON |
| Copy Conversation | Copy all messages to clipboard |
| View Memories | Show extracted memories |
| Clear Messages | Reset current session |
| Archive Session | Move to archived state |
| Delete Session | Permanently remove |

### 14.7 Auto-Save & Memory Extraction

Sessions auto-save with a 1-second debounce after message changes. Memory extraction runs automatically for:
- Agent messages longer than 20 characters
- User messages longer than 30 characters

```typescript
// Auto-save effect
useEffect(() => {
    if (activeSession && messages.length > 1) {
        const timeout = setTimeout(() => {
            saveMessages(agent.id, activeSession.id, storedMessages);
        }, 1000);
        return () => clearTimeout(timeout);
    }
}, [messages, activeSession]);

// Memory extraction effect
useEffect(() => {
    const agentMessages = messages.filter(
        m => m.role === 'agent' && m.content.length > 20 && !extractedMessageIds.current.has(m.id)
    );
    agentMessages.forEach(msg => extractMemory(agent.id, activeSession.id, msg.content, msg.id));
}, [messages, activeSession]);
```

**Full documentation:** See [docs/infrastructure/agent-sessions.md](./agent-sessions.md)

---

## Architecture Summary


```
┌─────────────────────────────────────────────────────────────────────┐
│                    LiquidCrypto Architecture                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Frontend (React 19 + TypeScript 5.7)                               │
│  ├── src/liquid-engine/        # AI client                          │
│  ├── src/system/app-store/     # App lifecycle system               │
│  ├── src/applications/         # Self-contained app bundles         │
│  ├── src/components/wrapped/   # ErrorBoundary wrappers             │
│  ├── src/a2a/                  # A2A client & transformer           │
│  ├── src/components/agents/    # Agent Hub components               │
│  └── src/layouts/              # LiquidOS unified spatial layout        │
│                                                                      │
│  Backend (Bun + Elysia)                                             │
│  ├── server/src/registry/      # App Store registry & bundles       │
│  ├── server/src/a2a/           # A2A protocol handler               │
│  ├── server/src/healer/        # Self-healing system                │
│  ├── server/src/orchestrator/  # Multi-agent coordination          │
│  ├── server/src/container/     # LiquidContainer runtime            │
│  └── server/src/graphql/       # Full GraphQL API                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Environment Variables

```bash
# AI API Keys
GEMINI_API_KEY=your_key            # Required for media generation
ANTHROPIC_API_KEY=your_key
OPENAI_API_KEY=your_key

# Google OAuth
GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret

# Infrastructure
REDIS_URL=redis://localhost:6379   # Used for media cache (optional, graceful degradation)
DATABASE_URL=postgresql://...      # Used for media artifacts (optional, graceful degradation)

# Media Generation (Phase 10)
# GEMINI_API_KEY is used for both ImageGen (Gemini 3 Pro Image) and VideoGen (Veo 3.1 Fast)
# Storage: PostgreSQL + Redis + Filesystem cascade, works with any combination

# Observability
OTEL_ENABLED=true
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
LOG_LEVEL=info

# Security
REQUIRE_WS_AUTH=true
JWT_SECRET=change-in-production
```

---

## Test Coverage

**200+ tests across all phases:**

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `clientFactory.test.ts` | 20+ | Session management |
| `rate-limit.test.ts` | 15+ | Tier detection |
| `websocket-auth.test.ts` | 20+ | Token validation |
| `websocket-distributed.test.ts` | 20+ | Redis pub/sub |
| `graphql.test.ts` | 73 | Schema, resolvers |
| `orchestrator.test.ts` | 26 | Decomposition |
| `registry.test.ts` | 46 | Validation, security |
| `a2a.test.ts` | 30+ | A2UI transformation |
| `container-pool.test.ts` | 28 | Pool, scheduler |
| `appStoreStore.test.ts` | 25 | App lifecycle, dock, panels |
| `permissions.test.ts` | 24 | Permission grants, revocation |

**Run tests:**
```bash
bun test tests/unit/
```

---

**Project Health: 10/10 - Production Ready with Enterprise Features**
