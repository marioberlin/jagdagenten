/**
 * Catalog Card
 *
 * Card component for apps available in the remote catalog
 * that are not yet installed. Shows a "Get" button.
 */

import type { AppCatalogEntry } from '@/system/app-store/types';
import { resolveIconComponent } from './iconResolver';
import { Download } from 'lucide-react';

interface CatalogCardProps {
  entry: AppCatalogEntry;
  onClick: () => void;
}

export function CatalogCard({ entry, onClick }: CatalogCardProps) {
  const { manifest } = entry;
  const IconComponent = resolveIconComponent(manifest.icon);

  return (
    <button
      onClick={onClick}
      className="flex items-start gap-3 p-3 rounded-xl bg-glass-surface/50 border border-[var(--glass-border)] hover:bg-glass-surface-hover transition-colors text-left group"
    >
      {/* App Icon */}
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center flex-shrink-0">
        {IconComponent && <IconComponent size={22} className="text-purple-400" />}
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
          {entry.downloads !== undefined && entry.downloads > 0 && (
            <span className="text-[10px] text-label-glass-tertiary flex items-center gap-0.5">
              <Download size={8} />
              {entry.downloads}
            </span>
          )}
        </div>
      </div>

      {/* Get Button */}
      <div className="flex-shrink-0 self-center">
        <span className="text-xs font-medium text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full group-hover:bg-blue-500/20 transition-colors">
          Get
        </span>
      </div>
    </button>
  );
}
