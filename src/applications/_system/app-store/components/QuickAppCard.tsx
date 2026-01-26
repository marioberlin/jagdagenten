import type { QuickAppInstallation } from '@/system/quick-apps/types';
import { resolveIconComponent } from './iconResolver';
import { Zap } from 'lucide-react';

interface QuickAppCardProps {
  installation: QuickAppInstallation;
  onClick: () => void;
}

export function QuickAppCard({ installation, onClick }: QuickAppCardProps) {
  const { compiled } = installation;
  const { manifest } = compiled;
  const IconComponent = resolveIconComponent(manifest.icon);

  return (
    <button
      onClick={onClick}
      className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/20 hover:border-amber-500/40 hover:from-amber-500/10 hover:to-orange-500/10 transition-all text-left group"
    >
      {/* App Icon with Quick App badge */}
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center">
          {IconComponent && <IconComponent size={22} className="text-amber-400" />}
        </div>
        {/* Quick App indicator */}
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
          <Zap size={10} className="text-black" />
        </div>
      </div>

      {/* App Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-label-glass-primary truncate group-hover:text-amber-100 transition-colors">
          {manifest.name}
        </h4>
        <p className="text-xs text-label-glass-tertiary truncate mt-0.5">
          {manifest.description}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] text-amber-400/80 bg-amber-500/10 px-1.5 py-0.5 rounded capitalize">
            Quick App
          </span>
          <span className="text-[10px] text-label-glass-tertiary">
            v{manifest.version}
          </span>
        </div>
      </div>
    </button>
  );
}
