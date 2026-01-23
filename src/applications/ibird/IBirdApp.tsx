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

import { useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Calendar, Clock, X, Settings, RefreshCw, Send } from 'lucide-react';
import { IBirdAgentInput } from './components/IBirdAgentInput';
import { IBirdResizeHandle } from './components/IBirdResizeHandle';
import { useIBirdStore, type IBirdModule } from './store';
import { useDesktopStore } from '@/stores/desktopStore';
import { IBirdSidebar } from './components/IBirdSidebar';
import { IBirdMailView } from './mail/IBirdMailView';
import { IBirdCalendarView } from './calendar/IBirdCalendarView';
import { IBirdAppointmentsView } from './appointments/IBirdAppointmentsView';
import { IBirdEmptyState } from './components/IBirdEmptyState';
import { IBirdComposeModal } from './mail/IBirdComposeModal';
import { IBirdModals } from './components/IBirdModals';
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
    setSidebarWidth,
  } = useIBirdStore();

  const { fetchSettings } = useSettingsApi();
  const { fetchAccounts, fetchFolders } = useMailApi();
  const { fetchCalendars, fetchEvents } = useCalendarApi();
  const { fetchAppointmentTypes, fetchAvailabilitySchedules, fetchBookings } = useAppointmentsApi();

  // Register menu bar items
  useIBirdMenuBar();

  // Register keyboard shortcuts
  useIBirdShortcuts();

  // Track if initial data has been loaded
  const hasLoadedRef = useRef(false);

  // Initial data loading - runs only once on mount
  // Each API call is wrapped individually so failures don't crash the app
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const loadInitialData = async () => {
      // Helper to safely call an API and log errors
      const safeCall = async <T,>(name: string, fn: () => Promise<T>): Promise<T | null> => {
        try {
          return await fn();
        } catch (error) {
          console.warn(`[iBird] Failed to load ${name}:`, error);
          return null;
        }
      };

      // Load settings first (non-blocking failure)
      await safeCall('settings', fetchSettings);

      // Load data for all modules (all non-blocking)
      await Promise.allSettled([
        safeCall('accounts', fetchAccounts),
        safeCall('calendars', fetchCalendars),
        safeCall('appointment types', fetchAppointmentTypes),
        safeCall('availability schedules', fetchAvailabilitySchedules),
        safeCall('bookings', fetchBookings),
      ]);

      // After accounts are loaded, fetch folders for each
      const state = useIBirdStore.getState();
      for (const account of state.accounts) {
        await safeCall(`folders for ${account.email}`, () => fetchFolders(account.id));
      }

      // Set active folder to inbox if not already set
      const updatedState = useIBirdStore.getState();
      if (updatedState.accounts.length > 0 && !updatedState.ui.activeFolderId) {
        const accountId = updatedState.ui.activeAccountId || updatedState.accounts[0].id;
        const folders = updatedState.folders[accountId] || [];
        const inboxFolder = folders.find((f) => f.folderType === 'inbox');
        if (inboxFolder) {
          useIBirdStore.getState().setActiveFolder(inboxFolder.id, 'inbox');
        }
      }

      // Fetch events for the current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      await safeCall('events', () => fetchEvents({
        start: startOfMonth.toISOString(),
        end: endOfMonth.toISOString(),
      }));
    };

    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle escape key to close panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !ui.activeModal && !(ui.composeWindows?.length)) {
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
    <div className="fixed inset-0 z-50 flex flex-col bg-glass-base overflow-hidden pb-[72px]">
      {/* Aurora-style Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-blue-900/10 to-transparent pointer-events-none" />

      {/* Tab Navigation (Aurora-style Header) */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-[var(--glass-border)] bg-black/20 relative z-10">
        {/* Module Tabs */}
        {(['mail', 'calendar', 'appointments'] as IBirdModule[]).map((module) => {
          const Icon = moduleIcons[module];
          const isActive = ui.activeModule === module;
          // Get badge counts
          const getBadge = () => {
            if (module === 'mail') {
              const unreadCount = Object.values(useIBirdStore.getState().folders)
                .flat()
                .reduce((sum, folder) => sum + (folder.unreadCount || 0), 0);
              return unreadCount > 0 ? unreadCount : null;
            }
            return null;
          };
          const badge = getBadge();
          return (
            <button
              key={module}
              onClick={() => handleModuleSwitch(module)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-[var(--glass-accent)]/20 text-[var(--glass-accent)]'
                  : 'text-secondary hover:text-primary hover:bg-white/5'
              )}
            >
              <Icon className="w-4 h-4" />
              {moduleLabels[module]}
              {badge !== null && (
                <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-xs">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </button>
          );
        })}

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
      <div className="relative flex flex-1 overflow-hidden z-10">
        {/* Sidebar (only for Mail module) */}
        {ui.activeModule === 'mail' && (
          <>
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
            {/* Resize Handle: Sidebar ↔ Content */}
            {!ui.sidebarCollapsed && (
              <IBirdResizeHandle
                onResize={(delta) => setSidebarWidth(ui.sidebarWidth + delta)}
              />
            )}
          </>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 overflow-hidden relative">
            {showSetup ? (
              <IBirdEmptyState type="no-accounts" />
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={ui.activeModule}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 overflow-hidden h-full"
                >
                  {renderModuleView}
                </motion.div>
              </AnimatePresence>
            )}

            {/* Compose Windows (Mail) - covers content area above agent input */}
            <AnimatePresence>
              {(ui.composeWindows ?? []).map((compose) => (
                <IBirdComposeModal key={compose.id} compose={compose} />
              ))}
            </AnimatePresence>
          </div>

          {/* Agent Input Bar - always visible at bottom */}
          <IBirdAgentInput
            onSend={(message) => {
              console.log('[iBird Agent]:', message);
              // TODO: Wire up to A2A agent service
            }}
          />
        </div>
      </div>

      {/* Modals (Settings, Add Account, etc.) */}
      <IBirdModals />

      {/* Editors (Event, Appointment Type, Availability) */}
      <IBirdEventEditor />
      <IBirdAppointmentTypeEditor />
      <IBirdAvailabilityEditor />
    </div>
  );
}

export default IBirdApp;
