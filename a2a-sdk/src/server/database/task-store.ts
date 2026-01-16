/**
 * Database Task Store
 *
 * Abstract database interface for persisting tasks across different database systems.
 * This provides a unified interface for PostgreSQL, MySQL, and SQLite implementations.
 */

import type { Task, TaskState } from '../../types/v1';

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

  /** Connection retry attempts (default: 3) */
  retryAttempts?: number;

  /** Delay between retry attempts in ms (default: 1000) */
  retryDelay?: number;

  /** Enable WAL mode for SQLite (default: true) */
  walMode?: boolean;

  /** Enable foreign key constraints for SQLite (default: true) */
  foreignKeys?: boolean;

  /** Cache size for SQLite (default: 2000 pages) */
  cacheSize?: number;
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
export abstract class BaseDatabaseTaskStore implements DatabaseTaskStore {
  protected config: DatabaseConfig;
  protected tableName: string;

  constructor(config: DatabaseConfig) {
    this.config = {
      tableName: 'a2a_tasks',
      timeout: 30000,
      maxConnections: 10,
      ssl: false,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config,
    };
    this.tableName = this.config.tableName!;
  }

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
   * Serialize Task to database row (v1 uses camelCase)
   */
  protected serializeTask(task: Task): Record<string, unknown> {
    return {
      id: task.id,
      context_id: task.contextId,
      status_state: task.status?.state,
      status_message: task.status?.message ? JSON.stringify(task.status.message) : null,
      status_timestamp: task.status?.timestamp,
      artifacts: JSON.stringify(task.artifacts || []),
      history: JSON.stringify(task.history || []),
      metadata: JSON.stringify(task.metadata || {}),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Deserialize database row to Task (v1 uses camelCase)
   */
  protected deserializeTask(row: Record<string, unknown>): Task {
    const statusMessage = row.status_message
      ? (typeof row.status_message === 'string' ? JSON.parse(row.status_message) : row.status_message)
      : undefined;

    return {
      id: row.id as string,
      contextId: row.context_id as string,
      status: {
        state: (row.status_state as TaskState) || 'submitted',
        message: statusMessage,
        timestamp: (row.status_timestamp as string) || new Date().toISOString(),
      },
      artifacts: row.artifacts ? JSON.parse(row.artifacts as string) : [],
      history: row.history ? JSON.parse(row.history as string) : [],
      metadata: row.metadata ? JSON.parse(row.metadata as string) : {},
    };
  }

  /**
   * Build WHERE clause from filter
   */
  protected buildWhereClause(filter: Record<string, unknown> | undefined): { clause: string; params: unknown[] } {
    const conditions: string[] = [];
    const params: unknown[] = [];

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
  protected getOrderClause(): string {
    return 'ORDER BY created_at DESC';
  }

  /**
   * Get LIMIT/OFFSET clause for pagination
   */
  protected buildPaginationClause(filter: Record<string, unknown> | undefined): string {
    const limit = (filter?.limit as number) || 100;
    const offset = (filter?.offset as number) || 0;
    return `LIMIT ${limit} OFFSET ${offset}`;
  }
}
