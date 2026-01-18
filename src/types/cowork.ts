/**
 * Cowork Mode Type Definitions
 *
 * Deep work agentic mode for complex, multi-step tasks.
 * @see docs/COWORK_IMPLEMENTATION_PLAN.md
 */

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
    context: ContextItem[];
    currentStep: number;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    tokensUsed: number;
    estimatedCost: number;
    elapsedTime?: number;
    currentThought?: string;
}

export interface ContextItem {
    type: 'file' | 'tool' | 'website';
    name: string;
    path?: string;
    url?: string;
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

export interface CoworkSessionSummary {
    id: string;
    title: string;
    description: string;
    status: CoworkSessionStatus;
    artifactCount: number;
    createdAt: Date;
    completedAt?: Date;
}

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
    watchPatterns?: string[];
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
// OPTIONS & CONFIG
// ============================================================

export interface CreateSessionOptions {
    workspacePath?: string;
    inputPaths?: string[];
    outputPath?: string;
    attachments?: File[];
    preferredAgents?: string[];
    maxCost?: number;
    agent?: SelectedAgent;
}

export interface TaskOptions {
    workspacePath?: string | null;
    sandboxId?: string;
    agent?: SelectedAgent;
}

export type SelectedAgent =
    | { type: 'local' }
    | { type: 'remote'; url: string; card: AgentCard };

export interface AgentCard {
    name: string;
    description?: string;
    url: string;
    skills?: AgentSkill[];
    extensions?: {
        a2a?: {
            capabilities?: string[];
        };
    };
}

export interface AgentSkill {
    id: string;
    name: string;
    tags?: string[];
}

// ============================================================
// EVENT TYPES
// ============================================================

export type CoworkEvent =
    // Session lifecycle events
    | { type: 'session_created'; sessionId: string; title: string }
    | { type: 'session_status_changed'; sessionId: string; status: CoworkSessionStatus; phase: string }

    // Planning events
    | { type: 'planning_started'; sessionId: string }
    | { type: 'plan_ready'; sessionId: string; plan: TaskPlan }
    | { type: 'plan_approved'; sessionId: string }

    // Agent events
    | { type: 'agent_spawned'; sessionId: string; agentId: string; name: string; task: string }
    | { type: 'agent_progress'; sessionId: string; agentId: string; progress: number; status: string }
    | { type: 'agent_thinking'; sessionId: string; agentId: string; thought: string }
    | { type: 'agent_completed'; sessionId: string; agentId: string; success: boolean; result?: string }

    // File events
    | { type: 'file_created'; sessionId: string; path: string; size: number }
    | { type: 'file_modified'; sessionId: string; path: string }
    | { type: 'file_deleted'; sessionId: string; path: string }

    // Artifact events
    | { type: 'artifact_produced'; sessionId: string; artifact: CoworkArtifact }

    // Completion events
    | { type: 'session_completed'; sessionId: string; summary: string; artifacts: CoworkArtifact[] }
    | { type: 'session_failed'; sessionId: string; error: string }

    // Steering events
    | { type: 'steering_sent'; sessionId: string; guidance: string }
    | { type: 'steering_acknowledged'; sessionId: string; agentId: string }

    // Queue/notification events
    | { type: 'queue_task_added'; sessionId: string; title: string; priority: number }
    | { type: 'queue_task_started'; sessionId: string; title: string }
    | { type: 'queue_task_completed'; sessionId: string; title: string; success: boolean; summary?: string }
    | { type: 'queue_task_failed'; sessionId: string; title: string; error: string }
    | { type: 'queue_paused'; pausedCount: number }
    | { type: 'queue_resumed'; resumedCount: number }
    | { type: 'queue_stats_update'; queuedCount: number; activeCount: number; completedCount: number };

// ============================================================
// NOTIFICATION TYPES
// ============================================================

export type NotificationLevel = 'info' | 'success' | 'warning' | 'error';

export interface TaskNotification {
    id: string;
    sessionId: string;
    level: NotificationLevel;
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    action?: {
        label: string;
        type: 'view_session' | 'retry' | 'dismiss';
    };
}

// ============================================================
// QUICK ACTIONS
// ============================================================

export interface QuickAction {
    id: string;
    icon: string;
    label: string;
    description: string;
    prompt: string;
}

export const QUICK_ACTIONS: QuickAction[] = [
    {
        id: 'create-file',
        icon: 'FileText',
        label: 'Create a file',
        description: 'Generate documents, spreadsheets, presentations',
        prompt: 'Create a new document that...'
    },
    {
        id: 'crunch-data',
        icon: 'BarChart3',
        label: 'Crunch data',
        description: 'Process CSVs, analyze datasets, create reports',
        prompt: 'Analyze the data in...'
    },
    {
        id: 'make-prototype',
        icon: 'Code',
        label: 'Make a prototype',
        description: 'Generate code, mockups, wireframes',
        prompt: 'Create a prototype for...'
    },
    {
        id: 'organize-files',
        icon: 'FolderTree',
        label: 'Organize files',
        description: 'Sort, rename, categorize files',
        prompt: 'Organize the files in...'
    },
    {
        id: 'prep-meeting',
        icon: 'Calendar',
        label: 'Prep for a meeting',
        description: 'Create agendas, notes, summaries',
        prompt: 'Prepare materials for a meeting about...'
    },
    {
        id: 'draft-message',
        icon: 'Mail',
        label: 'Draft a message',
        description: 'Write emails, messages, documents',
        prompt: 'Draft a message that...'
    }
];
