/**
 * TaskQueuePanel
 *
 * Multi-task queue management panel.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
    Play,
    Pause,
    Plus,
    GripVertical,
    Trash2,
    Clock,
    CheckCircle,
    XCircle,
    Loader2,
    ChevronDown,
    ChevronUp
} from 'lucide-react';

interface QueuedTask {
    id: string;
    title: string;
    description: string;
    status: 'queued' | 'active' | 'completed' | 'failed' | 'cancelled';
    priority: number;
    estimatedDuration?: string;
    progress?: number;
    createdAt: Date;
}

interface TaskQueuePanelProps {
    isExpanded?: boolean;
    onToggleExpand?: () => void;
}

export const TaskQueuePanel: React.FC<TaskQueuePanelProps> = ({
    isExpanded = true,
    onToggleExpand
}) => {
    const [tasks, setTasks] = useState<QueuedTask[]>([]);
    const [isPaused, setIsPaused] = useState(false);
    const [newTaskInput, setNewTaskInput] = useState('');
    const [showAddTask, setShowAddTask] = useState(false);

    const queuedCount = tasks.filter(t => t.status === 'queued').length;
    const activeCount = tasks.filter(t => t.status === 'active').length;
    const completedCount = tasks.filter(t => t.status === 'completed').length;

    const handleAddTask = async () => {
        if (!newTaskInput.trim()) return;

        const newTask: QueuedTask = {
            id: `queue_${Date.now()}`,
            title: newTaskInput.slice(0, 60),
            description: newTaskInput,
            status: 'queued',
            priority: tasks.length + 1,
            createdAt: new Date()
        };

        setTasks([...tasks, newTask]);
        setNewTaskInput('');
        setShowAddTask(false);
    };

    const handleRemoveTask = (taskId: string) => {
        setTasks(tasks.filter(t => t.id !== taskId));
    };

    const handleReorder = (reorderedTasks: QueuedTask[]) => {
        // Only allow reordering of queued tasks
        const active = tasks.filter(t => t.status === 'active');
        const completed = tasks.filter(t => ['completed', 'failed', 'cancelled'].includes(t.status));
        const queued = reorderedTasks.filter(t => t.status === 'queued');

        setTasks([...active, ...queued, ...completed]);
    };

    const handleStartQueue = () => {
        setIsPaused(false);
        // Start processing queue...
    };

    const handlePauseQueue = () => {
        setIsPaused(true);
    };

    const getStatusIcon = (status: QueuedTask['status']) => {
        switch (status) {
            case 'queued':
                return <Clock size={14} className="text-white/40" />;
            case 'active':
                return <Loader2 size={14} className="text-indigo-400 animate-spin" />;
            case 'completed':
                return <CheckCircle size={14} className="text-green-400" />;
            case 'failed':
                return <XCircle size={14} className="text-red-400" />;
            default:
                return <Clock size={14} className="text-white/40" />;
        }
    };

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
                    <span className="text-sm font-medium text-white/70">
                        Task Queue
                    </span>
                    <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                            {queuedCount} queued
                        </span>
                        {activeCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400">
                                {activeCount} active
                            </span>
                        )}
                        {completedCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                                {completedCount} done
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
                                {isPaused ? (
                                    <button
                                        onClick={handleStartQueue}
                                        className="flex items-center gap-2 px-3 py-1.5
                                                   rounded-lg bg-green-500/20 text-green-400
                                                   text-sm hover:bg-green-500/30 transition-colors"
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
                                                           text-white text-sm disabled:opacity-50"
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
                                <div className="text-center py-6 text-sm text-white/30">
                                    No tasks in queue. Add a task to get started.
                                </div>
                            ) : (
                                <Reorder.Group
                                    axis="y"
                                    values={tasks}
                                    onReorder={handleReorder}
                                    className="space-y-2"
                                >
                                    {tasks.map((task) => (
                                        <Reorder.Item
                                            key={task.id}
                                            value={task}
                                            className="flex items-center gap-3 p-3 rounded-lg
                                                       bg-white/5 border border-white/5
                                                       hover:border-white/10 transition-colors
                                                       cursor-grab active:cursor-grabbing"
                                        >
                                            <GripVertical
                                                size={14}
                                                className="text-white/30 flex-shrink-0"
                                            />
                                            {getStatusIcon(task.status)}
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm text-white/90 truncate">
                                                    {task.title}
                                                </div>
                                                {task.progress !== undefined && task.status === 'active' && (
                                                    <div className="h-1 bg-white/10 rounded-full mt-1.5
                                                                    overflow-hidden">
                                                        <div
                                                            className="h-full bg-indigo-500"
                                                            style={{ width: `${task.progress}%` }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            {task.status === 'queued' && (
                                                <button
                                                    onClick={() => handleRemoveTask(task.id)}
                                                    className="p-1.5 rounded-lg hover:bg-white/10
                                                               transition-colors"
                                                    type="button"
                                                >
                                                    <Trash2 size={14} className="text-white/40" />
                                                </button>
                                            )}
                                        </Reorder.Item>
                                    ))}
                                </Reorder.Group>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TaskQueuePanel;
