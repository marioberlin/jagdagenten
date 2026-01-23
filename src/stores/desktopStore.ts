/**
 * Desktop Store (Compatibility Shim)
 *
 * This store now delegates to appStoreStore for panel management.
 * Existing consumers that call closePanel() continue to work unchanged.
 *
 * @deprecated Use useAppStoreStore from '@/system/app-store/appStoreStore' directly.
 */

import { useAppStoreStore } from '@/system/app-store/appStoreStore';

// ============================================================================
// Types (kept for backwards compatibility)
// ============================================================================

export type PanelId = string | null;

// ============================================================================
// Compatibility Hook
// ============================================================================

/**
 * @deprecated Use useAppStoreStore directly.
 * This hook provides backwards compatibility for components that still use
 * closePanel() from the old desktopStore.
 */
export function useDesktopStore() {
    const activeAppId = useAppStoreStore((s) => s.activeAppId);
    const openApp = useAppStoreStore((s) => s.openApp);
    const closeApp = useAppStoreStore((s) => s.closeApp);

    return {
        activePanel: activeAppId as PanelId,
        snapshot: null,
        isTransitioning: false,
        openPanel: (panelId: string) => openApp(panelId),
        closePanel: closeApp,
        setTransitioning: () => {},
    };
}

// ============================================================================
// Selectors (kept for backwards compatibility)
// ============================================================================

export const selectIsPanelOpen = () => useAppStoreStore.getState().activeAppId !== null;
export const selectActivePanel = () => useAppStoreStore.getState().activeAppId;
