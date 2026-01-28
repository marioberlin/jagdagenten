---
version: "1.0"
displayName: "AI Assistant"

theme:
  accentColor: "#6366f1"
  secondaryColor: "#8b5cf6"
  messageStyle: glass
  avatarStyle: rounded
  glassEffects: true

formatting:
  markdown: true
  emojiToIcons: true
  codeHighlighting: true
  codeTheme: dark
  mathRendering: false
  maxMessageLength: 10000

input:
  placeholder: "Type a message..."
  voiceEnabled: true
  fileUpload: false
  multiline: false
  showCharCount: false
  maxLength: 4000

contextualUI:
  suggestionsEnabled: true
  suggestionStrategy: semantic
  maxSuggestions: 4
  suggestionLayout: horizontal

responseParsing:
  parseFormat: auto
  extractStructuredData: true
  enableA2UI: true
---

# Default Agent UX Configuration

This is the default configuration applied to all agents that don't have a custom UX file.

## Available Components

The following Glass components are available for A2UI rendering:

### Layout Components
- **GlassContainer** - Basic container with glass effect
- **GlassCard** - Card with header/body/footer sections
- **GlassStack** - Vertical/horizontal stack layout
- **GlassGrid** - Responsive grid layout

### Form Components
- **GlassButton** - Button with multiple variants (primary, secondary, ghost, destructive)
- **GlassInput** - Text input field with label and validation
- **GlassTextarea** - Multi-line text input
- **GlassCheckbox** - Checkbox with label
- **GlassRadioGroup** - Radio button group
- **GlassSelect** - Dropdown select with options
- **GlassSlider** - Range slider with min/max values
- **GlassSwitch** - Toggle switch
- **GlassDatePicker** - Date selection input
- **GlassTimePicker** - Time selection input
- **GlassColorPicker** - Color selection input
- **GlassRating** - Star rating input
- **GlassUpload** - File upload dropzone
- **GlassCombobox** - Autocomplete input with suggestions
- **GlassNumberInput** - Number input with increment/decrement controls

### Display Components
- **GlassAvatar** - User/agent avatar display
- **GlassBadge** - Status badge/tag
- **GlassMetric** - KPI metric display with trend
- **GlassCode** - Code block with syntax highlighting
- **GlassTimeline** - Event timeline display
- **GlassProfileCard** - User profile card
- **GlassProductCard** - Product display card with image
- **GlassMediaCard** - Media content card
- **GlassStatsBar** - Statistics bar display
- **GlassWeather** - Weather information display

### Interactive Components
- **GlassAccordion** - Collapsible sections
- **GlassTabs** - Tab navigation
- **GlassModal** - Modal dialog overlay
- **GlassCarousel** - Image/card carousel
- **GlassTooltip** - Hover tooltips
- **GlassPopover** - Click popover menu
- **GlassSearchBar** - Search with suggestions

### Media Components
- **GlassImage** - Image with loading states
- **GlassVideo** - Video player
- **GlassAudio** - Audio player
- **GlassMap** - Interactive map
- **GlassGoogleMap** - Google Maps integration

### Data Visualization Components
- **GlassTable** - Simple data table
- **GlassDataTable** - Advanced data table with sorting/filtering
- **GlassChart** - Line/bar/area charts
- **GlassDonutChart** - Donut/pie chart
- **GlassRadarChart** - Radar/spider chart
- **GlassScatterChart** - Scatter plot
- **GlassHeatmap** - Heatmap visualization
- **GlassGauge** - Gauge/speedometer display
- **GlassSankey** - Sankey diagram
- **GlassTreemap** - Treemap visualization
- **GlassFunnelChart** - Funnel chart
- **GlassCandlestickChart** - Financial candlestick chart

## A2UI Protocol

Agents can render dynamic UI by including A2UI blocks in their responses:

```json
{
  "type": "a2ui",
  "component": "GlassCard",
  "props": {
    "title": "Example Card",
    "children": [
      {
        "type": "a2ui",
        "component": "GlassButton",
        "props": {
          "label": "Click Me",
          "variant": "primary",
          "onClick": { "action": "send_message", "value": "Button clicked!" }
        }
      }
    ]
  }
}
```

## Suggestion Strategies

- **semantic** - AI-powered suggestions based on conversation context
- **heuristic** - Rule-based suggestions from message patterns
- **agent-defined** - Suggestions defined by the agent in responses
- **none** - No automatic suggestions

## Quick Actions

Agents can define quick action buttons that appear above the input:

```yaml
quickActions:
  - label: "Help"
    value: "I need help"
    icon: "HelpCircle"
  - label: "Examples"
    value: "Show me examples"
    icon: "BookOpen"
```
