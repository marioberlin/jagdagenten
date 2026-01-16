/**
 * ConflictDetector
 *
 * Detects conflicts between sandbox changes and source file changes.
 * Monitors when source files are modified while a sandbox session is active.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { FileHasher, fileHasher } from './FileHasher';
import type {
    SandboxSession,
    SourceChange,
    ConflictType
} from './types';

let dbPool: Pool | null = null;

export function setDbPool(pool: Pool): void {
    dbPool = pool;
}

export class ConflictDetector {
    private pool: Pool | null;
    private hasher: FileHasher;

    constructor(pool?: Pool) {
        this.pool = pool || dbPool;
        this.hasher = fileHasher;
    }

    /**
     * Check for changes in source files since sandbox creation
     * Returns list of files that have changed in the source directory
     */
    async checkSourceChanges(sandbox: SandboxSession): Promise<SourceChange[]> {
        const changes: SourceChange[] = [];

        if (!this.pool) {
            return changes;
        }

        // Get all indexed files from database
        const result = await this.pool.query(
            `SELECT relative_path, baseline_hash, source_hash
             FROM sandbox_files
             WHERE sandbox_id = $1`,
            [sandbox.id]
        );

        for (const row of result.rows) {
            const sourceFilePath = path.join(sandbox.sourcePath, row.relative_path);

            try {
                const currentHash = await this.hasher.hashFile(sourceFilePath);

                // Compare against baseline (what was there when sandbox was created)
                if (currentHash !== row.baseline_hash) {
                    // Source changed since sandbox creation
                    if (row.source_hash !== currentHash) {
                        // This is a new change we haven't recorded yet
                        changes.push({
                            relativePath: row.relative_path,
                            type: 'modified',
                            originalHash: row.baseline_hash,
                            currentHash,
                        });

                        // Update the recorded source hash
                        await this.pool.query(
                            `UPDATE sandbox_files
                             SET source_hash = $1
                             WHERE sandbox_id = $2 AND relative_path = $3`,
                            [currentHash, sandbox.id, row.relative_path]
                        );
                    }
                }
            } catch (err: any) {
                if (err.code === 'ENOENT' && row.baseline_hash) {
                    // File was deleted from source
                    changes.push({
                        relativePath: row.relative_path,
                        type: 'deleted',
                        originalHash: row.baseline_hash,
                    });
                }
            }
        }

        return changes;
    }

    /**
     * Get list of files that have conflicts (both sandbox and source changed)
     */
    async getConflictingFiles(sandboxId: string): Promise<string[]> {
        if (!this.pool) {
            return [];
        }

        const result = await this.pool.query(
            `SELECT relative_path
             FROM sandbox_files
             WHERE sandbox_id = $1
               AND change_type != 'unchanged'
               AND (
                   source_hash IS NOT NULL
                   AND source_hash != baseline_hash
               )`,
            [sandboxId]
        );

        return result.rows.map((row) => row.relative_path);
    }

    /**
     * Determine the type of conflict for a specific file
     */
    async getConflictType(
        sandboxId: string,
        relativePath: string,
        sourcePath: string
    ): Promise<ConflictType | null> {
        if (!this.pool) {
            return null;
        }

        const result = await this.pool.query(
            `SELECT baseline_hash, current_hash, source_hash, change_type
             FROM sandbox_files
             WHERE sandbox_id = $1 AND relative_path = $2`,
            [sandboxId, relativePath]
        );

        if (result.rows.length === 0) {
            return null;
        }

        const file = result.rows[0];
        const fullSourcePath = path.join(sourcePath, relativePath);

        // Check if source file exists
        let sourceExists = true;
        let currentSourceHash: string | null = null;

        try {
            currentSourceHash = await this.hasher.hashFile(fullSourcePath);
        } catch (err: any) {
            if (err.code === 'ENOENT') {
                sourceExists = false;
            } else {
                throw err;
            }
        }

        // Determine conflict type
        const sandboxChanged = file.change_type !== 'unchanged';
        const sourceChanged = currentSourceHash !== file.baseline_hash;

        if (!sourceExists && sandboxChanged) {
            return 'source_deleted';
        }

        if (sandboxChanged && sourceChanged) {
            return 'both_modified';
        }

        if (sourceChanged && !sandboxChanged) {
            return 'source_modified';
        }

        return null;
    }

    /**
     * Mark a file as having a conflict
     */
    async markConflict(
        sandboxId: string,
        relativePath: string,
        conflictType: ConflictType
    ): Promise<void> {
        if (!this.pool) {
            return;
        }

        await this.pool.query(
            `UPDATE sandbox_files
             SET merge_status = 'conflicted'
             WHERE sandbox_id = $1 AND relative_path = $2`,
            [sandboxId, relativePath]
        );
    }

    /**
     * Check if any files in the sandbox have conflicts
     */
    async hasConflicts(sandboxId: string): Promise<boolean> {
        if (!this.pool) {
            return false;
        }

        const result = await this.pool.query(
            `SELECT COUNT(*) as count
             FROM sandbox_files
             WHERE sandbox_id = $1
               AND merge_status = 'conflicted'`,
            [sandboxId]
        );

        return parseInt(result.rows[0].count, 10) > 0;
    }

    /**
     * Get summary of conflicts for a sandbox
     */
    async getConflictSummary(sandboxId: string): Promise<{
        total: number;
        sourceModified: number;
        sourceDeleted: number;
        bothModified: number;
    }> {
        if (!this.pool) {
            return {
                total: 0,
                sourceModified: 0,
                sourceDeleted: 0,
                bothModified: 0,
            };
        }

        const result = await this.pool.query(
            `SELECT
                COUNT(*) FILTER (WHERE merge_status = 'conflicted') as total,
                COUNT(*) FILTER (WHERE source_hash IS NULL AND baseline_hash IS NOT NULL) as source_deleted,
                COUNT(*) FILTER (
                    WHERE source_hash != baseline_hash
                    AND change_type != 'unchanged'
                ) as both_modified,
                COUNT(*) FILTER (
                    WHERE source_hash != baseline_hash
                    AND change_type = 'unchanged'
                ) as source_modified
             FROM sandbox_files
             WHERE sandbox_id = $1`,
            [sandboxId]
        );

        const row = result.rows[0];
        return {
            total: parseInt(row.total, 10),
            sourceModified: parseInt(row.source_modified, 10),
            sourceDeleted: parseInt(row.source_deleted, 10),
            bothModified: parseInt(row.both_modified, 10),
        };
    }
}

// Export singleton
export const conflictDetector = new ConflictDetector();
