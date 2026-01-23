/**
 * FinderSidebar - Project-scoped sidebar with favorites and locations
 */

import React, { useState } from 'react';
import {
  FolderOpen,
  FileCode,
  Database,
  FileText,
  Home,
  Monitor,
  Download,
  Cloud,
  ChevronRight,
  ChevronDown,
  Folder,
  HardDrive,
} from 'lucide-react';
import type { SidebarSection, SidebarItem } from './types';

const ICON_MAP: Record<string, React.ElementType> = {
  FolderOpen,
  FileCode,
  Database,
  FileText,
  Home,
  Monitor,
  Download,
  Cloud,
  Folder,
  HardDrive,
};

interface FinderSidebarProps {
  projectRoot: string;
  activeLocation: string | null;
  onNavigate: (path: string) => void;
  onSelectGoogleDrive: () => void;
}

function buildSections(projectRoot: string): SidebarSection[] {
  return [
    {
      id: 'project',
      title: 'Project',
      collapsible: true,
      items: [
        { id: 'project-root', name: 'LiquidCrypto', icon: 'FolderOpen', path: projectRoot, type: 'local' },
        { id: 'project-src', name: 'src', icon: 'FileCode', path: `${projectRoot}/src`, type: 'local' },
        { id: 'project-server', name: 'server', icon: 'Database', path: `${projectRoot}/server`, type: 'local' },
        { id: 'project-docs', name: 'docs', icon: 'FileText', path: `${projectRoot}/docs`, type: 'local' },
      ],
    },
    {
      id: 'favorites',
      title: 'Favorites',
      collapsible: true,
      items: [
        { id: 'fav-home', name: 'Home', icon: 'Home', path: '~', type: 'local' },
        { id: 'fav-desktop', name: 'Desktop', icon: 'Monitor', path: '~/Desktop', type: 'local' },
        { id: 'fav-downloads', name: 'Downloads', icon: 'Download', path: '~/Downloads', type: 'local' },
      ],
    },
    {
      id: 'locations',
      title: 'Locations',
      collapsible: true,
      items: [
        { id: 'loc-google-drive', name: 'Google Drive', icon: 'Cloud', type: 'google-drive' },
      ],
    },
  ];
}

export const FinderSidebar: React.FC<FinderSidebarProps> = ({
  projectRoot,
  activeLocation,
  onNavigate,
  onSelectGoogleDrive,
}) => {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const sections = buildSections(projectRoot);

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const handleItemClick = (item: SidebarItem) => {
    if (item.type === 'google-drive') {
      onSelectGoogleDrive();
    } else if (item.path) {
      onNavigate(item.path);
    }
  };

  const isActive = (item: SidebarItem) => {
    if (item.type === 'google-drive') {
      return activeLocation === 'google-drive';
    }
    return activeLocation === item.path;
  };

  return (
    <div className="w-48 flex-shrink-0 border-r border-white/10 overflow-y-auto py-2 select-none">
      {sections.map(section => {
        const isCollapsed = collapsedSections.has(section.id);
        return (
          <div key={section.id} className="mb-1">
            {/* Section header */}
            <button
              className="w-full flex items-center gap-1 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/40 hover:text-white/60 transition-colors"
              onClick={() => section.collapsible && toggleSection(section.id)}
            >
              {section.collapsible && (
                isCollapsed
                  ? <ChevronRight size={10} />
                  : <ChevronDown size={10} />
              )}
              {section.title}
            </button>

            {/* Section items */}
            {!isCollapsed && (
              <div className="space-y-px">
                {section.items.map(item => {
                  const IconComponent = ICON_MAP[item.icon] || Folder;
                  const active = isActive(item);
                  return (
                    <button
                      key={item.id}
                      className={`w-full flex items-center gap-2 px-4 py-1.5 text-xs transition-colors rounded-md mx-1 ${
                        active
                          ? 'bg-white/15 text-white'
                          : 'text-white/70 hover:bg-white/5 hover:text-white'
                      }`}
                      style={{ width: 'calc(100% - 8px)' }}
                      onClick={() => handleItemClick(item)}
                    >
                      <IconComponent size={14} className={active ? 'text-blue-400' : 'text-white/50'} />
                      <span className="truncate">{item.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
