/**
 * PostgreSQL Store Adapter
 *
 * Bridges the SDK's PostgresTaskStore with the Elysia adapter's TaskStore interface.
 * Handles conversion between v0.x and v1.0 types automatically.
 */

import { Pool, PoolConfig } from 'pg';
import { v1 } from '@liquidcrypto/a2a-sdk';
import type { TaskStore, PushNotificationStore } from './elysia-adapter.js';

// ============================================================================
// PostgreSQL Task Store (v1.0 compliant)
// ============================================================================

export interface PostgresTaskStoreConfig {
  /** PostgreSQL connection string */
  connectionString: string;
  /** Pool configuration overrides */
  poolConfig?: Partial<PoolConfig>;
  /** Table name for tasks (default: 'a2a_tasks') */
  tableName?: string;
  /** Table name for push notifications (default: 'a2a_push_notifications') */
  pushNotificationsTableName?: string;
}

/**
 * PostgreSQL-backed TaskStore for production use.
 * Implements the Elysia adapter's TaskStore interface with v1.0 types.
 */
export class PostgresTaskStoreV1 implements TaskStore {
  private pool: Pool;
  private tableName: string;
  private initialized = false;

  constructor(config: PostgresTaskStoreConfig) {
    this.tableName = config.tableName ?? 'a2a_tasks';
    this.pool = new Pool({
      connectionString: config.connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ...config.poolConfig,
    });

    this.pool.on('error', (err) => {
      console.error('[PostgresTaskStoreV1] Pool error:', err);
    });
  }

  /**
   * Initialize database tables
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id VARCHAR(255) PRIMARY KEY,
          context_id VARCHAR(255) NOT NULL,
          status_state VARCHAR(100) NOT NULL,
          status_message JSONB,
          status_timestamp TIMESTAMPTZ,
          artifacts JSONB DEFAULT '[]'::jsonb,
          history JSONB DEFAULT '[]'::jsonb,
          metadata JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      // Create indexes
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_${this.tableName}_context_id
        ON ${this.tableName} (context_id)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_${this.tableName}_status_state
        ON ${this.tableName} (status_state)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_${this.tableName}_created_at
        ON ${this.tableName} (created_at DESC)
      `);

      this.initialized = true;
      console.log(`[PostgresTaskStoreV1] Initialized table: ${this.tableName}`);
    } finally {
      client.release();
    }
  }

  async get(taskId: string): Promise<v1.Task | null> {
    await this.ensureInitialized();

    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE id = $1`,
      [taskId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.deserialize(result.rows[0]);
  }

  async set(task: v1.Task): Promise<void> {
    await this.ensureInitialized();

    const serialized = this.serialize(task);

    await this.pool.query(
      `
      INSERT INTO ${this.tableName} (
        id, context_id, status_state, status_message, status_timestamp,
        artifacts, history, metadata, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        status_state = EXCLUDED.status_state,
        status_message = EXCLUDED.status_message,
        status_timestamp = EXCLUDED.status_timestamp,
        artifacts = EXCLUDED.artifacts,
        history = EXCLUDED.history,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
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
  }

  async delete(taskId: string): Promise<void> {
    await this.ensureInitialized();

    await this.pool.query(
      `DELETE FROM ${this.tableName} WHERE id = $1`,
      [taskId]
    );
  }

  async listByContext(contextId: string): Promise<v1.Task[]> {
    await this.ensureInitialized();

    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE context_id = $1 ORDER BY created_at DESC`,
      [contextId]
    );

    return result.rows.map(row => this.deserialize(row));
  }

  /**
   * List tasks with optional filtering
   */
  async list(filter?: {
    contextId?: string;
    state?: v1.TaskState[];
    limit?: number;
    offset?: number;
  }): Promise<v1.Task[]> {
    await this.ensureInitialized();

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filter?.contextId) {
      conditions.push(`context_id = $${paramIndex++}`);
      params.push(filter.contextId);
    }

    if (filter?.state && filter.state.length > 0) {
      conditions.push(`status_state = ANY($${paramIndex++})`);
      params.push(filter.state);
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const limit = filter?.limit ?? 100;
    const offset = filter?.offset ?? 0;

    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...params, limit, offset]
    );

    return result.rows.map(row => this.deserialize(row));
  }

  /**
   * Close database connections
   */
  async close(): Promise<void> {
    await this.pool.end();
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  private serialize(task: v1.Task): Record<string, unknown> {
    return {
      id: task.id,
      context_id: task.contextId,
      status_state: task.status.state,
      status_message: task.status.message ? JSON.stringify(task.status.message) : null,
      status_timestamp: task.status.timestamp ?? new Date().toISOString(),
      artifacts: JSON.stringify(task.artifacts ?? []),
      history: JSON.stringify(task.history ?? []),
      metadata: JSON.stringify(task.metadata ?? {}),
    };
  }

  private deserialize(row: Record<string, unknown>): v1.Task {
    return {
      id: row.id as string,
      contextId: row.context_id as string,
      status: {
        state: row.status_state as v1.TaskState,
        message: row.status_message
          ? (typeof row.status_message === 'string'
              ? JSON.parse(row.status_message)
              : row.status_message)
          : undefined,
        timestamp: row.status_timestamp as string | undefined,
      },
      artifacts: row.artifacts
        ? (typeof row.artifacts === 'string'
            ? JSON.parse(row.artifacts)
            : row.artifacts)
        : [],
      history: row.history
        ? (typeof row.history === 'string'
            ? JSON.parse(row.history)
            : row.history)
        : [],
      metadata: row.metadata
        ? (typeof row.metadata === 'string'
            ? JSON.parse(row.metadata)
            : row.metadata)
        : undefined,
    };
  }
}

// ============================================================================
// PostgreSQL Push Notification Store
// ============================================================================

/**
 * PostgreSQL-backed PushNotificationStore for production use.
 */
export class PostgresPushNotificationStore implements PushNotificationStore {
  private pool: Pool;
  private tableName: string;
  private initialized = false;

  constructor(config: PostgresTaskStoreConfig) {
    this.tableName = config.pushNotificationsTableName ?? 'a2a_push_notifications';
    // Reuse the same pool from the task store if possible
    this.pool = new Pool({
      connectionString: config.connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ...config.poolConfig,
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          task_id VARCHAR(255) PRIMARY KEY,
          config JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      this.initialized = true;
      console.log(`[PostgresPushNotificationStore] Initialized table: ${this.tableName}`);
    } finally {
      client.release();
    }
  }

  async get(taskId: string): Promise<v1.PushNotificationConfig | null> {
    await this.ensureInitialized();

    const result = await this.pool.query(
      `SELECT config FROM ${this.tableName} WHERE task_id = $1`,
      [taskId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const config = result.rows[0].config;
    return typeof config === 'string' ? JSON.parse(config) : config;
  }

  async set(taskId: string, config: v1.PushNotificationConfig): Promise<void> {
    await this.ensureInitialized();

    await this.pool.query(
      `
      INSERT INTO ${this.tableName} (task_id, config, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW())
      ON CONFLICT (task_id) DO UPDATE SET
        config = EXCLUDED.config,
        updated_at = NOW()
      `,
      [taskId, JSON.stringify(config)]
    );
  }

  async delete(taskId: string): Promise<void> {
    await this.ensureInitialized();

    await this.pool.query(
      `DELETE FROM ${this.tableName} WHERE task_id = $1`,
      [taskId]
    );
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create PostgreSQL stores from a connection string
 */
export function createPostgresStores(connectionString: string, options?: {
  poolConfig?: Partial<PoolConfig>;
  tasksTableName?: string;
  pushNotificationsTableName?: string;
}): {
  taskStore: PostgresTaskStoreV1;
  pushNotificationStore: PostgresPushNotificationStore;
} {
  const config: PostgresTaskStoreConfig = {
    connectionString,
    poolConfig: options?.poolConfig,
    tableName: options?.tasksTableName,
    pushNotificationsTableName: options?.pushNotificationsTableName,
  };

  return {
    taskStore: new PostgresTaskStoreV1(config),
    pushNotificationStore: new PostgresPushNotificationStore(config),
  };
}

/**
 * Create stores from DATABASE_URL environment variable
 */
export function createPostgresStoresFromEnv(options?: {
  poolConfig?: Partial<PoolConfig>;
  tasksTableName?: string;
  pushNotificationsTableName?: string;
}): {
  taskStore: PostgresTaskStoreV1;
  pushNotificationStore: PostgresPushNotificationStore;
} | null {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn('[PostgresStores] DATABASE_URL not set, falling back to in-memory stores');
    return null;
  }

  return createPostgresStores(connectionString, options);
}
