# Component Interfaces

This document describes the stub UI components included in the iCloud Agent package. These are minimal implementations that you can replace with your own component library.

## Overview

The iCloud Agent imports these components from `@/components`:

```typescript
import {
  GlassContainer,
  GlassButton,
  GlassInput,
  GlassCheckbox,
  GlassCalendar,
  GlassAgent,
  GlassPrompt
} from '@/components';
```

## Replacing Components

To replace a stub with your own implementation:

1. Edit the stub file in `src/components/stubs/`
2. Or re-export your component from `src/components/index.ts`

Example:
```typescript
// src/components/index.ts

// Replace stub with your component
export { MyButton as GlassButton } from './my-components/Button';

// Keep other stubs
export * from './stubs/GlassContainer';
export * from './stubs/GlassInput';
// ...
```

---

## Component Specifications

### GlassContainer

A container with glass-morphism styling.

```typescript
interface GlassContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  material?: 'thin' | 'regular' | 'thick';
}
```

**Usage:**
```tsx
<GlassContainer material="regular" className="p-6">
  <h2>Card Title</h2>
  <p>Card content</p>
</GlassContainer>
```

**Expected Behavior:**
- Renders a `div` with translucent background
- `material` controls blur intensity and opacity
- Supports all standard div props

---

### GlassButton

A styled button with variants and sizes.

```typescript
interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'destructive' | 'outline' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}
```

**Usage:**
```tsx
<GlassButton variant="default" size="md" onClick={handleClick}>
  Click Me
</GlassButton>

<GlassButton variant="destructive" loading={isLoading}>
  Delete
</GlassButton>
```

**Expected Behavior:**
- Renders a `button` element
- Shows loading spinner when `loading={true}`
- Disables button when `loading` or `disabled`
- Different visual styles per variant

---

### GlassInput

A text input with label and error support.

```typescript
interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
```

**Usage:**
```tsx
<GlassInput
  label="Email"
  type="email"
  placeholder="you@example.com"
  error={errors.email}
  leftIcon={<MailIcon />}
/>
```

**Expected Behavior:**
- Renders label above input if provided
- Shows error message below input if provided
- Positions icons inside input field
- Applies error styling when error prop is set

---

### GlassCheckbox

A styled checkbox with label.

```typescript
interface GlassCheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}
```

**Usage:**
```tsx
<GlassCheckbox
  label="Remember me"
  description="Stay logged in for 30 days"
  checked={rememberMe}
  onChange={(e) => setRememberMe(e.target.checked)}
/>
```

**Expected Behavior:**
- Renders hidden native checkbox with custom visual
- Shows label and optional description
- Clicking label toggles checkbox
- Shows checkmark icon when checked

---

### GlassCalendar

A date picker calendar.

```typescript
interface GlassCalendarProps {
  value?: Date;
  onChange?: (date: Date) => void;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
}
```

**Usage:**
```tsx
<GlassCalendar
  value={selectedDate}
  onChange={setSelectedDate}
  minDate={new Date()}
/>
```

**Expected Behavior:**
- Displays month grid with navigation
- Highlights selected date
- Marks today's date
- Respects min/max date constraints
- Calls onChange when date is clicked

---

### GlassAgent

An AI agent visualization orb.

```typescript
type AgentState = 'idle' | 'listening' | 'thinking' | 'replying' | 'error';

interface GlassAgentProps extends React.HTMLAttributes<HTMLDivElement> {
  state?: AgentState;
  size?: 'sm' | 'md' | 'lg';
  material?: 'thin' | 'regular' | 'thick';
  variant?: 'orb' | 'flux';
  label?: string;
}
```

**Usage:**
```tsx
<GlassAgent state="thinking" size="lg" />

<GlassAgent
  state={isListening ? 'listening' : 'idle'}
  label="Ask me anything"
/>
```

**Expected Behavior:**
- Displays animated orb/circle
- Different colors per state:
  - `idle`: Gray
  - `listening`: Blue (pulsing)
  - `thinking`: Purple (pulsing)
  - `replying`: Green (pulsing)
  - `error`: Red
- Shows label text below orb

---

### GlassPrompt

A chat input with send button.

```typescript
interface GlassPromptProps extends React.HTMLAttributes<HTMLDivElement> {
  onSubmit?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  showVoice?: boolean;
  onVoiceToggle?: () => void;
  isListening?: boolean;
}
```

**Usage:**
```tsx
<GlassPrompt
  placeholder="Ask the AI agent..."
  onSubmit={handleMessage}
  loading={isProcessing}
  showVoice
  onVoiceToggle={toggleVoice}
  isListening={isRecording}
/>
```

**Expected Behavior:**
- Auto-expanding textarea
- Submit on Enter (Shift+Enter for newline)
- Send button (disabled when empty or loading)
- Optional voice button with listening state
- Shows loading spinner when processing

---

## Utility Function

### cn (classnames)

Utility for merging Tailwind classes.

```typescript
import { cn } from '@/utils/cn';

// Combines classes and handles conflicts
cn('px-2 py-1', condition && 'bg-blue-500', 'px-4')
// Result: 'py-1 bg-blue-500 px-4' (px-4 overrides px-2)
```

**Implementation:**
```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## Styling Requirements

All components expect these CSS utilities to be available:
- Tailwind CSS classes
- `backdrop-blur-*` for glass effect
- `bg-white/10` style opacity colors

Ensure your Tailwind config includes:
```js
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Add any custom colors/utilities
    },
  },
  plugins: [],
};
```
