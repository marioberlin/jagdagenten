import { useState, useCallback, useEffect, useRef } from 'react';
import { TaskFilters, TaskTable, TaskDetailSheet } from '@/components/console';
import type { TaskFiltersState, ViewMode } from '@/components/console';
import { useConsoleTasks } from '@/hooks/useConsoleTasks';
import { useToast } from '@/components/feedback/GlassToast';
import { useAdminWebSocket } from '@/hooks/useAdminWebSocket';

/**
 * TasksTab
 * 
 * Full task explorer with filtering, sorting, pagination, and detail view.
 * Uses the extracted TaskFilters, TaskTable, and TaskDetailSheet components.
 * Auto-refreshes via WebSocket on task state changes.
 */
export function TasksTab() {
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const { toast } = useToast();
    const errorShownRef = useRef<string | null>(null);

    const {
        tasks,
        currentPage,
        totalPages,
        filters,
        setFilters,
        setPage,
        agents,
        isLoading,
        error,
        refresh,
        retryTask,
        cancelTask,
    } = useConsoleTasks({
        autoRefresh: true,
        refreshInterval: 30000,
    });

    // WebSocket auto-refresh on task changes
    const { isConnected, subscribe } = useAdminWebSocket();

    useEffect(() => {
        const unsubscribe = subscribe(
            ['task:retried', 'task:canceled', 'task:completed', 'task:failed', 'task:updated'],
            (event) => {
                // Refresh task list when we get a real-time update
                refresh();
                toast(`Task ${event.type.split(':')[1]}`, 'info', 2000);
            }
        );
        return unsubscribe;
    }, [subscribe, refresh, toast]);

    const handleFiltersChange = (newFilters: TaskFiltersState) => {
        setFilters(newFilters);
    };

    const handleViewTask = (taskId: string) => {
        setSelectedTaskId(taskId);
    };

    const handleCloseDetail = () => {
        setSelectedTaskId(null);
    };

    const handleRetryTask = useCallback(async (taskId: string) => {
        try {
            await retryTask(taskId);
            toast('Task retry initiated', 'success');
        } catch {
            toast('Failed to retry task', 'error');
        }
    }, [retryTask, toast]);

    const handleCancelTask = useCallback(async (taskId: string) => {
        try {
            await cancelTask(taskId);
            toast('Task cancelled', 'success');
        } catch {
            toast('Failed to cancel task', 'error');
        }
    }, [cancelTask, toast]);

    // Show error toast when error state changes (avoid duplicates)
    useEffect(() => {
        if (error && error !== errorShownRef.current) {
            toast(error, 'error');
            errorShownRef.current = error;
        }
    }, [error, toast]);

    return (
        <div className="space-y-6">
            {/* Connection indicator */}
            {!isConnected && (
                <div className="text-xs text-yellow-400/70 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                    Connecting to real-time updates...
                </div>
            )}

            {/* Filters Bar */}
            <TaskFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                agents={agents}
            />

            {/* Task Table */}
            <TaskTable
                tasks={tasks}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setPage}
                onViewTask={handleViewTask}
                onRetryTask={handleRetryTask}
                onCancelTask={handleCancelTask}
                isLoading={isLoading}
            />

            {/* Task Detail Sheet */}
            <TaskDetailSheet
                taskId={selectedTaskId}
                onClose={handleCloseDetail}
                onRetry={handleRetryTask}
                onCancel={handleCancelTask}
            />
        </div>
    );
}

