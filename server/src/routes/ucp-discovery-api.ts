/**
 * UCP Discovery API Routes
 *
 * REST API for the merchant discovery service:
 * - GET /merchants - List merchants with filtering
 * - GET /merchants/:id - Get merchant details
 * - POST /merchants - Manually add a domain
 * - DELETE /merchants/:domain - Remove a merchant
 * - POST /crawl/full - Run full crawl
 * - POST /crawl/incremental - Run incremental crawl
 * - GET /crawl/status - Get crawler status
 * - GET /stats - Get registry statistics
 */

import { Elysia, t } from 'elysia';
import {
  store,
  runFullCrawl,
  runIncrementalCrawl,
  addDomain,
  getCrawlerState,
  getCrawlerConfig,
  updateCrawlerConfig,
  isCrawlerRunning,
  startScheduler,
  stopScheduler,
  isSchedulerRunning,
  getRecentNotifications,
  clearNotifications,
  startNotificationTracking,
  onCrawlerProgress,
  type Region,
  type Merchant,
  type UCPProfileSnapshot,
  type AgentCardSnapshot,
  type CrawlerProgressEvent,
} from '../services/ucp-discovery/index.js';
import * as pgStorage from '../services/ucp-discovery/pg-storage.js';

// Store active WebSocket connections for crawler progress using a Map with unique IDs
let wsClientId = 0;
const crawlerProgressClients = new Map<number, {
  send: (data: string) => void;
  close: () => void;
}>();

// Subscribe to crawler progress and broadcast to all connected clients
onCrawlerProgress((event: CrawlerProgressEvent) => {
  const message = JSON.stringify(event);
  for (const [id, client] of crawlerProgressClients) {
    try {
      client.send(message);
    } catch {
      crawlerProgressClients.delete(id);
    }
  }
});

export const ucpDiscoveryApi = new Elysia({ prefix: '/api/ucp-discovery' })

  // ============================================================================
  // Merchant Endpoints
  // ============================================================================

  // List merchants with filtering
  .get('/merchants', async ({ query }) => {
    const {
      region,
      minScore,
      hasA2A,
      isActive,
      healthTier,
      page = '1',
      pageSize = '20',
    } = query;

    const filters: Parameters<typeof store.getMerchantsFiltered>[0] = {
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
    };

    if (region) filters.region = region as Region;
    if (minScore) filters.minScore = parseInt(minScore, 10);
    if (hasA2A === 'true') filters.hasA2A = true;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (healthTier) filters.healthTier = healthTier as 'A' | 'B' | 'C';

    const result = await store.getMerchantsFiltered(filters);

    return {
      merchants: result.merchants,
      total: result.total,
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
    };
  }, {
    query: t.Object({
      region: t.Optional(t.String()),
      minScore: t.Optional(t.String()),
      hasA2A: t.Optional(t.String()),
      isActive: t.Optional(t.String()),
      healthTier: t.Optional(t.String()),
      page: t.Optional(t.String()),
      pageSize: t.Optional(t.String()),
    }),
  })

  // Get merchant details
  .get('/merchants/:id', async ({ params }) => {
    const merchant = await store.getMerchantById(params.id);
    if (!merchant) {
      return { error: 'Merchant not found' };
    }

    const [sources, profile, agentCard, validationResults, crawlState, latestFetch] = await Promise.all([
      store.getSourcesForMerchant(params.id),
      store.getProfile(params.id),
      store.getAgentCard(params.id),
      store.getValidationResults(params.id),
      store.getCrawlState(params.id),
      pgStorage.getLatestUCPFetch(params.id),
    ]);

    return {
      merchant,
      sources,
      profile,
      agentCard,
      validationResults,
      crawlState,
      latestFetch: latestFetch ? {
        fetchedAt: latestFetch.fetchedAt,
        statusCode: latestFetch.statusCode,
        latencyMs: latestFetch.latencyMs,
        error: latestFetch.error,
      } : null,
    };
  })

  // Manually add a domain
  .post('/merchants', async ({ body }) => {
    const { domain, region } = body as { domain: string; region?: string };

    try {
      const result = await addDomain(domain, region as Region | undefined);
      const merchant = await store.getMerchantById(result.merchantId);

      return {
        success: true,
        merchant,
        isNew: result.isNew,
        isValid: result.isValid,
        hasA2A: result.hasA2A,
        score: result.score,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }, {
    body: t.Object({
      domain: t.String(),
      region: t.Optional(t.String()),
    }),
  })

  // Remove a merchant
  .delete('/merchants/:domain', async ({ params }) => {
    // First find merchant by domain
    const merchant = await store.getMerchantByDomain(params.domain);
    if (!merchant) {
      return { success: false, error: 'Merchant not found' };
    }
    const removed = await store.deleteMerchant(merchant.id);
    return { success: removed };
  })

  // ============================================================================
  // Crawler Endpoints
  // ============================================================================

  // Run full crawl
  .post('/crawl/full', async () => {
    if (isCrawlerRunning()) {
      return { error: 'Crawler is already running' };
    }

    try {
      const result = await runFullCrawl();
      return {
        success: true,
        ...result,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  })

  // Run incremental crawl
  .post('/crawl/incremental', async () => {
    if (isCrawlerRunning()) {
      return { error: 'Crawler is already running' };
    }

    try {
      const result = await runIncrementalCrawl();
      return {
        success: true,
        ...result,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  })

  // Get crawler status
  .get('/crawl/status', () => {
    return {
      ...getCrawlerState(),
      config: getCrawlerConfig(),
    };
  })

  // Update crawler config
  .patch('/crawl/config', ({ body }) => {
    const config = body as {
      concurrency?: number;
      perDomainConcurrency?: number;
      connectTimeout?: number;
      requestTimeout?: number;
      maxRedirects?: number;
      userAgent?: string;
      selectedRegion?: 'EU' | 'US' | 'CA' | 'OTHER';
    };
    updateCrawlerConfig({
      ...config,
      selectedRegion: config.selectedRegion as Region | undefined,
    });
    return { config: getCrawlerConfig() };
  }, {
    body: t.Object({
      concurrency: t.Optional(t.Number()),
      perDomainConcurrency: t.Optional(t.Number()),
      connectTimeout: t.Optional(t.Number()),
      requestTimeout: t.Optional(t.Number()),
      maxRedirects: t.Optional(t.Number()),
      userAgent: t.Optional(t.String()),
      selectedRegion: t.Optional(t.Union([t.Literal('EU'), t.Literal('US'), t.Literal('CA'), t.Literal('OTHER')])),
    }),
  })

  // ============================================================================
  // Statistics Endpoints
  // ============================================================================

  // Get registry statistics
  .get('/stats', async () => {
    const stats = await store.getStats();
    const crawlerState = getCrawlerState();

    return {
      ...stats,
      lastCrawlAt: crawlerState.lastRunAt,
      lastCrawlDuration: crawlerState.lastRunDuration,
    };
  })

  // Get merchants by health tier (for monitoring)
  .get('/health', async () => {
    const stats = await store.getStats();
    const dueSoon = await store.getMerchantsDueForCheck();

    return {
      healthy: stats.byHealthTier.A,
      degraded: stats.byHealthTier.B,
      failing: stats.byHealthTier.C,
      dueSoon: dueSoon.length,
      crawlerRunning: isCrawlerRunning(),
    };
  })

  // ============================================================================
  // Scheduler Endpoints
  // ============================================================================

  // Start background scheduler
  .post('/scheduler/start', ({ body }) => {
    const { intervalMs } = body as { intervalMs?: number };

    if (isSchedulerRunning()) {
      return { success: false, error: 'Scheduler is already running' };
    }

    startScheduler(intervalMs);
    startNotificationTracking();

    return {
      success: true,
      message: `Scheduler started with ${intervalMs || 3600000}ms interval`,
    };
  }, {
    body: t.Object({
      intervalMs: t.Optional(t.Number()),
    }),
  })

  // Stop background scheduler
  .post('/scheduler/stop', () => {
    if (!isSchedulerRunning()) {
      return { success: false, error: 'Scheduler is not running' };
    }

    stopScheduler();

    return { success: true, message: 'Scheduler stopped' };
  })

  // Get scheduler status
  .get('/scheduler/status', () => {
    return {
      running: isSchedulerRunning(),
    };
  })

  // ============================================================================
  // Notification Endpoints
  // ============================================================================

  // Get recent notifications
  .get('/notifications', ({ query }) => {
    const limit = query.limit ? parseInt(query.limit, 10) : 20;
    return {
      notifications: getRecentNotifications(limit),
    };
  }, {
    query: t.Object({
      limit: t.Optional(t.String()),
    }),
  })

  // Clear notifications
  .delete('/notifications', () => {
    clearNotifications();
    return { success: true };
  })

  // ============================================================================
  // WebSocket Endpoint for Crawler Progress
  // ============================================================================

  // WebSocket for real-time crawler progress updates
  .ws('/crawl/progress', {
    open(ws) {
      const clientId = ++wsClientId;
      (ws as unknown as { clientId: number }).clientId = clientId;
      const client = {
        send: (data: string) => ws.send(data),
        close: () => ws.close(),
      };
      crawlerProgressClients.set(clientId, client);
      ws.send(JSON.stringify({ type: 'connected', message: 'Connected to crawler progress stream' }));
    },
    close(ws) {
      const clientId = (ws as unknown as { clientId: number }).clientId;
      if (clientId) {
        crawlerProgressClients.delete(clientId);
      }
    },
    message(ws, message) {
      // Clients can send 'ping' to keep connection alive
      if (message === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    },
  })

  // ============================================================================
  // Export/Import Endpoints
  // ============================================================================

  // Export registry data
  .get('/export', async () => {
    const merchants = await store.getAllMerchants();
    const exportData = await Promise.all(merchants.map(async m => ({
      merchant: m,
      sources: await store.getSourcesForMerchant(m.id),
      profile: await store.getProfile(m.id),
      agentCard: await store.getAgentCard(m.id),
      crawlState: await store.getCrawlState(m.id),
      validationResults: await store.getValidationResults(m.id),
    })));

    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      count: merchants.length,
      data: exportData,
    };
  })

  // Import registry data
  .post('/import', async ({ body }) => {
    const { data, merge } = body as {
      data: Array<{
        merchant: Merchant;
        sources?: Array<{ id: string; domain: string; source: string; discoveredAt: string }>;
        profile?: Record<string, unknown>;
        agentCard?: Record<string, unknown>;
      }>;
      merge?: boolean;
    };

    if (!Array.isArray(data)) {
      return { success: false, error: 'Invalid import data format' };
    }

    let imported = 0;
    let skipped = 0;

    for (const item of data) {
      if (!item.merchant?.domain) {
        skipped++;
        continue;
      }

      const existing = await store.getMerchantById(item.merchant.id);

      if (existing && !merge) {
        skipped++;
        continue;
      }

      // Upsert merchant
      await store.upsertMerchant(item.merchant);

      // Restore profile if present (profile includes merchantId already from export)
      if (item.profile && item.profile.merchantId) {
        await store.setProfile(item.profile as unknown as UCPProfileSnapshot);
      }

      // Restore agent card if present (agentCard includes merchantId already from export)
      if (item.agentCard && item.agentCard.merchantId) {
        await store.setAgentCard(item.agentCard as unknown as AgentCardSnapshot);
      }

      imported++;
    }

    return {
      success: true,
      imported,
      skipped,
      total: data.length,
    };
  }, {
    body: t.Object({
      data: t.Array(t.Any()),
      merge: t.Optional(t.Boolean()),
    }),
  });

export default ucpDiscoveryApi;
