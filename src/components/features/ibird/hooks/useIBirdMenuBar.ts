/**
 * iBird Menu Bar Hook
 *
 * Registers menu bar items for the iBird application using the MenuBarContext.
 */

import { useEffect, useRef } from 'react';
import { useMenuBar, type MenuDef } from '@/context/MenuBarContext';
import { useIBirdStore } from '@/stores/ibirdStore';
import { Mail } from 'lucide-react';

export function useIBirdMenuBar() {
  const { setAppIdentity, registerMenu, unregisterMenu } = useMenuBar();
  const { ui, openCompose, openEventEditor, openAppointmentTypeEditor } = useIBirdStore();

  // Track registered menu IDs to clean up on unmount
  const registeredMenuIds = useRef<string[]>([]);

  useEffect(() => {
    // Set app identity in menu bar
    setAppIdentity('iBird', Mail);

    // Define menus based on active module
    const menus: MenuDef[] = [
      {
        id: 'ibird-file',
        label: 'File',
        items: ui.activeModule === 'mail'
          ? [
            { id: 'new-message', label: 'New Message', shortcut: '⌘N', action: () => openCompose('new') },
            { id: 'close', label: 'Close', shortcut: '⌘W', dividerAfter: false },
          ]
          : ui.activeModule === 'calendar'
            ? [
              { id: 'new-event', label: 'New Event', shortcut: '⌘N', action: () => openEventEditor() },
              { id: 'close', label: 'Close', shortcut: '⌘W' },
            ]
            : [
              { id: 'new-type', label: 'New Event Type', shortcut: '⌘N', action: () => openAppointmentTypeEditor() },
              { id: 'close', label: 'Close', shortcut: '⌘W' },
            ],
      },
      {
        id: 'ibird-edit',
        label: 'Edit',
        items: [
          { id: 'undo', label: 'Undo', shortcut: '⌘Z' },
          { id: 'redo', label: 'Redo', shortcut: '⇧⌘Z' },
          { id: 'cut', label: 'Cut', shortcut: '⌘X', dividerAfter: false },
          { id: 'copy', label: 'Copy', shortcut: '⌘C' },
          { id: 'paste', label: 'Paste', shortcut: '⌘V' },
          { id: 'select-all', label: 'Select All', shortcut: '⌘A', dividerAfter: false },
          { id: 'find', label: 'Find...', shortcut: '⌘F' },
        ],
      },
      {
        id: 'ibird-view',
        label: 'View',
        items: ui.activeModule === 'mail'
          ? [
            { id: 'toggle-sidebar', label: 'Toggle Sidebar', shortcut: '⌘\\' },
            { id: 'list-view', label: 'List View', dividerAfter: false },
            { id: 'conversation-view', label: 'Conversation View' },
          ]
          : ui.activeModule === 'calendar'
            ? [
              { id: 'toggle-sidebar', label: 'Toggle Sidebar', shortcut: '⌘\\' },
              { id: 'day-view', label: 'Day', dividerAfter: false },
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
        id: 'ibird-window',
        label: 'Window',
        items: [
          { id: 'minimize', label: 'Minimize', shortcut: '⌘M' },
          { id: 'zoom', label: 'Zoom' },
          { id: 'mail', label: 'Mail', shortcut: '⌘1', dividerAfter: false },
          { id: 'calendar', label: 'Calendar', shortcut: '⌘2' },
          { id: 'appointments', label: 'Appointments', shortcut: '⌘3' },
        ],
      },
    ];

    // Unregister previous menus before registering new ones
    registeredMenuIds.current.forEach(id => unregisterMenu(id));
    registeredMenuIds.current = [];

    // Register all menus
    menus.forEach(menu => {
      registerMenu(menu);
      registeredMenuIds.current.push(menu.id);
    });

    // Cleanup on unmount
    return () => {
      registeredMenuIds.current.forEach(id => unregisterMenu(id));
      registeredMenuIds.current = [];
      setAppIdentity('LiquidOS');
    };
  }, [ui.activeModule, setAppIdentity, registerMenu, unregisterMenu, openCompose, openEventEditor, openAppointmentTypeEditor]);
}
