/**
 * App Store Store
 *
 * Central Zustand store for app lifecycle management.
 * Manages installed apps, dock configuration, active app state,
 * and replaces the hardcoded PanelId system in desktopStore.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { AppManifest, InstalledApp, AppStatus, AppCategory, AppCatalogEntry } from './types';

// ============================================================================
// Types
// ============================================================================

interface DesktopSnapshot {
  route: string;
  scrollY: number;
  timestamp: number;
}

interface AppStoreState {
  /** Registry of all installed apps */
  installedApps: Record<string, InstalledApp>;

  /** Currently active (open) app ID */
  activeAppId: string | null;

  /** Ordered list of app IDs pinned to dock */
  dockApps: string[];

  /** Desktop snapshot for state restoration */
  snapshot: DesktopSnapshot | null;

  /** Whether panel transition is in progress */
  isTransitioning: boolean;

  /** Available apps from remote registry (catalog) */
  catalog: AppCatalogEntry[];

  /** Search/filter state */
  searchQuery: string;
  selectedCategory: AppCategory | null;

  /** Loading states */
  isLoadingCatalog: boolean;
  installingAppId: string | null;
}

interface AppStoreActions {
  // ── Lifecycle ──────────────────────────────────────────────
  /** Install an app from its manifest */
  installApp: (manifest: AppManifest, source?: 'local' | 'remote') => void;

  /** Uninstall an app, cleaning up all integrations */
  uninstallApp: (appId: string) => void;

  /** Update an installed app to a new version */
  updateApp: (appId: string, newManifest: AppManifest) => void;

  /** Set app status */
  setAppStatus: (appId: string, status: AppStatus, error?: string) => void;

  // ── Panel Management (replaces desktopStore) ───────────────
  /** Open an app panel */
  openApp: (appId: string) => void;

  /** Close the active app panel */
  closeApp: () => void;

  /** Set transition state for animation coordination */
  setTransitioning: (isTransitioning: boolean) => void;

  // ── Dock Management ────────────────────────────────────────
  /** Add an app to the dock */
  addToDock: (appId: string, position?: number) => void;

  /** Remove an app from the dock */
  removeFromDock: (appId: string) => void;

  /** Reorder dock apps */
  reorderDock: (appIds: string[]) => void;

  // ── Catalog ────────────────────────────────────────────────
  /** Set the catalog of available apps */
  setCatalog: (entries: AppCatalogEntry[]) => void;

  /** Set catalog loading state */
  setLoadingCatalog: (loading: boolean) => void;

  // ── Search & Filter ────────────────────────────────────────
  /** Update search query */
  setSearchQuery: (query: string) => void;

  /** Set category filter */
  setCategory: (category: AppCategory | null) => void;

  // ── Bulk Operations ────────────────────────────────────────
  /** Register multiple local apps at once (initial discovery) */
  registerLocalApps: (manifests: AppManifest[]) => void;
}

type AppStoreStore = AppStoreState & AppStoreActions;

// ============================================================================
// Store Implementation
// ============================================================================

export const useAppStoreStore = create<AppStoreStore>()(
  devtools(
    persist(
      (set, get) => ({
        // ── Initial State ──────────────────────────────────────
        installedApps: {},
        activeAppId: null,
        dockApps: [],
        snapshot: null,
        isTransitioning: false,
        catalog: [],
        searchQuery: '',
        selectedCategory: null,
        isLoadingCatalog: false,
        installingAppId: null,

        // ── Lifecycle Actions ──────────────────────────────────
        installApp: (manifest, source = 'local') => {
          const now = new Date().toISOString();
          const installedApp: InstalledApp = {
            id: manifest.id,
            manifest,
            status: 'installed',
            installedAt: now,
            updatedAt: now,
            version: manifest.version,
            dockOrder: manifest.integrations.dock?.position ?? get().dockApps.length,
            source,
          };

          set((state) => ({
            installedApps: {
              ...state.installedApps,
              [manifest.id]: installedApp,
            },
            // Auto-add to dock if manifest declares it
            dockApps: manifest.integrations.dock?.enabled
              ? [...state.dockApps.filter(id => id !== manifest.id), manifest.id]
              : state.dockApps,
          }));
        },

        uninstallApp: (appId) => {
          const { activeAppId } = get();

          // Close if currently open
          if (activeAppId === appId) {
            get().closeApp();
          }

          set((state) => {
            const { [appId]: _, ...remainingApps } = state.installedApps;
            return {
              installedApps: remainingApps,
              dockApps: state.dockApps.filter(id => id !== appId),
            };
          });
        },

        updateApp: (appId, newManifest) => {
          set((state) => {
            const existing = state.installedApps[appId];
            if (!existing) return state;

            return {
              installedApps: {
                ...state.installedApps,
                [appId]: {
                  ...existing,
                  manifest: newManifest,
                  version: newManifest.version,
                  updatedAt: new Date().toISOString(),
                  status: 'installed',
                },
              },
            };
          });
        },

        setAppStatus: (appId, status, error) => {
          set((state) => {
            const app = state.installedApps[appId];
            if (!app) return state;

            return {
              installedApps: {
                ...state.installedApps,
                [appId]: { ...app, status, error },
              },
            };
          });
        },

        // ── Panel Management ───────────────────────────────────
        openApp: (appId) => {
          const currentSnapshot: DesktopSnapshot = {
            route: window.location.pathname,
            scrollY: window.scrollY,
            timestamp: Date.now(),
          };

          set({
            activeAppId: appId,
            snapshot: currentSnapshot,
            isTransitioning: true,
          });

          setTimeout(() => {
            set({ isTransitioning: false });
          }, 300);
        },

        closeApp: () => {
          const { snapshot } = get();

          set({ isTransitioning: true });

          if (snapshot) {
            setTimeout(() => {
              window.scrollTo(0, snapshot.scrollY);
            }, 50);
          }

          setTimeout(() => {
            set({
              activeAppId: null,
              snapshot: null,
              isTransitioning: false,
            });
          }, 300);
        },

        setTransitioning: (isTransitioning) => {
          set({ isTransitioning });
        },

        // ── Dock Management ────────────────────────────────────
        addToDock: (appId, position) => {
          set((state) => {
            if (state.dockApps.includes(appId)) return state;
            const newDock = [...state.dockApps];
            if (position !== undefined && position >= 0) {
              newDock.splice(position, 0, appId);
            } else {
              newDock.push(appId);
            }
            return { dockApps: newDock };
          });
        },

        removeFromDock: (appId) => {
          set((state) => ({
            dockApps: state.dockApps.filter(id => id !== appId),
          }));
        },

        reorderDock: (appIds) => {
          set({ dockApps: appIds });
        },

        // ── Catalog ────────────────────────────────────────────
        setCatalog: (entries) => {
          set({ catalog: entries, isLoadingCatalog: false });
        },

        setLoadingCatalog: (loading) => {
          set({ isLoadingCatalog: loading });
        },

        // ── Search & Filter ────────────────────────────────────
        setSearchQuery: (query) => {
          set({ searchQuery: query });
        },

        setCategory: (category) => {
          set({ selectedCategory: category });
        },

        // ── Bulk Operations ────────────────────────────────────
        registerLocalApps: (manifests) => {
          const now = new Date().toISOString();
          const apps: Record<string, InstalledApp> = {};
          const dockApps: string[] = [];

          for (const manifest of manifests) {
            apps[manifest.id] = {
              id: manifest.id,
              manifest,
              status: 'installed',
              installedAt: now,
              updatedAt: now,
              version: manifest.version,
              dockOrder: manifest.integrations.dock?.position ?? dockApps.length,
              source: 'local',
            };

            if (manifest.integrations.dock?.enabled) {
              dockApps.push(manifest.id);
            }
          }

          // Sort dock by declared position
          dockApps.sort((a, b) => {
            const posA = apps[a].manifest.integrations.dock?.position ?? 999;
            const posB = apps[b].manifest.integrations.dock?.position ?? 999;
            return posA - posB;
          });

          set({ installedApps: apps, dockApps });
        },
      }),
      {
        name: 'liquid-os-app-store',
        // Only persist installed apps and dock config, not transient state
        partialize: (state) => ({
          installedApps: state.installedApps,
          dockApps: state.dockApps,
        }),
      }
    ),
    { name: 'AppStoreStore', enabled: process.env.NODE_ENV === 'development' }
  )
);

// ============================================================================
// Selectors
// ============================================================================

/** Check if any app is currently open */
export const selectIsAppOpen = (state: AppStoreStore) => state.activeAppId !== null;

/** Get the active app's manifest */
export const selectActiveApp = (state: AppStoreStore) => {
  if (!state.activeAppId) return null;
  return state.installedApps[state.activeAppId] ?? null;
};

/** Get installed apps as sorted array */
export const selectInstalledAppsList = (state: AppStoreStore) =>
  Object.values(state.installedApps).sort((a, b) => a.manifest.name.localeCompare(b.manifest.name));

/** Get dock items with manifests */
export const selectDockItems = (state: AppStoreStore) =>
  state.dockApps
    .map(id => state.installedApps[id])
    .filter((app): app is InstalledApp => app !== undefined);

/** Check if a specific app is installed */
export const selectIsInstalled = (appId: string) => (state: AppStoreStore) =>
  appId in state.installedApps;

/** Filter catalog by search and category */
export const selectFilteredCatalog = (state: AppStoreStore) => {
  let results = state.catalog;

  if (state.selectedCategory) {
    results = results.filter(e => e.manifest.category === state.selectedCategory);
  }

  if (state.searchQuery.trim()) {
    const q = state.searchQuery.toLowerCase();
    results = results.filter(e =>
      e.manifest.name.toLowerCase().includes(q) ||
      e.manifest.description.toLowerCase().includes(q) ||
      e.manifest.keywords.some(k => k.toLowerCase().includes(q))
    );
  }

  return results;
};
