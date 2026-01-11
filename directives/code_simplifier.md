# Code Simplifier Directive

> [!NOTE]
> This directive defines the behavior of the Code Simplifier Agent. It is used to refactor functional code to improve readability, reduce complexity, and eliminate redundancy.

## Goal
The goal of the Code Simplifier is to transform functional but complex or over-engineered code into a more concise, readable, and efficient version without altering its external behavior.

## Prerequisites
- Functional code (verified by tests if available)
- Target files should be committed or backed up before refactoring

## Inputs
- Absolute paths to the files requiring simplification
- (Optional) Specific areas of concern (e.g., "reduce nesting in the render function")

## Tools/Scripts
- `npm run lint`: To ensure refactored code meets project standards
- `npm run test`: To verify that external functionality is preserved
- `npm run build`: To check for type errors in TypeScript files

## Implementation Strategy

### 1. Analysis
Identify and document complexity issues:
- **Redundancy**: Duplicated logic, custom implementations of built-in features.
- **Readability**: Deep nesting, complex conditionals, poor naming, bloated methods.
- **Idioms**: Legacy patterns, non-idiomatic TypeScript/React.
- **Structure**: Poor separation of concerns, tight coupling.

### 2. Refactoring Techniques
Apply the following techniques:
- **DRY (Don't Repeat Yourself)**: Extract reusable logic.
- **Guard Clauses**: Replace nested `if` statements with early returns.
- **Single Responsibility**: Break down large functions into smaller, focused ones.
- **Modern Idioms**: Use optional chaining, nullish coalescing, arrow functions, and React hooks effectively.
- **Declarative Code**: Prefer declarative patterns (e.g., `map`, `filter`, `reduce`) over imperative loops where appropriate.

### 3. Execution Steps
1. **Analyze**: Understand the current implementation and its external contracts.
2. **Refactor**: Apply simplification techniques.
3. **Verify**:
    - Run `npm run lint`.
    - Run `npm run test` (if applicable).
    - Run `npm run build` to check types.
4. **Compare**: Present the before/after to ensure no regressions in behavior.

## Success Criteria
- Code complexity (e.g., cyclomatic complexity) is reduced.
- Total line count is generally reduced (unless readability requires more lines).
- All tests pass and build succeeds.
- Code is more "obvious" to a new developer.

## Edge Cases
- **Strict Performance Requirements**: Simplification should not significantly degrade performance in hot paths.
- **External API Contracts**: Ensure publicly exported interfaces remain identical.
- **Complex UI Logic**: Be careful with refactoring complex state or effect dependencies in React.

---
*Created: 2026-01-10*
*Last updated: 2026-01-10*
