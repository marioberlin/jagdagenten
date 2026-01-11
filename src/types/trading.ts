// Trading System Types
// Shared types used by both trading UI and n8n workflows

// ============================================================
// Bot Configuration
// ============================================================

export type BotType = 'buy' | 'sell';

export interface Bot {
  bot_id: number;
  name: string;
  type: BotType;
  symbols: string;
  blacklist?: string;
  strategy?: string;
  webhook_enabled: boolean;
  webhook_target_logic?: string;
  parameters: BotParameters;
  test_mode: boolean;
  active: boolean;
  created_at: string;
}

export interface BotParameters {
  // Position sizing
  position_size_usd?: number;
  max_order_value?: number;
  risk_per_trade_percent?: number;

  // Risk management
  max_open_positions?: number;
  max_exposure_usd?: number;
  max_per_asset_percent?: number;
  max_per_asset_usd?: number;

  // Stop loss
  stop_loss_percent?: number;
  stop_loss_type?: 'fixed' | 'trailing' | 'atr';
  trailing_stop_percent?: number;

  // Take profit
  take_profit_targets?: TakeProfitTarget[];
  enable_trailing_after_target?: boolean;

  // AI/Strategy specific
  confidence_threshold?: number;
  diversification_factor?: 'low' | 'medium' | 'high';
  max_tokens_to_analyze?: number;

  // DCA specific
  base_dca_amount_usd?: number;
  dca_interval_hours?: number;
  dip_buy_multiplier?: number;

  // Custom parameters
  [key: string]: unknown;
}

export interface TakeProfitTarget {
  percent: number;
  sellPercent: number;
}

// ============================================================
// Logic Layers
// ============================================================

export interface LogicLayer {
  id: string;
  name: string;
  description?: string;
  category: LogicLayerCategory;
  tags: string[];
  parameters?: Record<string, unknown>;
}

export type LogicLayerCategory =
  | 'OSCILLATORS'
  | 'TREND'
  | 'VOLUME'
  | 'RISK_MANAGEMENT'
  | 'AI'
  | 'CUSTOM';

export interface BotLogicLayerMapping {
  bot_id: number;
  logic_layer_id: string;
  execution_order: number;
  active: boolean;
  config: Record<string, unknown>;
}

// ============================================================
// Trading Data
// ============================================================

export interface Position {
  position_id: number;
  bot_id: number;
  symbol: string;
  quantity: number;
  entry_price: number;
  opened_at: string;
  closed_at?: string;

  // Calculated fields (from API)
  current_price?: number;
  unrealized_pnl?: number;
  unrealized_pnl_percent?: number;
  highest_price?: number;
  highest_profit_percent?: number;
  targets_hit?: number[];
}

export interface Trade {
  trade_id: number;
  bot_id: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  executed_at: string;
  profit?: number;
  execution_mode: 'schedule' | 'webhook';
}

export interface Signal {
  signal_id: number;
  bot_id: number;
  time: string;
  symbol: string;
  decision: 'BUY' | 'SELL' | 'HOLD';
  execution_mode: 'schedule' | 'webhook';
  logic_results: LogicLayerResult[];
}

export interface LogicLayerResult {
  logicName: string;
  pass: boolean;
  result: Record<string, unknown>;
  suggestedAction?: 'BUY' | 'SELL' | 'HOLD';
}

// ============================================================
// Risk Management
// ============================================================

export interface RiskSettings {
  maxOpenPositions: number;
  maxExposureUsd: number;
  maxPerAssetPercent: number;
  maxPerAssetUsd: number;
  defaultStopLossPercent: number;
  defaultStopLossType: 'fixed' | 'trailing' | 'atr';
  defaultTakeProfitTargets: TakeProfitTarget[];
}

export interface ExposureData {
  totalExposureUsd: number;
  availableCapacityUsd: number;
  exposureByAsset: Record<string, number>;
  positionCount: number;
  maxPositions: number;
}

// ============================================================
// Dashboard
// ============================================================

export interface PortfolioSummary {
  totalValueUsd: number;
  totalPnlUsd: number;
  totalPnlPercent: number;
  openPositions: number;
  todayTrades: number;
  winRate: number;
}

export interface BotStatus {
  bot_id: number;
  name: string;
  active: boolean;
  test_mode: boolean;
  lastSignalTime?: string;
  lastDecision?: 'BUY' | 'SELL' | 'HOLD';
  openPositions: number;
  todayPnl: number;
}

// ============================================================
// API Responses
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
