/**
 * App Store Dialogs
 *
 * Confirmation dialogs for install/uninstall flows.
 */

import { useState } from 'react';
import { useAppStoreStore } from '@/system/app-store/appStoreStore';
import { useAppStoreUIStore } from '../store';
import { installRemoteApp } from '@/system/app-store/remoteAppLoader';
import { CAPABILITY_DESCRIPTIONS } from '@/system/app-store/permissions';
import { resolveIconComponent } from './iconResolver';
import type { AppCapability } from '@/system/app-store/types';
import { AlertTriangle, Shield, X, Download } from 'lucide-react';

export function AppStoreDialogs() {
  return (
    <>
      <InstallDialog />
      <UninstallDialog />
    </>
  );
}

function InstallDialog() {
  const { showInstallDialog, installDialogAppId, hideInstallConfirm } = useAppStoreUIStore();
  const catalog = useAppStoreStore((s) => s.catalog);
  const [isInstalling, setIsInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!showInstallDialog || !installDialogAppId) return null;

  const entry = catalog.find(e => e.manifest.id === installDialogAppId);
  if (!entry) return null;

  const { manifest } = entry;
  const IconComponent = resolveIconComponent(manifest.icon);

  // Capabilities that require explicit user consent
  const sensitiveCapabilities = manifest.capabilities.filter(
    cap => !['storage:local', 'storage:indexeddb', 'notification:toast', 'system:fullscreen'].includes(cap)
  );

  const handleInstall = async () => {
    setIsInstalling(true);
    setError(null);
    try {
      await installRemoteApp(manifest);
      hideInstallConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Installation failed');
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={hideInstallConfirm}
      />

      {/* Dialog */}
      <div className="relative bg-[var(--glass-bg-regular)] backdrop-blur-2xl border border-[var(--glass-border)] rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        {/* Close */}
        <button
          onClick={hideInstallConfirm}
          className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-glass-surface-hover transition-colors text-label-glass-tertiary"
        >
          <X size={14} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center flex-shrink-0">
            {IconComponent && <IconComponent size={28} className="text-blue-400" />}
          </div>
          <div>
            <h3 className="text-base font-semibold text-label-glass-primary">
              Install "{manifest.name}"?
            </h3>
            <p className="text-xs text-label-glass-tertiary mt-0.5">
              v{manifest.version} by {manifest.author}
            </p>
          </div>
        </div>

        {/* Permissions */}
        {sensitiveCapabilities.length > 0 && (
          <div className="bg-glass-surface/50 rounded-xl border border-[var(--glass-border)] p-4">
            <h4 className="text-xs font-semibold text-label-glass-primary mb-2 flex items-center gap-1.5">
              <Shield size={12} />
              Permissions Required
            </h4>
            <div className="space-y-1.5">
              {sensitiveCapabilities.map((cap: AppCapability) => {
                const info = CAPABILITY_DESCRIPTIONS[cap];
                return (
                  <div key={cap} className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      info?.risk === 'high' ? 'bg-red-400' :
                      info?.risk === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                    }`} />
                    <span className="text-xs text-label-glass-secondary">
                      {info?.label ?? cap}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 bg-red-500/5 border border-red-500/20 rounded-xl p-3">
            <AlertTriangle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-300">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={hideInstallConfirm}
            className="px-4 py-2 text-sm font-medium text-label-glass-secondary hover:bg-glass-surface-hover rounded-lg transition-colors"
            disabled={isInstalling}
          >
            Cancel
          </button>
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isInstalling ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Installing...
              </>
            ) : (
              <>
                <Download size={14} />
                Install
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function UninstallDialog() {
  const { showUninstallDialog, uninstallDialogAppId, hideUninstallConfirm } = useAppStoreUIStore();
  const installedApps = useAppStoreStore((s) => s.installedApps);
  const uninstallApp = useAppStoreStore((s) => s.uninstallApp);

  if (!showUninstallDialog || !uninstallDialogAppId) return null;

  const app = installedApps[uninstallDialogAppId];
  if (!app) return null;

  const { manifest } = app;
  const IconComponent = resolveIconComponent(manifest.icon);

  const handleConfirm = () => {
    uninstallApp(uninstallDialogAppId);
    hideUninstallConfirm();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={hideUninstallConfirm}
      />

      {/* Dialog */}
      <div className="relative bg-[var(--glass-bg-regular)] backdrop-blur-2xl border border-[var(--glass-border)] rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        {/* Close */}
        <button
          onClick={hideUninstallConfirm}
          className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-glass-surface-hover transition-colors text-label-glass-tertiary"
        >
          <X size={14} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/20 flex items-center justify-center flex-shrink-0">
            {IconComponent && <IconComponent size={28} className="text-red-400" />}
          </div>
          <div>
            <h3 className="text-base font-semibold text-label-glass-primary">
              Remove "{manifest.name}"?
            </h3>
            <p className="text-sm text-label-glass-secondary mt-0.5">
              This will remove the app from your dock and integrations.
            </p>
          </div>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-2.5 bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3">
          <AlertTriangle size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-label-glass-secondary leading-relaxed">
            Any app data or preferences will be cleared. This action cannot be undone.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={hideUninstallConfirm}
            className="px-4 py-2 text-sm font-medium text-label-glass-secondary hover:bg-glass-surface-hover rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
