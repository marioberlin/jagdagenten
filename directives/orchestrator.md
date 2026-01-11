# Directive: Multi-Agent Orchestrator

This directive defines the SOP for the "Principal Agent" responsible for coordinating parallel development across specialist sub-agents.

## Goal
Decompose a monolithic Product Requirements Document (PRD) into atomic, domain-specific sub-PRDs that can be executed in parallel by specialist agents (UI, API, Security, etc.) without semantic or file-level conflicts.

## Orchestration Strategy

### 1. Domain Analysis
Identify the core domains touched by the task:
- **UI/Layout**: `src/components`, `src/pages`, `src/styles`
- **Business Logic/API**: `server/src`, `src/services`
- **Security/Middleware**: `server/src/security.ts`, `server/src/middleware/`
- **Infrastructure/CI**: `.github/workflows/`, `scripts/`, `Dockerfile`

### 2. PRD Decomposition
Split the main `prd.json` into `prd.specialist-[name].json`:
- **Rules**:
  - Each specialist PRD must be independent.
  - If File A is modified by Specialist 1, it SHOULD NOT be modified by Specialist 2.
  - If cross-domain dependency exists (e.g., UI needs a new API field), the API specialist must finish first, or use a mock.

### 3. Context Injection
Each specialist should receive:
1. Their specific `prd.json`.
2. The global `ARCHITECTURE.md` for standards.
3. Relevant file outlines (never the whole codebase) for their specific domain.

## Conflict Avoidance SOP
- **Isolation**: Use feature-specific subdirectories where possible.
- **Shared Files**: Modifications to `src/index.ts`, `App.tsx`, or `server/src/index.ts` must be performed by the **Orchestrator** after specialist work is completed.
- **Merge Order**: Security/Backend specialists merge first; UI specialists merge second.

## Specialist Handover
An Orchestrator confirms a specialist is "COMPLETE" only when:
- `bun test` passes for that specialist’s logic.
- `scripts/merge_master.ts` reports zero file-level overlaps.
