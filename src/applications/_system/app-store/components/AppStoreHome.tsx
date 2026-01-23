import type { ElementType } from 'react';
import { useAppStoreStore } from '@/system/app-store/appStoreStore';
import { useAppStoreUIStore } from '../store';
import { AppCard } from './AppCard';
import { CatalogCard } from './CatalogCard';
import type { InstalledApp } from '@/system/app-store/types';
import { Sparkles, TrendingUp, Star, Globe } from 'lucide-react';

const FEATURED_CATEGORIES: { title: string; icon: ElementType; filter: (app: InstalledApp) => boolean }[] = [
  {
    title: 'Apps We Love',
    icon: Sparkles,
    filter: (app) => ['productivity', 'communication'].includes(app.manifest.category),
  },
  {
    title: 'Top Charts',
    icon: TrendingUp,
    filter: (app) => ['finance', 'developer'].includes(app.manifest.category),
  },
  {
    title: 'Essential Utilities',
    icon: Star,
    filter: (app) => ['utilities', 'system'].includes(app.manifest.category),
  },
];

export function AppStoreHome() {
  const installedApps = useAppStoreStore((s) => Object.values(s.installedApps));
  const installedIds = useAppStoreStore((s) => new Set(Object.keys(s.installedApps)));
  const catalog = useAppStoreStore((s) => s.catalog);
  const isLoadingCatalog = useAppStoreStore((s) => s.isLoadingCatalog);
  const { navigateTo } = useAppStoreUIStore();

  // Remote apps that aren't already installed
  const availableRemoteApps = catalog.filter(e => !installedIds.has(e.manifest.id));

  return (
    <div className="p-6 space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-pink-500/20 border border-[var(--glass-border)] p-8">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-label-glass-primary mb-2">
            Welcome to the App Store
          </h2>
          <p className="text-sm text-label-glass-secondary max-w-md">
            Discover powerful applications for LiquidOS. Install productivity tools,
            communication apps, trading platforms, and more.
          </p>
        </div>
        <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -right-4 -bottom-4 w-32 h-32 rounded-full bg-purple-500/10 blur-2xl" />
      </div>

      {/* Featured Sections */}
      {FEATURED_CATEGORIES.map((section) => {
        const apps = installedApps.filter(section.filter);
        if (apps.length === 0) return null;

        const SectionIcon = section.icon;
        return (
          <div key={section.title}>
            <div className="flex items-center gap-2 mb-4">
              <SectionIcon size={16} className="text-blue-400" />
              <h3 className="text-base font-semibold text-label-glass-primary">
                {section.title}
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {apps.slice(0, 8).map((app) => (
                <AppCard
                  key={app.id}
                  app={app}
                  onClick={() => navigateTo('detail', { appId: app.id })}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* All Installed Apps */}
      <div>
        <h3 className="text-base font-semibold text-label-glass-primary mb-4">
          All Applications
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {installedApps.map((app) => (
            <AppCard
              key={app.id}
              app={app}
              onClick={() => navigateTo('detail', { appId: app.id })}
            />
          ))}
        </div>
      </div>

      {/* Marketplace (Remote Apps) */}
      {isLoadingCatalog && (
        <div className="flex items-center gap-2 text-sm text-label-glass-tertiary">
          <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          Loading marketplace...
        </div>
      )}
      {availableRemoteApps.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Globe size={16} className="text-purple-400" />
            <h3 className="text-base font-semibold text-label-glass-primary">
              Marketplace
            </h3>
            <span className="text-xs text-label-glass-tertiary bg-glass-surface px-2 py-0.5 rounded-full">
              {availableRemoteApps.length} available
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {availableRemoteApps.map((entry) => (
              <CatalogCard
                key={entry.manifest.id}
                entry={entry}
                onClick={() => navigateTo('detail', { appId: entry.manifest.id })}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
