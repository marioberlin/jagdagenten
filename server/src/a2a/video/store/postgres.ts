/**
 * A2A Video PostgreSQL Store
 *
 * Persistent storage for compositions, renders, and assets.
 */

import type {
  Composition,
  RenderJob,
  RenderStatus,
  Asset,
  AssetType,
} from '../types.js';

// We'll use the existing database utilities from the project
// This will be dynamically imported to avoid circular dependencies
type QueryFunction = <T>(sql: string, params?: unknown[]) => Promise<T[]>;

let queryFn: QueryFunction | null = null;

/**
 * Initialize the store with a query function.
 */
export function initializePostgresStore(query: QueryFunction): void {
  queryFn = query;
}

async function query<T>(sql: string, params?: unknown[]): Promise<T[]> {
  if (!queryFn) {
    throw new Error('PostgreSQL store not initialized. Call initializePostgresStore() first.');
  }
  return queryFn(sql, params);
}

// ============================================================================
// Composition Store
// ============================================================================

export interface CompositionRecord extends Composition {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a new composition.
 */
export async function createComposition(composition: Composition): Promise<CompositionRecord> {
  const [result] = await query<CompositionRecord>(
    `INSERT INTO a2a_video_compositions (id, width, height, fps, duration_in_frames, default_props, schema, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, width, height, fps, duration_in_frames as "durationInFrames",
               default_props as "defaultProps", schema, metadata,
               created_at as "createdAt", updated_at as "updatedAt"`,
    [
      composition.id,
      composition.width,
      composition.height,
      composition.fps,
      composition.durationInFrames,
      JSON.stringify(composition.defaultProps || {}),
      composition.schema ? JSON.stringify(composition.schema) : null,
      JSON.stringify({}),
    ]
  );
  return result;
}

/**
 * Get a composition by ID.
 */
export async function getComposition(id: string): Promise<CompositionRecord | null> {
  const [result] = await query<CompositionRecord>(
    `SELECT id, width, height, fps, duration_in_frames as "durationInFrames",
            default_props as "defaultProps", schema, metadata,
            created_at as "createdAt", updated_at as "updatedAt"
     FROM a2a_video_compositions
     WHERE id = $1`,
    [id]
  );
  return result || null;
}

/**
 * List all compositions.
 */
export async function listCompositions(options?: {
  limit?: number;
  offset?: number;
}): Promise<CompositionRecord[]> {
  const limit = options?.limit || 100;
  const offset = options?.offset || 0;

  return query<CompositionRecord>(
    `SELECT id, width, height, fps, duration_in_frames as "durationInFrames",
            default_props as "defaultProps", schema, metadata,
            created_at as "createdAt", updated_at as "updatedAt"
     FROM a2a_video_compositions
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
}

/**
 * Update a composition.
 */
export async function updateComposition(
  id: string,
  updates: Partial<Composition>
): Promise<CompositionRecord | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.width !== undefined) {
    fields.push(`width = $${paramIndex++}`);
    values.push(updates.width);
  }
  if (updates.height !== undefined) {
    fields.push(`height = $${paramIndex++}`);
    values.push(updates.height);
  }
  if (updates.fps !== undefined) {
    fields.push(`fps = $${paramIndex++}`);
    values.push(updates.fps);
  }
  if (updates.durationInFrames !== undefined) {
    fields.push(`duration_in_frames = $${paramIndex++}`);
    values.push(updates.durationInFrames);
  }
  if (updates.defaultProps !== undefined) {
    fields.push(`default_props = $${paramIndex++}`);
    values.push(JSON.stringify(updates.defaultProps));
  }
  if (updates.schema !== undefined) {
    fields.push(`schema = $${paramIndex++}`);
    values.push(JSON.stringify(updates.schema));
  }

  if (fields.length === 0) {
    return getComposition(id);
  }

  fields.push('updated_at = NOW()');
  values.push(id);

  const [result] = await query<CompositionRecord>(
    `UPDATE a2a_video_compositions
     SET ${fields.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING id, width, height, fps, duration_in_frames as "durationInFrames",
               default_props as "defaultProps", schema, metadata,
               created_at as "createdAt", updated_at as "updatedAt"`,
    values
  );

  return result || null;
}

/**
 * Delete a composition.
 */
export async function deleteComposition(id: string): Promise<boolean> {
  const result = await query<{ id: string }>(
    `DELETE FROM a2a_video_compositions WHERE id = $1 RETURNING id`,
    [id]
  );
  return result.length > 0;
}

// ============================================================================
// Render Store
// ============================================================================

export interface RenderRecord extends RenderJob {
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

/**
 * Create a new render job.
 */
export async function createRender(render: {
  id: string;
  compositionId: string;
  status: RenderStatus;
  outputFormat?: string;
  codec?: string;
  width?: number;
  height?: number;
  fps?: number;
  crf?: number;
  props?: Record<string, unknown>;
}): Promise<RenderRecord> {
  const [result] = await query<RenderRecord>(
    `INSERT INTO a2a_video_renders (id, composition_id, status, output_format, codec, width, height, fps, crf, props)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id, composition_id as "compositionId", status, output_format as "outputFormat",
               codec, width, height, fps, crf, props, progress, current_frame as "currentFrame",
               output_url as "outputUrl", output_size as "outputSize", error,
               created_at as "createdAt", updated_at as "updatedAt", completed_at as "completedAt"`,
    [
      render.id,
      render.compositionId,
      render.status,
      render.outputFormat || 'mp4',
      render.codec || 'h264',
      render.width,
      render.height,
      render.fps,
      render.crf,
      JSON.stringify(render.props || {}),
    ]
  );
  return result;
}

/**
 * Get a render by ID.
 */
export async function getRender(id: string): Promise<RenderRecord | null> {
  const [result] = await query<RenderRecord>(
    `SELECT id, composition_id as "compositionId", status, output_format as "outputFormat",
            codec, width, height, fps, crf, props, progress, current_frame as "currentFrame",
            output_url as "outputUrl", output_size as "outputSize", error,
            created_at as "createdAt", updated_at as "updatedAt", completed_at as "completedAt"
     FROM a2a_video_renders
     WHERE id = $1`,
    [id]
  );
  return result || null;
}

/**
 * List renders for a composition.
 */
export async function listRenders(options?: {
  compositionId?: string;
  status?: RenderStatus;
  limit?: number;
  offset?: number;
}): Promise<RenderRecord[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (options?.compositionId) {
    conditions.push(`composition_id = $${paramIndex++}`);
    params.push(options.compositionId);
  }
  if (options?.status) {
    conditions.push(`status = $${paramIndex++}`);
    params.push(options.status);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = options?.limit || 100;
  const offset = options?.offset || 0;

  params.push(limit, offset);

  return query<RenderRecord>(
    `SELECT id, composition_id as "compositionId", status, output_format as "outputFormat",
            codec, width, height, fps, crf, props, progress, current_frame as "currentFrame",
            output_url as "outputUrl", output_size as "outputSize", error,
            created_at as "createdAt", updated_at as "updatedAt", completed_at as "completedAt"
     FROM a2a_video_renders
     ${where}
     ORDER BY created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    params
  );
}

/**
 * Update a render's status and progress.
 */
export async function updateRender(
  id: string,
  updates: Partial<{
    status: RenderStatus;
    progress: number;
    currentFrame: number;
    outputUrl: string;
    outputSize: number;
    error: string;
  }>
): Promise<RenderRecord | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    values.push(updates.status);

    // Set completed_at if status is terminal
    if (['completed', 'failed', 'cancelled'].includes(updates.status)) {
      fields.push('completed_at = NOW()');
    }
  }
  if (updates.progress !== undefined) {
    fields.push(`progress = $${paramIndex++}`);
    values.push(updates.progress);
  }
  if (updates.currentFrame !== undefined) {
    fields.push(`current_frame = $${paramIndex++}`);
    values.push(updates.currentFrame);
  }
  if (updates.outputUrl !== undefined) {
    fields.push(`output_url = $${paramIndex++}`);
    values.push(updates.outputUrl);
  }
  if (updates.outputSize !== undefined) {
    fields.push(`output_size = $${paramIndex++}`);
    values.push(updates.outputSize);
  }
  if (updates.error !== undefined) {
    fields.push(`error = $${paramIndex++}`);
    values.push(updates.error);
  }

  if (fields.length === 0) {
    return getRender(id);
  }

  fields.push('updated_at = NOW()');
  values.push(id);

  const [result] = await query<RenderRecord>(
    `UPDATE a2a_video_renders
     SET ${fields.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING id, composition_id as "compositionId", status, output_format as "outputFormat",
               codec, width, height, fps, crf, props, progress, current_frame as "currentFrame",
               output_url as "outputUrl", output_size as "outputSize", error,
               created_at as "createdAt", updated_at as "updatedAt", completed_at as "completedAt"`,
    values
  );

  return result || null;
}

/**
 * Add a log entry for a render.
 */
export async function addRenderLog(
  renderId: string,
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await query(
    `INSERT INTO a2a_video_render_logs (render_id, level, message, metadata)
     VALUES ($1, $2, $3, $4)`,
    [renderId, level, message, JSON.stringify(metadata || {})]
  );
}

/**
 * Get logs for a render.
 */
export async function getRenderLogs(
  renderId: string,
  options?: { limit?: number; level?: string }
): Promise<Array<{
  id: number;
  level: string;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}>> {
  const conditions = ['render_id = $1'];
  const params: unknown[] = [renderId];
  let paramIndex = 2;

  if (options?.level) {
    conditions.push(`level = $${paramIndex++}`);
    params.push(options.level);
  }

  const limit = options?.limit || 100;
  params.push(limit);

  return query(
    `SELECT id, level, message, metadata, created_at as "createdAt"
     FROM a2a_video_render_logs
     WHERE ${conditions.join(' AND ')}
     ORDER BY created_at DESC
     LIMIT $${paramIndex}`,
    params
  );
}

// ============================================================================
// Asset Store
// ============================================================================

export interface AssetRecord extends Asset {
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
}

/**
 * Create a new asset.
 */
export async function createAsset(asset: {
  id: string;
  name: string;
  type: AssetType;
  mimeType: string;
  size: number;
  url: string;
  hash?: string;
  metadata?: Record<string, unknown>;
}): Promise<AssetRecord> {
  const [result] = await query<AssetRecord>(
    `INSERT INTO a2a_video_assets (id, name, type, mime_type, size, url, hash, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, name, type, mime_type as "mimeType", size, url, hash, metadata,
               created_at as "createdAt", updated_at as "updatedAt", usage_count as "usageCount"`,
    [
      asset.id,
      asset.name,
      asset.type,
      asset.mimeType,
      asset.size,
      asset.url,
      asset.hash,
      JSON.stringify(asset.metadata || {}),
    ]
  );
  return result;
}

/**
 * Get an asset by ID.
 */
export async function getAsset(id: string): Promise<AssetRecord | null> {
  const [result] = await query<AssetRecord>(
    `SELECT id, name, type, mime_type as "mimeType", size, url, hash, metadata,
            created_at as "createdAt", updated_at as "updatedAt", usage_count as "usageCount"
     FROM a2a_video_assets
     WHERE id = $1`,
    [id]
  );
  return result || null;
}

/**
 * Get an asset by hash (for deduplication).
 */
export async function getAssetByHash(hash: string): Promise<AssetRecord | null> {
  const [result] = await query<AssetRecord>(
    `SELECT id, name, type, mime_type as "mimeType", size, url, hash, metadata,
            created_at as "createdAt", updated_at as "updatedAt", usage_count as "usageCount"
     FROM a2a_video_assets
     WHERE hash = $1`,
    [hash]
  );
  return result || null;
}

/**
 * List assets.
 */
export async function listAssets(options?: {
  type?: AssetType;
  limit?: number;
  offset?: number;
}): Promise<AssetRecord[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (options?.type) {
    conditions.push(`type = $${paramIndex++}`);
    params.push(options.type);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = options?.limit || 100;
  const offset = options?.offset || 0;

  params.push(limit, offset);

  return query<AssetRecord>(
    `SELECT id, name, type, mime_type as "mimeType", size, url, hash, metadata,
            created_at as "createdAt", updated_at as "updatedAt", usage_count as "usageCount"
     FROM a2a_video_assets
     ${where}
     ORDER BY created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    params
  );
}

/**
 * Increment asset usage count.
 */
export async function incrementAssetUsage(id: string): Promise<void> {
  await query(
    `UPDATE a2a_video_assets SET usage_count = usage_count + 1, updated_at = NOW() WHERE id = $1`,
    [id]
  );
}

/**
 * Delete an asset.
 */
export async function deleteAsset(id: string): Promise<boolean> {
  const result = await query<{ id: string }>(
    `DELETE FROM a2a_video_assets WHERE id = $1 RETURNING id`,
    [id]
  );
  return result.length > 0;
}

/**
 * Get storage statistics.
 */
export async function getStorageStats(): Promise<{
  totalAssets: number;
  totalSize: number;
  byType: Record<string, { count: number; size: number }>;
}> {
  const [totals] = await query<{ totalAssets: string; totalSize: string }>(
    `SELECT COUNT(*) as "totalAssets", COALESCE(SUM(size), 0) as "totalSize" FROM a2a_video_assets`
  );

  const byType = await query<{ type: string; count: string; size: string }>(
    `SELECT type, COUNT(*) as count, COALESCE(SUM(size), 0) as size
     FROM a2a_video_assets
     GROUP BY type`
  );

  return {
    totalAssets: parseInt(totals?.totalAssets || '0'),
    totalSize: parseInt(totals?.totalSize || '0'),
    byType: Object.fromEntries(
      byType.map((row) => [row.type, { count: parseInt(row.count), size: parseInt(row.size) }])
    ),
  };
}

// ============================================================================
// Cleanup utilities
// ============================================================================

/**
 * Delete old renders.
 */
export async function deleteOldRenders(options: {
  olderThan: Date;
  statuses?: RenderStatus[];
}): Promise<number> {
  const conditions = ['created_at < $1'];
  const params: unknown[] = [options.olderThan];

  if (options.statuses && options.statuses.length > 0) {
    conditions.push(`status = ANY($2)`);
    params.push(options.statuses);
  }

  const result = await query<{ id: string }>(
    `DELETE FROM a2a_video_renders WHERE ${conditions.join(' AND ')} RETURNING id`,
    params
  );

  return result.length;
}

/**
 * Delete unused assets.
 */
export async function deleteUnusedAssets(olderThan: Date): Promise<number> {
  const result = await query<{ id: string }>(
    `DELETE FROM a2a_video_assets
     WHERE usage_count = 0 AND created_at < $1
     RETURNING id`,
    [olderThan]
  );

  return result.length;
}
