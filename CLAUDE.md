# Agent Instructions

> This file is mirrored across CLAUDE.md, AGENTS.md, and GEMINI.md so the same instructions load in any AI environment.

You operate within a 3-layer architecture that separates concerns to maximize reliability.

## The 3-Layer Architecture

**Layer 1: Directive (What to do)**
- SOPs written in Markdown, live in `directives/`
- Specialized domain expertise (Design, Agency, DevOps) live in `skills/`
- Every session should start by reading `skills/_registry.md` to discover available capabilities.
- Define the goals, inputs, tools/scripts to use, outputs, and edge cases.

**Layer 2: Orchestration (Decision making)**
- This is you. Your job: intelligent routing.
- Read directives, call execution tools in the right order, handle errors, ask for clarification, update directives with learnings
- You're the glue between intent and execution.

**Layer 3: Execution (Doing the work)**
- Deterministic scripts in `scripts/` (Node.js/TypeScript)
- Environment variables and API tokens stored in `.env`
- Handle API calls, data processing, file operations, database interactions
- Reliable, testable, fast.

**Why this works:** if you do everything yourself, errors compound. 90% accuracy per step = 59% success over 5 steps. Push complexity into deterministic code.

---

## Operating Principles

### 1. Check for tools first
Before writing a script, check `scripts/` per your directive. Only create new scripts if none exist.

### 2. Self-anneal when things break
1. Read error message and stack trace
2. Fix the script and test it again
3. Update the directive with what you learned

### 3. Update directives as you learn
Directives are living documents. When you discover API constraints, better approaches, or common errors—update the directive. Don't create/overwrite directives without asking.

### 4. Code Simplification
Use the **Code Simplifier Agent** after each feature implementation. Refer to `directives/code_simplifier.md`.

### 5. Ralph Autonomous Loop
For complex features, divide work into a `prd.json` and use the **Ralph Pattern**:
- **Small Task Rule**: Every PRD story must be small enough to complete in a single context window.
- **Memory Persistence**: Update `GEMINI.md` and `progress.txt` after EVERY successful iteration.
- Refer to `directives/ralph_node.md` and `.agent/workflows/run_ralph.md`.

### 6. Self-Healing Protocol
When a critical error is detected:
- Send error report to `POST /api/v1/security/audit`
- The **Healer System** (`server/src/healer/`) automatically analyzes errors
- Execute fixes using the Ralph Autonomous Loop

### 7. Multi-Agent Orchestration
For features exceeding single-agent context:
- Use the **Orchestrator** (`server/src/orchestrator/`)
- Four specialist agents: UI, API, Security, Test
- Follow `directives/orchestrator.md`

---

## Self-Annealing Loop

Errors are learning opportunities:
1. Fix it
2. Update the tool
3. Test tool
4. Update directive
5. System is now stronger

---

## File Organization

**Directory structure:**
- `.tmp/` - Intermediate files (never commit)
- `scripts/` - Global Node.js/TypeScript scripts
- `directives/` - Task-specific SOPs
- `skills/` - Domain-specific Expertise (source of truth)
- `.agent/skills/` - Antigravity-compatible flat skill symlinks (auto-generated)
- `.env` - Environment variables and API keys

**Skill Migration**: Run `bun scripts/migrate-skills-to-agent-folder.ts` to sync `skills/` to `.agent/skills/`.

**Key principle:** Local files are only for processing. Deliverables live in build outputs or cloud services.

---

## Quick Start (Local Development)

```bash
# Build container images (first time only)
cd server/container && ./build.sh && cd ../..

# Start PostgreSQL, Redis, NATS, and Container Runtime
docker-compose up -d

# Install dependencies
bun install

# Start development server
bun run dev
```

**Environment variables:**
```bash
DATABASE_URL=postgresql://liquidcrypto:liquidcrypto_dev@localhost:5432/liquidcrypto
REDIS_URL=redis://localhost:6379
NATS_URL=nats://localhost:4222
PORT=3000
```

**Services running:**
| Service | Port | Purpose |
|---------|------|---------|
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache & pub/sub |
| NATS | 4222 | A2A messaging & work queues |
| liquid-runtime | 8081 | AI agent containers |
| Backend | 3000 | Elysia API |
| Frontend | 5173/5174 | Vite dev server |

For detailed setup, see [`docs/LOCAL_DEVELOPMENT.md`](./docs/LOCAL_DEVELOPMENT.md).

For system documentation and implementation details, see [`docs/SYSTEM_DOCUMENTATION.md`](./docs/SYSTEM_DOCUMENTATION.md).

For NATS messaging documentation, see [`docs/infrastructure/nats.md`](./docs/infrastructure/nats.md).

---

## LiquidMind: AI Resource Management

**All new apps and agents MUST use LiquidMind for AI resource persistence.** Never use localStorage for prompts, memory, knowledge, or other AI data.

### What is LiquidMind?

LiquidMind is the unified persistent intelligence layer. It stores AI resources (prompts, memory, context, knowledge, artifacts, skills, MCP) in PostgreSQL with versioning, sharing, decay, and context compilation.

**Full documentation:** `docs/infrastructure/liquidmind.md`

### Rules for New Apps/Agents

1. **Store all AI resources via the Resource API** (`/api/resources`), not localStorage
2. **Set correct ownership:**
   - Apps: `{ ownerType: 'app', ownerId: 'your-app-id' }`
   - Agents: `{ ownerType: 'agent', ownerId: 'your-agent-id' }`
3. **Use the Zustand store** (`useResourceStore()`) for frontend CRUD
4. **Context is compiled automatically** — resources are assembled into system prompts by the context compiler
5. **Share resources** between apps/agents via the Share API when cross-target context is needed
6. **Pin critical resources** (`isPinned: true`) to prevent memory decay
7. **Never duplicate the artifacts system** — use `resourceType: 'artifact'` with an `artifactId` reference

### Resource Types

| Type | Purpose | Example |
|------|---------|---------|
| `prompt` | System prompts, templates | "You are a crypto analyst..." |
| `memory` | Persistent facts, learnings | "User prefers RSI analysis" |
| `context` | App state, configuration | Current trading pair, timeframe |
| `knowledge` | Static docs, domain info | "RSI divergence patterns..." |
| `artifact` | Generated outputs | Code, charts, documents |
| `skill` | AI-invokable tools | "analyze_chart", "place_order" |
| `mcp` | External tool servers | Stdio/SSE/HTTP MCP servers |

### Quick Reference

```typescript
// Frontend: Create a resource
import { useResourceStore } from '@/stores/resourceStore';
const { createResource } = useResourceStore();
await createResource({
  resourceType: 'prompt',
  ownerType: 'app',
  ownerId: 'my-app',
  name: 'System Prompt',
  content: 'You are...',
  tags: ['system'],
  provenance: 'user_input',
});

// Frontend: Compile context for current target
import { compileContext } from '@/utils/compileContext';
const compiled = compileContext(resources, { tokenBudget: 8000 });

// Backend: Compile context for an agent
// POST /api/resources/compile/agent/my-agent-id
// Body: { currentQuery: "user message", tokenBudget: 8000 }
```

### Key Files

| File | Purpose |
|------|---------|
| `server/src/resources/` | Backend (store, routes, compiler, lifecycle) |
| `src/stores/resourceStore.ts` | Frontend Zustand store |
| `src/utils/compileContext.ts` | Client-side context compiler |
| `src/hooks/useFocusedTarget.ts` | Resolve focused app/agent |
| `src/hooks/useResourcesForTarget.ts` | Fetch resources for a target |
| `src/applications/ai-explorer/` | UI for browsing/editing resources |
| `server/sql/008_ai_resources.sql` | Database migration |

---

## Soul.md: App/Agent Identity

Every app and agent has a `soul.md` file that defines personality, goals, voice, and constraints.

**Format:** YAML frontmatter + markdown sections
**Location:** `src/applications/{app}/soul.md` or `server/src/a2a/{server}/soul.md`

**Auto-generation:** Soul files are auto-generated for new apps. Use `getSoulGenerator().generateAllApps()`.

**Full documentation:** `docs/infrastructure/soul.md`

---

## Additional Systems

| System | Documentation |
|--------|---------------|
| Messaging Gateway | `docs/infrastructure/messaging-gateway.md` |
| Skill Marketplace | `docs/infrastructure/marketplace.md` |
| Canvas | `docs/infrastructure/canvas.md` |
| Soul.md | `docs/infrastructure/soul.md` |
| Smart Compaction | `docs/infrastructure/smart-compaction.md` |
| Voice Integration | `docs/infrastructure/voice.md` |

---

## A2A Protocol v1.0 Specification

**IMPORTANT:** Always use A2A v1.0 draft specification with PascalCase method names. Do NOT use legacy v0.x snake_case methods.

### Method Names (PascalCase)

| v1.0 Method (USE THIS) | Legacy v0.x (AVOID) | Purpose |
|------------------------|---------------------|---------|
| `SendMessage` | `message/send` | Send a message to agent |
| `SendStreamingMessage` | `tasks/send` | Send streaming message |
| `GetTask` | `tasks/get` | Retrieve task by ID |
| `CancelTask` | `tasks/cancel` | Cancel a running task |
| `ListTasks` | N/A | List tasks by context |
| `SubscribeToTask` | `Resubscribe` | Subscribe to task updates (SSE) |
| `GetAgentCard` | `agent/card` | Get base agent card |
| `GetExtendedAgentCard` | `GetAuthenticatedExtendedCard` | Get extended card (auth) |
| `SetTaskPushNotificationConfig` | N/A | Configure push notifications |

### Response Headers

Always include in A2A responses:
```
A2A-Protocol-Version: 1.0
Content-Type: application/json
```

### Creating A2A Servers

When implementing new A2A executors:

1. **Extend `BaseA2UIExecutor`** from `server/src/a2a/executors/base.ts`
2. **Register with `RouterExecutor`** in `server/src/a2a/elysia-plugin.ts`
3. **Export from index** in `server/src/a2a/executors/index.ts`
4. **Create agent card function** returning `v1.AgentCard`

```typescript
// Example: New executor
import { BaseA2UIExecutor, type AgentExecutionContext, type AgentExecutionResult } from './base.js';
import { v1 } from '@liquidcrypto/a2a-sdk';

export class MyExecutor extends BaseA2UIExecutor {
  async execute(message: v1.Message, context: AgentExecutionContext): Promise<AgentExecutionResult> {
    const text = this.extractText(message);
    // ... implement logic
    return this.createTextResponse('Response', context.contextId, context.taskId);
  }
}

export function getMyAgentCard(baseUrl: string): v1.AgentCard {
  return {
    name: 'My Agent',
    description: 'Does something useful',
    url: `${baseUrl}/a2a`,
    protocolVersion: '1.0',
    capabilities: { streaming: true },
    skills: [{ id: 'skill-1', name: 'Skill', description: 'Desc', tags: [] }],
  };
}
```

### Key Files

| File | Purpose |
|------|---------|
| `server/src/a2a/adapter/elysia-adapter.ts` | A2A JSON-RPC handler |
| `server/src/a2a/executors/base.ts` | Base executor class |
| `server/src/a2a/executors/router.ts` | Multi-executor routing |
| `server/src/a2a/elysia-plugin.ts` | Elysia integration |
| `@liquidcrypto/a2a-sdk` | SDK with v1 types |

---

## Summary

You sit between human intent (directives) and deterministic execution (scripts). Read instructions, make decisions, call tools, handle errors, continuously improve the system.

Be pragmatic. Be reliable. Self-anneal.
