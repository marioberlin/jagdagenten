/**
 * Database Task Store
 *
 * Abstract database interface for persisting tasks across different database systems.
 * This provides a unified interface for PostgreSQL, MySQL, and SQLite implementations.
 */
import { Task } from '../../types';
/**
 * Database configuration
 */
export interface DatabaseConfig {
    /** Connection string or configuration object */
    connection: string | object;
    /** Database table name (default: 'a2a_tasks') */
    tableName?: string;
    /** Connection timeout in milliseconds (default: 30000) */
    timeout?: number;
    /** Maximum number of connections in pool (default: 10) */
    maxConnections?: number;
    /** Enable SSL for connections (default: false) */
    ssl?: boolean;
}
/**
 * Database task store interface
 * Provides unified CRUD operations for task persistence
 */
export interface DatabaseTaskStore {
    /**
     * Initialize the database connection and ensure tables exist
     */
    initialize(): Promise<void>;
    /**
     * Creates a new task
     */
    createTask(task: Task): Promise<Task>;
    /**
     * Updates an existing task
     */
    updateTask(id: string, updates: Partial<Task>): Promise<Task>;
    /**
     * Gets a task by ID
     */
    getTask(id: string): Promise<Task | null>;
    /**
     * Deletes a task
     */
    deleteTask(id: string): Promise<void>;
    /**
     * Lists tasks with optional filtering
     */
    listTasks(filter?: {
        status?: string;
        contextId?: string;
        limit?: number;
        offset?: number;
    }): Promise<Task[]>;
    /**
     * Closes database connections
     */
    close(): Promise<void>;
}
/**
 * Abstract base class for database task stores
 */
export declare abstract class BaseDatabaseTaskStore implements DatabaseTaskStore {
    protected config: DatabaseConfig;
    protected tableName: string;
    constructor(config: DatabaseConfig);
    abstract initialize(): Promise<void>;
    abstract createTask(task: Task): Promise<Task>;
    abstract updateTask(id: string, updates: Partial<Task>): Promise<Task>;
    abstract getTask(id: string): Promise<Task | null>;
    abstract deleteTask(id: string): Promise<void>;
    abstract listTasks(filter?: {
        status?: string;
        contextId?: string;
        limit?: number;
        offset?: number;
    }): Promise<Task[]>;
    abstract close(): Promise<void>;
    /**
     * Serialize Task to database row
     */
    protected serializeTask(task: Task): any;
    /**
     * Deserialize database row to Task
     */
    protected deserializeTask(row: any): Task;
    /**
     * Build WHERE clause from filter
     */
    protected buildWhereClause(filter: any): {
        clause: string;
        params: any[];
    };
    /**
     * Get ORDER BY clause for consistent ordering
     */
    protected getOrderClause(): string;
    /**
     * Get LIMIT/OFFSET clause for pagination
     */
    protected buildPaginationClause(filter: any): string;
}
