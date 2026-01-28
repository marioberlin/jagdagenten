---
version: "1.0"
displayName: "AI Researcher"

theme:
  accentColor: "#10B981"
  secondaryColor: "#34D399"
  messageStyle: glass
  avatarStyle: circle
  glassEffects: true
  backgroundImage: "ai-researcher"

formatting:
  markdown: true
  emojiToIcons: true
  codeHighlighting: true
  codeTheme: dark
  mathRendering: true

input:
  placeholder: "What would you like to research?"
  voiceEnabled: true
  fileUpload: true
  allowedFileTypes:
    - application/pdf
    - text/plain
  maxFileSize: 25
  multiline: true

contextualUI:
  suggestionsEnabled: true
  suggestionStrategy: semantic
  maxSuggestions: 4
  suggestionLayout: horizontal

quickActions:
  - label: "Research"
    value: "Research this topic"
    icon: "Microscope"
    description: "Deep research"
  - label: "Papers"
    value: "Find relevant papers"
    icon: "FileStack"
    description: "Academic papers"
  - label: "Summarize"
    value: "Summarize findings"
    icon: "ListChecks"
    description: "Get summary"
  - label: "Citations"
    value: "Generate citations"
    icon: "Quote"
    description: "Format citations"

responseParsing:
  parseFormat: auto
  extractStructuredData: true
  enableA2UI: true
---

# AI Researcher UX Configuration

Specialized configuration for the AI research assistant agent.

## Features

- Topic research
- Paper discovery
- Summary generation
- Citation management
- Knowledge synthesis

## Preferred Components

- GlassCard for paper summaries
- GlassAccordion for section breakdown
- GlassCode for code examples
- GlassTable for comparison tables
- GlassTimeline for research history
