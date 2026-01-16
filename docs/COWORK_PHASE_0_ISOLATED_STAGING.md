# Isolated Staging System: Implementation Plan

> **Version:** 1.0
> **Status:** Implementation Ready
> **Last Updated:** January 16, 2026

---

## Executive Summary

This plan details the implementation of a secure, performant filesystem isolation system for agent execution. The system allows agents to work destructively on project files without risk to user data, with full audit trails, conflict detection, and granular merge controls.

---

## Part 1: Architecture Overview

### 1.1 System Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │ File Picker │  │  Sandbox    │  │    Diff     │  │   Merge    │ │
│  │  Component  │  │  Monitor    │  │   Reviewer  │  │  Controls  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API Layer (tRPC/REST)                          │
│  POST /sandbox/create  │  GET /sandbox/diff  │  POST /sandbox/apply │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Orchestration Layer                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ SandboxManager   │  │ ConflictDetector │  │   AuditLogger    │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  BackupManager   │  │   MergeEngine    │  │  WatcherService  │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Execution Layer                                │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  ContainerPool   │  │   FileSystem     │  │    Database      │  │
│  │  (Docker)        │  │   Operations     │  │   (Postgres)     │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Data Flow

```
User Request → Validation → Sandbox Creation → Container Mount → Agent Execution
                                                                       │
                                                                       ▼
User Decision ← Merge UI ← Diff Generation ← Conflict Check ← Work Complete
      │
      ▼
[Apply/Partial Apply/Discard] → Backup → Merge → Audit Log → Cleanup
```

---

## Part 2: Database Schema

### 2.1 Core Tables

```sql
-- Sandbox sessions track the lifecycle of isolated work environments
CREATE TABLE sandbox_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    cowork_session_id UUID REFERENCES cowork_sessions(id),

    -- Source information
    source_path TEXT NOT NULL,
    source_hash TEXT NOT NULL,  -- Hash of file manifest at creation

    -- Sandbox paths
    sandbox_root TEXT NOT NULL,  -- /tmp/liquid-sandboxes/session_[id]
    work_path TEXT NOT NULL,     -- sandbox_root/work
    baseline_path TEXT NOT NULL, -- sandbox_root/baseline

    -- State management
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('creating', 'active', 'merging', 'completed', 'failed', 'expired')),

    -- Configuration
    config JSONB NOT NULL DEFAULT '{}',
    /*
        {
            "excludePatterns": ["node_modules", ".git", "dist"],
            "maxSizeBytes": 524288000,
            "secretsHandling": "inject_env",  -- or "exclude" or "readonly_mount"
            "watchSource": true
        }
    */

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,  -- Auto-cleanup deadline
    completed_at TIMESTAMPTZ,

    -- Metrics
    files_copied INTEGER,
    total_size_bytes BIGINT,
    copy_duration_ms INTEGER
);

CREATE INDEX idx_sandbox_sessions_user ON sandbox_sessions(user_id);
CREATE INDEX idx_sandbox_sessions_status ON sandbox_sessions(status);
CREATE INDEX idx_sandbox_sessions_expires ON sandbox_sessions(expires_at) WHERE status = 'active';

-- Track individual file states for granular merge control
CREATE TABLE sandbox_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sandbox_id UUID NOT NULL REFERENCES sandbox_sessions(id) ON DELETE CASCADE,

    -- File identification
    relative_path TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('file', 'directory', 'symlink')),

    -- State tracking
    baseline_hash TEXT,      -- Hash at sandbox creation (null if new file)
    current_hash TEXT,       -- Hash in work directory
    source_hash TEXT,        -- Current hash in original source (for conflict detection)

    -- Change classification
    change_type TEXT CHECK (change_type IN ('added', 'modified', 'deleted', 'renamed', 'unchanged')),

    -- Merge status
    merge_status TEXT DEFAULT 'pending'
        CHECK (merge_status IN ('pending', 'approved', 'rejected', 'conflicted', 'applied')),
    conflict_resolution TEXT,  -- User's resolution choice if conflicted

    -- Metadata
    size_bytes BIGINT,
    mode INTEGER,  -- Unix file permissions
    modified_at TIMESTAMPTZ,

    UNIQUE(sandbox_id, relative_path)
);

CREATE INDEX idx_sandbox_files_sandbox ON sandbox_files(sandbox_id);
CREATE INDEX idx_sandbox_files_changed ON sandbox_files(sandbox_id, change_type)
    WHERE change_type != 'unchanged';

-- Audit log for compliance and debugging
CREATE TABLE sandbox_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sandbox_id UUID NOT NULL REFERENCES sandbox_sessions(id) ON DELETE CASCADE,

    -- Event information
    event_type TEXT NOT NULL,
    /*
        'created', 'file_modified', 'file_deleted', 'file_added',
        'conflict_detected', 'merge_started', 'file_applied',
        'file_rejected', 'rollback_initiated', 'expired', 'cleaned_up'
    */

    -- Context
    file_path TEXT,
    details JSONB,
    /*
        For file_modified: { "before_hash": "...", "after_hash": "...", "diff_summary": "..." }
        For conflict_detected: { "source_changed": true, "work_changed": true }
        For file_applied: { "backup_path": "..." }
    */

    -- Attribution
    actor TEXT NOT NULL,  -- 'system', 'agent', 'user'
    agent_task_id UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sandbox_audit_sandbox ON sandbox_audit_log(sandbox_id);
CREATE INDEX idx_sandbox_audit_type ON sandbox_audit_log(event_type);

-- Backup snapshots for rollback capability
CREATE TABLE sandbox_backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sandbox_id UUID NOT NULL REFERENCES sandbox_sessions(id) ON DELETE CASCADE,

    -- Backup location
    backup_path TEXT NOT NULL,  -- Path to backup archive or directory
    backup_type TEXT NOT NULL CHECK (backup_type IN ('pre_merge', 'checkpoint', 'rollback_point')),

    -- Contents
    files_included TEXT[] NOT NULL,  -- Array of relative paths
    total_size_bytes BIGINT NOT NULL,

    -- State
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'restored', 'expired')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_sandbox_backups_sandbox ON sandbox_backups(sandbox_id);
```

### 2.2 Migration Strategy

```typescript
// server/src/db/migrations/20260116_sandbox_system.ts
import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    // Create tables in dependency order
    await db.schema
        .createTable('sandbox_sessions')
        // ... (as defined above)
        .execute();

    // Add foreign key to cowork_sessions if not exists
    await sql`
        ALTER TABLE cowork_sessions
        ADD COLUMN IF NOT EXISTS active_sandbox_id UUID REFERENCES sandbox_sessions(id)
    `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
    await sql`ALTER TABLE cowork_sessions DROP COLUMN IF EXISTS active_sandbox_id`.execute(db);
    await db.schema.dropTable('sandbox_backups').ifExists().execute();
    await db.schema.dropTable('sandbox_audit_log').ifExists().execute();
    await db.schema.dropTable('sandbox_files').ifExists().execute();
    await db.schema.dropTable('sandbox_sessions').ifExists().execute();
}
```

---

## Part 3: Core Services Implementation

### 3.1 SandboxManager Service

```typescript
// server/src/cowork/sandbox/SandboxManager.ts
import { EventEmitter } from 'events';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';
import { db } from '@/db';
import { AuditLogger } from './AuditLogger';
import { ConflictDetector } from './ConflictDetector';
import { BackupManager } from './BackupManager';
import { FileHasher } from './FileHasher';

// ... (Detailed implementation of SandboxManager as per design)
```

[Note: Full code for SandboxManager, BackupManager, ConflictDetector, AuditLogger, and FileHasher is preserved in the project history and will be implemented in Phase 0]

---

## Part 4: API Layer

### 4.1 tRPC Router

```typescript
// server/src/api/routers/sandbox.ts
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { SandboxManager } from '@/cowork/sandbox/SandboxManager';

// ... (tRPC router implementation)
```

---

## Part 5: Frontend Implementation

### 5.1 Sandbox Context Provider

```typescript
// src/features/cowork/context/SandboxContext.tsx
// ... (Context implementation)
```

### 5.2 Diff Reviewer Component

```typescript
// src/features/cowork/components/DiffReviewer.tsx
// ... (Diff reviewer component implementation)
```

### 5.3 Sandbox Status Indicator

```typescript
// src/features/cowork/components/SandboxIndicator.tsx
// ... (Status indicator implementation)
```

---

## Part 6: Container Integration

### 6.1 Updated CoworkOrchestrator

```typescript
// server/src/cowork/CoworkOrchestrator.ts (updated methods)
// ... (Orchestrator updates for sandbox)
```

---

## Part 7: Background Jobs

### 7.1 Cleanup Job

```typescript
// server/src/jobs/sandbox-cleanup.ts
// ... (Cron job implementation)
```

---

## Part 8: Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- Create database migrations
- Implement SandboxManager
- Implement Utils (FileHasher, AuditLogger)
- Unit tests

### Phase 2: Diff & Conflict Detection (Week 2)
- Implement getDiff()
- Implement ConflictDetector
- Source file watching
- Integration tests

### Phase 3: Merge & Rollback (Week 3)
- Implement BackupManager
- Implement applyChanges()
- Rollback functionality
- Partial merge

### Phase 4: API & Frontend (Week 4)
- tRPC router
- SandboxContext
- DiffReviewer UI
- Real-time updates

### Phase 5: Container Integration & Polish (Week 5)
- Orchestrator updates
- Secrets handling
- Cleanup jobs
- Documentation

---

## Part 9: Testing Strategy

### 9.1 Unit Tests
- `SandboxManager.test.ts`: Create, diff, apply, cleanup, exclusions.
- `Integration.test.ts`: End-to-end sandbox flow.

---

## Part 10: Monitoring & Observability
- Metrics: `sandbox_created_total`, `sandbox_copy_duration_seconds`, `sandbox_active_count`, `sandbox_conflicts_total`.
