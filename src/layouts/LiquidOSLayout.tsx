import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SpatialCanvas } from '@/components/layout/SpatialCanvas';
import { EmptyDesktop } from '@/components/layout/EmptyDesktop';
import { GlassDock } from '@/components/navigation/GlassDock';
import { GlassWindow } from '@/components/containers/GlassWindow';
import { PortalFrame } from '@/components/layout/PortalFrame';
import { GlassSettingsApp } from '@/components/settings/GlassSettingsApp';
import { GlassShowcaseApp } from '@/components/settings/GlassShowcaseApp';
import { GlassCoworkApp } from '@/components/cowork/GlassCoworkApp';
import { GlassFinderApp } from '@/components/features/GlassFinderApp';
import { NeonTokyoApp } from '@/components/features/NeonTokyoApp';
import { AuroraWeatherApp } from '@/components/features/AuroraWeatherApp';
import { AuroraTravelApp } from '@/components/features/AuroraTravelApp';
import { RushHourTradingApp } from '@/components/features/RushHourTradingApp';
import ConsolePage from '@/pages/console/ConsolePage';
import { ICloudApp } from '@/components/features/icloud';
import { IBirdApp } from '@/components/features/ibird';
import { Settings, Layout, Command, Compass, Sparkles, Briefcase, Terminal, HardDrive, Plane, Cloud, TrendingUp, Map, Mail, CloudCog } from 'lucide-react';

import { LiquidMenuBar } from '@/components/menu-bar/LiquidMenuBar';
import { useDesktopStore, PanelId } from '@/stores/desktopStore';

/**
 * LiquidOSLayout
 * 
 * The Spatial Operating System environment.
 * Uses centralized desktopStore for panel state management.
 */
export const LiquidOSLayout: React.FC = () => {
    const navigate = useNavigate();
    const [dockVisible, setDockVisible] = useState(true);

    // Centralized panel state from desktopStore
    const { activePanel, openPanel, closePanel } = useDesktopStore();

    // Track if any panel is open
    const hasPanelOpen = activePanel !== null;

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

    // Dock is always visible when dockVisible is true (user can toggle with Shift+Space)
    const showDock = dockVisible;

    // Dock Items Configuration
    const dockItems = [
        {
            id: 'os-home',
            icon: Command,
            label: 'Command Center',
            isActive: !hasPanelOpen,
            onClick: () => {
                if (hasPanelOpen) closePanel();
                navigate('/os');
            }
        },
        {
            id: 'rush-hour',
            icon: TrendingUp,
            label: 'RushHour Trading',
            isActive: activePanel === 'rushHourTrading',
            onClick: () => togglePanel('rushHourTrading')
        },
        {
            id: 'ibird-app',
            icon: Mail,
            label: 'iBird Mail',
            isActive: activePanel === 'ibird',
            onClick: () => togglePanel('ibird')
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
            id: 'neon-tokyo',
            icon: Plane,
            label: 'Neon Tokyo',
            isActive: activePanel === 'neonTokyo',
            onClick: () => togglePanel('neonTokyo')
        },
        {
            id: 'aurora-weather',
            icon: Cloud,
            label: 'Aurora Weather',
            isActive: activePanel === 'auroraWeather',
            onClick: () => togglePanel('auroraWeather')
        },
        {
            id: 'aurora-travel',
            icon: Map,
            label: 'Aurora Travel',
            isActive: activePanel === 'auroraTravel',
            onClick: () => togglePanel('auroraTravel')
        },
        {
            id: 'icloud-app',
            icon: CloudCog,
            label: 'iCloud',
            isActive: activePanel === 'icloud',
            onClick: () => togglePanel('icloud')
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
                {/* When a panel is open, show EmptyDesktop; otherwise show page content */}
                <SpatialCanvas>
                    <AnimatePresence mode="wait">
                        {hasPanelOpen ? (
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

                {/* Neon Tokyo App Window */}
                <AnimatePresence>
                    {activePanel === 'neonTokyo' && (
                        <motion.div
                            key="neon-tokyo-panel"
                            variants={panelVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={panelTransition}
                        >
                            <GlassWindow
                                id="neon-tokyo-window"
                                title="Neon Tokyo"
                                initialPosition={{ x: window.innerWidth * 0.05, y: 30 }}
                                initialSize={{ width: window.innerWidth * 0.9, height: window.innerHeight * 0.85 }}
                                isActive={true}
                                onClose={closePanel}
                            >
                                <NeonTokyoApp onClose={closePanel} />
                            </GlassWindow>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Aurora Weather App Window */}
                <AnimatePresence>
                    {activePanel === 'auroraWeather' && (
                        <motion.div
                            key="aurora-weather-panel"
                            variants={panelVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={panelTransition}
                        >
                            <GlassWindow
                                id="aurora-weather-window"
                                title="Aurora Weather"
                                initialPosition={{ x: window.innerWidth * 0.05, y: 30 }}
                                initialSize={{ width: window.innerWidth * 0.9, height: window.innerHeight * 0.85 }}
                                isActive={true}
                                onClose={closePanel}
                            >
                                <AuroraWeatherApp />
                            </GlassWindow>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Aurora Travel App Window */}
                <AnimatePresence>
                    {activePanel === 'auroraTravel' && (
                        <motion.div
                            key="aurora-travel-panel"
                            variants={panelVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={panelTransition}
                        >
                            <GlassWindow
                                id="aurora-travel-window"
                                title="Aurora Travel Weather"
                                initialPosition={{ x: window.innerWidth * 0.05, y: 30 }}
                                initialSize={{ width: window.innerWidth * 0.9, height: window.innerHeight * 0.85 }}
                                isActive={true}
                                onClose={closePanel}
                            >
                                <AuroraTravelApp onClose={closePanel} />
                            </GlassWindow>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* RushHour Trading App Window */}
                <AnimatePresence>
                    {activePanel === 'rushHourTrading' && (
                        <motion.div
                            key="rushhour-trading-panel"
                            variants={panelVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={panelTransition}
                        >
                            <GlassWindow
                                id="rushhour-trading-window"
                                title="RushHour Trading"
                                initialPosition={{ x: window.innerWidth * 0.05, y: 30 }}
                                initialSize={{ width: window.innerWidth * 0.9, height: window.innerHeight * 0.85 }}
                                isActive={true}
                                onClose={closePanel}
                            >
                                <RushHourTradingApp onClose={closePanel} />
                            </GlassWindow>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* A2A Console Window */}
                <AnimatePresence>
                    {activePanel === 'console' && (
                        <motion.div
                            key="console-panel"
                            variants={panelVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={panelTransition}
                        >
                            <GlassWindow
                                id="console-window"
                                title="A2A Console"
                                initialPosition={{ x: window.innerWidth * 0.05, y: 30 }}
                                initialSize={{ width: window.innerWidth * 0.9, height: window.innerHeight * 0.85 }}
                                isActive={true}
                                onClose={closePanel}
                            >
                                <ConsolePage />
                            </GlassWindow>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* iCloud App Window */}
                <AnimatePresence>
                    {activePanel === 'icloud' && (
                        <motion.div
                            key="icloud-panel"
                            variants={panelVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={panelTransition}
                        >
                            <GlassWindow
                                id="icloud-window"
                                title="iCloud"
                                initialPosition={{ x: window.innerWidth * 0.05, y: 30 }}
                                initialSize={{ width: window.innerWidth * 0.9, height: window.innerHeight * 0.85 }}
                                isActive={true}
                                onClose={closePanel}
                            >
                                <ICloudApp />
                            </GlassWindow>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* iBird App - Full Screen Overlay */}
                <AnimatePresence>
                    {activePanel === 'ibird' && (
                        <IBirdApp />
                    )}
                </AnimatePresence>

                {/* 5. System Dock - Fixed Bottom, Always Visible */}
                <AnimatePresence>
                    {showDock && (
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

