/**
 * SparklesCreateEventModal - Create a new calendar event
 */

import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    X,
    Calendar,
    MapPin,
    Users,
    AlignLeft,
    Video,
} from 'lucide-react';
import { useSparklesStore } from '@/stores/sparklesStore';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types/sparkles';

// =============================================================================
// Types
// =============================================================================

interface SparklesCreateEventModalProps {
    initialDate?: string;
    onClose: () => void;
}

// =============================================================================
// Component
// =============================================================================

export function SparklesCreateEventModal({ initialDate, onClose }: SparklesCreateEventModalProps) {
    const { calendars, accounts, activeAccountId, addEvent } = useSparklesStore();

    const accountId = activeAccountId || accounts[0]?.id;

    // Filter calendars for the active account
    const accountCalendars = useMemo(
        () => calendars.filter((c) => c.accountId === accountId),
        [calendars, accountId]
    );
    const primaryCalendar = accountCalendars.find((c) => c.isPrimary) || accountCalendars[0];

    // Form state
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [isAllDay, setIsAllDay] = useState(false);
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [attendees, setAttendees] = useState('');
    const [calendarId, setCalendarId] = useState(primaryCalendar?.id || '');
    const [addVideoMeeting, setAddVideoMeeting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = useCallback(async () => {
        if (!title.trim() || !calendarId || !accountId) return;

        setIsSaving(true);

        try {
            const attendeeList = attendees
                .split(',')
                .map((e) => e.trim())
                .filter(Boolean)
                .map((email) => ({
                    email,
                    responseStatus: 'needsAction' as const,
                }));

            const newEvent: CalendarEvent = {
                id: `event_${Date.now()}`,
                calendarId,
                accountId,
                summary: title,
                description: description || undefined,
                location: location || undefined,
                start: isAllDay
                    ? { date }
                    : { dateTime: `${date}T${startTime}:00` },
                end: isAllDay
                    ? { date }
                    : { dateTime: `${date}T${endTime}:00` },
                isAllDay,
                status: 'confirmed',
                htmlLink: '',
                created: Date.now(),
                updated: Date.now(),
                creator: { email: accounts.find((a) => a.id === accountId)?.email || '' },
                organizer: { email: accounts.find((a) => a.id === accountId)?.email || '' },
                attendees: attendeeList.length > 0 ? attendeeList : undefined,
                reminders: { useDefault: true },
                visibility: 'default',
                conferenceData: addVideoMeeting
                    ? {
                        conferenceId: `meet_${Date.now()}`,
                        conferenceSolution: { name: 'Google Meet', iconUri: '' },
                        entryPoints: [{ entryPointType: 'video', uri: '', label: 'Meet' }],
                    }
                    : undefined,
            };

            addEvent(newEvent);
            onClose();
        } catch (error) {
            console.error('Failed to create event:', error);
        } finally {
            setIsSaving(false);
        }
    }, [
        title,
        calendarId,
        accountId,
        accounts,
        date,
        startTime,
        endTime,
        isAllDay,
        location,
        description,
        attendees,
        addVideoMeeting,
        addEvent,
        onClose,
    ]);

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
                    'relative w-full max-w-lg mx-4',
                    'bg-[var(--glass-bg)] backdrop-blur-2xl',
                    'border border-[var(--glass-border)]',
                    'rounded-2xl shadow-2xl',
                    'overflow-hidden max-h-[90vh] flex flex-col'
                )}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--glass-border)]">
                    <h2 className="text-lg font-semibold text-[var(--glass-text-primary)]">
                        New Event
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
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* Title */}
                    <div>
                        <input
                            type="text"
                            placeholder="Add title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className={cn(
                                'w-full px-0 py-2 text-xl font-medium',
                                'bg-transparent border-0 border-b-2 border-[var(--glass-border)]',
                                'text-[var(--glass-text-primary)]',
                                'placeholder:text-[var(--glass-text-tertiary)]',
                                'focus:outline-none focus:border-[var(--color-accent)]'
                            )}
                            autoFocus
                        />
                    </div>

                    {/* Date & Time */}
                    <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-[var(--glass-text-tertiary)] mt-2.5" />
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className={cn(
                                        'flex-1 px-3 py-2 rounded-lg text-sm',
                                        'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                                        'text-[var(--glass-text-primary)]',
                                        'focus:outline-none focus:border-[var(--color-accent)]'
                                    )}
                                />
                                <label className="flex items-center gap-2 text-sm text-[var(--glass-text-secondary)]">
                                    <input
                                        type="checkbox"
                                        checked={isAllDay}
                                        onChange={(e) => setIsAllDay(e.target.checked)}
                                        className="w-4 h-4 rounded"
                                    />
                                    All day
                                </label>
                            </div>
                            {!isAllDay && (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className={cn(
                                            'flex-1 px-3 py-2 rounded-lg text-sm',
                                            'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                                            'text-[var(--glass-text-primary)]',
                                            'focus:outline-none focus:border-[var(--color-accent)]'
                                        )}
                                    />
                                    <span className="text-[var(--glass-text-tertiary)]">to</span>
                                    <input
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className={cn(
                                            'flex-1 px-3 py-2 rounded-lg text-sm',
                                            'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                                            'text-[var(--glass-text-primary)]',
                                            'focus:outline-none focus:border-[var(--color-accent)]'
                                        )}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Video Meeting */}
                    <div className="flex items-center gap-3">
                        <Video className="w-5 h-5 text-[var(--glass-text-tertiary)]" />
                        <button
                            onClick={() => setAddVideoMeeting(!addVideoMeeting)}
                            className={cn(
                                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                                addVideoMeeting
                                    ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]'
                                    : 'bg-[var(--glass-surface)] text-[var(--glass-text-secondary)]',
                                'hover:opacity-80',
                                'transition-colors duration-150'
                            )}
                        >
                            {addVideoMeeting ? 'Google Meet added' : 'Add Google Meet video conferencing'}
                        </button>
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-[var(--glass-text-tertiary)] mt-2.5" />
                        <input
                            type="text"
                            placeholder="Add location"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className={cn(
                                'flex-1 px-3 py-2 rounded-lg text-sm',
                                'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                                'text-[var(--glass-text-primary)]',
                                'placeholder:text-[var(--glass-text-tertiary)]',
                                'focus:outline-none focus:border-[var(--color-accent)]'
                            )}
                        />
                    </div>

                    {/* Attendees */}
                    <div className="flex items-start gap-3">
                        <Users className="w-5 h-5 text-[var(--glass-text-tertiary)] mt-2.5" />
                        <input
                            type="text"
                            placeholder="Add guests (comma separated emails)"
                            value={attendees}
                            onChange={(e) => setAttendees(e.target.value)}
                            className={cn(
                                'flex-1 px-3 py-2 rounded-lg text-sm',
                                'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                                'text-[var(--glass-text-primary)]',
                                'placeholder:text-[var(--glass-text-tertiary)]',
                                'focus:outline-none focus:border-[var(--color-accent)]'
                            )}
                        />
                    </div>

                    {/* Description */}
                    <div className="flex items-start gap-3">
                        <AlignLeft className="w-5 h-5 text-[var(--glass-text-tertiary)] mt-2.5" />
                        <textarea
                            placeholder="Add description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className={cn(
                                'flex-1 px-3 py-2 rounded-lg text-sm resize-none',
                                'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                                'text-[var(--glass-text-primary)]',
                                'placeholder:text-[var(--glass-text-tertiary)]',
                                'focus:outline-none focus:border-[var(--color-accent)]'
                            )}
                        />
                    </div>

                    {/* Calendar Selector */}
                    {accountCalendars.length > 1 && (
                        <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-[var(--glass-text-tertiary)]" />
                            <select
                                value={calendarId}
                                onChange={(e) => setCalendarId(e.target.value)}
                                className={cn(
                                    'flex-1 px-3 py-2 rounded-lg text-sm',
                                    'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                                    'text-[var(--glass-text-primary)]',
                                    'focus:outline-none focus:border-[var(--color-accent)]'
                                )}
                            >
                                {accountCalendars.map((cal) => (
                                    <option key={cal.id} value={cal.id}>
                                        {cal.summary}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-[var(--glass-border)]">
                    <button
                        onClick={onClose}
                        className={cn(
                            'px-4 py-2 rounded-lg text-sm font-medium',
                            'text-[var(--glass-text-secondary)]',
                            'hover:bg-[var(--glass-surface-hover)]',
                            'transition-colors duration-150'
                        )}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!title.trim() || isSaving}
                        className={cn(
                            'px-4 py-2 rounded-lg text-sm font-medium',
                            'bg-[var(--color-accent)] text-white',
                            'hover:opacity-90 disabled:opacity-50',
                            'transition-opacity duration-150'
                        )}
                    >
                        {isSaving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default SparklesCreateEventModal;
