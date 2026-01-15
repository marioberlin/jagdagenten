/**
 * A2A Executors
 *
 * Agent executors that implement the business logic for A2A message handling.
 */

export {
  BaseA2UIExecutor,
  type AgentExecutionContext,
  type AgentExecutionResult,
  type ExecutorA2UIMessage,
  type ExecutorA2UIComponent,
  type ExecutorA2UIStyling,
  type ExecutorA2UIBeginRendering,
  type ExecutorA2UISurfaceUpdate,
  type ExecutorA2UISetModel,
  type ExecutorA2UIActionResponse,
} from './base.js';
export { LiquidCryptoExecutor, getLiquidCryptoAgentCard } from './liquidcrypto.js';

// Trading A2UI Components
export {
  TradingComponents,
  createTradingDashboard,
  type PriceData,
  type OrderBookData,
  type OrderBookEntry,
  type PortfolioData,
  type PortfolioHolding,
  type TradeData,
  type AlertData,
  type ChartDataPoint,
} from './trading-components.js';

// Orchestrator Executor
export { OrchestratorExecutor, getOrchestratorAgentCard } from './orchestrator.js';
