/**
 * Performance Comparison Page
 * Side-by-side comparison of optimization strategies
 */
import { useMemo } from 'react';
import { GlassContainer } from '../components/primitives/GlassContainer';
import { GlassLineChartOptimized, ChartComparisonDemo } from '../components/data-display/GlassLineChartOptimized';
import { GlassDataTableVirtual, DataTableComparisonDemo } from '../components/data-display/GlassDataTableVirtual';
import { GlassButton } from '../components/primitives/GlassButton';

const PerformanceComparison = () => {
    // Sample data for charts
    const chartData = useMemo(() => {
        return Array.from({ length: 100 }, (_, i) => ({
            timestamp: Math.floor(Date.now() / 1000) - (100 - i) * 3600,
            value: 1000 + Math.sin(i / 10) * 500 + Math.random() * 200
        }));
    }, []);

    // Sample data for table (1000 rows)
    const tableData = useMemo(() => {
        return Array.from({ length: 1000 }, (_, i) => ({
            id: i + 1,
            name: `Item ${i + 1}`,
            status: ['Active', 'Pending', 'Inactive', 'Completed'][i % 4],
            value: Math.floor(Math.random() * 100000),
            date: new Date(Date.now() - i * 86400000).toLocaleDateString(),
            category: ['Electronics', 'Clothing', 'Food', 'Sports'][i % 4]
        }));
    }, []);

    const columns = [
        { key: 'id', header: 'ID', width: 80 },
        { key: 'name', header: 'Name', width: 150 },
        { key: 'status', header: 'Status', width: 100 },
        { key: 'value', header: 'Value', width: 100, render: (item: Record<string, unknown>) => `$${(item.value as number).toLocaleString()}` },
        { key: 'date', header: 'Date', width: 120 },
        { key: 'category', header: 'Category', width: 120 },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <GlassContainer material="regular" className="p-8">
                    <h1 className="text-3xl font-bold mb-4">Performance Optimization Comparison</h1>
                    <p className="text-secondary mb-4">
                        Comparing bundle sizes and performance between different implementation strategies.
                    </p>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                        <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                            <div className="text-green-400 font-semibold">SVG Charts</div>
                            <div className="text-2xl mt-1">~2KB</div>
                        </div>
                        <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                            <div className="text-yellow-400 font-semibold">uPlot</div>
                            <div className="text-2xl mt-1">~25KB</div>
                        </div>
                        <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                            <div className="text-red-400 font-semibold">Chart.js</div>
                            <div className="text-2xl mt-1">~400KB</div>
                        </div>
                        <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <div className="text-blue-400 font-semibold">Virtual Table</div>
                            <div className="text-2xl mt-1">~12KB</div>
                        </div>
                    </div>
                </GlassContainer>

                {/* Chart Comparison */}
                <GlassContainer material="regular" className="p-8">
                    <h2 className="text-xl font-semibold mb-4">Chart Bundle Size Comparison</h2>
                    <p className="text-secondary mb-6">
                        The existing GlassChart is already SVG-based and lightweight (~2KB).
                        No need to replace it with Chart.js or uPlot for basic charts.
                    </p>
                    <ChartComparisonDemo />
                </GlassContainer>

                {/* DataTable Comparison */}
                <GlassContainer material="regular" className="p-8">
                    <h2 className="text-xl font-semibold mb-4">DataTable Virtualization Comparison</h2>
                    <p className="text-secondary mb-6">
                        Comparison of standard table vs virtualized table with 1000 rows.
                        Virtualization only renders visible rows, dramatically improving performance.
                    </p>
                    <DataTableComparisonDemo rows={1000} />
                </GlassContainer>

                {/* Live Demo Section */}
                <GlassContainer material="regular" className="p-8">
                    <h2 className="text-xl font-semibold mb-4">Live Demos</h2>

                    {/* Optimized Chart Live Demo */}
                    <div className="mb-8">
                        <h3 className="text-lg font-medium mb-3">Optimized Line Chart (100 data points)</h3>
                        <GlassLineChartOptimized
                            data={chartData.map(d => d.value)}
                            labels={chartData.map((_, i) => `H${i}`)}
                            height={300}
                            color="#60a5fa"
                            animated
                        />
                    </div>

                    {/* Virtualized Table Live Demo */}
                    <div>
                        <h3 className="text-lg font-medium mb-3">Virtualized DataTable (1000 rows)</h3>
                        <GlassDataTableVirtual
                            data={tableData}
                            columns={columns}
                            height={400}
                            searchable
                        />
                    </div>
                </GlassContainer>

                {/* Recommendations */}
                <GlassContainer material="regular" className="p-8">
                    <h2 className="text-xl font-semibold mb-4">Recommendations</h2>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                            <div className="text-green-400 text-xl">✓</div>
                            <div>
                                <h4 className="font-medium">Keep GlassChart (SVG)</h4>
                                <p className="text-sm text-secondary mt-1">
                                    The existing GlassChart is already optimized at ~2KB. Perfect for basic line/bar charts.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                            <div className="text-yellow-400 text-xl">!</div>
                            <div>
                                <h4 className="font-medium">Keep Chart.js for SmartAnalytics only</h4>
                                <p className="text-sm text-secondary mt-1">
                                    Chart.js is needed in SmartAnalytics.tsx for complex features (crosshair, annotations, multi-axis).
                                    Consider refactoring if those features aren't essential.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <div className="text-blue-400 text-xl">i</div>
                            <div>
                                <h4 className="font-medium">Use GlassDataTableVirtual for large datasets</h4>
                                <p className="text-sm text-secondary mt-1">
                                    For tables with 100+ rows, use the virtualized version. Smooth scrolling, better performance.
                                </p>
                            </div>
                        </div>
                    </div>
                </GlassContainer>

                {/* Navigation */}
                <div className="flex justify-center gap-4">
                    <GlassButton variant="primary" onClick={() => window.location.href = '/showcase'}>
                        Back to Showcase
                    </GlassButton>
                    <GlassButton variant="secondary" onClick={() => window.location.href = '/'}>
                        Home
                    </GlassButton>
                </div>
            </div>
        </div>
    );
};

export default PerformanceComparison;
