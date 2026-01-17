# Healer & Orchestrator Systems Documentation

> **Internal Architecture Documentation**
>
> This document describes the self-healing and multi-agent orchestration systems
> that power LiquidCrypto's autonomous development capabilities.

---

## Table of Contents

1. [Overview](#overview)
2. [Healer System](#healer-system)
   - [Architecture](#healer-architecture)
   - [Error Detection & Classification](#error-detection--classification)
   - [Healing Pipeline](#healing-pipeline)
   - [PRD Generation](#prd-generation)
   - [Queue Management](#queue-management)
   - [API Reference](#healer-api-reference)
3. [Orchestrator System](#orchestrator-system)
   - [Architecture](#orchestrator-architecture)
   - [Specialist Agents](#specialist-agents)
   - [PRD Decomposition](#prd-decomposition)
   - [Session Management](#session-management)
   - [Conflict Resolution](#conflict-resolution)
   - [Event System](#event-system)
   - [API Reference](#orchestrator-api-reference)
4. [Integration](#integration)
5. [Configuration](#configuration)
6. [Troubleshooting](#troubleshooting)

---

## Overview

LiquidCrypto implements two complementary systems for autonomous development:

| System | Purpose | Key Feature |
|--------|---------|-------------|
| **Healer** | Self-healing production loop | Automatically detects, analyzes, and fixes runtime errors |
| **Orchestrator** | Multi-agent coordination | Decomposes complex PRDs for parallel execution by specialist agents |

### Three-Layer Architecture

Both systems follow the 3-layer architecture defined in `CLAUDE.md`:

```
┌─────────────────────────────────────────────────────────────────┐
│                    LAYER 1: DIRECTIVE                           │
│  (What to do)                                                   │
│  • directives/ralph_node.md - Ralph autonomous loop             │
│  • directives/orchestrator.md - Orchestration SOP               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  LAYER 2: ORCHESTRATION                         │
│  (Decision making)                                              │
│  • Healer: Error analysis, PRD generation                       │
│  • Orchestrator: Task decomposition, agent coordination         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LAYER 3: EXECUTION                           │
│  (Doing the work)                                               │
│  • Ralph Loop: Executes healing PRDs                            │
│  • Specialist Agents: Execute sub-PRDs in parallel              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Healer System

### Healer Architecture

The Healer implements a **self-healing production loop** that automatically fixes runtime errors.

**Location:** `server/src/healer/`

```
server/src/healer/
├── index.ts      # Main module, orchestration
├── analyzer.ts   # AI-driven error analysis
├── queue.ts      # Persistent task queue
├── prompts.ts    # AI prompt templates
└── types.ts      # Type definitions
```

**Flow:**

```
Client Error → Audit API → Deduplication → Queue → AI Analysis → PRD → Ralph Loop → Fix
```

### Error Detection & Classification

#### Error Report Structure

```typescript
interface ErrorReport {
  type: 'client_error' | 'server_error' | 'security_breach';
  message: string;
  stack?: string;
  context: {
    componentName?: string;    // Component that threw error
    url?: string;              // URL where error occurred
    userAgent?: string;        // Browser user agent
    requestId?: string;        // Request correlation ID
    level?: 'component' | 'page' | 'app';  // Error scope
    errorCount?: number;       // Occurrence frequency
    [key: string]: unknown;    // Additional metadata
  };
  timestamp: string;           // ISO 8601
}
```

#### Error Types

| Type | Description | Default Priority |
|------|-------------|------------------|
| `client_error` | Frontend application errors | Medium |
| `server_error` | Backend runtime failures | Medium |
| `security_breach` | Security-related incidents | Critical |

#### Error Levels

| Level | Scope | Impact |
|-------|-------|--------|
| `component` | Single component failure | Low - isolated |
| `page` | Page-level failure | Medium - user impact |
| `app` | Application-wide failure | Critical - service down |

#### Priority Classification

Priority is automatically determined:

```typescript
function determinePriority(error: ErrorReport): Priority {
  // Security breaches are always critical
  if (error.type === 'security_breach') return 'critical';

  // App-level errors are critical
  if (error.context.level === 'app') return 'critical';

  // Page-level or frequent errors are high
  if (error.context.level === 'page') return 'high';
  if ((error.context.errorCount || 0) > 10) return 'high';

  // Component errors with frequency are medium
  if (error.context.level === 'component' && (error.context.errorCount || 0) > 3) {
    return 'medium';
  }

  return 'low';
}
```

#### Deduplication

Errors are deduplicated using SHA-256 hashing to prevent duplicate healing attempts:

```typescript
function hashError(error: ErrorReport): string {
  const stackPrefix = error.stack?.split('\n').slice(0, 5).join('\n') || '';
  const content = `${error.message}|${error.context.componentName || ''}|${stackPrefix}`;
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}
```

**Deduplication Entry:**

```typescript
interface ErrorDedupeEntry {
  hash: string;              // Error signature
  count: number;             // Occurrence count
  firstSeen: string;         // First occurrence
  lastSeen: string;          // Last occurrence
  healingInProgress: boolean; // Currently healing?
  lastHealingAttempt?: string; // Last attempt timestamp
}
```

**Window:** 24 hours (configurable)

### Healing Pipeline

#### Task States

```
queued → analyzing → prd_ready → healing → verifying → completed
                                    ↓
                                  failed
```

| State | Description |
|-------|-------------|
| `queued` | New error awaiting analysis |
| `analyzing` | AI analysis in progress |
| `prd_ready` | PRD generated, ready for execution |
| `healing` | Ralph loop executing fixes |
| `verifying` | Tests running to validate |
| `completed` | Successfully healed |
| `failed` | Analysis/healing failed |

#### Healing Task Structure

```typescript
interface HealingTask {
  id: string;                    // Unique task ID
  errorReport: ErrorReport;      // Original error
  prd?: HealingPRD;             // Generated PRD
  status: HealingTaskStatus;     // Current state
  attempts: number;              // Retry count
  maxAttempts: number;           // Max retries (default: 3)
  lastError?: string;            // Last failure reason
  createdAt: string;
  updatedAt: string;
  healingBranch?: string;        // Git branch with fixes
  pullRequestUrl?: string;       // PR URL if created
}
```

### PRD Generation

The Healer uses AI (Claude API) to analyze errors and generate healing PRDs.

#### Healing PRD Structure

```typescript
interface HealingPRD {
  id: string;
  title: string;
  summary: string;
  rootCause: string;             // AI-determined root cause
  stories: HealingStory[];       // Actionable fix stories
  errorHash: string;             // Link to original error
  priority: 'critical' | 'high' | 'medium' | 'low';
  createdAt: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  relatedErrors: string[];       // Similar error hashes
}

interface HealingStory {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  affectedFiles: string[];
  complexity: number;            // 1-5 scale
}
```

#### AI Analysis Context

```typescript
interface AnalysisContext {
  error: ErrorReport;
  similarErrors?: ErrorReport[];
  codeContext?: Array<{
    file: string;
    content: string;
    lineNumbers: [number, number];
  }>;
  projectStructure?: string[];
}
```

#### PRD Validation

Generated PRDs are validated before execution:

- PRD must have at least 1 story
- Each story requires:
  - Title (min 5 characters)
  - Description (min 10 characters)
  - At least 1 acceptance criterion
- Root cause analysis (min 10 characters)

### Queue Management

#### Storage

The queue uses file-based persistence with in-memory caching:

```
.healing/
├── queue.json     # All healing tasks
└── dedupe.json    # Deduplication index
```

#### Queue Status

```typescript
interface HealingQueueStatus {
  total: number;
  byStatus: Record<HealingTaskStatus, number>;
  activeHealing: number;
  successCount: number;
  failedCount: number;
}
```

#### Queue Operations

```typescript
// Add error to queue
enqueueHealingTask(error: ErrorReport): Promise<HealingTask | null>

// Get next task for processing
getNextTask(): Promise<HealingTask | null>

// Update task status
updateTaskStatus(taskId: string, status: HealingTaskStatus): Promise<void>

// Attach PRD to task
setTaskPRD(taskId: string, prd: HealingPRD): Promise<void>

// Get queue status
getQueueStatus(): HealingQueueStatus

// Clear completed tasks
clearCompletedTasks(): Promise<number>
```

### Healer API Reference

#### Module Exports

```typescript
// server/src/healer/index.ts
export {
  // Initialization
  initHealer,
  shutdownHealer,

  // Error submission
  submitError,

  // Processing
  processNextTask,
  processAllPending,

  // Auto-healing
  startAutoHealing,
  stopAutoHealing,

  // Status
  getHealingStatus,

  // Cleanup
  clearCompleted,
}
```

#### REST Endpoint

```http
POST /api/v1/security/audit
Content-Type: application/json

{
  "type": "client_error",
  "message": "Cannot read property 'foo' of undefined",
  "stack": "TypeError: Cannot read property...",
  "context": {
    "componentName": "Dashboard",
    "url": "http://localhost:3000/dashboard",
    "level": "page",
    "errorCount": 5
  },
  "timestamp": "2026-01-17T10:00:00Z"
}
```

#### GraphQL API

```graphql
# Submit error report
mutation submitErrorReport($input: ErrorReportInput!) {
  submitErrorReport(input: $input) {
    id
    type
    message
    status
    timestamp
  }
}

# Start healing for specific error
mutation startHealing($errorId: ID!) {
  startHealing(errorId: $errorId) {
    id
    title
    priority
    status
  }
}

# Get healing status
query healingStatus {
  healingStatus {
    queueTotal
    activeHealing
    successCount
    failedCount
    autoHealEnabled
  }
}

# Get error reports
query errorReports($limit: Int) {
  errorReports(limit: $limit) {
    id
    type
    message
    timestamp
    status
  }
}

# Get healing PRDs
query healingPRDs($status: HealingStatus) {
  healingPRDs(status: $status) {
    id
    title
    priority
    status
    createdAt
  }
}
```

---

## Orchestrator System

### Orchestrator Architecture

The Orchestrator enables **multi-agent parallel development** by decomposing complex PRDs into sub-tasks for specialist agents.

**Location:** `server/src/orchestrator/`

```
server/src/orchestrator/
├── index.ts        # Main orchestrator class
├── decompose.ts    # PRD decomposition logic
├── specialists.ts  # Agent definitions
└── types.ts        # Type definitions
```

**Extended Cowork System:** `server/src/cowork/`

```
server/src/cowork/
├── orchestrator.ts   # Extended CoworkOrchestrator (1600 lines)
├── agent-manager.ts  # Concurrency management (830 lines)
├── executor.ts       # Task execution engine
├── types.ts          # Cowork types
├── permissions.ts    # Permission validation
├── repository.ts     # Database persistence
└── sandbox/          # Isolated execution
```

**Flow:**

```
PRD → Decompose → Analyze Conflicts → Assign Specialists → Execute (parallel) → Merge → Verify
```

### Specialist Agents

Four built-in specialist agents handle different domains:

#### UI Specialist

```typescript
{
  id: 'ui-specialist',
  name: 'UI Specialist',
  domain: 'ui',
  filePatterns: [
    'src/components/**/*.tsx',
    'src/components/**/*.css',
    'src/styles/**/*',
    'src/hooks/use*UI*.ts'
  ],
  expertise: [
    'React components',
    'CSS/Tailwind',
    'Accessibility',
    'Responsive design',
    'Animations'
  ],
  priority: 1
}
```

#### API Specialist

```typescript
{
  id: 'api-specialist',
  name: 'API Specialist',
  domain: 'api',
  filePatterns: [
    'server/src/**/*.ts',
    'src/api/**/*.ts',
    'src/services/**/*.ts'
  ],
  expertise: [
    'REST/GraphQL APIs',
    'Database interactions',
    'Caching',
    'Authentication',
    'Error handling'
  ],
  priority: 1
}
```

#### Security Specialist

```typescript
{
  id: 'security-specialist',
  name: 'Security Specialist',
  domain: 'security',
  filePatterns: [
    '**/auth/**/*.ts',
    '**/security/**/*.ts',
    '**/validation/**/*.ts',
    'server/src/middleware/**/*.ts'
  ],
  expertise: [
    'Authentication/Authorization',
    'Input validation',
    'OWASP compliance',
    'Encryption',
    'Audit logging'
  ],
  priority: 2
}
```

#### Test Specialist

```typescript
{
  id: 'test-specialist',
  name: 'Test Specialist',
  domain: 'test',
  filePatterns: [
    'tests/**/*.ts',
    '**/*.test.ts',
    '**/*.spec.ts',
    'e2e/**/*.ts'
  ],
  expertise: [
    'Unit testing (Vitest)',
    'Integration testing',
    'E2E testing (Playwright)',
    'TDD',
    'Code coverage'
  ],
  priority: 1
}
```

#### Agent Selection

```typescript
// By domain
const agent = getSpecialistByDomain('ui');

// By file path
const agent = matchFileToSpecialist('src/components/Button.tsx');

// By story analysis
const agent = determineSpecialist({
  domain: 'api',
  affectedFiles: ['server/src/routes/users.ts']
});
```

### PRD Decomposition

#### PRD Structure

```typescript
interface PRD {
  id: string;
  title: string;
  summary: string;
  stories: PRDStory[];
  createdAt: string;
  status: 'draft' | 'ready' | 'in_progress' | 'completed' | 'failed';
}

interface PRDStory {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  affectedFiles: string[];
  complexity: number;           // 1-5 scale
  domain: 'ui' | 'api' | 'security' | 'test' | 'infrastructure' | 'general';
}
```

#### Sub-PRD Structure

```typescript
interface SubPRD {
  id: string;
  parentPrdId: string;
  agentId: string;              // Assigned specialist
  stories: PRDStory[];          // Stories for this agent
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: AgentWorkResult;
  createdAt: string;
  updatedAt: string;
}
```

#### Decomposition Strategies

**1. Domain-Based (Default)**

Groups stories by specialist domain, splits large groups.

```typescript
decomposePRD(prd, { splitBy: 'domain', maxStoriesPerAgent: 5 })
```

**2. File-Based**

Groups by primary affected file's specialist.

```typescript
decomposePRD(prd, { splitBy: 'file' })
```

**3. Complexity-Based**

Distributes stories evenly for load balancing.

```typescript
decomposePRD(prd, { splitBy: 'complexity' })
```

**4. Dependency-Based**

Respects story order with sequential sub-PRDs.

```typescript
decomposePRD(prd, { splitBy: 'dependency', allowParallel: false })
```

#### Strategy Configuration

```typescript
interface DecompositionStrategy {
  name: string;
  splitBy: 'domain' | 'file' | 'complexity' | 'dependency';
  maxStoriesPerAgent: number;   // Default: 5
  allowParallel: boolean;       // Default: true
}
```

### Session Management

#### Session Structure

```typescript
interface OrchestrationSession {
  id: string;
  prd: PRD;
  subPrds: SubPRD[];
  status: 'decomposing' | 'executing' | 'merging' | 'verifying' | 'completed' | 'failed';
  mainBranch: string;
  featureBranch: string;
  mergeResult?: MergeResult;
  verificationResult?: VerificationResult;
  createdAt: string;
  updatedAt: string;
}
```

#### Session Lifecycle

```
1. createSession(prd, strategy)
   └─ Decomposes PRD, analyzes conflicts

2. executeSession(sessionId)
   └─ Runs agents in parallel batches

3. mergeResults(sessionId)
   └─ Collects files, detects conflicts

4. verifyResults(sessionId)
   └─ Runs tests, lint, type checks

5. Session completed or failed
```

#### Session Status Flow

```
decomposing → executing → merging → verifying → completed
                                                   ↓
                                                failed
```

### Conflict Resolution

#### Conflict Detection

During decomposition, the system detects potential file conflicts:

```typescript
interface ConflictAnalysis {
  potentialConflicts: Array<{
    file: string;
    agents: string[];
  }>;
  canParallelize: boolean;
}

const analysis = analyzeConflicts(subPrds);
if (!analysis.canParallelize) {
  // Switch to sequential execution
}
```

#### Merge Process

```typescript
interface MergeResult {
  success: boolean;
  mergedFiles: string[];
  resolvedConflicts: string[];
  unresolvedConflicts: string[];
  duration: number;
}
```

**Merge Strategy:**

1. Collect all modified files from agent results
2. Track file-level conflicts (same file, multiple agents)
3. Success only if `unresolvedConflicts.length === 0`
4. Unresolved conflicts require manual intervention

#### Conflict Avoidance SOP

From `directives/orchestrator.md`:

1. **Isolation:** Use feature-specific subdirectories
2. **Shared Files:** Orchestrator handles post-execution
   - `src/index.ts`
   - `App.tsx`
   - `server/src/index.ts`
3. **Merge Order:** Security/Backend first, then UI

### Event System

#### Event Types

```typescript
type OrchestratorEvent =
  | { type: 'session_started'; sessionId: string }
  | { type: 'decomposition_complete'; subPrdCount: number }
  | { type: 'agent_started'; agentId: string; subPrdId: string }
  | { type: 'agent_completed'; agentId: string; success: boolean }
  | { type: 'merge_started' }
  | { type: 'merge_completed'; success: boolean }
  | { type: 'verification_started' }
  | { type: 'verification_completed'; passed: boolean }
  | { type: 'session_completed'; success: boolean }
  | { type: 'error'; error: string };
```

#### Event Handler

```typescript
initOrchestrator({
  onEvent: (event) => {
    switch (event.type) {
      case 'agent_started':
        console.log(`Agent ${event.agentId} started`);
        break;
      case 'agent_completed':
        console.log(`Agent ${event.agentId}: ${event.success ? 'OK' : 'FAILED'}`);
        break;
      case 'session_completed':
        console.log(`Session complete: ${event.success}`);
        break;
    }
  }
});
```

### Orchestrator API Reference

#### Module Exports

```typescript
// server/src/orchestrator/index.ts
export {
  // Initialization
  initOrchestrator,

  // Session management
  createSession,
  getSession,
  getAllSessions,
  cancelSession,

  // Execution
  executeSession,
  executeAgent,

  // Results
  mergeResults,
  verifyResults,

  // Cleanup
  cleanupSessions,

  // Status
  getOrchestratorStatus,
}

// server/src/orchestrator/specialists.ts
export {
  specialists,
  getSpecialist,
  getSpecialistByDomain,
  matchFileToSpecialist,
  determineSpecialist,
}

// server/src/orchestrator/decompose.ts
export {
  decomposePRD,
  analyzeConflicts,
  estimateWork,
}
```

#### Result Types

```typescript
interface AgentWorkResult {
  success: boolean;
  modifiedFiles: string[];
  branchName?: string;
  commits: string[];
  errors: string[];
  duration: number;
}

interface VerificationResult {
  passed: boolean;
  testsRun: number;
  testsPassed: number;
  testsFailed: number;
  lintIssues: number;
  typeErrors: number;
  issues: string[];
}
```

---

## Integration

### Healer + Orchestrator Integration

For complex error fixes that span multiple domains:

```typescript
// 1. Error triggers Healer
const task = await submitError(errorReport);

// 2. Healer generates PRD
const prd = await analyzeError(task.errorReport);

// 3. If PRD has multiple domains, use Orchestrator
if (prd.stories.some(s => s.domain !== prd.stories[0].domain)) {
  // Hand off to Orchestrator
  const session = createSession(prd);
  await executeSession(session.id);
} else {
  // Simple fix, use Ralph loop directly
  await runRalphLoop(prd);
}
```

### REST API Integration

**Security Audit Endpoint:**

```typescript
// server/src/security.ts
export async function runSecurityAudit(report?: any) {
  if (report && report.type === 'client_error') {
    // Trigger self-healing for critical errors
    if (report.context?.level === 'page' || report.context?.errorCount > 3) {
      appendToHealingQueue({
        type: 'client_error',
        message: report.message,
        stack: report.stack,
        context: report.context,
        timestamp: report.timestamp
      });
    }
  }
  // ... return audit results
}
```

### GraphQL Integration

Both systems expose GraphQL APIs for monitoring and control:

```graphql
# Healer queries/mutations in schema
type Query {
  healingStatus: HealingStatus!
  errorReports(limit: Int): [ErrorReport!]!
  healingPRDs(status: HealingStatus): [HealingPRD!]!
}

type Mutation {
  submitErrorReport(input: ErrorReportInput!): ErrorReport!
  startHealing(errorId: ID!): HealingPRD
}

# Orchestrator queries/mutations in schema
type Query {
  orchestrationSessions: [OrchestrationSession!]!
  sessionStatus(id: ID!): SessionStatus!
}

type Mutation {
  createOrchestrationSession(prd: PRDInput!): OrchestrationSession!
  executeSession(id: ID!): ExecutionResult!
  cancelSession(id: ID!): Boolean!
}
```

---

## Configuration

### Healer Configuration

```typescript
interface HealerConfig {
  aiProvider?: AIProvider;        // Claude API function
  autoHeal: boolean;              // Enable auto-healing (default: false)
  processingInterval: number;     // Queue check interval (default: 60000ms)
  maxConcurrent: number;          // Max simultaneous tasks (default: 1)
  onNotify?: (event: string, data: unknown) => void;
}

// Initialize
await initHealer({
  autoHeal: process.env.AUTO_HEAL === 'true',
  processingInterval: 60000,
  aiProvider: async (messages) => await callClaudeAPI(messages)
});
```

### Queue Configuration

```typescript
interface QueueConfig {
  storagePath: string;            // Default: .healing/queue.json
  dedupePath: string;             // Default: .healing/dedupe.json
  maxQueueSize: number;           // Default: 100
  maxAttempts: number;            // Default: 3
  dedupeWindowMs: number;         // Default: 24 hours
}
```

### Orchestrator Configuration

```typescript
interface OrchestratorConfig {
  parallelExecution: boolean;     // Default: true
  maxConcurrent: number;          // Default: 4
  agentTimeout: number;           // Default: 300000ms (5 min)
  autoMerge: boolean;             // Default: false
  autoVerify: boolean;            // Default: false
  onEvent?: OrchestratorEventHandler;
}

// Initialize
initOrchestrator({
  parallelExecution: true,
  maxConcurrent: 4,
  autoMerge: false,
  onEvent: (event) => console.log(event)
});
```

### Environment Variables

```bash
# Healer
AUTO_HEAL=true                    # Enable auto-healing
HEALING_INTERVAL=60000            # Queue processing interval (ms)

# AI Providers
ANTHROPIC_API_KEY=sk-ant-...      # Claude API key
GEMINI_API_KEY=...                # Gemini API key (fallback)

# Database (for persistence)
DATABASE_URL=postgresql://...     # PostgreSQL connection
```

---

## Troubleshooting

### Healer Issues

#### Error Not Being Processed

1. Check deduplication window:
   ```typescript
   const isRecent = await isRecentlyHealed(errorHash);
   // If true, error was recently processed
   ```

2. Check queue status:
   ```typescript
   const status = getQueueStatus();
   console.log(status.byStatus);
   ```

3. Verify AI provider is configured:
   ```typescript
   // Check ANTHROPIC_API_KEY is set
   ```

#### PRD Generation Failing

1. Check AI response format
2. Verify PRD validation rules
3. Review error context completeness

### Orchestrator Issues

#### Agents Not Running in Parallel

1. Check `parallelExecution` config
2. Verify no file conflicts:
   ```typescript
   const { canParallelize } = analyzeConflicts(subPrds);
   ```

3. Check `maxConcurrent` setting

#### Merge Conflicts

1. Review `unresolvedConflicts` in merge result
2. Check shared file handling
3. Consider sequential execution for complex changes

#### Session Stuck

1. Check agent timeout
2. Review event logs for errors
3. Cancel and retry:
   ```typescript
   cancelSession(sessionId);
   const newSession = createSession(prd);
   ```

### Debugging

Enable verbose logging:

```typescript
// Healer
initHealer({
  onNotify: (event, data) => {
    console.log(`[Healer] ${event}:`, JSON.stringify(data, null, 2));
  }
});

// Orchestrator
initOrchestrator({
  onEvent: (event) => {
    console.log(`[Orchestrator] ${event.type}:`, JSON.stringify(event, null, 2));
  }
});
```

---

## Execution Flow Diagrams

### Healer Flow

```
┌─────────────────────┐
│  Error Detected     │
│  (Client/Server)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  POST /security/    │
│  audit              │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐     ┌─────────────────────┐
│  Deduplication      │────►│  Skip (recently     │
│  Check              │ yes │  processed)         │
└──────────┬──────────┘     └─────────────────────┘
           │ no
           ▼
┌─────────────────────┐
│  Enqueue Task       │
│  status: queued     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  AI Analysis        │
│  (Claude API)       │
│  status: analyzing  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Generate PRD       │
│  status: prd_ready  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Ralph Loop         │
│  status: healing    │
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     │           │
     ▼           ▼
┌─────────┐ ┌─────────┐
│ Success │ │ Failed  │
│completed│ │ (retry?)│
└─────────┘ └─────────┘
```

### Orchestrator Flow

```
┌─────────────────────┐
│  PRD Received       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Decompose PRD      │
│  (by domain/file)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐     ┌─────────────────────┐
│  Analyze Conflicts  │────►│  Sequential Mode    │
│                     │ yes │  (conflicts found)  │
└──────────┬──────────┘     └──────────┬──────────┘
           │ no                        │
           ▼                           │
┌─────────────────────┐                │
│  Parallel Execution │                │
│  (batches of 4)     │◄───────────────┘
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Agent 1  Agent 2   │
│  Agent 3  Agent 4   │
│  (concurrent)       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Merge Results      │
│  (collect files)    │
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     │           │
     ▼           ▼
┌─────────┐ ┌─────────────┐
│ Success │ │ Conflicts   │
│         │ │ (manual fix)│
└────┬────┘ └─────────────┘
     │
     ▼
┌─────────────────────┐
│  Verify             │
│  (tests/lint/types) │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  COMPLETED          │
└─────────────────────┘
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | January 2026 | Initial documentation |

---

## References

- `docs/IMPLEMENTATION_PLAN.md` - Section 4.2 (Healer) and 4.3 (Orchestrator)
- `directives/ralph_node.md` - Ralph autonomous loop
- `directives/orchestrator.md` - Orchestration SOP
- `server/src/healer/` - Healer implementation
- `server/src/orchestrator/` - Orchestrator implementation
- `server/src/cowork/` - Extended cowork system
