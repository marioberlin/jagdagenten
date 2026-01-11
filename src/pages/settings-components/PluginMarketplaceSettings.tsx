import React, { useState } from 'react';
import { GlassContainer, GlassButton, GlassInput } from '@/components';
import {
    Search, Package, Download, Star, Trash2,
    Plus, Globe, Check, ShieldCheck, Terminal, Copy, Server
} from 'lucide-react';

// --- Types ---

type PluginScope = 'user' | 'project' | 'local';

interface Plugin {
    id: string;
    name: string;
    description: string;
    version: string;
    author: string;
    downloads: number;
    stars: number;
    isVerified: boolean;
    isInstalled: boolean;
    scope?: PluginScope;
    category: string;
    type: 'claude-plugin' | 'mcp-server';
    installCommand?: string;
}

interface Marketplace {
    id: string;
    name: string;
    url: string;
    isOfficial: boolean;
    autoUpdate: boolean;
    pluginCount: number;
}

// --- Data ---

const MOCK_MARKETPLACES: Marketplace[] = [
    {
        id: 'official',
        name: 'Official Claude Plugins',
        url: 'https://github.com/anthropics/claude-plugins-official',
        isOfficial: true,
        autoUpdate: true,
        pluginCount: 44
    }
];

const CLAUDE_OFFICIAL_PLUGINS: Plugin[] = [];

// --- Components ---

const PluginCard = ({ plugin, onToggleInstall }: { plugin: Plugin; onToggleInstall: () => void; showCli?: boolean }) => {
    const [showCommand, setShowCommand] = useState(false);

    return (
        <div className="flex flex-col bg-white/5 border border-white/10 rounded-xl p-4 hover:border-primary/50 transition-colors group h-full">
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center border border-white/5 ${plugin.type === 'mcp-server'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-purple-500/20 text-purple-400'
                        }`}>
                        {plugin.type === 'mcp-server' ? <Server size={20} /> : <Package size={20} />}
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <h4 className="font-semibold text-white text-sm">{plugin.name}</h4>
                            {plugin.isVerified && (
                                <ShieldCheck size={14} className="text-blue-400" aria-label="Verified" />
                            )}
                        </div>
                        <div className="text-[10px] text-gray-500 flex items-center gap-2">
                            <span>v{plugin.version}</span>
                            <span>•</span>
                            <span>by {plugin.author}</span>
                        </div>
                    </div>
                </div>
            </div>

            <p className="text-xs text-gray-400 mb-4 line-clamp-2 flex-grow">
                {plugin.description}
            </p>

            {showCommand ? (
                <div className="mt-auto pt-3 border-t border-white/5 animate-in fade-in duration-200">
                    <div className="text-[10px] text-gray-400 mb-1 flex justify-between">
                        <span>Run in terminal:</span>
                        <button onClick={() => setShowCommand(false)} className="hover:text-white"><Terminal size={10} /></button>
                    </div>
                    <div className="bg-black/40 rounded p-2 flex items-center justify-between group/cmd">
                        <code className="text-[10px] text-green-400 font-mono truncate mr-2">
                            {plugin.installCommand || `npx -y @modelcontextprotocol/server-${plugin.name}`}
                        </code>
                        <button
                            onClick={() => navigator.clipboard.writeText(plugin.installCommand || `npx -y @modelcontextprotocol/server-${plugin.name}`)}
                            className="text-gray-500 hover:text-white opacity-0 group-hover/cmd:opacity-100 transition-opacity"
                        >
                            <Copy size={12} />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                    <div className="flex items-center gap-3 text-[10px] text-gray-500">
                        <div className="flex items-center gap-1">
                            <Download size={12} />
                            <span>{plugin.downloads.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Star size={12} />
                            <span>{plugin.stars}</span>
                        </div>
                    </div>

                    <div className="flex gap-2 items-center">
                        {/* Toggle Command View Button */}
                        <GlassButton size="sm" variant="ghost" className="h-7 px-2" onClick={() => setShowCommand(true)}>
                            <Terminal size={12} />
                        </GlassButton>

                        <GlassButton
                            size="sm"
                            variant={plugin.isInstalled ? "secondary" : "primary"}
                            onClick={onToggleInstall}
                            className="h-7"
                        >
                            {plugin.isInstalled ? 'Installed' : 'Install'}
                        </GlassButton>
                    </div>
                </div>
            )}
        </div>
    );
};

export const PluginMarketplaceSettings = () => {
    const [activeTab, setActiveTab] = useState<'claude-plugins' | 'mcp-servers' | 'installed' | 'marketplaces'>('claude-plugins');
    const [searchQuery, setSearchQuery] = useState('');

    // Data States
    const [claudePlugins, setClaudePlugins] = useState<Plugin[]>(CLAUDE_OFFICIAL_PLUGINS);
    const [mcpServers, setMcpServers] = useState<Plugin[]>([]);
    const [installedPlugins, setInstalledPlugins] = useState<Plugin[]>([]);
    const [marketplaces] = useState(MOCK_MARKETPLACES);
    const [newMarketplaceUrl, setNewMarketplaceUrl] = useState('');
    const [isLoadingMcp, setIsLoadingMcp] = useState(false);

    // Fetch Live MCP Data
    // Fetch Live Data
    React.useEffect(() => {
        const fetchData = async () => {
            setIsLoadingMcp(true);
            let currentInstalledPlugins: Plugin[] = [];
            try {
                // 1. Fetch Installed Plugins with Scope from Backend
                try {
                    const installedRes = await fetch('http://localhost:3000/api/v1/plugins');
                    if (installedRes.ok) {
                        const { data } = await installedRes.json();
                        if (Array.isArray(data)) {
                            // Map backend data to Plugin interface
                            // Map backend data to Plugin interface
                            const backendPlugins = data.map((p: any) => ({
                                id: p.id,
                                name: p.id,
                                description: 'Installed via Claude',
                                version: 'latest',
                                author: 'unknown',
                                downloads: 0,
                                stars: 0,
                                isVerified: true,
                                category: 'integration',
                                type: 'claude-plugin' as const,
                                isInstalled: true,
                                scope: p.scope,
                                installCommand: `claude plugin install ${p.id}`
                            }));
                            setInstalledPlugins(backendPlugins);
                            currentInstalledPlugins = backendPlugins;

                            setClaudePlugins(prev => prev.map(cp => {
                                const match = backendPlugins.find((bp: Plugin) => bp.id === cp.id);
                                if (match) {
                                    return { ...cp, isInstalled: true, scope: match.scope };
                                }
                                return cp;
                            }));
                        }
                    }
                } catch (e) {
                    console.error('Backend not reachable:', e);
                }

                // 2. Fetch MCP Servers from GitHub
                const response = await fetch('https://api.github.com/repos/modelcontextprotocol/servers/contents/src');
                if (!response.ok) return;
                const data = await response.json();

                const liveMcp: Plugin[] = data
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
                        category: 'mcp-server',
                        type: 'mcp-server',
                        installCommand: `npx -y @modelcontextprotocol/server-${item.name}`
                    }));
                setMcpServers(liveMcp);

                // 3. Fetch Official Claude Plugins
                try {
                    const officialRes = await fetch('http://localhost:3000/api/v1/plugins/official');
                    if (officialRes.ok) {
                        const { data } = await officialRes.json();
                        if (Array.isArray(data)) {
                            setClaudePlugins(data.map((p: any) => {
                                const match = currentInstalledPlugins.find((bp: Plugin) => bp.id === p.name);
                                return {
                                    id: p.name,
                                    name: p.name,
                                    description: p.description,
                                    version: 'latest',
                                    author: 'anthropics',
                                    downloads: 0,
                                    stars: 0,
                                    isVerified: true,
                                    category: p.category || 'integration',
                                    type: 'claude-plugin' as const,
                                    isInstalled: !!match,
                                    scope: match?.scope,
                                    installCommand: `claude plugin install ${p.name}@claude-plugins-official`
                                };
                            }));
                        }
                    }
                } catch (e) {
                    console.error('Failed to fetch official plugins:', e);
                }

            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setIsLoadingMcp(false);
            }
        };
        fetchData();
    }, []);

    const toggleInstall = async (plugin: Plugin) => {
        const isInstalled = activeTab === 'installed' || installedPlugins.some(p => p.id === plugin.id);
        const endpoint = isInstalled ? 'uninstall' : 'install';

        // Optimistic Update
        if (isInstalled) {
            setInstalledPlugins(prev => prev.filter(p => p.id !== plugin.id));
        } else {
            setInstalledPlugins(prev => [...prev, { ...plugin, isInstalled: true, scope: 'user' }]);
        }

        try {
            const response = await fetch(`http://localhost:3000/api/v1/plugins/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pluginId: plugin.name + '@claude-plugins-official' }) // Defaulting to official registry for now
            });
            const data = await response.json();
            if (!data.success) {
                // Revert if failed
                if (isInstalled) {
                    setInstalledPlugins(prev => [...prev, { ...plugin, isInstalled: true, scope: 'user' }]);
                } else {
                    setInstalledPlugins(prev => prev.filter(p => p.id !== plugin.id));
                }
                console.error('Plugin operation failed:', data.error);
                alert('Command failed: ' + data.error);
            }
        } catch (error) {
            console.error('Network error:', error);
            // Revert on network error
            if (isInstalled) {
                setInstalledPlugins(prev => [...prev, { ...plugin, isInstalled: true, scope: 'user' }]);
            } else {
                setInstalledPlugins(prev => prev.filter(p => p.id !== plugin.id));
            }
        }
    };

    const isInstalled = (id: string) => installedPlugins.some(p => p.id === id);

    const filterPlugins = (list: Plugin[]) => list.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full gap-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                        Extensions
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                        Manage Claude Plugins and MCP Servers
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-black/20 rounded-lg border border-white/5 gap-1">
                    {[
                        { id: 'claude-plugins', label: 'Claude Plugins', icon: Package },
                        { id: 'mcp-servers', label: 'MCP Servers', icon: Server },
                        { id: 'installed', label: 'Installed', icon: Check },
                        { id: 'marketplaces', label: 'Marketplaces', icon: Globe }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${activeTab === tab.id
                                ? 'bg-primary text-white shadow-lg'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <tab.icon size={12} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto min-h-0">

                {/* Search Bar (Common) */}
                {(activeTab === 'claude-plugins' || activeTab === 'mcp-servers') && (
                    <div className="flex gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 text-gray-500 w-4 h-4" />
                            <GlassInput
                                placeholder={`Search ${activeTab === 'claude-plugins' ? 'plugins' : 'servers'}...`}
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {/* --- CLAUDE PLUGINS TAB --- */}
                {activeTab === 'claude-plugins' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                        {filterPlugins(claudePlugins).map(plugin => (
                            <PluginCard
                                key={plugin.id}
                                plugin={{ ...plugin, isInstalled: isInstalled(plugin.id) }}
                                onToggleInstall={() => toggleInstall(plugin)}
                            />
                        ))}
                    </div>
                )}

                {/* --- MCP SERVERS TAB --- */}
                {activeTab === 'mcp-servers' && (
                    <>
                        {isLoadingMcp ? (
                            <div className="text-center py-20 text-gray-500">Loading MCP Servers...</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                                {filterPlugins(mcpServers).map(plugin => (
                                    <PluginCard
                                        key={plugin.id}
                                        plugin={{ ...plugin, isInstalled: isInstalled(plugin.id) }}
                                        onToggleInstall={() => toggleInstall(plugin)}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* --- INSTALLED TAB --- */}
                {activeTab === 'installed' && (
                    <div className="space-y-3">
                        {installedPlugins.length === 0 ? (
                            <div className="text-center py-20 text-gray-500 border border-dashed border-white/10 rounded-xl">
                                <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>No extensions installed yet.</p>
                            </div>
                        ) : (
                            installedPlugins.map(plugin => (
                                <GlassContainer key={plugin.id} className="p-4 flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border border-white/5 ${plugin.type === 'mcp-server' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
                                            }`}>
                                            {plugin.type === 'mcp-server' ? <Server size={20} /> : <Package size={20} />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold text-white text-sm">{plugin.name}</h4>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400 uppercase tracking-wider">
                                                    {plugin.type === 'mcp-server' ? 'MCP' : 'PLUGIN'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500">{plugin.description}</p>
                                        </div>
                                    </div>
                                    <button
                                        className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                                        onClick={() => toggleInstall(plugin)}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </GlassContainer>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'marketplaces' && (
                    <div className="space-y-6">
                        {/* Reuse exiting marketplaces logic... */}
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Add Marketplace</label>
                            <div className="flex gap-2">
                                <GlassInput
                                    placeholder="github-owner/repo"
                                    className="flex-1"
                                    value={newMarketplaceUrl}
                                    onChange={(e) => setNewMarketplaceUrl(e.target.value)}
                                />
                                <GlassButton onClick={() => console.log('Mock add')}>
                                    <Plus size={16} className="mr-2" /> Add
                                </GlassButton>
                            </div>
                        </div>
                        {marketplaces.map(mp => (
                            <GlassContainer key={mp.id} className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Globe className="text-indigo-400" />
                                    <div>
                                        <div className="font-semibold text-sm text-white">{mp.name}</div>
                                        <div className="text-xs text-gray-500">{mp.url}</div>
                                    </div>
                                </div>
                            </GlassContainer>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
