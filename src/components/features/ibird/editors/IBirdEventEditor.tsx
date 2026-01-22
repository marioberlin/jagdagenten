/**
 * iBird Event Editor
 *
 * Modal for creating and editing calendar events.
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  Repeat,
  Bell,
  Palette,
  Loader2,
  Plus,
  Trash2,
  Link,
} from 'lucide-react';
import { useIBirdStore, type CalendarEvent, type EventAttendee, type RecurrenceRule } from '@/stores/ibirdStore';
import { useCalendarApi } from '../hooks/useIBirdApi';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface EventFormData {
  title: string;
  description: string;
  location: string;
  videoLink: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  isAllDay: boolean;
  calendarId: string;
  color: string;
  attendees: EventAttendee[];
  recurrence: RecurrenceRule | null;
  reminders: number[]; // minutes before event
}

// =============================================================================
// Color Options
// =============================================================================

const colorOptions = [
  { value: '#3b82f6', label: 'Blue' },
  { value: '#10b981', label: 'Green' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#ef4444', label: 'Red' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#6b7280', label: 'Gray' },
];

// =============================================================================
// Component
// =============================================================================

export function IBirdEventEditor() {
  const {
    ui,
    calendars,
    closeEventEditor,
    addEvent,
    updateEvent,
  } = useIBirdStore();

  const { createEvent, updateEvent: apiUpdateEvent } = useCalendarApi();
  const [isSaving, setIsSaving] = useState(false);
  const [showRecurrence, setShowRecurrence] = useState(false);
  const [showAttendees, setShowAttendees] = useState(false);
  const [newAttendeeEmail, setNewAttendeeEmail] = useState('');

  const isEditing = !!ui.editingEvent?.id;

  // Initialize form data
  const [formData, setFormData] = useState<EventFormData>(() => {
    const now = new Date();
    const startDate = now.toISOString().split('T')[0];
    const startHour = now.getHours();
    const startTime = `${String(startHour + 1).padStart(2, '0')}:00`;
    const endTime = `${String(startHour + 2).padStart(2, '0')}:00`;

    if (ui.editingEvent?.id) {
      const event = ui.editingEvent as CalendarEvent;
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      return {
        title: event.title || '',
        description: event.description || '',
        location: event.location || '',
        videoLink: event.videoLink || '',
        startDate: start.toISOString().split('T')[0],
        startTime: event.isAllDay ? '00:00' : `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`,
        endDate: end.toISOString().split('T')[0],
        endTime: event.isAllDay ? '23:59' : `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`,
        isAllDay: event.isAllDay || false,
        calendarId: event.calendarId || calendars[0]?.id || '',
        color: event.color || '#3b82f6',
        attendees: event.attendees || [],
        recurrence: event.recurrence || null,
        reminders: [15],
      };
    }

    return {
      title: '',
      description: '',
      location: '',
      videoLink: '',
      startDate,
      startTime,
      endDate: startDate,
      endTime,
      isAllDay: false,
      calendarId: calendars[0]?.id || '',
      color: '#3b82f6',
      attendees: [],
      recurrence: null,
      reminders: [15],
    };
  });

  // Update form when editing event changes
  useEffect(() => {
    if (ui.editingEvent?.startTime) {
      const start = new Date(ui.editingEvent.startTime as string);
      setFormData(prev => ({
        ...prev,
        startDate: start.toISOString().split('T')[0],
        startTime: `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`,
      }));
    }
  }, [ui.editingEvent]);

  const handleSave = async () => {
    if (!formData.title.trim()) return;

    setIsSaving(true);
    try {
      const startDateTime = formData.isAllDay
        ? new Date(`${formData.startDate}T00:00:00`)
        : new Date(`${formData.startDate}T${formData.startTime}`);

      const endDateTime = formData.isAllDay
        ? new Date(`${formData.endDate}T23:59:59`)
        : new Date(`${formData.endDate}T${formData.endTime}`);

      const eventData: Partial<CalendarEvent> = {
        title: formData.title,
        description: formData.description || undefined,
        location: formData.location || undefined,
        videoLink: formData.videoLink || undefined,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        isAllDay: formData.isAllDay,
        calendarId: formData.calendarId,
        color: formData.color,
        attendees: formData.attendees,
        recurrence: formData.recurrence || undefined,
        status: 'confirmed',
      };

      if (isEditing && ui.editingEvent?.id) {
        await apiUpdateEvent(ui.editingEvent.id, eventData);
        updateEvent(ui.editingEvent.id, eventData as CalendarEvent);
      } else {
        const newEvent = await createEvent(eventData);
        addEvent(newEvent);
      }

      closeEventEditor();
    } catch (error) {
      console.error('Failed to save event:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddAttendee = () => {
    if (!newAttendeeEmail.trim() || !newAttendeeEmail.includes('@')) return;

    const newAttendee: EventAttendee = {
      email: newAttendeeEmail.trim(),
      status: 'needs_action',
      required: true,
    };

    setFormData(prev => ({
      ...prev,
      attendees: [...prev.attendees, newAttendee],
    }));
    setNewAttendeeEmail('');
  };

  const handleRemoveAttendee = (email: string) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.filter(a => a.email !== email),
    }));
  };

  if (!ui.eventEditorOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={closeEventEditor}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={cn(
            'relative z-10 w-[550px] max-h-[85vh] rounded-2xl overflow-hidden',
            'bg-[var(--glass-bg)] backdrop-blur-2xl',
            'border border-[var(--glass-border)]',
            'shadow-2xl flex flex-col'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--glass-border)]">
            <h2 className="text-xl font-semibold text-[var(--glass-text-primary)]">
              {isEditing ? 'Edit Event' : 'New Event'}
            </h2>
            <button
              onClick={closeEventEditor}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--glass-surface-hover)] transition-colors"
            >
              <X className="w-5 h-5 text-[var(--glass-text-secondary)]" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Title */}
            <div>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Event title"
                className={cn(
                  'w-full px-4 py-3 rounded-xl text-lg font-medium',
                  'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                  'text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-tertiary)]',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--glass-accent)]/50'
                )}
                autoFocus
              />
            </div>

            {/* Date & Time */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[var(--glass-text-tertiary)]" />
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value, endDate: e.target.value })}
                    className={cn(
                      'flex-1 px-3 py-2 rounded-lg text-sm',
                      'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                      'text-[var(--glass-text-primary)]'
                    )}
                  />
                  {!formData.isAllDay && (
                    <>
                      <input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        className={cn(
                          'w-28 px-3 py-2 rounded-lg text-sm',
                          'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                          'text-[var(--glass-text-primary)]'
                        )}
                      />
                      <span className="text-[var(--glass-text-tertiary)]">to</span>
                      <input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        className={cn(
                          'w-28 px-3 py-2 rounded-lg text-sm',
                          'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                          'text-[var(--glass-text-primary)]'
                        )}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* All Day Toggle */}
              <div className="flex items-center gap-3 ml-8">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isAllDay}
                    onChange={(e) => setFormData({ ...formData, isAllDay: e.target.checked })}
                    className="w-4 h-4 rounded border-[var(--glass-border)] text-[var(--glass-accent)]"
                  />
                  <span className="text-sm text-[var(--glass-text-secondary)]">All day</span>
                </label>
              </div>
            </div>

            {/* Calendar Selection */}
            <div className="flex items-center gap-3">
              <Palette className="w-5 h-5 text-[var(--glass-text-tertiary)]" />
              <select
                value={formData.calendarId}
                onChange={(e) => setFormData({ ...formData, calendarId: e.target.value })}
                className={cn(
                  'flex-1 px-3 py-2 rounded-lg text-sm',
                  'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                  'text-[var(--glass-text-primary)]'
                )}
              >
                {calendars.map((cal) => (
                  <option key={cal.id} value={cal.id}>{cal.name}</option>
                ))}
              </select>
              <div className="flex items-center gap-1">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={cn(
                      'w-6 h-6 rounded-full transition-transform',
                      formData.color === color.value && 'ring-2 ring-white ring-offset-2 ring-offset-[var(--glass-bg)] scale-110'
                    )}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  />
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-[var(--glass-text-tertiary)]" />
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Add location"
                className={cn(
                  'flex-1 px-3 py-2 rounded-lg text-sm',
                  'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                  'text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-tertiary)]'
                )}
              />
            </div>

            {/* Video Link */}
            <div className="flex items-center gap-3">
              <Video className="w-5 h-5 text-[var(--glass-text-tertiary)]" />
              <input
                type="url"
                value={formData.videoLink}
                onChange={(e) => setFormData({ ...formData, videoLink: e.target.value })}
                placeholder="Add video conferencing link"
                className={cn(
                  'flex-1 px-3 py-2 rounded-lg text-sm',
                  'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                  'text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-tertiary)]'
                )}
              />
            </div>

            {/* Attendees */}
            <div className="space-y-2">
              <button
                onClick={() => setShowAttendees(!showAttendees)}
                className="flex items-center gap-3 text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]"
              >
                <Users className="w-5 h-5 text-[var(--glass-text-tertiary)]" />
                <span className="text-sm">
                  {formData.attendees.length > 0
                    ? `${formData.attendees.length} attendee${formData.attendees.length > 1 ? 's' : ''}`
                    : 'Add attendees'}
                </span>
              </button>

              {showAttendees && (
                <div className="ml-8 space-y-2">
                  {/* Attendee List */}
                  {formData.attendees.map((attendee) => (
                    <div
                      key={attendee.email}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--glass-surface)]"
                    >
                      <span className="text-sm text-[var(--glass-text-primary)]">{attendee.email}</span>
                      <button
                        onClick={() => handleRemoveAttendee(attendee.email)}
                        className="p-1 hover:bg-[var(--glass-surface-hover)] rounded"
                      >
                        <X className="w-4 h-4 text-[var(--glass-text-tertiary)]" />
                      </button>
                    </div>
                  ))}

                  {/* Add Attendee */}
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      value={newAttendeeEmail}
                      onChange={(e) => setNewAttendeeEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddAttendee()}
                      placeholder="Add email address"
                      className={cn(
                        'flex-1 px-3 py-2 rounded-lg text-sm',
                        'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                        'text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-tertiary)]'
                      )}
                    />
                    <button
                      onClick={handleAddAttendee}
                      className="p-2 rounded-lg bg-[var(--glass-accent)] text-white hover:bg-[var(--glass-accent-hover)]"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Recurrence */}
            <div className="space-y-2">
              <button
                onClick={() => setShowRecurrence(!showRecurrence)}
                className="flex items-center gap-3 text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]"
              >
                <Repeat className="w-5 h-5 text-[var(--glass-text-tertiary)]" />
                <span className="text-sm">
                  {formData.recurrence ? 'Repeats' : 'Does not repeat'}
                </span>
              </button>

              {showRecurrence && (
                <div className="ml-8">
                  <select
                    value={formData.recurrence?.frequency || ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        setFormData({
                          ...formData,
                          recurrence: {
                            frequency: e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly',
                            interval: 1,
                          },
                        });
                      } else {
                        setFormData({ ...formData, recurrence: null });
                      }
                    }}
                    className={cn(
                      'w-full px-3 py-2 rounded-lg text-sm',
                      'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                      'text-[var(--glass-text-primary)]'
                    )}
                  >
                    <option value="">Does not repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add description"
                rows={3}
                className={cn(
                  'w-full px-4 py-3 rounded-xl text-sm',
                  'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                  'text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-tertiary)]',
                  'resize-none'
                )}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--glass-border)]">
            {isEditing ? (
              <button
                onClick={() => {
                  // Delete event
                  if (ui.editingEvent?.id) {
                    useIBirdStore.getState().removeEvent(ui.editingEvent.id);
                  }
                  closeEventEditor();
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
              >
                Delete Event
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={closeEventEditor}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium',
                  'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]',
                  'hover:bg-[var(--glass-surface-hover)] transition-colors'
                )}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.title.trim() || isSaving}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium',
                  'bg-[var(--glass-accent)] text-white',
                  'hover:bg-[var(--glass-accent-hover)] transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
