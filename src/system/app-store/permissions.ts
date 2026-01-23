/**
 * Permission Manager
 *
 * Manages capability-based permissions for apps.
 * Apps declare required capabilities in their manifest;
 * the user grants/denies at install time or on first use.
 */

import type { AppCapability, PermissionGrant } from './types';

// ============================================================================
// Permission Descriptions (for user-facing dialogs)
// ============================================================================

export const CAPABILITY_DESCRIPTIONS: Record<AppCapability, { label: string; description: string; risk: 'low' | 'medium' | 'high' }> = {
  'network:http': {
    label: 'Network Access (HTTP)',
    description: 'Make HTTP requests to external servers',
    risk: 'medium',
  },
  'network:websocket': {
    label: 'WebSocket Connections',
    description: 'Maintain real-time connections to servers',
    risk: 'medium',
  },
  'storage:local': {
    label: 'Local Storage',
    description: 'Store data in browser local storage',
    risk: 'low',
  },
  'storage:indexeddb': {
    label: 'Database Storage',
    description: 'Store structured data in IndexedDB',
    risk: 'low',
  },
  'ai:llm': {
    label: 'AI Language Model',
    description: 'Access AI language model for text generation',
    risk: 'medium',
  },
  'ai:agent': {
    label: 'AI Agent',
    description: 'Run autonomous AI agent tasks',
    risk: 'high',
  },
  'a2a:connect': {
    label: 'Agent-to-Agent',
    description: 'Connect to remote AI agents via A2A protocol',
    risk: 'high',
  },
  'notification:push': {
    label: 'Push Notifications',
    description: 'Send push notifications',
    risk: 'low',
  },
  'notification:toast': {
    label: 'Toast Notifications',
    description: 'Display in-app toast notifications',
    risk: 'low',
  },
  'media:camera': {
    label: 'Camera',
    description: 'Access device camera',
    risk: 'high',
  },
  'media:microphone': {
    label: 'Microphone',
    description: 'Access device microphone',
    risk: 'high',
  },
  'media:geolocation': {
    label: 'Location',
    description: 'Access device location',
    risk: 'high',
  },
  'system:clipboard': {
    label: 'Clipboard',
    description: 'Read from and write to clipboard',
    risk: 'medium',
  },
  'system:fullscreen': {
    label: 'Fullscreen',
    description: 'Enter fullscreen mode',
    risk: 'low',
  },
};

// ============================================================================
// Auto-Granted Capabilities (no user prompt needed)
// ============================================================================

const AUTO_GRANTED: AppCapability[] = [
  'storage:local',
  'storage:indexeddb',
  'notification:toast',
  'system:fullscreen',
];

// ============================================================================
// Permission Manager
// ============================================================================

const STORAGE_KEY = 'liquid-os-permissions';

class PermissionManagerImpl {
  private grants: Map<string, PermissionGrant[]> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  // ── Persistence ──────────────────────────────────────────────

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: Record<string, PermissionGrant[]> = JSON.parse(stored);
        this.grants = new Map(Object.entries(data));
      }
    } catch (e) {
      console.warn('[PermissionManager] Failed to load permissions:', e);
    }
  }

  private saveToStorage(): void {
    try {
      const data: Record<string, PermissionGrant[]> = {};
      for (const [key, value] of this.grants.entries()) {
        data[key] = value;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('[PermissionManager] Failed to save permissions:', e);
    }
  }

  // ── Permission Checks ────────────────────────────────────────

  /**
   * Check if an app has a specific capability granted.
   */
  hasPermission(appId: string, capability: AppCapability): boolean {
    // Auto-granted capabilities don't need explicit permission
    if (AUTO_GRANTED.includes(capability)) return true;

    const appGrants = this.grants.get(appId) || [];
    return appGrants.some(g => g.capability === capability && g.granted);
  }

  /**
   * Check which capabilities still need user approval.
   */
  getRequiredPermissions(appId: string, capabilities: AppCapability[]): AppCapability[] {
    return capabilities.filter(cap => !this.hasPermission(appId, cap));
  }

  /**
   * Check if all required capabilities are granted.
   */
  hasAllPermissions(appId: string, capabilities: AppCapability[]): boolean {
    return capabilities.every(cap => this.hasPermission(appId, cap));
  }

  // ── Grant/Revoke ─────────────────────────────────────────────

  /**
   * Grant a capability to an app.
   */
  grant(appId: string, capability: AppCapability): void {
    const grants = this.grants.get(appId) || [];
    const existing = grants.find(g => g.capability === capability);

    if (existing) {
      existing.granted = true;
      existing.grantedAt = new Date().toISOString();
      existing.revokedAt = undefined;
    } else {
      grants.push({
        appId,
        capability,
        granted: true,
        grantedAt: new Date().toISOString(),
      });
    }

    this.grants.set(appId, grants);
    this.saveToStorage();
  }

  /**
   * Grant multiple capabilities at once (e.g., after install dialog).
   */
  grantAll(appId: string, capabilities: AppCapability[]): void {
    for (const cap of capabilities) {
      this.grant(appId, cap);
    }
  }

  /**
   * Revoke a capability from an app.
   */
  revoke(appId: string, capability: AppCapability): void {
    const grants = this.grants.get(appId) || [];
    const existing = grants.find(g => g.capability === capability);

    if (existing) {
      existing.granted = false;
      existing.revokedAt = new Date().toISOString();
    }

    this.grants.set(appId, grants);
    this.saveToStorage();
  }

  /**
   * Get all grants for an app.
   */
  getAppGrants(appId: string): PermissionGrant[] {
    return this.grants.get(appId) || [];
  }

  /**
   * Remove all grants for an app (used during uninstall).
   */
  clearAppPermissions(appId: string): void {
    this.grants.delete(appId);
    this.saveToStorage();
  }

  /**
   * Reset all permissions.
   */
  clearAll(): void {
    this.grants.clear();
    this.saveToStorage();
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const PermissionManager = new PermissionManagerImpl();
