import React from 'react';
import { Outlet } from 'react-router-dom';
import { GlassTopNav, GlassSidebar } from '@/components';
import { cn } from '@/utils/cn';

/**
 * RushHourLayout
 * 
 * The Legacy "Dense" layout for high-frequency crypto trading.
 * Preserves the original Dashboard structure.
 */
export const RushHourLayout: React.FC = () => {
    return (
        <div className="flex h-screen w-full bg-[#0a0a0a] text-white overflow-hidden font-sans selection:bg-[var(--glass-accent)] selection:text-white">
            <GlassSidebar className="hidden md:flex z-50" />

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
