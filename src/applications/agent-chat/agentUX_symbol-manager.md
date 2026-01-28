---
version: "1.0"
displayName: "Symbol Manager"

theme:
  accentColor: "#6366F1"
  secondaryColor: "#818CF8"
  messageStyle: glass
  avatarStyle: rounded
  glassEffects: true
  backgroundImage: "symbol-manager"

formatting:
  markdown: true
  emojiToIcons: true
  codeHighlighting: true
  codeTheme: dark
  mathRendering: false

input:
  placeholder: "Search symbols..."
  voiceEnabled: true
  fileUpload: false
  multiline: false

contextualUI:
  suggestionsEnabled: true
  suggestionStrategy: semantic
  maxSuggestions: 4
  suggestionLayout: horizontal

quickActions:
  - label: "Browse"
    value: "Browse all symbols"
    icon: "Grid3x3"
    description: "View all symbols"
  - label: "Favorites"
    value: "Show my favorites"
    icon: "Star"
    description: "Favorite symbols"
  - label: "Add"
    value: "Add new symbol"
    icon: "Plus"
    description: "Add symbol"
  - label: "Categories"
    value: "Show categories"
    icon: "Folders"
    description: "Symbol categories"

responseParsing:
  parseFormat: auto
  extractStructuredData: true
  enableA2UI: true
---

# Symbol Manager UX Configuration

Specialized configuration for the trading symbol management agent.

## Features

- Symbol search and discovery
- Watchlist management
- Category organization
- Symbol metadata
- Market info lookup

## Preferred Components

- GlassSearchBar for symbol search
- GlassTable for symbol lists
- GlassBadge for market indicators
- GlassCard for symbol details
- GlassGrid for symbol gallery
