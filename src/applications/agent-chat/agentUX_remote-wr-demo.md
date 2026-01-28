---
version: "1.0"
displayName: "WR Demo Agent"

theme:
  accentColor: "#10b981"
  secondaryColor: "#06b6d4"
  messageStyle: glass
  avatarStyle: circle
  glassEffects: true

formatting:
  markdown: true
  emojiToIcons: true
  codeHighlighting: true
  codeTheme: dark
  mathRendering: false

input:
  placeholder: "Ask me anything..."
  voiceEnabled: true
  fileUpload: false
  multiline: false

contextualUI:
  suggestionsEnabled: true
  suggestionStrategy: semantic
  maxSuggestions: 4
  suggestionLayout: horizontal

quickActions:
  - label: "Demo A2UI"
    value: "Show me an A2UI demo"
    icon: "Sparkles"
    description: "Display interactive UI components"
  - label: "Charts"
    value: "Show me a chart example"
    icon: "BarChart3"
    description: "Display data visualization"
  - label: "Forms"
    value: "Show me a form example"
    icon: "FormInput"
    description: "Display interactive form components"

responseParsing:
  parseFormat: auto
  extractStructuredData: true
  enableA2UI: true
---

# WR Demo Agent UX Configuration

This agent demonstrates the full A2UI capability including interactive components,
data visualization, and dynamic form rendering.

## Specializations

- Interactive UI demonstrations
- Chart and data visualization examples
- Form component showcases
- Real-time streaming updates

## Enabled Components

All default components are enabled for this demo agent.
