/**
 * LiquidMenu (✦)
 * 
 * The system-wide menu, equivalent to Apple's  menu.
 * Contains system-level actions that apply regardless of current app.
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Info,
    Settings,
    RefreshCw,
    EyeOff,
    Eye,
    LogOut,
    Power
} from 'lucide-react';
import type { MenuItemDef } from '@/context/MenuBarContext';
import { useDialogs } from '@/context/DialogContext';

export function useLiquidMenuItems(): MenuItemDef[] {
    const navigate = useNavigate();
    const { openDialog } = useDialogs();

    return useMemo<MenuItemDef[]>(() => [
        {
            id: 'about',
            label: 'About LiquidOS',
            icon: Info,
            action: () => {
                openDialog('aboutLiquidOS');
            },
        },
        { id: 'sep-1', label: '', dividerAfter: true },
        {
            id: 'settings',
            label: 'System Settings...',
            icon: Settings,
            shortcut: '⌘,',
            action: () => navigate('/os/settings'),
        },
        {
            id: 'updates',
            label: 'Check for Updates...',
            icon: RefreshCw,
            action: () => {
                // TODO: Check for updates
                console.log('Check for updates');
            },
        },
        { id: 'sep-2', label: '', dividerAfter: true },
        {
            id: 'hide',
            label: 'Hide LiquidOS',
            icon: EyeOff,
            shortcut: '⌘H',
            action: () => {
                // TODO: Minimize/hide behavior
                console.log('Hide');
            },
        },
        {
            id: 'hide-others',
            label: 'Hide Others',
            shortcut: '⌥⌘H',
            action: () => {
                console.log('Hide others');
            },
        },
        {
            id: 'show-all',
            label: 'Show All',
            icon: Eye,
            action: () => {
                console.log('Show all');
            },
        },
        { id: 'sep-3', label: '', dividerAfter: true },
        {
            id: 'sign-out',
            label: 'Sign Out',
            icon: LogOut,
            action: () => {
                // TODO: Sign out logic
                console.log('Sign out');
            },
        },
        {
            id: 'quit',
            label: 'Quit LiquidOS',
            icon: Power,
            shortcut: '⌘Q',
            danger: true,
            action: () => {
                // In a web app, this could close the tab or redirect
                console.log('Quit');
            },
        },
    ], [navigate, openDialog]);
}
