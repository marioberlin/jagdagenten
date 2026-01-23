import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SpatialCanvas } from '@/components/layout/SpatialCanvas';
import { EmptyDesktop } from '@/components/layout/EmptyDesktop';
import { GlassDock } from '@/components/navigation/GlassDock';
import { GlassWindow } from '@/components/containers/GlassWindow';
import { PortalFrame } from '@/components/layout/PortalFrame';
import { LiquidMenuBar } from '@/components/menu-bar/LiquidMenuBar';
import { Command, Compass, Layout } from 'lucide-react';

import { useAppStoreStore } from '@/system/app-store/appStoreStore';
import { useAppComponent } from '@/system/app-store/AppLoader';
import { resolveIconComponent } from '@/system/app-store/iconResolver';
import type { InstalledApp } from '@/system/app-store/types';

/**
 * LiquidOSLayout
 *
 * The Spatial Operating System environment.
 * Uses appStoreStore for dynamic, registry-driven panel and dock management.
 */
export const LiquidOSLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [dockVisible, setDockVisible] = useState(true);

    // Routes that should render inside a GlassWindow container
    const windowedRoutes = ['/os/agents', '/os/design'];
    const isWindowedRoute = windowedRoutes.includes(location.pathname);

    // Dynamic app state from appStoreStore
    const activeAppId = useAppStoreStore((s) => s.activeAppId);
    const openApp = useAppStoreStore((s) => s.openApp);
    const closeApp = useAppStoreStore((s) => s.closeApp);
    const dockAppIds = useAppStoreStore((s) => s.dockApps);
    const installedApps = useAppStoreStore((s) => s.installedApps);
    const dockApps = useMemo(() =>
        dockAppIds
            .map(id => installedApps[id])
            .filter((app): app is InstalledApp => app !== undefined),
        [dockAppIds, installedApps]
    );

    // Track if any app is open
    const hasAppOpen = activeAppId !== null;

    // Get active app's manifest for window config
    const activeApp = activeAppId ? installedApps[activeAppId] : null;

    // Toggle app panel
    const toggleApp = useCallback((appId: string) => {
        if (activeAppId === appId) {
            closeApp();
        } else {
            openApp(appId);
        }
    }, [activeAppId, openApp, closeApp]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Shift+Space: Toggle Dock
            if (e.shiftKey && e.code === 'Space') {
                e.preventDefault();
                setDockVisible(prev => !prev);
            }

            // Escape: Close active app
            if (e.key === 'Escape' && activeAppId !== null) {
                e.preventDefault();
                closeApp();
            }
        };

        // Listen for Cowork Toggle from Menu Bar
        const handleCoworkToggle = () => {
            toggleApp('cowork');
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('liquid:toggle-cowork', handleCoworkToggle);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('liquid:toggle-cowork', handleCoworkToggle);
        };
    }, [activeAppId, closeApp, toggleApp]);

    // Build dock items dynamically from registry
    const dockItems = buildDockItems(dockApps, activeAppId, toggleApp, navigate, hasAppOpen, closeApp, location.pathname);

    // Panel animation variants
    const panelVariants = {
        initial: { opacity: 0, scale: 0.95, y: 20 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.95, y: 20 }
    };

    const panelTransition = {
        type: 'spring',
        damping: 25,
        stiffness: 300
    };

    return (
        <div className="relative w-full h-full text-foreground">
            {/* 1. Menu Bar - Top Layer, Persistent */}
            <LiquidMenuBar />

            {/* 2. Content Area */}
            <PortalFrame activeMode="os" className="pt-[30px]">
                {/* 3. Spatial Environment - The "Desktop" */}
                <SpatialCanvas>
                    <AnimatePresence mode="wait">
                        {hasAppOpen ? (
                            <motion.div
                                key="empty-desktop"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="w-full h-full"
                            >
                                <EmptyDesktop />
                            </motion.div>
                        ) : isWindowedRoute ? (
                            <motion.div
                                key="windowed-route"
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                className="w-full h-full"
                            >
                                <WindowedRoutePanel
                                    title={location.pathname === '/os/agents' ? 'Agent Hub' : 'Design Explorer'}
                                    onClose={() => navigate('/os')}
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="home-content"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="w-full h-full overflow-y-auto custom-scrollbar pt-4 pb-32"
                            >
                                <Outlet />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </SpatialCanvas>

                {/* 4. Dynamic App Panel Layer */}
                <AnimatePresence>
                    {activeApp && (
                        <DynamicAppPanel
                            key={activeAppId!}
                            appId={activeAppId!}
                            manifest={activeApp.manifest}
                            panelVariants={panelVariants}
                            panelTransition={panelTransition}
                            onClose={closeApp}
                        />
                    )}
                </AnimatePresence>

                {/* 5. System Dock - Fixed Bottom */}
                <AnimatePresence>
                    {dockVisible && (
                        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
                            <motion.div
                                initial={{ y: 100, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 100, opacity: 0 }}
                                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                                className="pointer-events-none"
                            >
                                <div className="pointer-events-auto">
                                    <GlassDock items={dockItems} />
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </PortalFrame>
        </div>
    );
};

// ============================================================================
// Dynamic App Panel Renderer
// ============================================================================

interface DynamicAppPanelProps {
    appId: string;
    manifest: any;
    panelVariants: any;
    panelTransition: any;
    onClose: () => void;
}

function DynamicAppPanel({ appId, manifest, panelVariants, panelTransition, onClose }: DynamicAppPanelProps) {
    const AppComponent = useAppComponent(appId);

    if (!AppComponent) {
        return (
            <motion.div
                key={`panel-${appId}`}
                variants={panelVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={panelTransition}
            >
                <GlassWindow
                    id={`${appId}-window`}
                    title={manifest.name}
                    initialPosition={{ x: 30, y: 60 }}
                    initialSize={{ width: window.innerWidth - 60, height: window.innerHeight - 154 }}
                    isActive={true}
                    onClose={onClose}
                >
                    <div className="flex items-center justify-center h-full text-label-glass-tertiary">
                        <p>App &ldquo;{manifest.name}&rdquo; component not found</p>
                    </div>
                </GlassWindow>
            </motion.div>
        );
    }

    const windowMode = manifest.window?.mode ?? 'floating';

    // Fullscreen apps render directly (no GlassWindow wrapper)
    if (windowMode === 'fullscreen' || windowMode === 'panel') {
        return (
            <Suspense fallback={
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                </div>
            }>
                <AppComponent />
            </Suspense>
        );
    }

    // Floating/windowed apps render inside GlassWindow
    // Size to fill available space: below menu bar (30px), 30px from left/right edges,
    // and 30px above the dock (dock is 64px tall)
    const MENU_BAR_HEIGHT = 30;
    const DOCK_HEIGHT = 64;
    const EDGE_MARGIN = 30;
    const width = window.innerWidth - (EDGE_MARGIN * 2);
    const height = window.innerHeight - MENU_BAR_HEIGHT - DOCK_HEIGHT - (EDGE_MARGIN * 2);

    return (
        <motion.div
            key={`panel-${appId}`}
            variants={panelVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={panelTransition}
        >
            <GlassWindow
                id={`${appId}-window`}
                title={manifest.window?.title ?? manifest.name}
                initialPosition={{
                    x: EDGE_MARGIN,
                    y: MENU_BAR_HEIGHT + EDGE_MARGIN
                }}
                initialSize={{ width, height }}
                isActive={true}
                onClose={onClose}
            >
                <Suspense fallback={
                    <div className="flex items-center justify-center h-full">
                        <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                    </div>
                }>
                    <AppComponent />
                </Suspense>
            </GlassWindow>
        </motion.div>
    );
}

// ============================================================================
// Windowed Route Panel
// ============================================================================

interface WindowedRoutePanelProps {
    title: string;
    onClose: () => void;
}

function WindowedRoutePanel({ title, onClose }: WindowedRoutePanelProps) {
    const MENU_BAR_HEIGHT = 30;
    const DOCK_HEIGHT = 64;
    const EDGE_MARGIN = 30;
    const width = window.innerWidth - (EDGE_MARGIN * 2);
    const height = window.innerHeight - MENU_BAR_HEIGHT - DOCK_HEIGHT - (EDGE_MARGIN * 2);

    return (
        <GlassWindow
            id={`route-${title.toLowerCase().replace(/\s+/g, '-')}`}
            title={title}
            initialPosition={{
                x: EDGE_MARGIN,
                y: MENU_BAR_HEIGHT + EDGE_MARGIN
            }}
            initialSize={{ width, height }}
            isActive={true}
            onClose={onClose}
        >
            <Outlet />
        </GlassWindow>
    );
}

// ============================================================================
// Dock Items Builder
// ============================================================================

function buildDockItems(
    dockApps: InstalledApp[],
    activeAppId: string | null,
    toggleApp: (id: string) => void,
    navigate: (path: string) => void,
    hasAppOpen: boolean,
    closeApp: () => void,
    currentPath: string
) {
    // Static navigation items that aren't apps
    const navItems = [
        {
            id: 'os-home',
            icon: Command,
            label: 'Command Center',
            isActive: !hasAppOpen && currentPath === '/os',
            onClick: () => {
                if (hasAppOpen) closeApp();
                navigate('/os');
            }
        },
    ];

    // Dynamic app items from registry
    const appItems = dockApps.map((app) => {
        const IconComponent = resolveIconComponent(app.manifest.icon);
        return {
            id: app.id,
            icon: IconComponent ?? Command,
            label: app.manifest.name,
            isActive: activeAppId === app.id,
            onClick: () => toggleApp(app.id),
        };
    });

    // Static navigation items at the end
    const trailingNavItems = [
        {
            id: 'agent-hub',
            icon: Compass,
            label: 'Agent Hub',
            isActive: currentPath === '/os/agents',
            onClick: () => {
                if (hasAppOpen) closeApp();
                navigate(currentPath === '/os/agents' ? '/os' : '/os/agents');
            }
        },
        {
            id: 'design-system',
            icon: Layout,
            label: 'Design Explorer',
            isActive: currentPath === '/os/design',
            onClick: () => {
                if (hasAppOpen) closeApp();
                navigate(currentPath === '/os/design' ? '/os' : '/os/design');
            }
        },
    ];

    return [...navItems, ...appItems, ...trailingNavItems];
}
