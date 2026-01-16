---
name: verify_design_compliance
version: 1.0.0
updated: 2026-01-16
---

# Verify Design Compliance

## Goal
Automated QA to scan components for "illegal" styles (hardcoded hex, standard Tailwind colors) and suggest ensuring semantic token usage.

## Prerequisites
-   Target file(s) to scan.
-   Access to `src/styles/design-tokens.ts`.

## Inputs
-   `TargetFile`: The absolute path of the file to verify.

## Success Criteria
-   No hardcoded hex values (e.g. `#ffffff`).
-   No standard Tailwind colors (e.g. `bg-blue-500`, `text-gray-200`).
-   **No Emojis**: Source code should rely on `lucide-react`.
-   All opacity modifiers use semantic variables or strict tokens.
-   Easing functions match `cubic-bezier(0.42, 0.0, 0.58, 1.0)` (Apple HIG).

## Tools/Scripts
Use `grep` or regex search in the file content.

## Steps

1.  **Scan for Hardcoded Colors**
    -   Pattern: `#[0-9a-fA-F]{3,6}`
    -   Action: Flag as error. Suggest `APPLE_SYSTEM_COLORS` or semantic tokens.

2.  **Scan for Non-Semantic Tailwind Colors**
    -   Pattern: `(bg|text|border)-(red|blue|green|yellow|gray|purple|pink|indigo)-[0-9]+`
    -   Action: Flag as warning. Suggest `text-system-blue` (custom utility) or `text-accent`.

3.  **Scan for raw opacity**
    -   Pattern: `opacity-[0-9]+` (unless 0 or 100)
    -   Action: Suggest using `bg-glass-surface` variants which handle opacity internally.

4.  **Verify Motion Curves**
    -   If `transition` or `animate` is present, check for `ease-out` or custom cubic-bezier.
    -   Flag "linear" as a violation (unless for spinners).

5.  **Scan for Emojis**
    -   Pattern: `[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]` (Unicode emoji ranges)
    -   Action: Flag as error. Suggest replacing with `<IconName size={16} />` from `lucide-react`.

## Outputs
-   A report listing lines with violations and suggested fixes.

