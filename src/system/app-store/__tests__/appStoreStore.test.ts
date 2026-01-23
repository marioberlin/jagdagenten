/**
 * App Store Store Tests
 *
 * Tests the Zustand store for app lifecycle management:
 * install, uninstall, update, dock management, panel management.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStoreStore } from '../appStoreStore';
import type { AppManifest } from '../types';

// ============================================================================
// Test Fixtures
// ============================================================================

function createTestManifest(overrides: Partial<AppManifest> = {}): AppManifest {
  return {
    id: 'test-app',
    name: 'Test App',
    version: '1.0.0',
    description: 'A test application',
    author: 'Test Author',
    category: 'productivity',
    keywords: ['test'],
    icon: 'Box',
    entry: './App.tsx',
    window: { mode: 'panel', title: 'Test App', resizable: true },
    integrations: { dock: { enabled: true } },
    capabilities: ['storage:local'],
    ...overrides,
  };
}

// ============================================================================
// Setup
// ============================================================================

beforeEach(() => {
  // Reset store state before each test
  useAppStoreStore.setState({
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
  });
});

// ============================================================================
// Tests: App Lifecycle
// ============================================================================

describe('App Lifecycle', () => {
  it('should install an app from manifest', () => {
    const manifest = createTestManifest();
    const { installApp } = useAppStoreStore.getState();

    installApp(manifest);

    const state = useAppStoreStore.getState();
    expect(state.installedApps['test-app']).toBeDefined();
    expect(state.installedApps['test-app'].manifest.name).toBe('Test App');
    expect(state.installedApps['test-app'].status).toBe('installed');
    expect(state.installedApps['test-app'].source).toBe('local');
  });

  it('should install a remote app', () => {
    const manifest = createTestManifest({ id: 'remote-app' });
    const { installApp } = useAppStoreStore.getState();

    installApp(manifest, 'remote');

    const state = useAppStoreStore.getState();
    expect(state.installedApps['remote-app'].source).toBe('remote');
  });

  it('should add to dock on install if dock.enabled', () => {
    const manifest = createTestManifest({
      integrations: { dock: { enabled: true } },
    });
    const { installApp } = useAppStoreStore.getState();

    installApp(manifest);

    const state = useAppStoreStore.getState();
    expect(state.dockApps).toContain('test-app');
  });

  it('should NOT add to dock if dock.enabled is false', () => {
    const manifest = createTestManifest({
      id: 'no-dock-app',
      integrations: { dock: { enabled: false } },
    });
    const { installApp } = useAppStoreStore.getState();

    installApp(manifest);

    const state = useAppStoreStore.getState();
    expect(state.dockApps).not.toContain('no-dock-app');
  });

  it('should uninstall an app', () => {
    const manifest = createTestManifest();
    const { installApp, uninstallApp } = useAppStoreStore.getState();

    installApp(manifest);
    expect(useAppStoreStore.getState().installedApps['test-app']).toBeDefined();

    uninstallApp('test-app');

    const state = useAppStoreStore.getState();
    expect(state.installedApps['test-app']).toBeUndefined();
  });

  it('should remove from dock on uninstall', () => {
    const manifest = createTestManifest({
      integrations: { dock: { enabled: true } },
    });
    const { installApp, uninstallApp } = useAppStoreStore.getState();

    installApp(manifest);
    expect(useAppStoreStore.getState().dockApps).toContain('test-app');

    uninstallApp('test-app');
    expect(useAppStoreStore.getState().dockApps).not.toContain('test-app');
  });

  it('should close the app on uninstall if active', () => {
    const manifest = createTestManifest();
    const { installApp, openApp, uninstallApp } = useAppStoreStore.getState();

    installApp(manifest);
    openApp('test-app');

    // The setTimeout in closeApp makes this async, but the uninstall
    // should at least call closeApp. Check activeAppId is set to null
    // through setTimeout mock.
    vi.useFakeTimers();
    uninstallApp('test-app');
    vi.runAllTimers();

    const state = useAppStoreStore.getState();
    expect(state.activeAppId).toBeNull();
    vi.useRealTimers();
  });

  it('should update an app manifest', () => {
    const manifest = createTestManifest();
    const { installApp, updateApp } = useAppStoreStore.getState();

    installApp(manifest);

    const newManifest = createTestManifest({ version: '2.0.0', name: 'Updated App' });
    updateApp('test-app', newManifest);

    const state = useAppStoreStore.getState();
    expect(state.installedApps['test-app'].manifest.version).toBe('2.0.0');
    expect(state.installedApps['test-app'].manifest.name).toBe('Updated App');
    expect(state.installedApps['test-app'].version).toBe('2.0.0');
  });

  it('should not crash when updating a non-existent app', () => {
    const { updateApp } = useAppStoreStore.getState();
    const newManifest = createTestManifest({ version: '2.0.0' });

    // Should not throw
    updateApp('nonexistent', newManifest);

    const state = useAppStoreStore.getState();
    expect(state.installedApps['nonexistent']).toBeUndefined();
  });

  it('should set app status', () => {
    const manifest = createTestManifest();
    const { installApp, setAppStatus } = useAppStoreStore.getState();

    installApp(manifest);
    setAppStatus('test-app', 'active');

    expect(useAppStoreStore.getState().installedApps['test-app'].status).toBe('active');
  });

  it('should set error on app status', () => {
    const manifest = createTestManifest();
    const { installApp, setAppStatus } = useAppStoreStore.getState();

    installApp(manifest);
    setAppStatus('test-app', 'error', 'Something went wrong');

    const app = useAppStoreStore.getState().installedApps['test-app'];
    expect(app.status).toBe('error');
    expect(app.error).toBe('Something went wrong');
  });
});

// ============================================================================
// Tests: Panel Management
// ============================================================================

describe('Panel Management', () => {
  it('should open an app', () => {
    const manifest = createTestManifest();
    const { installApp, openApp } = useAppStoreStore.getState();

    installApp(manifest);
    openApp('test-app');

    const state = useAppStoreStore.getState();
    expect(state.activeAppId).toBe('test-app');
    expect(state.snapshot).toBeDefined();
  });

  it('should close an app', () => {
    vi.useFakeTimers();
    const manifest = createTestManifest();
    const { installApp, openApp, closeApp } = useAppStoreStore.getState();

    installApp(manifest);
    openApp('test-app');
    closeApp();

    vi.runAllTimers();

    const state = useAppStoreStore.getState();
    expect(state.activeAppId).toBeNull();
    expect(state.snapshot).toBeNull();
    vi.useRealTimers();
  });

  it('should set transitioning on open', () => {
    const manifest = createTestManifest();
    const { installApp, openApp } = useAppStoreStore.getState();

    installApp(manifest);
    openApp('test-app');

    // Initially transitioning is true
    expect(useAppStoreStore.getState().isTransitioning).toBe(true);
  });
});

// ============================================================================
// Tests: Dock Management
// ============================================================================

describe('Dock Management', () => {
  it('should add an app to dock', () => {
    const manifest = createTestManifest({ integrations: { dock: { enabled: false } } });
    const { installApp, addToDock } = useAppStoreStore.getState();

    installApp(manifest);
    addToDock('test-app');

    expect(useAppStoreStore.getState().dockApps).toContain('test-app');
  });

  it('should not duplicate dock entries', () => {
    const manifest = createTestManifest({ integrations: { dock: { enabled: true } } });
    const { installApp, addToDock } = useAppStoreStore.getState();

    installApp(manifest);
    addToDock('test-app');
    addToDock('test-app');

    const dockApps = useAppStoreStore.getState().dockApps;
    expect(dockApps.filter(id => id === 'test-app').length).toBe(1);
  });

  it('should add to dock at specific position', () => {
    const { addToDock } = useAppStoreStore.getState();

    useAppStoreStore.setState({ dockApps: ['app-a', 'app-b', 'app-c'] });
    addToDock('app-x', 1);

    const dockApps = useAppStoreStore.getState().dockApps;
    expect(dockApps[1]).toBe('app-x');
    expect(dockApps).toEqual(['app-a', 'app-x', 'app-b', 'app-c']);
  });

  it('should remove from dock', () => {
    const { removeFromDock } = useAppStoreStore.getState();

    useAppStoreStore.setState({ dockApps: ['app-a', 'app-b', 'app-c'] });
    removeFromDock('app-b');

    expect(useAppStoreStore.getState().dockApps).toEqual(['app-a', 'app-c']);
  });

  it('should reorder dock', () => {
    const { reorderDock } = useAppStoreStore.getState();

    useAppStoreStore.setState({ dockApps: ['app-a', 'app-b', 'app-c'] });
    reorderDock(['app-c', 'app-a', 'app-b']);

    expect(useAppStoreStore.getState().dockApps).toEqual(['app-c', 'app-a', 'app-b']);
  });
});

// ============================================================================
// Tests: Bulk Registration
// ============================================================================

describe('Bulk Registration', () => {
  it('should register multiple local apps', () => {
    const manifests = [
      createTestManifest({ id: 'app-1', name: 'App 1', integrations: { dock: { enabled: true, position: 2 } } }),
      createTestManifest({ id: 'app-2', name: 'App 2', integrations: { dock: { enabled: true, position: 1 } } }),
      createTestManifest({ id: 'app-3', name: 'App 3', integrations: { dock: { enabled: false } } }),
    ];
    const { registerLocalApps } = useAppStoreStore.getState();

    registerLocalApps(manifests);

    const state = useAppStoreStore.getState();
    expect(Object.keys(state.installedApps)).toHaveLength(3);
    expect(state.dockApps).toContain('app-1');
    expect(state.dockApps).toContain('app-2');
    expect(state.dockApps).not.toContain('app-3');
  });

  it('should sort dock by position', () => {
    const manifests = [
      createTestManifest({ id: 'app-a', integrations: { dock: { enabled: true, position: 3 } } }),
      createTestManifest({ id: 'app-b', integrations: { dock: { enabled: true, position: 1 } } }),
      createTestManifest({ id: 'app-c', integrations: { dock: { enabled: true, position: 2 } } }),
    ];
    const { registerLocalApps } = useAppStoreStore.getState();

    registerLocalApps(manifests);

    const state = useAppStoreStore.getState();
    expect(state.dockApps).toEqual(['app-b', 'app-c', 'app-a']);
  });
});

// ============================================================================
// Tests: Catalog & Search
// ============================================================================

describe('Catalog & Search', () => {
  it('should set catalog entries', () => {
    const { setCatalog } = useAppStoreStore.getState();

    setCatalog([
      { manifest: createTestManifest({ id: 'cat-1' }), source: 'remote', downloads: 100 },
      { manifest: createTestManifest({ id: 'cat-2' }), source: 'remote', downloads: 200 },
    ]);

    const state = useAppStoreStore.getState();
    expect(state.catalog).toHaveLength(2);
    expect(state.isLoadingCatalog).toBe(false);
  });

  it('should set search query', () => {
    const { setSearchQuery } = useAppStoreStore.getState();
    setSearchQuery('pomodoro');
    expect(useAppStoreStore.getState().searchQuery).toBe('pomodoro');
  });

  it('should set category filter', () => {
    const { setCategory } = useAppStoreStore.getState();
    setCategory('developer');
    expect(useAppStoreStore.getState().selectedCategory).toBe('developer');
  });

  it('should clear category filter', () => {
    const { setCategory } = useAppStoreStore.getState();
    setCategory('developer');
    setCategory(null);
    expect(useAppStoreStore.getState().selectedCategory).toBeNull();
  });
});
