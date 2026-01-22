/**
 * iBird Menu Bar Hook
 *
 * Registers menu bar items for the iBird application.
 */

import { useEffect } from 'react';
import { useDesktopStore } from '@/stores/desktopStore';
import { useIBirdStore } from '@/stores/ibirdStore';

export function useIBirdMenuBar() {
  const { setMenuBar, clearMenuBar } = useDesktopStore();
  const { ui, openCompose, openEventEditor, openAppointmentTypeEditor } = useIBirdStore();

  useEffect(() => {
    const menuItems = [
      {
        id: 'ibird',
        label: 'iBird',
        items: [
          { id: 'about', label: 'About iBird', shortcut: '' },
          { id: 'separator-1', type: 'separator' as const },
          { id: 'preferences', label: 'Preferences...', shortcut: '⌘,' },
          { id: 'separator-2', type: 'separator' as const },
          { id: 'quit', label: 'Quit iBird', shortcut: '⌘Q' },
        ],
      },
      {
        id: 'file',
        label: 'File',
        items: ui.activeModule === 'mail'
          ? [
              { id: 'new-message', label: 'New Message', shortcut: '⌘N', action: () => openCompose('new') },
              { id: 'separator-1', type: 'separator' as const },
              { id: 'close', label: 'Close', shortcut: '⌘W' },
            ]
          : ui.activeModule === 'calendar'
          ? [
              { id: 'new-event', label: 'New Event', shortcut: '⌘N', action: () => openEventEditor() },
              { id: 'separator-1', type: 'separator' as const },
              { id: 'close', label: 'Close', shortcut: '⌘W' },
            ]
          : [
              { id: 'new-type', label: 'New Event Type', shortcut: '⌘N', action: () => openAppointmentTypeEditor() },
              { id: 'separator-1', type: 'separator' as const },
              { id: 'close', label: 'Close', shortcut: '⌘W' },
            ],
      },
      {
        id: 'edit',
        label: 'Edit',
        items: [
          { id: 'undo', label: 'Undo', shortcut: '⌘Z' },
          { id: 'redo', label: 'Redo', shortcut: '⇧⌘Z' },
          { id: 'separator-1', type: 'separator' as const },
          { id: 'cut', label: 'Cut', shortcut: '⌘X' },
          { id: 'copy', label: 'Copy', shortcut: '⌘C' },
          { id: 'paste', label: 'Paste', shortcut: '⌘V' },
          { id: 'separator-2', type: 'separator' as const },
          { id: 'select-all', label: 'Select All', shortcut: '⌘A' },
          { id: 'find', label: 'Find...', shortcut: '⌘F' },
        ],
      },
      {
        id: 'view',
        label: 'View',
        items: ui.activeModule === 'mail'
          ? [
              { id: 'toggle-sidebar', label: 'Toggle Sidebar', shortcut: '⌘\\' },
              { id: 'separator-1', type: 'separator' as const },
              { id: 'list-view', label: 'List View' },
              { id: 'conversation-view', label: 'Conversation View' },
            ]
          : ui.activeModule === 'calendar'
          ? [
              { id: 'toggle-sidebar', label: 'Toggle Sidebar', shortcut: '⌘\\' },
              { id: 'separator-1', type: 'separator' as const },
              { id: 'day-view', label: 'Day' },
              { id: 'week-view', label: 'Week' },
              { id: 'month-view', label: 'Month' },
              { id: 'year-view', label: 'Year' },
              { id: 'agenda-view', label: 'Agenda' },
            ]
          : [
              { id: 'toggle-sidebar', label: 'Toggle Sidebar', shortcut: '⌘\\' },
            ],
      },
      {
        id: 'window',
        label: 'Window',
        items: [
          { id: 'minimize', label: 'Minimize', shortcut: '⌘M' },
          { id: 'zoom', label: 'Zoom' },
          { id: 'separator-1', type: 'separator' as const },
          { id: 'mail', label: 'Mail', shortcut: '⌘1' },
          { id: 'calendar', label: 'Calendar', shortcut: '⌘2' },
          { id: 'appointments', label: 'Appointments', shortcut: '⌘3' },
        ],
      },
      {
        id: 'help',
        label: 'Help',
        items: [
          { id: 'ibird-help', label: 'iBird Help' },
          { id: 'keyboard-shortcuts', label: 'Keyboard Shortcuts', shortcut: '⌘/' },
        ],
      },
    ];

    setMenuBar(menuItems);

    return () => {
      clearMenuBar();
    };
  }, [ui.activeModule, setMenuBar, clearMenuBar, openCompose, openEventEditor, openAppointmentTypeEditor]);
}
