/**
 * SandboxManager
 *
 * Main service for managing isolated staging environments.
 * Provides safe file operations with full audit trails, conflict detection,
 * and granular merge controls.
 */

import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { Pool } from 'pg';
import { FileHasher, fileHasher } from './FileHasher';
import { AuditLogger, auditLogger } from './AuditLogger';
import { ConflictDetector, conflictDetector } from './ConflictDetector';
import { BackupManager, backupManager } from './BackupManager';
import {
    SandboxConfig,
    DEFAULT_SANDBOX_CONFIG,
    CreateSandboxRequest,
    MergeRequest,
    MergeResult,
    SandboxSession,
    SandboxStatus,
    SandboxFile,
    FileChange,
    SourceChange,
    CopyProgress,
    CopyResult,
    SandboxError,
} from './types';

const SANDBOX_BASE_PATH = process.env.SANDBOX_BASE_PATH || '/tmp/liquid-sandboxes';

// Paths that are always blocked for security
const BLOCKED_PREFIXES = [
    '/etc',
    '/var',
    '/usr',
    '/bin',
    '/sbin',
    '/lib',
    '/System',
    '/Library',
    '/Applications',
    '/Windows',
    '/Program Files',
];

let dbPool: Pool | null = null;

export function setDbPool(pool: Pool): void {
    dbPool = pool;
}

export class SandboxManager extends EventEmitter {
    private pool: Pool | null;
    private hasher: FileHasher;
    private audit: AuditLogger;
    private conflicts: ConflictDetector;
    private backups: BackupManager;
    private sourceWatchers: Map<string, NodeJS.Timeout> = new Map();

    constructor(pool?: Pool) {
        super();
        this.pool = pool || dbPool;
        this.hasher = fileHasher;
        this.audit = auditLogger;
        this.conflicts = conflictDetector;
        this.backups = backupManager;
    }

    // ========================================================================
    // Sandbox Creation
    // ========================================================================

    /**
     * Create a new sandbox session
     */
    async createSandbox(request: CreateSandboxRequest): Promise<SandboxSession> {
        const config = { ...DEFAULT_SANDBOX_CONFIG, ...request.config };

        // Step 1: Validate source path
        await this.validateSourcePath(request.sourcePath);

        // Step 2: Check size constraints
        const sourceSize = await this.calculateDirectorySize(
            request.sourcePath,
            config.excludePatterns
        );

        if (sourceSize > config.maxSizeBytes) {
            throw new SandboxError(
                'SOURCE_TOO_LARGE',
                `Source directory is ${this.formatBytes(sourceSize)}, ` +
                    `exceeds limit of ${this.formatBytes(config.maxSizeBytes)}. ` +
                    `Consider selecting a subdirectory or adjusting exclude patterns.`
            );
        }

        // Step 3: Create sandbox directory structure
        const sandboxId = randomUUID();
        const sandboxRoot = path.join(SANDBOX_BASE_PATH, `session_${sandboxId}`);
        const workPath = path.join(sandboxRoot, 'work');
        const baselinePath = path.join(sandboxRoot, 'baseline');
        const artifactsPath = path.join(sandboxRoot, 'artifacts');

        await fs.mkdir(sandboxRoot, { recursive: true });
        await fs.mkdir(workPath);
        await fs.mkdir(baselinePath);
        await fs.mkdir(artifactsPath);

        // Step 4: Calculate expiration
        const expiresAt = new Date(
            Date.now() + config.expirationHours * 60 * 60 * 1000
        );

        // Step 5: Create database record (status: creating)
        if (this.pool) {
            await this.pool.query(
                `INSERT INTO sandbox_sessions
                 (id, user_id, cowork_session_id, source_path, source_hash,
                  sandbox_root, work_path, baseline_path, status, config, expires_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                [
                    sandboxId,
                    request.userId,
                    request.coworkSessionId || null,
                    request.sourcePath,
                    '', // Will update after copy
                    sandboxRoot,
                    workPath,
                    baselinePath,
                    'creating',
                    JSON.stringify(config),
                    expiresAt,
                ]
            );
        }

        try {
            // Step 6: Copy files to work directory (with progress tracking)
            const copyStart = Date.now();
            const copyResult = await this.copyDirectory(
                request.sourcePath,
                workPath,
                config.excludePatterns,
                (progress) =>
                    this.emit('copyProgress', { sandboxId, ...progress })
            );

            // Step 7: Create baseline copy (for diffing)
            await this.copyDirectory(
                request.sourcePath,
                baselinePath,
                config.excludePatterns
            );

            // Step 8: Calculate source manifest hash
            const sourceHash = await this.hasher.hashDirectory(workPath);

            // Step 9: Index files in database
            await this.indexSandboxFiles(sandboxId, workPath);

            // Step 10: Update session to active
            if (this.pool) {
                await this.pool.query(
                    `UPDATE sandbox_sessions
                     SET status = 'active',
                         source_hash = $1,
                         files_copied = $2,
                         total_size_bytes = $3,
                         copy_duration_ms = $4
                     WHERE id = $5`,
                    [
                        sourceHash,
                        copyResult.fileCount,
                        copyResult.totalBytes,
                        Date.now() - copyStart,
                        sandboxId,
                    ]
                );
            }

            // Step 11: Start source watcher if enabled
            if (config.watchSource) {
                this.startSourceWatcher(sandboxId, request.sourcePath);
            }

            // Step 12: Audit log
            await this.audit.log({
                sandboxId,
                eventType: 'created',
                actor: 'system',
                details: {
                    sourcePath: request.sourcePath,
                    filesCopied: copyResult.fileCount,
                    totalBytes: copyResult.totalBytes,
                    copyDurationMs: Date.now() - copyStart,
                    excludePatterns: config.excludePatterns,
                },
            });

            return this.getSandbox(sandboxId);
        } catch (error: any) {
            // Cleanup on failure
            if (this.pool) {
                await this.pool.query(
                    `UPDATE sandbox_sessions SET status = 'failed' WHERE id = $1`,
                    [sandboxId]
                );
            }

            await this.audit.log({
                sandboxId,
                eventType: 'created',
                actor: 'system',
                details: { error: error.message, stack: error.stack },
            });

            // Remove partial sandbox directory
            await fs.rm(sandboxRoot, { recursive: true, force: true });

            throw error;
        }
    }

    // ========================================================================
    // Validation
    // ========================================================================

    private async validateSourcePath(sourcePath: string): Promise<void> {
        // Normalize and resolve path
        const resolvedPath = path.resolve(sourcePath);

        // Security: Prevent path traversal
        if (resolvedPath.includes('..')) {
            throw new SandboxError('INVALID_PATH', 'Path traversal not allowed');
        }

        // Security: Block system directories
        const homeDir = process.env.HOME || '';
        const blockedPaths = [
            ...BLOCKED_PREFIXES,
            path.join(homeDir, '.ssh'),
            path.join(homeDir, '.gnupg'),
            path.join(homeDir, '.aws'),
        ];

        for (const blocked of blockedPaths) {
            if (resolvedPath.startsWith(blocked)) {
                throw new SandboxError(
                    'BLOCKED_PATH',
                    `Cannot create sandbox for system directory: ${blocked}`
                );
            }
        }

        // Verify path exists and is a directory
        try {
            const stat = await fs.stat(resolvedPath);
            if (!stat.isDirectory()) {
                throw new SandboxError(
                    'NOT_DIRECTORY',
                    'Source path must be a directory'
                );
            }
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                throw new SandboxError(
                    'PATH_NOT_FOUND',
                    `Directory not found: ${sourcePath}`
                );
            }
            throw error;
        }

        // Verify read permissions
        try {
            await fs.access(resolvedPath, fs.constants.R_OK);
        } catch {
            throw new SandboxError(
                'NO_READ_ACCESS',
                `Cannot read directory: ${sourcePath}`
            );
        }
    }

    // ========================================================================
    // File Operations
    // ========================================================================

    private async copyDirectory(
        source: string,
        destination: string,
        excludePatterns: string[],
        onProgress?: (progress: CopyProgress) => void
    ): Promise<CopyResult> {
        // Build exclude filter
        const shouldExclude = (filePath: string): boolean => {
            const relativePath = path.relative(source, filePath);
            return excludePatterns.some((pattern) => {
                if (pattern.includes('*')) {
                    const regex = new RegExp(
                        '^' +
                            pattern.replace(/\*/g, '.*').replace(/\?/g, '.') +
                            '$'
                    );
                    return regex.test(relativePath) || regex.test(path.basename(relativePath));
                }
                return (
                    relativePath === pattern ||
                    relativePath.startsWith(pattern + path.sep) ||
                    path.basename(relativePath) === pattern
                );
            });
        };

        // Collect all files first (for progress tracking)
        const allFiles: string[] = [];

        const collectFiles = async (dir: string): Promise<void> => {
            const entries = await fs.readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);

                if (shouldExclude(fullPath)) continue;

                if (entry.isDirectory()) {
                    await collectFiles(fullPath);
                } else if (entry.isFile()) {
                    allFiles.push(fullPath);
                }
                // Skip symlinks for security
            }
        };

        await collectFiles(source);

        // Copy files with progress
        let copiedCount = 0;
        let totalBytes = 0;

        for (const sourceFile of allFiles) {
            const relativePath = path.relative(source, sourceFile);
            const destFile = path.join(destination, relativePath);

            // Ensure destination directory exists
            await fs.mkdir(path.dirname(destFile), { recursive: true });

            // Copy file
            await fs.copyFile(sourceFile, destFile);

            // Preserve permissions
            const stat = await fs.stat(sourceFile);
            await fs.chmod(destFile, stat.mode);

            totalBytes += stat.size;
            copiedCount++;

            if (onProgress) {
                onProgress({
                    current: copiedCount,
                    total: allFiles.length,
                    currentFile: relativePath,
                    bytesProcessed: totalBytes,
                });
            }
        }

        return { fileCount: copiedCount, totalBytes };
    }

    private async calculateDirectorySize(
        dirPath: string,
        excludePatterns: string[]
    ): Promise<number> {
        let totalSize = 0;

        const shouldExclude = (filePath: string): boolean => {
            const relativePath = path.relative(dirPath, filePath);
            return excludePatterns.some(
                (pattern) =>
                    relativePath === pattern ||
                    relativePath.startsWith(pattern + path.sep) ||
                    path.basename(relativePath) === pattern
            );
        };

        const walk = async (dir: string): Promise<void> => {
            const entries = await fs.readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);

                if (shouldExclude(fullPath)) continue;

                if (entry.isDirectory()) {
                    await walk(fullPath);
                } else if (entry.isFile()) {
                    const stat = await fs.stat(fullPath);
                    totalSize += stat.size;
                }
            }
        };

        await walk(dirPath);
        return totalSize;
    }

    private async indexSandboxFiles(
        sandboxId: string,
        workPath: string
    ): Promise<void> {
        if (!this.pool) {
            return;
        }

        const files: {
            relativePath: string;
            hash: string;
            size: number;
            mode: number;
        }[] = [];

        const walk = async (dir: string): Promise<void> => {
            const entries = await fs.readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const relativePath = path.relative(workPath, fullPath);

                if (entry.isDirectory()) {
                    await walk(fullPath);
                } else if (entry.isFile()) {
                    const stat = await fs.stat(fullPath);
                    const hash = await this.hasher.hashFile(fullPath);

                    files.push({
                        relativePath,
                        hash,
                        size: stat.size,
                        mode: stat.mode,
                    });
                }
            }
        };

        await walk(workPath);

        // Batch insert
        if (files.length > 0) {
            const batchSize = 100;
            for (let i = 0; i < files.length; i += batchSize) {
                const batch = files.slice(i, i + batchSize);

                // Build values for batch insert
                const values: any[] = [];
                const placeholders: string[] = [];
                let paramIndex = 1;

                for (const f of batch) {
                    placeholders.push(
                        `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7})`
                    );
                    values.push(
                        randomUUID(),
                        sandboxId,
                        f.relativePath,
                        'file',
                        f.hash,
                        f.hash,
                        f.size,
                        f.mode
                    );
                    paramIndex += 8;
                }

                await this.pool.query(
                    `INSERT INTO sandbox_files
                     (id, sandbox_id, relative_path, file_type, baseline_hash, current_hash, size_bytes, mode)
                     VALUES ${placeholders.join(', ')}`,
                    values
                );
            }
        }
    }

    // ========================================================================
    // Diff Generation
    // ========================================================================

    /**
     * Get all changes made in the sandbox
     */
    async getDiff(sandboxId: string): Promise<FileChange[]> {
        const sandbox = await this.getSandbox(sandboxId);

        if (sandbox.status !== 'active') {
            throw new SandboxError(
                'INVALID_STATUS',
                `Cannot diff sandbox in ${sandbox.status} status`
            );
        }

        const changes: FileChange[] = [];

        if (!this.pool) {
            return changes;
        }

        // Get all indexed files
        const result = await this.pool.query(
            `SELECT id, relative_path, baseline_hash, current_hash, source_hash,
                    change_type, merge_status, size_bytes
             FROM sandbox_files
             WHERE sandbox_id = $1`,
            [sandboxId]
        );

        const indexedPaths = new Set(result.rows.map((r) => r.relative_path));

        // Check each indexed file for changes
        for (const row of result.rows) {
            const workFilePath = path.join(sandbox.workPath, row.relative_path);
            const baselineFilePath = path.join(
                sandbox.baselinePath,
                row.relative_path
            );
            const sourceFilePath = path.join(
                sandbox.sourcePath,
                row.relative_path
            );

            try {
                const workStat = await fs.stat(workFilePath);
                const currentHash = await this.hasher.hashFile(workFilePath);

                if (currentHash !== row.baseline_hash) {
                    // File was modified
                    const change: FileChange = {
                        relativePath: row.relative_path,
                        changeType: 'modified',
                        baselineHash: row.baseline_hash,
                        currentHash,
                        hasConflict: false,
                        sizeBytes: workStat.size,
                    };

                    // Check for conflict with source
                    if (sandbox.config.watchSource) {
                        try {
                            const sourceHash =
                                await this.hasher.hashFile(sourceFilePath);
                            change.sourceHash = sourceHash;

                            if (sourceHash !== row.baseline_hash) {
                                // Source also changed - conflict!
                                change.hasConflict = true;
                                change.conflictType = 'both_modified';
                            }
                        } catch (err: any) {
                            if (err.code === 'ENOENT') {
                                // Source file was deleted
                                change.hasConflict = true;
                                change.conflictType = 'source_deleted';
                            }
                        }
                    }

                    // Generate diff content for text files
                    if (this.isTextFile(row.relative_path)) {
                        try {
                            change.baselineContent = await fs.readFile(
                                baselineFilePath,
                                'utf-8'
                            );
                            change.currentContent = await fs.readFile(
                                workFilePath,
                                'utf-8'
                            );
                        } catch {
                            // Ignore read errors for diff content
                        }
                    }

                    changes.push(change);

                    // Update database
                    await this.pool.query(
                        `UPDATE sandbox_files
                         SET current_hash = $1, source_hash = $2, change_type = 'modified'
                         WHERE id = $3`,
                        [currentHash, change.sourceHash || null, row.id]
                    );
                }
            } catch (err: any) {
                if (err.code === 'ENOENT') {
                    // File was deleted in work directory
                    changes.push({
                        relativePath: row.relative_path,
                        changeType: 'deleted',
                        baselineHash: row.baseline_hash,
                        hasConflict: false,
                    });

                    await this.pool.query(
                        `UPDATE sandbox_files
                         SET current_hash = NULL, change_type = 'deleted'
                         WHERE id = $1`,
                        [row.id]
                    );
                }
            }
        }

        // Check for new files in work directory
        const newFiles = await this.findNewFiles(sandbox.workPath, indexedPaths);

        for (const newFile of newFiles) {
            const workFilePath = path.join(sandbox.workPath, newFile);
            const stat = await fs.stat(workFilePath);
            const hash = await this.hasher.hashFile(workFilePath);

            const change: FileChange = {
                relativePath: newFile,
                changeType: 'added',
                currentHash: hash,
                hasConflict: false,
                sizeBytes: stat.size,
            };

            // Get content for text files
            if (this.isTextFile(newFile)) {
                try {
                    change.currentContent = await fs.readFile(
                        workFilePath,
                        'utf-8'
                    );
                } catch {
                    // Ignore read errors
                }
            }

            changes.push(change);

            // Index the new file
            await this.pool.query(
                `INSERT INTO sandbox_files
                 (id, sandbox_id, relative_path, file_type, baseline_hash, current_hash, change_type, merge_status, size_bytes)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [
                    randomUUID(),
                    sandboxId,
                    newFile,
                    'file',
                    null,
                    hash,
                    'added',
                    'pending',
                    stat.size,
                ]
            );
        }

        return changes;
    }

    private async findNewFiles(
        workPath: string,
        existingPaths: Set<string>
    ): Promise<string[]> {
        const newFiles: string[] = [];

        const walk = async (dir: string): Promise<void> => {
            const entries = await fs.readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const relativePath = path.relative(workPath, fullPath);

                if (entry.isDirectory()) {
                    await walk(fullPath);
                } else if (entry.isFile() && !existingPaths.has(relativePath)) {
                    newFiles.push(relativePath);
                }
            }
        };

        await walk(workPath);
        return newFiles;
    }

    private isTextFile(filePath: string): boolean {
        const textExtensions = [
            '.ts',
            '.tsx',
            '.js',
            '.jsx',
            '.json',
            '.md',
            '.txt',
            '.html',
            '.css',
            '.scss',
            '.less',
            '.yaml',
            '.yml',
            '.xml',
            '.svg',
            '.sh',
            '.bash',
            '.py',
            '.rb',
            '.go',
            '.rs',
            '.java',
            '.kt',
            '.swift',
            '.c',
            '.cpp',
            '.h',
            '.sql',
            '.graphql',
            '.prisma',
            '.gitignore',
            '.env.example',
        ];
        return textExtensions.some((ext) => filePath.endsWith(ext));
    }

    // ========================================================================
    // Merge Operations
    // ========================================================================

    /**
     * Apply selected changes to the source directory
     */
    async applyChanges(request: MergeRequest): Promise<MergeResult> {
        const sandbox = await this.getSandbox(request.sandboxId);

        if (sandbox.status !== 'active') {
            throw new SandboxError(
                'INVALID_STATUS',
                `Cannot merge sandbox in ${sandbox.status} status`
            );
        }

        // Update status to merging
        if (this.pool) {
            await this.pool.query(
                `UPDATE sandbox_sessions SET status = 'merging' WHERE id = $1`,
                [request.sandboxId]
            );
        }

        const result: MergeResult = {
            success: true,
            appliedFiles: [],
            rejectedFiles: [],
            failedFiles: [],
            backupId: '',
        };

        try {
            // Step 1: Create backup of files to be modified
            const filesToBackup = request.fileDecisions
                .filter((d) => d.action === 'apply' || d.action === 'resolve')
                .map((d) => d.relativePath);

            const backup = await this.backups.createBackup({
                sandboxId: request.sandboxId,
                sourcePath: sandbox.sourcePath,
                files: filesToBackup,
                type: 'pre_merge',
            });
            result.backupId = backup.id;

            // Step 2: Apply each file decision
            for (const decision of request.fileDecisions) {
                if (decision.action === 'reject') {
                    result.rejectedFiles.push(decision.relativePath);

                    if (this.pool) {
                        await this.pool.query(
                            `UPDATE sandbox_files SET merge_status = 'rejected'
                             WHERE sandbox_id = $1 AND relative_path = $2`,
                            [request.sandboxId, decision.relativePath]
                        );
                    }

                    await this.audit.log({
                        sandboxId: request.sandboxId,
                        eventType: 'file_rejected',
                        actor: 'user',
                        filePath: decision.relativePath,
                    });

                    continue;
                }

                try {
                    const workFilePath = path.join(
                        sandbox.workPath,
                        decision.relativePath
                    );
                    const targetFilePath = path.join(
                        sandbox.sourcePath,
                        decision.relativePath
                    );

                    // Get the file change info
                    let changeType = 'modified';
                    if (this.pool) {
                        const fileResult = await this.pool.query(
                            `SELECT change_type FROM sandbox_files
                             WHERE sandbox_id = $1 AND relative_path = $2`,
                            [request.sandboxId, decision.relativePath]
                        );
                        if (fileResult.rows.length > 0) {
                            changeType = fileResult.rows[0].change_type;
                        }
                    }

                    if (
                        decision.action === 'resolve' &&
                        decision.resolvedContent
                    ) {
                        // User provided resolved content for conflict
                        await fs.mkdir(path.dirname(targetFilePath), {
                            recursive: true,
                        });
                        await fs.writeFile(
                            targetFilePath,
                            decision.resolvedContent
                        );
                    } else if (changeType === 'deleted') {
                        // Delete the file from source
                        await fs.rm(targetFilePath, { force: true });
                    } else if (changeType === 'added') {
                        // Copy new file to source
                        await fs.mkdir(path.dirname(targetFilePath), {
                            recursive: true,
                        });
                        await fs.copyFile(workFilePath, targetFilePath);
                    } else {
                        // Modified file - overwrite
                        await fs.copyFile(workFilePath, targetFilePath);
                    }

                    result.appliedFiles.push(decision.relativePath);

                    if (this.pool) {
                        await this.pool.query(
                            `UPDATE sandbox_files SET merge_status = 'applied'
                             WHERE sandbox_id = $1 AND relative_path = $2`,
                            [request.sandboxId, decision.relativePath]
                        );
                    }

                    await this.audit.log({
                        sandboxId: request.sandboxId,
                        eventType: 'file_applied',
                        actor: 'user',
                        filePath: decision.relativePath,
                        details: {
                            changeType,
                            backupId: backup.id,
                        },
                    });
                } catch (error: any) {
                    result.failedFiles.push({
                        path: decision.relativePath,
                        error: error.message,
                    });
                    result.success = false;

                    await this.audit.log({
                        sandboxId: request.sandboxId,
                        eventType: 'file_applied',
                        actor: 'system',
                        filePath: decision.relativePath,
                        details: { error: error.message },
                    });
                }
            }

            // Step 3: Update sandbox status
            const finalStatus = result.success ? 'completed' : 'failed';
            if (this.pool) {
                await this.pool.query(
                    `UPDATE sandbox_sessions
                     SET status = $1, completed_at = NOW()
                     WHERE id = $2`,
                    [finalStatus, request.sandboxId]
                );
            }

            // Step 4: Stop source watcher
            this.stopSourceWatcher(request.sandboxId);

            await this.audit.log({
                sandboxId: request.sandboxId,
                eventType: 'merge_started',
                actor: 'user',
                details: {
                    applied: result.appliedFiles.length,
                    rejected: result.rejectedFiles.length,
                    failed: result.failedFiles.length,
                    backupId: backup.id,
                },
            });

            return result;
        } catch (error) {
            if (this.pool) {
                await this.pool.query(
                    `UPDATE sandbox_sessions SET status = 'failed' WHERE id = $1`,
                    [request.sandboxId]
                );
            }
            throw error;
        }
    }

    // ========================================================================
    // Rollback
    // ========================================================================

    /**
     * Rollback changes using a backup
     */
    async rollback(sandboxId: string, backupId: string): Promise<void> {
        const sandbox = await this.getSandbox(sandboxId);
        const backup = await this.backups.getBackup(backupId);

        if (backup.sandboxId !== sandboxId) {
            throw new SandboxError(
                'INVALID_BACKUP',
                'Backup does not belong to this sandbox'
            );
        }

        await this.audit.log({
            sandboxId,
            eventType: 'rollback_initiated',
            actor: 'user',
            details: { backupId },
        });

        await this.backups.restore(backup, sandbox.sourcePath);
    }

    // ========================================================================
    // Source Watching
    // ========================================================================

    private startSourceWatcher(sandboxId: string, sourcePath: string): void {
        // Poll for changes every 5 seconds
        const checkInterval = setInterval(async () => {
            try {
                const sandbox = await this.getSandbox(sandboxId);
                if (sandbox.status !== 'active') {
                    clearInterval(checkInterval);
                    this.sourceWatchers.delete(sandboxId);
                    return;
                }

                const changes = await this.conflicts.checkSourceChanges(sandbox);

                if (changes.length > 0) {
                    this.emit('sourceChanged', { sandboxId, changes });

                    for (const change of changes) {
                        await this.audit.log({
                            sandboxId,
                            eventType: 'conflict_detected',
                            actor: 'system',
                            filePath: change.relativePath,
                            details: { changeType: change.type },
                        });
                    }
                }
            } catch (error) {
                console.error('Source watcher error:', error);
            }
        }, 5000);

        this.sourceWatchers.set(sandboxId, checkInterval);
    }

    private stopSourceWatcher(sandboxId: string): void {
        const watcher = this.sourceWatchers.get(sandboxId);
        if (watcher) {
            clearInterval(watcher);
            this.sourceWatchers.delete(sandboxId);
        }
    }

    // ========================================================================
    // Session Management
    // ========================================================================

    /**
     * Get a sandbox session by ID
     */
    async getSandbox(sandboxId: string): Promise<SandboxSession> {
        if (!this.pool) {
            throw new SandboxError('NOT_FOUND', `Sandbox not found: ${sandboxId}`);
        }

        const result = await this.pool.query(
            `SELECT id, user_id, cowork_session_id, source_path, source_hash,
                    sandbox_root, work_path, baseline_path, status, config,
                    created_at, expires_at, completed_at, files_copied,
                    total_size_bytes, copy_duration_ms
             FROM sandbox_sessions
             WHERE id = $1`,
            [sandboxId]
        );

        if (result.rows.length === 0) {
            throw new SandboxError('NOT_FOUND', `Sandbox not found: ${sandboxId}`);
        }

        const row = result.rows[0];
        return {
            id: row.id,
            userId: row.user_id,
            coworkSessionId: row.cowork_session_id || undefined,
            sourcePath: row.source_path,
            sourceHash: row.source_hash,
            sandboxRoot: row.sandbox_root,
            workPath: row.work_path,
            baselinePath: row.baseline_path,
            status: row.status as SandboxStatus,
            config:
                typeof row.config === 'string'
                    ? JSON.parse(row.config)
                    : row.config,
            createdAt: row.created_at,
            expiresAt: row.expires_at,
            completedAt: row.completed_at || undefined,
            filesCopied: row.files_copied || undefined,
            totalSizeBytes: row.total_size_bytes
                ? Number(row.total_size_bytes)
                : undefined,
            copyDurationMs: row.copy_duration_ms || undefined,
        };
    }

    /**
     * Get all sandboxes for a user
     */
    async getUserSandboxes(
        userId: string,
        options?: { status?: SandboxStatus; limit?: number }
    ): Promise<SandboxSession[]> {
        if (!this.pool) {
            return [];
        }

        let query = `
            SELECT id, user_id, cowork_session_id, source_path, source_hash,
                   sandbox_root, work_path, baseline_path, status, config,
                   created_at, expires_at, completed_at, files_copied,
                   total_size_bytes, copy_duration_ms
            FROM sandbox_sessions
            WHERE user_id = $1
        `;
        const params: any[] = [userId];

        if (options?.status) {
            query += ` AND status = $2`;
            params.push(options.status);
        }

        query += ` ORDER BY created_at DESC`;

        if (options?.limit) {
            query += ` LIMIT $${params.length + 1}`;
            params.push(options.limit);
        }

        const result = await this.pool.query(query, params);

        return result.rows.map((row) => ({
            id: row.id,
            userId: row.user_id,
            coworkSessionId: row.cowork_session_id || undefined,
            sourcePath: row.source_path,
            sourceHash: row.source_hash,
            sandboxRoot: row.sandbox_root,
            workPath: row.work_path,
            baselinePath: row.baseline_path,
            status: row.status as SandboxStatus,
            config:
                typeof row.config === 'string'
                    ? JSON.parse(row.config)
                    : row.config,
            createdAt: row.created_at,
            expiresAt: row.expires_at,
            completedAt: row.completed_at || undefined,
            filesCopied: row.files_copied || undefined,
            totalSizeBytes: row.total_size_bytes
                ? Number(row.total_size_bytes)
                : undefined,
            copyDurationMs: row.copy_duration_ms || undefined,
        }));
    }

    /**
     * Get all backups for a sandbox
     */
    async getBackups(sandboxId: string): Promise<any[]> {
        if (!this.pool) {
            return [];
        }

        const result = await this.pool.query(
            `SELECT id, sandbox_id, backup_path, backup_hash, status,
                    created_at, expires_at, file_count, total_size_bytes, reason
             FROM sandbox_backups
             WHERE sandbox_id = $1
             ORDER BY created_at DESC`,
            [sandboxId]
        );

        return result.rows.map((row) => ({
            id: row.id,
            sandboxId: row.sandbox_id,
            backupPath: row.backup_path,
            backupHash: row.backup_hash,
            status: row.status,
            createdAt: row.created_at,
            expiresAt: row.expires_at,
            fileCount: row.file_count,
            totalSizeBytes: row.total_size_bytes ? Number(row.total_size_bytes) : undefined,
            reason: row.reason,
        }));
    }

    /**
     * Cleanup a sandbox (delete files and mark as expired)
     */
    async cleanup(sandboxId: string): Promise<void> {
        const sandbox = await this.getSandbox(sandboxId);

        // Stop watcher
        this.stopSourceWatcher(sandboxId);

        // Remove filesystem
        await fs.rm(sandbox.sandboxRoot, { recursive: true, force: true });

        // Update database
        if (this.pool) {
            await this.pool.query(
                `UPDATE sandbox_sessions SET status = 'expired' WHERE id = $1`,
                [sandboxId]
            );
        }

        await this.audit.log({
            sandboxId,
            eventType: 'cleaned_up',
            actor: 'system',
        });
    }

    /**
     * Discard a sandbox without applying changes
     */
    async discard(sandboxId: string): Promise<void> {
        await this.cleanup(sandboxId);
    }

    // ========================================================================
    // Utility Methods
    // ========================================================================

    private formatBytes(bytes: number): string {
        const units = ['B', 'KB', 'MB', 'GB'];
        let unitIndex = 0;
        let size = bytes;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }
}

// Export singleton
export const sandboxManager = new SandboxManager();
