/**
 * SparklesCalendarModal - Full calendar view modal
 */

import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    X,
    ChevronLeft,
    ChevronRight,
    Plus,
    Calendar,
} from 'lucide-react';
import { useSparklesStore } from '@/stores/sparklesStore';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types/sparkles';

// =============================================================================
// Types
// =============================================================================

interface SparklesCalendarModalProps {
    initialDate?: string;
    onClose: () => void;
}

type ViewMode = 'month' | 'week' | 'day';

// =============================================================================
// Component
// =============================================================================

export function SparklesCalendarModal({ initialDate, onClose }: SparklesCalendarModalProps) {
    const { calendars, events, openModal } = useSparklesStore();
    const [currentDate, setCurrentDate] = useState(
        initialDate ? new Date(initialDate) : new Date()
    );
    const [viewMode, setViewMode] = useState<ViewMode>('month');

    // Get selected calendars
    const selectedCalendars = useMemo(
        () => Object.values(calendars).flat().filter((cal) => cal.isSelected),
        [calendars]
    );

    // Get events for selected calendars
    const visibleEvents = useMemo(() => {
        const calendarIds = new Set(selectedCalendars.map((c) => c.id));
        return events.filter((e) => calendarIds.has(e.calendarId));
    }, [events, selectedCalendars]);

    // Navigation
    const goToPrevious = useCallback(() => {
        setCurrentDate((prev) => {
            const next = new Date(prev);
            if (viewMode === 'month') {
                next.setMonth(next.getMonth() - 1);
            } else if (viewMode === 'week') {
                next.setDate(next.getDate() - 7);
            } else {
                next.setDate(next.getDate() - 1);
            }
            return next;
        });
    }, [viewMode]);

    const goToNext = useCallback(() => {
        setCurrentDate((prev) => {
            const next = new Date(prev);
            if (viewMode === 'month') {
                next.setMonth(next.getMonth() + 1);
            } else if (viewMode === 'week') {
                next.setDate(next.getDate() + 7);
            } else {
                next.setDate(next.getDate() + 1);
            }
            return next;
        });
    }, [viewMode]);

    const goToToday = useCallback(() => {
        setCurrentDate(new Date());
    }, []);

    const handleEventClick = useCallback(
        (event: CalendarEvent) => {
            openModal({ type: 'event-details', eventId: event.id });
        },
        [openModal]
    );

    const handleCreateEvent = useCallback(
        (date?: Date) => {
            openModal({ type: 'create-event', date: date?.toISOString().split('T')[0] });
        },
        [openModal]
    );

    const headerTitle = useMemo(() => {
        if (viewMode === 'month') {
            return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        } else if (viewMode === 'week') {
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 6);
            return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        } else {
            return currentDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
            });
        }
    }, [currentDate, viewMode]);

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
                    'relative w-full max-w-4xl h-[80vh] mx-4',
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
                    <div className="flex items-center gap-4">
                        <Calendar className="w-5 h-5 text-[var(--color-accent)]" />
                        <h2 className="text-lg font-semibold text-[var(--glass-text-primary)]">
                            {headerTitle}
                        </h2>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* View Mode Toggle */}
                        <div className="flex rounded-lg overflow-hidden border border-[var(--glass-border)]">
                            {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    className={cn(
                                        'px-3 py-1.5 text-xs font-medium capitalize',
                                        'transition-colors duration-150',
                                        viewMode === mode
                                            ? 'bg-[var(--color-accent)] text-white'
                                            : 'text-[var(--glass-text-secondary)] hover:bg-[var(--glass-surface-hover)]'
                                    )}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center gap-1 ml-4">
                            <button
                                onClick={goToPrevious}
                                className={cn(
                                    'p-2 rounded-lg',
                                    'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]',
                                    'hover:bg-[var(--glass-surface-hover)]',
                                    'transition-colors duration-150'
                                )}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={goToToday}
                                className={cn(
                                    'px-3 py-1.5 rounded-lg text-xs font-medium',
                                    'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]',
                                    'hover:bg-[var(--glass-surface-hover)]',
                                    'transition-colors duration-150'
                                )}
                            >
                                Today
                            </button>
                            <button
                                onClick={goToNext}
                                className={cn(
                                    'p-2 rounded-lg',
                                    'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]',
                                    'hover:bg-[var(--glass-surface-hover)]',
                                    'transition-colors duration-150'
                                )}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Create Event */}
                        <button
                            onClick={() => handleCreateEvent()}
                            className={cn(
                                'ml-4 px-3 py-1.5 rounded-lg text-sm font-medium',
                                'bg-[var(--color-accent)] text-white',
                                'hover:opacity-90',
                                'transition-opacity duration-150',
                                'flex items-center gap-1.5'
                            )}
                        >
                            <Plus className="w-4 h-4" />
                            New Event
                        </button>

                        {/* Close */}
                        <button
                            onClick={onClose}
                            className={cn(
                                'p-2 rounded-lg ml-2',
                                'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]',
                                'hover:bg-[var(--glass-surface-hover)]',
                                'transition-colors duration-150'
                            )}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="flex-1 overflow-auto p-4">
                    {viewMode === 'month' && (
                        <MonthView
                            currentDate={currentDate}
                            events={visibleEvents}
                            onEventClick={handleEventClick}
                            onDateClick={(date) => handleCreateEvent(date)}
                        />
                    )}
                    {viewMode === 'week' && (
                        <WeekView
                            currentDate={currentDate}
                            events={visibleEvents}
                            onEventClick={handleEventClick}
                        />
                    )}
                    {viewMode === 'day' && (
                        <DayView
                            currentDate={currentDate}
                            events={visibleEvents}
                            onEventClick={handleEventClick}
                        />
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

// =============================================================================
// Month View
// =============================================================================

interface MonthViewProps {
    currentDate: Date;
    events: CalendarEvent[];
    onEventClick: (event: CalendarEvent) => void;
    onDateClick: (date: Date) => void;
}

function MonthView({ currentDate, events, onEventClick, onDateClick }: MonthViewProps) {
    const weeks = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const weeks: Date[][] = [];
        let currentWeek: Date[] = [];

        // Fill in days from previous month
        const startDayOfWeek = firstDay.getDay();
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            const date = new Date(year, month, -i);
            currentWeek.push(date);
        }

        // Fill in days of current month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            if (currentWeek.length === 7) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
            currentWeek.push(new Date(year, month, day));
        }

        // Fill in days from next month
        while (currentWeek.length < 7) {
            const lastDate = currentWeek[currentWeek.length - 1];
            const nextDate = new Date(lastDate);
            nextDate.setDate(nextDate.getDate() + 1);
            currentWeek.push(nextDate);
        }
        weeks.push(currentWeek);

        return weeks;
    }, [currentDate]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getEventsForDate = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        return events.filter((event) => {
            const eventDate = event.start.date || event.start.dateTime?.split('T')[0];
            return eventDate === dateStr;
        });
    };

    return (
        <div className="h-full">
            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-px mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div
                        key={day}
                        className="text-center text-xs font-medium text-[var(--glass-text-tertiary)] py-2"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-px bg-[var(--glass-border)] rounded-lg overflow-hidden">
                {weeks.flat().map((date, idx) => {
                    const isToday = date.getTime() === today.getTime();
                    const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                    const dayEvents = getEventsForDate(date);

                    return (
                        <div
                            key={idx}
                            onClick={() => onDateClick(date)}
                            className={cn(
                                'min-h-[100px] p-2 bg-[var(--glass-bg)] cursor-pointer',
                                'hover:bg-[var(--glass-surface-hover)]',
                                'transition-colors duration-150',
                                !isCurrentMonth && 'opacity-40'
                            )}
                        >
                            <div
                                className={cn(
                                    'w-7 h-7 flex items-center justify-center rounded-full text-sm',
                                    isToday
                                        ? 'bg-[var(--color-accent)] text-white font-semibold'
                                        : 'text-[var(--glass-text-primary)]'
                                )}
                            >
                                {date.getDate()}
                            </div>
                            <div className="mt-1 space-y-0.5">
                                {dayEvents.slice(0, 3).map((event) => (
                                    <button
                                        key={event.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEventClick(event);
                                        }}
                                        className={cn(
                                            'w-full text-left text-xs px-1.5 py-0.5 rounded truncate',
                                            'bg-[var(--color-accent)]/20 text-[var(--color-accent)]',
                                            'hover:bg-[var(--color-accent)]/30'
                                        )}
                                    >
                                        {event.summary}
                                    </button>
                                ))}
                                {dayEvents.length > 3 && (
                                    <div className="text-xs text-[var(--glass-text-tertiary)] px-1.5">
                                        +{dayEvents.length - 3} more
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// =============================================================================
// Week View
// =============================================================================

interface WeekViewProps {
    currentDate: Date;
    events: CalendarEvent[];
    onEventClick: (event: CalendarEvent) => void;
}

function WeekView({ currentDate, events, onEventClick }: WeekViewProps) {
    const weekDays = useMemo(() => {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(startOfWeek);
            date.setDate(date.getDate() + i);
            return date;
        });
    }, [currentDate]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getEventsForDate = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        return events.filter((event) => {
            const eventDate = event.start.date || event.start.dateTime?.split('T')[0];
            return eventDate === dateStr;
        });
    };

    return (
        <div className="h-full flex flex-col">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-2 mb-4">
                {weekDays.map((date, idx) => {
                    const isToday = date.getTime() === today.getTime();
                    return (
                        <div key={idx} className="text-center">
                            <div className="text-xs text-[var(--glass-text-tertiary)]">
                                {date.toLocaleDateString('en-US', { weekday: 'short' })}
                            </div>
                            <div
                                className={cn(
                                    'w-10 h-10 mx-auto flex items-center justify-center rounded-full text-lg',
                                    isToday
                                        ? 'bg-[var(--color-accent)] text-white font-semibold'
                                        : 'text-[var(--glass-text-primary)]'
                                )}
                            >
                                {date.getDate()}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Events grid */}
            <div className="flex-1 grid grid-cols-7 gap-2">
                {weekDays.map((date, idx) => {
                    const dayEvents = getEventsForDate(date);
                    return (
                        <div
                            key={idx}
                            className="bg-[var(--glass-surface)] rounded-lg p-2 overflow-y-auto"
                        >
                            {dayEvents.length === 0 ? (
                                <div className="text-xs text-[var(--glass-text-tertiary)] text-center py-4">
                                    No events
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {dayEvents.map((event) => (
                                        <button
                                            key={event.id}
                                            onClick={() => onEventClick(event)}
                                            className={cn(
                                                'w-full text-left p-2 rounded-lg',
                                                'bg-[var(--color-accent)]/20',
                                                'hover:bg-[var(--color-accent)]/30',
                                                'transition-colors duration-150'
                                            )}
                                        >
                                            <div className="text-xs font-medium text-[var(--color-accent)] truncate">
                                                {event.summary}
                                            </div>
                                            {event.start.dateTime && (
                                                <div className="text-xs text-[var(--glass-text-tertiary)] mt-0.5">
                                                    {new Date(event.start.dateTime).toLocaleTimeString('en-US', {
                                                        hour: 'numeric',
                                                        minute: '2-digit',
                                                    })}
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// =============================================================================
// Day View
// =============================================================================

interface DayViewProps {
    currentDate: Date;
    events: CalendarEvent[];
    onEventClick: (event: CalendarEvent) => void;
}

function DayView({ currentDate, events, onEventClick }: DayViewProps) {
    const hours = Array.from({ length: 24 }, (_, i) => i);

    const dayEvents = useMemo(() => {
        const dateStr = currentDate.toISOString().split('T')[0];
        return events.filter((event) => {
            const eventDate = event.start.date || event.start.dateTime?.split('T')[0];
            return eventDate === dateStr;
        });
    }, [currentDate, events]);

    const getEventPosition = (event: CalendarEvent) => {
        if (event.isAllDay || !event.start.dateTime) {
            return { top: 0, height: 60 };
        }
        const startTime = new Date(event.start.dateTime);
        const endTime = event.end.dateTime ? new Date(event.end.dateTime) : new Date(startTime.getTime() + 3600000);
        const top = startTime.getHours() * 60 + startTime.getMinutes();
        const height = Math.max(30, (endTime.getTime() - startTime.getTime()) / 60000);
        return { top, height };
    };

    const allDayEvents = dayEvents.filter((e) => e.isAllDay);
    const timedEvents = dayEvents.filter((e) => !e.isAllDay);

    return (
        <div className="h-full flex flex-col">
            {/* All-day events */}
            {allDayEvents.length > 0 && (
                <div className="mb-4 pb-4 border-b border-[var(--glass-border)]">
                    <div className="text-xs text-[var(--glass-text-tertiary)] mb-2">All day</div>
                    <div className="flex flex-wrap gap-2">
                        {allDayEvents.map((event) => (
                            <button
                                key={event.id}
                                onClick={() => onEventClick(event)}
                                className={cn(
                                    'px-3 py-1.5 rounded-lg text-sm',
                                    'bg-[var(--color-accent)]/20 text-[var(--color-accent)]',
                                    'hover:bg-[var(--color-accent)]/30'
                                )}
                            >
                                {event.summary}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Time grid */}
            <div className="flex-1 overflow-y-auto relative">
                <div className="absolute inset-0">
                    {hours.map((hour) => (
                        <div key={hour} className="h-[60px] flex border-b border-[var(--glass-border)]/50">
                            <div className="w-16 flex-shrink-0 text-xs text-[var(--glass-text-tertiary)] pr-2 text-right pt-1">
                                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                            </div>
                            <div className="flex-1 relative" />
                        </div>
                    ))}

                    {/* Events overlay */}
                    <div className="absolute top-0 right-0 left-16">
                        {timedEvents.map((event) => {
                            const { top, height } = getEventPosition(event);
                            return (
                                <button
                                    key={event.id}
                                    onClick={() => onEventClick(event)}
                                    className={cn(
                                        'absolute left-1 right-1 px-2 py-1 rounded-lg overflow-hidden',
                                        'bg-[var(--color-accent)]/20 border-l-2 border-[var(--color-accent)]',
                                        'hover:bg-[var(--color-accent)]/30',
                                        'transition-colors duration-150'
                                    )}
                                    style={{ top: `${top}px`, height: `${height}px` }}
                                >
                                    <div className="text-xs font-medium text-[var(--color-accent)] truncate">
                                        {event.summary}
                                    </div>
                                    {height > 30 && event.start.dateTime && (
                                        <div className="text-xs text-[var(--glass-text-tertiary)]">
                                            {new Date(event.start.dateTime).toLocaleTimeString('en-US', {
                                                hour: 'numeric',
                                                minute: '2-digit',
                                            })}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SparklesCalendarModal;
