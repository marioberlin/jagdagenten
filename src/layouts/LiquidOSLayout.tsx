import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SpatialCanvas } from '@/components/layout/SpatialCanvas';
import { GlassDock } from '@/components/navigation/GlassDock';
import { GlassWindow } from '@/components/containers/GlassWindow';
import { PortalFrame } from '@/components/layout/PortalFrame';
import { GlassSettingsApp } from '@/components/settings/GlassSettingsApp';
import { GlassShowcaseApp } from '@/components/settings/GlassShowcaseApp';
import { GlassCoworkApp } from '@/components/cowork/GlassCoworkApp';
import { GlassFinderApp } from '@/components/features/GlassFinderApp';
import { Settings, Layout, Command, Zap, Compass, Sparkles, Briefcase, Terminal, HardDrive } from 'lucide-react';

import { LiquidMenuBar } from '@/components/menu-bar/LiquidMenuBar';
import { useDesktopStore, PanelId } from '@/stores/desktopStore';
import { cn } from '@/utils/cn';

/**
 * LiquidOSLayout
 * 
 * The Spatial Operating System environment.
 * Uses centralized desktopStore for panel state management.
 */
export const LiquidOSLayout: React.FC = () => {
    const navigate = useNavigate();
    const [dockVisible, setDockVisible] = useState(true);
    const [dockHovered, setDockHovered] = useState(false);

    // Centralized panel state from desktopStore
    const { activePanel, openPanel, closePanel } = useDesktopStore();

    // Track if any overlay is open
    const hasOverlay = activePanel !== null;

    // Panel toggle helper
    const togglePanel = useCallback((panelId: Exclude<PanelId, null>) => {
        if (activePanel === panelId) {
            closePanel();
        } else {
            openPanel(panelId);
        }
    }, [activePanel, openPanel, closePanel]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Shift+Space: Toggle Dock
            if (e.shiftKey && e.code === 'Space') {
                e.preventDefault();
                setDockVisible(prev => !prev);
            }

            // Escape: Close active panel
            if (e.key === 'Escape' && activePanel !== null) {
                e.preventDefault();
                closePanel();
            }
        };

        // Listen for Cowork Toggle from Menu Bar
        const handleCoworkToggle = () => {
            togglePanel('cowork');
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('liquid:toggle-cowork', handleCoworkToggle);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('liquid:toggle-cowork', handleCoworkToggle);
        };
    }, [activePanel, closePanel, togglePanel]);

    // Determine if dock should be shown
    // When any overlay is open, only show on hover
    const showDock = dockVisible && (!hasOverlay || dockHovered);

    // Dock Items Configuration
    const dockItems = [
        {
            id: 'os-home',
            icon: Command,
            label: 'Command Center',
            isActive: !hasOverlay,
            onClick: () => {
                if (hasOverlay) closePanel();
                navigate('/os');
            }
        },
        {
            id: 'rush-hour',
            icon: Zap,
            label: 'RushHour Terminal',
            onClick: () => navigate('/terminal')
        },
        {
            id: 'agent-hub',
            icon: Compass,
            label: 'Agent Hub',
            onClick: () => navigate('/os/agents')
        },
        {
            id: 'finder-app',
            icon: HardDrive,
            label: 'Finder',
            isActive: activePanel === 'finder',
            onClick: () => togglePanel('finder')
        },
        {
            id: 'a2a-console',
            icon: Terminal,
            label: 'A2A Console',
            isActive: activePanel === 'console',
            onClick: () => togglePanel('console')
        },
        {
            id: 'cowork-mode',
            icon: Briefcase,
            label: 'Cowork Mode',
            isActive: activePanel === 'cowork',
            onClick: () => togglePanel('cowork')
        },
        {
            id: 'design-system',
            icon: Layout,
            label: 'Design Explorer',
            onClick: () => navigate('/os/design')
        },
        {
            id: 'showcase',
            icon: Sparkles,
            label: 'Component Library',
            isActive: activePanel === 'showcase',
            onClick: () => togglePanel('showcase')
        },
        {
            id: 'settings',
            icon: Settings,
            label: 'Settings',
            isActive: activePanel === 'settings',
            onClick: () => togglePanel('settings')
        }
    ];

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

            {/* 2. Content Area - Handles Dimensional Jump */}
            <PortalFrame activeMode="os" className="pt-[30px]">
                {/* 3. Spatial Environment - The "Desktop" */}
                {/* When an overlay is open, this recedes (scales down + blurs) */}
                <SpatialCanvas scale={hasOverlay ? 0.95 : 1} blur={hasOverlay ? 10 : 0}>
                    {/* Main OS Content - Scrollable Area */}
                    <div className={cn(
                        "w-full h-full overflow-y-auto custom-scrollbar pt-4 pb-32 transition-opacity duration-300",
                        hasOverlay ? "opacity-0 pointer-events-none" : "opacity-100"
                    )}>
                        <Outlet />
                    </div>
                </SpatialCanvas>

                {/* 4. Windows Layer - Floats ABOVE the Spatial Environment */}
                {/* These specific windows are "OS Level" overlays */}

                {/* System Settings Overlay Window */}
                <AnimatePresence>
                    {activePanel === 'settings' && (
                        <motion.div
                            key="settings-panel"
                            variants={panelVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={panelTransition}
                        >
                            <GlassWindow
                                id="settings-window"
                                title="System Preferences"
                                initialPosition={{ x: window.innerWidth * 0.05, y: 30 }}
                                initialSize={{ width: window.innerWidth * 0.9, height: window.innerHeight * 0.85 }}
                                isActive={true}
                                onClose={closePanel}
                            >
                                <GlassSettingsApp onClose={closePanel} />
                            </GlassWindow>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Component Showcase Overlay Window */}
                <AnimatePresence>
                    {activePanel === 'showcase' && (
                        <motion.div
                            key="showcase-panel"
                            variants={panelVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={panelTransition}
                        >
                            <GlassWindow
                                id="showcase-window"
                                title="Component Library"
                                initialPosition={{ x: window.innerWidth * 0.05, y: 30 }}
                                initialSize={{ width: window.innerWidth * 0.9, height: window.innerHeight * 0.85 }}
                                isActive={true}
                                onClose={closePanel}
                            >
                                <GlassShowcaseApp onClose={closePanel} />
                            </GlassWindow>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Cowork Mode Overlay Window */}
                <AnimatePresence>
                    {activePanel === 'cowork' && (
                        <motion.div
                            key="cowork-panel"
                            variants={panelVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={panelTransition}
                        >
                            <GlassWindow
                                id="cowork-window"
                                title="Cowork Mode"
                                initialPosition={{ x: window.innerWidth * 0.05, y: 30 }}
                                initialSize={{ width: window.innerWidth * 0.9, height: window.innerHeight * 0.85 }}
                                isActive={true}
                                onClose={closePanel}
                            >
                                <GlassCoworkApp onClose={closePanel} />
                            </GlassWindow>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Finder App Window */}
                <AnimatePresence>
                    {activePanel === 'finder' && (
                        <motion.div
                            key="finder-panel"
                            variants={panelVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={panelTransition}
                        >
                            <GlassWindow
                                id="finder-window"
                                title="Finder"
                                initialPosition={{ x: window.innerWidth * 0.1, y: 50 }}
                                initialSize={{ width: 800, height: 600 }}
                                isActive={true}
                                onClose={closePanel}
                            >
                                <GlassFinderApp onClose={closePanel} />
                            </GlassWindow>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 5. System Dock - Fixed Bottom */}
                {dockVisible && (
                    <div
                        className="fixed bottom-0 left-0 right-0 z-50 flex justify-center"
                        onMouseEnter={() => setDockHovered(true)}
                        onMouseLeave={() => setDockHovered(false)}
                    >
                        {/* Invisible hover trigger area when dock is hidden */}
                        {hasOverlay && !dockHovered && (
                            <div className="absolute bottom-0 left-0 right-0 h-16" />
                        )}
                        <AnimatePresence>
                            {showDock && (
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
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </PortalFrame>
        </div>
    );
};

