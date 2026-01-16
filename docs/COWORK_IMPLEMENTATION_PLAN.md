# Cowork Mode - Implementation Plan

> **Version:** 2.2 (Feature Complete)
> **Status:** All Core Features Implemented
> **Last Updated:** January 16, 2026

---

## Executive Summary

**Cowork** is a new agentic mode for Liquid Glass that enables deep work capabilities. Users describe a complex outcome, and the agent analyzes, plans, and executes via multi-step coordination with full visibility and control.

### Current Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| **UI Shell** | ✅ Complete | GlassCoworkPanel, 3-column layout, all sub-components |
| **Orchestration** | ✅ Complete | Orchestrator with DB persistence and memory fallback |
| **Task Planning** | ✅ Complete | Gemini-powered TaskPlanner integrated |
| **Real-time Updates** | ✅ Complete | WebSocket events fully operational |
| **Multi-task Queue** | ✅ Complete | TaskTicket, batch APIs, notifications, priority UI |
| **Database** | ✅ Complete | SQL migration and repository layer integrated |
| **Agent Delegation** | ✅ Complete | A2A bridge, capability matching, remote execution, and routes |
| **File Sandbox** | ✅ Complete | Isolated staging system with SandboxManager, DiffReviewer, conflict detection |
| **Permissions** | ✅ Complete | Security layer with path validation, extension filters, capability-based access |
| **Agent Manager** | ✅ Complete | Concurrent agent spawning, health monitoring, priority queue, retry logic |

---

## Missing Implementation Steps

The following sections from the original plan are **NOT YET IMPLEMENTED**:

### 1. Database Persistence ✅ (Completed)
- **Schema**: `server/sql/004_cowork_system.sql` - Full SQL migration with tables for sessions, subtasks, artifacts, agents, notifications, file operations, and queue.
- **Repository**: `server/src/cowork/repository.ts` - Complete repository layer with CRUD operations.
- **Integration**: `Orchestrator` updated to use database with in-memory fallback.
- **History**: `getSessionHistory()` and `getQueueStats()` methods implemented.

### 2. Backend Logic Components ✅ (Completed)
- **Executor**: `server/src/cowork/executor.ts` - ✅ Task execution with sandbox support, output streaming, artifact creation.
- **Agent Manager**: `server/src/cowork/agent-manager.ts` - ✅ Concurrent agent spawning with priority queue, health monitoring, retry logic, graceful termination.
- **Permissions**: `server/src/cowork/permissions.ts` - ✅ Security layer with path validation, blocked prefixes, extension filters, workspace boundaries, size limits, sandbox isolation.

### 3. Task Queue Backend
- **Batch API**: `POST /api/cowork/queues/:queueId/tasks/batch` endpoint.
- **Queue Control**: Logic to start/pause/resume the entire queue (not just individual sessions).

### 4. A2A Remote Delegation ✅ (Completed)
- **A2ATaskBridge**: `server/src/cowork/a2a-bridge.ts` - Complete service for protocol translation.
- **AgentDiscoveryService**: Discovery and probing of remote A2A agents.
- **Capability Matching**: Intelligent matching of subtasks to agent skills.
- **Remote Execution**: Full execution flow with polling, cancellation, and result transformation.
- **API Routes**: Complete REST API for agent management (`/agents/remote/*`).

---

## Original Plan (Reference)

[... Content from User's Prompt would go here, effectively mirroring the "Target" state ...]

## 11. Implementation Checklist (Updated)

### Phase 0: Isolated Staging System ✅
- [x] Backend: Implement `SandboxManager` service
- [x] Backend: Implement `BackupManager` and `ConflictDetector`
- [x] Backend: Implement `AuditLogger` for compliance trail
- [x] Backend: Implement `FileHasher` utility
- [x] Database: Create `003_sandbox_system.sql` migration
- [x] API: Implement Elysia routes for Sandbox operations
- [x] Frontend: `DiffReviewer` and `SandboxIndicator` components
- [x] Frontend: `sandboxStore` Zustand store
- [x] Integration: Connect sandbox to `CoworkOrchestrator`
- [x] Jobs: `sandbox-cleanup.ts` background cleanup job

### Phase 1: File System Access ✅
- [x] Backend: Implement `GET /api/system/files` endpoint
- [x] Frontend: Create `GlassFilePicker` modal component
- [x] Frontend: Integrate FilePicker into `CoworkInput`
- [x] Security: Add path validation and sanitization

### Phase 2: Core Setup ✅
- [x] Create file structure (`src/pages/cowork/`, `src/components/cowork/`, `server/src/cowork/`)
- [x] Add TypeScript types (`src/types/cowork.ts`)
- [x] Create Zustand store (`src/stores/coworkStore.ts`)
- [x] WebSocket hook (`useCoworkWebSocket.ts`)

### Phase 2: Backend Services ✅
- [x] Implement `CoworkOrchestrator` service (In-Memory + DB persistence)
- [x] Implement `TaskPlanner` (AI planning)
- [x] Implement `TaskExecutor` (`server/src/cowork/executor.ts`)
  - Task script generation based on subtask type
  - Output streaming via EventEmitter
  - Artifact parsing from execution output
  - Sandbox-aware execution paths
  - Configurable via `COWORK_REAL_EXECUTION` env var
- [x] Add REST API routes (Basic)
- [x] Add WebSocket event handlers

### Phase 3: Frontend Components ✅
- [x] Create `CoworkPage` / `GlassCoworkPanel` layout
- [x] Create `CoworkInput` component
- [x] Create `QuickActions` component
- [x] Create `PlanReviewModal` component
- [x] Create `TaskProgress` component
- [x] Create `AgentCardsPanel` component
- [x] Create `SteeringControls` component
- [x] Create `ArtifactsPanel` component
- [x] Create `TaskHistorySidebar` component

### Phase 4: Integration ✅
- [x] Add route to router (removed in favor of overlay)
- [x] Add to GlassDock / navigation
- [x] Connect WebSocket hook
- [x] Test full flow end-to-end (UI only)

### Phase 5: Task Queue System ✅
- [x] Implement `TaskQueuePanel` component
- [x] Implement `TaskTicket` component
- [x] Update `coworkStore` for multi-task support (UI side)
- [x] Add batch task creation API (`POST /api/v1/cowork/queue/batch`)
- [x] Add per-task notifications (WebSocket events + notification store)
- [x] Add task prioritization UI (`TaskPrioritySelector`, `PriorityBadge`, `QuickPriorityButtons`)
- [x] Add queue control APIs (`/queue/pause`, `/queue/resume`, `/queue/cancel`, `/queue/reorder`)

### Phase 6: A2A Agent Delegation ✅
- [x] Implement `AgentSelector` component for Cowork
- [x] Create `A2ATaskBridge` service (`server/src/cowork/a2a-bridge.ts`)
- [x] Add agent capability matching (keyword extraction, skill matching, capability inference)
- [x] Implement remote agent execution flow (message translation, polling, cancellation)
- [x] Add agent result transformation (A2A → SubTaskResult)
- [x] Integrate A2ATaskBridge into Orchestrator (`executeOnRemoteAgent`)
- [x] Add `AgentDiscoveryService` for discovering remote agents
- [x] Add A2A REST routes (`GET/POST /agents/remote/*`)

### Phase 9: Database Persistence ✅
- [x] Create `server/sql/004_cowork_system.sql` migration
- [x] Implement `CoworkRepository` with all entity repositories
- [x] Update Orchestrator to use DB with memory fallback
- [x] Add `getSessionHistory()` and `getQueueStats()` methods
- [x] Implement `server/src/cowork/permissions.ts`

### Phase 10: Security & Agent Management ✅
- [x] Implement `PermissionService` (`server/src/cowork/permissions.ts`)
  - Multi-layer validation pipeline (normalize → blocked → boundary → extension → capability → size → sandbox)
  - Path traversal protection with symlink resolution
  - Blocked system prefixes (`/etc`, `/var`, `/usr`, `/System`, etc.)
  - Workspace boundary enforcement
  - Extension filtering (block/whitelist modes)
  - Capability-based access control (read/write/delete/execute)
  - Size limits (per-file and per-session)
  - Sandbox isolation when active
  - Audit logging for compliance
- [x] Implement `AgentManager` (`server/src/cowork/agent-manager.ts`)
  - Priority queue with semaphore-based concurrency control
  - Agent lifecycle management (queued → initializing → working → completed/failed/terminated)
  - Health monitoring with heartbeat-based detection
  - Configurable retry logic with backoff
  - Pause/resume queue processing
  - Batch spawning with parallel execution
  - Event emissions for all state transitions
  - Graceful termination (single agent, session, or all)
- [x] Integrate into Orchestrator
  - Permission validation before task execution
  - AgentManager event forwarding
  - `executeParallelSubTasks()` method for batch execution
  - Accessor methods for external control

