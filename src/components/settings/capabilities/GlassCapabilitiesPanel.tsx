/**
 * GlassCapabilitiesPanel
 * 
 * Main orchestrator for the Capabilities settings section.
 * Provides sub-tab navigation between:
 * - Project Skills (skills - what the agent knows)
 * - Integrations (MCP/Plugins - tools the agent uses)
 * - Marketplace (Discovery & installation)
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, Server, Store, Search } from 'lucide-react';
import { cn } from '@/utils/cn';
import { ProjectSkillsList } from './ProjectSkillsList';
import { IntegrationsList } from './IntegrationsList';
import { MarketplaceBrowser } from './MarketplaceBrowser';

type CapabilityTab = 'skills' | 'integrations' | 'marketplace';

const TABS: { id: CapabilityTab; label: string; icon: React.ElementType; color: string; description: string }[] = [
    { id: 'skills', label: 'Project Skills', icon: Book, color: 'blue', description: 'What the agent knows' },
    { id: 'integrations', label: 'Integrations', icon: Server, color: 'purple', description: 'Tools the agent uses' },
    { id: 'marketplace', label: 'Marketplace', icon: Store, color: 'amber', description: 'Discover capabilities' },
];

export const GlassCapabilitiesPanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState<CapabilityTab>('skills');
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-amber-500/20">
                    {activeTab === 'skills' && <Book className="w-5 h-5 text-blue-400" />}
                    {activeTab === 'integrations' && <Server className="w-5 h-5 text-purple-400" />}
                    {activeTab === 'marketplace' && <Store className="w-5 h-5 text-amber-400" />}
                </div>
                <div>
                    <h2 className="text-lg font-bold text-white">Capabilities</h2>
                    <p className="text-xs text-white/50">Manage what your agent knows and can do</p>
                </div>
            </div>

            {/* Sub-Tab Navigation */}
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                <div className="flex gap-2 p-1 rounded-xl bg-white/5 w-fit">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                    isActive
                                        ? `bg-${tab.color}-500 text-white`
                                        : "text-white/60 hover:text-white hover:bg-white/5"
                                )}
                                style={isActive ? {
                                    backgroundColor: tab.color === 'blue' ? 'rgb(59 130 246)' :
                                        tab.color === 'purple' ? 'rgb(168 85 247)' :
                                            'rgb(245 158 11)'
                                } : {}}
                            >
                                <Icon size={16} />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full sm:w-64 pl-10 pr-4 py-2 bg-black/30 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/20"
                    />
                </div>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'skills' && <ProjectSkillsList searchQuery={searchQuery} />}
                    {activeTab === 'integrations' && <IntegrationsList searchQuery={searchQuery} />}
                    {activeTab === 'marketplace' && <MarketplaceBrowser searchQuery={searchQuery} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
