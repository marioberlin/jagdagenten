---
version: "1.0"
displayName: "Crypto Advisor"

theme:
  accentColor: "#F7931A"
  secondaryColor: "#FCD34D"
  messageStyle: glass
  avatarStyle: circle
  glassEffects: true
  backgroundImage: "crypto-advisor"

formatting:
  markdown: true
  emojiToIcons: true
  codeHighlighting: true
  codeTheme: dark
  mathRendering: true

input:
  placeholder: "Ask about crypto markets..."
  voiceEnabled: true
  fileUpload: false
  multiline: false

contextualUI:
  suggestionsEnabled: true
  suggestionStrategy: semantic
  maxSuggestions: 4
  suggestionLayout: horizontal

quickActions:
  - label: "BTC Price"
    value: "What's the current Bitcoin price?"
    icon: "Bitcoin"
    description: "Get Bitcoin price"
  - label: "Analysis"
    value: "Analyze the market trend"
    icon: "TrendingUp"
    description: "Market analysis"
  - label: "Portfolio"
    value: "Review my portfolio"
    icon: "PieChart"
    description: "Portfolio overview"
  - label: "News"
    value: "Latest crypto news"
    icon: "Newspaper"
    description: "Market news updates"

responseParsing:
  parseFormat: auto
  extractStructuredData: true
  enableA2UI: true
---

# Crypto Advisor UX Configuration

Specialized configuration for the cryptocurrency advisory agent.

## Features

- Real-time price tracking
- Market trend analysis
- Portfolio recommendations
- Risk assessment
- News aggregation

## Preferred Components

- GlassMetric for price displays
- GlassCandlestickChart for price charts
- GlassDonutChart for portfolio allocation
- GlassBadge for sentiment indicators
- GlassTable for price comparisons
