import { motion } from 'framer-motion';
import { Eye, RotateCcw, X as XIcon, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { GlassContainer } from '@/components/primitives/GlassContainer';
import { GlassButton } from '@/components/primitives/GlassButton';
import { GlassChip } from '@/components/primitives/GlassChip';
import { GlassSkeleton } from '@/components/feedback/GlassSkeleton';
import { cn } from '@/utils/cn';
import type { TaskState } from './TaskFilters';

export interface Task {
    id: string;
    contextId: string;
    state: TaskState;
    agent: string;
    createdAt: string;
    updatedAt: string;
    duration?: string;
    artifactCount: number;
}

interface TaskTableProps {
    tasks: Task[];
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onViewTask: (taskId: string) => void;
    onRetryTask?: (taskId: string) => void;
    onCancelTask?: (taskId: string) => void;
    isLoading?: boolean;
}

const STATE_COLORS: Record<TaskState, string> = {
    'submitted': 'bg-blue-500/20 text-blue-400',
    'working': 'bg-yellow-500/20 text-yellow-400',
    'completed': 'bg-green-500/20 text-green-400',
    'failed': 'bg-red-500/20 text-red-400',
    'cancelled': 'bg-gray-500/20 text-gray-400',
    'input-required': 'bg-purple-500/20 text-purple-400',
};

// Skeleton row for loading state
function SkeletonRow() {
    return (
        <tr className="border-b border-white/5">
            <td className="px-4 py-3"><GlassSkeleton width={80} height={20} className="rounded" /></td>
            <td className="px-4 py-3"><GlassSkeleton width={70} height={24} className="rounded-full" /></td>
            <td className="px-4 py-3"><GlassSkeleton width={100} height={16} className="rounded" /></td>
            <td className="px-4 py-3"><GlassSkeleton width={60} height={16} className="rounded" /></td>
            <td className="px-4 py-3"><GlassSkeleton width={70} height={16} className="rounded" /></td>
            <td className="px-4 py-3"><GlassSkeleton width={40} height={16} className="rounded" /></td>
            <td className="px-4 py-3"><GlassSkeleton width={24} height={24} className="rounded" /></td>
            <td className="px-4 py-3"><GlassSkeleton width={60} height={24} className="rounded" /></td>
        </tr>
    );
}

/**
 * TaskTable
 * 
 * Data table component for displaying tasks with:
 * - Sortable columns (future)
 * - Row actions (view, retry, cancel)
 * - Pagination
 * - Skeleton loading state
 */
export function TaskTable({
    tasks,
    currentPage,
    totalPages,
    onPageChange,
    onViewTask,
    onRetryTask,
    onCancelTask,
    isLoading = false,
}: TaskTableProps) {

    if (isLoading) {
        return (
            <GlassContainer className="overflow-hidden" border>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase tracking-wider">ID</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase tracking-wider">Status</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase tracking-wider">Agent</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase tracking-wider">Context</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase tracking-wider">Created</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase tracking-wider">Duration</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase tracking-wider">Artifacts</th>
                                <th className="text-right px-4 py-3 text-xs font-medium text-white/60 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
                        </tbody>
                    </table>
                </div>
            </GlassContainer>
        );
    }

    if (tasks.length === 0) {
        return (
            <GlassContainer className="p-8" border>
                <div className="flex flex-col items-center justify-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                        <ExternalLink className="w-8 h-8 text-white/20" />
                    </div>
                    <p className="text-white/60 text-sm">No tasks found</p>
                    <p className="text-white/40 text-xs">Try adjusting your filters</p>
                </div>
            </GlassContainer>
        );
    }

    return (
        <GlassContainer className="overflow-hidden" border>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase tracking-wider">ID</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase tracking-wider">Status</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase tracking-wider">Agent</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase tracking-wider">Context</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase tracking-wider">Created</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase tracking-wider">Duration</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase tracking-wider">Artifacts</th>
                            <th className="text-right px-4 py-3 text-xs font-medium text-white/60 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {tasks.map((task, idx) => (
                            <motion.tr
                                key={task.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                className="hover:bg-white/5 transition-colors cursor-pointer"
                                onClick={() => onViewTask(task.id)}
                            >
                                <td className="px-4 py-3">
                                    <code className="text-xs bg-white/10 px-2 py-1 rounded text-white/80">
                                        {task.id.length > 12 ? `${task.id.slice(0, 12)}...` : task.id}
                                    </code>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', STATE_COLORS[task.state])}>
                                        {task.state}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-white/80">{task.agent}</td>
                                <td className="px-4 py-3">
                                    <code className="text-xs text-white/60">
                                        {task.contextId.length > 8 ? `${task.contextId.slice(0, 8)}...` : task.contextId}
                                    </code>
                                </td>
                                <td className="px-4 py-3 text-sm text-white/60">{task.createdAt}</td>
                                <td className="px-4 py-3 text-sm text-white/60">{task.duration || '-'}</td>
                                <td className="px-4 py-3">
                                    {task.artifactCount > 0 ? (
                                        <GlassChip size="sm">{task.artifactCount}</GlassChip>
                                    ) : (
                                        <span className="text-white/40">-</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                            onClick={() => onViewTask(task.id)}
                                            title="View Details"
                                        >
                                            <Eye size={14} />
                                        </button>
                                        {task.state === 'failed' && onRetryTask && (
                                            <button
                                                className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                                onClick={() => onRetryTask(task.id)}
                                                title="Retry Task"
                                            >
                                                <RotateCcw size={14} />
                                            </button>
                                        )}
                                        {task.state === 'working' && onCancelTask && (
                                            <button
                                                className="p-1.5 rounded hover:bg-red-500/20 text-white/60 hover:text-red-400 transition-colors"
                                                onClick={() => onCancelTask(task.id)}
                                                title="Cancel Task"
                                            >
                                                <XIcon size={14} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
                <p className="text-sm text-white/60">
                    Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                    <GlassButton
                        variant="ghost"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => onPageChange(currentPage - 1)}
                    >
                        <ChevronLeft size={16} />
                        Prev
                    </GlassButton>
                    <GlassButton
                        variant="ghost"
                        size="sm"
                        disabled={currentPage === totalPages}
                        onClick={() => onPageChange(currentPage + 1)}
                    >
                        Next
                        <ChevronRight size={16} />
                    </GlassButton>
                </div>
            </div>
        </GlassContainer>
    );
}
