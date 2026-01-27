/**
 * UCP Merchant Discovery Service
 *
 * Exports the main crawler and storage APIs for use in routes.
 */

// Types
export * from './types.js';

// Storage (in-memory) - legacy, for backwards compatibility
export { merchantStore } from './storage.js';

// Storage (PostgreSQL) - individual functions
export * as pgStorage from './pg-storage.js';

// Storage (PostgreSQL) - unified store interface
export { store } from './store.js';

// Crawler
export {
  runFullCrawl,
  runIncrementalCrawl,
  addDomain,
  removeDomain,
  getCrawlerState,
  getCrawlerConfig,
  updateCrawlerConfig,
  isCrawlerRunning,
  // Progress events
  onCrawlerProgress,
  type CrawlerProgressEvent,
  // Scheduler
  startScheduler,
  stopScheduler,
  isSchedulerRunning,
} from './crawler.js';

// Validators
export { validateUCPProfile, validateAgentCard } from './validators.js';

// Fetchers
export { fetchUCPProfile, fetchAgentCard } from './fetchers.js';

// Seed Providers
export {
  fetchAllSeeds,
  normalizeDomain,
  inferRegionFromDomain,
  AwesomeUCPProvider,
  UCPToolsProvider,
  UCPCheckerProvider,
  ManualProvider,
} from './seed-providers.js';

// Scoring
export {
  calculateMerchantScore,
  scoreMerchants,
  rankMerchantsByScore,
  assignHealthTier,
  calculateNextCheckTime,
} from './scoring.js';

// Notifications
export {
  onNotification,
  trackTierChange,
  trackNewA2AMerchant,
  startNotificationTracking,
  stopNotificationTracking,
  getRecentNotifications,
  clearNotifications,
  type DiscoveryNotification,
} from './notifications.js';
