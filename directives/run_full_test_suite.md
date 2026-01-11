---
"name": "run_full_test_suite"
"version": "1.0.0"
"updated": "2026-01-11"
---

# Run Full Test Suite

## Goal
Execute the complete testing workflow to ensure code quality, functionality, and build integrity before deployment.

## Prerequisites
- All dependencies installed (`npm install`)
- No dev server running (stop with Ctrl+C if needed)
- `.env` configured with necessary API keys

## Inputs
- Codebase in current state
- Optional: specific test files to run

## Tools/Scripts
```bash
npm run lint         # ESLint with zero warnings allowed
npm run test         # Vitest unit tests
npm run test:e2e     # Playwright E2E tests (auto-starts dev server)
npm run build        # Production build verification
```

## Outputs
- Test results for all suites
- Build artifacts in `dist/`
- Verification that code is production-ready

## Success Criteria
- ✅ Linter passes with zero warnings
- ✅ All unit tests pass
- ✅ All E2E tests pass
- ✅ Production build completes without errors
- ✅ No TypeScript errors

## Steps

1. **Stop dev server if running**
   - Press Ctrl+C in terminal where `npm run dev` is running
   - Verify port 5173 is free

2. **Run linter**
   ```bash
   npm run lint
   ```
   - Must pass with ZERO warnings (project policy)
   - Fix any issues before proceeding

3. **Run unit tests**
   ```bash
   npm run test
   ```
   - Tests run with Vitest and jsdom
   - Setup in `tests/setup.ts`
   - All tests must pass

4. **Run E2E tests**
   ```bash
   npm run test:e2e
   ```
   - Playwright tests against `http://localhost:5173`
   - Dev server auto-starts via Playwright config
   - Tests: `accessibility.spec.ts`, `components.spec.ts`, `showcase.spec.ts`, `theme.spec.ts`

5. **Verify production build**
   ```bash
   npm run build
   ```
   - TypeScript compilation + Vite production build
   - Output to `dist/`
   - Must complete without errors

6. **(Optional) Run single test**
   ```bash
   # Single unit test
   npx vitest run tests/unit/example.test.ts
   
   # Single E2E test
   npx playwright test tests/showcase.spec.ts
   ```

## Edge Cases
- E2E tests will fail if port 5173 is already in use
- Some tests may require specific environment variables
- Build may fail if there are unused imports (linter will catch this)

## Troubleshooting
| Problem | Solution |
|---------|----------|
| Linter warnings | Fix all warnings, project requires ZERO warnings |
| Port 5173 in use | Kill existing process: `kill $(lsof -t -i:5173)` |
| Unit tests fail | Check `tests/setup.ts` configuration |
| E2E tests timeout | Increase timeout in `playwright.config.ts` |
| Build errors | Run `npm install` to refresh dependencies |
| Type errors | Run `tsc --noEmit` to see full TypeScript errors |

## Learning Notes
- Always run full test suite before pushing to version control
- E2E tests are slower but catch integration issues
- Linter is configured for strict mode (zero warnings policy)

---

*Created: 2026-01-08*
