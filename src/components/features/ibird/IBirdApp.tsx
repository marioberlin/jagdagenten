/**
 * IBirdApp - Main Email, Calendar & Appointments Client
 *
 * A comprehensive productivity app with:
 * - Email management (IMAP/SMTP)
 * - Calendar with multi-source sync
 * - Appointment scheduling (Calendly-like)
 *
 * Built with Liquid Glass design system.
 */

import { useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Calendar, Clock, X, Settings, RefreshCw } from 'lucide-react';
import { useIBirdStore, type IBirdModule } from '@/stores/ibirdStore';
import { useDesktopStore } from '@/stores/desktopStore';
import { IBirdSidebar } from './IBirdSidebar';
import { IBirdMailView } from './mail/IBirdMailView';
import { IBirdCalendarView } from './calendar/IBirdCalendarView';
import { IBirdAppointmentsView } from './appointments/IBirdAppointmentsView';
import { IBirdEmptyState } from './IBirdEmptyState';
import { IBirdComposeModal } from './mail/IBirdComposeModal';
import { IBirdModals } from './IBirdModals';
import { IBirdEventEditor, IBirdAppointmentTypeEditor, IBirdAvailabilityEditor } from './editors';
import { useIBirdMenuBar } from './hooks/useIBirdMenuBar';
import { useIBirdShortcuts } from './hooks/useIBirdShortcuts';
import { useSettingsApi, useMailApi, useCalendarApi, useAppointmentsApi } from './hooks/useIBirdApi';
import { cn } from '@/lib/utils';

// =============================================================================
// Module Icons
// =============================================================================

const moduleIcons: Record<IBirdModule, typeof Mail> = {
  mail: Mail,
  calendar: Calendar,
  appointments: Clock,
};

const moduleLabels: Record<IBirdModule, string> = {
  mail: 'Mail',
  calendar: 'Calendar',
  appointments: 'Appointments',
};

// =============================================================================
// Component
// =============================================================================

export function IBirdApp() {
  const { closePanel } = useDesktopStore();
  const {
    accounts,
    ui,
    settings,
    setActiveModule,
    toggleSidebar,
  } = useIBirdStore();

  const { fetchSettings } = useSettingsApi();
  const { fetchAccounts, fetchFolders } = useMailApi();
  const { fetchCalendars, fetchEvents } = useCalendarApi();
  const { fetchAppointmentTypes, fetchAvailabilitySchedules, fetchBookings } = useAppointmentsApi();

  // Register menu bar items
  useIBirdMenuBar();

  // Register keyboard shortcuts
  useIBirdShortcuts();

  // Initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load settings first
        await fetchSettings();

        // Load data for all modules
        await Promise.all([
          fetchAccounts(),
          fetchCalendars(),
          fetchAppointmentTypes(),
          fetchAvailabilitySchedules(),
          fetchBookings(),
        ]);

        // After accounts are loaded, fetch folders for each
        const state = useIBirdStore.getState();
        for (const account of state.accounts) {
          await fetchFolders(account.id);
        }

        // Fetch events for the current month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        await fetchEvents({
          start: startOfMonth.toISOString(),
          end: endOfMonth.toISOString(),
        });
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    };

    loadInitialData();
  }, [fetchSettings, fetchAccounts, fetchFolders, fetchCalendars, fetchEvents, fetchAppointmentTypes, fetchAvailabilitySchedules, fetchBookings]);

  // Handle escape key to close panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !ui.activeModal && !ui.composeWindows?.length) {
        closePanel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closePanel, ui.activeModal, ui.composeWindows?.length]);

  // Module switcher
  const handleModuleSwitch = useCallback((module: IBirdModule) => {
    setActiveModule(module);
  }, [setActiveModule]);

  // Render the active module view
  const renderModuleView = useMemo(() => {
    switch (ui.activeModule) {
      case 'mail':
        return <IBirdMailView />;
      case 'calendar':
        return <IBirdCalendarView />;
      case 'appointments':
        return <IBirdAppointmentsView />;
      default:
        return <IBirdEmptyState type="select-module" />;
    }
  }, [ui.activeModule]);

  // Determine if we should show setup state
  const showSetup = ui.activeModule === 'mail' && accounts.length === 0;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Glass Background */}
      <div className="absolute inset-0 bg-[var(--glass-bg)] backdrop-blur-2xl" />

      {/* Header Bar with Module Tabs */}
      <div className="relative h-12 flex items-center px-4 border-b border-[var(--glass-border)] bg-[var(--glass-surface)]">
        {/* App Title */}
        <div className="flex items-center gap-2 mr-6">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Mail className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-[var(--glass-text-primary)]">iBird</span>
        </div>

        {/* Module Tabs */}
        <div className="flex items-center gap-1">
          {(['mail', 'calendar', 'appointments'] as IBirdModule[]).map((module) => {
            const Icon = moduleIcons[module];
            const isActive = ui.activeModule === module;
            return (
              <button
                key={module}
                onClick={() => handleModuleSwitch(module)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-150',
                  isActive
                    ? 'bg-[var(--glass-accent)] text-white'
                    : 'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)] hover:bg-[var(--glass-surface-hover)]'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{moduleLabels[module]}</span>
              </button>
            );
          })}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Sync indicator */}
          {ui.isSyncing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--glass-surface-hover)]"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[var(--glass-accent)] animate-spin" />
              <span className="text-xs text-[var(--glass-text-secondary)]">Syncing</span>
            </motion.div>
          )}

          {/* Settings */}
          <button
            onClick={() => useIBirdStore.getState().openModal('settings')}
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center',
              'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]',
              'hover:bg-[var(--glass-surface-hover)] transition-colors duration-150'
            )}
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Close */}
          <button
            onClick={() => closePanel()}
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center',
              'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]',
              'hover:bg-[var(--glass-surface-hover)] transition-colors duration-150'
            )}
            aria-label="Close iBird"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <AnimatePresence mode="wait">
          {!ui.sidebarCollapsed && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: ui.sidebarWidth, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0 border-r border-[var(--glass-border)]"
            >
              <IBirdSidebar />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {showSetup ? (
            <IBirdEmptyState type="no-accounts" />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={ui.activeModule}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.15 }}
                className="flex-1 overflow-hidden"
              >
                {renderModuleView}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Compose Windows (Mail) */}
      <AnimatePresence>
        {(ui.composeWindows ?? []).map((compose) => (
          <IBirdComposeModal key={compose.id} compose={compose} />
        ))}
      </AnimatePresence>

      {/* Modals (Settings, Add Account, etc.) */}
      <IBirdModals />

      {/* Editors (Event, Appointment Type, Availability) */}
      <IBirdEventEditor />
      <IBirdAppointmentTypeEditor />
      <IBirdAvailabilityEditor />
    </motion.div>
  );
}

export default IBirdApp;
