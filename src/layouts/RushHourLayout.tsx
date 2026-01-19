import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { GlassSidebar } from '@/components';
import { Home, BarChart3, Settings, Wallet, Zap, Play, Square, Shield } from 'lucide-react';
import { useMenuBar } from '@/context/MenuBarContext';

/**
 * RushHourLayout
 *
 * The "Dense" layout for high-frequency crypto trading.
 * Registers its own menus with the LiquidMenuBar system.
 */
export const RushHourLayout: React.FC = () => {
    const { setAppIdentity, registerMenu, unregisterMenu } = useMenuBar();

    // Register RushHour's app identity and custom menus
    useEffect(() => {
        setAppIdentity('RushHour', Zap);

        // Trading menu
        registerMenu({
            id: 'trading',
            label: 'Trading',
            items: [
                {
                    id: 'start-bot',
                    label: 'Start Bot',
                    icon: Play,
                    shortcut: '⌘R',
                    action: () => console.log('Start bot'),
                },
                {
                    id: 'stop-bot',
                    label: 'Stop Bot',
                    icon: Square,
                    shortcut: '⇧⌘R',
                    action: () => console.log('Stop bot'),
                },
                { id: 'sep-1', label: '', dividerAfter: true },
                {
                    id: 'risk-settings',
                    label: 'Risk Settings...',
                    icon: Shield,
                    action: () => console.log('Risk settings'),
                },
            ],
        });

        // Cleanup on unmount
        return () => {
            setAppIdentity('LiquidOS');
            unregisterMenu('trading');
        };
    }, [setAppIdentity, registerMenu, unregisterMenu]);

    const sidebarNav = [
        { icon: Home, label: 'Dashboard', href: '/terminal/dashboard' },
        { icon: BarChart3, label: 'Markets', href: '/terminal/market' },
        { icon: Wallet, label: 'Bots', href: '/terminal/bots' },
        { icon: Settings, label: 'Risk', href: '/terminal/risk' },
    ];

    return (
        <div className="flex h-screen w-full bg-[#0a0a0a] text-white overflow-hidden font-sans selection:bg-[var(--glass-accent)] selection:text-white">
            <GlassSidebar className="hidden md:flex z-50">
                <nav className="flex flex-col gap-2 p-4 pt-8">
                    {sidebarNav.map((item) => (
                        <a
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            <item.icon size={18} />
                            <span className="text-sm">{item.label}</span>
                        </a>
                    ))}
                </nav>
            </GlassSidebar>

            <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-br from-gray-900 to-black relative">
                {/* Background Grain */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-repeat bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

                {/* Main content - pt-6 accounts for the fixed 24px menu bar */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden relative z-0 p-4 pt-8 custom-scrollbar">
                    <div className="mx-auto max-w-[1920px] h-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};
