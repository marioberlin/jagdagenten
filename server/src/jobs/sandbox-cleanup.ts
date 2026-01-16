/**
 * Sandbox Cleanup Job
 *
 * Background job for cleaning up expired sandboxes and backups.
 * Should be run periodically via cron or scheduled task.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { componentLoggers } from '../logger';

const logger = componentLoggers.http;

const SANDBOX_BASE_PATH = process.env.SANDBOX_BASE_PATH || '/tmp/liquid-sandboxes';
const BACKUP_BASE_PATH = process.env.BACKUP_BASE_PATH || '/tmp/liquid-backups';

/**
 * Cleanup expired sandbox sessions
 */
async function cleanupExpiredSandboxes(pool: Pool): Promise<number> {
    // Mark expired sandboxes
    const expiredResult = await pool.query(
        `UPDATE sandbox_sessions
         SET status = 'expired'
         WHERE status = 'active'
           AND expires_at < NOW()
         RETURNING id, sandbox_root`
    );

    let cleaned = 0;

    for (const row of expiredResult.rows) {
        try {
            // Remove sandbox directory
            if (row.sandbox_root) {
                await fs.rm(row.sandbox_root, { recursive: true, force: true });
            }

            // Log the cleanup
            await pool.query(
                `INSERT INTO sandbox_audit_log (id, sandbox_id, event_type, actor, details)
                 VALUES (gen_random_uuid(), $1, 'expired', 'system', $2)`,
                [row.id, JSON.stringify({ reason: 'auto_expiry' })]
            );

            cleaned++;
            logger.info({ sandboxId: row.id }, 'Cleaned up expired sandbox');
        } catch (error) {
            logger.error(
                { sandboxId: row.id, error },
                'Failed to cleanup sandbox'
            );
        }
    }

    return cleaned;
}

/**
 * Cleanup expired backups
 */
async function cleanupExpiredBackups(pool: Pool): Promise<number> {
    // Get expired backups
    const expiredResult = await pool.query(
        `SELECT id, backup_path
         FROM sandbox_backups
         WHERE expires_at < NOW()
           AND status = 'active'`
    );

    let cleaned = 0;

    for (const row of expiredResult.rows) {
        try {
            // Remove backup file/directory
            if (row.backup_path) {
                // Check if it's a tar.gz or directory
                const backupDir = row.backup_path.replace('.tar.gz', '');
                await fs.rm(backupDir, { recursive: true, force: true });
            }

            // Update status
            await pool.query(
                `UPDATE sandbox_backups SET status = 'expired' WHERE id = $1`,
                [row.id]
            );

            cleaned++;
        } catch (error) {
            logger.error({ backupId: row.id, error }, 'Failed to cleanup backup');
        }
    }

    return cleaned;
}

/**
 * Cleanup orphaned directories
 * (directories that exist on disk but not in database)
 */
async function cleanupOrphanedDirectories(pool: Pool): Promise<number> {
    let cleaned = 0;

    // Cleanup orphaned sandbox directories
    try {
        const sandboxDirs = await fs.readdir(SANDBOX_BASE_PATH);

        for (const dir of sandboxDirs) {
            if (!dir.startsWith('session_')) continue;

            const sandboxId = dir.replace('session_', '');
            const fullPath = path.join(SANDBOX_BASE_PATH, dir);

            // Check if sandbox exists in database
            const result = await pool.query(
                `SELECT id FROM sandbox_sessions WHERE id = $1`,
                [sandboxId]
            );

            if (result.rows.length === 0) {
                // Orphaned directory - remove it
                const stat = await fs.stat(fullPath);
                const age = Date.now() - stat.mtime.getTime();

                // Only remove if older than 1 hour (to avoid race conditions)
                if (age > 60 * 60 * 1000) {
                    await fs.rm(fullPath, { recursive: true, force: true });
                    cleaned++;
                    logger.info({ path: fullPath }, 'Removed orphaned sandbox directory');
                }
            }
        }
    } catch (error: any) {
        if (error.code !== 'ENOENT') {
            logger.error({ error }, 'Failed to cleanup orphaned sandbox directories');
        }
    }

    // Cleanup empty backup directories
    try {
        const backupDirs = await fs.readdir(BACKUP_BASE_PATH);

        for (const dir of backupDirs) {
            const fullPath = path.join(BACKUP_BASE_PATH, dir);
            const stat = await fs.stat(fullPath);

            if (stat.isDirectory()) {
                const files = await fs.readdir(fullPath);
                if (files.length === 0) {
                    await fs.rmdir(fullPath);
                    cleaned++;
                }
            }
        }
    } catch (error: any) {
        if (error.code !== 'ENOENT') {
            logger.error({ error }, 'Failed to cleanup empty backup directories');
        }
    }

    return cleaned;
}

/**
 * Main cleanup function
 * Call this from your cron job or scheduler
 */
export async function runSandboxCleanup(pool: Pool): Promise<{
    sandboxes: number;
    backups: number;
    orphaned: number;
}> {
    logger.info('Starting sandbox cleanup job');

    const sandboxes = await cleanupExpiredSandboxes(pool);
    const backups = await cleanupExpiredBackups(pool);
    const orphaned = await cleanupOrphanedDirectories(pool);

    logger.info(
        { sandboxes, backups, orphaned },
        'Sandbox cleanup job completed'
    );

    return { sandboxes, backups, orphaned };
}

/**
 * Schedule cleanup to run periodically
 * Returns a function to stop the scheduler
 */
export function scheduleSandboxCleanup(
    pool: Pool,
    intervalMs: number = 60 * 60 * 1000 // Default: 1 hour
): () => void {
    logger.info(
        { intervalMs },
        'Scheduling sandbox cleanup job'
    );

    const interval = setInterval(async () => {
        try {
            await runSandboxCleanup(pool);
        } catch (error) {
            logger.error({ error }, 'Sandbox cleanup job failed');
        }
    }, intervalMs);

    // Run once immediately
    runSandboxCleanup(pool).catch((error) => {
        logger.error({ error }, 'Initial sandbox cleanup failed');
    });

    return () => {
        clearInterval(interval);
        logger.info('Sandbox cleanup job stopped');
    };
}

export default runSandboxCleanup;
