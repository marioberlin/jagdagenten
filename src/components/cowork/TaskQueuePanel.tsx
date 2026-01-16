/**
 * TaskQueuePanel
 *
 * Multi-task queue management panel with drag-and-drop reordering.
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
    Play,
    Pause,
    Plus,
    ChevronDown,
    ChevronUp,
    ListOrdered,
    Zap,
} from 'lucide-react';
import { TaskTicket, type QueuedTask } from './TaskTicket';

interface TaskQueuePanelProps {
    isExpanded?: boolean;
    onToggleExpand?: () => void;
    initialTasks?: QueuedTask[];
    onTasksChange?: (tasks: QueuedTask[]) => void;
}

export const TaskQueuePanel: React.FC<TaskQueuePanelProps> = ({
    isExpanded = true,
    onToggleExpand,
    initialTasks = [],
    onTasksChange,
}) => {
    const [tasks, setTasks] = useState<QueuedTask[]>(initialTasks);
    const [isPaused, setIsPaused] = useState(false);
    const [newTaskInput, setNewTaskInput] = useState('');
    const [showAddTask, setShowAddTask] = useState(false);
    const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

    const queuedCount = tasks.filter(t => t.status === 'queued').length;
    const activeCount = tasks.filter(t => t.status === 'active').length;
    const completedCount = tasks.filter(t => t.status === 'completed').length;
    const failedCount = tasks.filter(t => t.status === 'failed').length;

    const updateTasks = useCallback((newTasks: QueuedTask[]) => {
        setTasks(newTasks);
        onTasksChange?.(newTasks);
    }, [onTasksChange]);

    const handleAddTask = useCallback(async () => {
        if (!newTaskInput.trim()) return;

        const newTask: QueuedTask = {
            id: `queue_${Date.now()}`,
            title: newTaskInput.slice(0, 60),
            description: newTaskInput,
            status: 'queued',
            priority: tasks.length + 1,
            createdAt: new Date()
        };

        updateTasks([...tasks, newTask]);
        setNewTaskInput('');
        setShowAddTask(false);
    }, [newTaskInput, tasks, updateTasks]);

    const handleRemoveTask = useCallback((taskId: string) => {
        updateTasks(tasks.filter(t => t.id !== taskId));
    }, [tasks, updateTasks]);

    const handleReorder = useCallback((reorderedTasks: QueuedTask[]) => {
        // Only allow reordering of queued tasks
        const active = tasks.filter(t => t.status === 'active');
        const completed = tasks.filter(t => ['completed', 'failed', 'cancelled'].includes(t.status));
        const queued = reorderedTasks.filter(t => t.status === 'queued');

        // Update priorities
        const updatedQueued = queued.map((task, index) => ({
            ...task,
            priority: index + 1,
        }));

        updateTasks([...active, ...updatedQueued, ...completed]);
    }, [tasks, updateTasks]);

    const handlePriorityChange = useCallback((taskId: string, direction: 'up' | 'down') => {
        const queuedTasks = tasks.filter(t => t.status === 'queued');
        const taskIndex = queuedTasks.findIndex(t => t.id === taskId);

        if (taskIndex === -1) return;
        if (direction === 'up' && taskIndex === 0) return;
        if (direction === 'down' && taskIndex === queuedTasks.length - 1) return;

        const newIndex = direction === 'up' ? taskIndex - 1 : taskIndex + 1;
        const newQueued = [...queuedTasks];
        [newQueued[taskIndex], newQueued[newIndex]] = [newQueued[newIndex], newQueued[taskIndex]];

        handleReorder(newQueued);
    }, [tasks, handleReorder]);

    const handleRetry = useCallback((taskId: string) => {
        updateTasks(tasks.map(t =>
            t.id === taskId ? { ...t, status: 'queued' as const, error: undefined } : t
        ));
    }, [tasks, updateTasks]);

    const handlePauseTask = useCallback((taskId: string) => {
        updateTasks(tasks.map(t =>
            t.id === taskId ? { ...t, status: 'paused' as const } : t
        ));
    }, [tasks, updateTasks]);

    const handleResumeTask = useCallback((taskId: string) => {
        updateTasks(tasks.map(t =>
            t.id === taskId ? { ...t, status: 'active' as const } : t
        ));
    }, [tasks, updateTasks]);

    const handleDuplicate = useCallback((taskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        const newTask: QueuedTask = {
            ...task,
            id: `queue_${Date.now()}`,
            status: 'queued',
            priority: tasks.length + 1,
            createdAt: new Date(),
            startedAt: undefined,
            completedAt: undefined,
            progress: undefined,
            error: undefined,
        };

        updateTasks([...tasks, newTask]);
    }, [tasks, updateTasks]);

    const handleStartQueue = useCallback(() => {
        setIsPaused(false);
        // Start processing queue - would connect to backend
    }, []);

    const handlePauseQueue = useCallback(() => {
        setIsPaused(true);
        // Pause queue processing - would connect to backend
    }, []);

    // Separate tasks by status for proper display order
    const activeTasks = tasks.filter(t => t.status === 'active');
    const pausedTasks = tasks.filter(t => t.status === 'paused');
    const queuedTasks = tasks.filter(t => t.status === 'queued');
    const completedTasks = tasks.filter(t => ['completed', 'failed', 'cancelled'].includes(t.status));

    return (
        <div className="border-t border-white/10">
            {/* Header */}
            <button
                onClick={onToggleExpand}
                className="w-full flex items-center justify-between px-4 py-3
                           hover:bg-white/5 transition-colors"
                type="button"
            >
                <div className="flex items-center gap-3">
                    <ListOrdered size={16} className="text-white/50" />
                    <span className="text-sm font-medium text-white/70">
                        Task Queue
                    </span>
                    <div className="flex items-center gap-2 text-xs">
                        {queuedCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                                {queuedCount} queued
                            </span>
                        )}
                        {activeCount > 0 && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full
                                           bg-indigo-500/20 text-indigo-400">
                                <Zap size={10} />
                                {activeCount} active
                            </span>
                        )}
                        {completedCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                                {completedCount} done
                            </span>
                        )}
                        {failedCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                                {failedCount} failed
                            </span>
                        )}
                    </div>
                </div>
                {isExpanded ? (
                    <ChevronDown size={16} className="text-white/40" />
                ) : (
                    <ChevronUp size={16} className="text-white/40" />
                )}
            </button>

            {/* Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 space-y-3">
                            {/* Queue Controls */}
                            <div className="flex items-center gap-2">
                                {isPaused || queuedCount === 0 ? (
                                    <button
                                        onClick={handleStartQueue}
                                        disabled={queuedCount === 0}
                                        className="flex items-center gap-2 px-3 py-1.5
                                                   rounded-lg bg-green-500/20 text-green-400
                                                   text-sm hover:bg-green-500/30 transition-colors
                                                   disabled:opacity-50 disabled:cursor-not-allowed"
                                        type="button"
                                    >
                                        <Play size={14} />
                                        Start Queue
                                    </button>
                                ) : (
                                    <button
                                        onClick={handlePauseQueue}
                                        className="flex items-center gap-2 px-3 py-1.5
                                                   rounded-lg bg-amber-500/20 text-amber-400
                                                   text-sm hover:bg-amber-500/30 transition-colors"
                                        type="button"
                                    >
                                        <Pause size={14} />
                                        Pause Queue
                                    </button>
                                )}

                                <button
                                    onClick={() => setShowAddTask(!showAddTask)}
                                    className="flex items-center gap-2 px-3 py-1.5
                                               rounded-lg bg-white/5 text-white/60
                                               text-sm hover:bg-white/10 transition-colors ml-auto"
                                    type="button"
                                >
                                    <Plus size={14} />
                                    Add Task
                                </button>
                            </div>

                            {/* Add Task Input */}
                            <AnimatePresence>
                                {showAddTask && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newTaskInput}
                                                onChange={(e) => setNewTaskInput(e.target.value)}
                                                placeholder="Describe the task..."
                                                className="flex-1 px-3 py-2 rounded-lg
                                                           bg-white/5 border border-white/10
                                                           text-sm text-white outline-none
                                                           focus:border-indigo-500/50"
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                                            />
                                            <button
                                                onClick={handleAddTask}
                                                disabled={!newTaskInput.trim()}
                                                className="px-4 py-2 rounded-lg bg-indigo-500
                                                           text-white text-sm disabled:opacity-50
                                                           hover:bg-indigo-600 transition-colors"
                                                type="button"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Task List */}
                            {tasks.length === 0 ? (
                                <div className="text-center py-8 text-sm text-white/30">
                                    <ListOrdered size={32} className="mx-auto mb-2 opacity-50" />
                                    No tasks in queue. Add a task to get started.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {/* Active Tasks */}
                                    {activeTasks.map((task) => (
                                        <TaskTicket
                                            key={task.id}
                                            task={task}
                                            isExpanded={expandedTaskId === task.id}
                                            onExpand={() => setExpandedTaskId(
                                                expandedTaskId === task.id ? null : task.id
                                            )}
                                            onPause={handlePauseTask}
                                            onDuplicate={handleDuplicate}
                                        />
                                    ))}

                                    {/* Paused Tasks */}
                                    {pausedTasks.map((task) => (
                                        <TaskTicket
                                            key={task.id}
                                            task={task}
                                            isExpanded={expandedTaskId === task.id}
                                            onExpand={() => setExpandedTaskId(
                                                expandedTaskId === task.id ? null : task.id
                                            )}
                                            onResume={handleResumeTask}
                                            onRemove={handleRemoveTask}
                                            onDuplicate={handleDuplicate}
                                        />
                                    ))}

                                    {/* Queued Tasks - Reorderable */}
                                    {queuedTasks.length > 0 && (
                                        <Reorder.Group
                                            axis="y"
                                            values={queuedTasks}
                                            onReorder={(newOrder) => handleReorder(newOrder)}
                                            className="space-y-2"
                                        >
                                            {queuedTasks.map((task) => (
                                                <TaskTicket
                                                    key={task.id}
                                                    task={task}
                                                    isDraggable
                                                    isExpanded={expandedTaskId === task.id}
                                                    onExpand={() => setExpandedTaskId(
                                                        expandedTaskId === task.id ? null : task.id
                                                    )}
                                                    onRemove={handleRemoveTask}
                                                    onPriorityChange={handlePriorityChange}
                                                    onDuplicate={handleDuplicate}
                                                />
                                            ))}
                                        </Reorder.Group>
                                    )}

                                    {/* Completed/Failed Tasks (collapsed by default) */}
                                    {completedTasks.length > 0 && (
                                        <div className="pt-2 border-t border-white/5">
                                            <div className="text-xs text-white/30 mb-2">
                                                Completed ({completedTasks.length})
                                            </div>
                                            {completedTasks.slice(0, 3).map((task) => (
                                                <TaskTicket
                                                    key={task.id}
                                                    task={task}
                                                    compact
                                                    isExpanded={expandedTaskId === task.id}
                                                    onExpand={() => setExpandedTaskId(
                                                        expandedTaskId === task.id ? null : task.id
                                                    )}
                                                    onRetry={task.status === 'failed' ? handleRetry : undefined}
                                                    onDuplicate={handleDuplicate}
                                                />
                                            ))}
                                            {completedTasks.length > 3 && (
                                                <div className="text-xs text-white/30 text-center py-2">
                                                    +{completedTasks.length - 3} more
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TaskQueuePanel;
