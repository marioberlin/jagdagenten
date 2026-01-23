import React, { useMemo } from 'react';
import { AppWindow, Bot, ChevronDown, ChevronRight } from 'lucide-react';
import { useAppStoreStore } from '@/system/app-store/appStoreStore';
import { CURATED_AGENTS } from '@/services/agents/registry';
import type { AITarget, ResourceType } from './types';
import { getStorageKey } from './types';

interface AIExplorerTargetListProps {
  activeResource: ResourceType;
  onSelectTarget: (target: AITarget) => void;
}

function getItemCount(resource: ResourceType, target: AITarget): number {
  const key = getStorageKey(resource, target);
  try {
    const items = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(items) ? items.length : 0;
  } catch {
    return 0;
  }
}

export const AIExplorerTargetList: React.FC<AIExplorerTargetListProps> = ({
  activeResource,
  onSelectTarget,
}) => {
  const installedApps = useAppStoreStore((s) => s.installedApps);
  const [collapsedSections, setCollapsedSections] = React.useState<Set<string>>(new Set());

  const apps: AITarget[] = useMemo(() =>
    Object.values(installedApps).map(app => ({
      type: 'app' as const,
      id: app.id,
      name: app.manifest.name,
      icon: app.manifest.icon,
    })),
  [installedApps]);

  const agents: AITarget[] = useMemo(() =>
    CURATED_AGENTS.map(agent => ({
      type: 'agent' as const,
      id: agent.id,
      name: agent.name,
    })),
  []);

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const renderSection = (title: string, sectionId: string, targets: AITarget[], icon: React.ReactNode) => {
    const isCollapsed = collapsedSections.has(sectionId);
    return (
      <div key={sectionId} className="mb-2">
        <button
          className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/40 hover:text-white/60 transition-colors"
          onClick={() => toggleSection(sectionId)}
        >
          {isCollapsed ? <ChevronRight size={10} /> : <ChevronDown size={10} />}
          {icon}
          <span>{title}</span>
          <span className="ml-auto text-white/25 normal-case font-normal">{targets.length}</span>
        </button>
        {!isCollapsed && (
          <div className="space-y-px">
            {targets.map(target => {
              const count = getItemCount(activeResource, target);
              return (
                <button
                  key={`${target.type}-${target.id}`}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-left hover:bg-white/5 transition-colors rounded-md mx-1 group"
                  style={{ width: 'calc(100% - 8px)' }}
                  onClick={() => onSelectTarget(target)}
                >
                  <div className="w-5 h-5 rounded flex items-center justify-center bg-white/5 flex-shrink-0">
                    {target.type === 'app'
                      ? <AppWindow size={12} className="text-blue-400" />
                      : <Bot size={12} className="text-purple-400" />
                    }
                  </div>
                  <span className="text-xs text-white/80 truncate flex-1">{target.name}</span>
                  {count > 0 && (
                    <span className="text-[10px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded-full">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto py-2">
      {renderSection('Apps', 'apps', apps, <AppWindow size={10} className="text-blue-400" />)}
      {renderSection('A2A Agents', 'agents', agents, <Bot size={10} className="text-purple-400" />)}
    </div>
  );
};
