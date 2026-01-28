---
version: "1.0"
displayName: "Notification Hub"

theme:
  accentColor: "#EC4899"
  secondaryColor: "#F472B6"
  messageStyle: glass
  avatarStyle: rounded
  glassEffects: true
  backgroundImage: "notification"

formatting:
  markdown: true
  emojiToIcons: true
  codeHighlighting: false
  mathRendering: false

input:
  placeholder: "Manage notifications..."
  voiceEnabled: true
  fileUpload: false
  multiline: false

contextualUI:
  suggestionsEnabled: true
  suggestionStrategy: semantic
  maxSuggestions: 4
  suggestionLayout: horizontal

quickActions:
  - label: "Unread"
    value: "Show unread notifications"
    icon: "BellDot"
    description: "View unread"
  - label: "Configure"
    value: "Configure notifications"
    icon: "Settings"
    description: "Notification settings"
  - label: "Channels"
    value: "Show notification channels"
    icon: "Radio"
    description: "View channels"
  - label: "Clear All"
    value: "Clear all notifications"
    icon: "XCircle"
    description: "Clear notifications"

responseParsing:
  parseFormat: auto
  extractStructuredData: true
  enableA2UI: true
---

# Notification Hub UX Configuration

Specialized configuration for the notification management agent.

## Features

- Multi-channel notifications
- Priority filtering
- Delivery preferences
- Notification history
- Channel management

## Preferred Components

- GlassTimeline for notification feed
- GlassBadge for priority levels
- GlassSwitch for channel toggles
- GlassAccordion for grouped notifications
- GlassButton for quick actions
