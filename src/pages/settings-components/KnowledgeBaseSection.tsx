import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Book,
    Plus,
    Search,
    Trash2,
    Edit3,
    Save,
    X,
    Tag,
    Globe,
    FileText,
    Upload,
    ChevronDown,
    ChevronUp,
    Star,
    StarOff,
    Copy,
    Check,
    AlertCircle,
    Sparkles,
} from 'lucide-react';
import { GlassContainer, GlassButton, GlassInput, GlassTextarea } from '@/components';
import { cn } from '@/utils/cn';

// ============================================
// Types
// ============================================

export interface KnowledgeItem {
    id: string;
    title: string;
    content: string;
    type: 'fact' | 'context' | 'instruction' | 'schema';
    category: string;
    tags: string[];
    priority: 'low' | 'medium' | 'high';
    scope: 'global' | 'route';
    routes?: string[];
    createdAt: Date;
    updatedAt: Date;
}

type KnowledgeFilter = 'all' | 'global' | 'route' | 'fact' | 'context' | 'instruction' | 'schema';

// ============================================
// Mock Data
// ============================================

const CATEGORIES = [
    'General',
    'User Preferences',
    'Business Rules',
    'Trading',
    'Technical',
    'Custom',
];

const MOCK_KNOWLEDGE: KnowledgeItem[] = [
    {
        id: 'k1',
        title: 'User Trading Style',
        content: 'The user prefers conservative trading strategies with a focus on long-term positions. They typically hold assets for 30-90 days and prefer to use stop-losses at 5-10% below entry.',
        type: 'context',
        category: 'User Preferences',
        tags: ['trading', 'strategy', 'risk'],
        priority: 'high',
        scope: 'global',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
        id: 'k2',
        title: 'Portfolio Allocation Rules',
        content: 'Never allocate more than 20% of portfolio to a single asset. Maintain at least 10% in stablecoins. Rebalance quarterly or when any position exceeds 25%.',
        type: 'instruction',
        category: 'Business Rules',
        tags: ['portfolio', 'allocation', 'rebalancing'],
        priority: 'high',
        scope: 'global',
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    },
    {
        id: 'k3',
        title: 'Dashboard Data Schema',
        content: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FinancialProduct',
            'name': 'Trading Portfolio',
            'description': 'User cryptocurrency trading portfolio',
            'provider': {
                '@type': 'Organization',
                'name': 'LiquidCrypto'
            }
        }, null, 2),
        type: 'schema',
        category: 'Technical',
        tags: ['schema', 'json-ld', 'structured-data'],
        priority: 'medium',
        scope: 'route',
        routes: ['/terminal/dashboard'],
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
        id: 'k4',
        title: 'Preferred Cryptocurrencies',
        content: 'The user primarily trades BTC, ETH, and SOL. They have expressed interest in LINK and AVAX but consider them higher risk. Avoid meme coins and tokens with market cap under $1B.',
        type: 'fact',
        category: 'User Preferences',
        tags: ['crypto', 'preferences', 'assets'],
        priority: 'medium',
        scope: 'global',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
];

// ============================================
// Knowledge Item Component
// ============================================

interface KnowledgeItemCardProps {
    item: KnowledgeItem;
    onEdit: (item: KnowledgeItem) => void;
    onDelete: (id: string) => void;
    onTogglePriority: (id: string) => void;
}

const KnowledgeItemCard: React.FC<KnowledgeItemCardProps> = ({
    item,
    onEdit,
    onDelete,
    onTogglePriority,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    const typeConfig = {
        fact: { color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Fact' },
        context: { color: 'text-purple-400', bg: 'bg-purple-500/20', label: 'Context' },
        instruction: { color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: 'Instruction' },
        schema: { color: 'text-amber-400', bg: 'bg-amber-500/20', label: 'Schema' },
    };

    const priorityConfig = {
        low: { color: 'text-gray-400', label: 'Low' },
        medium: { color: 'text-amber-400', label: 'Medium' },
        high: { color: 'text-red-400', label: 'High' },
    };

    const config = typeConfig[item.type];
    const priority = priorityConfig[item.priority];

    const handleCopy = () => {
        navigator.clipboard.writeText(item.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
                'rounded-xl border border-white/10 bg-white/5',
                'hover:border-white/20 hover:bg-white/8',
                'transition-all duration-200'
            )}
        >
            {/* Header */}
            <div
                className="flex items-start justify-between p-4 cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium text-primary truncate">{item.title}</h4>
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', config.bg, config.color)}>
                            {config.label}
                        </span>
                        {item.scope === 'global' && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-cyan-500/20 text-cyan-400">
                                <Globe className="w-3 h-3 inline mr-1" />
                                Global
                            </span>
                        )}
                        <span className={cn('text-xs', priority.color)}>
                            {priority.label} Priority
                        </span>
                    </div>
                    <p className="text-sm text-secondary mt-1 line-clamp-2">
                        {item.type === 'schema' ? 'JSON-LD Schema' : item.content}
                    </p>
                </div>
                <div className="flex items-center gap-1 ml-4">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onTogglePriority(item.id);
                        }}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-secondary hover:text-amber-400 transition-colors"
                        title={item.priority === 'high' ? 'Lower priority' : 'Increase priority'}
                    >
                        {item.priority === 'high' ? (
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ) : (
                            <StarOff className="w-4 h-4" />
                        )}
                    </button>
                    {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-secondary" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-secondary" />
                    )}
                </div>
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 border-t border-white/10">
                            {/* Content */}
                            <div className="mt-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-secondary font-medium uppercase tracking-wider">
                                        Content
                                    </span>
                                    <button
                                        onClick={handleCopy}
                                        className="p-1 rounded hover:bg-white/10 text-secondary hover:text-primary transition-colors"
                                        title="Copy content"
                                    >
                                        {copied ? (
                                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                                        ) : (
                                            <Copy className="w-3.5 h-3.5" />
                                        )}
                                    </button>
                                </div>
                                <pre className={cn(
                                    'p-3 rounded-lg bg-black/30 text-sm overflow-x-auto',
                                    item.type === 'schema' ? 'font-mono text-xs' : 'whitespace-pre-wrap'
                                )}>
                                    {item.content}
                                </pre>
                            </div>

                            {/* Tags */}
                            <div className="mt-4">
                                <span className="text-xs text-secondary font-medium uppercase tracking-wider">
                                    Tags
                                </span>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {item.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-secondary"
                                        >
                                            <Tag className="w-3 h-3 inline mr-1" />
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Routes (if route-specific) */}
                            {item.scope === 'route' && item.routes && (
                                <div className="mt-4">
                                    <span className="text-xs text-secondary font-medium uppercase tracking-wider">
                                        Applied to Routes
                                    </span>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {item.routes.map((route) => (
                                            <span
                                                key={route}
                                                className="px-2 py-0.5 rounded-full text-xs bg-cyan-500/10 text-cyan-400 font-mono"
                                            >
                                                {route}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Meta */}
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                                <div className="text-xs text-tertiary">
                                    <span className="mr-4">Category: {item.category}</span>
                                    <span>Updated: {item.updatedAt.toLocaleDateString()}</span>
                                </div>
                                <div className="flex gap-2">
                                    <GlassButton
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit(item);
                                        }}
                                    >
                                        <Edit3 className="w-3.5 h-3.5 mr-1" />
                                        Edit
                                    </GlassButton>
                                    <GlassButton
                                        size="sm"
                                        variant="ghost"
                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(item.id);
                                        }}
                                    >
                                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                                        Delete
                                    </GlassButton>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// ============================================
// Add/Edit Modal Component
// ============================================

interface KnowledgeEditorProps {
    item?: KnowledgeItem | null;
    onSave: (item: Omit<KnowledgeItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
    onClose: () => void;
}

const KnowledgeEditor: React.FC<KnowledgeEditorProps> = ({ item, onSave, onClose }) => {
    const [title, setTitle] = useState(item?.title || '');
    const [content, setContent] = useState(item?.content || '');
    const [type, setType] = useState<KnowledgeItem['type']>(item?.type || 'context');
    const [category, setCategory] = useState(item?.category || 'General');
    const [tagsInput, setTagsInput] = useState(item?.tags.join(', ') || '');
    const [priority, setPriority] = useState<KnowledgeItem['priority']>(item?.priority || 'medium');
    const [scope, setScope] = useState<KnowledgeItem['scope']>(item?.scope || 'global');
    const [routesInput, setRoutesInput] = useState(item?.routes?.join(', ') || '');

    const handleSubmit = () => {
        if (!title.trim() || !content.trim()) return;

        onSave({
            title: title.trim(),
            content: content.trim(),
            type,
            category,
            tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
            priority,
            scope,
            routes: scope === 'route' ? routesInput.split(',').map(r => r.trim()).filter(Boolean) : undefined,
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <GlassContainer className="p-6" border>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-primary">
                            {item ? 'Edit Knowledge Item' : 'Add Knowledge Item'}
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-white/10 text-secondary transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-2">
                                Title
                            </label>
                            <GlassInput
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Give this knowledge a clear title..."
                            />
                        </div>

                        {/* Type & Category */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">
                                    Type
                                </label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value as KnowledgeItem['type'])}
                                    className={cn(
                                        'w-full px-3 py-2 rounded-xl',
                                        'bg-white/5 border border-white/10',
                                        'text-primary text-sm',
                                        'focus:outline-none focus:ring-2 focus:ring-primary/50'
                                    )}
                                >
                                    <option value="fact">Fact</option>
                                    <option value="context">Context</option>
                                    <option value="instruction">Instruction</option>
                                    <option value="schema">Schema (JSON-LD)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">
                                    Category
                                </label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className={cn(
                                        'w-full px-3 py-2 rounded-xl',
                                        'bg-white/5 border border-white/10',
                                        'text-primary text-sm',
                                        'focus:outline-none focus:ring-2 focus:ring-primary/50'
                                    )}
                                >
                                    {CATEGORIES.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Content */}
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-2">
                                Content
                            </label>
                            <GlassTextarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder={type === 'schema' ? '{\n  "@context": "https://schema.org",\n  ...\n}' : 'Enter the knowledge content...'}
                                className={cn(
                                    'min-h-[150px]',
                                    type === 'schema' && 'font-mono text-sm'
                                )}
                            />
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-2">
                                Tags (comma-separated)
                            </label>
                            <GlassInput
                                value={tagsInput}
                                onChange={(e) => setTagsInput(e.target.value)}
                                placeholder="trading, strategy, risk..."
                            />
                        </div>

                        {/* Priority & Scope */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">
                                    Priority
                                </label>
                                <div className="flex gap-2">
                                    {(['low', 'medium', 'high'] as const).map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setPriority(p)}
                                            className={cn(
                                                'flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                                                priority === p
                                                    ? 'bg-primary text-white'
                                                    : 'bg-white/5 text-secondary hover:bg-white/10'
                                            )}
                                        >
                                            {p.charAt(0).toUpperCase() + p.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">
                                    Scope
                                </label>
                                <div className="flex gap-2">
                                    {(['global', 'route'] as const).map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => setScope(s)}
                                            className={cn(
                                                'flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                                                scope === s
                                                    ? 'bg-primary text-white'
                                                    : 'bg-white/5 text-secondary hover:bg-white/10'
                                            )}
                                        >
                                            {s === 'global' ? (
                                                <><Globe className="w-4 h-4 inline mr-1" /> Global</>
                                            ) : (
                                                <><FileText className="w-4 h-4 inline mr-1" /> Route</>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Routes (if route-specific) */}
                        {scope === 'route' && (
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">
                                    Routes (comma-separated)
                                </label>
                                <GlassInput
                                    value={routesInput}
                                    onChange={(e) => setRoutesInput(e.target.value)}
                                    placeholder="/terminal/dashboard, /terminal/bots..."
                                />
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-white/10">
                        <GlassButton variant="secondary" onClick={onClose}>
                            Cancel
                        </GlassButton>
                        <GlassButton
                            variant="primary"
                            onClick={handleSubmit}
                            disabled={!title.trim() || !content.trim()}
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {item ? 'Save Changes' : 'Add Knowledge'}
                        </GlassButton>
                    </div>
                </GlassContainer>
            </motion.div>
        </motion.div>
    );
};

// ============================================
// Main Component
// ============================================

export const KnowledgeBaseSection: React.FC = () => {
    const [knowledge, setKnowledge] = useState<KnowledgeItem[]>(MOCK_KNOWLEDGE);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<KnowledgeFilter>('all');
    const [showEditor, setShowEditor] = useState(false);
    const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);

    const FILTER_OPTIONS: { value: KnowledgeFilter; label: string }[] = [
        { value: 'all', label: 'All' },
        { value: 'global', label: 'Global' },
        { value: 'route', label: 'Route-Specific' },
        { value: 'fact', label: 'Facts' },
        { value: 'context', label: 'Context' },
        { value: 'instruction', label: 'Instructions' },
        { value: 'schema', label: 'Schemas' },
    ];

    const filteredKnowledge = useMemo(() => {
        let result = knowledge;

        // Apply filter
        if (filter === 'global') {
            result = result.filter(k => k.scope === 'global');
        } else if (filter === 'route') {
            result = result.filter(k => k.scope === 'route');
        } else if (['fact', 'context', 'instruction', 'schema'].includes(filter)) {
            result = result.filter(k => k.type === filter);
        }

        // Apply search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(k =>
                k.title.toLowerCase().includes(query) ||
                k.content.toLowerCase().includes(query) ||
                k.tags.some(t => t.toLowerCase().includes(query)) ||
                k.category.toLowerCase().includes(query)
            );
        }

        // Sort by priority, then by date
        return result.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            return b.updatedAt.getTime() - a.updatedAt.getTime();
        });
    }, [knowledge, filter, searchQuery]);

    const handleSave = (itemData: Omit<KnowledgeItem, 'id' | 'createdAt' | 'updatedAt'>) => {
        if (editingItem) {
            setKnowledge(prev => prev.map(k =>
                k.id === editingItem.id
                    ? { ...k, ...itemData, updatedAt: new Date() }
                    : k
            ));
        } else {
            const newItem: KnowledgeItem = {
                ...itemData,
                id: `k${Date.now()}`,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            setKnowledge(prev => [newItem, ...prev]);
        }
        setShowEditor(false);
        setEditingItem(null);
    };

    const handleEdit = (item: KnowledgeItem) => {
        setEditingItem(item);
        setShowEditor(true);
    };

    const handleDelete = (id: string) => {
        setKnowledge(prev => prev.filter(k => k.id !== id));
    };

    const handleTogglePriority = (id: string) => {
        setKnowledge(prev => prev.map(k => {
            if (k.id !== id) return k;
            const nextPriority: Record<KnowledgeItem['priority'], KnowledgeItem['priority']> = {
                low: 'medium',
                medium: 'high',
                high: 'low',
            };
            return { ...k, priority: nextPriority[k.priority], updatedAt: new Date() };
        }));
    };

    const stats = useMemo(() => ({
        total: knowledge.length,
        global: knowledge.filter(k => k.scope === 'global').length,
        route: knowledge.filter(k => k.scope === 'route').length,
        highPriority: knowledge.filter(k => k.priority === 'high').length,
    }), [knowledge]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-violet-500/20">
                        <Book className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-primary">Knowledge Base</h3>
                        <p className="text-sm text-secondary">
                            Manage context and instructions for AI agents
                        </p>
                    </div>
                </div>
                <GlassButton
                    variant="primary"
                    onClick={() => {
                        setEditingItem(null);
                        setShowEditor(true);
                    }}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Knowledge
                </GlassButton>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Items', value: stats.total, color: 'text-primary' },
                    { label: 'Global', value: stats.global, color: 'text-cyan-400' },
                    { label: 'Route-Specific', value: stats.route, color: 'text-purple-400' },
                    { label: 'High Priority', value: stats.highPriority, color: 'text-amber-400' },
                ].map((stat) => (
                    <GlassContainer key={stat.label} className="p-4" border>
                        <div className={cn('text-2xl font-bold', stat.color)}>{stat.value}</div>
                        <div className="text-xs text-secondary">{stat.label}</div>
                    </GlassContainer>
                ))}
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                    <GlassInput
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search knowledge..."
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {FILTER_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setFilter(opt.value)}
                            className={cn(
                                'px-3 py-2 rounded-xl text-sm font-medium transition-all',
                                filter === opt.value
                                    ? 'bg-primary text-white'
                                    : 'bg-white/5 text-secondary hover:bg-white/10 hover:text-primary'
                            )}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Knowledge List */}
            <div className="space-y-3">
                <AnimatePresence>
                    {filteredKnowledge.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-12"
                        >
                            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-secondary opacity-30" />
                            <p className="text-secondary mb-1">
                                {searchQuery ? 'No matching knowledge found' : 'No knowledge items yet'}
                            </p>
                            <p className="text-xs text-tertiary">
                                {searchQuery ? 'Try adjusting your search' : 'Add your first knowledge item to get started'}
                            </p>
                        </motion.div>
                    ) : (
                        filteredKnowledge.map((item) => (
                            <KnowledgeItemCard
                                key={item.id}
                                item={item}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onTogglePriority={handleTogglePriority}
                            />
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Import Section */}
            <GlassContainer className="p-4" border>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/20">
                            <Upload className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-primary">Import Knowledge</h4>
                            <p className="text-xs text-secondary">
                                Import from PDF, TXT, or Markdown files
                            </p>
                        </div>
                    </div>
                    <GlassButton variant="secondary" size="sm">
                        <Upload className="w-4 h-4 mr-2" />
                        Import File
                    </GlassButton>
                </div>
            </GlassContainer>

            {/* AI Suggestions */}
            <GlassContainer className="p-4" border>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/20">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-primary">AI Suggestions</h4>
                            <p className="text-xs text-secondary">
                                Let AI analyze your usage and suggest knowledge items
                            </p>
                        </div>
                    </div>
                    <GlassButton variant="secondary" size="sm">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Suggestions
                    </GlassButton>
                </div>
            </GlassContainer>

            {/* Editor Modal */}
            <AnimatePresence>
                {showEditor && (
                    <KnowledgeEditor
                        item={editingItem}
                        onSave={handleSave}
                        onClose={() => {
                            setShowEditor(false);
                            setEditingItem(null);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default KnowledgeBaseSection;
