/**
 * IBird Quick Glance Widget
 * 
 * Summary widget for Calendar/Appointments tabs showing
 * today's events and next upcoming appointment.
 */

import { useMemo } from 'react';
import { Calendar, Clock, ChevronRight } from 'lucide-react';
import { useEventsInRange, useUpcomingBookings } from '../store';
import { cn } from '@/lib/utils';

interface IBirdQuickGlanceProps {
    variant?: 'calendar' | 'appointments';
}

export function IBirdQuickGlance({ variant = 'calendar' }: IBirdQuickGlanceProps) {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Get today's events
    const todaysEvents = useEventsInRange(todayStr, todayStr);
    const upcomingBookings = useUpcomingBookings();

    // Calculate next event/booking
    const { title, time, timeUntil, count } = useMemo(() => {
        const now = new Date();

        if (variant === 'appointments') {
            const pendingBookings = upcomingBookings.filter(b => b.status === 'pending' || b.status === 'confirmed');
            const nextBooking = pendingBookings[0];

            if (nextBooking) {
                const bookingDate = new Date(`${nextBooking.scheduledDate}T${nextBooking.startTime}`);
                const diff = bookingDate.getTime() - now.getTime();
                const mins = Math.floor(diff / 60000);

                return {
                    title: nextBooking.appointmentType?.name || 'Appointment',
                    time: bookingDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
                    timeUntil: mins > 0 ? (mins < 60 ? `in ${mins} min` : `in ${Math.floor(mins / 60)}h`) : 'now',
                    count: pendingBookings.length,
                };
            }

            return { title: null, time: null, timeUntil: null, count: 0 };
        }

        // Calendar variant
        const upcomingToday = todaysEvents
            .filter(e => new Date(e.startTime) >= now)
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

        const nextEvent = upcomingToday[0];

        if (nextEvent) {
            const eventTime = new Date(nextEvent.startTime);
            const diff = eventTime.getTime() - now.getTime();
            const mins = Math.floor(diff / 60000);

            return {
                title: nextEvent.title,
                time: eventTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
                timeUntil: mins > 0 ? (mins < 60 ? `in ${mins} min` : `in ${Math.floor(mins / 60)}h`) : 'now',
                count: todaysEvents.length,
            };
        }

        return { title: null, time: null, timeUntil: null, count: todaysEvents.length };
    }, [variant, todaysEvents, upcomingBookings]);

    const Icon = variant === 'calendar' ? Calendar : Clock;
    const label = variant === 'calendar' ? 'events today' : 'upcoming bookings';

    return (
        <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-[var(--glass-accent)]/10 to-transparent border-b border-[var(--glass-border)]">
            {/* Icon */}
            <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center',
                'bg-gradient-to-br from-purple-500/20 to-blue-500/20'
            )}>
                <Icon className="w-4 h-4 text-[var(--glass-accent)]" />
            </div>

            {/* Summary */}
            <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-[var(--glass-text-primary)]">
                    {count} {label}
                </span>

                {title && (
                    <>
                        <span className="text-[var(--glass-text-tertiary)]">·</span>
                        <span className="text-[var(--glass-text-secondary)]">
                            Next: {title}
                        </span>
                        <span className="text-[var(--glass-text-tertiary)]">@</span>
                        <span className="text-[var(--glass-text-secondary)]">
                            {time}
                        </span>
                        <span className={cn(
                            'px-1.5 py-0.5 rounded-full text-xs font-medium',
                            'bg-[var(--glass-accent)]/20 text-[var(--glass-accent)]'
                        )}>
                            {timeUntil}
                        </span>
                    </>
                )}
            </div>

            {/* View All Link */}
            <div className="ml-auto">
                <button className="flex items-center gap-1 text-xs text-[var(--glass-accent)] hover:text-[var(--glass-accent-hover)] transition-colors">
                    <span>View all</span>
                    <ChevronRight className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
}

export default IBirdQuickGlance;
