/**
 * AuditLogger
 *
 * Logging service for sandbox audit trail.
 * Provides full compliance and debugging capabilities.
 */

import { Pool } from 'pg';
import { randomUUID } from 'crypto';
import type {
    AuditLogEntry,
    AuditLogRecord,
    AuditEventType
} from './types';

// Database connection (will be injected or use environment)
let dbPool: Pool | null = null;

export function setDbPool(pool: Pool): void {
    dbPool = pool;
}

export class AuditLogger {
    private pool: Pool | null;

    constructor(pool?: Pool) {
        this.pool = pool || dbPool;
    }

    /**
     * Log an audit event
     */
    async log(entry: AuditLogEntry): Promise<void> {
        if (!this.pool) {
            // Fallback to console logging if no DB
            console.log('[Sandbox Audit]', JSON.stringify(entry));
            return;
        }

        try {
            await this.pool.query(
                `INSERT INTO sandbox_audit_log
                 (id, sandbox_id, event_type, actor, file_path, agent_task_id, details)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    randomUUID(),
                    entry.sandboxId,
                    entry.eventType,
                    entry.actor,
                    entry.filePath || null,
                    entry.agentTaskId || null,
                    entry.details ? JSON.stringify(entry.details) : null,
                ]
            );
        } catch (error) {
            // Log to console as fallback, don't throw
            console.error('[Sandbox Audit] Failed to write audit log:', error);
            console.log('[Sandbox Audit]', JSON.stringify(entry));
        }
    }

    /**
     * Get audit history for a sandbox
     */
    async getHistory(
        sandboxId: string,
        options?: {
            eventTypes?: AuditEventType[];
            filePath?: string;
            limit?: number;
        }
    ): Promise<AuditLogRecord[]> {
        if (!this.pool) {
            return [];
        }

        let query = `
            SELECT id, sandbox_id, event_type, actor, file_path, agent_task_id, details, created_at
            FROM sandbox_audit_log
            WHERE sandbox_id = $1
        `;
        const params: any[] = [sandboxId];
        let paramIndex = 2;

        if (options?.eventTypes?.length) {
            query += ` AND event_type = ANY($${paramIndex})`;
            params.push(options.eventTypes);
            paramIndex++;
        }

        if (options?.filePath) {
            query += ` AND file_path = $${paramIndex}`;
            params.push(options.filePath);
            paramIndex++;
        }

        query += ` ORDER BY created_at DESC`;

        if (options?.limit) {
            query += ` LIMIT $${paramIndex}`;
            params.push(options.limit);
        }

        const result = await this.pool.query(query, params);

        return result.rows.map((row) => ({
            id: row.id,
            sandboxId: row.sandbox_id,
            eventType: row.event_type as AuditEventType,
            actor: row.actor,
            filePath: row.file_path || undefined,
            agentTaskId: row.agent_task_id || undefined,
            details: row.details || undefined,
            createdAt: row.created_at,
        }));
    }

    /**
     * Get file-specific history
     */
    async getFileHistory(
        sandboxId: string,
        filePath: string
    ): Promise<AuditLogRecord[]> {
        return this.getHistory(sandboxId, { filePath });
    }

    /**
     * Get recent events across all sandboxes for a user
     */
    async getRecentUserEvents(
        userId: string,
        limit: number = 50
    ): Promise<AuditLogRecord[]> {
        if (!this.pool) {
            return [];
        }

        const result = await this.pool.query(
            `SELECT al.id, al.sandbox_id, al.event_type, al.actor,
                    al.file_path, al.agent_task_id, al.details, al.created_at
             FROM sandbox_audit_log al
             JOIN sandbox_sessions ss ON al.sandbox_id = ss.id
             WHERE ss.user_id = $1
             ORDER BY al.created_at DESC
             LIMIT $2`,
            [userId, limit]
        );

        return result.rows.map((row) => ({
            id: row.id,
            sandboxId: row.sandbox_id,
            eventType: row.event_type as AuditEventType,
            actor: row.actor,
            filePath: row.file_path || undefined,
            agentTaskId: row.agent_task_id || undefined,
            details: row.details || undefined,
            createdAt: row.created_at,
        }));
    }
}

// Export singleton
export const auditLogger = new AuditLogger();
