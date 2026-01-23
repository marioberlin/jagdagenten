import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BotList } from '@/applications/rush-hour-trading/components/BotList';
import { BotEditor } from '@/applications/rush-hour-trading/components/BotEditor';
import { TradingBreadcrumb } from '@/applications/rush-hour-trading/components/TradingBreadcrumb';
import type { Bot, LogicLayer, BotLogicLayerMapping } from '../../types/trading';

// Mock data for development
const mockBots: Bot[] = [
    {
        bot_id: 1,
        name: 'AI Strategy Bot',
        type: 'buy',
        symbols: 'BTCUSDT, ETHUSDT',
        test_mode: false,
        active: true,
        webhook_enabled: false,
        parameters: { max_open_positions: 5, position_size_usd: 200 },
        created_at: '2024-12-01T00:00:00Z',
    },
    {
        bot_id: 2,
        name: 'DCA Bot',
        type: 'buy',
        symbols: '*USDT',
        blacklist: 'global',
        strategy: 'DCA',
        test_mode: true,
        active: true,
        webhook_enabled: true,
        parameters: { max_open_positions: 10, position_size_usd: 50 },
        created_at: '2024-12-15T00:00:00Z',
    },
    {
        bot_id: 3,
        name: 'Technical Bot',
        type: 'sell',
        symbols: 'BTCUSDT',
        test_mode: true,
        active: false,
        webhook_enabled: false,
        parameters: { max_open_positions: 3 },
        created_at: '2024-12-20T00:00:00Z',
    },
];

const mockLogicLayers: LogicLayer[] = [
    { id: 'rsi-oversold', name: 'RSI Oversold', category: 'OSCILLATORS', tags: [], description: 'Buy when RSI < 30' },
    { id: 'macd-crossover', name: 'MACD Crossover', category: 'OSCILLATORS', tags: [], description: 'Signal/MACD line crossover' },
    { id: 'ma-crossover', name: 'MA Crossover', category: 'TREND', tags: [], description: 'Fast MA crosses slow MA' },
    { id: 'price-breakout', name: 'Price Breakout', category: 'TREND', tags: [], description: 'Break above resistance' },
    { id: 'volume-spike', name: 'Volume Spike', category: 'VOLUME', tags: [], description: 'Unusual volume detected' },
    { id: 'stop-loss', name: 'Stop Loss', category: 'RISK_MANAGEMENT', tags: [], description: 'Fixed/trailing/ATR stop' },
    { id: 'take-profit', name: 'Take Profit', category: 'RISK_MANAGEMENT', tags: [], description: 'Tiered profit targets' },
    { id: 'position-limit', name: 'Position Limit', category: 'RISK_MANAGEMENT', tags: [], description: 'Max concurrent positions' },
    { id: 'exposure-limit', name: 'Exposure Limit', category: 'RISK_MANAGEMENT', tags: [], description: 'Portfolio USD cap' },
    { id: 'ai-strategy-1', name: 'AI Momentum', category: 'AI', tags: ['AI-Generated'], description: 'AI-generated momentum strategy' },
];

interface BotConfigProps {
    mode?: 'list' | 'create' | 'edit';
}

export function BotConfig({ mode: propMode }: BotConfigProps) {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = window.location;

    // Determine mode from props or URL
    const isNewRoute = location.pathname.endsWith('/new');
    const mode = propMode || (isNewRoute ? 'create' : id ? 'edit' : 'list');
    const botId = id && !isNewRoute ? parseInt(id) : undefined;

    // State
    const [bots, setBots] = useState<Bot[]>(mockBots);
    const [availableLayers] = useState<LogicLayer[]>(mockLogicLayers);
    const [currentBot, setCurrentBot] = useState<Bot | undefined>();
    const [assignedLayers, setAssignedLayers] = useState<BotLogicLayerMapping[]>([]);
    const [saving, setSaving] = useState(false);

    // Load bot for editing
    useEffect(() => {
        if (mode === 'edit' && botId) {
            const bot = bots.find(b => b.bot_id === botId);
            setCurrentBot(bot);

            // Mock assigned layers for the bot
            if (bot) {
                setAssignedLayers([
                    { bot_id: botId, logic_layer_id: 'rsi-oversold', execution_order: 1, active: true, config: {} },
                    { bot_id: botId, logic_layer_id: 'stop-loss', execution_order: 2, active: true, config: {} },
                    { bot_id: botId, logic_layer_id: 'position-limit', execution_order: 3, active: true, config: {} },
                ]);
            }
        } else {
            setCurrentBot(undefined);
            setAssignedLayers([]);
        }
    }, [mode, botId, bots]);

    // Handlers
    function handleCreateNew() {
        navigate('/trading/bots/new');
    }

    function handleEdit(id: number) {
        navigate(`/trading/bots/${id}`);
    }

    function handleCancel() {
        navigate('/trading/bots');
    }

    async function handleToggleActive(id: number, active: boolean) {
        // Update local state (would call API in production)
        setBots(prev => prev.map(b =>
            b.bot_id === id ? { ...b, active } : b
        ));
    }

    async function handleTrigger(id: number) {
        // Would call tradingService.triggerBot(id) in production
        console.log('Triggering bot:', id);
        alert(`Bot ${id} triggered!`);
    }

    async function handleDelete(id: number) {
        if (!confirm('Are you sure you want to delete this bot?')) return;

        // Update local state (would call API in production)
        setBots(prev => prev.filter(b => b.bot_id !== id));
    }

    async function handleSave(botData: Partial<Bot>, _layers: BotLogicLayerMapping[]) {
        setSaving(true);

        try {
            // In production, this would call the API
            if (mode === 'create') {
                const newBot: Bot = {
                    ...botData as Bot,
                    bot_id: Math.max(...bots.map(b => b.bot_id)) + 1,
                    created_at: new Date().toISOString(),
                };
                setBots(prev => [...prev, newBot]);
            } else if (currentBot) {
                setBots(prev => prev.map(b =>
                    b.bot_id === currentBot.bot_id ? { ...b, ...botData } : b
                ));
            }

            // Return to list
            navigate('/trading/bots');
        } catch (error) {
            console.error('Error saving bot:', error);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="min-h-screen p-6">
            {/* Breadcrumb */}
            <TradingBreadcrumb />

            {mode === 'list' ? (
                <BotList
                    bots={bots}
                    onCreateNew={handleCreateNew}
                    onEdit={handleEdit}
                    onToggleActive={handleToggleActive}
                    onTrigger={handleTrigger}
                    onDelete={handleDelete}
                />
            ) : (
                <BotEditor
                    bot={currentBot}
                    availableLayers={availableLayers}
                    assignedLayers={assignedLayers}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    saving={saving}
                />
            )}
        </div>
    );
}

export default BotConfig;
