/**
 * GlassSmartDashboard
 * 
 * A generative dashboard component for analytics and data visualization.
 * Listens for the 'generate_dashboard' tool.
 */

import { LiquidSmartComponent } from '../../liquid-engine/react';
import { GlassContainer } from '../primitives/GlassContainer';
import { GlassCard } from '../data-display/GlassCard';
// import { GlassMetric } from '../data-display/GlassMetric';
import { cn } from '@/utils/cn';

interface Widget {
    id: string;
    type: 'metric' | 'chart' | 'table' | 'list' | 'progress' | 'status';
    title: string;
    span?: number; // Grid column span (1-4)
    config?: Record<string, unknown>;
    data?: Record<string, unknown>;
}

interface DashboardConfig {
    title?: string;
    subtitle?: string;
    layout?: 'grid' | 'masonry' | 'bento';
    columns?: number;
    widgets: Widget[];
    refreshInterval?: number;
}

export function GlassSmartDashboard() {
    return (
        <LiquidSmartComponent
            name="generate_dashboard"
            render={({ status, args }) => {
                const isLoading = status === 'running';

                const config: DashboardConfig = {
                    title: args.title || 'Dashboard',
                    subtitle: args.subtitle,
                    layout: args.layout || 'bento',
                    columns: args.columns || 4,
                    widgets: args.widgets || args.items || [],
                    refreshInterval: args.refreshInterval,
                };

                const gridCols = {
                    grid: `grid-cols-${config.columns || 4}`,
                    bento: 'grid-cols-4',
                    masonry: 'columns-4',
                };

                const defaultWidgets: Widget[] = [
                    { id: 'w1', type: 'metric', title: 'Total Users', span: 1, data: { value: '12,345', trend: '+12%' } },
                    { id: 'w2', type: 'metric', title: 'Revenue', span: 1, data: { value: '$45,678', trend: '+8%' } },
                    { id: 'w3', type: 'metric', title: 'Conversion', span: 1, data: { value: '3.42%', trend: '-2%' } },
                    { id: 'w4', type: 'metric', title: 'Active Now', span: 1, data: { value: '892', trend: '+15%' } },
                    { id: 'w5', type: 'chart', title: 'Weekly Overview', span: 2, data: { type: 'bar', points: Array.from({ length: 7 }, (_, i) => ({ x: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i], y: Math.floor(Math.random() * 100) })) } },
                    { id: 'w6', type: 'list', title: 'Recent Activity', span: 2, data: { items: ['New user signup', 'Purchase completed', 'Settings updated', 'Password reset'] } },
                ];

                const widgets = config.widgets.length > 0 ? config.widgets : defaultWidgets;

                return (
                    <GlassContainer className="w-full">
                        {/* Header */}
                        <div className="mb-6">
                            {isLoading && !config.title ? (
                                <div className="space-y-2">
                                    <div className="h-7 w-48 bg-white/10 rounded animate-pulse" />
                                    <div className="h-4 w-32 bg-white/5 rounded animate-pulse" />
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-2xl font-bold text-white">{config.title}</h2>
                                    {config.subtitle && (
                                        <p className="text-sm text-secondary mt-1">{config.subtitle}</p>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Widget Grid */}
                        <div className={cn(
                            'grid gap-4',
                            config.layout === 'masonry' ? 'columns-4 space-y-4' : gridCols[config.layout as keyof typeof gridCols] || 'grid-cols-4'
                        )}>
                            {isLoading && widgets.length === 0 ? (
                                // Loading skeleton
                                Array.from({ length: 6 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="bg-white/5 rounded-xl p-4 animate-pulse"
                                        style={{ gridColumn: `span ${(i % 3) + 1}` }}
                                    >
                                        <div className="h-4 w-24 bg-white/10 rounded mb-3" />
                                        <div className="h-8 w-32 bg-white/10 rounded" />
                                    </div>
                                ))
                            ) : (
                                widgets.map((widget) => (
                                    <div
                                        key={widget.id}
                                        className={cn(
                                            'break-inside-avoid',
                                            config.layout !== 'masonry' && `col-span-${widget.span || 1}`
                                        )}
                                    >
                                        <GlassCard className="h-full p-4">
                                            {/* Widget Header */}
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-sm font-medium text-secondary">{widget.title}</h3>
                                                {widget.type === 'metric' && !!(widget.data?.trend) && (
                                                    <span className={cn(
                                                        'text-xs px-2 py-0.5 rounded-full',
                                                        String(widget.data.trend).startsWith('+')
                                                            ? 'bg-green-500/20 text-green-400'
                                                            : 'bg-red-500/20 text-red-400'
                                                    )}>
                                                        {String(widget.data.trend)}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Widget Content */}
                                            <div className="min-h-[60px]">
                                                {widget.type === 'metric' && (
                                                    <div className="text-3xl font-bold text-white">
                                                        {String(widget.data?.value || '--')}
                                                    </div>
                                                )}

                                                {widget.type === 'chart' && (
                                                    <div className="h-20 flex items-end gap-1">
                                                        {(widget.data?.points as Array<{ x: string; y: number }>)?.map((point, i) => (
                                                            <div
                                                                key={i}
                                                                className="flex-1 bg-primary/60 rounded-t"
                                                                style={{ height: `${(point.y / 100) * 100}%` }}
                                                            />
                                                        ))}
                                                    </div>
                                                )}

                                                {widget.type === 'list' && (
                                                    <ul className="space-y-1">
                                                        {(widget.data?.items as string[])?.slice(0, 4).map((item, i) => (
                                                            <li key={i} className="text-sm text-secondary flex items-center gap-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                                {item}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}

                                                {widget.type === 'progress' && (
                                                    <div>
                                                        <div className="flex justify-between text-xs text-secondary mb-1">
                                                            <span>Progress</span>
                                                            <span>{String(widget.data?.value || '0')}%</span>
                                                        </div>
                                                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-primary rounded-full transition-all"
                                                                style={{ width: `${String(widget.data?.value || 0)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {widget.type === 'status' && (
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn(
                                                            'w-2 h-2 rounded-full',
                                                            widget.data?.status === 'online' ? 'bg-green-500' :
                                                                widget.data?.status === 'warning' ? 'bg-yellow-500' :
                                                                    'bg-red-500'
                                                        )} />
                                                        <span className="text-sm text-secondary capitalize">
                                                            {String(widget.data?.status || 'unknown')}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </GlassCard>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Refresh indicator */}
                        {config.refreshInterval && (
                            <div className="mt-4 pt-4 border-t border-glass-border flex items-center justify-between text-xs text-secondary/60">
                                <span>Auto-refreshes every {config.refreshInterval}s</span>
                                <span className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    Live
                                </span>
                            </div>
                        )}
                    </GlassContainer>
                );
            }}
        />
    );
}
