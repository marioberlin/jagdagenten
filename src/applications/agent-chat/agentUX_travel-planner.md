---
version: "1.0"
displayName: "Travel Planner"

theme:
  accentColor: "#0EA5E9"
  secondaryColor: "#38BDF8"
  messageStyle: glass
  avatarStyle: rounded
  glassEffects: true
  backgroundImage: "travel-planner"

formatting:
  markdown: true
  emojiToIcons: true
  codeHighlighting: false
  mathRendering: false

input:
  placeholder: "Where would you like to go?"
  voiceEnabled: true
  fileUpload: false
  multiline: false

contextualUI:
  suggestionsEnabled: true
  suggestionStrategy: semantic
  maxSuggestions: 4
  suggestionLayout: horizontal

quickActions:
  - label: "Flights"
    value: "Search for flights"
    icon: "Plane"
    description: "Find flights"
  - label: "Hotels"
    value: "Find hotels"
    icon: "Hotel"
    description: "Book accommodation"
  - label: "Itinerary"
    value: "Create an itinerary"
    icon: "Map"
    description: "Plan your trip"
  - label: "Explore"
    value: "Explore destinations"
    icon: "Compass"
    description: "Discover places"

responseParsing:
  parseFormat: auto
  extractStructuredData: true
  enableA2UI: true
---

# Travel Planner UX Configuration

Specialized configuration for the travel planning agent.

## Features

- Flight search
- Hotel booking
- Itinerary creation
- Destination exploration
- Weather forecasts

## Preferred Components

- GlassCard for destination cards
- GlassMap for location display
- GlassCarousel for photo galleries
- GlassTimeline for itinerary
- GlassWeather for forecasts
