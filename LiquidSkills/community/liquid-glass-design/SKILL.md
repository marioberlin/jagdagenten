---
name: liquid-glass-design
description: Applies the "Liquid Glass" design system (based on Apple HIG) to any artifact. Use this when the user needs UI designs, visual philosophies, or aesthetic guidance that matches the project's premium glassmorphism look.
license: Private - Internal Use Only
---

# Liquid Glass Design System

## Overview
You are the guardian of the **Liquid Glass** aesthetic. This design system is a strict superset of Apple's Human Interface Guidelines (HIG), enhanced with "Liquid" physics (fluid motion, glass materials).

**Core Philosophy**: "Content is king, glass is the medium."
-   **Light**: Materials react to light sources.
-   **Depth**: Hierarchy is established by blur strength (`backdrop-filter`) and z-index, not shadows alone.
-   **Motion**: Everything must feel fluid, using spring physics `cubic-bezier(0.42, 0.0, 0.58, 1.0)`.

## Critical Rules (The "Don'ts")
1.  **NO Opaque Overlays**: Never use solid backgrounds for floating elements. Use `white/10` or `black/10` with blur.
2.  **NO Generic Shadows**: Avoid default browser shadows. Use colored, diffuse shadows that match the content.
3.  **NO Hardcoded Colors**: absolutely NO hex codes (e.g., `#3b82f6`) in CSS/Tailwind. YOU MUST use Semantic Tokens.
4.  **NO Emojis**: Do NOT use emojis (e.g., 🚀, ✨) unless absolutely necessary. Use `lucide-react` icons instead.

## Design Tokens

### 1. Semantic Colors (Strict)
Map your concepts to these tokens. Do not deviate.

| Concept | Token (Tailwind) | Apple Equivalent |
| :--- | :--- | :--- |
| **Primary Text** | `text-primary` | Label Color |
| **Secondary Text** | `text-secondary` | Secondary Label |
| **Tertiary Text** | `text-tertiary` | Tertiary Label |
| **Glass Surface** | `bg-glass-surface` | Ultra Thin Material |
| **Glass Panel** | `bg-glass-surface-elevated` | Thin/Regular Material |
| **Borders** | `border-[var(--glass-border)]` | Separator Color |
| **Accent** | `text-accent` / `bg-accent` | System Blue (or Theme Color) |

### 2. Materials (Blur)
| Material | Use Case | Blur Value |
| :--- | :--- | :--- |
| **Ultra Thin** | Transient overlays, tooltips | `blur-xl` (2px-5px) |
| **Thin** | Navigation bars, floating headers | `blur-2xl` (6px-10px) |
| **Regular** | Sidebars, main panels | `blur-3xl` (10px-15px) |
| **Thick** | Modals, alerts (high contrast) | `blur-3xl` + High Opacity |

### 3. Typography
-   **Font**: SF Pro (San Francisco).
-   **Weights**:
    -   Headings: **Bold** (700) or **Semibold** (600).
    -   Body on Glass: **Medium** (500) - *Regular (400) is too thin for glass backgrounds.*
    -   Captions: **Medium** (500).

## Technical Implementation Guide

### React / HTML Structure
```tsx
// ❌ BAD (Flat, Opaque)
<div className="bg-white shadow-lg rounded-lg p-4">
  <h1 className="text-black font-bold">Hello</h1>
</div>

// ✅ GOOD (Liquid Glass)
<div className="relative overflow-hidden rounded-3xl border border-[var(--glass-border)]">
  {/* 1. The Glass Layer */}
  <div className="absolute inset-0 bg-glass-surface backdrop-blur-3xl" />
  
  {/* 2. The Content Layer (Relative z-10) */}
  <div className="relative z-10 p-6">
    <h1 className="text-primary font-semibold text-2xl tracking-tight">
      Hello
    </h1>
  </div>
</div>
```

### Motion Guidelines
-   **Press**: Scale down to `0.98` with `duration-100`.
-   **Hover**: brightness `1.1` or `bg-white/5` overlay.
-   **Entrances**: Slide up + Fade in (`y: 20` -> `y: 0`, `opacity: 0` -> `opacity: 1`).

## When to use this skill?
-   When designing **New Components**.
-   When **Refactoring** legacy UI.
-   When asked for **Design Advice** or **Critiques**.
