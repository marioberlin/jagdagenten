# Contributing to Liquid Glass UI System

Thank you for your interest in contributing to the Liquid Glass UI System! We welcome contributions from the community to help make this project even better.

## 🛠️ Development Setup

1.  **Fork and Clone**: Fork the repository to your GitHub account and clone it locally.
    ```bash
    git clone https://github.com/yourusername/liquid-glass-ui.git
    cd liquid-glass-ui
    ```

2.  **Install Runtime**: We recommend **Bun** for the best experience.
    ```bash
    curl -fsSL https://bun.sh/install | bash
    ```

3.  **Install Dependencies**:
    ```bash
    bun install
    ```

4.  **Start Development Server**:
    ```bash
    ./start.sh
    ```
    This script will launch the Redis cache, Backend (port 3000), and Frontend (port 5173).

## 🏗️ 3-Layer Architecture

Contributions must follow our 3-layer architecture to maintain reliability:
1.  **Layer 1 (Directive)**: Markdown files in `directives/` define "how" to do things.
2.  **Layer 2 (Orchestration)**: AI agents (or you) follow directives to coordinate work.
3.  **Layer 3 (Execution)**: Deterministic TypeScript scripts in `scripts/` handle the heavy lifting.

## 🤖 Agentic Workflows

We use autonomous loops for high-quality feature delivery:
- **Ralph Autonomous Loop**: For implementing complex features atom-by-atom.
- **Code Simplifier Agent**: Mandatory to run after every major feature to prevent code bloat.

Refer to `GEMINI.md` for full operating principles.

## 📏 Code Style & Guidelines

-   **Naming Convention**: All components should use PascalCase and be prefixed with `Glass` (e.g., `GlassButton`, `GlassCard`).
-   **TypeScript**: We use TypeScript for all components. Please ensure your code is strongly typed.
-   **Styling**: Use Tailwind CSS for styling. Custom CSS classes should be minimized.
-   **Testing**: Please add tests for new features or bug fixes. Run tests using `npm run test`.

## 🔄 Pull Request Process

1.  Create a new branch for your feature or bugfix:
    ```bash
    git checkout -b feature/amazing-feature
    ```
2.  Commit your changes with clear, descriptive commit messages.
3.  Push your branch to your fork.
4.  Open a Pull Request against the `main` branch of the original repository.
5.  Fill out the Pull Request template with details about your changes.

## 🐛 Reporting Issues

If you find a bug or have a feature request, please use the [Issue Tracker](https://github.com/yourusername/liquid-glass-ui/issues) and select the appropriate template.

## 📜 Code of Conduct

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.
