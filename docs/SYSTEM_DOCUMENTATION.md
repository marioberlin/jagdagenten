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
10. [Architecture Summary](#architecture-summary)
11. [Environment Variables](#environment-variables)
12. [Test Coverage](#test-coverage)

---

## Implementation Summary

**All 29 features across 7 phases have been implemented and tested.**

| Phase | Status | Features |
|-------|--------|----------|
| **Phase 1** | ✅ Complete | Session-Scoped Client, Rate Limiting, ErrorBoundary, WebSocket Auth |
| **Phase 2** | ✅ Complete | Request Coalescing, WebSocket Scaling, Theme Hydration Fix |
| **Phase 3** | ✅ Complete | Pino Logging, OpenTelemetry, GraphQL Schema, Directive Checksums |
| **Phase 4** | ✅ Complete | Plugin Sandbox, Self-Healing Loop, Multi-Agent Orchestration, Plugin Registry |
| **Phase 5** | ✅ Complete | A2A Protocol, A2UI Rendering, External Agent Communication |
| **Phase 6** | ✅ Complete | Agent Hub UI, Agent Discovery, Agent Cards, Chat Windows |
| **Phase 7** | ✅ Complete | Container Runtime, Container Settings UI, Remote Deployment, Provider Presets |

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

Full A2A (Agent-to-Agent) protocol implementation.

**API Endpoints:**
- `GET /.well-known/agent.json` - Agent discovery (Agent Card)
- `POST /a2a` - JSON-RPC endpoint for A2A protocol
- `POST /a2a/stream` - Streaming endpoint (SSE)

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

### 7.2 Container Settings UI
**Files:**
- `src/stores/containerStore.ts` - Zustand store
- `src/components/settings/GlassContainerSettings.tsx` - Settings panel

**Features:**
- 6 Configuration Tabs: Placement, Pool, Resources, Network, Secrets, Telemetry
- 9 Cloud Providers: Hetzner, DigitalOcean, Fly.io, Railway, AWS, GCP, Azure, Bare Metal, Custom

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
GEMINI_API_KEY=your_key
ANTHROPIC_API_KEY=your_key
OPENAI_API_KEY=your_key

# Google OAuth
GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret

# Infrastructure
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://...

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
