# LiquidMind: Unified AI Resource Management System

> **Version:** 1.0.0
> **Status:** Production Ready
> **Updated:** January 2026

LiquidMind is the persistent intelligence layer of LiquidOS. It treats AI resources (prompts, memory, context, knowledge, artifacts, skills, MCP servers) as first-class OS-managed objects with lifecycle, versioning, sharing, and context compilation.

Inspired by the [MemOS](https://github.com/MemTensor/MemOS) paradigm, LiquidMind provides a unified storage and retrieval system that flows between apps and agents — giving every AI interaction persistent, shareable, and version-controlled context.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Resource Types](#resource-types)
3. [Database Schema](#database-schema)
4. [Backend Services](#backend-services)
5. [Frontend Integration](#frontend-integration)
6. [Context Compilation](#context-compilation)
7. [Memory Lifecycle](#memory-lifecycle)
8. [Sharing & Permissions](#sharing--permissions)
9. [Markdown Sync Layer](#markdown-sync-layer)
10. [Knowledge Pipeline](#knowledge-pipeline)
11. [API Reference](#api-reference)
12. [Usage Guide](#usage-guide)
13. [Migration from localStorage](#migration-from-localstorage)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Menu Bar (Live)                          │
│  Memory: View/Add/Compact    Context: Prompts/Knowledge/RAG │
└────────────────────────────────┬────────────────────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          ▼                      ▼                      ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   AI Explorer    │  │  Resource Clip-  │  │   LiquidClient   │
│  (Full Browser)  │  │  board (Copy/    │  │   Bridge (auto   │
│  Type-specific   │  │  Paste across    │  │   context merge) │
│  editors per     │  │  targets)        │  │                  │
│  resource type   │  │                  │  │                  │
└────────┬─────────┘  └──────────────────┘  └──────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│               Zustand Resource Store                          │
│  useResourceStore() - CRUD, search, clipboard, cache         │
└────────────────────────┬─────────────────────────────────────┘
                         │ REST API
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                 /api/resources (Elysia)                       │
│  CRUD, search, share, versions, compile, bulk operations     │
└────────────────────────┬─────────────────────────────────────┘
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
┌─────────────────────┐  ┌──────────────────────────────────┐
│     PostgreSQL      │  │     Markdown File Layer          │
│  ai_resources       │  │  .ai/{target}/prompts.md         │
│  ai_resource_shares │  │  .ai/{target}/knowledge.md       │
│  ai_resource_       │  │  .ai/{target}/learnings.md       │
│    versions         │  │  Agent-readable & amendable      │
│  ai_resource_       │  │                                  │
│    dependencies     │  │                                  │
└─────────────────────┘  └──────────────────────────────────┘
              │                     │
              └──────────┬──────────┘
                         ▼
┌──────────────────────────────────────────────────────────────┐
│               Context Compiler (Hybrid)                      │
│  Client: fast compile from Zustand cache                     │
│  Server: canonical compile for agents + verification         │
│  Layered: Prompt → Context → Memory → Knowledge → RAG       │
└──────────────────────────────────────────────────────────────┘
```

---

## Resource Types

LiquidMind manages 7 distinct resource types, each with type-specific metadata and editors:

| Type | Purpose | Key Metadata |
|------|---------|--------------|
| **prompt** | System prompt templates with variables | `template`, `variables[]`, `analytics` |
| **memory** | Persistent facts and learnings | `layer`, `importance`, `expiresAt`, `consolidatedFrom` |
| **context** | Application state and configuration | `contextType`, `priority`, `valueType` |
| **knowledge** | Static information, docs, FAQs | `sourceType`, `ragStoreId`, `summary`, `entities` |
| **artifact** | Generated outputs (code, docs, images) | `category`, `artifactId`, `extensions` |
| **skill** | AI-invokable capabilities | `triggers[]`, `toolNames[]`, `parameters` |
| **mcp** | Model Context Protocol servers | `serverUrl`, `transport`, `command`, `capabilities` |

### Resource Ownership

Every resource has an **owner** (who created it) and optional **shares** (who else can access it):

- `ownerType`: `'app'` | `'agent'` | `'system'` | `'user'`
- `ownerId`: The specific app/agent ID (e.g., `'crypto-advisor'`, `'sparkles-mail'`)

---

## Database Schema

### Tables

**`ai_resources`** — Main storage (10 indexes)
```sql
id UUID PRIMARY KEY
resource_type VARCHAR(50)    -- prompt|memory|context|knowledge|artifact|skill|mcp
owner_type VARCHAR(20)       -- app|agent|system|user
owner_id VARCHAR(255)
name VARCHAR(512)
description TEXT
content TEXT
parts JSONB                  -- Structured multi-part data
type_metadata JSONB          -- Type-discriminated metadata
version INT                  -- Auto-incremented on updates
parent_id UUID               -- Version chain
is_active BOOLEAN            -- Soft delete
is_pinned BOOLEAN            -- Immune to decay
tags TEXT[]
search_vector TSVECTOR       -- Auto-generated full-text search
provenance VARCHAR(50)       -- user_input|agent_generated|extracted|consolidated
usage_frequency INT          -- Auto-incremented on compile inclusion
sync_to_file BOOLEAN         -- Whether to sync to .ai/ markdown files
created_at, updated_at, accessed_at TIMESTAMPTZ
```

**`ai_resource_shares`** — Cross-target sharing (2 indexes)
```sql
resource_id UUID → ai_resources(id)
target_type VARCHAR(20)
target_id VARCHAR(255)
permission VARCHAR(20)       -- read|write|copy
shared_by VARCHAR(255)
```

**`ai_resource_versions`** — Version history (1 index)
```sql
resource_id UUID → ai_resources(id)
version INT
content TEXT
parts JSONB
type_metadata JSONB
change_description TEXT
```

**`ai_resource_dependencies`** — Compilation ordering (2 indexes)
```sql
resource_id UUID → ai_resources(id)
depends_on_id UUID → ai_resources(id)
dependency_type VARCHAR(50)  -- requires|extends|overrides|consolidated_from
```

### Migration

Run: `psql $DATABASE_URL -f server/sql/008_ai_resources.sql`

---

## Backend Services

All backend code lives in `server/src/resources/`:

| File | Purpose |
|------|---------|
| `types.ts` | Shared TypeScript interfaces (`AIResource`, `ResourceType`, `TypeMetadata`, etc.) |
| `postgres-store.ts` | PostgreSQL CRUD with connection pooling, full-text search, versioning |
| `routes.ts` | Elysia REST API (CRUD, search, share, compile, migrate) |
| `context-compiler.ts` | Server-side context assembly with token budget and scoring |
| `memory-lifecycle.ts` | Decay service, consolidation service, memory scheduler |
| `markdown-sync.ts` | `.ai/` file read/write/watch for agent-readable context |
| `knowledge-pipeline.ts` | PTI ingestion: Parse → Transform → Index |
| `index.ts` | Module exports and route registration |

### Server Registration

In `server/src/index.ts`:
```typescript
import { registerResourceRoutes, MemoryDecayService } from './resources/index.js';

// Register routes
app.use(registerResourceRoutes);

// Start hourly decay job
const decayService = new MemoryDecayService(pool);
setInterval(() => decayService.applyDecay(), 60 * 60 * 1000);
```

---

## Frontend Integration

### Zustand Store

`src/stores/resourceStore.ts` provides the primary interface:

```typescript
import { useResourceStore } from '@/stores/resourceStore';

// In a component:
const {
  resources,
  createResource,
  updateResource,
  deleteResource,
  searchResources,
  shareResource,
  copyResource,
  clipboard,
} = useResourceStore();
```

### Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useFocusedTarget()` | `src/hooks/useFocusedTarget.ts` | Resolves focused window → `{ownerType, ownerId, name}` |
| `useResourcesForTarget()` | `src/hooks/useResourcesForTarget.ts` | Fetches resources for a target with type filtering |
| `useLiquidAssistant()` | `src/hooks/useLiquidAssistant.ts` | Chat hook with hybrid context compilation |

### Type-Specific Editors

Located in `src/applications/ai-explorer/editors/`:

| Editor | Resource Type | Features |
|--------|--------------|----------|
| `PromptEditor` | prompt | Template editing, `{variable}` detection, version picker |
| `MemoryEditor` | memory | Layer selector, importance slider, expiry picker |
| `ContextEditor` | context | Priority slider, parent selector, context type |
| `KnowledgeEditor` | knowledge | File drop zone, URL input, source type |
| `ArtifactEditor` | artifact | Category selector, existing artifact reference |
| `SkillEditor` | skill | Trigger words, tool name list |
| `MCPEditor` | mcp | Transport selector, server URL/command, test connection |

### LiquidClient Bridge

`src/liquid-engine/client.ts` merges compiled persistent context with ephemeral component contexts:

```typescript
// Set compiled context (called by useLiquidAssistant)
liquidClient.setCompiledContext(compiledContext);

// Build merged prompt: persistent + ephemeral
const prompt = liquidClient.buildContextPrompt();

// Get merged function declarations: skill tools + registered actions
const tools = liquidClient.buildMergedFunctionDeclarations();

// Get RAG store IDs for FileSearch grounding
const ragIds = liquidClient.getRAGStoreIds();
```

---

## Context Compilation

LiquidMind uses a **hybrid compilation** model:

### Client-Side (Fast Path)

`src/utils/compileContext.ts` compiles from Zustand cache for instant UI responsiveness:

```typescript
import { compileContext } from '@/utils/compileContext';

const compiled = compileContext(resources, { tokenBudget: 8000 });
// Returns: { systemPrompt, tools, ragStoreIds, tokenCount, budgetRemaining }
```

**Scoring formula:**
```
score = (importance * 0.4) + (recency * 0.35) + (frequency * 0.25)
```

### Server-Side (Canonical)

`POST /api/resources/compile/:ownerType/:ownerId` provides the canonical compilation for agents:

```typescript
// Request:
{ currentQuery: "user's message", tokenBudget: 8000 }

// Response:
{
  systemPrompt: "...",         // Layered prompt
  tools: [...],                // Skill tool declarations
  ragStoreIds: [...],          // For FileSearch grounding
  tokenCount: 6420,
  budgetRemaining: 1580,
  deferredResources: [...]     // IDs excluded (over budget)
}
```

### Compilation Layers (in order)

1. **System Prompt** — Pinned prompt resources + `.ai/{target}/prompts.md`
2. **Context** — Active context resources (priority-sorted)
3. **Memory** — Scheduled by importance, filtered by decay threshold
4. **Knowledge** — Inline items + `.ai/{target}/knowledge.md`
5. **Learnings** — `.ai/{target}/learnings.md`
6. **RAG** — Store IDs for Gemini FileSearch
7. **Skills** — Converted to tool/function declarations

### Token Budget

Default: 8,000 tokens. Each layer gets a proportional slice:
- Prompt: 2k
- Context: 1k
- Memory: 2k
- Knowledge: 2k
- Learnings: 1k

Resources that don't fit go to `deferredResources` (available for on-demand retrieval).

---

## Memory Lifecycle

### Decay

Every hour, the `MemoryDecayService` runs:
- Importance decreases by `0.01 * hours_since_accessed`
- Below `0.2` threshold → auto-archived (`is_active = false`)
- Accessing a memory resets decay and boosts importance by `0.1` (capped at 1.0)
- **Pinned memories are immune to decay**

### Consolidation

When memory count exceeds 50 per target:
1. Group related memories by semantic similarity
2. LLM generates a consolidated summary
3. New resource created with `provenance: 'consolidated'`
4. Original memories archived (not deleted — rollback possible)

### Scheduling

The `MemoryScheduler` scores resources for inclusion:
```
score = (importance * 0.3) + (task_fit * 0.4) + (recency * 0.15) + (frequency * 0.15)
```

- `task_fit`: Semantic similarity to current user query
- `importance`: Resource importance score (0-1)
- `recency`: Normalized time since last access
- `frequency`: Normalized usage count

### Compaction

When conversation context exceeds token limits, the **Smart Compaction Service** preserves valuable memories:

1. **ImportanceClassifier** scores each turn (0-100 via LLM)
2. **MemoryDecontextualizer** resolves pronouns for self-contained memories
3. High-importance memories saved to `DailyMemoryLog` with categories
4. Older turns summarized or truncated based on `strategy`

**Pipeline stages:** `analyzing` → `extracting` → `summarizing` → `persisting` → `complete`

**Chat command:** `/compact` (also: `/compact status`, `/compact force`)

See full documentation: [`docs/infrastructure/smart-compaction.md`](./smart-compaction.md)

---

## Sharing & Permissions

Resources can be shared across apps/agents with permission levels:

| Permission | Allows |
|------------|--------|
| `read` | Include in target's context compilation (read-only) |
| `write` | Target can modify the resource |
| `copy` | Target gets a duplicate (independent lifecycle) |

### Share Dialog

The `ShareDialog` component (`src/applications/ai-explorer/ShareDialog.tsx`) provides a UI for managing shares:
- Lists all installed apps/agents as potential targets
- Shows existing shares with permission levels
- Add/remove shares with permission picker

### API

```bash
# Share a resource
POST /api/resources/:id/share
{ "targetType": "agent", "targetId": "crypto-advisor", "permission": "read" }

# Remove a share
DELETE /api/resources/:id/share/:targetType/:targetId
```

### Context Isolation

When compiling context for a target:
- Owned resources are always included (subject to budget)
- Shared resources with `read` or `write` permission are included
- Each target compiles independently — no "context bleed" between unrelated agents

---

## Markdown Sync Layer

### Purpose

Research shows markdown is optimal for AI agent context:
- LLMs are trained extensively on markdown (GitHub, docs)
- Headings provide semantic structure for attention
- Human-readable AND machine-readable
- Agents can amend files during execution

### Directory Structure

```
.ai/
├── {app-id}/
│   ├── prompts.md        # System prompts for this app
│   ├── knowledge.md      # Static knowledge
│   └── learnings.md      # Agent-appended discoveries
├── {agent-id}/
│   ├── prompts.md
│   ├── knowledge.md
│   └── learnings.md
└── shared/
    ├── conventions.md    # Cross-app conventions
    └── preferences.md   # User preferences
```

### Sync Protocol

1. When a resource is created/updated with `syncToFile: true`:
   - Server writes the corresponding `.ai/{target}/{type}.md` file
   - File uses markdown with YAML frontmatter
2. When an agent modifies a `.ai/` file during execution:
   - File watcher detects changes
   - Changed content synced back to PostgreSQL
   - Version incremented in DB

### File Format

```markdown
---
owner: crypto-advisor
type: knowledge
lastSynced: 2026-01-23T10:00:00Z
---

# Market Analysis Patterns

## RSI Divergence
When RSI shows divergence from price action...

---
<!-- Agent: Add new patterns below this line -->
```

---

## Knowledge Pipeline

The PTI (Parse → Transform → Index) pipeline processes knowledge resources:

### Parse
Extract text from various formats:
- PDF, DOCX, HTML, images (OCR)
- Markdown passthrough

### Transform
LLM-powered semantic enhancement:
- Generate summary
- Extract named entities
- Create Q&A snippets for better retrieval
- Identify topics/tags

### Index
Write to search systems:
- PostgreSQL full-text search (`search_vector` TSVECTOR)
- Optional Gemini FileSearch (RAG grounding via `ragStoreId`)

---

## API Reference

**Base path:** `/api/resources`

### CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | List with filters (type, owner, tags, search, active) |
| `GET` | `/:id` | Get single resource with shares |
| `POST` | `/` | Create resource |
| `PATCH` | `/:id` | Update (auto-versions on content/metadata changes) |
| `DELETE` | `/:id` | Soft delete (`is_active = false`) |

### Search & Discovery

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/search?q=` | Full-text search with ranking |
| `GET` | `/by-target/:ownerType/:ownerId` | All resources for a target |

### Sharing

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/:id/share` | Share with target |
| `DELETE` | `/:id/share/:targetType/:targetId` | Remove share |

### Versioning

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/:id/versions` | Version history |
| `POST` | `/:id/revert/:version` | Revert to specific version |

### Compilation

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/compile/:ownerType/:ownerId` | Compile context for target |

### Migration

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/migrate-localStorage` | Bulk migrate from legacy localStorage |

### Query Parameters for `GET /`

| Param | Type | Description |
|-------|------|-------------|
| `type` | string | Filter by resource_type |
| `ownerType` | string | Filter by owner_type |
| `ownerId` | string | Filter by owner_id |
| `tags` | string | Comma-separated tag filter |
| `active` | boolean | Filter by is_active (default: true) |
| `search` | string | Full-text search query |
| `limit` | number | Page size (default: 50) |
| `offset` | number | Pagination offset |

### Request/Response Examples

**Create a prompt resource:**
```bash
curl -X POST http://localhost:3000/api/resources \
  -H "Content-Type: application/json" \
  -d '{
    "resourceType": "prompt",
    "ownerType": "app",
    "ownerId": "crypto-advisor",
    "name": "Market Analysis System Prompt",
    "content": "You are a cryptocurrency market analyst...",
    "typeMetadata": {
      "type": "prompt",
      "template": "Analyze {symbol} using {timeframe} data",
      "variables": ["symbol", "timeframe"]
    },
    "tags": ["trading", "analysis"],
    "provenance": "user_input"
  }'
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "resourceType": "prompt",
  "ownerType": "app",
  "ownerId": "crypto-advisor",
  "name": "Market Analysis System Prompt",
  "content": "You are a cryptocurrency market analyst...",
  "typeMetadata": { "type": "prompt", "template": "...", "variables": [...] },
  "version": 1,
  "isActive": true,
  "isPinned": false,
  "tags": ["trading", "analysis"],
  "provenance": "user_input",
  "usageFrequency": 0,
  "createdAt": "2026-01-23T10:00:00.000Z",
  "updatedAt": "2026-01-23T10:00:00.000Z",
  "accessedAt": "2026-01-23T10:00:00.000Z"
}
```

**Compile context:**
```bash
curl -X POST http://localhost:3000/api/resources/compile/app/crypto-advisor \
  -H "Content-Type: application/json" \
  -d '{ "currentQuery": "What is the BTC trend?", "tokenBudget": 8000 }'
```

---

## Usage Guide

### For New Apps

When creating a new LiquidOS app that needs AI capabilities:

1. **Store resources via the API** — don't use localStorage for AI data
2. **Set owner** to `{ ownerType: 'app', ownerId: 'your-app-id' }`
3. **Use `useFocusedTarget()`** to resolve the current app context
4. **Use `useResourcesForTarget()`** to fetch resources for your app
5. **The context compiler** automatically includes your resources in AI prompts

### For New Agents

When creating a new A2A agent:

1. **Register resources** with `{ ownerType: 'agent', ownerId: 'your-agent-id' }`
2. **Request shared resources** from apps via the Share API
3. **The server-side compiler** (`POST /compile/agent/:id`) builds your full context
4. **Write learnings** to `.ai/{agent-id}/learnings.md` during execution
5. **Learnings persist** across sessions via the markdown sync layer

### For the AI Explorer UI

The AI Explorer app (`src/applications/ai-explorer/`) provides:
- Browse all resource types per app/agent
- Type-specific editors for each resource type
- Share resources between targets
- Pin important resources (immune to decay)
- Version history and rollback

---

## Migration from localStorage

Legacy apps stored resources in `localStorage` under `liquid_*` keys. On first load, `App.tsx` triggers automatic migration:

```typescript
// In App.tsx:
if (hasLegacyData() && !isMigrationComplete()) {
    migrateLegacyResources(); // POSTs to /api/resources/migrate-localStorage
}
```

**Legacy keys migrated:**
- `liquid_prompts` → `resourceType: 'prompt'`
- `liquid_memory` → `resourceType: 'memory'`
- `liquid_context` → `resourceType: 'context'`
- `liquid_knowledge` → `resourceType: 'knowledge'`
- `liquid_artifacts` → `resourceType: 'artifact'`
- `liquid_skills` → `resourceType: 'skill'`
- `liquid_mcp` → `resourceType: 'mcp'`

After successful migration, localStorage keys are removed and `liquid_resources_migrated` flag is set.

---

## Key Design Decisions

### Why PostgreSQL over localStorage?
- Full-text search with ranking
- Cross-device persistence
- Versioning and rollback
- Sharing between apps/agents
- Server-side context compilation for container agents

### Why Hybrid Compilation?
- **Client-side**: Instant responsiveness, no network round-trip
- **Server-side**: Canonical result for agents, includes markdown files, semantic scoring

### Why Memory Decay?
- Prevents context pollution from stale data
- Simulates natural forgetting (recent = more important)
- Pinning overrides decay for critical information
- Consolidation compresses related memories

### Why Markdown Files?
- LLMs parse markdown natively (trained on GitHub)
- Agents can amend files during execution (learnings)
- Human-readable for debugging
- Follows AGENTS.md/CLAUDE.md conventions

---

## File Map

### Backend
```
server/src/resources/
├── types.ts              # AIResource, TypeMetadata, ResourceFilters
├── postgres-store.ts     # PostgreSQL CRUD, search, versioning
├── routes.ts             # Elysia REST endpoints
├── context-compiler.ts   # Token-budget context assembly
├── memory-lifecycle.ts   # Decay, consolidation, scheduling
├── markdown-sync.ts      # .ai/ file sync service
├── knowledge-pipeline.ts # PTI ingestion pipeline
└── index.ts              # Exports + route registration

server/sql/
└── 008_ai_resources.sql  # Database migration
```

### Frontend
```
src/stores/
└── resourceStore.ts      # Zustand store (CRUD, clipboard, cache)

src/hooks/
├── useFocusedTarget.ts   # Focused window → target resolution
├── useResourcesForTarget.ts  # Resource fetching hook
└── useLiquidAssistant.ts # Chat hook with hybrid compilation

src/utils/
└── compileContext.ts     # Client-side fast compiler

src/applications/ai-explorer/
├── AIExplorerEditor.tsx  # Main editor with type dispatch
├── ShareDialog.tsx       # Share target picker
├── migrateLegacy.ts      # localStorage migration
└── editors/
    ├── PromptEditor.tsx
    ├── MemoryEditor.tsx
    ├── ContextEditor.tsx
    ├── KnowledgeEditor.tsx
    ├── ArtifactEditor.tsx
    ├── SkillEditor.tsx
    └── MCPEditor.tsx

src/liquid-engine/
└── client.ts             # LiquidClient bridge (setCompiledContext, etc.)
```
