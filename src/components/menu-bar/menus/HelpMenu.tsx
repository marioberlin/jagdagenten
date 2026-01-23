/**
 * HelpMenu
 * 
 * Standard Help menu following macOS HIG patterns.
 * Provides documentation and support access.
 */
import { useMemo } from 'react';
import { useAppStoreStore } from '@/system/app-store/appStoreStore';
import {
    Search,
    HelpCircle,
    Keyboard,
    Book,
    FileText,
    Bug,
    MessageCircle
} from 'lucide-react';
import type { MenuItemDef } from '@/context/MenuBarContext';

export function useHelpMenuItems(): MenuItemDef[] {
    const openApp = useAppStoreStore((s) => s.openApp);

    return useMemo<MenuItemDef[]>(() => [
        {
            id: 'search',
            label: 'Search...',
            icon: Search,
            action: () => {
                // TODO: Open help search
                console.log('Help search');
            },
        },
        { id: 'sep-1', label: '', dividerAfter: true },
        {
            id: 'help',
            label: 'LiquidOS Help',
            icon: HelpCircle,
            action: () => {
                console.log('Open help');
            },
        },
        {
            id: 'shortcuts',
            label: 'Keyboard Shortcuts',
            icon: Keyboard,
            shortcut: '⌘/',
            action: () => {
                // TODO: Open shortcuts reference
                console.log('Keyboard shortcuts');
            },
        },
        { id: 'sep-2', label: '', dividerAfter: true },
        {
            id: 'documentation',
            label: 'Documentation',
            icon: Book,
            submenu: [
                {
                    id: 'docs-getting-started',
                    label: 'Getting Started',
                    action: () => console.log('Getting started'),
                },
                {
                    id: 'docs-components',
                    label: 'Component Reference',
                    action: () => openApp('_system/showcase'),
                },
                {
                    id: 'docs-agents',
                    label: 'Agent Development',
                    action: () => console.log('Agent docs'),
                },
                {
                    id: 'docs-api',
                    label: 'API Reference',
                    action: () => console.log('API docs'),
                },
            ],
        },
        {
            id: 'release-notes',
            label: 'Release Notes',
            icon: FileText,
            action: () => {
                console.log('Release notes');
            },
        },
        { id: 'sep-3', label: '', dividerAfter: true },
        {
            id: 'report-issue',
            label: 'Report an Issue...',
            icon: Bug,
            action: () => {
                window.open('https://github.com/issues', '_blank');
            },
        },
        {
            id: 'contact-support',
            label: 'Contact Support...',
            icon: MessageCircle,
            action: () => {
                console.log('Contact support');
            },
        },
    ], [openApp]);
}
