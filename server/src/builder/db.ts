/**
 * Builder Database Service
 *
 * Persists BuildRecord objects to PostgreSQL so build history
 * survives server restarts. Uses the shared database pool.
 */

import { query } from '../db.js';
import type { BuildRecord, BuildPhase } from './types.js';

// ============================================================================
// Row ↔ BuildRecord mapping
// ============================================================================

function rowToRecord(row: Record<string, any>): BuildRecord {
  return {
    id: row.id,
    appId: row.app_id,
    request: row.request || {},
    plan: row.plan || undefined,
    phase: row.phase as BuildPhase,
    progress: {
      completed: row.progress_completed ?? 0,
      total: row.progress_total ?? 0,
      currentStory: row.progress_current_story || undefined,
    },
    ragStoreName: row.rag_store_name || undefined,
    sessionId: row.session_id || undefined,
    researchReport: row.research_report || undefined,
    error: row.error || undefined,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Insert a new build record.
 */
export async function insertBuild(record: BuildRecord): Promise<void> {
  await query(
    `INSERT INTO builder_builds (
      id, app_id, request, plan, phase,
      progress_completed, progress_total, progress_current_story,
      rag_store_name, session_id, research_report, error,
      created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    ON CONFLICT (id) DO NOTHING`,
    [
      record.id,
      record.appId,
      JSON.stringify(record.request),
      record.plan ? JSON.stringify(record.plan) : null,
      record.phase,
      record.progress.completed,
      record.progress.total,
      record.progress.currentStory || null,
      record.ragStoreName || null,
      record.sessionId || null,
      record.researchReport ? JSON.stringify(record.researchReport) : null,
      record.error || null,
      record.createdAt,
      record.updatedAt,
    ]
  );
}

/**
 * Update an existing build record (phase, progress, plan, error).
 */
export async function updateBuild(record: BuildRecord): Promise<void> {
  await query(
    `UPDATE builder_builds SET
      phase = $2,
      progress_completed = $3,
      progress_total = $4,
      progress_current_story = $5,
      plan = $6,
      rag_store_name = $7,
      session_id = $8,
      research_report = $9,
      error = $10,
      updated_at = $11
    WHERE id = $1`,
    [
      record.id,
      record.phase,
      record.progress.completed,
      record.progress.total,
      record.progress.currentStory || null,
      record.plan ? JSON.stringify(record.plan) : null,
      record.ragStoreName || null,
      record.sessionId || null,
      record.researchReport ? JSON.stringify(record.researchReport) : null,
      record.error || null,
      record.updatedAt,
    ]
  );
}

/**
 * Get a single build by ID.
 */
export async function getBuild(buildId: string): Promise<BuildRecord | null> {
  const result = await query('SELECT * FROM builder_builds WHERE id = $1', [buildId]);
  if (result.rows.length === 0) return null;
  return rowToRecord(result.rows[0]);
}

/**
 * List all builds, most recent first.
 */
export async function listBuilds(limit = 50): Promise<BuildRecord[]> {
  const result = await query(
    'SELECT * FROM builder_builds ORDER BY created_at DESC LIMIT $1',
    [limit]
  );
  return result.rows.map(rowToRecord);
}

/**
 * List builds for a specific app.
 */
export async function listBuildsByApp(appId: string): Promise<BuildRecord[]> {
  const result = await query(
    'SELECT * FROM builder_builds WHERE app_id = $1 ORDER BY created_at DESC',
    [appId]
  );
  return result.rows.map(rowToRecord);
}
