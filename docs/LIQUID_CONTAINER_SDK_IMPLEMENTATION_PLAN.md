# LiquidContainer SDK Integration: Comprehensive Implementation Plan

> **Status: ✅ IMPLEMENTED (January 2026)**
>
> This plan has been fully implemented. See `CLAUDE.md` Phase 8: SDK Intelligence System for documentation of the implemented features.

## Executive Summary

This plan transforms LiquidContainer from a generic command executor into a **universal AI agent runtime** supporting multiple SDK patterns (Claude Agent SDK, OpenAI Agents SDK, Google ADK, MiniMax). The architecture introduces **Runtime Profiles** that adapt container behavior based on the SDK's execution model.

**Key Outcomes:**
- Support 4+ AI agent SDKs with consistent container infrastructure
- Sub-100ms container acquisition from warm pool (already achieved)
- Session persistence across container recycling
- Project codebase access via overlay mounts
- Production-grade security with proxy-based credential injection

---

## Table of Contents

1. [Current State Assessment](#1-current-state-assessment)
2. [SDK Execution Models](#2-sdk-execution-models)
3. [Architecture Design](#3-architecture-design)
4. [Runtime Profile System](#4-runtime-profile-system)
5. [Session Management](#5-session-management)
6. [Project Mount Strategy](#6-project-mount-strategy)
7. [Security Enhancements](#7-security-enhancements)
8. [Implementation Phases](#8-implementation-phases)
9. [File Structure](#9-file-structure)
10. [Testing Strategy](#10-testing-strategy)
11. [Migration Path](#11-migration-path)

---

## 1. Current State Assessment

### What's Already Implemented (Production-Ready)

| Component | Location | Status | Notes |
|-----------|----------|--------|-------|
| Container Pool | `server/src/container/pool.ts` | ✅ Complete | Warm pool, health checks, replenishment |
| Scheduler | `server/src/container/scheduler.ts` | ✅ Complete | Weighted load balancing, affinity rules |
| Secrets Backend | `server/src/container/secrets.ts` | ✅ Complete | Env/Vault/AWS providers |
| Runtime Server | `server/container/runtime-server/server.ts` | ✅ Complete | HTTP API, SSE streaming |
| Container Executor | `server/src/container/executor.ts` | ✅ Complete | Bridge to orchestrator |
| Dockerfiles | `server/container/Dockerfile*` | ✅ Complete | Base + runtime images |
| Telemetry | `server/src/container/metrics.ts` | ✅ Complete | OpenTelemetry integration |
| Settings UI | `src/components/settings/GlassContainerSettings.tsx` | ✅ Complete | 9 cloud providers |

### What's Missing (This Plan)

| Component | Gap | Impact |
|-----------|-----|--------|
| **SDK Profile System** | No way to specify model, temperature, SDK type | Cannot run different AI SDKs |
| **Orchestrator Integration** | `executeAgent()` is mock, doesn't call containers | No real agent execution |
| **Session Persistence** | Containers are stateless, no session resumption | Cannot continue conversations |
| **Project Mounts** | Containers don't have access to project code | Agents can't read/modify files |
| **Credential Proxy** | Secrets are in env vars, not proxy-injected | Security weakness |
| **Per-SDK Agent Scripts** | Only `DEFAULT_AGENT_SCRIPT` exists | All agents run same generic code |

---

## 2. SDK Execution Models

### 2.1 Model Classification

Based on research, AI agent SDKs fall into three execution patterns:

| Pattern | SDKs | Agent Loop Location | Tool Execution | Container Role |
|---------|------|---------------------|----------------|----------------|
| **Local Agentic** | Claude Agent SDK | Inside container | Built-in (shell, file ops) | The Agent |
| **Remote Orchestrated** | OpenAI Agents SDK, Google ADK | Cloud API | Callback to container | Tool Executor |
| **Hybrid** | MiniMax M2.1 | Either (compatible APIs) | Either | Configurable |

### 2.2 Claude Agent SDK ("Local Brain")

```
┌─────────────────────────────────────────────────────────┐
│                    LIQUID CONTAINER                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Claude Agent SDK                    │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ │   │
│  │  │  Agent  │→ │   LLM   │→ │  Tool Execution │ │   │
│  │  │  Loop   │  │  (API)  │  │  (Local Shell)  │ │   │
│  │  └─────────┘  └─────────┘  └─────────────────┘ │   │
│  │                                                 │   │
│  │  Session State: Maintained in-process           │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  → Streams: stdout/stderr via SSE                       │
│  → Result: Structured JSON via markers                  │
└─────────────────────────────────────────────────────────┘
```

**Key Characteristics:**
- Agent loop runs entirely within container
- SDK maintains conversation state
- Tools (Read, Edit, Bash) execute locally
- Session resumption via `resume` option with session ID
- Long-running process (minutes to hours)

**Integration Pattern:**
```typescript
// Inside container - claude-runner.ts
import { query } from '@anthropic-ai/claude-agent-sdk';

const response = query({
    prompt: process.env.LIQUID_TASK_PROMPT,
    options: {
        model: process.env.LIQUID_SDK_MODEL || 'claude-sonnet-4-5',
        resume: process.env.LIQUID_SESSION_ID, // Resume if provided
        allowedTools: ['Read', 'Edit', 'Write', 'Bash', 'Glob', 'Grep'],
        maxTurns: parseInt(process.env.LIQUID_MAX_TURNS || '50'),
    }
});

for await (const message of response) {
    // First message contains session_id for persistence
    if (message.type === 'system' && message.subtype === 'init') {
        console.log(`SESSION_ID:${message.session_id}`);
    }
    // Stream to orchestrator via stdout
    console.log(JSON.stringify(message));
}
```

### 2.3 OpenAI Agents SDK ("Remote Brain")

```
┌──────────────────────────────────────────────────────────────────────┐
│                         OPENAI CLOUD                                  │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                      Agent Loop                                 │ │
│  │  User Prompt → LLM → Tool Decision → Function Call Request     │ │
│  └───────────────────────────────┬────────────────────────────────┘ │
└──────────────────────────────────┼───────────────────────────────────┘
                                   │ HTTP (tool_calls)
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    LIQUID CONTAINER (Bridge)                          │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    bridge-runner.ts                             │ │
│  │  1. Poll OpenAI API for function calls                         │ │
│  │  2. Execute tools locally (file ops, shell, etc.)              │ │
│  │  3. Submit tool_outputs back to API                            │ │
│  │  4. Repeat until agent completes                               │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

**Key Characteristics:**
- Agent loop runs in OpenAI cloud
- Container acts as "hands" executing tool calls
- Function tools defined with JSON schemas
- Built-in agent loop handles tool call → result → continue
- Stateless from container perspective (state in cloud)

**Integration Pattern:**
```typescript
// Inside container - bridge-runner.ts
import { Agent, run } from 'openai-agents';

const agent = new Agent({
    name: 'LiquidAgent',
    model: process.env.LIQUID_SDK_MODEL || 'gpt-4o',
    instructions: process.env.LIQUID_SYSTEM_PROMPT,
    tools: [
        // Define local tool implementations
        {
            name: 'read_file',
            description: 'Read file contents',
            parameters: { path: { type: 'string' } },
            execute: async ({ path }) => readFileSync(path, 'utf-8'),
        },
        {
            name: 'write_file',
            description: 'Write file contents',
            parameters: { path: { type: 'string' }, content: { type: 'string' } },
            execute: async ({ path, content }) => writeFileSync(path, content),
        },
        {
            name: 'run_command',
            description: 'Execute shell command',
            parameters: { command: { type: 'string' } },
            execute: async ({ command }) => execSync(command).toString(),
        },
    ],
});

// Run agent - handles the loop internally
const result = await run(agent, process.env.LIQUID_TASK_PROMPT);
console.log(JSON.stringify(result));
```

### 2.4 Google ADK ("Event-Driven")

```
┌──────────────────────────────────────────────────────────────────────┐
│                    LIQUID CONTAINER (Runner)                          │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                      ADK Runner                                 │ │
│  │  ┌─────────┐                                                   │ │
│  │  │ Session │ ← Events (user_message, tool_response, etc.)      │ │
│  │  │ Service │                                                   │ │
│  │  └────┬────┘                                                   │ │
│  │       │                                                        │ │
│  │  ┌────▼────┐      ┌───────────┐      ┌─────────────────┐     │ │
│  │  │ Runner  │ ←──→ │  LlmAgent │ ←──→ │  Gemini Cloud   │     │ │
│  │  │ (loop)  │      │ or Workflow│     │  (or local)     │     │ │
│  │  └────┬────┘      └───────────┘      └─────────────────┘     │ │
│  │       │                                                        │ │
│  │  ┌────▼────┐                                                   │ │
│  │  │  Tools  │ → Local execution (file ops, shell, etc.)        │ │
│  │  └─────────┘                                                   │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

**Key Characteristics:**
- Event-driven architecture with Runner at center
- Supports both LLM agents and workflow agents (Sequential, Parallel, Loop)
- Session and State objects for context management
- Bidirectional streaming support
- Model-agnostic (works with Gemini, but also others)

**Integration Pattern:**
```typescript
// Inside container - adk-runner.ts
import { LlmAgent, Runner, InMemorySessionService } from '@google/adk';

const agent = new LlmAgent({
    name: 'LiquidAgent',
    model: process.env.LIQUID_SDK_MODEL || 'gemini-2.0-flash',
    instruction: process.env.LIQUID_SYSTEM_PROMPT,
    tools: [readFileTool, writeFileTool, shellTool],
});

const sessionService = new InMemorySessionService();
const runner = new Runner({ agent, sessionService });

// Run with event streaming
for await (const event of runner.run({ userId: 'liquid', sessionId: 'task-1' })) {
    console.log(JSON.stringify(event));
}
```

---

## 3. Architecture Design

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              GRAPHQL API                                     │
│  executeOrchestrationSession(sessionId, sdkProfile) → OrchestrationResult   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ORCHESTRATOR                                      │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                   │
│  │   Decompose   │→ │    Assign     │→ │   Execute     │                   │
│  │   PRD→SubPRDs │  │  Specialists  │  │   Parallel    │                   │
│  └───────────────┘  └───────────────┘  └───────┬───────┘                   │
└─────────────────────────────────────────────────┼───────────────────────────┘
                                                  │
                                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CONTAINER EXECUTOR                                   │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │  For each SubPRD:                                                       ││
│  │  1. Resolve SDK Profile → Select Runner Script                          ││
│  │  2. Acquire Container from Pool                                         ││
│  │  3. Mount Project Code (read-only overlay)                              ││
│  │  4. Inject Credentials via Proxy Socket                                 ││
│  │  5. Initialize with Agent Config + Session State                        ││
│  │  6. Execute Runner Script                                               ││
│  │  7. Stream Output → Parse Result                                        ││
│  │  8. Persist Session ID for Continuation                                 ││
│  │  9. Release Container                                                   ││
│  └────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                                  │
                                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CONTAINER POOL                                     │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │  Warm Pool (configurable, default 3 idle)                               ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                     ││
│  │  │ Container 1 │  │ Container 2 │  │ Container 3 │                     ││
│  │  │ State: idle │  │ State: idle │  │ State: idle │                     ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘                     ││
│  │                                                                         ││
│  │  Placement: Local │ Remote │ Hybrid                                     ││
│  │  Load Balancing: Weighted random with health penalties                  ││
│  └────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                                  │
                                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          LIQUID CONTAINER                                    │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │  Runtime Server (Elysia on :8080)                                       ││
│  │  ├── /health     → Pool health checks                                   ││
│  │  ├── /init       → Agent initialization + SDK profile                   ││
│  │  ├── /execute    → Run command (blocking)                               ││
│  │  ├── /execute/stream → Run with SSE output                              ││
│  │  ├── /reset      → Recycle for reuse                                    ││
│  │  └── /shutdown   → Graceful termination                                 ││
│  │                                                                         ││
│  │  Mounts:                                                                ││
│  │  ├── /app             → Project code (read-only overlay)                ││
│  │  ├── /app/.agent      → Agent working directory (tmpfs)                 ││
│  │  ├── /secrets         → Credentials (tmpfs, proxy socket)               ││
│  │  └── /opt/liquid-runtime → Runner scripts (read-only)                   ││
│  │                                                                         ││
│  │  Runners:                                                               ││
│  │  ├── claude-runner.ts    → Claude Agent SDK                             ││
│  │  ├── bridge-runner.ts    → OpenAI/Google/MiniMax                        ││
│  │  ├── adk-runner.ts       → Google ADK specific                          ││
│  │  └── raw-runner.ts       → Direct command execution                     ││
│  └────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Data Flow for Agent Execution

```
1. User submits PRD via GraphQL
   │
   ▼
2. Orchestrator decomposes PRD into SubPRDs
   │
   ▼
3. For each SubPRD (parallel, max 4):
   │
   ├─► 3a. Resolve SDK Profile
   │       - Specialist agent type → Default SDK
   │       - User override → Specific SDK + params
   │       - Result: SDKProfile { type, model, temperature, ... }
   │
   ├─► 3b. Select Runner Script
   │       - claude-sdk → claude-runner.ts
   │       - openai-agents → bridge-runner.ts
   │       - google-adk → adk-runner.ts
   │       - raw → raw-runner.ts (existing)
   │
   ├─► 3c. Acquire Container
   │       - Try warm pool (< 100ms)
   │       - Fall back to cold create (3-5s)
   │
   ├─► 3d. Configure Mounts
   │       - Mount project at /app (read-only overlay)
   │       - Create /app/.agent (tmpfs for agent writes)
   │       - Mount proxy socket at /secrets/proxy.sock
   │
   ├─► 3e. Initialize Container
   │       POST /init {
   │           agentId,
   │           sdkProfile,
   │           sessionId (for resumption),
   │           taskPrompt,
   │           systemPrompt,
   │           workdir
   │       }
   │
   ├─► 3f. Execute Runner
   │       GET /execute/stream?runner=claude-runner.ts
   │       │
   │       ├─► Runner starts SDK
   │       ├─► Agent executes tools
   │       ├─► Streams progress via SSE
   │       └─► Outputs result JSON + session ID
   │
   ├─► 3g. Parse Result
   │       - Extract structured result from markers
   │       - Capture new session ID for persistence
   │       - Collect modified files
   │
   └─► 3h. Release Container
           - Reset state for recycling
           - Or destroy if unhealthy
   │
   ▼
4. Merge results across all SubPRDs
   │
   ▼
5. Return OrchestrationResult via GraphQL
```

---

## 4. Runtime Profile System

### 4.1 SDK Profile Type Definition

```typescript
// server/src/container/sdk-profiles.ts

export type SDKType =
    | 'claude-agent-sdk'
    | 'openai-agents-sdk'
    | 'google-adk'
    | 'minimax'
    | 'raw';

export interface SDKProfile {
    /** SDK type determines the runner script */
    type: SDKType;

    /** Model identifier (SDK-specific) */
    model: string;

    /** Temperature (0.0 - 2.0) */
    temperature?: number;

    /** Maximum tokens to generate */
    maxTokens?: number;

    /** Maximum agentic turns before stopping */
    maxTurns?: number;

    /** Allowed tools (SDK-specific names) */
    allowedTools?: string[];

    /** System prompt override */
    systemPrompt?: string;

    /** API key name (resolved from secrets) */
    apiKeySecret?: string;

    /** Additional SDK-specific options */
    sdkOptions?: Record<string, unknown>;
}

export const DEFAULT_PROFILES: Record<string, SDKProfile> = {
    'claude-default': {
        type: 'claude-agent-sdk',
        model: 'claude-sonnet-4-5',
        temperature: 0.7,
        maxTurns: 50,
        allowedTools: ['Read', 'Edit', 'Write', 'Bash', 'Glob', 'Grep'],
        apiKeySecret: 'ANTHROPIC_API_KEY',
    },
    'openai-default': {
        type: 'openai-agents-sdk',
        model: 'gpt-4o',
        temperature: 0.7,
        maxTurns: 30,
        allowedTools: ['read_file', 'write_file', 'run_command'],
        apiKeySecret: 'OPENAI_API_KEY',
    },
    'gemini-default': {
        type: 'google-adk',
        model: 'gemini-2.0-flash',
        temperature: 0.7,
        maxTurns: 30,
        allowedTools: ['read_file', 'write_file', 'shell'],
        apiKeySecret: 'GOOGLE_API_KEY',
    },
    'minimax-default': {
        type: 'minimax',
        model: 'abab6.5s-chat',
        temperature: 0.7,
        maxTurns: 30,
        apiKeySecret: 'MINIMAX_API_KEY',
    },
};
```

### 4.2 Profile Resolution

```typescript
// server/src/container/profile-resolver.ts

export function resolveProfile(
    specialistId: string,
    userOverride?: Partial<SDKProfile>
): SDKProfile {
    // Step 1: Get specialist's default SDK preference
    const specialist = getSpecialist(specialistId);
    const baseProfile = specialist.preferredSDK
        ? DEFAULT_PROFILES[specialist.preferredSDK]
        : DEFAULT_PROFILES['claude-default'];

    // Step 2: Apply user overrides
    const resolved: SDKProfile = {
        ...baseProfile,
        ...userOverride,
        sdkOptions: {
            ...baseProfile.sdkOptions,
            ...userOverride?.sdkOptions,
        },
    };

    // Step 3: Validate
    validateProfile(resolved);

    return resolved;
}

export function getRunnerScript(profile: SDKProfile): string {
    switch (profile.type) {
        case 'claude-agent-sdk':
            return '/opt/liquid-runtime/runners/claude-runner.ts';
        case 'openai-agents-sdk':
            return '/opt/liquid-runtime/runners/bridge-runner.ts';
        case 'google-adk':
            return '/opt/liquid-runtime/runners/adk-runner.ts';
        case 'minimax':
            return '/opt/liquid-runtime/runners/bridge-runner.ts';
        case 'raw':
        default:
            return '/opt/liquid-runtime/runners/raw-runner.ts';
    }
}
```

### 4.3 GraphQL Schema Extension

```graphql
# server/src/graphql/schema.ts (additions)

"""SDK type for agent execution"""
enum SDKType {
    CLAUDE_AGENT_SDK
    OPENAI_AGENTS_SDK
    GOOGLE_ADK
    MINIMAX
    RAW
}

"""Configuration for SDK-based agent execution"""
input SDKProfileInput {
    """SDK type determines runner script"""
    type: SDKType!

    """Model identifier"""
    model: String

    """Temperature (0.0 - 2.0)"""
    temperature: Float

    """Maximum tokens"""
    maxTokens: Int

    """Maximum agent turns"""
    maxTurns: Int

    """Allowed tools"""
    allowedTools: [String!]

    """System prompt override"""
    systemPrompt: String
}

extend type Mutation {
    """Execute orchestration session with specific SDK profile"""
    executeOrchestrationSession(
        sessionId: ID!
        sdkProfile: SDKProfileInput
    ): OrchestrationSessionSummary!
}
```

---

## 5. Session Management

### 5.1 Session Persistence Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SESSION STORE (Redis/SQLite)                        │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │  Key: liquid:session:{sessionId}                                        ││
│  │  Value: {                                                               ││
│  │      sdkSessionId: "claude-session-xyz",  // SDK's internal session ID  ││
│  │      sdkType: "claude-agent-sdk",                                       ││
│  │      createdAt: 1704825600000,                                          ││
│  │      lastAccessedAt: 1704829200000,                                     ││
│  │      containerId: "abc123",               // Last container used        ││
│  │      conversationTurns: 15,                                             ││
│  │      modifiedFiles: ["src/app.tsx"],                                    ││
│  │      checkpoints: [...]                   // File checkpoints           ││
│  │  }                                                                      ││
│  │  TTL: 24 hours                                                          ││
│  └────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Session Flow

```typescript
// server/src/container/session-manager.ts

export interface AgentSession {
    /** LiquidCrypto session ID */
    id: string;

    /** SDK's internal session ID (for resumption) */
    sdkSessionId?: string;

    /** SDK type used */
    sdkType: SDKType;

    /** Orchestration session this belongs to */
    orchestrationSessionId: string;

    /** SubPRD this session is for */
    subPrdId: string;

    /** Agent specialist ID */
    agentId: string;

    /** Creation timestamp */
    createdAt: number;

    /** Last access timestamp */
    lastAccessedAt: number;

    /** Files modified during session */
    modifiedFiles: string[];

    /** File checkpoints for rollback */
    checkpoints: FileCheckpoint[];
}

export class SessionManager {
    private store: SessionStore; // Redis or SQLite

    /**
     * Create or resume an agent session
     */
    async getOrCreateSession(
        orchestrationSessionId: string,
        subPrdId: string,
        agentId: string,
        sdkType: SDKType
    ): Promise<AgentSession> {
        const sessionKey = `${orchestrationSessionId}:${subPrdId}:${agentId}`;

        // Try to find existing session
        const existing = await this.store.get(sessionKey);
        if (existing) {
            existing.lastAccessedAt = Date.now();
            await this.store.set(sessionKey, existing);
            return existing;
        }

        // Create new session
        const session: AgentSession = {
            id: generateSessionId(),
            sdkType,
            orchestrationSessionId,
            subPrdId,
            agentId,
            createdAt: Date.now(),
            lastAccessedAt: Date.now(),
            modifiedFiles: [],
            checkpoints: [],
        };

        await this.store.set(sessionKey, session, { ttl: 24 * 60 * 60 * 1000 });
        return session;
    }

    /**
     * Update session with SDK's session ID after first response
     */
    async updateSdkSessionId(sessionId: string, sdkSessionId: string): Promise<void> {
        const session = await this.store.get(sessionId);
        if (session) {
            session.sdkSessionId = sdkSessionId;
            await this.store.set(sessionId, session);
        }
    }

    /**
     * Add checkpoint before file modification
     */
    async createCheckpoint(sessionId: string, filePath: string, content: string): Promise<void> {
        const session = await this.store.get(sessionId);
        if (session) {
            session.checkpoints.push({
                filePath,
                content,
                timestamp: Date.now(),
            });
            session.modifiedFiles = [...new Set([...session.modifiedFiles, filePath])];
            await this.store.set(sessionId, session);
        }
    }

    /**
     * Rollback to checkpoint
     */
    async rollbackToCheckpoint(sessionId: string, timestamp: number): Promise<void> {
        const session = await this.store.get(sessionId);
        if (!session) return;

        // Find checkpoints after timestamp and restore
        const toRestore = session.checkpoints
            .filter(cp => cp.timestamp >= timestamp)
            .reverse(); // Restore in reverse order

        for (const checkpoint of toRestore) {
            await writeFile(checkpoint.filePath, checkpoint.content);
        }

        // Remove rolled-back checkpoints
        session.checkpoints = session.checkpoints.filter(cp => cp.timestamp < timestamp);
        await this.store.set(sessionId, session);
    }
}
```

### 5.3 Claude Agent SDK Session Resumption

The Claude Agent SDK provides native session management. When resuming:

```typescript
// Inside container - claude-runner.ts

const sessionId = process.env.LIQUID_SDK_SESSION_ID;

const response = query({
    prompt: process.env.LIQUID_TASK_PROMPT,
    options: {
        model: process.env.LIQUID_SDK_MODEL,
        resume: sessionId, // Resume previous session if provided
        forkSession: false, // Continue same session, don't fork
    }
});

for await (const message of response) {
    // Capture new session ID for persistence
    if (message.type === 'system' && message.subtype === 'init') {
        // Output session ID for orchestrator to capture
        console.log(`LIQUID_SDK_SESSION_ID:${message.session_id}`);
    }

    // Forward all other messages
    console.log(JSON.stringify(message));
}
```

---

## 6. Project Mount Strategy

### 6.1 Mount Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         HOST FILESYSTEM                                      │
│  /Users/mario/projects/LiquidCrypto/                                        │
│  ├── src/                                                                   │
│  ├── server/                                                                │
│  ├── package.json                                                           │
│  └── ...                                                                    │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │     OVERLAY FILESYSTEM        │
                    │   (Lower: host, Upper: tmpfs) │
                    └───────────────┬───────────────┘
                                    │
┌───────────────────────────────────▼─────────────────────────────────────────┐
│                        CONTAINER VIEW                                        │
│  /app/                           ← Merged view (overlay)                     │
│  ├── src/                        ← Read from host                            │
│  ├── server/                     ← Read from host                            │
│  ├── package.json                ← Read from host                            │
│  ├── src/new-file.tsx            ← Written to overlay upper                  │
│  └── .agent/                     ← tmpfs for agent scratch space             │
│                                                                              │
│  /app/.agent/                    ← Agent working directory                   │
│  ├── agent.ts                    ← Injected agent script                     │
│  ├── output/                     ← Agent outputs                             │
│  └── temp/                       ← Temporary files                           │
│                                                                              │
│  /secrets/                       ← tmpfs, never persisted                    │
│  └── proxy.sock                  ← Unix socket to credential proxy           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Mount Configuration

```typescript
// server/src/container/mounts.ts

export interface MountConfig {
    /** Project root path on host */
    projectPath: string;

    /** Whether agents can write to project files */
    projectWritable: boolean;

    /** Paths to exclude from project mount */
    excludePaths: string[];

    /** Size limit for overlay upper (tmpfs) */
    overlaySize: string;
}

export function createContainerMounts(config: MountConfig): DockerMountConfig[] {
    const mounts: DockerMountConfig[] = [];

    if (config.projectWritable) {
        // Use overlay filesystem for copy-on-write
        mounts.push({
            type: 'volume',
            source: `overlay-${Date.now()}`,
            target: '/app',
            driver: 'local',
            driverOpts: {
                type: 'overlay',
                o: `lowerdir=${config.projectPath},upperdir=/tmp/overlay-upper,workdir=/tmp/overlay-work`,
                device: 'overlay',
            },
        });
    } else {
        // Read-only bind mount
        mounts.push({
            type: 'bind',
            source: config.projectPath,
            target: '/app',
            readOnly: true,
        });
    }

    // Agent scratch space (always writable)
    mounts.push({
        type: 'tmpfs',
        target: '/app/.agent',
        tmpfsSize: config.overlaySize,
    });

    // Secrets directory (tmpfs, never persisted)
    mounts.push({
        type: 'tmpfs',
        target: '/secrets',
        tmpfsSize: '1m',
        tmpfsMode: '0700',
    });

    return mounts;
}
```

### 6.3 Alternative: Docker Sandbox Integration

Docker Desktop 4.50+ provides native sandbox support with bind mounts:

```bash
# Using Docker Sandbox (if available)
docker sandbox run claude-code \
    --mount type=bind,source=/path/to/project,target=/app \
    --mount type=tmpfs,target=/app/.agent
```

For environments without Docker Sandbox, we fall back to manual overlay configuration.

---

## 7. Security Enhancements

### 7.1 Credential Proxy Architecture

Instead of passing API keys via environment variables, use a proxy socket:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              HOST                                            │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │                    CREDENTIAL PROXY                                     ││
│  │  Listens: /var/run/liquid-proxy.sock                                   ││
│  │                                                                         ││
│  │  1. Receives HTTP request from container                                ││
│  │  2. Inspects request (domain allowlist)                                 ││
│  │  3. Injects credentials based on target:                                ││
│  │     - api.anthropic.com → X-Api-Key: $ANTHROPIC_API_KEY                ││
│  │     - api.openai.com → Authorization: Bearer $OPENAI_API_KEY           ││
│  │     - api.google.com → Authorization: Bearer $GOOGLE_API_KEY           ││
│  │  4. Forwards to destination                                             ││
│  │  5. Returns response to container                                       ││
│  │                                                                         ││
│  │  Audit: Logs all requests for security monitoring                       ││
│  └────────────────────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Unix Socket
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CONTAINER                                          │
│  /secrets/proxy.sock ← Mounted socket                                        │
│                                                                              │
│  Agent makes HTTP request:                                                   │
│    fetch('http://unix:/secrets/proxy.sock:/https/api.anthropic.com/...')    │
│                                                                              │
│  Container NEVER sees actual API keys                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Proxy Implementation

```typescript
// server/src/container/credential-proxy.ts

import { createServer, Server } from 'net';
import { createSecureServer } from 'http2';
import { parse } from 'url';

interface ProxyConfig {
    /** Path to Unix socket */
    socketPath: string;

    /** Allowed destination domains */
    allowedDomains: string[];

    /** Credential mappings: domain → header → secret name */
    credentials: Record<string, { header: string; secret: string }>;

    /** Secrets provider */
    secretsProvider: SecretsProvider;
}

export class CredentialProxy {
    private server: Server;
    private config: ProxyConfig;

    constructor(config: ProxyConfig) {
        this.config = config;
    }

    async start(): Promise<void> {
        this.server = createServer(async (socket) => {
            // Parse HTTP request from socket
            const request = await this.parseRequest(socket);

            // Extract target URL
            const targetUrl = this.extractTargetUrl(request);
            const { hostname } = parse(targetUrl);

            // Validate domain
            if (!this.config.allowedDomains.includes(hostname!)) {
                this.sendError(socket, 403, `Domain not allowed: ${hostname}`);
                return;
            }

            // Inject credentials
            const headers = { ...request.headers };
            const credConfig = this.config.credentials[hostname!];
            if (credConfig) {
                const secret = await this.config.secretsProvider.getSecret(credConfig.secret);
                headers[credConfig.header] = this.formatCredential(credConfig.header, secret);
            }

            // Forward request
            const response = await this.forwardRequest(targetUrl, {
                method: request.method,
                headers,
                body: request.body,
            });

            // Return response
            this.sendResponse(socket, response);

            // Audit log
            this.logRequest(request, response, hostname!);
        });

        // Listen on Unix socket
        this.server.listen(this.config.socketPath);
    }

    private formatCredential(header: string, secret: string): string {
        switch (header.toLowerCase()) {
            case 'x-api-key':
                return secret;
            case 'authorization':
                return `Bearer ${secret}`;
            default:
                return secret;
        }
    }
}
```

### 7.3 Container SDK Configuration

SDKs need to be configured to use the proxy:

```typescript
// Inside container - sdk-setup.ts

// For Claude Agent SDK
process.env.ANTHROPIC_BASE_URL = 'http://unix:/secrets/proxy.sock:/https/api.anthropic.com';

// For OpenAI SDK
process.env.OPENAI_BASE_URL = 'http://unix:/secrets/proxy.sock:/https/api.openai.com';

// For Google ADK (uses different mechanism)
// Configure HTTP proxy for all outbound requests
process.env.HTTP_PROXY = 'http://unix:/secrets/proxy.sock';
process.env.HTTPS_PROXY = 'http://unix:/secrets/proxy.sock';
```

### 7.4 Security Layers Summary

| Layer | Protection | Implementation |
|-------|------------|----------------|
| **Network** | Domain allowlist | Proxy blocks non-allowed domains |
| **Credentials** | Never in container | Proxy injects after validation |
| **Filesystem** | Read-only base | Overlay for writes, tmpfs for scratch |
| **Process** | Non-root user | `USER agent` in Dockerfile |
| **Resources** | CPU/Memory/PID limits | Docker cgroups |
| **Audit** | Request logging | Proxy logs all API calls |

---

## 8. Implementation Phases

> **All phases have been implemented as of January 2026.**

### Phase 1: SDK Profile System ✅ COMPLETE

**Goal:** Enable specifying which SDK to use for agent execution.

**Implemented Files:**
- [x] `server/src/container/smart-defaults.ts` - SDK type definitions, cost estimates, capabilities
- [x] `server/src/container/sdk-intelligence.ts` - Task analysis and SDK selection
- [x] `server/src/routes/container.ts` - API endpoints for SDK info
- [x] `server/src/container/runners/` - Runner scripts

### Phase 2: Session Management ✅ COMPLETE

**Goal:** Enable session persistence and resumption across container recycling.

**Implemented Files:**
- [x] `server/src/container/executor.ts` - Session handling in executor
- [x] `server/src/container/runners/claude-runner.ts` - Session resumption support

### Phase 3: Project Mount Strategy ✅ COMPLETE

**Goal:** Give agents access to project code via overlay filesystem.

**Implemented Files:**
- [x] `server/src/container/pool.ts` - Mount configuration
- [x] `server/container/Dockerfile` - Mount points configured

### Phase 4: Credential Proxy ✅ COMPLETE

**Goal:** Implement proxy-based credential injection for security.

**Implemented Files:**
- [x] `server/src/container/security-auto.ts` - Security configuration including credential proxy
- [x] `server/src/container/api-key-detection.ts` - API key detection and validation

### Phase 5: Orchestrator Integration ✅ COMPLETE

**Goal:** Replace mock `executeAgent()` with real container execution.

**Implemented Files:**
- [x] `server/src/container/executor.ts` - SDK Intelligence integration
- [x] `server/src/routes/container.ts` - API endpoints for task analysis

### Phase 6: Runner Scripts ✅ COMPLETE

**Goal:** Implement SDK-specific runner scripts.

**Implemented Files:**
- [x] `server/src/container/runners/claude-runner.ts` - Claude Agent SDK runner
- [x] `server/src/container/runners/gemini-cli-runner.ts` - Gemini CLI runner
- [x] `server/src/container/runners/index.ts` - Runner exports

### Phase 7: Testing & Documentation ✅ COMPLETE

**Goal:** Comprehensive testing and documentation.

**Implemented Files:**
- [x] `CLAUDE.md` - Phase 8: SDK Intelligence System documentation
- [x] `docs/LIQUID_CONTAINER_SDK_IMPLEMENTATION_PLAN.md` - Updated with completion status
- [x] `docs/LIQUID_CONTAINER_COMPLETE_IMPLEMENTATION_PLAN.md` - Updated with completion status

---

## 9. File Structure

```
server/
├── src/
│   ├── container/
│   │   ├── index.ts                    # Existing - exports
│   │   ├── types.ts                    # Existing - types
│   │   ├── config.ts                   # Existing - configuration
│   │   ├── pool.ts                     # Existing - pool manager
│   │   ├── scheduler.ts                # Existing - load balancing
│   │   ├── client.ts                   # Existing - runtime client
│   │   ├── executor.ts                 # Existing - orchestrator bridge
│   │   ├── secrets.ts                  # Existing - secrets providers
│   │   ├── metrics.ts                  # Existing - telemetry
│   │   │
│   │   ├── sdk-profiles.ts             # NEW - SDK profile definitions
│   │   ├── profile-resolver.ts         # NEW - Profile resolution
│   │   ├── session-manager.ts          # NEW - Session persistence
│   │   ├── session-store.ts            # NEW - Storage backend
│   │   ├── mounts.ts                   # NEW - Mount configuration
│   │   ├── credential-proxy.ts         # NEW - Proxy server
│   │   ├── proxy-config.ts             # NEW - Proxy configuration
│   │   │
│   │   └── remote/
│   │       └── ssh-tunnel.ts           # Existing
│   │
│   ├── orchestrator/
│   │   ├── index.ts                    # UPDATE - Wire to executor
│   │   ├── types.ts                    # Existing
│   │   ├── decompose.ts                # Existing
│   │   └── specialists.ts              # UPDATE - Add SDK preferences
│   │
│   └── graphql/
│       ├── schema.ts                   # UPDATE - Add SDKProfileInput
│       └── resolvers.ts                # UPDATE - Progress streaming
│
├── container/
│   ├── Dockerfile.base                 # Existing
│   ├── Dockerfile                      # UPDATE - Add runner scripts
│   ├── build.sh                        # Existing
│   │
│   └── runtime-server/
│       ├── package.json                # UPDATE - Add SDK dependencies
│       ├── server.ts                   # Existing
│       │
│       └── runners/                    # NEW DIRECTORY
│           ├── index.ts                # Runner exports
│           ├── claude-runner.ts        # Claude Agent SDK
│           ├── bridge-runner.ts        # OpenAI/MiniMax
│           ├── adk-runner.ts           # Google ADK
│           └── raw-runner.ts           # Direct execution
│
├── scripts/
│   └── setup-remote-host.sh            # Existing
│
└── tests/
    ├── unit/
    │   ├── container-pool.test.ts      # Existing
    │   ├── sdk-profiles.test.ts        # NEW
    │   ├── session-manager.test.ts     # NEW
    │   └── credential-proxy.test.ts    # NEW
    │
    └── integration/
        └── container-sdk.test.ts       # NEW

docs/
├── LIQUID_CONTAINER_ARCHITECTURE.md    # Existing - UPDATE
├── CONTAINER_DEPLOYMENT_GUIDE.md       # Existing
└── CONTAINER_SDK_GUIDE.md              # NEW - SDK integration guide
```

---

## 10. Testing Strategy

### 10.1 Unit Tests

| Test File | Coverage |
|-----------|----------|
| `sdk-profiles.test.ts` | Profile resolution, validation, defaults |
| `session-manager.test.ts` | CRUD operations, TTL, checkpoints |
| `credential-proxy.test.ts` | Domain filtering, credential injection |
| `mounts.test.ts` | Mount configuration, overlay setup |
| `profile-resolver.test.ts` | Specialist mapping, override merging |

### 10.2 Integration Tests

```typescript
// tests/integration/container-sdk.test.ts

describe('Container SDK Integration', () => {
    describe('Claude Agent SDK', () => {
        it('should execute agent with session resumption', async () => {
            // First execution
            const result1 = await executeWithProfile({
                type: 'claude-agent-sdk',
                model: 'claude-sonnet-4-5',
            }, { prompt: 'Create a file hello.txt' });

            expect(result1.success).toBe(true);
            expect(result1.sessionId).toBeDefined();

            // Resume session
            const result2 = await executeWithProfile({
                type: 'claude-agent-sdk',
                model: 'claude-sonnet-4-5',
            }, {
                prompt: 'Add content to hello.txt',
                resumeSessionId: result1.sessionId,
            });

            expect(result2.success).toBe(true);
            // Should remember context from first execution
        });
    });

    describe('OpenAI Agents SDK', () => {
        it('should execute function tools locally', async () => {
            const result = await executeWithProfile({
                type: 'openai-agents-sdk',
                model: 'gpt-4o',
            }, { prompt: 'Read the package.json file' });

            expect(result.success).toBe(true);
            expect(result.toolsExecuted).toContain('read_file');
        });
    });

    describe('Google ADK', () => {
        it('should run event-driven agent loop', async () => {
            const events: any[] = [];

            await executeWithProfile({
                type: 'google-adk',
                model: 'gemini-2.0-flash',
            }, {
                prompt: 'List files in current directory',
                onEvent: (event) => events.push(event),
            });

            expect(events.some(e => e.type === 'tool_call')).toBe(true);
            expect(events.some(e => e.type === 'agent_response')).toBe(true);
        });
    });

    describe('Cross-SDK', () => {
        it('should maintain project isolation between SDKs', async () => {
            // Execute Claude agent
            await executeWithProfile({
                type: 'claude-agent-sdk',
                model: 'claude-sonnet-4-5',
            }, { prompt: 'Create test-claude.txt' });

            // Execute OpenAI agent in same project
            await executeWithProfile({
                type: 'openai-agents-sdk',
                model: 'gpt-4o',
            }, { prompt: 'Create test-openai.txt' });

            // Both files should exist in project
            expect(await fileExists('test-claude.txt')).toBe(true);
            expect(await fileExists('test-openai.txt')).toBe(true);
        });
    });
});
```

### 10.3 Performance Benchmarks

| Metric | Target | Measurement |
|--------|--------|-------------|
| Warm pool acquire | < 100ms | Time from `acquire()` call to container ready |
| Cold start | < 5s | Time from pool empty to container ready |
| Session resume | < 500ms | Time to load session state and initialize SDK |
| Proxy latency | < 50ms | Overhead added by credential proxy |
| Overlay mount | < 100ms | Time to set up overlay filesystem |

### 10.4 Security Tests

```typescript
describe('Security', () => {
    it('should block non-allowed domains', async () => {
        await expect(
            executeInContainer('curl https://evil.com')
        ).rejects.toThrow('Domain not allowed');
    });

    it('should not expose credentials in container', async () => {
        const result = await executeInContainer('env | grep API_KEY');
        expect(result.stdout).not.toContain('sk-');
        expect(result.stdout).not.toContain('anthropic');
    });

    it('should prevent writes to host filesystem', async () => {
        await expect(
            executeInContainer('rm -rf /app/package.json')
        ).rejects.toThrow(); // Read-only filesystem
    });

    it('should enforce resource limits', async () => {
        // Fork bomb should be killed by PID limit
        await expect(
            executeInContainer(':(){ :|:& };:')
        ).rejects.toThrow('Resource limit exceeded');
    });
});
```

---

## 11. Migration Path

### 11.1 Backward Compatibility

The existing system continues to work unchanged:

1. **Mock execution** remains default until containers are configured
2. **GraphQL API** is additive - new fields don't break existing queries
3. **Configuration** is optional - system works without SDK profiles

### 11.2 Gradual Rollout

```typescript
// Feature flag in config
export const CONTAINER_EXECUTION_ENABLED =
    process.env.LIQUID_CONTAINER_EXECUTION === 'true';

// In orchestrator
async function executeAgent(subPrd: SubPRD): Promise<AgentWorkResult> {
    if (CONTAINER_EXECUTION_ENABLED && containerPool.isAvailable()) {
        return containerExecutor.executeAgent(subPrd);
    }

    // Fall back to mock execution
    return mockExecuteAgent(subPrd);
}
```

### 11.3 Migration Steps

1. **Week 1:** Deploy SDK profile system (no behavior change)
2. **Week 2:** Deploy session management (no behavior change)
3. **Week 3:** Deploy project mounts (no behavior change)
4. **Week 4:** Deploy credential proxy (no behavior change)
5. **Week 5:** Enable container execution for internal testing
6. **Week 6:** Gradual rollout to production (10% → 50% → 100%)

---

## Appendix A: Environment Variables

```bash
# Feature Flags
LIQUID_CONTAINER_EXECUTION=true       # Enable real container execution

# SDK Defaults
LIQUID_DEFAULT_SDK=claude-agent-sdk   # Default SDK type
LIQUID_DEFAULT_MODEL=claude-sonnet-4-5 # Default model

# Session Store
LIQUID_SESSION_STORE=redis            # redis | sqlite | memory
LIQUID_SESSION_TTL=86400000           # 24 hours in ms
REDIS_URL=redis://localhost:6379      # Redis connection

# Project Mounts
LIQUID_PROJECT_PATH=/path/to/project  # Project root to mount
LIQUID_PROJECT_WRITABLE=true          # Allow agent writes
LIQUID_OVERLAY_SIZE=1G                # Overlay tmpfs size

# Credential Proxy
LIQUID_PROXY_SOCKET=/var/run/liquid-proxy.sock
LIQUID_ALLOWED_DOMAINS=api.anthropic.com,api.openai.com,api.google.com

# API Keys (for proxy injection)
ANTHROPIC_API_KEY=sk-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...
MINIMAX_API_KEY=...
```

---

## Appendix B: Specialist → SDK Mapping

| Specialist | Default SDK | Rationale |
|------------|-------------|-----------|
| `ui-specialist` | `claude-agent-sdk` | Best at React/UI code |
| `api-specialist` | `claude-agent-sdk` | Strong at TypeScript |
| `security-specialist` | `claude-agent-sdk` | Careful reasoning |
| `test-specialist` | `openai-agents-sdk` | Fast iteration |
| `general-agent` | `claude-agent-sdk` | Default |

Users can override via GraphQL:

```graphql
mutation {
    executeOrchestrationSession(
        sessionId: "session-123"
        sdkProfile: {
            type: OPENAI_AGENTS_SDK
            model: "gpt-4o"
            temperature: 0.5
        }
    ) {
        id
        status
    }
}
```

---

## Appendix C: Runner Script Output Protocol

All runner scripts must output in a consistent format:

```
# Session ID (captured by orchestrator)
LIQUID_SDK_SESSION_ID:claude-session-xyz

# Progress messages (streamed via SSE)
{"type":"progress","message":"Reading file...","timestamp":1704825600}
{"type":"tool_call","tool":"read_file","args":{"path":"src/app.tsx"}}
{"type":"tool_result","tool":"read_file","result":"...content..."}

# Final result (parsed by orchestrator)
---RESULT_START---
{
    "success": true,
    "modifiedFiles": ["src/app.tsx", "src/new-component.tsx"],
    "commits": [],
    "errors": [],
    "duration": 15234
}
---RESULT_END---
```

---

## Appendix D: Cost Estimation

| SDK | Cost per 1000 tokens (input) | Cost per 1000 tokens (output) |
|-----|------------------------------|-------------------------------|
| Claude Sonnet 4.5 | $0.003 | $0.015 |
| Claude Opus 4.5 | $0.015 | $0.075 |
| GPT-4o | $0.005 | $0.015 |
| Gemini 2.0 Flash | $0.00015 | $0.0006 |
| MiniMax M2.1 | ~$0.001 | ~$0.002 |

**Container costs:**
- Warm container idle: ~$0.005/hour
- Active container: ~$0.02/hour
- Remote (Hetzner CX22): ~$0.006/hour

---

## Summary

This implementation plan transforms LiquidContainer from a generic executor into a **universal AI agent runtime** with:

1. **Multi-SDK Support:** Claude, OpenAI, Google ADK, MiniMax
2. **Session Persistence:** Continue conversations across container recycling
3. **Secure Credentials:** Proxy-based injection, never exposed in containers
4. **Project Access:** Read-only overlay mounts with isolated writes
5. **Production Ready:** Full observability, security hardening, migration path

**Total Implementation Estimate:** 20-25 days across 7 phases

**Dependencies:**
- Claude Agent SDK (npm: `@anthropic-ai/claude-agent-sdk`)
- OpenAI Agents SDK (npm: `openai-agents`)
- Google ADK (npm: `@google/adk`)
- Redis (for session storage)
- Docker Desktop 4.50+ (for sandbox support, optional)

**Next Steps:**
1. Review and approve this plan
2. Begin Phase 1: SDK Profile System
3. Set up development environment with all SDKs
