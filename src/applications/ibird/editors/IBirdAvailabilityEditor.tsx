/**
 * iBird Availability Editor
 *
 * Modal for managing availability schedules (working hours).
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Clock,
  Plus,
  Trash2,
  Copy,
  Loader2,
  Check,
} from 'lucide-react';
import { useIBirdStore, type AvailabilitySchedule, type TimeSlot } from '../store';
import { useAppointmentsApi } from '../hooks/useIBirdApi';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface DaySchedule {
  enabled: boolean;
  slots: TimeSlot[];
}

type DayOfWeek = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

const DAYS: { key: DayOfWeek; label: string; short: string }[] = [
  { key: 'sunday', label: 'Sunday', short: 'Sun' },
  { key: 'monday', label: 'Monday', short: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday', label: 'Thursday', short: 'Thu' },
  { key: 'friday', label: 'Friday', short: 'Fri' },
  { key: 'saturday', label: 'Saturday', short: 'Sat' },
];

// =============================================================================
// Component
// =============================================================================

export function IBirdAvailabilityEditor() {
  const {
    ui,
    availabilitySchedules,
    closeAvailabilityEditor,
    addAvailabilitySchedule,
    updateAvailabilitySchedule,
  } = useIBirdStore();

  const { createAvailabilitySchedule, updateAvailabilitySchedule: apiUpdate } = useAppointmentsApi();
  const [isSaving, setIsSaving] = useState(false);
  const [scheduleName, setScheduleName] = useState('Working Hours');

  // Initialize weekly hours from existing schedule or defaults
  const [weeklyHours, setWeeklyHours] = useState<Record<DayOfWeek, DaySchedule>>(() => {
    const existingSchedule = availabilitySchedules[0];
    if (existingSchedule?.weeklyHours) {
      const hours: Record<DayOfWeek, DaySchedule> = {} as any;
      for (const day of DAYS) {
        const dayHours = (existingSchedule.weeklyHours as Record<string, TimeSlot[]>)[day.key];
        hours[day.key] = {
          enabled: dayHours && dayHours.length > 0,
          slots: dayHours || [{ start: '09:00', end: '17:00' }],
        };
      }
      return hours;
    }

    // Default: Mon-Fri 9-5
    return {
      sunday: { enabled: false, slots: [{ start: '09:00', end: '17:00' }] },
      monday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
      tuesday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
      wednesday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
      thursday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
      friday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
      saturday: { enabled: false, slots: [{ start: '09:00', end: '17:00' }] },
    };
  });

  const toggleDay = (day: DayOfWeek) => {
    setWeeklyHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
      },
    }));
  };

  const updateSlot = (day: DayOfWeek, slotIndex: number, field: 'start' | 'end', value: string) => {
    setWeeklyHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.map((slot, i) =>
          i === slotIndex ? { ...slot, [field]: value } : slot
        ),
      },
    }));
  };

  const addSlot = (day: DayOfWeek) => {
    setWeeklyHours(prev => {
      const lastSlot = prev[day].slots[prev[day].slots.length - 1];
      const newStart = lastSlot ? lastSlot.end : '09:00';
      const newEndHour = parseInt(newStart.split(':')[0]) + 2;
      const newEnd = `${String(Math.min(newEndHour, 23)).padStart(2, '0')}:00`;

      return {
        ...prev,
        [day]: {
          ...prev[day],
          slots: [...prev[day].slots, { start: newStart, end: newEnd }],
        },
      };
    });
  };

  const removeSlot = (day: DayOfWeek, slotIndex: number) => {
    setWeeklyHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.filter((_, i) => i !== slotIndex),
      },
    }));
  };

  const copyToAllDays = (sourceDay: DayOfWeek) => {
    const sourceSlots = weeklyHours[sourceDay].slots;
    setWeeklyHours(prev => {
      const updated = { ...prev };
      for (const day of DAYS) {
        if (day.key !== sourceDay && prev[day.key].enabled) {
          updated[day.key] = {
            ...prev[day.key],
            slots: [...sourceSlots],
          };
        }
      }
      return updated;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Convert to API format
      const weeklyHoursData: Record<string, TimeSlot[]> = {};
      for (const day of DAYS) {
        if (weeklyHours[day.key].enabled) {
          weeklyHoursData[day.key] = weeklyHours[day.key].slots;
        }
      }

      const scheduleData = {
        name: scheduleName,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        weeklyHours: weeklyHoursData,
        isDefault: true,
      };

      const existingSchedule = availabilitySchedules[0];
      if (existingSchedule) {
        await apiUpdate(existingSchedule.id, scheduleData);
        updateAvailabilitySchedule(existingSchedule.id, scheduleData as Partial<AvailabilitySchedule>);
      } else {
        const newSchedule = await createAvailabilitySchedule(scheduleData);
        addAvailabilitySchedule(newSchedule);
      }

      closeAvailabilityEditor();
    } catch (error) {
      console.error('Failed to save availability:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate total hours per week
  const totalHours = useMemo(() => {
    let minutes = 0;
    for (const day of DAYS) {
      if (weeklyHours[day.key].enabled) {
        for (const slot of weeklyHours[day.key].slots) {
          const [startH, startM] = slot.start.split(':').map(Number);
          const [endH, endM] = slot.end.split(':').map(Number);
          minutes += (endH * 60 + endM) - (startH * 60 + startM);
        }
      }
    }
    return Math.round(minutes / 60 * 10) / 10;
  }, [weeklyHours]);

  if (!ui.availabilityEditorOpen) return null;

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
          onClick={closeAvailabilityEditor}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={cn(
            'relative z-10 w-[600px] max-h-[85vh] rounded-2xl overflow-hidden',
            'bg-[var(--glass-bg)] backdrop-blur-2xl',
            'border border-[var(--glass-border)]',
            'shadow-2xl flex flex-col'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--glass-border)]">
            <div>
              <h2 className="text-xl font-semibold text-[var(--glass-text-primary)]">
                Availability
              </h2>
              <p className="text-sm text-[var(--glass-text-tertiary)]">
                {totalHours} hours per week
              </p>
            </div>
            <button
              onClick={closeAvailabilityEditor}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--glass-surface-hover)] transition-colors"
            >
              <X className="w-5 h-5 text-[var(--glass-text-secondary)]" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Schedule Name */}
            <div>
              <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-1.5">
                Schedule Name
              </label>
              <input
                type="text"
                value={scheduleName}
                onChange={(e) => setScheduleName(e.target.value)}
                placeholder="e.g., Working Hours"
                className={cn(
                  'w-full px-4 py-2.5 rounded-lg text-sm',
                  'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                  'text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-tertiary)]',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--glass-accent)]/50'
                )}
              />
            </div>

            {/* Weekly Schedule */}
            <div className="space-y-3">
              {DAYS.map((day) => (
                <div
                  key={day.key}
                  className={cn(
                    'p-4 rounded-xl border transition-colors',
                    weeklyHours[day.key].enabled
                      ? 'bg-[var(--glass-surface)] border-[var(--glass-border)]'
                      : 'bg-transparent border-dashed border-[var(--glass-border)]/50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {/* Day Toggle */}
                    <button
                      onClick={() => toggleDay(day.key)}
                      className={cn(
                        'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                        weeklyHours[day.key].enabled
                          ? 'bg-[var(--glass-accent)] border-[var(--glass-accent)]'
                          : 'border-[var(--glass-border)]'
                      )}
                    >
                      {weeklyHours[day.key].enabled && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </button>

                    {/* Day Label */}
                    <span className={cn(
                      'w-24 font-medium text-sm',
                      weeklyHours[day.key].enabled
                        ? 'text-[var(--glass-text-primary)]'
                        : 'text-[var(--glass-text-tertiary)]'
                    )}>
                      {day.label}
                    </span>

                    {/* Time Slots */}
                    {weeklyHours[day.key].enabled ? (
                      <div className="flex-1 space-y-2">
                        {weeklyHours[day.key].slots.map((slot, slotIndex) => (
                          <div key={slotIndex} className="flex items-center gap-2">
                            <input
                              type="time"
                              value={slot.start}
                              onChange={(e) => updateSlot(day.key, slotIndex, 'start', e.target.value)}
                              className={cn(
                                'w-28 px-2 py-1.5 rounded text-sm',
                                'bg-[var(--glass-bg)] border border-[var(--glass-border)]',
                                'text-[var(--glass-text-primary)]'
                              )}
                            />
                            <span className="text-[var(--glass-text-tertiary)]">-</span>
                            <input
                              type="time"
                              value={slot.end}
                              onChange={(e) => updateSlot(day.key, slotIndex, 'end', e.target.value)}
                              className={cn(
                                'w-28 px-2 py-1.5 rounded text-sm',
                                'bg-[var(--glass-bg)] border border-[var(--glass-border)]',
                                'text-[var(--glass-text-primary)]'
                              )}
                            />

                            {weeklyHours[day.key].slots.length > 1 && (
                              <button
                                onClick={() => removeSlot(day.key, slotIndex)}
                                className="p-1 hover:bg-[var(--glass-surface-hover)] rounded text-[var(--glass-text-tertiary)]"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}

                            {slotIndex === weeklyHours[day.key].slots.length - 1 && (
                              <>
                                <button
                                  onClick={() => addSlot(day.key)}
                                  className="p-1 hover:bg-[var(--glass-surface-hover)] rounded text-[var(--glass-text-tertiary)]"
                                  title="Add time slot"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => copyToAllDays(day.key)}
                                  className="p-1 hover:bg-[var(--glass-surface-hover)] rounded text-[var(--glass-text-tertiary)]"
                                  title="Copy to all enabled days"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-[var(--glass-text-tertiary)]">Unavailable</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Presets */}
            <div className="pt-4 border-t border-[var(--glass-border)]">
              <p className="text-sm text-[var(--glass-text-secondary)] mb-2">Quick Presets</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setWeeklyHours({
                      sunday: { enabled: false, slots: [{ start: '09:00', end: '17:00' }] },
                      monday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
                      tuesday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
                      wednesday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
                      thursday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
                      friday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
                      saturday: { enabled: false, slots: [{ start: '09:00', end: '17:00' }] },
                    });
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--glass-surface)] hover:bg-[var(--glass-surface-hover)] text-[var(--glass-text-secondary)] transition-colors"
                >
                  9-5 Weekdays
                </button>
                <button
                  onClick={() => {
                    setWeeklyHours({
                      sunday: { enabled: false, slots: [{ start: '09:00', end: '17:00' }] },
                      monday: { enabled: true, slots: [{ start: '08:00', end: '12:00' }, { start: '13:00', end: '18:00' }] },
                      tuesday: { enabled: true, slots: [{ start: '08:00', end: '12:00' }, { start: '13:00', end: '18:00' }] },
                      wednesday: { enabled: true, slots: [{ start: '08:00', end: '12:00' }, { start: '13:00', end: '18:00' }] },
                      thursday: { enabled: true, slots: [{ start: '08:00', end: '12:00' }, { start: '13:00', end: '18:00' }] },
                      friday: { enabled: true, slots: [{ start: '08:00', end: '12:00' }, { start: '13:00', end: '18:00' }] },
                      saturday: { enabled: false, slots: [{ start: '09:00', end: '17:00' }] },
                    });
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--glass-surface)] hover:bg-[var(--glass-surface-hover)] text-[var(--glass-text-secondary)] transition-colors"
                >
                  With Lunch Break
                </button>
                <button
                  onClick={() => {
                    setWeeklyHours({
                      sunday: { enabled: false, slots: [{ start: '09:00', end: '17:00' }] },
                      monday: { enabled: true, slots: [{ start: '10:00', end: '19:00' }] },
                      tuesday: { enabled: true, slots: [{ start: '10:00', end: '19:00' }] },
                      wednesday: { enabled: true, slots: [{ start: '10:00', end: '19:00' }] },
                      thursday: { enabled: true, slots: [{ start: '10:00', end: '19:00' }] },
                      friday: { enabled: true, slots: [{ start: '10:00', end: '15:00' }] },
                      saturday: { enabled: false, slots: [{ start: '09:00', end: '17:00' }] },
                    });
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--glass-surface)] hover:bg-[var(--glass-surface-hover)] text-[var(--glass-text-secondary)] transition-colors"
                >
                  Late Start
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--glass-border)]">
            <button
              onClick={closeAvailabilityEditor}
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
              disabled={isSaving}
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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
