# Liquid Glass Performance Guidelines

## Overview

Glass effects using `backdrop-filter` are GPU-intensive. This document provides performance budgets and optimization strategies for maintaining 60fps across all devices.

---

## Performance Budgets

### Glass Layer Limits

| Device Class | Max Glass Layers | Max Blur Radius | Recommended |
|--------------|------------------|-----------------|-------------|
| Desktop (discrete GPU) | 5 | 50px | 3 layers, 24px blur |
| Desktop (integrated GPU) | 4 | 32px | 2-3 layers, 16px blur |
| Mobile (flagship) | 3 | 24px | 2 layers, 16px blur |
| Mobile (budget) | 2 | 16px | 1-2 layers, 8px blur |

### Frame Budget

| Scenario | Target | Max Deviation |
|----------|--------|---------------|
| Static glass UI | 60fps | ±2fps |
| Scroll with glass | 60fps | ±5fps |
| Glass animations | 60fps | ±5fps |
| Modal open/close | 30fps | acceptable during transition |

---

## Optimization Techniques

### 1. Layer Consolidation

```tsx
// ❌ Avoid: Multiple nested glass containers
<GlassContainer material="thick">
  <GlassContainer material="regular">
    <GlassContainer material="thin">
      <Content />
    </GlassContainer>
  </GlassContainer>
</GlassContainer>

// ✅ Prefer: Single glass layer with content hierarchy
<GlassContainer material="thick">
  <div className="p-6">
    <div className="border-b border-[var(--glass-border)]">Header</div>
    <div className="pt-4">Content</div>
  </div>
</GlassContainer>
```

### 2. Disable Liquid Filter on Interactive Elements

```tsx
// ✅ Disable liquid distortion on small/interactive elements
<GlassContainer 
  material="regular" 
  enableLiquid={false}  // Prevents GPU-heavy SVG filter
>
  <button>Click me</button>
</GlassContainer>
```

### 3. Use CSS Properties for GPU Hints

```css
/* Applied automatically on touch devices */
.backdrop-blur-regular {
  will-change: transform;
  transform: translateZ(0);
}
```

### 4. Reduce Blur During Scroll

The system automatically applies `.glass-performance-mode` on mobile during active scroll, which reduces blur to 8px.

---

## Material Selection Guide

| Use Case | Material | Blur | Performance Impact |
|----------|----------|------|---------------------|
| Tooltips, hints | `thin` | 8px | Low |
| Cards, popovers | `regular` | 16px | Medium |
| Modals, sidebars | `thick` | 32px | High |
| Media overlays | `clear` | 8px | Low |
| Background layers | `background` | 4px | Minimal |

---

## Monitoring Performance

### Chrome DevTools

1. Open Performance panel
2. Enable "Screenshots" and "Rendering"
3. Record while interacting with glass elements
4. Look for:
   - Frame drops below 60fps
   - Long "Composite Layers" tasks
   - High GPU memory usage

### Key Metrics

| Metric | Good | Needs Work | Critical |
|--------|------|------------|----------|
| Composite time | <4ms | 4-8ms | >8ms |
| GPU memory | <100MB | 100-200MB | >200MB |
| Paint time | <2ms | 2-4ms | >4ms |

---

## Accessibility Fallbacks

The system respects user preferences automatically:

```css
/* Reduced transparency - solid backgrounds */
@media (prefers-reduced-transparency: reduce) { ... }

/* Reduced motion - no blur animations */
@media (prefers-reduced-motion: reduce) { ... }

/* High contrast - opaque glass */
@media (prefers-contrast: more) { ... }

/* Low power/data saver - simplified glass */
@media (prefers-reduced-data: reduce) { ... }
```

---

## Mobile-Specific Optimizations

### Automatic Adjustments

| Media Query | Optimization |
|-------------|--------------|
| `max-width: 768px` | Reduced blur radii |
| `pointer: coarse` | GPU acceleration hints |
| Touch scroll | Simplified blur during scroll |

### Manual Optimization

```tsx
// For very complex layouts on mobile
const isMobile = window.matchMedia('(max-width: 768px)').matches;

<GlassContainer 
  material={isMobile ? 'thin' : 'thick'}
  enableLiquid={!isMobile}
>
  {children}
</GlassContainer>
```

---

## Testing Checklist

- [ ] Test on throttled CPU (4x slowdown)
- [ ] Test on throttled network
- [ ] Test with 5+ glass layers visible
- [ ] Test rapid modal open/close
- [ ] Test long scrolling lists
- [ ] Verify 60fps on target mobile devices
- [ ] Check GPU memory doesn't exceed 200MB
