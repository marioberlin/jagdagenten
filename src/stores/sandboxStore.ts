/**
 * Sandbox Store
 *
 * State management for the sandbox/staging system.
 * Handles sandbox lifecycle, diff management, and merge operations.
 */

import { create } from 'zustand';

// ============================================================================
// Types
// ============================================================================

export interface SandboxConfig {
    excludePatterns: string[];
    maxSizeBytes: number;
    secretsHandling: 'exclude' | 'inject_env' | 'readonly_mount';
    watchSource: boolean;
    expirationHours: number;
}

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
    createdAt: string;
    expiresAt: string;
    completedAt?: string;
    filesCopied?: number;
    totalSizeBytes?: number;
    copyDurationMs?: number;
}

export type SandboxStatus =
    | 'creating'
    | 'active'
    | 'merging'
    | 'completed'
    | 'failed'
    | 'expired';

export type FileChangeType = 'added' | 'modified' | 'deleted' | 'renamed' | 'unchanged';

export type ConflictType = 'source_modified' | 'source_deleted' | 'both_modified';

export interface FileChange {
    relativePath: string;
    changeType: FileChangeType;
    baselineHash?: string;
    currentHash?: string;
    sourceHash?: string;
    hasConflict: boolean;
    conflictType?: ConflictType;
    diff?: string;
    sizeBytes?: number;
    baselineContent?: string;
    currentContent?: string;
}

export interface FileDecision {
    relativePath: string;
    action: 'apply' | 'reject' | 'resolve';
    resolvedContent?: string;
}

export interface MergeResult {
    success: boolean;
    appliedFiles: string[];
    rejectedFiles: string[];
    failedFiles: { path: string; error: string }[];
    backupId: string;
}

export interface SandboxBackup {
    id: string;
    sandboxId: string;
    backupPath: string;
    backupType: 'pre_merge' | 'checkpoint' | 'rollback_point';
    filesIncluded: string[];
    totalSizeBytes: number;
    status: 'active' | 'restored' | 'expired';
    createdAt: string;
    expiresAt: string;
}

export interface DiffSummary {
    total: number;
    added: number;
    modified: number;
    deleted: number;
    conflicts: number;
}

// ============================================================================
// State Interface
// ============================================================================

interface SandboxState {
    // Active sandbox
    activeSandbox: SandboxSession | null;

    // Changes in the sandbox
    pendingChanges: FileChange[];
    diffSummary: DiffSummary | null;

    // User decisions for merge
    fileDecisions: Map<string, FileDecision>;

    // Backups
    backups: SandboxBackup[];

    // UI state
    isCreating: boolean;
    isMerging: boolean;
    isLoadingDiff: boolean;
    selectedFile: string | null;
    error: string | null;

    // Actions
    createSandbox: (sourcePath: string, coworkSessionId?: string, config?: Partial<SandboxConfig>) => Promise<SandboxSession>;
    loadSandbox: (sandboxId: string) => Promise<void>;
    refreshDiff: () => Promise<void>;
    setFileDecision: (relativePath: string, action: 'apply' | 'reject', resolvedContent?: string) => void;
    setAllDecisions: (action: 'apply' | 'reject') => void;
    clearDecision: (relativePath: string) => void;
    applyChanges: () => Promise<MergeResult>;
    discardSandbox: () => Promise<void>;
    rollback: (backupId: string) => Promise<void>;
    loadBackups: () => Promise<void>;

    // UI actions
    setSelectedFile: (path: string | null) => void;
    clearError: () => void;
    reset: () => void;
}

// ============================================================================
// API Helpers
// ============================================================================

const API_BASE = '/api/v1/sandbox';

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'API request failed');
    }

    return data;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useSandboxStore = create<SandboxState>()((set, get) => ({
    // Initial state
    activeSandbox: null,
    pendingChanges: [],
    diffSummary: null,
    fileDecisions: new Map(),
    backups: [],
    isCreating: false,
    isMerging: false,
    isLoadingDiff: false,
    selectedFile: null,
    error: null,

    // Create a new sandbox
    createSandbox: async (sourcePath, coworkSessionId, config) => {
        set({ isCreating: true, error: null });

        try {
            const data = await fetchApi<{ sandbox: SandboxSession }>(API_BASE, {
                method: 'POST',
                body: JSON.stringify({ sourcePath, coworkSessionId, config }),
            });

            set({
                activeSandbox: data.sandbox,
                isCreating: false,
                pendingChanges: [],
                diffSummary: null,
                fileDecisions: new Map(),
            });

            return data.sandbox;
        } catch (error: any) {
            set({ isCreating: false, error: error.message });
            throw error;
        }
    },

    // Load an existing sandbox
    loadSandbox: async (sandboxId) => {
        set({ error: null });

        try {
            const data = await fetchApi<{ sandbox: SandboxSession }>(
                `${API_BASE}/${sandboxId}`
            );

            set({
                activeSandbox: data.sandbox,
                pendingChanges: [],
                diffSummary: null,
                fileDecisions: new Map(),
            });

            // Auto-refresh diff if sandbox is active
            if (data.sandbox.status === 'active') {
                get().refreshDiff();
                get().loadBackups();
            }
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    // Refresh diff (get all changes)
    refreshDiff: async () => {
        const { activeSandbox } = get();
        if (!activeSandbox) return;

        set({ isLoadingDiff: true, error: null });

        try {
            const data = await fetchApi<{
                changes: FileChange[];
                summary: DiffSummary;
            }>(`${API_BASE}/${activeSandbox.id}/diff`);

            set({
                pendingChanges: data.changes,
                diffSummary: data.summary,
                isLoadingDiff: false,
            });
        } catch (error: any) {
            set({ isLoadingDiff: false, error: error.message });
        }
    },

    // Set decision for a single file
    setFileDecision: (relativePath, action, resolvedContent) => {
        const decisions = new Map(get().fileDecisions);
        decisions.set(relativePath, {
            relativePath,
            action: resolvedContent ? 'resolve' : action,
            resolvedContent,
        });
        set({ fileDecisions: decisions });
    },

    // Set decision for all files (except conflicts)
    setAllDecisions: (action) => {
        const { pendingChanges } = get();
        const decisions = new Map<string, FileDecision>();

        for (const change of pendingChanges) {
            if (!change.hasConflict) {
                decisions.set(change.relativePath, {
                    relativePath: change.relativePath,
                    action,
                });
            }
        }

        set({ fileDecisions: decisions });
    },

    // Clear decision for a file
    clearDecision: (relativePath) => {
        const decisions = new Map(get().fileDecisions);
        decisions.delete(relativePath);
        set({ fileDecisions: decisions });
    },

    // Apply changes (merge)
    applyChanges: async () => {
        const { activeSandbox, pendingChanges, fileDecisions } = get();
        if (!activeSandbox) {
            throw new Error('No active sandbox');
        }

        set({ isMerging: true, error: null });

        try {
            // Build decisions array
            const allDecisions: FileDecision[] = [];

            for (const change of pendingChanges) {
                const decision = fileDecisions.get(change.relativePath);
                if (decision) {
                    allDecisions.push(decision);
                } else if (!change.hasConflict) {
                    // Default to apply for non-conflicted files without explicit decision
                    allDecisions.push({
                        relativePath: change.relativePath,
                        action: 'apply',
                    });
                }
            }

            const data = await fetchApi<{ result: MergeResult }>(
                `${API_BASE}/${activeSandbox.id}/apply`,
                {
                    method: 'POST',
                    body: JSON.stringify({ fileDecisions: allDecisions }),
                }
            );

            if (data.result.success) {
                set({
                    activeSandbox: null,
                    pendingChanges: [],
                    diffSummary: null,
                    fileDecisions: new Map(),
                    isMerging: false,
                });
            } else {
                set({ isMerging: false });
            }

            return data.result;
        } catch (error: any) {
            set({ isMerging: false, error: error.message });
            throw error;
        }
    },

    // Discard sandbox without applying
    discardSandbox: async () => {
        const { activeSandbox } = get();
        if (!activeSandbox) return;

        try {
            await fetchApi(`${API_BASE}/${activeSandbox.id}/discard`, {
                method: 'POST',
            });

            set({
                activeSandbox: null,
                pendingChanges: [],
                diffSummary: null,
                fileDecisions: new Map(),
                backups: [],
            });
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    // Rollback to a backup
    rollback: async (backupId) => {
        const { activeSandbox } = get();
        if (!activeSandbox) return;

        try {
            await fetchApi(`${API_BASE}/${activeSandbox.id}/rollback`, {
                method: 'POST',
                body: JSON.stringify({ backupId }),
            });

            // Reload backups
            get().loadBackups();
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    // Load backups for the active sandbox
    loadBackups: async () => {
        const { activeSandbox } = get();
        if (!activeSandbox) return;

        try {
            const data = await fetchApi<{ backups: SandboxBackup[] }>(
                `${API_BASE}/${activeSandbox.id}/backups`
            );
            set({ backups: data.backups });
        } catch (error: any) {
            console.error('Failed to load backups:', error);
        }
    },

    // UI actions
    setSelectedFile: (path) => set({ selectedFile: path }),
    clearError: () => set({ error: null }),
    reset: () =>
        set({
            activeSandbox: null,
            pendingChanges: [],
            diffSummary: null,
            fileDecisions: new Map(),
            backups: [],
            isCreating: false,
            isMerging: false,
            isLoadingDiff: false,
            selectedFile: null,
            error: null,
        }),
}));

export default useSandboxStore;
