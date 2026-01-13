import { useState, useEffect, useCallback, useMemo } from 'react';

// ============================================
// Types
// ============================================

export interface PortfolioMetrics {
    totalValue: number;
    totalValueChange24h: number;
    totalValueChangePercent24h: number;
    totalPnL: number;
    totalPnLPercent: number;
    realizedPnL: number;
    unrealizedPnL: number;
    openPositions: number;
    avgHoldTime: string;
    winRate: number;
    winStreak: number;
    activeBots: number;
    totalBots: number;
    botHealth: 'healthy' | 'warning' | 'error';
    riskExposure: number;
    marginUsed: number;
    leverage: number;
}

export interface Asset {
    symbol: string;
    name: string;
    value: number;
    percentage: number;
    quantity: number;
    avgPrice: number;
    currentPrice: number;
    pnl: number;
    pnlPercent: number;
    color: string;
}

export interface Position {
    id: string;
    symbol: string;
    side: 'long' | 'short';
    size: number;
    entryPrice: number;
    currentPrice: number;
    pnl: number;
    pnlPercent: number;
    liquidationPrice?: number;
    margin: number;
    leverage: number;
    openedAt: Date;
    duration: string;
    stopLoss?: number;
    takeProfit?: number;
}

export interface BotStatus {
    id: string;
    name: string;
    status: 'running' | 'paused' | 'error' | 'stopped';
    strategy: string;
    pnl: number;
    pnlPercent: number;
    trades24h: number;
    winRate: number;
    positions: number;
    lastAction: string;
    lastActionTime: Date;
    uptime: string;
    health: 'healthy' | 'warning' | 'error';
}

export interface Activity {
    id: string;
    type: 'trade' | 'bot_action' | 'alert' | 'deposit' | 'withdrawal' | 'system';
    title: string;
    description: string;
    timestamp: Date;
    amount?: number;
    symbol?: string;
    side?: 'buy' | 'sell';
    status: 'success' | 'warning' | 'error' | 'info';
}

export interface ChartDataPoint {
    timestamp: number;
    value: number;
    pnl?: number;
}

export interface MarketTicker {
    symbol: string;
    price: number;
    change24h: number;
    changePercent24h: number;
    volume24h: number;
    high24h: number;
    low24h: number;
}

export type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';

// ============================================
// Mock Data Generators
// ============================================

const generateChartData = (days: number, startValue: number = 10000): ChartDataPoint[] => {
    const data: ChartDataPoint[] = [];
    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;
    let value = startValue;

    for (let i = days; i >= 0; i--) {
        const volatility = 0.03; // 3% daily volatility
        const trend = 0.001; // Slight upward trend
        const change = (Math.random() - 0.5 + trend) * volatility * value;
        value += change;

        data.push({
            timestamp: now - (i * msPerDay),
            value: Math.round(value * 100) / 100,
            pnl: value - startValue,
        });
    }

    return data;
};

const MOCK_ASSETS: Asset[] = [
    { symbol: 'BTC', name: 'Bitcoin', value: 45234.50, percentage: 42.5, quantity: 1.05, avgPrice: 41000, currentPrice: 43080.48, pnl: 2184.50, pnlPercent: 5.07, color: '#F7931A' },
    { symbol: 'ETH', name: 'Ethereum', value: 28450.00, percentage: 26.8, quantity: 12.5, avgPrice: 2150, currentPrice: 2276, pnl: 1575.00, pnlPercent: 5.86, color: '#627EEA' },
    { symbol: 'SOL', name: 'Solana', value: 15680.00, percentage: 14.7, quantity: 145, avgPrice: 98, currentPrice: 108.14, pnl: 1469.30, pnlPercent: 10.35, color: '#00FFA3' },
    { symbol: 'USDT', name: 'Tether', value: 10000.00, percentage: 9.4, quantity: 10000, avgPrice: 1, currentPrice: 1, pnl: 0, pnlPercent: 0, color: '#26A17B' },
    { symbol: 'LINK', name: 'Chainlink', value: 4280.00, percentage: 4.0, quantity: 280, avgPrice: 14.50, currentPrice: 15.29, pnl: 221.20, pnlPercent: 5.45, color: '#2A5ADA' },
    { symbol: 'AVAX', name: 'Avalanche', value: 2750.00, percentage: 2.6, quantity: 75, avgPrice: 34, currentPrice: 36.67, pnl: 200.25, pnlPercent: 7.85, color: '#E84142' },
];

const MOCK_POSITIONS: Position[] = [
    { id: 'pos-1', symbol: 'BTC/USDT', side: 'long', size: 0.5, entryPrice: 42150, currentPrice: 43200, pnl: 525, pnlPercent: 2.49, margin: 4215, leverage: 5, openedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), duration: '3d 4h', stopLoss: 40000, takeProfit: 48000 },
    { id: 'pos-2', symbol: 'ETH/USDT', side: 'long', size: 5, entryPrice: 2280, currentPrice: 2350, pnl: 350, pnlPercent: 3.07, margin: 2280, leverage: 5, openedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), duration: '1d 6h', stopLoss: 2100, takeProfit: 2600 },
    { id: 'pos-3', symbol: 'SOL/USDT', side: 'short', size: 25, entryPrice: 112, currentPrice: 108, pnl: 100, pnlPercent: 3.57, margin: 560, leverage: 5, openedAt: new Date(Date.now() - 8 * 60 * 60 * 1000), duration: '8h 23m' },
    { id: 'pos-4', symbol: 'LINK/USDT', side: 'long', size: 100, entryPrice: 14.80, currentPrice: 15.29, pnl: 49, pnlPercent: 3.31, margin: 296, leverage: 5, openedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), duration: '2d 12h', takeProfit: 18 },
    { id: 'pos-5', symbol: 'AVAX/USDT', side: 'long', size: 30, entryPrice: 35.50, currentPrice: 36.67, pnl: 35.10, pnlPercent: 3.30, margin: 213, leverage: 5, openedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), duration: '5h 10m' },
];

const MOCK_BOTS: BotStatus[] = [
    { id: 'bot-1', name: 'Alpha Momentum', status: 'running', strategy: 'Momentum + RSI', pnl: 2847.50, pnlPercent: 14.2, trades24h: 12, winRate: 75, positions: 3, lastAction: 'Opened LONG BTC/USDT', lastActionTime: new Date(Date.now() - 25 * 60 * 1000), uptime: '45d 12h', health: 'healthy' },
    { id: 'bot-2', name: 'DCA Master', status: 'running', strategy: 'Dollar Cost Average', pnl: 1234.00, pnlPercent: 8.5, trades24h: 4, winRate: 82, positions: 5, lastAction: 'Bought ETH at $2,350', lastActionTime: new Date(Date.now() - 2 * 60 * 60 * 1000), uptime: '120d 4h', health: 'healthy' },
    { id: 'bot-3', name: 'Grid Trader Pro', status: 'paused', strategy: 'Grid Trading', pnl: -156.30, pnlPercent: -2.1, trades24h: 0, winRate: 58, positions: 0, lastAction: 'Paused by user', lastActionTime: new Date(Date.now() - 12 * 60 * 60 * 1000), uptime: '15d 8h', health: 'warning' },
    { id: 'bot-4', name: 'Arbitrage Scanner', status: 'running', strategy: 'Cross-Exchange Arb', pnl: 567.80, pnlPercent: 4.8, trades24h: 28, winRate: 92, positions: 1, lastAction: 'Arb opportunity found', lastActionTime: new Date(Date.now() - 5 * 60 * 1000), uptime: '30d 0h', health: 'healthy' },
    { id: 'bot-5', name: 'News Sentiment', status: 'error', strategy: 'NLP Sentiment', pnl: 89.20, pnlPercent: 1.2, trades24h: 0, winRate: 61, positions: 0, lastAction: 'API connection lost', lastActionTime: new Date(Date.now() - 45 * 60 * 1000), uptime: '5d 2h', health: 'error' },
];

const MOCK_ACTIVITIES: Activity[] = [
    { id: 'act-1', type: 'trade', title: 'BTC Long Opened', description: 'Bought 0.5 BTC at $42,150 with 5x leverage', timestamp: new Date(Date.now() - 25 * 60 * 1000), amount: 21075, symbol: 'BTC/USDT', side: 'buy', status: 'success' },
    { id: 'act-2', type: 'bot_action', title: 'Alpha Momentum', description: 'RSI oversold signal detected, opening long position', timestamp: new Date(Date.now() - 30 * 60 * 1000), status: 'info' },
    { id: 'act-3', type: 'alert', title: 'Price Alert Triggered', description: 'ETH reached target price of $2,350', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), symbol: 'ETH', status: 'warning' },
    { id: 'act-4', type: 'trade', title: 'SOL Short Opened', description: 'Sold 25 SOL at $112 with 5x leverage', timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), amount: 2800, symbol: 'SOL/USDT', side: 'sell', status: 'success' },
    { id: 'act-5', type: 'deposit', title: 'Deposit Received', description: 'Deposited 5,000 USDT to trading wallet', timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), amount: 5000, status: 'success' },
    { id: 'act-6', type: 'bot_action', title: 'DCA Master', description: 'Scheduled buy executed: 0.5 ETH at $2,340', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), amount: 1170, symbol: 'ETH', status: 'success' },
    { id: 'act-7', type: 'system', title: 'Bot Health Alert', description: 'News Sentiment bot lost API connection', timestamp: new Date(Date.now() - 45 * 60 * 1000), status: 'error' },
    { id: 'act-8', type: 'trade', title: 'Take Profit Hit', description: 'LINK long closed at $15.50 (+12.5%)', timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000), amount: 186, symbol: 'LINK/USDT', side: 'sell', status: 'success' },
];

const MOCK_MARKET: MarketTicker[] = [
    { symbol: 'BTC', price: 43200, change24h: 1250, changePercent24h: 2.98, volume24h: 28_500_000_000, high24h: 43800, low24h: 41200 },
    { symbol: 'ETH', price: 2350, change24h: 85, changePercent24h: 3.75, volume24h: 15_200_000_000, high24h: 2420, low24h: 2245 },
    { symbol: 'SOL', price: 108.14, change24h: -4.86, changePercent24h: -4.30, volume24h: 2_800_000_000, high24h: 115, low24h: 105 },
    { symbol: 'BNB', price: 312.50, change24h: 8.20, changePercent24h: 2.69, volume24h: 1_200_000_000, high24h: 318, low24h: 302 },
    { symbol: 'XRP', price: 0.542, change24h: 0.015, changePercent24h: 2.85, volume24h: 980_000_000, high24h: 0.558, low24h: 0.520 },
    { symbol: 'ADA', price: 0.385, change24h: -0.012, changePercent24h: -3.02, volume24h: 450_000_000, high24h: 0.405, low24h: 0.378 },
    { symbol: 'AVAX', price: 36.67, change24h: 1.85, changePercent24h: 5.31, volume24h: 620_000_000, high24h: 38.20, low24h: 34.50 },
    { symbol: 'LINK', price: 15.29, change24h: 0.54, changePercent24h: 3.66, volume24h: 380_000_000, high24h: 15.80, low24h: 14.60 },
];

// ============================================
// Hook
// ============================================

interface UseDashboardDataReturn {
    // Core metrics
    metrics: PortfolioMetrics | null;

    // Assets & positions
    assets: Asset[];
    positions: Position[];

    // Bots
    bots: BotStatus[];

    // Activity
    activities: Activity[];

    // Market data
    marketTickers: MarketTicker[];

    // Chart data
    chartData: ChartDataPoint[];
    timeRange: TimeRange;
    setTimeRange: (range: TimeRange) => void;

    // State
    isLoading: boolean;
    error: string | null;
    lastUpdated: Date | null;

    // Actions
    refresh: () => Promise<void>;
}

const TIME_RANGE_DAYS: Record<TimeRange, number> = {
    '1D': 1,
    '1W': 7,
    '1M': 30,
    '3M': 90,
    '1Y': 365,
    'ALL': 730,
};

export function useDashboardData(): UseDashboardDataReturn {
    const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
    const [assets] = useState<Asset[]>(MOCK_ASSETS);
    const [positions] = useState<Position[]>(MOCK_POSITIONS);
    const [bots] = useState<BotStatus[]>(MOCK_BOTS);
    const [activities] = useState<Activity[]>(MOCK_ACTIVITIES);
    const [marketTickers, setMarketTickers] = useState<MarketTicker[]>(MOCK_MARKET);
    const [timeRange, setTimeRange] = useState<TimeRange>('1M');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // Generate chart data based on time range
    const chartData = useMemo(() => {
        const days = TIME_RANGE_DAYS[timeRange];
        return generateChartData(days, 85000);
    }, [timeRange]);

    // Calculate metrics from assets
    const calculateMetrics = useCallback((): PortfolioMetrics => {
        const totalValue = assets.reduce((sum, a) => sum + a.value, 0);
        const totalPnL = assets.reduce((sum, a) => sum + a.pnl, 0);
        const runningBots = bots.filter(b => b.status === 'running').length;
        const healthyBots = bots.filter(b => b.health === 'healthy').length;
        const errorBots = bots.filter(b => b.health === 'error').length;

        return {
            totalValue,
            totalValueChange24h: 3247.80,
            totalValueChangePercent24h: 3.12,
            totalPnL,
            totalPnLPercent: (totalPnL / (totalValue - totalPnL)) * 100,
            realizedPnL: 4520.30,
            unrealizedPnL: totalPnL,
            openPositions: positions.length,
            avgHoldTime: '2d 8h',
            winRate: 68.5,
            winStreak: 4,
            activeBots: runningBots,
            totalBots: bots.length,
            botHealth: errorBots > 0 ? 'error' : healthyBots < runningBots ? 'warning' : 'healthy',
            riskExposure: 42.5,
            marginUsed: positions.reduce((sum, p) => sum + p.margin, 0),
            leverage: 5,
        };
    }, [assets, positions, bots]);

    // Simulate real-time market updates
    useEffect(() => {
        const interval = setInterval(() => {
            setMarketTickers(prev => prev.map(ticker => {
                const change = (Math.random() - 0.5) * 0.002 * ticker.price;
                const newPrice = ticker.price + change;
                return {
                    ...ticker,
                    price: Math.round(newPrice * 100) / 100,
                    change24h: ticker.change24h + change,
                    changePercent24h: ((ticker.change24h + change) / (newPrice - ticker.change24h)) * 100,
                };
            }));
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    // Load initial data
    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 800));

            setMetrics(calculateMetrics());
            setLastUpdated(new Date());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
        } finally {
            setIsLoading(false);
        }
    }, [calculateMetrics]);

    // Initial load
    useEffect(() => {
        loadData();
    }, [loadData]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, [loadData]);

    return {
        metrics,
        assets,
        positions,
        bots,
        activities,
        marketTickers,
        chartData,
        timeRange,
        setTimeRange,
        isLoading,
        error,
        lastUpdated,
        refresh: loadData,
    };
}

export default useDashboardData;
