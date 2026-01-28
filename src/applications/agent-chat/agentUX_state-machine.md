---
version: "1.0"
displayName: "State Machine"

theme:
  accentColor: "#F59E0B"
  secondaryColor: "#FBBF24"
  messageStyle: glass
  avatarStyle: circle
  glassEffects: true
  backgroundImage: "state-machine"

formatting:
  markdown: true
  emojiToIcons: true
  codeHighlighting: true
  codeTheme: dark
  mathRendering: false

input:
  placeholder: "Define your state machine..."
  voiceEnabled: false
  fileUpload: true
  allowedFileTypes:
    - application/json
    - text/yaml
  maxFileSize: 2
  multiline: true

contextualUI:
  suggestionsEnabled: true
  suggestionStrategy: heuristic
  maxSuggestions: 4
  suggestionLayout: horizontal

quickActions:
  - label: "Create"
    value: "Create new state machine"
    icon: "GitBranch"
    description: "New state machine"
  - label: "States"
    value: "Show all states"
    icon: "Circle"
    description: "View states"
  - label: "Transitions"
    value: "Show transitions"
    icon: "ArrowRight"
    description: "View transitions"
  - label: "Simulate"
    value: "Simulate execution"
    icon: "Play"
    description: "Run simulation"

responseParsing:
  parseFormat: auto
  extractStructuredData: true
  enableA2UI: true
---

# State Machine UX Configuration

Specialized configuration for the state machine builder agent.

## Features

- State definition
- Transition mapping
- Guard conditions
- Simulation mode
- Export to code

## Preferred Components

- GlassSankey for state flow
- GlassTimeline for state history
- GlassCode for generated code
- GlassBadge for state labels
- GlassTable for transition matrix
