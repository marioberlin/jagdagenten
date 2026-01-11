# ADR-003: Glass Design System Architecture

## Status

Accepted

## Context

The project implements Apple's conceptual "Liquid Glass" design language with:
- 162+ React components
- Glassmorphism aesthetics
- AI-powered agentic components
- Cross-platform compatibility

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

### Design Tokens

CSS custom properties for consistent theming:

```css
:root {
  --glass-primary: rgba(255, 255, 255, 0.1);
  --glass-blur: 20px;
  --glass-border: rgba(255, 255, 255, 0.2);
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
}
```

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

## Consequences

### Positive

- Consistent API across components
- Easy to find and use components
- Semantic naming matches functionality
- Theming support out of the box

### Negative

- Large bundle size (consider code splitting)
- Naming discipline required
- Learning curve for new contributors

## References

- [Component Source](../../src/components/)
- [Design Tokens Docs](../../docs/DESIGN_TOKENS.md)
- [Storybook Stories](../../src/components/**/*.stories.tsx)
