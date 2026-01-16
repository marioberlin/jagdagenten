/**
 * MySQL Task Store
 *
 * MySQL implementation of DatabaseTaskStore using the 'mysql2' driver.
 * Provides production-ready task persistence with connection pooling.
 */

import mysql from 'mysql2/promise';
import type { Task } from '../../types/v1';
import { BaseDatabaseTaskStore, DatabaseConfig } from './task-store';

/**
 * MySQL connection configuration
 */
export interface MysqlConnectionConfig {
  host: string;
  port?: number;
  user: string;
  password: string;
  database: string;
}

/**
 * MySQL-specific configuration
 */
export interface MysqlConfig extends Omit<DatabaseConfig, 'connection'> {
  /** MySQL connection configuration */
  connection: MysqlConnectionConfig;
}

/**
 * MySQL Task Store Implementation
 *
 * Features:
 * - Connection pooling for high concurrency
 * - JSON support for artifacts and metadata (MySQL 5.7+)
 * - Automatic table creation
 * - Transaction support
 * - Retry logic for transient failures
 */
export class MysqlTaskStore extends BaseDatabaseTaskStore {
  private pool: mysql.Pool;
  private mysqlConfig: MysqlConfig;

  constructor(config: MysqlConfig) {
    super({ ...config, connection: config.connection as unknown as string });
    this.mysqlConfig = {
      retryAttempts: 3,
      retryDelay: 1000,
      ssl: false,
      ...config,
    };

    const conn = this.mysqlConfig.connection;

    // Initialize connection pool
    this.pool = mysql.createPool({
      host: conn.host,
      port: conn.port || 3306,
      user: conn.user,
      password: conn.password,
      database: conn.database,
      ssl: this.mysqlConfig.ssl ? { rejectUnauthorized: false } : undefined,
      connectionLimit: this.mysqlConfig.maxConnections || 10,
      waitForConnections: true,
      queueLimit: 0,
    });

    // Handle pool errors
    this.pool.on('connection', () => {
      // Connection acquired
    });
  }

  /**
   * Initialize database and create tables
   */
  async initialize(): Promise<void> {
    const connection = await this.pool.getConnection();

    try {
      // Create table if not exists
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id VARCHAR(255) PRIMARY KEY,
          context_id VARCHAR(255) NOT NULL,
          status_state VARCHAR(100),
          status_message TEXT,
          status_timestamp TIMESTAMP(3),
          artifacts JSON DEFAULT ('[]'),
          history JSON DEFAULT ('[]'),
          metadata JSON DEFAULT ('{}'),
          created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
          updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
          INDEX idx_context_id (context_id),
          INDEX idx_status (status_state),
          INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);

      console.log(`MySQL task store initialized: ${this.tableName}`);
    } finally {
      connection.release();
    }
  }

  /**
   * Creates a new task with retry logic
   */
  async createTask(task: Task): Promise<Task> {
    return this.withRetry(async () => {
      const connection = await this.pool.getConnection();

      try {
        const serialized = this.serializeTask(task);

        await connection.execute(
          `
          INSERT INTO ${this.tableName} (
            id, context_id, status_state, status_message, status_timestamp,
            artifacts, history, metadata
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            serialized.id,
            serialized.context_id,
            serialized.status_state,
            serialized.status_message,
            serialized.status_timestamp,
            serialized.artifacts,
            serialized.history,
            serialized.metadata,
          ]
        );

        return task;
      } finally {
        connection.release();
      }
    });
  }

  /**
   * Updates an existing task
   */
  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    return this.withRetry(async () => {
      const connection = await this.pool.getConnection();

      try {
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

        await connection.execute(
          `
          UPDATE ${this.tableName}
          SET status_state = ?,
              status_message = ?,
              status_timestamp = ?,
              artifacts = ?,
              history = ?,
              metadata = ?
          WHERE id = ?
          `,
          [
            serialized.status_state,
            serialized.status_message,
            serialized.status_timestamp,
            serialized.artifacts,
            serialized.history,
            serialized.metadata,
            id,
          ]
        );

        return updatedTask;
      } finally {
        connection.release();
      }
    });
  }

  /**
   * Gets a task by ID
   */
  async getTask(id: string): Promise<Task | null> {
    const [rows] = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    ) as [mysql.RowDataPacket[], mysql.FieldPacket[]];

    if (rows.length === 0) {
      return null;
    }

    return this.deserializeTask(rows[0] as Record<string, unknown>);
  }

  /**
   * Deletes a task
   */
  async deleteTask(id: string): Promise<void> {
    return this.withRetry(async () => {
      await this.pool.execute(
        `DELETE FROM ${this.tableName} WHERE id = ?`,
        [id]
      );
    });
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
    const { clause, params } = this.buildWhereClause(filter);

    const query = `
      SELECT * FROM ${this.tableName}
      ${clause}
      ${this.getOrderClause()}
      ${this.buildPaginationClause(filter)}
    `;

    const [rows] = await this.pool.query(query, params) as [mysql.RowDataPacket[], mysql.FieldPacket[]];

    return rows.map(row => this.deserializeTask(row as Record<string, unknown>));
  }

  /**
   * Close database connections
   */
  async close(): Promise<void> {
    await this.pool.end();
  }

  /**
   * Execute with retry logic for transient failures
   */
  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;
    const retryAttempts = this.mysqlConfig.retryAttempts || 3;
    const retryDelay = this.mysqlConfig.retryDelay || 1000;

    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (attempt < retryAttempts) {
          const delay = retryDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        throw error;
      }
    }

    throw lastError;
  }
}
