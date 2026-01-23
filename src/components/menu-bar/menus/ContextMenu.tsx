/**
 * ContextMenu
 *
 * Context-sensitive menu with live resource queries.
 * Shows prompts and knowledge for the currently focused app/agent,
 * with actions to insert, browse, and manage context resources.
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
    Plus,
    Pin,
} from 'lucide-react';
import type { MenuItemDef } from '@/context/MenuBarContext';
import { useFocusedTarget } from '@/hooks/useFocusedTarget';
import { useResourcesForTarget } from '@/hooks/useResourcesForTarget';
import { useResourceStore } from '@/stores/resourceStore';

export function useContextMenuItems(): MenuItemDef[] {
    const navigate = useNavigate();
    const target = useFocusedTarget();
    const { resources: prompts } = useResourcesForTarget(target.ownerType, target.ownerId, { type: 'prompt' });
    const { resources: knowledge } = useResourcesForTarget(target.ownerType, target.ownerId, { type: 'knowledge' });
    const { createResource } = useResourceStore();

    return useMemo<MenuItemDef[]>(() => {
        // Build prompts submenu (up to 8 items)
        const promptItems: MenuItemDef[] = prompts
            .filter(p => p.isActive)
            .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || b.usageFrequency - a.usageFrequency)
            .slice(0, 8)
            .map(p => ({
                id: `prompt-${p.id}`,
                label: p.name || 'Untitled Prompt',
                icon: p.isPinned ? Pin : MessageSquare,
                action: () => {
                    // Copy prompt content to clipboard for insertion
                    if (p.content) {
                        navigator.clipboard.writeText(p.content);
                    }
                },
            }));

        // Build knowledge submenu (up to 5 items)
        const knowledgeItems: MenuItemDef[] = knowledge
            .filter(k => k.isActive)
            .slice(0, 5)
            .map(k => ({
                id: `know-${k.id}`,
                label: k.name || 'Untitled Knowledge',
                icon: BookOpen,
                action: () => {
                    useResourceStore.getState().selectResource(k);
                },
            }));

        return [
            // Section 1: Modes
            {
                id: 'mode-private',
                label: 'Private',
                icon: Lock,
                action: () => console.log('Switch to Private Mode'),
            },
            {
                id: 'mode-business',
                label: 'Business',
                icon: Briefcase,
                action: () => console.log('Switch to Business Mode'),
            },
            { id: 'sep-1', label: '', dividerAfter: true },

            // Section 2: Live Prompts
            {
                id: 'prompts',
                label: 'Prompts',
                icon: MessageSquare,
                submenu: [
                    ...promptItems,
                    ...(promptItems.length > 0 ? [{ id: 'prompt-sep', label: '', dividerAfter: true }] : []),
                    {
                        id: 'add-prompt',
                        label: 'Add Prompt...',
                        icon: Plus,
                        action: () => {
                            createResource({
                                resourceType: 'prompt',
                                ownerType: target.ownerType,
                                ownerId: target.ownerId,
                                name: 'New Prompt',
                                content: '',
                                typeMetadata: { type: 'prompt', template: '', variables: [] },
                                tags: [],
                                provenance: 'user_input',
                            });
                        },
                    },
                    {
                        id: 'prompt-finder',
                        label: 'Prompt Finder',
                        icon: Search,
                        action: () => navigate('/os/prompt-finder'),
                    },
                ],
            },
            { id: 'sep-2', label: '', dividerAfter: true },

            // Section 3: Live Knowledge
            {
                id: 'knowledge',
                label: 'Knowledge',
                icon: BookOpen,
                submenu: [
                    ...knowledgeItems,
                    ...(knowledgeItems.length > 0 ? [{ id: 'know-sep', label: '', dividerAfter: true }] : []),
                    {
                        id: 'know-input',
                        label: 'Add Knowledge...',
                        icon: PenTool,
                        action: () => {
                            createResource({
                                resourceType: 'knowledge',
                                ownerType: target.ownerType,
                                ownerId: target.ownerId,
                                name: 'New Knowledge',
                                content: '',
                                typeMetadata: { type: 'knowledge', sourceType: 'input' },
                                tags: [],
                                provenance: 'user_input',
                            });
                        },
                    },
                    {
                        id: 'know-finder',
                        label: 'File Finder',
                        icon: FileText,
                        action: () => navigate('/os/knowledge/files'),
                    },
                    {
                        id: 'know-rag',
                        label: 'RAG',
                        icon: Brain,
                        action: () => navigate('/os/knowledge/rag'),
                    },
                ],
            },
        ];
    }, [navigate, prompts, knowledge, target, createResource]);
}
