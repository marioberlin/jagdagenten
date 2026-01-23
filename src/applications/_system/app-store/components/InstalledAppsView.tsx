import { useAppStoreStore } from '@/system/app-store/appStoreStore';
import { useAppStoreUIStore } from '../store';
import { AppCard } from './AppCard';

interface InstalledAppsViewProps {
  showUpdatesOnly?: boolean;
}

export function InstalledAppsView({ showUpdatesOnly = false }: InstalledAppsViewProps) {
  const installedApps = useAppStoreStore((s) => Object.values(s.installedApps));
  const { navigateTo } = useAppStoreUIStore();

  const apps = showUpdatesOnly
    ? installedApps.filter(a => a.source === 'remote') // Updates only applicable to remote apps
    : installedApps;

  if (apps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-sm text-label-glass-tertiary">
          {showUpdatesOnly ? 'All apps are up to date' : 'No apps installed'}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-label-glass-primary">
          {showUpdatesOnly ? 'Available Updates' : `${apps.length} Installed Apps`}
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {apps.map((app) => (
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
