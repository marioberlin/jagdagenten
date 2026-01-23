/**
 * RushHour Trading App
 *
 * The standalone Glass App for crypto trading within LiquidOS.
 * Features a windowed tabbed layout with integrated AI chat.
 */
import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp,
    BarChart3,
    Bot,
    Shield,
    LayoutDashboard,
    AlertTriangle,
    RefreshCw,
    Play,
    Square,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassContainer, GlassButton } from '@/components';
import { useMenuBar } from '@/context/MenuBarContext';
import { RushHourChatInput } from './RushHourChatInput';

// Dashboard Components
import { DashboardHeader } from './components/DashboardHeader';
import { PortfolioMetrics } from './components/PortfolioMetrics';
import { PortfolioChart } from './components/PortfolioChart';
import { AssetAllocation } from './components/AssetAllocation';
import { BotOverview } from './components/BotOverview';
import { PositionsTable } from './components/PositionsTable';
import { RecentActivity } from './components/RecentActivity';
import { MarketsView } from './components/MarketsView';
import { RiskSettingsView } from './components/RiskSettingsView';

// Hooks
import { useDashboardData } from '@/hooks/trading/useDashboardData';
import type { BotStatus } from '@/hooks/trading/useDashboardData';

// Tab definitions
type TradingTab = 'dashboard' | 'markets' | 'bots' | 'risk' | 'analytics';

const TABS: { id: TradingTab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'markets', label: 'Markets', icon: BarChart3 },
    { id: 'bots', label: 'Bots', icon: Bot },
    { id: 'risk', label: 'Risk', icon: Shield },
];

interface RushHourTradingAppProps {
    onClose?: () => void;
}

export const RushHourTradingApp: React.FC<RushHourTradingAppProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<TradingTab>('dashboard');
    const [isLoading, setIsLoading] = useState(false);
    const { setAppIdentity, registerMenu, unregisterMenu } = useMenuBar();

    // Close handler for menu bar integration
    const handleClose = useCallback(() => {
        onClose?.();
    }, [onClose]);

    // No-op for command palette (global ⌘K handles this)
    const handleCommandPalette = useCallback(() => {
        // Global command palette is handled at Router level
    }, []);

    // Dashboard data hook
    const {
        metrics,
        assets,
        positions,
        bots,
        activities,
        chartData,
        timeRange,
        setTimeRange,
        isLoading: isDashboardLoading,
        error,
        lastUpdated,
        refresh,
    } = useDashboardData();

    // Register RushHour's app identity and custom menus
    useEffect(() => {
        setAppIdentity('RushHour Trading', TrendingUp);

        // Trading menu
        registerMenu({
            id: 'trading',
            label: 'Trading',
            items: [
                {
                    id: 'start-bot',
                    label: 'Start Bot',
                    icon: Play,
                    shortcut: '⌘R',
                    action: () => console.log('Start bot'),
                },
                {
                    id: 'stop-bot',
                    label: 'Stop Bot',
                    icon: Square,
                    shortcut: '⇧⌘R',
                    action: () => console.log('Stop bot'),
                },
                { id: 'sep-1', label: '', dividerAfter: true },
                {
                    id: 'risk-settings',
                    label: 'Risk Settings...',
                    icon: Shield,
                    action: () => setActiveTab('risk'),
                },
            ],
        });

        // Cleanup on unmount
        return () => {
            setAppIdentity('LiquidOS');
            unregisterMenu('trading');
        };
    }, [setAppIdentity, registerMenu, unregisterMenu, handleClose]);

    // Handle bot actions
    const handleBotClick = useCallback((bot: BotStatus) => {
        console.log('Bot clicked:', bot.id);
        setActiveTab('bots');
    }, []);

    const handleToggleBot = useCallback((botId: string) => {
        console.log('Toggle bot:', botId);
    }, []);

    const handleClosePosition = useCallback((positionId: string) => {
        console.log('Close position:', positionId);
    }, []);

    // Handle chat input
    const handleChat = async (message: string) => {
        setIsLoading(true);
        try {
            // TODO: Connect to A2A trading service
            console.log('Trading query:', message);
            await new Promise(resolve => setTimeout(resolve, 1000));
        } finally {
            setIsLoading(false);
        }
    };

    // Render tab content
    const renderTabContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="space-y-6">
                        {/* Error Banner */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                >
                                    <GlassContainer className="p-4 border-l-4 border-red-500" border>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 text-red-400">
                                                <AlertTriangle className="w-5 h-5" />
                                                <span className="font-medium">{error}</span>
                                            </div>
                                            <GlassButton variant="ghost" size="sm" onClick={refresh}>
                                                <RefreshCw className="w-4 h-4 mr-2" />
                                                Retry
                                            </GlassButton>
                                        </div>
                                    </GlassContainer>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Dashboard Header */}
                        <DashboardHeader
                            totalValue={metrics?.totalValue ?? 0}
                            totalValueChange={metrics?.totalValueChange24h ?? 0}
                            totalValueChangePercent={metrics?.totalValueChangePercent24h ?? 0}
                            totalPnL={metrics?.totalPnL ?? 0}
                            totalPnLPercent={metrics?.totalPnLPercent ?? 0}
                            lastUpdated={lastUpdated}
                            onRefresh={refresh}
                            onCommandPalette={handleCommandPalette}
                            isLoading={isDashboardLoading}
                        />

                        {/* Metrics Cards */}
                        <PortfolioMetrics metrics={metrics} isLoading={isDashboardLoading} />

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2">
                                <PortfolioChart
                                    data={chartData}
                                    timeRange={timeRange}
                                    onTimeRangeChange={setTimeRange}
                                    isLoading={isDashboardLoading}
                                />
                            </div>
                            <div className="lg:col-span-1">
                                <AssetAllocation assets={assets} isLoading={isDashboardLoading} />
                            </div>
                        </div>

                        {/* Bot Overview */}
                        <BotOverview
                            bots={bots}
                            isLoading={isDashboardLoading}
                            onBotClick={handleBotClick}
                            onToggleBot={handleToggleBot}
                        />

                        {/* Positions Table */}
                        <PositionsTable
                            positions={positions}
                            isLoading={isDashboardLoading}
                            onClosePosition={handleClosePosition}
                        />

                        {/* Recent Activity */}
                        <RecentActivity activities={activities} isLoading={isDashboardLoading} />
                    </div>
                );


            case 'markets':
                return (
                    <MarketsView
                        onSelectSymbol={(symbol) => console.log('Selected:', symbol)}
                    />
                );

            case 'bots':
                return (
                    <div className="space-y-6">
                        <BotOverview
                            bots={bots}
                            isLoading={isDashboardLoading}
                            onBotClick={handleBotClick}
                            onToggleBot={handleToggleBot}
                        />
                    </div>
                );

            case 'risk':
                return <RiskSettingsView />;

            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col h-full bg-glass-base rounded-b-xl overflow-hidden relative">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/20 via-teal-900/10 to-transparent pointer-events-none" />

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 px-4 py-2 border-b border-[var(--glass-border)] bg-black/20 relative z-10">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                            activeTab === tab.id
                                ? 'bg-[var(--glass-accent)]/20 text-[var(--glass-accent)]'
                                : 'text-secondary hover:text-primary hover:bg-white/5'
                        )}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 relative z-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {renderTabContent()}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Fixed Chat Input */}
            <div className="z-20">
                <RushHourChatInput onSend={handleChat} isLoading={isLoading} />
            </div>
        </div>
    );
};

export default RushHourTradingApp;
