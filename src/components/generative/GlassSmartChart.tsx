/**
 * GlassSmartChart
 * 
 * A generative chart component for data visualization.
 * Listens for the 'generate_chart' tool.
 */

import { LiquidSmartComponent } from '../../liquid-engine/react';
import { GlassContainer } from '../primitives/GlassContainer';
// import { GlassChart } from '../data-display/GlassChart';
import { cn } from '@/utils/cn';

interface DataPoint {
    x: number | string;
    y: number;
    label?: string;
}

interface ChartConfig {
    type: 'line' | 'bar' | 'area' | 'donut';
    title?: string;
    xLabel?: string;
    yLabel?: string;
    colors?: string[];
    showLegend?: boolean;
    animated?: boolean;
}

export function GlassSmartChart() {
    return (
        <LiquidSmartComponent
            name="generate_chart"
            render={({ status, args }) => {
                const isLoading = status === 'running';

                const config: ChartConfig = {
                    type: args.type || 'line',
                    title: args.title || 'Chart',
                    xLabel: args.xLabel || '',
                    yLabel: args.yLabel || '',
                    colors: args.colors || ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'],
                    showLegend: args.showLegend !== false,
                    animated: args.animated !== false,
                };

                const data: DataPoint[] = args.data || args.points || Array.from({ length: 7 }, (_, i) => ({
                    x: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
                    y: Math.floor(Math.random() * 100) + 20,
                }));

                // Calculate min/max for scaling
                const values = data.map(d => d.y);
                const minValue = Math.min(...values);
                const maxValue = Math.max(...values);
                const padding = (maxValue - minValue) * 0.1;

                return (
                    <GlassContainer className="w-full">
                        {isLoading && !args.title ? (
                            <div className="animate-pulse space-y-3">
                                <div className="h-6 w-32 bg-white/10 rounded" />
                                <div className="h-48 bg-white/5 rounded" />
                            </div>
                        ) : (
                            <>
                                {/* Title */}
                                {config.title && (
                                    <h3 className="text-lg font-semibold text-white mb-4">
                                        {config.title}
                                    </h3>
                                )}

                                {/* Chart Area */}
                                <div className="relative h-48 w-full">
                                    {/* Y-axis labels */}
                                    <div className="absolute left-0 top-0 bottom-8 w-10 flex flex-col justify-between text-xs text-secondary/60">
                                        <span>{maxValue + padding}</span>
                                        <span>{Math.round((maxValue + minValue) / 2)}</span>
                                        <span>{minValue - padding}</span>
                                    </div>

                                    {/* Chart body */}
                                    <div className="absolute left-10 right-0 top-0 bottom-8 flex items-end gap-1">
                                        {data.map((point, i) => {
                                            const height = ((point.y - minValue + padding) / (maxValue - minValue + padding * 2)) * 100;
                                            const color = config.colors?.[i % config.colors.length] || config.colors?.[0];

                                            return (
                                                <div
                                                    key={i}
                                                    className="flex-1 flex flex-col items-center gap-1"
                                                >
                                                    {/* Tooltip on hover */}
                                                    <div className="group relative flex-1 w-full flex items-end">
                                                        <div
                                                            className={cn(
                                                                'w-full rounded-t transition-all duration-300',
                                                                isLoading ? 'opacity-50' : 'opacity-90 hover:opacity-100',
                                                                config.type === 'bar' ? 'h-full' : 'h-0'
                                                            )}
                                                            style={{
                                                                height: `${height}%`,
                                                                backgroundColor: color,
                                                            }}
                                                        />
                                                        {/* Area chart fill */}
                                                        {config.type === 'area' && (
                                                            <div
                                                                className="absolute bottom-0 left-0 right-0 opacity-20"
                                                                style={{
                                                                    height: `${height}%`,
                                                                    background: `linear-gradient(to top, ${color}, transparent)`,
                                                                }}
                                                            />
                                                        )}
                                                        {/* Line chart dot */}
                                                        {(config.type === 'line' || config.type === 'area') && (
                                                            <div
                                                                className={cn(
                                                                    'absolute w-3 h-3 rounded-full -top-1.5 left-1/2 -translate-x-1/2',
                                                                    isLoading ? 'opacity-50' : 'opacity-100'
                                                                )}
                                                                style={{ backgroundColor: color }}
                                                            />
                                                        )}

                                                        {/* Tooltip */}
                                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                            {point.label || point.x}: {point.y}
                                                        </div>
                                                    </div>

                                                    {/* X-axis label */}
                                                    <span className="text-[10px] text-secondary/60 truncate w-full text-center">
                                                        {point.x}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Legend */}
                                {config.showLegend && config.colors && (
                                    <div className="flex flex-wrap gap-3 mt-4 justify-center">
                                        {data.slice(0, 4).map((point, i) => (
                                            <div key={i} className="flex items-center gap-1.5">
                                                <div
                                                    className="w-3 h-3 rounded-sm"
                                                    style={{ backgroundColor: (config.colors || [])[i % (config.colors?.length || 1)] || 'var(--color-primary)' }}
                                                />
                                                <span className="text-xs text-secondary">
                                                    {point.label || point.x}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Metrics summary */}
                                {args.showSummary !== false && (
                                    <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-glass-border">
                                        <div className="text-center">
                                            <p className="text-xs text-secondary">Avg</p>
                                            <p className="text-sm font-medium text-white">
                                                {Math.round(values.reduce((a, b) => a + b, 0) / values.length)}
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-secondary">Max</p>
                                            <p className="text-sm font-medium text-green-400">
                                                {maxValue}
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-secondary">Min</p>
                                            <p className="text-sm font-medium text-red-400">
                                                {minValue}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </GlassContainer>
                );
            }}
        />
    );
}
