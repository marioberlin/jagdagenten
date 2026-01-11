# Apple Design Guidelines
## Modern UI Patterns for Web Apps

Based on Apple Human Interface Guidelines • For educational purposes

---

## Table of Contents
1. [Liquid Glass](#liquid-glass)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [SF Symbols](#sf-symbols)
5. [Charts](#charts)
6. [Layout Principles](#layout-principles)
7. [Motion & Animation](#motion--animation)
8. [Best Practices](#best-practices)

---

## Liquid Glass

A dynamic material that forms a distinct functional layer for controls and navigation, floating above content while maintaining legibility and creating visual depth.

### Variants

#### Regular Variant
- Blurs (10-12px) and adjusts luminosity of background
- Opacity: 0.3-0.5 (light mode) / 0.4-0.6 (dark mode)
- Use for text-heavy components like alerts, sidebars, and popovers
- CSS: `backdrop-filter: blur(10px) saturate(180%)`

#### Clear Variant
- Highly translucent (0.1-0.2 opacity) for prioritizing visibility of underlying content
- Requires 35% dark dimming layer on bright backgrounds
- CSS: `backdrop-filter: blur(10px) saturate(180%)`

### Standard Material Thicknesses

| Material | Blur | Opacity | Description |
|----------|------|---------|-------------|
| ultraThin | 1-3px | 0.15 | Maximum translucency |
| thin | 5-8px | 0.25 | Light context blur |
| regular | 10-12px | 0.40 | Default balance |
| thick | 15-20px | 0.50 | High contrast |
| ultraThick | 25-30px | 0.60 | Maximum blur |

### Opacity by Mode

| Context | Opacity Range |
|---------|---------------|
| Light Mode | 0.3 - 0.5 |
| Dark Mode | 0.4 - 0.6 |
| Clear Look | 0.1 - 0.2 |
| Borders | 0.1 - 0.2 |
| Shadows | 0.1 - 0.4 |

---

## Color System

Apple's dynamic system colors adapt automatically to light and dark modes, ensuring consistent appearance and accessibility across all contexts.

### System Colors

| Color | Light Mode | Dark Mode | Semantic Use |
|-------|------------|-----------|--------------|
| Blue | #007AFF | #0A84FF | Links, buttons, accents |
| Green | #34C759 | #30D158 | Success, positive actions |
| Red | #FF3B30 | #FF453A | Errors, destructive actions |
| Orange | #FF9500 | #FF9F0A | Warnings, attention |
| Yellow | #FFCC00 | #FFD60A | Highlights, starred items |
| Teal | #5AC8FA | #64D2FF | Water, health data |
| Purple | #AF52DE | #BF5AF2 | Creativity, podcasts |
| Pink | #FF2D55 | #FF375F | Love, music |

### Liquid Glass Color Tips

- By default, Liquid Glass takes color from content behind it
- Apply tint for emphasis (like primary action buttons)
- Use 35% opacity dimming layer behind clear Liquid Glass on bright backgrounds
- System adapts between light/dark based on underlying content

---

## Typography

San Francisco and New York typeface families with Dynamic Type support for legible, accessible text at any size.

### San Francisco Pro Text Styles

| Style | Size | Weight | Line Height |
|-------|------|--------|-------------|
| Large Title | 34px | 700 | 41px |
| Title 1 | 28px | 700 | 34px |
| Title 2 | 22px | 700 | 28px |
| Title 3 | 20px | 600 | 25px |
| Headline | 17px | 600 | 22px |
| Body | 17px | 400 | 22px |

### Typography Do's ✓

- Use built-in text styles for consistency
- Support Dynamic Type for accessibility
- Maintain visual hierarchy at all sizes
- Use SF Pro for UI, New York for reading

### Typography Don'ts ✗

- Mix too many typefaces
- Truncate text excessively at large sizes
- Use font sizes below 11pt
- Use regular weight on glass surfaces

### Typography on Glass Surfaces

| Property | Guideline |
|----------|-----------|
| Font Weight | Medium (500) not regular |
| Text Shadows | 1-2px blur for definition |
| Line Height | Increase by 10-15% |
| Vibrancy | Primary → Secondary → Tertiary |
| Contrast | 4.5:1 minimum (7:1 recommended) |

---

## SF Symbols

Thousands of consistent, highly configurable symbols that integrate seamlessly with San Francisco system font in all weights and sizes.

### Rendering Modes

| Mode | Description |
|------|-------------|
| **Monochrome** | Single color applied to all symbol paths. Best for simple, consistent iconography. |
| **Hierarchical** | Different opacities of one color create visual depth and hierarchy between layers. |
| **Palette** | Multiple custom colors applied to different layers. Full control over appearance. |
| **Multicolor** | Symbols render with their inherent colors. Best for symbols representing real-world objects. |

---

## Charts

Effective charts communicate information with clarity while maintaining visual appeal and accessibility.

### Chart Design Best Practices

#### Design
- Keep charts simple and focused
- Use familiar chart types (bar, line)
- Match size to functionality level

#### Accessibility
- Provide accessibility labels
- Add descriptive text/headlines
- Don't rely solely on color

---

## Layout Principles

Create visual hierarchies that guide users through content while separating controls from content layers.

### Visual Hierarchy

1. **Primary Content** - Most Important
2. **Secondary Content** - Supporting information
3. **Tertiary Information** - Additional details

### Control vs Content Layer

- **Control Layer**: Liquid Glass elements (toolbars, tab bars, navigation)
- **Content Layer**: Main content area with opaque backgrounds

### Spacing & Safe Areas

| Measurement | Value | Purpose |
|-------------|-------|---------|
| Minimum | 16pt | Minimum tap target |
| Recommended | 44pt | Recommended touch target |
| visionOS | 60pt | visionOS spacing standard |

---

## Motion & Animation

Purposeful animations that provide feedback, convey status, and enrich the visual experience without overwhelming users.

### Animation Types

| Animation | Description |
|-----------|-------------|
| Bounce | Elastic scale up/down |
| Pulse | Opacity variation over time |
| Scale | Increase/decrease size |
| Wiggle | Back and forth movement |

### Animation Timing Specifications

| Property | Value |
|----------|-------|
| Default Easing | `cubic-bezier(0.42, 0.0, 0.58, 1.0)` |
| State Changes | 0.3 - 0.5 seconds |
| Materialization | Spring animations |
| Touch Response | Instant flex + light spread |

### Motion Guidelines

- Add motion purposefully, not gratuitously
- Make motion optional (respect Reduce Motion setting)
- Keep feedback animations brief and precise
- Avoid fast-moving/blinking animations that may cause discomfort
- Let users cancel or skip animations

---

## Best Practices

### Liquid Glass Do's ✓

- Use for controls, navigation, and floating widgets
- Let system components adopt Liquid Glass automatically
- Use regular variant for text-heavy components
- Use clear variant over rich media backgrounds
- Apply vibrant colors for text on top of materials
- Add 35% dimming layer for clear variant on bright content
- Use GPU acceleration (`transform: translateZ(0)`)
- Respect `prefers-reduced-transparency` preference

### Liquid Glass Don'ts ✗

- Don't use in the content layer
- Don't apply to scrollable content areas
- Don't stack multiple glass layers
- Don't use for text-heavy interfaces or data tables
- Don't overuse on multiple custom controls
- Don't use non-vibrant colors (low contrast)
- Don't overuse `will-change` (causes memory issues)
- Don't skip accessibility fallbacks

### HIG Compliance Alert ⚠️

**Legibility** is the primary concern. When using Liquid Glass content backgrounds, you strictly follow the "Content Layer" rule: use opaque backgrounds for dense reading, and reserve glass for transient controls.

---

## Web Implementation

### Core CSS (with Apple's exact easing)

```css
.liquid-glass-regular {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px) saturate(180%);
  -webkit-backdrop-filter: blur(10px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 2rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1),
    inset 0 1px 0 rgba(255,255,255,0.4);
  transition: all 0.4s cubic-bezier(0.42, 0.0, 0.58, 1.0);
}

.liquid-glass-clear {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px) saturate(180%);
}

/* Performance */
.glass-element {
  transform: translateZ(0);
  isolation: isolate;
}
```

### Accessibility & Fallbacks

```css
/* Fallback for unsupported browsers */
@supports not (backdrop-filter: blur(10px)) {
  .liquid-glass { background: rgba(255,255,255,0.85); }
}

/* Respect reduced transparency */
@media (prefers-reduced-transparency: reduce) {
  .liquid-glass {
    background: rgba(255,255,255,0.95);
    backdrop-filter: none;
  }
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .glass-element { transition: none; }
}

/* Mobile: reduce blur for performance */
@media (max-width: 768px) {
  .liquid-glass { backdrop-filter: blur(5px); }
}
```

### Animation Keyframes

```css
@keyframes bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes scale {
  0%, 100% { transform: scale(0.9); }
  50% { transform: scale(1.1); }
}

@keyframes wiggle {
  0%, 100% { transform: rotate(-5deg); }
  50% { transform: rotate(5deg); }
}
```

---

## Quick Reference Card

### Glass Effects

| Type | Background | Blur | Border |
|------|------------|------|--------|
| Regular (Light) | `rgba(255,255,255,0.5)` | 10px | `rgba(255,255,255,0.2)` |
| Regular (Dark) | `rgba(0,0,0,0.4)` | 10px | `rgba(255,255,255,0.3)` |
| Clear (Light) | `rgba(255,255,255,0.15)` | 10px | `rgba(255,255,255,0.3)` |
| Clear (Dark) | `rgba(0,0,0,0.2)` | 10px | `rgba(255,255,255,0.3)` |

### Box Shadow for Glass

```css
box-shadow: 0 8px 32px rgba(0,0,0,0.1), 
            inset 0 1px 0 rgba(255,255,255,0.4);
```

### Transition Timing

```css
transition: all 0.4s cubic-bezier(0.42, 0.0, 0.58, 1.0);
```

---

*Based on Apple Human Interface Guidelines • For educational purposes*
