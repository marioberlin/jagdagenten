import { Search, Filter, Grid3X3, LayoutList, Calendar, Users } from 'lucide-react';
import { GlassContainer } from '@/components/primitives/GlassContainer';
import { cn } from '@/utils/cn';

export type TaskState = 'submitted' | 'working' | 'completed' | 'failed' | 'cancelled' | 'input-required';
export type ViewMode = 'list' | 'grid';

export interface TaskFiltersState {
    searchQuery: string;
    statusFilter: TaskState | 'all';
    agentFilter: string | 'all';
    dateRange: 'all' | '1h' | '24h' | '7d' | '30d';
}

interface TaskFiltersProps {
    filters: TaskFiltersState;
    onFiltersChange: (filters: TaskFiltersState) => void;
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    agents?: string[];
}

const STATUS_OPTIONS: Array<TaskState | 'all'> = [
    'all', 'submitted', 'working', 'completed', 'failed', 'cancelled', 'input-required'
];

const DATE_OPTIONS: Array<{ value: TaskFiltersState['dateRange']; label: string }> = [
    { value: 'all', label: 'All Time' },
    { value: '1h', label: '1 Hour' },
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
];

/**
 * TaskFilters
 * 
 * Filter bar component for task explorer with:
 * - Search input
 * - Status chips
 * - Agent dropdown
 * - Date range selector
 * - View mode toggle
 */
export function TaskFilters({
    filters,
    onFiltersChange,
    viewMode,
    onViewModeChange,
    agents = []
}: TaskFiltersProps) {

    const updateFilter = <K extends keyof TaskFiltersState>(key: K, value: TaskFiltersState[K]) => {
        onFiltersChange({ ...filters, [key]: value });
    };

    return (
        <GlassContainer className="p-4" border>
            <div className="flex flex-wrap items-center gap-4">
                {/* Search */}
                <div className="flex-1 min-w-[200px] max-w-md relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                        type="text"
                        placeholder="Search tasks..."
                        value={filters.searchQuery}
                        onChange={(e) => updateFilter('searchQuery', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/50"
                    />
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-white/40" />
                    <div className="flex gap-1 flex-wrap">
                        {STATUS_OPTIONS.map((status) => (
                            <button
                                key={status}
                                onClick={() => updateFilter('statusFilter', status)}
                                className={cn(
                                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                                    filters.statusFilter === status
                                        ? 'bg-white/10 text-white'
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                )}
                            >
                                {status === 'all' ? 'All' : status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Agent Filter */}
                {agents.length > 0 && (
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-white/40" />
                        <select
                            value={filters.agentFilter}
                            onChange={(e) => updateFilter('agentFilter', e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                        >
                            <option value="all">All Agents</option>
                            {agents.map((agent) => (
                                <option key={agent} value={agent}>{agent}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Date Range */}
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-white/40" />
                    <div className="flex gap-1">
                        {DATE_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => updateFilter('dateRange', opt.value)}
                                className={cn(
                                    'px-2 py-1 rounded text-xs transition-all',
                                    filters.dateRange === opt.value
                                        ? 'bg-white/10 text-white'
                                        : 'text-white/50 hover:text-white hover:bg-white/5'
                                )}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 ml-auto">
                    <button
                        onClick={() => onViewModeChange('list')}
                        className={cn(
                            'p-2 rounded',
                            viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
                        )}
                    >
                        <LayoutList size={16} />
                    </button>
                    <button
                        onClick={() => onViewModeChange('grid')}
                        className={cn(
                            'p-2 rounded',
                            viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
                        )}
                    >
                        <Grid3X3 size={16} />
                    </button>
                </div>
            </div>
        </GlassContainer>
    );
}
