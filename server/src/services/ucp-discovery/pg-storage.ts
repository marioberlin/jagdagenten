/**
 * PostgreSQL Storage Layer for UCP Merchant Discovery
 *
 * Persistent storage replacing in-memory storage.
 * Provides the same interface as storage.ts but backed by PostgreSQL.
 */

import { query } from '../../db.js';
import type {
  Merchant,
  MerchantSource,
  UCPFetchResult,
  UCPProfileSnapshot,
  AgentCardSnapshot,
  AgentCardFetch,
  ValidationResult,
  CrawlState,
  HealthTier,
  Region,
} from './types.js';
import { calculateMerchantScore, assignHealthTier, calculateNextCheckTime } from './scoring.js';

// ============================================================================
// Merchant Operations
// ============================================================================

export async function getMerchantById(id: string): Promise<Merchant | null> {
  const result = await query<Merchant>(
    `SELECT id, domain, region, score, is_active as "isActive",
            created_at as "createdAt", updated_at as "updatedAt"
     FROM ucp_merchants WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function getMerchantByDomain(domain: string): Promise<Merchant | null> {
  const result = await query<Merchant>(
    `SELECT id, domain, region, score, is_active as "isActive",
            created_at as "createdAt", updated_at as "updatedAt"
     FROM ucp_merchants WHERE domain = $1`,
    [domain]
  );
  return result.rows[0] || null;
}

export async function getAllMerchants(filters?: {
  region?: Region;
  healthTier?: HealthTier;
  hasA2A?: boolean;
  isActive?: boolean;
  minScore?: number;
  page?: number;
  pageSize?: number;
}): Promise<{ merchants: Merchant[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filters?.region) {
    conditions.push(`m.region = $${paramIndex++}`);
    params.push(filters.region);
  }
  if (filters?.healthTier) {
    conditions.push(`cs.health_tier = $${paramIndex++}`);
    params.push(filters.healthTier);
  }
  if (filters?.hasA2A) {
    conditions.push(`p.has_a2a = true`);
  }
  if (filters?.isActive !== undefined) {
    conditions.push(`m.is_active = $${paramIndex++}`);
    params.push(filters.isActive);
  }
  if (filters?.minScore !== undefined) {
    conditions.push(`m.score >= $${paramIndex++}`);
    params.push(filters.minScore);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count
     FROM ucp_merchants m
     LEFT JOIN ucp_crawl_state cs ON m.id = cs.merchant_id
     LEFT JOIN ucp_profiles p ON m.id = p.merchant_id
     ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0]?.count || '0', 10);

  // Get paginated results
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 20;
  const offset = (page - 1) * pageSize;

  const result = await query<Merchant>(
    `SELECT m.id, m.domain, m.region, m.score, m.is_active as "isActive",
            m.created_at as "createdAt", m.updated_at as "updatedAt"
     FROM ucp_merchants m
     LEFT JOIN ucp_crawl_state cs ON m.id = cs.merchant_id
     LEFT JOIN ucp_profiles p ON m.id = p.merchant_id
     ${whereClause}
     ORDER BY m.score DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, pageSize, offset]
  );

  return { merchants: result.rows, total };
}

export async function upsertMerchant(data: Partial<Merchant> & { domain: string }): Promise<Merchant> {
  const id = data.id || `merchant-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const now = new Date().toISOString();

  const result = await query<Merchant>(
    `INSERT INTO ucp_merchants (id, domain, region, score, is_active, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (domain) DO UPDATE SET
       region = COALESCE($3, ucp_merchants.region),
       score = COALESCE($4, ucp_merchants.score),
       is_active = COALESCE($5, ucp_merchants.is_active),
       updated_at = $7
     RETURNING id, domain, region, score, is_active as "isActive",
               created_at as "createdAt", updated_at as "updatedAt"`,
    [
      id,
      data.domain,
      data.region || 'OTHER',
      data.score ?? 0,
      data.isActive ?? true,
      data.createdAt || now,
      data.updatedAt || now,
    ]
  );

  // Ensure crawl state exists
  await query(
    `INSERT INTO ucp_crawl_state (merchant_id, next_check_at, health_tier)
     VALUES ($1, NOW(), 'A')
     ON CONFLICT (merchant_id) DO NOTHING`,
    [result.rows[0].id]
  );

  return result.rows[0];
}

export async function deleteMerchant(id: string): Promise<boolean> {
  // Delete in correct order due to foreign key constraints
  await query(`DELETE FROM ucp_validation_results WHERE merchant_id = $1`, [id]);
  await query(`DELETE FROM ucp_fetch_history WHERE merchant_id = $1`, [id]);
  await query(`DELETE FROM ucp_agent_cards WHERE merchant_id = $1`, [id]);
  await query(`DELETE FROM ucp_profiles WHERE merchant_id = $1`, [id]);
  await query(`DELETE FROM ucp_crawl_state WHERE merchant_id = $1`, [id]);
  await query(`DELETE FROM ucp_merchant_sources WHERE merchant_id = $1`, [id]);
  const result = await query(`DELETE FROM ucp_merchants WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

// ============================================================================
// Source Operations
// ============================================================================

export async function addSource(data: Omit<MerchantSource, 'id'>): Promise<MerchantSource> {
  const id = `src-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const result = await query<MerchantSource>(
    `INSERT INTO ucp_merchant_sources (id, merchant_id, source_type, source_url, discovered_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT DO NOTHING
     RETURNING id, merchant_id as "merchantId", source_type as "sourceType",
               source_url as "sourceUrl", discovered_at as "discoveredAt"`,
    [id, data.merchantId, data.sourceType, data.sourceUrl, data.discoveredAt]
  );

  return result.rows[0] || { id, ...data };
}

export async function getSourcesForMerchant(merchantId: string): Promise<MerchantSource[]> {
  const result = await query<MerchantSource>(
    `SELECT id, merchant_id as "merchantId", source_type as "sourceType",
            source_url as "sourceUrl", discovered_at as "discoveredAt"
     FROM ucp_merchant_sources WHERE merchant_id = $1`,
    [merchantId]
  );
  return result.rows;
}

// ============================================================================
// UCP Profile Operations
// ============================================================================

export async function setProfile(profile: UCPProfileSnapshot): Promise<void> {
  await query(
    `INSERT INTO ucp_profiles (
       merchant_id, ucp_version, services, capabilities, payment, signing_keys,
       has_a2a, a2a_agent_card_url, rest_endpoint, mcp_endpoint, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     ON CONFLICT (merchant_id) DO UPDATE SET
       ucp_version = $2, services = $3, capabilities = $4, payment = $5,
       signing_keys = $6, has_a2a = $7, a2a_agent_card_url = $8,
       rest_endpoint = $9, mcp_endpoint = $10, updated_at = $11`,
    [
      profile.merchantId,
      profile.ucpVersion,
      JSON.stringify(profile.services),
      JSON.stringify(profile.capabilities),
      profile.payment ? JSON.stringify(profile.payment) : null,
      profile.signingKeys ? JSON.stringify(profile.signingKeys) : null,
      profile.hasA2A,
      profile.a2aAgentCardUrl,
      profile.restEndpoint,
      profile.mcpEndpoint,
      profile.updatedAt,
    ]
  );
}

export async function getProfile(merchantId: string): Promise<UCPProfileSnapshot | null> {
  const result = await query<{
    merchant_id: string;
    ucp_version: string;
    services: string;
    capabilities: string;
    payment: string | null;
    signing_keys: string | null;
    has_a2a: boolean;
    a2a_agent_card_url: string | null;
    rest_endpoint: string | null;
    mcp_endpoint: string | null;
    updated_at: string;
  }>(
    `SELECT * FROM ucp_profiles WHERE merchant_id = $1`,
    [merchantId]
  );

  if (!result.rows[0]) return null;

  const row = result.rows[0];
  return {
    merchantId: row.merchant_id,
    ucpVersion: row.ucp_version,
    services: typeof row.services === 'string' ? JSON.parse(row.services) : row.services,
    capabilities: typeof row.capabilities === 'string' ? JSON.parse(row.capabilities) : row.capabilities,
    payment: row.payment ? (typeof row.payment === 'string' ? JSON.parse(row.payment) : row.payment) : undefined,
    signingKeys: row.signing_keys ? (typeof row.signing_keys === 'string' ? JSON.parse(row.signing_keys) : row.signing_keys) : undefined,
    hasA2A: row.has_a2a,
    a2aAgentCardUrl: row.a2a_agent_card_url || undefined,
    restEndpoint: row.rest_endpoint || undefined,
    mcpEndpoint: row.mcp_endpoint || undefined,
    updatedAt: row.updated_at,
  };
}

// ============================================================================
// Agent Card Operations
// ============================================================================

export async function setAgentCard(card: AgentCardSnapshot): Promise<void> {
  await query(
    `INSERT INTO ucp_agent_cards (
       merchant_id, name, description, version, protocol_versions,
       supported_interfaces, capabilities, extensions, skills, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (merchant_id) DO UPDATE SET
       name = $2, description = $3, version = $4, protocol_versions = $5,
       supported_interfaces = $6, capabilities = $7, extensions = $8,
       skills = $9, updated_at = $10`,
    [
      card.merchantId,
      card.name,
      card.description,
      card.version,
      JSON.stringify(card.protocolVersions),
      JSON.stringify(card.supportedInterfaces),
      JSON.stringify(card.capabilities),
      JSON.stringify(card.extensions),
      JSON.stringify(card.skills),
      card.updatedAt,
    ]
  );
}

export async function getAgentCard(merchantId: string): Promise<AgentCardSnapshot | null> {
  const result = await query<{
    merchant_id: string;
    name: string;
    description: string | null;
    version: string | null;
    protocol_versions: string;
    supported_interfaces: string;
    capabilities: string;
    extensions: string;
    skills: string;
    updated_at: string;
  }>(
    `SELECT * FROM ucp_agent_cards WHERE merchant_id = $1`,
    [merchantId]
  );

  if (!result.rows[0]) return null;

  const row = result.rows[0];
  return {
    merchantId: row.merchant_id,
    name: row.name,
    description: row.description || undefined,
    version: row.version || undefined,
    protocolVersions: typeof row.protocol_versions === 'string' ? JSON.parse(row.protocol_versions) : row.protocol_versions,
    supportedInterfaces: typeof row.supported_interfaces === 'string' ? JSON.parse(row.supported_interfaces) : row.supported_interfaces,
    capabilities: typeof row.capabilities === 'string' ? JSON.parse(row.capabilities) : row.capabilities,
    extensions: typeof row.extensions === 'string' ? JSON.parse(row.extensions) : row.extensions,
    skills: typeof row.skills === 'string' ? JSON.parse(row.skills) : row.skills,
    updatedAt: row.updated_at,
  };
}

// ============================================================================
// Validation Results
// ============================================================================

export async function addValidationResults(results: ValidationResult[]): Promise<void> {
  if (results.length === 0) return;

  for (const result of results) {
    await query(
      `INSERT INTO ucp_validation_results (id, merchant_id, fetched_at, target, severity, code, message, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        result.id,
        result.merchantId,
        result.fetchedAt,
        result.target,
        result.severity,
        result.code,
        result.message,
        result.details ? JSON.stringify(result.details) : null,
      ]
    );
  }
}

interface ValidationResultRow {
  id: string;
  merchant_id: string;
  fetched_at: string;
  target: string;
  severity: string;
  code: string;
  message: string;
  details: string | null;
}

export async function getValidationResults(merchantId: string): Promise<ValidationResult[]> {
  const result = await query<ValidationResultRow>(
    `SELECT * FROM ucp_validation_results WHERE merchant_id = $1 ORDER BY fetched_at DESC`,
    [merchantId]
  );

  return result.rows.map((row: ValidationResultRow) => ({
    id: row.id,
    merchantId: row.merchant_id,
    fetchedAt: row.fetched_at,
    target: row.target as 'ucp_profile' | 'agent_card',
    severity: row.severity as 'info' | 'warn' | 'error',
    code: row.code,
    message: row.message,
    details: row.details ? (typeof row.details === 'string' ? JSON.parse(row.details) : row.details) : undefined,
  }));
}

export async function clearValidationResults(merchantId: string): Promise<void> {
  await query(`DELETE FROM ucp_validation_results WHERE merchant_id = $1`, [merchantId]);
}

// ============================================================================
// Fetch History
// ============================================================================

export async function addUCPFetch(fetch: UCPFetchResult): Promise<void> {
  await query(
    `INSERT INTO ucp_fetch_history (
       id, merchant_id, fetch_type, fetched_at, url, final_url,
       status_code, latency_ms, etag, last_modified, cache_control, body_sha256, error
     ) VALUES ($1, $2, 'ucp_profile', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      fetch.id,
      fetch.merchantId,
      fetch.fetchedAt,
      fetch.url,
      fetch.finalUrl,
      fetch.statusCode,
      fetch.latencyMs,
      fetch.etag,
      fetch.lastModified,
      fetch.cacheControl,
      fetch.bodySha256,
      fetch.error,
    ]
  );
}

export async function addAgentCardFetch(fetch: AgentCardFetch): Promise<void> {
  await query(
    `INSERT INTO ucp_fetch_history (
       id, merchant_id, fetch_type, fetched_at, url, status_code, latency_ms, body_sha256, error
     ) VALUES ($1, $2, 'agent_card', $3, $4, $5, $6, $7, $8)`,
    [
      fetch.id,
      fetch.merchantId,
      fetch.fetchedAt,
      fetch.url,
      fetch.statusCode,
      fetch.latencyMs,
      fetch.bodySha256,
      fetch.error,
    ]
  );
}

export async function getLatestUCPFetch(merchantId: string): Promise<UCPFetchResult | null> {
  const result = await query<{
    id: string;
    merchant_id: string;
    fetched_at: string;
    url: string;
    final_url: string;
    status_code: number;
    latency_ms: number;
    etag: string | null;
    last_modified: string | null;
    cache_control: string | null;
    body_sha256: string | null;
    error: string | null;
  }>(
    `SELECT * FROM ucp_fetch_history
     WHERE merchant_id = $1 AND fetch_type = 'ucp_profile'
     ORDER BY fetched_at DESC LIMIT 1`,
    [merchantId]
  );

  if (!result.rows[0]) return null;

  const row = result.rows[0];
  return {
    id: row.id,
    merchantId: row.merchant_id,
    fetchedAt: row.fetched_at,
    url: row.url,
    finalUrl: row.final_url,
    statusCode: row.status_code,
    latencyMs: row.latency_ms,
    etag: row.etag || undefined,
    lastModified: row.last_modified || undefined,
    cacheControl: row.cache_control || undefined,
    bodySha256: row.body_sha256 || undefined,
    error: row.error || undefined,
  };
}

// ============================================================================
// Crawl State
// ============================================================================

export async function getCrawlState(merchantId: string): Promise<CrawlState | null> {
  const result = await query<{
    merchant_id: string;
    next_check_at: string;
    consecutive_failures: number;
    last_success_at: string | null;
    last_error_at: string | null;
    health_tier: string;
  }>(
    `SELECT * FROM ucp_crawl_state WHERE merchant_id = $1`,
    [merchantId]
  );

  if (!result.rows[0]) return null;

  const row = result.rows[0];
  return {
    merchantId: row.merchant_id,
    nextCheckAt: row.next_check_at,
    consecutiveFailures: row.consecutive_failures,
    lastSuccessAt: row.last_success_at || undefined,
    lastErrorAt: row.last_error_at || undefined,
    healthTier: row.health_tier as HealthTier,
  };
}

export async function updateCrawlState(merchantId: string, updates: Partial<CrawlState>): Promise<void> {
  const failures = updates.consecutiveFailures ?? 0;
  // Get current merchant score to determine health tier
  const merchant = await getMerchantById(merchantId);
  const score = merchant?.score ?? 50;
  const healthTier = assignHealthTier(score, failures);
  const nextCheckAt = calculateNextCheckTime(healthTier, failures);

  await query(
    `UPDATE ucp_crawl_state SET
       next_check_at = $2,
       consecutive_failures = COALESCE($3, consecutive_failures),
       last_success_at = COALESCE($4, last_success_at),
       last_error_at = COALESCE($5, last_error_at),
       health_tier = $6
     WHERE merchant_id = $1`,
    [
      merchantId,
      nextCheckAt,
      updates.consecutiveFailures,
      updates.lastSuccessAt,
      updates.lastErrorAt,
      healthTier,
    ]
  );
}

export async function getMerchantsDueForCheck(limit = 100): Promise<Merchant[]> {
  const result = await query<Merchant>(
    `SELECT m.id, m.domain, m.region, m.score, m.is_active as "isActive",
            m.created_at as "createdAt", m.updated_at as "updatedAt"
     FROM ucp_merchants m
     JOIN ucp_crawl_state cs ON m.id = cs.merchant_id
     WHERE m.is_active = true AND cs.next_check_at <= NOW()
     ORDER BY cs.next_check_at ASC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

// ============================================================================
// Statistics
// ============================================================================

export async function getStats(): Promise<{
  totalMerchants: number;
  activeMerchants: number;
  byRegion: Record<Region, number>;
  byHealthTier: Record<HealthTier, number>;
  validPercentage: number;
  withA2A: number;
}> {
  const result = await query<{
    total_merchants: string;
    active_merchants: string;
    eu_merchants: string;
    us_merchants: string;
    ca_merchants: string;
    other_merchants: string;
    tier_a_count: string;
    tier_b_count: string;
    tier_c_count: string;
    with_a2a: string;
    valid_percentage: string;
  }>(`SELECT * FROM ucp_stats`);

  const row = result.rows[0] || {};
  return {
    totalMerchants: parseInt(row.total_merchants || '0', 10),
    activeMerchants: parseInt(row.active_merchants || '0', 10),
    byRegion: {
      EU: parseInt(row.eu_merchants || '0', 10),
      US: parseInt(row.us_merchants || '0', 10),
      CA: parseInt(row.ca_merchants || '0', 10),
      OTHER: parseInt(row.other_merchants || '0', 10),
    },
    byHealthTier: {
      A: parseInt(row.tier_a_count || '0', 10),
      B: parseInt(row.tier_b_count || '0', 10),
      C: parseInt(row.tier_c_count || '0', 10),
    },
    validPercentage: parseFloat(row.valid_percentage || '0'),
    withA2A: parseInt(row.with_a2a || '0', 10),
  };
}

// ============================================================================
// A2A Merchants
// ============================================================================

export async function getMerchantsWithA2A(): Promise<Merchant[]> {
  const result = await query<Merchant>(
    `SELECT m.id, m.domain, m.region, m.score, m.is_active as "isActive",
            m.created_at as "createdAt", m.updated_at as "updatedAt"
     FROM ucp_merchants m
     JOIN ucp_profiles p ON m.id = p.merchant_id
     WHERE p.has_a2a = true AND m.is_active = true
     ORDER BY m.score DESC`
  );
  return result.rows;
}

// ============================================================================
// Score Update
// ============================================================================

export async function updateMerchantScore(merchantId: string, selectedRegion: Region): Promise<number> {
  const profile = await getProfile(merchantId);
  const validationResults = await getValidationResults(merchantId);
  const latestFetch = await getLatestUCPFetch(merchantId);
  const crawlState = await getCrawlState(merchantId);
  const merchant = await getMerchantById(merchantId);

  const score = calculateMerchantScore({
    merchantId,
    domain: merchant?.domain || '',
    region: (merchant?.region as Region) || 'OTHER',
    profile: profile || undefined,
    validationResults,
    crawlState: crawlState || undefined,
    lastFetchLatencyMs: latestFetch?.latencyMs,
    selectedRegion,
  });

  await query(
    `UPDATE ucp_merchants SET score = $2, updated_at = NOW() WHERE id = $1`,
    [merchantId, score]
  );

  return score;
}

// ============================================================================
// Crawler Run History
// ============================================================================

export async function startCrawlerRun(runType: 'full' | 'incremental'): Promise<number> {
  const result = await query<{ id: number }>(
    `INSERT INTO ucp_crawler_runs (run_type, status) VALUES ($1, 'running') RETURNING id`,
    [runType]
  );
  return result.rows[0].id;
}

export async function completeCrawlerRun(
  runId: number,
  stats: {
    domainsDiscovered?: number;
    domainsProcessed: number;
    newMerchants?: number;
    updatedMerchants?: number;
    errors: string[];
  }
): Promise<void> {
  await query(
    `UPDATE ucp_crawler_runs SET
       completed_at = NOW(),
       domains_discovered = $2,
       domains_processed = $3,
       new_merchants = $4,
       updated_merchants = $5,
       errors = $6,
       status = 'completed'
     WHERE id = $1`,
    [
      runId,
      stats.domainsDiscovered ?? 0,
      stats.domainsProcessed,
      stats.newMerchants ?? 0,
      stats.updatedMerchants ?? 0,
      JSON.stringify(stats.errors),
    ]
  );
}

export async function failCrawlerRun(runId: number, errors: string[]): Promise<void> {
  await query(
    `UPDATE ucp_crawler_runs SET
       completed_at = NOW(),
       errors = $2,
       status = 'failed'
     WHERE id = $1`,
    [runId, JSON.stringify(errors)]
  );
}

export async function getLastCrawlerRun(): Promise<{
  runType: string;
  startedAt: string;
  completedAt?: string;
  status: string;
  domainsProcessed: number;
} | null> {
  const result = await query<{
    run_type: string;
    started_at: string;
    completed_at: string | null;
    status: string;
    domains_processed: number;
  }>(
    `SELECT run_type, started_at, completed_at, status, domains_processed
     FROM ucp_crawler_runs ORDER BY started_at DESC LIMIT 1`
  );

  if (!result.rows[0]) return null;

  const row = result.rows[0];
  return {
    runType: row.run_type,
    startedAt: row.started_at,
    completedAt: row.completed_at || undefined,
    status: row.status,
    domainsProcessed: row.domains_processed,
  };
}
