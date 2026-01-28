---
version: "1.0"
displayName: "DocuMind"

theme:
  accentColor: "#8B5CF6"
  secondaryColor: "#C084FC"
  messageStyle: glass
  avatarStyle: rounded
  glassEffects: true
  backgroundImage: "documind"

formatting:
  markdown: true
  emojiToIcons: true
  codeHighlighting: true
  codeTheme: dark
  mathRendering: true

input:
  placeholder: "Ask about your documents..."
  voiceEnabled: true
  fileUpload: true
  allowedFileTypes:
    - application/pdf
    - text/plain
    - text/markdown
    - application/vnd.openxmlformats-officedocument.wordprocessingml.document
  maxFileSize: 50
  multiline: true

contextualUI:
  suggestionsEnabled: true
  suggestionStrategy: semantic
  maxSuggestions: 4
  suggestionLayout: horizontal

quickActions:
  - label: "Summarize"
    value: "Summarize this document"
    icon: "FileText"
    description: "Get summary"
  - label: "Search"
    value: "Search in documents"
    icon: "Search"
    description: "Search content"
  - label: "Extract"
    value: "Extract key information"
    icon: "FileSearch"
    description: "Extract data"
  - label: "Compare"
    value: "Compare documents"
    icon: "Files"
    description: "Document comparison"

responseParsing:
  parseFormat: auto
  extractStructuredData: true
  enableA2UI: true
---

# DocuMind UX Configuration

Specialized configuration for the document intelligence agent.

## Features

- Document summarization
- Content search
- Information extraction
- Multi-document analysis
- Citation generation

## Preferred Components

- GlassCard for document previews
- GlassAccordion for section navigation
- GlassCode for extracted text
- GlassTable for structured data
- GlassTimeline for document history
