import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { TRANSITIONS } from '@/styles/animations';

const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'market', label: 'Market Analysis' },
    { id: 'wallet', label: 'Wallet' },
    { id: 'settings', label: 'Settings' },
];

export const GlassFluidNav = () => {
    const [activeTab, setActiveTab] = useState(NAV_ITEMS[0].id);

    return (
        <div className="w-full flex justify-center p-8">
            <div className="relative flex p-1 rounded-full bg-glass-bg-thick/50 backdrop-blur-md border border-[var(--glass-border)]">
                {NAV_ITEMS.map((item) => {
                    const isActive = activeTab === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={cn(
                                "relative px-6 py-2 rounded-full text-sm font-medium transition-colors z-10",
                                isActive ? "text-primary" : "text-secondary hover:text-primary"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="fluid-nav-pill"
                                    layout
                                    className="absolute inset-0 bg-glass-surface rounded-full shadow-lg border border-white/10"
                                    transition={TRANSITIONS.springBouncy}
                                    style={{
                                        zIndex: -1,
                                    }}
                                >
                                    {/* Inner Liquid Highlight */}
                                    <div className="absolute inset-0 bg-white/5 rounded-full" />
                                </motion.div>
                            )}
                            <span className="relative z-10">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
