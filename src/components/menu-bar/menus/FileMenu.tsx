/**
 * FileMenu
 * 
 * Standard File menu following macOS HIG patterns.
 * Provides document/workspace management actions.
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    FolderOpen,
    Clock,
    Save,
    Download,
    FileJson,
    FileSpreadsheet,
    Camera,
    X
} from 'lucide-react';
import type { MenuItemDef } from '@/context/MenuBarContext';

export function useFileMenuItems(): MenuItemDef[] {
    const navigate = useNavigate();

    return useMemo<MenuItemDef[]>(() => [
        {
            id: 'new-window',
            label: 'New Window',
            icon: Plus,
            shortcut: '⌘N',
            action: () => {
                // TODO: Open new window
                window.open(window.location.origin, '_blank');
            },
        },
        { id: 'sep-1', label: '', dividerAfter: true },
        {
            id: 'open',
            label: 'Open...',
            icon: FolderOpen,
            shortcut: '⌘O',
            action: () => {
                // TODO: Open file picker
                console.log('Open file picker');
            },
        },
        {
            id: 'open-recent',
            label: 'Open Recent',
            icon: Clock,
            submenu: [
                {
                    id: 'recent-1',
                    label: 'workspace-demo.lc',
                    action: () => console.log('Open workspace-demo'),
                },
                {
                    id: 'recent-2',
                    label: 'trading-config.lc',
                    action: () => console.log('Open trading-config'),
                },
                { id: 'sep-recent', label: '', dividerAfter: true },
                {
                    id: 'clear-recent',
                    label: 'Clear Menu',
                    action: () => console.log('Clear recent'),
                },
            ],
        },
        { id: 'sep-2', label: '', dividerAfter: true },
        {
            id: 'save',
            label: 'Save',
            icon: Save,
            shortcut: '⌘S',
            disabled: true, // Enable when there's something to save
            action: () => console.log('Save'),
        },
        {
            id: 'save-as',
            label: 'Save As...',
            shortcut: '⇧⌘S',
            action: () => console.log('Save as'),
        },
        {
            id: 'export',
            label: 'Export',
            icon: Download,
            submenu: [
                {
                    id: 'export-json',
                    label: 'Export as JSON',
                    icon: FileJson,
                    action: () => console.log('Export JSON'),
                },
                {
                    id: 'export-csv',
                    label: 'Export as CSV',
                    icon: FileSpreadsheet,
                    action: () => console.log('Export CSV'),
                },
                {
                    id: 'export-screenshot',
                    label: 'Export Screenshot',
                    icon: Camera,
                    shortcut: '⇧⌘4',
                    action: () => console.log('Screenshot'),
                },
            ],
        },
        { id: 'sep-3', label: '', dividerAfter: true },
        {
            id: 'close',
            label: 'Close Window',
            icon: X,
            shortcut: '⌘W',
            action: () => window.close(),
        },
        {
            id: 'close-all',
            label: 'Close All',
            shortcut: '⌥⌘W',
            action: () => console.log('Close all'),
        },
    ], [navigate]);
}
