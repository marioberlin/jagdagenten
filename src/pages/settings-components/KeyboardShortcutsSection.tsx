import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Keyboard,
    Search,
    RotateCcw,
    Download,
    Upload,
    Edit3,
    X,
    Check,
    Command,
    ChevronDown,
} from 'lucide-react';
import { GlassContainer, GlassButton, GlassInput } from '@/components';
import { cn } from '@/utils/cn';

// ============================================
// Types
// ============================================

interface Shortcut {
    id: string;
    action: string;
    keys: string[];
    category: string;
    customizable: boolean;
    description?: string;
}

type ShortcutCategory = 'navigation' | 'trading' | 'dashboard' | 'general' | 'editing';

// ============================================
// Default Shortcuts
// ============================================

const DEFAULT_SHORTCUTS: Shortcut[] = [
    // Navigation
    { id: 's1', action: 'Open Command Palette', keys: ['Cmd', 'K'], category: 'navigation', customizable: true, description: 'Quick access to all commands' },
    { id: 's2', action: 'Go to Dashboard', keys: ['G', 'D'], category: 'navigation', customizable: true },
    { id: 's3', action: 'Go to Bots', keys: ['G', 'B'], category: 'navigation', customizable: true },
    { id: 's4', action: 'Go to Settings', keys: ['G', 'S'], category: 'navigation', customizable: true },
    { id: 's5', action: 'Go to Agent Hub', keys: ['G', 'A'], category: 'navigation', customizable: true },
    { id: 's6', action: 'Toggle Sidebar', keys: ['Cmd', '\\'], category: 'navigation', customizable: true },

    // Trading
    { id: 't1', action: 'New Trade', keys: ['N'], category: 'trading', customizable: true },
    { id: 't2', action: 'Quick Buy', keys: ['Shift', 'B'], category: 'trading', customizable: true },
    { id: 't3', action: 'Quick Sell', keys: ['Shift', 'S'], category: 'trading', customizable: true },
    { id: 't4', action: 'Close All Positions', keys: ['Cmd', 'Shift', 'C'], category: 'trading', customizable: true },
    { id: 't5', action: 'Toggle Bot', keys: ['Cmd', 'Shift', 'B'], category: 'trading', customizable: true },

    // Dashboard
    { id: 'd1', action: 'Refresh Data', keys: ['R'], category: 'dashboard', customizable: true },
    { id: 'd2', action: 'Toggle Time Range', keys: ['T'], category: 'dashboard', customizable: true },
    { id: 'd3', action: 'Export Data', keys: ['Cmd', 'E'], category: 'dashboard', customizable: true },
    { id: 'd4', action: 'Toggle Chart Type', keys: ['C'], category: 'dashboard', customizable: true },

    // General
    { id: 'g1', action: 'Search', keys: ['Cmd', 'F'], category: 'general', customizable: false },
    { id: 'g2', action: 'Undo', keys: ['Cmd', 'Z'], category: 'general', customizable: false },
    { id: 'g3', action: 'Redo', keys: ['Cmd', 'Shift', 'Z'], category: 'general', customizable: false },
    { id: 'g4', action: 'Help', keys: ['?'], category: 'general', customizable: true },
    { id: 'g5', action: 'Toggle Theme', keys: ['Cmd', 'Shift', 'T'], category: 'general', customizable: true },

    // Editing
    { id: 'e1', action: 'Save', keys: ['Cmd', 'S'], category: 'editing', customizable: false },
    { id: 'e2', action: 'Select All', keys: ['Cmd', 'A'], category: 'editing', customizable: false },
    { id: 'e3', action: 'Copy', keys: ['Cmd', 'C'], category: 'editing', customizable: false },
    { id: 'e4', action: 'Paste', keys: ['Cmd', 'V'], category: 'editing', customizable: false },
    { id: 'e5', action: 'Cut', keys: ['Cmd', 'X'], category: 'editing', customizable: false },
];

const CATEGORY_CONFIG: Record<ShortcutCategory, { label: string; color: string; bgColor: string }> = {
    navigation: { label: 'Navigation', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
    trading: { label: 'Trading', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
    dashboard: { label: 'Dashboard', color: 'text-violet-400', bgColor: 'bg-violet-500/20' },
    general: { label: 'General', color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
    editing: { label: 'Editing', color: 'text-gray-400', bgColor: 'bg-gray-500/20' },
};

// ============================================
// Key Badge Component
// ============================================

const KeyBadge: React.FC<{ keyName: string }> = ({ keyName }) => {
    const isModifier = ['Cmd', 'Ctrl', 'Alt', 'Shift', 'Option'].includes(keyName);

    return (
        <span
            className={cn(
                'inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-medium',
                'bg-white/10 border border-white/20',
                isModifier ? 'text-secondary' : 'text-primary'
            )}
        >
            {keyName === 'Cmd' ? (
                <Command className="w-3 h-3" />
            ) : (
                keyName
            )}
        </span>
    );
};

// ============================================
// Shortcut Row Component
// ============================================

interface ShortcutRowProps {
    shortcut: Shortcut;
    onEdit: (shortcut: Shortcut) => void;
    isEditing: boolean;
    editingKeys: string[];
    onSaveEdit: () => void;
    onCancelEdit: () => void;
}

const ShortcutRow: React.FC<ShortcutRowProps> = ({
    shortcut,
    onEdit,
    isEditing,
    editingKeys,
    onSaveEdit,
    onCancelEdit,
}) => {
    const categoryConfig = CATEGORY_CONFIG[shortcut.category as ShortcutCategory];

    return (
        <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
                'flex items-center justify-between p-3 rounded-xl',
                'bg-white/5 hover:bg-white/8 transition-colors',
                isEditing && 'ring-2 ring-primary bg-white/10'
            )}
        >
            <div className="flex items-center gap-3 flex-1">
                <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', categoryConfig.bgColor, categoryConfig.color)}>
                    {categoryConfig.label}
                </span>
                <div>
                    <div className="text-sm font-medium text-primary">{shortcut.action}</div>
                    {shortcut.description && (
                        <div className="text-xs text-tertiary">{shortcut.description}</div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3">
                {isEditing ? (
                    <>
                        <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 border border-primary/50">
                            {editingKeys.length > 0 ? (
                                editingKeys.map((key, i) => (
                                    <React.Fragment key={i}>
                                        {i > 0 && <span className="text-tertiary mx-0.5">+</span>}
                                        <KeyBadge keyName={key} />
                                    </React.Fragment>
                                ))
                            ) : (
                                <span className="text-sm text-secondary">Press keys...</span>
                            )}
                        </div>
                        <button
                            onClick={onSaveEdit}
                            className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                        >
                            <Check className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onCancelEdit}
                            className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-1">
                            {shortcut.keys.map((key, i) => (
                                <React.Fragment key={i}>
                                    {i > 0 && <span className="text-tertiary mx-0.5">+</span>}
                                    <KeyBadge keyName={key} />
                                </React.Fragment>
                            ))}
                        </div>
                        {shortcut.customizable && (
                            <button
                                onClick={() => onEdit(shortcut)}
                                className="p-1.5 rounded-lg text-secondary hover:bg-white/10 hover:text-primary transition-colors"
                                title="Edit shortcut"
                            >
                                <Edit3 className="w-4 h-4" />
                            </button>
                        )}
                    </>
                )}
            </div>
        </motion.div>
    );
};

// ============================================
// Main Component
// ============================================

export const KeyboardShortcutsSection: React.FC = () => {
    const [shortcuts, setShortcuts] = useState<Shortcut[]>(DEFAULT_SHORTCUTS);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['navigation', 'trading', 'dashboard']));
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingKeys, setEditingKeys] = useState<string[]>([]);

    // Group shortcuts by category
    const groupedShortcuts = useMemo(() => {
        const filtered = searchQuery.trim()
            ? shortcuts.filter(s =>
                s.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.keys.join(' ').toLowerCase().includes(searchQuery.toLowerCase())
            )
            : shortcuts;

        return Object.entries(CATEGORY_CONFIG).reduce((acc, [category]) => {
            acc[category] = filtered.filter(s => s.category === category);
            return acc;
        }, {} as Record<string, Shortcut[]>);
    }, [shortcuts, searchQuery]);

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(category)) {
                next.delete(category);
            } else {
                next.add(category);
            }
            return next;
        });
    };

    const handleEdit = (shortcut: Shortcut) => {
        setEditingId(shortcut.id);
        setEditingKeys([]);
    };

    const handleSaveEdit = () => {
        if (editingId && editingKeys.length > 0) {
            setShortcuts(prev => prev.map(s =>
                s.id === editingId ? { ...s, keys: editingKeys } : s
            ));
        }
        setEditingId(null);
        setEditingKeys([]);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditingKeys([]);
    };

    const handleReset = () => {
        setShortcuts(DEFAULT_SHORTCUTS);
    };

    // Keyboard listener for editing
    React.useEffect(() => {
        if (!editingId) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();

            const keys: string[] = [];

            if (e.metaKey || e.ctrlKey) keys.push('Cmd');
            if (e.shiftKey) keys.push('Shift');
            if (e.altKey) keys.push('Alt');

            if (!['Meta', 'Control', 'Shift', 'Alt'].includes(e.key)) {
                const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
                keys.push(key);
            }

            if (keys.length > 0) {
                setEditingKeys(keys);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [editingId]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-cyan-500/20">
                        <Keyboard className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-primary">Keyboard Shortcuts</h3>
                        <p className="text-sm text-secondary">
                            View and customize keyboard shortcuts
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <GlassButton variant="ghost" size="sm" onClick={handleReset}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset
                    </GlassButton>
                    <GlassButton variant="secondary" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </GlassButton>
                    <GlassButton variant="secondary" size="sm">
                        <Upload className="w-4 h-4 mr-2" />
                        Import
                    </GlassButton>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                <GlassInput
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search shortcuts..."
                    className="pl-10"
                />
            </div>

            {/* Shortcut Categories */}
            <div className="space-y-4">
                {Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
                    const categoryShortcuts = groupedShortcuts[category] || [];
                    if (categoryShortcuts.length === 0) return null;

                    const isExpanded = expandedCategories.has(category);

                    return (
                        <GlassContainer key={category} className="overflow-hidden" border>
                            {/* Category Header */}
                            <button
                                onClick={() => toggleCategory(category)}
                                className={cn(
                                    'w-full flex items-center justify-between p-4',
                                    'hover:bg-white/5 transition-colors'
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={cn('px-3 py-1 rounded-lg text-sm font-medium', config.bgColor, config.color)}>
                                        {config.label}
                                    </span>
                                    <span className="text-sm text-secondary">
                                        {categoryShortcuts.length} shortcuts
                                    </span>
                                </div>
                                <ChevronDown
                                    className={cn(
                                        'w-5 h-5 text-secondary transition-transform',
                                        isExpanded && 'rotate-180'
                                    )}
                                />
                            </button>

                            {/* Category Shortcuts */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: 'auto' }}
                                        exit={{ height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-4 pb-4 space-y-2">
                                            {categoryShortcuts.map((shortcut) => (
                                                <ShortcutRow
                                                    key={shortcut.id}
                                                    shortcut={shortcut}
                                                    onEdit={handleEdit}
                                                    isEditing={editingId === shortcut.id}
                                                    editingKeys={editingKeys}
                                                    onSaveEdit={handleSaveEdit}
                                                    onCancelEdit={handleCancelEdit}
                                                />
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </GlassContainer>
                    );
                })}
            </div>

            {/* Tips */}
            <GlassContainer className="p-4" border>
                <h4 className="text-sm font-medium text-primary mb-3">Tips</h4>
                <ul className="space-y-2 text-sm text-secondary">
                    <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        Click the edit button on customizable shortcuts to change the key binding
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        Press your desired key combination while editing to set a new shortcut
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        Gray shortcuts are system defaults and cannot be changed
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        Use Export/Import to share your shortcuts across devices
                    </li>
                </ul>
            </GlassContainer>
        </div>
    );
};

export default KeyboardShortcutsSection;
