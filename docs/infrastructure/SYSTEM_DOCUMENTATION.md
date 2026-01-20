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
12. [Architecture Summary](#architecture-summary)
13. [Environment Variables](#environment-variables)
14. [Test Coverage](#test-coverage)

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

## Architecture Summary


```
┌─────────────────────────────────────────────────────────────────────┐
│                    LiquidCrypto Architecture                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Frontend (React 19 + TypeScript 5.7)                               │
│  ├── src/liquid-engine/        # AI client                          │
│  ├── src/components/wrapped/   # ErrorBoundary wrappers             │
│  ├── src/a2a/                  # A2A client & transformer           │
│  ├── src/components/agents/    # Agent Hub components               │
│  └── src/layouts/              # Two Worlds layouts                 │
│                                                                      │
│  Backend (Bun + Elysia)                                             │
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

**Run tests:**
```bash
bun test tests/unit/
```

---

**Project Health: 10/10 - Production Ready with Enterprise Features**
