/**
 * App Store Database Layer
 *
 * PostgreSQL-backed persistence for the app registry.
 * Falls back to in-memory store if database is unavailable.
 */

import { query } from '../db.js';
import type { AppRegistryEntry } from './app-types.js';

// ============================================================================
// Schema Migration
// ============================================================================

/**
 * Create the app_registry table if it doesn't exist.
 * Safe to call multiple times (idempotent).
 */
export async function migrateAppStoreSchema(): Promise<void> {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS app_registry (
        id TEXT PRIMARY KEY,
        manifest JSONB NOT NULL,
        published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        published_by TEXT NOT NULL DEFAULT 'local',
        downloads INTEGER NOT NULL DEFAULT 0,
        rating REAL NOT NULL DEFAULT 0,
        review_count INTEGER NOT NULL DEFAULT 0,
        featured BOOLEAN NOT NULL DEFAULT FALSE,
        verified BOOLEAN NOT NULL DEFAULT FALSE,
        bundle_url TEXT,
        bundle_hash TEXT,
        bundle_size INTEGER
      );

      CREATE INDEX IF NOT EXISTS idx_app_registry_category ON app_registry ((manifest->>'category'));
      CREATE INDEX IF NOT EXISTS idx_app_registry_author ON app_registry ((manifest->>'author'));
      CREATE INDEX IF NOT EXISTS idx_app_registry_featured ON app_registry (featured) WHERE featured = TRUE;
      CREATE INDEX IF NOT EXISTS idx_app_registry_name ON app_registry ((manifest->>'name'));
    `);
    console.info('[AppStoreDB] Schema migration complete');
  } catch (error) {
    console.warn('[AppStoreDB] Schema migration failed (DB may be unavailable):', error);
    throw error;
  }
}

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Get all apps from the registry.
 */
export async function getAllApps(params?: {
  category?: string;
  author?: string;
  featured?: boolean;
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<{ apps: AppRegistryEntry[]; total: number }> {
  const conditions: string[] = [];
  const values: any[] = [];
  let paramIdx = 1;

  if (params?.category) {
    conditions.push(`manifest->>'category' = $${paramIdx++}`);
    values.push(params.category);
  }
  if (params?.author) {
    conditions.push(`manifest->>'author' = $${paramIdx++}`);
    values.push(params.author);
  }
  if (params?.featured) {
    conditions.push(`featured = TRUE`);
  }
  if (params?.q) {
    conditions.push(`(
      manifest->>'name' ILIKE $${paramIdx} OR
      manifest->>'description' ILIKE $${paramIdx} OR
      manifest->>'keywords' ILIKE $${paramIdx}
    )`);
    values.push(`%${params.q}%`);
    paramIdx++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Count total
  const countResult = await query(`SELECT COUNT(*) as total FROM app_registry ${whereClause}`, values);
  const total = parseInt(countResult.rows[0]?.total ?? '0', 10);

  // Fetch page
  const limit = params?.limit ?? 50;
  const offset = params?.offset ?? 0;
  const result = await query(
    `SELECT * FROM app_registry ${whereClause} ORDER BY updated_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
    [...values, limit, offset]
  );

  return { apps: result.rows.map(rowToEntry), total };
}

/**
 * Get a single app by ID.
 */
export async function getApp(id: string): Promise<AppRegistryEntry | null> {
  const result = await query('SELECT * FROM app_registry WHERE id = $1', [id]);
  if (result.rows.length === 0) return null;
  return rowToEntry(result.rows[0]);
}

/**
 * Upsert an app (create or update).
 */
export async function upsertApp(entry: AppRegistryEntry): Promise<AppRegistryEntry> {
  const result = await query(`
    INSERT INTO app_registry (id, manifest, published_at, updated_at, published_by, downloads, rating, review_count, featured, verified, bundle_url, bundle_hash, bundle_size)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    ON CONFLICT (id) DO UPDATE SET
      manifest = EXCLUDED.manifest,
      updated_at = EXCLUDED.updated_at,
      published_by = EXCLUDED.published_by,
      bundle_url = EXCLUDED.bundle_url,
      bundle_hash = EXCLUDED.bundle_hash,
      bundle_size = EXCLUDED.bundle_size
    RETURNING *
  `, [
    entry.id,
    JSON.stringify(entry.manifest),
    entry.publishedAt,
    entry.updatedAt,
    entry.publishedBy,
    entry.downloads,
    entry.rating,
    entry.reviewCount,
    entry.featured,
    entry.verified,
    entry.bundleUrl ?? null,
    entry.bundleHash ?? null,
    entry.bundleSize ?? null,
  ]);

  return rowToEntry(result.rows[0]);
}

/**
 * Delete an app by ID.
 */
export async function deleteApp(id: string): Promise<boolean> {
  const result = await query('DELETE FROM app_registry WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

/**
 * Increment download counter.
 */
export async function incrementDownloads(id: string): Promise<void> {
  await query('UPDATE app_registry SET downloads = downloads + 1 WHERE id = $1', [id]);
}

/**
 * Get featured apps.
 */
export async function getFeaturedApps(): Promise<AppRegistryEntry[]> {
  const result = await query('SELECT * FROM app_registry WHERE featured = TRUE ORDER BY downloads DESC');
  return result.rows.map(rowToEntry);
}

/**
 * Get category counts.
 */
export async function getCategoryCounts(): Promise<{ name: string; count: number }[]> {
  const result = await query(`
    SELECT manifest->>'category' as name, COUNT(*) as count
    FROM app_registry
    GROUP BY manifest->>'category'
    ORDER BY count DESC
  `);
  return result.rows.map((r: { name: string; count: string }) => ({ name: r.name, count: parseInt(r.count, 10) }));
}

/**
 * Get registry stats.
 */
export async function getStats(): Promise<{
  totalApps: number;
  totalDownloads: number;
  categories: number;
  featuredCount: number;
}> {
  const result = await query(`
    SELECT
      COUNT(*) as total_apps,
      COALESCE(SUM(downloads), 0) as total_downloads,
      COUNT(DISTINCT manifest->>'category') as categories,
      COUNT(*) FILTER (WHERE featured = TRUE) as featured_count
    FROM app_registry
  `);
  const row = result.rows[0];
  return {
    totalApps: parseInt(row.total_apps, 10),
    totalDownloads: parseInt(row.total_downloads, 10),
    categories: parseInt(row.categories, 10),
    featuredCount: parseInt(row.featured_count, 10),
  };
}

// ============================================================================
// Helpers
// ============================================================================

function rowToEntry(row: any): AppRegistryEntry {
  return {
    id: row.id,
    manifest: typeof row.manifest === 'string' ? JSON.parse(row.manifest) : row.manifest,
    publishedAt: row.published_at?.toISOString?.() ?? row.published_at,
    updatedAt: row.updated_at?.toISOString?.() ?? row.updated_at,
    publishedBy: row.published_by,
    downloads: row.downloads,
    rating: parseFloat(row.rating),
    reviewCount: row.review_count,
    featured: row.featured,
    verified: row.verified,
    bundleUrl: row.bundle_url ?? undefined,
    bundleHash: row.bundle_hash ?? undefined,
    bundleSize: row.bundle_size ?? undefined,
  };
}
