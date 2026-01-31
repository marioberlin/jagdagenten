# ADR-003: Glass Design System Architecture

## Status

Accepted (Updated 2026-02-01)

## Context

The project implements Apple's conceptual "Liquid Glass" design language with:
- 162+ React components
- Glassmorphism aesthetics
- AI-powered agentic components
- Cross-platform compatibility

The Jagd-Agenten application (50+ components) was migrated to the unified glass design system, replacing three legacy anti-patterns with a single consistent token-based approach.

## Decision

### Component Organization

Components are organized by function with consistent naming:

| Category | Pattern | Examples |
|----------|---------|----------|
| Primitives | `Glass*` | GlassButton, GlassContainer |
| Forms | `Glass*` | GlassInput, GlassSelect |
| Layout | `Glass*` | GlassNavbar, GlassSidebar |
| Data Display | `Glass*` | GlassCard, GlassTable |
| Feedback | `Glass*` | GlassToast, GlassAlert |
| Agentic | `Glass*` | GlassAgent, GlassCopilot |

### Glass Design Tokens (Dark Mode)

CSS custom properties defined in `src/index.css`:

```css
:root {
  /* Glass backgrounds */
  --glass-bg-regular: rgba(0, 0, 0, 0.35);
  --glass-bg-thick: rgba(0, 0, 0, 0.50);
  --glass-surface: rgba(255, 255, 255, 0.05);
  --glass-surface-active: rgba(255, 255, 255, 0.10);
  --glass-surface-hover: rgba(255, 255, 255, 0.08);

  /* Glass borders */
  --glass-border: rgba(255, 255, 255, 0.18);

  /* Glass accent */
  --glass-accent: #10b981;

  /* Text hierarchy */
  --text-primary: rgba(255, 255, 255, 0.95);
  --text-secondary: rgba(255, 255, 255, 0.65);
  --text-tertiary: rgba(255, 255, 255, 0.40);
}
```

### Correct Glass Patterns (Tailwind)

| Element | Tailwind Classes |
|---------|-----------------|
| **Cards** | `bg-[var(--glass-bg-regular)] backdrop-blur-md border border-[var(--glass-border)]` |
| **Modals** | `bg-[var(--glass-bg-thick)] backdrop-blur-xl border border-[var(--glass-border)]` |
| **Inputs** | `bg-[var(--glass-surface)] border border-[var(--glass-border)]` |
| **Hover states** | `hover:bg-[var(--glass-surface)]` or `hover:bg-[var(--glass-surface-active)]` |
| **Primary text** | `text-[var(--text-primary)]` |
| **Secondary text** | `text-[var(--text-secondary)]` |
| **Muted text** | `text-[var(--text-tertiary)]` |
| **Active nav** | `bg-[var(--glass-accent)] text-white` |
| **Inactive nav** | `text-[var(--text-secondary)] hover:bg-[var(--glass-surface-hover)]` |

### Inline `<style>` Pattern

For components using `<style>` blocks (e.g., SightingRadar, StoryEditor):

```css
.card {
  background: var(--glass-bg-regular);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(12px);
}
.card-title { color: var(--text-primary); }
.card-subtitle { color: var(--text-secondary); }
.card-meta { color: var(--text-tertiary); }
.accent-btn { background: var(--glass-accent); }
```

### Anti-Patterns (DO NOT USE)

These patterns were fully removed from the codebase:

| Anti-Pattern | Why Incorrect | Replacement |
|-------------|---------------|-------------|
| `bg-white/5` + `border-white/10` | Hardcoded opacity, no theme support | `bg-[var(--glass-surface)]` + `border-[var(--glass-border)]` |
| `dark:bg-gray-800` / `dark:text-gray-300` | Dual light/dark classes, no glass system | `bg-[var(--glass-bg-regular)]` / `text-[var(--text-secondary)]` |
| `var(--bg-secondary, #1a1a2e)` | Custom vars with fallbacks, not glass tokens | `var(--glass-bg-regular)` |
| `var(--text-primary, #fff)` | Fallback overrides the token | `var(--text-primary)` (no fallback) |
| `var(--color-primary, #10b981)` | Non-standard token name | `var(--glass-accent)` |

### Component Convention

```typescript
// All components use forwardRef and displayName
export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ variant = 'primary', ...props }, ref) => {
    return <button ref={ref} className={cn(variantStyles[variant])} {...props} />;
  }
);
GlassButton.displayName = 'GlassButton';
```

## Migration History

**2026-02-01:** Completed migration of ~50 Jagd-Agenten components:
- 6 critical files (DailyCockpit, HegeDashboard, WildunfallMode, NachsucheFlow, PackDashboard, ScoutView)
- 14 medium-priority files (Feed/*, Explore/*, Stories/*, SightingRadar/*, Invites/*)
- 12 utility files (ConfirmationModal, PremiumGate, SubscriptionSettings, ActionChips, AnalyticsDashboard, etc.)
- Final verification: **0 remaining** old patterns across entire `jagd-agenten/` directory

## Consequences

### Positive

- Consistent API across components
- Easy to find and use components
- Semantic naming matches functionality
- Theming support out of the box
- Single source of truth for glass styling tokens
- Zero-fallback approach prevents token override bugs

### Negative

- Large bundle size (consider code splitting)
- Naming discipline required
- Learning curve for new contributors

## References

- [Glass Tokens Source](../../../src/index.css)
- [Design Tokens Docs](../../design/tokens.md)
- [Component Source](../../../src/components/)
