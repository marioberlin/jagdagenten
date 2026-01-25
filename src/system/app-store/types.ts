// ============================================================
// App Categories
// ============================================================

export type AppCategory =
  | 'productivity'
  | 'communication'
  | 'finance'
  | 'weather'
  | 'travel'
  | 'developer'
  | 'utilities'
  | 'entertainment'
  | 'system'
  | 'agent';

// ============================================================
// App Capabilities (Permission Model)
// ============================================================

export type AppCapability =
  | 'network:http'
  | 'network:websocket'
  | 'storage:local'
  | 'storage:indexeddb'
  | 'ai:llm'
  | 'ai:agent'
  | 'a2a:connect'
  | 'notification:push'
  | 'notification:toast'
  | 'media:camera'
  | 'media:microphone'
  | 'media:geolocation'
  | 'system:clipboard'
  | 'system:fullscreen';

// ============================================================
// Window Configuration
// ============================================================

export type WindowMode = 'panel' | 'fullscreen' | 'floating';

export interface WindowConfig {
  mode: WindowMode;
  title: string;
  defaultSize?: { width: number; height: number };
  defaultPosition?: { x: number; y: number };
  resizable?: boolean;
  minimizable?: boolean;
}

// ============================================================
// Integration Declarations
// ============================================================

export interface CommandPaletteEntry {
  id: string;
  label: string;
  shortcut?: string;
  category?: string;
}

export interface DockIntegration {
  enabled: boolean;
  position?: number;
  badge?: string; // Store selector path for badge count
}

export interface MenuBarIntegration {
  hookPath?: string; // Relative path to menu bar hook module
}

export interface ShortcutsIntegration {
  hookPath?: string; // Relative path to shortcuts hook module
}

export interface AIContextIntegration {
  systemPrompt?: string;
  knowledge?: string[];
  agentId?: string; // A2A agent binding
}

export interface CommandPaletteIntegration {
  commands?: CommandPaletteEntry[];
}

export interface NotificationsIntegration {
  channels?: string[];
}

export interface AppIntegrations {
  dock?: DockIntegration;
  menuBar?: MenuBarIntegration;
  shortcuts?: ShortcutsIntegration;
  aiContext?: AIContextIntegration;
  commandPalette?: CommandPaletteIntegration;
  notifications?: NotificationsIntegration;
}

// ============================================================
// Remote App Configuration
// ============================================================

export interface RemoteAppConfig {
  sourceUrl: string;       // Registry URL for updates
  integrity?: string;      // SHA-256 hash of bundle
  sandbox?: boolean;       // Run in iframe isolation
}

// ============================================================
// App Manifest (Single Source of Truth)
// ============================================================

export interface AppManifest {
  // Identity
  id: string;
  name: string;
  version: string;
  description: string;
  longDescription?: string;
  author: string;
  license?: string;
  homepage?: string;
  repository?: string;

  // Categorization
  category: AppCategory;
  keywords: string[];
  icon: string; // Lucide icon name OR relative asset path
  screenshots?: string[];

  // Entry Points
  entry: string; // Relative path to App component (e.g., "./App.tsx")
  store?: string; // Relative path to Zustand store module

  // Window Configuration
  window: WindowConfig;

  // Integration Hooks
  integrations: AppIntegrations;

  // Security & Dependencies
  capabilities: AppCapability[];
  dependencies?: Record<string, string>; // Other app IDs -> version ranges
  peerDependencies?: Record<string, string>;

  // Lifecycle
  activationEvents?: string[];
  backgroundServices?: string[];

  // Remote App Config (marketplace apps)
  remote?: RemoteAppConfig;
}

// ============================================================
// Installed App State
// ============================================================

export type AppStatus =
  | 'not-installed'
  | 'installing'
  | 'installed'
  | 'active'
  | 'suspended'
  | 'updating'
  | 'error';

export interface InstalledApp {
  id: string;
  manifest: AppManifest;
  status: AppStatus;
  installedAt: string;
  updatedAt: string;
  version: string;
  dockOrder: number;
  source: 'local' | 'remote';
  error?: string;
}

// ============================================================
// Permission Grants
// ============================================================

export interface PermissionGrant {
  appId: string;
  capability: AppCapability;
  granted: boolean;
  grantedAt?: string;
  revokedAt?: string;
}

// ============================================================
// App Store Catalog
// ============================================================

export interface AppCatalogEntry {
  manifest: AppManifest;
  source: 'local' | 'remote';
  downloads?: number;
  rating?: number;
  reviewCount?: number;
  featured?: boolean;
  verified?: boolean;
  publishedAt?: string;
  updatedAt?: string;
}

// ============================================================
// Icon Resolution
// ============================================================

export interface ResolvedIcon {
  type: 'lucide' | 'asset';
  name?: string; // Lucide icon name
  src?: string;  // Asset URL/path
}
