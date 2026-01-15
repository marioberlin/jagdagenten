/**
 * PostgreSQL Task Store
 *
 * PostgreSQL implementation of DatabaseTaskStore using the 'pg' driver.
 * Provides production-ready task persistence with connection pooling.
 */

import { Pool, PoolClient } from 'pg';
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
export class PostgresTaskStore extends BaseDatabaseTaskStore {
  private pool: Pool;
  private client: PoolClient | null = null;

  constructor(config: PostgresConfig) {
    super(config);
    this.config = {
      retryAttempts: 3,
      retryDelay: 1000,
      ssl: false,
      ...config,
    };

    // Initialize connection pool
    this.pool = new Pool({
      connectionString: this.config.connection,
      ssl: this.config.ssl ? { rejectUnauthorized: false } : undefined,
      max: this.config.maxConnections,
      idleTimeoutMillis: this.config.timeout,
      connectionTimeoutMillis: this.config.timeout,
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('PostgreSQL pool error:', err);
    });
  }

  /**
   * Initialize database and create tables
   */
  async initialize(): Promise<void> {
    const client = await this.pool.connect();

    try {
      // Create table if not exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id VARCHAR(255) PRIMARY KEY,
          context_id VARCHAR(255) NOT NULL,
          status_state VARCHAR(100),
          status_message TEXT,
          status_timestamp TIMESTAMPTZ,
          artifacts JSONB DEFAULT '[]'::jsonb,
          history JSONB DEFAULT '[]'::jsonb,
          metadata JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      // Create indexes for better query performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_${this.tableName}_context_id
        ON ${this.tableName} (context_id)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_${this.tableName}_status
        ON ${this.tableName} (status_state)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_${this.tableName}_created_at
        ON ${this.tableName} (created_at)
      `);

      console.log(`PostgreSQL task store initialized: ${this.tableName}`);
    } finally {
      client.release();
    }
  }

  /**
   * Creates a new task with retry logic
   */
  async createTask(task: Task): Promise<Task> {
    return this.withRetry(async () => {
      const client = await this.pool.connect();

      try {
        const serialized = this.serializeTask(task);

        await client.query(
          `
          INSERT INTO ${this.tableName} (
            id, context_id, status_state, status_message, status_timestamp,
            artifacts, history, metadata, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
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
        client.release();
      }
    });
  }

  /**
   * Updates an existing task
   */
  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    return this.withRetry(async () => {
      const client = await this.pool.connect();

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

        await client.query(
          `
          UPDATE ${this.tableName}
          SET status_state = $2,
              status_message = $3,
              status_timestamp = $4,
              artifacts = $5,
              history = $6,
              metadata = $7,
              updated_at = NOW()
          WHERE id = $1
          `,
          [
            id,
            serialized.status_state,
            serialized.status_message,
            serialized.status_timestamp,
            serialized.artifacts,
            serialized.history,
            serialized.metadata,
          ]
        );

        return updatedTask;
      } finally {
        client.release();
      }
    });
  }

  /**
   * Gets a task by ID
   */
  async getTask(id: string): Promise<Task | null> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.deserializeTask(result.rows[0]);
  }

  /**
   * Deletes a task
   */
  async deleteTask(id: string): Promise<void> {
    return this.withRetry(async () => {
      await this.pool.query(
        `DELETE FROM ${this.tableName} WHERE id = $1`,
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

    const result = await this.pool.query(query, params);

    return result.rows.map(row => this.deserializeTask(row));
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

    for (let attempt = 1; attempt <= this.config.retryAttempts!; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (attempt < this.config.retryAttempts!) {
          const delay = this.config.retryDelay! * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        throw error;
      }
    }

    throw lastError;
  }
}
