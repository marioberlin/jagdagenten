/**
 * Quick App Dev Mode Indicator
 *
 * Shows a development mode indicator for Quick Apps
 * being developed with the CLI dev server.
 */

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Zap, CheckCircle, AlertTriangle } from 'lucide-react';
import { connectToDevServer, hotReloadQuickApp } from './quickAppStore';

interface QuickAppDevIndicatorProps {
  appId: string;
  devServerUrl: string;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reloading';

export function QuickAppDevIndicator({ appId, devServerUrl }: QuickAppDevIndicatorProps) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [reloadCount, setReloadCount] = useState(0);

  const handleReload = useCallback(async () => {
    setStatus('reloading');

    try {
      // Fetch the updated app.md
      const response = await fetch(`${devServerUrl}/app.md`);
      const newMarkdown = await response.text();

      // Hot reload the app
      await hotReloadQuickApp(appId, newMarkdown);

      setReloadCount((c) => c + 1);
      setStatus('connected');
    } catch (err) {
      console.error('[Quick App Dev] Reload failed:', err);
      setStatus('connected');
    }
  }, [appId, devServerUrl]);

  useEffect(() => {
    const cleanup = connectToDevServer(devServerUrl, () => {
      handleReload();
    });

    // Initial connection established
    setStatus('connected');

    return cleanup;
  }, [devServerUrl, handleReload]);

  const statusColors = {
    connecting: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    connected: 'bg-green-500/20 text-green-400 border-green-500/30',
    disconnected: 'bg-red-500/20 text-red-400 border-red-500/30',
    reloading: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };

  const StatusIcon = {
    connecting: RefreshCw,
    connected: CheckCircle,
    disconnected: AlertTriangle,
    reloading: RefreshCw,
  }[status];

  return (
    <div
      className={`fixed top-2 right-2 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${statusColors[status]}`}
    >
      <Zap size={12} />
      <span>Dev Mode</span>
      <StatusIcon
        size={12}
        className={status === 'reloading' || status === 'connecting' ? 'animate-spin' : ''}
      />
      {reloadCount > 0 && (
        <span className="opacity-60">#{reloadCount}</span>
      )}
    </div>
  );
}

/**
 * Hook to check if we're in Quick App dev mode.
 * Returns the dev server URL if running in dev mode.
 */
export function useQuickAppDevMode(): string | null {
  const [devUrl, setDevUrl] = useState<string | null>(null);

  useEffect(() => {
    // Check URL parameters for dev mode
    const params = new URLSearchParams(window.location.search);
    const devServer = params.get('qa-dev');

    if (devServer) {
      setDevUrl(devServer);
    }

    // Also check localStorage for persistent dev mode
    const savedDevUrl = localStorage.getItem('quick-app-dev-server');
    if (savedDevUrl) {
      setDevUrl(savedDevUrl);
    }
  }, []);

  return devUrl;
}
