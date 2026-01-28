---
version: "1.0"
displayName: "QA Agent"

theme:
  accentColor: "#06B6D4"
  secondaryColor: "#22D3EE"
  messageStyle: glass
  avatarStyle: rounded
  glassEffects: true
  backgroundImage: "qa-agent"

formatting:
  markdown: true
  emojiToIcons: true
  codeHighlighting: true
  codeTheme: dark
  mathRendering: false

input:
  placeholder: "Describe what to test..."
  voiceEnabled: false
  fileUpload: true
  allowedFileTypes:
    - text/javascript
    - text/typescript
    - application/json
  maxFileSize: 5
  multiline: true

contextualUI:
  suggestionsEnabled: true
  suggestionStrategy: heuristic
  maxSuggestions: 4
  suggestionLayout: horizontal

quickActions:
  - label: "Run Tests"
    value: "Run all tests"
    icon: "Play"
    description: "Execute tests"
  - label: "Generate"
    value: "Generate test cases"
    icon: "Wand2"
    description: "Create tests"
  - label: "Coverage"
    value: "Show coverage report"
    icon: "BarChart"
    description: "View coverage"
  - label: "Bugs"
    value: "Show found bugs"
    icon: "Bug"
    description: "Bug report"

responseParsing:
  parseFormat: auto
  extractStructuredData: true
  enableA2UI: true
---

# QA Agent UX Configuration

Specialized configuration for the quality assurance testing agent.

## Features

- Automated test generation
- Test execution
- Coverage analysis
- Bug detection
- Regression testing

## Preferred Components

- GlassTable for test results
- GlassGauge for coverage metrics
- GlassCode for test code
- GlassBadge for pass/fail status
- GlassTimeline for test history
