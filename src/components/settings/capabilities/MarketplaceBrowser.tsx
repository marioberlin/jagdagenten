/**
 * MarketplaceBrowser
 * 
 * Discovery panel for installing new MCP servers and plugins.
 * Uses Store icon motif with amber color theme.
 * Ported from PluginMarketplaceSettings.tsx
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Store, Download, Star, Package, Server,
    ShieldCheck, Terminal, Copy, Loader2
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface MarketplaceItem {
    id: string;
    name: string;
    description: string;
    version: string;
    author: string;
    downloads: number;
    stars: number;
    isVerified: boolean;
    isInstalled: boolean;
    type: 'claude-plugin' | 'mcp-server';
    installCommand?: string;
}

interface MarketplaceBrowserProps {
    searchQuery?: string;
}

export const MarketplaceBrowser: React.FC<MarketplaceBrowserProps> = ({ searchQuery = '' }) => {
    const [activeTab, setActiveTab] = useState<'mcp' | 'plugins'>('mcp');
    const [items, setItems] = useState<MarketplaceItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [installingId, setInstallingId] = useState<string | null>(null);

    // Fetch marketplace data
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                if (activeTab === 'mcp') {
                    // Fetch MCP Servers from GitHub
                    const response = await fetch('https://api.github.com/repos/modelcontextprotocol/servers/contents/src');
                    if (response.ok) {
                        const data = await response.json();
                        const mcpItems: MarketplaceItem[] = data
                            .filter((item: any) => item.type === 'dir')
                            .map((item: any) => ({
                                id: `mcp-${item.name}`,
                                name: item.name,
                                description: `Official MCP server for ${item.name} integration.`,
                                version: '1.0.0',
                                author: 'modelcontextprotocol',
                                downloads: Math.floor(Math.random() * 5000) + 1000,
                                stars: Math.floor(Math.random() * 500) + 50,
                                isVerified: true,
                                isInstalled: false,
                                type: 'mcp-server',
                                installCommand: `npx -y @modelcontextprotocol/server-${item.name}`
                            }));
                        setItems(mcpItems);
                    }
                } else {
                    // Fetch Claude plugins from backend
                    try {
                        const res = await fetch('/api/v1/plugins/official');
                        if (res.ok) {
                            const { data } = await res.json();
                            if (Array.isArray(data)) {
                                const pluginItems: MarketplaceItem[] = data.map((p: any) => ({
                                    id: p.name,
                                    name: p.name,
                                    description: p.description || `Claude plugin: ${p.name}`,
                                    version: 'latest',
                                    author: 'anthropics',
                                    downloads: 0,
                                    stars: 0,
                                    isVerified: true,
                                    isInstalled: false,
                                    type: 'claude-plugin',
                                    installCommand: `claude plugin install ${p.name}@claude-plugins-official`
                                }));
                                setItems(pluginItems);
                            }
                        }
                    } catch {
                        setItems([]);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch marketplace data:', error);
                setItems([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [activeTab]);

    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return items;
        const q = searchQuery.toLowerCase();
        return items.filter(
            item => item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
        );
    }, [items, searchQuery]);

    const handleInstall = async (item: MarketplaceItem) => {
        setInstallingId(item.id);
        try {
            const response = await fetch('/api/v1/plugins/install', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pluginId: item.name })
            });
            if (response.ok) {
                setItems(prev => prev.map(i =>
                    i.id === item.id ? { ...i, isInstalled: true } : i
                ));
            }
        } catch (error) {
            console.error('Install failed:', error);
        } finally {
            setInstallingId(null);
        }
    };

    return (
        <div className="space-y-4">
            {/* Header with Tabs */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white/50 text-xs uppercase tracking-wider">
                    <Store size={14} className="text-amber-400" />
                    <span>Marketplace</span>
                </div>

                <div className="flex gap-1 p-1 bg-black/20 rounded-lg">
                    <button
                        onClick={() => setActiveTab('mcp')}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                            activeTab === 'mcp'
                                ? "bg-amber-500 text-white"
                                : "text-white/50 hover:text-white"
                        )}
                    >
                        <Server size={12} />
                        MCP Servers
                    </button>
                    <button
                        onClick={() => setActiveTab('plugins')}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                            activeTab === 'plugins'
                                ? "bg-amber-500 text-white"
                                : "text-white/50 hover:text-white"
                        )}
                    >
                        <Package size={12} />
                        Plugins
                    </button>
                </div>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-pulse flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                        <span className="text-sm text-white/40">Loading marketplace...</span>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredItems.length === 0 && (
                <div className="text-center py-12 rounded-xl border border-dashed border-white/10 bg-white/5">
                    <Store size={32} className="mx-auto text-white/20 mb-3" />
                    <p className="text-white/40 text-sm">No items found</p>
                    <p className="text-white/30 text-xs mt-1">
                        {searchQuery ? 'Try adjusting your search' : 'Check back later for new integrations'}
                    </p>
                </div>
            )}

            {/* Items Grid */}
            {!isLoading && filteredItems.length > 0 && (
                <div className="grid sm:grid-cols-2 gap-3">
                    <AnimatePresence mode="popLayout">
                        {filteredItems.map((item) => (
                            <MarketplaceCard
                                key={item.id}
                                item={item}
                                isInstalling={installingId === item.id}
                                onInstall={() => handleInstall(item)}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

// ============================================
// Marketplace Item Card
// ============================================

interface MarketplaceCardProps {
    item: MarketplaceItem;
    isInstalling: boolean;
    onInstall: () => void;
}

const MarketplaceCard: React.FC<MarketplaceCardProps> = ({ item, isInstalling, onInstall }) => {
    const [showCommand, setShowCommand] = useState(false);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
                "p-4 rounded-xl border transition-all hover:border-amber-500/30",
                item.isInstalled
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : "bg-black/20 border-white/5"
            )}
        >
            <div className="flex items-start gap-3 mb-3">
                <div className={cn(
                    "p-2.5 rounded-xl",
                    item.type === 'mcp-server'
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-purple-500/20 text-purple-400"
                )}>
                    {item.type === 'mcp-server' ? <Server size={18} /> : <Package size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-semibold text-white text-sm truncate">{item.name}</h4>
                        {item.isVerified && <ShieldCheck size={12} className="text-blue-400" />}
                    </div>
                    <p className="text-[10px] text-white/40">
                        v{item.version} • by {item.author}
                    </p>
                </div>
            </div>

            <p className="text-xs text-white/60 line-clamp-2 mb-3">{item.description}</p>

            {showCommand ? (
                <div className="pt-3 border-t border-white/5">
                    <div className="text-[10px] text-white/40 mb-1 flex justify-between items-center">
                        <span>Installation command:</span>
                        <button onClick={() => setShowCommand(false)} className="hover:text-white">
                            <Terminal size={10} />
                        </button>
                    </div>
                    <div className="bg-black/40 rounded p-2 flex items-center justify-between">
                        <code className="text-[10px] text-green-400 font-mono truncate flex-1">
                            {item.installCommand}
                        </code>
                        <button
                            onClick={() => navigator.clipboard.writeText(item.installCommand || '')}
                            className="text-white/40 hover:text-white ml-2"
                        >
                            <Copy size={12} />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="flex items-center gap-3 text-[10px] text-white/40">
                        <span className="flex items-center gap-1">
                            <Download size={10} />
                            {item.downloads.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                            <Star size={10} />
                            {item.stars}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowCommand(true)}
                            className="p-1.5 rounded-md text-white/40 hover:bg-white/10 hover:text-white transition-colors"
                        >
                            <Terminal size={12} />
                        </button>
                        <button
                            onClick={onInstall}
                            disabled={item.isInstalled || isInstalling}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                item.isInstalled
                                    ? "bg-emerald-500/20 text-emerald-400 cursor-default"
                                    : isInstalling
                                        ? "bg-amber-500/20 text-amber-400 animate-pulse cursor-wait"
                                        : "bg-amber-500 text-white hover:bg-amber-400"
                            )}
                        >
                            {item.isInstalled ? 'Installed' : isInstalling ? 'Installing...' : 'Install'}
                        </button>
                    </div>
                </div>
            )}
        </motion.div>
    );
};
