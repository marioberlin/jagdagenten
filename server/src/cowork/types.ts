/**
 * Cowork Module Types
 *
 * Type definitions for the deep work orchestration system.
 */

import type { EventEmitter } from 'events';

// ============================================================
// SESSION TYPES
// ============================================================

export interface CoworkSession {
    id: string;
    userId: string;
    title: string;
    description: string;
    status: CoworkSessionStatus;
    phase: CoworkPhase;
    plan: TaskPlan | null;
    subTasks: CoworkSubTask[];
    activeAgents: AgentInstance[];
    workspace: WorkspaceConfig;
    fileOperations: FileOperation[];
    artifacts: CoworkArtifact[];
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    tokensUsed: number;
    estimatedCost: number;
    currentThought?: string;
}

export type CoworkSessionStatus =
    | 'planning'
    | 'awaiting_approval'
    | 'executing'
    | 'paused'
    | 'merging'
    | 'completed'
    | 'failed'
    | 'cancelled';

export type CoworkPhase =
    | 'task_analysis'
    | 'plan_generation'
    | 'user_review'
    | 'agent_dispatch'
    | 'parallel_execution'
    | 'result_aggregation'
    | 'output_delivery';

// ============================================================
// PLAN TYPES
// ============================================================

export interface TaskPlan {
    id: string;
    sessionId: string;
    taskType: TaskType;
    complexity: 'simple' | 'moderate' | 'complex';
    estimatedDuration: string;
    estimatedTurns: number;
    estimatedCost: number;
    filesAffected: number;
    steps: PlanStep[];
    approach: string;
    risks: string[];
    alternatives: string[];
    generatedAt: Date;
    modelUsed: string;
}

export interface PlanStep {
    id: string;
    order: number;
    title: string;
    description: string;
    agentType: 'primary' | 'sub-agent';
    estimatedDuration: string;
    dependencies: string[];
    parallelizable: boolean;
    fileOperations: FileOperationType[];
    result?: string;
}

export type TaskType =
    | 'file_organization'
    | 'document_creation'
    | 'data_processing'
    | 'research_synthesis'
    | 'code_generation'
    | 'content_editing'
    | 'batch_processing'
    | 'mixed';

export interface PlanModification {
    stepId: string;
    action: 'remove' | 'modify' | 'reorder';
    newTitle?: string;
    newDescription?: string;
    newOrder?: number;
}

// ============================================================
// SUB-TASK TYPES
// ============================================================

export interface CoworkSubTask {
    id: string;
    sessionId: string;
    planStepId: string;
    order: number;
    title: string;
    description: string;
    agentId?: string;
    status: SubTaskStatus;
    progress: number;
    result?: SubTaskResult;
    error?: string;
    startedAt?: Date;
    completedAt?: Date;
}

export type SubTaskStatus =
    | 'pending'
    | 'waiting_dependency'
    | 'in_progress'
    | 'completed'
    | 'failed'
    | 'skipped';

export interface SubTaskResult {
    success: boolean;
    output?: string;
    artifacts: string[];
    filesModified: string[];
    tokensUsed: number;
    duration: number;
    summary?: string;
}

// ============================================================
// AGENT TYPES
// ============================================================

export interface AgentInstance {
    id: string;
    sessionId?: string;
    subTaskId?: string;
    name: string;
    type?: AgentType;
    status: AgentStatus;
    containerId?: string;
    progress: number;
    currentThought: string | null;
    spawnedAt?: Date;
    lastActivityAt?: Date;
}

export type AgentType =
    | 'orchestrator'
    | 'data_processor'
    | 'document_writer'
    | 'code_generator'
    | 'file_organizer'
    | 'researcher'
    | 'formatter';

export type AgentStatus =
    | 'initializing'
    | 'thinking'
    | 'working'
    | 'waiting'
    | 'completed'
    | 'failed'
    | 'terminated';

// ============================================================
// FILE TYPES
// ============================================================

export interface WorkspaceConfig {
    id: string;
    sessionId?: string;
    inputPaths: string[];
    outputPath: string;
    tempPath: string;
    permissions: WorkspacePermissions;
    allowedExtensions: string[];
    blockedExtensions: string[];
    maxFileSize: number;
    syncMode: 'manual' | 'auto' | 'watched';
}

export interface WorkspacePermissions {
    read: boolean;
    write: boolean;
    delete: boolean;
    execute: boolean;
    network: boolean;
}

export interface FileOperation {
    id: string;
    sessionId: string;
    operation: FileOperationType;
    sourcePath: string;
    targetPath?: string;
    status: FileOperationStatus;
    error?: string;
    timestamp: Date;
}

export type FileOperationType =
    | 'create'
    | 'read'
    | 'update'
    | 'delete'
    | 'move'
    | 'copy';

export type FileOperationStatus =
    | 'pending'
    | 'in_progress'
    | 'completed'
    | 'failed';

// ============================================================
// ARTIFACT TYPES
// ============================================================

export interface CoworkArtifact {
    id: string;
    sessionId: string;
    type: ArtifactType;
    name: string;
    path?: string;
    mimeType?: string;
    size?: number;
    metadata?: Record<string, unknown>;
    createdAt: Date;
}

export type ArtifactType =
    | 'file'
    | 'document'
    | 'spreadsheet'
    | 'presentation'
    | 'image'
    | 'code'
    | 'data'
    | 'report'
    | 'folder';

// ============================================================
// CONFIG TYPES
// ============================================================

export interface CreateSessionOptions {
    workspacePath?: string;
    inputPaths?: string[];
    outputPath?: string;
    preferredAgents?: string[];
    maxCost?: number;
}

export interface OrchestratorConfig {
    aiClient?: any;
    containerPool?: any;
    maxConcurrentAgents?: number;
    defaultTimeout?: number;
}

export interface TaskContext {
    workspacePath?: string;
    existingFiles: string[];
    userPreferences: Record<string, unknown>;
}

// ============================================================
// EVENT TYPES
// ============================================================

export type CoworkEvent =
    | { type: 'session_created'; sessionId: string; title: string }
    | { type: 'session_status_changed'; sessionId: string; status: CoworkSessionStatus; phase: string }
    | { type: 'planning_started'; sessionId: string }
    | { type: 'plan_ready'; sessionId: string; plan: TaskPlan }
    | { type: 'plan_approved'; sessionId: string }
    | { type: 'agent_spawned'; sessionId: string; agentId: string; name: string; task: string }
    | { type: 'agent_progress'; sessionId: string; agentId: string; progress: number; status: string }
    | { type: 'agent_thinking'; sessionId: string; agentId: string; thought: string }
    | { type: 'agent_completed'; sessionId: string; agentId: string; success: boolean; result?: string }
    | { type: 'file_created'; sessionId: string; path: string; size: number }
    | { type: 'file_modified'; sessionId: string; path: string }
    | { type: 'file_deleted'; sessionId: string; path: string }
    | { type: 'artifact_produced'; sessionId: string; artifact: CoworkArtifact }
    | { type: 'session_completed'; sessionId: string; summary: string; artifacts: CoworkArtifact[] }
    | { type: 'session_failed'; sessionId: string; error: string }
    | { type: 'steering_sent'; sessionId: string; guidance: string }
    | { type: 'steering_acknowledged'; sessionId: string; agentId: string }
    | { type: 'error'; sessionId: string; error: string };
