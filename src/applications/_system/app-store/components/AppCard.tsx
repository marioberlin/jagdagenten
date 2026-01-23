import type { InstalledApp } from '@/system/app-store/types';
import { resolveIconComponent } from './iconResolver';

interface AppCardProps {
  app: InstalledApp;
  onClick: () => void;
  showInstallButton?: boolean;
}

export function AppCard({ app, onClick, showInstallButton = false }: AppCardProps) {
  const { manifest } = app;
  const IconComponent = resolveIconComponent(manifest.icon);

  return (
    <button
      onClick={onClick}
      className="flex items-start gap-3 p-3 rounded-xl bg-glass-surface/50 border border-[var(--glass-border)] hover:bg-glass-surface-hover transition-colors text-left group"
    >
      {/* App Icon */}
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center flex-shrink-0">
        {IconComponent && <IconComponent size={22} className="text-blue-400" />}
      </div>

      {/* App Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-label-glass-primary truncate">
          {manifest.name}
        </h4>
        <p className="text-xs text-label-glass-tertiary truncate mt-0.5">
          {manifest.description}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] text-label-glass-tertiary bg-glass-surface px-1.5 py-0.5 rounded capitalize">
            {manifest.category}
          </span>
          <span className="text-[10px] text-label-glass-tertiary">
            v{manifest.version}
          </span>
        </div>
      </div>

      {/* Install/Open Button */}
      {showInstallButton && (
        <div className="flex-shrink-0">
          <span className="text-xs font-medium text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full">
            Get
          </span>
        </div>
      )}
    </button>
  );
}
