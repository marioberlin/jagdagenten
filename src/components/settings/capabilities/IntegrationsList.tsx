/**
 * IntegrationsList
 * 
 * Displays MCP Servers and external plugins - tools the agent "uses".
 * Uses Server/Plug icon motif with purple color theme.
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Server, Plug, ShieldCheck, Settings, Info } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useSkillStore } from '@/stores/skillStore';

interface IntegrationsListProps {
    searchQuery?: string;
}

export const IntegrationsList: React.FC<IntegrationsListProps> = ({ searchQuery = '' }) => {
    const { plugins, togglePlugin, isLoading } = useSkillStore();

    const filteredPlugins = useMemo(() => {
        if (!searchQuery.trim()) return plugins;
        const q = searchQuery.toLowerCase();
        return plugins.filter(
            p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
        );
    }, [plugins, searchQuery]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-pulse flex flex-col items-center gap-3">
                    <Server className="w-8 h-8 text-purple-400/50" />
                    <span className="text-sm text-white/40">Loading integrations...</span>
                </div>
            </div>
        );
    }

    if (filteredPlugins.length === 0) {
        return (
            <div className="text-center py-12 rounded-xl border border-dashed border-white/10 bg-white/5">
                <Server size={32} className="mx-auto text-white/20 mb-3" />
                <p className="text-white/40 text-sm">No integrations configured</p>
                <p className="text-white/30 text-xs mt-1">
                    Install MCP servers from the Marketplace
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2 text-white/50 text-xs uppercase tracking-wider">
                <Server size={14} className="text-purple-400" />
                <span>Integrations ({filteredPlugins.length})</span>
            </div>

            {/* Integrations Grid */}
            <div className="grid gap-3">
                {filteredPlugins.map((plugin) => (
                    <motion.div
                        key={plugin.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                            "group p-4 rounded-xl border transition-all hover:bg-white/5",
                            plugin.enabled
                                ? "bg-purple-500/5 border-purple-500/20"
                                : "bg-black/20 border-white/5 opacity-60 hover:opacity-100"
                        )}
                    >
                        <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className={cn(
                                "p-3 rounded-xl transition-colors",
                                plugin.enabled
                                    ? "bg-purple-500/20 text-purple-400"
                                    : "bg-white/5 text-white/40"
                            )}>
                                {plugin.type === 'plugin' ? <Plug size={20} /> : <Server size={20} />}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-white">{plugin.name}</h3>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide border border-purple-500/20 bg-purple-500/10 text-purple-400">
                                        {plugin.type === 'plugin' ? 'Plugin' : 'MCP'}
                                    </span>
                                    {plugin.author === 'vendor' && (
                                        <ShieldCheck size={14} className="text-blue-400" />
                                    )}
                                </div>
                                <p className="text-sm text-white/60 line-clamp-2">{plugin.description}</p>

                                {/* Config Preview */}
                                {plugin.config && Object.keys(plugin.config).length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {Object.keys(plugin.config).slice(0, 3).map(key => (
                                            <span key={key} className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-white/40 font-mono">
                                                {key}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                {plugin.config && (
                                    <button
                                        className="p-2 rounded-lg text-white/40 hover:bg-white/10 hover:text-white transition-colors"
                                        title="Configure"
                                    >
                                        <Settings size={16} />
                                    </button>
                                )}
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={plugin.enabled}
                                        onChange={() => togglePlugin(plugin.id, !plugin.enabled)}
                                    />
                                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                                </label>
                            </div>
                        </div>

                        {/* Status Row */}
                        {plugin.enabled && (
                            <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2">
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Connected
                                </div>
                                <div className="flex items-center gap-1 text-xs text-white/30">
                                    <Info size={12} />
                                    <span>Tools available to agent</span>
                                </div>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
