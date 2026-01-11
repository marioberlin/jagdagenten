/**
 * GlassSmartKanban
 * 
 * A generative kanban/board component for task management.
 * Listens for the 'generate_kanban' tool.
 */

import { LiquidSmartComponent } from '../../liquid-engine/react';
import { GlassContainer } from '../primitives/GlassContainer';
import { GlassCard } from '../data-display/GlassCard';
import { cn } from '@/utils/cn';

interface KanbanColumn {
    id: string;
    title: string;
    color?: string;
    cards: Array<{
        id: string;
        title: string;
        description?: string;
        tags?: string[];
        priority?: 'low' | 'medium' | 'high' | 'urgent';
        assignee?: string;
        dueDate?: string;
    }>;
}

interface KanbanConfig {
    title?: string;
    columns: KanbanColumn[];
    allowDrag?: boolean;
    showAddCard?: boolean;
}

export function GlassSmartKanban() {
    return (
        <LiquidSmartComponent
            name="generate_kanban"
            render={({ status, args }) => {
                const isLoading = status === 'running';

                const config: KanbanConfig = {
                    title: args.title || 'Kanban Board',
                    columns: args.columns || args.lists || [
                        {
                            id: 'col1',
                            title: 'To Do',
                            color: '#8b5cf6',
                            cards: [
                                { id: 'c1', title: 'Research competitor features', priority: 'medium', tags: ['research'] },
                                { id: 'c2', title: 'Draft product requirements', priority: 'high', tags: ['planning'] },
                            ],
                        },
                        {
                            id: 'col2',
                            title: 'In Progress',
                            color: '#f59e0b',
                            cards: [
                                { id: 'c3', title: 'Implement user authentication', priority: 'urgent', tags: ['backend', 'security'] },
                            ],
                        },
                        {
                            id: 'col3',
                            title: 'Review',
                            color: '#06b6d4',
                            cards: [
                                { id: 'c4', title: 'Code review: PR #42', priority: 'low', tags: ['frontend'] },
                            ],
                        },
                        {
                            id: 'col4',
                            title: 'Done',
                            color: '#10b981',
                            cards: [
                                { id: 'c5', title: 'Set up CI/CD pipeline', priority: 'medium', tags: ['devops'] },
                            ],
                        },
                    ],
                    allowDrag: args.allowDrag !== false,
                    showAddCard: args.showAddCard !== false,
                };

                const priorityColors = {
                    low: 'bg-gray-500/20 text-gray-400',
                    medium: 'bg-blue-500/20 text-blue-400',
                    high: 'bg-orange-500/20 text-orange-400',
                    urgent: 'bg-red-500/20 text-red-400',
                };

                return (
                    <GlassContainer className="w-full overflow-x-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            {isLoading && !config.title ? (
                                <div className="h-7 w-40 bg-white/10 rounded animate-pulse" />
                            ) : (
                                <h2 className="text-xl font-bold text-white">{config.title}</h2>
                            )}

                            <div className="flex items-center gap-2">
                                <span className="text-xs text-secondary">
                                    {config.columns.reduce((acc, col) => acc + col.cards.length, 0)} cards
                                </span>
                                {config.allowDrag && (
                                    <div className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">
                                        Drag enabled
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Board */}
                        <div className="flex gap-3 min-w-max pb-2">
                            {isLoading && config.columns.length === 0 ? (
                                // Loading skeleton
                                Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="w-72 flex-shrink-0">
                                        <div className="bg-white/5 rounded-xl p-3 animate-pulse">
                                            <div className="h-5 w-24 bg-white/10 rounded mb-3" />
                                            <div className="space-y-2">
                                                <div className="h-20 bg-white/10 rounded" />
                                                <div className="h-20 bg-white/10 rounded" />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                config.columns.map((column) => (
                                    <div
                                        key={column.id}
                                        className="w-72 flex-shrink-0"
                                    >
                                        {/* Column Header */}
                                        <div className="flex items-center justify-between mb-3 px-1">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: column.color || '#8b5cf6' }}
                                                />
                                                <h3 className="font-medium text-white">{column.title}</h3>
                                                <span className="text-xs text-secondary bg-white/10 px-1.5 py-0.5 rounded-full">
                                                    {column.cards.length}
                                                </span>
                                            </div>
                                            {config.showAddCard && (
                                                <button className="p-1 text-secondary hover:text-white hover:bg-white/10 rounded transition-colors">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>

                                        {/* Cards */}
                                        <div className="space-y-2">
                                            {column.cards.map((card) => (
                                                <GlassCard
                                                    key={card.id}
                                                    className="p-3 cursor-grab active:cursor-grabbing hover:bg-white/10 transition-colors"
                                                >
                                                    {/* Card Title */}
                                                    <h4 className="text-sm font-medium text-white mb-2">
                                                        {card.title}
                                                    </h4>

                                                    {/* Card Description */}
                                                    {card.description && (
                                                        <p className="text-xs text-secondary mb-2 line-clamp-2">
                                                            {card.description}
                                                        </p>
                                                    )}

                                                    {/* Card Footer */}
                                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-glass-border/50">
                                                        <div className="flex items-center gap-1">
                                                            {/* Priority */}
                                                            {card.priority && (
                                                                <span className={cn(
                                                                    'text-[10px] px-1.5 py-0.5 rounded',
                                                                    priorityColors[card.priority]
                                                                )}>
                                                                    {card.priority}
                                                                </span>
                                                            )}

                                                            {/* Tags */}
                                                            {card.tags?.map((tag) => (
                                                                <span
                                                                    key={tag}
                                                                    className="text-[10px] px-1.5 py-0.5 bg-white/10 text-secondary rounded"
                                                                >
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>

                                                        {/* Assignee/Due */}
                                                        <div className="flex items-center gap-2">
                                                            {card.assignee && (
                                                                <div className="w-5 h-5 rounded-full bg-primary/30 flex items-center justify-center text-[10px] text-primary font-medium">
                                                                    {card.assignee.charAt(0).toUpperCase()}
                                                                </div>
                                                            )}
                                                            {card.dueDate && (
                                                                <span className="text-[10px] text-secondary">
                                                                    {card.dueDate}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </GlassCard>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </GlassContainer>
                );
            }}
        />
    );
}
