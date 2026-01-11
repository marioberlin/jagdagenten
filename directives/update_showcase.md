---
"name": "update_showcase"
"version": "1.0.0"
"updated": "2026-01-11"
---

# Update Showcase

## Goal
Add or update component documentation in the showcase to demonstrate usage, props, and patterns.

## Prerequisites
- Component already exists in `src/components/`
- Component is exported from `src/components/index.ts`
- Dev server running (`npm run dev`)

## Inputs
- Component name
- Component category (primitives, forms, layout, etc.)
- Props documentation
- Usage examples
- Interactive demo requirements

## Tools/Scripts
```bash
npm run dev          # View showcase updates in real-time
npm run lint         # Verify code quality
npm run build        # Ensure build succeeds
```

## Outputs
- Updated showcase page in `src/pages/showcase/`
- Props documentation table
- Code examples
- Interactive demo (if applicable)

## Success Criteria
- Component appears in showcase navigation
- Props table is complete and accurate
- Code examples are functional
- Interactive demo works in both light/dark modes
- Build succeeds

## Steps

1. **Identify appropriate showcase page**
   - Primitives: `src/pages/showcase/ShowcasePrimitives.tsx`
   - Forms: `src/pages/showcase/ShowcaseForms.tsx`
   - Layout: `src/pages/showcase/ShowcaseLayout.tsx`
   - Feedback: `src/pages/showcase/ShowcaseFeedback.tsx`
   - Data Display: `src/pages/showcase/ShowcaseDataDisplay.tsx`
   - Features: `src/pages/showcase/ShowcaseFeatures.tsx`
   - Overlays: `src/pages/showcase/ShowcaseOverlays.tsx`
   - Agentic: `src/pages/demos/` (AI-powered components)

2. **Add component import**
   ```tsx
   import { GlassYourComponent } from '@/components';
   ```

3. **Create section for component**
   ```tsx
   <section id="your-component">
     <h2>GlassYourComponent</h2>
     <p>Brief description of what this component does</p>
   </section>
   ```

4. **Add props documentation table**
   Use `GlassPropsTable` component:
   ```tsx
   <GlassPropsTable
     props={[
       {
         name: 'variant',
         type: 'string',
         default: 'default',
         description: 'Visual style variant'
       },
       {
         name: 'size',
         type: 'sm | md | lg',
         default: 'md',
         description: 'Component size'
       }
     ]}
   />
   ```

5. **Add code example**
   Use `GlassCode` component:
   ```tsx
   <GlassCode
     code={`<GlassYourComponent
  variant="primary"
  size="md"
>
  Content here
</GlassYourComponent>`}
     language="tsx"
   />
   ```

6. **Add interactive demo**
   ```tsx
   <div className="glass-container p-6">
     <GlassYourComponent
       variant="primary"
       size="md"
     >
       Live demo
     </GlassYourComponent>
   </div>
   ```

7. **Test in both themes**
   - View in light mode
   - Switch to dark mode
   - Verify component looks correct

8. **Verify build**
   ```bash
   npm run lint
   npm run build
   ```

## Edge Cases
- For AI-powered components, add to `src/pages/demos/` instead of showcase
- Complex components may need dedicated demo pages
- Props with TypeScript unions should show all options
- Optional props should be clearly marked

## Troubleshooting
| Problem | Solution |
|---------|----------|
| Component not rendering | Check import path uses `@/components` |
| Props table incomplete | Review component TypeScript interface |
| Code example doesn't work | Test the example code in isolation |
| Demo broken in theme | Check for hardcoded colors (see `fix_theme_colors.md`) |

## Learning Notes
- Props tables help users understand component APIs quickly
- Interactive demos should show common use cases
- Code examples should be copy-paste ready

---

*Created: 2026-01-08*
