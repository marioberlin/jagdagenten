# Strategy: LiquidSkills Architecture (Multi-Runtime)

**Goal**: Establish a universal "Skill Interface" allowing ANY AI agent (Gemini, Claude, etc.) to autonomously discover, understand, and execute specialized capabilities within the LiquidCrypto ecosystem, supporting both Python and Bun/TypeScript.

## 1. The Core Concept
A "Skill" is a directory containing:
1.  `SKILL.md`: The brain (Instructions + Metadata).
2.  `tools/`: The hands (Scripts/Executables).
    *   `tools/bun/`: Bun/TypeScript scripts.
    *   `tools/py/`: Python scripts.
3.  `data/`: The memory (Reference files).

**Protocol**: Agents "learn" a skill by reading `SKILL.md` and "execute" it by running scripts in `tools/` using their native command execution capabilities.

## 2. Directory Structure (`/LiquidSkills`)
We will organize skills to be machine-readable and modular.

```text
LiquidSkills/
├── _registry.md            # ROOT INDEX: The first file an agent reads to see what's available.
├── liquid-design/          # SKILL: The Design System Expert (TS)
│   ├── SKILL.md
│   └── tools/bun/scaffold.ts
├── liquid-agency/          # SKILL: The Agent Architecture Expert (TS)
│   ├── SKILL.md
└── vendor/                 # Imported Skills (ClaudeSkills plugins)
    └── pdf-processor/      # SKILL: Original Python-based skill
        ├── SKILL.md
        └── tools/py/extract.py
```

## 3. Parallel Runtime Support
To make this work for *any* agent and support legacy skills:

1.  **Dual Tooling**: Every agent checks for tools in both `tools/bun` and `tools/py`.
2.  **Python Support**:
    *   **Dependencies**: To run Python skills, we recommend a virtual environment. We will initialize a global `.venv` in `/LiquidSkills` for shared dependencies or allow per-skill `requirements.txt`.
    *   **Core Requirements**: Standard macOS Python 3.9+ is sufficient. Specific skills (like PDF/Excel) may require `pip install pdfplumber pandas openpyxl`.
3.  **Conversion Workflow**:
    *   When a new Python skill is added, the agent MUST ask: *"I've detected new Python tools. Would you like me to convert these to Bun/TypeScript for better performance and integration with our primary stack?"*
    *   If "Yes", the agent uses the `LiquidSkills/liquid-agency` expertise to rewrite the logic in TypeScript.

## 4. Immediate Implementation Plan
### Step 1: Initialize Registry & Multi-Runtime Foundation
Create `/LiquidSkills/_registry.md` and the directory hierarchy.

### Step 2: Create `liquid-design` Skill (Primary TS)
*   **SKILL.md**: Instructions on using `components/Glass*`.
*   **tools/bun/scaffold.ts**: A TS script to generate component boilerplate.

### Step 3: Create `liquid-agency` Skill (The Meta-Skill)
*   **SKILL.md**: Explain the 3-Layer Architecture and the **Skill Conversion** workflow.

### Step 4: Adapt `frontend-design` (Vendor)
*   Port the aesthetic guide from `ClaudeSkills` to `vendor/frontend-design`.

## User Review Required
*   **Python Dependencies**: Are you comfortable with me creating a central `/LiquidSkills/.venv` to manage Python libraries for vendor skills?
*   **Conversion Default**: Should I always offer conversion, or only for certain types of skills (e.g. data processing vs. simple text tasks)?
