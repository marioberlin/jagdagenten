/**
 * IBird Sidebar Component
 *
 * Context-aware sidebar that changes based on active module:
 * - Mail: Account selector, folder list, labels
 * - Calendar: Calendar list, mini calendar
 * - Appointments: Appointment types, quick actions
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Inbox,
  Send,
  FileText,
  Trash2,
  Archive,
  Star,
  Tag,
  Plus,
  ChevronDown,
  ChevronRight,
  Calendar,
  Clock,
  Users,
  Settings,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useIBirdStore, useAccountFolders, useAccountLabels } from '@/stores/ibirdStore';
import type { MailFolder, Calendar as CalendarType, AppointmentType, FolderType } from '@/stores/ibirdStore';
import { cn } from '@/lib/utils';

// =============================================================================
// Folder Icons
// =============================================================================

const folderIcons: Record<FolderType, typeof Inbox> = {
  inbox: Inbox,
  sent: Send,
  drafts: FileText,
  trash: Trash2,
  spam: Archive,
  archive: Archive,
  custom: Tag,
};

// =============================================================================
// Mail Sidebar
// =============================================================================

function MailSidebar() {
  const {
    accounts,
    ui,
    openCompose,
    setActiveAccount,
    setActiveFolder,
  } = useIBirdStore();

  const activeAccount = accounts.find((a) => a.id === ui.activeAccountId);
  const folders = useAccountFolders(ui.activeAccountId || '');
  const labels = useAccountLabels(ui.activeAccountId || '');

  // Group folders by type
  const systemFolders = useMemo(() => {
    return folders.filter((f) => f.folderType !== 'custom');
  }, [folders]);

  const customFolders = useMemo(() => {
    return folders.filter((f) => f.folderType === 'custom');
  }, [folders]);

  return (
    <div className="h-full flex flex-col">
      {/* Compose Button */}
      <div className="p-3">
        <button
          onClick={() => openCompose('new')}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl',
            'bg-[var(--glass-accent)] text-white font-medium',
            'hover:bg-[var(--glass-accent-hover)] transition-colors duration-150',
            'shadow-lg shadow-[var(--glass-accent)]/25'
          )}
        >
          <Plus className="w-4 h-4" />
          <span>Compose</span>
        </button>
      </div>

      {/* Account Selector */}
      {accounts.length > 1 && (
        <div className="px-3 pb-2">
          <select
            value={ui.activeAccountId || ''}
            onChange={(e) => setActiveAccount(e.target.value)}
            className={cn(
              'w-full px-3 py-2 rounded-lg',
              'bg-[var(--glass-surface)] text-[var(--glass-text-primary)]',
              'border border-[var(--glass-border)]',
              'text-sm focus:outline-none focus:ring-2 focus:ring-[var(--glass-accent)]'
            )}
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.displayName || account.email}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Folders */}
      <div className="flex-1 overflow-y-auto px-2">
        {/* System Folders */}
        <div className="space-y-0.5">
          {systemFolders.map((folder) => {
            const Icon = folderIcons[folder.folderType] || Tag;
            const isActive = ui.activeFolderId === folder.id;
            return (
              <button
                key={folder.id}
                onClick={() => setActiveFolder(folder.id, folder.folderType)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-150',
                  isActive
                    ? 'bg-[var(--glass-accent)]/10 text-[var(--glass-accent)]'
                    : 'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)] hover:bg-[var(--glass-surface-hover)]'
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left text-sm truncate">{folder.name}</span>
                {folder.unreadCount > 0 && (
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded-full text-xs font-medium',
                      isActive
                        ? 'bg-[var(--glass-accent)] text-white'
                        : 'bg-[var(--glass-surface-hover)] text-[var(--glass-text-secondary)]'
                    )}
                  >
                    {folder.unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Custom Folders */}
        {customFolders.length > 0 && (
          <div className="mt-4">
            <div className="px-3 py-1.5 text-xs font-semibold text-[var(--glass-text-tertiary)] uppercase tracking-wider">
              Folders
            </div>
            <div className="space-y-0.5">
              {customFolders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setActiveFolder(folder.id, folder.folderType)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-150',
                    ui.activeFolderId === folder.id
                      ? 'bg-[var(--glass-accent)]/10 text-[var(--glass-accent)]'
                      : 'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)] hover:bg-[var(--glass-surface-hover)]'
                  )}
                >
                  <Tag className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-left text-sm truncate">{folder.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Labels */}
        {labels.length > 0 && (
          <div className="mt-4">
            <div className="px-3 py-1.5 text-xs font-semibold text-[var(--glass-text-tertiary)] uppercase tracking-wider">
              Labels
            </div>
            <div className="space-y-0.5">
              {labels.map((label) => (
                <button
                  key={label.id}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-150',
                    'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)] hover:bg-[var(--glass-surface-hover)]'
                  )}
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: label.color }}
                  />
                  <span className="flex-1 text-left text-sm truncate">{label.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Calendar Sidebar
// =============================================================================

function CalendarSidebar() {
  const {
    calendars,
    ui,
    toggleCalendarVisibility,
    openEventEditor,
    setCalendarViewDate,
  } = useIBirdStore();

  // Generate mini calendar dates
  const miniCalendarDates = useMemo(() => {
    const viewDate = new Date(ui.calendarViewDate);
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();

    const dates: Array<{ date: Date; isCurrentMonth: boolean; isToday: boolean }> = [];

    // Previous month days
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      dates.push({ date: d, isCurrentMonth: false, isToday: false });
    }

    // Current month days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      dates.push({
        date: d,
        isCurrentMonth: true,
        isToday: d.getTime() === today.getTime(),
      });
    }

    // Next month days
    const remaining = 42 - dates.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      dates.push({ date: d, isCurrentMonth: false, isToday: false });
    }

    return dates;
  }, [ui.calendarViewDate]);

  const monthYear = useMemo(() => {
    const d = new Date(ui.calendarViewDate);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [ui.calendarViewDate]);

  return (
    <div className="h-full flex flex-col">
      {/* Create Event Button */}
      <div className="p-3">
        <button
          onClick={() => openEventEditor()}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl',
            'bg-[var(--glass-accent)] text-white font-medium',
            'hover:bg-[var(--glass-accent-hover)] transition-colors duration-150',
            'shadow-lg shadow-[var(--glass-accent)]/25'
          )}
        >
          <Plus className="w-4 h-4" />
          <span>New Event</span>
        </button>
      </div>

      {/* Mini Calendar */}
      <div className="px-3 pb-4">
        <div className="bg-[var(--glass-surface)] rounded-xl p-3 border border-[var(--glass-border)]">
          <div className="text-center text-sm font-medium text-[var(--glass-text-primary)] mb-2">
            {monthYear}
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div
                key={i}
                className="text-[10px] font-medium text-[var(--glass-text-tertiary)] py-1"
              >
                {day}
              </div>
            ))}
            {miniCalendarDates.map(({ date, isCurrentMonth, isToday }, i) => (
              <button
                key={i}
                onClick={() => setCalendarViewDate(date.toISOString().split('T')[0])}
                className={cn(
                  'w-6 h-6 rounded-full text-[11px] transition-colors duration-150',
                  isToday && 'bg-[var(--glass-accent)] text-white',
                  !isToday && isCurrentMonth && 'text-[var(--glass-text-primary)] hover:bg-[var(--glass-surface-hover)]',
                  !isToday && !isCurrentMonth && 'text-[var(--glass-text-tertiary)] hover:bg-[var(--glass-surface-hover)]'
                )}
              >
                {date.getDate()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar List */}
      <div className="flex-1 overflow-y-auto px-2">
        <div className="px-3 py-1.5 text-xs font-semibold text-[var(--glass-text-tertiary)] uppercase tracking-wider">
          Calendars
        </div>
        <div className="space-y-0.5">
          {calendars.map((calendar) => (
            <button
              key={calendar.id}
              onClick={() => toggleCalendarVisibility(calendar.id)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-150',
                'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)] hover:bg-[var(--glass-surface-hover)]'
              )}
            >
              <div
                className={cn(
                  'w-4 h-4 rounded flex items-center justify-center border-2',
                  calendar.isVisible ? 'border-transparent' : 'border-current'
                )}
                style={{ backgroundColor: calendar.isVisible ? calendar.color : 'transparent' }}
              >
                {calendar.isVisible && (
                  <Eye className="w-2.5 h-2.5 text-white" />
                )}
              </div>
              <span className="flex-1 text-left text-sm truncate">{calendar.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Appointments Sidebar
// =============================================================================

function AppointmentsSidebar() {
  const {
    appointmentTypes,
    ui,
    selectAppointmentType,
    openAppointmentTypeEditor,
    openAvailabilityEditor,
  } = useIBirdStore();

  const activeTypes = appointmentTypes.filter((t) => t.isActive);
  const inactiveTypes = appointmentTypes.filter((t) => !t.isActive);

  return (
    <div className="h-full flex flex-col">
      {/* Create Type Button */}
      <div className="p-3">
        <button
          onClick={() => openAppointmentTypeEditor()}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl',
            'bg-[var(--glass-accent)] text-white font-medium',
            'hover:bg-[var(--glass-accent-hover)] transition-colors duration-150',
            'shadow-lg shadow-[var(--glass-accent)]/25'
          )}
        >
          <Plus className="w-4 h-4" />
          <span>New Event Type</span>
        </button>
      </div>

      {/* Quick Actions */}
      <div className="px-3 pb-3">
        <button
          onClick={() => openAvailabilityEditor()}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 rounded-lg',
            'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]',
            'hover:bg-[var(--glass-surface-hover)] transition-colors duration-150'
          )}
        >
          <Clock className="w-4 h-4" />
          <span className="text-sm">Availability</span>
        </button>
      </div>

      {/* Appointment Types */}
      <div className="flex-1 overflow-y-auto px-2">
        {/* Active Types */}
        <div className="px-3 py-1.5 text-xs font-semibold text-[var(--glass-text-tertiary)] uppercase tracking-wider">
          Event Types
        </div>
        <div className="space-y-0.5">
          {activeTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => selectAppointmentType(type.id)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-150',
                ui.selectedAppointmentTypeId === type.id
                  ? 'bg-[var(--glass-accent)]/10 text-[var(--glass-accent)]'
                  : 'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)] hover:bg-[var(--glass-surface-hover)]'
              )}
            >
              <div
                className="w-3 h-3 rounded flex-shrink-0"
                style={{ backgroundColor: type.color }}
              />
              <span className="flex-1 text-left text-sm truncate">{type.name}</span>
              <span className="text-xs text-[var(--glass-text-tertiary)]">
                {type.durationMinutes}m
              </span>
            </button>
          ))}
        </div>

        {/* Inactive Types */}
        {inactiveTypes.length > 0 && (
          <div className="mt-4">
            <div className="px-3 py-1.5 text-xs font-semibold text-[var(--glass-text-tertiary)] uppercase tracking-wider">
              Inactive
            </div>
            <div className="space-y-0.5">
              {inactiveTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => selectAppointmentType(type.id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-150 opacity-60',
                    'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)] hover:bg-[var(--glass-surface-hover)]'
                  )}
                >
                  <div
                    className="w-3 h-3 rounded flex-shrink-0"
                    style={{ backgroundColor: type.color }}
                  />
                  <span className="flex-1 text-left text-sm truncate">{type.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Main Sidebar Component
// =============================================================================

export function IBirdSidebar() {
  const { ui } = useIBirdStore();

  return (
    <div className="h-full bg-[var(--glass-surface)]/50">
      {ui.activeModule === 'mail' && <MailSidebar />}
      {ui.activeModule === 'calendar' && <CalendarSidebar />}
      {ui.activeModule === 'appointments' && <AppointmentsSidebar />}
    </div>
  );
}
