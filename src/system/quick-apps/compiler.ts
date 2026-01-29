/**
 * Quick App Compiler
 *
 * Compiles Quick App TypeScript/JSX code to JavaScript using esbuild-wasm.
 * Runs entirely in the browser with no build server required.
 */

import React from 'react';
// Dynamic import to avoid Vite resolution issues at build time
// import * as esbuild from 'esbuild-wasm';
import * as LucideReact from 'lucide-react';
import type { ParsedQuickApp, CompiledQuickApp } from './types';
import type { AppManifest, WindowConfig, AppIntegrations } from '../app-store/types';

// ============================================================
// Compiler Initialization
// ============================================================

let esbuildInitialized = false;
let initPromise: Promise<void> | null = null;
let initError: Error | null = null;
let esbuild: typeof import('esbuild-wasm') | null = null;

export async function initializeCompiler(): Promise<void> {
  if (esbuildInitialized) return;
  if (initError) throw initError;
  if (initPromise) return initPromise;

  // Match the version in package.json
  const ESBUILD_VERSION = '0.27.2';

  initPromise = (async () => {
    try {
      // Load esbuild-wasm from CDN as a script to avoid Vite bundling issues
      // The script sets globalThis.esbuild
      const scriptUrl = `https://unpkg.com/esbuild-wasm@${ESBUILD_VERSION}/lib/browser.min.js`;

      // Check if already loaded
      if (!(globalThis as any).esbuild) {
        console.log('[Quick Apps] Loading esbuild from CDN:', scriptUrl);

        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = scriptUrl;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load esbuild script from CDN'));
          document.head.appendChild(script);
        });
      }

      // Get esbuild from global
      esbuild = (globalThis as any).esbuild;

      if (!esbuild || typeof esbuild.initialize !== 'function') {
        throw new Error('esbuild not available after script load');
      }

      // Initialize with WASM from CDN
      const wasmURL = `https://unpkg.com/esbuild-wasm@${ESBUILD_VERSION}/esbuild.wasm`;

      console.log('[Quick Apps] Initializing esbuild with WASM from:', wasmURL);

      await esbuild.initialize({
        wasmURL,
        worker: false, // Run in main thread to avoid worker complexity
      });

      esbuildInitialized = true;
      console.log('[Quick Apps] esbuild initialized successfully');
    } catch (err) {
      console.error('[Quick Apps] Failed to initialize esbuild:', err);
      initError = err as Error;
      throw err;
    }
  })();

  return initPromise;
}



// ============================================================
// Runtime Shims (Injected into compiled code)
// ============================================================

const RUNTIME_SHIMS = `
// Quick App Runtime Shims
// These are injected at the top of every Quick App
// Note: React and hooks are provided via global scope by the runtime

const { useState, useEffect, useCallback, useMemo, useRef, useContext, createContext } = React;

// Storage Hook
export function useStorage(key, defaultValue) {
  const storageKey = \`quick-app:\${__QUICK_APP_ID__}:\${key}\`;
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored !== null ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setStoredValue = useCallback((newValue) => {
    setValue(prev => {
      const nextValue = typeof newValue === 'function' ? newValue(prev) : newValue;
      try {
        localStorage.setItem(storageKey, JSON.stringify(nextValue));
      } catch (e) {
        console.warn('Failed to persist to localStorage:', e);
      }
      return nextValue;
    });
  }, [storageKey]);

  return [value, setStoredValue];
}

// Notification Hook
export function useNotification() {
  const notify = useCallback((message, options = {}) => {
    // Use LiquidOS toast system if available, fallback to console
    if (window.__LIQUID_TOAST__) {
      window.__LIQUID_TOAST__.show({
        title: options.title || 'Notification',
        description: message,
        variant: options.variant || 'default',
      });
    } else {
      console.log('[Quick App Notification]', message);
    }
  }, []);

  const clearAll = useCallback(() => {
    if (window.__LIQUID_TOAST__) {
      window.__LIQUID_TOAST__.clearAll();
    }
  }, []);

  return { notify, clearAll };
}

// Theme Hook
export function useTheme() {
  const [theme, setTheme] = useState(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return { theme, setTheme };
}

// Clipboard Hook
export function useClipboard() {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch {
      return false;
    }
  }, []);

  const paste = useCallback(async () => {
    try {
      return await navigator.clipboard.readText();
    } catch {
      return null;
    }
  }, []);

  return { copy, paste, copied };
}

// Utility: className merger
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Utility: Format time
export function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return \`\${h}:\${String(m).padStart(2, '0')}:\${String(s).padStart(2, '0')}\`;
  }
  return \`\${m}:\${String(s).padStart(2, '0')}\`;
}

// Utility: Format number
export function formatNumber(num, options = {}) {
  return new Intl.NumberFormat(undefined, options).format(num);
}

// Re-export React hooks for convenience
export { useState, useEffect, useCallback, useMemo, useRef, useContext, createContext };
`;

// ============================================================
// Code Transformation
// ============================================================

/**
 * Strip import statements that we provide globally.
 * This includes lucide-react icons which are available in scope.
 */
function stripProvidedImports(code: string): string {
  // Remove lucide-react imports (we provide these globally)
  // Match: import { Icon1, Icon2 } from 'lucide-react'
  // Match: import { Icon1, Icon2 } from "lucide-react"
  return code.replace(
    /import\s*\{[^}]*\}\s*from\s*['"]lucide-react['"]\s*;?\n?/g,
    '// lucide-react icons provided by runtime\n'
  );
}

function wrapAppCode(parsed: ParsedQuickApp): string {
  const parts: string[] = [];

  // Add app ID constant
  parts.push(`const __QUICK_APP_ID__ = "${parsed.id}";`);

  // Add runtime shims
  parts.push(RUNTIME_SHIMS);

  // Add helpers if present (strip provided imports)
  if (parsed.helpersCode) {
    parts.push('\n// === Helpers ===');
    parts.push(stripProvidedImports(parsed.helpersCode));
  }

  // Add store if present (strip provided imports)
  if (parsed.storeCode) {
    parts.push('\n// === Store ===');
    parts.push(stripProvidedImports(parsed.storeCode));
  }

  // Add main app code (strip provided imports)
  parts.push('\n// === Main App ===');
  parts.push(stripProvidedImports(parsed.appCode));

  // Add settings if present (strip provided imports)
  if (parsed.settingsCode) {
    parts.push('\n// === Settings ===');
    parts.push(stripProvidedImports(parsed.settingsCode));
  }

  return parts.join('\n');
}

// ============================================================
// Compilation
// ============================================================

export async function compileQuickApp(parsed: ParsedQuickApp): Promise<CompiledQuickApp> {
  await initializeCompiler();

  if (!esbuild) {
    throw new Error('esbuild-wasm failed to load. Quick Apps cannot compile.');
  }

  const warnings: string[] = [];
  const errors: string[] = [];

  // Wrap the app code with runtime shims
  const wrappedCode = wrapAppCode(parsed);

  try {
    // Compile with esbuild using classic JSX transform and IIFE format
    // We use IIFE so the code can be evaluated with dependencies in scope
    // The code expects: React, LucideReact as globals
    const result = await esbuild.transform(wrappedCode, {
      loader: 'tsx',
      format: 'iife',
      globalName: '__QUICK_APP_MODULE__',
      target: 'es2020',
      jsx: 'transform', // Classic transform: JSX -> React.createElement
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',
      sourcemap: false, // Disable for simpler debugging
      minify: false, // Keep readable for debugging
      define: {
        'process.env.NODE_ENV': '"production"',
      },
    });

    // Collect warnings
    for (const warning of result.warnings) {
      warnings.push(`${warning.location?.line}:${warning.location?.column} - ${warning.text}`);
    }

    // Generate manifest
    const manifest = generateManifest(parsed);

    return {
      parsed,
      compiledCode: result.code,
      sourceMap: undefined, // Inline in code
      manifest,
      compiledAt: new Date().toISOString(),
      compilerVersion: '1.0.0',
      warnings,
      errors,
    };
  } catch (err) {
    const error = err as Error;
    errors.push(error.message);

    // Return partial result with errors
    return {
      parsed,
      compiledCode: '',
      manifest: generateManifest(parsed),
      compiledAt: new Date().toISOString(),
      compilerVersion: '1.0.0',
      warnings,
      errors,
    };
  }
}

// ============================================================
// Manifest Generation
// ============================================================

function generateManifest(parsed: ParsedQuickApp): AppManifest {
  const { frontmatter, id, description, inferredCapabilities, shortcuts, commands } = parsed;

  // Parse window config
  let windowConfig: WindowConfig;
  if (typeof frontmatter.window === 'string') {
    windowConfig = {
      mode: frontmatter.window,
      title: frontmatter.name,
      defaultSize: frontmatter.size
        ? { width: frontmatter.size[0], height: frontmatter.size[1] }
        : { width: 400, height: 300 },
      resizable: frontmatter.resizable ?? true,
    };
  } else if (frontmatter.window) {
    windowConfig = {
      mode: frontmatter.window.mode,
      title: frontmatter.window.title || frontmatter.name,
      defaultSize: frontmatter.window.size
        ? { width: frontmatter.window.size[0], height: frontmatter.window.size[1] }
        : frontmatter.size
          ? { width: frontmatter.size[0], height: frontmatter.size[1] }
          : { width: 400, height: 300 },
      resizable: frontmatter.window.resizable ?? frontmatter.resizable ?? true,
    };
  } else {
    windowConfig = {
      mode: 'floating',
      title: frontmatter.name,
      defaultSize: frontmatter.size
        ? { width: frontmatter.size[0], height: frontmatter.size[1] }
        : { width: 400, height: 300 },
      resizable: frontmatter.resizable ?? true,
    };
  }

  // Build integrations
  const integrations: AppIntegrations = {
    dock: {
      enabled: frontmatter.dock === true || typeof frontmatter.dock === 'number',
      position: typeof frontmatter.dock === 'number' ? frontmatter.dock : undefined,
      badge: frontmatter.badge,
    },
    aiContext: frontmatter.ai
      ? {
        systemPrompt: frontmatter.ai.prompt,
        agentId: frontmatter.ai.agent,
      }
      : undefined,
    commandPalette: commands && commands.length > 0
      ? {
        commands: commands.map((cmd, i) => ({
          id: `${id}-cmd-${i}`,
          label: cmd.command,
          category: frontmatter.name,
        })),
      }
      : undefined,
    shortcuts: shortcuts && shortcuts.length > 0
      ? { hookPath: '__quick_app_shortcuts__' }
      : undefined,
  };

  // Combine inferred and explicit capabilities
  const capabilities = [
    ...new Set([
      ...inferredCapabilities,
      ...(frontmatter.capabilities || []),
    ]),
  ];

  return {
    id,
    name: frontmatter.name,
    version: frontmatter.version || '0.1.0',
    description,
    author: frontmatter.author || 'Quick App User',
    license: frontmatter.license,
    category: frontmatter.category || 'utilities',
    keywords: frontmatter.tags || [],
    icon: frontmatter.icon,
    entry: '__quick_app__', // Special marker for Quick Apps
    window: windowConfig,
    integrations,
    capabilities,
  };
}

// ============================================================
// Component Factory
// ============================================================

/**
 * Creates a React component from compiled Quick App code.
 * Uses Function constructor to evaluate IIFE code with dependencies in scope.
 */
export async function createQuickAppComponent(
  compiled: CompiledQuickApp
): Promise<React.ComponentType> {
  if (compiled.errors.length > 0) {
    // Return error component
    return function QuickAppError() {
      return React.createElement('div', {
        className: 'p-4 bg-red-500/20 text-red-400 rounded-lg',
      }, [
        React.createElement('h3', { key: 'title', className: 'font-bold' }, 'Quick App Error'),
        React.createElement('pre', {
          key: 'errors',
          className: 'mt-2 text-sm whitespace-pre-wrap',
        }, compiled.errors.join('\n')),
      ]);
    };
  }

  try {
    // Execute the IIFE code with React and LucideReact in scope
    // The compiled code sets window.__QUICK_APP_MODULE__ with the exports
    const executeCode = new Function(
      'React',
      'LucideReact',
      `
      // Destructure all Lucide icons for convenience - they're all available on LucideReact
      const { Plus, Minus, RotateCcw, Play, Pause, Square, Settings, X, Check, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Search, Menu, Home, User, Heart, Star, Trash, Edit, Copy, Download, Upload, Share, Mail, Phone, Calendar, Clock, MapPin, Image, File, Folder, Lock, Unlock, Eye, EyeOff, Bell, Volume2, VolumeX, Wifi, Battery, Sun, Moon, Cloud, Zap, Hash, Tag, Filter, Grid, List, MoreHorizontal, MoreVertical, RefreshCw, ExternalLink, Link, Bookmark, Flag, AlertCircle, Info, HelpCircle, CheckCircle, XCircle, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Send, MessageSquare, ThumbsUp, ThumbsDown, Music, Navigation, Car, Thermometer, Smartphone, Fuel, Route, Mic, SkipBack, SkipForward, Radio, Power, Gauge, Compass, Map, Globe, Headphones, Speaker, Tv, Monitor, Camera, Video, Layers, Box, Package, ShoppingCart, CreditCard, DollarSign, TrendingUp, TrendingDown, BarChart, PieChart, Activity, Loader2, RotateCw, Trash2, Edit2, Save, FileText, FolderOpen, Archive, Inbox, Paperclip, AtSign, Terminal, Code, Database, Server, HardDrive, Cpu, Tablet, Watch, Airplay, Bluetooth, Cast, Rss, Maximize, Minimize, Maximize2, Minimize2, ZoomIn, ZoomOut, Move, Crosshair, Target, Award, Gift, Percent, Scissors, Brush, Palette, Droplet, Feather, PenTool, Aperture, Film, Music2, Music3, Music4, Volume, Volume1, VolumeOff, Voicemail, PhoneCall, PhoneForwarded, PhoneIncoming, PhoneMissed, PhoneOff, PhoneOutgoing, VideoOff, MicOff, Headset, Podcast, PlayCircle, PauseCircle, StopCircle, Rewind, FastForward, Repeat, Repeat1, Shuffle, ListMusic, ListPlus, ListMinus, ListOrdered, ListChecks, LayoutGrid, LayoutList, LayoutDashboard, SlidersHorizontal, SlidersVertical, ToggleLeft, ToggleRight, CircleDot, Circle, Disc, Disc2, Disc3, Album, Antenna, Satellite, Navigation2, MapPinned, Locate, LocateFixed, LocateOff, Signpost, Milestone } = LucideReact;

      ${compiled.compiledCode}

      return typeof __QUICK_APP_MODULE__ !== 'undefined' ? __QUICK_APP_MODULE__ : {};
      `
    );

    const moduleExports = executeCode(React, LucideReact);

    // Return the default export (the App component)
    if (moduleExports.default) {
      return moduleExports.default;
    }

    // Fallback: look for an App export
    if (moduleExports.App) {
      return moduleExports.App;
    }

    throw new Error('No default export or App component found in Quick App');
  } catch (err) {
    const error = err as Error;
    console.error('Failed to create Quick App component:', error);

    // Return error component
    return function QuickAppLoadError() {
      return React.createElement('div', {
        className: 'p-4 bg-red-500/20 text-red-400 rounded-lg',
      }, [
        React.createElement('h3', { key: 'title', className: 'font-bold' }, 'Failed to Load Quick App'),
        React.createElement('p', { key: 'message', className: 'mt-2' }, error.message),
      ]);
    };
  }
}
