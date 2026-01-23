import { useAppStoreStore } from '@/system/app-store/appStoreStore';
import { useAppStoreUIStore } from '../store';
import { AppCard } from './AppCard';

export function AppCategoryView() {
  const { selectedCategory, navigateTo } = useAppStoreUIStore();
  const installedApps = useAppStoreStore((s) => Object.values(s.installedApps));

  const filteredApps = selectedCategory
    ? installedApps.filter(app => app.manifest.category === selectedCategory)
    : installedApps;

  if (filteredApps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-sm text-label-glass-tertiary">
          No apps in this category
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-base font-semibold text-label-glass-primary mb-4 capitalize">
        {selectedCategory ?? 'All'} Apps
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredApps.map((app) => (
          <AppCard
            key={app.id}
            app={app}
            onClick={() => navigateTo('detail', { appId: app.id })}
          />
        ))}
      </div>
    </div>
  );
}
