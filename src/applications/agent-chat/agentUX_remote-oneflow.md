---
version: "1.0"
displayName: "OneFlow"

theme:
  accentColor: "#10B981"
  secondaryColor: "#34D399"
  messageStyle: glass
  avatarStyle: circle
  glassEffects: true
  backgroundImage: "remote-oneflow"

formatting:
  markdown: true
  emojiToIcons: true
  codeHighlighting: true
  codeTheme: dark
  mathRendering: false

input:
  placeholder: "Describe your workflow..."
  voiceEnabled: true
  fileUpload: true
  allowedFileTypes:
    - application/json
    - text/yaml
  maxFileSize: 5
  multiline: true

contextualUI:
  suggestionsEnabled: true
  suggestionStrategy: semantic
  maxSuggestions: 4
  suggestionLayout: horizontal

quickActions:
  - label: "Create"
    value: "Create a new workflow"
    icon: "Workflow"
    description: "Build workflow"
  - label: "Templates"
    value: "Browse templates"
    icon: "FileTemplate"
    description: "Use template"
  - label: "Run"
    value: "Run workflow"
    icon: "Play"
    description: "Execute workflow"
  - label: "History"
    value: "Show run history"
    icon: "History"
    description: "View history"

responseParsing:
  parseFormat: auto
  extractStructuredData: true
  enableA2UI: true
---

# OneFlow UX Configuration

Specialized configuration for the workflow automation agent.

## Features

- Visual workflow builder
- Template library
- Execution engine
- Run history
- Error handling

## Preferred Components

- GlassSankey for workflow visualization
- GlassTimeline for execution log
- GlassTable for run history
- GlassBadge for status indicators
- GlassCode for step configuration
