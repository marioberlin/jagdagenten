---
version: "1.0"
displayName: "Risk Manager"

theme:
  accentColor: "#EF4444"
  secondaryColor: "#F87171"
  messageStyle: glass
  avatarStyle: rounded
  glassEffects: true
  backgroundImage: "risk"

formatting:
  markdown: true
  emojiToIcons: true
  codeHighlighting: true
  codeTheme: dark
  mathRendering: true

input:
  placeholder: "Analyze risk exposure..."
  voiceEnabled: true
  fileUpload: false
  multiline: false

contextualUI:
  suggestionsEnabled: true
  suggestionStrategy: semantic
  maxSuggestions: 4
  suggestionLayout: horizontal

quickActions:
  - label: "Exposure"
    value: "Show my risk exposure"
    icon: "AlertTriangle"
    description: "View risk exposure"
  - label: "Limits"
    value: "Check position limits"
    icon: "Shield"
    description: "Position limits"
  - label: "VaR"
    value: "Calculate Value at Risk"
    icon: "Calculator"
    description: "VaR analysis"
  - label: "Alerts"
    value: "Show risk alerts"
    icon: "Bell"
    description: "Active alerts"

responseParsing:
  parseFormat: auto
  extractStructuredData: true
  enableA2UI: true
---

# Risk Manager UX Configuration

Specialized configuration for the risk management agent.

## Features

- Position risk analysis
- Exposure monitoring
- VaR calculations
- Alert management
- Limit enforcement

## Preferred Components

- GlassGauge for risk meters
- GlassMetric for exposure values
- GlassChart for risk trends
- GlassBadge for alert levels
- GlassTable for position breakdown
