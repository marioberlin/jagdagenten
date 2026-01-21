---
name: liquid-design
description: Guidelines and component index for the Liquid Glass Design System. Use this when the user asks to build UI, components, or screens for the LiquidCrypto project.
---

# Liquid Design System Skill

This skill ensures all UI generated for LiquidCrypto follows the **Liquid Glass** aesthetic: a premium, high-performance, glassmorphic design system.

---

### Technical Constants & Tokens
> [!IMPORTANT]
> While these values define the "Liquid Glass Foundation", they MUST be consumed via `ThemeContext` or CSS variables (e.g., `var(--glass-blur-regular)`) to support per-theme customization in the Settings panel.

#### Spacing System (Apple 4pt Grid)
The system uses a **4px base unit** (standard increments of 16pt, 44pt, and 60pt).
- **Narrow**: 16pt (Component internal padding)
- **Standard**: 44pt (Navigation heights, touch targets)
- **Wide**: 60pt (Section spacing, page margins)

### 2. Glass Materials & Interaction Modes
The system supports two distinct interaction modes via the Settings Theme Engine:

#### Mode A: "Liquid Evolution" (Default / Brand)
*   **Theme ID**: `marketing-evolution`
*   **Aesthetic**: Futuristic, heavy blurs (25px+), lower opacity, high saturation.
*   **Use Case**: Marketing pages, hero sections, high-impact branding.
*   **Key Specs**:
    *   Blur: ~25px (mapped to `thick` variant + high intensity)
    *   Opacity: 0.60
    *   Radius: 32px
    *   Saturation: 120% (Vibrant)

#### Mode C: "Liquid Web" (Desktop First)
*   **Theme ID**: `liquid-web`
*   **Aesthetic**: Optimized for 6K displays, larger radii, refined web physics.
*   **Use Case**: Large-scale web applications, data visualization.
*   **Key Specs**:
    *   Blur: 10px (Standard)
    *   Opacity: 0.40
    *   Radius: 32px (2rem)
    *   Saturation: 180% (Vivid)

| Material | Blur Class | Variant A (Evolution) | Variant B (HIG) | Variant C (Web) |
| :--- | :--- | :--- | :--- | :--- |
| **ultraThin** | `bg-glass-thin` | 15px Blur | 6px Blur | 6px Blur |
| **regular** | `bg-glass-regular` | 25px Blur | 10px Blur | 10px Blur |
| **thick** | `bg-glass-thick` | 40px Blur | 18px Blur | 18px Blur |

#### Visual Rules:
- **Regular Variant (Standard)**: 10px blur, 0.40 opacity. This is the baseline for all generated UI.
- **Clear Variant**: 10px blur, 0.15 opacity. REQUIRES a 35% dark dimming layer behind it on bright backgrounds.
- **Borders**: 1px solid `rgba(255, 255, 255, 0.2)` (light) / `rgba(255, 255, 255, 0.3)` (dark).
- **Shadows**: `0 8px 32px rgba(0,0,0,0.1)`.

### 3. Typography
Uses **San Francisco Pro** (Display/UI) and **New York** (Editorial/Emphasis).
- **Large Title**: 34px / 700 weight
- **Headline**: 17px / 600 weight
- **Body**: 17px / 400 weight

### 4. Color System (Dynamic Mode)
Exact Apple System Colors (Hex):
- **Blue**: `#007AFF` (Light) / `#0A84FF` (Dark)
- **Green**: `#34C759` (Light) / `#30D158` (Dark)
- **Red**: `#FF3B30` (Light) / `#FF453A` (Dark)
- **Orange**: `#FF9500` (Light) / `#FF9F0A` (Dark)
- **Yellow**: `#FFCC00` (Light) / `#FFD60A` (Dark)

### 5. Animation & Motion (Liquid Web Physics)
Use these mappings when converting CSS springs to Framer Motion:

| Variable | CSS Curve (Bezier) | Framer Motion (Spring) |
| :--- | :--- | :--- |
| **Simple Ease** | `(0.42, 0, 0.58, 1)` | `{ type: "tween", ease: [0.42, 0, 0.58, 1], duration: 0.4 }` |
| **Spring Light** | `(0.5, 1.5, 0.5, 1)` | `{ type: "spring", stiffness: 100, damping: 15, mass: 1 }` |
| **Spring Heavy** | `(0.5, 1.2, 0.5, 1)` | `{ type: "spring", stiffness: 80, damping: 20, mass: 1.2 }` |
| **Modal Scale** | `(0.32, 0.72, 0, 1)` | `{ type: "spring", stiffness: 300, damping: 30 }` |

---

## 🏠 Materials & Layers
1. **Control Layer (Liquid Glass)**: Used for all transient UI, navigation, and controls. Floating above content.
2. **Content Layer (Opaque)**: Use solid backgrounds (`--bg-primary`) for long-form reading and data-heavy tables.
3. **NEVER** stack multiple glass layers.

---

## 🎨 Advanced Generative Patterns
For building complex AI-powered UI like Dashboards or Kanban boards, refer to:
[GENERATIVE.md](file:///Users/mario/projects/LiquidCrypto/LiquidSkills/liquid-design/GENERATIVE.md)

---

## 🛠️ Operational Tools
*   `bun LiquidSkills/liquid-design/tools/bun/scaffold.ts`: Create a new component following project standards.
*   `bun LiquidSkills/liquid-design/tools/bun/audit.ts`: Run a Design Audit on existing code.
*   `node LiquidSkills/liquid-design/tools/validate-colors.js`: check Color Contrast against HIG/WCAG standards.
