/**
 * A2A Video Store Module
 *
 * PostgreSQL persistence and Redis caching for A2A Video.
 */

// PostgreSQL persistence
export {
  initializePostgresStore,
  // Compositions
  createComposition,
  getComposition,
  listCompositions,
  updateComposition,
  deleteComposition,
  // Renders
  createRender,
  getRender,
  listRenders,
  updateRender,
  addRenderLog,
  getRenderLogs,
  // Assets
  createAsset,
  getAsset,
  getAssetByHash,
  listAssets,
  incrementAssetUsage,
  deleteAsset,
  getStorageStats,
  // Cleanup
  deleteOldRenders,
  deleteUnusedAssets,
  type CompositionRecord,
  type RenderRecord,
  type AssetRecord,
} from './postgres.js';

// Redis caching
export {
  initializeRedisCache,
  closeRedisCache,
  getRedisClient,
  // Render caching
  cacheRenderStatus,
  getCachedRenderStatus,
  invalidateRenderCache,
  cacheRenderProgress,
  getCachedRenderProgress,
  // Composition caching
  cacheComposition,
  getCachedComposition,
  invalidateCompositionCache,
  cacheCompositionList,
  getCachedCompositionList,
  invalidateCompositionListCache,
  // Asset caching
  cacheAsset,
  getCachedAsset,
  getAssetIdByHash,
  invalidateAssetCache,
  // Locking
  acquireLock,
  releaseLock,
  extendLock,
  // Rate limiting
  checkRateLimit,
  // Pub/Sub
  subscribeToRenderUpdates,
  publishRenderUpdate,
  // Stats
  getCacheStats,
  clearCache,
  type CacheConfig,
} from './redis.js';
