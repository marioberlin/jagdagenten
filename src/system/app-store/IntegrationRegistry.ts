/**
 * Integration Registry
 *
 * Manages the runtime registration and cleanup of app integration points:
 * - AI Context (system prompts, knowledge bases)
 * - Command Palette entries
 * - Notification channels
 *
 * Menu bar and keyboard shortcuts are handled by the apps themselves
 * via their declared hook paths (same pattern as existing useIBirdMenuBar).
 */

import type { CommandPaletteEntry, AIContextIntegration, InstalledApp } from './types';

// ============================================================================
// Integration Registry
// ============================================================================

class IntegrationRegistryImpl {
  /** AI context declarations per app */
  private aiContexts = new Map<string, AIContextIntegration>();

  /** Command palette entries per app */
  private commandEntries = new Map<string, CommandPaletteEntry[]>();

  /** Notification channel subscriptions per app */
  private notificationChannels = new Map<string, string[]>();

  /** Cleanup callbacks registered by apps at runtime */
  private cleanupCallbacks = new Map<string, (() => void)[]>();

  // ── Registration ─────────────────────────────────────────────

  /**
   * Register all integrations declared in an app's manifest.
   * Called when an app is installed.
   */
  registerApp(app: InstalledApp): void {
    const { id, manifest } = app;
    const { integrations } = manifest;

    if (integrations.aiContext) {
      this.aiContexts.set(id, integrations.aiContext);
    }

    if (integrations.commandPalette?.commands) {
      this.commandEntries.set(id, integrations.commandPalette.commands);
    }

    if (integrations.notifications?.channels) {
      this.notificationChannels.set(id, integrations.notifications.channels);
    }
  }

  /**
   * Unregister all integrations for an app.
   * Called when an app is uninstalled.
   */
  unregisterApp(appId: string): void {
    this.aiContexts.delete(appId);
    this.commandEntries.delete(appId);
    this.notificationChannels.delete(appId);

    // Run any cleanup callbacks the app registered at runtime
    const cleanups = this.cleanupCallbacks.get(appId);
    if (cleanups) {
      for (const cleanup of cleanups) {
        try {
          cleanup();
        } catch (e) {
          console.warn(`[IntegrationRegistry] Cleanup failed for ${appId}:`, e);
        }
      }
      this.cleanupCallbacks.delete(appId);
    }
  }

  // ── Runtime Cleanup Registration ─────────────────────────────

  /**
   * Apps can register cleanup callbacks that run on uninstall.
   * Useful for clearing localStorage, IndexedDB, etc.
   */
  registerCleanup(appId: string, cleanup: () => void): void {
    const existing = this.cleanupCallbacks.get(appId) || [];
    existing.push(cleanup);
    this.cleanupCallbacks.set(appId, existing);
  }

  // ── Queries ──────────────────────────────────────────────────

  /**
   * Get all command palette entries from all installed apps.
   * Used by the command palette to show available commands.
   */
  getAllCommands(): CommandPaletteEntry[] {
    const commands: CommandPaletteEntry[] = [];
    for (const entries of this.commandEntries.values()) {
      commands.push(...entries);
    }
    return commands;
  }

  /**
   * Get commands for a specific app.
   */
  getAppCommands(appId: string): CommandPaletteEntry[] {
    return this.commandEntries.get(appId) ?? [];
  }

  /**
   * Get AI context for a specific app.
   */
  getAIContext(appId: string): AIContextIntegration | undefined {
    return this.aiContexts.get(appId);
  }

  /**
   * Get all AI contexts across all installed apps.
   * Used by AgentConfigContext to build the full system prompt.
   */
  getAllAIContexts(): Map<string, AIContextIntegration> {
    return new Map(this.aiContexts);
  }

  /**
   * Get notification channels for an app.
   */
  getNotificationChannels(appId: string): string[] {
    return this.notificationChannels.get(appId) ?? [];
  }

  /**
   * Get all registered app IDs.
   */
  getRegisteredApps(): string[] {
    return Array.from(
      new Set([
        ...this.aiContexts.keys(),
        ...this.commandEntries.keys(),
        ...this.notificationChannels.keys(),
      ])
    );
  }

  /**
   * Clear all registrations. Used for testing or full reset.
   */
  clear(): void {
    this.aiContexts.clear();
    this.commandEntries.clear();
    this.notificationChannels.clear();
    this.cleanupCallbacks.clear();
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const IntegrationRegistry = new IntegrationRegistryImpl();
