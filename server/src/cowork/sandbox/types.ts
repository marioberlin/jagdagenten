/**
 * Sandbox System Types
 *
 * Type definitions for the isolated staging/sandbox system.
 */

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface SandboxConfig {
    /** Glob patterns to exclude from sandbox (e.g., node_modules, .git) */
    excludePatterns: string[];
    /** Maximum total size in bytes for sandbox content */
    maxSizeBytes: number;
    /** How to handle secrets/env files */
    secretsHandling: 'exclude' | 'inject_env' | 'readonly_mount';
    /** Watch source directory for changes during sandbox session */
    watchSource: boolean;
    /** Hours until sandbox auto-expires */
    expirationHours: number;
}

export const DEFAULT_SANDBOX_CONFIG: SandboxConfig = {
    excludePatterns: [
        'node_modules',
        '.git',
        'dist',
        'build',
        '.next',
        '.nuxt',
        '__pycache__',
        '*.pyc',
        '.venv',
        'venv',
        '.env',
        '.env.*',
        '*.log',
        '.DS_Store',
        'Thumbs.db',
        'coverage',
        '.nyc_output',
    ],
    maxSizeBytes: 500 * 1024 * 1024, // 500MB
    secretsHandling: 'exclude',
    watchSource: true,
    expirationHours: 24,
};

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateSandboxRequest {
    userId: string;
    sourcePath: string;
    coworkSessionId?: string;
    config?: Partial<SandboxConfig>;
}

export interface MergeRequest {
    sandboxId: string;
    fileDecisions: FileDecision[];
}

export interface FileDecision {
    relativePath: string;
    action: 'apply' | 'reject' | 'resolve';
    /** For manual conflict resolution */
    resolvedContent?: string;
}

export interface MergeResult {
    success: boolean;
    appliedFiles: string[];
    rejectedFiles: string[];
    failedFiles: { path: string; error: string }[];
    backupId: string;
}

// ============================================================================
// SESSION TYPES
// ============================================================================

export type SandboxStatus =
    | 'creating'
    | 'active'
    | 'merging'
    | 'completed'
    | 'failed'
    | 'expired';

export interface SandboxSession {
    id: string;
    userId: string;
    coworkSessionId?: string;
    sourcePath: string;
    sourceHash: string;
    sandboxRoot: string;
    workPath: string;
    baselinePath: string;
    status: SandboxStatus;
    config: SandboxConfig;
    createdAt: Date;
    expiresAt: Date;
    completedAt?: Date;
    filesCopied?: number;
    totalSizeBytes?: number;
    copyDurationMs?: number;
}

// ============================================================================
// FILE TYPES
// ============================================================================

export type FileChangeType = 'added' | 'modified' | 'deleted' | 'renamed' | 'unchanged';

export type MergeStatus = 'pending' | 'approved' | 'rejected' | 'conflicted' | 'applied';

export type ConflictType = 'source_modified' | 'source_deleted' | 'both_modified';

export interface SandboxFile {
    id: string;
    sandboxId: string;
    relativePath: string;
    fileType: 'file' | 'directory' | 'symlink';
    baselineHash?: string;
    currentHash?: string;
    sourceHash?: string;
    changeType: FileChangeType;
    mergeStatus: MergeStatus;
    conflictResolution?: string;
    sizeBytes?: number;
    mode?: number;
    modifiedAt?: Date;
}

export interface FileChange {
    relativePath: string;
    changeType: FileChangeType;
    baselineHash?: string;
    currentHash?: string;
    sourceHash?: string;
    hasConflict: boolean;
    conflictType?: ConflictType;
    /** Unified diff content for text files */
    diff?: string;
    sizeBytes?: number;
    /** Original content (for diff viewer) */
    baselineContent?: string;
    /** Modified content (for diff viewer) */
    currentContent?: string;
}

export interface SourceChange {
    relativePath: string;
    type: 'modified' | 'deleted' | 'added';
    originalHash: string;
    currentHash?: string;
}

// ============================================================================
// BACKUP TYPES
// ============================================================================

export type BackupType = 'pre_merge' | 'checkpoint' | 'rollback_point';

export type BackupStatus = 'active' | 'restored' | 'expired';

export interface SandboxBackup {
    id: string;
    sandboxId: string;
    backupPath: string;
    backupType: BackupType;
    filesIncluded: string[];
    totalSizeBytes: number;
    status: BackupStatus;
    createdAt: Date;
    expiresAt: Date;
}

export interface CreateBackupRequest {
    sandboxId: string;
    sourcePath: string;
    files: string[];
    type: BackupType;
}

// ============================================================================
// AUDIT TYPES
// ============================================================================

export type AuditEventType =
    | 'created'
    | 'file_modified'
    | 'file_deleted'
    | 'file_added'
    | 'conflict_detected'
    | 'merge_started'
    | 'file_applied'
    | 'file_rejected'
    | 'rollback_initiated'
    | 'expired'
    | 'cleaned_up';

export type AuditActor = 'system' | 'agent' | 'user';

export interface AuditLogEntry {
    sandboxId: string;
    eventType: AuditEventType;
    actor: AuditActor;
    filePath?: string;
    agentTaskId?: string;
    details?: Record<string, unknown>;
}

export interface AuditLogRecord extends AuditLogEntry {
    id: string;
    createdAt: Date;
}

// ============================================================================
// COPY PROGRESS TYPES
// ============================================================================

export interface CopyProgress {
    current: number;
    total: number;
    currentFile: string;
    bytesProcessed: number;
}

export interface CopyResult {
    fileCount: number;
    totalBytes: number;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export type SandboxErrorCode =
    | 'INVALID_PATH'
    | 'BLOCKED_PATH'
    | 'PATH_NOT_FOUND'
    | 'NOT_DIRECTORY'
    | 'NO_READ_ACCESS'
    | 'SOURCE_TOO_LARGE'
    | 'NOT_FOUND'
    | 'INVALID_STATUS'
    | 'INVALID_BACKUP'
    | 'COPY_FAILED'
    | 'MERGE_FAILED';

export class SandboxError extends Error {
    constructor(
        public code: SandboxErrorCode,
        message: string
    ) {
        super(message);
        this.name = 'SandboxError';
    }
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export type SandboxEvent =
    | { type: 'copy_progress'; sandboxId: string; progress: CopyProgress }
    | { type: 'source_changed'; sandboxId: string; changes: SourceChange[] }
    | { type: 'status_changed'; sandboxId: string; status: SandboxStatus }
    | { type: 'conflict_detected'; sandboxId: string; filePath: string; conflictType: ConflictType };
