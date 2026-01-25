import type { ElementType, ReactNode } from 'react';
import { useAppStoreUIStore } from '../store';
import { useAppStoreStore } from '@/system/app-store/appStoreStore';
import {
  Compass, Download, RefreshCw, Search, Upload,
  Briefcase, MessageSquare, TrendingUp, Cloud,
  Plane, Code, Wrench, Gamepad2, Monitor, Bot
} from 'lucide-react';
import type { AppCategory } from '@/system/app-store/types';

const CATEGORY_ICONS: Record<AppCategory, ElementType> = {
  productivity: Briefcase,
  communication: MessageSquare,
  finance: TrendingUp,
  weather: Cloud,
  travel: Plane,
  developer: Code,
  utilities: Wrench,
  entertainment: Gamepad2,
  system: Monitor,
  agent: Bot,
};

const CATEGORY_LABELS: Record<AppCategory, string> = {
  productivity: 'Productivity',
  communication: 'Communication',
  finance: 'Finance',
  weather: 'Weather',
  travel: 'Travel',
  developer: 'Developer',
  utilities: 'Utilities',
  entertainment: 'Entertainment',
  system: 'System',
  agent: 'Agents',
};

export function AppStoreSidebar() {
  const { currentView, selectedCategory, searchQuery, navigateTo, setSearchQuery } = useAppStoreUIStore();
  const installedCount = useAppStoreStore((s) => Object.keys(s.installedApps).length);

  return (
    <div className="w-56 flex-shrink-0 border-r border-[var(--glass-border)] flex flex-col bg-glass-surface/30">
      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-label-glass-tertiary" />
          <input
            type="text"
            placeholder="Search apps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm bg-glass-surface border border-[var(--glass-border)] rounded-lg text-label-glass-primary placeholder:text-label-glass-tertiary focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-1 space-y-0.5 overflow-y-auto">
        <SidebarSection title="Browse">
          <SidebarItem
            icon={Compass}
            label="Discover"
            active={currentView === 'home'}
            onClick={() => navigateTo('home')}
          />
          <SidebarItem
            icon={Download}
            label="Installed"
            active={currentView === 'installed'}
            onClick={() => navigateTo('installed')}
            badge={installedCount}
          />
          <SidebarItem
            icon={RefreshCw}
            label="Updates"
            active={currentView === 'updates'}
            onClick={() => navigateTo('updates')}
          />
          <SidebarItem
            icon={Upload}
            label="Publish"
            active={currentView === 'publish'}
            onClick={() => navigateTo('publish')}
          />
        </SidebarSection>

        <SidebarSection title="Categories">
          {(Object.keys(CATEGORY_LABELS) as AppCategory[]).map((cat) => (
            <SidebarItem
              key={cat}
              icon={CATEGORY_ICONS[cat]}
              label={CATEGORY_LABELS[cat]}
              active={currentView === 'category' && selectedCategory === cat}
              onClick={() => navigateTo('category', { category: cat })}
            />
          ))}
        </SidebarSection>
      </nav>
    </div>
  );
}

function SidebarSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-3">
      <h3 className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-label-glass-tertiary">
        {title}
      </h3>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

interface SidebarItemProps {
  icon: ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}

function SidebarItem({ icon: Icon, label, active, onClick, badge }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${active
          ? 'bg-blue-500/20 text-blue-400'
          : 'text-label-glass-secondary hover:bg-glass-surface-hover hover:text-label-glass-primary'
        }`}
    >
      <Icon size={15} className="flex-shrink-0" />
      <span className="flex-1 text-left truncate">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="text-[10px] bg-glass-surface px-1.5 py-0.5 rounded-full text-label-glass-tertiary">
          {badge}
        </span>
      )}
    </button>
  );
}
