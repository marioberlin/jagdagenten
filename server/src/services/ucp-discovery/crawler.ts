/**
 * UCP Merchant Discovery Crawler
 *
 * Main orchestrator that coordinates:
 * 1. Seed harvesting from directories
 * 2. Domain normalization and deduplication
 * 3. UCP profile fetching and validation
 * 4. A2A Agent Card verification
 * 5. Scoring and scheduling
 *
 * Features:
 * - Concurrent crawling with p-limit
 * - Per-domain rate limiting
 * - WebSocket progress updates
 * - Background scheduler
 */

import type { Region, CrawlerConfig } from './types.js';
import { fetchAllSeeds, normalizeDomain, inferRegionFromDomain, type DiscoveredDomain } from './seed-providers.js';
import { fetchUCPProfile, fetchAgentCard } from './fetchers.js';
import { validateUCPProfile, validateAgentCard } from './validators.js';
import { merchantStore } from './storage.js';

// ============================================================================
// Concurrency Control (p-limit pattern)
// ============================================================================

function pLimit(concurrency: number) {
  const queue: Array<() => void> = [];
  let activeCount = 0;

  const next = () => {
    activeCount--;
    if (queue.length > 0) {
      queue.shift()!();
    }
  };

  return <T>(fn: () => Promise<T>): Promise<T> => {
    return new Promise((resolve, reject) => {
      const run = async () => {
        activeCount++;
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          next();
        }
      };

      if (activeCount < concurrency) {
        run();
      } else {
        queue.push(run);
      }
    });
  };
}

// ============================================================================
// Rate Limiting (per-domain)
// ============================================================================

const domainLastRequest = new Map<string, number>();
const MIN_DOMAIN_DELAY_MS = 1000; // 1 second between requests to same domain

async function rateLimitedDelay(domain: string): Promise<void> {
  const now = Date.now();
  const lastRequest = domainLastRequest.get(domain) || 0;
  const elapsed = now - lastRequest;

  if (elapsed < MIN_DOMAIN_DELAY_MS) {
    await new Promise(resolve => setTimeout(resolve, MIN_DOMAIN_DELAY_MS - elapsed));
  }

  domainLastRequest.set(domain, Date.now());
}

// ============================================================================
// Progress Events (WebSocket)
// ============================================================================

type ProgressCallback = (event: CrawlerProgressEvent) => void;

export interface CrawlerProgressEvent {
  type: 'started' | 'progress' | 'completed' | 'error';
  phase?: string;
  current?: number;
  total?: number;
  domain?: string;
  message?: string;
  stats?: {
    newMerchants: number;
    updatedMerchants: number;
    errors: number;
  };
}

let progressCallbacks: ProgressCallback[] = [];

export function onCrawlerProgress(callback: ProgressCallback): () => void {
  progressCallbacks.push(callback);
  return () => {
    progressCallbacks = progressCallbacks.filter(cb => cb !== callback);
  };
}

function emitProgress(event: CrawlerProgressEvent): void {
  for (const callback of progressCallbacks) {
    try {
      callback(event);
    } catch (e) {
      console.error('[Crawler] Progress callback error:', e);
    }
  }
}

// ============================================================================
// Crawler State
// ============================================================================

interface CrawlerState {
  isRunning: boolean;
  lastRunAt?: string;
  lastRunDuration?: number;
  domainsProcessed: number;
  domainsDiscovered: number;
  currentDomain?: string;
  currentPhase?: string;
  errors: string[];
}

let crawlerState: CrawlerState = {
  isRunning: false,
  domainsProcessed: 0,
  domainsDiscovered: 0,
  errors: [],
};

// ============================================================================
// Crawler Configuration
// ============================================================================

let crawlerConfig: CrawlerConfig = {
  concurrency: 50,
  perDomainConcurrency: 2,
  connectTimeout: 3000,
  requestTimeout: 15000,
  maxRedirects: 5,
  userAgent: 'UCPDiscovery/1.0 (+https://ucp.dev/crawler)',
  selectedRegion: 'EU',
};

export function updateCrawlerConfig(config: Partial<CrawlerConfig>): void {
  crawlerConfig = { ...crawlerConfig, ...config };
}

export function getCrawlerConfig(): CrawlerConfig {
  return { ...crawlerConfig };
}

// ============================================================================
// Background Scheduler
// ============================================================================

let schedulerInterval: ReturnType<typeof setInterval> | null = null;
let schedulerEnabled = false;

export function startScheduler(intervalMs = 3600000): void { // Default: 1 hour
  if (schedulerInterval) {
    console.log('[Crawler] Scheduler already running');
    return;
  }

  schedulerEnabled = true;
  console.log(`[Crawler] Starting scheduler with interval ${intervalMs}ms`);

  schedulerInterval = setInterval(async () => {
    if (!schedulerEnabled || crawlerState.isRunning) {
      return;
    }

    try {
      console.log('[Crawler] Scheduler: Running incremental crawl...');
      await runIncrementalCrawl();
    } catch (error) {
      console.error('[Crawler] Scheduler error:', error);
    }
  }, intervalMs);

  // Also run immediately on start
  if (!crawlerState.isRunning) {
    runIncrementalCrawl().catch(console.error);
  }
}

export function stopScheduler(): void {
  schedulerEnabled = false;
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[Crawler] Scheduler stopped');
  }
}

export function isSchedulerRunning(): boolean {
  return schedulerEnabled && schedulerInterval !== null;
}

// ============================================================================
// Main Crawler Pipeline
// ============================================================================

/**
 * Run a full crawl cycle:
 * 1. Discover domains from seed providers
 * 2. Process each domain (fetch, validate, score)
 * 3. Update registry
 */
export async function runFullCrawl(): Promise<{
  domainsDiscovered: number;
  domainsProcessed: number;
  newMerchants: number;
  updatedMerchants: number;
  errors: string[];
}> {
  if (crawlerState.isRunning) {
    throw new Error('Crawler is already running');
  }

  crawlerState = {
    isRunning: true,
    domainsProcessed: 0,
    domainsDiscovered: 0,
    currentPhase: 'discovering',
    errors: [],
  };

  emitProgress({ type: 'started', phase: 'discovering' });

  const startTime = Date.now();
  let newMerchants = 0;
  let updatedMerchants = 0;

  try {
    // Stage 1: Discover domains from seed providers
    console.log('[Crawler] Stage 1: Discovering domains from seed providers...');
    crawlerState.currentPhase = 'discovering';
    emitProgress({ type: 'progress', phase: 'discovering', message: 'Fetching seed providers...' });

    const discoveredDomains = await fetchAllSeeds();
    crawlerState.domainsDiscovered = discoveredDomains.length;
    console.log(`[Crawler] Discovered ${discoveredDomains.length} domains`);

    emitProgress({
      type: 'progress',
      phase: 'discovered',
      total: discoveredDomains.length,
      message: `Discovered ${discoveredDomains.length} domains`,
    });

    // Stage 2: Process each domain with concurrency
    console.log('[Crawler] Stage 2: Processing domains...');
    crawlerState.currentPhase = 'processing';

    const limit = pLimit(crawlerConfig.concurrency);

    const results = await Promise.all(
      discoveredDomains.map(discovered =>
        limit(async () => {
          try {
            // Rate limit per domain
            await rateLimitedDelay(normalizeDomain(discovered.domain));

            crawlerState.currentDomain = discovered.domain;
            emitProgress({
              type: 'progress',
              phase: 'processing',
              current: crawlerState.domainsProcessed,
              total: discoveredDomains.length,
              domain: discovered.domain,
            });

            const result = await processDomain(discovered);
            crawlerState.domainsProcessed++;

            return result;
          } catch (error) {
            const errorMsg = `Failed to process ${discovered.domain}: ${error}`;
            crawlerState.errors.push(errorMsg);
            console.error(`[Crawler] ${errorMsg}`);
            crawlerState.domainsProcessed++;
            return null;
          }
        })
      )
    );

    // Count results
    for (const result of results) {
      if (result) {
        if (result.isNew) newMerchants++;
        else updatedMerchants++;
      }
    }

    crawlerState.lastRunAt = new Date().toISOString();
    crawlerState.lastRunDuration = Date.now() - startTime;
    crawlerState.currentPhase = 'completed';
    crawlerState.currentDomain = undefined;

    console.log(`[Crawler] Completed in ${crawlerState.lastRunDuration}ms`);
    console.log(`[Crawler] New: ${newMerchants}, Updated: ${updatedMerchants}, Errors: ${crawlerState.errors.length}`);

    emitProgress({
      type: 'completed',
      stats: { newMerchants, updatedMerchants, errors: crawlerState.errors.length },
      message: `Crawl completed: ${newMerchants} new, ${updatedMerchants} updated`,
    });

    return {
      domainsDiscovered: crawlerState.domainsDiscovered,
      domainsProcessed: crawlerState.domainsProcessed,
      newMerchants,
      updatedMerchants,
      errors: crawlerState.errors,
    };
  } catch (error) {
    emitProgress({ type: 'error', message: String(error) });
    throw error;
  } finally {
    crawlerState.isRunning = false;
    crawlerState.currentPhase = undefined;
    crawlerState.currentDomain = undefined;
  }
}

/**
 * Run incremental crawl (only merchants due for recheck)
 */
export async function runIncrementalCrawl(): Promise<{
  merchantsChecked: number;
  merchantsUpdated: number;
  errors: string[];
}> {
  if (crawlerState.isRunning) {
    throw new Error('Crawler is already running');
  }

  crawlerState = {
    isRunning: true,
    domainsProcessed: 0,
    domainsDiscovered: 0,
    currentPhase: 'incremental',
    errors: [],
  };

  emitProgress({ type: 'started', phase: 'incremental' });

  const startTime = Date.now();
  let merchantsUpdated = 0;

  try {
    // Get merchants due for recheck
    const dueForCheck = merchantStore.getMerchantsDueForCheck();
    console.log(`[Crawler] Incremental crawl: ${dueForCheck.length} merchants due for check`);

    emitProgress({
      type: 'progress',
      phase: 'incremental',
      total: dueForCheck.length,
      message: `Checking ${dueForCheck.length} merchants`,
    });

    const limit = pLimit(crawlerConfig.concurrency);

    await Promise.all(
      dueForCheck.map(merchant =>
        limit(async () => {
          try {
            // Rate limit per domain
            await rateLimitedDelay(merchant.domain);

            crawlerState.currentDomain = merchant.domain;
            emitProgress({
              type: 'progress',
              phase: 'incremental',
              current: crawlerState.domainsProcessed,
              total: dueForCheck.length,
              domain: merchant.domain,
            });

            await recheckMerchant(merchant.id);
            merchantsUpdated++;
            crawlerState.domainsProcessed++;
          } catch (error) {
            const errorMsg = `Failed to recheck ${merchant.domain}: ${error}`;
            crawlerState.errors.push(errorMsg);
            console.error(`[Crawler] ${errorMsg}`);
            crawlerState.domainsProcessed++;
          }
        })
      )
    );

    crawlerState.lastRunAt = new Date().toISOString();
    crawlerState.lastRunDuration = Date.now() - startTime;

    emitProgress({
      type: 'completed',
      stats: { newMerchants: 0, updatedMerchants: merchantsUpdated, errors: crawlerState.errors.length },
      message: `Incremental crawl completed: ${merchantsUpdated} updated`,
    });

    return {
      merchantsChecked: dueForCheck.length,
      merchantsUpdated,
      errors: crawlerState.errors,
    };
  } catch (error) {
    emitProgress({ type: 'error', message: String(error) });
    throw error;
  } finally {
    crawlerState.isRunning = false;
    crawlerState.currentPhase = undefined;
    crawlerState.currentDomain = undefined;
  }
}

// ============================================================================
// Domain Processing
// ============================================================================

interface ProcessResult {
  merchantId: string;
  isNew: boolean;
  isValid: boolean;
  hasA2A: boolean;
  score: number;
}

/**
 * Process a single domain:
 * 1. Normalize and dedupe
 * 2. Fetch UCP profile
 * 3. Validate profile
 * 4. If A2A, fetch and validate Agent Card
 * 5. Calculate score
 */
async function processDomain(discovered: DiscoveredDomain): Promise<ProcessResult> {
  const domain = normalizeDomain(discovered.domain);

  // Check if merchant exists
  let merchant = merchantStore.getMerchantByDomain(domain);
  const isNew = !merchant;

  if (!merchant) {
    // Create new merchant
    const region = inferRegionFromDomain(domain);
    merchant = merchantStore.upsertMerchant({
      domain,
      region,
      score: 0,
      isActive: true,
      updatedAt: new Date().toISOString(),
    });

    // Add source
    merchantStore.addSource({
      merchantId: merchant.id,
      sourceType: discovered.sourceType,
      sourceUrl: discovered.sourceUrl,
      discoveredAt: discovered.discoveredAt,
    });
  }

  // Fetch UCP profile
  const fetchResult = await fetchUCPProfile(merchant.id, domain, {}, crawlerConfig);
  merchantStore.addUCPFetch(fetchResult);

  let isValid = false;
  let hasA2A = false;

  if (fetchResult.bodyJson) {
    // Validate profile
    merchantStore.clearValidationResults(merchant.id);
    const validation = validateUCPProfile(merchant.id, fetchResult.bodyJson);
    merchantStore.addValidationResults(validation.results);

    isValid = validation.isValid;

    if (validation.profile) {
      merchantStore.setProfile(validation.profile);
      hasA2A = validation.profile.hasA2A;

      // If A2A, fetch Agent Card
      if (validation.profile.a2aAgentCardUrl) {
        // Rate limit for agent card request
        await rateLimitedDelay(domain);

        const agentFetch = await fetchAgentCard(
          merchant.id,
          validation.profile.a2aAgentCardUrl,
          {},
          crawlerConfig
        );
        merchantStore.addAgentCardFetch(agentFetch);

        if (agentFetch.bodyJson) {
          const agentValidation = validateAgentCard(merchant.id, agentFetch.bodyJson);
          merchantStore.addValidationResults(agentValidation.results);

          if (agentValidation.agentCard) {
            merchantStore.setAgentCard(agentValidation.agentCard);
          }
        }
      }
    }

    // Update crawl state on success
    merchantStore.updateCrawlState(merchant.id, {
      consecutiveFailures: 0,
      lastSuccessAt: new Date().toISOString(),
    });
  } else {
    // Update crawl state on failure
    const currentState = merchantStore.getCrawlState(merchant.id);
    merchantStore.updateCrawlState(merchant.id, {
      consecutiveFailures: (currentState?.consecutiveFailures || 0) + 1,
      lastErrorAt: new Date().toISOString(),
    });
  }

  // Calculate score
  const score = merchantStore.updateMerchantScore(merchant.id, crawlerConfig.selectedRegion);

  return {
    merchantId: merchant.id,
    isNew,
    isValid,
    hasA2A,
    score,
  };
}

/**
 * Recheck an existing merchant
 */
async function recheckMerchant(merchantId: string): Promise<void> {
  const merchant = merchantStore.getMerchantById(merchantId);
  if (!merchant) {
    throw new Error(`Merchant ${merchantId} not found`);
  }

  // Get last fetch for conditional request
  const lastFetch = merchantStore.getLatestUCPFetch(merchantId);

  // Fetch UCP profile with conditional headers
  const fetchResult = await fetchUCPProfile(
    merchantId,
    merchant.domain,
    {
      etag: lastFetch?.etag,
      lastModified: lastFetch?.lastModified,
    },
    crawlerConfig
  );

  merchantStore.addUCPFetch(fetchResult);

  // 304 Not Modified - no changes needed
  if (fetchResult.statusCode === 304) {
    merchantStore.updateCrawlState(merchantId, {
      consecutiveFailures: 0,
      lastSuccessAt: new Date().toISOString(),
    });
    merchantStore.updateMerchantScore(merchantId, crawlerConfig.selectedRegion);
    return;
  }

  // Process as normal
  if (fetchResult.bodyJson) {
    merchantStore.clearValidationResults(merchantId);
    const validation = validateUCPProfile(merchantId, fetchResult.bodyJson);
    merchantStore.addValidationResults(validation.results);

    if (validation.profile) {
      merchantStore.setProfile(validation.profile);

      // Fetch Agent Card if A2A
      if (validation.profile.a2aAgentCardUrl) {
        // Rate limit for agent card request
        await rateLimitedDelay(merchant.domain);

        const agentFetch = await fetchAgentCard(
          merchantId,
          validation.profile.a2aAgentCardUrl,
          {},
          crawlerConfig
        );
        merchantStore.addAgentCardFetch(agentFetch);

        if (agentFetch.bodyJson) {
          const agentValidation = validateAgentCard(merchantId, agentFetch.bodyJson);
          merchantStore.addValidationResults(agentValidation.results);

          if (agentValidation.agentCard) {
            merchantStore.setAgentCard(agentValidation.agentCard);
          }
        }
      }
    }

    merchantStore.updateCrawlState(merchantId, {
      consecutiveFailures: 0,
      lastSuccessAt: new Date().toISOString(),
    });
  } else {
    const currentState = merchantStore.getCrawlState(merchantId);
    merchantStore.updateCrawlState(merchantId, {
      consecutiveFailures: (currentState?.consecutiveFailures || 0) + 1,
      lastErrorAt: new Date().toISOString(),
    });
  }

  merchantStore.updateMerchantScore(merchantId, crawlerConfig.selectedRegion);
}

// ============================================================================
// Crawler State Access
// ============================================================================

export function getCrawlerState(): CrawlerState {
  return { ...crawlerState };
}

export function isCrawlerRunning(): boolean {
  return crawlerState.isRunning;
}

// ============================================================================
// Manual Operations
// ============================================================================

/**
 * Manually add a domain to the registry
 */
export async function addDomain(domain: string, region?: Region): Promise<ProcessResult> {
  const normalized = normalizeDomain(domain);
  const discovered: DiscoveredDomain = {
    domain: normalized,
    sourceType: 'manual',
    sourceUrl: 'manual',
    discoveredAt: new Date().toISOString(),
  };

  const result = await processDomain(discovered);

  // Override region if specified
  if (region) {
    const merchant = merchantStore.getMerchantById(result.merchantId);
    if (merchant) {
      merchantStore.upsertMerchant({ ...merchant, region });
    }
  }

  return result;
}

/**
 * Remove a merchant from the registry
 */
export function removeDomain(domain: string): boolean {
  const merchant = merchantStore.getMerchantByDomain(normalizeDomain(domain));
  if (merchant) {
    merchantStore.upsertMerchant({ ...merchant, isActive: false });
    return true;
  }
  return false;
}
