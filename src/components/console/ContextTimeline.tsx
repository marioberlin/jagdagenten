import { motion } from 'framer-motion';
import {
    CheckCircle,
    AlertCircle,
    Loader,
    Clock,
    MessageSquare,
    X,
    ArrowRight
} from 'lucide-react';
import { GlassContainer } from '@/components/primitives/GlassContainer';
import { GlassChip } from '@/components/primitives/GlassChip';
import { cn } from '@/utils/cn';

type TaskState = 'submitted' | 'working' | 'completed' | 'failed' | 'cancelled' | 'input-required';

interface TimelineTask {
    id: string;
    state: TaskState;
    agent: string;
    timestamp: string;
    duration?: string;
    summary?: string;
}

interface ContextTimelineProps {
    contextId: string;
    tasks: TimelineTask[];
    onTaskClick?: (taskId: string) => void;
    isLoading?: boolean;
}

const STATE_CONFIG: Record<TaskState, { icon: typeof CheckCircle; color: string; bg: string }> = {
    'submitted': { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    'working': { icon: Loader, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    'completed': { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20' },
    'failed': { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/20' },
    'cancelled': { icon: X, color: 'text-gray-400', bg: 'bg-gray-500/20' },
    'input-required': { icon: MessageSquare, color: 'text-purple-400', bg: 'bg-purple-500/20' },
};

/**
 * ContextTimeline
 * 
 * Vertical timeline visualization showing the sequence of tasks
 * within a conversation context.
 */
export function ContextTimeline({
    contextId,
    tasks,
    onTaskClick,
    isLoading = false
}: ContextTimelineProps) {
    if (isLoading) {
        return (
            <GlassContainer className="p-6" border>
                <div className="flex flex-col items-center justify-center gap-3">
                    <Loader className="w-6 h-6 text-cyan-500 animate-spin" />
                    <p className="text-white/60 text-sm">Loading timeline...</p>
                </div>
            </GlassContainer>
        );
    }

    if (tasks.length === 0) {
        return (
            <GlassContainer className="p-6" border>
                <div className="flex flex-col items-center justify-center gap-3">
                    <Clock className="w-8 h-8 text-white/20" />
                    <p className="text-white/60 text-sm">No tasks in this context</p>
                    <p className="text-white/40 text-xs">Context: {contextId}</p>
                </div>
            </GlassContainer>
        );
    }

    return (
        <GlassContainer className="p-4" border>
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <h3 className="text-white font-medium">Timeline</h3>
                <div className="flex items-center gap-2 text-xs text-white/50">
                    <span>{tasks.length} tasks</span>
                    <ArrowRight size={12} />
                    <code className="bg-white/10 px-2 py-0.5 rounded">{contextId.slice(0, 8)}</code>
                </div>
            </div>

            {/* Timeline */}
            <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/50 via-white/10 to-transparent" />

                {/* Tasks */}
                <div className="space-y-4">
                    {tasks.map((task, idx) => {
                        const config = STATE_CONFIG[task.state];
                        const Icon = config.icon;
                        const isLast = idx === tasks.length - 1;

                        return (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={cn(
                                    'relative flex items-start gap-4 pl-2',
                                    onTaskClick && 'cursor-pointer hover:bg-white/5 rounded-lg -ml-2 p-2'
                                )}
                                onClick={() => onTaskClick?.(task.id)}
                            >
                                {/* Icon Node */}
                                <div className={cn(
                                    'relative z-10 w-7 h-7 rounded-full flex items-center justify-center',
                                    config.bg
                                )}>
                                    <Icon
                                        size={14}
                                        className={cn(
                                            config.color,
                                            task.state === 'working' && 'animate-spin'
                                        )}
                                    />
                                </div>

                                {/* Content */}
                                <div className={cn('flex-1 pb-4', isLast && 'pb-0')}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-white text-sm font-medium">{task.agent}</span>
                                            <GlassChip
                                                size="sm"
                                                variant={task.state === 'completed' ? 'success' :
                                                    task.state === 'failed' ? 'destructive' : 'default'}
                                            >
                                                {task.state}
                                            </GlassChip>
                                        </div>
                                        <span className="text-xs text-white/40">{task.timestamp}</span>
                                    </div>

                                    {task.summary && (
                                        <p className="text-white/60 text-sm mt-1 line-clamp-2">
                                            {task.summary}
                                        </p>
                                    )}

                                    <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
                                        <code>{task.id.slice(0, 12)}</code>
                                        {task.duration && (
                                            <span className="flex items-center gap-1">
                                                <Clock size={10} />
                                                {task.duration}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </GlassContainer>
    );
}
