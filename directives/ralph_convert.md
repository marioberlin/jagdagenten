---
"name": "ralph_convert"
"version": "1.0.0"
"updated": "2026-01-11"
---

# Ralph PRD Conversion Directive

> [!IMPORTANT]
> Use this directive to transform a Markdown-based PRD or feature request into the atomic `prd.json` format required for the Ralph autonomous loop.

## The Goal
Convert broad requirements into a collection of **atomic, verifiable user stories** that can each be completed in a single iteration.

## The Format
The output must be a valid JSON file at the project root named `prd.json`:

```json
{
  "project": "[Project Name]",
  "branchName": "ralph/[feature-name]",
  "description": "[Brief summary]",
  "userStories": [
    {
      "id": "US-001",
      "title": "[Title]",
      "description": "As a [user], I want [feature] so that [benefit]",
      "acceptanceCriteria": [
        "Criterion 1 (Verifiable)",
        "Typecheck passes",
        "Verify in browser using browser tool"
      ],
      "priority": 1,
      "passes": false
    }
  ]
}
```

## The "Small Task" Rules
1. **Atomic**: If a story cannot be described in 2-3 sentences, it is too big.
2. **Sequential**: Order stories by dependency (Schema -> Server -> UI -> Polish).
3. **Verifiable**: Every criteria must be checkable via tool or script. Vague items like "Good UX" are forbidden.
4. **Mandatory Checks**: Every story MUST include `"Typecheck passes"`. Every UI story MUST include `"Verify in browser using browser tool"`.

## Conversion Process
1. **Read**: Analyze the source PRD or requirements.
2. **Clarify**: If requirements are vague, ask the user for clarification before splitting.
3. **Draft**: Split the requirements into a logical sequence of US-XXX stories.
4. **Validate**: Check if each story is small enough for one context window.
5. **Save**: Write the `prd.json` and initialize the loop environment.

---
*Created: 2026-01-10*
