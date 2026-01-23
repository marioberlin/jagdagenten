import { useAppStoreStore } from '@/system/app-store/appStoreStore';
import { useAppStoreUIStore } from '../store';
import { CAPABILITY_DESCRIPTIONS } from '@/system/app-store/permissions';
import { resolveIconComponent } from './iconResolver';
import type { AppCapability, AppManifest } from '@/system/app-store/types';
import { Shield, Info, Trash2, Pin, PinOff } from 'lucide-react';

export function AppDetailView() {
  const { selectedAppId, showUninstallConfirm, showInstallConfirm } = useAppStoreUIStore();
  const installedApps = useAppStoreStore((s) => s.installedApps);
  const catalog = useAppStoreStore((s) => s.catalog);
  const openApp = useAppStoreStore((s) => s.openApp);
  const dockApps = useAppStoreStore((s) => s.dockApps);
  const addToDock = useAppStoreStore((s) => s.addToDock);
  const removeFromDock = useAppStoreStore((s) => s.removeFromDock);

  if (!selectedAppId) return null;

  // Check installed apps first, then fall back to catalog
  const app = installedApps[selectedAppId];
  const catalogEntry = !app ? catalog.find(e => e.manifest.id === selectedAppId) : null;
  const manifest: AppManifest | null = app?.manifest ?? catalogEntry?.manifest ?? null;
  const isInstalled = !!app;

  if (!manifest) return <div className="p-6 text-label-glass-tertiary">App not found</div>;

  const IconComponent = resolveIconComponent(manifest.icon);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-5">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center flex-shrink-0">
          {IconComponent && <IconComponent size={36} className="text-blue-400" />}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-label-glass-primary">{manifest.name}</h2>
          <p className="text-sm text-label-glass-secondary mt-1">{manifest.description}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-label-glass-tertiary">v{manifest.version}</span>
            <span className="text-xs text-label-glass-tertiary capitalize">{manifest.category}</span>
            <span className="text-xs text-label-glass-tertiary">{manifest.author}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {isInstalled ? (
            <>
              <button
                onClick={() => openApp(selectedAppId)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
              >
                Open
              </button>
              {!manifest.id.startsWith('_system') && (
                <button
                  onClick={() => showUninstallConfirm(selectedAppId)}
                  className="px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Trash2 size={14} />
                  Remove
                </button>
              )}
            </>
          ) : (
            <button
              onClick={() => showInstallConfirm(selectedAppId)}
              className="px-4 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
            >
              Get
            </button>
          )}
        </div>
      </div>

      {/* Long Description */}
      {manifest.longDescription && (
        <div className="bg-glass-surface/50 rounded-xl border border-[var(--glass-border)] p-5">
          <h3 className="text-sm font-semibold text-label-glass-primary mb-2 flex items-center gap-2">
            <Info size={14} />
            About
          </h3>
          <p className="text-sm text-label-glass-secondary leading-relaxed">
            {manifest.longDescription}
          </p>
        </div>
      )}

      {/* Window Mode */}
      <div className="bg-glass-surface/50 rounded-xl border border-[var(--glass-border)] p-5">
        <h3 className="text-sm font-semibold text-label-glass-primary mb-3">Window Configuration</h3>
        <div className="grid grid-cols-2 gap-3">
          <DetailRow label="Mode" value={manifest.window.mode} />
          <DetailRow label="Resizable" value={manifest.window.resizable ? 'Yes' : 'No'} />
          {manifest.window.defaultSize && (
            <DetailRow
              label="Default Size"
              value={`${manifest.window.defaultSize.width} x ${manifest.window.defaultSize.height}`}
            />
          )}
        </div>
      </div>

      {/* Capabilities / Permissions */}
      <div className="bg-glass-surface/50 rounded-xl border border-[var(--glass-border)] p-5">
        <h3 className="text-sm font-semibold text-label-glass-primary mb-3 flex items-center gap-2">
          <Shield size={14} />
          Permissions
        </h3>
        {manifest.capabilities.length === 0 ? (
          <p className="text-sm text-label-glass-tertiary">No special permissions required</p>
        ) : (
          <div className="space-y-2">
            {manifest.capabilities.map((cap: AppCapability) => {
              const info = CAPABILITY_DESCRIPTIONS[cap];
              return (
                <div key={cap} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    info?.risk === 'high' ? 'bg-red-400' :
                    info?.risk === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                  }`} />
                  <div>
                    <span className="text-sm text-label-glass-primary">{info?.label ?? cap}</span>
                    <span className="text-xs text-label-glass-tertiary ml-2">{info?.description}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Integrations */}
      <div className="bg-glass-surface/50 rounded-xl border border-[var(--glass-border)] p-5">
        <h3 className="text-sm font-semibold text-label-glass-primary mb-3">Integrations</h3>
        <div className="grid grid-cols-2 gap-2">
          <IntegrationBadge label="Dock" enabled={manifest.integrations.dock?.enabled} />
          <IntegrationBadge label="Menu Bar" enabled={!!manifest.integrations.menuBar?.hookPath} />
          <IntegrationBadge label="Shortcuts" enabled={!!manifest.integrations.shortcuts?.hookPath} />
          <IntegrationBadge label="AI Context" enabled={!!manifest.integrations.aiContext} />
          <IntegrationBadge label="Commands" enabled={(manifest.integrations.commandPalette?.commands?.length ?? 0) > 0} />
          <IntegrationBadge label="Notifications" enabled={(manifest.integrations.notifications?.channels?.length ?? 0) > 0} />
        </div>
      </div>

      {/* Dock Management */}
      {isInstalled && !manifest.id.startsWith('_system') && (
        <div className="bg-glass-surface/50 rounded-xl border border-[var(--glass-border)] p-5">
          <h3 className="text-sm font-semibold text-label-glass-primary mb-3">Dock</h3>
          {dockApps.includes(selectedAppId) ? (
            <button
              onClick={() => removeFromDock(selectedAppId)}
              className="flex items-center gap-2 text-sm text-label-glass-secondary hover:text-label-glass-primary transition-colors"
            >
              <PinOff size={14} />
              Remove from Dock
            </button>
          ) : (
            <button
              onClick={() => addToDock(selectedAppId)}
              className="flex items-center gap-2 text-sm text-label-glass-secondary hover:text-label-glass-primary transition-colors"
            >
              <Pin size={14} />
              Add to Dock
            </button>
          )}
        </div>
      )}

      {/* Keywords */}
      {manifest.keywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {manifest.keywords.map((kw: string) => (
            <span key={kw} className="text-xs bg-glass-surface border border-[var(--glass-border)] px-2.5 py-1 rounded-full text-label-glass-tertiary">
              {kw}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-label-glass-tertiary">{label}</span>
      <p className="text-sm text-label-glass-primary capitalize">{value}</p>
    </div>
  );
}

function IntegrationBadge({ label, enabled }: { label: string; enabled?: boolean }) {
  return (
    <div className={`text-xs px-3 py-1.5 rounded-lg border ${
      enabled
        ? 'border-green-500/30 bg-green-500/10 text-green-400'
        : 'border-[var(--glass-border)] bg-glass-surface/30 text-label-glass-tertiary'
    }`}>
      {enabled ? '✓' : '–'} {label}
    </div>
  );
}
