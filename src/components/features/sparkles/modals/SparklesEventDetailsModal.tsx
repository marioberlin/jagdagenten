/**
 * SparklesEventDetailsModal - View and manage calendar event details
 */

import { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    X,
    Calendar,
    MapPin,
    Video,
    Users,
    Trash2,
    Edit,
    ExternalLink,
} from 'lucide-react';
import { useSparklesStore } from '@/stores/sparklesStore';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface SparklesEventDetailsModalProps {
    eventId: string;
    onClose: () => void;
}

// =============================================================================
// Component
// =============================================================================

export function SparklesEventDetailsModal({ eventId, onClose }: SparklesEventDetailsModalProps) {
    const { events, removeEvent } = useSparklesStore();

    const event = useMemo(
        () => events.find((e) => e.id === eventId),
        [events, eventId]
    );

    const handleEdit = useCallback(() => {
        // TODO: Open edit modal with event data
        console.log('Edit event:', eventId);
    }, [eventId]);

    const handleDelete = useCallback(() => {
        if (confirm('Are you sure you want to delete this event?')) {
            removeEvent(eventId);
            onClose();
        }
    }, [eventId, removeEvent, onClose]);

    const handleOpenLink = useCallback(() => {
        if (event?.htmlLink) {
            window.open(event.htmlLink, '_blank');
        }
    }, [event]);

    if (!event) {
        return null;
    }

    const formatDateTime = (start: typeof event.start, end: typeof event.end) => {
        if (event.isAllDay) {
            const startDate = new Date(start.date!);
            const endDate = new Date(end.date!);
            if (startDate.toDateString() === endDate.toDateString()) {
                return startDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                });
            }
            return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        }

        const startDateTime = new Date(start.dateTime!);
        const endDateTime = new Date(end.dateTime!);

        const dateStr = startDateTime.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });

        const timeStr = `${startDateTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - ${endDateTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;

        return (
            <>
                <div>{dateStr}</div>
                <div className="text-[var(--glass-text-secondary)]">{timeStr}</div>
            </>
        );
    };

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
                    'overflow-hidden'
                )}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
            >
                {/* Header */}
                <div className="flex items-start justify-between px-6 py-4 border-b border-[var(--glass-border)]">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-semibold text-[var(--glass-text-primary)] truncate">
                            {event.summary}
                        </h2>
                        {event.status === 'cancelled' && (
                            <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-500">
                                Cancelled
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                        <button
                            onClick={handleOpenLink}
                            className={cn(
                                'p-2 rounded-lg',
                                'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]',
                                'hover:bg-[var(--glass-surface-hover)]',
                                'transition-colors duration-150'
                            )}
                            title="Open in Google Calendar"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleEdit}
                            className={cn(
                                'p-2 rounded-lg',
                                'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]',
                                'hover:bg-[var(--glass-surface-hover)]',
                                'transition-colors duration-150'
                            )}
                            title="Edit"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleDelete}
                            className={cn(
                                'p-2 rounded-lg',
                                'text-[var(--glass-text-secondary)] hover:text-[var(--system-red)]',
                                'hover:bg-[var(--glass-surface-hover)]',
                                'transition-colors duration-150'
                            )}
                            title="Delete"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
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
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Date & Time */}
                    <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-[var(--glass-text-tertiary)] mt-0.5" />
                        <div className="text-sm text-[var(--glass-text-primary)]">
                            {formatDateTime(event.start, event.end)}
                        </div>
                    </div>

                    {/* Location */}
                    {event.location && (
                        <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-[var(--glass-text-tertiary)] mt-0.5" />
                            <div className="text-sm text-[var(--glass-text-primary)]">
                                {event.location}
                            </div>
                        </div>
                    )}

                    {/* Video Conference */}
                    {event.conferenceData && (
                        <div className="flex items-start gap-3">
                            <Video className="w-5 h-5 text-[var(--glass-text-tertiary)] mt-0.5" />
                            <div>
                                <div className="text-sm text-[var(--glass-text-primary)]">
                                    {event.conferenceData.conferenceSolution.name}
                                </div>
                                {event.conferenceData.entryPoints.map((entry, idx) => (
                                    <a
                                        key={idx}
                                        href={entry.uri}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-[var(--color-accent)] hover:underline block mt-0.5"
                                    >
                                        Join meeting
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Attendees */}
                    {event.attendees && event.attendees.length > 0 && (
                        <div className="flex items-start gap-3">
                            <Users className="w-5 h-5 text-[var(--glass-text-tertiary)] mt-0.5" />
                            <div className="flex-1">
                                <div className="text-sm text-[var(--glass-text-primary)] mb-2">
                                    {event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}
                                </div>
                                <div className="space-y-1">
                                    {event.attendees.slice(0, 5).map((attendee, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <div
                                                className={cn(
                                                    'w-2 h-2 rounded-full',
                                                    attendee.responseStatus === 'accepted'
                                                        ? 'bg-green-500'
                                                        : attendee.responseStatus === 'declined'
                                                            ? 'bg-red-500'
                                                            : attendee.responseStatus === 'tentative'
                                                                ? 'bg-yellow-500'
                                                                : 'bg-gray-400'
                                                )}
                                            />
                                            <span className="text-xs text-[var(--glass-text-secondary)]">
                                                {attendee.displayName || attendee.email}
                                                {attendee.organizer && ' (Organizer)'}
                                            </span>
                                        </div>
                                    ))}
                                    {event.attendees.length > 5 && (
                                        <div className="text-xs text-[var(--glass-text-tertiary)]">
                                            +{event.attendees.length - 5} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    {event.description && (
                        <div className="pt-4 border-t border-[var(--glass-border)]">
                            <div
                                className="text-sm text-[var(--glass-text-secondary)] prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: event.description }}
                            />
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

export default SparklesEventDetailsModal;
