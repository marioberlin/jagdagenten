/**
 * SparklesApp - Main Email Client Component
 *
 * A Gmail client with Smart Inbox, Gatekeeper, and Calendar integration.
 * Built with Liquid Glass design system.
 */

import { useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, X } from 'lucide-react';
import { useSparklesStore, useFilteredThreads, useSyncStatus } from '@/stores/sparklesStore';
import { useDesktopStore } from '@/stores/desktopStore';
import { SparklesSidebar } from './SparklesSidebar';
import { SparklesMailList } from './SparklesMailList';
import { SparklesMailView } from './SparklesMailView';
import { SparklesComposeModal } from './SparklesComposeModal';
import { SparklesEmptyState } from './SparklesEmptyState';
import { useSparklesMenuBar } from './hooks/useSparklesMenuBar';
import { useSparklesShortcuts } from './hooks/useSparklesShortcuts';
import { cn } from '@/lib/utils';

// =============================================================================
// Component
// =============================================================================

export function SparklesApp() {
  const { closePanel } = useDesktopStore();
  const {
    accounts,
    ui,
    selectedThread,
    settings,
    toggleSidebar,
    selectThread,
  } = useSparklesStore();

  const filteredThreads = useFilteredThreads();
  const syncStatus = useSyncStatus();

  // Register menu bar items
  useSparklesMenuBar();

  // Register keyboard shortcuts
  useSparklesShortcuts();

  // Handle escape key to close panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !ui.activeModal && !ui.composeWindows.length) {
        closePanel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closePanel, ui.activeModal, ui.composeWindows.length]);

  // Close thread view handler
  const handleCloseThread = useCallback(() => {
    selectThread(null);
  }, [selectThread]);

  // Determine if we should show the empty state
  const showEmptyState = accounts.length === 0;
  const showNoThreads = !showEmptyState && filteredThreads.length === 0 && !ui.isLoadingThreads;

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
              <SparklesSidebar />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {showEmptyState ? (
            <SparklesEmptyState type="no-accounts" />
          ) : (
            <>
              {/* Mail List */}
              <div
                className="flex-shrink-0 border-r border-[var(--glass-border)] overflow-hidden"
                style={{ width: settings.readingPanePosition === 'hidden' ? '100%' : ui.mailListWidth }}
              >
                {showNoThreads ? (
                  <SparklesEmptyState type="no-threads" folder={ui.activeFolder} />
                ) : (
                  <SparklesMailList threads={filteredThreads} />
                )}
              </div>

              {/* Mail View (Reading Pane) */}
              {settings.readingPanePosition !== 'hidden' && (
                <div className="flex-1 overflow-hidden">
                  {selectedThread ? (
                    <SparklesMailView
                      thread={selectedThread}
                      onClose={handleCloseThread}
                    />
                  ) : (
                    <SparklesEmptyState type="no-selection" />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Compose Windows */}
      <AnimatePresence>
        {ui.composeWindows.map((compose) => (
          <SparklesComposeModal key={compose.id} compose={compose} />
        ))}
      </AnimatePresence>

      {/* Close Button (top-right) */}
      <button
        onClick={() => closePanel()}
        className={cn(
          'absolute top-3 right-3 z-10',
          'w-8 h-8 rounded-full',
          'flex items-center justify-center',
          'bg-[var(--glass-surface)] hover:bg-[var(--glass-surface-hover)]',
          'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]',
          'transition-colors duration-150'
        )}
        aria-label="Close Sparkles"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export default SparklesApp;
