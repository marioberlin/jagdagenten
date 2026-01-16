---
"name": "add_glass_component"
"version": "1.0.0"
"updated": "2026-01-11"
---

# Add Glass Component

## Goal
Create a new Glass* component following project conventions and integrate it into the component library.

## Prerequisites
- Node.js and npm installed
- Project dependencies installed (`npm install`)
- Understanding of which component category is appropriate

## Inputs
- Component name (must start with "Glass", e.g., "GlassToggle")
- Component category: `primitives/`, `forms/`, `layout/`, `feedback/`, `data-display/`, `features/`, `overlays/`, `agentic/`, or `generative/`
- Props interface definition
- Basic functionality requirements

## Tools/Scripts
```bash
npm run dev          # Test component in dev mode
npm run lint         # Verify code quality
npm run test         # Run unit tests
npm run build        # Verify build succeeds
```

## Outputs
- New component file: `src/components/[category]/[ComponentName].tsx`
- Updated export in `src/components/index.ts`
- Optional: Test file in `tests/unit/`
- Optional: Showcase example in `src/pages/showcase/`

## Success Criteria
- Component builds without errors
- Linter passes with zero warnings
- Component follows `forwardRef` + `displayName` pattern
- Uses semantic tokens (no hardcoded colors)
- Component is exported from `index.ts` and usable in other files

## Steps

1. **Create component file**
   - Path: `src/components/[category]/Glass[Name].tsx`
   - Use `forwardRef` for reusable components
   - Set `displayName` for debugging

2. **Implement with semantic styling**
   - Use semantic tokens from `src/styles/design-tokens.ts`:
     - `APPLE_SYSTEM_COLORS` for system colors
     - `GLASS_BLUR` for blur strength
     - `text-primary`, `text-secondary`, `text-tertiary` for text
   - Use `bg-glass-surface` variants for backgrounds
   - Use `border-[var(--glass-border)]` for borders
   - NO hardcoded colors like `text-white` or `bg-blue-500`
   - **NO Emojis**: Use icons from `lucide-react` instead.

3. **Export from index**
   - Add to `src/components/index.ts`
   - Maintain alphabetical order within category

4. **Verify build**
   ```bash
   npm run lint
   npm run build
   ```

5. **Verify Motion**
   - Ensure specific easing `cubic-bezier(0.42, 0.0, 0.58, 1.0)` is used for transitions.
   - Check press/hover states match `liquid-glass-design` skill guidelines.

5. **Test in dev mode**
   ```bash
   npm run dev
   ```
   - Import and use component to verify it works

6. **(Optional) Add to showcase**
   - See `update_showcase.md` directive

## Edge Cases
- If component needs state management, use existing context providers
- If component requires animations, use Framer Motion or React Spring
- If component needs AI integration, see `add_ai_integration.md`

## Troubleshooting
| Problem | Solution |
|---------|----------|
| TypeScript errors | Ensure props interface is properly exported |
| Linter fails | Run `npm run lint` and fix issues, no warnings allowed |
| Build fails | Check that all imports are correct and use path alias `@/*` |
| Component not found | Verify export in `src/components/index.ts` |

## Learning Notes
- Components should always use semantic tokens for theme consistency
- `forwardRef` is required for components that accept refs (most UI primitives)
- Always refer to `LiquidSkills/community/liquid-glass-design/SKILL.md` for visual guidelines.

---

*Created: 2026-01-08*
