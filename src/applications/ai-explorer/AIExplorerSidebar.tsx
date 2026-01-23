import React from 'react';
import {
  MessageSquare,
  Brain,
  BrainCircuit,
  BookOpen,
  Package,
  Zap,
  Wrench,
} from 'lucide-react';
import type { ResourceType } from './types';
import { RESOURCE_TYPES } from './types';

const ICON_MAP: Record<string, React.ElementType> = {
  MessageSquare,
  Brain,
  BrainCircuit,
  BookOpen,
  Package,
  Zap,
  Wrench,
};

interface AIExplorerSidebarProps {
  activeResource: ResourceType;
  onSelectResource: (resource: ResourceType) => void;
}

export const AIExplorerSidebar: React.FC<AIExplorerSidebarProps> = ({
  activeResource,
  onSelectResource,
}) => {
  return (
    <div className="w-48 flex-shrink-0 border-r border-white/10 overflow-y-auto py-2 select-none">
      <div className="mb-1">
        <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">
          AI Resources
        </div>
        <div className="space-y-px mt-1">
          {RESOURCE_TYPES.map(resource => {
            const IconComponent = ICON_MAP[resource.icon] || Brain;
            const active = activeResource === resource.id;
            return (
              <button
                key={resource.id}
                className={`w-full flex items-center gap-2 px-4 py-1.5 text-xs transition-colors rounded-md mx-1 ${
                  active
                    ? 'bg-white/15 text-white'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
                style={{ width: 'calc(100% - 8px)' }}
                onClick={() => onSelectResource(resource.id)}
              >
                <IconComponent size={14} className={active ? 'text-blue-400' : 'text-white/50'} />
                <span className="truncate">{resource.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
