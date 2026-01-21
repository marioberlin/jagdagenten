/**
 * Trading Agents - Main Entry Point
 * 
 * Exports all trading agents for registration with the server.
 * 
 * Phase 1-2: Core Trading
 * - MarketDataAgent: Live Binance market data
 * - TradeExecutorAgent: Mock order execution
 * - StrategyAgent: 13 technical indicators
 * - RiskAgent: Position limits, stop-loss/take-profit
 * - OrchestratorAgent: Workflow coordination
 * 
 * Phase 4: Infrastructure
 * - NotificationAgent: Alerts via email, Slack, Telegram
 * - SymbolManagerAgent: Watchlists, blacklists, favorites
 * - WebhookGatewayAgent: TradingView and custom webhooks
 * - MaintenanceAgent: Health checks, cleanup, optimization
 */

// Phase 1: Market Data Agent
export {
    getMarketDataAgentCard,
    handleMarketDataRequest
} from './market-data/index.js';

// Phase 2: Core Trading Agents
export {
    getTradeExecutorAgentCard,
    handleTradeExecutorRequest,
} from './trade-executor/index.js';

export {
    getStrategyAgentCard,
    handleStrategyRequest,
} from './strategy/index.js';

export {
    getRiskAgentCard,
    handleRiskRequest,
} from './risk/index.js';

export {
    getOrchestratorAgentCard,
    handleOrchestratorRequest,
} from './orchestrator/index.js';

// Phase 4: Infrastructure Agents
export {
    getNotificationAgentCard,
    handleNotificationRequest,
} from './notification/index.js';

export {
    getSymbolManagerAgentCard,
    handleSymbolManagerRequest,
} from './symbol-manager/index.js';

export {
    getWebhookGatewayAgentCard,
    handleWebhookGatewayRequest,
    processWebhook,
} from './webhook-gateway/index.js';

export {
    getMaintenanceAgentCard,
    handleMaintenanceRequest,
} from './maintenance/index.js';

// REST API (Phase 5)
export { createTradingRestApi } from './rest-api.js';

// Shared utilities (for use by other agents)
export * from './shared/index.js';
