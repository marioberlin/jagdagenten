# Design Tokens

The Liquid Glass UI design system uses **CSS custom properties** (CSS variables) as design tokens to ensure consistency, maintainability, and theme-awareness across all components.

## Philosophy

Design tokens serve as the single source of truth for visual design decisions. Instead of hardcoding values throughout your codebase, tokens provide:

- **Consistency**: All components reference the same values
- **Maintainability**: Update once, change everywhere
- **Theme Support**: Easy switching between light/dark modes
- **Scalability**: New components automatically inherit the design language

---

## Token Categories

### Glass System

The glass design system tokens provide the foundation for all glassmorphism UI. These are the **authoritative** tokens; see [ADR-003](../reference/adr/ADR-003-glass-design-system.md) for usage patterns.

| Token | Value | Usage |
|-------|-------|-------|
| `--glass-bg-regular` | `rgba(0,0,0,0.35)` | Card backgrounds, panels |
| `--glass-bg-thick` | `rgba(0,0,0,0.50)` | Modals, overlays, thick glass |
| `--glass-surface` | `rgba(255,255,255,0.05)` | Inputs, table rows, subtle surfaces |
| `--glass-surface-active` | `rgba(255,255,255,0.10)` | Active/pressed surface states |
| `--glass-surface-hover` | `rgba(255,255,255,0.08)` | Hover surface states |
| `--glass-border` | `rgba(255,255,255,0.18)` | Borders on glass elements |
| `--glass-accent` | `#10b981` | Primary accent (emerald green) |
| `--text-primary` | `rgba(255,255,255,0.95)` | Headings, primary content |
| `--text-secondary` | `rgba(255,255,255,0.65)` | Descriptions, labels |
| `--text-tertiary` | `rgba(255,255,255,0.40)` | Metadata, timestamps, muted text |

**Tailwind usage:**
```tsx
<div className="bg-[var(--glass-bg-regular)] backdrop-blur-md border border-[var(--glass-border)]">
  <h3 className="text-[var(--text-primary)]">Title</h3>
  <p className="text-[var(--text-secondary)]">Description</p>
</div>
```

---

### Typography

Typography tokens define font sizes, line heights, weights, and letter spacing.

#### Font Sizes

| Token | Value | Tailwind Class | Usage |
|-------|-------|----------------|-------|
| `--font-size-xs` | 12px | `text-xs` | Labels, captions, helper text |
| `--font-size-sm` | 14px | `text-sm` | Secondary text, inputs, buttons |
| `--font-size-base` | 16px | `text-base` | Body text, default paragraph text |
| `--font-size-lg` | 18px | `text-lg` | Subheadings, emphasized text |
| `--font-size-xl` | 20px | `text-xl` | Section headings |
| `--font-size-2xl` | 24px | `text-2xl` | Page headings |
| `--font-size-3xl` | 30px | `text-3xl` | Hero text, landing pages |
| `--font-size-4xl` | 36px | `text-4xl` | Display text |

#### Line Heights

| Token | Value | Tailwind Class | Usage |
|-------|-------|----------------|-------|
| `--line-height-none` | 1 | `leading-none` | Tight spacing for headings |
| `--line-height-tight` | 1.25 | `leading-tight` | Headings, titles |
| `--line-height-snug` | 1.375 | `leading-snug` | Dense text blocks |
| `--line-height-normal` | 1.5 | `leading-normal` | Body text (default) |
| `--line-height-relaxed` | 1.625 | `leading-relaxed` | Comfortable reading |
| `--line-height-loose` | 2 | `leading-loose` | Extra spacing for accessibility |

#### Font Weights

| Token | Value | Tailwind Class | Usage |
|-------|-------|----------------|-------|
| `--font-weight-normal` | 400 | `font-normal` | Body text |
| `--font-weight-medium` | 500 | `font-medium` | Emphasized text, labels |
| `--font-weight-semibold` | 600 | `font-semibold` | Subheadings |
| `--font-weight-bold` | 700 | `font-bold` | Headings, strong emphasis |

---

### Spacing

The spacing system uses a **4px base unit** to create consistent rhythm and alignment.

| Token | Value | Tailwind Class | Common Usage |
|-------|-------|----------------|--------------|
| `--spacing-0` | 0px | `p-0`, `m-0` | Reset spacing |
| `--spacing-0.5` | 2px | `p-0.5`, `m-0.5` | Micro spacing |
| `--spacing-1` | 4px | `p-1`, `m-1` | Tight spacing |
| `--spacing-1.5` | 6px | `p-1.5`, `m-1.5` | Between 1 and 2 |
| `--spacing-2` | 8px | `p-2`, `m-2` | Small gaps |
| `--spacing-3` | 12px | `p-3`, `m-3` | Default component padding |
| `--spacing-4` | 16px | `p-4`, `m-4` | Cards, containers |
| `--spacing-6` | 24px | `p-6`, `m-6` | Section padding |
| `--spacing-8` | 32px | `p-8`, `m-8` | Large containers |
| `--spacing-12` | 48px | `p-12`, `m-12` | Page sections |
| `--spacing-16` | 64px | `p-16`, `m-16` | Hero sections |
| `--spacing-24` | 96px | `p-24`, `m-24` | Extra large spacing |
| `--spacing-32` | 128px | `p-32`, `m-32` | Maximum spacing |

---

### Border Radius

Border radius tokens create consistent rounded corners.

| Token | Value | Tailwind Class | Usage |
|-------|-------|----------------|-------|
| `--radius-sm` | 4px | `rounded-sm` | Subtle rounding |
| `--radius-md` | 6px | `rounded-md` | Default buttons, inputs |
| `--radius-lg` | 8px | `rounded-lg` | Cards, modals |
| `--radius-xl` | 12px | `rounded-xl` | Large containers |
| `--radius-2xl` | 16px | `rounded-2xl` | Hero sections |
| `--radius-3xl` | 24px | `rounded-3xl` | Extra rounded |
| `--radius-full` | 9999px | `rounded-full` | Circles, pills |

---

### Transitions

Transition tokens ensure consistent animation timing.

| Token | Value | Usage |
|-------|-------|-------|
| `--transition-fast` | 150ms | Hover states, quick feedback |
| `--transition-base` | 250ms | Default animations |
| `--transition-slow` | 350ms | Modals, overlays |
| `--ease-out` | cubic-bezier(0, 0, 0.2, 1) | Deceleration curve |
| `--ease-in` | cubic-bezier(0.4, 0, 1, 1) | Acceleration curve |
| `--ease-in-out` | cubic-bezier(0.4, 0, 0.2, 1) | Smooth both ways |

---

### Z-Index

Z-index tokens create a predictable layering system.

| Token | Value | Usage |
|-------|-------|-------|
| `--z-base` | 0 | Default layer |
| `--z-dropdown` | 1000 | Dropdown menus |
| `--z-sticky` | 1100 | Sticky headers |
| `--z-overlay` | 1200 | Modal overlays |
| `--z-modal` | 1300 | Modal content |
| `--z-popover` | 1400 | Popovers, tooltips |
| `--z-toast` | 1500 | Toast notifications |
| `--z-tooltip` | 1600 | Tooltips (highest) |

---

## Usage Examples

### Using Tokens in Components

**Before** (hardcoded values):
```tsx
<div className="p-4 text-sm rounded-lg">
  <h3 className="text-2xl font-bold mb-2">Heading</h3>
  <p>Body text</p>
</div>
```

**After** (using tokens):
```tsx
<div className="p-4 text-sm rounded-lg">
  <h3 className="text-2xl font-bold mb-2">Heading</h3>
  <p>Body text</p>
</div>
```

> **Note**: Tailwind automatically uses the token values when you use standard classes like `p-4`, `text-2xl`, etc., because our `tailwind.config.js` is configured to extend the default theme with our tokens.

### Using Tokens Directly in CSS

For custom styles not covered by Tailwind utilities:

```css
.custom-component {
  padding: var(--spacing-4);
  font-size: var(--font-size-lg);
  border-radius: var(--radius-xl);
  transition: all var(--transition-base) var(--ease-out);
}
```

### Theme-Aware Components

Tokens work seamlessly with the theme system:

```tsx
import { GlassContainer } from '@/components';

<GlassContainer className="p-6 rounded-xl">
  <h2 className="text-2xl font-semibold text-primary">Title</h2>
  <p className="text-sm text-secondary">Description</p>
</GlassContainer>
```

Color tokens (`text-primary`, `text-secondary`) automatically adapt to light/dark mode.

---

## Tailwind Integration

The design token system is fully integrated with Tailwind CSS through `tailwind.config.js`:

```javascript
export default {
  theme: {
    extend: {
      fontSize: {
        xs: ['var(--font-size-xs)', { lineHeight: 'var(--line-height-normal)' }],
        sm: ['var(--font-size-sm)', { lineHeight: 'var(--line-height-normal)' }],
        // ... all other sizes
      },
      spacing: {
        0.5: 'var(--spacing-0.5)',
        1: 'var(--spacing-1)',
        // ... all other spacing values
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        // ... all other radius values
      }
    }
  }
}
```

This means **all standard Tailwind classes automatically use token values**.

---

## Migration Guide

### Migrating Existing Components

1. **Identify hardcoded values**: Look for literal px values, hardcoded colors
2. **Find matching tokens**: Reference tables above
3. **Replace values**: Use Tailwind classes or CSS variables
4. **Test theme switching**: Verify component works in light and dark modes

### Example Migration

**Original component**:
```tsx
<button 
  className="px-6 py-3 bg-blue-500 text-white rounded-md text-sm font-medium"
  style={{ letterSpacing: '0.5px' }}
>
  Click me
</button>
```

**Migrated component**:
```tsx
<GlassButton 
  variant="primary" 
  size="md"
  className="px-6 py-3"
>
  Click me
</GlassButton>
```

Or for custom buttons:
```tsx
<button className="px-6 py-3 bg-accent text-primary rounded-md text-sm font-medium tracking-wide">
  Click me
</button>
```

---

## Common Patterns

### ✅ Do This

```tsx
// Use semantic Tailwind classes
<div className="p-4 text-sm rounded-lg">

// Use CSS variables for custom values
<div style={{ padding: 'var(--spacing-4)' }}>

// Combine tokens for consistency
<div className="p-4 space-y-2 rounded-xl">
```

### ❌ Avoid This

```tsx
// Don't hardcode pixel values
<div className="p-[14px]">

// Don't use arbitrary values when tokens exist
<div style={{ padding: '14px' }}>

// Don't mix token and non-token spacing
<div className="p-4" style={{ marginBottom: '13px' }}>
```

---

## Extending Tokens

To add new tokens to the system:

1. **Add to `src/styles/tokens.css`**:
```css
:root {
  --spacing-20: 80px; /* New spacing value */
}
```

2. **Extend Tailwind config** (`tailwind.config.js`):
```javascript
spacing: {
  20: 'var(--spacing-20)',
}
```

3. **Update this documentation** with the new token

---

## Related Documentation

- [Accessibility Guidelines](file:///Users/mario/projects/LiquidCrypto/docs/ACCESSIBILITY.md)
- [Performance Best Practices](file:///Users/mario/projects/LiquidCrypto/docs/PERFORMANCE.md)
- [Material Decision Tree](file:///Users/mario/projects/LiquidCrypto/docs/MATERIAL_DECISION_TREE.md)

---

## Summary

Design tokens provide a robust foundation for building consistent, maintainable, and theme-aware components. By using tokens:

- ✅ All components share the same visual language
- ✅ Theme switching works automatically
- ✅ Future design changes are centralized
- ✅ Code is more readable and maintainable

**Key takeaway**: Use Tailwind utility classes when possible (they use tokens automatically), and use CSS variables (`var(--token-name)`) for custom styles.
