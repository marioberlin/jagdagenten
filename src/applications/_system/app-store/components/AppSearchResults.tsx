import { useMemo } from 'react';
import { useAppStoreStore } from '@/system/app-store/appStoreStore';
import { useAppStoreUIStore } from '../store';
import { AppCard } from './AppCard';
import { CatalogCard } from './CatalogCard';

export function AppSearchResults() {
  const { searchQuery, navigateTo } = useAppStoreUIStore();
  const installedAppsRecord = useAppStoreStore((s) => s.installedApps);
  const catalog = useAppStoreStore((s) => s.catalog);

  const installedApps = useMemo(() => Object.values(installedAppsRecord), [installedAppsRecord]);
  const installedIds = useMemo(() => new Set(Object.keys(installedAppsRecord)), [installedAppsRecord]);

  const query = searchQuery.toLowerCase().trim();

  // Search installed apps
  const installedResults = query
    ? installedApps.filter(app =>
        app.manifest.name.toLowerCase().includes(query) ||
        app.manifest.description.toLowerCase().includes(query) ||
        app.manifest.keywords.some(k => k.toLowerCase().includes(query)) ||
        app.manifest.category.toLowerCase().includes(query)
      )
    : [];

  // Search remote catalog (exclude already installed)
  const catalogResults = query
    ? catalog.filter(entry =>
        !installedIds.has(entry.manifest.id) && (
          entry.manifest.name.toLowerCase().includes(query) ||
          entry.manifest.description.toLowerCase().includes(query) ||
          entry.manifest.keywords.some(k => k.toLowerCase().includes(query)) ||
          entry.manifest.category.toLowerCase().includes(query)
        )
      )
    : [];

  const totalResults = installedResults.length + catalogResults.length;

  return (
    <div className="p-6 space-y-6">
      <p className="text-sm text-label-glass-tertiary">
        {totalResults} result{totalResults !== 1 ? 's' : ''} for "{searchQuery}"
      </p>

      {totalResults === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <p className="text-sm text-label-glass-tertiary">No apps match your search</p>
        </div>
      ) : (
        <>
          {/* Installed matches */}
          {installedResults.length > 0 && (
            <div>
              {catalogResults.length > 0 && (
                <h3 className="text-xs font-semibold text-label-glass-tertiary uppercase tracking-wide mb-3">
                  Installed
                </h3>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {installedResults.map((app) => (
                  <AppCard
                    key={app.id}
                    app={app}
                    onClick={() => navigateTo('detail', { appId: app.id })}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Catalog matches */}
          {catalogResults.length > 0 && (
            <div>
              {installedResults.length > 0 && (
                <h3 className="text-xs font-semibold text-label-glass-tertiary uppercase tracking-wide mb-3">
                  Available
                </h3>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {catalogResults.map((entry) => (
                  <CatalogCard
                    key={entry.manifest.id}
                    entry={entry}
                    onClick={() => navigateTo('detail', { appId: entry.manifest.id })}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
