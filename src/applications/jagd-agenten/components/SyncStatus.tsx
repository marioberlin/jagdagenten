/**
 * SyncStatus
 *
 * Visual indicator showing offline/online status and pending sync count.
 * Displays in cockpit to inform hunters of connectivity state.
 */

import { useOfflineStore } from '@/stores/offlineStore';
import {
    Cloud,
    CloudOff,
    RefreshCw,
    CheckCircle,
    AlertCircle,
} from 'lucide-react';

export function SyncStatus() {
    const { isOnline, pendingSyncCount, lastSyncTime, syncInProgress, processQueue } =
        useOfflineStore();

    // Format last sync time
    const formatLastSync = (iso: string | null): string => {
        if (!iso) return 'Nie';
        const diff = Date.now() - new Date(iso).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Gerade eben';
        if (mins < 60) return `vor ${mins} Min.`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `vor ${hours} Std.`;
        return new Date(iso).toLocaleDateString('de-DE');
    };

    return (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)]">
            {/* Status Icon */}
            <div
                className={`
                    w-10 h-10 rounded-full flex items-center justify-center shrink-0
                    ${isOnline ? 'bg-green-500/20' : 'bg-orange-500/20'}
                `}
            >
                {isOnline ? (
                    <Cloud size={20} className="text-green-400" />
                ) : (
                    <CloudOff size={20} className="text-orange-400" />
                )}
            </div>

            {/* Status Info */}
            <div className="flex-1 min-w-0">
                <p className="font-medium text-[var(--text-primary)]">
                    {isOnline ? 'Online' : 'Offline'}
                </p>
                <p className="text-xs text-[var(--text-secondary)] truncate">
                    {isOnline
                        ? `Letzte Sync: ${formatLastSync(lastSyncTime)}`
                        : 'Daten werden lokal gespeichert'}
                </p>
            </div>

            {/* Pending Sync Badge */}
            {pendingSyncCount > 0 && (
                <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-medium">
                        <AlertCircle size={12} />
                        {pendingSyncCount}
                    </div>
                    {isOnline && !syncInProgress && (
                        <button
                            onClick={() => processQueue()}
                            className="p-1.5 rounded-lg hover:bg-[var(--glass-surface-hover)] text-[var(--text-secondary)] transition-colors"
                            title="Jetzt synchronisieren"
                        >
                            <RefreshCw size={16} />
                        </button>
                    )}
                </div>
            )}

            {/* Sync in Progress */}
            {syncInProgress && (
                <div className="flex items-center gap-1 text-blue-400">
                    <RefreshCw size={16} className="animate-spin" />
                    <span className="text-xs">Sync...</span>
                </div>
            )}

            {/* All Synced */}
            {isOnline && pendingSyncCount === 0 && !syncInProgress && (
                <CheckCircle size={18} className="text-green-400 shrink-0" />
            )}
        </div>
    );
}

/**
 * Compact inline sync indicator for header bars
 */
export function SyncStatusCompact() {
    const { isOnline, pendingSyncCount, syncInProgress } = useOfflineStore();

    if (isOnline && pendingSyncCount === 0 && !syncInProgress) {
        return null; // Don't show when all is good
    }

    return (
        <div className="flex items-center gap-1.5">
            {!isOnline && (
                <CloudOff size={14} className="text-orange-400" />
            )}
            {syncInProgress && (
                <RefreshCw size={14} className="text-blue-400 animate-spin" />
            )}
            {isOnline && pendingSyncCount > 0 && !syncInProgress && (
                <div className="flex items-center gap-0.5 text-xs text-orange-400">
                    <AlertCircle size={12} />
                    {pendingSyncCount}
                </div>
            )}
        </div>
    );
}

export default SyncStatus;
