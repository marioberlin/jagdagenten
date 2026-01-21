/**
 * SparklesSnoozeModal - Snooze email until later
 */

import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Clock, Sun, Moon, Calendar } from 'lucide-react';
import { useSparklesStore } from '@/stores/sparklesStore';
import { cn } from '@/lib/utils';
import type { SnoozePreset } from '@/types/sparkles';

// =============================================================================
// Types
// =============================================================================

interface SparklesSnoozeModalProps {
    threadId: string;
    onClose: () => void;
}

interface SnoozeOption {
    id: SnoozePreset;
    label: string;
    icon: React.ReactNode;
    getTime: () => number;
}

// =============================================================================
// Component
// =============================================================================

export function SparklesSnoozeModal({ threadId, onClose }: SparklesSnoozeModalProps) {
    const { addSnoozedThread, threads, threadCache } = useSparklesStore();
    const [customDate, setCustomDate] = useState('');
    const [customTime, setCustomTime] = useState('09:00');
    const [showCustom, setShowCustom] = useState(false);

    const thread = threadCache[threadId] || threads.find((t) => t.id === threadId);

    const snoozeOptions = useMemo((): SnoozeOption[] => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        return [
            {
                id: 'later_today',
                label: 'Later Today',
                icon: <Clock className="w-4 h-4" />,
                getTime: () => {
                    const later = new Date(now);
                    later.setHours(later.getHours() + 3);
                    return later.getTime();
                },
            },
            {
                id: 'tonight',
                label: 'Tonight',
                icon: <Moon className="w-4 h-4" />,
                getTime: () => {
                    const tonight = new Date(today);
                    tonight.setHours(18, 0, 0, 0);
                    return tonight.getTime();
                },
            },
            {
                id: 'tomorrow',
                label: 'Tomorrow',
                icon: <Sun className="w-4 h-4" />,
                getTime: () => {
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    tomorrow.setHours(9, 0, 0, 0);
                    return tomorrow.getTime();
                },
            },
            {
                id: 'this_weekend',
                label: 'This Weekend',
                icon: <Calendar className="w-4 h-4" />,
                getTime: () => {
                    const weekend = new Date(today);
                    const dayOfWeek = weekend.getDay();
                    const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
                    weekend.setDate(weekend.getDate() + daysUntilSaturday);
                    weekend.setHours(10, 0, 0, 0);
                    return weekend.getTime();
                },
            },
            {
                id: 'next_week',
                label: 'Next Week',
                icon: <Calendar className="w-4 h-4" />,
                getTime: () => {
                    const nextWeek = new Date(today);
                    nextWeek.setDate(nextWeek.getDate() + 7);
                    nextWeek.setHours(9, 0, 0, 0);
                    return nextWeek.getTime();
                },
            },
        ];
    }, []);

    const handleSnooze = useCallback(
        (wakeAt: number) => {
            if (!thread) return;

            addSnoozedThread({
                threadId,
                accountId: thread.accountId,
                snoozedAt: Date.now(),
                wakeAt,
                originalLabelIds: thread.labelIds,
            });

            onClose();
        },
        [thread, threadId, addSnoozedThread, onClose]
    );

    const handleCustomSnooze = useCallback(() => {
        if (!customDate) return;

        const [hours, minutes] = customTime.split(':').map(Number);
        const wakeDate = new Date(customDate);
        wakeDate.setHours(hours, minutes, 0, 0);

        handleSnooze(wakeDate.getTime());
    }, [customDate, customTime, handleSnooze]);

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
                        Snooze Until
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

                {/* Content */}
                <div className="p-4">
                    {/* Preset Options */}
                    <div className="space-y-2">
                        {snoozeOptions.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => handleSnooze(option.getTime())}
                                className={cn(
                                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl',
                                    'bg-[var(--glass-surface)] hover:bg-[var(--glass-surface-hover)]',
                                    'text-[var(--glass-text-primary)]',
                                    'transition-colors duration-150'
                                )}
                            >
                                <span className="text-[var(--color-accent)]">{option.icon}</span>
                                <span className="flex-1 text-left text-sm font-medium">{option.label}</span>
                                <span className="text-xs text-[var(--glass-text-tertiary)]">
                                    {formatSnoozeTime(option.getTime())}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Custom Option */}
                    <div className="mt-4 pt-4 border-t border-[var(--glass-border)]">
                        {!showCustom ? (
                            <button
                                onClick={() => setShowCustom(true)}
                                className={cn(
                                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl',
                                    'bg-[var(--glass-surface)] hover:bg-[var(--glass-surface-hover)]',
                                    'text-[var(--glass-text-primary)]',
                                    'transition-colors duration-150'
                                )}
                            >
                                <Calendar className="w-4 h-4 text-[var(--color-accent)]" />
                                <span className="text-sm font-medium">Pick date & time</span>
                            </button>
                        ) : (
                            <div className="space-y-3">
                                <input
                                    type="date"
                                    value={customDate}
                                    onChange={(e) => setCustomDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className={cn(
                                        'w-full px-4 py-2 rounded-lg text-sm',
                                        'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                                        'text-[var(--glass-text-primary)]',
                                        'focus:outline-none focus:border-[var(--color-accent)]'
                                    )}
                                />
                                <input
                                    type="time"
                                    value={customTime}
                                    onChange={(e) => setCustomTime(e.target.value)}
                                    className={cn(
                                        'w-full px-4 py-2 rounded-lg text-sm',
                                        'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                                        'text-[var(--glass-text-primary)]',
                                        'focus:outline-none focus:border-[var(--color-accent)]'
                                    )}
                                />
                                <button
                                    onClick={handleCustomSnooze}
                                    disabled={!customDate}
                                    className={cn(
                                        'w-full px-4 py-2 rounded-lg text-sm font-medium',
                                        'bg-[var(--color-accent)] text-white',
                                        'hover:opacity-90 disabled:opacity-50',
                                        'transition-opacity duration-150'
                                    )}
                                >
                                    Snooze
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// =============================================================================
// Helpers
// =============================================================================

function formatSnoozeTime(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

    if (isToday) {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }

    const isTomorrow =
        date.getDate() === now.getDate() + 1 &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

    if (isTomorrow) {
        return `Tomorrow, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }

    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default SparklesSnoozeModal;
