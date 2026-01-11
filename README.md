# Liquid Glass UI System

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-0.1.0-green.svg)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)

**Liquid Glass UI System** is a comprehensive React component library implementing Apple's conceptual Liquid Glass design language. It combines modern glassmorphism aesthetics with advanced agentic AI capabilities to create a premium, next-generation user interface system.

## ✨ Key Features

- **💎 162+ Components**: A complete suite of professionally designed components ranging from basic primitives to complex features.
- **🌗 Theme Awareness**: Built-in support for light and dark modes with semantic color tokens.
- **🤖 Liquid Engine**: Integrated AI capabilities powered by Google Generative AI and Anthropic Claude.
- **⚡ Bun Native**: High-performance backend using Bun and Elysia for 5x faster startup times.
- **🧬 Agentic Lifecycle**: Includes built-in autonomous loops (Ralph) for automated development and simplification.

## 🚀 Quick Start

### Installation

```bash
# We recommend using Bun for maximum performance
bun install liquid-glass-ui
```

### Basic Usage

Import components directly from the library:

```tsx
import { GlassButton, GlassCard } from 'liquid-glass-ui';

function App() {
  return (
    <GlassCard className="p-6">
      <h1 className="text-2xl font-bold mb-4">Welcome to Liquid Glass</h1>
      <GlassButton variant="primary" onClick={() => console.log('Clicked!')}>
        Get Started
      </GlassButton>
    </GlassCard>
  );
}
```

## 🎨 Design System

Liquid Glass UI is built on a comprehensive design token system that ensures consistency and maintainability across all components.

### Design Tokens

Our design system uses CSS custom properties for typography, spacing, colors, and more. This enables:
- **Consistent theming** across light and dark modes
- **Easy customization** without touching component code
- **Type-safe** integration with Tailwind CSS

See the complete [Design Tokens Documentation](docs/DESIGN_TOKENS.md) for detailed usage and migration guides.

### Foundation Components

#### `GlassButtonGroup`

Compose buttons with consistent spacing and visual connection:

```tsx
import { GlassButtonGroup, GlassButton } from 'liquid-glass-ui';

<GlassButtonGroup variant="attached">
  <GlassButton variant="outline">Cancel</GlassButton>
  <GlassButton variant="primary">Save</GlassButton>
</GlassButtonGroup>
```

#### `GlassForm` System
 
Build accessible forms with validation using our structured composition pattern:
 
```tsx
import { GlassForm, GlassFormField, GlassFormItem, GlassFormLabel, GlassFormControl, GlassInput, GlassFormDescription, GlassFormMessage } from 'liquid-glass-ui';
 
<GlassForm {...form}>
  <GlassFormField
    control={form.control}
    name="email"
    render={({ field }) => (
      <GlassFormItem>
        <GlassFormLabel>Email</GlassFormLabel>
        <GlassFormControl>
          <GlassInput placeholder="mario@example.com" {...field} />
        </GlassFormControl>
        <GlassFormDescription>We'll never share your email.</GlassFormDescription>
        <GlassFormMessage />
      </GlassFormItem>
    )}
  />
</GlassForm>
```



## 📚 Documentation

Detailed documentation for all components and features can be found in the `/docs` directory or by running the showcase application:

```bash
./start.sh
```

## 🛠️ Development

To set up the project locally for development:

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/liquid-glass-ui.git
    ```

2.  **Install dependencies**
    ```bash
    bun install
    ```

3.  **Start the environment (Backend + Frontend)**
    ```bash
    ./start.sh
    ```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to submit pull requests, report issues, and contribute to the project.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
