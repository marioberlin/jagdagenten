/**
 * BackupManager
 *
 * Manages backup snapshots for rollback capability.
 * Creates backup directories of files before merge operations.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { Pool } from 'pg';
import type {
    SandboxBackup,
    CreateBackupRequest,
    BackupType
} from './types';

const BACKUP_BASE_PATH = process.env.BACKUP_BASE_PATH || '/tmp/liquid-backups';
const BACKUP_RETENTION_HOURS = 72; // Keep backups for 72 hours

let dbPool: Pool | null = null;

export function setDbPool(pool: Pool): void {
    dbPool = pool;
}

export class BackupManager {
    private pool: Pool | null;

    constructor(pool?: Pool) {
        this.pool = pool || dbPool;
    }

    /**
     * Create a backup of specified files
     */
    async createBackup(request: CreateBackupRequest): Promise<SandboxBackup> {
        const backupId = randomUUID();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join(BACKUP_BASE_PATH, request.sandboxId);
        const backupPath = path.join(backupDir, `${request.type}_${timestamp}.tar.gz`);

        await fs.mkdir(backupDir, { recursive: true });

        // Collect files that exist
        const existingFiles: string[] = [];
        let totalSize = 0;

        for (const file of request.files) {
            const fullPath = path.join(request.sourcePath, file);
            try {
                const stat = await fs.stat(fullPath);
                if (stat.isFile()) {
                    existingFiles.push(file);
                    totalSize += stat.size;
                }
            } catch {
                // File doesn't exist, skip
            }
        }

        const expiresAt = new Date(Date.now() + BACKUP_RETENTION_HOURS * 60 * 60 * 1000);

        if (existingFiles.length === 0) {
            // No files to backup, create empty record
            const backup: SandboxBackup = {
                id: backupId,
                sandboxId: request.sandboxId,
                backupPath: '',
                backupType: request.type,
                filesIncluded: [],
                totalSizeBytes: 0,
                status: 'active',
                createdAt: new Date(),
                expiresAt,
            };

            if (this.pool) {
                await this.pool.query(
                    `INSERT INTO sandbox_backups
                     (id, sandbox_id, backup_path, backup_type, files_included, total_size_bytes, status, expires_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [
                        backup.id,
                        backup.sandboxId,
                        backup.backupPath,
                        backup.backupType,
                        backup.filesIncluded,
                        backup.totalSizeBytes,
                        backup.status,
                        backup.expiresAt,
                    ]
                );
            }

            return backup;
        }

        // Create backup directory with copies of files
        const backupFilesDir = backupPath.replace('.tar.gz', '');
        await fs.mkdir(backupFilesDir, { recursive: true });

        for (const file of existingFiles) {
            const srcPath = path.join(request.sourcePath, file);
            const destPath = path.join(backupFilesDir, file);
            await fs.mkdir(path.dirname(destPath), { recursive: true });
            await fs.copyFile(srcPath, destPath);
        }

        const backup: SandboxBackup = {
            id: backupId,
            sandboxId: request.sandboxId,
            backupPath,
            backupType: request.type,
            filesIncluded: existingFiles,
            totalSizeBytes: totalSize,
            status: 'active',
            createdAt: new Date(),
            expiresAt,
        };

        if (this.pool) {
            await this.pool.query(
                `INSERT INTO sandbox_backups
                 (id, sandbox_id, backup_path, backup_type, files_included, total_size_bytes, status, expires_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    backup.id,
                    backup.sandboxId,
                    backup.backupPath,
                    backup.backupType,
                    backup.filesIncluded,
                    backup.totalSizeBytes,
                    backup.status,
                    backup.expiresAt,
                ]
            );
        }

        return backup;
    }

    /**
     * Get a backup by ID
     */
    async getBackup(backupId: string): Promise<SandboxBackup> {
        if (!this.pool) {
            throw new Error('Database not configured');
        }

        const result = await this.pool.query(
            `SELECT id, sandbox_id, backup_path, backup_type, files_included,
                    total_size_bytes, status, created_at, expires_at
             FROM sandbox_backups
             WHERE id = $1`,
            [backupId]
        );

        if (result.rows.length === 0) {
            throw new Error(`Backup not found: ${backupId}`);
        }

        const row = result.rows[0];
        return {
            id: row.id,
            sandboxId: row.sandbox_id,
            backupPath: row.backup_path,
            backupType: row.backup_type as BackupType,
            filesIncluded: row.files_included || [],
            totalSizeBytes: Number(row.total_size_bytes),
            status: row.status,
            createdAt: row.created_at,
            expiresAt: row.expires_at,
        };
    }

    /**
     * Get all backups for a sandbox
     */
    async getSandboxBackups(sandboxId: string): Promise<SandboxBackup[]> {
        if (!this.pool) {
            return [];
        }

        const result = await this.pool.query(
            `SELECT id, sandbox_id, backup_path, backup_type, files_included,
                    total_size_bytes, status, created_at, expires_at
             FROM sandbox_backups
             WHERE sandbox_id = $1
             ORDER BY created_at DESC`,
            [sandboxId]
        );

        return result.rows.map((row) => ({
            id: row.id,
            sandboxId: row.sandbox_id,
            backupPath: row.backup_path,
            backupType: row.backup_type as BackupType,
            filesIncluded: row.files_included || [],
            totalSizeBytes: Number(row.total_size_bytes),
            status: row.status,
            createdAt: row.created_at,
            expiresAt: row.expires_at,
        }));
    }

    /**
     * Restore a backup to the original source location
     */
    async restore(backup: SandboxBackup, targetPath: string): Promise<void> {
        if (!backup.backupPath || backup.filesIncluded.length === 0) {
            return; // Nothing to restore
        }

        // The backup path points to a directory (we removed .tar.gz extension)
        const backupDir = backup.backupPath.replace('.tar.gz', '');

        // Verify backup directory exists
        try {
            await fs.access(backupDir);
        } catch {
            throw new Error(`Backup directory not found: ${backupDir}`);
        }

        // Copy files from backup to target location
        for (const file of backup.filesIncluded) {
            const srcPath = path.join(backupDir, file);
            const destPath = path.join(targetPath, file);

            try {
                await fs.mkdir(path.dirname(destPath), { recursive: true });
                await fs.copyFile(srcPath, destPath);
            } catch (err) {
                console.error(`Failed to restore file ${file}:`, err);
            }
        }

        // Mark backup as restored
        if (this.pool) {
            await this.pool.query(
                `UPDATE sandbox_backups SET status = 'restored' WHERE id = $1`,
                [backup.id]
            );
        }
    }

    /**
     * Cleanup expired backups
     */
    async cleanupExpired(): Promise<number> {
        if (!this.pool) {
            return 0;
        }

        // Get expired backups
        const result = await this.pool.query(
            `SELECT id, backup_path
             FROM sandbox_backups
             WHERE expires_at < NOW() AND status = 'active'`
        );

        let cleaned = 0;

        for (const row of result.rows) {
            try {
                // Delete file if exists
                if (row.backup_path) {
                    await fs.rm(row.backup_path, { force: true });
                }

                // Update status
                await this.pool.query(
                    `UPDATE sandbox_backups SET status = 'expired' WHERE id = $1`,
                    [row.id]
                );

                cleaned++;
            } catch (error) {
                console.error(`Failed to cleanup backup ${row.id}:`, error);
            }
        }

        // Also cleanup empty backup directories
        try {
            const dirs = await fs.readdir(BACKUP_BASE_PATH);
            for (const dir of dirs) {
                const fullPath = path.join(BACKUP_BASE_PATH, dir);
                const stat = await fs.stat(fullPath);
                if (stat.isDirectory()) {
                    const files = await fs.readdir(fullPath);
                    if (files.length === 0) {
                        await fs.rmdir(fullPath);
                    }
                }
            }
        } catch {
            // Ignore errors during directory cleanup
        }

        return cleaned;
    }
}

// Export singleton
export const backupManager = new BackupManager();
