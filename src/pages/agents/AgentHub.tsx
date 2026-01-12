import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Filter,
    Grid3X3,
    LayoutList,
    Sparkles,
    TrendingUp,
    Star,
    Globe,
    Compass,
    Zap,
    ChevronRight,
    X
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { AgentCard, AgentCardCompact } from '@/components/agents/AgentCard';
import { AgentProbe } from '@/components/agents/AgentProbe';
import {
    getCuratedAgents,
    getFeaturedAgents,
    searchAgents,
    getAgentsByCategory,
    AGENT_CATEGORIES,
    type CuratedAgent,
    type AgentCategory
} from '@/services/agents/registry';
import type { AgentCard as A2AAgentCard } from '@/a2a/types';
import { AgentChatWindow } from '@/components/agents/AgentChatWindow';

type ViewMode = 'grid' | 'list';

interface OpenChat {
    agent: CuratedAgent;
    position: { x: number; y: number };
}

/**
 * AgentHub
 *
 * The "App Store" for A2A agents within Liquid OS.
 * A spatial exploration experience for discovering and connecting to AI agents.
 */
export const AgentHub: React.FC = () => {
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<AgentCategory | 'all'>('all');
    const [showProbe, setShowProbe] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<CuratedAgent | null>(null);
    const [openChats, setOpenChats] = useState<OpenChat[]>([]);
    const [activeChat, setActiveChat] = useState<string | null>(null);

    // Get agents based on filters
    const filteredAgents = useMemo(() => {
        let agents = getCuratedAgents();

        if (searchQuery.trim()) {
            agents = searchAgents(searchQuery);
        }

        if (selectedCategory !== 'all') {
            agents = agents.filter(a => a.category === selectedCategory);
        }

        return agents;
    }, [searchQuery, selectedCategory]);

    // Calculate center position for new chat window
    const getCenteredPosition = (index: number) => {
        // Default to a reasonable center if window is not available (SSR)
        if (typeof window === 'undefined') return { x: 400, y: 100 };

        const width = 500; // Chat window width
        const x = (window.innerWidth / 2) - (width / 2) + (index * 20);
        const y = 80 + (index * 20); // Top-biased center

        return { x: Math.max(0, x), y: Math.max(0, y) };
    };

    const featuredAgents = useMemo(() => getFeaturedAgents(), []);

    const handleAgentDiscovered = (url: string, card: A2AAgentCard) => {
        console.log('Discovered agent:', url, card);
        // In a real implementation, this would add the agent to user's connected agents
    };

    const handleAgentClick = (agent: CuratedAgent) => {
        setSelectedAgent(agent);
    };

    const handleConnect = (agent: CuratedAgent) => {
        // Check if chat already open
        if (openChats.some(chat => chat.agent.id === agent.id)) {
            setActiveChat(agent.id);
            return;
        }

        const position = getCenteredPosition(openChats.length);

        setOpenChats(prev => [...prev, { agent, position }]);
        setActiveChat(agent.id);
        setSelectedAgent(null); // Close modal
    };

    const handleCloseChat = (agentId: string) => {
        setOpenChats(prev => prev.filter(chat => chat.agent.id !== agentId));
        if (activeChat === agentId) {
            setActiveChat(null);
        }
    };

    const handleFocusChat = (agentId: string) => {
        setActiveChat(agentId);
    };

    const isChatOpen = openChats.length > 0;

    return (
        <div className="w-full h-full relative">
            {/* Main Content Layer */}
            <div className={cn(
                "w-full h-full overflow-y-auto overflow-x-hidden transition-all duration-500",
                isChatOpen ? "opacity-30 blur-sm pointer-events-none scale-[0.98]" : "opacity-100 scale-100"
            )}>
                {/* Hero Section */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="relative px-8 pt-12 pb-16"
                >
                    {/* Gradient Orb Background */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/20 via-purple-500/10 to-transparent blur-3xl" />
                    </div>

                    <div className="relative max-w-6xl mx-auto text-center">
                        {/* Title */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1, duration: 0.5 }}
                        >
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10">
                                    <Compass className="w-8 h-8 text-indigo-400" />
                                </div>
                            </div>
                            <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40 tracking-tight mb-4">
                                Agent Hub
                            </h1>
                            <p className="text-xl text-white/50 font-light max-w-2xl mx-auto">
                                Discover, connect, and orchestrate AI agents from around the world.
                                Your gateway to the A2A ecosystem.
                            </p>
                        </motion.div>

                        {/* Search Bar */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="mt-10 max-w-2xl mx-auto"
                        >
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
                                <div className="relative flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
                                    <Search className="w-5 h-5 text-white/40" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search agents by name, category, or capability..."
                                        className="flex-1 bg-transparent text-white placeholder:text-white/30 outline-none text-base font-light"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="p-1 rounded-full hover:bg-white/10 transition-colors"
                                        >
                                            <X size={16} className="text-white/40" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="flex items-center justify-center gap-4 mt-4">
                                <button
                                    onClick={() => setShowProbe(!showProbe)}
                                    className={cn(
                                        'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                                        showProbe
                                            ? 'bg-indigo-500 text-white'
                                            : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'
                                    )}
                                >
                                    <Globe size={16} />
                                    <span>Discover by URL</span>
                                </button>
                                <div className="h-6 w-px bg-white/10" />
                                <button
                                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm font-medium transition-all"
                                >
                                    {viewMode === 'grid' ? <LayoutList size={16} /> : <Grid3X3 size={16} />}
                                    <span>{viewMode === 'grid' ? 'List View' : 'Grid View'}</span>
                                </button>
                            </div>
                        </motion.div>

                        {/* URL Probe Panel */}
                        <AnimatePresence>
                            {showProbe && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-6 max-w-2xl mx-auto"
                                >
                                    <AgentProbe onAgentDiscovered={handleAgentDiscovered} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.section>

                {/* Categories */}
                <motion.section
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="px-8 pb-8"
                >
                    <div className="max-w-6xl mx-auto">
                        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            <CategoryPill
                                active={selectedCategory === 'all'}
                                onClick={() => setSelectedCategory('all')}
                                icon={<Sparkles size={14} />}
                                label="All Agents"
                                count={getCuratedAgents().length}
                            />
                            {AGENT_CATEGORIES.map((cat) => (
                                <CategoryPill
                                    key={cat.id}
                                    active={selectedCategory === cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    icon={<cat.icon size={14} />}
                                    label={cat.name}
                                    count={getAgentsByCategory(cat.id).length}
                                    color={cat.color}
                                />
                            ))}
                        </div>
                    </div>
                </motion.section>

                {/* Featured Section (only show when no search) */}
                {!searchQuery && selectedCategory === 'all' && (
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="px-8 pb-12"
                    >
                        <div className="max-w-6xl mx-auto">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-yellow-500/20">
                                        <Star size={18} className="text-yellow-400 fill-yellow-400" />
                                    </div>
                                    <h2 className="text-2xl font-semibold text-white">Featured Agents</h2>
                                </div>
                                <button className="flex items-center gap-1 text-sm text-white/40 hover:text-white transition-colors">
                                    <span>View all</span>
                                    <ChevronRight size={16} />
                                </button>
                            </div>

                            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                                {featuredAgents.map((agent, index) => (
                                    <motion.div
                                        key={agent.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                                    >
                                        <AgentCard
                                            agent={agent}
                                            size="lg"
                                            onClick={() => handleAgentClick(agent)}
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.section>
                )}

                {/* Main Agent Grid/List */}
                <motion.section
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="px-8 pb-24"
                >
                    <div className="max-w-6xl mx-auto">
                        {/* Section Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-indigo-500/20">
                                    {searchQuery ? (
                                        <Search size={18} className="text-indigo-400" />
                                    ) : (
                                        <TrendingUp size={18} className="text-indigo-400" />
                                    )}
                                </div>
                                <h2 className="text-2xl font-semibold text-white">
                                    {searchQuery
                                        ? `Results for "${searchQuery}"`
                                        : selectedCategory === 'all'
                                            ? 'All Agents'
                                            : AGENT_CATEGORIES.find(c => c.id === selectedCategory)?.name}
                                </h2>
                                <span className="text-sm text-white/40">
                                    ({filteredAgents.length} {filteredAgents.length === 1 ? 'agent' : 'agents'})
                                </span>
                            </div>
                        </div>

                        {/* Empty State */}
                        {filteredAgents.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-20"
                            >
                                <div className="p-4 rounded-2xl bg-white/5 mb-4">
                                    <Search size={32} className="text-white/20" />
                                </div>
                                <h3 className="text-xl text-white/60 mb-2">No agents found</h3>
                                <p className="text-white/40 text-center max-w-md">
                                    Try adjusting your search or explore by category.
                                    You can also discover agents by URL.
                                </p>
                                <button
                                    onClick={() => setShowProbe(true)}
                                    className="mt-6 flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-medium transition-colors"
                                >
                                    <Globe size={18} />
                                    <span>Discover by URL</span>
                                </button>
                            </motion.div>
                        )}

                        {/* Grid View */}
                        {viewMode === 'grid' && filteredAgents.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredAgents.map((agent, index) => (
                                    <motion.div
                                        key={agent.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: Math.min(index * 0.05, 0.5), duration: 0.4 }}
                                    >
                                        <AgentCard
                                            agent={agent}
                                            size="md"
                                            onClick={() => handleAgentClick(agent)}
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {/* List View */}
                        {viewMode === 'list' && filteredAgents.length > 0 && (
                            <div className="flex flex-col gap-3">
                                {filteredAgents.map((agent, index) => (
                                    <motion.div
                                        key={agent.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.3 }}
                                    >
                                        <AgentCardCompact
                                            agent={agent}
                                            onClick={() => handleAgentClick(agent)}
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.section>
            </div>

            {/* Agent Detail Modal */}
            <AnimatePresence>
                {selectedAgent && (
                    <AgentDetailModal
                        agent={selectedAgent}
                        onClose={() => setSelectedAgent(null)}
                        onConnect={handleConnect}
                    />
                )}
            </AnimatePresence>

            {/* Backdrop for open chats - only visible if connected */}
            <AnimatePresence>
                {isChatOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => {
                            // Optional: Click backdrop to minimize all? 
                            // For now let's just leave it neutral
                        }}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm z-30 pointer-events-none"
                    />
                )}
            </AnimatePresence>

            {/* Open Chat Windows */}
            {openChats.map(chat => (
                <AgentChatWindow
                    key={chat.agent.id}
                    agent={chat.agent}
                    position={chat.position}
                    isActive={activeChat === chat.agent.id}
                    onClose={() => handleCloseChat(chat.agent.id)}
                    onFocus={() => handleFocusChat(chat.agent.id)}
                    className="z-40" // Ensure on top of backdrop
                />
            ))}
        </div>
    );
};

/**
 * CategoryPill - A selectable category filter
 */
const CategoryPill: React.FC<{
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    count: number;
    color?: string;
}> = ({ active, onClick, icon, label, count, color }) => (
    <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all',
            active
                ? 'bg-white/15 border border-white/20 text-white'
                : 'bg-white/5 border border-transparent text-white/60 hover:bg-white/10 hover:text-white'
        )}
        style={{
            borderColor: active && color ? `${color}40` : undefined,
            backgroundColor: active && color ? `${color}15` : undefined,
        }}
    >
        {icon}
        <span className="font-medium text-sm">{label}</span>
        <span className={cn(
            'px-2 py-0.5 rounded-md text-xs',
            active ? 'bg-white/10' : 'bg-black/20'
        )}>
            {count}
        </span>
    </motion.button>
);

/**
 * AgentDetailModal - Full-screen agent details
 */
const AgentDetailModal: React.FC<{
    agent: CuratedAgent;
    onClose: () => void;
    onConnect: (agent: CuratedAgent) => void;
}> = ({ agent, onClose, onConnect }) => {
    const category = AGENT_CATEGORIES.find(c => c.id === agent.category);
    const AgentIcon = agent.icon;
    const CategoryIcon = category?.icon;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-8"
        >
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />

            {/* Modal Content */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 backdrop-blur-2xl"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
                >
                    <X size={20} className="text-white" />
                </button>

                {/* Header */}
                <div className="relative p-8 pb-0">
                    {/* Gradient glow */}
                    <div
                        className="absolute top-0 left-0 right-0 h-48 opacity-30 pointer-events-none"
                        style={{
                            background: `radial-gradient(ellipse at top, ${agent.color || category?.color}, transparent 70%)`
                        }}
                    />

                    <div className="relative flex items-start gap-6">
                        {/* Icon */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.1, type: 'spring' }}
                            className="flex-shrink-0 w-24 h-24 rounded-2xl flex items-center justify-center text-5xl text-white"
                            style={{
                                backgroundColor: `${agent.color || category?.color}20`,
                                boxShadow: `0 8px 32px ${agent.color || category?.color}40`
                            }}
                        >
                            <AgentIcon size={48} />
                        </motion.div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                                <h2 className="text-3xl font-bold text-white">{agent.name}</h2>
                                {agent.verified && (
                                    <div className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium">
                                        Verified
                                    </div>
                                )}
                            </div>
                            <p className="text-white/50 mb-3">
                                by {agent.provider.name}
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5">
                                    <div className="p-1 rounded-md bg-yellow-500/20">
                                        <Star size={14} className="text-yellow-400 fill-yellow-400" />
                                    </div>
                                    <span className="text-white font-medium">{agent.rating}</span>
                                    <span className="text-white/40 text-sm">({agent.reviewCount.toLocaleString()} reviews)</span>
                                </div>
                                <div
                                    className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                                    style={{
                                        backgroundColor: `${category?.color}20`,
                                        color: category?.color
                                    }}
                                >
                                    {CategoryIcon && <CategoryIcon size={12} />}
                                    <span>{category?.name}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-8 space-y-6">
                    {/* Description */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-3">About</h3>
                        <p className="text-white/70 leading-relaxed">{agent.description}</p>
                    </div>

                    {/* Capabilities */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Capabilities</h3>
                        <div className="flex flex-wrap gap-2">
                            {agent.capabilities.streaming && (
                                <CapabilityBadge icon={<Zap size={14} />} label="Streaming" color="#10B981" />
                            )}
                            {agent.capabilities.a2ui && (
                                <CapabilityBadge icon={<Sparkles size={14} />} label="A2UI Support" color="#6366F1" />
                            )}
                            {agent.capabilities.pushNotifications && (
                                <CapabilityBadge icon={<Globe size={14} />} label="Push Notifications" color="#F59E0B" />
                            )}
                            {agent.capabilities.fileUpload && (
                                <CapabilityBadge icon={<Filter size={14} />} label="File Upload" color="#EC4899" />
                            )}
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                            {agent.tags.map(tag => (
                                <span
                                    key={tag}
                                    className="px-3 py-1 rounded-full bg-white/5 text-white/60 text-sm"
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <InfoCard label="Version" value={`v${agent.version}`} />
                        <InfoCard label="Authentication" value={agent.authentication === 'none' ? 'None required' : agent.authentication.toUpperCase()} />
                        <InfoCard label="Added" value={new Date(agent.addedAt).toLocaleDateString()} />
                        <InfoCard label="Endpoint" value={agent.url} />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 pt-0">
                    <motion.button
                        onClick={() => onConnect(agent)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                            'w-full py-4 rounded-xl font-semibold text-lg',
                            'bg-gradient-to-r from-indigo-500 to-purple-500 text-white',
                            'hover:from-indigo-400 hover:to-purple-400',
                            'transition-all duration-200 shadow-lg shadow-indigo-500/25'
                        )}
                    >
                        Connect to {agent.name}
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    );
};

const CapabilityBadge: React.FC<{
    icon: React.ReactNode;
    label: string;
    color: string;
}> = ({ icon, label, color }) => (
    <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{ backgroundColor: `${color}15`, color }}
    >
        {icon}
        <span className="text-sm font-medium">{label}</span>
    </div>
);

const InfoCard: React.FC<{
    label: string;
    value: string;
}> = ({ label, value }) => (
    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
        <div className="text-xs text-white/40 mb-1">{label}</div>
        <div className="text-white font-medium truncate">{value}</div>
    </div>
);

export default AgentHub;
