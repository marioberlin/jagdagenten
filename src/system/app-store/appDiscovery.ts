/**
 * App Discovery
 *
 * Discovers and validates app manifests from the applications/ directory
 * at startup. Uses the manifest.json files eagerly loaded by AppLoader
 * to populate the app store with locally available apps.
 */

import type { AppManifest } from './types';
import { getDiscoveredManifests } from './AppLoader';
import { useAppStoreStore } from './appStoreStore';
import { IntegrationRegistry } from './IntegrationRegistry';

// ============================================================================
// Manifest Validation
// ============================================================================

const REQUIRED_FIELDS: (keyof AppManifest)[] = [
  'id', 'name', 'version', 'description', 'author',
  'category', 'keywords', 'icon', 'entry', 'window',
  'integrations', 'capabilities',
];

/**
 * Validate that a manifest has all required fields.
 * Returns an array of validation errors (empty = valid).
 */
export function validateManifest(manifest: any): string[] {
  const errors: string[] = [];

  if (!manifest || typeof manifest !== 'object') {
    return ['Manifest is not a valid object'];
  }

  for (const field of REQUIRED_FIELDS) {
    if (!(field in manifest)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate id format (kebab-case)
  if (manifest.id && !/^[a-z0-9_/-]+$/.test(manifest.id)) {
    errors.push(`Invalid app ID format: ${manifest.id} (must be kebab-case/lowercase)`);
  }

  // Validate version (semver-like)
  if (manifest.version && !/^\d+\.\d+\.\d+/.test(manifest.version)) {
    errors.push(`Invalid version format: ${manifest.version} (must be semver)`);
  }

  // Validate window.mode
  if (manifest.window && !['panel', 'fullscreen', 'floating'].includes(manifest.window.mode)) {
    errors.push(`Invalid window mode: ${manifest.window.mode}`);
  }

  // Validate category
  const validCategories = [
    'productivity', 'communication', 'finance', 'weather',
    'travel', 'developer', 'utilities', 'entertainment', 'system',
  ];
  if (manifest.category && !validCategories.includes(manifest.category)) {
    errors.push(`Invalid category: ${manifest.category}`);
  }

  return errors;
}

// ============================================================================
// Discovery
// ============================================================================

/**
 * Discover all locally available apps and their manifests.
 * Returns validated manifests ready for registration.
 */
export function discoverLocalApps(): AppManifest[] {
  const rawManifests = getDiscoveredManifests();
  const validApps: AppManifest[] = [];

  for (const [appId, manifest] of Object.entries(rawManifests)) {
    const errors = validateManifest(manifest);

    if (errors.length > 0) {
      console.warn(
        `[AppDiscovery] Skipping invalid manifest for "${appId}":`,
        errors
      );
      continue;
    }

    // Ensure the manifest ID matches the directory name
    if (manifest.id !== appId) {
      console.warn(
        `[AppDiscovery] Manifest ID "${manifest.id}" doesn't match directory "${appId}", using directory name`
      );
      manifest.id = appId;
    }

    validApps.push(manifest as AppManifest);
  }

  console.info(`[AppDiscovery] Found ${validApps.length} valid apps`);
  return validApps;
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize the app store with locally discovered apps.
 * Should be called once at application startup.
 */
export function initializeAppStore(): void {
  const apps = discoverLocalApps();

  if (apps.length === 0) {
    console.info('[AppDiscovery] No local apps found');
    return;
  }

  // Register all apps in the store
  const store = useAppStoreStore.getState();
  const existingIds = new Set(Object.keys(store.installedApps));
  const discoveredIds = new Set(apps.map(a => a.id));

  // If persisted state has IDs that don't match any discovered app,
  // the data is stale (e.g., schema migration). Re-register everything.
  const hasStaleData = existingIds.size > 0 &&
    [...existingIds].every(id => !discoveredIds.has(id));

  if (existingIds.size === 0 || hasStaleData) {
    // First run or stale data — register all apps fresh
    store.registerLocalApps(apps);
  } else {
    // Remove apps that are no longer discovered (e.g., deleted from disk)
    const staleIds = [...existingIds].filter(id => !discoveredIds.has(id));
    for (const id of staleIds) {
      store.uninstallApp(id);
    }

    // Install truly new apps
    const newApps = apps.filter(app => !existingIds.has(app.id));
    for (const app of newApps) {
      store.installApp(app, 'local');
    }

    // Update manifests for existing apps (in case manifest changed)
    const existingApps = apps.filter(app => existingIds.has(app.id));
    for (const app of existingApps) {
      store.updateApp(app.id, app);
    }
  }

  // Register integrations for all installed apps
  const allInstalled = useAppStoreStore.getState().installedApps;
  for (const installedApp of Object.values(allInstalled)) {
    IntegrationRegistry.registerApp(installedApp);
  }

  console.info(
    `[AppDiscovery] Initialized: ${Object.keys(allInstalled).length} apps registered`
  );
}
