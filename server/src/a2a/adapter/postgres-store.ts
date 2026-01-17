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
  /** 
   * When true, store artifacts inline in the tasks table (legacy behavior).
   * Default: false - artifacts are stored in separate a2a_artifacts table for better scalability.
   */
  useInlineArtifacts?: boolean;
  /** Custom artifact store instance (optional - auto-created if not provided and useInlineArtifacts is false) */
  artifactStore?: ArtifactStore;
}

/**
 * PostgreSQL-backed TaskStore for production use.
 * Implements the Elysia adapter's TaskStore interface with v1.0 types.
 */
export class PostgresTaskStoreV1 implements TaskStore {
  private pool: Pool;
  private tableName: string;
  private initialized = false;
  private artifactStore?: ArtifactStore;
  private useInlineArtifacts: boolean;

  constructor(config: PostgresTaskStoreConfig) {
    this.tableName = config.tableName ?? 'a2a_tasks';
    this.useInlineArtifacts = config.useInlineArtifacts ?? false;

    // Use provided artifact store, or auto-create one if not using inline storage
    if (!this.useInlineArtifacts) {
      this.artifactStore = config.artifactStore ?? new PostgresArtifactStore(config);
    }

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

    const task = this.deserialize(result.rows[0]);

    // If using separate artifact store, load artifacts from there
    if (this.artifactStore) {
      task.artifacts = await this.artifactStore.listByTask(taskId);
    }

    return task;
  }

  async set(task: v1.Task): Promise<void> {
    await this.ensureInitialized();

    // If using separate artifact store, save artifacts there
    if (this.artifactStore && task.artifacts && task.artifacts.length > 0) {
      for (const artifact of task.artifacts) {
        await this.artifactStore.create(artifact, task.id);
      }
    }

    // Serialize task (artifacts will be empty array if using separate store)
    const serialized = this.serialize(task, !!this.artifactStore);

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

  private serialize(task: v1.Task, excludeArtifacts = false): Record<string, unknown> {
    return {
      id: task.id,
      context_id: task.contextId,
      status_state: task.status.state,
      status_message: task.status.message ? JSON.stringify(task.status.message) : null,
      status_timestamp: task.status.timestamp ?? new Date().toISOString(),
      // When using separate artifact store, don't duplicate artifacts in task table
      artifacts: JSON.stringify(excludeArtifacts ? [] : (task.artifacts ?? [])),
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
// PostgreSQL Artifact Store
// ============================================================================

export interface ArtifactStore {
  create(artifact: v1.Artifact, taskId: string, sessionId?: string): Promise<void>;
  update(artifactId: string, taskId: string, chunk: Partial<v1.Artifact>): Promise<void>;
  get(artifactId: string, taskId: string): Promise<v1.Artifact | null>;
  listByTask(taskId: string): Promise<v1.Artifact[]>;
  listBySession(sessionId: string): Promise<v1.Artifact[]>;
}

export class PostgresArtifactStore implements ArtifactStore {
  private pool: Pool;
  private tableName = 'a2a_artifacts';
  private initialized = false;

  constructor(config: PostgresTaskStoreConfig) {
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
    // Table created by SQL migration
    this.initialized = true;
    console.log(`[PostgresArtifactStore] Initialized`);
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) await this.initialize();
  }

  async create(artifact: v1.Artifact, taskId: string, sessionId?: string): Promise<void> {
    await this.ensureInitialized();

    await this.pool.query(
      `INSERT INTO ${this.tableName} (
        artifact_id, task_id, session_id, name, description, parts, metadata, extensions, is_complete
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (task_id, artifact_id) DO UPDATE SET
        parts = EXCLUDED.parts,
        metadata = EXCLUDED.metadata,
        is_complete = EXCLUDED.is_complete,
        updated_at = NOW()`,
      [
        artifact.artifactId,
        taskId,
        sessionId || null,
        artifact.name || null,
        artifact.description || null,
        JSON.stringify(artifact.parts),
        JSON.stringify(artifact.metadata || {}),
        artifact.extensions || [],
        true,
      ]
    );
  }

  async update(artifactId: string, taskId: string, chunk: Partial<v1.Artifact>): Promise<void> {
    await this.ensureInitialized();

    // For streaming: append parts and update metadata
    if (chunk.parts) {
      await this.pool.query(
        `UPDATE ${this.tableName} SET
          parts = parts || $1::jsonb,
          is_complete = $2,
          chunk_index = chunk_index + 1,
          updated_at = NOW()
        WHERE task_id = $3 AND artifact_id = $4`,
        [
          JSON.stringify(chunk.parts),
          false, // Still streaming
          taskId,
          artifactId,
        ]
      );
    }
  }

  async get(artifactId: string, taskId: string): Promise<v1.Artifact | null> {
    await this.ensureInitialized();

    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE task_id = $1 AND artifact_id = $2`,
      [taskId, artifactId]
    );

    if (result.rows.length === 0) return null;
    return this.deserialize(result.rows[0]);
  }

  async listByTask(taskId: string): Promise<v1.Artifact[]> {
    await this.ensureInitialized();

    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE task_id = $1 ORDER BY created_at ASC`,
      [taskId]
    );

    return result.rows.map(row => this.deserialize(row));
  }

  async listBySession(sessionId: string): Promise<v1.Artifact[]> {
    await this.ensureInitialized();

    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE session_id = $1 ORDER BY created_at ASC`,
      [sessionId]
    );

    return result.rows.map(row => this.deserialize(row));
  }

  private deserialize(row: Record<string, unknown>): v1.Artifact {
    return {
      artifactId: row.artifact_id as string,
      name: row.name as string | undefined,
      description: row.description as string | undefined,
      parts: typeof row.parts === 'string' ? JSON.parse(row.parts) : (row.parts as v1.Part[]),
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata as Record<string, v1.JSONValue> | undefined,
      extensions: row.extensions as string[] | undefined,
    };
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

// ============================================================================
// PostgreSQL Message Store
// ============================================================================

export interface MessageStore {
  create(message: v1.Message, taskId?: string, sessionId?: string): Promise<void>;
  listByTask(taskId: string, limit?: number): Promise<v1.Message[]>;
  listByContext(contextId: string, limit?: number): Promise<v1.Message[]>;
  listBySession(sessionId: string, limit?: number): Promise<v1.Message[]>;
}

export class PostgresMessageStore implements MessageStore {
  private pool: Pool;
  private tableName = 'a2a_messages';
  private initialized = false;
  private sequenceCounter = new Map<string, number>();

  constructor(config: PostgresTaskStoreConfig) {
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
    this.initialized = true;
    console.log(`[PostgresMessageStore] Initialized`);
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) await this.initialize();
  }

  async create(message: v1.Message, taskId?: string, sessionId?: string): Promise<void> {
    await this.ensureInitialized();

    // Track sequence number per context
    const contextKey = message.contextId || taskId || 'default';
    const seq = (this.sequenceCounter.get(contextKey) || 0) + 1;
    this.sequenceCounter.set(contextKey, seq);

    await this.pool.query(
      `INSERT INTO ${this.tableName} (
        message_id, task_id, context_id, session_id, role, parts, metadata, extensions, reference_task_ids, sequence_number
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (message_id) DO NOTHING`,
      [
        message.messageId,
        taskId || message.taskId || null,
        message.contextId || null,
        sessionId || null,
        message.role,
        JSON.stringify(message.parts),
        JSON.stringify(message.metadata || {}),
        message.extensions || [],
        message.referenceTaskIds || [],
        seq,
      ]
    );
  }

  async listByTask(taskId: string, limit = 100): Promise<v1.Message[]> {
    await this.ensureInitialized();

    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE task_id = $1 ORDER BY sequence_number ASC, created_at ASC LIMIT $2`,
      [taskId, limit]
    );

    return result.rows.map(row => this.deserialize(row));
  }

  async listByContext(contextId: string, limit = 100): Promise<v1.Message[]> {
    await this.ensureInitialized();

    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE context_id = $1 ORDER BY sequence_number ASC, created_at ASC LIMIT $2`,
      [contextId, limit]
    );

    return result.rows.map(row => this.deserialize(row));
  }

  async listBySession(sessionId: string, limit = 100): Promise<v1.Message[]> {
    await this.ensureInitialized();

    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE session_id = $1 ORDER BY sequence_number ASC, created_at ASC LIMIT $2`,
      [sessionId, limit]
    );

    return result.rows.map(row => this.deserialize(row));
  }

  private deserialize(row: Record<string, unknown>): v1.Message {
    return {
      messageId: row.message_id as string,
      role: row.role as v1.Role,
      parts: typeof row.parts === 'string' ? JSON.parse(row.parts) : (row.parts as v1.Part[]),
      contextId: row.context_id as string | undefined,
      taskId: row.task_id as string | undefined,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata as Record<string, v1.JSONValue> | undefined,
      extensions: row.extensions as string[] | undefined,
      referenceTaskIds: row.reference_task_ids as string[] | undefined,
    };
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

// ============================================================================
// PostgreSQL Session Store
// ============================================================================

export interface SessionStore {
  getOrCreate(contextId: string, agentCard?: { name?: string; version?: string }): Promise<{ id: string; isNew: boolean }>;
  updateStats(sessionId: string, delta: { tasks?: number; messages?: number; artifacts?: number; tokens?: number }): Promise<void>;
  get(sessionId: string): Promise<A2ASession | null>;
  list(userId?: string, options?: { limit?: number; status?: string }): Promise<A2ASession[]>;
  close(sessionId: string): Promise<void>;
}

export interface A2ASession {
  id: string;
  contextId: string;
  userId?: string;
  agentName?: string;
  agentVersion?: string;
  protocolVersion: string;
  status: string;
  totalTasks: number;
  totalMessages: number;
  totalArtifacts: number;
  totalTokensUsed: number;
  createdAt: Date;
  lastActivityAt: Date;
}

export class PostgresSessionStore implements SessionStore {
  private pool: Pool;
  private tableName = 'a2a_sessions';
  private initialized = false;

  constructor(config: PostgresTaskStoreConfig) {
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
    this.initialized = true;
    console.log(`[PostgresSessionStore] Initialized`);
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) await this.initialize();
  }

  async getOrCreate(
    contextId: string,
    agentCard?: { name?: string; version?: string }
  ): Promise<{ id: string; isNew: boolean }> {
    await this.ensureInitialized();

    // Try to get existing
    const existing = await this.pool.query(
      `SELECT id FROM ${this.tableName} WHERE context_id = $1`,
      [contextId]
    );

    if (existing.rows.length > 0) {
      // Update last activity
      await this.pool.query(
        `UPDATE ${this.tableName} SET last_activity_at = NOW() WHERE id = $1`,
        [existing.rows[0].id]
      );
      return { id: existing.rows[0].id, isNew: false };
    }

    // Create new
    const result = await this.pool.query(
      `INSERT INTO ${this.tableName} (context_id, agent_name, agent_version, protocol_version)
       VALUES ($1, $2, $3, '1.0')
       RETURNING id`,
      [contextId, agentCard?.name || null, agentCard?.version || null]
    );

    return { id: result.rows[0].id, isNew: true };
  }

  async updateStats(
    sessionId: string,
    delta: { tasks?: number; messages?: number; artifacts?: number; tokens?: number }
  ): Promise<void> {
    await this.ensureInitialized();

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (delta.tasks) {
      updates.push(`total_tasks = total_tasks + $${paramIndex++}`);
      values.push(delta.tasks);
    }
    if (delta.messages) {
      updates.push(`total_messages = total_messages + $${paramIndex++}`);
      values.push(delta.messages);
    }
    if (delta.artifacts) {
      updates.push(`total_artifacts = total_artifacts + $${paramIndex++}`);
      values.push(delta.artifacts);
    }
    if (delta.tokens) {
      updates.push(`total_tokens_used = total_tokens_used + $${paramIndex++}`);
      values.push(delta.tokens);
    }

    if (updates.length === 0) return;

    updates.push('last_activity_at = NOW()');
    values.push(sessionId);

    await this.pool.query(
      `UPDATE ${this.tableName} SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      values
    );
  }

  async get(sessionId: string): Promise<A2ASession | null> {
    await this.ensureInitialized();

    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE id = $1`,
      [sessionId]
    );

    if (result.rows.length === 0) return null;
    return this.deserialize(result.rows[0]);
  }

  async list(userId?: string, options?: { limit?: number; status?: string }): Promise<A2ASession[]> {
    await this.ensureInitialized();

    const conditions: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (userId) {
      conditions.push(`user_id = $${paramIndex++}`);
      values.push(userId);
    }
    if (options?.status) {
      conditions.push(`status = $${paramIndex++}`);
      values.push(options.status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = options?.limit || 50;
    values.push(limit);

    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} ${whereClause} ORDER BY last_activity_at DESC LIMIT $${paramIndex}`,
      values
    );

    return result.rows.map(row => this.deserialize(row));
  }

  async close(sessionId: string): Promise<void> {
    await this.ensureInitialized();

    await this.pool.query(
      `UPDATE ${this.tableName} SET status = 'completed', completed_at = NOW() WHERE id = $1`,
      [sessionId]
    );
  }

  private deserialize(row: Record<string, unknown>): A2ASession {
    return {
      id: row.id as string,
      contextId: row.context_id as string,
      userId: row.user_id as string | undefined,
      agentName: row.agent_name as string | undefined,
      agentVersion: row.agent_version as string | undefined,
      protocolVersion: row.protocol_version as string,
      status: row.status as string,
      totalTasks: row.total_tasks as number,
      totalMessages: row.total_messages as number,
      totalArtifacts: row.total_artifacts as number,
      totalTokensUsed: row.total_tokens_used as number,
      createdAt: new Date(row.created_at as string),
      lastActivityAt: new Date(row.last_activity_at as string),
    };
  }

  async closePool(): Promise<void> {
    await this.pool.end();
  }
}

// ============================================================================
// PostgreSQL Token Store (API Keys)
// ============================================================================

export interface ApiToken {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  createdAt: Date;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
}

export interface TokenStore {
  create(name: string, scopes: string[], expiresIn?: number | null): Promise<{ token: ApiToken; rawKey: string }>;
  validate(rawKey: string): Promise<ApiToken | null>;
  list(userId?: string): Promise<ApiToken[]>;
  revoke(tokenId: string): Promise<void>;
  updateLastUsed(tokenId: string): Promise<void>;
}

export class PostgresTokenStore implements TokenStore {
  private pool: Pool;
  private tableName = 'api_keys';
  private initialized = false;
  private userId: string; // Default user ID for anonymous tokens

  constructor(config: PostgresTaskStoreConfig, userId?: string) {
    this.userId = userId || '00000000-0000-0000-0000-000000000000';
    this.pool = new Pool({
      connectionString: config.connectionString,
      max: 5,
      idleTimeoutMillis: 30000,
      ...config.poolConfig,
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    // Ensure default user exists
    await this.pool.query(`
      INSERT INTO users (id, email, username, display_name)
      VALUES ($1, 'system@liquidcrypto.local', 'system', 'System User')
      ON CONFLICT (id) DO NOTHING
    `, [this.userId]);
    this.initialized = true;
    console.log('[PostgresTokenStore] Initialized');
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) await this.initialize();
  }

  private hashKey(rawKey: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(rawKey).digest('hex');
  }

  async create(name: string, scopes: string[], expiresInDays?: number | null): Promise<{ token: ApiToken; rawKey: string }> {
    await this.ensureInitialized();

    const crypto = require('crypto');
    const rawKey = `lc_${crypto.randomUUID().replace(/-/g, '')}`;
    const keyHash = this.hashKey(rawKey);
    const keyPrefix = rawKey.slice(0, 10);
    const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null;

    const result = await this.pool.query(`
      INSERT INTO ${this.tableName} (user_id, name, key_hash, key_prefix, scopes, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, key_prefix, scopes, created_at, expires_at, last_used_at, revoked_at
    `, [this.userId, name, keyHash, keyPrefix, scopes, expiresAt]);

    const row = result.rows[0];
    return {
      token: this.deserialize(row),
      rawKey,
    };
  }

  async validate(rawKey: string): Promise<ApiToken | null> {
    await this.ensureInitialized();

    const keyHash = this.hashKey(rawKey);
    const result = await this.pool.query(`
      SELECT * FROM ${this.tableName}
      WHERE key_hash = $1
        AND revoked_at IS NULL
        AND (expires_at IS NULL OR expires_at > NOW())
    `, [keyHash]);

    if (result.rows.length === 0) return null;
    return this.deserialize(result.rows[0]);
  }

  async list(userId?: string): Promise<ApiToken[]> {
    await this.ensureInitialized();

    const result = await this.pool.query(`
      SELECT * FROM ${this.tableName}
      WHERE user_id = $1 AND revoked_at IS NULL
      ORDER BY created_at DESC
    `, [userId || this.userId]);

    return result.rows.map(row => this.deserialize(row));
  }

  async revoke(tokenId: string): Promise<void> {
    await this.ensureInitialized();
    await this.pool.query(`
      UPDATE ${this.tableName} SET revoked_at = NOW() WHERE id = $1
    `, [tokenId]);
  }

  async updateLastUsed(tokenId: string): Promise<void> {
    await this.ensureInitialized();
    await this.pool.query(`
      UPDATE ${this.tableName} SET last_used_at = NOW() WHERE id = $1
    `, [tokenId]);
  }

  private deserialize(row: Record<string, unknown>): ApiToken {
    return {
      id: row.id as string,
      name: row.name as string,
      keyPrefix: row.key_prefix as string,
      scopes: row.scopes as string[],
      createdAt: new Date(row.created_at as string),
      expiresAt: row.expires_at ? new Date(row.expires_at as string) : null,
      lastUsedAt: row.last_used_at ? new Date(row.last_used_at as string) : null,
      revokedAt: row.revoked_at ? new Date(row.revoked_at as string) : null,
    };
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

// ============================================================================
// PostgreSQL Agent Key Store
// ============================================================================

export interface AgentKey {
  id: string;
  name: string;
  url: string;
  agentCard?: Record<string, unknown>;
  status: 'up' | 'down' | 'unknown';
  lastCheckedAt: Date | null;
  createdAt: Date;
}

export interface AgentKeyStore {
  create(name: string, url: string): Promise<AgentKey>;
  get(id: string): Promise<AgentKey | null>;
  list(): Promise<AgentKey[]>;
  updateStatus(id: string, status: 'up' | 'down' | 'unknown', agentCard?: Record<string, unknown>): Promise<void>;
  delete(id: string): Promise<void>;
}

export class PostgresAgentKeyStore implements AgentKeyStore {
  private pool: Pool;
  private tableName = 'a2a_agent_keys';
  private initialized = false;

  constructor(config: PostgresTaskStoreConfig) {
    this.pool = new Pool({
      connectionString: config.connectionString,
      max: 5,
      idleTimeoutMillis: 30000,
      ...config.poolConfig,
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    // Table is created by SQL migration
    this.initialized = true;
    console.log('[PostgresAgentKeyStore] Initialized');
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) await this.initialize();
  }

  async create(name: string, url: string): Promise<AgentKey> {
    await this.ensureInitialized();

    const result = await this.pool.query(`
      INSERT INTO ${this.tableName} (name, url)
      VALUES ($1, $2)
      RETURNING *
    `, [name, url]);

    return this.deserialize(result.rows[0]);
  }

  async get(id: string): Promise<AgentKey | null> {
    await this.ensureInitialized();

    const result = await this.pool.query(`
      SELECT * FROM ${this.tableName} WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) return null;
    return this.deserialize(result.rows[0]);
  }

  async list(): Promise<AgentKey[]> {
    await this.ensureInitialized();

    const result = await this.pool.query(`
      SELECT * FROM ${this.tableName} ORDER BY created_at DESC
    `);

    return result.rows.map(row => this.deserialize(row));
  }

  async updateStatus(id: string, status: 'up' | 'down' | 'unknown', agentCard?: Record<string, unknown>): Promise<void> {
    await this.ensureInitialized();

    await this.pool.query(`
      UPDATE ${this.tableName} 
      SET status = $1, last_checked_at = NOW(), agent_card = COALESCE($2, agent_card)
      WHERE id = $3
    `, [status, agentCard ? JSON.stringify(agentCard) : null, id]);
  }

  async delete(id: string): Promise<void> {
    await this.ensureInitialized();
    await this.pool.query(`DELETE FROM ${this.tableName} WHERE id = $1`, [id]);
  }

  private deserialize(row: Record<string, unknown>): AgentKey {
    return {
      id: row.id as string,
      name: row.name as string,
      url: row.url as string,
      agentCard: row.agent_card as Record<string, unknown> | undefined,
      status: row.status as 'up' | 'down' | 'unknown',
      lastCheckedAt: row.last_checked_at ? new Date(row.last_checked_at as string) : null,
      createdAt: new Date(row.created_at as string),
    };
  }

  async close(): Promise<void> {
    await this.pool.end();
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
  artifactStore: PostgresArtifactStore;
  messageStore: PostgresMessageStore;
  sessionStore: PostgresSessionStore;
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
    artifactStore: new PostgresArtifactStore(config),
    messageStore: new PostgresMessageStore(config),
    sessionStore: new PostgresSessionStore(config),
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
  artifactStore: PostgresArtifactStore;
  messageStore: PostgresMessageStore;
  sessionStore: PostgresSessionStore;
} | null {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn('[PostgresStores] DATABASE_URL not set, falling back to in-memory stores');
    return null;
  }

  return createPostgresStores(connectionString, options);
}

