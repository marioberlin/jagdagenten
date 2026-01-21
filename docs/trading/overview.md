# TRADING.md

Trading Bot Documentation for LiquidCrypto

## Overview

This repository contains a **Python-based crypto trading bot** that implements automated "buy the dip" strategies with dynamic position averaging. The bot integrates with the Binance exchange and features a React-based dashboard for monitoring and configuration.

---

## Architecture

### Python Bot (`bot/`)

The core trading engine is written in Python and consists of four main modules:

#### 1. `bot.py` - Main Bot Logic
- Entry point for the trading bot
- Manages bot lifecycle (start, stop, monitor)
- Coordinates between Binance client and state manager
- Implements buy/sell decision logic

#### 2. `binance_client.py` - Exchange Integration
- Handles all Binance API interactions
- Functions:
  - Get current market prices
  - Place buy/sell orders
  - Fetch account balances
  - Query order status
- Error handling and rate limit management

#### 3. `state_manager.py` - Position Tracking
- Manages all open positions and order state
- Tracks position levels (DCA - Dollar Cost Averaging)
- Persists state to `trades.json`
- Calculates average entry prices
- Monitors profit/loss for exit conditions

#### 4. `config.py` - Strategy Configuration
- Global bot settings (investment size, max levels, profit target, stop loss)
- Strategy profiles:
  - **STANDARD** (3%, 5%, 8%, 13%, 21% spacing) - For safe assets (BTC, ETH, BNB, LTC)
  - **DEGEN** (5%, 10%, 15%, 20%, 25% spacing) - For volatile assets (SOL, PEPE, DOGE, WIF)
- Pair-to-strategy mapping
- DRY_RUN mode for testing without real trades

---

## A2A Trading Agents (TypeScript)

In addition to the Python bot, the project includes a **9-agent A2A trading system** built in TypeScript that integrates with the LiquidOS agent framework.

### Architecture

```
server/src/agents/trading/
├── index.ts               # Agent fleet registration
├── rest-api.ts            # REST API (11 endpoints)
├── shared/
│   ├── binance-client.ts  # Binance API client
│   ├── binance-websocket.ts # Real-time streams
│   ├── types.ts           # Shared types
│   └── resilience.ts      # Retry patterns
├── market-data/           # Live price feeds
├── trade-executor/        # Order execution
├── strategy/              # 14 technical indicators
├── risk/                  # Position limits
├── orchestrator/          # Workflow coordination
├── notification/          # Alerts
├── symbol-manager/        # Watchlists
├── webhook-gateway/       # TradingView webhooks
└── maintenance/           # Health monitoring
```

### Trading Agents

| Agent | Purpose |
|-------|---------|
| **MarketDataAgent** | Live Binance prices, klines, order book |
| **TradeExecutorAgent** | Execute orders on Binance Testnet |
| **StrategyAgent** | 14 technical indicators, signal aggregation |
| **RiskAgent** | Position limits, stop-loss, take-profit |
| **OrchestratorAgent** | Multi-step trading workflows |
| **NotificationAgent** | Price alerts, order notifications |
| **SymbolManagerAgent** | User watchlists |
| **WebhookGatewayAgent** | TradingView alerts |
| **MaintenanceAgent** | System health monitoring |

### REST API Endpoints

```
GET  /api/trading/prices         → All tickers
GET  /api/trading/price/:symbol  → Single price
GET  /api/trading/klines/:symbol → OHLCV data
GET  /api/trading/orderbook/:sym → Order book
GET  /api/trading/analyze/:sym   → 14-indicator analysis
GET  /api/trading/scan           → Market scanner
GET  /api/trading/watchlist      → User watchlist
GET  /api/trading/account        → Account balances
GET  /api/trading/orders/:symbol → Order history (24h/7d)
GET  /api/trading/trades/:symbol → Trade history (24h/7d)
GET  /api/trading/health         → System health
```

### Technical Indicators (14)

| Category | Indicators |
|----------|------------|
| Momentum | RSI, MACD, Stochastic |
| Trend | MA Crossover, ADX, Ichimoku, HMA |
| Volatility | Bollinger Bands, ATR |
| Volume | Volume Spike, OBV |
| Other | Fibonacci, Fear & Greed, BTC Correlation |

### RushHour Trading App

The A2A agents power the **RushHour Trading App** in LiquidOS:

- **Dashboard Tab**: Portfolio metrics, positions, recent activity
- **Markets Tab**: Live price grid with search/sorting
- **Bots Tab**: Automated trading bot management
- **Risk Tab**: Risk parameter configuration

## Strategy Overview

### Buy the Dip (Dollar Cost Averaging)

The bot implements a **multi-level DCA strategy**:

1. **Initial Position**: Buy when asset drops by configured percentage
2. **Additional Levels**: Add to position at increasing intervals (Fibonacci-like spacing)
3. **Profit Target**: Exit entire position when overall profit reaches 1%
4. **Stop Loss**: Hard stop at -30% to prevent catastrophic losses

**Example (STANDARD strategy for ETHUSDT):**
- Level 1: Buy when price drops 3% from entry
- Level 2: Buy when price drops 8% total (3% + 5%)
- Level 3: Buy when price drops 16% total (3% + 5% + 8%)
- Level 4: Buy when price drops 29% total (3% + 5% + 8% + 13%)
- Level 5: Buy when price drops 50% total (3% + 5% + 8% + 13% + 21%)

**Exit Conditions:**
- ✅ Sell all levels when average position is +1% profit
- ❌ Stop loss at -30% to cut losses

---

## Configuration

### Environment Variables

Required in `.env`:
```bash
BINANCE_API_KEY=your_binance_api_key
BINANCE_API_SECRET=your_binance_api_secret
```

### Bot Settings (`bot/config.py`)

| Parameter | Default | Description |
|-----------|---------|-------------|
| `INVESTMENT_PER_LEVEL` | 50.0 USDT | Amount to invest per buy order |
| `MAX_LEVELS` | 5 | Maximum number of DCA levels |
| `PROFIT_TARGET` | 0.01 (1%) | Profit threshold to close position |
| `HARD_STOP_LOSS` | -0.30 (-30%) | Maximum loss before force exit |
| `DRY_RUN` | True | Safety mode - logs orders without executing |

**⚠️ IMPORTANT**: Always test with `DRY_RUN = True` before enabling live trading!

---

## Trading Dashboard

### React Components (`src/components/trading/`)

The frontend provides a real-time dashboard for monitoring and configuring the bot:

| Component | Purpose |
|-----------|---------|
| `BotList.tsx` | Overview of all monitored trading pairs |
| `BotCard.tsx` | Individual bot status card (active/paused, P&L) |
| `PositionCard.tsx` | Display open positions and average entry price |
| `LogicLayerCard.tsx` | Strategy configuration (levels, spacing, targets) |
| `BotEditor.tsx` | Edit bot parameters and strategy |
| `LogicLayerPalette.tsx` | Visual strategy builder |

### Pages (`src/pages/trading/`)

- **Trading Dashboard** - Main monitoring interface
- **Bot Configuration** - Strategy and pair management
- **Risk Settings** - Global risk parameters

---

## Backtesting & Analysis

The repository includes several backtesting scripts for strategy optimization:

### Scripts

| Script | Purpose |
|--------|---------|
| `btc_strategy_live_backtest.cjs` | BTC strategy backtesting with live data |
| `paxg_strategy_backtest.cjs` | PAXG (gold token) strategy testing |
| `advanced_optimizer.cjs` | Multi-parameter strategy optimization |
| `rsi_optimizer.cjs` | RSI indicator optimization |
| `strategy_analysis.js` | Statistical analysis of strategy performance |
| `summarize_results.js` | Generate summary reports from backtest data |

### Data

- `btcusdt_1d_2025_to_today.json` - Historical BTC daily klines
- `data_klines_2025_1m/` - 1-minute klines for all USDT pairs (2025 data)
- `download_usdt_klines_2025.mjs` - Script to download additional kline data

### Results

- `analysis_results_all.csv` - Backtest results across all strategies
- `full_simulation_results.md` - Detailed simulation report

---

## Running the Bot

### Development Mode (DRY_RUN)

```bash
cd bot
python bot.py
```

This will:
1. Connect to Binance (read-only)
2. Monitor configured pairs
3. Log buy/sell signals WITHOUT executing trades
4. Update `trades.json` with simulated state

### Live Trading (DANGER!)

**Only after thorough testing:**

1. Edit `bot/config.py`:
   ```python
   DRY_RUN = False  # DANGER: Real trades will execute
   ```

2. Run bot:
   ```bash
   cd bot
   python bot.py
   ```

**⚠️ WARNING**: Live trading risks real capital. Start with small `INVESTMENT_PER_LEVEL` amounts.

---

## State Management

### `trades.json`

Persistent state file that tracks:
- Open positions per pair
- Entry prices for each level
- Current profit/loss
- Order history

**Example structure:**
```json
{
  "ETHUSDT": {
    "levels": [
      {"entry_price": 2450.0, "quantity": 0.02, "level": 1},
      {"entry_price": 2400.0, "quantity": 0.02, "level": 2}
    ],
    "average_entry": 2425.0,
    "total_invested": 100.0,
    "unrealized_pnl": -1.5
  }
}
```

---

## n8n Integration

The `n8n_backup/` directory contains workflow backups for:
- Trade execution automation
- Alert notifications
- Data synchronization with external services

See individual workflow JSON files for details.

---

## Risk Management

### Built-in Protections

1. **Maximum Levels** - Prevents infinite position averaging
2. **Hard Stop Loss** - Forces exit at -30% loss
3. **DRY_RUN Mode** - Test strategies without risk
4. **Position Limits** - `INVESTMENT_PER_LEVEL` caps per-order exposure

### Best Practices

- ✅ Always test with `DRY_RUN = True` first
- ✅ Start with small `INVESTMENT_PER_LEVEL` (e.g., $10-50)
- ✅ Monitor bot frequently during first week
- ✅ Set calendar reminders to check open positions
- ✅ Use STANDARD strategy for established coins (BTC, ETH)
- ✅ Only use DEGEN strategy with capital you can afford to lose
- ❌ Never risk more than 5% of portfolio on one pair
- ❌ Don't run multiple bots on same pair simultaneously

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Bot won't connect to Binance | Verify API keys in `.env`, check IP whitelist on Binance |
| Orders not executing (DRY_RUN=False) | Check account balance, verify trading permissions on API key |
| `trades.json` corruption | Restore from backup or delete file (bot will recreate) |
| Dashboard not showing data | Ensure bot is running, check `trades.json` exists |
| Strategy too aggressive | Reduce `MAX_LEVELS`, increase spacing in `config.py` |

---

## Future Improvements

- [ ] Telegram/Discord notifications for trades
- [ ] Multi-exchange support (Coinbase, Kraken)
- [ ] Advanced indicators (RSI, MACD) integration
- [ ] Trailing stop loss
- [ ] Web-based bot control (start/stop from dashboard)
- [ ] Historical performance charts

---

*For Glass UI documentation, see [CLAUDE.md](file:///Users/mario/projects/LiquidCrypto/CLAUDE.md)*
