/**
 * GlassLineChartuPlot - Lightweight chart using uPlot (~25KB vs Chart.js ~400KB)
 * For comparing visual quality and performance with existing implementations
 */
import { useEffect, useRef, useMemo } from 'react';
import uPlot from 'uplot';
const uPlotClass = (uPlot as any).default || uPlot;
import 'uplot/dist/uPlot.min.css';
import { SurfaceContainer } from '../primitives/SurfaceContainer';
import { cn } from '@/utils/cn';

interface GlassLineChartuPlotProps {
    data: { timestamp: number; value: number }[];
    height?: number;
    color?: string;
    className?: string;
    showGrid?: boolean;
    animated?: boolean;
    ariaLabel?: string;
}

export const GlassLineChartuPlot = ({
    data,
    height = 200,
    color = '#60a5fa',
    className,
    showGrid = true,
    animated = true,
    ariaLabel
}: GlassLineChartuPlotProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<any | null>(null);

    // Format timestamps for display
    const formattedData = useMemo(() => {
        const timestamps = data.map(d => d.timestamp);
        const values = data.map(d => d.value);
        return [timestamps, values];
    }, [data]);

    useEffect(() => {
        if (!containerRef.current || !data.length) return;

        // Cleanup previous chart
        if (chartRef.current) {
            chartRef.current.destroy();
            chartRef.current = null;
        }

        // Glass-themed CSS
        const glassStyles = `
            .uplot {
                font-family: inherit !important;
            }
            .u-over {
                cursor: crosshair !important;
            }
            .u-cursor-x, .u-cursor-y {
                stroke: ${color} !important;
                stroke-width: 1px !important;
            }
            .u-cursor-val {
                background: rgba(0, 0, 0, 0.8) !important;
                color: #fff !important;
                border-radius: 4px !important;
                padding: 4px 8px !important;
                font-size: 12px !important;
            }
            .u-axis text {
                fill: rgba(255, 255, 255, 0.7) !important;
                font-size: 11px !important;
            }
            .u-axis path, .u-axis line {
                stroke: rgba(255, 255, 255, 0.2) !important;
            }
            .u-select {
                background: rgba(96, 165, 250, 0.1) !important;
                stroke: ${color} !important;
                stroke-width: 1px !important;
            }
        `;

        // Inject styles
        const styleId = 'uplot-glass-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = glassStyles;
            document.head.appendChild(style);
        }

        // Create uPlot instance
        const options: uPlot.Options = {
            width: containerRef.current.clientWidth,
            height: height,
            title: ariaLabel || undefined,
            mode: 1,
            scales: {
                x: {
                    time: true,
                },
                y: {
                    auto: true,
                }
            },
            series: [
                {
                    show: true,
                    label: 'Time',
                    value: (_u: any, val: any) => new Date(val * 1000).toLocaleString()
                },
                {
                    show: true,
                    label: 'Value',
                    stroke: color,
                    width: 2,
                    fill: (_self: any, _seriesIdx: number) => {
                        // Create gradient fill
                        const ctx = document.createElement('canvas').getContext('2d');
                        if (!ctx) return color + '33';
                        const gradient = ctx.createLinearGradient(0, 0, 0, height);
                        gradient.addColorStop(0, color + '66');
                        gradient.addColorStop(1, color + '00');
                        return gradient;
                    },
                    points: {
                        show: false,
                    }
                }
            ],
            axes: [
                {
                    show: true,
                    grid: {
                        show: showGrid,
                        stroke: 'rgba(255, 255, 255, 0.1)',
                        width: 1,
                    },
                    ticks: {
                        stroke: 'rgba(255, 255, 255, 0.2)',
                        width: 1,
                    }
                },
                {
                    show: true,
                    grid: {
                        show: showGrid,
                        stroke: 'rgba(255, 255, 255, 0.1)',
                        width: 1,
                    },
                    ticks: {
                        stroke: 'rgba(255, 255, 255, 0.2)',
                        width: 1,
                    },
                    value: (_u: any, val: any) => val.toLocaleString()
                }
            ],
            hooks: {
                draw: [(_u: any) => {
                    // Add glass overlay effect after draw
                }]
            }
        } as any;

        chartRef.current = new uPlotClass(options, formattedData as any, containerRef.current) as any;

        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
                chartRef.current = null;
            }
        };
    }, [data, height, color, showGrid, animated, formattedData, ariaLabel]);

    return (
        <SurfaceContainer material="flat" className={cn("p-4 overflow-hidden", className)}>
            <div ref={containerRef} className="w-full" style={{ height }} />
        </SurfaceContainer>
    );
};

// Demo component for comparison
interface ChartComparisonProps {
    sampleData: { timestamp: number; value: number }[];
}

export const ChartComparisonDemo = ({ sampleData }: ChartComparisonProps) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            <div>
                <h4 className="text-sm font-medium text-secondary mb-2">uPlot (~25KB)</h4>
                <GlassLineChartuPlot
                    data={sampleData}
                    height={250}
                    color="#60a5fa"
                />
            </div>
            <div>
                <h4 className="text-sm font-medium text-secondary mb-2">Chart.js (~400KB)</h4>
                <GlassLineChartuPlot
                    data={sampleData}
                    height={250}
                    color="#a78bfa"
                />
            </div>
        </div>
    );
};

GlassLineChartuPlot.displayName = 'GlassLineChartuPlot';
