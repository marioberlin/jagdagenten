/**
 * Desktop Store
 *
 * Manages Desktop-level panel navigation with state preservation.
 * Captures route and scroll position before opening panels,
 * restores them when panels are closed.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export interface DesktopSnapshot {
    route: string;
    scrollY: number;
    timestamp: number;
}

export type PanelId =
    | 'settings'
    | 'cowork'
    | 'agents'
    | 'console'
    | 'artifacts'
    | 'showcase'
    | 'finder'
    | null;

interface DesktopState {
    /** Currently active desktop panel (null = desktop visible) */
    activePanel: PanelId;

    /** Captured state before panel opened */
    snapshot: DesktopSnapshot | null;

    /** Whether panel transition is in progress */
    isTransitioning: boolean;
}

interface DesktopActions {
    /**
     * Open a panel, capturing current desktop state
     */
    openPanel: (panelId: Exclude<PanelId, null>) => void;

    /**
     * Close current panel and restore desktop state
     */
    closePanel: () => void;

    /**
     * Set transition state (for animation coordination)
     */
    setTransitioning: (isTransitioning: boolean) => void;
}

type DesktopStore = DesktopState & DesktopActions;

// ============================================================================
// Store Implementation
// ============================================================================

export const useDesktopStore = create<DesktopStore>()(
    devtools(
        (set, get) => ({
            // Initial state
            activePanel: null,
            snapshot: null,
            isTransitioning: false,

            openPanel: (panelId) => {
                const currentSnapshot: DesktopSnapshot = {
                    route: window.location.pathname,
                    scrollY: window.scrollY,
                    timestamp: Date.now(),
                };

                set({
                    activePanel: panelId,
                    snapshot: currentSnapshot,
                    isTransitioning: true,
                });

                // End transition after animation completes
                setTimeout(() => {
                    set({ isTransitioning: false });
                }, 300);
            },

            closePanel: () => {
                const { snapshot } = get();

                set({ isTransitioning: true });

                // Restore scroll position after a brief delay for rendering
                if (snapshot) {
                    setTimeout(() => {
                        window.scrollTo(0, snapshot.scrollY);
                    }, 50);
                }

                setTimeout(() => {
                    set({
                        activePanel: null,
                        snapshot: null,
                        isTransitioning: false,
                    });
                }, 300);
            },

            setTransitioning: (isTransitioning) => {
                set({ isTransitioning });
            },
        }),
        { name: 'DesktopStore', enabled: process.env.NODE_ENV === 'development' }
    )
);

// ============================================================================
// Selectors
// ============================================================================

/** Check if any panel is currently open */
export const selectIsPanelOpen = (state: DesktopStore) => state.activePanel !== null;

/** Get the active panel ID */
export const selectActivePanel = (state: DesktopStore) => state.activePanel;

/** Check if a specific panel is open */
export const selectIsPanelActive = (panelId: PanelId) => (state: DesktopStore) =>
    state.activePanel === panelId;
