---
version: "1.0"
displayName: "Orchestrator"

theme:
  accentColor: "#F59E0B"
  secondaryColor: "#FBBF24"
  messageStyle: glass
  avatarStyle: circle
  glassEffects: true
  backgroundImage: "orchestrator"

formatting:
  markdown: true
  emojiToIcons: true
  codeHighlighting: true
  codeTheme: dark
  mathRendering: false

input:
  placeholder: "Coordinate agents..."
  voiceEnabled: true
  fileUpload: false
  multiline: true

contextualUI:
  suggestionsEnabled: true
  suggestionStrategy: semantic
  maxSuggestions: 4
  suggestionLayout: horizontal

quickActions:
  - label: "Status"
    value: "Show agent status"
    icon: "Activity"
    description: "All agent status"
  - label: "Workflow"
    value: "Create workflow"
    icon: "GitBranch"
    description: "Build workflow"
  - label: "Tasks"
    value: "Show running tasks"
    icon: "ListTodo"
    description: "Active tasks"
  - label: "Logs"
    value: "Show agent logs"
    icon: "FileText"
    description: "View logs"

responseParsing:
  parseFormat: auto
  extractStructuredData: true
  enableA2UI: true
---

# Orchestrator UX Configuration

Specialized configuration for the agent orchestration agent.

## Features

- Multi-agent coordination
- Workflow management
- Task distribution
- Status monitoring
- Log aggregation

## Preferred Components

- GlassTimeline for workflow visualization
- GlassTable for agent status
- GlassBadge for status indicators
- GlassSankey for data flow
- GlassAccordion for log grouping
