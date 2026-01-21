/**
 * SparklesMiniCalendar - Compact calendar for sidebar
 */

import { useState, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSparklesStore } from '@/stores/sparklesStore';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface SparklesMiniCalendarProps {
    onDateSelect?: (date: Date) => void;
    onOpenCalendar?: () => void;
}

// =============================================================================
// Component
// =============================================================================

export function SparklesMiniCalendar({ onDateSelect, onOpenCalendar }: SparklesMiniCalendarProps) {
    const { events } = useSparklesStore();
    const [currentDate, setCurrentDate] = useState(new Date());

    const goToPreviousMonth = useCallback(() => {
        setCurrentDate((prev) => {
            const next = new Date(prev);
            next.setMonth(next.getMonth() - 1);
            return next;
        });
    }, []);

    const goToNextMonth = useCallback(() => {
        setCurrentDate((prev) => {
            const next = new Date(prev);
            next.setMonth(next.getMonth() + 1);
            return next;
        });
    }, []);

    // Generate calendar days
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDayOfWeek = firstDay.getDay();

        const days: (Date | null)[] = [];

        // Previous month padding
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(null);
        }

        // Current month days
        for (let day = 1; day <= lastDay.getDate(); day++) {
            days.push(new Date(year, month, day));
        }

        return days;
    }, [currentDate]);

    // Get event count for a date
    const getEventCountForDate = useCallback(
        (date: Date) => {
            const dateStr = date.toISOString().split('T')[0];
            return events.filter((e) => {
                const eventDate = e.start.date || e.start.dateTime?.split('T')[0];
                return eventDate === dateStr;
            }).length;
        },
        [events]
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const handleDateClick = useCallback(
        (date: Date) => {
            if (onDateSelect) {
                onDateSelect(date);
            }
        },
        [onDateSelect]
    );

    return (
        <div className="bg-[var(--glass-surface)] rounded-xl p-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <button
                    onClick={goToPreviousMonth}
                    className={cn(
                        'p-1 rounded',
                        'text-[var(--glass-text-tertiary)] hover:text-[var(--glass-text-primary)]',
                        'hover:bg-[var(--glass-surface-hover)]',
                        'transition-colors duration-150'
                    )}
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                    onClick={onOpenCalendar}
                    className="text-sm font-medium text-[var(--glass-text-primary)] hover:text-[var(--color-accent)]"
                >
                    {currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </button>
                <button
                    onClick={goToNextMonth}
                    className={cn(
                        'p-1 rounded',
                        'text-[var(--glass-text-tertiary)] hover:text-[var(--glass-text-primary)]',
                        'hover:bg-[var(--glass-surface-hover)]',
                        'transition-colors duration-150'
                    )}
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-0.5 mb-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                    <div
                        key={idx}
                        className="text-center text-[10px] font-medium text-[var(--glass-text-tertiary)] py-1"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-0.5">
                {calendarDays.map((date, idx) => {
                    if (!date) {
                        return <div key={idx} className="h-6" />;
                    }

                    const isToday = date.getTime() === today.getTime();
                    const eventCount = getEventCountForDate(date);

                    return (
                        <button
                            key={idx}
                            onClick={() => handleDateClick(date)}
                            className={cn(
                                'relative h-6 rounded text-xs',
                                'transition-colors duration-150',
                                isToday
                                    ? 'bg-[var(--color-accent)] text-white font-semibold'
                                    : 'text-[var(--glass-text-primary)] hover:bg-[var(--glass-surface-hover)]'
                            )}
                        >
                            {date.getDate()}
                            {eventCount > 0 && !isToday && (
                                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--color-accent)]" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* View Calendar link */}
            <button
                onClick={onOpenCalendar}
                className={cn(
                    'w-full mt-3 py-1.5 text-xs font-medium',
                    'text-[var(--color-accent)]',
                    'hover:underline'
                )}
            >
                View full calendar
            </button>
        </div>
    );
}

export default SparklesMiniCalendar;
