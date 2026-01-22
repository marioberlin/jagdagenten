/**
 * IBird Calendar View Component
 *
 * Main calendar interface with multiple view modes.
 * Supports drag-and-drop event rescheduling.
 */

import { useMemo, useCallback, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  MoreHorizontal,
  GripVertical,
} from 'lucide-react';
import { useIBirdStore, useVisibleEvents } from '@/stores/ibirdStore';
import type { CalendarEvent, CalendarViewMode } from '@/stores/ibirdStore';
import { useCalendarApi } from '../hooks/useIBirdApi';
import { cn } from '@/lib/utils';

// =============================================================================
// Drag & Drop Context
// =============================================================================

interface DragState {
  eventId: string;
  event: CalendarEvent;
  startX: number;
  startY: number;
  offsetY: number;
  isDragging: boolean;
  ghostElement: HTMLDivElement | null;
  originalSlot: { dayIndex: number; hour: number; minutes: number };
}

interface DropTarget {
  dayIndex: number;
  hour: number;
  minutes: number;
}

// =============================================================================
// Calendar Header
// =============================================================================

function CalendarHeader() {
  const {
    ui,
    navigateCalendar,
    setCalendarViewMode,
    openEventEditor,
  } = useIBirdStore();

  const viewModes: { value: CalendarViewMode; label: string }[] = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'year', label: 'Year' },
    { value: 'agenda', label: 'Agenda' },
  ];

  const title = useMemo(() => {
    const date = new Date(ui.calendarViewDate);
    switch (ui.calendarViewMode) {
      case 'day':
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        if (weekStart.getMonth() === weekEnd.getMonth()) {
          return `${weekStart.toLocaleDateString('en-US', { month: 'long' })} ${weekStart.getDate()} - ${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
        }
        return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'month':
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      case 'year':
        return date.getFullYear().toString();
      case 'agenda':
        return 'Upcoming Events';
      default:
        return '';
    }
  }, [ui.calendarViewDate, ui.calendarViewMode]);

  return (
    <div className="h-14 flex items-center px-4 border-b border-[var(--glass-border)] bg-[var(--glass-surface)]/30">
      {/* Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigateCalendar('today')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium',
            'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]',
            'hover:bg-[var(--glass-surface-hover)] transition-colors duration-150'
          )}
        >
          Today
        </button>
        <button
          onClick={() => navigateCalendar('prev')}
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]',
            'hover:bg-[var(--glass-surface-hover)] transition-colors duration-150'
          )}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => navigateCalendar('next')}
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]',
            'hover:bg-[var(--glass-surface-hover)] transition-colors duration-150'
          )}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Title */}
      <h2 className="text-lg font-semibold text-[var(--glass-text-primary)] ml-4">
        {title}
      </h2>

      {/* Spacer */}
      <div className="flex-1" />

      {/* View Mode Toggle */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--glass-surface)]">
        {viewModes.map((mode) => (
          <button
            key={mode.value}
            onClick={() => setCalendarViewMode(mode.value)}
            className={cn(
              'px-3 py-1 rounded-md text-sm font-medium transition-all duration-150',
              ui.calendarViewMode === mode.value
                ? 'bg-[var(--glass-accent)] text-white'
                : 'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]'
            )}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Create Event */}
      <button
        onClick={() => openEventEditor()}
        className={cn(
          'ml-4 flex items-center gap-2 px-3 py-1.5 rounded-lg',
          'bg-[var(--glass-accent)] text-white font-medium',
          'hover:bg-[var(--glass-accent-hover)] transition-colors duration-150'
        )}
      >
        <Plus className="w-4 h-4" />
        <span>Event</span>
      </button>
    </div>
  );
}

// =============================================================================
// Week View with Drag & Drop
// =============================================================================

function WeekView() {
  const { ui, selectEvent, openEventEditor, updateEvent, calendars, events: allStoreEvents } = useIBirdStore();
  const { editEvent } = useCalendarApi();
  const calendarViewDate = ui.calendarViewDate;

  // Drag state
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Generate week days - memoized on calendarViewDate string
  const weekDays = useMemo(() => {
    const viewDate = new Date(calendarViewDate);
    const days: Date[] = [];
    const start = new Date(viewDate);
    start.setDate(viewDate.getDate() - viewDate.getDay());

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  }, [calendarViewDate]);

  // Filter events for the week - computed in component to avoid selector instability
  const events = useMemo(() => {
    const startDate = weekDays[0].toISOString().split('T')[0];
    const endDate = weekDays[6].toISOString().split('T')[0];
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    const visibleCalendarIds = calendars
      .filter((c) => c.isVisible)
      .map((c) => c.id);

    return allStoreEvents.filter((e) => {
      if (!visibleCalendarIds.includes(e.calendarId)) return false;
      const eventStart = new Date(e.startTime).getTime();
      const eventEnd = new Date(e.endTime).getTime();
      return eventStart <= end && eventEnd >= start;
    });
  }, [weekDays, calendars, allStoreEvents]);

  // Generate hour slots
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get events for a specific day
  const getEventsForDay = useCallback(
    (date: Date) => {
      const dateStr = date.toISOString().split('T')[0];
      return events.filter((e) => e.startTime.startsWith(dateStr));
    },
    [events]
  );

  // Calculate event position and height
  const getEventStyle = useCallback((event: CalendarEvent) => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

    return {
      top: `${(startMinutes / 60) * 48}px`, // 48px per hour
      height: `${(durationMinutes / 60) * 48}px`,
    };
  }, []);

  // Handle drag start
  const handleDragStart = useCallback(
    (e: React.MouseEvent, event: CalendarEvent, dayIndex: number) => {
      e.preventDefault();
      e.stopPropagation();

      const start = new Date(event.startTime);
      const eventRect = (e.target as HTMLElement).getBoundingClientRect();
      const offsetY = e.clientY - eventRect.top;

      setDragState({
        eventId: event.id,
        event,
        startX: e.clientX,
        startY: e.clientY,
        offsetY,
        isDragging: true,
        ghostElement: null,
        originalSlot: {
          dayIndex,
          hour: start.getHours(),
          minutes: start.getMinutes(),
        },
      });
    },
    []
  );

  // Handle drag move
  const handleDragMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragState?.isDragging || !gridRef.current) return;

      const gridRect = gridRef.current.getBoundingClientRect();
      const gutterWidth = 64; // w-16
      const dayWidth = (gridRect.width - gutterWidth) / 7;

      // Calculate which day we're over
      const relativeX = e.clientX - gridRect.left - gutterWidth;
      const dayIndex = Math.floor(relativeX / dayWidth);

      // Calculate which time slot (accounting for scroll)
      const scrollTop = gridRef.current.scrollTop;
      const relativeY = e.clientY - gridRect.top + scrollTop - dragState.offsetY;
      const totalMinutes = Math.floor((relativeY / 48) * 60);
      const hour = Math.floor(totalMinutes / 60);
      const minutes = Math.round((totalMinutes % 60) / 15) * 15; // Snap to 15-min increments

      if (dayIndex >= 0 && dayIndex < 7 && hour >= 0 && hour < 24) {
        setDropTarget({ dayIndex, hour, minutes: minutes % 60 });
      }
    },
    [dragState]
  );

  // Handle drag end
  const handleDragEnd = useCallback(async () => {
    if (!dragState || !dropTarget) {
      setDragState(null);
      setDropTarget(null);
      return;
    }

    const { event } = dragState;
    const { dayIndex, hour, minutes } = dropTarget;

    // Calculate new start and end times
    const newStartDate = new Date(weekDays[dayIndex]);
    newStartDate.setHours(hour, minutes, 0, 0);

    // Calculate duration from original event
    const originalStart = new Date(event.startTime);
    const originalEnd = new Date(event.endTime);
    const durationMs = originalEnd.getTime() - originalStart.getTime();

    const newEndDate = new Date(newStartDate.getTime() + durationMs);

    // Update the event
    const updatedEvent = {
      startTime: newStartDate.toISOString(),
      endTime: newEndDate.toISOString(),
    };

    // Optimistically update UI
    updateEvent(event.id, updatedEvent);

    // Update via API
    try {
      await editEvent(event.id, updatedEvent);
    } catch (error) {
      // Revert on error
      updateEvent(event.id, {
        startTime: event.startTime,
        endTime: event.endTime,
      });
      console.error('Failed to update event:', error);
    }

    setDragState(null);
    setDropTarget(null);
  }, [dragState, dropTarget, weekDays, updateEvent, editEvent]);

  // Get drop preview style
  const getDropPreviewStyle = useCallback(() => {
    if (!dropTarget || !dragState) return null;

    const startMinutes = dropTarget.hour * 60 + dropTarget.minutes;
    const originalStart = new Date(dragState.event.startTime);
    const originalEnd = new Date(dragState.event.endTime);
    const durationMinutes = (originalEnd.getTime() - originalStart.getTime()) / (1000 * 60);

    return {
      top: `${(startMinutes / 60) * 48}px`,
      height: `${(durationMinutes / 60) * 48}px`,
    };
  }, [dropTarget, dragState]);

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden"
      onMouseMove={dragState?.isDragging ? handleDragMove : undefined}
      onMouseUp={dragState?.isDragging ? handleDragEnd : undefined}
      onMouseLeave={dragState?.isDragging ? handleDragEnd : undefined}
    >
      {/* Day Headers */}
      <div className="flex border-b border-[var(--glass-border)]">
        {/* Time gutter spacer */}
        <div className="w-16 flex-shrink-0 border-r border-[var(--glass-border)]" />

        {/* Day columns */}
        {weekDays.map((day, i) => {
          const isToday = day.getTime() === today.getTime();
          return (
            <div
              key={i}
              className={cn(
                'flex-1 px-2 py-2 text-center border-r border-[var(--glass-border)] last:border-r-0',
                isToday && 'bg-[var(--glass-accent)]/5'
              )}
            >
              <div className="text-xs text-[var(--glass-text-tertiary)] uppercase">
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div
                className={cn(
                  'w-8 h-8 mx-auto mt-1 rounded-full flex items-center justify-center text-sm font-medium',
                  isToday ? 'bg-[var(--glass-accent)] text-white' : 'text-[var(--glass-text-primary)]'
                )}
              >
                {day.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time Grid */}
      <div ref={gridRef} className="flex-1 flex overflow-y-auto">
        {/* Time gutter */}
        <div className="w-16 flex-shrink-0 border-r border-[var(--glass-border)]">
          {hours.map((hour) => (
            <div
              key={hour}
              className="h-12 flex items-start justify-end px-2 text-xs text-[var(--glass-text-tertiary)]"
            >
              {hour === 0 ? '' : `${hour % 12 || 12}${hour < 12 ? 'am' : 'pm'}`}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {weekDays.map((day, dayIndex) => {
          const dayEvents = getEventsForDay(day);
          const isToday = day.getTime() === today.getTime();
          const isDropTargetDay = dropTarget?.dayIndex === dayIndex;

          return (
            <div
              key={dayIndex}
              className={cn(
                'flex-1 relative border-r border-[var(--glass-border)] last:border-r-0',
                isToday && 'bg-[var(--glass-accent)]/5',
                isDropTargetDay && dragState?.isDragging && 'bg-[var(--glass-accent)]/10'
              )}
            >
              {/* Hour lines */}
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="h-12 border-b border-[var(--glass-border)]/50"
                  onClick={() => {
                    if (dragState?.isDragging) return;
                    const eventDate = new Date(day);
                    eventDate.setHours(hour, 0, 0, 0);
                    openEventEditor({
                      startTime: eventDate.toISOString(),
                      endTime: new Date(eventDate.getTime() + 60 * 60 * 1000).toISOString(),
                    });
                  }}
                />
              ))}

              {/* Drop Preview */}
              {isDropTargetDay && dragState?.isDragging && getDropPreviewStyle() && (
                <div
                  className="absolute left-1 right-1 rounded-md border-2 border-dashed border-[var(--glass-accent)] bg-[var(--glass-accent)]/20 pointer-events-none z-10"
                  style={getDropPreviewStyle() || undefined}
                >
                  <div className="px-2 py-1 text-xs font-medium text-[var(--glass-accent)]">
                    {dropTarget!.hour.toString().padStart(2, '0')}:
                    {dropTarget!.minutes.toString().padStart(2, '0')}
                  </div>
                </div>
              )}

              {/* Events */}
              {dayEvents.map((event) => {
                const isDragging = dragState?.eventId === event.id && dragState.isDragging;

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{
                      opacity: isDragging ? 0.5 : 1,
                      scale: isDragging ? 0.98 : 1,
                    }}
                    className={cn(
                      'absolute left-1 right-1 rounded-md px-2 py-1 cursor-grab',
                      'text-xs text-white overflow-hidden group',
                      'hover:ring-2 hover:ring-white/30 transition-all',
                      isDragging && 'cursor-grabbing opacity-50'
                    )}
                    style={{
                      ...getEventStyle(event),
                      backgroundColor: event.color || event.calendarColor || '#3b82f6',
                    }}
                    onMouseDown={(e) => handleDragStart(e, event, dayIndex)}
                    onClick={(e) => {
                      if (!dragState?.isDragging) {
                        e.stopPropagation();
                        selectEvent(event.id);
                      }
                    }}
                  >
                    {/* Drag Handle */}
                    <div className="absolute top-0 left-0 right-0 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripVertical className="w-3 h-3 text-white/70" />
                    </div>

                    <div className="font-medium truncate">{event.title}</div>
                    {parseInt(getEventStyle(event).height) > 36 && (
                      <div className="truncate opacity-75">
                        {new Date(event.startTime).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// Month View with Drag & Drop
// =============================================================================

function MonthView() {
  const { ui, selectEvent, openEventEditor, updateEvent, calendars, events: storeEvents } = useIBirdStore();
  const { editEvent } = useCalendarApi();
  const calendarViewDate = ui.calendarViewDate;
  const viewDate = new Date(calendarViewDate);

  // Drag state for month view
  const [draggingEvent, setDraggingEvent] = useState<CalendarEvent | null>(null);
  const [dropTargetDate, setDropTargetDate] = useState<string | null>(null);

  // Generate month grid
  const monthGrid = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();

    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];

    // Previous month days
    for (let i = startOffset - 1; i >= 0; i--) {
      currentWeek.push(new Date(year, month, -i));
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(new Date(year, month, i));
    }

    // Next month days
    let nextDay = 1;
    while (currentWeek.length < 7) {
      currentWeek.push(new Date(year, month + 1, nextDay++));
    }
    weeks.push(currentWeek);

    // Ensure 6 rows
    while (weeks.length < 6) {
      const lastDate = weeks[weeks.length - 1][6];
      currentWeek = [];
      for (let i = 1; i <= 7; i++) {
        currentWeek.push(new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate() + i));
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [calendarViewDate]);

  // Get all events for the visible range - computed in component to avoid selector instability
  const allEvents = useMemo(() => {
    const startDate = monthGrid[0][0].toISOString().split('T')[0];
    const endDate = monthGrid[monthGrid.length - 1][6].toISOString().split('T')[0];
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    const visibleCalendarIds = calendars
      .filter((c) => c.isVisible)
      .map((c) => c.id);

    return storeEvents.filter((e) => {
      if (!visibleCalendarIds.includes(e.calendarId)) return false;
      const eventStart = new Date(e.startTime).getTime();
      const eventEnd = new Date(e.endTime).getTime();
      return eventStart <= end && eventEnd >= start;
    });
  }, [monthGrid, calendars, storeEvents]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentMonth = viewDate.getMonth();

  // Handle drop on a day
  const handleDrop = useCallback(
    async (targetDate: Date) => {
      if (!draggingEvent) return;

      // Calculate new start and end times, preserving time of day
      const originalStart = new Date(draggingEvent.startTime);
      const originalEnd = new Date(draggingEvent.endTime);
      const durationMs = originalEnd.getTime() - originalStart.getTime();

      const newStart = new Date(targetDate);
      newStart.setHours(
        originalStart.getHours(),
        originalStart.getMinutes(),
        originalStart.getSeconds(),
        0
      );
      const newEnd = new Date(newStart.getTime() + durationMs);

      const updatedEvent = {
        startTime: newStart.toISOString(),
        endTime: newEnd.toISOString(),
      };

      // Optimistically update UI
      updateEvent(draggingEvent.id, updatedEvent);

      // Update via API
      try {
        await editEvent(draggingEvent.id, updatedEvent);
      } catch (error) {
        // Revert on error
        updateEvent(draggingEvent.id, {
          startTime: draggingEvent.startTime,
          endTime: draggingEvent.endTime,
        });
        console.error('Failed to update event:', error);
      }

      setDraggingEvent(null);
      setDropTargetDate(null);
    },
    [draggingEvent, updateEvent, editEvent]
  );

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden p-4"
      onMouseUp={() => {
        if (draggingEvent) {
          setDraggingEvent(null);
          setDropTargetDate(null);
        }
      }}
      onMouseLeave={() => {
        if (draggingEvent) {
          setDraggingEvent(null);
          setDropTargetDate(null);
        }
      }}
    >
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
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
      <div className="flex-1 grid grid-rows-6 gap-1">
        {monthGrid.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1">
            {week.map((day, dayIndex) => {
              const isToday = day.getTime() === today.getTime();
              const isCurrentMonth = day.getMonth() === currentMonth;
              const dateStr = day.toISOString().split('T')[0];
              const dayEvents = allEvents.filter((e) => e.startTime.startsWith(dateStr)).slice(0, 3);
              const isDropTarget = dropTargetDate === dateStr;

              return (
                <div
                  key={dayIndex}
                  onMouseEnter={() => {
                    if (draggingEvent) {
                      setDropTargetDate(dateStr);
                    }
                  }}
                  onMouseUp={() => {
                    if (draggingEvent) {
                      handleDrop(day);
                    }
                  }}
                  onClick={() => {
                    if (!draggingEvent) {
                      openEventEditor({
                        startTime: new Date(day.setHours(9, 0, 0, 0)).toISOString(),
                        endTime: new Date(day.setHours(10, 0, 0, 0)).toISOString(),
                      });
                    }
                  }}
                  className={cn(
                    'min-h-[80px] p-1 rounded-lg cursor-pointer transition-colors duration-150',
                    'border border-transparent hover:border-[var(--glass-border)]',
                    isCurrentMonth ? 'bg-[var(--glass-surface)]/30' : 'bg-transparent',
                    isToday && 'ring-2 ring-[var(--glass-accent)]',
                    isDropTarget && 'bg-[var(--glass-accent)]/20 border-[var(--glass-accent)]'
                  )}
                >
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs mb-1',
                      isToday && 'bg-[var(--glass-accent)] text-white',
                      !isToday && isCurrentMonth && 'text-[var(--glass-text-primary)]',
                      !isToday && !isCurrentMonth && 'text-[var(--glass-text-tertiary)]'
                    )}
                  >
                    {day.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.map((event) => {
                      const isDragging = draggingEvent?.id === event.id;

                      return (
                        <div
                          key={event.id}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setDraggingEvent(event);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!draggingEvent) {
                              selectEvent(event.id);
                            }
                          }}
                          className={cn(
                            'text-[10px] px-1 py-0.5 rounded truncate text-white cursor-grab',
                            'hover:ring-1 hover:ring-white/50 transition-all',
                            isDragging && 'opacity-50 cursor-grabbing'
                          )}
                          style={{ backgroundColor: event.color || event.calendarColor || '#3b82f6' }}
                        >
                          {event.title}
                        </div>
                      );
                    })}

                    {/* Drop preview */}
                    {isDropTarget && draggingEvent && (
                      <div
                        className="text-[10px] px-1 py-0.5 rounded truncate text-white border-2 border-dashed"
                        style={{
                          backgroundColor: `${draggingEvent.color || draggingEvent.calendarColor || '#3b82f6'}80`,
                          borderColor: draggingEvent.color || draggingEvent.calendarColor || '#3b82f6',
                        }}
                      >
                        {draggingEvent.title}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Agenda View
// =============================================================================

function AgendaView() {
  const events = useVisibleEvents();
  const { selectEvent } = useIBirdStore();

  // Sort and group events by date
  const groupedEvents = useMemo(() => {
    const now = new Date();
    const upcoming = events
      .filter((e) => new Date(e.startTime) >= now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const groups: Record<string, CalendarEvent[]> = {};
    upcoming.forEach((event) => {
      const dateKey = event.startTime.split('T')[0];
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(event);
    });

    return groups;
  }, [events]);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {Object.entries(groupedEvents).map(([dateKey, dayEvents]) => {
        const date = new Date(dateKey);
        return (
          <div key={dateKey} className="mb-6">
            <h3 className="text-sm font-semibold text-[var(--glass-text-primary)] mb-2">
              {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>
            <div className="space-y-2">
              {dayEvents.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => selectEvent(event.id)}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg cursor-pointer',
                    'bg-[var(--glass-surface)] hover:bg-[var(--glass-surface-hover)]',
                    'border border-[var(--glass-border)] transition-colors duration-150'
                  )}
                >
                  <div
                    className="w-1 h-10 rounded-full flex-shrink-0"
                    style={{ backgroundColor: event.color || event.calendarColor || '#3b82f6' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[var(--glass-text-primary)] truncate">
                      {event.title}
                    </div>
                    <div className="text-sm text-[var(--glass-text-secondary)]">
                      {event.isAllDay
                        ? 'All day'
                        : `${new Date(event.startTime).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })} - ${new Date(event.endTime).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}`}
                    </div>
                  </div>
                  {event.location && (
                    <div className="text-sm text-[var(--glass-text-tertiary)] truncate max-w-[150px]">
                      {event.location}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}
      {Object.keys(groupedEvents).length === 0 && (
        <div className="text-center text-[var(--glass-text-secondary)] py-8">
          No upcoming events
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function IBirdCalendarView() {
  const { ui } = useIBirdStore();

  return (
    <div className="h-full flex flex-col">
      <CalendarHeader />

      {ui.calendarViewMode === 'week' && <WeekView />}
      {ui.calendarViewMode === 'month' && <MonthView />}
      {ui.calendarViewMode === 'agenda' && <AgendaView />}
      {(ui.calendarViewMode === 'day' || ui.calendarViewMode === 'year') && (
        <div className="flex-1 flex items-center justify-center text-[var(--glass-text-secondary)]">
          {ui.calendarViewMode.charAt(0).toUpperCase() + ui.calendarViewMode.slice(1)} view coming soon
        </div>
      )}
    </div>
  );
}
