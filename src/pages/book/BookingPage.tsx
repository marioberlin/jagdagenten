/**
 * Public Booking Page
 *
 * A standalone public page where external users can book appointments.
 * Accessible at /book/:username/:eventType?
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Video,
  MapPin,
  Phone,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  User,
  Mail,
  MessageSquare,
  Globe,
  AlertCircle,
} from 'lucide-react';
import { usePublicBookingApi } from '@/applications/ibird/hooks/useIBirdApi';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface AppointmentType {
  id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  color: string;
  locationType: string;
  videoProvider?: string;
  price?: number;
  currency?: string;
}

interface BookingFormData {
  name: string;
  email: string;
  notes: string;
  responses: Record<string, string>;
}

// =============================================================================
// Component
// =============================================================================

export default function BookingPage() {
  const { username, eventType } = useParams<{ username: string; eventType?: string }>();
  const [_searchParams] = useSearchParams();

  const {
    fetchPublicProfile,
    fetchAvailableSlots,
    createBooking,
  } = usePublicBookingApi();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ name: string; timezone: string; appointmentTypes: AppointmentType[] } | null>(null);
  const [selectedType, setSelectedType] = useState<AppointmentType | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [step, setStep] = useState<'type' | 'datetime' | 'form' | 'confirmed'>('type');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_bookingId, setBookingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<BookingFormData>({
    name: '',
    email: '',
    notes: '',
    responses: {},
  });

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Load public profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!username) return;

      try {
        setLoading(true);
        const data = await fetchPublicProfile(username);
        setProfile(data);

        // If eventType is specified, find and select it
        if (eventType && data.appointmentTypes) {
          const type = data.appointmentTypes.find(
            (t: AppointmentType) => t.id === eventType || t.name.toLowerCase().replace(/\s+/g, '-') === eventType
          );
          if (type) {
            setSelectedType(type);
            setStep('datetime');
          }
        }
      } catch (err) {
        setError('This booking page could not be found.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [username, eventType, fetchPublicProfile]);

  // Load available slots when date changes
  useEffect(() => {
    const loadSlots = async () => {
      if (!selectedDate || !selectedType || !username) return;

      setLoadingSlots(true);
      try {
        const dateStr = selectedDate.toISOString().split('T')[0];
        const slots = await fetchAvailableSlots(username, selectedType.id, dateStr);
        setAvailableSlots(slots);
      } catch (err) {
        console.error('Failed to load slots:', err);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    loadSlots();
  }, [selectedDate, selectedType, username, fetchAvailableSlots]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Padding for days before the first
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }

    // Actual days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }

    return days;
  }, [currentMonth]);

  const isDateSelectable = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  };

  const handleSelectType = (type: AppointmentType) => {
    setSelectedType(type);
    setStep('datetime');
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleSelectTime = (time: string) => {
    setSelectedTime(time);
    setStep('form');
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !selectedType || !username) return;

    setIsSubmitting(true);
    try {
      const startTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':').map(Number);
      startTime.setHours(hours, minutes, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + selectedType.durationMinutes);

      const booking = await createBooking(username!, {
        typeId: selectedType.id,
        date: selectedDate!.toISOString().split('T')[0],
        startTime: selectedTime,
        inviteeName: formData.name,
        inviteeEmail: formData.email,
        notes: formData.notes || undefined,
        customFieldResponses: Object.keys(formData.responses).length > 0 ? formData.responses : undefined,
      });

      setBookingId(booking.id);
      setStep('confirmed');
    } catch (err) {
      console.error('Failed to create booking:', err);
      setError('Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
  };

  const getLocationIcon = (locationType: string) => {
    switch (locationType) {
      case 'video': return Video;
      case 'phone': return Phone;
      case 'in_person': return MapPin;
      default: return Globe;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-gray-400">Loading booking page...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-center p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-white mb-2">Page Not Found</h1>
          <p className="text-gray-400">{error || 'This booking page does not exist.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mx-auto mb-4 flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
          <p className="text-gray-400 text-sm mt-1">
            <Clock className="w-4 h-4 inline mr-1" />
            {profile.timezone}
          </p>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {/* Step 1: Select Event Type */}
            {step === 'type' && (
              <motion.div
                key="type"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-6"
              >
                <h2 className="text-lg font-semibold text-white mb-4">Select a Meeting Type</h2>
                <div className="space-y-3">
                  {profile.appointmentTypes.map((type) => {
                    const LocationIcon = getLocationIcon(type.locationType);
                    return (
                      <button
                        key={type.id}
                        onClick={() => handleSelectType(type)}
                        className={cn(
                          'w-full p-4 rounded-xl border text-left transition-all',
                          'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className="w-1.5 h-full rounded-full self-stretch"
                            style={{ backgroundColor: type.color }}
                          />
                          <div className="flex-1">
                            <h3 className="text-white font-medium">{type.name}</h3>
                            {type.description && (
                              <p className="text-gray-400 text-sm mt-1">{type.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {type.durationMinutes} min
                              </span>
                              <span className="flex items-center gap-1">
                                <LocationIcon className="w-4 h-4" />
                                {type.locationType === 'video' && type.videoProvider
                                  ? type.videoProvider.replace('_', ' ')
                                  : type.locationType.replace('_', ' ')}
                              </span>
                              {type.price && (
                                <span>
                                  {type.currency === 'USD' ? '$' : type.currency}
                                  {type.price}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 2: Select Date & Time */}
            {step === 'datetime' && selectedType && (
              <motion.div
                key="datetime"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col md:flex-row"
              >
                {/* Calendar */}
                <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-white/10">
                  <button
                    onClick={() => {
                      setSelectedType(null);
                      setStep('type');
                    }}
                    className="flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-4"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>

                  <div className="mb-4">
                    <h3 className="text-white font-medium">{selectedType.name}</h3>
                    <p className="text-gray-400 text-sm">{selectedType.durationMinutes} minutes</p>
                  </div>

                  {/* Month Navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                      className="p-1 hover:bg-white/10 rounded"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-400" />
                    </button>
                    <span className="text-white font-medium">
                      {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                      className="p-1 hover:bg-white/10 rounded"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                      <div key={day} className="text-xs text-gray-500 py-2">
                        {day}
                      </div>
                    ))}
                    {calendarDays.map((date, i) => {
                      if (!date) {
                        return <div key={`empty-${i}`} />;
                      }

                      const isSelectable = isDateSelectable(date);
                      const isSelected = selectedDate?.toDateString() === date.toDateString();
                      const isToday = new Date().toDateString() === date.toDateString();

                      return (
                        <button
                          key={date.toISOString()}
                          onClick={() => isSelectable && handleSelectDate(date)}
                          disabled={!isSelectable}
                          className={cn(
                            'p-2 text-sm rounded-lg transition-colors',
                            isSelected
                              ? 'bg-blue-500 text-white'
                              : isToday
                              ? 'bg-white/10 text-white'
                              : isSelectable
                              ? 'text-white hover:bg-white/10'
                              : 'text-gray-600 cursor-not-allowed'
                          )}
                        >
                          {date.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Slots */}
                <div className="w-full md:w-64 p-6">
                  <h3 className="text-white font-medium mb-4">
                    {selectedDate ? formatDate(selectedDate) : 'Select a date'}
                  </h3>

                  {!selectedDate ? (
                    <p className="text-gray-500 text-sm">Please select a date to see available times.</p>
                  ) : loadingSlots ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <p className="text-gray-500 text-sm">No available times on this date.</p>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {availableSlots
                        .filter((slot) => slot.available)
                        .map((slot) => (
                          <button
                            key={slot.time}
                            onClick={() => handleSelectTime(slot.time)}
                            className={cn(
                              'w-full px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors',
                              'border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white'
                            )}
                          >
                            {formatTime(slot.time)}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 3: Booking Form */}
            {step === 'form' && selectedType && selectedDate && selectedTime && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-6"
              >
                <button
                  onClick={() => setStep('datetime')}
                  className="flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-4"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>

                {/* Summary */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-6">
                  <h3 className="text-white font-medium">{selectedType.name}</h3>
                  <p className="text-gray-400 text-sm mt-1">
                    {formatDate(selectedDate)} at {formatTime(selectedTime)}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {selectedType.durationMinutes} minutes • {profile.timezone}
                  </p>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Your Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Doe"
                        required
                        className={cn(
                          'w-full pl-10 pr-4 py-2.5 rounded-lg text-sm',
                          'bg-white/5 border border-white/10',
                          'text-white placeholder:text-gray-500',
                          'focus:outline-none focus:ring-2 focus:ring-blue-500/50'
                        )}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="you@example.com"
                        required
                        className={cn(
                          'w-full pl-10 pr-4 py-2.5 rounded-lg text-sm',
                          'bg-white/5 border border-white/10',
                          'text-white placeholder:text-gray-500',
                          'focus:outline-none focus:ring-2 focus:ring-blue-500/50'
                        )}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Additional Notes
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Any additional information..."
                        rows={3}
                        className={cn(
                          'w-full pl-10 pr-4 py-2.5 rounded-lg text-sm',
                          'bg-white/5 border border-white/10',
                          'text-white placeholder:text-gray-500',
                          'focus:outline-none focus:ring-2 focus:ring-blue-500/50',
                          'resize-none'
                        )}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={!formData.name || !formData.email || isSubmitting}
                    className={cn(
                      'w-full py-3 rounded-lg font-medium transition-all',
                      'bg-blue-500 text-white hover:bg-blue-600',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Scheduling...
                      </span>
                    ) : (
                      'Schedule Meeting'
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Confirmation */}
            {step === 'confirmed' && selectedType && selectedDate && selectedTime && (
              <motion.div
                key="confirmed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-green-500/20 mx-auto mb-4 flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Booking Confirmed!</h2>
                <p className="text-gray-400 mb-6">
                  A confirmation email has been sent to {formData.email}
                </p>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-left max-w-sm mx-auto">
                  <h3 className="text-white font-medium">{selectedType.name}</h3>
                  <p className="text-gray-400 text-sm mt-1">
                    {formatDate(selectedDate)} at {formatTime(selectedTime)}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {selectedType.durationMinutes} minutes
                  </p>
                </div>

                <button
                  onClick={() => {
                    setStep('type');
                    setSelectedType(null);
                    setSelectedDate(null);
                    setSelectedTime(null);
                    setFormData({ name: '', email: '', notes: '', responses: {} });
                  }}
                  className="mt-6 px-6 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  Book Another Meeting
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-sm mt-8">
          Powered by <span className="text-gray-400">iBird</span>
        </p>
      </div>
    </div>
  );
}
