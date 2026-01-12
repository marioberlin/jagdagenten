import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { SpatialCanvas } from '@/components/layout/SpatialCanvas';
import { GlassDock } from '@/components/navigation/GlassDock';
import { GlassWindow } from '@/components/containers/GlassWindow';
import { PortalFrame } from '@/components/layout/PortalFrame';
import { GlassSettingsPanel } from '@/components/settings/GlassSettingsPanel';
import { Terminal, Settings, Layout, Command, Zap, Compass } from 'lucide-react';

/**
 * LiquidOSLayout
 * 
 * The Spatial Operating System environment.
 * Hosts the "Command Center" and new spatial primitives.
 */
export const LiquidOSLayout: React.FC = () => {
    const navigate = useNavigate();
    const [settingsOpen, setSettingsOpen] = useState(false);

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
            id: 'settings',
            icon: Settings,
            label: 'Settings',
            isActive: settingsOpen,
            onClick: () => setSettingsOpen(!settingsOpen)
        }
    ];

    return (
        <PortalFrame activeMode="os">
            <SpatialCanvas scale={settingsOpen ? 0.95 : 1} blur={settingsOpen ? 10 : 0}>
                {/* Main OS Content - Scrollable Area */}
                <div className="w-full h-full overflow-y-auto custom-scrollbar pb-32">
                    <Outlet />
                </div>

                {/* System Settings Overlay Window */}
                {settingsOpen && (
                    <GlassWindow
                        id="settings-window"
                        title="System Preferences"
                        initialPosition={{ x: window.innerWidth / 2 - 400, y: 100 }}
                        initialSize={{ width: 800, height: 600 }}
                        isActive={true}
                        onClose={() => setSettingsOpen(false)}
                    >
                        <GlassSettingsPanel onClose={() => setSettingsOpen(false)} />
                    </GlassWindow>
                )}

                {/* System Dock */}
                <GlassDock items={dockItems} />
            </SpatialCanvas>
        </PortalFrame>
    );
};
