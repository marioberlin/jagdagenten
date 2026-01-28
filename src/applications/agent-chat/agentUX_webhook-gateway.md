---
version: "1.0"
displayName: "Webhook Gateway"

theme:
  accentColor: "#8B5CF6"
  secondaryColor: "#A78BFA"
  messageStyle: glass
  avatarStyle: rounded
  glassEffects: true
  backgroundImage: "webhook-gateway"

formatting:
  markdown: true
  emojiToIcons: true
  codeHighlighting: true
  codeTheme: dark
  mathRendering: false

input:
  placeholder: "Configure webhooks..."
  voiceEnabled: false
  fileUpload: true
  allowedFileTypes:
    - application/json
  maxFileSize: 1
  multiline: true

contextualUI:
  suggestionsEnabled: true
  suggestionStrategy: heuristic
  maxSuggestions: 4
  suggestionLayout: horizontal

quickActions:
  - label: "Endpoints"
    value: "Show all endpoints"
    icon: "Link"
    description: "View endpoints"
  - label: "Create"
    value: "Create new webhook"
    icon: "Plus"
    description: "New webhook"
  - label: "Logs"
    value: "Show webhook logs"
    icon: "FileText"
    description: "View logs"
  - label: "Test"
    value: "Test webhook"
    icon: "Zap"
    description: "Send test"

responseParsing:
  parseFormat: auto
  extractStructuredData: true
  enableA2UI: true
---

# Webhook Gateway UX Configuration

Specialized configuration for the webhook management agent.

## Features

- Endpoint management
- Payload transformation
- Authentication handling
- Delivery tracking
- Event filtering

## Preferred Components

- GlassTable for endpoint lists
- GlassCode for payload preview
- GlassBadge for status indicators
- GlassTimeline for delivery history
- GlassInput for URL configuration
