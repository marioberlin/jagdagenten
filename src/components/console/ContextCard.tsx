import { motion } from 'framer-motion';
import { MessageSquare, ChevronRight, Trash2, Clock, Users } from 'lucide-react';
import { GlassContainer } from '@/components/primitives/GlassContainer';
import { GlassChip } from '@/components/primitives/GlassChip';
import { GlassSkeleton } from '@/components/feedback/GlassSkeleton';
import { cn } from '@/utils/cn';

export interface Context {
    id: string;
    taskCount: number;
    lastActivity: string;
    agents: string[];
    createdAt: string;
    status?: 'active' | 'idle' | 'archived';
}

interface ContextCardProps {
    context: Context;
    isSelected?: boolean;
    onClick?: () => void;
    onView?: () => void;
    onDelete?: () => void;
    variant?: 'grid' | 'list';
    animationDelay?: number;
    isLoading?: boolean;
}

const STATUS_INDICATOR: Record<string, string> = {
    'active': 'bg-green-500',
    'idle': 'bg-yellow-500',
    'archived': 'bg-gray-500',
};

// Skeleton for grid layout
function SkeletonGridCard({ animationDelay = 0 }: { animationDelay?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: animationDelay }}
        >
            <GlassContainer className="p-4" border>
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <GlassSkeleton width={32} height={32} className="rounded-lg" />
                        <div className="space-y-1">
                            <GlassSkeleton width={100} height={14} className="rounded" />
                            <GlassSkeleton width={60} height={10} className="rounded" />
                        </div>
                    </div>
                    <GlassSkeleton width={50} height={20} className="rounded-full" />
                </div>
                <div className="space-y-2">
                    <div className="flex gap-1">
                        <GlassSkeleton width={60} height={20} className="rounded-full" />
                        <GlassSkeleton width={70} height={20} className="rounded-full" />
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                        <GlassSkeleton width={100} height={12} className="rounded" />
                        <GlassSkeleton width={50} height={20} className="rounded" />
                    </div>
                </div>
            </GlassContainer>
        </motion.div>
    );
}

// Skeleton for list layout
function SkeletonListCard({ animationDelay = 0 }: { animationDelay?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: animationDelay }}
        >
            <GlassContainer className="p-4" border>
                <div className="flex items-center gap-4">
                    <GlassSkeleton width={40} height={40} className="rounded-lg" />
                    <div className="flex-1 space-y-1">
                        <GlassSkeleton width={120} height={16} className="rounded" />
                        <GlassSkeleton width={100} height={12} className="rounded" />
                    </div>
                    <GlassSkeleton width={60} height={20} className="rounded-full" />
                    <GlassSkeleton width={50} height={24} className="rounded" />
                </div>
            </GlassContainer>
        </motion.div>
    );
}

/**
 * ContextCard
 * 
 * Card component for displaying a conversation context.
 * Supports grid and list layouts with actions for viewing and deleting.
 * Includes skeleton loading state.
 */
export function ContextCard({
    context,
    isSelected = false,
    onClick,
    onView,
    onDelete,
    variant = 'grid',
    animationDelay = 0,
    isLoading = false,
}: ContextCardProps) {
    // Show skeleton when loading
    if (isLoading) {
        return variant === 'list'
            ? <SkeletonListCard animationDelay={animationDelay} />
            : <SkeletonGridCard animationDelay={animationDelay} />;
    }

    const status = context.status || 'idle';

    if (variant === 'list') {
        return (
            <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: animationDelay }}
            >
                <GlassContainer
                    className={cn(
                        'p-4 cursor-pointer transition-all hover:bg-white/5',
                        isSelected && 'ring-2 ring-cyan-500/50'
                    )}
                    border
                    onClick={onClick}
                >
                    <div className="flex items-center gap-4">
                        {/* Icon */}
                        <div className="relative">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                <MessageSquare className="w-5 h-5 text-purple-400" />
                            </div>
                            <div className={cn(
                                'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-black/80',
                                STATUS_INDICATOR[status]
                            )} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <code className="text-sm text-white font-medium">{context.id}</code>
                                <GlassChip size="sm">{context.taskCount} tasks</GlassChip>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
                                <span className="flex items-center gap-1">
                                    <Clock size={12} />
                                    {context.lastActivity}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Users size={12} />
                                    {context.agents.length} agents
                                </span>
                            </div>
                        </div>

                        {/* Agents */}
                        <div className="hidden md:flex flex-wrap gap-1 max-w-[200px]">
                            {context.agents.slice(0, 2).map(agent => (
                                <span
                                    key={agent}
                                    className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-white/60"
                                >
                                    {agent}
                                </span>
                            ))}
                            {context.agents.length > 2 && (
                                <span className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-white/40">
                                    +{context.agents.length - 2}
                                </span>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                            <button
                                className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                onClick={onView}
                                title="View Context"
                            >
                                <ChevronRight size={16} />
                            </button>
                            <button
                                className="p-2 rounded-lg hover:bg-red-500/20 text-white/60 hover:text-red-400 transition-colors"
                                onClick={onDelete}
                                title="Delete Context"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                </GlassContainer>
            </motion.div>
        );
    }

    // Grid variant
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: animationDelay }}
        >
            <GlassContainer
                className={cn(
                    'p-4 cursor-pointer transition-all hover:scale-[1.02]',
                    isSelected && 'ring-2 ring-cyan-500/50'
                )}
                border
                onClick={onClick}
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                <MessageSquare className="w-4 h-4 text-purple-400" />
                            </div>
                            <div className={cn(
                                'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-black/80',
                                STATUS_INDICATOR[status]
                            )} />
                        </div>
                        <div>
                            <code className="text-sm text-white">{context.id}</code>
                            <p className="text-xs text-white/40">Created {context.createdAt}</p>
                        </div>
                    </div>
                    <GlassChip size="sm">
                        {context.taskCount} tasks
                    </GlassChip>
                </div>

                {/* Agents */}
                <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                        {context.agents.map(agent => (
                            <span
                                key={agent}
                                className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-white/60"
                            >
                                {agent}
                            </span>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                        <span className="text-xs text-white/40">Last activity: {context.lastActivity}</span>
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                            <button
                                className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                onClick={onView}
                                title="View Context"
                            >
                                <ChevronRight size={14} />
                            </button>
                            <button
                                className="p-1.5 rounded hover:bg-red-500/20 text-white/60 hover:text-red-400 transition-colors"
                                onClick={onDelete}
                                title="Delete Context"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </GlassContainer>
        </motion.div>
    );
}
