import { useState, useCallback, useEffect } from 'react';
import type { TaskFiltersState, TaskState } from '@/components/console/TaskFilters';
import type { Task } from '@/components/console/TaskTable';

interface UseConsoleTasksOptions {
    initialFilters?: Partial<TaskFiltersState>;
    pageSize?: number;
    autoRefresh?: boolean;
    refreshInterval?: number;
}

interface UseConsoleTasksResult {
    // Data
    tasks: Task[];
    totalTasks: number;
    currentPage: number;
    totalPages: number;

    // Filters
    filters: TaskFiltersState;
    setFilters: (filters: TaskFiltersState) => void;

    // Pagination
    setPage: (page: number) => void;

    // Agents (for filter dropdown)
    agents: string[];

    // Loading states
    isLoading: boolean;
    isRefreshing: boolean;
    error: string | null;

    // Actions
    refresh: () => Promise<void>;
    retryTask: (taskId: string) => Promise<void>;
    cancelTask: (taskId: string) => Promise<void>;
}

const DEFAULT_FILTERS: TaskFiltersState = {
    searchQuery: '',
    statusFilter: 'all',
    agentFilter: 'all',
    dateRange: 'all',
};

/**
 * useConsoleTasks
 * 
 * Custom hook for managing task data with:
 * - Filtering (status, agent, date range, search)
 * - Pagination
 * - Auto-refresh
 * - Task actions (retry, cancel)
 */
export function useConsoleTasks(options: UseConsoleTasksOptions = {}): UseConsoleTasksResult {
    const {
        initialFilters = {},
        pageSize = 20,
        autoRefresh = false,
        refreshInterval = 30000,
    } = options;

    // State
    const [tasks, setTasks] = useState<Task[]>([]);
    const [totalTasks, setTotalTasks] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState<TaskFiltersState>({
        ...DEFAULT_FILTERS,
        ...initialFilters,
    });
    const [agents, setAgents] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Build query params from filters
    const buildQueryParams = useCallback(() => {
        const params = new URLSearchParams({
            page: currentPage.toString(),
            limit: pageSize.toString(),
        });

        if (filters.statusFilter !== 'all') {
            params.set('state', filters.statusFilter);
        }
        if (filters.agentFilter !== 'all') {
            params.set('agent', filters.agentFilter);
        }
        if (filters.dateRange !== 'all') {
            params.set('dateRange', filters.dateRange);
        }
        if (filters.searchQuery) {
            params.set('search', filters.searchQuery);
        }

        return params.toString();
    }, [currentPage, pageSize, filters]);

    // Fetch tasks from API
    const fetchTasks = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }
        setError(null);

        try {
            const response = await fetch(`/api/admin/tasks?${buildQueryParams()}`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            setTasks(data.tasks || []);
            setTotalTasks(data.total || 0);
            setTotalPages(data.totalPages || 1);

            // Extract unique agents for filter dropdown
            if (data.agents) {
                setAgents(data.agents);
            }
        } catch (err) {
            console.error('[useConsoleTasks] Failed to fetch:', err);
            setError('Failed to load tasks');

            // Fallback to mock data for development
            setTasks(getMockTasks(filters));
            setTotalTasks(25);
            setTotalPages(5);
            setAgents(['Crypto Advisor', 'Travel Planner', 'DocuMind', 'Restaurant Finder', 'AI Researcher']);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [buildQueryParams, filters]);

    // Refresh function
    const refresh = useCallback(async () => {
        await fetchTasks(true);
    }, [fetchTasks]);

    // Retry a failed task
    const retryTask = useCallback(async (taskId: string) => {
        try {
            const response = await fetch(`/api/admin/tasks/${taskId}/retry`, {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            // Refresh the task list
            await refresh();
        } catch (err) {
            console.error('[useConsoleTasks] Failed to retry task:', err);
            setError('Failed to retry task');
        }
    }, [refresh]);

    // Cancel a running task
    const cancelTask = useCallback(async (taskId: string) => {
        try {
            const response = await fetch(`/api/admin/tasks/${taskId}/cancel`, {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            // Refresh the task list
            await refresh();
        } catch (err) {
            console.error('[useConsoleTasks] Failed to cancel task:', err);
            setError('Failed to cancel task');
        }
    }, [refresh]);

    // Set page with bounds checking
    const setPage = useCallback((page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    }, [totalPages]);

    // Fetch on mount and when filters/page changes
    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    // Auto-refresh
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            fetchTasks(true);
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval, fetchTasks]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filters.statusFilter, filters.agentFilter, filters.dateRange, filters.searchQuery]);

    return {
        tasks,
        totalTasks,
        currentPage,
        totalPages,
        filters,
        setFilters,
        setPage,
        agents,
        isLoading,
        isRefreshing,
        error,
        refresh,
        retryTask,
        cancelTask,
    };
}

// Mock data generator for development
function getMockTasks(filters: TaskFiltersState): Task[] {
    const allTasks: Task[] = [
        { id: 'task-001', contextId: 'ctx-abc', state: 'completed', agent: 'Crypto Advisor', createdAt: '2 min ago', updatedAt: '1 min ago', duration: '1.2s', artifactCount: 2 },
        { id: 'task-002', contextId: 'ctx-def', state: 'working', agent: 'Travel Planner', createdAt: '5 min ago', updatedAt: '5 min ago', artifactCount: 0 },
        { id: 'task-003', contextId: 'ctx-abc', state: 'failed', agent: 'DocuMind', createdAt: '12 min ago', updatedAt: '10 min ago', duration: '2.5s', artifactCount: 0 },
        { id: 'task-004', contextId: 'ctx-ghi', state: 'completed', agent: 'Restaurant Finder', createdAt: '15 min ago', updatedAt: '14 min ago', duration: '0.8s', artifactCount: 1 },
        { id: 'task-005', contextId: 'ctx-jkl', state: 'input-required', agent: 'AI Researcher', createdAt: '20 min ago', updatedAt: '18 min ago', artifactCount: 0 },
        { id: 'task-006', contextId: 'ctx-mno', state: 'completed', agent: 'Crypto Advisor', createdAt: '25 min ago', updatedAt: '24 min ago', duration: '0.9s', artifactCount: 1 },
        { id: 'task-007', contextId: 'ctx-pqr', state: 'cancelled', agent: 'Travel Planner', createdAt: '30 min ago', updatedAt: '28 min ago', artifactCount: 0 },
        { id: 'task-008', contextId: 'ctx-stu', state: 'submitted', agent: 'DocuMind', createdAt: '35 min ago', updatedAt: '35 min ago', artifactCount: 0 },
    ];

    // Apply filters
    let filtered = allTasks;

    if (filters.statusFilter !== 'all') {
        filtered = filtered.filter(t => t.state === filters.statusFilter);
    }

    if (filters.agentFilter !== 'all') {
        filtered = filtered.filter(t => t.agent === filters.agentFilter);
    }

    if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filtered = filtered.filter(t =>
            t.id.toLowerCase().includes(query) ||
            t.agent.toLowerCase().includes(query) ||
            t.contextId.toLowerCase().includes(query)
        );
    }

    return filtered;
}
