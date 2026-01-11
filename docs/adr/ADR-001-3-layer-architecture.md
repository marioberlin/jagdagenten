# ADR-001: 3-Layer Architecture for AI-Integrated Systems

## Status

Accepted

## Context

LLMs are probabilistic systems that can produce varying outputs for the same input. Most business logic is deterministic and requires consistency. This mismatch creates reliability issues when AI is directly integrated into critical workflows.

## Decision

We adopted a 3-layer architecture that separates concerns:

1. **Layer 1: Directive** - SOPs in Markdown, live in `directives/`
   - Define goals, inputs, tools/scripts, outputs, edge cases
   - Natural language instructions (like giving directions to a mid-level employee)
   - Version-controlled alongside code

2. **Layer 2: Orchestration** - This is the AI's role
   - Intelligent routing based on directives
   - Call execution tools in correct order
   - Handle errors and ask for clarification
   - Update directives with learnings

3. **Layer 3: Execution** - Deterministic scripts
   - Node.js/TypeScript scripts in `scripts/`
   - Handle API calls, data processing, file operations
   - Reliable, testable, fast

## Consequences

### Positive

- **Reliability**: Deterministic code reduces error compounding
  - 90% accuracy per step × 5 steps = 59% success
  - Deterministic code = 99.99% success
- **Testability**: Scripts can be unit tested independently
- **Maintainability**: Clear separation of concerns
- **Learnability**: System improves by updating directives

### Negative

- Initial setup complexity
- Requires discipline to follow the pattern
- May seem over-engineered for simple tasks

## Example Flow

```
User Request → Directive (SOP) → Orchestrator (AI) → Execution (Script) → Result
```

## References

- [Architecture Overview](../CLAUDE.md#the-3-layer-architecture)
- [Directives Directory](../directives/)
