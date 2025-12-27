# Accessibility Testing Guide

## Overview

This guide covers accessibility testing procedures for the Liquid Glass Design System, with focus on screen reader compatibility, keyboard navigation, and visual accessibility.

---

## Screen Reader Testing

### Recommended Screen Readers

| Platform | Screen Reader | Notes |
|----------|---------------|-------|
| macOS | VoiceOver | Built-in, Cmd+F5 to toggle |
| Windows | NVDA | Free, open source |
| Windows | JAWS | Industry standard, paid |
| iOS | VoiceOver | Built-in, triple-click home |
| Android | TalkBack | Built-in |

### Testing Checklist

#### Glass Containers
- [ ] Focus ring is visible with sufficient contrast
- [ ] Interactive containers announce their role correctly
- [ ] State changes (expanded, selected, disabled) are announced
- [ ] Glass containers don't trap focus unexpectedly

#### Glass Buttons
- [ ] Button role is announced
- [ ] Button label is read correctly
- [ ] Loading states announce "loading" or equivalent
- [ ] Disabled state is communicated
- [ ] Click/activation works via Enter and Space keys

#### Glass Modals & Dialogs
- [ ] Focus moves to modal when opened
- [ ] Modal title is announced
- [ ] Focus is trapped within modal
- [ ] Escape key closes modal
- [ ] Focus returns to trigger element on close
- [ ] `aria-modal="true"` is present
- [ ] Background content is hidden with `aria-hidden`

#### Glass Forms
- [ ] All inputs have associated labels
- [ ] Required fields are announced
- [ ] Error messages are read when they appear
- [ ] Form groups are announced with `fieldset/legend`
- [ ] Autocomplete suggestions are announced

---

## Keyboard Navigation Testing

### Focus Order
```
Test navigation flow:
1. Tab through all interactive elements
2. Verify logical reading order
3. Check no focus traps exist
4. Verify skip links work (if present)
```

### Key Bindings to Test

| Key | Expected Behavior |
|-----|-------------------|
| Tab | Move to next focusable element |
| Shift+Tab | Move to previous focusable element |
| Enter | Activate button/link |
| Space | Activate button, toggle checkbox |
| Escape | Close modal/dropdown |
| Arrow keys | Navigate within menus/tabs |

### Focus Ring Visibility

Glass components must have visible focus indicators:

```css
/* Minimum focus ring requirements */
.glass-button:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
}
```

Test that:
- [ ] Focus ring has 3:1 contrast against background
- [ ] Focus ring is visible on all glass materials
- [ ] Focus ring respects `prefers-reduced-motion`

---

## Visual Accessibility Testing

### Color Contrast Requirements

| Text Type | WCAG Level | Minimum Ratio |
|-----------|------------|---------------|
| Body text | AA | 4.5:1 |
| Large text (18pt+) | AA | 3:1 |
| UI components | AA | 3:1 |
| Enhanced | AAA | 7:1 |

### Testing with Glass Backgrounds

Glass surfaces present unique contrast challenges:

1. **Test on light backgrounds** - White/light images
2. **Test on dark backgrounds** - Dark/black images
3. **Test on busy backgrounds** - Multi-color, high-contrast photos
4. **Test with high-contrast mode** - `prefers-contrast: more`

### Automated Tools

```bash
# Lighthouse accessibility audit
npx lighthouse http://localhost:5173 --only-categories=accessibility

# axe-core testing
npm install @axe-core/react --save-dev
```

### Manual Testing

Use browser DevTools accessibility panel:
1. Chrome: DevTools → Elements → Accessibility
2. Firefox: DevTools → Accessibility tab
3. Safari: Web Inspector → Audit tab

---

## Media Query Testing

### Required Media Queries

| Query | Purpose | How to Test |
|-------|---------|-------------|
| `prefers-reduced-motion` | Disable animations | OS accessibility settings |
| `prefers-reduced-transparency` | Solid backgrounds | OS accessibility settings |
| `prefers-contrast` | High contrast mode | OS, or DevTools emulation |
| `prefers-color-scheme` | Light/dark mode | OS settings |

### Testing in DevTools

```
Chrome DevTools → Rendering → Emulate CSS media features
```

---

## ARIA Attributes Reference

### Glass Component ARIA Usage

```tsx
// GlassModal
<div role="dialog" aria-modal="true" aria-labelledby="title">

// GlassButton (loading)
<button aria-busy="true" aria-disabled="true">

// GlassAccordion
<button aria-expanded="false" aria-controls="panel-1">
<div id="panel-1" role="region" aria-labelledby="header-1">

// GlassTooltip
<button aria-describedby="tooltip-1">
<div role="tooltip" id="tooltip-1">

// GlassAlert
<div role="alert" aria-live="polite">
```

---

## Testing Procedure

### Before Release Checklist

1. **Automated Testing**
   - [ ] Run Lighthouse accessibility audit (score ≥95)
   - [ ] Run axe-core tests (0 violations)
   - [ ] Validate HTML with W3C validator

2. **Screen Reader Testing**
   - [ ] Test with VoiceOver (macOS/iOS)
   - [ ] Test with NVDA or JAWS (Windows)
   - [ ] Verify all interactive elements are announced

3. **Keyboard Testing**
   - [ ] Complete all flows keyboard-only
   - [ ] Verify focus order is logical
   - [ ] Test all keyboard shortcuts

4. **Visual Testing**
   - [ ] Test high contrast mode
   - [ ] Test reduced motion
   - [ ] Test reduced transparency
   - [ ] Verify color contrast ratios

5. **Mobile Testing**
   - [ ] Test with TalkBack (Android)
   - [ ] Test with VoiceOver (iOS)
   - [ ] Verify touch targets ≥44x44px

---

## Common Issues & Fixes

### Issue: Glass blur affects text readability

**Solution**: Use `text-on-glass` utility or increase font weight:
```html
<div class="glass-typography">
  <p class="text-on-glass">Readable text</p>
</div>
```

### Issue: Focus ring not visible on glass

**Solution**: Use offset and sufficient contrast:
```css
:focus-visible {
    outline: 2px solid white;
    outline-offset: 2px;
    box-shadow: 0 0 0 4px rgba(0,0,0,0.3);
}
```

### Issue: Screen reader announces wrong role

**Solution**: Add explicit ARIA role:
```tsx
<GlassContainer as="button" role="button">
```

### Issue: Animations cause motion sickness

**Solution**: Already handled with `prefers-reduced-motion` media query.

---

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Apple Accessibility Guidelines](https://developer.apple.com/accessibility/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Deque axe-core](https://github.com/dequelabs/axe-core)
