/**
 * FinderPathBar - Breadcrumbs and item count at the bottom
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';

interface Breadcrumb {
  name: string;
  path: string;
}

interface FinderPathBarProps {
  breadcrumbs: Breadcrumb[];
  itemCount: number;
  onNavigate: (path: string) => void;
}

export const FinderPathBar: React.FC<FinderPathBarProps> = ({
  breadcrumbs,
  itemCount,
  onNavigate,
}) => {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 border-t border-white/10 flex-shrink-0">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-0.5 min-w-0 flex-1 overflow-hidden">
        {breadcrumbs.map((crumb, i) => (
          <React.Fragment key={crumb.path}>
            {i > 0 && <ChevronRight size={10} className="text-white/30 flex-shrink-0" />}
            <button
              className="text-[11px] text-white/50 hover:text-white/80 truncate transition-colors max-w-[120px]"
              onClick={() => onNavigate(crumb.path)}
              title={crumb.name}
            >
              {crumb.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Item count */}
      <div className="text-[10px] text-white/30 flex-shrink-0 ml-2">
        {itemCount} {itemCount === 1 ? 'item' : 'items'}
      </div>
    </div>
  );
};
