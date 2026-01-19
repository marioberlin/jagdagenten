/**
 * AgentMenu
 * 
 * Agent control menu for the A2A system.
 * Provides actions for managing AI agents.
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Play,
    Square,
    RotateCcw,
    Terminal,
    FileText,
    Settings,
    Users,
    Plug,
    Unplug
} from 'lucide-react';
import type { MenuItemDef } from '@/context/MenuBarContext';

export function useAgentMenuItems(): MenuItemDef[] {
    const navigate = useNavigate();

    return useMemo<MenuItemDef[]>(() => [
        {
            id: 'start-agent',
            label: 'Start Agent',
            icon: Play,
            shortcut: '⌘R',
            action: () => {
                // TODO: Start agent
                console.log('Start agent');
            },
        },
        {
            id: 'stop-agent',
            label: 'Stop Agent',
            icon: Square,
            shortcut: '⇧⌘R',
            action: () => {
                console.log('Stop agent');
            },
        },
        {
            id: 'restart-agent',
            label: 'Restart Agent',
            icon: RotateCcw,
            shortcut: '⌃⌘R',
            action: () => {
                console.log('Restart agent');
            },
        },
        { id: 'sep-1', label: '', dividerAfter: true },
        {
            id: 'agent-console',
            label: 'Agent Console',
            icon: Terminal,
            shortcut: '⌘J',
            action: () => navigate('/os/console'),
        },
        {
            id: 'agent-logs',
            label: 'Agent Logs',
            icon: FileText,
            submenu: [
                {
                    id: 'logs-all',
                    label: 'All Logs',
                    action: () => console.log('View all logs'),
                },
                {
                    id: 'logs-errors',
                    label: 'Errors Only',
                    action: () => console.log('View error logs'),
                },
                {
                    id: 'logs-tasks',
                    label: 'Task History',
                    action: () => console.log('View task history'),
                },
            ],
        },
        { id: 'sep-2', label: '', dividerAfter: true },
        {
            id: 'connect-a2a',
            label: 'Connect to A2A...',
            icon: Plug,
            action: () => {
                console.log('Connect to A2A');
            },
        },
        {
            id: 'disconnect',
            label: 'Disconnect',
            icon: Unplug,
            disabled: true, // Enable when connected
            action: () => {
                console.log('Disconnect');
            },
        },
        { id: 'sep-3', label: '', dividerAfter: true },
        {
            id: 'agent-hub',
            label: 'Agent Hub',
            icon: Users,
            action: () => navigate('/os/agents'),
        },
        {
            id: 'agent-settings',
            label: 'Agent Settings...',
            icon: Settings,
            action: () => {
                console.log('Agent settings');
            },
        },
    ], [navigate]);
}
