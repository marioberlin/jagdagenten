/**
 * PostgreSQL Task Store
 *
 * PostgreSQL implementation of DatabaseTaskStore using the 'pg' driver.
 * Provides production-ready task persistence with connection pooling.
 */
import { Task } from '../../types';
import { BaseDatabaseTaskStore, DatabaseConfig } from './task-store';
/**
 * PostgreSQL-specific configuration
 */
export interface PostgresConfig extends DatabaseConfig {
    /** PostgreSQL connection string */
    connection: string;
    /** Enable SSL for connections (default: false) */
    ssl?: boolean;
    /** Connection retry attempts (default: 3) */
    retryAttempts?: number;
    /** Delay between retry attempts in ms (default: 1000) */
    retryDelay?: number;
}
/**
 * PostgreSQL Task Store Implementation
 *
 * Features:
 * - Connection pooling for high concurrency
 * - JSONB support for artifacts and metadata
 * - Automatic table creation
 * - Transaction support
 * - Retry logic for transient failures
 */
export declare class PostgresTaskStore extends BaseDatabaseTaskStore {
    private pool;
    private client;
    constructor(config: PostgresConfig);
    /**
     * Initialize database and create tables
     */
    initialize(): Promise<void>;
    /**
     * Creates a new task with retry logic
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
     * Close database connections
     */
    close(): Promise<void>;
    /**
     * Execute with retry logic for transient failures
     */
    private withRetry;
}
