import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    Activity,
    DollarSign,
    BarChart3,
    Bot,
    AlertTriangle
} from 'lucide-react';
import {
    GlassContainer,
    GlassCard,
    GlassButton
} from '@/components';
import { PositionCard } from '../../components/trading/PositionCard';
import { TradingBreadcrumb } from '../../components/trading/TradingBreadcrumb';
import { tradingService } from '../../services/trading';
import type {
    PortfolioSummary,
    Position,
    BotStatus
} from '../../types/trading';

export function Dashboard() {
    const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
    const [positions, setPositions] = useState<Position[]>([]);
    const [botStatuses, setBotStatuses] = useState<BotStatus[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadDashboardData();
        const interval = setInterval(loadDashboardData, 30000);
        return () => clearInterval(interval);
    }, []);

    async function loadDashboardData() {
        try {
            const [portfolioRes, positionsRes, botsRes] = await Promise.all([
                tradingService.getPortfolioSummary(),
                tradingService.getOpenPositions(),
                tradingService.getBotStatuses(),
            ]);

            if (portfolioRes.data) setPortfolio(portfolioRes.data);
            if (positionsRes.data) setPositions(positionsRes.data);
            if (botsRes.data) setBotStatuses(botsRes.data);

            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load data');
        }
    }

    // Mock data for demo when API is not available
    const mockPortfolio: PortfolioSummary = portfolio || {
        totalValueUsd: 12547.82,
        totalPnlUsd: 1247.50,
        totalPnlPercent: 11.05,
        openPositions: 4,
        todayTrades: 7,
        winRate: 68.5,
    };

    const mockPositions: Position[] = positions.length ? positions : [
        { position_id: 1, bot_id: 1, symbol: 'BTCUSDT', quantity: 0.025, entry_price: 42150, opened_at: '2024-12-29T10:30:00Z', current_price: 43200, unrealized_pnl: 26.25, unrealized_pnl_percent: 2.49 },
        { position_id: 2, bot_id: 1, symbol: 'ETHUSDT', quantity: 0.5, entry_price: 2280, opened_at: '2024-12-29T14:15:00Z', current_price: 2350, unrealized_pnl: 35.00, unrealized_pnl_percent: 3.07 },
        { position_id: 3, bot_id: 2, symbol: 'SOLUSDT', quantity: 5, entry_price: 105.50, opened_at: '2024-12-30T08:00:00Z', current_price: 102.30, unrealized_pnl: -16.00, unrealized_pnl_percent: -3.03 },
    ];

    const mockBotStatuses: BotStatus[] = botStatuses.length ? botStatuses : [
        { bot_id: 1, name: 'AI Strategy Bot', active: true, test_mode: false, lastDecision: 'BUY', openPositions: 2, todayPnl: 45.20 },
        { bot_id: 2, name: 'DCA Bot', active: true, test_mode: true, lastDecision: 'HOLD', openPositions: 1, todayPnl: -8.50 },
        { bot_id: 3, name: 'Technical Bot', active: false, test_mode: false, openPositions: 0, todayPnl: 0 },
    ];

    return (
        <div className="min-h-screen p-6 space-y-6">
            {/* Breadcrumb */}
            <TradingBreadcrumb />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Trading Dashboard</h1>
                    <p className="text-secondary text-sm">Monitor your portfolio and trading bots</p>
                </div>
                <div className="flex gap-3">
                    <GlassButton variant="secondary" onClick={loadDashboardData}>
                        <Activity className="w-4 h-4 mr-2" />
                        Refresh
                    </GlassButton>
                    <GlassButton onClick={() => window.location.href = '/trading/bots'}>
                        <Bot className="w-4 h-4 mr-2" />
                        Configure Bots
                    </GlassButton>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <GlassContainer className="p-4 border-l-4 border-red-500">
                    <div className="flex items-center gap-3 text-red-400">
                        <AlertTriangle className="w-5 h-5" />
                        <span>{error}</span>
                    </div>
                </GlassContainer>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <GlassCard className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-secondary text-sm">Portfolio Value</p>
                                <p className="text-2xl font-bold text-primary mt-1">
                                    ${mockPortfolio.totalValueUsd.toLocaleString()}
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-blue-500/20">
                                <DollarSign className="w-6 h-6 text-blue-400" />
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <GlassCard className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-secondary text-sm">Total P&L</p>
                                <p className={`text-2xl font-bold mt-1 ${mockPortfolio.totalPnlUsd >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {mockPortfolio.totalPnlUsd >= 0 ? '+' : ''}${mockPortfolio.totalPnlUsd.toLocaleString()}
                                </p>
                                <p className={`text-sm ${mockPortfolio.totalPnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {mockPortfolio.totalPnlPercent >= 0 ? '+' : ''}{mockPortfolio.totalPnlPercent.toFixed(2)}%
                                </p>
                            </div>
                            <div className={`p-3 rounded-xl ${mockPortfolio.totalPnlUsd >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                {mockPortfolio.totalPnlUsd >= 0 ? (
                                    <TrendingUp className="w-6 h-6 text-green-400" />
                                ) : (
                                    <TrendingDown className="w-6 h-6 text-red-400" />
                                )}
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <GlassCard className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-secondary text-sm">Open Positions</p>
                                <p className="text-2xl font-bold text-primary mt-1">{mockPortfolio.openPositions}</p>
                                <p className="text-sm text-secondary">{mockPortfolio.todayTrades} trades today</p>
                            </div>
                            <div className="p-3 rounded-xl bg-purple-500/20">
                                <BarChart3 className="w-6 h-6 text-purple-400" />
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <GlassCard className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-secondary text-sm">Win Rate</p>
                                <p className="text-2xl font-bold text-primary mt-1">{mockPortfolio.winRate}%</p>
                                <p className="text-sm text-secondary">Last 30 days</p>
                            </div>
                            <div className="p-3 rounded-xl bg-amber-500/20">
                                <Activity className="w-6 h-6 text-amber-400" />
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Portfolio Chart Placeholder */}
                <motion.div
                    className="lg:col-span-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <GlassContainer className="p-5">
                        <h2 className="text-lg font-semibold text-primary mb-4">Portfolio Performance</h2>
                        <div className="h-64 flex items-center justify-center text-secondary">
                            <div className="text-center">
                                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>Chart visualization coming soon</p>
                                <p className="text-xs mt-1">Connect API for live data</p>
                            </div>
                        </div>
                    </GlassContainer>
                </motion.div>

                {/* Bot Status */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <GlassContainer className="p-5">
                        <h2 className="text-lg font-semibold text-primary mb-4">Bot Status</h2>
                        <div className="space-y-3">
                            {mockBotStatuses.map((bot) => (
                                <div
                                    key={bot.bot_id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${bot.active ? 'bg-green-400' : 'bg-gray-400'}`} />
                                        <div>
                                            <p className="text-sm font-medium text-primary">{bot.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {bot.test_mode && (
                                                    <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">Test</span>
                                                )}
                                                {bot.lastDecision && (
                                                    <span className="text-xs text-secondary">Last: {bot.lastDecision}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-medium ${bot.todayPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {bot.todayPnl >= 0 ? '+' : ''}${bot.todayPnl.toFixed(2)}
                                        </p>
                                        <p className="text-xs text-secondary">{bot.openPositions} positions</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassContainer>
                </motion.div>
            </div>

            {/* Open Positions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
            >
                <GlassContainer className="p-5">
                    <h2 className="text-lg font-semibold text-primary mb-4">Open Positions</h2>
                    {mockPositions.length === 0 ? (
                        <div className="text-center py-8 text-secondary">
                            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No open positions</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {mockPositions.map((position) => (
                                <PositionCard key={position.position_id} position={position} />
                            ))}
                        </div>
                    )}
                </GlassContainer>
            </motion.div>
        </div>
    );
}

export default Dashboard;
