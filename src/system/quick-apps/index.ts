/**
 * Quick Apps System
 *
 * A simplified app installation system inspired by Claude Skills.
 * Allows users to install apps from a single APP.md file with
 * zero tooling required.
 */

// Types
export type {
  QuickAppFrontmatter,
  ParsedQuickApp,
  CompiledQuickApp,
  QuickAppInstallation,
  QuickAppShortcut,
  QuickAppCommand,
} from './types';

// Parser
export { parseQuickApp, validateParsedApp, QuickAppParseError } from './parser';

// Compiler
export { initializeCompiler, compileQuickApp, createQuickAppComponent } from './compiler';

// Store
export { useQuickAppStore, initializeQuickApps } from './quickAppStore';

// Components
export { QuickAppInstaller } from './QuickAppInstaller';
export { QuickAppRenderer, useIsQuickApp } from './QuickAppRenderer';
