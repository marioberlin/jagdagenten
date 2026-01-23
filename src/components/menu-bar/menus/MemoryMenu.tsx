/**
 * MemoryMenu
 *
 * AI memory management menu with live resource queries.
 * Shows memory items for the currently focused app/agent and provides
 * controls for viewing, adding to, and managing AI memory.
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
    Settings,
    Pin,
    Brain,
} from 'lucide-react';
import type { MenuItemDef } from '@/context/MenuBarContext';
import { useFocusedTarget } from '@/hooks/useFocusedTarget';
import { useResourcesForTarget } from '@/hooks/useResourcesForTarget';
import { useResourceStore } from '@/stores/resourceStore';

export function useMemoryMenuItems(): MenuItemDef[] {
    const target = useFocusedTarget();
    const { resources: memories } = useResourcesForTarget(target.ownerType, target.ownerId, { type: 'memory' });
    const { createResource, deleteResource } = useResourceStore();

    return useMemo<MenuItemDef[]>(() => {
        // Build recent memories submenu (up to 5 most recent)
        const recentMemories: MenuItemDef[] = memories
            .filter(m => m.isActive)
            .sort((a, b) => new Date(b.accessedAt).getTime() - new Date(a.accessedAt).getTime())
            .slice(0, 5)
            .map(m => ({
                id: `mem-${m.id}`,
                label: m.name || m.content?.slice(0, 40) || 'Untitled',
                icon: m.isPinned ? Pin : Brain,
                action: () => {
                    // Select this memory in the resource store for viewing
                    useResourceStore.getState().selectResource(m);
                },
            }));

        return [
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

            // Dynamic memory items
            ...(recentMemories.length > 0 ? [
                ...recentMemories,
                { id: 'sep-memories', label: '', dividerAfter: true },
            ] : []),

            {
                id: 'add-to-memory',
                label: 'Add to Memory...',
                icon: Plus,
                shortcut: '⌘M',
                action: () => {
                    createResource({
                        resourceType: 'memory',
                        ownerType: target.ownerType,
                        ownerId: target.ownerId,
                        name: 'New Memory',
                        content: '',
                        typeMetadata: { type: 'memory', layer: 'long_term', importance: 0.7 },
                        tags: [],
                        provenance: 'user_input',
                    });
                },
            },
            {
                id: 'compact',
                label: 'Compact',
                icon: Minimize2,
                action: async () => {
                    try {
                        await fetch(`/api/resources/compile/${target.ownerType}/${target.ownerId}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ tokenBudget: 4000 }),
                        });
                    } catch (err) {
                        console.error('[MemoryMenu] Compact failed:', err);
                    }
                },
            },
            {
                id: 'clear-session',
                label: 'Clear Session',
                icon: Trash2,
                danger: true,
                action: async () => {
                    // Delete working memory resources for this target
                    const working = memories.filter(m =>
                        (m.typeMetadata as any)?.layer === 'working'
                    );
                    for (const m of working) {
                        await deleteResource(m.id);
                    }
                },
            },
            { id: 'sep-2', label: '', dividerAfter: true },
            {
                id: 'memory-settings',
                label: 'Memory Settings...',
                icon: Settings,
                action: () => console.log('Memory: Open Settings'),
            },
        ];
    }, [memories, target, createResource, deleteResource]);
}
