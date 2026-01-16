# Cowork Mode - Implementation Plan

> **Version:** 2.1 (Gap Analysis)
> **Status:** Partially Implemented
> **Last Updated:** January 16, 2026

---

## Executive Summary

**Cowork** is a new agentic mode for Liquid Glass that enables deep work capabilities. Users describe a complex outcome, and the agent analyzes, plans, and executes via multi-step coordination with full visibility and control.

### Current Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| **UI Shell** | ✅ Complete | GlassCoworkPanel, 3-column layout, all sub-components |
| **Orchestration** | ⚠️ Partial | Basic in-memory orchestrator working; missing persistence |
| **Task Planning** | ✅ Complete | Gemini-powered TaskPlanner integrated |
| **Real-time Updates** | ✅ Complete | WebSocket events fully operational |
| **Multi-task Queue** | ⚠️ Partial | UI complete; backend queue logic & batch APIs missing |
| **Database** | ❌ Missing | Prisma schema and DB integration not started |
| **Agent Delegation** | ❌ Missing | A2A bridge and remote agent handoff not started |
| **File Sandbox** | ❌ Missing | Real file operations blocked; needs executor permissions |

---

## Missing Implementation Steps

The following sections from the original plan are **NOT YET IMPLEMENTED**:

### 1. Database Persistence (Critical)
- **Schema**: `prisma/schema.prisma` definitions for `CoworkSession`, `CoworkSubTask`, `CoworkArtifact`.
- **Integration**: Updating `Orchestrator` to use `db` calls instead of in-memory `Map`.
- **History**: Loading historical sessions from DB.

### 2. Backend Logic Components
- **Executor**: `server/src/cowork/executor.ts` - The actual logic to run commands in LiquidContainer.
- **Agent Manager**: `server/src/cowork/agent-manager.ts` - Logic to spawn and manage sub-agents.
- **Permissions**: `server/src/cowork/permissions.ts` - Security layer for file access.

### 3. Task Queue Backend
- **Batch API**: `POST /api/cowork/queues/:queueId/tasks/batch` endpoint.
- **Queue Control**: Logic to start/pause/resume the entire queue (not just individual sessions).

### 4. A2A Remote Delegation
- **A2ATaskBridge**: Service to translate Cowork steps into A2A protocol messages.
- **Remote Handshake**: Logic to discover and connect to remote agents via Agent Hub.

---

## Original Plan (Reference)

[... Content from User's Prompt would go here, effectively mirroring the "Target" state ...]

## 11. Implementation Checklist (Updated)

### Phase 1: File System Access (New) ⏳
- [ ] Backend: Implement `GET /api/system/files` endpoint
- [ ] Frontend: Create `GlassFilePicker` modal component
- [ ] Frontend: Integrate FilePicker into `CoworkInput`
- [ ] Security: Add path validation and sanitization

### Phase 2: Core Setup ✅
- [x] Create file structure (`src/pages/cowork/`, `src/components/cowork/`, `server/src/cowork/`)
- [x] Add TypeScript types (`src/types/cowork.ts`)
- [x] Create Zustand store (`src/stores/coworkStore.ts`)
- [x] WebSocket hook (`useCoworkWebSocket.ts`)

### Phase 2: Backend Services (Partial) ⚠️
- [x] Implement `CoworkOrchestrator` service (In-Memory)
- [x] Implement `TaskPlanner` (AI planning)
- [ ] Implement `TaskExecutor` (LiquidContainer integration) **[MISSING]**
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

### Phase 5: Task Queue System (Partial) ⚠️
- [x] Implement `TaskQueuePanel` component
- [ ] Implement `TaskTicket` component **[MISSING]**
- [x] Update `coworkStore` for multi-task support (UI side)
- [ ] Add batch task creation API **[MISSING]**
- [ ] Add per-task notifications **[MISSING]**
- [ ] Add task prioritization UI **[MISSING]**

### Phase 6: A2A Agent Delegation ❌
- [x] Implement `AgentSelector` component for Cowork
- [ ] Create `A2ATaskBridge` service **[MISSING]**
- [ ] Add agent capability matching **[MISSING]**
- [ ] Implement remote agent execution flow **[MISSING]**
- [ ] Add agent result transformation **[MISSING]**

### Phase 9: Persistence & Infrastructure (New) ❌
- [ ] Create `prisma/schema.prisma` models **[MISSING]**
- [ ] Update Orchestrator to use DB **[MISSING]**
- [ ] Implement `server/src/cowork/permissions.ts` **[MISSING]**

