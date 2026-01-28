---
version: "1.0"
displayName: "NanoBanana"

theme:
  accentColor: "#FBBF24"
  secondaryColor: "#FCD34D"
  messageStyle: glass
  avatarStyle: circle
  glassEffects: true
  backgroundImage: "nanobanana"

formatting:
  markdown: true
  emojiToIcons: true
  codeHighlighting: false
  mathRendering: false

input:
  placeholder: "Describe your image..."
  voiceEnabled: true
  fileUpload: true
  allowedFileTypes:
    - image/jpeg
    - image/png
    - image/webp
  maxFileSize: 10
  multiline: true

contextualUI:
  suggestionsEnabled: true
  suggestionStrategy: semantic
  maxSuggestions: 4
  suggestionLayout: horizontal

quickActions:
  - label: "Generate"
    value: "Generate an image of"
    icon: "Sparkles"
    description: "Create new image"
  - label: "Styles"
    value: "Show available styles"
    icon: "Palette"
    description: "Browse styles"
  - label: "Edit"
    value: "Edit this image"
    icon: "Pencil"
    description: "Modify image"
  - label: "Gallery"
    value: "Show my gallery"
    icon: "Images"
    description: "View creations"

responseParsing:
  parseFormat: auto
  extractStructuredData: true
  enableA2UI: true
---

# NanoBanana UX Configuration

Specialized configuration for the AI image generation agent.

## Features

- Text-to-image generation
- Style presets (photorealistic, digital-art, anime, watercolor, 3d-render, sketch)
- Image editing
- Gallery management
- Prompt enhancement

## Preferred Components

- GlassImage for generated images
- GlassCarousel for gallery display
- GlassSelect for style selection
- GlassTextarea for prompt input
- GlassBadge for style tags
