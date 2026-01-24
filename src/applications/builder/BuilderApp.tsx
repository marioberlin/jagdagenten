/**
 * Builder App
 *
 * AI-powered app builder for LiquidOS. Provides a UI for creating,
 * monitoring, editing, and managing app builds.
 */

import { useEffect, useState, useCallback } from 'react';
import { Hammer, Plus, Activity, Pencil, History } from 'lucide-react';
import { useBuilderStore, type BuilderTab } from './store';
import { BuildForm } from './components/BuildForm';
import { ProgressPanel } from './components/ProgressPanel';
import { BuildHistory } from './components/BuildHistory';
import { PlanReview } from './components/PlanReview';
import { AppEditor } from './components/AppEditor';
import { AppDetail } from './components/AppDetail';
import { RAGBrowser } from './components/RAGBrowser';
import { DropZone } from './components/DropZone';

const tabs: { id: BuilderTab; label: string; icon: React.ReactNode }[] = [
  { id: 'new', label: 'New', icon: <Plus size={16} /> },
  { id: 'active', label: 'Active', icon: <Activity size={16} /> },
  { id: 'edit', label: 'Edit', icon: <Pencil size={16} /> },
  { id: 'history', label: 'History', icon: <History size={16} /> },
];

export function BuilderApp() {
  const { currentTab, setTab, loadHistory } = useBuilderStore();

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return (
    <div className="flex flex-col h-full bg-glass-surface/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
      {/* Navbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
        <Hammer size={20} className="text-accent" />
        <span className="text-sm font-semibold text-primary">Builder</span>
        <div className="flex-1" />
        <div className="flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                currentTab === tab.id
                  ? 'bg-accent/20 text-accent'
                  : 'text-secondary hover:text-primary hover:bg-white/5'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {currentTab === 'new' && <NewBuildView />}
        {currentTab === 'active' && <ActiveBuildView />}
        {currentTab === 'edit' && <EditView />}
        {currentTab === 'history' && <HistoryView />}
      </div>
    </div>
  );
}

function NewBuildView() {
  const { activeBuildId } = useBuilderStore();

  return (
    <div className="flex h-full">
      <div className="w-1/2 border-r border-white/10 overflow-y-auto p-4">
        <BuildForm />
      </div>
      <div className="w-1/2 overflow-y-auto p-4">
        {activeBuildId ? <PlanReview buildId={activeBuildId} /> : (
          <div className="flex items-center justify-center h-full text-secondary text-sm">
            Submit a build request to see the plan here.
          </div>
        )}
      </div>
    </div>
  );
}

function ActiveBuildView() {
  const { builds, activeBuildId } = useBuilderStore();
  // Show in-progress and recently completed builds (not failed)
  const activeBuilds = builds.filter(b => b.phase !== 'failed' && (b.phase !== 'complete' || b.id === activeBuildId));

  if (activeBuilds.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-secondary text-sm">
        No active builds. Start one from the New tab.
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="w-1/3 border-r border-white/10 overflow-y-auto p-3">
        {activeBuilds.map(build => (
          <div
            key={build.id}
            className="p-3 rounded-lg border border-white/10 bg-white/5 mb-2"
          >
            <div className="text-sm font-medium text-primary">{build.appId}</div>
            <div className="text-xs text-secondary mt-1">{build.phase}</div>
            <div className="text-xs text-accent mt-1">
              {build.progress.completed}/{build.progress.total} stories
            </div>
          </div>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {activeBuilds[0] && <ProgressPanel build={activeBuilds[0]} />}
      </div>
    </div>
  );
}

function EditView() {
  const { builds, selectedAppId, contextFiles, loadContext } = useBuilderStore();
  const [selectedApp, setSelectedApp] = useState<string | null>(selectedAppId);
  const completedBuilds = builds.filter(b => b.phase === 'complete');

  // Sync with store's selectedAppId (e.g., when navigating from History → Edit)
  useEffect(() => {
    if (selectedAppId && selectedAppId !== selectedApp) {
      setSelectedApp(selectedAppId);
      loadContext(selectedAppId);
    }
  }, [selectedAppId]);

  const handleSelectApp = useCallback((appId: string) => {
    setSelectedApp(appId);
    loadContext(appId);
  }, [loadContext]);

  const handleUploadFile = useCallback(async (file: File) => {
    if (!selectedApp) return;
    const formData = new FormData();
    formData.append('file', file);
    await fetch(`/api/builder/context/${selectedApp}/upload`, {
      method: 'POST',
      body: formData,
    });
    loadContext(selectedApp);
  }, [selectedApp, loadContext]);

  const handleRemoveFile = useCallback(async (fileName: string) => {
    if (!selectedApp) return;
    await fetch(`/api/builder/context/${selectedApp}/${fileName}`, {
      method: 'DELETE',
    });
    loadContext(selectedApp);
  }, [selectedApp, loadContext]);

  if (completedBuilds.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-secondary text-sm">
        No completed builds to edit. Build an app first.
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Left: App list + detail */}
      <div className="w-1/3 border-r border-white/10 overflow-y-auto p-3 space-y-3">
        {/* App selector */}
        <div className="space-y-1">
          {completedBuilds.map(build => (
            <button
              key={build.id}
              onClick={() => handleSelectApp(build.appId)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                selectedApp === build.appId
                  ? 'bg-accent/10 border-accent/30'
                  : 'bg-white/5 border-white/10 hover:bg-white/8'
              }`}
            >
              <div className="text-xs font-medium text-primary">{build.appId}</div>
              <div className="text-xs text-secondary/80 mt-0.5 truncate">{build.description}</div>
            </button>
          ))}
        </div>

        {/* App detail + drop zone */}
        {selectedApp && (
          <>
            <AppDetail
              appId={selectedApp}
              files={[]}
              skills={[]}
              resources={[]}
              lastBuilt={completedBuilds.find(b => b.appId === selectedApp)?.updatedAt}
            />
            <DropZone
              appId={selectedApp}
              files={contextFiles}
              onUpload={handleUploadFile}
              onRemove={handleRemoveFile}
            />
          </>
        )}
      </div>

      {/* Right: Editor + RAG */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedApp ? (
          <>
            <div className="flex-1 overflow-hidden">
              <AppEditor appId={selectedApp} />
            </div>
            <div className="h-64 border-t border-white/10 overflow-y-auto p-3">
              <RAGBrowser
                appId={selectedApp}
                storeName={`builder-${selectedApp}`}
              />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-secondary text-sm">
            Select an app from the list to edit.
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryView() {
  return (
    <div className="p-4 overflow-y-auto h-full">
      <BuildHistory />
    </div>
  );
}
