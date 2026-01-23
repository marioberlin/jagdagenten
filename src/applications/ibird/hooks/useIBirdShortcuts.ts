/**
 * iBird Keyboard Shortcuts Hook
 *
 * Registers keyboard shortcuts for the iBird application.
 */

import { useEffect, useCallback } from 'react';
import { useIBirdStore } from '../store';
import { useDesktopStore } from '@/stores/desktopStore';

export function useIBirdShortcuts() {
  const { closePanel } = useDesktopStore();
  const {
    ui,
    setActiveModule,
    openCompose,
    openEventEditor,
    openAppointmentTypeEditor,
    toggleSidebar,
    setCalendarViewMode,
    navigateCalendar,
  } = useIBirdStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't handle shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const isMeta = e.metaKey || e.ctrlKey;
      const isShift = e.shiftKey;

      // Global shortcuts
      if (isMeta) {
        switch (e.key) {
          case 'n':
          case 'N':
            e.preventDefault();
            if (ui.activeModule === 'mail') {
              openCompose('new');
            } else if (ui.activeModule === 'calendar') {
              openEventEditor();
            } else if (ui.activeModule === 'appointments') {
              openAppointmentTypeEditor();
            }
            break;

          case '1':
            e.preventDefault();
            setActiveModule('mail');
            break;

          case '2':
            e.preventDefault();
            setActiveModule('calendar');
            break;

          case '3':
            e.preventDefault();
            setActiveModule('appointments');
            break;

          case '\\':
            e.preventDefault();
            toggleSidebar();
            break;

          case 'w':
          case 'W':
            e.preventDefault();
            closePanel();
            break;
        }
      }

      // Mail-specific shortcuts (no modifier)
      if (ui.activeModule === 'mail' && !isMeta) {
        switch (e.key) {
          case 'c':
            e.preventDefault();
            openCompose('new');
            break;

          case 'r':
            e.preventDefault();
            // Reply to selected message
            const selectedMessage = useIBirdStore.getState().selectedMessage;
            if (selectedMessage) {
              openCompose(isShift ? 'replyAll' : 'reply', {
                to: [selectedMessage.from],
                subject: `Re: ${selectedMessage.subject || ''}`,
                replyToMessageId: selectedMessage.id,
              });
            }
            break;

          case 'f':
            e.preventDefault();
            // Forward selected message
            const msgToForward = useIBirdStore.getState().selectedMessage;
            if (msgToForward) {
              openCompose('forward', {
                subject: `Fwd: ${msgToForward.subject || ''}`,
                forwardedMessageId: msgToForward.id,
              });
            }
            break;

          case 'Delete':
          case 'Backspace':
            e.preventDefault();
            if (ui.multiSelectMessageIds.length > 0) {
              // Delete would be implemented via API
            }
            break;

          case 'e':
            e.preventDefault();
            // Archive selected messages
            break;

          case 's':
            e.preventDefault();
            // Toggle star on selected messages
            break;
        }
      }

      // Calendar-specific shortcuts
      if (ui.activeModule === 'calendar' && !isMeta) {
        switch (e.key) {
          case 'd':
            e.preventDefault();
            setCalendarViewMode('day');
            break;

          case 'w':
            e.preventDefault();
            setCalendarViewMode('week');
            break;

          case 'm':
            e.preventDefault();
            setCalendarViewMode('month');
            break;

          case 'y':
            e.preventDefault();
            setCalendarViewMode('year');
            break;

          case 'a':
            e.preventDefault();
            setCalendarViewMode('agenda');
            break;

          case 't':
            e.preventDefault();
            navigateCalendar('today');
            break;

          case 'ArrowLeft':
            e.preventDefault();
            navigateCalendar('prev');
            break;

          case 'ArrowRight':
            e.preventDefault();
            navigateCalendar('next');
            break;
        }
      }
    },
    [
      ui.activeModule,
      ui.multiSelectMessageIds,
      setActiveModule,
      openCompose,
      openEventEditor,
      openAppointmentTypeEditor,
      toggleSidebar,
      setCalendarViewMode,
      navigateCalendar,
      closePanel,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
