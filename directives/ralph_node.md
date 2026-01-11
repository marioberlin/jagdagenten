---
"name": "ralph_node"
"version": "1.0.0"
"updated": "2026-01-11"
---

# Ralph Iteration Directive

> [!NOTE]
> This directive is used by the Ralph autonomous loop to execute a single iteration of development.

## Goal
Successfully implement exactly ONE user story from `prd.json`, verify its correctness, and update the project state to reflect completion.

## Prerequisites
- `prd.json` exists and contains unfulfilled stories (`passes: false`).
- `progress.txt` exists (or is initialized).
- A clean git state (or automated commit/rollback capability).

## Execution Steps

### 1. Analyze State
- Read `prd.json` and identify the highest priority user story where `passes: false`.
- Read `progress.txt` to understand context and learnings from previous iterations.

### 2. Implementation
- Implement the selected story in the codebase.
- Follow the patterns and conventions defined in `GEMINI.md`.
- Ensure changes are atomic and focused solely on the selected story.

### 3. Verification
- Run mandatory quality checks:
    - `npm run lint`
    - `npm run build`
    - `npm run test` (if relevant tests exist)
- If the story requires UI changes, use the `browser` tool to verify the component renders correctly and meets acceptance criteria.

### 4. State Update
- If verification passes:
    - Update `prd.json`: Set `passes: true` for the completed story.
    - **Update `progress.txt`**: 
        - APPEND a concise summary of results.
        - **CONSOLIDATE**: If you discovered a reusable pattern (e.g., "Always use X for Y"), update the `## Codebase Patterns` section at the TOP of the file.
    - **Update `GEMINI.md`**: If any new system-wide conventions were discovered, update the relevant section immediately.
- If verification fails:
    - Log the error and backtrack if necessary. Do NOT mark as passes.

### 5. Completion Signal
After completing a story, check if ALL stories in `prd.json` have `passes: true`.
If the PRD is complete, respond with:
`<promise>COMPLETE</promise>`

## Success Criteria
- The selected user story is fully functional.
- Quality checks (lint/build/test) are green.
- `prd.json` and `progress.txt` are accurately updated.
- **Deep Memory**: Reusable patterns are persisted.

---
*Created: 2026-01-10*
*Last updated: 2026-01-10*
