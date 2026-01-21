/**
 * SparklesShortcutsModal - Keyboard shortcuts reference
 */

import { motion } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface SparklesShortcutsModalProps {
    onClose: () => void;
}

interface ShortcutGroup {
    title: string;
    shortcuts: { keys: string[]; description: string }[];
}

// =============================================================================
// Shortcuts Data
// =============================================================================

const SHORTCUT_GROUPS: ShortcutGroup[] = [
    {
        title: 'Navigation',
        shortcuts: [
            { keys: ['j'], description: 'Next thread' },
            { keys: ['k'], description: 'Previous thread' },
            { keys: ['o', 'Enter'], description: 'Open thread' },
            { keys: ['u'], description: 'Back to list' },
            { keys: ['g', 'i'], description: 'Go to Inbox' },
            { keys: ['g', 's'], description: 'Go to Starred' },
            { keys: ['g', 'd'], description: 'Go to Drafts' },
            { keys: ['g', 't'], description: 'Go to Sent' },
        ],
    },
    {
        title: 'Actions',
        shortcuts: [
            { keys: ['c'], description: 'Compose new email' },
            { keys: ['r'], description: 'Reply' },
            { keys: ['a'], description: 'Reply all' },
            { keys: ['f'], description: 'Forward' },
            { keys: ['e'], description: 'Archive' },
            { keys: ['#'], description: 'Delete' },
            { keys: ['s'], description: 'Star/Unstar' },
            { keys: ['b'], description: 'Snooze' },
        ],
    },
    {
        title: 'Selection',
        shortcuts: [
            { keys: ['x'], description: 'Select thread' },
            { keys: ['⌘', 'a'], description: 'Select all' },
            { keys: ['Escape'], description: 'Clear selection' },
        ],
    },
    {
        title: 'Application',
        shortcuts: [
            { keys: ['/'], description: 'Search' },
            { keys: ['⌘', ','], description: 'Settings' },
            { keys: ['?'], description: 'Show shortcuts' },
            { keys: ['Escape'], description: 'Close panel' },
        ],
    },
];

// =============================================================================
// Component
// =============================================================================

export function SparklesShortcutsModal({ onClose }: SparklesShortcutsModalProps) {
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
                    'relative w-full max-w-2xl max-h-[80vh] mx-4',
                    'bg-[var(--glass-bg)] backdrop-blur-2xl',
                    'border border-[var(--glass-border)]',
                    'rounded-2xl shadow-2xl',
                    'overflow-hidden flex flex-col'
                )}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--glass-border)]">
                    <div className="flex items-center gap-3">
                        <Keyboard className="w-5 h-5 text-[var(--color-accent)]" />
                        <h2 className="text-lg font-semibold text-[var(--glass-text-primary)]">
                            Keyboard Shortcuts
                        </h2>
                    </div>
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

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-2 gap-8">
                        {SHORTCUT_GROUPS.map((group) => (
                            <div key={group.title}>
                                <h3 className="text-sm font-semibold text-[var(--glass-text-primary)] mb-3">
                                    {group.title}
                                </h3>
                                <div className="space-y-2">
                                    {group.shortcuts.map((shortcut, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between gap-4"
                                        >
                                            <span className="text-sm text-[var(--glass-text-secondary)]">
                                                {shortcut.description}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                {shortcut.keys.map((key, keyIdx) => (
                                                    <span key={keyIdx}>
                                                        {keyIdx > 0 && (
                                                            <span className="text-[var(--glass-text-tertiary)] mx-1">+</span>
                                                        )}
                                                        <kbd
                                                            className={cn(
                                                                'inline-flex items-center justify-center',
                                                                'min-w-[24px] h-6 px-2',
                                                                'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                                                                'rounded-md text-xs font-medium',
                                                                'text-[var(--glass-text-primary)]'
                                                            )}
                                                        >
                                                            {key}
                                                        </kbd>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[var(--glass-border)]">
                    <p className="text-xs text-center text-[var(--glass-text-tertiary)]">
                        Press <kbd className="px-1.5 py-0.5 bg-[var(--glass-surface)] rounded text-[var(--glass-text-primary)]">?</kbd> anytime to show this dialog
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default SparklesShortcutsModal;
