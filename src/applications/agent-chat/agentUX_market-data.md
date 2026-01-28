---
version: "1.0"
displayName: "Market Data"

theme:
  accentColor: "#10B981"
  secondaryColor: "#34D399"
  messageStyle: glass
  avatarStyle: rounded
  glassEffects: true
  backgroundImage: "market-data"

formatting:
  markdown: true
  emojiToIcons: true
  codeHighlighting: true
  codeTheme: dark
  mathRendering: true

input:
  placeholder: "Query market data..."
  voiceEnabled: true
  fileUpload: false
  multiline: false

contextualUI:
  suggestionsEnabled: true
  suggestionStrategy: semantic
  maxSuggestions: 4
  suggestionLayout: horizontal

quickActions:
  - label: "Live Prices"
    value: "Show live market prices"
    icon: "Activity"
    description: "Real-time price feed"
  - label: "Volume"
    value: "Show trading volume"
    icon: "BarChart2"
    description: "Volume analysis"
  - label: "Compare"
    value: "Compare assets"
    icon: "GitCompare"
    description: "Asset comparison"
  - label: "History"
    value: "Show price history"
    icon: "History"
    description: "Historical data"

responseParsing:
  parseFormat: auto
  extractStructuredData: true
  enableA2UI: true
---

# Market Data UX Configuration

Specialized configuration for the market data provider agent.

## Features

- Real-time price feeds
- Volume analytics
- Historical data queries
- Cross-market comparisons
- Technical indicators

## Preferred Components

- GlassMetric for live prices
- GlassChart for price trends
- GlassTable for data grids
- GlassHeatmap for market overview
- GlassStatsBar for quick stats
