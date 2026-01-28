---
version: "1.0"
displayName: "Maintenance Bot"

theme:
  accentColor: "#10B981"
  secondaryColor: "#34D399"
  messageStyle: glass
  avatarStyle: rounded
  glassEffects: true
  backgroundImage: "maintenance"

formatting:
  markdown: true
  emojiToIcons: true
  codeHighlighting: true
  codeTheme: dark
  mathRendering: false

input:
  placeholder: "System maintenance..."
  voiceEnabled: false
  fileUpload: false
  multiline: false

contextualUI:
  suggestionsEnabled: true
  suggestionStrategy: heuristic
  maxSuggestions: 4
  suggestionLayout: horizontal

quickActions:
  - label: "Health"
    value: "Check system health"
    icon: "HeartPulse"
    description: "System health check"
  - label: "Cleanup"
    value: "Run cleanup tasks"
    icon: "Trash2"
    description: "Clean up system"
  - label: "Optimize"
    value: "Optimize performance"
    icon: "Gauge"
    description: "Performance tuning"
  - label: "Schedule"
    value: "Show scheduled tasks"
    icon: "Calendar"
    description: "Scheduled maintenance"

responseParsing:
  parseFormat: auto
  extractStructuredData: true
  enableA2UI: true
---

# Maintenance Bot UX Configuration

Specialized configuration for the system maintenance agent.

## Features

- Health monitoring
- Automated cleanup
- Performance optimization
- Scheduled tasks
- Resource management

## Preferred Components

- GlassGauge for health metrics
- GlassMetric for system stats
- GlassTimeline for task schedule
- GlassBadge for status indicators
- GlassTable for task logs
