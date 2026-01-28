---
version: "1.0"
displayName: "Research Canvas"

theme:
  accentColor: "#8B5CF6"
  secondaryColor: "#A78BFA"
  messageStyle: glass
  avatarStyle: rounded
  glassEffects: true
  backgroundImage: "research-canvas"

formatting:
  markdown: true
  emojiToIcons: true
  codeHighlighting: true
  codeTheme: dark
  mathRendering: true

input:
  placeholder: "Build your research canvas..."
  voiceEnabled: true
  fileUpload: true
  allowedFileTypes:
    - image/jpeg
    - image/png
    - application/pdf
    - text/plain
  maxFileSize: 20
  multiline: true

contextualUI:
  suggestionsEnabled: true
  suggestionStrategy: semantic
  maxSuggestions: 4
  suggestionLayout: horizontal

quickActions:
  - label: "New Canvas"
    value: "Create a new canvas"
    icon: "Artboard"
    description: "Start fresh"
  - label: "Add Node"
    value: "Add a research node"
    icon: "Plus"
    description: "Add content"
  - label: "Connect"
    value: "Connect ideas"
    icon: "Link2"
    description: "Link nodes"
  - label: "Export"
    value: "Export canvas"
    icon: "Download"
    description: "Save canvas"

responseParsing:
  parseFormat: auto
  extractStructuredData: true
  enableA2UI: true
---

# Research Canvas UX Configuration

Specialized configuration for the visual research canvas agent.

## Features

- Visual node-based research
- Idea connection mapping
- Multi-format content support
- Collaborative workspace
- Export and sharing

## Preferred Components

- GlassCard for research nodes
- GlassSankey for connection flows
- GlassImage for visual content
- GlassCode for code snippets
- GlassAccordion for nested content
