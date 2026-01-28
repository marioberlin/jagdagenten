---
version: "1.0"
displayName: "Dashboard Builder"

theme:
  accentColor: "#3B82F6"
  secondaryColor: "#60A5FA"
  messageStyle: glass
  avatarStyle: rounded
  glassEffects: true
  backgroundImage: "dashboard-builder"

formatting:
  markdown: true
  emojiToIcons: true
  codeHighlighting: true
  codeTheme: dark
  mathRendering: false

input:
  placeholder: "Design your dashboard..."
  voiceEnabled: true
  fileUpload: true
  allowedFileTypes:
    - application/json
    - text/csv
  maxFileSize: 5
  multiline: true

contextualUI:
  suggestionsEnabled: true
  suggestionStrategy: semantic
  maxSuggestions: 4
  suggestionLayout: horizontal

quickActions:
  - label: "Create"
    value: "Create a new dashboard"
    icon: "LayoutDashboard"
    description: "Build dashboard"
  - label: "Widgets"
    value: "Show available widgets"
    icon: "LayoutGrid"
    description: "Browse widgets"
  - label: "Templates"
    value: "Show dashboard templates"
    icon: "FileTemplate"
    description: "Use template"
  - label: "My Dashboards"
    value: "Show my dashboards"
    icon: "Folders"
    description: "View dashboards"

responseParsing:
  parseFormat: auto
  extractStructuredData: true
  enableA2UI: true
---

# Dashboard Builder UX Configuration

Specialized configuration for the dashboard creation agent.

## Features

- Drag-and-drop layout
- Widget library
- Data source integration
- Template gallery
- Real-time preview

## Preferred Components

- GlassGrid for layout
- GlassMetric for KPI widgets
- GlassChart for data visualization
- GlassTable for data grids
- GlassTabs for multi-view dashboards
