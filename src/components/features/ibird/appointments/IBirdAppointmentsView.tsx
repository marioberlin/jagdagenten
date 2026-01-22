/**
 * IBird Appointments View Component
 *
 * Appointment scheduling management interface.
 */

import { useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  MapPin,
  Video,
  Phone,
  Link as LinkIcon,
  Copy,
  ExternalLink,
  Check,
  X,
  Calendar,
  User,
  MoreHorizontal,
} from 'lucide-react';
import { useIBirdStore, useUpcomingBookings, useActiveAppointmentTypes } from '@/stores/ibirdStore';
import type { Booking, AppointmentType } from '@/stores/ibirdStore';
import { useAppointmentsApi } from '../hooks/useIBirdApi';
import { cn } from '@/lib/utils';

// =============================================================================
// Booking Card
// =============================================================================

interface BookingCardProps {
  booking: Booking;
  onConfirm?: () => void;
  onCancel?: () => void;
}

function BookingCard({ booking, onConfirm, onCancel }: BookingCardProps) {
  const date = new Date(`${booking.scheduledDate}T${booking.startTime}`);

  const statusColors: Record<Booking['status'], string> = {
    pending: 'bg-yellow-500/10 text-yellow-600',
    confirmed: 'bg-green-500/10 text-green-600',
    cancelled: 'bg-red-500/10 text-red-600',
    completed: 'bg-blue-500/10 text-blue-600',
    no_show: 'bg-gray-500/10 text-gray-600',
  };

  const locationIcons = {
    in_person: MapPin,
    phone: Phone,
    video: Video,
    custom: LinkIcon,
  };

  const LocationIcon = booking.locationType ? locationIcons[booking.locationType] : MapPin;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'p-4 rounded-xl',
        'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
        'hover:border-[var(--glass-accent)]/30 transition-colors duration-150'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-[var(--glass-text-primary)]">
            {booking.appointmentType?.name || 'Appointment'}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-sm text-[var(--glass-text-secondary)]">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            <span className="text-[var(--glass-text-tertiary)]">at</span>
            <span>
              {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </span>
          </div>
        </div>
        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', statusColors[booking.status])}>
          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
        </span>
      </div>

      {/* Invitee Info */}
      <div className="flex items-center gap-3 p-2 rounded-lg bg-[var(--glass-bg)] mb-3">
        <div className="w-8 h-8 rounded-full bg-[var(--glass-accent)] flex items-center justify-center text-white text-sm font-medium">
          {booking.inviteeName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-[var(--glass-text-primary)] truncate">
            {booking.inviteeName}
          </div>
          <div className="text-xs text-[var(--glass-text-secondary)] truncate">
            {booking.inviteeEmail}
          </div>
        </div>
      </div>

      {/* Location */}
      {booking.locationType && (
        <div className="flex items-center gap-2 text-sm text-[var(--glass-text-secondary)] mb-3">
          <LocationIcon className="w-4 h-4" />
          <span>
            {booking.locationType === 'in_person' && (booking.locationDetails || 'In person')}
            {booking.locationType === 'phone' && (booking.locationDetails || 'Phone call')}
            {booking.locationType === 'video' && (booking.locationDetails || 'Video call')}
            {booking.locationType === 'custom' && (booking.locationDetails || 'Custom location')}
          </span>
        </div>
      )}

      {/* Notes */}
      {booking.notes && (
        <div className="text-sm text-[var(--glass-text-tertiary)] mb-3 italic">
          "{booking.notes}"
        </div>
      )}

      {/* Actions */}
      {booking.status === 'pending' && (
        <div className="flex items-center gap-2 pt-3 border-t border-[var(--glass-border)]">
          <button
            onClick={onConfirm}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg',
              'bg-green-500/10 text-green-600 font-medium',
              'hover:bg-green-500/20 transition-colors duration-150'
            )}
          >
            <Check className="w-4 h-4" />
            <span>Confirm</span>
          </button>
          <button
            onClick={onCancel}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg',
              'bg-red-500/10 text-red-600 font-medium',
              'hover:bg-red-500/20 transition-colors duration-150'
            )}
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
        </div>
      )}
    </motion.div>
  );
}

// =============================================================================
// Appointment Type Card
// =============================================================================

interface AppointmentTypeCardProps {
  type: AppointmentType;
  onSelect: () => void;
}

function AppointmentTypeCard({ type, onSelect }: AppointmentTypeCardProps) {
  const { settings } = useIBirdStore();
  const [copied, setCopied] = useState(false);

  const bookingUrl = settings.appointmentsBookingPageUsername
    ? `${window.location.origin}/book/${settings.appointmentsBookingPageUsername}/${type.slug}`
    : null;

  const handleCopyLink = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (bookingUrl) {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [bookingUrl]);

  const locationLabels = {
    in_person: 'In Person',
    phone: 'Phone Call',
    video: 'Video Call',
    custom: 'Custom',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={onSelect}
      className={cn(
        'p-4 rounded-xl cursor-pointer',
        'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
        'hover:border-[var(--glass-accent)]/30 hover:bg-[var(--glass-surface-hover)]',
        'transition-all duration-150'
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-3 h-full rounded-full min-h-[40px]"
          style={{ backgroundColor: type.color }}
        />
        <div className="flex-1">
          <h3 className="font-semibold text-[var(--glass-text-primary)]">
            {type.name}
          </h3>
          {type.description && (
            <p className="text-sm text-[var(--glass-text-secondary)] mt-1 line-clamp-2">
              {type.description}
            </p>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="flex items-center gap-4 text-sm text-[var(--glass-text-secondary)]">
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>{type.durationMinutes} min</span>
        </div>
        <div className="flex items-center gap-1">
          {type.locationType === 'video' && <Video className="w-3.5 h-3.5" />}
          {type.locationType === 'phone' && <Phone className="w-3.5 h-3.5" />}
          {type.locationType === 'in_person' && <MapPin className="w-3.5 h-3.5" />}
          {type.locationType === 'custom' && <LinkIcon className="w-3.5 h-3.5" />}
          <span>{locationLabels[type.locationType]}</span>
        </div>
      </div>

      {/* Copy Link Button */}
      {bookingUrl && (
        <div className="mt-3 pt-3 border-t border-[var(--glass-border)]">
          <button
            onClick={handleCopyLink}
            className={cn(
              'flex items-center gap-2 text-sm',
              copied ? 'text-green-600' : 'text-[var(--glass-accent)] hover:text-[var(--glass-accent-hover)]'
            )}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy booking link</span>
              </>
            )}
          </button>
        </div>
      )}
    </motion.div>
  );
}

// Need to import useState
import { useState } from 'react';

// =============================================================================
// Main Component
// =============================================================================

export function IBirdAppointmentsView() {
  const { settings, ui, selectAppointmentType, openAppointmentTypeEditor } = useIBirdStore();
  const upcomingBookings = useUpcomingBookings();
  const appointmentTypes = useActiveAppointmentTypes();
  const { fetchBookings, confirmBooking, cancelBooking } = useAppointmentsApi();

  // Load bookings on mount
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Handle confirm/cancel
  const handleConfirm = useCallback(async (bookingId: string) => {
    await confirmBooking(bookingId);
  }, [confirmBooking]);

  const handleCancel = useCallback(async (bookingId: string) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      await cancelBooking(bookingId);
    }
  }, [cancelBooking]);

  // Booking page link
  const bookingPageUrl = settings.appointmentsBookingPageUsername
    ? `${window.location.origin}/book/${settings.appointmentsBookingPageUsername}`
    : null;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-[var(--glass-border)]">
        {bookingPageUrl && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-border)]">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-[var(--glass-text-primary)]">
                Your booking page
              </div>
              <div className="text-sm text-[var(--glass-accent)] truncate">
                {bookingPageUrl}
              </div>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(bookingPageUrl)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg',
                'bg-[var(--glass-bg)] text-[var(--glass-text-secondary)]',
                'hover:text-[var(--glass-text-primary)] transition-colors duration-150'
              )}
            >
              <Copy className="w-4 h-4" />
              <span className="text-sm">Copy</span>
            </button>
            <a
              href={bookingPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg',
                'bg-[var(--glass-accent)] text-white',
                'hover:bg-[var(--glass-accent-hover)] transition-colors duration-150'
              )}
            >
              <ExternalLink className="w-4 h-4" />
              <span className="text-sm">Preview</span>
            </a>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Upcoming Bookings */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-[var(--glass-text-primary)] mb-4">
            Upcoming Bookings
          </h2>
          {upcomingBookings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onConfirm={() => handleConfirm(booking.id)}
                  onCancel={() => handleCancel(booking.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[var(--glass-text-secondary)]">
              No upcoming bookings. Share your booking link to get started!
            </div>
          )}
        </div>

        {/* Event Types */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--glass-text-primary)]">
              Event Types
            </h2>
            <button
              onClick={() => openAppointmentTypeEditor()}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm',
                'bg-[var(--glass-accent)] text-white font-medium',
                'hover:bg-[var(--glass-accent-hover)] transition-colors duration-150'
              )}
            >
              Create Event Type
            </button>
          </div>
          {appointmentTypes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {appointmentTypes.map((type) => (
                <AppointmentTypeCard
                  key={type.id}
                  type={type}
                  onSelect={() => selectAppointmentType(type.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[var(--glass-text-secondary)]">
              Create your first event type to start accepting bookings.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
