// import { useState } from 'react';
import { GlassContainer } from '@/components';
import { GlassBadge } from '@/components';
import { GlassAvatar } from '@/components';
import { GlassProgress } from '@/components';
import { GlassTable } from '@/components';
import { GlassDataTable } from '@/components';
// import { GlassChart } from '@/components';
import { GlassCarousel } from '@/components';
import { Zap, Bell } from 'lucide-react';
import { GlassButton } from '@/components';
import { GlassMetric } from '@/components';
import { GlassTimeline } from '@/components';
import { GlassFileTree } from '@/components';
import { GlassCode } from '@/components';
import { GlassCompare } from '@/components';
import { GlassKanban } from '@/components';
import { GlassDonutChart } from '@/components';
import { GlassStatus } from '@/components';
import { GlassMediaList } from '@/components';
import { GlassWeather } from '@/components';
import { GlassMiniPlayer } from '@/components';
import { GlassStatsBar } from '@/components';
// import { GlassMediaCard } from '@/components';
import { Activity, Terminal, FileText } from 'lucide-react';
// import {
//     GlassRadarChart,
//     GlassPolarAreaChart,
//     GlassStackedBarChart,
//     GlassHeatmap,
//     GlassTreemap,
//     GlassFunnelChart,
//     GlassCandlestickChart,
//     GlassScatterChart,
//     GlassGauge,
//     GlassSankey,
//     //     GlassSticky,
//     //     GlassInfiniteScroll,
//     // GlassCard
// } from '@/components';

export const ShowcaseDataDisplay = () => {
    // Infinite Scroll State
    // const [items, setItems] = useState(Array.from({ length: 10 }));
    // const [hasMore, setHasMore] = useState(true);

    // const loadMore = async () => {
    //     await new Promise(resolve => setTimeout(resolve, 1500));
    //     setItems(prev => [...prev, ...Array.from({ length: 5 })]);
    //     if (items.length > 30) setHasMore(false);
    // };

    return (
        <div className="space-y-8">
            {/* Avatars & Progress Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Avatars */}
                <GlassContainer className="p-8 rounded-3xl" border material="regular">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-purple-400">Data</span>
                            <h3 className="text-xl font-bold text-primary">Avatars</h3>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <GlassAvatar size="lg" src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800&auto=format&fit=crop&q=60" />
                        <GlassAvatar size="md" fallback="JD" />
                        <GlassAvatar size="sm" fallback="+" className="bg-white/10" />
                    </div>

                    <GlassCode
                        language="tsx"
                        showLineNumbers={false}
                        code={`<GlassAvatar size="lg" src="/avatar.jpg" />
<GlassAvatar size="md" fallback="JD" />
<GlassAvatar size="sm" fallback="+" />`}
                    />
                </GlassContainer>

                {/* Progress */}
                <GlassContainer className="p-8 rounded-3xl" border material="regular">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-purple-400">Data</span>
                            <h3 className="text-xl font-bold text-primary">Progress</h3>
                        </div>
                    </div>
                    <div className="space-y-4 mb-4">
                        <GlassProgress value={33} showLabel />
                        <GlassProgress value={66} className="text-accent" />
                        <GlassProgress value={90} className="h-2" />
                    </div>

                    <GlassCode
                        language="tsx"
                        showLineNumbers={false}
                        code={`<GlassProgress value={33} showLabel />
<GlassProgress value={66} className="text-accent" />
<GlassProgress value={90} className="h-2" />`}
                    />
                </GlassContainer>
            </div>

            {/* Table */}
            <GlassContainer id="tables" className="p-8 rounded-3xl" border material="regular">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-purple-400">Data</span>
                        <h3 className="text-xl font-bold text-primary">Table</h3>
                    </div>
                </div>
                <GlassTable
                    data={[
                        { id: 1, name: 'GlassButton.tsx', status: 'Completed', size: '2.4kb' },
                        { id: 2, name: 'GlassInput.tsx', status: 'Completed', size: '1.8kb' },
                        { id: 3, name: 'GlassTable.tsx', status: 'New', size: '3.1kb' },
                    ]}
                    keyField="id"
                    columns={[
                        { header: 'File', accessor: 'name', className: 'w-[40%]' },
                        {
                            header: 'Status', accessor: (row) => (
                                <GlassBadge variant={row.status === 'New' ? 'outline' : 'glass'} size="sm">
                                    {row.status}
                                </GlassBadge>
                            )
                        },
                        { header: 'Size', accessor: 'size', className: 'text-right' },
                    ]}
                />

                <GlassCode
                    className="mt-4"
                    language="tsx"
                    code={`<GlassTable
  data={[{ id: 1, name: 'File.tsx', status: 'Done', size: '2.4kb' }]}
  keyField="id"
  columns={[
    { header: 'File', accessor: 'name' },
    { header: 'Status', accessor: 'status' },
    { header: 'Size', accessor: 'size' },
  ]}
/>`}
                />
            </GlassContainer>

            {/* Infinite Scroll & Sticky */}
            <GlassContainer id="scroll" className="p-8 rounded-3xl" border material="regular">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-purple-400">Data</span>
                        <h3 className="text-xl font-bold text-primary">Infinite Scroll & Sticky</h3>
                    </div>
                </div>
                <div className="text-sm text-secondary mb-4">
                    Demonstrates a scrollable container with a sticky header and infinite loading capabilities.
                </div>
                <div className="relative h-[400px] overflow-auto border border-glass-border rounded-xl">
                    {/* <GlassSticky offsetTop={0} className="w-full z-10">
                        <div className="p-4 bg-glass-layer-2 backdrop-blur-md border-b border-glass-border font-bold text-primary">
                            Sticky Header (Scroll down)
                        </div>
                    </GlassSticky>

                    <GlassInfiniteScroll
                        hasMore={hasMore}
                        onLoadMore={loadMore}
                        className="p-4 space-y-4"
                    >
                        {items.map((_, i) => (
                            <GlassCard key={i} className="p-4 hover:scale-[1.01] transition-transform">
                                Item {i + 1}
                            </GlassCard>
                        ))}
                    </GlassInfiniteScroll> */}
                    <div className="p-4 rounded-xl border border-glass-border bg-glass-surface text-secondary text-center">
                        Component under development
                    </div>
                </div>
            </GlassContainer>

            {/* Data Architecture */}
            <GlassContainer className="p-8 rounded-3xl" border material="regular">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-purple-400">Data</span>
                        <h3 className="text-xl font-bold text-primary">Data Architecture</h3>
                    </div>
                    <GlassBadge variant="glass">New</GlassBadge>
                </div>
                <p className="text-sm text-secondary mb-6">
                    Enhanced table with sorting, search, pagination, and responsive card view for mobile.
                </p>
                <GlassDataTable
                    data={[
                        { id: 1, name: 'GlassButton.tsx', status: 'Completed', size: '2.4kb', updated: '2025-01-15' },
                        { id: 2, name: 'GlassInput.tsx', status: 'Completed', size: '1.8kb', updated: '2025-01-14' },
                        { id: 3, name: 'GlassDataTable.tsx', status: 'New', size: '8.2kb', updated: '2025-01-16' },
                        { id: 4, name: 'GlassTimePicker.tsx', status: 'New', size: '6.1kb', updated: '2025-01-16' },
                        { id: 5, name: 'GlassNumberInput.tsx', status: 'New', size: '4.5kb', updated: '2025-01-16' },
                        { id: 6, name: 'GlassModal.tsx', status: 'Completed', size: '3.2kb', updated: '2025-01-12' },
                    ]}
                    keyField="id"
                    columns={[
                        { header: 'File', accessor: 'name', width: 'w-[35%]' },
                        {
                            header: 'Status', accessor: (row) => (
                                <GlassBadge variant={row.status === 'New' ? 'outline' : 'glass'} size="sm">
                                    {row.status}
                                </GlassBadge>
                            )
                        },
                        { header: 'Size', accessor: 'size', className: 'text-right' },
                        { header: 'Updated', accessor: 'updated' },
                    ]}
                    searchable
                    searchPlaceholder="Search files..."
                    searchKeys={['name', 'status']}
                    pageSize={4}
                    responsive
                />

                <GlassCode
                    className="mt-4"
                    language="tsx"
                    code={`<GlassDataTable
  data={data}
  keyField="id"
  columns={columns}
  searchable
  searchPlaceholder="Search..."
  searchKeys={['name', 'status']}
  pageSize={4}
  responsive
/>`}
                />
            </GlassContainer>

            {/* Notification Card */}
            <div className="max-w-2xl">
                <GlassContainer className="p-6 rounded-3xl relative overflow-hidden group" interactive border material="thick">
                    <div className="absolute top-0 right-0 p-4 opacity-50">
                        <Zap size={100} className="text-yellow-500/10 rotate-12" />
                    </div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white mb-4 shadow-lg shadow-orange-500/20">
                            <Bell size={24} fill="currentColor" />
                        </div>
                        <h3 className="text-lg font-bold text-primary mb-2">Notifications</h3>
                        <p className="text-sm text-secondary mb-6">Glass cards handle depth and blur automatically.</p>
                        <GlassButton variant="secondary" size="sm" className="w-full">Review</GlassButton>
                    </div>
                </GlassContainer>
            </div>

            {/* Carousel (Full Width) */}
            <GlassContainer className="p-8 rounded-3xl" border material="regular">
                <div className="space-y-4">
                    <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block text-center">Carousel</span>
                    <GlassCarousel
                        items={[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="aspect-video bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl border border-white/10 flex items-center justify-center p-6">
                                <span className="text-4xl font-bold text-white/20">Slide {i}</span>
                            </div>
                        ))}
                    />
                    <GlassCode
                        className="mt-4"
                        language="tsx"
                        showLineNumbers={false}
                        code={`<GlassCarousel items={[<Slide1 />, <Slide2 />]} />`}
                    />
                </div>
            </GlassContainer>

            {/* Charts */}
            <GlassContainer id="charts" className="p-8 rounded-3xl" border material="regular">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-purple-400">Data</span>
                        <h3 className="text-xl font-bold text-primary">Data Visualization</h3>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Line Chart</span>
                        {/* <GlassChart
                            type="line"
                            data={[65, 59, 80, 81, 56, 100, 40]}
                            labels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']}
                            height={250}
                        /> */}
                    </div>
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Bar Chart</span>
                        {/* <GlassChart
                            type="bar"
                            data={[28, 48, 40, 19, 86, 27, 90]}
                            labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
                            height={250}
                            color="#a78bfa" // purple-400
                        /> */}
                    </div>
                </div>
                <GlassCode
                    className="mt-4"
                    language="tsx"
                    showLineNumbers={false}
                    code={`<GlassChart type="line" data={[65, 59, 80]} labels={['Jan', 'Feb', 'Mar']} />
<GlassChart type="bar" data={[28, 48, 40]} labels={['Mon', 'Tue', 'Wed']} />`}
                />
            </GlassContainer>

            {/* Advanced Charts */}
            <GlassContainer id="advanced-charts" className="p-8 rounded-3xl" border material="regular">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-purple-400">Advanced Data</span>
                        <h3 className="text-xl font-bold text-primary">Advanced Charts (New)</h3>
                    </div>
                    <GlassBadge variant="glass">New</GlassBadge>
                </div>

                <div className="space-y-12 mb-10">
                    {/* Radar */}
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Radar Chart</span>
                        {/* <GlassRadarChart
                            keys={['sales', 'marketing', 'dev']}
                            indexBy="label"
                            data={[
                                { label: 'Q1', sales: 90, marketing: 40, dev: 50 },
                                { label: 'Q2', sales: 70, marketing: 80, dev: 90 },
                                { label: 'Q3', sales: 60, marketing: 50, dev: 70 },
                                { label: 'Q4', sales: 85, marketing: 90, dev: 60 },
                            ]}
                            height={400}
                        /> */}
                    </div>
                    {/* Polar */}
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Polar Area</span>
                        {/* <GlassPolarAreaChart
                            data={[11, 16, 7, 3, 14]}
                            labels={['Red', 'Green', 'Yellow', 'Grey', 'Blue']}
                            height={400}
                            width={400}
                        /> */}
                    </div>

                    {/* Stacked Bar */}
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Stacked Bar</span>
                        {/* <GlassStackedBarChart
                            keys={['react', 'vue', 'angular']}
                            indexBy="year"
                            data={[
                                { year: '2021', react: 120, vue: 80, angular: 40 },
                                { year: '2022', react: 140, vue: 90, angular: 30 },
                                { year: '2023', react: 180, vue: 100, angular: 20 },
                                { year: '2024', react: 220, vue: 110, angular: 15 },
                            ]}
                            height={400}
                        /> */}
                    </div>
                    {/* Funnel */}
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Funnel</span>
                        {/* <GlassFunnelChart
                            data={[
                                { label: 'Impressions', value: 5000 },
                                { label: 'Clicks', value: 2500 },
                                { label: 'Signups', value: 800 },
                                { label: 'Purchases', value: 200 },
                            ]}
                            height={300}
                        /> */}
                    </div>

                    {/* Candlestick - Financial */}
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Candlestick (Crypto/Stock)</span>
                        {/* <GlassCandlestickChart
                            data={[
                                { timestamp: '1', open: 20, close: 25, high: 28, low: 18 },
                                { timestamp: '2', open: 25, close: 22, high: 26, low: 20 },
                                { timestamp: '3', open: 22, close: 28, high: 30, low: 21 },
                                { timestamp: '4', open: 28, close: 32, high: 34, low: 27 },
                                { timestamp: '5', open: 32, close: 30, high: 35, low: 29 },
                                { timestamp: '6', open: 30, close: 40, high: 42, low: 28 },
                            ]}
                            height={400}
                        /> */}
                    </div>
                    {/* Scatter 3D Bubbles */}
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Bubble Scatter</span>
                        {/* <GlassScatterChart
                            data={[
                                { x: 10, y: 20, z: 5 },
                                { x: 30, y: 50, z: 15 },
                                { x: 50, y: 30, z: 10 },
                                { x: 70, y: 80, z: 25 },
                                { x: 90, y: 40, z: 8 },
                                { x: 40, y: 90, z: 20 },
                            ]}
                            height={400}
                        /> */}
                    </div>

                    {/* Gauge */}
                    <div className="space-y-4 flex flex-col items-center">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block w-full">Radial Gauge</span>
                        {/* <GlassGauge
                            value={78}
                            units="Score"
                            minLabel="Low"
                            maxLabel="High"
                            size={300}
                        /> */}
                    </div>
                    {/* Sankey */}
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Sankey Flow</span>
                        {/* <GlassSankey
                            nodes={[
                                { id: 'a', label: 'Organic', color: '#4ade80' },
                                { id: 'b', label: 'Ads', color: '#f87171' },
                                { id: 'c', label: 'Web', color: '#60a5fa' },
                                { id: 'd', label: 'App', color: '#a78bfa' },
                            ]}
                            links={[
                                { source: 'a', target: 'c', value: 30 },
                                { source: 'a', target: 'd', value: 20 },
                                { source: 'b', target: 'c', value: 10 },
                                { source: 'b', target: 'd', value: 40 },
                            ]}
                            height={300}
                        /> */}
                    </div>

                    {/* Heatmap */}
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Heatmap</span>
                        {/* <GlassHeatmap
                            xLabels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
                            yLabels={['10AM', '2PM', '6PM', '10PM']}
                            data={[
                                { x: 'Mon', y: '10AM', value: 10 }, { x: 'Mon', y: '2PM', value: 20 },
                                { x: 'Tue', y: '10AM', value: 30 }, { x: 'Tue', y: '6PM', value: 50 },
                                { x: 'Wed', y: '2PM', value: 80 }, { x: 'Fri', y: '10PM', value: 90 },
                            ]}
                        /> */}
                    </div>
                    {/* Treemap */}
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Treemap</span>
                        {/* <GlassTreemap
                            height={300}
                            data={{
                                name: 'Root',
                                value: 100,
                                children: [
                                    { name: 'Analytics', value: 40, color: '#60a5fa' },
                                    { name: 'Marketing', value: 25, color: '#f472b6' },
                                    { name: 'Development', value: 20, color: '#34d399' },
                                    { name: 'Sales', value: 15, color: '#fbbf24' },
                                ]
                            }}
                        /> */}
                    </div>
                </div>
            </GlassContainer>

            {/* Status & Indicators */}
            <GlassContainer className="p-8 rounded-3xl" border material="regular">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-purple-400">Data</span>
                        <h3 className="text-xl font-bold text-primary">Status & Indicators</h3>
                    </div>
                    <GlassBadge variant="glass">New</GlassBadge>
                </div>
                <div className="flex flex-wrap gap-10">
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">System Status</span>
                        <GlassStatus />
                    </div>
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Variants</span>
                        <div className="flex flex-col gap-3">
                            <GlassStatus status="online" label="Online" />
                            <GlassStatus status="busy" label="Do Not Disturb" />
                            <GlassStatus status="offline" label="Offline" />
                            <GlassStatus status="away" label="Away" />
                        </div>
                    </div>
                </div>
                <GlassCode
                    className="mt-4"
                    language="tsx"
                    showLineNumbers={false}
                    code={`<GlassStatus status="online" label="Active" />`}
                />
            </GlassContainer>

            {/* Dashboard Widgets (Replicated from Admin Demo) */}
            <GlassContainer className="p-8 rounded-3xl" border material="regular">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-purple-400">Data</span>
                        <h3 className="text-xl font-bold text-primary">Dashboard Widgets</h3>
                    </div>
                    <GlassBadge variant="glass">New</GlassBadge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Sales Overview</span>
                        {/* <GlassChart
                            type="line"
                            data={[12000, 19000, 15000, 24000, 22000, 29000, 31000]}
                            labels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']}
                            height={300}
                        /> */}
                    </div>
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Traffic Sources</span>
                        <GlassDonutChart
                            data={[45, 25, 15, 15]}
                            labels={['Organic', 'Direct', 'Referral', 'Social']}
                            height={300}
                        />
                    </div>
                </div>
                <GlassCode
                    className="mt-4"
                    language="tsx"
                    showLineNumbers={false}
                    code={`<GlassChart type="line" data={salesData} labels={months} />
<GlassDonutChart data={[45, 25, 15, 15]} labels={['Organic', 'Direct']} />`}
                />
            </GlassContainer>

            {/* Metrics & Processes */}
            <GlassContainer id="metrics" className="p-8 rounded-3xl" border material="regular">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-purple-400">Data</span>
                        <h3 className="text-xl font-bold text-primary">Metrics & Processes</h3>
                    </div>
                    <GlassBadge variant="glass">New</GlassBadge>
                </div>

                <div className="grid grid-cols-1 gap-10">
                    {/* Metrics */}
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Metric Cards</span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <GlassMetric
                                title="Total Revenue"
                                value={124500}
                                prefix="$"
                                trend={{ value: 12.5, label: 'vs last month', isPositive: true }}
                            />
                            <GlassMetric
                                title="Active Users"
                                value={8942}
                                trend={{ value: 5.2, label: 'vs last week', isPositive: true }}
                                data={[10, 20, 15, 25, 30, 28, 40, 35, 50]}
                            />
                            <GlassMetric
                                title="Bounce Rate"
                                value={42.3}
                                suffix="%"
                                trend={{ value: 2.1, label: 'vs last week', isPositive: false }}
                                data={[60, 55, 50, 52, 58, 45, 42, 40]}
                            />
                        </div>
                        <GlassCode
                            className="mt-4"
                            language="tsx"
                            showLineNumbers={false}
                            code={`<GlassMetric 
  title="Revenue" 
  value={124500} 
  prefix="$" 
  trend={{ value: 12.5, label: 'vs last month', isPositive: true }} 
/>`}
                        />
                    </div>

                    {/* Timeline */}
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Timeline</span>
                        <GlassTimeline
                            items={[
                                { id: '1', date: 'Dec 20, 2025', title: 'Phase 2 Completed', description: 'Implemented advanced interactive components.', icon: <Activity /> },
                                { id: '2', date: 'Dec 15, 2025', title: 'Phase 1 Launch', description: 'Core layout system and chat kit released.', icon: <Terminal /> },
                                { id: '3', date: 'Nov 2025', title: 'Concept Design', description: 'Initial sketches for Liquid Glass aesthetics.', icon: <FileText /> }
                            ]}
                        />
                        <GlassCode
                            className="mt-4"
                            language="tsx"
                            showLineNumbers={false}
                            code={`<GlassTimeline
  items={[
    { 
      id: '1', 
      date: 'Dec 20', 
      title: 'Launched', 
      description: 'First release',
      icon: <Icon /> 
    }
  ]}
/>`}
                        />
                    </div>

                    {/* Kanban */}
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Kanban Board</span>
                        <GlassKanban />
                        <GlassCode
                            className="mt-4"
                            language="tsx"
                            showLineNumbers={false}
                            code={`<GlassKanban />`}
                        />
                    </div>
                </div>
            </GlassContainer>

            {/* Structure & Comparison */}
            <GlassContainer className="p-8 rounded-3xl" border material="regular">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-purple-400">Data</span>
                        <h3 className="text-xl font-bold text-primary">Structure & Utilities</h3>
                    </div>
                    <GlassBadge variant="glass">New</GlassBadge>
                </div>

                <div className="space-y-10">
                    {/* File Tree */}
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">File Tree</span>
                        <GlassContainer className="h-[300px] p-4">
                            <GlassFileTree
                                data={[
                                    {
                                        id: '1', name: 'src', type: 'folder', children: [
                                            {
                                                id: '1-1', name: 'components', type: 'folder', children: [
                                                    { id: '1-1-1', name: 'GlassButton.tsx', type: 'file', language: 'typescript' },
                                                    { id: '1-1-2', name: 'GlassCard.tsx', type: 'file', language: 'typescript' }
                                                ]
                                            },
                                            { id: '1-3', name: 'App.tsx', type: 'file', language: 'typescript' }
                                        ]
                                    },
                                    { id: '3', name: 'package.json', type: 'file', language: 'json' },
                                ]}
                            />
                        </GlassContainer>
                        <GlassCode
                            className="mt-4"
                            language="tsx"
                            showLineNumbers={false}
                            code={`<GlassFileTree
  data={[
    {
      id: '1',
      name: 'src',
      type: 'folder',
      children: [{ id: '1-1', name: 'App.tsx', type: 'file' }]
    }
  ]}
/>`}
                        />
                    </div>

                    {/* Code */}
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Code Block</span>

                        <GlassCode
                            code={`const future = "Liquid Glass";
console.log(future);`}
                            language="typescript"
                            filename="future.ts"
                        />
                    </div>

                    {/* Compare */}
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Comparison Slider</span>
                        <div className="h-[300px] rounded-2xl overflow-hidden border border-[var(--glass-border)]">
                            <GlassCompare
                                beforeLabel="Before"
                                afterLabel="After"
                                beforeDetails={
                                    <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                                        <span className="text-2xl font-bold text-white/30">Original</span>
                                    </div>
                                }
                                afterDetails={
                                    <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
                                        <span className="text-2xl font-bold text-white">Enhanced</span>
                                    </div>
                                }
                            />
                        </div>
                        <GlassCode
                            className="mt-4"
                            language="tsx"
                            showLineNumbers={false}
                            code={`<GlassCompare
  beforeLabel="Before"
  afterLabel="After"
  beforeDetails={<div className="bg-red-500">Old</div>}
  afterDetails={<div className="bg-green-500">New</div>}
/>`}
                        />
                    </div>
                </div>
            </GlassContainer >

            {/* Dashboard Widgets */}
            < GlassContainer className="p-8 rounded-3xl" border material="regular" >
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-purple-400">Data</span>
                        <h3 className="text-xl font-bold text-primary">Dashboard Widgets</h3>
                    </div>
                    <GlassBadge variant="outline">New</GlassBadge>
                </div>
                <p className="text-secondary text-sm mb-8">Reusable widgets for dashboards: weather, music, stats, media lists, and cards.</p>

                <div className="space-y-8">
                    {/* Stats Bar */}
                    <div>
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block mb-3">Stats Bar</span>
                        <GlassStatsBar
                            title="Time tracking"
                            stats={[
                                { label: 'Minutes', value: 1432 },
                                { label: 'Charge', value: '80', unit: '%' },
                                { label: 'Target', value: '6/10' },
                            ]}
                        />

                        <GlassCode
                            className="mt-3"
                            language="tsx"
                            code={`<GlassStatsBar
  title="Time tracking"
  stats={[
    { label: 'Minutes', value: 1432 },
    { label: 'Charge', value: '80', unit: '%' },
    { label: 'Target', value: '6/10' },
  ]}
/>`}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Weather Widget */}
                        <div>
                            <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block mb-3">Weather</span>
                            <GlassWeather
                                temperature={23}
                                humidity={56}
                                date="Friday, 20 June 2025"
                                forecast={[
                                    { day: 'Sat', temp: 30, icon: 'sun' },
                                    { day: 'Sun', temp: 28, icon: 'rain' },
                                    { day: 'Mon', temp: 31, icon: 'sun' },
                                    { day: 'Tue', temp: 29, icon: 'wind' },
                                ]}
                            />

                            <GlassCode
                                className="mt-3"
                                language="tsx"
                                showLineNumbers={false}
                                code={`<GlassWeather
  temperature={23}
  humidity={56}
  forecast={[
    { day: 'Sat', temp: 30, icon: 'sun' },
    { day: 'Sun', temp: 28, icon: 'rain' },
  ]}
/>`}
                            />
                        </div>

                        {/* Mini Player */}
                        <div>
                            <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block mb-3">Mini Player</span>
                            <GlassMiniPlayer
                                artist="Arash"
                                title="One day I'm gonna fly away"
                                albumArt="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200"
                            />

                            <GlassCode
                                className="mt-3"
                                language="tsx"
                                showLineNumbers={false}
                                code={`<GlassMiniPlayer
  artist="Arash"
  title="One day I'm gonna fly away"
  albumArt="/path/to/album.jpg"
/>`}
                            />
                        </div>

                        {/* Media List */}
                        <div>
                            <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block mb-3">Media List</span>
                            <GlassMediaList
                                title="Recommend"
                                items={[
                                    { image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=100', title: 'AI Awakens', description: 'Healing begins where...' },
                                    { image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100', title: 'Shadows of Serenity', description: 'Healing begins where...' },
                                ]}
                            />

                            <GlassCode
                                className="mt-3"
                                language="tsx"
                                showLineNumbers={false}
                                code={`<GlassMediaList
  title="Recommend"
  items={[
    { image: '/img1.jpg', title: 'AI Awakens', description: '...' },
    { image: '/img2.jpg', title: 'Shadows', description: '...' },
  ]}
/>`}
                            />
                        </div>
                    </div>

                    {/* Media Cards - Hidden until component is restored */}
                    {/* 
                    <div className="mt-8">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block mb-3">Media Cards</span>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="aspect-video rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-secondary text-xs">
                                Media Card Placeholder
                            </div>
                        </div>
                    </div>
                    */}

                    <div className="mt-8">
                        <GlassCode
                            className="mt-3"
                            language="tsx"
                            code={`<GlassMediaCard
  image="/path/to/image.jpg"
  title="Beyond the Silence"
  description="A deep dive into mindfulness..."
  aspectRatio="square" // or 'video' | 'portrait'
  onClick={() => console.log('Clicked!')}
/>`}
                        />
                    </div>
                </div>
            </GlassContainer>
        </div>
    );
};
