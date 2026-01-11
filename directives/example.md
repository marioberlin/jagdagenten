---
"name": "example"
"version": "1.0.0"
"updated": "2026-01-11"
---

# Example Directive Template

> This is a template for creating new directives. Copy this file and modify it for your specific use case.

## Goal
Clearly state what this directive accomplishes and why it's needed.

## Prerequisites
- Required dependencies (from `package.json`)
- Environment variables needed (in `.env`)
- Files or state that must exist before starting

## Inputs
- What information or files does the agent need to start?
- List any required parameters or context
- Example: Component name, target directory, feature flags

## Tools/Scripts
- Which scripts in `scripts/` should be used?
- Which npm commands from `package.json` are relevant?
- List them here with brief descriptions

Example:
```bash
npm run dev      # Start dev server for testing
npm run lint     # Check code quality
npm run test     # Run unit tests
```

## Outputs
- What should the agent produce?
- Where should outputs be saved or delivered?
- What files will be created/modified?

## Success Criteria
- How do you verify this directive was completed successfully?
- What tests should pass?
- What should the user be able to do now?

## Steps
1. First step with specific file paths
2. Run specific command: `npm run [script]`
3. Verify output at [location]
4. Final validation step

## Edge Cases
- Document known issues or special conditions
- Include rate limits, timing considerations, or API quirks
- Alternative paths if certain conditions are met

## Troubleshooting
| Problem | Solution |
|---------|----------|
| Build fails | Run `npm install` to refresh dependencies |
| Tests fail | Check that dev server is stopped before running tests |
| Type errors | Run `npm run build` to regenerate types |

## Learning Notes
*(This section gets updated during self-annealing)*

- [Date] - Discovered that [X] causes [Y], updated step 3 to handle this
- [Date] - API rate limit is 100 req/min, added retry logic to step 5

---

*Created: [Date]*  
*Last updated: [Date]*
