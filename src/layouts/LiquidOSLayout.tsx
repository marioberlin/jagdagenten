import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SpatialCanvas } from '@/components/layout/SpatialCanvas';
import { EmptyDesktop } from '@/components/layout/EmptyDesktop';
import { GlassDock } from '@/components/navigation/GlassDock';
import { GlassWindow, type WindowMenuItem } from '@/components/containers/GlassWindow';
import { PortalFrame } from '@/components/layout/PortalFrame';
import { LiquidMenuBar } from '@/components/menu-bar/LiquidMenuBar';
import { Command, Copy } from 'lucide-react';

import { AuthGate } from '@/components/auth/AuthGate';
import { useAppStoreStore } from '@/system/app-store/appStoreStore';
import { useAppComponent } from '@/system/app-store/AppLoader';
import { resolveIconComponent } from '@/system/app-store/iconResolver';
import type { InstalledApp } from '@/system/app-store/types';
import { useAgentChatStore, selectFocusedAgent, type AgentConnectionStatus } from '@/stores/agentChatStore';
import { useAlexaAppStore } from '@/applications/alexa/store';
import { Cloud, Sun, CloudSun, CloudRain, Snowflake } from 'lucide-react';

/**
 * LiquidOSLayout
 *
 * The Spatial Operating System environment.
 * Uses appStoreStore for dynamic, registry-driven panel and dock management.
 */
export const LiquidOSLayout: React.FC = () => {
    const navigate = useNavigate();
    const [dockVisible, setDockVisible] = useState(true);

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
    const dockItems = buildDockItems(dockApps, activeAppId, toggleApp, navigate, hasAppOpen, closeApp);

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
        <AuthGate>
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
        </AuthGate>
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
    const focusedAgent = useAgentChatStore(selectFocusedAgent);
    const focusedAgentId = useAgentChatStore(state => state.focusedAgentId);

    // Use local state + subscription for reliable status updates
    const [agentStatus, setAgentStatus] = useState<AgentConnectionStatus | null>(null);

    useEffect(() => {
        if (appId !== 'agent-chat' || !focusedAgentId) {
            setAgentStatus(null);
            return;
        }

        // Get initial status
        const initialStatus = useAgentChatStore.getState().connectionStatus[focusedAgentId] ?? null;
        setAgentStatus(initialStatus);

        // Subscribe to store changes
        const unsubscribe = useAgentChatStore.subscribe((state) => {
            const newStatus = state.connectionStatus[focusedAgentId] ?? null;
            setAgentStatus(newStatus);
        });

        return unsubscribe;
    }, [appId, focusedAgentId]);

    // Dynamic title: use agent name for agent-chat app
    const windowTitle = useMemo(() => {
        if (appId === 'agent-chat' && focusedAgent) {
            return focusedAgent.name;
        }
        return manifest.window?.title ?? manifest.name;
    }, [appId, focusedAgent, manifest]);

    // Check if agent is verified (for badge in title)
    const isVerifiedAgent = appId === 'agent-chat' && focusedAgent?.verified;

    // Build title icon for agent chat
    const titleIcon = useMemo(() => {
        if (appId === 'agent-chat' && focusedAgent) {
            const AgentIcon = focusedAgent.icon;
            return (
                <span
                    className="w-5 h-5 rounded flex items-center justify-center"
                    style={{ backgroundColor: `${focusedAgent.color}30` }}
                >
                    <AgentIcon size={12} className="text-white" />
                </span>
            );
        }
        return undefined;
    }, [appId, focusedAgent]);

    // Build status indicator for agent chat (no memo - needs to update on every status change)
    let statusIndicator: React.ReactNode = undefined;
    if (appId === 'agent-chat' && agentStatus) {
        const statusConfig: Record<string, { color: string; label: string }> = {
            connecting: { color: 'text-yellow-400', label: 'Connecting...' },
            connected: { color: 'text-green-400', label: 'Connected' },
            disconnected: { color: 'text-red-400', label: 'Disconnected' },
            working: { color: 'text-yellow-400', label: 'Working...' },
            error: { color: 'text-red-400', label: 'Error' },
        };

        const config = statusConfig[agentStatus] ?? statusConfig.disconnected;

        statusIndicator = (
            <span className={`flex items-center gap-1.5 text-xs ${config.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${config.color.replace('text-', 'bg-')} animate-pulse`} />
                {config.label}
            </span>
        );
    }

    // Build menu items for agent chat
    const titleMenu: WindowMenuItem[] | undefined = useMemo(() => {
        if (appId !== 'agent-chat' || !focusedAgentId) return undefined;

        return [
            {
                id: 'copy-markdown',
                label: 'Copy as Markdown',
                icon: <Copy size={14} />,
                onClick: () => {
                    const messages = useAgentChatStore.getState().agentMessages[focusedAgentId] ?? [];
                    const agentName = focusedAgent?.name ?? 'Agent';

                    if (messages.length === 0) {
                        return;
                    }

                    // Convert messages to markdown
                    const markdown = messages
                        .map((msg) => {
                            const role = msg.role === 'user' ? 'You' : agentName;
                            const time = new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                            });
                            const content = msg.error ? `*Error: ${msg.error}*` : msg.content;
                            return `**${role}** *(${time})*\n\n${content}`;
                        })
                        .join('\n\n---\n\n');

                    const header = `# Conversation with ${agentName}\n\n`;
                    const fullMarkdown = header + markdown;

                    navigator.clipboard.writeText(fullMarkdown).catch(console.error);
                },
            },
        ];
    }, [appId, focusedAgentId, focusedAgent]);

    // Build headerRight for Alexa app - use primitive selectors to avoid infinite re-renders
    const alexaTemp = useAlexaAppStore(s => s.temperature);
    const alexaCondition = useAlexaAppStore(s => s.condition);
    const [alexaTime, setAlexaTime] = useState(new Date());

    useEffect(() => {
        if (appId !== 'alexa') return;
        const interval = setInterval(() => setAlexaTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, [appId]);

    const getWeatherIcon = (condition: string | null, size: number) => {
        switch (condition) {
            case 'clear': return <Sun size={size} className="text-yellow-400" />;
            case 'partly_cloudy': return <CloudSun size={size} className="text-gray-300" />;
            case 'cloudy':
            case 'overcast': return <Cloud size={size} className="text-gray-400" />;
            case 'rain':
            case 'drizzle':
            case 'heavy_rain':
            case 'thunderstorm': return <CloudRain size={size} className="text-blue-400" />;
            case 'snow':
            case 'heavy_snow':
            case 'sleet':
            case 'hail': return <Snowflake size={size} className="text-blue-200" />;
            default: return <Cloud size={size} className="text-white/40" />;
        }
    };

    const headerRight = appId === 'alexa' ? (
        <div className="flex items-center gap-4">
            {/* Weather */}
            <div className="flex items-center gap-1.5 text-white/80 text-sm">
                {getWeatherIcon(alexaCondition, 16)}
                <span>{alexaTemp !== null ? `${Math.round(alexaTemp)}°` : '--°'}</span>
            </div>
            {/* Time */}
            <span className="text-white font-medium text-sm">
                {alexaTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
            </span>
            {/* Glass Avatar */}
            <div className="w-6 h-6 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/90 font-medium text-xs">
                M
            </div>
        </div>
    ) : undefined;

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
                    title={windowTitle}
                    titleBadge={isVerifiedAgent ? (
                        <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-blue-500/20 text-blue-400 font-medium">
                            Verified
                        </span>
                    ) : undefined}
                    titleIcon={titleIcon}
                    titleStatus={statusIndicator}
                    titleMenu={titleMenu}
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
                title={windowTitle}
                titleBadge={isVerifiedAgent ? (
                    <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-blue-500/20 text-blue-400 font-medium">
                        Verified
                    </span>
                ) : undefined}
                titleIcon={titleIcon}
                titleStatus={statusIndicator}
                titleMenu={titleMenu}
                initialPosition={{
                    x: EDGE_MARGIN,
                    y: MENU_BAR_HEIGHT + EDGE_MARGIN
                }}
                initialSize={{ width, height }}
                isActive={true}
                onClose={onClose}
                headerRight={headerRight}
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
// Dock Items Builder
// ============================================================================

function buildDockItems(
    dockApps: InstalledApp[],
    activeAppId: string | null,
    toggleApp: (id: string) => void,
    navigate: (path: string) => void,
    hasAppOpen: boolean,
    closeApp: () => void
) {
    // Static navigation item: Command Center (home)
    const navItems = [
        {
            id: 'os-home',
            icon: Command,
            label: 'Command Center',
            isActive: !hasAppOpen,
            isPermanent: true,
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

    return [...navItems, ...appItems];
}
