/**
 * App Panel
 *
 * Generic panel renderer that dynamically loads and renders app components
 * based on their manifest window configuration. Replaces the hardcoded
 * per-app rendering blocks in LiquidOSLayout.tsx.
 */

import React, { Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { GlassWindow } from '@/components/containers/GlassWindow';
import { useAppStoreStore } from './appStoreStore';
import { useAppComponent } from './AppLoader';
import type { InstalledApp } from './types';

// ============================================================================
// Loading Fallback
// ============================================================================

function AppLoadingFallback() {
  return (
    <div className="flex items-center justify-center w-full h-full min-h-[200px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
        <span className="text-sm text-white/50">Loading app...</span>
      </div>
    </div>
  );
}

// ============================================================================
// App Error Boundary
// ============================================================================

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class AppErrorBoundary extends React.Component<
  { appId: string; children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { appId: string; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center w-full h-full min-h-[200px] p-8">
          <div className="flex flex-col items-center gap-4 text-center max-w-md">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <span className="text-red-400 text-xl">!</span>
            </div>
            <h3 className="text-lg font-medium text-white/90">App Error</h3>
            <p className="text-sm text-white/50">
              {this.props.appId} encountered an error and could not load.
            </p>
            <pre className="text-xs text-red-300/70 bg-black/30 rounded p-3 w-full overflow-auto max-h-32">
              {this.state.error?.message}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// Panel Renderers
// ============================================================================

interface AppContentProps {
  app: InstalledApp;
  AppComponent: React.LazyExoticComponent<React.ComponentType<any>>;
}

/** Fullscreen panel overlay (replaces SparklesApp / IBirdApp direct rendering) */
function FullscreenPanel({ app, AppComponent }: AppContentProps) {
  return (
    <motion.div
      key={app.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed inset-0 z-40"
    >
      <AppErrorBoundary appId={app.id}>
        <Suspense fallback={<AppLoadingFallback />}>
          <AppComponent />
        </Suspense>
      </AppErrorBoundary>
    </motion.div>
  );
}

/** Windowed panel (GlassWindow container - replaces per-app GlassWindow blocks) */
function WindowedPanel({ app, AppComponent }: AppContentProps) {
  const closeApp = useAppStoreStore((s) => s.closeApp);
  const windowConfig = app.manifest.window;

  return (
    <motion.div
      key={app.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <GlassWindow
        id={`${app.id}-window`}
        title={windowConfig.title}
        initialSize={windowConfig.defaultSize ?? { width: 900, height: 600 }}
        initialPosition={windowConfig.defaultPosition ?? { x: 120, y: 80 }}
        onClose={closeApp}
        isActive={true}
      >
        <AppErrorBoundary appId={app.id}>
          <Suspense fallback={<AppLoadingFallback />}>
            <AppComponent />
          </Suspense>
        </AppErrorBoundary>
      </GlassWindow>
    </motion.div>
  );
}

/** Standard panel overlay (default mode) */
function StandardPanel({ app, AppComponent }: AppContentProps) {
  return (
    <motion.div
      key={app.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed inset-0 z-40 overflow-auto"
    >
      <AppErrorBoundary appId={app.id}>
        <Suspense fallback={<AppLoadingFallback />}>
          <AppComponent />
        </Suspense>
      </AppErrorBoundary>
    </motion.div>
  );
}

// ============================================================================
// Main AppPanel Component
// ============================================================================

export function AppPanel() {
  const activeAppId = useAppStoreStore((s) => s.activeAppId);
  const installedApps = useAppStoreStore((s) => s.installedApps);

  const activeApp = activeAppId ? installedApps[activeAppId] : null;
  const AppComponent = useAppComponent(activeAppId);

  return (
    <AnimatePresence mode="wait">
      {activeApp && AppComponent && (
        (() => {
          const mode = activeApp.manifest.window.mode;
          const props = { app: activeApp, AppComponent };

          switch (mode) {
            case 'fullscreen':
              return <FullscreenPanel {...props} />;
            case 'floating':
              return <WindowedPanel {...props} />;
            case 'panel':
            default:
              return <StandardPanel {...props} />;
          }
        })()
      )}
    </AnimatePresence>
  );
}
