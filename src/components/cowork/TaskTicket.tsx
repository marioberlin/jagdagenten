/**
 * TaskTicket
 *
 * Rich task card for queue display with status, progress,
 * priority controls, and action buttons.
 */

import React, { useState, useCallback } from 'react';
import { motion, Reorder } from 'framer-motion';
import {
    GripVertical,
    Trash2,
    Clock,
    CheckCircle,
    XCircle,
    Loader2,
    Zap,
    Timer,
    Bot,
    Pause,
    ArrowUp,
    ArrowDown,
    Play,
    RotateCcw,
    ChevronUp,
    ChevronDown,
    MoreVertical,
    Edit3,
    Copy,
    AlertTriangle,
} from 'lucide-react';

export interface QueuedTask {
    id: string;
    title: string;
    description: string;
    status: 'queued' | 'active' | 'completed' | 'failed' | 'cancelled' | 'paused';
    priority: number;
    estimatedDuration?: string;
    progress?: number;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    error?: string;
    agentName?: string;
    subtaskCount?: number;
    completedSubtasks?: number;
}

interface TaskTicketProps {
    task: QueuedTask;
    isDraggable?: boolean;
    isExpanded?: boolean;
    onExpand?: () => void;
    onRemove?: (taskId: string) => void;
    onPriorityChange?: (taskId: string, direction: 'up' | 'down') => void;
    onRetry?: (taskId: string) => void;
    onPause?: (taskId: string) => void;
    onResume?: (taskId: string) => void;
    onDuplicate?: (taskId: string) => void;
    onEdit?: (taskId: string) => void;
    compact?: boolean;
}

const statusConfig: Record<QueuedTask['status'], {
    icon: React.ReactNode;
    bgColor: string;
    textColor: string;
    label: string;
}> = {
    queued: {
        icon: <Clock size={14} />,
        bgColor: 'bg-white/10',
        textColor: 'text-white/60',
        label: 'Queued',
    },
    active: {
        icon: <Loader2 size={14} className="animate-spin" />,
        bgColor: 'bg-indigo-500/20',
        textColor: 'text-indigo-400',
        label: 'Running',
    },
    completed: {
        icon: <CheckCircle size={14} />,
        bgColor: 'bg-green-500/20',
        textColor: 'text-green-400',
        label: 'Completed',
    },
    failed: {
        icon: <XCircle size={14} />,
        bgColor: 'bg-red-500/20',
        textColor: 'text-red-400',
        label: 'Failed',
    },
    cancelled: {
        icon: <XCircle size={14} />,
        bgColor: 'bg-white/10',
        textColor: 'text-white/40',
        label: 'Cancelled',
    },
    paused: {
        icon: <Pause size={14} />,
        bgColor: 'bg-amber-500/20',
        textColor: 'text-amber-400',
        label: 'Paused',
    },
};

export const TaskTicket: React.FC<TaskTicketProps> = ({
    task,
    isDraggable = false,
    isExpanded = false,
    onExpand,
    onRemove,
    onPriorityChange,
    onRetry,
    onPause,
    onResume,
    onDuplicate,
    onEdit,
    compact = false,
}) => {
    const [showMenu, setShowMenu] = useState(false);
    const status = statusConfig[task.status];

    const formatTime = useCallback((date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return date.toLocaleDateString();
    }, []);

    const formatDuration = useCallback((start: Date, end?: Date) => {
        const endTime = end || new Date();
        const diff = endTime.getTime() - start.getTime();
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }, []);

    const handleMenuAction = useCallback((action: () => void) => {
        action();
        setShowMenu(false);
    }, []);

    const content = (
        <div
            className={`relative rounded-xl border transition-all duration-200
                       ${task.status === 'active'
                    ? 'bg-indigo-500/10 border-indigo-500/30 shadow-lg shadow-indigo-500/10'
                    : task.status === 'failed'
                        ? 'bg-red-500/5 border-red-500/20'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                }
                       ${compact ? 'p-2' : 'p-3'}`}
        >
            {/* Main Row */}
            <div className="flex items-center gap-3">
                {/* Drag Handle */}
                {isDraggable && task.status === 'queued' && (
                    <GripVertical
                        size={14}
                        className="text-white/30 flex-shrink-0 cursor-grab active:cursor-grabbing"
                    />
                )}

                {/* Status Icon */}
                <div className={`flex-shrink-0 p-1.5 rounded-lg ${status.bgColor}`}>
                    <span className={status.textColor}>{status.icon}</span>
                </div>

                {/* Task Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium truncate
                                        ${task.status === 'cancelled' ? 'text-white/40 line-through' : 'text-white/90'}`}>
                            {task.title}
                        </span>
                        {task.priority <= 3 && (
                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full
                                           bg-amber-500/20 text-amber-400 text-[10px] font-medium">
                                <Zap size={10} />
                                High
                            </span>
                        )}
                    </div>

                    {!compact && (
                        <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                            {task.estimatedDuration && (
                                <span className="flex items-center gap-1">
                                    <Timer size={10} />
                                    {task.estimatedDuration}
                                </span>
                            )}
                            {task.agentName && (
                                <span className="flex items-center gap-1">
                                    <Bot size={10} />
                                    {task.agentName}
                                </span>
                            )}
                            <span>{formatTime(task.createdAt)}</span>
                        </div>
                    )}
                </div>

                {/* Progress for Active */}
                {task.status === 'active' && task.progress !== undefined && (
                    <div className="w-20 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${task.progress}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                        <span className="text-xs text-indigo-400 font-medium">
                            {task.progress}%
                        </span>
                    </div>
                )}

                {/* Duration for Completed/Running */}
                {(task.status === 'completed' || task.status === 'active') && task.startedAt && (
                    <span className="text-xs text-white/30">
                        {formatDuration(task.startedAt, task.completedAt)}
                    </span>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1">
                    {/* Quick Actions based on status */}
                    {task.status === 'queued' && (
                        <>
                            {onPriorityChange && (
                                <>
                                    <button
                                        onClick={() => onPriorityChange(task.id, 'up')}
                                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                                        title="Move up"
                                        type="button"
                                    >
                                        <ArrowUp size={14} className="text-white/40" />
                                    </button>
                                    <button
                                        onClick={() => onPriorityChange(task.id, 'down')}
                                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                                        title="Move down"
                                        type="button"
                                    >
                                        <ArrowDown size={14} className="text-white/40" />
                                    </button>
                                </>
                            )}
                            {onRemove && (
                                <button
                                    onClick={() => onRemove(task.id)}
                                    className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                                    title="Remove"
                                    type="button"
                                >
                                    <Trash2 size={14} className="text-white/40 hover:text-red-400" />
                                </button>
                            )}
                        </>
                    )}

                    {task.status === 'active' && onPause && (
                        <button
                            onClick={() => onPause(task.id)}
                            className="p-1.5 rounded-lg hover:bg-amber-500/20 transition-colors"
                            title="Pause"
                            type="button"
                        >
                            <Pause size={14} className="text-white/40 hover:text-amber-400" />
                        </button>
                    )}

                    {task.status === 'paused' && onResume && (
                        <button
                            onClick={() => onResume(task.id)}
                            className="p-1.5 rounded-lg hover:bg-green-500/20 transition-colors"
                            title="Resume"
                            type="button"
                        >
                            <Play size={14} className="text-white/40 hover:text-green-400" />
                        </button>
                    )}

                    {task.status === 'failed' && onRetry && (
                        <button
                            onClick={() => onRetry(task.id)}
                            className="p-1.5 rounded-lg hover:bg-indigo-500/20 transition-colors"
                            title="Retry"
                            type="button"
                        >
                            <RotateCcw size={14} className="text-white/40 hover:text-indigo-400" />
                        </button>
                    )}

                    {/* Expand/Collapse */}
                    {onExpand && (
                        <button
                            onClick={onExpand}
                            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                            type="button"
                        >
                            {isExpanded ? (
                                <ChevronUp size={14} className="text-white/40" />
                            ) : (
                                <ChevronDown size={14} className="text-white/40" />
                            )}
                        </button>
                    )}

                    {/* More Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                            type="button"
                        >
                            <MoreVertical size={14} className="text-white/40" />
                        </button>

                        {showMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowMenu(false)}
                                />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    className="absolute right-0 top-full mt-1 z-20
                                              min-w-[140px] rounded-lg bg-[#1a1a2e]
                                              border border-white/10 shadow-xl py-1"
                                >
                                    {onEdit && (
                                        <button
                                            onClick={() => handleMenuAction(() => onEdit(task.id))}
                                            className="w-full flex items-center gap-2 px-3 py-2
                                                      text-sm text-white/70 hover:bg-white/10 transition-colors"
                                            type="button"
                                        >
                                            <Edit3 size={14} />
                                            Edit
                                        </button>
                                    )}
                                    {onDuplicate && (
                                        <button
                                            onClick={() => handleMenuAction(() => onDuplicate(task.id))}
                                            className="w-full flex items-center gap-2 px-3 py-2
                                                      text-sm text-white/70 hover:bg-white/10 transition-colors"
                                            type="button"
                                        >
                                            <Copy size={14} />
                                            Duplicate
                                        </button>
                                    )}
                                    {task.status === 'queued' && onRemove && (
                                        <button
                                            onClick={() => handleMenuAction(() => onRemove(task.id))}
                                            className="w-full flex items-center gap-2 px-3 py-2
                                                      text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                            type="button"
                                        >
                                            <Trash2 size={14} />
                                            Remove
                                        </button>
                                    )}
                                </motion.div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && !compact && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3 border-t border-white/5"
                >
                    {/* Description */}
                    <p className="text-sm text-white/60 mb-3">{task.description}</p>

                    {/* Error Message */}
                    {task.status === 'failed' && task.error && (
                        <div className="flex items-start gap-2 p-2 rounded-lg bg-red-500/10
                                       border border-red-500/20 mb-3">
                            <AlertTriangle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-red-400">{task.error}</p>
                        </div>
                    )}

                    {/* Subtask Progress */}
                    {task.subtaskCount !== undefined && task.subtaskCount > 0 && (
                        <div className="flex items-center gap-3 text-xs text-white/40">
                            <span>
                                Subtasks: {task.completedSubtasks || 0}/{task.subtaskCount}
                            </span>
                            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-white/30"
                                    style={{
                                        width: `${((task.completedSubtasks || 0) / task.subtaskCount) * 100}%`
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </motion.div>
            )}

            {/* Active Task Glow Effect */}
            {task.status === 'active' && (
                <motion.div
                    className="absolute inset-0 rounded-xl border-2 border-indigo-500/50 pointer-events-none"
                    animate={{
                        opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            )}
        </div>
    );

    // If draggable, wrap in Reorder.Item
    if (isDraggable && task.status === 'queued') {
        return (
            <Reorder.Item
                value={task}
                className="cursor-grab active:cursor-grabbing"
            >
                {content}
            </Reorder.Item>
        );
    }

    return content;
};

export default TaskTicket;
