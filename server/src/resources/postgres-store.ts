/**
 * PostgreSQL Resource Store
 *
 * Implements the ResourceStore interface with PostgreSQL storage,
 * full-text search, versioning, sharing, and dependency tracking.
 * Uses the shared database pool from db.ts.
 */

import { query } from '../db.js';
import type {
  ResourceStore,
  AIResource,
  ResourceType,
  OwnerType,
  SharePermission,
  DependencyType,
  TypeMetadata,
  ResourceFilters,
  ResourceSearchResult,
  ResourceShare,
  ResourceVersion,
  ResourceDependency,
  ResourceEvent,
  ResourceEventListener,
} from './types.js';

// ============================================================================
// Helper: Row → AIResource mapping
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToResource(row: Record<string, any>): AIResource {
  return {
    id: row.id,
    resourceType: row.resource_type,
    ownerType: row.owner_type,
    ownerId: row.owner_id || undefined,
    name: row.name,
    description: row.description || undefined,
    content: row.content || undefined,
    parts: row.parts || [],
    typeMetadata: row.type_metadata || {},
    version: row.version,
    parentId: row.parent_id || undefined,
    isActive: row.is_active,
    isPinned: row.is_pinned,
    tags: row.tags || [],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    accessedAt: new Date(row.accessed_at),
    provenance: row.provenance || 'user_input',
    usageFrequency: row.usage_frequency || 0,
    syncToFile: row.sync_to_file || false,
  };
}

// ============================================================================
// PostgreSQL Resource Store
// ============================================================================

export class PostgresResourceStore implements ResourceStore {
  private eventListeners: ResourceEventListener[] = [];

  constructor() {}

  // --------------------------------------------------------------------------
  // Event system
  // --------------------------------------------------------------------------

  addEventListener(listener: ResourceEventListener): () => void {
    this.eventListeners.push(listener);
    return () => {
      this.eventListeners = this.eventListeners.filter(l => l !== listener);
    };
  }

  private emit(event: ResourceEvent): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('[ResourceStore] Event listener error:', err);
      }
    }
  }

  // --------------------------------------------------------------------------
  // CRUD Operations
  // --------------------------------------------------------------------------

  async create(resource: Omit<AIResource, 'id' | 'createdAt' | 'updatedAt' | 'accessedAt'>): Promise<AIResource> {
    const result = await query(
      `INSERT INTO ai_resources (
        resource_type, owner_type, owner_id, name, description, content,
        parts, type_metadata, version, parent_id, is_active, is_pinned,
        tags, provenance, usage_frequency, sync_to_file
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        resource.resourceType,
        resource.ownerType,
        resource.ownerId || null,
        resource.name,
        resource.description || null,
        resource.content || null,
        JSON.stringify(resource.parts),
        JSON.stringify(resource.typeMetadata),
        resource.version || 1,
        resource.parentId || null,
        resource.isActive !== false,
        resource.isPinned || false,
        resource.tags || [],
        resource.provenance || 'user_input',
        resource.usageFrequency || 0,
        resource.syncToFile || false,
      ]
    );

    const created = rowToResource(result.rows[0]);
    this.emit({ type: 'created', resource: created });
    return created;
  }

  async get(id: string): Promise<AIResource | null> {
    const result = await query('SELECT * FROM ai_resources WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    return rowToResource(result.rows[0]);
  }

  async update(
    id: string,
    updates: Partial<Pick<AIResource, 'name' | 'description' | 'content' | 'parts' | 'typeMetadata' | 'tags' | 'isPinned' | 'syncToFile'>>
  ): Promise<AIResource> {
    // First, save current state to version history
    const current = await this.get(id);
    if (!current) throw new Error(`Resource ${id} not found`);

    await this.saveVersion(current);

    // Build dynamic UPDATE query
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      setClauses.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }
    if (updates.content !== undefined) {
      setClauses.push(`content = $${paramIndex++}`);
      values.push(updates.content);
    }
    if (updates.parts !== undefined) {
      setClauses.push(`parts = $${paramIndex++}`);
      values.push(JSON.stringify(updates.parts));
    }
    if (updates.typeMetadata !== undefined) {
      setClauses.push(`type_metadata = $${paramIndex++}`);
      values.push(JSON.stringify(updates.typeMetadata));
    }
    if (updates.tags !== undefined) {
      setClauses.push(`tags = $${paramIndex++}`);
      values.push(updates.tags);
    }
    if (updates.isPinned !== undefined) {
      setClauses.push(`is_pinned = $${paramIndex++}`);
      values.push(updates.isPinned);
    }
    if (updates.syncToFile !== undefined) {
      setClauses.push(`sync_to_file = $${paramIndex++}`);
      values.push(updates.syncToFile);
    }

    // Always increment version
    setClauses.push(`version = version + 1`);

    if (setClauses.length === 1) {
      // Only version increment, nothing else to update
      return current;
    }

    values.push(id);
    const result = await query(
      `UPDATE ai_resources SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    const updated = rowToResource(result.rows[0]);
    this.emit({ type: 'updated', resource: updated, previousVersion: current.version });
    return updated;
  }

  async delete(id: string): Promise<void> {
    await query('DELETE FROM ai_resources WHERE id = $1', [id]);
    this.emit({ type: 'deleted', id });
  }

  async softDelete(id: string): Promise<void> {
    await query('UPDATE ai_resources SET is_active = FALSE WHERE id = $1', [id]);
    this.emit({ type: 'archived', id });
  }

  // --------------------------------------------------------------------------
  // Query Operations
  // --------------------------------------------------------------------------

  async list(filters?: ResourceFilters): Promise<AIResource[]> {
    const { where, values } = this.buildWhereClause(filters);
    const orderBy = this.buildOrderClause(filters);
    const limit = filters?.limit || 100;
    const offset = filters?.offset || 0;

    const result = await query(
      `SELECT * FROM ai_resources ${where} ${orderBy} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    );

    return result.rows.map(rowToResource);
  }

  async search(searchQuery: string, filters?: ResourceFilters): Promise<ResourceSearchResult[]> {
    const { where, values } = this.buildWhereClause(filters);
    const searchParam = values.length + 1;

    const result = await query(
      `SELECT *,
        ts_rank(search_vector, plainto_tsquery('english', $${searchParam})) as rank
      FROM ai_resources
      ${where} ${where ? 'AND' : 'WHERE'} search_vector @@ plainto_tsquery('english', $${searchParam})
      ORDER BY rank DESC
      LIMIT $${searchParam + 1}`,
      [...values, searchQuery, filters?.limit || 50]
    );

    return result.rows.map((row: Record<string, any>) => ({
      resource: rowToResource(row),
      score: parseFloat(row.rank) || 0,
    }));
  }

  async getByTarget(ownerType: OwnerType, ownerId: string, resourceType?: ResourceType): Promise<AIResource[]> {
    let sql = 'SELECT * FROM ai_resources WHERE owner_type = $1 AND owner_id = $2 AND is_active = TRUE';
    const params: any[] = [ownerType, ownerId];

    if (resourceType) {
      sql += ' AND resource_type = $3';
      params.push(resourceType);
    }

    sql += ' ORDER BY is_pinned DESC, accessed_at DESC';
    const result = await query(sql, params);
    return result.rows.map(rowToResource);
  }

  async getResourcesForTarget(ownerType: OwnerType, ownerId: string): Promise<AIResource[]> {
    // Fetch both owned resources AND shared resources
    const result = await query(
      `SELECT r.* FROM ai_resources r
      WHERE r.is_active = TRUE AND (
        (r.owner_type = $1 AND r.owner_id = $2)
        OR EXISTS (
          SELECT 1 FROM ai_resource_shares s
          WHERE s.resource_id = r.id
            AND s.target_type = $1
            AND s.target_id = $2
        )
      )
      ORDER BY r.is_pinned DESC, r.accessed_at DESC`,
      [ownerType, ownerId]
    );

    return result.rows.map(rowToResource);
  }

  // --------------------------------------------------------------------------
  // Sharing
  // --------------------------------------------------------------------------

  async share(resourceId: string, targetType: OwnerType, targetId: string, permission: SharePermission, sharedBy?: string): Promise<ResourceShare> {
    const result = await query(
      `INSERT INTO ai_resource_shares (resource_id, target_type, target_id, permission, shared_by)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (resource_id, target_type, target_id)
      DO UPDATE SET permission = $4, shared_at = NOW()
      RETURNING *`,
      [resourceId, targetType, targetId, permission, sharedBy || null]
    );

    const share: ResourceShare = {
      id: result.rows[0].id,
      resourceId: result.rows[0].resource_id,
      targetType: result.rows[0].target_type,
      targetId: result.rows[0].target_id,
      permission: result.rows[0].permission,
      sharedBy: result.rows[0].shared_by,
      sharedAt: new Date(result.rows[0].shared_at),
    };

    this.emit({ type: 'shared', resourceId, targetType, targetId });
    return share;
  }

  async unshare(resourceId: string, targetType: OwnerType, targetId: string): Promise<void> {
    await query(
      'DELETE FROM ai_resource_shares WHERE resource_id = $1 AND target_type = $2 AND target_id = $3',
      [resourceId, targetType, targetId]
    );
    this.emit({ type: 'unshared', resourceId, targetType, targetId });
  }

  async getShares(resourceId: string): Promise<ResourceShare[]> {
    const result = await query('SELECT * FROM ai_resource_shares WHERE resource_id = $1', [resourceId]);
    return result.rows.map((row: Record<string, any>) => ({
      id: row.id,
      resourceId: row.resource_id,
      targetType: row.target_type,
      targetId: row.target_id,
      permission: row.permission,
      sharedBy: row.shared_by,
      sharedAt: new Date(row.shared_at),
    }));
  }

  async getSharedWith(targetType: OwnerType, targetId: string): Promise<AIResource[]> {
    const result = await query(
      `SELECT r.* FROM ai_resources r
      JOIN ai_resource_shares s ON s.resource_id = r.id
      WHERE s.target_type = $1 AND s.target_id = $2 AND r.is_active = TRUE
      ORDER BY s.shared_at DESC`,
      [targetType, targetId]
    );
    return result.rows.map(rowToResource);
  }

  // --------------------------------------------------------------------------
  // Versioning
  // --------------------------------------------------------------------------

  async getVersions(resourceId: string): Promise<ResourceVersion[]> {
    const result = await query(
      'SELECT * FROM ai_resource_versions WHERE resource_id = $1 ORDER BY version DESC',
      [resourceId]
    );
    return result.rows.map((row: Record<string, any>) => ({
      id: row.id,
      resourceId: row.resource_id,
      version: row.version,
      content: row.content,
      parts: row.parts,
      typeMetadata: row.type_metadata,
      changeDescription: row.change_description,
      createdAt: new Date(row.created_at),
    }));
  }

  async revertToVersion(resourceId: string, version: number): Promise<AIResource> {
    const versionResult = await query(
      'SELECT * FROM ai_resource_versions WHERE resource_id = $1 AND version = $2',
      [resourceId, version]
    );

    if (versionResult.rows.length === 0) {
      throw new Error(`Version ${version} not found for resource ${resourceId}`);
    }

    const versionData = versionResult.rows[0];
    return this.update(resourceId, {
      content: versionData.content,
      parts: versionData.parts,
      typeMetadata: versionData.type_metadata,
    });
  }

  private async saveVersion(resource: AIResource): Promise<void> {
    await query(
      `INSERT INTO ai_resource_versions (resource_id, version, content, parts, type_metadata)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (resource_id, version) DO NOTHING`,
      [resource.id, resource.version, resource.content, JSON.stringify(resource.parts), JSON.stringify(resource.typeMetadata)]
    );

    // Trim old versions (keep last 50)
    await query(
      `DELETE FROM ai_resource_versions
      WHERE resource_id = $1 AND version <= (
        SELECT version FROM ai_resource_versions
        WHERE resource_id = $1
        ORDER BY version DESC
        OFFSET 50 LIMIT 1
      )`,
      [resource.id]
    );
  }

  // --------------------------------------------------------------------------
  // Dependencies
  // --------------------------------------------------------------------------

  async addDependency(resourceId: string, dependsOnId: string, type: DependencyType): Promise<ResourceDependency> {
    const result = await query(
      `INSERT INTO ai_resource_dependencies (resource_id, depends_on_id, dependency_type)
      VALUES ($1, $2, $3)
      ON CONFLICT (resource_id, depends_on_id) DO UPDATE SET dependency_type = $3
      RETURNING *`,
      [resourceId, dependsOnId, type]
    );

    return {
      id: result.rows[0].id,
      resourceId: result.rows[0].resource_id,
      dependsOnId: result.rows[0].depends_on_id,
      dependencyType: result.rows[0].dependency_type,
      createdAt: new Date(result.rows[0].created_at),
    };
  }

  async getDependencies(resourceId: string): Promise<ResourceDependency[]> {
    const result = await query(
      'SELECT * FROM ai_resource_dependencies WHERE resource_id = $1',
      [resourceId]
    );
    return result.rows.map((row: Record<string, any>) => ({
      id: row.id,
      resourceId: row.resource_id,
      dependsOnId: row.depends_on_id,
      dependencyType: row.dependency_type,
      createdAt: new Date(row.created_at),
    }));
  }

  async getDependents(resourceId: string): Promise<ResourceDependency[]> {
    const result = await query(
      'SELECT * FROM ai_resource_dependencies WHERE depends_on_id = $1',
      [resourceId]
    );
    return result.rows.map((row: Record<string, any>) => ({
      id: row.id,
      resourceId: row.resource_id,
      dependsOnId: row.depends_on_id,
      dependencyType: row.dependency_type,
      createdAt: new Date(row.created_at),
    }));
  }

  // --------------------------------------------------------------------------
  // Lifecycle Tracking
  // --------------------------------------------------------------------------

  async trackAccess(resourceId: string): Promise<void> {
    await query(
      'UPDATE ai_resources SET accessed_at = NOW() WHERE id = $1',
      [resourceId]
    );
    this.emit({ type: 'accessed', id: resourceId });
  }

  async incrementUsageFrequency(resourceId: string): Promise<void> {
    await query(
      'UPDATE ai_resources SET usage_frequency = usage_frequency + 1, accessed_at = NOW() WHERE id = $1',
      [resourceId]
    );
  }

  // --------------------------------------------------------------------------
  // Stats
  // --------------------------------------------------------------------------

  async count(filters?: ResourceFilters): Promise<number> {
    const { where, values } = this.buildWhereClause(filters);
    const result = await query(`SELECT COUNT(*) as count FROM ai_resources ${where}`, values);
    return parseInt(result.rows[0].count, 10);
  }

  // --------------------------------------------------------------------------
  // Memory-specific queries (used by lifecycle services)
  // --------------------------------------------------------------------------

  async getMemoriesForDecay(): Promise<AIResource[]> {
    const result = await query(
      `SELECT * FROM ai_resources
      WHERE resource_type = 'memory'
        AND is_active = TRUE
        AND is_pinned = FALSE
        AND (type_metadata->>'layer') != 'working'
      ORDER BY accessed_at ASC`
    );
    return result.rows.map(rowToResource);
  }

  async updateImportance(resourceId: string, newImportance: number): Promise<void> {
    await query(
      `UPDATE ai_resources
      SET type_metadata = jsonb_set(type_metadata, '{importance}', $2::jsonb)
      WHERE id = $1`,
      [resourceId, JSON.stringify(newImportance)]
    );
    this.emit({ type: 'decayed', id: resourceId, newImportance });
  }

  async getMemoryCountForTarget(ownerType: OwnerType, ownerId: string): Promise<number> {
    const result = await query(
      `SELECT COUNT(*) as count FROM ai_resources
      WHERE resource_type = 'memory' AND owner_type = $1 AND owner_id = $2 AND is_active = TRUE`,
      [ownerType, ownerId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  async getMemoriesForConsolidation(ownerType: OwnerType, ownerId: string): Promise<AIResource[]> {
    const result = await query(
      `SELECT * FROM ai_resources
      WHERE resource_type = 'memory'
        AND owner_type = $1
        AND owner_id = $2
        AND is_active = TRUE
        AND provenance != 'consolidated'
        AND (type_metadata->>'layer') = 'long_term'
      ORDER BY (type_metadata->>'importance')::float ASC
      LIMIT 100`,
      [ownerType, ownerId]
    );
    return result.rows.map(rowToResource);
  }

  // --------------------------------------------------------------------------
  // Bulk operations
  // --------------------------------------------------------------------------

  async migrateFromLocalStorage(items: Array<{
    resourceType: ResourceType;
    ownerType: OwnerType;
    ownerId: string;
    content: string;
    addedAt: number;
    metadata?: Record<string, any>;
  }>): Promise<number> {
    let migrated = 0;
    for (const item of items) {
      try {
        await this.create({
          resourceType: item.resourceType,
          ownerType: item.ownerType,
          ownerId: item.ownerId,
          name: item.content.slice(0, 100) || `Migrated ${item.resourceType}`,
          content: item.content,
          parts: [],
          typeMetadata: this.defaultMetadataForType(item.resourceType),
          version: 1,
          isActive: true,
          isPinned: false,
          tags: ['migrated'],
          provenance: 'imported',
          usageFrequency: 0,
          syncToFile: false,
        });
        migrated++;
      } catch (err) {
        console.error('[ResourceStore] Migration error for item:', err);
      }
    }
    return migrated;
  }

  // --------------------------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------------------------

  private defaultMetadataForType(type: ResourceType): TypeMetadata {
    switch (type) {
      case 'prompt': return { type: 'prompt', template: '', variables: [] };
      case 'memory': return { type: 'memory', layer: 'long_term', importance: 0.5 };
      case 'context': return { type: 'context', strategy: 'flat', priority: 5, contextType: 'page', valueType: 'string' };
      case 'knowledge': return { type: 'knowledge', sourceType: 'input' };
      case 'artifact': return { type: 'artifact', category: 'custom' };
      case 'skill': return { type: 'skill', triggers: [], toolNames: [] };
      case 'mcp': return { type: 'mcp', serverUrl: '', transport: 'sse', capabilities: [] };
    }
  }

  private buildWhereClause(filters?: ResourceFilters): { where: string; values: any[] } {
    if (!filters) return { where: '', values: [] };

    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (filters.resourceType) {
      if (Array.isArray(filters.resourceType)) {
        conditions.push(`resource_type = ANY($${paramIndex++})`);
        values.push(filters.resourceType);
      } else {
        conditions.push(`resource_type = $${paramIndex++}`);
        values.push(filters.resourceType);
      }
    }

    if (filters.ownerType) {
      conditions.push(`owner_type = $${paramIndex++}`);
      values.push(filters.ownerType);
    }

    if (filters.ownerId) {
      conditions.push(`owner_id = $${paramIndex++}`);
      values.push(filters.ownerId);
    }

    if (filters.isActive !== undefined) {
      conditions.push(`is_active = $${paramIndex++}`);
      values.push(filters.isActive);
    }

    if (filters.isPinned !== undefined) {
      conditions.push(`is_pinned = $${paramIndex++}`);
      values.push(filters.isPinned);
    }

    if (filters.tags && filters.tags.length > 0) {
      conditions.push(`tags && $${paramIndex++}`);
      values.push(filters.tags);
    }

    if (filters.provenance) {
      conditions.push(`provenance = $${paramIndex++}`);
      values.push(filters.provenance);
    }

    if (filters.createdAfter) {
      conditions.push(`created_at >= $${paramIndex++}`);
      values.push(filters.createdAfter);
    }

    if (filters.createdBefore) {
      conditions.push(`created_at <= $${paramIndex++}`);
      values.push(filters.createdBefore);
    }

    if (filters.accessedAfter) {
      conditions.push(`accessed_at >= $${paramIndex++}`);
      values.push(filters.accessedAfter);
    }

    if (filters.search) {
      conditions.push(`search_vector @@ plainto_tsquery('english', $${paramIndex++})`);
      values.push(filters.search);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { where, values };
  }

  private buildOrderClause(filters?: ResourceFilters): string {
    const col = filters?.orderBy || 'created_at';
    const dir = filters?.orderDir || 'desc';
    const columnMap: Record<string, string> = {
      created_at: 'created_at',
      updated_at: 'updated_at',
      accessed_at: 'accessed_at',
      name: 'name',
      importance: "(type_metadata->>'importance')::float",
      usage_frequency: 'usage_frequency',
    };
    const column = columnMap[col] || 'created_at';
    return `ORDER BY ${column} ${dir.toUpperCase()}`;
  }
}
