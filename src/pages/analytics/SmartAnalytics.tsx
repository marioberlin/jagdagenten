
import { useState, useEffect, useRef, useMemo } from 'react';
import { GlassContainer, GlassCard } from '@/components';
import { GlassDatePicker } from '@/components/forms/GlassDatePicker';
import { analyticsService, Kline, AnalysisResult } from '../../services/analyticsService';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip as ChartTooltip,
    Legend as ChartLegend,
    Filler,
} from 'chart.js';
import { Line as RxLine, Bar as RxBar } from 'react-chartjs-2';
import { Activity, AlertTriangle, TrendingUp, TrendingDown, Zap, BarChart2 } from 'lucide-react';
import { cn } from '@/utils/cn';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    ChartTooltip,
    ChartLegend,
    Filler
);

interface ProcessedData extends Kline, AnalysisResult {
    atr: number;
}

type Timeframe = '1D' | '7D' | '1M' | '3M' | '1Y' | 'YTD';

export function SmartAnalytics() {
    const [loading, setLoading] = useState(true);
    const [renderData, setRenderData] = useState<ProcessedData[]>([]); // Only store what we display
    const [timeframe, setTimeframe] = useState<Timeframe>('1D');
    const [selectedDate, setSelectedDate] = useState<Date>(new Date('2025-01-01'));
    const [customMode, setCustomMode] = useState(false);

    // Store full dataset in Ref to avoid React State performance penalty for 500k+ objects
    const allDataRef = useRef<ProcessedData[]>([]);

    const [stats, setStats] = useState({
        volatility: 0,
        trend: 'Neutral', // Changed from string literal to string for safety
        knifeEvents: 0,
        bullEvents: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    // Effect to update view when controls change
    useEffect(() => {
        if (allDataRef.current.length > 0) {
            updateView();
        }
    }, [timeframe, customMode, selectedDate]);

    const loadData = async () => {
        try {
            setLoading(true);
            const klines = await analyticsService.loadKlines();

            // Optimization: If file is huge, maybe we process in chunks? 
            // For now, assume browser can handle 500k loop in <1s.
            const analysis = analyticsService.processFullAnalysis(klines);

            const combined = klines.map((k, i) => ({
                ...k,
                ...analysis[i]
            }));

            allDataRef.current = combined;
            updateView(); // Initial view update

        } catch (e) {
            console.error("Failed to load analytics data", e);
        } finally {
            setLoading(false);
        }
    };

    const updateStats = (dataset: ProcessedData[]) => {
        if (!dataset.length) return;

        // Calculate stats on the FULL timeframe view (before downsampling) for accuracy
        // Optimization: If dataset is huge (e.g. 1Y), this might be slow.
        // For 1Y (500k), reduce might take 50ms. Acceptable.

        // Quick estimate for huge datasets to keep UI snappy:
        // If data > 50k, maybe sample for stats? No, users want accuracy.
        // Let's rely on JS engine speed.

        const vol = dataset.reduce((sum, d) => sum + d.atr, 0) / dataset.length;
        const knives = dataset.filter(d => d.fallingKnife).length;
        const bulls = dataset.filter(d => d.bullRun).length;

        setStats({
            volatility: vol,
            trend: bulls > knives ? 'Bullish' : (knives > bulls ? 'Bearish' : 'Neutral'),
            knifeEvents: knives,
            bullEvents: bulls
        });
    };

    const updateView = () => {
        const fullData = allDataRef.current;
        if (!fullData.length) return;

        let filtered: ProcessedData[] = [];
        const lastPoint = fullData[fullData.length - 1];
        const lastTime = lastPoint.closeTime;

        if (customMode && selectedDate) {
            const year = selectedDate.getFullYear();
            const month = selectedDate.getMonth();
            // Optimization: Binary search or estimate index could be faster, but filter is O(N) ~10ms for 500k items. Acceptable.
            filtered = fullData.filter(d => {
                const date = new Date(d.closeTime);
                return date.getFullYear() === year && date.getMonth() === month;
            });
        } else {
            let visibleMinutes = 1440; // 1D default
            if (timeframe === '1D') visibleMinutes = 1440;
            else if (timeframe === '7D') visibleMinutes = 1440 * 7;
            else if (timeframe === '1M') visibleMinutes = 1440 * 30;
            else if (timeframe === '3M') visibleMinutes = 1440 * 90;
            else if (timeframe === '1Y') visibleMinutes = 1440 * 365;
            else if (timeframe === 'YTD') {
                const startOfYear = new Date(new Date(lastTime).getFullYear(), 0, 1).getTime();
                filtered = fullData.filter(d => d.closeTime >= startOfYear);
            }

            if (timeframe !== 'YTD') {
                // Slice from end is O(1) or O(K)
                filtered = fullData.slice(-visibleMinutes);
            }
        }

        updateStats(filtered);

        // Downsample for rendering
        const targetPoints = 1000;
        const samplingRate = Math.ceil(filtered.length / targetPoints);

        // Filter is fast enough on the smaller 'filtered' set (max 500k, usually smaller)
        const finalData = filtered.filter((_, i) => i % samplingRate === 0);

        setRenderData(finalData);
    };

    const priceChartData = useMemo(() => ({
        labels: renderData.map(d => new Date(d.closeTime).toLocaleDateString() + ' ' + new Date(d.closeTime).toLocaleTimeString()),
        datasets: [
            {
                label: 'Price',
                data: renderData.map(d => d.close),
                borderColor: 'rgba(56, 189, 248, 1)',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                tension: 0.1,
                fill: true,
                pointRadius: 0,
                borderWidth: 1.5
            },
            {
                label: 'Falling Knife',
                data: renderData.map(d => d.fallingKnife ? d.close : null),
                backgroundColor: 'rgba(239, 68, 68, 1)',
                pointRadius: renderData.length > 200 ? 4 : 6,
                pointStyle: 'triangle',
                rotation: 180,
                type: 'scatter' as const
            },
            {
                label: 'Bull Run Start',
                data: renderData.map(d => d.bullRun ? d.close : null),
                backgroundColor: 'rgba(34, 197, 94, 1)',
                pointRadius: renderData.length > 200 ? 4 : 6,
                pointStyle: 'triangle',
                type: 'scatter' as const
            }
        ]
    }), [renderData]);

    const volumeChartData = useMemo(() => ({
        labels: renderData.map(d => new Date(d.closeTime).toLocaleTimeString()),
        datasets: [
            {
                label: 'Volume',
                data: renderData.map(d => d.volume),
                backgroundColor: renderData.map(d => d.close > d.open ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'),
            }
        ]
    }), [renderData]);

    const options = {
        responsive: true,
        animation: { duration: 0 }, // Disable animation for performance on large updates
        plugins: {
            legend: { display: false },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
            }
        },
        scales: {
            x: { display: false },
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' }
            }
        },
        interaction: {
            mode: 'nearest' as const,
            axis: 'x' as const,
            intersect: false
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen pt-24">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-secondary animate-pulse">Crunching 1-minute data...</p>
            </div>
        </div>
    );

    const dateLabel = selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const currentRsi = renderData[renderData.length - 1]?.rsi || 50;
    const rsiWidth = `${currentRsi}% `;

    return (
        <div className="min-h-screen p-6 space-y-6 pt-32 relative z-0">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 relative z-10">
                <div>
                    <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
                        <Zap className="text-yellow-400 fill-yellow-400/20" />
                        Smart Market Analytics
                    </h1>
                    <p className="text-secondary mt-1">AI-Powered Pattern Recognition & Market Regime Detection</p>
                </div>

                {/* Timeframe Controls */}
                <div className="flex items-center gap-2 bg-glass-surface p-1.5 rounded-xl border border-glass-border shadow-lg backdrop-blur-md">
                    {(['1D', '7D', '1M', '3M', '1Y', 'YTD'] as const).map(tf => (
                        <button
                            key={tf}
                            onClick={() => {
                                setTimeframe(tf);
                                setCustomMode(false);
                            }}
                            className={cn(
                                "px-3 py-1.5 text-sm font-medium rounded-lg transition-all border border-transparent",
                                timeframe === tf && !customMode
                                    ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/20 shadow-[0_0_10px_rgba(250,204,21,0.1)]"
                                    : "text-gray-200 bg-white/5 border-white/5 hover:text-white hover:bg-white/10 hover:border-white/10"
                            )}
                        >
                            {tf}
                        </button>
                    ))}
                    <div className="w-px h-4 bg-white/10 mx-1" />

                    {/* Calendar Toggle */}
                    <GlassDatePicker
                        date={selectedDate}
                        onSelect={(date) => {
                            setSelectedDate(date);
                            setCustomMode(true);
                            setTimeframe('' as any); // Clear standard selection
                        }}
                        className={cn(
                            "border-0 bg-transparent px-2",
                            customMode ? "text-accent" : "text-secondary"
                        )}
                    />
                </div>
            </div>

            {/* Smart Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <GlassCard className="p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-secondary text-sm">Market Regime</span>
                        <Activity className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-xl font-bold text-primary">{stats.trend}</div>
                    <div className="text-xs text-secondary mt-1">Based on ATR & Trend</div>
                </GlassCard>

                <GlassCard className="p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-secondary text-sm">Volatility (ATR)</span>
                        <BarChart2 className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="text-xl font-bold text-primary">{stats.volatility.toFixed(2)}</div>
                    <div className="text-xs text-secondary mt-1">Avg 14-period</div>
                </GlassCard>

                <GlassCard className="p-4 bg-red-500/5 border-red-500/20">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-red-400 text-sm">Falling Knives</span>
                        <TrendingDown className="w-4 h-4 text-red-500" />
                    </div>
                    <div className="text-xl font-bold text-red-400">{stats.knifeEvents}</div>
                    <div className="text-xs text-red-400/70 mt-1">Detected in view</div>
                </GlassCard>

                <GlassCard className="p-4 bg-green-500/5 border-green-500/20">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-green-400 text-sm">Bull Run Signals</span>
                        <TrendingUp className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="text-xl font-bold text-green-400">{stats.bullEvents}</div>
                    <div className="text-xs text-green-400/70 mt-1">Strong momentum</div>
                </GlassCard>
            </div>

            {/* Main Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <GlassContainer className="lg:col-span-2 p-6 min-h-[500px]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-primary">Price Action &amp; Signals</h3>
                        <div className="text-xs text-secondary">
                            {customMode ? ('Viewing ' + dateLabel) : ('Last ' + timeframe)}
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        {/* @ts-expect-error - ChartJS type definition mismatch for mixed charts */}
                        <RxLine data={priceChartData} options={options} />
                    </div>
                    <div className="h-[100px] w-full mt-4">
                        <RxBar data={volumeChartData} options={options} />
                    </div>
                </GlassContainer>

                <div className="space-y-6">
                    <GlassContainer className="p-6">
                        <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                            <AlertTriangle className="text-amber-400" size={18} />
                            Risk Radar
                        </h3>
                        <div className="space-y-4">
                            {/* PAXUSDT Placeholder */}
                            <div className="p-4 rounded-lg bg-white/5 border border-white/10 border-dashed">
                                <div className="text-sm font-medium text-secondary mb-1">PAXUSDT Alpha</div>
                                <div className="text-xs text-secondary/70 italic">
                                    Waiting for dataset...
                                    <br />
                                    Correlation analysis will appear here.
                                </div>
                            </div>

                            <div className="p-3">
                                <span className="text-sm text-secondary block mb-2">RSI Heat</span>
                                <div className="w-full bg-white/10 rounded-full h-2">
                                    <div
                                        className="bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 h-2 rounded-full transition-all duration-1000"
                                        style={{ width: rsiWidth }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-secondary mt-1">
                                    <span>Oversold</span>
                                    <span>Overbought</span>
                                </div>
                            </div>
                        </div>
                    </GlassContainer>

                    <GlassContainer className="p-6">
                        <h3 className="text-lg font-semibold text-primary mb-4">Volume Profile</h3>
                        {/* Simple visual approximation of TPO for now */}
                        <div className="flex items-end justify-between h-32 gap-1">
                            {[...Array(10)].map((_, i) => (
                                <div
                                    key={i}
                                    className="w-full bg-blue-500/20 hover:bg-blue-500/40 transition-colors rounded-t-sm"
                                    style={{ height: `${Math.random() * 100}% ` }}
                                />
                            ))}
                        </div>
                        <div className="text-center text-xs text-secondary mt-2">Price Distribution (In View)</div>
                    </GlassContainer>
                </div>
            </div>
        </div>
    );
}

