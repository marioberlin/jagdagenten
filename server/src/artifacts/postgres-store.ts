/**
 * PostgreSQL Artifact Store
 *
 * Implements the ArtifactRegistry interface with PostgreSQL storage,
 * full-text search, versioning, and reference tracking.
 */

import { Pool } from 'pg';
import { v1 } from '@jagdagenten/a2a-sdk';
import type {
  ArtifactRegistry,
  ArtifactRegistryConfig,
  StoredArtifact,
  ArtifactFilters,
  ArtifactSearchResult,
  ArtifactVersion,
  ArtifactReference,
  ArtifactTemplate,
  ArtifactCategory,
  ArtifactStats,
  ReferenceType,
  ArtifactEvent,
  ArtifactEventListener,
} from './types.js';

// ============================================================================
// PostgreSQL Artifact Store
// ============================================================================

export class PostgresArtifactStore implements ArtifactRegistry {
  private pool: Pool;
  private tablePrefix: string;
  private maxPartsPerArtifact: number;
  private maxVersions: number;
  private enableVersioning: boolean;
  private enableSearch: boolean;
  private initialized = false;
  private eventListeners: ArtifactEventListener[] = [];

  constructor(config: ArtifactRegistryConfig) {
    this.tablePrefix = config.tablePrefix ?? 'artifacts';
    this.maxPartsPerArtifact = config.maxPartsPerArtifact ?? 1000;
    this.maxVersions = config.maxVersions ?? 50;
    this.enableVersioning = config.enableVersioning ?? true;
    this.enableSearch = config.enableSearch ?? true;

    this.pool = new Pool({
      connectionString: config.connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    this.pool.on('error', (err) => {
      console.error('[PostgresArtifactStore] Pool error:', err);
    });
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const client = await this.pool.connect();
    try {
      // Main artifacts table
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${this.tablePrefix} (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          task_id VARCHAR(255) NOT NULL,
          context_id VARCHAR(255) NOT NULL,
          artifact_id VARCHAR(255) NOT NULL,
          name VARCHAR(512),
          description TEXT,
          parts JSONB NOT NULL DEFAULT '[]',
          parts_count INT GENERATED ALWAYS AS (jsonb_array_length(parts)) STORED,
          metadata JSONB DEFAULT '{}',
          extensions TEXT[] DEFAULT '{}',
          is_streaming BOOLEAN DEFAULT FALSE,
          is_complete BOOLEAN DEFAULT TRUE,
          chunk_index INT DEFAULT 0,
          version INT DEFAULT 1,
          parent_id UUID REFERENCES ${this.tablePrefix}(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          search_vector TSVECTOR GENERATED ALWAYS AS (
            to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, ''))
          ) STORED,
          CONSTRAINT unique_artifact_version UNIQUE (task_id, artifact_id, version)
        )
      `);

      // References table
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${this.tablePrefix}_references (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          source_task_id VARCHAR(255) NOT NULL,
          target_artifact_id UUID NOT NULL REFERENCES ${this.tablePrefix}(id) ON DELETE CASCADE,
          reference_type VARCHAR(50) NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      // Templates table
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${this.tablePrefix}_templates (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          category VARCHAR(100) NOT NULL,
          template JSONB NOT NULL,
          schema JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      // Version history table
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${this.tablePrefix}_versions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          artifact_id UUID NOT NULL REFERENCES ${this.tablePrefix}(id) ON DELETE CASCADE,
          version INT NOT NULL,
          parts JSONB NOT NULL,
          change_description TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      // Create indices
      await client.query(`CREATE INDEX IF NOT EXISTS idx_${this.tablePrefix}_task ON ${this.tablePrefix}(task_id)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_${this.tablePrefix}_context ON ${this.tablePrefix}(context_id)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_${this.tablePrefix}_artifact_id ON ${this.tablePrefix}(artifact_id)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_${this.tablePrefix}_created ON ${this.tablePrefix}(created_at DESC)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_${this.tablePrefix}_streaming ON ${this.tablePrefix}(is_streaming, is_complete)`);

      if (this.enableSearch) {
        await client.query(`CREATE INDEX IF NOT EXISTS idx_${this.tablePrefix}_search ON ${this.tablePrefix} USING gin(search_vector)`);
      }

      await client.query(`CREATE INDEX IF NOT EXISTS idx_${this.tablePrefix}_extensions ON ${this.tablePrefix} USING gin(extensions)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_${this.tablePrefix}_refs_source ON ${this.tablePrefix}_references(source_task_id)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_${this.tablePrefix}_refs_target ON ${this.tablePrefix}_references(target_artifact_id)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_${this.tablePrefix}_versions_artifact ON ${this.tablePrefix}_versions(artifact_id)`);

      this.initialized = true;
      console.log(`[PostgresArtifactStore] Initialized tables with prefix: ${this.tablePrefix}`);
    } finally {
      client.release();
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  // ============================================================================
  // Event System
  // ============================================================================

  addEventListener(listener: ArtifactEventListener): void {
    this.eventListeners.push(listener);
  }

  removeEventListener(listener: ArtifactEventListener): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  private emit(event: ArtifactEvent): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('[PostgresArtifactStore] Event listener error:', err);
      }
    }
  }

  // ============================================================================
  // CRUD Operations
  // ============================================================================

  async create(artifact: v1.Artifact, taskId: string, contextId: string): Promise<StoredArtifact> {
    await this.ensureInitialized();

    const result = await this.pool.query(
      `
      INSERT INTO ${this.tablePrefix} (
        task_id, context_id, artifact_id, name, description,
        parts, metadata, extensions, is_streaming, is_complete
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
      `,
      [
        taskId,
        contextId,
        artifact.artifactId,
        artifact.name ?? null,
        artifact.description ?? null,
        JSON.stringify(artifact.parts),
        JSON.stringify(artifact.metadata ?? {}),
        artifact.extensions ?? [],
        false,
        true,
      ]
    );

    const stored = this.deserialize(result.rows[0]);
    this.emit({ type: 'created', artifact: stored });
    return stored;
  }

  async get(id: string): Promise<StoredArtifact | null> {
    await this.ensureInitialized();

    const result = await this.pool.query(
      `SELECT * FROM ${this.tablePrefix} WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.deserialize(result.rows[0]);
  }

  async getByArtifactId(taskId: string, artifactId: string): Promise<StoredArtifact | null> {
    await this.ensureInitialized();

    const result = await this.pool.query(
      `SELECT * FROM ${this.tablePrefix} WHERE task_id = $1 AND artifact_id = $2 ORDER BY version DESC LIMIT 1`,
      [taskId, artifactId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.deserialize(result.rows[0]);
  }

  async update(id: string, updates: Partial<Pick<v1.Artifact, 'parts' | 'name' | 'description' | 'metadata'>>): Promise<StoredArtifact> {
    await this.ensureInitialized();

    const setClauses: string[] = ['updated_at = NOW()'];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (updates.parts !== undefined) {
      setClauses.push(`parts = $${paramIndex++}`);
      params.push(JSON.stringify(updates.parts));
    }
    if (updates.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`);
      params.push(updates.name);
    }
    if (updates.description !== undefined) {
      setClauses.push(`description = $${paramIndex++}`);
      params.push(updates.description);
    }
    if (updates.metadata !== undefined) {
      setClauses.push(`metadata = $${paramIndex++}`);
      params.push(JSON.stringify(updates.metadata));
    }

    params.push(id);

    const result = await this.pool.query(
      `UPDATE ${this.tablePrefix} SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      throw new Error(`Artifact not found: ${id}`);
    }

    const stored = this.deserialize(result.rows[0]);
    this.emit({ type: 'updated', artifact: stored });
    return stored;
  }

  async delete(id: string): Promise<void> {
    await this.ensureInitialized();

    await this.pool.query(
      `DELETE FROM ${this.tablePrefix} WHERE id = $1`,
      [id]
    );

    this.emit({ type: 'deleted', id });
  }

  // ============================================================================
  // Streaming Support
  // ============================================================================

  async startStream(artifact: v1.Artifact, taskId: string, contextId: string): Promise<string> {
    await this.ensureInitialized();

    const result = await this.pool.query(
      `
      INSERT INTO ${this.tablePrefix} (
        task_id, context_id, artifact_id, name, description,
        parts, metadata, extensions, is_streaming, is_complete, chunk_index
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
      `,
      [
        taskId,
        contextId,
        artifact.artifactId,
        artifact.name ?? null,
        artifact.description ?? null,
        JSON.stringify(artifact.parts),
        JSON.stringify(artifact.metadata ?? {}),
        artifact.extensions ?? [],
        true,
        false,
        0,
      ]
    );

    const id = result.rows[0].id;
    this.emit({ type: 'stream_started', id });
    return id;
  }

  async appendChunk(id: string, parts: v1.Part[], isLast: boolean): Promise<void> {
    await this.ensureInitialized();

    // Check parts limit
    const countResult = await this.pool.query(
      `SELECT parts_count FROM ${this.tablePrefix} WHERE id = $1`,
      [id]
    );

    if (countResult.rows.length === 0) {
      throw new Error(`Artifact not found: ${id}`);
    }

    const currentCount = countResult.rows[0].parts_count as number;
    if (currentCount + parts.length > this.maxPartsPerArtifact) {
      throw new Error(`Artifact parts limit exceeded (max: ${this.maxPartsPerArtifact})`);
    }

    await this.pool.query(
      `
      UPDATE ${this.tablePrefix}
      SET parts = parts || $1::jsonb,
          chunk_index = chunk_index + 1,
          is_complete = $2,
          is_streaming = NOT $2,
          updated_at = NOW()
      WHERE id = $3
      `,
      [JSON.stringify(parts), isLast, id]
    );

    const chunkResult = await this.pool.query(
      `SELECT chunk_index FROM ${this.tablePrefix} WHERE id = $1`,
      [id]
    );

    this.emit({ type: 'stream_chunk', id, chunkIndex: chunkResult.rows[0]?.chunk_index ?? 0 });
  }

  async finalizeStream(id: string): Promise<StoredArtifact> {
    await this.ensureInitialized();

    const result = await this.pool.query(
      `
      UPDATE ${this.tablePrefix}
      SET is_streaming = FALSE, is_complete = TRUE, updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      throw new Error(`Artifact not found: ${id}`);
    }

    const stored = this.deserialize(result.rows[0]);
    this.emit({ type: 'stream_completed', artifact: stored });
    return stored;
  }

  // ============================================================================
  // Search & Query
  // ============================================================================

  async search(query: string, filters?: ArtifactFilters): Promise<ArtifactSearchResult[]> {
    await this.ensureInitialized();

    if (!this.enableSearch) {
      // Fallback to simple ILIKE search
      const likePattern = `%${query}%`;
      const result = await this.pool.query(
        `
        SELECT *, 1.0 as score
        FROM ${this.tablePrefix}
        WHERE (name ILIKE $1 OR description ILIKE $1)
          AND is_complete = TRUE
        ORDER BY created_at DESC
        LIMIT $2
        `,
        [likePattern, filters?.limit ?? 50]
      );

      return result.rows.map(row => ({
        artifact: this.deserialize(row),
        score: 1.0,
      }));
    }

    // Full-text search with ts_rank
    const conditions: string[] = ['search_vector @@ plainto_tsquery(\'english\', $1)'];
    const params: unknown[] = [query];
    let paramIndex = 2;

    if (filters?.taskId) {
      conditions.push(`task_id = $${paramIndex++}`);
      params.push(filters.taskId);
    }
    if (filters?.contextId) {
      conditions.push(`context_id = $${paramIndex++}`);
      params.push(filters.contextId);
    }
    if (filters?.isComplete !== undefined) {
      conditions.push(`is_complete = $${paramIndex++}`);
      params.push(filters.isComplete);
    }

    const limit = filters?.limit ?? 50;
    params.push(limit);

    const result = await this.pool.query(
      `
      SELECT *,
        ts_rank(search_vector, plainto_tsquery('english', $1)) as score,
        ts_headline('english', COALESCE(name, ''), plainto_tsquery('english', $1)) as name_highlight,
        ts_headline('english', COALESCE(description, ''), plainto_tsquery('english', $1)) as desc_highlight
      FROM ${this.tablePrefix}
      WHERE ${conditions.join(' AND ')}
      ORDER BY score DESC
      LIMIT $${paramIndex}
      `,
      params
    );

    return result.rows.map(row => ({
      artifact: this.deserialize(row),
      score: row.score as number,
      highlights: {
        name: row.name_highlight as string | undefined,
        description: row.desc_highlight as string | undefined,
      },
    }));
  }

  async list(filters?: ArtifactFilters): Promise<StoredArtifact[]> {
    await this.ensureInitialized();

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters?.taskId) {
      conditions.push(`task_id = $${paramIndex++}`);
      params.push(filters.taskId);
    }
    if (filters?.contextId) {
      conditions.push(`context_id = $${paramIndex++}`);
      params.push(filters.contextId);
    }
    if (filters?.name) {
      conditions.push(`name ILIKE $${paramIndex++}`);
      params.push(`%${filters.name}%`);
    }
    if (filters?.extensions && filters.extensions.length > 0) {
      conditions.push(`extensions && $${paramIndex++}`);
      params.push(filters.extensions);
    }
    if (filters?.isComplete !== undefined) {
      conditions.push(`is_complete = $${paramIndex++}`);
      params.push(filters.isComplete);
    }
    if (filters?.isStreaming !== undefined) {
      conditions.push(`is_streaming = $${paramIndex++}`);
      params.push(filters.isStreaming);
    }
    if (filters?.createdAfter) {
      conditions.push(`created_at >= $${paramIndex++}`);
      params.push(filters.createdAfter.toISOString());
    }
    if (filters?.createdBefore) {
      conditions.push(`created_at <= $${paramIndex++}`);
      params.push(filters.createdBefore.toISOString());
    }
    if (filters?.category) {
      conditions.push(`metadata->>'category' = $${paramIndex++}`);
      params.push(filters.category);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderBy = filters?.orderBy ?? 'createdAt';
    const orderDir = filters?.orderDir ?? 'desc';
    const orderColumn = orderBy === 'createdAt' ? 'created_at' : orderBy === 'updatedAt' ? 'updated_at' : 'name';
    const limit = filters?.limit ?? 100;
    const offset = filters?.offset ?? 0;

    params.push(limit, offset);

    const result = await this.pool.query(
      `SELECT * FROM ${this.tablePrefix} ${whereClause} ORDER BY ${orderColumn} ${orderDir.toUpperCase()} LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      params
    );

    return result.rows.map(row => this.deserialize(row));
  }

  async listByTask(taskId: string): Promise<StoredArtifact[]> {
    return this.list({ taskId });
  }

  async listByContext(contextId: string, limit = 50): Promise<StoredArtifact[]> {
    return this.list({ contextId, limit });
  }

  async getRecent(limit = 20): Promise<StoredArtifact[]> {
    return this.list({ limit, orderBy: 'createdAt', orderDir: 'desc', isComplete: true });
  }

  // ============================================================================
  // Versioning
  // ============================================================================

  async getHistory(id: string): Promise<ArtifactVersion[]> {
    await this.ensureInitialized();

    const result = await this.pool.query(
      `SELECT * FROM ${this.tablePrefix}_versions WHERE artifact_id = $1 ORDER BY version DESC`,
      [id]
    );

    return result.rows.map(row => ({
      id: row.id as string,
      artifactId: row.artifact_id as string,
      version: row.version as number,
      parts: typeof row.parts === 'string' ? JSON.parse(row.parts) : row.parts,
      createdAt: new Date(row.created_at as string),
      changeDescription: row.change_description as string | undefined,
    }));
  }

  async createVersion(parentId: string, artifact: v1.Artifact): Promise<StoredArtifact> {
    await this.ensureInitialized();

    const parent = await this.get(parentId);
    if (!parent) {
      throw new Error(`Parent artifact not found: ${parentId}`);
    }

    // Save current version to history
    if (this.enableVersioning) {
      await this.pool.query(
        `
        INSERT INTO ${this.tablePrefix}_versions (artifact_id, version, parts, change_description)
        VALUES ($1, $2, $3, $4)
        `,
        [parentId, parent.version, JSON.stringify(parent.parts), 'Version before update']
      );

      // Clean up old versions
      await this.pool.query(
        `
        DELETE FROM ${this.tablePrefix}_versions
        WHERE artifact_id = $1
          AND version NOT IN (
            SELECT version FROM ${this.tablePrefix}_versions
            WHERE artifact_id = $1
            ORDER BY version DESC
            LIMIT $2
          )
        `,
        [parentId, this.maxVersions]
      );
    }

    // Create new version
    const result = await this.pool.query(
      `
      INSERT INTO ${this.tablePrefix} (
        task_id, context_id, artifact_id, name, description,
        parts, metadata, extensions, parent_id, version
      )
      SELECT
        task_id, context_id, artifact_id, $1, $2,
        $3, $4, $5, $6, version + 1
      FROM ${this.tablePrefix}
      WHERE id = $6
      RETURNING *
      `,
      [
        artifact.name ?? parent.name,
        artifact.description ?? parent.description,
        JSON.stringify(artifact.parts),
        JSON.stringify(artifact.metadata ?? parent.metadata ?? {}),
        artifact.extensions ?? parent.extensions ?? [],
        parentId,
      ]
    );

    return this.deserialize(result.rows[0]);
  }

  async revertToVersion(id: string, version: number): Promise<StoredArtifact> {
    await this.ensureInitialized();

    const versionResult = await this.pool.query(
      `SELECT * FROM ${this.tablePrefix}_versions WHERE artifact_id = $1 AND version = $2`,
      [id, version]
    );

    if (versionResult.rows.length === 0) {
      throw new Error(`Version ${version} not found for artifact: ${id}`);
    }

    const versionData = versionResult.rows[0];
    const parts = typeof versionData.parts === 'string' ? JSON.parse(versionData.parts) : versionData.parts;

    return this.update(id, { parts });
  }

  // ============================================================================
  // References
  // ============================================================================

  async addReference(sourceTaskId: string, targetArtifactId: string, type: ReferenceType): Promise<ArtifactReference> {
    await this.ensureInitialized();

    const result = await this.pool.query(
      `
      INSERT INTO ${this.tablePrefix}_references (source_task_id, target_artifact_id, reference_type)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [sourceTaskId, targetArtifactId, type]
    );

    const row = result.rows[0];
    return {
      id: row.id as string,
      sourceTaskId: row.source_task_id as string,
      targetArtifactId: row.target_artifact_id as string,
      referenceType: row.reference_type as ReferenceType,
      createdAt: new Date(row.created_at as string),
    };
  }

  async getReferences(artifactId: string): Promise<ArtifactReference[]> {
    await this.ensureInitialized();

    const result = await this.pool.query(
      `SELECT * FROM ${this.tablePrefix}_references WHERE target_artifact_id = $1`,
      [artifactId]
    );

    return result.rows.map(row => ({
      id: row.id as string,
      sourceTaskId: row.source_task_id as string,
      targetArtifactId: row.target_artifact_id as string,
      referenceType: row.reference_type as ReferenceType,
      createdAt: new Date(row.created_at as string),
    }));
  }

  async getReferencedBy(artifactId: string): Promise<ArtifactReference[]> {
    await this.ensureInitialized();

    // Get the artifact's task ID first
    const artifact = await this.get(artifactId);
    if (!artifact) {
      return [];
    }

    const result = await this.pool.query(
      `SELECT * FROM ${this.tablePrefix}_references WHERE source_task_id = $1`,
      [artifact.taskId]
    );

    return result.rows.map(row => ({
      id: row.id as string,
      sourceTaskId: row.source_task_id as string,
      targetArtifactId: row.target_artifact_id as string,
      referenceType: row.reference_type as ReferenceType,
      createdAt: new Date(row.created_at as string),
    }));
  }

  // ============================================================================
  // Templates
  // ============================================================================

  async createFromTemplate(templateId: string, data: Record<string, unknown>, taskId: string, contextId: string): Promise<StoredArtifact> {
    await this.ensureInitialized();

    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Process template with data substitution
    const processedParts = this.processTemplateParts(template.template.parts, data);

    const artifact: v1.Artifact = {
      artifactId: `${template.name}-${Date.now()}`,
      name: template.name,
      description: template.description,
      parts: processedParts,
      metadata: {
        ...template.template.metadata,
        templateId,
        category: template.category,
      },
    };

    return this.create(artifact, taskId, contextId);
  }

  private processTemplateParts(parts: unknown[], data: Record<string, unknown>): v1.Part[] {
    return parts.map(part => {
      const p = part as Record<string, unknown>;
      if (p.text !== undefined && typeof p.text === 'string') {
        return { text: this.interpolate(p.text, data) };
      }
      if (p.type === 'data' && typeof p.data === 'object' && p.data !== null) {
        const processedData: Record<string, v1.JSONValue> = {};
        for (const [key, value] of Object.entries(p.data as Record<string, string>)) {
          const resolved = this.interpolate(value, data);
          processedData[key] = resolved;
        }
        return { data: processedData };
      }
      // Return as-is for other types
      return part as v1.Part;
    });
  }

  private interpolate(template: string, data: Record<string, unknown>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const value = data[key];
      return value !== undefined ? String(value) : `{{${key}}}`;
    });
  }

  async listTemplates(category?: ArtifactCategory): Promise<ArtifactTemplate[]> {
    await this.ensureInitialized();

    let query = `SELECT * FROM ${this.tablePrefix}_templates`;
    const params: unknown[] = [];

    if (category) {
      query += ' WHERE category = $1';
      params.push(category);
    }

    query += ' ORDER BY name';

    const result = await this.pool.query(query, params);

    return result.rows.map(row => ({
      id: row.id as string,
      name: row.name as string,
      description: row.description as string | undefined,
      category: row.category as ArtifactCategory,
      template: typeof row.template === 'string' ? JSON.parse(row.template) : row.template,
      schema: row.schema ? (typeof row.schema === 'string' ? JSON.parse(row.schema) : row.schema) : undefined,
      createdAt: new Date(row.created_at as string),
    }));
  }

  async getTemplate(id: string): Promise<ArtifactTemplate | null> {
    await this.ensureInitialized();

    const result = await this.pool.query(
      `SELECT * FROM ${this.tablePrefix}_templates WHERE id = $1 OR name = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id as string,
      name: row.name as string,
      description: row.description as string | undefined,
      category: row.category as ArtifactCategory,
      template: typeof row.template === 'string' ? JSON.parse(row.template) : row.template,
      schema: row.schema ? (typeof row.schema === 'string' ? JSON.parse(row.schema) : row.schema) : undefined,
      createdAt: new Date(row.created_at as string),
    };
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  async deleteByTask(taskId: string): Promise<number> {
    await this.ensureInitialized();

    const result = await this.pool.query(
      `DELETE FROM ${this.tablePrefix} WHERE task_id = $1`,
      [taskId]
    );

    return result.rowCount ?? 0;
  }

  async deleteByContext(contextId: string): Promise<number> {
    await this.ensureInitialized();

    const result = await this.pool.query(
      `DELETE FROM ${this.tablePrefix} WHERE context_id = $1`,
      [contextId]
    );

    return result.rowCount ?? 0;
  }

  // ============================================================================
  // Statistics
  // ============================================================================

  async getStats(): Promise<ArtifactStats> {
    await this.ensureInitialized();

    const result = await this.pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_complete = TRUE) as complete,
        COUNT(*) FILTER (WHERE is_streaming = TRUE) as streaming,
        MIN(created_at) as oldest,
        MAX(created_at) as newest
      FROM ${this.tablePrefix}
    `);

    const categoryResult = await this.pool.query(`
      SELECT metadata->>'category' as category, COUNT(*) as count
      FROM ${this.tablePrefix}
      WHERE metadata->>'category' IS NOT NULL
      GROUP BY metadata->>'category'
    `);

    const byCategory: Record<ArtifactCategory, number> = {
      trading: 0,
      analysis: 0,
      report: 0,
      chart: 0,
      portfolio: 0,
      alert: 0,
      custom: 0,
    };

    for (const row of categoryResult.rows) {
      const cat = row.category as ArtifactCategory;
      if (cat in byCategory) {
        byCategory[cat] = Number(row.count);
      }
    }

    const row = result.rows[0];
    return {
      totalCount: Number(row.total),
      completeCount: Number(row.complete),
      streamingCount: Number(row.streaming),
      byCategory,
      oldestAt: row.oldest ? new Date(row.oldest as string) : undefined,
      newestAt: row.newest ? new Date(row.newest as string) : undefined,
    };
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  private deserialize(row: Record<string, unknown>): StoredArtifact {
    return {
      id: row.id as string,
      taskId: row.task_id as string,
      contextId: row.context_id as string,
      artifactId: row.artifact_id as string,
      name: row.name as string | undefined,
      description: row.description as string | undefined,
      parts: typeof row.parts === 'string' ? JSON.parse(row.parts) : row.parts,
      metadata: row.metadata
        ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata)
        : undefined,
      extensions: row.extensions as string[] | undefined,
      version: row.version as number,
      isStreaming: row.is_streaming as boolean,
      isComplete: row.is_complete as boolean,
      parentId: row.parent_id as string | undefined,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

export function createArtifactStore(connectionString: string, options?: Partial<ArtifactRegistryConfig>): PostgresArtifactStore {
  return new PostgresArtifactStore({
    connectionString,
    ...options,
  });
}

export function createArtifactStoreFromEnv(options?: Partial<ArtifactRegistryConfig>): PostgresArtifactStore | null {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn('[ArtifactStore] DATABASE_URL not set');
    return null;
  }

  return createArtifactStore(connectionString, options);
}
