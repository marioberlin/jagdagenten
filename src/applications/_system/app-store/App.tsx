/**
 * App Store
 *
 * Apple App Store-inspired interface for browsing, installing,
 * and managing LiquidOS applications.
 */

import { useEffect } from 'react';
import { useAppStoreStore } from '@/system/app-store/appStoreStore';
import { useAppStoreUIStore } from './store';
import { fetchCatalog } from '@/system/app-store/remoteAppLoader';
import { AppStoreSidebar } from './components/AppStoreSidebar';
import { AppStoreHome } from './components/AppStoreHome';
import { AppDetailView } from './components/AppDetailView';
import { InstalledAppsView } from './components/InstalledAppsView';
import { AppCategoryView } from './components/AppCategoryView';
import { AppSearchResults } from './components/AppSearchResults';
import { AppPublishView } from './components/AppPublishView';
import { AppStoreDialogs } from './components/AppStoreDialogs';
import { X, ChevronLeft } from 'lucide-react';

export default function AppStoreApp() {
  const closePanel = useAppStoreStore((s) => s.closeApp);
  const { currentView, goBack } = useAppStoreUIStore();

  // Fetch remote catalog on mount
  useEffect(() => {
    fetchCatalog().catch(() => {
      // Silently fail — local apps still work without remote catalog
    });
  }, []);

  const showBackButton = currentView !== 'home';

  return (
    <div className="fixed inset-0 z-40 flex bg-[var(--glass-bg-regular)] backdrop-blur-2xl">
      {/* Dialogs */}
      <AppStoreDialogs />

      {/* Sidebar */}
      <AppStoreSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Title Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--glass-border)]">
          <div className="flex items-center gap-3">
            {showBackButton && (
              <button
                onClick={goBack}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-glass-surface-hover transition-colors text-label-glass-secondary"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <h1 className="text-lg font-semibold text-label-glass-primary">
              {getViewTitle(currentView)}
            </h1>
          </div>
          <button
            onClick={closePanel}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-glass-surface-hover transition-colors text-label-glass-tertiary hover:text-label-glass-primary"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <AppStoreContent />
        </div>
      </div>
    </div>
  );
}

function AppStoreContent() {
  const { currentView } = useAppStoreUIStore();

  switch (currentView) {
    case 'home':
      return <AppStoreHome />;
    case 'detail':
      return <AppDetailView />;
    case 'installed':
      return <InstalledAppsView />;
    case 'category':
      return <AppCategoryView />;
    case 'search':
      return <AppSearchResults />;
    case 'updates':
      return <InstalledAppsView showUpdatesOnly />;
    case 'publish':
      return <AppPublishView />;
    default:
      return <AppStoreHome />;
  }
}

function getViewTitle(view: string): string {
  switch (view) {
    case 'home': return 'Discover';
    case 'detail': return 'App Details';
    case 'installed': return 'Installed Apps';
    case 'category': return 'Category';
    case 'search': return 'Search Results';
    case 'updates': return 'Updates';
    case 'publish': return 'Publish App';
    default: return 'App Store';
  }
}
