/**
 * SQLite Task Store
 *
 * SQLite implementation of DatabaseTaskStore using the 'better-sqlite3' driver.
 * Provides lightweight, file-based task persistence perfect for development and small deployments.
 */

import Database from 'better-sqlite3';
import { Task } from '../../types';
import { BaseDatabaseTaskStore, DatabaseConfig } from './task-store';

/**
 * SQLite-specific configuration
 */
export interface SQLiteConfig extends DatabaseConfig {
  /** Database file path (default: './a2a-tasks.db') */
  connection: string;

  /** Enable WAL mode for better concurrency (default: true) */
  walMode?: boolean;

  /** Enable foreign key constraints (default: true) */
  foreignKeys?: boolean;

  /** Cache size (default: 2000 pages) */
  cacheSize?: number;

  /** Connection timeout in ms (default: 30000) */
  timeout?: number;
}

/**
 * SQLite Task Store Implementation
 *
 * Features:
 * - File-based database, no external dependencies
 * - WAL mode for better concurrency
 * - JSON support for artifacts and metadata
 * - Automatic table creation
 * - Prepared statements for performance
 * - Transaction support
 */
export class SQLiteTaskStore extends BaseDatabaseTaskStore {
  private db: Database.Database;

  // Prepared statements for performance
  private insertStmt: Database.Statement;
  private selectStmt: Database.Statement;
  private selectAllStmt: Database.Statement;
  private updateStmt: Database.Statement;
  private deleteStmt: Database.Statement;

  constructor(config: SQLiteConfig) {
    super(config);
    this.config = {
      walMode: true,
      foreignKeys: true,
      cacheSize: 2000,
      ...config,
    };

    // Initialize database connection
    this.db = new Database(this.config.connection, {
      timeout: this.config.timeout,
    });

    // Configure database
    if (this.config.walMode) {
      this.db.pragma('journal_mode = WAL');
    }

    if (this.config.foreignKeys) {
      this.db.pragma('foreign_keys = ON');
    }

    this.db.pragma('cache_size = ' + this.config.cacheSize);

    // Prepare statements
    this.insertStmt = this.db.prepare(`
      INSERT INTO ${this.tableName} (
        id, context_id, status_state, status_message, status_timestamp,
        artifacts, history, metadata, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    this.selectStmt = this.db.prepare(`
      SELECT * FROM ${this.tableName} WHERE id = ?
    `);

    this.selectAllStmt = this.db.prepare(`
      SELECT * FROM ${this.tableName}
      WHERE (? IS NULL OR status_state = ?)
        AND (? IS NULL OR context_id = ?)
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);

    this.updateStmt = this.db.prepare(`
      UPDATE ${this.tableName}
      SET status_state = ?,
          status_message = ?,
          status_timestamp = ?,
          artifacts = ?,
          history = ?,
          metadata = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `);

    this.deleteStmt = this.db.prepare(`
      DELETE FROM ${this.tableName} WHERE id = ?
    `);
  }

  /**
   * Initialize database and create tables
   */
  async initialize(): Promise<void> {
    // Create table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id TEXT PRIMARY KEY,
        context_id TEXT NOT NULL,
        status_state TEXT,
        status_message TEXT,
        status_timestamp TEXT,
        artifacts TEXT DEFAULT '[]',
        history TEXT DEFAULT '[]',
        metadata TEXT DEFAULT '{}',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Create indexes for better query performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_${this.tableName}_context_id
      ON ${this.tableName} (context_id)
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_${this.tableName}_status
      ON ${this.tableName} (status_state)
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_${this.tableName}_created_at
      ON ${this.tableName} (created_at)
    `);

    console.log(`SQLite task store initialized: ${this.tableName}`);
  }

  /**
   * Creates a new task
   */
  async createTask(task: Task): Promise<Task> {
    const serialized = this.serializeTask(task);

    const result = this.insertStmt.run(
      serialized.id,
      serialized.context_id,
      serialized.status_state,
      serialized.status_message,
      serialized.status_timestamp,
      serialized.artifacts,
      serialized.history,
      serialized.metadata
    );

    if (result.changes !== 1) {
      throw new Error('Failed to create task');
    }

    return task;
  }

  /**
   * Updates an existing task
   */
  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    // First get the existing task
    const existingTask = await this.getTask(id);
    if (!existingTask) {
      throw new Error(`Task with id ${id} not found`);
    }

    // Merge updates
    const updatedTask = { ...existingTask, ...updates };

    // Handle status updates
    if (updates.status) {
      updatedTask.status = {
        ...existingTask.status,
        ...updates.status,
      };
    }

    const serialized = this.serializeTask(updatedTask);

    const result = this.updateStmt.run(
      serialized.status_state,
      serialized.status_message,
      serialized.status_timestamp,
      serialized.artifacts,
      serialized.history,
      serialized.metadata,
      id
    );

    if (result.changes !== 1) {
      throw new Error('Failed to update task');
    }

    return updatedTask;
  }

  /**
   * Gets a task by ID
   */
  async getTask(id: string): Promise<Task | null> {
    const row = this.selectStmt.get(id) as any;

    if (!row) {
      return null;
    }

    return this.deserializeTask(row);
  }

  /**
   * Deletes a task
   */
  async deleteTask(id: string): Promise<void> {
    const result = this.deleteStmt.run(id);

    if (result.changes === 0) {
      throw new Error('Task not found');
    }
  }

  /**
   * Lists tasks with optional filtering
   */
  async listTasks(filter?: {
    status?: string;
    contextId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Task[]> {
    const limit = filter?.limit || 100;
    const offset = filter?.offset || 0;

    const rows = this.selectAllStmt.all(
      filter?.status || null,
      filter?.status || null,
      filter?.contextId || null,
      filter?.contextId || null,
      limit,
      offset
    ) as any[];

    return rows.map(row => this.deserializeTask(row));
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    this.db.close();
  }

  /**
   * Get database instance for advanced queries
   */
  getDatabase(): Database.Database {
    return this.db;
  }
}
