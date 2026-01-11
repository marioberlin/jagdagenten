// Trading API Service
// Handles communication with n8n workflows and database

import type {
    Bot,
    Position,
    Trade,
    Signal,
    RiskSettings,
    ExposureData,
    PortfolioSummary,
    BotStatus,
    LogicLayer,
    BotLogicLayerMapping,
    ApiResponse,
    PaginatedResponse,
} from '../types/trading';

// Configuration
const N8N_WEBHOOK_BASE = import.meta.env.VITE_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook';
const API_BASE = import.meta.env.VITE_TRADING_API_URL || '/api/trading';

// ============================================================
// Helper Functions
// ============================================================

async function fetchApi<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return {
            success: true,
            data,
            timestamp: new Date().toISOString(),
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
        };
    }
}

async function triggerWebhook<T>(
    webhookPath: string,
    payload: Record<string, unknown> = {}
): Promise<ApiResponse<T>> {
    try {
        const response = await fetch(`${N8N_WEBHOOK_BASE}/${webhookPath}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        return {
            success: true,
            data,
            timestamp: new Date().toISOString(),
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
        };
    }
}

// ============================================================
// Bot Management
// ============================================================

export async function getBots(): Promise<ApiResponse<Bot[]>> {
    return fetchApi<Bot[]>('/bots');
}

export async function getBot(botId: number): Promise<ApiResponse<Bot>> {
    return fetchApi<Bot>(`/bots/${botId}`);
}

export async function createBot(
    config: Omit<Bot, 'bot_id' | 'created_at'>
): Promise<ApiResponse<Bot>> {
    return fetchApi<Bot>('/bots', {
        method: 'POST',
        body: JSON.stringify(config),
    });
}

export async function updateBot(
    botId: number,
    config: Partial<Bot>
): Promise<ApiResponse<Bot>> {
    return fetchApi<Bot>(`/bots/${botId}`, {
        method: 'PATCH',
        body: JSON.stringify(config),
    });
}

export async function deleteBot(botId: number): Promise<ApiResponse<void>> {
    return fetchApi<void>(`/bots/${botId}`, {
        method: 'DELETE',
    });
}

export async function toggleBotActive(
    botId: number,
    active: boolean
): Promise<ApiResponse<Bot>> {
    return updateBot(botId, { active });
}

export async function toggleBotTestMode(
    botId: number,
    testMode: boolean
): Promise<ApiResponse<Bot>> {
    return updateBot(botId, { test_mode: testMode });
}

// ============================================================
// Bot Logic Layers
// ============================================================

export async function getAvailableLogicLayers(): Promise<ApiResponse<LogicLayer[]>> {
    return fetchApi<LogicLayer[]>('/logic-layers');
}

export async function getBotLogicLayers(
    botId: number
): Promise<ApiResponse<BotLogicLayerMapping[]>> {
    return fetchApi<BotLogicLayerMapping[]>(`/bots/${botId}/logic-layers`);
}

export async function updateBotLogicLayers(
    botId: number,
    layers: BotLogicLayerMapping[]
): Promise<ApiResponse<BotLogicLayerMapping[]>> {
    return fetchApi<BotLogicLayerMapping[]>(`/bots/${botId}/logic-layers`, {
        method: 'PUT',
        body: JSON.stringify({ layers }),
    });
}

// ============================================================
// Positions
// ============================================================

export async function getPositions(
    botId?: number,
    includeClosed: boolean = false
): Promise<ApiResponse<Position[]>> {
    const params = new URLSearchParams();
    if (botId) params.set('bot_id', botId.toString());
    if (includeClosed) params.set('include_closed', 'true');

    return fetchApi<Position[]>(`/positions?${params}`);
}

export async function getOpenPositions(): Promise<ApiResponse<Position[]>> {
    return fetchApi<Position[]>('/positions?open_only=true');
}

// ============================================================
// Trades
// ============================================================

export async function getTrades(
    botId?: number,
    limit: number = 50
): Promise<ApiResponse<PaginatedResponse<Trade>>> {
    const params = new URLSearchParams();
    if (botId) params.set('bot_id', botId.toString());
    params.set('limit', limit.toString());

    return fetchApi<PaginatedResponse<Trade>>(`/trades?${params}`);
}

export async function getRecentTrades(
    hours: number = 24
): Promise<ApiResponse<Trade[]>> {
    return fetchApi<Trade[]>(`/trades/recent?hours=${hours}`);
}

// ============================================================
// Signals
// ============================================================

export async function getSignals(
    botId?: number,
    limit: number = 50
): Promise<ApiResponse<PaginatedResponse<Signal>>> {
    const params = new URLSearchParams();
    if (botId) params.set('bot_id', botId.toString());
    params.set('limit', limit.toString());

    return fetchApi<PaginatedResponse<Signal>>(`/signals?${params}`);
}

// ============================================================
// Portfolio & Exposure
// ============================================================

export async function getPortfolioSummary(): Promise<ApiResponse<PortfolioSummary>> {
    return fetchApi<PortfolioSummary>('/portfolio/summary');
}

export async function getExposure(): Promise<ApiResponse<ExposureData>> {
    return fetchApi<ExposureData>('/portfolio/exposure');
}

export async function getBotStatuses(): Promise<ApiResponse<BotStatus[]>> {
    return fetchApi<BotStatus[]>('/bots/status');
}

// ============================================================
// Risk Settings
// ============================================================

export async function getRiskSettings(): Promise<ApiResponse<RiskSettings>> {
    return fetchApi<RiskSettings>('/settings/risk');
}

export async function updateRiskSettings(
    settings: Partial<RiskSettings>
): Promise<ApiResponse<RiskSettings>> {
    return fetchApi<RiskSettings>('/settings/risk', {
        method: 'PATCH',
        body: JSON.stringify(settings),
    });
}

// ============================================================
// Bot Triggers (n8n Webhooks)
// ============================================================

export async function triggerBot(botId: number): Promise<ApiResponse<unknown>> {
    return triggerWebhook('trading-bot-trigger', { bot_id: botId });
}

export async function manualTrade(
    botId: number,
    symbol: string,
    action: 'BUY' | 'SELL',
    quantity?: number
): Promise<ApiResponse<unknown>> {
    return triggerWebhook('manual-trade', {
        bot_id: botId,
        symbol,
        action,
        quantity,
    });
}

// ============================================================
// Blacklist
// ============================================================

export async function getBlacklist(): Promise<ApiResponse<string[]>> {
    return fetchApi<string[]>('/blacklist');
}

export async function addToBlacklist(
    symbol: string,
    reason?: string
): Promise<ApiResponse<void>> {
    return fetchApi<void>('/blacklist', {
        method: 'POST',
        body: JSON.stringify({ symbol, reason }),
    });
}

export async function removeFromBlacklist(symbol: string): Promise<ApiResponse<void>> {
    return fetchApi<void>(`/blacklist/${symbol}`, {
        method: 'DELETE',
    });
}

// ============================================================
// Export Service Object
// ============================================================

export const tradingService = {
    // Bots
    getBots,
    getBot,
    createBot,
    updateBot,
    deleteBot,
    toggleBotActive,
    toggleBotTestMode,

    // Logic Layers
    getAvailableLogicLayers,
    getBotLogicLayers,
    updateBotLogicLayers,

    // Positions
    getPositions,
    getOpenPositions,

    // Trades
    getTrades,
    getRecentTrades,

    // Signals
    getSignals,

    // Portfolio
    getPortfolioSummary,
    getExposure,
    getBotStatuses,

    // Risk
    getRiskSettings,
    updateRiskSettings,

    // Triggers
    triggerBot,
    manualTrade,

    // Blacklist
    getBlacklist,
    addToBlacklist,
    removeFromBlacklist,
};

export default tradingService;
