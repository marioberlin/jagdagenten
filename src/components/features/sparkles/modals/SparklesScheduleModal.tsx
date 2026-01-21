/**
 * SparklesScheduleModal - Schedule send for later
 */

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Clock, Sun, Send } from 'lucide-react';
import { useSparklesStore } from '@/stores/sparklesStore';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface SparklesScheduleModalProps {
    composeId: string;
    onClose: () => void;
}

interface ScheduleOption {
    label: string;
    icon: React.ReactNode;
    getTime: () => number;
}

// =============================================================================
// Component
// =============================================================================

export function SparklesScheduleModal({ composeId, onClose }: SparklesScheduleModalProps) {
    const { ui, updateCompose } = useSparklesStore();
    const [customDate, setCustomDate] = useState('');
    const [customTime, setCustomTime] = useState('09:00');
    const [showCustom, setShowCustom] = useState(false);

    const compose = ui.composeWindows.find((c) => c.id === composeId);

    const scheduleOptions: ScheduleOption[] = [
        {
            label: 'Tomorrow morning',
            icon: <Sun className="w-4 h-4" />,
            getTime: () => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(8, 0, 0, 0);
                return tomorrow.getTime();
            },
        },
        {
            label: 'Tomorrow afternoon',
            icon: <Clock className="w-4 h-4" />,
            getTime: () => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(13, 0, 0, 0);
                return tomorrow.getTime();
            },
        },
        {
            label: 'Monday morning',
            icon: <Clock className="w-4 h-4" />,
            getTime: () => {
                const now = new Date();
                const dayOfWeek = now.getDay();
                const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
                const monday = new Date(now);
                monday.setDate(monday.getDate() + daysUntilMonday);
                monday.setHours(8, 0, 0, 0);
                return monday.getTime();
            },
        },
    ];

    const handleSchedule = useCallback(
        (scheduledFor: number) => {
            if (!compose) return;

            updateCompose(composeId, { scheduledFor });
            onClose();
            // Note: The actual scheduled send will be handled by the server or a client-side timer
        },
        [compose, composeId, updateCompose, onClose]
    );

    const handleCustomSchedule = useCallback(() => {
        if (!customDate) return;

        const [hours, minutes] = customTime.split(':').map(Number);
        const scheduleDate = new Date(customDate);
        scheduleDate.setHours(hours, minutes, 0, 0);

        handleSchedule(scheduleDate.getTime());
    }, [customDate, customTime, handleSchedule]);

    if (!compose) return null;

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
                    <div>
                        <h2 className="text-lg font-semibold text-[var(--glass-text-primary)]">
                            Schedule Send
                        </h2>
                        <p className="text-xs text-[var(--glass-text-tertiary)] mt-0.5">
                            To: {compose.to.join(', ') || 'No recipients'}
                        </p>
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
                <div className="p-4">
                    {/* Preset Options */}
                    <div className="space-y-2">
                        {scheduleOptions.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => handleSchedule(option.getTime())}
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
                                    {formatScheduleTime(option.getTime())}
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
                                <Clock className="w-4 h-4 text-[var(--color-accent)]" />
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
                                    onClick={handleCustomSchedule}
                                    disabled={!customDate}
                                    className={cn(
                                        'w-full px-4 py-2 rounded-lg text-sm font-medium',
                                        'bg-[var(--color-accent)] text-white',
                                        'hover:opacity-90 disabled:opacity-50',
                                        'transition-opacity duration-150',
                                        'flex items-center justify-center gap-2'
                                    )}
                                >
                                    <Send className="w-4 h-4" />
                                    Schedule Send
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

function formatScheduleTime(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

export default SparklesScheduleModal;
