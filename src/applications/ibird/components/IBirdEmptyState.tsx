/**
 * IBird Empty State Component
 *
 * Displays contextual empty states for various scenarios.
 */

import { Mail, Calendar, Clock, Plus, Settings, FolderOpen, Search } from 'lucide-react';
import { useIBirdStore } from '../store';
import { cn } from '@/lib/utils';

type EmptyStateType =
  | 'no-accounts'
  | 'no-messages'
  | 'no-events'
  | 'no-bookings'
  | 'no-appointment-types'
  | 'no-selection'
  | 'no-search-results'
  | 'select-module';

interface IBirdEmptyStateProps {
  type: EmptyStateType;
  searchQuery?: string;
}

const emptyStateConfig: Record<EmptyStateType, {
  icon: typeof Mail;
  title: string;
  description: string;
  actionLabel?: string;
  actionKey?: string;
}> = {
  'no-accounts': {
    icon: Mail,
    title: 'Welcome to iBird',
    description: 'Connect your email account to get started with your inbox, calendar, and appointments.',
    actionLabel: 'Add Account',
    actionKey: 'add-account',
  },
  'no-messages': {
    icon: FolderOpen,
    title: 'No messages',
    description: 'This folder is empty. Messages will appear here when you receive them.',
  },
  'no-events': {
    icon: Calendar,
    title: 'No events',
    description: 'You don\'t have any events scheduled. Create one to get started.',
    actionLabel: 'Create Event',
    actionKey: 'create-event',
  },
  'no-bookings': {
    icon: Clock,
    title: 'No bookings',
    description: 'You don\'t have any bookings yet. Share your booking link to receive appointments.',
    actionLabel: 'Copy Booking Link',
    actionKey: 'copy-link',
  },
  'no-appointment-types': {
    icon: Clock,
    title: 'No event types',
    description: 'Create an event type to let people book time with you.',
    actionLabel: 'Create Event Type',
    actionKey: 'create-type',
  },
  'no-selection': {
    icon: Mail,
    title: 'Select an item',
    description: 'Choose an item from the list to view its details.',
  },
  'no-search-results': {
    icon: Search,
    title: 'No results found',
    description: 'Try adjusting your search terms or filters.',
  },
  'select-module': {
    icon: Settings,
    title: 'Select a module',
    description: 'Choose Mail, Calendar, or Appointments from the tabs above.',
  },
};

export function IBirdEmptyState({ type, searchQuery }: IBirdEmptyStateProps) {
  const { openCompose: _openCompose, openEventEditor, openAppointmentTypeEditor, openModal } = useIBirdStore();

  const config = emptyStateConfig[type];
  const Icon = config.icon;

  const handleAction = () => {
    switch (config.actionKey) {
      case 'add-account':
        openModal('add-account');
        break;
      case 'create-event':
        openEventEditor();
        break;
      case 'create-type':
        openAppointmentTypeEditor();
        break;
      case 'copy-link': {
        // Copy booking link functionality
        const settings = useIBirdStore.getState().settings;
        if (settings.appointmentsBookingPageUsername) {
          navigator.clipboard.writeText(`${window.location.origin}/book/${settings.appointmentsBookingPageUsername}`);
        }
        break;
      }
    }
  };

  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="text-center max-w-sm">
        {/* Icon with Gradient Background */}
        <div
          className={cn(
            'w-16 h-16 mx-auto mb-4 rounded-2xl',
            'bg-gradient-to-br from-purple-500/20 to-blue-500/20',
            'border border-[var(--glass-border)]',
            'flex items-center justify-center',
            'shadow-lg shadow-purple-500/10'
          )}
        >
          <Icon className="w-8 h-8 text-[var(--glass-accent)]" />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-[var(--glass-text-primary)] mb-2">
          {config.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-[var(--glass-text-secondary)] mb-4">
          {type === 'no-search-results' && searchQuery
            ? `No results for "${searchQuery}". Try adjusting your search.`
            : config.description}
        </p>

        {/* Action Button */}
        {config.actionLabel && (
          <button
            onClick={handleAction}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl',
              'bg-[var(--glass-accent)] text-white font-medium',
              'hover:bg-[var(--glass-accent-hover)] transition-all duration-150',
              'shadow-lg shadow-[var(--glass-accent)]/25'
            )}
          >
            <Plus className="w-4 h-4" />
            <span>{config.actionLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
}
