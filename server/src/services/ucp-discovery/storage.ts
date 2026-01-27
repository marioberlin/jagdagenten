/**
 * UCP Discovery Storage Layer
 *
 * In-memory storage with optional SQLite persistence.
 * Provides CRUD operations for merchants, profiles, and crawl state.
 */

import type {
  Merchant,
  MerchantSource,
  UCPFetchResult,
  UCPProfileSnapshot,
  AgentCardFetch,
  AgentCardSnapshot,
  ValidationResult,
  CrawlState,
  Region,
  HealthTier,
} from './types.js';
import { calculateMerchantScore, assignHealthTier, calculateNextCheckTime } from './scoring.js';

// ============================================================================
// In-Memory Storage (can be replaced with SQLite/Postgres)
// ============================================================================

class MerchantStore {
  private merchants = new Map<string, Merchant>();
  private sources = new Map<string, MerchantSource[]>();
  private ucpFetches = new Map<string, UCPFetchResult[]>();
  private profiles = new Map<string, UCPProfileSnapshot>();
  private agentCardFetches = new Map<string, AgentCardFetch[]>();
  private agentCards = new Map<string, AgentCardSnapshot>();
  private validationResults = new Map<string, ValidationResult[]>();
  private crawlStates = new Map<string, CrawlState>();

  // Domain to merchant ID mapping for deduplication
  private domainIndex = new Map<string, string>();

  // ============================================================================
  // Merchant Operations
  // ============================================================================

  getMerchantById(id: string): Merchant | undefined {
    return this.merchants.get(id);
  }

  getMerchantByDomain(domain: string): Merchant | undefined {
    const id = this.domainIndex.get(domain);
    return id ? this.merchants.get(id) : undefined;
  }

  upsertMerchant(merchant: Omit<Merchant, 'id' | 'createdAt'> & { id?: string }): Merchant {
    const existing = this.domainIndex.get(merchant.domain);

    if (existing) {
      // Update existing merchant
      const current = this.merchants.get(existing)!;
      const updated: Merchant = {
        ...current,
        ...merchant,
        id: existing,
        updatedAt: new Date().toISOString(),
      };
      this.merchants.set(existing, updated);
      return updated;
    }

    // Create new merchant
    const id = merchant.id || `merchant-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const now = new Date().toISOString();
    const newMerchant: Merchant = {
      id,
      domain: merchant.domain,
      region: merchant.region,
      score: merchant.score,
      isActive: merchant.isActive,
      createdAt: now,
      updatedAt: now,
    };

    this.merchants.set(id, newMerchant);
    this.domainIndex.set(merchant.domain, id);

    // Initialize crawl state
    this.crawlStates.set(id, {
      merchantId: id,
      nextCheckAt: new Date().toISOString(),
      consecutiveFailures: 0,
      healthTier: 'B',
    });

    return newMerchant;
  }

  getAllMerchants(): Merchant[] {
    return Array.from(this.merchants.values());
  }

  getMerchantsByRegion(region: Region): Merchant[] {
    return this.getAllMerchants().filter(m => m.region === region);
  }

  getMerchantsByScore(minScore: number): Merchant[] {
    return this.getAllMerchants().filter(m => m.score >= minScore);
  }

  getActiveMerchants(): Merchant[] {
    return this.getAllMerchants().filter(m => m.isActive);
  }

  getMerchantsWithA2A(): Merchant[] {
    return this.getAllMerchants().filter(m => {
      const profile = this.profiles.get(m.id);
      return profile?.hasA2A;
    });
  }

  // ============================================================================
  // Source Operations
  // ============================================================================

  addSource(source: Omit<MerchantSource, 'id'>): MerchantSource {
    const id = `source-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newSource: MerchantSource = { ...source, id };

    const existing = this.sources.get(source.merchantId) || [];
    existing.push(newSource);
    this.sources.set(source.merchantId, existing);

    return newSource;
  }

  getSourcesForMerchant(merchantId: string): MerchantSource[] {
    return this.sources.get(merchantId) || [];
  }

  // ============================================================================
  // UCP Fetch Operations
  // ============================================================================

  addUCPFetch(fetch: UCPFetchResult): void {
    const existing = this.ucpFetches.get(fetch.merchantId) || [];
    existing.push(fetch);
    // Keep only last 10 fetches
    if (existing.length > 10) {
      existing.shift();
    }
    this.ucpFetches.set(fetch.merchantId, existing);
  }

  getLatestUCPFetch(merchantId: string): UCPFetchResult | undefined {
    const fetches = this.ucpFetches.get(merchantId);
    return fetches?.[fetches.length - 1];
  }

  // ============================================================================
  // Profile Operations
  // ============================================================================

  setProfile(profile: UCPProfileSnapshot): void {
    this.profiles.set(profile.merchantId, profile);
  }

  getProfile(merchantId: string): UCPProfileSnapshot | undefined {
    return this.profiles.get(merchantId);
  }

  // ============================================================================
  // Agent Card Operations
  // ============================================================================

  addAgentCardFetch(fetch: AgentCardFetch): void {
    const existing = this.agentCardFetches.get(fetch.merchantId) || [];
    existing.push(fetch);
    if (existing.length > 10) {
      existing.shift();
    }
    this.agentCardFetches.set(fetch.merchantId, existing);
  }

  setAgentCard(agentCard: AgentCardSnapshot): void {
    this.agentCards.set(agentCard.merchantId, agentCard);
  }

  getAgentCard(merchantId: string): AgentCardSnapshot | undefined {
    return this.agentCards.get(merchantId);
  }

  // ============================================================================
  // Validation Operations
  // ============================================================================

  addValidationResults(results: ValidationResult[]): void {
    for (const result of results) {
      const existing = this.validationResults.get(result.merchantId) || [];
      existing.push(result);
      // Keep only last 50 results
      if (existing.length > 50) {
        existing.shift();
      }
      this.validationResults.set(result.merchantId, existing);
    }
  }

  getValidationResults(merchantId: string): ValidationResult[] {
    return this.validationResults.get(merchantId) || [];
  }

  clearValidationResults(merchantId: string): void {
    this.validationResults.delete(merchantId);
  }

  // ============================================================================
  // Crawl State Operations
  // ============================================================================

  getCrawlState(merchantId: string): CrawlState | undefined {
    return this.crawlStates.get(merchantId);
  }

  updateCrawlState(merchantId: string, update: Partial<CrawlState>): CrawlState {
    const current = this.crawlStates.get(merchantId) || {
      merchantId,
      nextCheckAt: new Date().toISOString(),
      consecutiveFailures: 0,
      healthTier: 'B' as HealthTier,
    };

    const updated: CrawlState = { ...current, ...update };
    this.crawlStates.set(merchantId, updated);
    return updated;
  }

  getMerchantsDueForCheck(): Merchant[] {
    const now = new Date();
    return this.getAllMerchants().filter(m => {
      const state = this.crawlStates.get(m.id);
      if (!state) return true;
      return new Date(state.nextCheckAt) <= now;
    });
  }

  // ============================================================================
  // Score Update
  // ============================================================================

  updateMerchantScore(merchantId: string, selectedRegion: Region = 'EU'): number {
    const merchant = this.merchants.get(merchantId);
    if (!merchant) return 0;

    const profile = this.profiles.get(merchantId);
    const agentCard = this.agentCards.get(merchantId);
    const validationResults = this.validationResults.get(merchantId) || [];
    const crawlState = this.crawlStates.get(merchantId);
    const latestFetch = this.getLatestUCPFetch(merchantId);

    const score = calculateMerchantScore({
      merchantId,
      domain: merchant.domain,
      region: merchant.region,
      profile,
      agentCard,
      validationResults,
      crawlState,
      lastFetchLatencyMs: latestFetch?.latencyMs,
      selectedRegion,
    });

    // Update merchant score
    merchant.score = score;
    merchant.updatedAt = new Date().toISOString();
    this.merchants.set(merchantId, merchant);

    // Update health tier and next check time
    if (crawlState) {
      const tier = assignHealthTier(score, crawlState.consecutiveFailures);
      const nextCheck = calculateNextCheckTime(tier, crawlState.consecutiveFailures);
      this.updateCrawlState(merchantId, {
        healthTier: tier,
        nextCheckAt: nextCheck.toISOString(),
      });
    }

    return score;
  }

  // ============================================================================
  // Statistics
  // ============================================================================

  getStats(): {
    totalMerchants: number;
    activeMerchants: number;
    byRegion: Record<Region, number>;
    byHealthTier: Record<HealthTier, number>;
    validPercentage: number;
    withA2A: number;
  } {
    const merchants = this.getAllMerchants();
    const active = this.getActiveMerchants();

    const byRegion: Record<Region, number> = { EU: 0, US: 0, CA: 0, OTHER: 0 };
    const byHealthTier: Record<HealthTier, number> = { A: 0, B: 0, C: 0 };

    let validCount = 0;
    let a2aCount = 0;

    for (const m of merchants) {
      byRegion[m.region]++;

      const state = this.crawlStates.get(m.id);
      if (state) {
        byHealthTier[state.healthTier]++;
      }

      const profile = this.profiles.get(m.id);
      if (profile) {
        validCount++;
        if (profile.hasA2A) {
          a2aCount++;
        }
      }
    }

    return {
      totalMerchants: merchants.length,
      activeMerchants: active.length,
      byRegion,
      byHealthTier,
      validPercentage: merchants.length > 0 ? (validCount / merchants.length) * 100 : 0,
      withA2A: a2aCount,
    };
  }

  // ============================================================================
  // Export/Import for Persistence
  // ============================================================================

  exportData(): string {
    return JSON.stringify({
      merchants: Array.from(this.merchants.entries()),
      sources: Array.from(this.sources.entries()),
      profiles: Array.from(this.profiles.entries()),
      agentCards: Array.from(this.agentCards.entries()),
      validationResults: Array.from(this.validationResults.entries()),
      crawlStates: Array.from(this.crawlStates.entries()),
      domainIndex: Array.from(this.domainIndex.entries()),
    });
  }

  importData(json: string): void {
    const data = JSON.parse(json);
    this.merchants = new Map(data.merchants);
    this.sources = new Map(data.sources);
    this.profiles = new Map(data.profiles);
    this.agentCards = new Map(data.agentCards);
    this.validationResults = new Map(data.validationResults);
    this.crawlStates = new Map(data.crawlStates);
    this.domainIndex = new Map(data.domainIndex);
  }

  clear(): void {
    this.merchants.clear();
    this.sources.clear();
    this.ucpFetches.clear();
    this.profiles.clear();
    this.agentCardFetches.clear();
    this.agentCards.clear();
    this.validationResults.clear();
    this.crawlStates.clear();
    this.domainIndex.clear();
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const merchantStore = new MerchantStore();

export default merchantStore;
