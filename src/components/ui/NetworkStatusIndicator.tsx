/**
 * NetworkStatusIndicator
 *
 * Shows online/offline status and pending sync count in the UI.
 */

import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useOfflineStore } from '@/stores/offlineStore';

export default function NetworkStatusIndicator() {
    const { isOnline, pendingSyncCount, syncInProgress, processQueue } = useOfflineStore();

    if (isOnline && pendingSyncCount === 0) {
        // Fully online and synced - don't show anything
        return null;
    }

    return (
        <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)]">
            {isOnline ? (
                <Wifi size={14} className="text-green-500" />
            ) : (
                <WifiOff size={14} className="text-red-500" />
            )}

            {!isOnline && (
                <span className="text-xs font-medium text-red-400">Offline</span>
            )}

            {pendingSyncCount > 0 && (
                <button
                    onClick={() => processQueue()}
                    disabled={syncInProgress || !isOnline}
                    className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50"
                    title={`${pendingSyncCount} ausstehende Synchronisierungen`}
                >
                    <RefreshCw
                        size={12}
                        className={syncInProgress ? 'animate-spin' : ''}
                    />
                    <span className="font-medium">{pendingSyncCount}</span>
                </button>
            )}
        </div>
    );
}
