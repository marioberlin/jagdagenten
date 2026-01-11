# Fix Theme Colors

## Goal
Replace hardcoded colors with semantic tokens to ensure theme consistency across light/dark modes.

## Prerequisites
- Project running in dev mode (`npm run dev`)
- Access to both light and dark themes for testing

## Inputs
- File(s) to fix (or entire component category)
- Search patterns to replace

## Tools/Scripts
```bash
npm run dev          # Test visual changes in real-time
npm run lint         # Verify code quality after changes
npm run build        # Ensure no build errors
```

## Outputs
- Modified component files with semantic tokens
- Components that work correctly in both light and dark themes

## Success Criteria
- Zero instances of hardcoded colors (`text-white`, `bg-blue-500`, etc.)
- Component looks correct in both light and dark modes
- Linter passes
- Build succeeds

## Steps

1. **Search for hardcoded colors**
   Common patterns to find:
   - `text-white`, `text-black`, `text-gray-[X]`
   - `bg-white/[\d+]`, `bg-black/[\d+]`
   - `border-white/[\d+]`, `border-gray-[X]`
   - Raw color values: `#fff`, `#000`, `rgb()`, `rgba()`

2. **Replace with semantic tokens**
   
   | Hardcoded | Semantic Token |
   |-----------|----------------|
   | `text-white`, `text-gray-100` | `text-primary` |
   | `text-gray-400`, `text-gray-500` | `text-secondary` |
   | `text-gray-600` | `text-tertiary` |
   | `bg-white/10`, `bg-black/10` | `bg-glass-surface` |
   | `bg-white/20`, `bg-black/20` | `bg-glass-surface-md` |
   | `bg-white/30` | `bg-glass-surface-lg` |
   | `border-white/10`, `border-gray-200` | `border-[var(--glass-border)]` |

3. **Test in both themes**
   - Switch to dark mode in dev mode
   - Verify component appearance
   - Switch to light mode
   - Verify component appearance

4. **Run lint and build**
   ```bash
   npm run lint
   npm run build
   ```

## Edge Cases
- Some components may need different opacity levels for glass effects
  - Use `bg-glass-surface` (10% opacity)
  - Use `bg-glass-surface-md` (20% opacity)
  - Use `bg-glass-surface-lg` (30% opacity)
- Icon colors should typically use `text-primary` or `text-secondary`
- Hover states should use `hover:bg-glass-surface-md`

## Troubleshooting
| Problem | Solution |
|---------|----------|
| Component too dark/light | Adjust opacity level (surface, surface-md, surface-lg) |
| Border not visible | Use `border-[var(--glass-border)]` instead of transparent borders |
| Text hard to read | Use `text-primary` for main text, `text-secondary` for less important |

## Learning Notes
- The glassmorphism effect relies on consistent use of semantic tokens
- Different backgrounds may need different surface opacity levels

---

*Created: 2026-01-08*
