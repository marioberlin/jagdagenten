---
version: "1.0"
displayName: "RizzCharts"

theme:
  accentColor: "#6366F1"
  secondaryColor: "#A855F7"
  messageStyle: glass
  avatarStyle: circle
  glassEffects: true
  backgroundImage: "rizzcharts"

formatting:
  markdown: true
  emojiToIcons: true
  codeHighlighting: true
  codeTheme: dark
  mathRendering: true

input:
  placeholder: "What would you like to visualize?"
  voiceEnabled: true
  fileUpload: true
  allowedFileTypes:
    - text/csv
    - application/json
  maxFileSize: 10
  multiline: true

contextualUI:
  suggestionsEnabled: true
  suggestionStrategy: semantic
  maxSuggestions: 4
  suggestionLayout: horizontal

quickActions:
  - label: "Line Chart"
    value: "Create a line chart"
    icon: "LineChart"
    description: "Time series visualization"
  - label: "Bar Chart"
    value: "Create a bar chart"
    icon: "BarChart3"
    description: "Categorical comparison"
  - label: "Pie Chart"
    value: "Create a pie chart"
    icon: "PieChart"
    description: "Proportion display"
  - label: "Dashboard"
    value: "Build a dashboard"
    icon: "LayoutDashboard"
    description: "Multi-chart layout"

responseParsing:
  parseFormat: auto
  extractStructuredData: true
  enableA2UI: true
---

# RizzCharts UX Configuration

Specialized configuration for the data visualization agent.

## Features

- Interactive chart creation
- Data transformation
- Multi-chart dashboards
- Export capabilities
- Real-time updates

## Preferred Components

- GlassChart for line/bar/area charts
- GlassDonutChart for pie charts
- GlassRadarChart for multi-dimensional data
- GlassScatterChart for correlations
- GlassHeatmap for density visualization
- GlassSankey for flow diagrams
