import React from 'react';
import { Outlet } from 'react-router-dom';
import { GlassTopNav, GlassSidebar } from '@/components';
import { Home, BarChart3, Settings, Wallet } from 'lucide-react';

/**
 * RushHourLayout
 *
 * The Legacy "Dense" layout for high-frequency crypto trading.
 * Preserves the original Dashboard structure.
 */
export const RushHourLayout: React.FC = () => {
    const sidebarNav = [
        { icon: Home, label: 'Dashboard', href: '/trading' },
        { icon: BarChart3, label: 'Markets', href: '/trading/markets' },
        { icon: Wallet, label: 'Portfolio', href: '/trading/portfolio' },
        { icon: Settings, label: 'Settings', href: '/settings' },
    ];

    return (
        <div className="flex h-screen w-full bg-[#0a0a0a] text-white overflow-hidden font-sans selection:bg-[var(--glass-accent)] selection:text-white">
            <GlassSidebar className="hidden md:flex z-50">
                <nav className="flex flex-col gap-2 p-4">
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

                <GlassTopNav className="z-40" />

                <main className="flex-1 overflow-y-auto overflow-x-hidden relative z-0 p-4 custom-scrollbar">
                    <div className="mx-auto max-w-[1920px] h-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};
