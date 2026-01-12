# Implementation Plan: Glass Design Alignment

Refactoring `Glass` components to strictly adhere to the Liquid Glass Design System defined in `SKILL.md`.

## User Review Required

> [!IMPORTANT]
> **Visual Changes**: Charts will shift from generic Tailwind colors (e.g., `blue-400`) to specific Apple System Colors (`#0A84FF` in Dark Mode). This improves brand consistency but changes the current look.

## Proposed Changes

### Phase 1: Design Tokens
Create a centralized source of truth for design constants to prevent future hardcoding.

#### [NEW] [design-tokens.ts](file:///Users/mario/projects/LiquidCrypto/src/styles/design-tokens.ts)
- Define `APPLE_SYSTEM_COLORS` (Light/Dark variants).
- Define `GLASS_CONSTANTS` (Blur, Opacity mappings).
- Export helper hooks/constants for usage in React components.

### Phase 2: Chart Refactor
Systematically update chart components to consume these tokens.

#### [MODIFY] [GlassChart.tsx](file:///Users/mario/projects/LiquidCrypto/src/components/data-display/GlassChart.tsx)
- **Colors**: Remove `color='#60a5fa'` default. Use `THEME_COLORS.system.blue`.
- **Typography**: Replace `<text fontSize="11" fontFamily="monospace">` with system-aligned classes or constants.
- **Layers**: Replace `bg-black/80` tooltip with `GlassContainer (material="thick")`.

#### [MODIFY] [GlassCandlestickChart.tsx](file:///Users/mario/projects/LiquidCrypto/src/components/data-display/GlassCandlestickChart.tsx)
- **Colors**: Use System Green/Red for candles.
- **Tooltips**: Implement `GlassTooltip` pattern.

#### [MODIFY] [GlassDonutChart.tsx](file:///Users/mario/projects/LiquidCrypto/src/components/data-display/GlassDonutChart.tsx)
- **Palette**: Use the ordered System Color palette (Blue -> Green -> Orange -> Pink) instead of random Tailwind colors.

### Phase 3: Tooling
#### [MODIFY] [audit.ts](file:///Users/mario/projects/LiquidCrypto/LiquidSkills/liquid-design/tools/bun/audit.ts)
- Add regex checks for forbidden hardcoded values (`#60a5fa`, `text-[10px]`).

## Verification Plan

### Automated Audit
Run the enhanced audit tool to catch missed hardcoded values.
```bash
bun LiquidSkills/liquid-design/tools/bun/audit.ts
```

### Visual Verification
1.  Navigate to **Storybook** (or start if not running).
2.  Inspect `GlassChart`, `GlassCandlestick`, and `GlassDonut`.
3.  **Check**:
    - Colors match the vibrant System Colors (not washed out default Tailwind).
    - Tooltips have the "thick glass" material effect.
    - Typography is legible and follows the system hierarchy.
