/**
 * ContextMenu
 * 
 * Context-sensitive menu that adapts based on the current app/state.
 * Replaces the traditional Window menu with more contextual actions.
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Minimize2,
    Maximize2,
    Command,
    Zap,
    Compass,
    Briefcase,
    Layout,
    Sparkles,
    Layers
} from 'lucide-react';
import type { MenuItemDef } from '@/context/MenuBarContext';

export function useContextMenuItems(): MenuItemDef[] {
    const navigate = useNavigate();

    return useMemo<MenuItemDef[]>(() => [
        {
            id: 'minimize',
            label: 'Minimize',
            icon: Minimize2,
            shortcut: '⌘M',
            action: () => {
                console.log('Minimize');
            },
        },
        {
            id: 'zoom',
            label: 'Zoom',
            icon: Maximize2,
            action: () => {
                console.log('Zoom window');
            },
        },
        { id: 'sep-1', label: '', dividerAfter: true },
        // Quick navigation to main areas
        {
            id: 'command-center',
            label: 'Command Center',
            icon: Command,
            shortcut: '⌘1',
            action: () => navigate('/os'),
        },
        {
            id: 'rush-hour',
            label: 'RushHour Terminal',
            icon: Zap,
            shortcut: '⌘2',
            action: () => navigate('/terminal'),
        },
        {
            id: 'agent-hub',
            label: 'Agent Hub',
            icon: Compass,
            shortcut: '⌘3',
            action: () => navigate('/os/agents'),
        },
        {
            id: 'cowork-mode',
            label: 'Cowork Mode',
            icon: Briefcase,
            shortcut: '⌘4',
            action: () => navigate('/os/cowork'),
        },
        { id: 'sep-2', label: '', dividerAfter: true },
        {
            id: 'design-explorer',
            label: 'Design Explorer',
            icon: Layout,
            action: () => navigate('/os/design'),
        },
        {
            id: 'component-library',
            label: 'Component Library',
            icon: Sparkles,
            action: () => navigate('/os/showcase'),
        },
        {
            id: 'demos',
            label: 'Demos',
            icon: Layers,
            action: () => navigate('/os/demos'),
        },
        { id: 'sep-3', label: '', dividerAfter: true },
        {
            id: 'bring-to-front',
            label: 'Bring All to Front',
            action: () => {
                console.log('Bring all to front');
            },
        },
    ], [navigate]);
}
