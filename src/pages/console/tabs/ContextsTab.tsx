import { useState, useCallback, useEffect, useRef } from 'react';
import { Search, Grid3X3, LayoutList, RefreshCw } from 'lucide-react';
import { GlassContainer } from '@/components/primitives/GlassContainer';
import { GlassButton } from '@/components/primitives/GlassButton';
import { ContextCard, ContextTimeline } from '@/components/console';
import { useConsoleContexts } from '@/hooks/useConsoleContexts';
import { useToast } from '@/components/feedback/GlassToast';
import { cn } from '@/utils/cn';

type ViewMode = 'grid' | 'list';

/**
 * ContextsTab
 * 
 * Browse and manage multi-turn conversation contexts with:
 * - Grid/List view
 * - Search filtering
 * - Context detail with timeline
 * - Toast notifications for actions
 */
export function ContextsTab() {
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const { toast } = useToast();
    const errorShownRef = useRef<string | null>(null);

    const {
        contexts,
        selectedContext,
        isLoading,
        isLoadingDetail,
        error,
        searchQuery,
        setSearchQuery,
        filteredContexts,
        selectContext,
        deleteContext,
        refresh,
    } = useConsoleContexts({ autoRefresh: true });

    const handleContextClick = (contextId: string) => {
        selectContext(selectedContext?.id === contextId ? null : contextId);
    };

    const handleDeleteContext = useCallback(async (contextId: string) => {
        try {
            await deleteContext(contextId);
            toast('Context deleted', 'success');
        } catch {
            toast('Failed to delete context', 'error');
        }
    }, [deleteContext, toast]);

    const handleRefresh = useCallback(async () => {
        await refresh();
        toast('Refreshed', 'info', 1500);
    }, [refresh, toast]);

    // Show error toast (avoid duplicates)
    useEffect(() => {
        if (error && error !== errorShownRef.current) {
            toast(error, 'error');
            errorShownRef.current = error;
        }
    }, [error, toast]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <GlassContainer className="p-4" border>
                <div className="flex flex-wrap items-center gap-4">
                    {/* Search */}
                    <div className="flex-1 min-w-[200px] max-w-md relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                            type="text"
                            placeholder="Search contexts or agents..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/50"
                        />
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-white/60">
                        <span>{contexts.length} contexts</span>
                        <span>{contexts.reduce((sum, c) => sum + c.taskCount, 0)} tasks</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-auto">
                        <GlassButton
                            variant="ghost"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={isLoading}
                        >
                            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                        </GlassButton>

                        {/* View Toggle */}
                        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={cn(
                                    'p-2 rounded',
                                    viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
                                )}
                            >
                                <Grid3X3 size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={cn(
                                    'p-2 rounded',
                                    viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
                                )}
                            >
                                <LayoutList size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </GlassContainer>

            {/* Main Content */}
            <div className={cn(
                'grid gap-6',
                selectedContext ? 'lg:grid-cols-[1fr,400px]' : ''
            )}>
                {/* Context Cards */}
                <div className={cn(
                    'grid gap-4',
                    viewMode === 'grid' && !selectedContext
                        ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                        : viewMode === 'grid'
                            ? 'grid-cols-1 md:grid-cols-2'
                            : 'grid-cols-1'
                )}>
                    {filteredContexts.map((context, idx) => (
                        <ContextCard
                            key={context.id}
                            context={context}
                            isSelected={selectedContext?.id === context.id}
                            onClick={() => handleContextClick(context.id)}
                            onView={() => selectContext(context.id)}
                            onDelete={() => handleDeleteContext(context.id)}
                            variant={viewMode}
                            animationDelay={idx * 0.05}
                            isLoading={isLoading}
                        />
                    ))}
                </div>

                {/* Timeline Panel */}
                {selectedContext && (
                    <div className="lg:sticky lg:top-4 lg:self-start">
                        <ContextTimeline
                            contextId={selectedContext.id}
                            tasks={selectedContext.tasks}
                            onTaskClick={(taskId) => console.log('View task:', taskId)}
                            isLoading={isLoadingDetail}
                        />
                    </div>
                )}
            </div>

            {/* Empty State */}
            {filteredContexts.length === 0 && !isLoading && (
                <div className="text-center py-12 text-white/40">
                    {searchQuery ? 'No contexts match your search' : 'No contexts found'}
                </div>
            )}
        </div>
    );
}
