/**
 * SparklesLabelModal - Create or manage labels
 */

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Tag, Plus, Check } from 'lucide-react';
import { useSparklesStore } from '@/stores/sparklesStore';
import { cn } from '@/lib/utils';
import { applyLabel, removeLabel } from '@/services/sparklesApiActions';

// =============================================================================
// Types
// =============================================================================

interface SparklesLabelModalProps {
    threadId: string;
    onClose: () => void;
}

// =============================================================================
// Label Colors
// =============================================================================

const LABEL_COLORS = [
    { bg: '#4285F4', text: '#ffffff' }, // Blue
    { bg: '#EA4335', text: '#ffffff' }, // Red
    { bg: '#FBBC05', text: '#000000' }, // Yellow
    { bg: '#34A853', text: '#ffffff' }, // Green
    { bg: '#FF6D00', text: '#ffffff' }, // Orange
    { bg: '#46BDC6', text: '#ffffff' }, // Teal
    { bg: '#7C4DFF', text: '#ffffff' }, // Purple
    { bg: '#EC407A', text: '#ffffff' }, // Pink
];

// =============================================================================
// Component
// =============================================================================

export function SparklesLabelModal({ threadId, onClose }: SparklesLabelModalProps) {
    const { labels, accounts, activeAccountId, threads, threadCache } = useSparklesStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [newLabelName, setNewLabelName] = useState('');
    const [selectedColor, setSelectedColor] = useState(LABEL_COLORS[0]);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    const accountId = activeAccountId || accounts[0]?.id;
    const thread = threadCache[threadId] || threads.find((t) => t.id === threadId);
    const accountLabels = accountId ? labels[accountId] || [] : [];
    const userLabels = accountLabels.filter((l) => l.type === 'user');

    const filteredLabels = userLabels.filter((label) =>
        label.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleLabelToggle = useCallback(
        async (labelId: string, isApplied: boolean) => {
            if (isProcessing) return;
            setIsProcessing(labelId);

            try {
                if (isApplied) {
                    await removeLabel(threadId, labelId);
                } else {
                    await applyLabel(threadId, labelId);
                }
            } catch (error) {
                console.error('Failed to toggle label:', error);
            } finally {
                setIsProcessing(null);
            }
        },
        [threadId, isProcessing]
    );

    const handleCreateLabel = useCallback(async () => {
        if (!newLabelName.trim() || !accountId) return;

        try {
            const { profileApi, transformBackendLabel } = await import('@/services/sparklesApi');
            const backendLabel = await profileApi.createLabel(newLabelName.trim(), {
                textColor: selectedColor.text,
                backgroundColor: selectedColor.bg,
            });

            // Add the new label to the store
            const label = transformBackendLabel(backendLabel, accountId);
            useSparklesStore.getState().addLabel(accountId, label);

            setNewLabelName('');
            setIsCreating(false);
        } catch (error) {
            console.error('Failed to create label:', error);
            // TODO: Show error toast
        }
    }, [newLabelName, selectedColor, accountId]);

    return (
        <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <motion.div
                className={cn(
                    'relative w-full max-w-sm mx-4',
                    'bg-[var(--glass-bg)] backdrop-blur-2xl',
                    'border border-[var(--glass-border)]',
                    'rounded-2xl shadow-2xl',
                    'overflow-hidden'
                )}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--glass-border)]">
                    <h2 className="text-lg font-semibold text-[var(--glass-text-primary)]">
                        Labels
                    </h2>
                    <button
                        onClick={onClose}
                        className={cn(
                            'p-2 rounded-lg',
                            'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]',
                            'hover:bg-[var(--glass-surface-hover)]',
                            'transition-colors duration-150'
                        )}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="px-4 pt-4">
                    <input
                        type="text"
                        placeholder="Search labels..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={cn(
                            'w-full px-4 py-2 rounded-lg text-sm',
                            'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                            'text-[var(--glass-text-primary)]',
                            'placeholder:text-[var(--glass-text-tertiary)]',
                            'focus:outline-none focus:border-[var(--color-accent)]'
                        )}
                    />
                </div>

                {/* Labels List */}
                <div className="p-4 max-h-64 overflow-y-auto">
                    {filteredLabels.length === 0 && !isCreating ? (
                        <div className="text-center py-6 text-sm text-[var(--glass-text-tertiary)]">
                            No labels found
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredLabels.map((label) => {
                                const isApplied = thread?.labelIds.includes(label.id) ?? false;
                                const isLoading = isProcessing === label.id;

                                return (
                                    <button
                                        key={label.id}
                                        onClick={() => handleLabelToggle(label.id, isApplied)}
                                        disabled={isLoading}
                                        className={cn(
                                            'w-full flex items-center gap-3 px-3 py-2 rounded-lg',
                                            'hover:bg-[var(--glass-surface-hover)]',
                                            'transition-colors duration-150',
                                            'disabled:opacity-50'
                                        )}
                                    >
                                        <div
                                            className="w-4 h-4 rounded-sm flex items-center justify-center"
                                            style={{
                                                backgroundColor: label.color?.backgroundColor || '#888888',
                                            }}
                                        >
                                            {isApplied && (
                                                <Check className="w-3 h-3" style={{ color: label.color?.textColor || '#ffffff' }} />
                                            )}
                                        </div>
                                        <span className="flex-1 text-left text-sm text-[var(--glass-text-primary)]">
                                            {label.name}
                                        </span>
                                        {label.unreadCount > 0 && (
                                            <span className="text-xs text-[var(--glass-text-tertiary)]">
                                                {label.unreadCount}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Create Label Form */}
                    {isCreating && (
                        <div className="mt-4 pt-4 border-t border-[var(--glass-border)] space-y-3">
                            <input
                                type="text"
                                placeholder="Label name"
                                value={newLabelName}
                                onChange={(e) => setNewLabelName(e.target.value)}
                                className={cn(
                                    'w-full px-3 py-2 rounded-lg text-sm',
                                    'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                                    'text-[var(--glass-text-primary)]',
                                    'focus:outline-none focus:border-[var(--color-accent)]'
                                )}
                                autoFocus
                            />
                            <div className="flex gap-1">
                                {LABEL_COLORS.map((color, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedColor(color)}
                                        className={cn(
                                            'w-6 h-6 rounded-full',
                                            'ring-2 ring-offset-2 ring-offset-[var(--glass-bg)]',
                                            selectedColor === color ? 'ring-[var(--color-accent)]' : 'ring-transparent'
                                        )}
                                        style={{ backgroundColor: color.bg }}
                                    />
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsCreating(false)}
                                    className={cn(
                                        'flex-1 px-3 py-2 rounded-lg text-sm',
                                        'text-[var(--glass-text-secondary)]',
                                        'hover:bg-[var(--glass-surface-hover)]'
                                    )}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateLabel}
                                    disabled={!newLabelName.trim()}
                                    className={cn(
                                        'flex-1 px-3 py-2 rounded-lg text-sm font-medium',
                                        'bg-[var(--color-accent)] text-white',
                                        'hover:opacity-90 disabled:opacity-50'
                                    )}
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!isCreating && (
                    <div className="px-4 pb-4">
                        <button
                            onClick={() => setIsCreating(true)}
                            className={cn(
                                'w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg',
                                'bg-[var(--glass-surface)] hover:bg-[var(--glass-surface-hover)]',
                                'text-sm text-[var(--glass-text-primary)]',
                                'transition-colors duration-150'
                            )}
                        >
                            <Plus className="w-4 h-4" />
                            Create new label
                        </button>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}

export default SparklesLabelModal;
