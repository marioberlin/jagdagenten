/**
 * Quick App Store
 *
 * Zustand store for managing Quick App installations.
 * Persists compiled Quick Apps to localStorage.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { QuickAppInstallation, CompiledQuickApp } from './types';
import { parseQuickApp, validateParsedApp } from './parser';
import { compileQuickApp, createQuickAppComponent } from './compiler';
import { useAppStoreStore } from '../app-store/appStoreStore';

// ============================================================
// Types
// ============================================================

interface QuickAppState {
  /** Installed Quick Apps */
  installations: Record<string, QuickAppInstallation>;

  /** Component cache (not persisted) */
  componentCache: Map<string, React.ComponentType>;

  /** Loading states */
  isCompiling: boolean;
  compilingAppId: string | null;

  /** Error state */
  lastError: string | null;
}

interface QuickAppActions {
  /**
   * Install a Quick App from APP.md content.
   * Parses, compiles, and registers the app.
   */
  installFromMarkdown: (
    markdown: string,
    source: 'file' | 'url' | 'paste',
    sourceLocation?: string
  ) => Promise<CompiledQuickApp>;

  /**
   * Install a Quick App from a URL.
   */
  installFromUrl: (url: string) => Promise<CompiledQuickApp>;

  /**
   * Uninstall a Quick App.
   */
  uninstall: (appId: string) => void;

  /**
   * Get the React component for a Quick App.
   */
  getComponent: (appId: string) => Promise<React.ComponentType | null>;

  /**
   * Check if an app ID is a Quick App.
   */
  isQuickApp: (appId: string) => boolean;

  /**
   * Clear error state.
   */
  clearError: () => void;

  /**
   * Reload all Quick Apps (after page refresh).
   */
  reloadAll: () => Promise<void>;
}

type QuickAppStore = QuickAppState & QuickAppActions;

// ============================================================
// Store Implementation
// ============================================================

export const useQuickAppStore = create<QuickAppStore>()(
  devtools(
    persist(
      (set, get) => ({
        // ── Initial State ──────────────────────────────────────
        installations: {},
        componentCache: new Map(),
        isCompiling: false,
        compilingAppId: null,
        lastError: null,

        // ── Actions ────────────────────────────────────────────
        installFromMarkdown: async (markdown, source, sourceLocation) => {
          set({ isCompiling: true, lastError: null });

          try {
            // Parse the APP.md
            const parsed = parseQuickApp(markdown, sourceLocation);
            set({ compilingAppId: parsed.id });

            // Validate
            const warnings = validateParsedApp(parsed);
            if (warnings.length > 0) {
              console.warn('Quick App warnings:', warnings);
            }

            // Compile
            const compiled = await compileQuickApp(parsed);

            if (compiled.errors.length > 0) {
              throw new Error(`Compilation failed: ${compiled.errors.join(', ')}`);
            }

            // Create installation record
            const now = new Date().toISOString();
            const installation: QuickAppInstallation = {
              id: compiled.manifest.id,
              compiled,
              installedAt: now,
              updatedAt: now,
              source,
              sourceLocation,
            };

            // Save to store
            set((state) => ({
              installations: {
                ...state.installations,
                [compiled.manifest.id]: installation,
              },
              isCompiling: false,
              compilingAppId: null,
            }));

            // Register with main app store
            const appStore = useAppStoreStore.getState();
            appStore.installApp(compiled.manifest, 'local');

            return compiled;
          } catch (err) {
            const error = err as Error;
            set({
              isCompiling: false,
              compilingAppId: null,
              lastError: error.message,
            });
            throw error;
          }
        },

        installFromUrl: async (url) => {
          set({ isCompiling: true, lastError: null });

          try {
            const response = await fetch(url);
            if (!response.ok) {
              throw new Error(`Failed to fetch: ${response.statusText}`);
            }

            const markdown = await response.text();
            return get().installFromMarkdown(markdown, 'url', url);
          } catch (err) {
            const error = err as Error;
            set({
              isCompiling: false,
              compilingAppId: null,
              lastError: error.message,
            });
            throw error;
          }
        },

        uninstall: (appId) => {
          const { installations, componentCache } = get();

          if (!installations[appId]) return;

          // Remove from component cache
          componentCache.delete(appId);

          // Remove from installations
          set((state) => {
            const { [appId]: _, ...remaining } = state.installations;
            return { installations: remaining };
          });

          // Remove from main app store
          const appStore = useAppStoreStore.getState();
          appStore.uninstallApp(appId);
        },

        getComponent: async (appId) => {
          const { installations, componentCache } = get();

          // Check cache first
          if (componentCache.has(appId)) {
            return componentCache.get(appId) || null;
          }

          // Get installation
          const installation = installations[appId];
          if (!installation) return null;

          // Create component from compiled code
          const component = await createQuickAppComponent(installation.compiled);

          // Cache it
          componentCache.set(appId, component);

          return component;
        },

        isQuickApp: (appId) => {
          return appId in get().installations;
        },

        clearError: () => {
          set({ lastError: null });
        },

        reloadAll: async () => {
          const { installations } = get();

          // Re-register all Quick Apps with the main app store
          const appStore = useAppStoreStore.getState();

          for (const installation of Object.values(installations)) {
            appStore.installApp(installation.compiled.manifest, 'local');
          }
        },
      }),
      {
        name: 'liquid-os-quick-apps',
        // Persist installations but not component cache
        partialize: (state) => ({
          installations: state.installations,
        }),
        // Custom serialization to handle the compiled code
        storage: {
          getItem: (name) => {
            const str = localStorage.getItem(name);
            if (!str) return null;
            return JSON.parse(str);
          },
          setItem: (name, value) => {
            localStorage.setItem(name, JSON.stringify(value));
          },
          removeItem: (name) => {
            localStorage.removeItem(name);
          },
        },
      }
    ),
    { name: 'QuickAppStore', enabled: process.env.NODE_ENV === 'development' }
  )
);

// ============================================================
// Initialization
// ============================================================

/**
 * Initialize Quick Apps on app startup.
 * Re-registers all persisted Quick Apps with the main app store.
 */
export async function initializeQuickApps(): Promise<void> {
  const store = useQuickAppStore.getState();
  await store.reloadAll();
}
