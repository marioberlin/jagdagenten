/**
 * App Registry Types (Server-Side)
 *
 * Types for the LiquidOS app marketplace backend.
 * Extends the existing plugin registry with app-specific fields.
 */

// ============================================================================
// App Category & Capability (mirrors client-side types)
// ============================================================================

export type AppCategory =
  | 'productivity'
  | 'communication'
  | 'finance'
  | 'weather'
  | 'travel'
  | 'developer'
  | 'utilities'
  | 'entertainment'
  | 'system';

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

export type WindowMode = 'panel' | 'fullscreen' | 'floating';

// ============================================================================
// App Manifest (Server-side representation)
// ============================================================================

export interface ServerAppManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  longDescription?: string;
  author: string;
  license?: string;
  category: AppCategory;
  keywords: string[];
  icon: string;
  screenshots?: string[];

  window: {
    mode: WindowMode;
    title: string;
    defaultSize?: { width: number; height: number };
    resizable?: boolean;
  };

  integrations: {
    dock?: { enabled: boolean; position?: number };
    menuBar?: { hookPath?: string };
    shortcuts?: { hookPath?: string };
    aiContext?: { systemPrompt?: string; knowledge?: string[]; agentId?: string };
    commandPalette?: { commands?: { id: string; label: string; shortcut?: string; category?: string }[] };
  };

  capabilities: AppCapability[];
  dependencies?: Record<string, string>;
}

// ============================================================================
// App Registry Entry (stored in database)
// ============================================================================

export interface AppRegistryEntry {
  id: string;
  manifest: ServerAppManifest;
  publishedAt: string;
  updatedAt: string;
  publishedBy: string;
  downloads: number;
  rating: number;
  reviewCount: number;
  featured: boolean;
  verified: boolean;
  bundleUrl?: string;
  bundleHash?: string;
  bundleSize?: number;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface PublishAppRequest {
  manifest: ServerAppManifest;
  bundleData?: string; // Base64-encoded bundle
}

export interface AppSearchParams {
  q?: string;
  category?: AppCategory;
  author?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
}

export interface AppListResponse {
  apps: AppRegistryEntry[];
  total: number;
  limit: number;
  offset: number;
}

export interface AppReview {
  id: string;
  appId: string;
  userId: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
}
