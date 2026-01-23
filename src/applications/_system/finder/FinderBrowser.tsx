/**
 * FinderBrowser - Main Finder app component
 *
 * Orchestrates the sidebar, toolbar, file list, and path bar.
 * Supports both local file browsing (via /api/system/files) and
 * Google Drive integration (via the existing GlassFinderApp).
 */

import React, { useState, useCallback } from 'react';
import { useFinderNavigation } from './useFinderNavigation';
import { FinderSidebar } from './FinderSidebar';
import { FinderToolbar } from './FinderToolbar';
import { FinderFileList } from './FinderFileList';
import { FinderPathBar } from './FinderPathBar';
import { GlassFinderApp } from '@/components/features/GlassFinderApp';

export const FinderBrowser: React.FC = () => {
  const [activeView, setActiveView] = useState<'local' | 'google-drive'>('local');

  const nav = useFinderNavigation();

  const handleSidebarNavigate = useCallback((path: string) => {
    setActiveView('local');
    nav.navigateTo(path);
  }, [nav]);

  const handleSelectGoogleDrive = useCallback(() => {
    setActiveView('google-drive');
  }, []);

  const isGoogleDrive = activeView === 'google-drive';

  return (
    <div className="flex flex-col h-full bg-black/40 text-white">
      {/* Toolbar */}
      <FinderToolbar
        viewMode={nav.viewMode}
        showHidden={nav.showHidden}
        searchQuery={nav.searchQuery}
        canGoBack={nav.canGoBack}
        canGoForward={nav.canGoForward}
        isGoogleDrive={isGoogleDrive}
        onViewModeChange={nav.setViewMode}
        onShowHiddenChange={nav.setShowHidden}
        onSearchChange={nav.setSearchQuery}
        onGoBack={nav.goBack}
        onGoForward={nav.goForward}
        onRefresh={nav.refresh}
      />

      {/* Main content area */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <FinderSidebar
          projectRoot={nav.projectRoot}
          activeLocation={isGoogleDrive ? 'google-drive' : nav.currentPath}
          onNavigate={handleSidebarNavigate}
          onSelectGoogleDrive={handleSelectGoogleDrive}
        />

        {/* Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {isGoogleDrive ? (
            <GlassFinderApp />
          ) : (
            <>
              <FinderFileList
                entries={nav.sortedEntries}
                viewMode={nav.viewMode}
                sortColumn={nav.sortColumn}
                sortDirection={nav.sortDirection}
                loading={nav.loading}
                error={nav.error}
                onNavigate={nav.navigateTo}
                onSortChange={nav.toggleSortColumn}
              />
              <FinderPathBar
                breadcrumbs={nav.listing?.breadcrumbs || []}
                itemCount={nav.sortedEntries.length}
                onNavigate={nav.navigateTo}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
