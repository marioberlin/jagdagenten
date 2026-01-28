---
version: "1.0"
displayName: "Copilot Form"

theme:
  accentColor: "#EF4444"
  secondaryColor: "#F87171"
  messageStyle: glass
  avatarStyle: rounded
  glassEffects: true
  backgroundImage: "copilot-form"

formatting:
  markdown: true
  emojiToIcons: true
  codeHighlighting: true
  codeTheme: dark
  mathRendering: false

input:
  placeholder: "Describe your form..."
  voiceEnabled: true
  fileUpload: true
  allowedFileTypes:
    - application/json
  maxFileSize: 2
  multiline: true

contextualUI:
  suggestionsEnabled: true
  suggestionStrategy: semantic
  maxSuggestions: 4
  suggestionLayout: horizontal

quickActions:
  - label: "Create Form"
    value: "Create a new form"
    icon: "FormInput"
    description: "Build new form"
  - label: "Fields"
    value: "Show available fields"
    icon: "ListChecks"
    description: "Browse field types"
  - label: "Validate"
    value: "Validate form schema"
    icon: "CheckCircle"
    description: "Check validation"
  - label: "Preview"
    value: "Preview form"
    icon: "Eye"
    description: "See preview"

responseParsing:
  parseFormat: auto
  extractStructuredData: true
  enableA2UI: true
---

# Copilot Form UX Configuration

Specialized configuration for the AI-assisted form builder agent.

## Features

- Natural language form creation
- Field type suggestions
- Validation rules
- Conditional logic
- Live preview

## Preferred Components

- GlassInput for text fields
- GlassSelect for dropdowns
- GlassCheckbox for checkboxes
- GlassRadioGroup for radio buttons
- GlassSwitch for toggles
- GlassDatePicker for dates
