---
version: "1.0"
displayName: "UCP Shopping Assistant"

theme:
  accentColor: "#f59e0b"
  secondaryColor: "#eab308"
  messageStyle: glass
  avatarStyle: rounded
  glassEffects: true

formatting:
  markdown: true
  emojiToIcons: true
  codeHighlighting: false
  mathRendering: false

input:
  placeholder: "What are you looking for today?"
  voiceEnabled: true
  fileUpload: true
  allowedFileTypes:
    - image/jpeg
    - image/png
    - image/webp
  maxFileSize: 5
  multiline: false

contextualUI:
  suggestionsEnabled: true
  suggestionStrategy: semantic
  maxSuggestions: 4
  suggestionLayout: horizontal

quickActions:
  - label: "Browse"
    value: "Show me what's available"
    icon: "Search"
    description: "Browse all products"
  - label: "Deals"
    value: "Show me today's deals"
    icon: "Tag"
    description: "View current promotions"
  - label: "Cart"
    value: "Show my cart"
    icon: "ShoppingCart"
    description: "View your shopping cart"
  - label: "Orders"
    value: "Show my orders"
    icon: "Package"
    description: "Track your orders"

responseParsing:
  parseFormat: auto
  extractStructuredData: true
  enableA2UI: true
---

# UCP Shopping Assistant UX Configuration

Specialized configuration for the e-commerce shopping assistant agent.

## Features

- Product browsing and search
- Shopping cart management
- Order tracking
- Deal recommendations
- Image-based product search

## Preferred Components

- GlassProductCard for product displays
- GlassCarousel for product galleries
- GlassTable for order history
- GlassButton for add-to-cart actions
- GlassBadge for deal indicators
