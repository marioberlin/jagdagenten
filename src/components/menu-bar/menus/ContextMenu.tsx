/**
 * ContextMenu
 * 
 * Context-sensitive menu that adapts based on the current app/state.
 * Replaces the traditional Window menu with more contextual actions.
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Lock,
    Briefcase,
    MessageSquare,
    Search,
    BookOpen,
    PenTool,
    FileText,
    Brain,
} from 'lucide-react';
import type { MenuItemDef } from '@/context/MenuBarContext';

export function useContextMenuItems(): MenuItemDef[] {
    const navigate = useNavigate();

    return useMemo<MenuItemDef[]>(() => [
        // Section 1: Modes (Private / Business)
        {
            id: 'mode-private',
            label: 'Private',
            icon: Lock,
            action: () => {
                console.log('Switch to Private Mode');
            },
        },
        {
            id: 'mode-business',
            label: 'Business',
            icon: Briefcase,
            action: () => {
                console.log('Switch to Business Mode');
            },
        },
        { id: 'sep-1', label: '', dividerAfter: true },

        // Section 2: Prompting Tools
        {
            id: 'prompt',
            label: 'Prompt',
            icon: MessageSquare,
            action: () => navigate('/os/prompt'), // Placeholder route
        },
        {
            id: 'prompt-finder',
            label: 'Prompt Finder',
            icon: Search,
            action: () => navigate('/os/prompt-finder'), // Placeholder route
        },
        { id: 'sep-2', label: '', dividerAfter: true },

        // Section 3: Knowledge Management
        {
            id: 'knowledge',
            label: 'Knowledge',
            icon: BookOpen,
            submenu: [
                {
                    id: 'know-input',
                    label: 'Input',
                    icon: PenTool,
                    action: () => navigate('/os/knowledge/input'), // Placeholder route
                },
                {
                    id: 'know-finder',
                    label: 'File Finder',
                    icon: FileText,
                    action: () => navigate('/os/knowledge/files'), // Placeholder route
                },
                {
                    id: 'know-rag',
                    label: 'RAG',
                    icon: Brain,
                    action: () => navigate('/os/knowledge/rag'), // Placeholder route
                },
            ]
        },
    ], [navigate]);
}
