---
version: "1.0"
displayName: "Password Manager"

theme:
  accentColor: "#DC2626"
  secondaryColor: "#EF4444"
  messageStyle: glass
  avatarStyle: rounded
  glassEffects: true
  backgroundImage: "remote-password"

formatting:
  markdown: true
  emojiToIcons: true
  codeHighlighting: false
  mathRendering: false

input:
  placeholder: "Manage your passwords..."
  voiceEnabled: false
  fileUpload: false
  multiline: false

contextualUI:
  suggestionsEnabled: true
  suggestionStrategy: heuristic
  maxSuggestions: 4
  suggestionLayout: horizontal

quickActions:
  - label: "Generate"
    value: "Generate a secure password"
    icon: "Key"
    description: "Create password"
  - label: "Vault"
    value: "Open my vault"
    icon: "Lock"
    description: "View vault"
  - label: "Check"
    value: "Check password strength"
    icon: "Shield"
    description: "Strength check"
  - label: "Breach"
    value: "Check for breaches"
    icon: "AlertTriangle"
    description: "Breach check"

responseParsing:
  parseFormat: auto
  extractStructuredData: true
  enableA2UI: true
---

# Password Manager UX Configuration

Specialized configuration for the password management agent.

## Features

- Secure password generation
- Vault management
- Strength analysis
- Breach detection
- Secure sharing

## Preferred Components

- GlassInput for password fields
- GlassGauge for strength meter
- GlassTable for vault entries
- GlassBadge for security status
- GlassButton for copy actions
