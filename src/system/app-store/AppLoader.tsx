/**
 * App Loader
 *
 * Dynamically discovers and loads app components from the applications/ directory
 * using Vite's import.meta.glob for build-time discovery and React.lazy for
 * code-split loading.
 *
 * Also supports Quick Apps - single-file apps that are compiled in the browser.
 */

import React, { useMemo, useState, useEffect } from 'react';
import { useQuickAppStore } from '../quick-apps/quickAppStore';

// ============================================================================
// Build-Time App Discovery via Vite Glob Import
// ============================================================================

/**
 * Discovers all App.tsx entry points in the applications directory at build time.
 * Each app is loaded lazily - the module is only fetched when first rendered.
 */
const appModules = import.meta.glob<{ default: React.ComponentType<any> }>(
  '/src/applications/**/App.tsx'
);

/**
 * Discovers all manifest.json files in the applications directory at build time.
 * These are eagerly loaded since manifests are small and needed for the registry.
 */
const manifestModules = import.meta.glob<{ default: any }>(
  '/src/applications/**/manifest.json',
  { eager: true }
);

// ============================================================================
// App ID Resolution
// ============================================================================

/**
 * Extract app ID from a glob path.
 * e.g., "/src/applications/ibird/App.tsx" -> "ibird"
 *       "/src/applications/_system/app-store/App.tsx" -> "_system/app-store"
 */
function extractAppId(globPath: string): string {
  const match = globPath.match(/\/src\/applications\/(.+?)\/App\.tsx$/);
  return match?.[1] ?? globPath;
}

/**
 * Map of app IDs to their dynamic import functions.
 * Built from Vite's glob imports at module evaluation time.
 */
const appImportMap = new Map<string, () => Promise<{ default: React.ComponentType<any> }>>();

for (const [path, importFn] of Object.entries(appModules)) {
  const appId = extractAppId(path);
  appImportMap.set(appId, importFn as () => Promise<{ default: React.ComponentType<any> }>);
}

// ============================================================================
// Manifest Loading
// ============================================================================

/**
 * Load all discovered manifests eagerly.
 * Returns a map of app ID -> parsed manifest.
 */
export function getDiscoveredManifests(): Record<string, any> {
  const manifests: Record<string, any> = {};

  for (const [path, module] of Object.entries(manifestModules)) {
    const match = path.match(/\/src\/applications\/(.+?)\/manifest\.json$/);
    if (match) {
      const appId = match[1];
      manifests[appId] = module.default ?? module;
    }
  }

  return manifests;
}

// ============================================================================
// Component Loading
// ============================================================================

/** Cache for lazy components to avoid re-creating on each render */
const lazyComponentCache = new Map<string, React.LazyExoticComponent<React.ComponentType<any>>>();

/**
 * Get a lazy-loaded React component for the given app ID.
 * Returns null if the app is not found in the local registry.
 */
export function getAppComponent(appId: string): React.LazyExoticComponent<React.ComponentType<any>> | null {
  // Check cache first
  if (lazyComponentCache.has(appId)) {
    return lazyComponentCache.get(appId)!;
  }

  const importFn = appImportMap.get(appId);
  if (!importFn) return null;

  const LazyComponent = React.lazy(importFn);
  lazyComponentCache.set(appId, LazyComponent);
  return LazyComponent;
}

/**
 * React hook to get an app component by ID.
 * Supports both local apps (from applications/) and Quick Apps (compiled in browser).
 */
export function useAppComponent(appId: string | null): React.ComponentType<any> | null {
  const { isQuickApp, getComponent: getQuickAppComponent } = useQuickAppStore();
  const [quickAppComponent, setQuickAppComponent] = useState<React.ComponentType | null>(null);
  const [, setIsLoadingQuickApp] = useState(false);

  // Check if this is a Quick App
  const isQuick = appId ? isQuickApp(appId) : false;

  // Load Quick App component if needed
  useEffect(() => {
    if (!appId || !isQuick) {
      setQuickAppComponent(null);
      return;
    }

    let mounted = true;
    setIsLoadingQuickApp(true);

    getQuickAppComponent(appId)
      .then((component) => {
        if (mounted) {
          setQuickAppComponent(() => component);
          setIsLoadingQuickApp(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load Quick App:', err);
        if (mounted) {
          setIsLoadingQuickApp(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [appId, isQuick, getQuickAppComponent]);

  // Return memoized component
  return useMemo(() => {
    if (!appId) return null;

    // Quick App: return the loaded component
    if (isQuick) {
      return quickAppComponent;
    }

    // Regular app: use lazy loading
    return getAppComponent(appId);
  }, [appId, isQuick, quickAppComponent]);
}

/**
 * Check if an app has a local component available.
 */
export function isAppAvailableLocally(appId: string): boolean {
  return appImportMap.has(appId);
}

/**
 * Get all locally available app IDs.
 */
export function getLocalAppIds(): string[] {
  return Array.from(appImportMap.keys());
}

// ============================================================================
// Remote App Loading
// ============================================================================

/** Cache for remotely loaded components */
const remoteComponentCache = new Map<string, React.LazyExoticComponent<React.ComponentType<any>>>();

/**
 * Register a remotely-fetched app component.
 * Called by remoteAppLoader after downloading and verifying a bundle.
 */
export function registerRemoteApp(
  appId: string,
  importFn: () => Promise<{ default: React.ComponentType<any> }>
): void {
  appImportMap.set(appId, importFn);
  // Clear any stale cache
  lazyComponentCache.delete(appId);
  remoteComponentCache.delete(appId);
}

/**
 * Unregister an app (used during uninstall).
 */
export function unregisterApp(appId: string): void {
  appImportMap.delete(appId);
  lazyComponentCache.delete(appId);
  remoteComponentCache.delete(appId);
}
