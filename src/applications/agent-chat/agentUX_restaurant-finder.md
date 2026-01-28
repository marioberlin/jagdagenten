---
version: "1.0"
displayName: "Restaurant Finder"

theme:
  accentColor: "#F97316"
  secondaryColor: "#FB923C"
  messageStyle: glass
  avatarStyle: rounded
  glassEffects: true
  backgroundImage: "restaurant-finder"

formatting:
  markdown: true
  emojiToIcons: true
  codeHighlighting: false
  mathRendering: false

input:
  placeholder: "What kind of food are you craving?"
  voiceEnabled: true
  fileUpload: false
  multiline: false

contextualUI:
  suggestionsEnabled: true
  suggestionStrategy: semantic
  maxSuggestions: 4
  suggestionLayout: horizontal

quickActions:
  - label: "Near Me"
    value: "Find restaurants near me"
    icon: "MapPin"
    description: "Discover nearby restaurants"
  - label: "Cuisine"
    value: "What cuisines are available?"
    icon: "UtensilsCrossed"
    description: "Browse by cuisine type"
  - label: "Top Rated"
    value: "Show top-rated restaurants"
    icon: "Star"
    description: "See highest rated options"
  - label: "Open Now"
    value: "What's open right now?"
    icon: "Clock"
    description: "Currently open restaurants"

responseParsing:
  parseFormat: auto
  extractStructuredData: true
  enableA2UI: true
---

# Restaurant Finder UX Configuration

Specialized configuration for the restaurant discovery and recommendation agent.

## Features

- Location-based restaurant search
- Cuisine type filtering
- Rating and review aggregation
- Hours and availability checking
- Menu browsing

## Preferred Components

- GlassCard for restaurant displays
- GlassCarousel for photo galleries
- GlassRating for star ratings
- GlassMap for location display
- GlassBadge for cuisine tags
