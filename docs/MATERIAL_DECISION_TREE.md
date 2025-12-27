# Glass Material Decision Tree

A visual guide for selecting the appropriate glass material variant for your UI components.

---

## Quick Reference

```
Is it functional UI (navigation, controls)?
├── YES → Use Glass
│   └── Is it floating over media/photos?
│       ├── YES → material="clear"
│       └── NO → What's its importance?
│           ├── Primary (main nav, modals) → material="thick"
│           ├── Secondary (cards, panels) → material="regular"
│           └── Tertiary (tooltips, hints) → material="thin"
└── NO → Is it a content container?
    ├── Article/text block → NO GLASS (use solid bg)
    ├── Data table → NO GLASS (use solid bg)
    └── Hero/feature area → material="background" (subtle)
```

---

## Decision Flowchart

```
                    ┌─────────────────────┐
                    │   What type of      │
                    │   element is this?  │
                    └──────────┬──────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         ▼                     ▼                     ▼
   ┌───────────┐        ┌───────────┐        ┌───────────┐
   │ Navigation│        │Interactive│        │  Content  │
   │   Layer   │        │ Controls  │        │   Layer   │
   └─────┬─────┘        └─────┬─────┘        └─────┬─────┘
         │                    │                    │
         ▼                    ▼                    ▼
   ┌───────────┐        ┌───────────┐        ┌───────────┐
   │material:  │        │material:  │        │   AVOID   │
   │"thick" or │        │"regular"  │        │   GLASS   │
   │"prominent"│        │           │        │           │
   └───────────┘        └───────────┘        └───────────┘
```

---

## Material Variants Explained

### `material="thin"` (8px blur)
**Use for:** Tooltips, dropdown menus, hover cards, subtle overlays

```tsx
<GlassTooltip />
<GlassDropdown />
<GlassHoverCard />
```

### `material="regular"` (16px blur)  
**Use for:** Cards, popovers, secondary panels, forms

```tsx
<GlassCard />
<GlassPopover />
<GlassFormGroup />
```

### `material="thick"` (32px blur)
**Use for:** Primary navigation, modals, sidebars, large panels

```tsx
<GlassModal />
<GlassSidebar />
<GlassTopNav />
```

### `material="clear"` (8px blur, minimal opacity)
**Use for:** Media player controls, photo overlays, video UI

```tsx
<GlassMiniPlayer />
{/* Floating controls over images/video */}
<GlassFloatingAction />
```

### `material="background"` (4px blur)
**Use for:** Subtle container separation, hero sections

```tsx
{/* Background layer - not primary UI */}
<GlassContainer material="background">
  <HeroContent />
</GlassContainer>
```

### `material="prominent"` (32px blur + accent ring)
**Use for:** Featured cards, CTAs, focus elements

```tsx
{/* When you want to draw maximum attention */}
<GlassContainer material="prominent">
  <UpgradePromo />
</GlassContainer>
```

---

## Anti-Patterns ❌

### Don't use glass on content containers

```tsx
// ❌ BAD: Glass on article content
<GlassContainer>
  <article>
    <h1>Article Title</h1>
    <p>Long form content...</p>
  </article>
</GlassContainer>

// ✅ GOOD: Solid background for readability
<div className="bg-[var(--bg-primary)] rounded-lg p-6">
  <article>
    <h1>Article Title</h1>
    <p>Long form content...</p>
  </article>
</div>
```

### Don't stack multiple glass layers

```tsx
// ❌ BAD: Nested glass containers
<GlassContainer material="thick">
  <GlassContainer material="regular">
    <GlassContainer material="thin">
      <Content />
    </GlassContainer>
  </GlassContainer>
</GlassContainer>

// ✅ GOOD: Single glass layer with internal structure
<GlassContainer material="thick">
  <header className="border-b border-[var(--glass-border)]">...</header>
  <main>...</main>
</GlassContainer>
```

### Don't use glass on data tables

```tsx
// ❌ BAD: Glass on data rows
{rows.map(row => (
  <GlassContainer key={row.id}>
    <TableRow data={row} />
  </GlassContainer>
))}

// ✅ GOOD: Single glass container for entire table
<GlassContainer material="regular">
  <table>
    {rows.map(row => (
      <tr key={row.id}>...</tr>
    ))}
  </table>
</GlassContainer>
```

---

## Intensity Override

For fine-grained control within a material, use the `intensity` prop:

| Intensity | Blur | Opacity | When to Use |
|-----------|------|---------|-------------|
| `subtle` | 4px | 0.3 | Busy backgrounds, dense UIs |
| `medium` | 16px | 0.5 | Default for most cases |
| `heavy` | 32px | 0.7 | Hero sections, emphasis |

```tsx
<GlassContainer material="regular" intensity="subtle">
  {/* For content over busy/colorful backgrounds */}
</GlassContainer>
```

---

## Decision Examples

| UI Element | Material | Reasoning |
|------------|----------|-----------|
| Top navigation bar | `thick` | Primary functional layer |
| Floating action button | `clear` | Minimal interference with content |
| Settings modal | `thick` | Important interactive panel |
| Tooltip | `thin` | Temporary, non-critical |
| Card in grid | `regular` | Secondary content container |
| Media player controls | `clear` | Overlays visual content |
| Alert/error message | **solid** | Critical legibility needed |
| Profile dropdown | `regular` | Interactive, not primary |
