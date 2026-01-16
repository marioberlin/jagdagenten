import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSkillStore } from '@/stores/skillStore';
import {
    Brain, Puzzle, Search, Check, AlertTriangle, ExternalLink,
    RefreshCw, Filter, Book, Download, Power
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface GlassSkillsPanelProps { }

export const GlassSkillsPanel: React.FC<GlassSkillsPanelProps> = () => {
    const { skills, plugins, fetchSkills, fetchPlugins, toggleSkill, togglePlugin, isLoading, error } = useSkillStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'skill' | 'plugin'>('all');

    useEffect(() => {
        fetchSkills();
        fetchPlugins();
    }, []);

    const allItems = useMemo(() => [...skills, ...plugins], [skills, plugins]);

    const filteredItems = useMemo(() => {
        return allItems.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = filter === 'all' || item.type === filter;
            return matchesSearch && matchesFilter;
        });
    }, [allItems, searchQuery, filter]);

    const handleToggle = (id: string, type: 'skill' | 'plugin', current: boolean) => {
        if (type === 'skill') {
            toggleSkill(id, !current);
        } else {
            togglePlugin(id, !current);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header / Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div>
                    <h2 className="text-xl font-bold text-white mb-1">Skills & Plugins</h2>
                    <p className="text-white/50 text-sm">Manage agent capabilities and external integrations.</p>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                        <input
                            type="text"
                            placeholder="Search capabilities..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[var(--glass-accent)] transition-colors"
                        />
                    </div>
                    <button
                        onClick={() => { fetchSkills(); fetchPlugins(); }}
                        className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                        title="Refresh"
                    >
                        <RefreshCw size={18} className={cn(isLoading && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400">
                    <AlertTriangle size={18} />
                    <span className="text-sm">{error}</span>
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-2 p-1 rounded-xl bg-white/5 w-fit">
                {[
                    { id: 'all', label: 'All', icon: Filter },
                    { id: 'skill', label: 'Skills', icon: Book },
                    { id: 'plugin', label: 'Plugins', icon: Puzzle },
                ].map((f) => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id as any)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            filter === f.id
                                ? "bg-[var(--glass-accent)] text-white"
                                : "text-white/60 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <f.icon size={14} />
                        {f.label}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="grid gap-3">
                {filteredItems.length === 0 && !isLoading ? (
                    <div className="text-center py-12 rounded-xl border border-dashed border-white/10 bg-white/5">
                        <Brain size={32} className="mx-auto text-white/20 mb-3" />
                        <p className="text-white/40">No capabilities found</p>
                    </div>
                ) : (
                    filteredItems.map((item) => (
                        <motion.div
                            key={`${item.type}-${item.id}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                                "group p-4 rounded-xl border transition-all hover:bg-white/5",
                                item.enabled
                                    ? "bg-white/[0.02] border-white/10"
                                    : "bg-black/20 border-white/5 opacity-60 hover:opacity-100"
                            )}
                        >
                            <div className="flex items-start gap-4">
                                <div className={cn(
                                    "p-3 rounded-xl transition-colors",
                                    item.enabled
                                        ? "bg-[var(--glass-accent)]/20 text-[var(--glass-accent)]"
                                        : "bg-white/5 text-white/40"
                                )}>
                                    {item.type === 'skill' ? <Book size={20} /> : <Puzzle size={20} />}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-white">{item.name}</h3>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide border",
                                            item.type === 'skill'
                                                ? "border-blue-500/20 bg-blue-500/10 text-blue-400"
                                                : "border-purple-500/20 bg-purple-500/10 text-purple-400"
                                        )}>
                                            {item.type}
                                        </span>
                                        {item.author === 'vendor' && (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide border border-yellow-500/20 bg-yellow-500/10 text-yellow-400">
                                                Vendor
                                            </span>
                                        )}
                                        {item.author === 'core' && (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                                                Core
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-white/60 mb-2 line-clamp-2">{item.description}</p>

                                    {/* Config / Meta */}
                                    {item.type === 'plugin' && item.config && (
                                        <div className="flex gap-2">
                                            {Object.keys(item.config).map(k => (
                                                <span key={k} className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-white/40 font-mono">
                                                    {k}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-3">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={item.enabled}
                                            onChange={() => handleToggle(item.id, item.type, item.enabled)}
                                        />
                                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--glass-accent)]"></div>
                                    </label>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};
