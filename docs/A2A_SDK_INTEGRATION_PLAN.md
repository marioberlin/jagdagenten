# A2A-SDK Integration Plan

> **Status:** ✅ COMPLETE (January 16, 2026)
> **Created:** January 2026
> **Updated:** January 16, 2026 (v1.0 SDK migration complete, A2UI fully implemented)
> **Decisions:** Copy to monorepo, PostgreSQL, gRPC enabled, A2UI extensions, Orchestrator migration, v1.0 compliance, Artifact system

## Latest Update (January 16, 2026)

The A2A SDK has been fully migrated to v1.0 compliance:

- ✅ **v1.0 Types**: All types use camelCase (`messageId`, `contextId`, `artifactId`)
- ✅ **JSON-RPC Methods**: PascalCase methods (`SendMessage`, `GetTask`, `CancelTask`)
- ✅ **Task States**: Kebab-case for multi-word states (`input-required`, `auth-required`)
- ✅ **Server Adapters**: Express, Fastify updated with backward-compatible method routing
- ✅ **A2UI Integration**: Full implementation with 50+ component types and builder helpers
- ✅ **Database Adapters**: PostgreSQL, MySQL, SQLite with v1.0 types
- ✅ **Telemetry**: OpenTelemetry integration with dynamic loading

See `a2a-sdk/README.md` for complete API documentation and `a2a-sdk/MIGRATION.md` for migration guide.

---

## Executive Summary

This plan integrated the external `a2a-sdk` into LiquidCrypto providing:
- **A2A v1.0 Protocol Compliance** for interoperability ✅
- **Production persistence** via PostgreSQL ✅
- **Comprehensive Artifact Management** for agent outputs ✅
- **High-performance transport** via gRPC ✅
- **Full observability** via OpenTelemetry ✅
- **Trading-specific A2UI** components ✅
- **Unified agent communication** via A2A protocol ✅

### Timeline Overview

| Phase | Name | Scope | Status |
|-------|------|-------|--------|
| 0 | SDK Setup | Copy SDK, configure monorepo | ✅ Complete |
| 0.1 | v1.0 Migration | Migrate SDK types to A2A v1.0 spec | ✅ Complete |
| 1 | Foundation | Elysia adapter, basic routing | ✅ Complete |
| 1.5 | SDK Analysis | Verify SDK completeness | ✅ Complete |
| 2 | Client Migration | Frontend SDK client | ✅ Complete |
| 2.5 | v1.0 Server Methods | Complete server method set | ✅ Complete |
| 2.6 | Critical Fixes | Heartbeat leak, type safety | ✅ Complete |
| 3 | PostgreSQL | Database persistence | ✅ Complete |
| 3.5a | Artifact Backend | API routes, versioning | ✅ Complete |
| 3.5b | Artifact Frontend | UI components, store | ✅ Complete |
| 4 | Telemetry | OpenTelemetry integration | ✅ Complete |
| 5 | gRPC | High-performance transport | ✅ Complete |
| 6 | A2UI Extensions | Trading components | ✅ Complete |
| 7 | Orchestrator | Multi-agent via A2A | ✅ Complete |
| 8 | Cleanup | Remove deprecated, document | ✅ Complete |

---

## A2A v1.0 Compatibility Analysis

### Current State Assessment

The external `a2a-sdk` is based on **A2A v0.x draft**, not the final v1.0 specification. Key differences:

| Category | SDK (v0.x) | v1.0 Spec | Impact |
|----------|------------|-----------|--------|
| **Naming** | `snake_case` (`context_id`) | `camelCase` (`contextId`) | HIGH |
| **Part Discriminator** | `kind: 'text'` field | Union by member name | HIGH |
| **Method Names** | `message/send` | `SendMessage` (PascalCase) | HIGH |
| **Task Discriminator** | `kind: 'task'` | `"Task"` object type | MEDIUM |
| **AgentCard** | `capabilities.extensions[]` | `protocolVersions`, `supportedInterfaces` | MEDIUM |
| **Headers** | None | `A2A-Protocol-Version`, `A2A-Request-Id` | LOW |

### Recommendation: Hybrid Compatibility Layer

Create a compatibility layer that:
1. Accepts both v0.x and v1.0 formats at API boundary
2. Normalizes to internal v1.0-compliant format
3. Responds in format matching request version

---

## Phase 0: SDK Setup (Copy to Monorepo)

### Goal
Copy a2a-sdk into repository as `packages/a2a-sdk` and configure workspace.

### Directory Structure

```
LiquidCrypto/
├── packages/
│   └── a2a-sdk/                    # NEW: Copied from /a2a-sdk
│       ├── src/
│       │   ├── types/
│       │   ├── client/
│       │   ├── server/
│       │   ├── transports/
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
├── server/
│   └── src/
│       └── a2a/                    # Modified: Uses packages/a2a-sdk
├── src/
│   └── a2a/                        # Modified: Uses packages/a2a-sdk
└── package.json                    # Modified: Workspace configuration
```

### Tasks

| # | Task | Files | Notes |
|---|------|-------|-------|
| 0.1 | Create `packages/` directory | `packages/` | Monorepo structure |
| 0.2 | Copy a2a-sdk source | `packages/a2a-sdk/` | From `/a2a-sdk` |
| 0.3 | Update SDK package.json | `packages/a2a-sdk/package.json` | Name: `@liquidcrypto/a2a-sdk` |
| 0.4 | Configure workspace | `package.json` | Add workspaces array |
| 0.5 | Add workspace dependency | `server/package.json` | `@liquidcrypto/a2a-sdk: workspace:*` |
| 0.6 | Build SDK | `packages/a2a-sdk/` | `bun run build` |
| 0.7 | Verify imports work | Test file | Basic import test |

### Package.json Updates

**Root package.json:**
```json
{
  "workspaces": [
    "packages/*",
    "server"
  ]
}
```

**packages/a2a-sdk/package.json:**
```json
{
  "name": "@liquidcrypto/a2a-sdk",
  "version": "0.2.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts"
}
```

**server/package.json:**
```json
{
  "dependencies": {
    "@liquidcrypto/a2a-sdk": "workspace:*"
  }
}
```

### Verification

```typescript
// Test import works
import { A2AServer, ClientFactory, TaskState } from '@liquidcrypto/a2a-sdk';
console.log('SDK imported successfully');
```

---

## Phase 0.1: A2A v1.0 Migration

### Goal
Migrate the copied a2a-sdk types and methods to be fully compliant with A2A Protocol v1.0 specification.

### Type Migrations

#### 1. Part Type Discriminator Change

```typescript
// BEFORE (v0.x - packages/a2a-sdk/src/types/index.ts)
export interface TextPart extends PartBase {
  kind: 'text';
  text: string;
}

export interface FilePart extends PartBase {
  kind: 'file';
  file: FileContent;
}

export type Part = TextPart | FilePart | DataPart;

// AFTER (v1.0)
// Parts are discriminated by presence of member, not 'kind' field
export interface TextPart {
  text: string;
  metadata?: Record<string, JSONValue>;
}

export interface FilePart {
  file: FileContent;
  metadata?: Record<string, JSONValue>;
}

export interface DataPart {
  data: Record<string, JSONValue>;
  metadata?: Record<string, JSONValue>;
}

// Union uses member presence as discriminator
export type Part = TextPart | FilePart | DataPart;

// Type guards
export function isTextPart(part: Part): part is TextPart {
  return 'text' in part;
}

export function isFilePart(part: Part): part is FilePart {
  return 'file' in part;
}

export function isDataPart(part: Part): part is DataPart {
  return 'data' in part && !('text' in part) && !('file' in part);
}
```

#### 2. Naming Convention Migration

```typescript
// BEFORE (v0.x)
export interface Task {
  id: string;
  context_id: string;
  kind: 'task';
  status: TaskStatus;
  artifacts?: Artifact[];
  history?: Message[];
  metadata?: Record<string, JSONValue>;
}

export interface Artifact {
  artifact_id: string;
  name?: string;
  parts: Part[];
}

// AFTER (v1.0)
export interface Task {
  id: string;
  contextId: string;           // camelCase
  status: TaskStatus;
  artifacts?: Artifact[];
  history?: Message[];
  metadata?: Record<string, JSONValue>;
}

export interface Artifact {
  artifactId: string;          // camelCase
  name?: string;
  description?: string;
  parts: Part[];
  index?: number;              // NEW: For ordering
  append?: boolean;            // MOVED: From event to artifact
  lastChunk?: boolean;         // MOVED: From event to artifact
  metadata?: Record<string, JSONValue>;
  extensions?: string[];
}
```

#### 3. Method Name Migration

```typescript
// BEFORE (v0.x - JSON-RPC methods)
const METHODS = {
  SEND_MESSAGE: 'message/send',
  GET_TASK: 'tasks/get',
  CANCEL_TASK: 'tasks/cancel',
  GET_AGENT_CARD: 'agent/card'
};

// AFTER (v1.0 - PascalCase methods)
const METHODS = {
  SEND_MESSAGE: 'SendMessage',
  GET_TASK: 'GetTask',
  CANCEL_TASK: 'CancelTask',
  LIST_TASKS: 'ListTasks',         // NEW
  SET_TASK_PUSH_NOTIFICATION_CONFIG: 'SetTaskPushNotificationConfig',  // NEW
  GET_TASK_PUSH_NOTIFICATION_CONFIG: 'GetTaskPushNotificationConfig',  // NEW
  RESUBSCRIBE: 'Resubscribe'       // NEW
};
```

#### 4. AgentCard v1.0 Structure

```typescript
// AFTER (v1.0)
export interface AgentCard {
  // Required
  name: string;
  url: string;
  version: string;
  protocolVersions: string[];      // NEW: e.g., ["1.0"]

  // Optional
  description?: string;
  provider?: {
    organization: string;
    url?: string;
  };

  // Capabilities (restructured)
  capabilities?: {
    streaming?: boolean;
    pushNotifications?: boolean;
    stateTransitionHistory?: boolean;  // camelCase
    supportedInterfaces?: string[];    // NEW: URIs of supported interfaces
  };

  // Skills
  skills?: Skill[];

  // Authentication
  authentication?: AuthenticationInfo;

  // Security (NEW)
  securitySchemes?: Record<string, SecurityScheme>;
  security?: SecurityRequirement[];

  // Signature (NEW)
  agentCardSignature?: AgentCardSignature;
}

export interface AgentCardSignature {
  signature: string;
  publicKey: string;
  algorithm: 'ed25519' | 'secp256k1';
  timestamp: string;
}
```

### New Files

| File | Purpose | Lines (est.) |
|------|---------|--------------|
| `packages/a2a-sdk/src/types/v1.ts` | v1.0 type definitions | ~400 |
| `packages/a2a-sdk/src/compat/normalizer.ts` | v0.x ↔ v1.0 conversion | ~300 |
| `packages/a2a-sdk/src/compat/detector.ts` | Detect request version | ~50 |
| `packages/a2a-sdk/src/compat/index.ts` | Exports | ~20 |

### Compatibility Layer Implementation

```typescript
// packages/a2a-sdk/src/compat/normalizer.ts

import { Task as TaskV0, Part as PartV0, Artifact as ArtifactV0 } from '../types';
import { Task as TaskV1, Part as PartV1, Artifact as ArtifactV1 } from '../types/v1';

/**
 * Normalize v0.x Part to v1.0 format
 */
export function normalizePartToV1(part: PartV0): PartV1 {
  if (part.kind === 'text') {
    return { text: part.text, metadata: part.metadata };
  }
  if (part.kind === 'file') {
    return { file: part.file, metadata: part.metadata };
  }
  if (part.kind === 'data') {
    return { data: part.data, metadata: part.metadata };
  }
  // A2UI extension - keep as-is (extension handled separately)
  throw new Error(`Unknown part kind: ${(part as any).kind}`);
}

/**
 * Normalize v0.x Task to v1.0 format
 */
export function normalizeTaskToV1(task: TaskV0): TaskV1 {
  return {
    id: task.id,
    contextId: task.context_id,  // snake_case → camelCase
    status: normalizeStatusToV1(task.status),
    artifacts: task.artifacts?.map(normalizeArtifactToV1),
    history: task.history?.map(normalizeMessageToV1),
    metadata: task.metadata
  };
}

/**
 * Normalize v1.0 Part back to v0.x format (for legacy clients)
 */
export function normalizePartToV0(part: PartV1): PartV0 {
  if ('text' in part) {
    return { kind: 'text', text: part.text, metadata: part.metadata };
  }
  if ('file' in part) {
    return { kind: 'file', file: part.file, metadata: part.metadata };
  }
  if ('data' in part) {
    return { kind: 'data', data: part.data, metadata: part.metadata };
  }
  throw new Error('Unknown part type');
}

/**
 * Detect request version from headers or body
 */
export function detectRequestVersion(
  headers?: Record<string, string>,
  body?: any
): '0.x' | '1.0' {
  // Check header first
  const versionHeader = headers?.['a2a-protocol-version'] || headers?.['A2A-Protocol-Version'];
  if (versionHeader === '1.0') return '1.0';

  // Check body format
  if (body?.method) {
    // PascalCase method = v1.0
    if (body.method.match(/^[A-Z]/)) return '1.0';
    // lowercase/slashed method = v0.x
    if (body.method.includes('/')) return '0.x';
  }

  // Check part format
  if (body?.params?.message?.parts) {
    const firstPart = body.params.message.parts[0];
    if (firstPart && 'kind' in firstPart) return '0.x';
    if (firstPart && ('text' in firstPart || 'file' in firstPart || 'data' in firstPart)) return '1.0';
  }

  // Default to v1.0
  return '1.0';
}
```

### Method Router

```typescript
// packages/a2a-sdk/src/server/method-router.ts

const V0_TO_V1_METHODS: Record<string, string> = {
  'message/send': 'SendMessage',
  'tasks/get': 'GetTask',
  'tasks/cancel': 'CancelTask',
  'agent/card': 'GetAgentCard'  // Note: This one stays similar
};

const V1_TO_V0_METHODS: Record<string, string> = Object.fromEntries(
  Object.entries(V0_TO_V1_METHODS).map(([k, v]) => [v, k])
);

export function normalizeMethodName(method: string, targetVersion: '0.x' | '1.0'): string {
  if (targetVersion === '1.0') {
    return V0_TO_V1_METHODS[method] || method;
  }
  return V1_TO_V0_METHODS[method] || method;
}
```

### Request Handler Update

```typescript
// packages/a2a-sdk/src/server/request-handler.ts (modified)

import { detectRequestVersion, normalizeTaskToV1, normalizeTaskToV0 } from '../compat';

export class DefaultRequestHandler {
  async handleRequest(body: unknown, headers?: Record<string, string>): Promise<JsonRpcResponse> {
    const requestVersion = detectRequestVersion(headers, body);

    // Normalize request to v1.0 internally
    const normalizedRequest = requestVersion === '0.x'
      ? this.normalizeRequestToV1(body)
      : body;

    // Process with v1.0 logic
    const result = await this.processRequest(normalizedRequest);

    // Normalize response back to request version
    if (requestVersion === '0.x') {
      return this.normalizeResponseToV0(result);
    }

    return result;
  }
}
```

### Database Schema Update

The database stores in v1.0 format internally:

```sql
-- Updated column names
ALTER TABLE a2a_tasks RENAME COLUMN context_id TO contextId;
-- Or use a migration to handle both
```

### Verification Checklist

- [ ] v1.0 type definitions complete
- [ ] Part discriminator uses member presence, not `kind`
- [ ] All field names use camelCase
- [ ] Method names use PascalCase
- [ ] Compatibility layer normalizes v0.x → v1.0
- [ ] Compatibility layer can respond in v0.x format
- [ ] Version detection works from headers
- [ ] Version detection works from body format
- [ ] AgentCard includes `protocolVersions: ["1.0"]`
- [ ] All existing tests pass
- [ ] New tests cover compatibility layer

---

## Phase 1: Foundation (Elysia Adapter)

### Goal
Create adapter layer bridging a2a-sdk to Elysia without breaking existing functionality.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Elysia A2A Adapter                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Elysia Routes                    SDK Components                │
│  ─────────────                    ──────────────                │
│  POST /a2a         ──────────►   DefaultRequestHandler         │
│  POST /a2a/stream  ──────────►   EventQueue (SSE)              │
│  GET /.well-known  ──────────►   AgentCard                     │
│                                                                  │
│  Internal Components:                                           │
│  ├── TaskStore (InMemory → PostgreSQL in Phase 3)              │
│  ├── EventQueue (for streaming)                                 │
│  ├── AgentExecutors (business logic)                           │
│  └── TelemetryWrapper (Phase 4)                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### New Files

| File | Purpose | Lines (est.) |
|------|---------|--------------|
| `server/src/a2a/adapter/elysia-adapter.ts` | Main adapter class | ~250 |
| `server/src/a2a/adapter/request-context.ts` | Request context builder | ~50 |
| `server/src/a2a/adapter/index.ts` | Exports | ~20 |
| `server/src/a2a/executors/base.ts` | Base executor with A2UI support | ~100 |
| `server/src/a2a/executors/liquidcrypto.ts` | Main LiquidCrypto agent | ~200 |
| `server/src/a2a/executors/restaurant.ts` | Restaurant finder agent | ~150 |
| `server/src/a2a/executors/rizzcharts.ts` | RizzCharts agent | ~150 |
| `server/src/a2a/executors/index.ts` | Executor registry | ~50 |
| `server/src/a2a/types/a2ui-extension.ts` | A2UI type augmentation | ~100 |
| `server/src/a2a/index.ts` | Unified exports | ~30 |

### ElysiaA2AAdapter Interface

```typescript
// server/src/a2a/adapter/elysia-adapter.ts
import {
  DefaultRequestHandler,
  InMemoryTaskStore,
  InMemoryEventQueue,
  AgentExecutor,
  AgentCard,
  TaskStore,
  EventQueue
} from '@liquidcrypto/a2a-sdk';

export interface ElysiaAdapterConfig {
  agentCard: AgentCard;
  executor: AgentExecutor;
  taskStore?: TaskStore;
  eventQueue?: EventQueue;
  telemetry?: A2ATelemetryWrapper;
}

export class ElysiaA2AAdapter {
  private handler: DefaultRequestHandler;
  private taskStore: TaskStore;
  private eventQueue: EventQueue;

  constructor(config: ElysiaAdapterConfig);

  // Core methods
  async handleRequest(body: unknown): Promise<JsonRpcResponse>;
  async *handleStreamRequest(body: unknown): AsyncGenerator<string>;

  // Accessors
  getAgentCard(): AgentCard;
  getTaskStore(): TaskStore;
  getEventQueue(): EventQueue;

  // Lifecycle
  async initialize(): Promise<void>;
  async shutdown(): Promise<void>;
}
```

### AgentExecutor with A2UI Support

```typescript
// server/src/a2a/executors/base.ts
import { AgentExecutor, Message, AgentExecutionContext, AgentExecutionResult } from '@liquidcrypto/a2a-sdk';
import { A2UIMessage } from '../types/a2ui-extension';

export abstract class BaseA2UIExecutor implements AgentExecutor {
  abstract execute(message: Message, context: AgentExecutionContext): Promise<AgentExecutionResult>;

  // Helper to create A2UI artifact
  protected createA2UIArtifact(messages: A2UIMessage[]): Part {
    return {
      kind: 'a2ui',
      a2ui: messages
    };
  }

  // Helper to create text + A2UI response
  protected createResponse(text: string, a2ui?: A2UIMessage[]): AgentExecutionResult {
    const parts: Part[] = [{ kind: 'text', text }];
    if (a2ui) {
      parts.push(this.createA2UIArtifact(a2ui));
    }
    return {
      message: {
        kind: 'message',
        message_id: generateId(),
        role: 'agent',
        parts
      }
    };
  }
}
```

### Elysia Route Integration

```typescript
// server/src/index.ts (modified section)
import { ElysiaA2AAdapter } from './a2a/adapter';
import { LiquidCryptoExecutor, RestaurantExecutor, RizzChartsExecutor } from './a2a/executors';
import { getLiquidCryptoAgentCard } from './a2a/agent-cards';

// Initialize adapters
const mainAdapter = new ElysiaA2AAdapter({
  agentCard: getLiquidCryptoAgentCard(baseUrl),
  executor: new LiquidCryptoExecutor()
});

const restaurantAdapter = new ElysiaA2AAdapter({
  agentCard: getRestaurantAgentCard(baseUrl),
  executor: new RestaurantExecutor()
});

// Mount routes
app
  .get('/.well-known/agent.json', () => mainAdapter.getAgentCard())
  .post('/a2a', async ({ body }) => mainAdapter.handleRequest(body))
  .post('/a2a/stream', async function* ({ body }) {
    for await (const event of mainAdapter.handleStreamRequest(body)) {
      yield event;
    }
  })
  .group('/agents/restaurant', app => app
    .get('/.well-known/agent.json', () => restaurantAdapter.getAgentCard())
    .post('/a2a', async ({ body }) => restaurantAdapter.handleRequest(body))
  );
```

### Feature Flag for Gradual Rollout

```typescript
// Environment variable
const USE_SDK_A2A = process.env.USE_SDK_A2A !== 'false'; // Default: true

// Conditional routing
.post('/a2a', async ({ body, request }) => {
  if (USE_SDK_A2A) {
    return mainAdapter.handleRequest(body);
  } else {
    // Legacy handler (removed in Phase 8)
    return handleA2AHttpRequest(body, extractHeaders(request));
  }
})
```

### Verification Checklist

- [ ] SDK imports work from server code
- [ ] ElysiaA2AAdapter handles `agent/card` method
- [ ] ElysiaA2AAdapter handles `message/send` method
- [ ] ElysiaA2AAdapter handles `tasks/get` method
- [ ] SSE streaming works via `/a2a/stream`
- [ ] A2UI artifacts included in responses
- [ ] Feature flag allows fallback to legacy
- [ ] All existing tests pass

---

## Phase 2: Client Migration

### Goal
Replace custom frontend A2A client with SDK client while preserving A2UI extraction.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend A2A Architecture                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Components                       A2A Layer                     │
│  ──────────                       ─────────                     │
│  AgentChatWindow  ───────────►   A2AClientWrapper               │
│  AgentProbe       ───────────►       │                          │
│  AgentHub         ───────────►       ▼                          │
│                                  SDK Client (ClientFactory)     │
│                                      │                          │
│                                      ▼                          │
│  GlassA2UIRenderer ◄─────────   A2UI Extractor                 │
│                                      │                          │
│                                      ▼                          │
│                                  Transformer (unchanged)        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### New/Modified Files

| File | Action | Purpose |
|------|--------|---------|
| `src/a2a/client-wrapper.ts` | **New** | Wraps SDK client with A2UI helpers |
| `src/a2a/client.ts` | **Archive then Delete** | Old custom client |
| `src/a2a/index.ts` | **Modify** | Update exports |
| `src/components/agents/AgentChatWindow.tsx` | **Modify** | Use new client |
| `src/components/agents/AgentProbe.tsx` | **Modify** | Use SDK discovery |

### Client Wrapper

```typescript
// src/a2a/client-wrapper.ts
import { ClientFactory, Client, Task, TaskEvent, Message } from '@liquidcrypto/a2a-sdk';
import { A2UIMessage } from './types-a2ui';
import { transformA2UI } from './transformer';
import type { UINode } from '@/components/agentic/GlassDynamicUI';

export interface A2AClientWrapperConfig {
  agentUrl: string;
  authToken?: string;
  timeout?: number;
  enableStreaming?: boolean;
}

export class A2AClientWrapper {
  private client: Client;
  private agentUrl: string;

  static async create(config: A2AClientWrapperConfig): Promise<A2AClientWrapper> {
    const client = await ClientFactory.createClientFromUrl(config.agentUrl, {
      streaming: config.enableStreaming ?? true,
      timeout: config.timeout ?? 30000,
      headers: config.authToken ? { Authorization: `Bearer ${config.authToken}` } : undefined
    });
    return new A2AClientWrapper(client, config.agentUrl);
  }

  private constructor(client: Client, agentUrl: string) {
    this.client = client;
    this.agentUrl = agentUrl;
  }

  // Send message and get response with A2UI
  async sendMessage(text: string): Promise<{
    task: Task;
    a2ui: A2UIMessage[] | null;
    uiNode: UINode | null;
  }> {
    const message = this.createTextMessage(text);
    let task: Task | null = null;

    for await (const event of this.client.sendMessage(message)) {
      task = this.extractTaskFromEvent(event);
    }

    if (!task) throw new Error('No task returned');

    const a2ui = this.extractA2UI(task);
    const uiNode = a2ui ? transformA2UI(a2ui) : null;

    return { task, a2ui, uiNode };
  }

  // Stream message with A2UI updates
  async *streamMessage(text: string): AsyncGenerator<{
    event: TaskEvent;
    a2ui: A2UIMessage[] | null;
    uiNode: UINode | null;
  }> {
    const message = this.createTextMessage(text);

    for await (const event of this.client.sendMessage(message)) {
      const a2ui = this.extractA2UIFromEvent(event);
      const uiNode = a2ui ? transformA2UI(a2ui) : null;
      yield { event, a2ui, uiNode };
    }
  }

  // Get agent card
  async getAgentCard() {
    return this.client.getCard();
  }

  // Check if agent supports A2UI
  async supportsA2UI(): Promise<boolean> {
    const card = await this.getAgentCard();
    return !!card.capabilities?.extensions?.some(e => e.uri?.includes('a2ui'));
  }

  // Extract A2UI from task artifacts
  private extractA2UI(task: Task): A2UIMessage[] | null {
    for (const artifact of task.artifacts || []) {
      for (const part of artifact.parts || []) {
        if (part.kind === 'a2ui' && part.a2ui) {
          return part.a2ui;
        }
      }
    }
    return null;
  }

  private extractA2UIFromEvent(event: TaskEvent): A2UIMessage[] | null {
    if ('artifact' in event && event.artifact) {
      for (const part of event.artifact.parts || []) {
        if (part.kind === 'a2ui' && part.a2ui) {
          return part.a2ui;
        }
      }
    }
    return null;
  }

  private createTextMessage(text: string): Message {
    return {
      kind: 'message',
      message_id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      role: 'user',
      parts: [{ kind: 'text', text }]
    };
  }

  private extractTaskFromEvent(event: TaskEvent): Task | null {
    if ('task' in event) return event.task;
    if ('status' in event && 'id' in event) {
      return { id: event.id, status: event.status } as Task;
    }
    return null;
  }
}

// Factory function for easy creation
export async function createA2AClient(config: A2AClientWrapperConfig): Promise<A2AClientWrapper> {
  return A2AClientWrapper.create(config);
}

// Discovery function using SDK
export async function discoverAgent(baseUrl: string) {
  return ClientFactory.fetchAgentCard(baseUrl);
}
```

### Updated Exports

```typescript
// src/a2a/index.ts
// SDK re-exports (types)
export {
  Task,
  TaskState,
  Message,
  AgentCard,
  TaskEvent
} from '@liquidcrypto/a2a-sdk';

// Local A2UI types
export * from './types-a2ui';

// Client wrapper (replaces old client)
export { A2AClientWrapper, createA2AClient, discoverAgent } from './client-wrapper';

// Transformer (unchanged)
export { transformA2UI, transformA2UIToGlass, validateA2UIPayload, resolveBinding } from './transformer';

// Examples (unchanged)
export { restaurantFinderExamples, rizzchartsExamples, allExamples } from './examples';

// Mock (unchanged)
export { MockA2AClient } from './mock';
```

### Component Updates

```typescript
// src/components/agents/AgentChatWindow.tsx (key changes)
import { createA2AClient, A2AClientWrapper } from '@/a2a';

// Replace:
// const client = createA2AClient(agent.url);
// With:
const [client, setClient] = useState<A2AClientWrapper | null>(null);

useEffect(() => {
  createA2AClient({
    agentUrl: agent.url,
    authToken,
    enableStreaming: agent.capabilities?.streaming
  }).then(setClient);
}, [agent.url, authToken]);

// Replace message sending:
const handleSend = async (text: string) => {
  if (!client) return;

  if (agent.capabilities?.streaming) {
    for await (const { uiNode } of client.streamMessage(text)) {
      if (uiNode) setCurrentUI(uiNode);
    }
  } else {
    const { uiNode } = await client.sendMessage(text);
    if (uiNode) setCurrentUI(uiNode);
  }
};
```

### Verification Checklist

- [ ] A2AClientWrapper creates from URL
- [ ] sendMessage returns task + A2UI + UINode
- [ ] streamMessage yields incremental updates
- [ ] discoverAgent fetches AgentCard
- [ ] AgentChatWindow works with new client
- [ ] AgentProbe uses SDK discovery
- [ ] Agent Hub search still works
- [ ] Old client.ts archived and removed

---

## Phase 3: PostgreSQL Persistence

### Goal
Replace InMemoryTaskStore with PostgresTaskStore for production durability.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Database Architecture                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ElysiaA2AAdapter                                               │
│       │                                                          │
│       ▼                                                          │
│  TaskStoreFactory.create(config)                                │
│       │                                                          │
│       ├── DATABASE_URL set? ──► PostgresTaskStore               │
│       │                              │                           │
│       │                              ▼                           │
│       │                         PostgreSQL                       │
│       │                         ┌─────────────────┐             │
│       │                         │ a2a_tasks       │             │
│       │                         │ ─────────────── │             │
│       │                         │ id              │             │
│       │                         │ context_id      │             │
│       │                         │ status_state    │             │
│       │                         │ artifacts (JSONB)│            │
│       │                         │ history (JSONB) │             │
│       │                         │ created_at      │             │
│       │                         └─────────────────┘             │
│       │                                                          │
│       └── No DATABASE_URL ────► InMemoryTaskStore (fallback)    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### New Files

| File | Purpose |
|------|---------|
| `server/src/a2a/db/config.ts` | Database configuration |
| `server/src/a2a/db/index.ts` | Exports |
| `scripts/a2a-db-migrate.ts` | Schema migration script |

### Database Configuration

```typescript
// server/src/a2a/db/config.ts
import { TaskStoreFactory, PostgresTaskStore, InMemoryTaskStore, TaskStore } from '@liquidcrypto/a2a-sdk';
import { logger } from '../logger';

export interface DatabaseConfig {
  connectionString?: string;
  poolSize?: number;
  idleTimeout?: number;
  connectionTimeout?: number;
  ssl?: boolean;
}

export function createTaskStore(config?: DatabaseConfig): TaskStore {
  const connectionString = config?.connectionString || process.env.A2A_DATABASE_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    logger.warn('No DATABASE_URL configured, using in-memory task store');
    return new InMemoryTaskStore();
  }

  try {
    const store = new PostgresTaskStore({
      connectionString,
      poolSize: config?.poolSize ?? 10,
      idleTimeoutMs: config?.idleTimeout ?? 30000,
      connectionTimeoutMs: config?.connectionTimeout ?? 5000,
      ssl: config?.ssl ?? process.env.NODE_ENV === 'production'
    });

    logger.info('PostgreSQL task store initialized');
    return store;
  } catch (error) {
    logger.error({ error }, 'Failed to create PostgreSQL store, falling back to in-memory');
    return new InMemoryTaskStore();
  }
}

export async function initializeDatabase(store: TaskStore): Promise<void> {
  if (store instanceof PostgresTaskStore) {
    await store.initialize(); // Creates tables if not exist
    logger.info('Database schema initialized');
  }
}
```

### Migration Script

```typescript
// scripts/a2a-db-migrate.ts
#!/usr/bin/env bun
import { PostgresTaskStore } from '@liquidcrypto/a2a-sdk';

const SCHEMA = `
-- A2A Tasks Table
CREATE TABLE IF NOT EXISTS a2a_tasks (
  id VARCHAR(255) PRIMARY KEY,
  context_id VARCHAR(255) NOT NULL,
  status_state VARCHAR(50) NOT NULL DEFAULT 'submitted',
  status_message TEXT,
  status_timestamp TIMESTAMPTZ DEFAULT NOW(),
  artifacts JSONB DEFAULT '[]'::jsonb,
  history JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for common queries
CREATE INDEX IF NOT EXISTS idx_a2a_tasks_context_id ON a2a_tasks(context_id);
CREATE INDEX IF NOT EXISTS idx_a2a_tasks_status ON a2a_tasks(status_state);
CREATE INDEX IF NOT EXISTS idx_a2a_tasks_created ON a2a_tasks(created_at DESC);

-- Updated trigger
CREATE OR REPLACE FUNCTION update_a2a_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS a2a_tasks_updated_at ON a2a_tasks;
CREATE TRIGGER a2a_tasks_updated_at
  BEFORE UPDATE ON a2a_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_a2a_tasks_updated_at();
`;

async function migrate() {
  const connectionString = process.env.A2A_DATABASE_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const dryRun = process.argv.includes('--dry-run');

  if (dryRun) {
    console.log('DRY RUN - Would execute:');
    console.log(SCHEMA);
    return;
  }

  console.log('Running A2A database migration...');

  const store = new PostgresTaskStore({ connectionString });
  await store.initialize();

  console.log('Migration complete!');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
```

### Adapter Update

```typescript
// server/src/a2a/adapter/elysia-adapter.ts (modified)
import { createTaskStore, initializeDatabase } from '../db/config';

export class ElysiaA2AAdapter {
  private taskStore: TaskStore;

  constructor(config: ElysiaAdapterConfig) {
    // Use provided store or create from environment
    this.taskStore = config.taskStore ?? createTaskStore();
    // ... rest of constructor
  }

  async initialize(): Promise<void> {
    await initializeDatabase(this.taskStore);
    // ... other initialization
  }
}
```

### Environment Variables

```bash
# .env.example additions
A2A_DATABASE_URL=postgresql://user:pass@localhost:5432/liquidcrypto
A2A_DB_POOL_SIZE=10
A2A_DB_IDLE_TIMEOUT=30000
A2A_DB_SSL=true
```

### Health Check

```typescript
// Add to server/src/index.ts
.get('/health', async () => {
  const dbHealthy = await mainAdapter.getTaskStore().healthCheck?.() ?? true;

  return {
    status: dbHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      database: dbHealthy ? 'connected' : 'disconnected',
      a2a: 'operational'
    }
  };
})
```

### Verification Checklist

- [ ] PostgresTaskStore connects successfully
- [ ] Tables created on first run
- [ ] Tasks persist across server restart
- [ ] Fallback to InMemoryTaskStore works
- [ ] Health endpoint reports DB status
- [ ] Connection pooling configured
- [ ] Migration script runs cleanly

---

## Phase 3.5: Artifact Management System

### Goal
Build a comprehensive Artifact management system with an amazing user experience that enables spatial exploration, temporal navigation, and intelligent surfacing of AI-generated outputs.

### Vision: "Artifact Constellation"

Think of artifacts not as files in a folder, but as **interconnected stars in a constellation**. Each artifact is a point of light, connected to its origins (tasks, agents) and derivatives (what was built from it). This creates a spatial, explorable memory of everything AI agents have produced.

### UX Principles

| Principle | Description |
|-----------|-------------|
| **Ambient Awareness** | Artifacts appear subtly in context, not buried in menus |
| **Spatial Memory** | Location-based recall - "that chart was near the portfolio view" |
| **Temporal Navigation** | Scrub through time to see artifact evolution |
| **Zero-Friction Capture** | Every AI output is automatically an artifact - no explicit save |
| **Intelligent Surfacing** | AI predicts which artifacts are relevant now |
| **Rich Previews** | See content without opening, like macOS Quick Look |

### Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        Artifact Management UX                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                    GlassArtifactDock (Bottom Bar)                          │ │
│  │  • Persistent access point at bottom of screen                            │ │
│  │  • Recent artifacts as thumbnails with hover preview                      │ │
│  │  • "All Artifacts" opens the full explorer                                │ │
│  │  • Drag-to-pin favorites, badge shows new artifacts                       │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐          │
│  │ GlassArtifact    │    │ GlassArtifact    │    │ GlassArtifact    │          │
│  │ Explorer         │    │ Timeline         │    │ QuickLook        │          │
│  │ Full-screen      │    │ Temporal view    │    │ Spacebar preview │          │
│  │ spatial canvas   │    │ with scrubbing   │    │ for any artifact │          │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘          │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                    GlassArtifactCard (Individual Display)                   │ │
│  │  • Adaptive preview based on content type (chart, code, A2UI, file)       │ │
│  │  • Connection lines to related artifacts                                   │ │
│  │  • Three sizes: small, medium, large                                       │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                    In-Chat Artifact Integration                             │ │
│  │  • Artifacts inline in chat bubbles with expand option                     │ │
│  │  • @artifact:xyz mention syntax to reference previous artifacts           │ │
│  │  • Artifact chips show preview on hover                                    │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Database Schema

```sql
-- Artifact Registry Table (extends a2a_tasks)
CREATE TABLE artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id VARCHAR(255) REFERENCES a2a_tasks(id),
    context_id VARCHAR(255) NOT NULL,

    -- Artifact identity
    artifact_id VARCHAR(255) NOT NULL,
    name VARCHAR(512),
    description TEXT,

    -- Content
    parts JSONB NOT NULL DEFAULT '[]',
    parts_count INT GENERATED ALWAYS AS (jsonb_array_length(parts)) STORED,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    extensions TEXT[] DEFAULT '{}',

    -- Streaming support
    is_streaming BOOLEAN DEFAULT FALSE,
    is_complete BOOLEAN DEFAULT TRUE,
    chunk_index INT DEFAULT 0,

    -- Versioning
    version INT DEFAULT 1,
    parent_id UUID REFERENCES artifacts(id),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Full-text search
    search_vector TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, ''))
    ) STORED,

    CONSTRAINT unique_artifact_per_task UNIQUE (task_id, artifact_id, version)
);

-- Artifact References (cross-task links)
CREATE TABLE artifact_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_task_id VARCHAR(255) NOT NULL,
    target_artifact_id UUID REFERENCES artifacts(id),
    reference_type VARCHAR(50), -- 'input', 'derived', 'related'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Artifact Templates (for trading workflows)
CREATE TABLE artifact_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(100), -- 'trading', 'analysis', 'report', 'chart'
    template JSONB NOT NULL, -- Template with placeholders
    schema JSONB, -- JSON Schema for validation
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX idx_artifacts_task ON artifacts(task_id);
CREATE INDEX idx_artifacts_context ON artifacts(context_id);
CREATE INDEX idx_artifacts_name ON artifacts(name);
CREATE INDEX idx_artifacts_search ON artifacts USING gin(search_vector);
CREATE INDEX idx_artifacts_streaming ON artifacts(is_streaming, is_complete);
CREATE INDEX idx_artifacts_extensions ON artifacts USING gin(extensions);
```

### TypeScript Interface

```typescript
// server/src/artifacts/types.ts

export interface ArtifactRegistry {
  // CRUD
  create(artifact: Artifact, taskId: string): Promise<StoredArtifact>;
  get(id: string): Promise<StoredArtifact | null>;
  update(id: string, parts: Part[]): Promise<StoredArtifact>;
  delete(id: string): Promise<void>;

  // Streaming
  startStream(artifact: Artifact, taskId: string): Promise<string>;
  appendChunk(id: string, parts: Part[], isLast: boolean): Promise<void>;
  finalizeStream(id: string): Promise<StoredArtifact>;

  // Search & Query
  search(query: string, filters?: ArtifactFilters): Promise<StoredArtifact[]>;
  listByTask(taskId: string): Promise<StoredArtifact[]>;
  listByContext(contextId: string): Promise<StoredArtifact[]>;

  // Versioning
  getHistory(artifactId: string): Promise<ArtifactVersion[]>;
  createVersion(parentId: string, artifact: Artifact): Promise<StoredArtifact>;

  // References
  addReference(sourceTaskId: string, targetArtifactId: string, type: ReferenceType): Promise<void>;
  getReferences(taskId: string): Promise<ArtifactReference[]>;

  // Templates
  createFromTemplate(templateId: string, data: Record<string, unknown>): Promise<StoredArtifact>;
  listTemplates(category?: string): Promise<ArtifactTemplate[]>;
}

export interface StoredArtifact extends Artifact {
  id: string;
  taskId: string;
  contextId: string;
  version: number;
  isStreaming: boolean;
  isComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ArtifactFilters {
  taskId?: string;
  contextId?: string;
  name?: string;
  extensions?: string[];
  isComplete?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
}
```

### New Frontend Components

| Component | Purpose | Lines (est.) |
|-----------|---------|--------------|
| `GlassArtifactDock.tsx` | Persistent bottom bar with recent artifacts | ~300 |
| `GlassArtifactExplorer.tsx` | Full-screen spatial canvas (Grid/Timeline/Graph) | ~600 |
| `GlassArtifactTimeline.tsx` | Temporal navigation with scrubbing | ~400 |
| `GlassArtifactQuickLook.tsx` | Spacebar preview modal | ~250 |
| `GlassArtifactCard.tsx` | Individual artifact display (3 sizes) | ~350 |
| `GlassArtifactChip.tsx` | Inline reference in chat | ~100 |
| `GlassArtifactVersionHistory.tsx` | Version diff and restore UI | ~300 |
| `GlassTradeArtifact.tsx` | Trade-specific card with live P&L | ~200 |
| `GlassPortfolioArtifact.tsx` | Portfolio snapshot card | ~200 |

### GlassArtifactDock Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                          [ Main Content Area ]                              │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐        │  ⌘  Search    │   📦 All │
│  │ 📊  │ │ 📄  │ │ 💹  │ │ 🖼️  │ │ 📝  │ ····   │  Artifacts    │   (47)   │
│  │Chart│ │Code │ │Trade│ │Image│ │Data │        │               │          │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘        └───────────────┴──────────┘
│            Recent Artifacts                           Quick Actions         │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Interactions:**
- **Hover**: Shows preview tooltip with larger thumbnail + metadata
- **Click**: Opens artifact in Quick Look modal
- **Drag**: Reorder or pin to persistent area
- **Right-click**: Context menu (Copy, Share, Delete, View History)
- **Badge (3)**: New artifacts since last interaction

### GlassArtifactExplorer Design

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ← Back   🔍 Search artifacts...              [Grid] [Timeline] [Graph]  ⋮  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│    Trading Analysis                    Portfolio Reports                     │
│    ┌─────────────────┐                 ┌─────────────────┐                  │
│    │  📊 BTC Analysis│─────────────────│  📈 Weekly Report│                 │
│    │  Jan 14, 2:30pm │                 │  Jan 12         │                  │
│    └────────┬────────┘                 └─────────────────┘                  │
│             │ derived from                                                   │
│             ▼                                                                │
│    ┌─────────────────┐                                                      │
│    │  💹 Trade #4521 │                                                      │
│    │  BTC/USD        │                                                      │
│    └─────────────────┘                                                      │
│                                                                              │
│    ┌──────────────────────────────────────────────────────────┐             │
│    │  🔮 AI Suggestion: "Looking for the ETH analysis from    │             │
│    │     yesterday? Here it is..."        [Show] [Dismiss]    │             │
│    └──────────────────────────────────────────────────────────┘             │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Layout Modes:**
1. **Grid**: Clean grid of artifact cards (like Finder)
2. **Timeline**: Chronological view with time scrubbing
3. **Graph**: Force-directed graph showing relationships

### GlassArtifactQuickLook Design

```
╭────────────────────────────────────────────────────────────────────────╮
│                                                                        │
│                    BTC Price Analysis                                  │
│                    ─────────────────                                   │
│                                                                        │
│    ┌────────────────────────────────────────────────────────────┐    │
│    │               [Full Chart Preview]                         │    │
│    │         📈 BTC/USD - 4H Chart                             │    │
│    │         Entry: $42,500 | Target: $45,000                  │    │
│    └────────────────────────────────────────────────────────────┘    │
│                                                                        │
│    📅 Jan 14, 2026 at 2:30 PM                                        │
│    🤖 Created by: Crypto Advisor Agent                               │
│    📎 Related: Trade #4521, Portfolio v12                            │
│    🏷️ Tags: btc, analysis, entry-point                              │
│                                                                        │
│    [Open Full] [Copy] [Share] [Pin to Dock] [View History] [Delete]  │
│                                                                        │
╰────────────────────────────────────────────────────────────────────────╯

                         Press Space to close
```

**Adaptive Preview Types:**
| Artifact Type | Preview Content |
|---------------|-----------------|
| Chart | Interactive mini-chart with zoom |
| Code | Syntax-highlighted code with line numbers |
| A2UI | Rendered Glass components |
| Image | Full image with zoom |
| Data/JSON | Formatted tree view |
| Trade | Trade details with P&L |
| Text | Formatted markdown |

### In-Chat Artifact Integration

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  You: Compare this with @artifact:portfolio-snapshot-v12                    │
│       ─────────────────────────────────────────────────────                 │
│       ▲ Autocomplete showing artifact suggestions                           │
│       │                                                                      │
│       │  📈 Portfolio Snapshot v12 (Jan 12)                                 │
│       │  📊 ETH Analysis (Jan 13)                                           │
│       │  💹 Trade #4520 (Jan 11)                                            │
│       └──────────────────────────────────────────────────                   │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│  [📎] Type a message... @artifact for references              [🎤] [➤]     │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Trading-Specific Artifact Templates

```typescript
const TRADING_TEMPLATES: ArtifactTemplate[] = [
  {
    id: 'portfolio-snapshot',
    name: 'Portfolio Snapshot',
    category: 'trading',
    template: {
      parts: [
        { type: 'data', data: { holdings: '{{holdings}}', timestamp: '{{timestamp}}' } },
        { type: 'a2ui', a2ui: [/* LiquidPortfolio component */] }
      ]
    }
  },
  {
    id: 'trade-confirmation',
    name: 'Trade Confirmation',
    category: 'trading',
    template: {
      parts: [
        { type: 'text', text: 'Trade executed: {{side}} {{quantity}} {{symbol}} @ {{price}}' },
        { type: 'data', data: { orderId: '{{orderId}}', status: '{{status}}' } }
      ]
    }
  },
  {
    id: 'price-alert',
    name: 'Price Alert',
    category: 'trading',
    template: {
      parts: [
        { type: 'text', text: '{{symbol}} reached {{price}} ({{direction}} threshold)' },
        { type: 'a2ui', a2ui: [/* LiquidChart mini-view */] }
      ]
    }
  }
];
```

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Space` | Quick Look selected artifact |
| `⌘ + F` | Search artifacts |
| `⌘ + Shift + A` | Open Artifact Explorer |
| `⌘ + K` | Command palette with artifact search |
| `@` in chat | Start artifact mention |
| `⌘ + S` | Pin current chat artifact to dock |
| `⌘ + [` / `⌘ + ]` | Navigate artifact history |
| `Delete` | Move to trash |

### AI-Powered Features

| Feature | Description |
|---------|-------------|
| **Smart Suggestions** | "You usually check portfolio after trades - here's the latest" |
| **Natural Language Search** | "show me all ETH analysis from this week" |
| **Auto-Tagging** | AI automatically tags artifacts (e.g., "bullish", "entry-point") |
| **Anomaly Detection** | "This trade contradicts your usual risk parameters" |
| **Summarization** | Generate summary of selected artifacts |
| **Cross-Reference** | "This analysis references data from 3 other artifacts" |

### Backend Files

| File | Purpose | Lines (est.) |
|------|---------|--------------|
| `server/src/artifacts/types.ts` | Type definitions | ~150 |
| `server/src/artifacts/registry.ts` | ArtifactRegistry implementation | ~400 |
| `server/src/artifacts/postgres-store.ts` | PostgreSQL storage | ~300 |
| `server/src/artifacts/search.ts` | Full-text search | ~150 |
| `server/src/artifacts/templates.ts` | Template engine | ~200 |
| `server/src/artifacts/index.ts` | Exports | ~30 |
| `scripts/artifacts-migrate.ts` | Database migration | ~100 |

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/artifacts` | GET | List artifacts with filters |
| `/api/artifacts/:id` | GET | Get single artifact |
| `/api/artifacts` | POST | Create artifact |
| `/api/artifacts/:id` | PATCH | Update artifact |
| `/api/artifacts/:id` | DELETE | Delete artifact |
| `/api/artifacts/:id/versions` | GET | Get version history |
| `/api/artifacts/search` | GET | Full-text search |
| `/api/artifacts/templates` | GET | List templates |
| `/api/artifacts/from-template` | POST | Create from template |
| `/api/artifacts/:id/references` | GET | Get cross-references |

### Frontend Store

```typescript
// src/stores/artifactStore.ts
import { create } from 'zustand';

interface ArtifactStore {
  // State
  recentArtifacts: StoredArtifact[];
  pinnedArtifacts: StoredArtifact[];
  searchResults: StoredArtifact[];
  selectedArtifact: StoredArtifact | null;
  isQuickLookOpen: boolean;
  viewMode: 'grid' | 'timeline' | 'graph';

  // Actions
  fetchRecent(): Promise<void>;
  search(query: string, filters?: ArtifactFilters): Promise<void>;
  pin(artifactId: string): void;
  unpin(artifactId: string): void;
  openQuickLook(artifact: StoredArtifact): void;
  closeQuickLook(): void;
  setViewMode(mode: 'grid' | 'timeline' | 'graph'): void;
}

export const useArtifactStore = create<ArtifactStore>((set, get) => ({
  // ... implementation
}));
```

### Integration Points

**1. A2A Handler Integration:**
```typescript
// When processing TaskArtifactUpdateEvent
async function handleArtifactUpdate(event: TaskArtifactUpdateEvent) {
  if (event.append) {
    await artifactRegistry.appendChunk(
      event.artifact.artifactId,
      event.artifact.parts,
      event.lastChunk ?? false
    );
  } else {
    await artifactRegistry.create(event.artifact, event.taskId);
  }
}
```

**2. Chat Window Integration:**
```typescript
// In AgentChatWindow - artifact mention autocomplete
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  setInputValue(value);

  // Check for @artifact trigger
  const match = value.match(/@artifact:?(\S*)$/);
  if (match) {
    const query = match[1];
    searchArtifacts(query).then(setArtifactSuggestions);
  }
};
```

### Verification Checklist

- [ ] Database schema migrated
- [ ] ArtifactRegistry backend implemented
- [ ] Full-text search working
- [ ] GlassArtifactDock renders and persists
- [ ] GlassArtifactExplorer supports all 3 view modes
- [ ] GlassArtifactQuickLook opens with Spacebar
- [ ] @artifact mention autocomplete works in chat
- [ ] Version history displays correctly
- [ ] Cross-task references tracked
- [ ] Templates create valid artifacts
- [ ] Keyboard shortcuts functional
- [ ] AI suggestions appear contextually
- [ ] Trading-specific cards render with live data

---

## Phase 4: Telemetry Enhancement

### Goal
Full OpenTelemetry integration for A2A operations.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Telemetry Architecture                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Elysia Request                                                 │
│       │                                                          │
│       ▼                                                          │
│  HTTP Middleware (span: a2a.http.request)                       │
│       │                                                          │
│       ▼                                                          │
│  ElysiaA2AAdapter                                               │
│       │                                                          │
│       ├── traceServerRequest (span: a2a.server.request)         │
│       │       │                                                  │
│       │       ▼                                                  │
│       │   RequestHandler.handle                                  │
│       │       │                                                  │
│       │       ▼                                                  │
│       │   AgentExecutor.execute                                  │
│       │       │                                                  │
│       │       └── traceAgentExecution (span: a2a.agent.execute) │
│       │                                                          │
│       └── TaskStore operations                                   │
│               │                                                  │
│               └── traceDbOperation (span: a2a.db.*)             │
│                                                                  │
│  Metrics Collected:                                             │
│  ├── a2a_task_duration_seconds (histogram)                      │
│  ├── a2a_task_count_total (counter)                             │
│  ├── a2a_db_operation_duration_seconds (histogram)              │
│  └── a2a_active_tasks (gauge)                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Configuration

```typescript
// server/src/a2a/telemetry/config.ts
import {
  A2ATelemetryWrapper,
  A2ATelemetryProvider,
  A2AMetricsCollector,
  instrumentTaskStore
} from '@liquidcrypto/a2a-sdk';
import { trace, metrics } from '@opentelemetry/api';

export interface TelemetryConfig {
  serviceName?: string;
  enabled?: boolean;
  exporterEndpoint?: string;
}

export function createTelemetryWrapper(config?: TelemetryConfig): A2ATelemetryWrapper | null {
  if (config?.enabled === false || process.env.A2A_TELEMETRY_ENABLED === 'false') {
    return null;
  }

  const tracer = trace.getTracer(config?.serviceName ?? 'liquidcrypto-a2a');
  const meter = metrics.getMeter(config?.serviceName ?? 'liquidcrypto-a2a');

  const provider = new A2ATelemetryProvider(tracer);
  const collector = new A2AMetricsCollector(meter);

  return new A2ATelemetryWrapper(provider, collector);
}

export function wrapTaskStoreWithTelemetry(
  store: TaskStore,
  telemetry: A2ATelemetryWrapper | null
): TaskStore {
  if (!telemetry) return store;
  return instrumentTaskStore(store, telemetry);
}
```

### Adapter Integration

```typescript
// server/src/a2a/adapter/elysia-adapter.ts (telemetry section)
import { createTelemetryWrapper, wrapTaskStoreWithTelemetry } from '../telemetry/config';

export class ElysiaA2AAdapter {
  private telemetry: A2ATelemetryWrapper | null;

  constructor(config: ElysiaAdapterConfig) {
    this.telemetry = config.telemetry ?? createTelemetryWrapper();

    // Wrap task store with telemetry
    const baseStore = config.taskStore ?? createTaskStore();
    this.taskStore = wrapTaskStoreWithTelemetry(baseStore, this.telemetry);
  }

  async handleRequest(body: unknown): Promise<JsonRpcResponse> {
    const span = this.telemetry?.startSpan('a2a.server.request', {
      'a2a.method': (body as any)?.method
    });

    try {
      const result = await this.handler.handleRequest(body);
      span?.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span?.recordException(error);
      span?.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span?.end();
    }
  }
}
```

### Elysia Middleware

```typescript
// server/src/a2a/telemetry/elysia-middleware.ts
import { Elysia } from 'elysia';
import { trace, SpanStatusCode } from '@opentelemetry/api';

export function a2aTelemetryMiddleware() {
  const tracer = trace.getTracer('liquidcrypto-a2a-http');

  return new Elysia({ name: 'a2a-telemetry' })
    .onRequest(({ request, set }) => {
      const span = tracer.startSpan('a2a.http.request', {
        attributes: {
          'http.method': request.method,
          'http.url': request.url,
          'http.route': new URL(request.url).pathname
        }
      });

      // Store span in request context
      (request as any).__a2aSpan = span;
    })
    .onAfterResponse(({ request, set }) => {
      const span = (request as any).__a2aSpan;
      if (span) {
        span.setAttribute('http.status_code', set.status ?? 200);
        span.setStatus({ code: SpanStatusCode.OK });
        span.end();
      }
    })
    .onError(({ request, error }) => {
      const span = (request as any).__a2aSpan;
      if (span) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR });
        span.end();
      }
    });
}
```

### Verification Checklist

- [ ] Traces appear in Jaeger/OTLP collector
- [ ] Spans include A2A method names
- [ ] Database operations traced
- [ ] Agent execution traced
- [ ] Metrics exported (histograms, counters)
- [ ] Error spans recorded properly
- [ ] Integration with existing telemetry.ts

---

## Phase 5: gRPC Transport

### Goal
Enable high-performance gRPC transport for A2A communication.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      gRPC Architecture                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Server Side                                                    │
│  ───────────                                                    │
│  Elysia (HTTP/JSON-RPC)  ────────►  Port 3001                  │
│  GrpcA2AServer           ────────►  Port 50051                 │
│       │                                                          │
│       └── Uses same:                                            │
│           ├── TaskStore (PostgreSQL)                            │
│           ├── EventQueue                                        │
│           └── AgentExecutors                                    │
│                                                                  │
│  Client Side                                                    │
│  ───────────                                                    │
│  A2AClientWrapper                                               │
│       │                                                          │
│       ├── JSON-RPC (default)                                    │
│       │       └── For web browsers                              │
│       │                                                          │
│       └── gRPC (optional)                                       │
│               └── For server-to-server, CLI                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### New Files

| File | Purpose |
|------|---------|
| `server/src/a2a/grpc/server.ts` | gRPC server wrapper |
| `server/src/a2a/grpc/config.ts` | gRPC configuration |
| `packages/a2a-sdk/proto/a2a.proto` | Protocol buffer definitions |
| `src/a2a/grpc-client.ts` | gRPC client for Node.js contexts |

### gRPC Server Setup

```typescript
// server/src/a2a/grpc/server.ts
import { GrpcA2AServer } from '@liquidcrypto/a2a-sdk';
import { AgentExecutor, TaskStore, EventQueue } from '@liquidcrypto/a2a-sdk';

export interface GrpcServerConfig {
  port?: number;
  host?: string;
  executor: AgentExecutor;
  taskStore: TaskStore;
  eventQueue: EventQueue;
  agentCard: AgentCard;
}

export async function createGrpcServer(config: GrpcServerConfig): Promise<GrpcA2AServer> {
  const server = new GrpcA2AServer({
    agentCard: config.agentCard,
    executor: config.executor,
    taskStore: config.taskStore,
    eventQueue: config.eventQueue,
    port: config.port ?? 50051,
    host: config.host ?? '0.0.0.0'
  });

  return server;
}
```

### Main Server Integration

```typescript
// server/src/index.ts (gRPC section)
import { createGrpcServer } from './a2a/grpc/server';

async function startServer() {
  // ... existing Elysia setup ...

  // Start gRPC server if enabled
  if (process.env.A2A_GRPC_ENABLED !== 'false') {
    const grpcServer = await createGrpcServer({
      port: parseInt(process.env.A2A_GRPC_PORT ?? '50051'),
      executor: mainExecutor,
      taskStore: mainAdapter.getTaskStore(),
      eventQueue: mainAdapter.getEventQueue(),
      agentCard: getLiquidCryptoAgentCard(baseUrl)
    });

    await grpcServer.start();
    logger.info({ port: 50051 }, 'gRPC A2A server started');
  }
}
```

### Client gRPC Support

```typescript
// src/a2a/grpc-client.ts
import { GrpcTransport, Client } from '@liquidcrypto/a2a-sdk';

export interface GrpcClientConfig {
  host: string;
  port: number;
  useTls?: boolean;
}

export async function createGrpcClient(config: GrpcClientConfig): Promise<Client> {
  const url = `${config.host}:${config.port}`;
  const transport = GrpcTransport.create(url, {
    useTls: config.useTls ?? false
  });

  return new Client(transport);
}
```

### Protocol Buffer Definition

```protobuf
// packages/a2a-sdk/proto/a2a.proto
syntax = "proto3";

package a2a;

service A2AService {
  rpc SendMessage(SendMessageRequest) returns (stream TaskEvent);
  rpc GetTask(GetTaskRequest) returns (Task);
  rpc CancelTask(CancelTaskRequest) returns (Task);
  rpc GetAgentCard(Empty) returns (AgentCard);
}

message SendMessageRequest {
  Message message = 1;
  optional string context_id = 2;
}

message Task {
  string id = 1;
  string context_id = 2;
  TaskStatus status = 3;
  repeated Artifact artifacts = 4;
  repeated Message history = 5;
}

message TaskEvent {
  oneof event {
    TaskStatusUpdate status_update = 1;
    ArtifactUpdate artifact_update = 2;
  }
}

// ... additional message definitions
```

### Environment Variables

```bash
# .env.example additions
A2A_GRPC_ENABLED=true
A2A_GRPC_PORT=50051
A2A_GRPC_HOST=0.0.0.0
A2A_GRPC_TLS_CERT=/path/to/cert.pem
A2A_GRPC_TLS_KEY=/path/to/key.pem
```

### Verification Checklist

- [ ] gRPC server starts on port 50051
- [ ] Shares TaskStore with HTTP server
- [ ] SendMessage streaming works
- [ ] GetTask returns correct data
- [ ] TLS configuration works
- [ ] Health check includes gRPC status
- [ ] gRPC client connects successfully

---

## Phase 6: A2UI Trading Extensions

### Goal
Create custom A2UI components for Liquid Glass trading features.

### Component Catalog

| A2UI Component | Glass Equivalent | Purpose |
|----------------|------------------|---------|
| `LiquidChart` | `GlassChart` | Candlestick/line charts with crypto presets |
| `LiquidTicker` | `GlassMarketTicker` | Real-time price ticker |
| `LiquidOrderBook` | `GlassOrderBook` | Bid/ask order visualization |
| `LiquidPortfolio` | Portfolio grid | Holdings overview |
| `LiquidTradeForm` | `GlassPayment` variant | Buy/sell order entry |
| `LiquidPriceAlert` | `GlassAlert` variant | Price threshold notifications |
| `LiquidWatchlist` | `GlassDataTable` variant | Symbol watchlist |
| `LiquidTradingView` | Composite | Full trading interface |

### Type Definitions

```typescript
// src/a2a/types-a2ui-trading.ts

// Extension URI
export const A2UI_TRADING_EXTENSION = 'urn:a2ui:extension:liquid-trading:1.0';

// Chart component
export interface LiquidChartComponent {
  type: 'LiquidChart';
  symbol: DataBinding<string>;           // e.g., "BTC/USD"
  interval: DataBinding<string>;         // e.g., "1h", "1d"
  chartType?: DataBinding<'candlestick' | 'line' | 'area'>;
  indicators?: DataBinding<string[]>;    // e.g., ["SMA:20", "RSI:14"]
  height?: DataBinding<number>;
  showVolume?: DataBinding<boolean>;
}

// Ticker component
export interface LiquidTickerComponent {
  type: 'LiquidTicker';
  symbols: DataBinding<string[]>;        // e.g., ["BTC", "ETH", "SOL"]
  showChange?: DataBinding<boolean>;
  showVolume?: DataBinding<boolean>;
  scrollSpeed?: DataBinding<number>;
}

// Order book component
export interface LiquidOrderBookComponent {
  type: 'LiquidOrderBook';
  symbol: DataBinding<string>;
  depth?: DataBinding<number>;           // Number of levels
  showSpread?: DataBinding<boolean>;
  aggregation?: DataBinding<number>;     // Price aggregation
}

// Portfolio component
export interface LiquidPortfolioComponent {
  type: 'LiquidPortfolio';
  holdings: DataBinding<PortfolioHolding[]>;
  showPnL?: DataBinding<boolean>;
  showAllocation?: DataBinding<boolean>;
  sortBy?: DataBinding<'value' | 'change' | 'name'>;
}

// Trade form component
export interface LiquidTradeFormComponent {
  type: 'LiquidTradeForm';
  symbol: DataBinding<string>;
  side: DataBinding<'buy' | 'sell'>;
  orderTypes?: DataBinding<('market' | 'limit' | 'stop')[]>;
  onSubmit: ActionBinding;
}

// Watchlist component
export interface LiquidWatchlistComponent {
  type: 'LiquidWatchlist';
  symbols: DataBinding<WatchlistItem[]>;
  columns?: DataBinding<('price' | 'change' | 'volume' | 'marketCap')[]>;
  onSelect?: ActionBinding;
}

// Full trading view (composite)
export interface LiquidTradingViewComponent {
  type: 'LiquidTradingView';
  symbol: DataBinding<string>;
  layout?: DataBinding<'default' | 'compact' | 'advanced'>;
  features?: DataBinding<('chart' | 'orderBook' | 'trades' | 'form')[]>;
}

// Union type for all trading components
export type LiquidTradingComponent =
  | LiquidChartComponent
  | LiquidTickerComponent
  | LiquidOrderBookComponent
  | LiquidPortfolioComponent
  | LiquidTradeFormComponent
  | LiquidWatchlistComponent
  | LiquidTradingViewComponent;
```

### Transformer Extension

```typescript
// src/a2a/transformer-trading.ts
import { UINode } from '@/components/agentic/GlassDynamicUI';
import { LiquidTradingComponent } from './types-a2ui-trading';
import { resolveBinding, DataModel, TemplateContext } from './transformer';

export function transformTradingComponent(
  component: LiquidTradingComponent,
  dataModel: DataModel,
  templateContext?: TemplateContext,
  onAction?: (actionId: string, data: unknown) => void
): UINode | null {

  switch (component.type) {
    case 'LiquidChart':
      return {
        type: 'chart',
        props: {
          symbol: resolveBinding(component.symbol, dataModel, templateContext),
          interval: resolveBinding(component.interval, dataModel, templateContext),
          chartType: resolveBinding(component.chartType, dataModel, templateContext) ?? 'candlestick',
          indicators: resolveBinding(component.indicators, dataModel, templateContext) ?? [],
          height: resolveBinding(component.height, dataModel, templateContext) ?? 400,
          showVolume: resolveBinding(component.showVolume, dataModel, templateContext) ?? true,
          variant: 'trading' // Special variant for GlassChart
        }
      };

    case 'LiquidTicker':
      return {
        type: 'market-ticker',
        props: {
          symbols: resolveBinding(component.symbols, dataModel, templateContext),
          showChange: resolveBinding(component.showChange, dataModel, templateContext) ?? true,
          showVolume: resolveBinding(component.showVolume, dataModel, templateContext) ?? false,
          speed: resolveBinding(component.scrollSpeed, dataModel, templateContext) ?? 50
        }
      };

    case 'LiquidOrderBook':
      return {
        type: 'order-book',
        props: {
          symbol: resolveBinding(component.symbol, dataModel, templateContext),
          depth: resolveBinding(component.depth, dataModel, templateContext) ?? 10,
          showSpread: resolveBinding(component.showSpread, dataModel, templateContext) ?? true,
          aggregation: resolveBinding(component.aggregation, dataModel, templateContext)
        }
      };

    case 'LiquidPortfolio':
      return {
        type: 'stack',
        props: { direction: 'vertical', gap: 16 },
        children: [
          {
            type: 'text',
            props: { variant: 'h3', children: 'Portfolio' }
          },
          {
            type: 'data-table',
            props: {
              data: resolveBinding(component.holdings, dataModel, templateContext),
              columns: [
                { key: 'symbol', label: 'Asset' },
                { key: 'quantity', label: 'Amount' },
                { key: 'value', label: 'Value' },
                { key: 'change', label: '24h Change' }
              ],
              showPnL: resolveBinding(component.showPnL, dataModel, templateContext) ?? true
            }
          }
        ]
      };

    case 'LiquidTradeForm':
      return {
        type: 'card',
        props: { variant: 'elevated' },
        children: [
          {
            type: 'stack',
            props: { direction: 'vertical', gap: 12 },
            children: [
              {
                type: 'text',
                props: {
                  variant: 'h4',
                  children: `${resolveBinding(component.side, dataModel, templateContext)?.toUpperCase()} ${resolveBinding(component.symbol, dataModel, templateContext)}`
                }
              },
              {
                type: 'input',
                props: {
                  type: 'number',
                  label: 'Amount',
                  placeholder: '0.00'
                }
              },
              {
                type: 'button',
                props: {
                  variant: resolveBinding(component.side, dataModel, templateContext) === 'buy' ? 'primary' : 'danger',
                  children: resolveBinding(component.side, dataModel, templateContext)?.toUpperCase(),
                  onClick: () => onAction?.(component.onSubmit.actionId, {})
                }
              }
            ]
          }
        ]
      };

    case 'LiquidTradingView':
      // Composite: combines chart, order book, and trade form
      return {
        type: 'stack',
        props: { direction: 'horizontal', gap: 16 },
        children: [
          {
            type: 'stack',
            props: { direction: 'vertical', gap: 16, style: { flex: 2 } },
            children: [
              transformTradingComponent(
                { type: 'LiquidChart', symbol: component.symbol, interval: { literalString: '1h' } },
                dataModel, templateContext, onAction
              ),
              transformTradingComponent(
                { type: 'LiquidOrderBook', symbol: component.symbol },
                dataModel, templateContext, onAction
              )
            ].filter(Boolean) as UINode[]
          },
          {
            type: 'stack',
            props: { direction: 'vertical', gap: 16, style: { flex: 1 } },
            children: [
              transformTradingComponent(
                { type: 'LiquidTradeForm', symbol: component.symbol, side: { literalString: 'buy' }, onSubmit: { actionId: 'trade' } },
                dataModel, templateContext, onAction
              )
            ].filter(Boolean) as UINode[]
          }
        ]
      };

    default:
      return null;
  }
}
```

### Integration with Main Transformer

```typescript
// src/a2a/transformer.ts (modified)
import { transformTradingComponent, LiquidTradingComponent } from './transformer-trading';
import { A2UI_TRADING_EXTENSION } from './types-a2ui-trading';

// Add to component type check
function isLiquidTradingComponent(component: A2UIComponent): component is LiquidTradingComponent {
  return component.type.startsWith('Liquid');
}

// Modify transformComponent function
export function transformComponent(
  component: A2UIComponent,
  surfaceState: SurfaceState,
  dataModel: DataModel,
  templateContext?: TemplateContext,
  onAction?: ActionHandler
): UINode | null {

  // Check for trading components first
  if (isLiquidTradingComponent(component)) {
    return transformTradingComponent(component, dataModel, templateContext, onAction);
  }

  // ... existing component handling
}
```

### Agent Card Update

```typescript
// server/src/a2a/agent-cards.ts
export function getLiquidCryptoAgentCard(baseUrl: string): AgentCard {
  return {
    name: 'LiquidCrypto',
    description: 'AI-powered cryptocurrency trading assistant',
    version: '2.0.0',
    url: `${baseUrl}/a2a`,
    capabilities: {
      streaming: true,
      push_notifications: true,
      state_transition_history: true,
      extensions: [
        {
          uri: 'urn:a2ui:extension:a2ui:0.8',
          description: 'A2UI rendering'
        },
        {
          uri: A2UI_TRADING_EXTENSION,
          description: 'Liquid Glass trading components',
          required: false
        }
      ]
    },
    skills: [
      {
        id: 'portfolio',
        name: 'Portfolio Management',
        description: 'View and manage your crypto portfolio'
      },
      {
        id: 'trading',
        name: 'Trading',
        description: 'Execute buy/sell orders'
      },
      {
        id: 'charts',
        name: 'Charts & Analysis',
        description: 'Technical analysis and charting'
      },
      {
        id: 'alerts',
        name: 'Price Alerts',
        description: 'Set and manage price alerts'
      }
    ]
  };
}
```

### Verification Checklist

- [ ] All 8 trading components defined
- [ ] Transformer handles trading components
- [ ] Components render correctly in GlassDynamicUI
- [ ] Data binding works with live market data
- [ ] Actions trigger correctly (trade submission)
- [ ] Extension declared in AgentCard
- [ ] External agents can send trading A2UI

---

## Phase 7: Orchestrator A2A Migration

### Goal
Migrate multi-agent orchestration to use A2A protocol for specialist communication.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                 Orchestrator A2A Architecture                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User Request (PRD)                                             │
│       │                                                          │
│       ▼                                                          │
│  Orchestrator                                                   │
│       │                                                          │
│       ├── Decompose PRD into SubPRDs                            │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              A2A Specialist Agents                       │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │                                                          │   │
│  │  UI Agent          API Agent        Security Agent      │   │
│  │  POST /agents/     POST /agents/    POST /agents/       │   │
│  │  ui/a2a           api/a2a          security/a2a         │   │
│  │       │                │                 │               │   │
│  │       └────────────────┼─────────────────┘               │   │
│  │                        │                                 │   │
│  │                        ▼                                 │   │
│  │              Shared TaskStore (PostgreSQL)              │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│       │                                                          │
│       ▼                                                          │
│  Merge Results                                                  │
│       │                                                          │
│       ▼                                                          │
│  Return to User                                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Specialist Agent Definitions

```typescript
// server/src/a2a/executors/specialists/index.ts
export { UISpecialistExecutor } from './ui-specialist';
export { APISpecialistExecutor } from './api-specialist';
export { SecuritySpecialistExecutor } from './security-specialist';
export { TestSpecialistExecutor } from './test-specialist';
```

```typescript
// server/src/a2a/executors/specialists/ui-specialist.ts
import { BaseA2UIExecutor } from '../base';
import { Message, AgentExecutionContext, AgentExecutionResult } from '@liquidcrypto/a2a-sdk';

export class UISpecialistExecutor extends BaseA2UIExecutor {
  readonly domain = 'ui';
  readonly filePatterns = ['src/components/**/*.tsx', 'src/pages/**/*.tsx'];

  async execute(message: Message, context: AgentExecutionContext): Promise<AgentExecutionResult> {
    const task = this.extractTask(message);

    // Use container runtime to execute with appropriate SDK
    const result = await this.executeWithContainer(task, {
      preferredSdk: 'claude-agent-sdk', // Best for React/CSS
      sandbox: true,
      allowedPaths: this.filePatterns
    });

    return this.createResponse(
      `UI implementation complete: ${result.summary}`,
      this.createProgressA2UI(result)
    );
  }
}
```

### Orchestrator A2A Client

```typescript
// server/src/orchestrator/a2a-orchestrator.ts
import { A2AClientWrapper, createA2AClient } from '../a2a';
import { SubPRD, AgentWorkResult, OrchestrationSession } from './types';

export class A2AOrchestrator {
  private specialists: Map<string, A2AClientWrapper> = new Map();

  constructor(private baseUrl: string) {}

  async initialize() {
    // Create clients for each specialist
    const specialistUrls = {
      ui: `${this.baseUrl}/agents/ui`,
      api: `${this.baseUrl}/agents/api`,
      security: `${this.baseUrl}/agents/security`,
      test: `${this.baseUrl}/agents/test`
    };

    for (const [domain, url] of Object.entries(specialistUrls)) {
      const client = await createA2AClient({ agentUrl: url });
      this.specialists.set(domain, client);
    }
  }

  async executeSubPRD(subPrd: SubPRD): Promise<AgentWorkResult> {
    const client = this.specialists.get(subPrd.domain);
    if (!client) {
      throw new Error(`No specialist for domain: ${subPrd.domain}`);
    }

    const { task } = await client.sendMessage(JSON.stringify(subPrd));

    return {
      domain: subPrd.domain,
      taskId: task.id,
      status: task.status.state,
      artifacts: task.artifacts,
      files: this.extractFilesFromArtifacts(task.artifacts)
    };
  }

  async executeSession(session: OrchestrationSession): Promise<AgentWorkResult[]> {
    // Execute specialists in parallel where possible
    const results = await Promise.all(
      session.subPrds.map(subPrd => this.executeSubPRD(subPrd))
    );

    return results;
  }

  async executeWithDependencies(session: OrchestrationSession): Promise<AgentWorkResult[]> {
    const results: AgentWorkResult[] = [];
    const completed = new Set<string>();

    // Topological sort based on dependencies
    const sorted = this.topologicalSort(session.subPrds);

    for (const subPrd of sorted) {
      // Wait for dependencies
      await this.waitForDependencies(subPrd.dependencies, completed);

      const result = await this.executeSubPRD(subPrd);
      results.push(result);
      completed.add(subPrd.id);
    }

    return results;
  }
}
```

### Route Registration

```typescript
// server/src/index.ts (specialist agents section)
import {
  UISpecialistExecutor,
  APISpecialistExecutor,
  SecuritySpecialistExecutor,
  TestSpecialistExecutor
} from './a2a/executors/specialists';

// Create specialist adapters
const uiAdapter = new ElysiaA2AAdapter({
  agentCard: getSpecialistAgentCard('ui', baseUrl),
  executor: new UISpecialistExecutor(),
  taskStore: sharedTaskStore  // Share store across specialists
});

const apiAdapter = new ElysiaA2AAdapter({
  agentCard: getSpecialistAgentCard('api', baseUrl),
  executor: new APISpecialistExecutor(),
  taskStore: sharedTaskStore
});

// ... security and test adapters

// Mount specialist routes
app
  .group('/agents/ui', app => app
    .get('/.well-known/agent.json', () => uiAdapter.getAgentCard())
    .post('/a2a', async ({ body }) => uiAdapter.handleRequest(body))
  )
  .group('/agents/api', app => app
    .get('/.well-known/agent.json', () => apiAdapter.getAgentCard())
    .post('/a2a', async ({ body }) => apiAdapter.handleRequest(body))
  )
  // ... security and test routes
```

### Benefits

| Aspect | Before (Internal) | After (A2A) |
|--------|------------------|-------------|
| Communication | Direct function calls | Standard protocol |
| Scaling | Same process | Can distribute to different machines |
| External agents | Not possible | Can integrate third-party specialists |
| Observability | Custom logging | Standard A2A tracing |
| Task persistence | None | PostgreSQL (shared) |

### Verification Checklist

- [ ] All 4 specialist executors created
- [ ] Specialists registered at `/agents/{domain}/a2a`
- [ ] A2AOrchestrator can call specialists
- [ ] Parallel execution works
- [ ] Dependency ordering works
- [ ] Shared TaskStore for cross-specialist queries
- [ ] External specialists can be added via URL

---

## Phase 8: Cleanup and Documentation

### Goal
Remove deprecated code, update documentation, ensure test coverage.

### Deprecated Files to Remove

| File | Reason |
|------|--------|
| `server/src/a2a/handler.ts` | Replaced by SDK RequestHandler |
| `server/src/a2a/types.ts` (old) | Replaced by SDK types + extensions |
| `src/a2a/client.ts` | Replaced by A2AClientWrapper |

### Documentation Updates

| File | Updates |
|------|---------|
| `CLAUDE.md` | Add Phase 9 section, update architecture diagram |
| `docs/A2A_SDK_INTEGRATION.md` | This document (finalize) |
| `docs/A2UI_TRADING_COMPONENTS.md` | New: Trading component reference |
| `docs/ORCHESTRATOR_A2A.md` | New: Multi-agent architecture |
| `README.md` | Update features list |

### Test Coverage Targets

| Area | Target | Files |
|------|--------|-------|
| Elysia Adapter | 85% | `tests/unit/a2a/adapter.test.ts` |
| Client Wrapper | 90% | `tests/unit/a2a/client-wrapper.test.ts` |
| Trading Transformer | 85% | `tests/unit/a2a/transformer-trading.test.ts` |
| Database Store | 80% | `tests/unit/a2a/db.test.ts` |
| gRPC Transport | 75% | `tests/unit/a2a/grpc.test.ts` |
| Orchestrator A2A | 80% | `tests/unit/orchestrator/a2a.test.ts` |

### Final Verification

- [ ] All deprecated code removed
- [ ] No unused imports
- [ ] TypeScript strict mode passes
- [ ] All tests pass
- [ ] Test coverage >80%
- [ ] Documentation complete
- [ ] CHANGELOG.md updated
- [ ] Migration guide written

---

## Appendix A: Environment Variables

```bash
# A2A SDK Configuration
A2A_DATABASE_URL=postgresql://user:pass@localhost:5432/liquidcrypto
A2A_DB_POOL_SIZE=10
A2A_DB_SSL=true

# gRPC Configuration
A2A_GRPC_ENABLED=true
A2A_GRPC_PORT=50051
A2A_GRPC_TLS_CERT=/path/to/cert.pem
A2A_GRPC_TLS_KEY=/path/to/key.pem

# Telemetry Configuration
A2A_TELEMETRY_ENABLED=true
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318

# Feature Flags
USE_SDK_A2A=true
```

---

## Appendix B: Migration Rollback

If issues arise, rollback procedure:

1. Set `USE_SDK_A2A=false` in environment
2. Restart server (will use legacy handlers)
3. Database data is preserved (can resume later)
4. Frontend falls back to old client behavior

---

## Appendix C: Estimated Lines of Code

| Phase | New Lines | Deleted Lines | Net |
|-------|-----------|---------------|-----|
| Phase 0 | 0 | 0 | 0 (copy only) |
| **Phase 0.1** | **~770** | **0** | **+770** |
| Phase 1 | ~800 | 0 | +800 |
| Phase 2 | ~300 | ~450 | -150 |
| Phase 3 | ~200 | 0 | +200 |
| **Phase 3.5** | **~3,230** | **0** | **+3,230** |
| Phase 4 | ~150 | 0 | +150 |
| Phase 5 | ~250 | 0 | +250 |
| Phase 6 | ~500 | 0 | +500 |
| Phase 7 | ~600 | ~300 | +300 |
| Phase 8 | 0 | ~600 | -600 |
| **Total** | **~6,800** | **~1,350** | **+5,450** |

**Phase 0.1 Breakdown:**
- v1.0 types: ~400 lines
- Compatibility normalizer: ~300 lines
- Version detector: ~50 lines
- Exports: ~20 lines

**Phase 3.5 Breakdown:**
- Backend (server/src/artifacts/): ~1,330 lines
- Frontend components: ~2,700 lines
- Migration script: ~100 lines
- Zustand store: ~100 lines

Plus ~4,600 lines from a2a-sdk (copied, not counted as new).

---

*Document Version: 2.0*
*Last Updated: January 14, 2026*
*Changes: Added Phase 0.1 (v1.0 Migration) and Phase 3.5 (Artifact Management)*
