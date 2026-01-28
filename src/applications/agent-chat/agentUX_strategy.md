---
version: "1.0"
displayName: "Strategy Agent"

theme:
  accentColor: "#8B5CF6"
  secondaryColor: "#A78BFA"
  messageStyle: glass
  avatarStyle: circle
  glassEffects: true
  backgroundImage: "strategy"

formatting:
  markdown: true
  emojiToIcons: true
  codeHighlighting: true
  codeTheme: dark
  mathRendering: true

input:
  placeholder: "Describe your trading strategy..."
  voiceEnabled: true
  fileUpload: true
  allowedFileTypes:
    - application/json
    - text/plain
  maxFileSize: 2
  multiline: true

contextualUI:
  suggestionsEnabled: true
  suggestionStrategy: semantic
  maxSuggestions: 4
  suggestionLayout: horizontal

quickActions:
  - label: "Create"
    value: "Create a new strategy"
    icon: "Plus"
    description: "Build new strategy"
  - label: "Backtest"
    value: "Backtest my strategy"
    icon: "FlaskConical"
    description: "Run backtest"
  - label: "Optimize"
    value: "Optimize strategy parameters"
    icon: "Settings2"
    description: "Parameter optimization"
  - label: "Deploy"
    value: "Deploy strategy"
    icon: "Rocket"
    description: "Activate strategy"

responseParsing:
  parseFormat: auto
  extractStructuredData: true
  enableA2UI: true
---

# Strategy Agent UX Configuration

Specialized configuration for the trading strategy builder agent.

## Features

- Strategy creation and editing
- Backtesting engine
- Parameter optimization
- Performance analytics
- Strategy deployment

## Preferred Components

- GlassChart for performance graphs
- GlassTable for trade logs
- GlassMetric for KPIs
- GlassSlider for parameter tuning
- GlassCode for strategy logic
