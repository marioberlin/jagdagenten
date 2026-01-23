/**
 * App Store System
 *
 * Public API for the LiquidOS App Store infrastructure.
 */

// Types
export type {
  AppManifest,
  AppCategory,
  AppCapability,
  AppStatus,
  InstalledApp,
  AppCatalogEntry,
  WindowMode,
  WindowConfig,
  AppIntegrations,
  CommandPaletteEntry,
  PermissionGrant,
  RemoteAppConfig,
} from './types';

// Store
export { useAppStoreStore, selectIsAppOpen, selectActiveApp, selectInstalledAppsList, selectDockItems, selectIsInstalled, selectFilteredCatalog } from './appStoreStore';

// Components
export { AppPanel } from './AppPanel';

// Loader
export { useAppComponent, getAppComponent, isAppAvailableLocally, getLocalAppIds, registerRemoteApp, unregisterApp } from './AppLoader';

// Discovery
export { initializeAppStore, discoverLocalApps, validateManifest } from './appDiscovery';

// Integrations
export { IntegrationRegistry } from './IntegrationRegistry';

// Permissions
export { PermissionManager, CAPABILITY_DESCRIPTIONS } from './permissions';

// Remote
export { fetchCatalog, fetchAppDetails, searchApps, installRemoteApp, checkForUpdates, uninstallRemoteApp } from './remoteAppLoader';
