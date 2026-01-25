/**
 * Database Task Store
 *
 * Abstract database interface for persisting tasks across different database systems.
 * This provides a unified interface for PostgreSQL, MySQL, and SQLite implementations.
 */
/**
 * Abstract base class for database task stores
 */
export class BaseDatabaseTaskStore {
    constructor(config) {
        this.config = {
            tableName: 'a2a_tasks',
            timeout: 30000,
            maxConnections: 10,
            ssl: false,
            ...config,
        };
        this.tableName = this.config.tableName;
    }
    /**
     * Serialize Task to database row
     */
    serializeTask(task) {
        return {
            id: task.id,
            context_id: task.context_id,
            status_state: task.status?.state,
            status_message: task.status?.message,
            status_timestamp: task.status?.timestamp,
            artifacts: JSON.stringify(task.artifacts || []),
            history: JSON.stringify(task.history || []),
            metadata: JSON.stringify(task.metadata || {}),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
    }
    /**
     * Deserialize database row to Task
     */
    deserializeTask(row) {
        return {
            id: row.id,
            context_id: row.context_id,
            kind: 'task',
            status: {
                state: row.status_state || 'unknown',
                message: row.status_message,
                timestamp: row.status_timestamp || new Date().toISOString(),
            },
            artifacts: row.artifacts ? JSON.parse(row.artifacts) : [],
            history: row.history ? JSON.parse(row.history) : [],
            metadata: row.metadata ? JSON.parse(row.metadata) : {},
        };
    }
    /**
     * Build WHERE clause from filter
     */
    buildWhereClause(filter) {
        const conditions = [];
        const params = [];
        if (filter?.status) {
            conditions.push('status_state = ?');
            params.push(filter.status);
        }
        if (filter?.contextId) {
            conditions.push('context_id = ?');
            params.push(filter.contextId);
        }
        const clause = conditions.length > 0
            ? 'WHERE ' + conditions.join(' AND ')
            : '';
        return { clause, params };
    }
    /**
     * Get ORDER BY clause for consistent ordering
     */
    getOrderClause() {
        return 'ORDER BY created_at DESC';
    }
    /**
     * Get LIMIT/OFFSET clause for pagination
     */
    buildPaginationClause(filter) {
        const limit = filter?.limit || 100;
        const offset = filter?.offset || 0;
        return `LIMIT ${limit} OFFSET ${offset}`;
    }
}
