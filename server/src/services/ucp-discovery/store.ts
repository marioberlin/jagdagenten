/**
 * UCP Discovery Store
 *
 * Unified storage interface that uses PostgreSQL for persistence.
 * Provides the same interface as the in-memory merchantStore but backed by PostgreSQL.
 */

import * as pg from './pg-storage.js';
import type {
  Merchant,
  MerchantSource,
  UCPProfileSnapshot,
  AgentCardSnapshot,
  ValidationResult,
  CrawlState,
  Region,
  HealthTier,
} from './types.js';

/**
 * PostgreSQL-backed store with merchantStore-compatible interface
 */
export const store = {
  // Merchant operations
  getMerchantById: (id: string) => pg.getMerchantById(id),
  getMerchantByDomain: (domain: string) => pg.getMerchantByDomain(domain),
  getAllMerchants: () => pg.getAllMerchants().then(r => r.merchants),
  upsertMerchant: (merchant: Omit<Merchant, 'id' | 'createdAt'> & { id?: string }) => pg.upsertMerchant(merchant),
  deleteMerchant: (id: string) => pg.deleteMerchant(id),

  // Filtering
  getMerchantsFiltered: (filters?: {
    region?: Region;
    healthTier?: HealthTier;
    hasA2A?: boolean;
    isActive?: boolean;
    minScore?: number;
    page?: number;
    pageSize?: number;
  }) => pg.getAllMerchants(filters),

  // Sources
  addSource: (source: MerchantSource) => pg.addSource(source),
  getSourcesForMerchant: (merchantId: string) => pg.getSourcesForMerchant(merchantId),

  // Profiles
  setProfile: (profile: UCPProfileSnapshot) => pg.setProfile(profile),
  getProfile: (merchantId: string) => pg.getProfile(merchantId),

  // Agent Cards
  setAgentCard: (agentCard: AgentCardSnapshot) => pg.setAgentCard(agentCard),
  getAgentCard: (merchantId: string) => pg.getAgentCard(merchantId),

  // Validation
  addValidationResults: (results: ValidationResult[]) => pg.addValidationResults(results),
  getValidationResults: (merchantId: string) => pg.getValidationResults(merchantId),
  clearValidationResults: (merchantId: string) => pg.clearValidationResults(merchantId),

  // Crawl State
  getCrawlState: (merchantId: string) => pg.getCrawlState(merchantId),
  updateCrawlState: (merchantId: string, updates: Partial<CrawlState>) => pg.updateCrawlState(merchantId, updates),
  getMerchantsDueForCheck: (limit?: number) => pg.getMerchantsDueForCheck(limit),

  // Stats
  getStats: () => pg.getStats(),

  // Score
  updateMerchantScore: (merchantId: string, selectedRegion: Region) => pg.updateMerchantScore(merchantId, selectedRegion),

  // Crawler runs
  startCrawlerRun: (runType: 'full' | 'incremental') => pg.startCrawlerRun(runType),
  completeCrawlerRun: (runId: number, stats: {
    domainsDiscovered?: number;
    domainsProcessed: number;
    newMerchants?: number;
    updatedMerchants?: number;
    errors: string[];
  }) => pg.completeCrawlerRun(runId, stats),

  // A2A merchants
  getMerchantsWithA2A: () => pg.getMerchantsWithA2A(),
};

export type Store = typeof store;
