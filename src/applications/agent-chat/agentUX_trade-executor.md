---
version: "1.0"
displayName: "Trade Executor"

theme:
  accentColor: "#3B82F6"
  secondaryColor: "#60A5FA"
  messageStyle: glass
  avatarStyle: rounded
  glassEffects: true
  backgroundImage: "trade-executor"

formatting:
  markdown: true
  emojiToIcons: true
  codeHighlighting: true
  codeTheme: dark
  mathRendering: true

input:
  placeholder: "Enter trade command..."
  voiceEnabled: true
  fileUpload: false
  multiline: false

contextualUI:
  suggestionsEnabled: true
  suggestionStrategy: semantic
  maxSuggestions: 4
  suggestionLayout: horizontal

quickActions:
  - label: "Buy"
    value: "I want to place a buy order"
    icon: "ArrowUpCircle"
    description: "Execute buy order"
  - label: "Sell"
    value: "I want to place a sell order"
    icon: "ArrowDownCircle"
    description: "Execute sell order"
  - label: "Orders"
    value: "Show my open orders"
    icon: "ClipboardList"
    description: "View open orders"
  - label: "Balance"
    value: "Show my balance"
    icon: "Wallet"
    description: "Check balances"

responseParsing:
  parseFormat: auto
  extractStructuredData: true
  enableA2UI: true
---

# Trade Executor UX Configuration

Specialized configuration for the trade execution agent.

## Features

- Order placement and management
- Position tracking
- Balance monitoring
- Trade confirmation
- Order history

## Preferred Components

- GlassButton for trade actions
- GlassInput for order parameters
- GlassTable for order book
- GlassMetric for balance displays
- GlassBadge for order status
