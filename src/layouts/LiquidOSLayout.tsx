import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SpatialCanvas } from '@/components/layout/SpatialCanvas';
import { GlassDock } from '@/components/navigation/GlassDock';
import { GlassWindow } from '@/components/containers/GlassWindow';
import { PortalFrame } from '@/components/layout/PortalFrame';
import { GlassSettingsPanel } from '@/components/settings/GlassSettingsPanel';
import { GlassShowcasePanel } from '@/components/settings/GlassShowcasePanel';
import { Settings, Layout, Command, Zap, Compass, Sparkles } from 'lucide-react';

/**
 * LiquidOSLayout
 * 
 * The Spatial Operating System environment.
 * Hosts the "Command Center" and new spatial primitives.
 */
export const LiquidOSLayout: React.FC = () => {
    const navigate = useNavigate();
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [showcaseOpen, setShowcaseOpen] = useState(false);
    const [dockVisible, setDockVisible] = useState(true);
    const [dockHovered, setDockHovered] = useState(false);

    // Track if any overlay is open
    const hasOverlay = settingsOpen || showcaseOpen;

    // Toggle Dock with Cmd+Space
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.shiftKey && e.code === 'Space') {
                e.preventDefault();
                setDockVisible(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Determine if dock should be shown
    // When any overlay is open, only show on hover
    const showDock = dockVisible && (!hasOverlay || dockHovered);

    // Dock Items Configuration
    const dockItems = [
        {
            id: 'os-home',
            icon: Command,
            label: 'Command Center',
            isActive: true,
            onClick: () => navigate('/os')
        },
        {
            id: 'rush-hour',
            icon: Zap,
            label: 'RushHour Terminal',
            onClick: () => navigate('/terminal') // Triggers Portal transition
        },
        {
            id: 'agent-hub',
            icon: Compass,
            label: 'Agent Hub',
            onClick: () => navigate('/os/agents')
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
            isActive: showcaseOpen,
            onClick: () => {
                setShowcaseOpen(!showcaseOpen);
                if (settingsOpen) setSettingsOpen(false);
            }
        },
        {
            id: 'settings',
            icon: Settings,
            label: 'Settings',
            isActive: settingsOpen,
            onClick: () => {
                setSettingsOpen(!settingsOpen);
                if (showcaseOpen) setShowcaseOpen(false);
            }
        }
    ];

    return (
        <PortalFrame activeMode="os">
            <SpatialCanvas scale={hasOverlay ? 0.95 : 1} blur={hasOverlay ? 10 : 0}>
                {/* Main OS Content - Scrollable Area */}
                <div className="w-full h-full overflow-y-auto custom-scrollbar pb-32">
                    <Outlet />
                </div>

                {/* System Settings Overlay Window */}
                {settingsOpen && (
                    <GlassWindow
                        id="settings-window"
                        title="System Preferences"
                        initialPosition={{ x: window.innerWidth * 0.05, y: 60 }}
                        initialSize={{ width: window.innerWidth * 0.9, height: window.innerHeight * 0.85 }}
                        isActive={true}
                        onClose={() => setSettingsOpen(false)}
                    >
                        <GlassSettingsPanel onClose={() => setSettingsOpen(false)} />
                    </GlassWindow>
                )}

                {/* Component Showcase Overlay Window */}
                {showcaseOpen && (
                    <GlassWindow
                        id="showcase-window"
                        title="Component Library"
                        initialPosition={{ x: window.innerWidth * 0.05, y: 60 }}
                        initialSize={{ width: window.innerWidth * 0.9, height: window.innerHeight * 0.85 }}
                        isActive={true}
                        onClose={() => setShowcaseOpen(false)}
                    >
                        <GlassShowcasePanel onClose={() => setShowcaseOpen(false)} />
                    </GlassWindow>
                )}

                {/* System Dock - Toggleable, auto-hide when overlay open */}
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
            </SpatialCanvas>
        </PortalFrame>
    );
};
