/**
 * Quick Apps Type Definitions
 *
 * Types for the simplified Quick App system that allows
 * single-file APP.md apps to be installed with zero tooling.
 */

import type { AppCategory, AppCapability, WindowMode } from '../app-store/types';

// ============================================================
// APP.md Frontmatter Schema
// ============================================================

export interface QuickAppFrontmatter {
  // Required
  name: string;
  icon: string; // Lucide icon name, emoji, or URL

  // Optional with smart defaults
  category?: AppCategory;
  tags?: string[];
  version?: string;
  author?: string;
  license?: string;

  // Window configuration
  window?: WindowMode | QuickAppWindowConfig;
  size?: [number, number]; // [width, height]
  resizable?: boolean;

  // Dock integration
  dock?: boolean | number; // true = add to dock, number = position
  badge?: string; // State variable name to show as badge

  // AI integration
  ai?: {
    prompt?: string;
    agent?: string; // A2A agent ID
  };

  // Explicit capability override (usually inferred)
  capabilities?: AppCapability[];
}

export interface QuickAppWindowConfig {
  mode: WindowMode;
  title?: string;
  size?: [number, number];
  resizable?: boolean;
}

// ============================================================
// Parsed Quick App Structure
// ============================================================

export interface ParsedQuickApp {
  // Identity
  id: string; // Generated from name (kebab-case)
  frontmatter: QuickAppFrontmatter;
  description: string; // First paragraph of markdown

  // Code blocks
  appCode: string; // Main React component (```tsx App)
  helpersCode?: string; // Helper functions (```tsx helpers)
  storeCode?: string; // Zustand store (```tsx store)
  settingsCode?: string; // Settings component (```tsx settings)
  stylesCode?: string; // Custom CSS (```css)

  // Parsed integrations
  shortcuts?: QuickAppShortcut[];
  commands?: QuickAppCommand[];

  // Inferred capabilities
  inferredCapabilities: AppCapability[];

  // Source
  rawMarkdown: string;
  sourceUrl?: string;
}

export interface QuickAppShortcut {
  key: string;
  action: string;
}

export interface QuickAppCommand {
  command: string;
  description: string;
}

// ============================================================
// Compiled Quick App
// ============================================================

export interface CompiledQuickApp {
  parsed: ParsedQuickApp;

  // Compiled JavaScript (from TypeScript)
  compiledCode: string;
  sourceMap?: string;

  // Generated manifest (for app store integration)
  manifest: import('../app-store/types').AppManifest;

  // Compilation metadata
  compiledAt: string;
  compilerVersion: string;
  warnings: string[];
  errors: string[];
}

// ============================================================
// Quick App Store State
// ============================================================

export interface QuickAppInstallation {
  id: string;
  compiled: CompiledQuickApp;
  installedAt: string;
  updatedAt: string;
  source: 'file' | 'url' | 'paste';
  sourceLocation?: string; // File path or URL
}

// ============================================================
// Capability Inference Patterns
// ============================================================

export const CAPABILITY_PATTERNS: Record<AppCapability, RegExp[]> = {
  'storage:local': [
    /useStorage\s*\(/,
    /localStorage\./,
    /sessionStorage\./,
  ],
  'storage:indexeddb': [
    /indexedDB\./,
    /openDatabase\(/,
    /useIndexedDB\(/,
  ],
  'network:http': [
    /fetch\s*\(/,
    /useQuery\s*\(/,
    /useMutation\s*\(/,
    /axios\./,
    /XMLHttpRequest/,
  ],
  'network:websocket': [
    /WebSocket\s*\(/,
    /useWebSocket\s*\(/,
    /socket\.io/i,
  ],
  'notification:toast': [
    /useNotification\s*\(/,
    /toast\s*\(/,
    /notify\s*\(/,
  ],
  'notification:push': [
    /Notification\./,
    /pushManager/,
  ],
  'ai:llm': [
    /useLLM\s*\(/,
    /useCompletion\s*\(/,
    /useChat\s*\(/,
  ],
  'ai:agent': [
    /useAgent\s*\(/,
    /useA2A\s*\(/,
    /connectAgent\s*\(/,
  ],
  'a2a:connect': [
    /useA2A\s*\(/,
    /a2aClient\./,
  ],
  'media:camera': [
    /useCamera\s*\(/,
    /getUserMedia.*video/,
    /navigator\.mediaDevices/,
  ],
  'media:microphone': [
    /useMicrophone\s*\(/,
    /getUserMedia.*audio/,
    /MediaRecorder/,
  ],
  'media:geolocation': [
    /useGeolocation\s*\(/,
    /navigator\.geolocation/,
    /getCurrentPosition/,
  ],
  'system:clipboard': [
    /useClipboard\s*\(/,
    /navigator\.clipboard/,
    /execCommand.*copy/i,
  ],
  'system:fullscreen': [
    /requestFullscreen/,
    /useFullscreen\s*\(/,
  ],
};

// ============================================================
// Default Values
// ============================================================

export const QUICK_APP_DEFAULTS = {
  category: 'utilities' as AppCategory,
  window: 'floating' as WindowMode,
  size: [400, 300] as [number, number],
  resizable: true,
  version: '0.1.0',
  author: 'Quick App User',
} as const;
