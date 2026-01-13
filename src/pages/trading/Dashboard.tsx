import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle,
    RefreshCw,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassContainer, GlassButton } from '@/components';

// Dashboard Components
import { DashboardHeader } from '../../components/trading/DashboardHeader';
import { PortfolioMetrics } from '../../components/trading/PortfolioMetrics';
import { PortfolioChart } from '../../components/trading/PortfolioChart';
import { AssetAllocation } from '../../components/trading/AssetAllocation';
import { BotOverview } from '../../components/trading/BotOverview';
import { PositionsTable } from '../../components/trading/PositionsTable';
import { RecentActivity } from '../../components/trading/RecentActivity';

// Hooks
import { useDashboardData } from '../../hooks/trading/useDashboardData';
import type { BotStatus } from '../../hooks/trading/useDashboardData';

/**
 * TradingDashboard - State-of-the-art trading dashboard
 *
 * Features:
 * - Hero header with animated portfolio value
 * - 6 metric cards with 3D hover effects
 * - Interactive portfolio chart with time range selection
 * - Asset allocation donut chart
 * - Bot status cards with health indicators
 * - Positions table with expandable rows
 * - Recent activity timeline
 */
export function Dashboard() {
    const {
        metrics,
        assets,
        positions,
        bots,
        activities,
        chartData,
        timeRange,
        setTimeRange,
        isLoading,
        error,
        lastUpdated,
        refresh,
    } = useDashboardData();

    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

    // Handle bot click - navigate to bot details
    const handleBotClick = useCallback((bot: BotStatus) => {
        // TODO: Navigate to bot detail page or open modal
        console.log('Bot clicked:', bot.id);
    }, []);

    // Handle bot toggle - pause/resume
    const handleToggleBot = useCallback((botId: string) => {
        // TODO: Call API to toggle bot status
        console.log('Toggle bot:', botId);
    }, []);


    // Handle close position
    const handleClosePosition = useCallback((positionId: string) => {
        // TODO: Call API to close position
        console.log('Close position:', positionId);
    }, []);

    // Handle command palette
    const handleCommandPalette = useCallback(() => {
        setIsCommandPaletteOpen(true);
        // TODO: Implement command palette modal
    }, []);

    // Keyboard shortcuts
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd+K or Ctrl+K for command palette
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                handleCommandPalette();
            }
            // R for refresh (when not in input)
            if (e.key === 'r' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
                e.preventDefault();
                refresh();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleCommandPalette, refresh]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
            {/* Error Banner */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="sticky top-0 z-50 px-6 py-3"
                    >
                        <GlassContainer className="p-4 border-l-4 border-red-500" border>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 text-red-400">
                                    <AlertTriangle className="w-5 h-5" />
                                    <span className="font-medium">{error}</span>
                                </div>
                                <GlassButton
                                    variant="ghost"
                                    size="sm"
                                    onClick={refresh}
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Retry
                                </GlassButton>
                            </div>
                        </GlassContainer>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Dashboard Header - Hero Section */}
            <DashboardHeader
                totalValue={metrics?.totalValue ?? 0}
                totalValueChange={metrics?.totalValueChange24h ?? 0}
                totalValueChangePercent={metrics?.totalValueChangePercent24h ?? 0}
                totalPnL={metrics?.totalPnL ?? 0}
                totalPnLPercent={metrics?.totalPnLPercent ?? 0}
                lastUpdated={lastUpdated}
                onRefresh={refresh}
                onCommandPalette={handleCommandPalette}
                isLoading={isLoading}
            />

            {/* Metrics Cards */}
            <PortfolioMetrics
                metrics={metrics}
                isLoading={isLoading}
            />

            {/* Charts Section - Portfolio & Allocation */}
            <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="px-6 mt-8"
            >
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Portfolio Chart - 2/3 width */}
                    <div className="lg:col-span-2">
                        <PortfolioChart
                            data={chartData}
                            timeRange={timeRange}
                            onTimeRangeChange={setTimeRange}
                            isLoading={isLoading}
                        />
                    </div>

                    {/* Asset Allocation - 1/3 width */}
                    <div className="lg:col-span-1">
                        <AssetAllocation
                            assets={assets}
                            isLoading={isLoading}
                        />
                    </div>
                </div>
            </motion.section>

            {/* Bot Overview */}
            <section className="mt-8">
                <BotOverview
                    bots={bots}
                    isLoading={isLoading}
                    onBotClick={handleBotClick}
                    onToggleBot={handleToggleBot}
                />
            </section>

            {/* Positions Table */}
            <section className="mt-8">
                <PositionsTable
                    positions={positions}
                    isLoading={isLoading}
                    onClosePosition={handleClosePosition}
                />
            </section>

            {/* Recent Activity */}
            <section className="mt-8 pb-12">
                <RecentActivity
                    activities={activities}
                    isLoading={isLoading}
                />
            </section>

            {/* Command Palette Modal Placeholder */}
            <AnimatePresence>
                {isCommandPaletteOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
                        onClick={() => setIsCommandPaletteOpen(false)}
                    >
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-2xl mx-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <GlassContainer className="p-4" border>
                                <input
                                    type="text"
                                    placeholder="Type a command or search..."
                                    autoFocus
                                    className={cn(
                                        'w-full bg-transparent border-none outline-none',
                                        'text-lg text-white placeholder:text-gray-500',
                                        'px-2 py-2'
                                    )}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Escape') {
                                            setIsCommandPaletteOpen(false);
                                        }
                                    }}
                                />
                                <div className="border-t border-white/10 mt-4 pt-4">
                                    <p className="text-xs text-secondary px-2">
                                        Quick actions: <span className="text-primary">trade</span> · <span className="text-primary">deposit</span> · <span className="text-primary">withdraw</span> · <span className="text-primary">bots</span>
                                    </p>
                                </div>
                            </GlassContainer>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default Dashboard;
