/**
 * HuntingCalendar
 * 
 * Full month calendar view with:
 * - Moon phase indicators per day
 * - Hunting season open/close markers
 * - Pack events and hunts
 * - Quick navigation
 */

import { useState, useMemo, useCallback } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Moon,
    Users,
    Target,
    Wrench,
    MessageCircle,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CalendarEvent {
    id: string;
    date: string;          // ISO date
    title: string;
    type: 'gesellschaftsjagd' | 'revierarbeit' | 'versammlung' | 'training' | 'other';
    time?: string;
    location?: string;
    participants?: string[];
    rsvpStatus?: 'going' | 'maybe' | 'not_going';
}

export interface HuntingSeason {
    species: string;
    startMonth: number;  // 1-12
    startDay: number;
    endMonth: number;
    endDay: number;
    color: string;
}

interface HuntingCalendarProps {
    events?: CalendarEvent[];
    seasons?: HuntingSeason[];
    onDateClick?: (date: Date) => void;
    onEventClick?: (event: CalendarEvent) => void;
    className?: string;
}

// ---------------------------------------------------------------------------
// Moon Phase Calculation
// ---------------------------------------------------------------------------

function getMoonPhaseForDate(date: Date): { phase: number; name: string; icon: string } {
    const synodicMonth = 29.53058867;
    const knownNewMoon = new Date(2000, 0, 6, 18, 14, 0);
    const daysSinceNewMoon = (date.getTime() - knownNewMoon.getTime()) / 86400000;

    const phase = ((daysSinceNewMoon % synodicMonth) + synodicMonth) % synodicMonth;
    const phasePercent = phase / synodicMonth;

    // Return phase as 0-7 for 8 moon phases
    const phaseIndex = Math.floor(phasePercent * 8) % 8;

    const phases = [
        { name: 'Neumond', icon: '🌑' },
        { name: 'Zunehmend', icon: '🌒' },
        { name: 'Erstes Viertel', icon: '🌓' },
        { name: 'Zunehmend', icon: '🌔' },
        { name: 'Vollmond', icon: '🌕' },
        { name: 'Abnehmend', icon: '🌖' },
        { name: 'Letztes Viertel', icon: '🌗' },
        { name: 'Abnehmend', icon: '🌘' },
    ];

    return { phase: phaseIndex, ...phases[phaseIndex] };
}

// ---------------------------------------------------------------------------
// Default Hunting Seasons (Germany general)
// ---------------------------------------------------------------------------

const DEFAULT_SEASONS: HuntingSeason[] = [
    { species: 'Rehwild ♂', startMonth: 5, startDay: 1, endMonth: 10, endDay: 15, color: '#22c55e' },
    { species: 'Rehwild ♀', startMonth: 9, startDay: 1, endMonth: 1, endDay: 31, color: '#84cc16' },
    { species: 'Rotwild', startMonth: 8, startDay: 1, endMonth: 1, endDay: 31, color: '#dc2626' },
    { species: 'Damwild', startMonth: 9, startDay: 1, endMonth: 1, endDay: 31, color: '#f97316' },
    { species: 'Schwarzwild', startMonth: 1, startDay: 1, endMonth: 12, endDay: 31, color: '#1f2937' }, // Year-round
    { species: 'Fuchs', startMonth: 7, startDay: 15, endMonth: 2, endDay: 28, color: '#ea580c' },
    { species: 'Feldhase', startMonth: 10, startDay: 1, endMonth: 1, endDay: 15, color: '#a16207' },
    { species: 'Fasan', startMonth: 10, startDay: 1, endMonth: 1, endDay: 15, color: '#4f46e5' },
    { species: 'Wildente', startMonth: 9, startDay: 1, endMonth: 1, endDay: 15, color: '#0ea5e9' },
];

// ---------------------------------------------------------------------------
// Calendar Helpers
// ---------------------------------------------------------------------------

function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
    // German week starts on Monday (0), so adjust Sunday (0) to 6
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
}

function formatMonthYear(date: Date): string {
    return date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
}

function isSameDay(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear()
        && d1.getMonth() === d2.getMonth()
        && d1.getDate() === d2.getDate();
}

function isSeasonActive(date: Date, season: HuntingSeason): boolean {
    const month = date.getMonth() + 1;
    const day = date.getDate();

    // Handle seasons that span year boundary
    if (season.startMonth > season.endMonth) {
        // e.g., Oct to Jan
        return (month > season.startMonth || (month === season.startMonth && day >= season.startDay))
            || (month < season.endMonth || (month === season.endMonth && day <= season.endDay));
    }

    // Normal case
    const afterStart = month > season.startMonth || (month === season.startMonth && day >= season.startDay);
    const beforeEnd = month < season.endMonth || (month === season.endMonth && day <= season.endDay);

    return afterStart && beforeEnd;
}

// ---------------------------------------------------------------------------
// Event Type Config
// ---------------------------------------------------------------------------

const EVENT_TYPE_CONFIG: Record<string, { icon: typeof Target; color: string; label: string }> = {
    gesellschaftsjagd: { icon: Target, color: '#22c55e', label: 'Gesellschaftsjagd' },
    revierarbeit: { icon: Wrench, color: '#f59e0b', label: 'Revierarbeit' },
    versammlung: { icon: MessageCircle, color: '#3b82f6', label: 'Versammlung' },
    training: { icon: Users, color: '#8b5cf6', label: 'Training' },
    other: { icon: CalendarIcon, color: '#6b7280', label: 'Sonstige' },
};

// ---------------------------------------------------------------------------
// Day Cell Component
// ---------------------------------------------------------------------------

interface DayCellProps {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    events: CalendarEvent[];
    activeSeasons: HuntingSeason[];
    onDateClick?: (date: Date) => void;
    onEventClick?: (event: CalendarEvent) => void;
}

function DayCell({
    date,
    isCurrentMonth,
    isToday,
    events,
    activeSeasons,
    onDateClick,
    onEventClick,
}: DayCellProps) {
    const moonPhase = getMoonPhaseForDate(date);
    const isFullMoon = moonPhase.phase === 4;
    const isNewMoon = moonPhase.phase === 0;

    return (
        <div
            onClick={() => onDateClick?.(date)}
            className={`
        min-h-[80px] p-1 border-b border-r border-[var(--glass-border)]
        cursor-pointer hover:bg-[var(--glass-bg-primary)] transition-colors
        ${!isCurrentMonth ? 'opacity-40' : ''}
        ${isToday ? 'bg-[var(--glass-accent)]/10 ring-1 ring-[var(--glass-accent)]' : ''}
      `}
        >
            {/* Header: Date + Moon */}
            <div className="flex items-center justify-between mb-1">
                <span
                    className={`
            text-sm font-medium
            ${isToday ? 'text-[var(--glass-accent)]' : 'text-[var(--text-primary)]'}
          `}
                >
                    {date.getDate()}
                </span>
                {(isFullMoon || isNewMoon) && (
                    <span className="text-xs" title={moonPhase.name}>{moonPhase.icon}</span>
                )}
            </div>

            {/* Season Indicators */}
            {activeSeasons.length > 0 && (
                <div className="flex gap-0.5 mb-1">
                    {activeSeasons.slice(0, 3).map((season, idx) => (
                        <div
                            key={idx}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: season.color }}
                            title={season.species}
                        />
                    ))}
                    {activeSeasons.length > 3 && (
                        <span className="text-[8px] text-[var(--text-secondary)]">+{activeSeasons.length - 3}</span>
                    )}
                </div>
            )}

            {/* Events */}
            <div className="space-y-0.5">
                {events.slice(0, 2).map((event) => {
                    const config = EVENT_TYPE_CONFIG[event.type] || EVENT_TYPE_CONFIG.other;
                    return (
                        <div
                            key={event.id}
                            onClick={(e) => { e.stopPropagation(); onEventClick?.(event); }}
                            className="text-[10px] px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
                            style={{ backgroundColor: `${config.color}20`, color: config.color }}
                            title={event.title}
                        >
                            {event.title}
                        </div>
                    );
                })}
                {events.length > 2 && (
                    <span className="text-[9px] text-[var(--text-secondary)]">+{events.length - 2} mehr</span>
                )}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main Calendar Component
// ---------------------------------------------------------------------------

export function HuntingCalendar({
    events = [],
    seasons = DEFAULT_SEASONS,
    onDateClick,
    onEventClick,
    className = '',
}: HuntingCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const today = useMemo(() => new Date(), []);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Navigate months
    const goToPrevMonth = useCallback(() => {
        setCurrentDate(new Date(year, month - 1, 1));
    }, [year, month]);

    const goToNextMonth = useCallback(() => {
        setCurrentDate(new Date(year, month + 1, 1));
    }, [year, month]);

    const goToToday = useCallback(() => {
        setCurrentDate(new Date());
    }, []);

    // Build calendar grid
    const calendarDays = useMemo(() => {
        const daysInMonth = getDaysInMonth(year, month);
        const daysInPrevMonth = getDaysInMonth(year, month - 1);
        const firstDay = getFirstDayOfMonth(year, month);

        const days: { date: Date; isCurrentMonth: boolean }[] = [];

        // Previous month's trailing days
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({
                date: new Date(year, month - 1, daysInPrevMonth - i),
                isCurrentMonth: false,
            });
        }

        // Current month's days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({
                date: new Date(year, month, i),
                isCurrentMonth: true,
            });
        }

        // Next month's leading days (fill to 6 weeks)
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({
                date: new Date(year, month + 1, i),
                isCurrentMonth: false,
            });
        }

        return days;
    }, [year, month]);

    // Map events to dates
    const eventsByDate = useMemo(() => {
        const map = new Map<string, CalendarEvent[]>();
        events.forEach(event => {
            const key = event.date.split('T')[0];
            const existing = map.get(key) || [];
            existing.push(event);
            map.set(key, existing);
        });
        return map;
    }, [events]);

    const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

    return (
        <div className={`rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-border)] overflow-hidden ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--glass-border)]">
                <div className="flex items-center gap-2">
                    <CalendarIcon size={20} className="text-[var(--glass-accent)]" />
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                        {formatMonthYear(currentDate)}
                    </h2>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={goToToday}
                        className="px-3 py-1 text-sm rounded-lg bg-[var(--glass-bg-primary)] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                        Heute
                    </button>
                    <button
                        onClick={goToPrevMonth}
                        className="p-1.5 rounded-lg bg-[var(--glass-bg-primary)] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        onClick={goToNextMonth}
                        className="p-1.5 rounded-lg bg-[var(--glass-bg-primary)] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {/* Season Legend */}
            <div className="flex flex-wrap gap-2 px-4 py-2 border-b border-[var(--glass-border)] bg-[var(--glass-bg-primary)]">
                <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                    <Moon size={12} />
                    <span>Mondphase</span>
                </div>
                {seasons.slice(0, 5).map((season, idx) => (
                    <div key={idx} className="flex items-center gap-1 text-xs">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: season.color }} />
                        <span className="text-[var(--text-secondary)]">{season.species}</span>
                    </div>
                ))}
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 bg-[var(--glass-bg-primary)] border-b border-[var(--glass-border)]">
                {WEEKDAYS.map(day => (
                    <div key={day} className="p-2 text-xs font-medium text-center text-[var(--text-secondary)] border-r border-[var(--glass-border)] last:border-r-0">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
                {calendarDays.map(({ date, isCurrentMonth }, idx) => {
                    const dateKey = date.toISOString().split('T')[0];
                    const dayEvents = eventsByDate.get(dateKey) || [];
                    const activeSeasons = seasons.filter(s => isSeasonActive(date, s));

                    return (
                        <DayCell
                            key={idx}
                            date={date}
                            isCurrentMonth={isCurrentMonth}
                            isToday={isSameDay(date, today)}
                            events={dayEvents}
                            activeSeasons={activeSeasons}
                            onDateClick={onDateClick}
                            onEventClick={onEventClick}
                        />
                    );
                })}
            </div>
        </div>
    );
}

export default HuntingCalendar;
