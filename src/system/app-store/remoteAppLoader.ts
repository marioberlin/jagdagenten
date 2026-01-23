/**
 * Remote App Loader
 *
 * Handles fetching, verifying, and loading app bundles from remote registries.
 * Supports two isolation strategies:
 * - Dynamic import: For trusted/verified apps (full integration)
 * - Iframe sandbox: For untrusted third-party apps (limited API)
 */

import type { AppManifest, AppCatalogEntry } from './types';
import { registerRemoteApp } from './AppLoader';
import { useAppStoreStore } from './appStoreStore';
import { IntegrationRegistry } from './IntegrationRegistry';
import { PermissionManager } from './permissions';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_REGISTRY_URL = '/api/v1/apps';

// ============================================================================
// Bundle Integrity Verification
// ============================================================================

/**
 * Verify the integrity of a downloaded bundle using SHA-256.
 */
async function verifyBundleIntegrity(
  bundleData: ArrayBuffer,
  expectedHash: string
): Promise<boolean> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', bundleData);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex === expectedHash;
}

// ============================================================================
// Registry API Client
// ============================================================================

/**
 * Fetch the catalog of available apps from the remote registry.
 */
export async function fetchCatalog(registryUrl: string = DEFAULT_REGISTRY_URL): Promise<AppCatalogEntry[]> {
  const store = useAppStoreStore.getState();
  store.setLoadingCatalog(true);

  try {
    const response = await fetch(registryUrl);
    if (!response.ok) {
      throw new Error(`Registry returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const entries: AppCatalogEntry[] = data.apps ?? data ?? [];
    store.setCatalog(entries);
    return entries;
  } catch (error) {
    console.error('[RemoteAppLoader] Failed to fetch catalog:', error);
    store.setLoadingCatalog(false);
    throw error;
  }
}

/**
 * Fetch a single app's details from the registry.
 */
export async function fetchAppDetails(
  appId: string,
  registryUrl: string = DEFAULT_REGISTRY_URL
): Promise<AppCatalogEntry | null> {
  try {
    const response = await fetch(`${registryUrl}/${appId}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(`[RemoteAppLoader] Failed to fetch app ${appId}:`, error);
    return null;
  }
}

/**
 * Search apps in the registry.
 */
export async function searchApps(
  query: string,
  registryUrl: string = DEFAULT_REGISTRY_URL
): Promise<AppCatalogEntry[]> {
  try {
    const response = await fetch(
      `${registryUrl}/search?q=${encodeURIComponent(query)}`
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data.apps ?? data ?? [];
  } catch (error) {
    console.error('[RemoteAppLoader] Search failed:', error);
    return [];
  }
}

// ============================================================================
// Bundle Download & Loading
// ============================================================================

/**
 * Download and install a remote app bundle.
 * Handles integrity verification, permission checks, and registration.
 */
export async function installRemoteApp(manifest: AppManifest): Promise<void> {
  const store = useAppStoreStore.getState();

  if (!manifest.remote?.sourceUrl) {
    throw new Error(`App ${manifest.id} has no remote source URL`);
  }

  // Mark as installing
  store.installApp(manifest, 'remote');
  store.setAppStatus(manifest.id, 'installing');

  try {
    // Download the bundle
    const bundleUrl = `${manifest.remote.sourceUrl}/bundle`;
    const response = await fetch(bundleUrl);

    if (!response.ok) {
      throw new Error(`Failed to download bundle: ${response.status}`);
    }

    const bundleData = await response.arrayBuffer();

    // Verify integrity if hash is provided
    if (manifest.remote.integrity) {
      const isValid = await verifyBundleIntegrity(bundleData, manifest.remote.integrity);
      if (!isValid) {
        throw new Error('Bundle integrity check failed - file may be corrupted or tampered');
      }
    }

    // Check if this should be sandboxed
    if (manifest.remote.sandbox) {
      // Sandboxed apps are loaded via iframe - store the blob URL
      const blob = new Blob([bundleData], { type: 'text/javascript' });
      const blobUrl = URL.createObjectURL(blob);

      // Register as iframe-loaded app
      registerRemoteApp(manifest.id, async () => {
        // Return a wrapper component that renders an iframe
        const { createSandboxedApp } = await import('./SandboxedApp');
        return { default: createSandboxedApp(manifest.id, blobUrl) };
      });
    } else {
      // Trusted apps: create a blob URL and dynamic import
      const blob = new Blob([bundleData], { type: 'text/javascript' });
      const blobUrl = URL.createObjectURL(blob);

      registerRemoteApp(manifest.id, () => import(/* @vite-ignore */ blobUrl));
    }

    // Grant auto-granted permissions
    PermissionManager.grantAll(manifest.id, manifest.capabilities.filter(
      cap => ['storage:local', 'storage:indexeddb', 'notification:toast', 'system:fullscreen'].includes(cap)
    ));

    // Register integrations
    const installedApp = useAppStoreStore.getState().installedApps[manifest.id];
    if (installedApp) {
      IntegrationRegistry.registerApp(installedApp);
    }

    // Mark as installed
    store.setAppStatus(manifest.id, 'installed');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    store.setAppStatus(manifest.id, 'error', message);
    throw error;
  }
}

/**
 * Check for available updates for all installed remote apps.
 * Returns a map of appId -> latest available version.
 */
export async function checkForUpdates(): Promise<Record<string, string>> {
  const store = useAppStoreStore.getState();
  const updates: Record<string, string> = {};

  const remoteApps = Object.values(store.installedApps)
    .filter(app => app.source === 'remote' && app.manifest.remote?.sourceUrl);

  for (const app of remoteApps) {
    try {
      const details = await fetchAppDetails(app.id);
      if (details && details.manifest.version !== app.version) {
        updates[app.id] = details.manifest.version;
      }
    } catch {
      // Skip apps that can't be checked
    }
  }

  return updates;
}

/**
 * Uninstall a remote app and clean up its resources.
 */
export function uninstallRemoteApp(appId: string): void {
  // Clean up integration registrations
  IntegrationRegistry.unregisterApp(appId);

  // Clear permissions
  PermissionManager.clearAppPermissions(appId);

  // Remove from store
  useAppStoreStore.getState().uninstallApp(appId);
}
