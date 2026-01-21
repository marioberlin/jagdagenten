# Integration Analysis: Liquid Design System (Variants A & B)

## 1. Executive Summary
We currently have two distinct design philosophies emerging within the project:
1.  **Variant A (Liquid Evolution)**: The "futuristic" aesthetic found in `liquid-designer`, characterized by heavy blurs (25px+), lower opacity, and asymmetric motion. This represents the unique "Liquid Glass" brand identity.
2.  **Variant B (Classic HIG)**: The "strict" Apple implementation defined in the new `apple-hig-designer` plan, characterized by standard blurs (10px), higher opacity, and symmetric motion. This represents native platform consistency.

To maintain both operational flexibility and architectural cleanliness, we will integrate these into a single, mode-aware **Liquid Design Skill** (`liquid-design`).

## 2. Directory Structure Strategy
We will refactor `LiquidSkills/liquid-design` to support a "Core + Variants" architecture.

```text
LiquidSkills/liquid-design/
├── SKILL.md                          # The "Router" & Common Truth
├── plugin.json                       # Plugin definition
├── assets/                           # Shared Production Assets
│   ├── css/
│   │   ├── colors.css                # Shared (Identical)
│   │   ├── typography.css            # Shared (Identical)
│   │   ├── liquid-evolution.css      # Variant A CSS
│   │   └── liquid-classic.css        # Variant B CSS
│
├── variants/                         # The Two Philosophies
│   ├── evolution.md                  # Variant A (Future/Brand)
│   └── classic.md                    # Variant B (HIG/Native)
│
└── references/                       # Shared Knowledge Base
    ├── foundations/                  # Accessibility, Spacing, Writing
    ├── patterns/                     # Modals, Forms, Charts
    └── components/                   # Buttons, Inputs, Cards
```

## 3. The "Router" (SKILL.md)
The main `SKILL.md` will serve as the intelligent router. It will detect the user's intent to select the appropriate variant.

**Behavior Logic:**
-   **Default Mode**: `Variant A (Evolution)` - Used when user asks for "Liquid Glass", "Brand UI", or general design. This preserves the project's unique identity.
-   **Strict Mode**: `Variant B (Classic)` - Used when user asks for "Native iOS", "Strict HIG", "Apple-like", or "Standard Glass".

**Skill Prompt Example:**
```markdown
# Liquid Design System

You are the guardian of the Liquid Glass aesthetic. You operate in two modes:

## 1. Liquid Evolution (Default) 🧬
The futuristic, brand-specific evolution of glassmorphism.
- **Characteristics**: Heavy blurs (25px), Deep depth, Organic edges.
- **Load**: `variants/evolution.md`

## 2. Liquid Classic (HIG) 🍎
The strict, native Apple Human Interface Guidelines implementation.
- **Characteristics**: Standard blurs (10px), High legibility, Platform-native feel.
- **Load**: `variants/classic.md`

## Routing
- IF request implies "native", "iOS clone", "standard": USE Classic.
- ELSE: USE Evolution.
```

## 4. Shared vs. Divergent Resources

| Component | Status | Strategy |
| :--- | :--- | :--- |
| **Color System** | ✅ Identical | Single `colors.css` source of truth. |
| **Typography** | ✅ Identical | Single `typography.css` source of truth. |
| **Accessibility**| ✅ Identical | Single `foundations/accessibility.md`. |
| **Motion** | ⚠️ Divergent | Split into `classic-motion.css` and `evolution-motion.css`. |
| **Materials** | ⚠️ Divergent | Two sets of CSS variables (e.g., `--glass-blur-reg` vs `--hig-blur-reg`). |

## 5. Integration Roadmap

### Phase 1: Migration (Refactoring)
1.  **Move**: Transfer `projects/LiquidCrypto/liquid-designer` content into `LiquidSkills/liquid-design`.
2.  **Rename**: Rename existing `SKILL.md` logic to `variants/evolution.md` (and update values to match the 25px source).
3.  **Draft**: Create `variants/classic.md` based on your "Apple HIG Designer" plan.

### Phase 2: Consolidation
4.  **Extract**: Pull commonalities (Color, Type, Accessibility) into `references/foundations/`.
5.  **Asset Generation**: Create the CSS files in `assets/` to match both specs.

### Phase 3: Activation
6.  **Router**: Update root `SKILL.md` to implement the switching logic.
7.  **Test**: Verify that asking for "native design" triggers Classic, while "Liquid UI" triggers Evolution.

## 6. Recommendation
Proceed with **Phase 1 immediately**. This brings the experimental `liquid-designer` work into the official `LiquidSkills` registry without destroying the existing setup, and prepares the ground for the "Strict HIG" implementation.
