/**
 * iBird Menu Bar Hook
 *
 * Registers menu bar items for the iBird application.
 */

import { useEffect } from 'react';
import { useMenuBar, type MenuDef } from '@/context/MenuBarContext';
import { useIBirdStore } from '@/stores/ibirdStore';

export function useIBirdMenuBar() {
  const { registerMenu, unregisterMenu, setAppIdentity } = useMenuBar();
  const { ui, openCompose, openEventEditor, openAppointmentTypeEditor } = useIBirdStore();

  useEffect(() => {
    const menuItems: MenuDef[] = [
      {
        id: 'ibird-app',
        label: 'iBird',
        items: [
          { id: 'ibird-about', label: 'About iBird', dividerAfter: true },
          { id: 'ibird-preferences', label: 'Preferences...', shortcut: '⌘,', dividerAfter: true },
          { id: 'ibird-quit', label: 'Quit iBird', shortcut: '⌘Q' },
        ],
      },
      {
        id: 'ibird-file',
        label: 'File',
        items: ui.activeModule === 'mail'
          ? [
              { id: 'ibird-new-message', label: 'New Message', shortcut: '⌘N', action: () => openCompose('new'), dividerAfter: true },
              { id: 'ibird-close', label: 'Close', shortcut: '⌘W' },
            ]
          : ui.activeModule === 'calendar'
          ? [
              { id: 'ibird-new-event', label: 'New Event', shortcut: '⌘N', action: () => openEventEditor(), dividerAfter: true },
              { id: 'ibird-close', label: 'Close', shortcut: '⌘W' },
            ]
          : [
              { id: 'ibird-new-type', label: 'New Event Type', shortcut: '⌘N', action: () => openAppointmentTypeEditor(), dividerAfter: true },
              { id: 'ibird-close', label: 'Close', shortcut: '⌘W' },
            ],
      },
      {
        id: 'ibird-edit',
        label: 'Edit',
        items: [
          { id: 'ibird-undo', label: 'Undo', shortcut: '⌘Z' },
          { id: 'ibird-redo', label: 'Redo', shortcut: '⇧⌘Z', dividerAfter: true },
          { id: 'ibird-cut', label: 'Cut', shortcut: '⌘X' },
          { id: 'ibird-copy', label: 'Copy', shortcut: '⌘C' },
          { id: 'ibird-paste', label: 'Paste', shortcut: '⌘V', dividerAfter: true },
          { id: 'ibird-select-all', label: 'Select All', shortcut: '⌘A' },
          { id: 'ibird-find', label: 'Find...', shortcut: '⌘F' },
        ],
      },
      {
        id: 'ibird-view',
        label: 'View',
        items: ui.activeModule === 'mail'
          ? [
              { id: 'ibird-toggle-sidebar', label: 'Toggle Sidebar', shortcut: '⌘\\', dividerAfter: true },
              { id: 'ibird-list-view', label: 'List View' },
              { id: 'ibird-conversation-view', label: 'Conversation View' },
            ]
          : ui.activeModule === 'calendar'
          ? [
              { id: 'ibird-toggle-sidebar', label: 'Toggle Sidebar', shortcut: '⌘\\', dividerAfter: true },
              { id: 'ibird-day-view', label: 'Day' },
              { id: 'ibird-week-view', label: 'Week' },
              { id: 'ibird-month-view', label: 'Month' },
              { id: 'ibird-year-view', label: 'Year' },
              { id: 'ibird-agenda-view', label: 'Agenda' },
            ]
          : [
              { id: 'ibird-toggle-sidebar', label: 'Toggle Sidebar', shortcut: '⌘\\' },
            ],
      },
      {
        id: 'ibird-window',
        label: 'Window',
        items: [
          { id: 'ibird-minimize', label: 'Minimize', shortcut: '⌘M' },
          { id: 'ibird-zoom', label: 'Zoom', dividerAfter: true },
          { id: 'ibird-mail', label: 'Mail', shortcut: '⌘1' },
          { id: 'ibird-calendar', label: 'Calendar', shortcut: '⌘2' },
          { id: 'ibird-appointments', label: 'Appointments', shortcut: '⌘3' },
        ],
      },
      {
        id: 'ibird-help',
        label: 'Help',
        items: [
          { id: 'ibird-help-docs', label: 'iBird Help' },
          { id: 'ibird-keyboard-shortcuts', label: 'Keyboard Shortcuts', shortcut: '⌘/' },
        ],
      },
    ];

    // Set app identity
    setAppIdentity('iBird');

    // Register each menu
    menuItems.forEach(menu => registerMenu(menu));

    return () => {
      // Unregister menus on cleanup
      menuItems.forEach(menu => unregisterMenu(menu.id));
      setAppIdentity('LiquidOS');
    };
  }, [ui.activeModule, registerMenu, unregisterMenu, setAppIdentity, openCompose, openEventEditor, openAppointmentTypeEditor]);
}
