/**
 * Quick App Renderer
 *
 * Renders a compiled Quick App component with error boundary
 * and loading state handling.
 */

import React, { Suspense, useState, useEffect } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useQuickAppStore } from './quickAppStore';
import { GlassButton, GlassContainer } from '@/components';

// ============================================================
// Types
// ============================================================

interface QuickAppRendererProps {
  appId: string;
  className?: string;
}

// ============================================================
// Error Boundary
// ============================================================

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class QuickAppErrorBoundary extends React.Component<
  { children: React.ReactNode; appId: string; onReset: () => void },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; appId: string; onReset: () => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Quick App "${this.props.appId}" crashed:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <GlassContainer className="h-full flex flex-col items-center justify-center gap-4 p-6">
          <AlertTriangle size={48} className="text-red-400" />
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white">Quick App Error</h3>
            <p className="text-sm text-white/60 mt-1">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
          </div>
          <GlassButton
            onClick={() => {
              this.setState({ hasError: false, error: null });
              this.props.onReset();
            }}
          >
            Reload App
          </GlassButton>
        </GlassContainer>
      );
    }

    return this.props.children;
  }
}

// ============================================================
// Loading Component
// ============================================================

function QuickAppLoading() {
  return (
    <GlassContainer className="h-full flex flex-col items-center justify-center gap-3">
      <Loader2 size={32} className="text-white/60 animate-spin" />
      <p className="text-sm text-white/40">Loading Quick App...</p>
    </GlassContainer>
  );
}

// ============================================================
// Main Renderer
// ============================================================

export function QuickAppRenderer({ appId, className }: QuickAppRendererProps) {
  const [Component, setComponent] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState(0);

  const { getComponent, installations } = useQuickAppStore();

  useEffect(() => {
    let mounted = true;

    async function loadComponent() {
      try {
        const comp = await getComponent(appId);
        if (mounted) {
          setComponent(() => comp);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError((err as Error).message);
        }
      }
    }

    loadComponent();

    return () => {
      mounted = false;
    };
  }, [appId, getComponent]);

  const handleReset = () => {
    setKey((k) => k + 1);
  };

  // Error state
  if (error) {
    return (
      <GlassContainer className={`h-full flex flex-col items-center justify-center gap-4 p-6 ${className}`}>
        <AlertTriangle size={48} className="text-red-400" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white">Failed to Load</h3>
          <p className="text-sm text-white/60 mt-1">{error}</p>
        </div>
      </GlassContainer>
    );
  }

  // Loading state
  if (!Component) {
    return <QuickAppLoading />;
  }

  // Get custom styles if any
  const installation = installations[appId];
  const customStyles = installation?.compiled.parsed.stylesCode;

  return (
    <QuickAppErrorBoundary appId={appId} onReset={handleReset} key={key}>
      {customStyles && (
        <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      )}
      <Suspense fallback={<QuickAppLoading />}>
        <div className={`h-full ${className || ''}`}>
          <Component />
        </div>
      </Suspense>
    </QuickAppErrorBoundary>
  );
}

// ============================================================
// Hook for checking if an app is a Quick App
// ============================================================

export function useIsQuickApp(appId: string): boolean {
  const { isQuickApp } = useQuickAppStore();
  return isQuickApp(appId);
}
