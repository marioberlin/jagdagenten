/**
 * CoworkRepository
 *
 * Database access layer for Cowork sessions, subtasks, artifacts, and notifications.
 * Provides CRUD operations and complex queries for the orchestrator.
 */

import { Pool } from 'pg';
import { randomUUID } from 'crypto';
import { pool as defaultPool } from '../db';
import { componentLoggers } from '../logger';
import type {
    CoworkSession,
    CoworkSessionStatus,
    CoworkPhase,
    CoworkSubTask,
    SubTaskStatus,
    SubTaskResult,
    CoworkArtifact,
    ArtifactType,
    AgentInstance,
    AgentStatus,
    AgentType,
    FileOperation,
    FileOperationType,
    FileOperationStatus,
    TaskPlan,
    WorkspaceConfig,
    TaskNotification,
    NotificationLevel,
} from './types';

const logger = componentLoggers.cowork || console;

// Database connection
let dbPool: Pool | null = null;

export function setDbPool(pool: Pool): void {
    dbPool = pool;
}

function getPool(): Pool {
    return dbPool || defaultPool;
}

// ============================================================================
// SESSION REPOSITORY
// ============================================================================

export interface SessionSummary {
    id: string;
    title: string;
    description: string;
    status: CoworkSessionStatus;
    artifactCount: number;
    createdAt: Date;
    completedAt?: Date;
}

export interface QueueStats {
    queuedCount: number;
    activeCount: number;
    pausedCount: number;
    completedToday: number;
    failedToday: number;
}

export class SessionRepository {
    private pool: Pool;

    constructor(pool?: Pool) {
        this.pool = pool || getPool();
    }

    /**
     * Create a new session
     */
    async create(session: Omit<CoworkSession, 'id' | 'createdAt'>): Promise<CoworkSession> {
        const id = randomUUID();
        const now = new Date();

        await this.pool.query(
            `INSERT INTO cowork_sessions
             (id, user_id, title, description, status, phase, plan, workspace_config, context,
              tokens_used, estimated_cost, selected_agent, current_thought, active_sandbox_id,
              created_at, started_at, current_step, total_steps, progress, elapsed_time)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
            [
                id,
                session.userId,
                session.title,
                session.description,
                session.status,
                session.phase,
                session.plan ? JSON.stringify(session.plan) : null,
                JSON.stringify(session.workspace),
                JSON.stringify([]), // context
                session.tokensUsed || 0,
                session.estimatedCost || 0,
                null, // selected_agent
                session.currentThought || null,
                session.sandboxId || null,
                now,
                session.startedAt || null,
                0, // current_step
                session.plan?.steps?.length || 0,
                0, // progress
                0, // elapsed_time
            ]
        );

        return {
            ...session,
            id,
            createdAt: now,
        };
    }

    /**
     * Get session by ID
     */
    async getById(sessionId: string): Promise<CoworkSession | null> {
        const result = await this.pool.query(
            `SELECT * FROM cowork_sessions WHERE id = $1`,
            [sessionId]
        );

        if (result.rows.length === 0) {
            return null;
        }

        return this.mapRowToSession(result.rows[0]);
    }

    /**
     * Get sessions by user ID
     */
    async getByUserId(userId: string, limit = 50): Promise<SessionSummary[]> {
        const result = await this.pool.query(
            `SELECT s.id, s.title, s.description, s.status, s.created_at, s.completed_at,
                    (SELECT COUNT(*) FROM cowork_artifacts WHERE session_id = s.id) as artifact_count
             FROM cowork_sessions s
             WHERE s.user_id = $1
             ORDER BY s.created_at DESC
             LIMIT $2`,
            [userId, limit]
        );

        return result.rows.map(row => ({
            id: row.id,
            title: row.title,
            description: row.description,
            status: row.status as CoworkSessionStatus,
            artifactCount: parseInt(row.artifact_count, 10),
            createdAt: row.created_at,
            completedAt: row.completed_at || undefined,
        }));
    }

    /**
     * Get active sessions for a user
     */
    async getActiveSessions(userId: string): Promise<CoworkSession[]> {
        const result = await this.pool.query(
            `SELECT * FROM cowork_sessions
             WHERE user_id = $1 AND status IN ('planning', 'awaiting_approval', 'executing', 'paused')
             ORDER BY created_at DESC`,
            [userId]
        );

        return Promise.all(result.rows.map(row => this.mapRowToSession(row)));
    }

    /**
     * Update session
     */
    async update(sessionId: string, updates: Partial<CoworkSession>): Promise<void> {
        const fields: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (updates.status !== undefined) {
            fields.push(`status = $${paramIndex++}`);
            values.push(updates.status);
        }
        if (updates.phase !== undefined) {
            fields.push(`phase = $${paramIndex++}`);
            values.push(updates.phase);
        }
        if (updates.plan !== undefined) {
            fields.push(`plan = $${paramIndex++}`);
            values.push(updates.plan ? JSON.stringify(updates.plan) : null);
        }
        if (updates.tokensUsed !== undefined) {
            fields.push(`tokens_used = $${paramIndex++}`);
            values.push(updates.tokensUsed);
        }
        if (updates.estimatedCost !== undefined) {
            fields.push(`estimated_cost = $${paramIndex++}`);
            values.push(updates.estimatedCost);
        }
        if (updates.currentThought !== undefined) {
            fields.push(`current_thought = $${paramIndex++}`);
            values.push(updates.currentThought);
        }
        if (updates.startedAt !== undefined) {
            fields.push(`started_at = $${paramIndex++}`);
            values.push(updates.startedAt);
        }
        if (updates.completedAt !== undefined) {
            fields.push(`completed_at = $${paramIndex++}`);
            values.push(updates.completedAt);
        }
        if (updates.sandboxId !== undefined) {
            fields.push(`active_sandbox_id = $${paramIndex++}`);
            values.push(updates.sandboxId);
        }

        if (fields.length === 0) {
            return;
        }

        values.push(sessionId);
        await this.pool.query(
            `UPDATE cowork_sessions SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
            values
        );
    }

    /**
     * Update session status
     */
    async updateStatus(
        sessionId: string,
        status: CoworkSessionStatus,
        phase?: CoworkPhase
    ): Promise<void> {
        const updates: string[] = ['status = $1'];
        const values: any[] = [status];
        let paramIndex = 2;

        if (phase) {
            updates.push(`phase = $${paramIndex++}`);
            values.push(phase);
        }

        if (status === 'executing' || status === 'planning') {
            updates.push(`started_at = COALESCE(started_at, NOW())`);
        }

        if (status === 'completed' || status === 'failed' || status === 'cancelled') {
            updates.push(`completed_at = NOW()`);
        }

        values.push(sessionId);
        await this.pool.query(
            `UPDATE cowork_sessions SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
            values
        );
    }

    /**
     * Delete session (cascade deletes subtasks, artifacts, etc.)
     */
    async delete(sessionId: string): Promise<void> {
        await this.pool.query(
            `DELETE FROM cowork_sessions WHERE id = $1`,
            [sessionId]
        );
    }

    /**
     * Map database row to CoworkSession
     */
    private async mapRowToSession(row: any): Promise<CoworkSession> {
        // Get subtasks
        const subtasksResult = await this.pool.query(
            `SELECT * FROM cowork_subtasks WHERE session_id = $1 ORDER BY task_order`,
            [row.id]
        );

        // Get agents
        const agentsResult = await this.pool.query(
            `SELECT * FROM cowork_agents WHERE session_id = $1`,
            [row.id]
        );

        // Get artifacts
        const artifactsResult = await this.pool.query(
            `SELECT * FROM cowork_artifacts WHERE session_id = $1`,
            [row.id]
        );

        // Get file operations
        const fileOpsResult = await this.pool.query(
            `SELECT * FROM cowork_file_operations WHERE session_id = $1 ORDER BY created_at`,
            [row.id]
        );

        return {
            id: row.id,
            userId: row.user_id,
            title: row.title,
            description: row.description || '',
            status: row.status as CoworkSessionStatus,
            phase: row.phase as CoworkPhase,
            plan: row.plan as TaskPlan | null,
            subTasks: subtasksResult.rows.map(this.mapRowToSubTask),
            activeAgents: agentsResult.rows.map(this.mapRowToAgent),
            workspace: row.workspace_config as WorkspaceConfig || this.defaultWorkspace(row.id),
            fileOperations: fileOpsResult.rows.map(this.mapRowToFileOp),
            artifacts: artifactsResult.rows.map(this.mapRowToArtifact),
            createdAt: row.created_at,
            startedAt: row.started_at || undefined,
            completedAt: row.completed_at || undefined,
            tokensUsed: row.tokens_used || 0,
            estimatedCost: parseFloat(row.estimated_cost) || 0,
            currentThought: row.current_thought || undefined,
            sandboxId: row.active_sandbox_id || undefined,
        };
    }

    private defaultWorkspace(sessionId: string): WorkspaceConfig {
        return {
            id: `ws_${sessionId}`,
            sessionId,
            inputPaths: [],
            outputPath: '/tmp/cowork/output',
            tempPath: '/tmp/cowork/temp',
            permissions: { read: true, write: true, delete: false, execute: false, network: true },
            allowedExtensions: [],
            blockedExtensions: [],
            maxFileSize: 10 * 1024 * 1024,
            syncMode: 'auto',
        };
    }

    private mapRowToSubTask(row: any): CoworkSubTask {
        return {
            id: row.id,
            sessionId: row.session_id,
            planStepId: row.plan_step_id || '',
            order: row.task_order,
            title: row.title,
            description: row.description || '',
            agentId: row.agent_id || undefined,
            status: row.status as SubTaskStatus,
            progress: parseFloat(row.progress) || 0,
            result: row.result as SubTaskResult | undefined,
            error: row.error || undefined,
            startedAt: row.started_at || undefined,
            completedAt: row.completed_at || undefined,
        };
    }

    private mapRowToAgent(row: any): AgentInstance {
        return {
            id: row.id,
            sessionId: row.session_id,
            subTaskId: row.subtask_id || undefined,
            name: row.name,
            type: row.agent_type as AgentType | undefined,
            status: row.status as AgentStatus,
            containerId: row.container_id || undefined,
            progress: parseFloat(row.progress) || 0,
            currentThought: row.current_thought || null,
            spawnedAt: row.spawned_at || undefined,
            lastActivityAt: row.last_activity_at || undefined,
        };
    }

    private mapRowToFileOp(row: any): FileOperation {
        return {
            id: row.id,
            sessionId: row.session_id,
            operation: row.operation as FileOperationType,
            sourcePath: row.source_path,
            targetPath: row.target_path || undefined,
            status: row.status as FileOperationStatus,
            error: row.error || undefined,
            timestamp: row.created_at,
        };
    }

    private mapRowToArtifact(row: any): CoworkArtifact {
        return {
            id: row.id,
            sessionId: row.session_id,
            type: row.artifact_type as ArtifactType,
            name: row.name,
            path: row.file_path || undefined,
            mimeType: row.mime_type || undefined,
            size: row.size_bytes ? parseInt(row.size_bytes, 10) : undefined,
            metadata: row.metadata || undefined,
            createdAt: row.created_at,
        };
    }
}

// ============================================================================
// SUBTASK REPOSITORY
// ============================================================================

export class SubTaskRepository {
    private pool: Pool;

    constructor(pool?: Pool) {
        this.pool = pool || getPool();
    }

    /**
     * Create a subtask
     */
    async create(subtask: Omit<CoworkSubTask, 'id'>): Promise<CoworkSubTask> {
        const id = randomUUID();

        await this.pool.query(
            `INSERT INTO cowork_subtasks
             (id, session_id, plan_step_id, task_order, title, description, agent_id, status, progress, result, error, started_at, completed_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
                id,
                subtask.sessionId,
                subtask.planStepId,
                subtask.order,
                subtask.title,
                subtask.description,
                subtask.agentId || null,
                subtask.status,
                subtask.progress,
                subtask.result ? JSON.stringify(subtask.result) : null,
                subtask.error || null,
                subtask.startedAt || null,
                subtask.completedAt || null,
            ]
        );

        return { ...subtask, id };
    }

    /**
     * Get subtasks by session ID
     */
    async getBySessionId(sessionId: string): Promise<CoworkSubTask[]> {
        const result = await this.pool.query(
            `SELECT * FROM cowork_subtasks WHERE session_id = $1 ORDER BY task_order`,
            [sessionId]
        );

        return result.rows.map(row => ({
            id: row.id,
            sessionId: row.session_id,
            planStepId: row.plan_step_id || '',
            order: row.task_order,
            title: row.title,
            description: row.description || '',
            agentId: row.agent_id || undefined,
            status: row.status as SubTaskStatus,
            progress: parseFloat(row.progress) || 0,
            result: row.result as SubTaskResult | undefined,
            error: row.error || undefined,
            startedAt: row.started_at || undefined,
            completedAt: row.completed_at || undefined,
        }));
    }

    /**
     * Update subtask
     */
    async update(subtaskId: string, updates: Partial<CoworkSubTask>): Promise<void> {
        const fields: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (updates.status !== undefined) {
            fields.push(`status = $${paramIndex++}`);
            values.push(updates.status);
        }
        if (updates.progress !== undefined) {
            fields.push(`progress = $${paramIndex++}`);
            values.push(updates.progress);
        }
        if (updates.agentId !== undefined) {
            fields.push(`agent_id = $${paramIndex++}`);
            values.push(updates.agentId);
        }
        if (updates.result !== undefined) {
            fields.push(`result = $${paramIndex++}`);
            values.push(JSON.stringify(updates.result));
        }
        if (updates.error !== undefined) {
            fields.push(`error = $${paramIndex++}`);
            values.push(updates.error);
        }
        if (updates.startedAt !== undefined) {
            fields.push(`started_at = $${paramIndex++}`);
            values.push(updates.startedAt);
        }
        if (updates.completedAt !== undefined) {
            fields.push(`completed_at = $${paramIndex++}`);
            values.push(updates.completedAt);
        }

        if (fields.length === 0) return;

        values.push(subtaskId);
        await this.pool.query(
            `UPDATE cowork_subtasks SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
            values
        );
    }

    /**
     * Update subtask status
     */
    async updateStatus(subtaskId: string, status: SubTaskStatus): Promise<void> {
        const updates = ['status = $1'];
        const values: any[] = [status];

        if (status === 'in_progress') {
            updates.push('started_at = COALESCE(started_at, NOW())');
        }
        if (status === 'completed' || status === 'failed' || status === 'skipped') {
            updates.push('completed_at = NOW()');
        }

        values.push(subtaskId);
        await this.pool.query(
            `UPDATE cowork_subtasks SET ${updates.join(', ')} WHERE id = $2`,
            values
        );
    }
}

// ============================================================================
// ARTIFACT REPOSITORY
// ============================================================================

export class ArtifactRepository {
    private pool: Pool;

    constructor(pool?: Pool) {
        this.pool = pool || getPool();
    }

    /**
     * Create an artifact
     */
    async create(artifact: Omit<CoworkArtifact, 'id' | 'createdAt'>): Promise<CoworkArtifact> {
        const id = randomUUID();
        const now = new Date();

        await this.pool.query(
            `INSERT INTO cowork_artifacts
             (id, session_id, artifact_type, name, file_path, mime_type, size_bytes, metadata, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
                id,
                artifact.sessionId,
                artifact.type,
                artifact.name,
                artifact.path || null,
                artifact.mimeType || null,
                artifact.size || null,
                artifact.metadata ? JSON.stringify(artifact.metadata) : null,
                now,
            ]
        );

        return { ...artifact, id, createdAt: now };
    }

    /**
     * Get artifacts by session ID
     */
    async getBySessionId(sessionId: string): Promise<CoworkArtifact[]> {
        const result = await this.pool.query(
            `SELECT * FROM cowork_artifacts WHERE session_id = $1 ORDER BY created_at`,
            [sessionId]
        );

        return result.rows.map(row => ({
            id: row.id,
            sessionId: row.session_id,
            type: row.artifact_type as ArtifactType,
            name: row.name,
            path: row.file_path || undefined,
            mimeType: row.mime_type || undefined,
            size: row.size_bytes ? parseInt(row.size_bytes, 10) : undefined,
            metadata: row.metadata || undefined,
            createdAt: row.created_at,
        }));
    }

    /**
     * Delete artifact
     */
    async delete(artifactId: string): Promise<void> {
        await this.pool.query(
            `DELETE FROM cowork_artifacts WHERE id = $1`,
            [artifactId]
        );
    }
}

// ============================================================================
// AGENT REPOSITORY
// ============================================================================

export class AgentRepository {
    private pool: Pool;

    constructor(pool?: Pool) {
        this.pool = pool || getPool();
    }

    /**
     * Create an agent instance
     */
    async create(agent: Omit<AgentInstance, 'id' | 'spawnedAt'>): Promise<AgentInstance> {
        const id = randomUUID();
        const now = new Date();

        await this.pool.query(
            `INSERT INTO cowork_agents
             (id, session_id, subtask_id, name, agent_type, status, progress, current_thought, container_id, spawned_at, last_activity_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
                id,
                agent.sessionId || null,
                agent.subTaskId || null,
                agent.name,
                agent.type || null,
                agent.status,
                agent.progress,
                agent.currentThought,
                agent.containerId || null,
                now,
                now,
            ]
        );

        return { ...agent, id, spawnedAt: now, lastActivityAt: now };
    }

    /**
     * Get agents by session ID
     */
    async getBySessionId(sessionId: string): Promise<AgentInstance[]> {
        const result = await this.pool.query(
            `SELECT * FROM cowork_agents WHERE session_id = $1`,
            [sessionId]
        );

        return result.rows.map(row => ({
            id: row.id,
            sessionId: row.session_id,
            subTaskId: row.subtask_id || undefined,
            name: row.name,
            type: row.agent_type as AgentType | undefined,
            status: row.status as AgentStatus,
            containerId: row.container_id || undefined,
            progress: parseFloat(row.progress) || 0,
            currentThought: row.current_thought || null,
            spawnedAt: row.spawned_at || undefined,
            lastActivityAt: row.last_activity_at || undefined,
        }));
    }

    /**
     * Get active agents by session ID
     */
    async getActiveBySessionId(sessionId: string): Promise<AgentInstance[]> {
        const result = await this.pool.query(
            `SELECT * FROM cowork_agents
             WHERE session_id = $1 AND status IN ('initializing', 'thinking', 'working', 'waiting')`,
            [sessionId]
        );

        return result.rows.map(row => ({
            id: row.id,
            sessionId: row.session_id,
            subTaskId: row.subtask_id || undefined,
            name: row.name,
            type: row.agent_type as AgentType | undefined,
            status: row.status as AgentStatus,
            containerId: row.container_id || undefined,
            progress: parseFloat(row.progress) || 0,
            currentThought: row.current_thought || null,
            spawnedAt: row.spawned_at || undefined,
            lastActivityAt: row.last_activity_at || undefined,
        }));
    }

    /**
     * Update agent
     */
    async update(agentId: string, updates: Partial<AgentInstance>): Promise<void> {
        const fields: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (updates.status !== undefined) {
            fields.push(`status = $${paramIndex++}`);
            values.push(updates.status);
        }
        if (updates.progress !== undefined) {
            fields.push(`progress = $${paramIndex++}`);
            values.push(updates.progress);
        }
        if (updates.currentThought !== undefined) {
            fields.push(`current_thought = $${paramIndex++}`);
            values.push(updates.currentThought);
        }
        if (updates.containerId !== undefined) {
            fields.push(`container_id = $${paramIndex++}`);
            values.push(updates.containerId);
        }

        if (fields.length === 0) return;

        values.push(agentId);
        await this.pool.query(
            `UPDATE cowork_agents SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
            values
        );
    }

    /**
     * Update agent status
     */
    async updateStatus(agentId: string, status: AgentStatus): Promise<void> {
        const updates = ['status = $1'];

        if (status === 'completed' || status === 'failed' || status === 'terminated') {
            updates.push('completed_at = NOW()');
        }

        await this.pool.query(
            `UPDATE cowork_agents SET ${updates.join(', ')} WHERE id = $2`,
            [status, agentId]
        );
    }
}

// ============================================================================
// NOTIFICATION REPOSITORY
// ============================================================================

export class NotificationRepository {
    private pool: Pool;

    constructor(pool?: Pool) {
        this.pool = pool || getPool();
    }

    /**
     * Create a notification
     */
    async create(notification: Omit<TaskNotification, 'id' | 'timestamp' | 'read'>): Promise<TaskNotification> {
        const id = randomUUID();
        const now = new Date();

        await this.pool.query(
            `INSERT INTO cowork_notifications
             (id, user_id, session_id, level, title, message, action, read, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
                id,
                notification.sessionId, // Using sessionId to get userId - need to fix
                notification.sessionId,
                notification.level,
                notification.title,
                notification.message,
                notification.action ? JSON.stringify(notification.action) : null,
                false,
                now,
            ]
        );

        return { ...notification, id, timestamp: now, read: false };
    }

    /**
     * Create notification for user
     */
    async createForUser(
        userId: string,
        sessionId: string,
        level: NotificationLevel,
        title: string,
        message: string,
        action?: TaskNotification['action']
    ): Promise<TaskNotification> {
        const id = randomUUID();
        const now = new Date();

        await this.pool.query(
            `INSERT INTO cowork_notifications
             (id, user_id, session_id, level, title, message, action, read, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [id, userId, sessionId, level, title, message, action ? JSON.stringify(action) : null, false, now]
        );

        return { id, sessionId, level, title, message, action, timestamp: now, read: false };
    }

    /**
     * Get notifications for user
     */
    async getByUserId(userId: string, unreadOnly = false, limit = 100): Promise<TaskNotification[]> {
        let query = `SELECT * FROM cowork_notifications WHERE user_id = $1`;
        const params: any[] = [userId];

        if (unreadOnly) {
            query += ' AND read = FALSE';
        }

        query += ' ORDER BY created_at DESC LIMIT $2';
        params.push(limit);

        const result = await this.pool.query(query, params);

        return result.rows.map(row => ({
            id: row.id,
            sessionId: row.session_id,
            level: row.level as NotificationLevel,
            title: row.title,
            message: row.message,
            action: row.action || undefined,
            timestamp: row.created_at,
            read: row.read,
        }));
    }

    /**
     * Mark notifications as read
     */
    async markRead(notificationIds: string[]): Promise<void> {
        if (notificationIds.length === 0) return;

        await this.pool.query(
            `UPDATE cowork_notifications SET read = TRUE, read_at = NOW() WHERE id = ANY($1)`,
            [notificationIds]
        );
    }

    /**
     * Mark all user notifications as read
     */
    async markAllRead(userId: string): Promise<void> {
        await this.pool.query(
            `UPDATE cowork_notifications SET read = TRUE, read_at = NOW() WHERE user_id = $1 AND read = FALSE`,
            [userId]
        );
    }

    /**
     * Delete old notifications (keep last N)
     */
    async cleanup(userId: string, keepCount = 100): Promise<number> {
        const result = await this.pool.query(
            `SELECT cleanup_old_notifications($1, $2)`,
            [userId, keepCount]
        );
        return result.rows[0]?.cleanup_old_notifications || 0;
    }

    /**
     * Get unread count
     */
    async getUnreadCount(userId: string): Promise<number> {
        const result = await this.pool.query(
            `SELECT COUNT(*) FROM cowork_notifications WHERE user_id = $1 AND read = FALSE`,
            [userId]
        );
        return parseInt(result.rows[0]?.count || '0', 10);
    }
}

// ============================================================================
// QUEUE REPOSITORY
// ============================================================================

export class QueueRepository {
    private pool: Pool;

    constructor(pool?: Pool) {
        this.pool = pool || getPool();
    }

    /**
     * Add session to queue
     */
    async addToQueue(sessionId: string, userId: string, priority = 5): Promise<void> {
        // Get next queue position
        const posResult = await this.pool.query(
            `SELECT COALESCE(MAX(queue_position), 0) + 1 as next_pos
             FROM cowork_task_queue WHERE user_id = $1`,
            [userId]
        );
        const position = posResult.rows[0]?.next_pos || 1;

        await this.pool.query(
            `INSERT INTO cowork_task_queue (session_id, user_id, priority, queue_position, status, created_at)
             VALUES ($1, $2, $3, $4, 'queued', NOW())
             ON CONFLICT (session_id) DO UPDATE SET priority = $3, queue_position = $4`,
            [sessionId, userId, priority, position]
        );
    }

    /**
     * Update queue item status
     */
    async updateStatus(sessionId: string, status: string): Promise<void> {
        const updates = ['status = $1'];

        if (status === 'active') {
            updates.push('started_at = NOW()');
        }
        if (status === 'completed' || status === 'failed' || status === 'cancelled') {
            updates.push('completed_at = NOW()');
        }

        await this.pool.query(
            `UPDATE cowork_task_queue SET ${updates.join(', ')} WHERE session_id = $2`,
            [status, sessionId]
        );
    }

    /**
     * Update priority
     */
    async updatePriority(sessionId: string, priority: number): Promise<void> {
        await this.pool.query(
            `UPDATE cowork_task_queue SET priority = $1 WHERE session_id = $2`,
            [priority, sessionId]
        );
    }

    /**
     * Reorder queue
     */
    async reorder(sessionId: string, newPosition: number): Promise<void> {
        await this.pool.query(
            `UPDATE cowork_task_queue SET queue_position = $1 WHERE session_id = $2`,
            [newPosition, sessionId]
        );
    }

    /**
     * Get queue stats
     */
    async getStats(userId: string): Promise<QueueStats> {
        const result = await this.pool.query(
            `SELECT * FROM get_cowork_queue_stats($1)`,
            [userId]
        );

        const row = result.rows[0] || {};
        return {
            queuedCount: parseInt(row.queued_count || '0', 10),
            activeCount: parseInt(row.active_count || '0', 10),
            pausedCount: parseInt(row.paused_count || '0', 10),
            completedToday: parseInt(row.completed_today || '0', 10),
            failedToday: parseInt(row.failed_today || '0', 10),
        };
    }

    /**
     * Get queued sessions in priority order
     */
    async getQueuedSessions(userId: string): Promise<string[]> {
        const result = await this.pool.query(
            `SELECT session_id FROM cowork_task_queue
             WHERE user_id = $1 AND status = 'queued'
             ORDER BY priority ASC, queue_position ASC`,
            [userId]
        );
        return result.rows.map(r => r.session_id);
    }

    /**
     * Pause all active sessions
     */
    async pauseAll(userId: string): Promise<number> {
        const result = await this.pool.query(
            `UPDATE cowork_task_queue SET status = 'paused'
             WHERE user_id = $1 AND status = 'active'`,
            [userId]
        );
        return result.rowCount || 0;
    }

    /**
     * Resume all paused sessions
     */
    async resumeAll(userId: string): Promise<number> {
        const result = await this.pool.query(
            `UPDATE cowork_task_queue SET status = 'queued'
             WHERE user_id = $1 AND status = 'paused'`,
            [userId]
        );
        return result.rowCount || 0;
    }
}

// ============================================================================
// FILE OPERATION REPOSITORY
// ============================================================================

export class FileOperationRepository {
    private pool: Pool;

    constructor(pool?: Pool) {
        this.pool = pool || getPool();
    }

    /**
     * Log a file operation
     */
    async create(operation: Omit<FileOperation, 'id' | 'timestamp'>): Promise<FileOperation> {
        const id = randomUUID();
        const now = new Date();

        await this.pool.query(
            `INSERT INTO cowork_file_operations
             (id, session_id, operation, source_path, target_path, status, error, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                id,
                operation.sessionId,
                operation.operation,
                operation.sourcePath,
                operation.targetPath || null,
                operation.status,
                operation.error || null,
                now,
            ]
        );

        return { ...operation, id, timestamp: now };
    }

    /**
     * Update operation status
     */
    async updateStatus(operationId: string, status: FileOperationStatus, error?: string): Promise<void> {
        const updates = ['status = $1'];
        const values: any[] = [status];

        if (error) {
            updates.push('error = $2');
            values.push(error);
        }

        if (status === 'completed' || status === 'failed') {
            updates.push('completed_at = NOW()');
        }

        values.push(operationId);
        await this.pool.query(
            `UPDATE cowork_file_operations SET ${updates.join(', ')} WHERE id = $${values.length}`,
            values
        );
    }

    /**
     * Get operations by session ID
     */
    async getBySessionId(sessionId: string): Promise<FileOperation[]> {
        const result = await this.pool.query(
            `SELECT * FROM cowork_file_operations WHERE session_id = $1 ORDER BY created_at`,
            [sessionId]
        );

        return result.rows.map(row => ({
            id: row.id,
            sessionId: row.session_id,
            operation: row.operation as FileOperationType,
            sourcePath: row.source_path,
            targetPath: row.target_path || undefined,
            status: row.status as FileOperationStatus,
            error: row.error || undefined,
            timestamp: row.created_at,
        }));
    }
}

// ============================================================================
// SINGLETON EXPORTS
// ============================================================================

export const sessionRepository = new SessionRepository();
export const subTaskRepository = new SubTaskRepository();
export const artifactRepository = new ArtifactRepository();
export const agentRepository = new AgentRepository();
export const notificationRepository = new NotificationRepository();
export const queueRepository = new QueueRepository();
export const fileOperationRepository = new FileOperationRepository();

export default {
    setDbPool,
    sessionRepository,
    subTaskRepository,
    artifactRepository,
    agentRepository,
    notificationRepository,
    queueRepository,
    fileOperationRepository,
    SessionRepository,
    SubTaskRepository,
    ArtifactRepository,
    AgentRepository,
    NotificationRepository,
    QueueRepository,
    FileOperationRepository,
};
