import { useState, useCallback, useEffect } from 'react';
import type { Context } from '@/components/console/ContextCard';

interface ContextDetail extends Context {
    tasks: Array<{
        id: string;
        state: 'submitted' | 'working' | 'completed' | 'failed' | 'cancelled' | 'input-required';
        agent: string;
        timestamp: string;
        duration?: string;
        summary?: string;
    }>;
}

interface UseConsoleContextsOptions {
    autoRefresh?: boolean;
    refreshInterval?: number;
}

interface UseConsoleContextsResult {
    contexts: Context[];
    selectedContext: ContextDetail | null;
    isLoading: boolean;
    isLoadingDetail: boolean;
    error: string | null;

    // Actions
    refresh: () => Promise<void>;
    selectContext: (contextId: string | null) => Promise<void>;
    deleteContext: (contextId: string) => Promise<void>;

    // Search
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    filteredContexts: Context[];
}

/**
 * useConsoleContexts
 * 
 * Custom hook for managing console contexts with:
 * - Context list fetching
 * - Context detail loading (with tasks)
 * - Search/filtering
 * - Delete action
 */
export function useConsoleContexts(options: UseConsoleContextsOptions = {}): UseConsoleContextsResult {
    const { autoRefresh = false, refreshInterval = 30000 } = options;

    const [contexts, setContexts] = useState<Context[]>([]);
    const [selectedContext, setSelectedContext] = useState<ContextDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch all contexts
    const fetchContexts = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/admin/contexts');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            setContexts(data.contexts || []);
        } catch (err) {
            console.error('[useConsoleContexts] Failed to fetch:', err);
            setError('Failed to load contexts');

            // Mock data for development
            setContexts([
                { id: 'ctx-abc123', taskCount: 12, lastActivity: '5 min ago', agents: ['Crypto Advisor', 'Travel Planner'], createdAt: '2 hours ago', status: 'active' },
                { id: 'ctx-def456', taskCount: 3, lastActivity: '2 hours ago', agents: ['DocuMind'], createdAt: '1 day ago', status: 'idle' },
                { id: 'ctx-ghi789', taskCount: 8, lastActivity: '15 min ago', agents: ['Restaurant Finder', 'AI Researcher'], createdAt: '3 hours ago', status: 'active' },
                { id: 'ctx-jkl012', taskCount: 1, lastActivity: '1 day ago', agents: ['QA Agent'], createdAt: '1 day ago', status: 'archived' },
                { id: 'ctx-mno345', taskCount: 5, lastActivity: '30 min ago', agents: ['Crypto Advisor'], createdAt: '6 hours ago', status: 'idle' },
                { id: 'ctx-pqr678', taskCount: 2, lastActivity: '45 min ago', agents: ['Travel Planner', 'Restaurant Finder'], createdAt: '4 hours ago', status: 'active' },
            ]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch single context with tasks
    const selectContext = useCallback(async (contextId: string | null) => {
        if (!contextId) {
            setSelectedContext(null);
            return;
        }

        setIsLoadingDetail(true);
        try {
            const response = await fetch(`/api/admin/contexts/${contextId}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            setSelectedContext(data);
        } catch (err) {
            console.error('[useConsoleContexts] Failed to fetch context detail:', err);

            // Mock data for development
            const ctx = contexts.find(c => c.id === contextId);
            if (ctx) {
                setSelectedContext({
                    ...ctx,
                    tasks: [
                        { id: 'task-001', state: 'completed', agent: 'Crypto Advisor', timestamp: '2 min ago', duration: '1.2s', summary: 'Analyzed market trends for BTC/USDT' },
                        { id: 'task-002', state: 'completed', agent: 'Crypto Advisor', timestamp: '4 min ago', duration: '0.8s', summary: 'Retrieved top 5 gainers' },
                        { id: 'task-003', state: 'working', agent: 'Travel Planner', timestamp: '5 min ago', summary: 'Planning trip to Tokyo' },
                        { id: 'task-004', state: 'failed', agent: 'DocuMind', timestamp: '10 min ago', duration: '2.5s', summary: 'Document processing failed' },
                    ],
                });
            }
        } finally {
            setIsLoadingDetail(false);
        }
    }, [contexts]);

    // Delete a context
    const deleteContext = useCallback(async (contextId: string) => {
        try {
            const response = await fetch(`/api/admin/contexts/${contextId}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            // Remove from local state
            setContexts(prev => prev.filter(c => c.id !== contextId));

            // Clear selection if deleted context was selected
            if (selectedContext?.id === contextId) {
                setSelectedContext(null);
            }
        } catch (err) {
            console.error('[useConsoleContexts] Failed to delete context:', err);
            setError('Failed to delete context');

            // In dev mode, remove anyway for demo
            setContexts(prev => prev.filter(c => c.id !== contextId));
            if (selectedContext?.id === contextId) {
                setSelectedContext(null);
            }
        }
    }, [selectedContext]);

    // Filtered contexts based on search
    const filteredContexts = contexts.filter(ctx =>
        ctx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ctx.agents.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Refresh function
    const refresh = useCallback(async () => {
        await fetchContexts();
    }, [fetchContexts]);

    // Fetch on mount
    useEffect(() => {
        fetchContexts();
    }, [fetchContexts]);

    // Auto-refresh
    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(fetchContexts, refreshInterval);
        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval, fetchContexts]);

    return {
        contexts,
        selectedContext,
        isLoading,
        isLoadingDetail,
        error,
        refresh,
        selectContext,
        deleteContext,
        searchQuery,
        setSearchQuery,
        filteredContexts,
    };
}
