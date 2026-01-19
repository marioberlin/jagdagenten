/**
 * MemoryMenu
 * 
 * AI memory management menu inspired by NL Web patterns.
 * Provides controls for viewing, adding to, and managing AI memory.
 */
import { useMemo } from 'react';
import {
    Eye,
    FileText,
    Sparkles,
    Clock,
    Plus,
    Minimize2,
    Trash2,
    Settings
} from 'lucide-react';
import type { MenuItemDef } from '@/context/MenuBarContext';

export function useMemoryMenuItems(): MenuItemDef[] {
    return useMemo<MenuItemDef[]>(() => [
        {
            id: 'view',
            label: 'View',
            icon: Eye,
            submenu: [
                {
                    id: 'view-raw',
                    label: 'Raw',
                    icon: FileText,
                    action: () => console.log('Memory: View Raw'),
                },
                {
                    id: 'view-optimized',
                    label: 'Optimized',
                    icon: Sparkles,
                    action: () => console.log('Memory: View Optimized'),
                },
                {
                    id: 'view-timeline',
                    label: 'Timeline',
                    icon: Clock,
                    action: () => console.log('Memory: View Timeline'),
                },
            ],
        },
        { id: 'sep-1', label: '', dividerAfter: true },
        {
            id: 'add-to-memory',
            label: 'Add to Memory...',
            icon: Plus,
            shortcut: '⌘M',
            action: () => console.log('Memory: Add to Memory'),
        },
        {
            id: 'compact',
            label: 'Compact',
            icon: Minimize2,
            action: () => console.log('Memory: Compact'),
        },
        {
            id: 'clear-session',
            label: 'Clear Session',
            icon: Trash2,
            danger: true,
            action: () => console.log('Memory: Clear Session'),
        },
        { id: 'sep-2', label: '', dividerAfter: true },
        {
            id: 'memory-settings',
            label: 'Memory Settings...',
            icon: Settings,
            action: () => console.log('Memory: Open Settings'),
        },
    ], []);
}
