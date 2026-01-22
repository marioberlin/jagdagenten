/**
 * iBird Appointment Type Editor
 *
 * Modal for creating and editing appointment types (like Calendly event types).
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Clock,
  MapPin,
  Video,
  DollarSign,
  Palette,
  Loader2,
  Plus,
  Trash2,
  Link,
  Globe,
  Phone,
  Building,
} from 'lucide-react';
import { useIBirdStore, type AppointmentType, type LocationType, type VideoProvider } from '@/stores/ibirdStore';
import { useAppointmentsApi } from '../hooks/useIBirdApi';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface AppointmentTypeFormData {
  name: string;
  description: string;
  duration: number; // minutes
  color: string;
  locationType: LocationType;
  locationDetails: string;
  videoProvider: VideoProvider | null;
  customVideoLink: string;
  price: number | null;
  currency: string;
  bufferBefore: number;
  bufferAfter: number;
  minNotice: number; // hours
  maxAdvance: number; // days
  isActive: boolean;
  customQuestions: { question: string; required: boolean }[];
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

const durationOptions = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
];

const locationTypes: { value: LocationType; label: string; icon: typeof Clock }[] = [
  { value: 'video', label: 'Video Call', icon: Video },
  { value: 'phone', label: 'Phone Call', icon: Phone },
  { value: 'in_person', label: 'In Person', icon: Building },
  { value: 'custom', label: 'Custom', icon: Globe },
];

// =============================================================================
// Component
// =============================================================================

export function IBirdAppointmentTypeEditor() {
  const {
    ui,
    closeAppointmentTypeEditor,
    addAppointmentType,
    updateAppointmentType,
  } = useIBirdStore();

  const { createAppointmentType, updateAppointmentType: apiUpdateType } = useAppointmentsApi();
  const [isSaving, setIsSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');

  const isEditing = !!ui.editingAppointmentType?.id;

  // Initialize form data
  const [formData, setFormData] = useState<AppointmentTypeFormData>(() => {
    if (ui.editingAppointmentType?.id) {
      const type = ui.editingAppointmentType as AppointmentType;
      return {
        name: type.name || '',
        description: type.description || '',
        duration: type.duration || 30,
        color: type.color || '#3b82f6',
        locationType: type.locationType || 'video',
        locationDetails: type.locationDetails || '',
        videoProvider: type.videoProvider || null,
        customVideoLink: type.customVideoLink || '',
        price: type.price || null,
        currency: type.currency || 'USD',
        bufferBefore: type.bufferBefore || 0,
        bufferAfter: type.bufferAfter || 0,
        minNotice: type.minNotice || 24,
        maxAdvance: type.maxAdvance || 60,
        isActive: type.isActive ?? true,
        customQuestions: type.customQuestions || [],
      };
    }

    return {
      name: '',
      description: '',
      duration: 30,
      color: '#3b82f6',
      locationType: 'video',
      locationDetails: '',
      videoProvider: 'google_meet',
      customVideoLink: '',
      price: null,
      currency: 'USD',
      bufferBefore: 0,
      bufferAfter: 0,
      minNotice: 24,
      maxAdvance: 60,
      isActive: true,
      customQuestions: [],
    };
  });

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    setIsSaving(true);
    try {
      const typeData: Partial<AppointmentType> = {
        name: formData.name,
        description: formData.description || undefined,
        duration: formData.duration,
        color: formData.color,
        locationType: formData.locationType,
        locationDetails: formData.locationDetails || undefined,
        videoProvider: formData.videoProvider || undefined,
        customVideoLink: formData.customVideoLink || undefined,
        price: formData.price || undefined,
        currency: formData.currency,
        bufferBefore: formData.bufferBefore,
        bufferAfter: formData.bufferAfter,
        minNotice: formData.minNotice,
        maxAdvance: formData.maxAdvance,
        isActive: formData.isActive,
        customQuestions: formData.customQuestions.length > 0 ? formData.customQuestions : undefined,
      };

      if (isEditing && ui.editingAppointmentType?.id) {
        await apiUpdateType(ui.editingAppointmentType.id, typeData);
        updateAppointmentType(ui.editingAppointmentType.id, typeData as AppointmentType);
      } else {
        const newType = await createAppointmentType(typeData as Omit<AppointmentType, 'id' | 'userId' | 'slug' | 'createdAt' | 'updatedAt'>);
        addAppointmentType(newType);
      }

      closeAppointmentTypeEditor();
    } catch (error) {
      console.error('Failed to save appointment type:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddQuestion = () => {
    if (!newQuestion.trim()) return;
    setFormData(prev => ({
      ...prev,
      customQuestions: [...prev.customQuestions, { question: newQuestion.trim(), required: false }],
    }));
    setNewQuestion('');
  };

  const handleRemoveQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      customQuestions: prev.customQuestions.filter((_, i) => i !== index),
    }));
  };

  if (!ui.appointmentTypeEditorOpen) return null;

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
          onClick={closeAppointmentTypeEditor}
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
              {isEditing ? 'Edit Event Type' : 'New Event Type'}
            </h2>
            <button
              onClick={closeAppointmentTypeEditor}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--glass-surface-hover)] transition-colors"
            >
              <X className="w-5 h-5 text-[var(--glass-text-secondary)]" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-1.5">
                Event Type Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., 30 Minute Meeting"
                className={cn(
                  'w-full px-4 py-3 rounded-xl text-lg font-medium',
                  'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                  'text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-tertiary)]',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--glass-accent)]/50'
                )}
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-1.5">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this meeting type..."
                rows={2}
                className={cn(
                  'w-full px-4 py-3 rounded-xl text-sm',
                  'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                  'text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-tertiary)]',
                  'resize-none'
                )}
              />
            </div>

            {/* Duration & Color */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-1.5">
                  Duration
                </label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  className={cn(
                    'w-full px-3 py-2.5 rounded-lg text-sm',
                    'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                    'text-[var(--glass-text-primary)]'
                  )}
                >
                  {durationOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-1.5">
                  Color
                </label>
                <div className="flex items-center gap-1 p-2 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)]">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={cn(
                        'w-6 h-6 rounded-full transition-transform',
                        formData.color === color.value && 'ring-2 ring-white ring-offset-1 ring-offset-[var(--glass-surface)] scale-110'
                      )}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Location Type */}
            <div>
              <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-1.5">
                Location
              </label>
              <div className="grid grid-cols-4 gap-2">
                {locationTypes.map((loc) => {
                  const Icon = loc.icon;
                  return (
                    <button
                      key={loc.value}
                      onClick={() => setFormData({ ...formData, locationType: loc.value })}
                      className={cn(
                        'flex flex-col items-center gap-1 p-3 rounded-lg border transition-all',
                        formData.locationType === loc.value
                          ? 'bg-[var(--glass-accent)] border-[var(--glass-accent)] text-white'
                          : 'bg-[var(--glass-surface)] border-[var(--glass-border)] text-[var(--glass-text-secondary)] hover:border-[var(--glass-accent)]'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-medium">{loc.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Location Details */}
            {formData.locationType === 'video' && (
              <div>
                <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-1.5">
                  Video Provider
                </label>
                <select
                  value={formData.videoProvider || ''}
                  onChange={(e) => setFormData({ ...formData, videoProvider: e.target.value as VideoProvider })}
                  className={cn(
                    'w-full px-3 py-2.5 rounded-lg text-sm',
                    'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                    'text-[var(--glass-text-primary)]'
                  )}
                >
                  <option value="google_meet">Google Meet</option>
                  <option value="zoom">Zoom</option>
                  <option value="teams">Microsoft Teams</option>
                  <option value="custom">Custom Link</option>
                </select>
              </div>
            )}

            {(formData.locationType === 'in_person' || formData.locationType === 'custom') && (
              <div>
                <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-1.5">
                  {formData.locationType === 'in_person' ? 'Address' : 'Location Details'}
                </label>
                <input
                  type="text"
                  value={formData.locationDetails}
                  onChange={(e) => setFormData({ ...formData, locationDetails: e.target.value })}
                  placeholder={formData.locationType === 'in_person' ? '123 Main St, City, State' : 'Enter location details'}
                  className={cn(
                    'w-full px-3 py-2.5 rounded-lg text-sm',
                    'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                    'text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-tertiary)]'
                  )}
                />
              </div>
            )}

            {formData.videoProvider === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-1.5">
                  Custom Video Link
                </label>
                <input
                  type="url"
                  value={formData.customVideoLink}
                  onChange={(e) => setFormData({ ...formData, customVideoLink: e.target.value })}
                  placeholder="https://..."
                  className={cn(
                    'w-full px-3 py-2.5 rounded-lg text-sm',
                    'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                    'text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-tertiary)]'
                  )}
                />
              </div>
            )}

            {/* Advanced Settings Toggle */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-[var(--glass-accent)] hover:underline"
            >
              {showAdvanced ? 'Hide' : 'Show'} advanced settings
            </button>

            {showAdvanced && (
              <div className="space-y-4 pt-2 border-t border-[var(--glass-border)]">
                {/* Buffers */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-1.5">
                      Buffer Before (min)
                    </label>
                    <input
                      type="number"
                      value={formData.bufferBefore}
                      onChange={(e) => setFormData({ ...formData, bufferBefore: parseInt(e.target.value) || 0 })}
                      min="0"
                      className={cn(
                        'w-full px-3 py-2.5 rounded-lg text-sm',
                        'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                        'text-[var(--glass-text-primary)]'
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-1.5">
                      Buffer After (min)
                    </label>
                    <input
                      type="number"
                      value={formData.bufferAfter}
                      onChange={(e) => setFormData({ ...formData, bufferAfter: parseInt(e.target.value) || 0 })}
                      min="0"
                      className={cn(
                        'w-full px-3 py-2.5 rounded-lg text-sm',
                        'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                        'text-[var(--glass-text-primary)]'
                      )}
                    />
                  </div>
                </div>

                {/* Notice & Advance */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-1.5">
                      Min Notice (hours)
                    </label>
                    <input
                      type="number"
                      value={formData.minNotice}
                      onChange={(e) => setFormData({ ...formData, minNotice: parseInt(e.target.value) || 0 })}
                      min="0"
                      className={cn(
                        'w-full px-3 py-2.5 rounded-lg text-sm',
                        'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                        'text-[var(--glass-text-primary)]'
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-1.5">
                      Max Advance (days)
                    </label>
                    <input
                      type="number"
                      value={formData.maxAdvance}
                      onChange={(e) => setFormData({ ...formData, maxAdvance: parseInt(e.target.value) || 0 })}
                      min="1"
                      className={cn(
                        'w-full px-3 py-2.5 rounded-lg text-sm',
                        'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                        'text-[var(--glass-text-primary)]'
                      )}
                    />
                  </div>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-1.5">
                    Price (optional)
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className={cn(
                        'w-20 px-2 py-2.5 rounded-lg text-sm',
                        'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                        'text-[var(--glass-text-primary)]'
                      )}
                    >
                      <option value="USD">$</option>
                      <option value="EUR">€</option>
                      <option value="GBP">£</option>
                    </select>
                    <input
                      type="number"
                      value={formData.price || ''}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value ? parseFloat(e.target.value) : null })}
                      placeholder="Free"
                      min="0"
                      step="0.01"
                      className={cn(
                        'flex-1 px-3 py-2.5 rounded-lg text-sm',
                        'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                        'text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-tertiary)]'
                      )}
                    />
                  </div>
                </div>

                {/* Custom Questions */}
                <div>
                  <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-1.5">
                    Custom Questions
                  </label>
                  <div className="space-y-2">
                    {formData.customQuestions.map((q, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--glass-surface)]"
                      >
                        <span className="flex-1 text-sm text-[var(--glass-text-primary)]">{q.question}</span>
                        <label className="flex items-center gap-1 text-xs text-[var(--glass-text-tertiary)]">
                          <input
                            type="checkbox"
                            checked={q.required}
                            onChange={(e) => {
                              const updated = [...formData.customQuestions];
                              updated[i].required = e.target.checked;
                              setFormData({ ...formData, customQuestions: updated });
                            }}
                            className="w-3 h-3"
                          />
                          Required
                        </label>
                        <button
                          onClick={() => handleRemoveQuestion(i)}
                          className="p-1 hover:bg-[var(--glass-surface-hover)] rounded"
                        >
                          <X className="w-4 h-4 text-[var(--glass-text-tertiary)]" />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddQuestion()}
                        placeholder="Add a question..."
                        className={cn(
                          'flex-1 px-3 py-2 rounded-lg text-sm',
                          'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                          'text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-tertiary)]'
                        )}
                      />
                      <button
                        onClick={handleAddQuestion}
                        className="p-2 rounded-lg bg-[var(--glass-accent)] text-white hover:bg-[var(--glass-accent-hover)]"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--glass-border)]">
            {isEditing ? (
              <button
                onClick={() => {
                  if (ui.editingAppointmentType?.id) {
                    useIBirdStore.getState().removeAppointmentType(ui.editingAppointmentType.id);
                  }
                  closeAppointmentTypeEditor();
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
              >
                Delete Event Type
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={closeAppointmentTypeEditor}
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
                disabled={!formData.name.trim() || isSaving}
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
